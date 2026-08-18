import { Tenant, UserProfile, Chatbot, KnowledgeSource, Conversation, Message, AnalyticsSummary, VisitorLead } from '../types';

export const INITIAL_TENANT: Tenant = {
  id: 'tenant_acme',
  name: 'Acme SaaS Corp',
  ownerEmail: 'support@acme.io',
  plan: 'Pro',
  createdAt: '2026-01-15T08:00:00Z',
  websiteUrl: 'https://acmesaas.io',
  logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
};

export const INITIAL_USER: UserProfile = {
  uid: 'user_sarah',
  email: 'sarah.lin@acme.io',
  displayName: 'Sarah Lin',
  tenantId: 'tenant_acme',
  role: 'owner',
  avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
  createdAt: '2026-01-15T08:00:00Z',
};

export const INITIAL_CHATBOTS: Chatbot[] = [
  {
    id: 'bot_acme_support',
    tenantId: 'tenant_acme',
    name: 'Acme Product Concierge',
    description: 'Handles technical support, feature questions, and account troubleshooting.',
    systemInstruction: 'You are the primary AI customer support assistant for Acme SaaS Corp. Acme provides an all-in-one cloud automation workspace. Answer questions politely, accurately, and concisely using the provided knowledge base. Offer clear step-by-step guidance. If a query requires human intervention or account billing modifications, politely offer human operator handoff.',
    tone: 'Friendly',
    primaryColor: '#4F46E5', // Indigo
    textColor: '#FFFFFF',
    avatar: '🤖',
    greetingMessage: '👋 Hi there! I am Acme AI Concierge. How can I assist you with your workspace today?',
    suggestedQuestions: [
      'How do I set up SSO authentication?',
      'What are the API rate limits for Pro plan?',
      'How do I invite team members?',
      'Can I export workspace metrics to CSV?'
    ],
    model: 'gemini-3.7-flash',
    fallbackMessage: "I'm sorry, I don't have information on that specific topic yet. Would you like me to connect you with a live human support specialist?",
    collectLeadEmail: true,
    leadTitle: 'Get personalized help from our team',
    humanOperatorOnline: true,
    status: 'active',
    createdAt: '2026-01-16T10:00:00Z',
    updatedAt: '2026-02-01T14:30:00Z',
  },
  {
    id: 'bot_sales_advisor',
    tenantId: 'tenant_acme',
    name: 'Sales & Pricing Advisor',
    description: 'Assists prospective enterprise customers with plan comparison and demo bookings.',
    systemInstruction: 'You are Acme Sales Advisor. Assist leads with pricing tiers (Free, Pro at $49/mo, Enterprise custom), custom SLA agreements, and booking personalized product demos. Always invite high-intent visitors to leave their work email.',
    tone: 'Professional',
    primaryColor: '#059669', // Emerald
    textColor: '#FFFFFF',
    avatar: '💼',
    greetingMessage: 'Hello! Looking for the right Acme plan for your team? I can help you calculate ROI or schedule a live demo.',
    suggestedQuestions: [
      'Compare Pro vs Enterprise plans',
      'Do you offer annual discounts?',
      'Is SOC2 Type II compliance included?',
      'Schedule a custom 1-on-1 demo'
    ],
    model: 'gemini-3.7-flash',
    fallbackMessage: 'Let me grab an enterprise account manager to answer your custom requirements.',
    collectLeadEmail: true,
    leadTitle: 'Get a custom enterprise quote',
    humanOperatorOnline: true,
    status: 'active',
    createdAt: '2026-01-20T09:00:00Z',
    updatedAt: '2026-02-02T11:00:00Z',
  },
  {
    id: 'bot_ecommerce_guide',
    tenantId: 'tenant_acme',
    name: 'Store Orders & Shipping Bot',
    description: 'Automates order status tracking, return policies, and shipping FAQs.',
    systemInstruction: 'Assist online shoppers with order tracking, 30-day free returns policy, and international delivery times. Maintain a warm, empathetic tone.',
    tone: 'Empathetic',
    primaryColor: '#D97706', // Amber
    textColor: '#FFFFFF',
    avatar: '📦',
    greetingMessage: 'Welcome to Acme Store! Need help tracking an order or processing a return?',
    suggestedQuestions: [
      'Where is my order #AC-8821?',
      'What is your return policy?',
      'Do you ship to EU and UK?'
    ],
    model: 'gemini-3.7-flash',
    fallbackMessage: 'I will notify our fulfillment team to review your order details right away.',
    collectLeadEmail: false,
    humanOperatorOnline: false,
    status: 'active',
    createdAt: '2026-01-25T12:00:00Z',
    updatedAt: '2026-02-03T16:00:00Z',
  }
];

