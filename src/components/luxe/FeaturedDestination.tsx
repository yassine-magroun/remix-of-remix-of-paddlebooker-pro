import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { BRAND_IMAGES } from '@/lib/constants';

interface Props {
  onReserve: () => void;
}

export default function FeaturedDestination({ onReserve }: Props) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], ['8%', '-12%']);

  return (
    <section ref={ref} className="relative h-[100svh] min-h-[640px] w-full overflow-hidden flex items-center">
      <motion.img
        src={BRAND_IMAGES.featured}
        alt="Horizon turquoise — Zarzis"
        style={{ y }}
        className="absolute inset-0 w-full h-[120%] object-cover -top-[10%]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.2, 0, 0, 1] }}
          className="max-w-xl text-ivory"
        >
          <p className="font-sans text-[10px] uppercase tracking-[0.4em] text-ivory/70 mb-6">
            Destination du mois
          </p>
          <h2 className="font-serif text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.02] tracking-tighter font-medium mb-8">
            Zarzis,<br />
            <span className="italic font-normal">le sud qui scintille.</span>
          </h2>
          <p className="font-sans text-base md:text-lg text-ivory/80 leading-relaxed tracking-wide mb-10 max-w-md">
            Pagayez dans les eaux translucides du golfe de Boughrara et découvrez
            les bancs de sable cachés à quelques minutes de la côte.
          </p>
          <motion.button
            onClick={onReserve}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="px-10 py-4 border border-ivory/60 text-ivory rounded-full font-sans text-[11px] uppercase tracking-wider font-semibold hover:bg-ivory hover:text-dark transition-colors duration-500"
          >
            Réserver cette expérience
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
