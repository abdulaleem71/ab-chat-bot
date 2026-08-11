import React, { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote, Building2, TrendingUp, ShieldCheck, Sparkles } from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  rating: number;
  metric: string;
  metricLabel: string;
  quote: string;
  badge: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: 't1',
    name: 'Sarah Jenkins',
    role: 'Head of Customer Support',
    company: 'Apex Digital SaaS',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    metric: '78%',
    metricLabel: 'Deflection Rate',
    quote: 'NomadsChat transformed our support queue overnight. Grounding Gemini on our technical docs cut ticket response times from hours to under 3 seconds.',
    badge: 'SaaS Case Study',
  },
  {
    id: 't2',
    name: 'Marcus Vance',
    role: 'VP of E-Commerce Growth',
    company: 'Velox Athletics',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    metric: '3.4x',
    metricLabel: 'Lead Conversion',
    quote: 'The lead capture gate combined with instant grounded shipping & return answers increased checkout conversions by 340% in our first month.',
    badge: 'E-Commerce',
  },
  {
    id: 't3',
    name: 'Elena Rostova',
    role: 'Chief Technology Officer',
    company: 'FinPulse Global',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    metric: '99.2%',
    metricLabel: 'Grounding Accuracy',
    quote: 'Hallucination prevention was our top priority. NomadsChat’s strict document retrieval ensures our compliance guidelines are always honored perfectly.',
    badge: 'FinTech Compliance',
  },
  {
    id: 't4',
    name: 'David K. Chen',
    role: 'Founder & Managing Director',
    company: 'Nexus Real Estate Solutions',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    metric: '24/7',
    metricLabel: 'Automated Availability',
    quote: 'Our buyers expect immediate property details at midnight. Setting up NomadsChat with custom colors to match our brand took less than 3 minutes!',
    badge: 'Real Estate',
  },
];

export const TestimonialsCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handleNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex(prev => (prev + 1) % TESTIMONIALS.length);
  };

  const handlePrev = () => {
    setIsAutoPlaying(false);
    setCurrentIndex(prev => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  const activeTestimonial = TESTIMONIALS[currentIndex];

  return (
    <section className="bg-black text-white rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden border border-zinc-800 my-8">
      {/* Background accents */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-zinc-800/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-zinc-900/60 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-700 text-zinc-300 px-3.5 py-1 rounded-full text-xs font-bold mb-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>Customer Success & Reviews</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Loved by 1,200+ Support Teams
          </h2>
        </div>

        {/* Carousel controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-2.5 bg-zinc-900 hover:bg-white hover:text-black text-white border border-zinc-800 rounded-xl transition duration-200 cursor-pointer active:scale-95 shadow-sm"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-zinc-400 px-2 font-mono">
            0{currentIndex + 1} / 0{TESTIMONIALS.length}
          </span>
          <button
            onClick={handleNext}
            className="p-2.5 bg-zinc-900 hover:bg-white hover:text-black text-white border border-zinc-800 rounded-xl transition duration-200 cursor-pointer active:scale-95 shadow-sm"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Testimonial Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10 min-h-[220px]">
        {/* Metric Column */}
        <div className="md:col-span-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between h-full shadow-inner">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold tracking-wider text-zinc-400 uppercase bg-zinc-800 px-2.5 py-1 rounded-full border border-zinc-700 inline-block mb-3">
              {activeTestimonial.badge}
            </span>
            <div className="text-4xl sm:text-5xl font-black text-white tracking-tight">
              {activeTestimonial.metric}
            </div>
            <p className="text-xs font-bold text-zinc-400 flex items-center gap-1.5 pt-1">
              <TrendingUp className="w-3.5 h-3.5 text-white shrink-0" />
              <span>{activeTestimonial.metricLabel}</span>
            </p>
          </div>

          <div className="pt-6 border-t border-zinc-800/80 flex items-center gap-1 text-amber-400">
            {[...Array(activeTestimonial.rating)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
            ))}
            <span className="text-xs font-extrabold text-white ml-2">5.0 Star Rating</span>
          </div>
        </div>

        {/* Quote Column */}
        <div className="md:col-span-8 bg-zinc-950/80 border border-zinc-800/90 rounded-2xl p-6 sm:p-8 flex flex-col justify-between h-full relative">
          <Quote className="w-10 h-10 text-zinc-800 absolute top-4 right-6 pointer-events-none" />
          
          <p className="text-sm sm:text-base text-zinc-200 font-medium leading-relaxed italic mb-6 relative z-10">
            "{activeTestimonial.quote}"
          </p>

          <div className="flex items-center gap-4 pt-4 border-t border-zinc-800/80">
            <img
              src={activeTestimonial.avatar}
              alt={activeTestimonial.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-white/20 shadow-md"
            />
            <div>
              <h4 className="font-extrabold text-sm text-white">{activeTestimonial.name}</h4>
              <p className="text-xs text-zinc-400 font-medium">{activeTestimonial.role} • <strong className="text-zinc-200">{activeTestimonial.company}</strong></p>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination Dots */}
      <div className="flex items-center justify-center gap-2 mt-6 relative z-10">
        {TESTIMONIALS.map((t, idx) => (
          <button
            key={t.id}
            onClick={() => {
              setIsAutoPlaying(false);
              setCurrentIndex(idx);
            }}
            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
              currentIndex === idx ? 'w-8 bg-white' : 'w-2 bg-zinc-700 hover:bg-zinc-500'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
};