export const INITIAL_KNOWLEDGE_SOURCES: KnowledgeSource[] = [
  {
    id: 'ks_1',
    chatbotId: 'bot_acme_support',
    tenantId: 'tenant_acme',
    type: 'url',
    title: 'Acme Documentation - Security & SSO Setup',
    sourceUrl: 'https://docs.acmesaas.io/sso-guide',
    content: `Acme supports Single Sign-On (SSO) integration via SAML 2.0 and OpenID Connect (OIDC) for Okta, Azure AD, PingIdentity, and Google Workspace.
    Setting up SSO:
    1. Navigate to Settings > Authentication > SSO Configuration.
    2. Download the Acme Service Provider Metadata XML file.
    3. Enter your Identity Provider Entity ID and ACS Endpoint URL.
    4. Enable Enforce SSO for all workspace members.
    SSO is available on Pro ($49/mo) and Enterprise plans.`,
    status: 'indexed',
    chunkCount: 12,
    updatedAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'ks_2',
    chatbotId: 'bot_acme_support',
    tenantId: 'tenant_acme',
    type: 'faq',
    title: 'frequently Asked Questions - Team Invites & Limits',
    content: `Q: How do I invite team members to my workspace?
A: Click 'Team Settings' on the sidebar, hit 'Invite Member', type their email address, and select their role (Owner, Admin, or Agent). An invitation email will be dispatched automatically.

Q: What are the API rate limits?
A: Free tier allows 1,000 requests/day. Pro tier allows 100,000 requests/day. Enterprise tier offers unlimited throughput with dedicated burst capacity.

Q: Can I export analytics reports?
A: Yes! Go to Dashboard > Analytics and click 'Export Report'. You can export in CSV, PDF, or JSON format.`,
    status: 'indexed',
    chunkCount: 8,
    updatedAt: '2026-02-02T14:15:00Z',
  },
  {
    id: 'ks_3',
    chatbotId: 'bot_sales_advisor',
    tenantId: 'tenant_acme',
    type: 'text',
    title: 'Acme Pricing Breakdown & Custom SLAs',
    content: `Free Plan: $0/month. Includes 1 AI Chatbot, up to 100 conversations/month, standard web widget.
Pro Plan: $49/month. Includes 5 AI Chatbots, 5,000 conversations/month, website URL crawler training, custom widget styling, lead email capture, and live agent takeover.
Enterprise Plan: Custom pricing starting at $299/month. Unlimited Chatbots, custom Gemini model fine-tuning, dedicated Customer Success Manager, 99.9% Uptime SLA, and custom audit logs.`,
    status: 'indexed',
    chunkCount: 6,
    updatedAt: '2026-02-03T09:00:00Z',
  }
];

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_101',
    chatbotId: 'bot_acme_support',
    tenantId: 'tenant_acme',
    visitorId: 'vis_9921',
    visitorName: 'Alex Mercer',
    visitorEmail: 'alex.m@techcorp.com',
    visitorLocation: 'San Francisco, CA, USA',
    visitorBrowser: 'Chrome 122 on macOS',
    pageUrl: 'https://acmesaas.io/settings/sso',
    status: 'active',
    lastMessage: 'Thanks! That SSO guide cleared up our SAML configuration.',
    lastMessageTime: '2026-08-06T00:10:00Z',
    unreadByAgent: true,
    csatRating: 5,
    createdAt: '2026-08-05T23:45:00Z',
  },
  {
    id: 'conv_102',
    chatbotId: 'bot_acme_support',
    tenantId: 'tenant_acme',
    visitorId: 'vis_8832',
    visitorName: 'Elena Rostova',
    visitorEmail: 'elena@designhub.io',
    visitorLocation: 'London, UK',
    visitorBrowser: 'Safari 17 on iOS',
    pageUrl: 'https://acmesaas.io/pricing',
    status: 'human_takeover',
    lastMessage: 'Can a human agent confirm if custom SAML mapping is supported on Pro?',
    lastMessageTime: '2026-08-06T00:05:00Z',
    unreadByAgent: true,
    createdAt: '2026-08-05T23:50:00Z',
  },
  {
    id: 'conv_103',
    chatbotId: 'bot_sales_advisor',
    tenantId: 'tenant_acme',
    visitorId: 'vis_7741',
    visitorName: 'Marcus Vance',
    visitorEmail: 'm.vance@globalfinance.com',
    visitorLocation: 'New York, NY, USA',
    visitorBrowser: 'Edge 121 on Windows 11',
    pageUrl: 'https://acmesaas.io/enterprise',
    status: 'resolved',
    lastMessage: 'I have submitted my contact email for the enterprise demo. Talk soon!',
    lastMessageTime: '2026-08-05T22:15:00Z',
    unreadByAgent: false,
    csatRating: 5,
    createdAt: '2026-08-05T22:00:00Z',
  }
];

