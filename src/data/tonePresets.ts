import { BotTone } from '../types';

export interface TonePresetInfo {
  tone: BotTone;
  label: string;
  badge: string;
  icon: string;
  description: string;
  sampleQuestion: string;
  sampleReply: string;
}

export const TONE_PRESETS: TonePresetInfo[] = [
  {
    tone: 'Friendly',
    label: 'Friendly',
    badge: 'Warm & Cheerful',
    icon: '😊',
    description: 'Enthusiastic, welcoming, and approachable with positive energy.',
    sampleQuestion: 'When will I get my refund?',
    sampleReply: "Happy to help with that! You'll see the refund pop back into your account in 3–5 business days! 😊",
  },
  {
    tone: 'Professional',
    label: 'Professional',
    badge: 'Formal & Structured',
    icon: '👔',
    description: 'Polite, clear, business-appropriate, and structured responses.',
    sampleQuestion: 'When will I get my refund?',
    sampleReply: 'Refunds are issued to the original payment method within 3 to 5 business days upon approval.',
  },
  {
    tone: 'Concise',
    label: 'Concise',
    badge: 'Direct & Minimal',
    icon: '⚡',
    description: 'Brief, to the point, direct answers without unnecessary filler.',
    sampleQuestion: 'When will I get my refund?',
    sampleReply: 'Refunds are processed within 3–5 business days to your original payment method.',
  },
  {
    tone: 'Technical',
    label: 'Technical',
    badge: 'Analytical & Precise',
    icon: '💻',
    description: 'Developer-oriented, exact terminology, parameters, and specs.',
    sampleQuestion: 'When will I get my refund?',
    sampleReply: 'POST /v1/refunds initiates idempotently. Settlement is reflected via original payment gateway in 3–5 business days.',
  },
  {
    tone: 'Empathetic',
    label: 'Empathetic',
    badge: 'Caring & Reassuring',
    icon: '💙',
    description: 'Compassionate, supportive, and understanding for customer concerns.',
    sampleQuestion: 'When will I get my refund?',
    sampleReply: 'I understand how important this is to you! Please rest assured that your refund will be safely returned to your original payment method in 3–5 business days. 💙',
  },
];

export function getTonePreset(tone: BotTone | string | undefined): TonePresetInfo {
  const match = TONE_PRESETS.find(t => t.tone.toLowerCase() === (tone || '').toLowerCase());
  return match || TONE_PRESETS[0];
}

export function getToneSnippet(tone: BotTone | string | undefined): string {
  return getTonePreset(tone).sampleReply;
}
