import { GoogleGenAI } from '@google/genai';
import { ChatbotRepo } from '../repositories/chatbotRepo';
import { ConversationRepo } from '../repositories/conversationRepo';
import { RagService } from './ragService';
import { newId } from '../lib/ids';
import { Conversation, Message, GroundingSource } from '../types';

let aiClient: GoogleGenAI | null = null;
function getGeminiAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
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

    // 4. Perform RAG Search over Knowledge Base Chunks (and auto-fetch if knowledge was empty)
    const { groundingContext, sourcesUsed } = await RagService.retrieveRelevantContext(
      bot.id,
      userMessage,
      bot.websiteUrl,
      bot.tenantId
    );

    // 5. Construct Grounded Gemini Prompt
    const customInstructions = bot.systemInstruction?.trim() || 'Provide helpful, friendly, and accurate customer support.';
    const botContext = [
      `Assistant Name: ${bot.name}`,
      `Tone of Voice: ${bot.tone || 'Friendly and professional'}`,
      bot.description ? `Business Overview / Description: ${bot.description}` : '',
      bot.websiteUrl ? `Official Website: ${bot.websiteUrl}` : '',
      `Custom Instructions from Creator: ${customInstructions}`,
    ].filter(Boolean).join('\n');

    const systemInstruction = `
You are ${bot.name}, the official AI customer assistant representing this website and business.

=== VERIFIED WEBSITE KNOWLEDGE BASE ===
<knowledge_base>
${groundingContext}
</knowledge_base>

=== BOT PROFILE & GUIDELINES ===
${botContext}

=== CRITICAL OPERATING INSTRUCTIONS ===
1. Answer Directly from Knowledge Base: Whenever the user asks questions about services, capabilities, products, technologies, features, installation, pricing, or policies (for example, "Do you offer Shopify development?"), thoroughly review <knowledge_base>. If the requested topic or service is mentioned, answer affirmatively and provide the details from the knowledge base.
2. Grounded Truth: Prioritize facts in <knowledge_base> over general knowledge. If specific steps, commands, or bullet points are present, format them clearly using Markdown.
3. Helpful & Conversational: Handle greetings (e.g. "hi", "hello") politely. Introduce yourself as ${bot.name} and summarize the core services or topics you can help with based on the website knowledge.
4. Fallback Restriction: Do NOT use the fallback message if relevant content exists in <knowledge_base>. Only when the question is completely unrelated or missing from the website content should you offer: "${bot.fallbackMessage}".
    `.trim();

    // 6. Fetch Recent Message History from DB
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
        let modelToUse = bot.model || 'gemini-3.7-flash';
        if (modelToUse !== 'gemini-3.7-flash' && modelToUse !== 'gemini-3.1-pro-preview') {
          modelToUse = 'gemini-3.7-flash';
        }

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Gemini request timed out')), 15000)
        );

        const genPromise = ai.models.generateContent({
          model: modelToUse,
          contents: chatContents,
          config: {
            systemInstruction,
            temperature: 0.2,
            maxOutputTokens: 1200,
          },
        });

        const res = (await Promise.race([genPromise, timeoutPromise])) as any;
        if (res && res.text && res.text.trim().length > 0) {
          replyText = res.text.trim();
        } else {
          replyText = this.synthesizeDirectAnswerFromGrounding(userMessage, groundingContext, bot);
        }
      } catch (err: any) {
        console.error('Gemini Generation Error:', err.message || err);
        replyText = this.synthesizeDirectAnswerFromGrounding(userMessage, groundingContext, bot);
      }
    } else {
      replyText = this.synthesizeDirectAnswerFromGrounding(userMessage, groundingContext, bot);
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

  /**
   * Deterministic Grounded Knowledge Extractor Fallback
   * Synthesizes direct, factual answers from indexed knowledge base chunks if Gemini API is temporarily offline or times out.
   */
  private static synthesizeDirectAnswerFromGrounding(
    userQuery: string,
    groundingContext: string,
    bot: any
  ): string {
    if (!groundingContext || groundingContext.includes('No indexed knowledge sources available') || groundingContext.includes('No relevant knowledge sources matched')) {
      return bot.fallbackMessage || "I don't have information on that topic yet. Let me connect you with our team.";
    }

    const cleanContext = groundingContext.replace(/\[SOURCE: [^\]]+\]/g, '').trim();
    const queryTokens = userQuery.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(t => t.length > 2);

    // Split knowledge into individual sentences/paragraphs
    const sentences = cleanContext.split(/(?<=[.!?\n])\s+/).map(s => s.trim()).filter(s => s.length > 10);

    // Score sentences based on matching query keywords
    const scored = sentences.map(sentence => {
      const lowerSentence = sentence.toLowerCase();
      let matchCount = 0;
      queryTokens.forEach(t => {
        if (lowerSentence.includes(t)) matchCount++;
      });
      return { sentence, matchCount };
    });

    const relevant = scored.filter(s => s.matchCount > 0).sort((a, b) => b.matchCount - a.matchCount);

    if (relevant.length > 0) {
      const topSentences = relevant.slice(0, 3).map(r => r.sentence).join(' ');
      return `Based on our website:\n\n${topSentences}`;
    }

    // If query is general or greeting
    const isGreeting = ['hi', 'hello', 'hey', 'help'].some(g => userQuery.toLowerCase().includes(g));
    if (isGreeting) {
      const firstChunkSnippet = sentences.slice(0, 2).join(' ');
      return `Hello! I am ${bot.name}. Based on our website, ${firstChunkSnippet ? firstChunkSnippet : 'how can I assist you with our services today?'}`;
    }

    // Return the primary overview if available
    const overviewSnippet = sentences.slice(0, 3).join(' ');
    if (overviewSnippet.length > 0) {
      return `Here is what I found on our website:\n\n${overviewSnippet}`;
    }

    return bot.fallbackMessage || "I don't have information on that specific detail yet.";
  }
}
