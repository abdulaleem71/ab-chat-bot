import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { ProductCard } from '../../types';
import { ExternalLink, ChevronLeft, ChevronRight, ShoppingBag, Check } from 'lucide-react';

interface ProductCarouselProps {
  products: ProductCard[];
  primaryColor?: string;
  onSelectProduct?: (product: ProductCard) => void;
}

export const ProductCarousel: React.FC<ProductCarouselProps> = ({
  products,
  primaryColor = '#000000',
  onSelectProduct,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!products || products.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="my-2.5 w-full max-w-full relative group/carousel">
      {/* Carousel Navigation Header */}
      <div className="flex items-center justify-between mb-1.5 px-0.5">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-700">
          <ShoppingBag className="w-3.5 h-3.5 text-zinc-900" />
          <span>Recommended Products ({products.length})</span>
        </div>
        {products.length > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => scroll('left')}
              className="p-1 rounded-full bg-white border border-zinc-200 shadow-2xs hover:bg-zinc-100 text-zinc-600 transition cursor-pointer"
              title="Previous"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              className="p-1 rounded-full bg-white border border-zinc-200 shadow-2xs hover:bg-zinc-100 text-zinc-600 transition cursor-pointer"
              title="Next"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Horizontal Scroll Area */}
      <div
        ref={scrollRef}
        className="flex gap-2.5 overflow-x-auto pb-2 pt-0.5 scrollbar-thin snap-x snap-mandatory scroll-smooth px-0.5"
        style={{ scrollbarWidth: 'thin' }}
      >
        {products.map((p, idx) => {
          const formattedPrice = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: p.currency || 'USD',
          }).format(p.price);

          return (
            <motion.div
              key={p.id || idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: idx * 0.05 }}
              className="min-w-[190px] max-w-[210px] shrink-0 snap-start bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition duration-200"
            >
              {/* Product Image */}
              <div className="relative w-full h-28 bg-zinc-100 overflow-hidden group">
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt={p.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-zinc-400">
                    <ShoppingBag className="w-8 h-8 opacity-40" />
                  </div>
                )}
                {p.inStock !== false ? (
                  <span className="absolute top-2 left-2 bg-emerald-500/90 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-xs">
                    In Stock
                  </span>
                ) : (
                  <span className="absolute top-2 left-2 bg-zinc-800/90 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-xs">
                    Out of Stock
                  </span>
                )}
                {p.productUrl && (
                  <a
                    href={p.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black text-white rounded-full transition shadow-xs cursor-pointer"
                    title="Open product page"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Product Details */}
              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 line-clamp-1 leading-snug" title={p.title}>
                    {p.title}
                  </h4>
                  {p.variantTitle && (
                    <p className="text-[10px] text-zinc-500 font-medium truncate mt-0.5">
                      {p.variantTitle}
                    </p>
                  )}
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <span className="text-xs font-extrabold text-zinc-950">
                      {formattedPrice}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-2.5 pt-2 border-t border-zinc-100 flex items-center gap-1.5">
                  <a
                    href={p.productUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ backgroundColor: primaryColor }}
                    className="flex-1 text-center py-1.5 px-2 text-white text-[11px] font-bold rounded-xl shadow-2xs hover:opacity-90 transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Select</span>
                    <ExternalLink className="w-3 h-3 opacity-80" />
                  </a>
                  {onSelectProduct && (
                    <button
                      type="button"
                      onClick={() => onSelectProduct(p)}
                      className="p-1.5 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-600 transition cursor-pointer"
                      title="Ask bot about this product"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
