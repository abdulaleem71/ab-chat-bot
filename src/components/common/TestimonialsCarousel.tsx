import React, { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote, TrendingUp } from 'lucide-react';
import avatarSarahJenkins from '../../assets/images/avatar_sarah_jenkins_1795073265008.jpg';
import avatarMarcusVance from '../../assets/images/avatar_marcus_vance_1795073264581.jpg';
import avatarElenaRostova from '../../assets/images/avatar_elena_rostova_1795073264515.jpg';
import avatarDavidChen from '../../assets/images/avatar_david_chen_1795073265738.jpg';

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
    avatar: avatarSarahJenkins,
    rating: 5,
    metric: '78%',
    metricLabel: 'Deflection Rate',
    quote:
      'NomadsChat transformed our support queue overnight. Grounding answers on our technical docs cut ticket response times from hours to under 3 seconds.',
    badge: 'SaaS Case Study',
  },
  {
    id: 't2',
    name: 'Marcus Vance',
    role: 'VP of E-Commerce Growth',
    company: 'Velox Athletics',
    avatar: avatarMarcusVance,
    rating: 5,
    metric: '3.4x',
    metricLabel: 'Lead Conversion',
    quote:
      'The lead capture gate combined with instant grounded shipping & return answers increased checkout conversions significantly in our first month.',
    badge: 'E-Commerce',
  },
  {
    id: 't3',
    name: 'Elena Rostova',
    role: 'Chief Technology Officer',
    company: 'FinPulse Global',
    avatar: avatarElenaRostova,
    rating: 5,
    metric: '99.2%',
    metricLabel: 'Grounding Accuracy',
    quote:
      'Hallucination prevention was our top priority. NomadsChat’s strict document retrieval ensures our compliance guidelines are always honored accurately.',
    badge: 'FinTech Compliance',
  },
  {
    id: 't4',
    name: 'David K. Chen',
    role: 'Founder & Managing Director',
    company: 'Nexus Real Estate Solutions',
    avatar: avatarDavidChen,
    rating: 5,
    metric: '24/7',
    metricLabel: 'Automated Availability',
    quote:
      'Our buyers expect immediate property details at midnight. Setting up NomadsChat with custom colors to match our brand took less than 3 minutes.',
    badge: 'Real Estate',
  },
];

export const TestimonialsCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % TESTIMONIALS.length);
    }, 5500);
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
  const initials = activeTestimonial.name
    .split(' ')
    .map(part => part.charAt(0))
    .slice(0, 2)
    .join('');

  return (
    <section className="bg-zinc-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-zinc-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono block mb-1.5">
            Customer Results
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-heading">
            Trusted by high-velocity support teams
          </h2>
        </div>

        {/* Carousel controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handlePrev}
            className="p-2.5 bg-zinc-900 hover:bg-white hover:text-zinc-950 text-white border border-zinc-800 rounded-xl transition cursor-pointer active:scale-95"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-zinc-400 px-2 font-mono tabular-nums">
            0{currentIndex + 1} / 0{TESTIMONIALS.length}
          </span>
          <button
            type="button"
            onClick={handleNext}
            className="p-2.5 bg-zinc-900 hover:bg-white hover:text-zinc-950 text-white border border-zinc-800 rounded-xl transition cursor-pointer active:scale-95"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Testimonial Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch min-h-[220px]">
        {/* Metric Column */}
        <div className="md:col-span-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between">
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase font-mono block">
              {activeTestimonial.badge}
            </span>
            <div className="text-4xl sm:text-5xl font-black text-white tracking-tight font-mono tabular-nums pt-2">
              {activeTestimonial.metric}
            </div>
            <p className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5 pt-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{activeTestimonial.metricLabel}</span>
            </p>
          </div>

          <div className="pt-6 mt-6 border-t border-zinc-800 flex items-center gap-1 text-amber-400">
            {[...Array(activeTestimonial.rating)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
            ))}
            <span className="text-xs font-bold text-zinc-300 ml-2 font-mono tabular-nums">5.0 / 5.0</span>
          </div>
        </div>

        {/* Quote Column */}
        <div className="md:col-span-8 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-between relative">
          <Quote className="w-9 h-9 text-zinc-800 absolute top-5 right-6 pointer-events-none" />

          <p className="text-sm sm:text-base text-zinc-100 font-medium leading-relaxed mb-6 relative z-10 pr-8">
            “{activeTestimonial.quote}”
          </p>

          <div className="flex items-center gap-4 pt-4 border-t border-zinc-800">
            {!imgErrors[activeTestimonial.id] ? (
              <img
                src={activeTestimonial.avatar}
                alt={activeTestimonial.name}
                referrerPolicy="no-referrer"
                onError={() => setImgErrors(prev => ({ ...prev, [activeTestimonial.id]: true }))}
                className="w-12 h-12 rounded-full object-cover border border-zinc-700 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 text-white font-bold text-sm flex items-center justify-center shrink-0">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <h4 className="font-extrabold text-sm text-white truncate">{activeTestimonial.name}</h4>
              <p className="text-xs text-zinc-400 font-medium truncate">
                {activeTestimonial.role} · <strong className="text-zinc-200">{activeTestimonial.company}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination Indicators */}
      <div className="flex items-center justify-center gap-2 mt-6">
        {TESTIMONIALS.map((t, idx) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setIsAutoPlaying(false);
              setCurrentIndex(idx);
            }}
            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
              currentIndex === idx ? 'w-8 bg-white' : 'w-2 bg-zinc-700 hover:bg-zinc-500'
            }`}
            aria-label={`View testimonial ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
};
