import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BRAND_IMAGES } from '@/lib/constants';

function GalleryItem({ src, index }: { src: string; index: number }) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.06 }}
      className="shrink-0 w-[78vw] sm:w-[52vw] md:w-[420px] aspect-[4/5] rounded-2xl overflow-hidden bg-ivory-light"
    >
      <img
        src={src}
        alt={`Alo Paddle · Zarzis ${index + 1}`}
        loading="lazy"
        onError={() => setHidden(true)}
        className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
      />
    </motion.div>
  );
}

export default function EmblaGallery() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: true,
    dragFree: true,
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setCanPrev(emblaApi.canScrollPrev());
      setCanNext(emblaApi.canScrollNext());
    };
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    onSelect();
  }, [emblaApi]);

  return (
    <div className="relative">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex gap-4 md:gap-6 px-6 md:px-12">
          {BRAND_IMAGES.gallery.map((src, i) => (
            <GalleryItem key={src} src={src} index={i} />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 px-6 md:px-12 mt-5">
        <button
          type="button"
          onClick={scrollPrev}
          disabled={!canPrev}
          className="w-11 h-11 rounded-full border border-border-soft bg-ivory text-dark flex items-center justify-center hover:bg-ivory-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Précédent"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={scrollNext}
          disabled={!canNext}
          className="w-11 h-11 rounded-full border border-border-soft bg-ivory text-dark flex items-center justify-center hover:bg-ivory-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Suivant"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
