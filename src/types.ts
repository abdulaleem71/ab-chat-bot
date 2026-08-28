export type TenantPlan = 'Free' | 'Pro' | 'growth_pro' | 'Ultra' | 'Enterprise';
export type ChannelType = 'Website Widget' | 'WhatsApp' | 'Instagram DM' | 'Email' | 'website_widget' | 'whatsapp' | 'instagram_dm' | 'email';
export type TeamRole = 'Admin' | 'Agent' | 'Owner';

export interface ByokConfig {
  hasCustomKey: boolean;
  provider: 'gemini' | 'openai';
  maskedKey?: string;
  updatedAt?: string;
}

export interface Tenant {
  id: string;
  name: string;
  ownerEmail: string;
  plan: TenantPlan;
  createdAt: string;
  trialStartedAt?: string | null;
  trialEndsAt?: string | null;
  hasPaymentMethod?: boolean;
  paymentMethodBrand?: string | null;
  paymentMethodLast4?: string | null;
  paymentMethodExp?: string | null;
  websiteUrl?: string;
  logoUrl?: string;
  byokConfig?: ByokConfig;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  tenantId: string;
  role: 'owner' | 'admin' | 'agent' | 'Admin' | 'Agent' | 'Owner';
  avatarUrl?: string;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  tenantId: string;
  userId: string;
  name: string;
  email: string;
  role: 'Admin' | 'Agent' | 'Owner';
  avatarUrl?: string;
  createdAt: string;
  lastActiveAt?: string;
}

export interface TeamInvite {
  id: string;
  tenantId: string;
  email: string;
  role: 'Admin' | 'Agent';
  invitedBy: string;
  invitedByName?: string;
  status: 'pending' | 'accepted' | 'revoked';
  createdAt: string;
  expiresAt: string;
}

export type IntegrationId = 'slack' | 'whatsapp' | 'zapier' | 'hubspot' | 'shopify';

export interface IntegrationItem {
  id: IntegrationId;
  name: string;
  category: string;
  description: string;
  logo: string;
  isConnected: boolean;
  connectedAt?: string;
  lastSyncAt?: string;
  config?: Record<string, any>;
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
  channel?: ChannelType;
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
  channel?: ChannelType;
  assignedTo?: string;
  assignedToName?: string;
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
