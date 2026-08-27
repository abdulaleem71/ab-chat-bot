import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Bot, BookOpen, Code, Inbox, Sparkles, BarChart3, Users, Zap, ShieldCheck, ArrowRight, CheckCircle2, Globe, FileText, Cpu, MessageSquare } from 'lucide-react';
import { MotionButton } from '../common/MotionButton';
import { GEMINI_CONFIG } from '../../config/models';

interface FeaturesViewProps {
  onNavigateToTab?: (tab: string) => void;
}

export const FeaturesView: React.FC<FeaturesViewProps> = ({ onNavigateToTab }) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'ai' | 'inbox' | 'embed'>('all');

  const featuresList = [
    {
      id: 'rag',
      category: 'ai',
      icon: BookOpen,
      title: 'Instant RAG & Web Crawler',
      badge: 'Knowledge Engine',
      description: 'Train your chatbot on your documentation, help articles, and live URLs in under 30 seconds.',
      details: [
        'Automatic URL scraping & recursive link parsing',
        'PDF, TXT, and Markdown document uploads',
        'Real-time indexing with semantic chunking',
        'Grounding citations attached to every answer',
      ],
      actionTab: 'knowledge',
      actionText: 'Train Knowledge Base',
    },
    {
      id: 'gemini',
      category: 'ai',
      icon: Cpu,
      title: GEMINI_CONFIG.featuresTitle,
      badge: 'State-of-the-Art LLM',
      description: GEMINI_CONFIG.featuresDescription,
      details: [
        'Sub-second response latencies for web chat',
        'Strict system instruction compliance & custom tones',
        'Multilingual translation in 40+ languages',
        'Built-in fallback responses for unknown queries',
      ],
      actionTab: 'chatbots',
      actionText: 'Configure Chatbot Models',
    },
    {
      id: 'widget',
      category: 'embed',
      icon: Code,
      title: '1-Line JavaScript Embed Widget',
      badge: 'Any Platform',
      description: 'Copy and paste a single `<script>` snippet to activate a beautiful floating chat widget on any website.',
      details: [
        'Works with WordPress, Shopify, React, Webflow, HTML',
        'Custom primary colors, fonts, and bot avatars',
        'Floating bubble or full-page inline iframe embed',
        'Mobile responsive with smooth entry animations',
      ],
      actionTab: 'embed',
      actionText: 'Get Widget Embed Code',
    },
    {
      id: 'inbox',
      category: 'inbox',
      icon: Inbox,
      title: 'Live Human Operator Takeover',
      badge: 'Hybrid Support',
      description: 'When a visitor needs a human, seamless handoff transfers the conversation directly to your support team.',
      details: [
        'Real-time WebSocket chat between visitor & agent',
        '1-click AI takeover or agent manual override',
        'Internal agent notes & visitor information panel',
        'Resolved conversation history logs',
      ],
      actionTab: 'inbox',
      actionText: 'Open Live Support Inbox',
    },
    {
      id: 'leads',
      category: 'inbox',
      icon: Users,
      title: 'Automated Lead Generation',
      badge: 'Growth & CRM',
      description: 'Capture email addresses, names, and user intent directly inside the chat widget before or during sessions.',
      details: [
        'Customizable email prompt titles & placeholders',
        'Export captured leads to CSV or CRM webhooks',
        'Visitor history tracking across multiple visits',
        'Automated lead qualification tagging',
      ],
      actionTab: 'overview',
      actionText: 'View Captured Leads',
    },
    {
      id: 'analytics',
      category: 'ai',
      icon: BarChart3,
      title: 'CSAT & Resolution Analytics',
      badge: 'Insights',
      description: 'Gain complete visibility into customer support efficiency, top missing topics, and response times.',
      details: [
        'Deflection rate & resolution percentage tracking',
        'Top unanswered questions report for documentation gaps',
        'Message volume trends by hour and day',
        'Customer satisfaction (CSAT) scoring',
      ],
      actionTab: 'analytics',
      actionText: 'View Analytics Dashboard',
    },
  ];

  const filteredFeatures = activeCategory === 'all'
    ? featuresList
    : featuresList.filter(f => f.category === activeCategory);

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Hero Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-black text-white border border-black px-3.5 py-1 rounded-full text-xs font-bold shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-white" />
          <span>Complete Feature Suite</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-black tracking-tight leading-tight">
          Everything you need for automated AI customer support
        </h1>
        <p className="text-zinc-600 text-sm font-medium leading-relaxed">
          NomadsChat combines NomadsArc AI engine, custom document knowledge grounding, live human chat takeover, and lead generation into one unified platform.
        </p>

        {/* Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-2 pt-4">
          {[
            { id: 'all', label: 'All Capabilities' },
            { id: 'ai', label: 'AI & Knowledge RAG' },
            { id: 'inbox', label: 'Live Inbox & Leads' },
            { id: 'embed', label: 'Embed & Customization' },
          ].map(cat => (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer font-heading ${
                activeCategory === cat.id
                  ? 'bg-zinc-950 text-white shadow-md'
                  : 'bg-white text-zinc-700 hover:bg-zinc-100/80 border border-zinc-200'
              }`}
            >
              {cat.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFeatures.map(feature => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.id}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-zinc-200/90 rounded-3xl p-6 flex flex-col justify-between hover:shadow-xl hover:border-zinc-300 transition-all duration-300 group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-zinc-950 text-white flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-xs">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[10px] font-extrabold font-mono tracking-wider text-zinc-950 bg-zinc-100 px-2.5 py-0.5 rounded-full border border-zinc-200 uppercase">
                    {feature.badge}
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-zinc-950 mb-1.5 font-heading">{feature.title}</h3>
                <p className="text-xs text-zinc-500 font-medium mb-4 leading-relaxed font-body">{feature.description}</p>

                <div className="space-y-2 mb-6 pt-3 border-t border-zinc-100 font-body">
                  {feature.details.map((detail, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-zinc-800 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-zinc-950 shrink-0 mt-0.5" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              {onNavigateToTab && (
                <MotionButton
                  variant="secondary"
                  size="md"
                  fullWidth
                  onClick={() => onNavigateToTab(feature.actionTab)}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  {feature.actionText}
                </MotionButton>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Visual Workflow Infographic */}
      <div className="bg-black rounded-3xl p-8 sm:p-10 text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-800/40 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-500" />
        <div className="text-center max-w-xl mx-auto mb-8 relative z-10">
          <h2 className="text-2xl font-extrabold tracking-tight mb-2">How NomadsChat Works in 3 Steps</h2>
          <p className="text-xs text-zinc-300 font-medium">
            From zero to an intelligent, grounded support bot on your website in under 3 minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative hover:border-zinc-700 transition duration-200">
            <div className="w-8 h-8 rounded-xl bg-white text-black font-extrabold text-sm flex items-center justify-center mb-3 shadow-md">
              1
            </div>
            <h4 className="font-extrabold text-sm mb-1 text-white">Add Knowledge Sources</h4>
            <p className="text-xs text-zinc-400 font-medium leading-relaxed">
              Paste your website URL or upload PDF guides. NomadsChat automatically indexes and chunks content for NomadsArc RAG.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative hover:border-zinc-700 transition duration-200">
            <div className="w-8 h-8 rounded-xl bg-white text-black font-extrabold text-sm flex items-center justify-center mb-3 shadow-md">
              2
            </div>
            <h4 className="font-extrabold text-sm mb-1 text-white">Customize Bot & Tone</h4>
            <p className="text-xs text-zinc-400 font-medium leading-relaxed">
              Set custom system instructions, primary brand colors, avatars, and lead generation form fields.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative hover:border-zinc-700 transition duration-200">
            <div className="w-8 h-8 rounded-xl bg-white text-black font-extrabold text-sm flex items-center justify-center mb-3 shadow-md">
              3
            </div>
            <h4 className="font-extrabold text-sm mb-1 text-white">Embed & Automate</h4>
            <p className="text-xs text-zinc-400 font-medium leading-relaxed">
              Paste the 1-line script tag into your site HTML. Enjoy 24/7 automated grounded support replies!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
