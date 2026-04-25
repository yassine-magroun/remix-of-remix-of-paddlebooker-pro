import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { BRAND_IMAGES, BRAND_SLOGAN_AR, BRAND_SLOGAN_FR } from '@/lib/constants';

interface HeroProps {
  onReserve: () => void;
}

const TAGLINE = BRAND_SLOGAN_AR;
const TAGLINE_CHARS = Array.from(TAGLINE);

export default function Hero({ onReserve }: HeroProps) {
  const [typedCount, setTypedCount] = useState(0);
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const overlayOpacity = useTransform(scrollYProgress, [0, 1], [0.45, 0.8]);

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      if (i < TAGLINE_CHARS.length) {
        i++;
        setTypedCount(i);
      } else {
        clearInterval(id);
      }
    }, 110);
    return () => clearInterval(id);
  }, []);

  const typed = TAGLINE_CHARS.slice(0, typedCount).join('');

  return (
    <section ref={ref} className="relative h-[100svh] w-full overflow-hidden flex items-center justify-center bg-dark">
      <motion.div className="absolute inset-0 z-0" style={{ y: imageY }}>
        <img
          src={BRAND_IMAGES.hero}
          alt="Paddle au lever du jour — Zarzis"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </motion.div>

      <motion.div
        className="absolute inset-0 z-10 bg-gradient-to-b from-black/15 via-transparent to-black"
        style={{ opacity: overlayOpacity }}
      />

      <div className="relative z-20 text-center text-ivory px-6 max-w-4xl">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-sans text-[10px] md:text-xs uppercase tracking-[0.4em] text-ivory/70 mb-8"
        >
          Sport Nautique — Zarzis, Tunisie
        </motion.p>

        <h1
          dir="rtl"
          lang="ar"
          className="font-serif text-[clamp(3rem,8vw,6.5rem)] leading-[1.15] font-medium mb-4 min-h-[1.2em]"
        >
          {typed}
          {typedCount < TAGLINE_CHARS.length && (
            <span className="inline-block w-[0.05em] align-baseline animate-typing-cursor text-accent-gold">|</span>
          )}
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="font-sans text-[11px] uppercase tracking-[0.35em] text-accent-gold/90 mt-2"
        >
          {BRAND_SLOGAN_FR}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.8 }}
          className="font-sans text-base md:text-lg text-ivory/80 max-w-xl mx-auto mt-10 leading-relaxed tracking-wide"
        >
          Réservez votre paddle board pour une expérience aquatique unique,
          dans les eaux turquoise du Sud tunisien.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 2.2 }}
          className="mt-12 flex items-center justify-center gap-8"
        >
          <motion.button
            onClick={onReserve}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="px-10 py-4 bg-accent-gold text-dark rounded-full font-sans text-[11px] uppercase tracking-wider font-semibold shadow-lg hover:shadow-xl transition-shadow"
          >
            Réserver maintenant
          </motion.button>
        </motion.div>
      </div>

      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-6 h-10 border border-ivory/50 rounded-full flex items-start justify-center p-1.5">
          <motion.span
            className="w-1 h-2 bg-ivory rounded-full"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  );
}
