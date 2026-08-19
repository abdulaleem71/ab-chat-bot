import { GoogleGenAI } from '@google/genai';
import { ChatbotRepo } from '../repositories/chatbotRepo';
import { ConversationRepo } from '../repositories/conversationRepo';
import { RagService } from './ragService';
import { newId } from '../lib/ids';
import { Conversation, Message, GroundingSource } from '../types';

let aiClient: GoogleGenAI | null = null;
function getGeminiAI(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY || process.env.API_KEY;
    try {
      aiClient = new GoogleGenAI(
        key
          ? {
              apiKey: key,
              httpOptions: {
                headers: {
                  'User-Agent': 'aistudio-build',
                },
              },
            }
          : {
              httpOptions: {
                headers: {
                  'User-Agent': 'aistudio-build',
                },
              },
            }
      );
    } catch (err: any) {
      console.warn('[WARN] Could not initialize GoogleGenAI client:', err.message);
    }
  }
  return aiClient;
}

/**
 * Ensures Gemini multiturn chat contents strictly start with a 'user' turn
 * and alternate between 'user' and 'model' as required by the Gemini API specification.
 */
function buildGeminiContents(
  history: Array<{ sender: 'visitor' | 'bot' | 'agent'; content: string }>,
  currentUserMessage: string
): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> {
  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  const validHistory = history
    .filter(m => m.content && m.content.trim().length > 0)
    .map(m => ({
      role: m.sender === 'visitor' ? ('user' as const) : ('model' as const),
      text: m.content.trim(),
    }));

  // Gemini requires multi-turn contents to start with role 'user'.
  const firstUserIdx = validHistory.findIndex(m => m.role === 'user');
  const turnsToInclude = firstUserIdx >= 0 ? validHistory.slice(firstUserIdx) : [];

  for (const turn of turnsToInclude) {
    if (contents.length === 0) {
      if (turn.role === 'user') {
        contents.push({ role: 'user', parts: [{ text: turn.text }] });
      }
    } else {
      const last = contents[contents.length - 1];
      if (turn.role !== last.role) {
        contents.push({ role: turn.role, parts: [{ text: turn.text }] });
      } else {
        // Merge consecutive turns with same role
        last.parts[0].text += `\n\n${turn.text}`;
      }
    }
  }

  // Finally, append the current user message
  const userText = currentUserMessage.trim();
  if (contents.length === 0 || contents[contents.length - 1].role === 'model') {
    contents.push({ role: 'user', parts: [{ text: userText }] });
  } else {
    contents[contents.length - 1].parts[0].text += `\n\n${userText}`;
  }

  return contents;
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
    const { groundingContext, sourcesUsed } = await RagService.retrieveRelevantContext(
      bot.id,
      userMessage,
      bot.websiteUrl,
      bot.tenantId
    );

    // 5. Construct Grounded Gemini System Instruction
    const customInstructions = bot.systemInstruction?.trim() || 'Provide helpful, friendly, and accurate customer support.';
    const botContext = [
      `Assistant Name: ${bot.name}`,
      `Tone of Voice: ${bot.tone || 'Friendly, articulate, professional, and helpful'}`,
      bot.description ? `Business Overview / Description: ${bot.description}` : '',
      bot.websiteUrl ? `Official Website: ${bot.websiteUrl}` : '',
      `Custom Creator Instructions: ${customInstructions}`,
    ].filter(Boolean).join('\n');

    const systemInstruction = `
You are ${bot.name}, the intelligent, helpful official AI representative for this website and business.

=== VERIFIED WEBSITE KNOWLEDGE BASE ===
<knowledge_base>
${groundingContext}
</knowledge_base>

=== BOT PROFILE & GUIDELINES ===
${botContext}

=== CRITICAL OPERATING INSTRUCTIONS ===
1. UNDERSTAND AND LEARN: You have thoroughly studied the entire knowledge base above. Use this knowledge to answer visitor questions directly, naturally, and accurately.
2. SPECIFIC INQUIRIES & SERVICES:
   - When a visitor asks about services, capabilities, or technologies (e.g. "Do you offer Shopify development?", "Are you provide brand identity design?", "What tech stack do you use?"):
     - Look at all services, projects, skills, and portfolio items in <knowledge_base>.
     - If the service or technology is mentioned, answer affirmatively with specific details from the website.
     - If the visitor asks about a service that is related (e.g. web design/development vs brand identity) but not explicitly detailed, politely clarify what services ARE provided based on the site and invite them to reach out for custom requests.
3. CONVERSATIONAL & PROFESSIONAL:
   - Speak naturally like a skilled representative.
   - NEVER output raw metadata strings (such as "Meta Description: ..." or "Page Title: ...").
   - NEVER repeat identical robotic fallback sentences.
4. GREETINGS: For greetings ("hi", "hello"), greet the visitor warmly as ${bot.name} and summarize the key services you can help them with based on the website.
5. FALLBACK RESTRICTION: Only if the user asks something completely outside the scope of the business, offer: "${bot.fallbackMessage || 'Please contact our team for more information.'}".
    `.trim();

    // 6. Fetch Recent Message History and format compliant multiturn contents
    const dbMessages = await ConversationRepo.findMessagesByConversation(conversation.id);
    const historyWithoutLast = dbMessages.slice(0, -1).slice(-8);

    const chatContents = buildGeminiContents(
      historyWithoutLast.map(m => ({ sender: m.sender, content: m.content })),
      userMessage
    );

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
          setTimeout(() => reject(new Error('Gemini request timed out')), 20000)
        );

        const genPromise = ai.models.generateContent({
          model: modelToUse,
          contents: chatContents,
          config: {
            systemInstruction,
            temperature: 0.3,
            maxOutputTokens: 1500,
          },
        });

        const res = (await Promise.race([genPromise, timeoutPromise])) as any;
        if (res && res.text && res.text.trim().length > 0) {
          replyText = res.text.trim();
        } else {
          replyText = this.synthesizeDirectAnswerFromGrounding(userMessage, groundingContext, bot);
        }
      } catch (err: any) {
        console.error('Gemini Generation Notice:', err.message || err);
        replyText = this.synthesizeDirectAnswerFromGrounding(userMessage, groundingContext, bot);
      }
    } else {
      replyText = this.synthesizeDirectAnswerFromGrounding(userMessage, groundingContext, bot);
    }

    // 8. Save Assistant Response in DB with Citations
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
   */
  private static synthesizeDirectAnswerFromGrounding(
    userQuery: string,
    groundingContext: string,
    bot: any
  ): string {
    if (
      !groundingContext ||
      groundingContext.includes('No indexed knowledge sources available') ||
      groundingContext.includes('No relevant knowledge sources matched')
    ) {
      return bot.fallbackMessage || "I don't have information on that topic yet. Let me connect you with our team.";
    }

    // Clean metadata noise
    const cleanContext = groundingContext
      .replace(/\[SOURCE: [^\]]+\]/g, '')
      .replace(/^Meta Description:\s*/gim, '')
      .replace(/^Page Overview:\s*/gim, '')
      .replace(/^#+ /gm, '')
      .trim();

    const queryTokens = userQuery
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2);

    const paragraphs = cleanContext
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 15);

    const scored = paragraphs.map(para => {
      const lower = para.toLowerCase();
      let matches = 0;
      queryTokens.forEach(t => {
        if (lower.includes(t)) matches++;
      });
      return { para, matches };
    });

    const matched = scored.filter(s => s.matches > 0).sort((a, b) => b.matches - a.matches);

    if (matched.length > 0) {
      const topInfo = matched.slice(0, 2).map(m => m.para).join('\n\n');
      return `Based on our website:\n\n${topInfo}\n\nFeel free to ask if you have any specific questions about our services or project requirements!`;
    }

    const isGreeting = ['hi', 'hello', 'hey', 'help'].some(g => userQuery.toLowerCase().includes(g));
    if (isGreeting) {
      const intro = paragraphs[0] || 'how can I help you today?';
      return `Hello! I am ${bot.name}. We specialize in: ${intro}\n\nHow can I assist you with your project today?`;
    }

    if (paragraphs.length > 0) {
      return `Based on our website information:\n\n${paragraphs.slice(0, 2).join('\n\n')}\n\nLet me know if you would like to discuss more details or get in touch with our team!`;
    }

    return bot.fallbackMessage || "I'd be glad to connect you with our team to discuss your project in detail.";
  }
}
