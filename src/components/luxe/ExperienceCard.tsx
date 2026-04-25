import { motion } from 'framer-motion';
import type { Experience } from '@/lib/types';
import { formatPrice } from '@/lib/utils-booking';

interface Props {
  experience: Experience;
  onReserve: (id: string) => void;
}

export default function ExperienceCard({ experience, onReserve }: Props) {
  return (
    <motion.article
      className="snap-center shrink-0 w-[82vw] md:w-[420px] bg-ivory border border-border-soft rounded-xl overflow-hidden flex flex-col"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -80px 0px' }}
      transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
      whileHover={{ y: -4 }}
    >
      <div className="relative aspect-[4/5] md:aspect-[4/3] overflow-hidden bg-ivory-light">
        <motion.img
          src={experience.imageUrl}
          alt={experience.name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
          whileHover={{ scale: 1.06 }}
          transition={{ duration: 0.8, ease: [0.2, 0, 0, 1] }}
        />
        <span className="absolute top-4 left-4 px-3 py-1 bg-ivory/95 backdrop-blur-sm rounded-full font-sans text-[10px] uppercase tracking-wider text-dark font-semibold">
          {experience.duration}
        </span>
      </div>

      <div className="p-7 md:p-8 flex flex-col gap-5 flex-1">
        <div>
          <h3 className="font-serif text-3xl text-dark leading-tight mb-3 tracking-tight">
            {experience.name}
          </h3>
          <p className="font-sans text-sm text-dark-secondary leading-relaxed tracking-wide">
            {experience.description}
          </p>
        </div>

        <div className="mt-auto pt-5 border-t border-border-soft flex items-end justify-between gap-3">
          <div>
            <p className="font-sans text-[10px] uppercase tracking-wider text-dark-secondary mb-1">
              À partir de
            </p>
            <p className="font-serif text-2xl font-semibold text-accent-gold">
              {formatPrice(experience.basePrice)}
            </p>
          </div>
          <motion.button
            onClick={() => onReserve(experience.id)}
            whileHover={{ x: 3 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-dark text-ivory rounded-full font-sans text-[11px] uppercase tracking-wider font-semibold"
          >
            Explorez <span aria-hidden>→</span>
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}
