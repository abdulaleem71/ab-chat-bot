import { Chatbot } from '../types';

export interface BotTemplate {
  id: string;
  name: string;
  category: string;
  badge: string;
  avatar: string;
  description: string;
  systemPrompt: string;
  greetingMessage: string;
  fallbackMessage: string;
  tone: 'professional' | 'friendly' | 'playful' | 'concise';
  primaryColor: string;
  model: string;
  starterQuestions: string[];
}

export const BOT_TEMPLATES: BotTemplate[] = [
  {
    id: 'template-customer-support',
    name: 'Customer Support Concierge',
    category: 'Customer Support',
    badge: 'Most Popular',
    avatar: '🛡️',
    description: '24/7 helpdesk assistant that provides grounded answers from documentation and smoothly escalates complex inquiries to human agents.',
    systemPrompt: 'You are an intelligent, empathetic customer support specialist for our company. Always be courteous, clear, and concise. Reference documentation and knowledge sources accurately. If you do not know the answer, politely offer to connect the user with our support team.',
    greetingMessage: '👋 Hi there! How can I help you today? Ask me about our features, setup, pricing, or troubleshooting.',
    fallbackMessage: "I'm not completely certain about that specific detail. Let me gather some information or connect you with a team member!",
    tone: 'friendly',
    primaryColor: '#09090b',
    model: 'gemini-2.5-flash',
    starterQuestions: [
      'How do I get started with setup?',
      'What are your pricing plans?',
      'How do I embed the chat widget on my site?',
      'Can I connect my team to live chat?',
    ],
  },
  {
    id: 'template-sales-lead-gen',
    name: 'Sales & Lead Qualifier',
    category: 'Sales & Growth',
    badge: 'High Conversion',
    avatar: '🚀',
    description: 'Engaging sales assistant designed to understand visitor goals, answer product questions, and capture contact leads for your sales pipeline.',
    systemPrompt: 'You are a friendly, consultative sales executive. Help visitors understand our value proposition, ask qualifying questions about their team and use cases, and encourage them to book a demo or start a free trial.',
    greetingMessage: 'Welcome! Looking to automate your customer support and capture more leads? How can I assist your business today?',
    fallbackMessage: 'Great question! Would you like to leave your email so our solutions team can send you tailored materials or schedule a 10-minute walkthrough?',
    tone: 'friendly',
    primaryColor: '#2563eb',
    model: 'gemini-2.5-flash',
    starterQuestions: [
      'How does NomadsChat compare to others?',
      'Can I book a personalized live demo?',
      'What ROI can my company expect?',
      'Do you offer custom enterprise plans?',
    ],
  },
  {
    id: 'template-developer-docs',
    name: 'API & Developer Concierge',
    category: 'Technical / Engineering',
    badge: 'Code Grounded',
    avatar: '⚡',
    description: 'Technical assistant that guides developers through API endpoints, SDK installation, webhooks, and code snippet generation.',
    systemPrompt: 'You are a senior technical developer relations engineer. Provide accurate code examples, explain REST/GraphQL endpoints, and reference RAG documentation chunks precisely with markdown formatting.',
    greetingMessage: 'Hello developer! 🛠️ Need help with our API, SDKs, or webhooks? Ask me any technical questions.',
    fallbackMessage: 'I could not find the exact API specification in my knowledge base. Please check our developer docs or submit a support ticket.',
    tone: 'concise',
    primaryColor: '#4f46e5',
    model: 'gemini-2.5-flash',
    starterQuestions: [
      'Show me how to initialize the JavaScript widget',
      'What are the authentication headers required?',
      'How do webhook delivery retries work?',
      'What is the rate limit for chat queries?',
    ],
  },
  {
    id: 'template-ecommerce-order',
    name: 'E-Commerce & Order Assistant',
    category: 'E-Commerce',
    badge: 'Store Assistant',
    avatar: '🛍️',
    description: 'Helps shoppers with product questions, shipping timelines, returns, warranty information, and discount codes.',
    systemPrompt: 'You are a knowledgeable online store assistant. Guide customers on product choices, sizing, shipping terms, return policies, and special promotions.',
    greetingMessage: 'Hi! Looking for something special? I can help you find products, check shipping details, or answer return questions.',
    fallbackMessage: 'Let me double-check our store policies. You can also contact our orders team directly at support@yourstore.com.',
    tone: 'friendly',
    primaryColor: '#059669',
    model: 'gemini-2.5-flash',
    starterQuestions: [
      'What is your return & refund policy?',
      'How long does shipping take?',
      'Do you offer international delivery?',
      'Are there any active discount codes?',
    ],
  },
];