export const INITIAL_MESSAGES: Record<string, Message[]> = {
  'conv_101': [
    {
      id: 'm1',
      conversationId: 'conv_101',
      chatbotId: 'bot_acme_support',
      sender: 'bot',
      content: '👋 Hi there! I am Acme AI Concierge. How can I assist you with your workspace today?',
      timestamp: '2026-08-05T23:45:00Z',
    },
    {
      id: 'm2',
      conversationId: 'conv_101',
      chatbotId: 'bot_acme_support',
      sender: 'visitor',
      content: 'How do I set up SSO authentication for our Okta domain?',
      timestamp: '2026-08-05T23:46:00Z',
    },
    {
      id: 'm3',
      conversationId: 'conv_101',
      chatbotId: 'bot_acme_support',
      sender: 'bot',
      content: 'To set up SSO authentication for Okta:\n1. Go to Settings > Authentication > SSO Configuration.\n2. Download the Acme Service Provider Metadata XML.\n3. Enter your Okta Entity ID and ACS Endpoint URL.\n4. Toggle "Enforce SSO" once tested.',
      sourcesUsed: [
        {
          title: 'Acme Documentation - Security & SSO Setup',
          snippet: 'Acme supports Single Sign-On (SSO) integration via SAML 2.0 and OpenID Connect (OIDC) for Okta...'
        }
      ],
      timestamp: '2026-08-05T23:46:05Z',
    },
    {
      id: 'm4',
      conversationId: 'conv_101',
      chatbotId: 'bot_acme_support',
      sender: 'visitor',
      content: 'Thanks! That SSO guide cleared up our SAML configuration.',
      timestamp: '2026-08-06T00:10:00Z',
    }
  ],
  'conv_102': [
    {
      id: 'm10',
      conversationId: 'conv_102',
      chatbotId: 'bot_acme_support',
      sender: 'bot',
      content: '👋 Hi there! How can I help you today?',
      timestamp: '2026-08-05T23:50:00Z',
    },
    {
      id: 'm11',
      conversationId: 'conv_102',
      chatbotId: 'bot_acme_support',
      sender: 'visitor',
      content: 'Can a human agent confirm if custom SAML mapping is supported on Pro?',
      timestamp: '2026-08-06T00:05:00Z',
    }
  ]
};

export const INITIAL_ANALYTICS: AnalyticsSummary = {
  totalConversations: 1482,
  leadsCaptured: 342,
  aiResolutionRate: 94.2,
  avgResponseTimeSec: 1.4,
  csatScore: 4.85,
  totalMessages: 6120,
  humanTakeovers: 86,
  topTopics: [
    { topic: 'SSO & SAML Configuration', count: 412 },
    { topic: 'Pro Plan API Rate Limits', count: 328 },
    { topic: 'Team Role Permissions', count: 215 },
    { topic: 'Billing & Invoice Exports', count: 184 },
    { topic: 'Custom Webhook Integration', count: 143 }
  ],
  dailyTrends: [
    { date: 'Jul 31', conversations: 180, leads: 42 },
    { date: 'Aug 01', conversations: 210, leads: 51 },
    { date: 'Aug 02', conversations: 195, leads: 44 },
    { date: 'Aug 03', conversations: 240, leads: 58 },
    { date: 'Aug 04', conversations: 220, leads: 49 },
    { date: 'Aug 05', conversations: 265, leads: 62 },
    { date: 'Aug 06', conversations: 172, leads: 36 }
  ]
};

export const INITIAL_LEADS: VisitorLead[] = [
  {
    id: 'lead_1',
    chatbotId: 'bot_sales_advisor',
    tenantId: 'tenant_acme',
    conversationId: 'conv_103',
    name: 'Marcus Vance',
    email: 'm.vance@globalfinance.com',
    company: 'Global Finance Corp',
    capturedAt: '2026-08-05T22:15:00Z',
    firstQuestion: 'Compare Pro vs Enterprise plans for 250 seats'
  },
  {
    id: 'lead_2',
    chatbotId: 'bot_acme_support',
    tenantId: 'tenant_acme',
    conversationId: 'conv_101',
    name: 'Alex Mercer',
    email: 'alex.m@techcorp.com',
    company: 'TechCorp Solutions',
    capturedAt: '2026-08-05T23:45:00Z',
    firstQuestion: 'How do I set up SSO authentication?'
  }
];
