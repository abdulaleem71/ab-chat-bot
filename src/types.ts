export interface Tenant {
  id: string;
  name: string;
  ownerEmail: string;
  plan: 'Free' | 'Pro' | 'Enterprise';
  createdAt: string;
  websiteUrl?: string;
  logoUrl?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  tenantId: string;
  role: 'owner' | 'admin' | 'agent';
  avatarUrl?: string;
  createdAt: string;
}

export type BotTone = 'Friendly' | 'Professional' | 'Concise' | 'Technical' | 'Empathetic';
export type BotModel = 'gemini-3.7-flash' | 'gemini-3.1-pro-preview';

export interface Chatbot {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  websiteUrl?: string;
  allowedDomains?: string[];
  domainLockEnabled?: boolean;
  embedSecretKey?: string;
  systemInstruction: string;
  tone: BotTone;
  primaryColor: string;
  textColor: string;
  avatar: string; // Emoji or SVG icon identifier
  greetingMessage: string;
  suggestedQuestions: string[];
  model: BotModel;
  fallbackMessage: string;
  collectLeadEmail: boolean;
  leadTitle?: string;
  humanOperatorOnline: boolean;
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export type KnowledgeType = 'url' | 'text' | 'faq' | 'pdf';

export interface KnowledgeSource {
  id: string;
  chatbotId: string;
  tenantId: string;
  type: KnowledgeType;
  title: string;
  content: string;
  sourceUrl?: string;
  status: 'indexed' | 'pending' | 'failed';
  chunkCount: number;
  updatedAt: string;
}

export interface GroundingSource {
  title: string;
  snippet: string;
  sourceType?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  chatbotId: string;
  sender: 'visitor' | 'bot' | 'agent';
  agentName?: string;
  content: string;
  sourcesUsed?: GroundingSource[];
  timestamp: string;
}

export interface Conversation {
  id: string;
  chatbotId: string;
  tenantId: string;
  visitorId: string;
  visitorName?: string;
  visitorEmail?: string;
  visitorLocation?: string;
  visitorBrowser?: string;
  pageUrl?: string;
  status: 'active' | 'human_takeover' | 'resolved' | 'closed';
  lastMessage: string;
  lastMessageTime: string;
  unreadByAgent: boolean;
  csatRating?: number; // 1 to 5
  createdAt: string;
}

export interface AnalyticsSummary {
  totalConversations: number;
  leadsCaptured: number;
  aiResolutionRate: number; // Percentage, e.g. 92.5
  avgResponseTimeSec: number; // Seconds
  csatScore: number; // 1-5 scale, e.g. 4.8
  totalMessages: number;
  humanTakeovers: number;
  topTopics: { topic: string; count: number }[];
  dailyTrends: { date: string; conversations: number; leads: number }[];
}

export interface VisitorLead {
  id: string;
  chatbotId: string;
  tenantId: string;
  conversationId: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  capturedAt: string;
  firstQuestion?: string;
}
