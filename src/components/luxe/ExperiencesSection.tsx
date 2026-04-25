import { EXPERIENCE_CATALOG } from '@/lib/constants';
import ExperienceCard from './ExperienceCard';

interface Props {
  onReserve: (experienceId: string) => void;
}

export default function ExperiencesSection({ onReserve }: Props) {
  return (
    <section className="relative bg-ivory py-24 md:py-36">
      <div className="max-w-7xl mx-auto px-6 md:px-12 mb-16 md:mb-20 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <p className="font-sans text-[10px] uppercase tracking-[0.4em] text-dark-secondary mb-5">
            Les activités
          </p>
          <h2 className="font-serif text-[clamp(2.25rem,5vw,4rem)] leading-[1.02] tracking-tighter font-medium text-dark">
            Nos expériences,<br />
            <span className="italic font-normal">à votre rythme.</span>
          </h2>
        </div>
        <p className="font-sans text-sm text-dark-secondary max-w-sm leading-relaxed">
          Quatre rituels pensés pour le lever du jour, l'entre-deux, ou la lumière déclinante.
          Faites défiler, choisissez.
        </p>
      </div>

      <div
        className="flex gap-6 md:gap-8 overflow-x-auto snap-x snap-mandatory scroll-smooth px-6 md:px-12 pb-8"
        style={{ WebkitOverflowScrolling: 'touch', scrollPaddingInline: '1.5rem' }}
      >
        {EXPERIENCE_CATALOG.map((experience) => (
          <ExperienceCard
            key={experience.id}
            experience={experience}
            onReserve={onReserve}
          />
        ))}
        <div aria-hidden className="shrink-0 w-4 md:w-8" />
      </div>
    </section>
  );
}
