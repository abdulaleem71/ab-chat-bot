import { GroundingSource } from '../types';

export interface ChatStreamOptions {
  onMetadata?: (meta: { conversationId: string; sourcesUsed: GroundingSource[] }) => void;
  onDelta?: (chunk: string) => void;
  onDone?: (result: {
    reply: string;
    conversationId: string;
    sourcesUsed?: GroundingSource[];
    toolsInvoked?: string[];
  }) => void;
  onError?: (error: Error) => void;
  signal?: AbortSignal;
}

export interface ChatStreamPayload {
  message: string;
  conversationId?: string;
  visitorInfo?: any;
  isPlayground?: boolean;
  isTest?: boolean;
}

export async function streamChatResponse(
  botId: string,
  payload: ChatStreamPayload,
  options: ChatStreamOptions
): Promise<void> {
  const { onMetadata, onDelta, onDone, onError, signal } = options;
  let accumulatedReply = '';
  let metadataReceived: { conversationId: string; sourcesUsed: GroundingSource[] } = {
    conversationId: payload.conversationId || '',
    sourcesUsed: [],
  };

  try {
    const res = await fetch(`/api/chatbots/${botId}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream, application/json',
      },
      body: JSON.stringify({
        ...payload,
        stream: true,
      }),
      signal,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errorMsg =
        errData.error ||
        (res.status === 403
          ? 'Domain Unauthorized: This chatbot embed is locked to authorized domains.'
          : `Server returned HTTP ${res.status}`);
      const err = new Error(errorMsg);
      onError?.(err);
      return;
    }

    const contentType = res.headers.get('content-type') || '';

    // Handle Server-Sent Events (SSE) streaming
    if (contentType.includes('text/event-stream') && res.body) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        if (signal?.aborted) {
          reader.cancel().catch(() => {});
          break;
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split(/\r?\n\r?\n/);
        // The last element is incomplete buffer
        buffer = blocks.pop() || '';

        for (const block of blocks) {
          if (!block.trim()) continue;

          let eventName = 'message';
          let dataStr = '';

          const lines = block.split(/\r?\n/);
          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventName = line.replace('event:', '').trim();
            } else if (line.startsWith('data:')) {
              const content = line.replace('data:', '').trim();
              dataStr = content;
            }
          }

          if (!dataStr) continue;

          try {
            const parsedData = JSON.parse(dataStr);

            if (eventName === 'metadata') {
              metadataReceived = {
                conversationId: parsedData.conversationId || metadataReceived.conversationId,
                sourcesUsed: parsedData.sourcesUsed || [],
              };
              onMetadata?.(metadataReceived);
            } else if (eventName === 'delta') {
              if (parsedData.text) {
                accumulatedReply += parsedData.text;
                onDelta?.(parsedData.text);
              }
            } else if (eventName === 'done') {
              const finalReply = parsedData.reply || accumulatedReply;
              onDone?.({
                reply: finalReply,
                conversationId: parsedData.conversationId || metadataReceived.conversationId,
                sourcesUsed: parsedData.sourcesUsed || metadataReceived.sourcesUsed,
                toolsInvoked: parsedData.toolsInvoked,
              });
              return;
            } else if (eventName === 'error') {
              onError?.(new Error(parsedData.error || 'Chat generation error'));
              return;
            }
          } catch {
            // If raw text or non-json event
            if (eventName === 'delta') {
              accumulatedReply += dataStr;
              onDelta?.(dataStr);
            }
          }
        }
      }

      // If finished stream without explicit 'done' event or cancelled
      onDone?.({
        reply: accumulatedReply,
        conversationId: metadataReceived.conversationId,
        sourcesUsed: metadataReceived.sourcesUsed,
      });
      return;
    }

    // Fallback if server returned standard JSON
    const data = await res.json();
    onMetadata?.({
      conversationId: data.conversationId || '',
      sourcesUsed: data.sourcesUsed || [],
    });
    if (data.reply) {
      onDelta?.(data.reply);
    }
    onDone?.({
      reply: data.reply || '',
      conversationId: data.conversationId || '',
      sourcesUsed: data.sourcesUsed,
      toolsInvoked: data.toolsInvoked,
    });
  } catch (err: any) {
    if (err.name === 'AbortError' || signal?.aborted) {
      // User aborted stream (Stop Generating)
      onDone?.({
        reply: accumulatedReply,
        conversationId: metadataReceived.conversationId,
        sourcesUsed: metadataReceived.sourcesUsed,
      });
      return;
    }
    onError?.(err instanceof Error ? err : new Error(String(err)));
  }
}
