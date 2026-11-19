/**
 * Telemetry and Alerting Service for NomadsChat
 * Logs and alerts on failed Gemini API calls, webhook executions, and application errors
 * to prevent silent failures in the dashboard.
 */

import { DEFAULT_MODEL_ID } from '../config/models';

export interface TelemetryAlert {
  id: string;
  timestamp: string;
  type: 'gemini_api_failure' | 'webhook_execution_failure' | 'application_error' | 'security_anomaly';
  severity: 'error' | 'warning' | 'critical';
  title: string;
  message: string;
  details?: Record<string, any>;
  recovered?: boolean;
}

class TelemetryLogger {
  private alerts: TelemetryAlert[] = [];
  private readonly maxAlerts = 50;

  private generateId(): string {
    return 'alert_' + Math.random().toString(36).substring(2, 9);
  }

  /**
   * Dispatches a structured alert, logs it to the console with high visibility,
   * and fires a window event for UI banners or toast notifications.
   */
  public emitAlert(alertInput: Omit<TelemetryAlert, 'id' | 'timestamp'>): TelemetryAlert {
    const alert: TelemetryAlert = {
      ...alertInput,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
    };

    // Store in ring buffer
    this.alerts.unshift(alert);
    if (this.alerts.length > this.maxAlerts) {
      this.alerts.pop();
    }

    // High-visibility formatted console output
    const isBrowser = typeof window !== 'undefined';
    const tag = `[DIAGNOSTIC ALERT: ${alert.type.toUpperCase()}]`;
    const style = alert.severity === 'critical' || alert.severity === 'error'
      ? 'background: #e11d48; color: white; font-weight: bold; padding: 2px 6px; border-radius: 4px;'
      : 'background: #d97706; color: white; font-weight: bold; padding: 2px 6px; border-radius: 4px;';

    if (isBrowser) {
      console.error(`%c${tag}%c ${alert.title} - ${alert.message}`, style, 'color: inherit;', alert.details || '');
      
      // Dispatch browser custom event for toast/banner listeners
      try {
        window.dispatchEvent(new CustomEvent('nomadschat:telemetry_alert', { detail: alert }));
      } catch (e) {
        // Safe fallback in non-standard environments
      }
    } else {
      console.error(`${tag} [${alert.severity.toUpperCase()}] ${alert.title}: ${alert.message}`, alert.details || '');
    }

    return alert;
  }

  /**
   * Log a failed Gemini API call to prevent silent LLM generation issues
   */
  public logGeminiApiFailure(error: Error | string, context?: { botId?: string; model?: string; promptSnippet?: string; details?: any }): TelemetryAlert {
    const errorMessage = typeof error === 'string' ? error : error.message || 'Unknown Gemini API error';
    return this.emitAlert({
      type: 'gemini_api_failure',
      severity: 'error',
      title: 'Gemini API Call Failed',
      message: errorMessage,
      details: {
        model: context?.model || DEFAULT_MODEL_ID,
        botId: context?.botId,
        promptSnippet: context?.promptSnippet ? `${context.promptSnippet.substring(0, 120)}...` : undefined,
        ...context?.details,
      },
    });
  }

  /**
   * Log a failed external webhook execution
   */
  public logWebhookFailure(error: Error | string, context?: { url?: string; eventName?: string; payload?: any; statusCode?: number; retryCount?: number }): TelemetryAlert {
    const errorMessage = typeof error === 'string' ? error : error.message || 'Webhook invocation failed';
    return this.emitAlert({
      type: 'webhook_execution_failure',
      severity: 'error',
      title: 'External Webhook Execution Failed',
      message: errorMessage,
      details: {
        webhookUrl: context?.url,
        eventName: context?.eventName,
        statusCode: context?.statusCode,
        retryCount: context?.retryCount,
        payloadSummary: context?.payload ? Object.keys(context.payload) : undefined,
      },
    });
  }

  /**
   * Log an unexpected React / Application crash
   */
  public logApplicationError(error: Error | string, context?: any): TelemetryAlert {
    const errorMessage = typeof error === 'string' ? error : error.message || 'Application runtime exception';
    return this.emitAlert({
      type: 'application_error',
      severity: 'error',
      title: 'Dashboard Component Failure',
      message: errorMessage,
      details: {
        stack: typeof error === 'object' && error.stack ? error.stack : undefined,
        ...context,
      },
    });
  }

  /**
   * Retrieve in-memory alert history for diagnostics
   */
  public getRecentAlerts(): TelemetryAlert[] {
    return [...this.alerts];
  }

  /**
   * Clear alerts buffer
   */
  public clearAlerts(): void {
    this.alerts = [];
  }
}

export const telemetry = new TelemetryLogger();
