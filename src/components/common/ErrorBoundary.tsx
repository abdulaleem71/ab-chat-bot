import React, { Component, ReactNode, ErrorInfo, useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, X, ShieldAlert, Cpu, Webhook, ChevronRight } from 'lucide-react';
import { telemetry, TelemetryAlert } from '../../lib/telemetry';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  compact?: boolean;
  renderToaster?: boolean;
  onCatch?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to structured telemetry service to prevent silent failures
    telemetry.logApplicationError(error, {
      componentStack: errorInfo.componentStack,
    });

    if (this.props.onCatch) {
      this.props.onCatch(error, errorInfo);
    }
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback support
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback(this.state.error || new Error('Unknown error'), this.handleReset);
        }
        return this.props.fallback;
      }

      const isGeminiError =
        this.state.error?.message?.toLowerCase().includes('gemini') ||
        this.state.error?.message?.toLowerCase().includes('model');
      const isWebhookError =
        this.state.error?.message?.toLowerCase().includes('webhook');

      // Compact inline mode for panels, cards, or widget embeddings
      if (this.props.compact) {
        return (
          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 text-xs flex items-start gap-3 my-2">
            <div className="p-1.5 rounded-lg bg-white border border-rose-200 text-rose-600 shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-extrabold text-zinc-950 font-heading">
                  {this.props.fallbackTitle || 'Component Error'}
                </span>
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="text-[11px] font-bold text-zinc-900 hover:text-black underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry
                </button>
              </div>
              <p className="text-zinc-600 text-[11px] mt-0.5">
                {this.props.fallbackMessage || this.state.error?.message || 'An error prevented this component from displaying.'}
              </p>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-[280px] p-6 flex items-center justify-center">
          <div className="bg-white border border-rose-200 rounded-3xl p-8 max-w-lg w-full text-center shadow-lg space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto shadow-xs">
              {isGeminiError ? (
                <Cpu className="w-6 h-6" />
              ) : isWebhookError ? (
                <Webhook className="w-6 h-6" />
              ) : (
                <AlertCircle className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-zinc-950 font-heading">
                {this.props.fallbackTitle || (isGeminiError ? 'AI Engine Interruption' : isWebhookError ? 'Webhook Integration Fault' : 'Something went wrong')}
              </h3>
              <p className="text-xs text-zinc-600 font-medium mt-1 leading-relaxed">
                {this.props.fallbackMessage ||
                  'An isolated execution failure occurred. The diagnostic incident has been logged to telemetry.'}
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-[11px] font-mono text-zinc-700 text-left overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2 text-xs font-extrabold text-white bg-zinc-950 hover:bg-zinc-800 rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 rounded-xl transition cursor-pointer"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        {this.props.children}
        {this.props.renderToaster && <TelemetryAlertToaster />}
      </>
    );
  }
}

/**
 * HOC to easily wrap components with an ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  ComponentToWrap: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.FC<P> {
  const Wrapped: React.FC<P> = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <ComponentToWrap {...props} />
    </ErrorBoundary>
  );
  Wrapped.displayName = `WithErrorBoundary(${ComponentToWrap.displayName || ComponentToWrap.name || 'Component'})`;
  return Wrapped;
}

/**
 * Floating Diagnostic Toast Alert component that captures failed Gemini API calls
 * and webhook execution failures in real-time across the dashboard.
 */
export const TelemetryAlertToaster: React.FC = () => {
  const [activeAlerts, setActiveAlerts] = useState<TelemetryAlert[]>([]);

  useEffect(() => {
    const handleAlert = (e: Event) => {
      const customEvent = e as CustomEvent<TelemetryAlert>;
      if (customEvent.detail) {
        setActiveAlerts(prev => [customEvent.detail, ...prev.slice(0, 3)]);
      }
    };

    window.addEventListener('nomadschat:telemetry_alert', handleAlert);
    return () => {
      window.removeEventListener('nomadschat:telemetry_alert', handleAlert);
    };
  }, []);

  if (activeAlerts.length === 0) return null;

  return (
    <aside aria-label="Telemetry Alerts" className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-auto">
      {activeAlerts.map(alert => (
        <div
          key={alert.id}
          className="bg-white/95 backdrop-blur-md border border-rose-200 rounded-2xl p-4 shadow-xl text-xs flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <div className="p-2 rounded-xl bg-rose-50 text-rose-600 shrink-0 border border-rose-100">
            {alert.type === 'gemini_api_failure' ? (
              <Cpu className="w-4 h-4" />
            ) : alert.type === 'webhook_execution_failure' ? (
              <Webhook className="w-4 h-4" />
            ) : (
              <ShieldAlert className="w-4 h-4" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="font-extrabold text-zinc-950 truncate font-heading">{alert.title}</span>
              <button
                type="button"
                onClick={() => setActiveAlerts(prev => prev.filter(a => a.id !== alert.id))}
                className="text-zinc-400 hover:text-zinc-700 p-0.5 rounded-md cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-zinc-600 text-[11px] mt-0.5 line-clamp-2 leading-relaxed">
              {alert.message}
            </p>
            {alert.details && (
              <div className="mt-1.5 flex flex-wrap gap-1 text-[10px] text-zinc-500 font-mono">
                {alert.details.model && (
                  <span className="px-1.5 py-0.5 bg-zinc-100 rounded text-zinc-700">
                    {alert.details.model}
                  </span>
                )}
                {alert.details.statusCode && (
                  <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded font-bold">
                    HTTP {alert.details.statusCode}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </aside>
  );
};
