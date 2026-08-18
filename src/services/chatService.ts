import { GoogleGenAI } from '@google/genai';
import { ChatbotRepo } from '../repositories/chatbotRepo';
import { ConversationRepo } from '../repositories/conversationRepo';
import { RagService } from './ragService';
import { newId } from '../lib/ids';
import { Conversation, Message, GroundingSource } from '../types';

let aiClient: GoogleGenAI | null = null;
function getGeminiAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

export class ChatService {
  static async handleVisitorChat(
    botId: string,
    userMessage: string,
    existingConversationId?: string,
    visitorInfo?: {
      visitorId?: string;
      name?: string;
      email?: string;
      location?: string;
      browser?: string;
      pageUrl?: string;
    }
  ): Promise<{
    reply: string;
    conversationId: string;
    sourcesUsed: GroundingSource[];
  }> {
    // 1. Fetch Chatbot from Persistent DB
    const bot = await ChatbotRepo.findById(botId);
    if (!bot) {
      throw new Error('Chatbot not found or inactive');
    }

    const now = new Date().toISOString();

    // 2. Resolve or Create Persistent Conversation in DB
    let conversation: Conversation | null = null;
    if (existingConversationId) {
      conversation = await ConversationRepo.findById(existingConversationId);
      // A conversation must belong to this chatbot; otherwise treat it as a fresh session.
      if (conversation && conversation.chatbotId !== bot.id) {
        conversation = null;
      }
    }

    if (!conversation) {
      // Always mint a fresh id: a client-supplied conversationId may collide with
      // an existing row (e.g. it belongs to a different bot or was deleted).
      conversation = await ConversationRepo.create({
        id: newId('conv'),
        chatbotId: bot.id,
        tenantId: bot.tenantId,
        visitorId: visitorInfo?.visitorId || 'vis_' + Date.now(),
        visitorName: visitorInfo?.name?.trim() || 'Website Visitor',
        visitorEmail: visitorInfo?.email?.trim() || '',
        visitorLocation: visitorInfo?.location?.trim() || 'Direct Web Session',
        visitorBrowser: visitorInfo?.browser?.trim() || 'Web Browser',
        pageUrl: visitorInfo?.pageUrl?.trim() || '',
        status: 'active',
        lastMessage: userMessage,
        lastMessageTime: now,
        unreadByAgent: true,
        createdAt: now,
      });
    } else if (visitorInfo) {
      // Dynamically update conversation with visitor info if newly provided
      await ConversationRepo.updateVisitorInfo(conversation.id, {
        visitorName: visitorInfo.name,
        visitorEmail: visitorInfo.email,
        visitorLocation: visitorInfo.location,
        visitorBrowser: visitorInfo.browser,
        pageUrl: visitorInfo.pageUrl,
      });
    }

    // 3. Save Visitor Message in DB
    const userMsgRecord: Message = {
      id: newId('msg_u'),
      conversationId: conversation.id,
      chatbotId: bot.id,
      sender: 'visitor',
      content: userMessage,
      timestamp: now,
    };
    await ConversationRepo.addMessage(userMsgRecord, bot.tenantId);

    // 4. Perform RAG Search over Knowledge Base Chunks
    const { groundingContext, sourcesUsed } = await RagService.retrieveRelevantContext(bot.id, userMessage);

    // 5. Construct Grounded Gemini Prompt
    const customInstructions = bot.systemInstruction?.trim() || 'Provide helpful, friendly, and accurate customer support.';
    const botContext = [
      `Assistant Name: ${bot.name}`,
      `Tone of Voice: ${bot.tone || 'Friendly and professional'}`,
      bot.description ? `Business Overview / Description: ${bot.description}` : '',
      bot.websiteUrl ? `Official Website: ${bot.websiteUrl}` : '',
      `Custom Instructions from Creator: ${customInstructions}`,
      `Fallback / Escalation Guidance: ${bot.fallbackMessage || "I do not have information on that yet. Let me connect you with our support team."}`,
    ].filter(Boolean).join('\n');

    const systemInstruction = `
You are ${bot.name}, an intelligent and helpful AI customer assistant for this website.

=== BOT PROFILE & GUIDELINES ===
${botContext}

=== VERIFIED KNOWLEDGE BASE REFERENCE ===
<knowledge_base>
${groundingContext}
</knowledge_base>

=== OPERATING INSTRUCTIONS ===
1. Primary Source of Truth: When answering factual or product-specific questions, prioritize verified facts from the <knowledge_base>.
2. Custom Instructions: Follow the creator's Custom Instructions and Tone above for business identity, hours, contact information, and policies.
3. Natural Conversation: Handle greetings, general inquiries, and requests for assistance politely and conversationally.
4. Unknown Information: If the user asks for specific technical or account information that is not mentioned in either the Knowledge Base or Bot Profile, do not fabricate false facts; politely explain what you know and suggest the fallback message: "${bot.fallbackMessage}".
5. Formatting: Use concise paragraphs, bullet points, and markdown for readability.
    `.trim();

    // 6. Fetch Recent Message History from DB (Fix Duplicate Message bug)
    const dbMessages = await ConversationRepo.findMessagesByConversation(conversation.id);

    // Exclude the message we just saved above from history payload so it is not sent twice
    const historyWithoutLast = dbMessages.slice(0, -1);
    const validHistory = historyWithoutLast.slice(-10);

    const chatContents = validHistory.map(m => ({
      role: m.sender === 'visitor' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    // Append the single current user message
    chatContents.push({
      role: 'user',
      parts: [{ text: userMessage.trim() }],
    });

    // 7. Generate Response via Gemini
    let replyText = '';
    const ai = getGeminiAI();

    if (ai) {
      try {
        let modelToUse = bot.model || 'gemini-3.6-flash';
        if (modelToUse !== 'gemini-3.6-flash' && modelToUse !== 'gemini-3.1-pro-preview') {
          modelToUse = 'gemini-3.6-flash';
        }

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Gemini request timed out')), 10000)
        );

        const genPromise = ai.models.generateContent({
          model: modelToUse,
          contents: chatContents,
          config: {
            systemInstruction,
            temperature: 0.2,
            maxOutputTokens: 1000,
          },
        });

        const res = (await Promise.race([genPromise, timeoutPromise])) as any;
        replyText = res.text || bot.fallbackMessage;
      } catch (err: any) {
        console.error('Gemini Generation Error:', err.message || err);
        replyText = bot.fallbackMessage || 'I am currently unable to process your request. Connecting you to our team.';
      }
    } else {
      replyText = `Thank you for asking about "${userMessage.slice(0, 50)}". I checked our knowledge base for ${bot.name}. Let me know if you need additional assistance!`;
    }

    // 8. Save Assistant Response in DB with Actual Citations
    const botMsgRecord: Message = {
      id: newId('msg_b'),
      conversationId: conversation.id,
      chatbotId: bot.id,
      sender: 'bot',
      content: replyText,
      sourcesUsed: sourcesUsed.length > 0 ? sourcesUsed : undefined,
      timestamp: new Date().toISOString(),
    };
    await ConversationRepo.addMessage(botMsgRecord, bot.tenantId);

    return {
      reply: replyText,
      conversationId: conversation.id,
      sourcesUsed,
    };
  }
}
