const fs = require('fs');
let code = fs.readFileSync('src/services/chatService.ts', 'utf8');

const target = `                  if (targetUrl) {
                    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                    if (webhookSecret) {
                      headers['X-Webhook-Secret'] = webhookSecret;
                    }

                    const webhookResp = await fetch(targetUrl, {
                      method: 'POST',
                      headers,
                      body: JSON.stringify({
                        event: args.event_name,
                        payload: args.payload,
                        botId: bot.id,
                        conversationId: conversation.id,
                        timestamp: new Date().toISOString(),
                      }),
                    });
                    if (!webhookResp.ok) {
                      telemetry.logWebhookFailure(
                        \`External webhook returned HTTP \${webhookResp.status}: \${webhookResp.statusText}\`,
                        {
                          url: targetUrl,
                          eventName: args.event_name,
                          statusCode: webhookResp.status,
                          payload: args.payload,
                        }
                      );
                    }
                  } else {`;

const replacement = `                  if (targetUrl) {
                    const { JobService } = await import('./jobService');
                    await JobService.enqueue({
                      tenantId: bot.tenantId,
                      type: 'call_webhook',
                      payload: {
                        webhook: {
                          url: targetUrl,
                          secret: webhookSecret,
                        },
                        event: args.event_name,
                        payload: args.payload,
                        botId: bot.id,
                        conversationId: conversation.id,
                      },
                      maxAttempts: 3
                    });
                  } else {`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/services/chatService.ts', code);
  console.log("Success");
} else {
  console.log("Target not found");
}
