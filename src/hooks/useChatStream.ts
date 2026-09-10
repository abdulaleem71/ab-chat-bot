import { useState, useRef, useCallback } from 'react';
import { Message, GroundingSource } from '../types';

export interface StreamState {
  isStreaming: boolean;
  activeSources: GroundingSource[];
  error: string | null;
}

export function useChatStream() {
  const [state, setState] = useState<StreamState>({
    isStreaming: false,
    activeSources: [],
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setState((prev) => ({ ...prev, isStreaming: false }));
    }
  }, []);

  const streamMessage = useCallback(
    async ({
      botId,
      message,
      conversationId,
      history,
      onToken,
      onComplete,
    }: {
      botId: string;
      message: string;
      conversationId?: string;
      history: Message[];
      onToken: (token: string) => void;
      onComplete: (convId: string, sources: GroundingSource[]) => void;
    }) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setState({ isStreaming: true, activeSources: [], error: null });

      let currentConvId = conversationId || '';
      let collectedSources: GroundingSource[] = [];

      try {
        const response = await fetch(`/api/chatbots/${botId}/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            conversationId,
            conversationHistory: history,
          }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          let currentEvent = 'message';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            if (trimmed.startsWith('event:')) {
              currentEvent = trimmed.replace('event:', '').trim();
            } else if (trimmed.startsWith('data:')) {
              const dataStr = trimmed.replace('data:', '').trim();
              if (dataStr === '{}' || !dataStr) continue;

              try {
                const parsed = JSON.parse(dataStr);

                if (currentEvent === 'metadata') {
                  currentConvId = parsed.conversationId || currentConvId;
                  collectedSources = parsed.sourcesUsed || [];
                  setState((prev) => ({ ...prev, activeSources: collectedSources }));
                } else if (currentEvent === 'token') {
                  onToken(parsed.token || '');
                } else if (currentEvent === 'error') {
                  throw new Error(parsed.error || 'Generation error occurred');
                }
              } catch (e) {
                console.error('Error parsing SSE event data:', e);
              }
            }
          }
        }

        onComplete(currentConvId, collectedSources);
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log('User halted generation.');
        } else {
          setState((prev) => ({ ...prev, error: err.message || 'Stream connection failed' }));
        }
      } finally {
        setState((prev) => ({ ...prev, isStreaming: false }));
        abortControllerRef.current = null;
      }
    },
    []
  );

  return {
    ...state,
    streamMessage,
    stopStreaming,
  };
}
