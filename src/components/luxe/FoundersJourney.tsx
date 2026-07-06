import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { BRAND_IMAGES } from '@/lib/constants';
import { useLanguage } from '@/contexts/LanguageContext';

type JourneyPanel = {
  chapter: string;
  kicker: string;
  title: string;
  titleItalic: string;
  body: string;
  image: string;
};

const JOURNEY_FR: JourneyPanel[] = [
  {
    chapter: '01',
    kicker: "L'appel de l'eau",
    title: 'Deux âmes, une idée folle :',
    titleItalic: "offrir le calme là où tout n'est que mouvement.",
    body: "Tout a commencé par une conviction : l'eau guérit. Pas comme un médicament, pas comme une promesse — comme une évidence. Celle que ressent le corps quand il bascule sur une planche, que les bruits du monde s'effacent et qu'il ne reste plus que le son des vagues. C'est cette évidence que nous avons décidé de partager.",
    image: BRAND_IMAGES.gallery[0],
  },
  {
    chapter: '02',
    kicker: 'Le pari',
    title: 'Convaincre que la mer',
    titleItalic: 'est une thérapie.',
    body: "Comment offrir ce silence précieux que l'on ne trouve qu'au large ? Comment faire sentir, avant même que l'on pose un pied sur la planche, que l'eau a une énergie que nulle autre chose ne donne ? Ce pari — éduquer, inviter, faire confiance — est au cœur de ce que nous construisons chaque jour.",
    image: BRAND_IMAGES.gallery[3],
  },
  {
    chapter: '03',
    kicker: 'La Maison',
    title: 'Zarzis n\'est pas une ville.',
    titleItalic: "C'est un sentiment.",
    body: "Hessi Jerbi, au coucher du soleil, ressemble à un tableau vivant que l'on ne peut ni acheter ni reproduire. Nos équipes le capturent, session après session, pour que chaque client emporte sa part d'infini. La Maison, c'est ça : un endroit où l'on revient non pas pour ce que l'on y fait, mais pour ce que l'on y ressent.",
    image: BRAND_IMAGES.gallery[5],
  },
  {
    chapter: '04',
    kicker: "L'expérience",
    title: "On ne vous explique pas l'idée.",
    titleItalic: 'On vous la fait vivre.',
    body: "Les sessions se remplissent au bouche-à-oreille. Des couples, des familles, des voyageurs qui cherchent autre chose qu'une activité — quelque chose qu'ils emporteront. Chaque planche qui glisse sur l'eau de Zarzis emporte avec elle quelque chose d'intraduisible. Venez le ressentir.",
    image: BRAND_IMAGES.gallery[7],
  },
];

const JOURNEY_EN: JourneyPanel[] = [
  {
    chapter: '01',
    kicker: 'The Call of Water',
    title: 'Two souls, one wild idea:',
    titleItalic: 'bring stillness to a world that never stops.',
    body: "It started with a conviction: water heals. Not like medicine, not like a promise — like an obvious truth. The kind your body knows the moment it balances on a board, when the noise of the world fades and all that remains is the sound of waves. That truth is what we set out to share.",
    image: BRAND_IMAGES.gallery[0],
  },
  {
    chapter: '02',
    kicker: 'The Wager',
    title: 'Convince the world',
    titleItalic: 'that the sea is therapy.',
    body: "How do you offer that rare silence found only offshore? How do you make someone feel — before they even step on the board — that water holds an energy nothing else gives? That wager — educating, trusting, inviting — is at the heart of everything we build, each day.",
    image: BRAND_IMAGES.gallery[3],
  },
  {
    chapter: '03',
    kicker: 'Home',
    title: 'Zarzis is not a town.',
    titleItalic: "It's a feeling.",
    body: "At sunset, Hessi Jerbi looks like a living painting no money can buy and no lens can fully capture. Our teams try, session after session, so every guest leaves with their own piece of infinity. Home is this: a place you return to not for what you do there, but for what you feel.",
    image: BRAND_IMAGES.gallery[5],
  },
  {
    chapter: '04',
    kicker: 'The Experience',
    title: "We don't explain the idea.",
    titleItalic: 'We let you live it.',
    body: "Sessions fill up by word of mouth. Couples, families, travelers chasing something they can't quite name. An experience they'll carry home. Every board that glides on the water of Zarzis carries something untranslatable. Come feel it.",
    image: BRAND_IMAGES.gallery[7],
  },
];

export default function FoundersJourney() {
  const { lang } = useLanguage();
  const panels = lang === 'en' ? JOURNEY_EN : JOURNEY_FR;
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });

  const x = useTransform(scrollYProgress, [0, 1], ['0%', `-${(panels.length - 1) * 100}%`]);
  const progressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  const intro = lang === 'en' ? 'Founders journey' : 'Le parcours des fondateurs';
  const introTitle =
    lang === 'en' ? (
      <>
        Four chapters.<br />
        <span className="italic font-normal">One brand, built by hand.</span>
      </>
    ) : (
      <>
        Quatre chapitres.<br />
        <span className="italic font-normal">Une marque, forgée à la main.</span>
      </>
    );
  const hint = lang === 'en' ? 'Scroll to read' : 'Faites défiler pour lire';

  return (
    <section
      ref={ref}
      className="relative bg-dark text-ivory"
      style={{ height: `${panels.length * 100}vh` }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div className="absolute top-0 left-0 right-0 z-20 px-6 md:px-12 pt-20 md:pt-24 pointer-events-none">
          <div className="max-w-6xl mx-auto flex items-start justify-between gap-6">
            <div>
              <p className="font-ui text-[10px] uppercase tracking-[0.4em] text-ivory/60 mb-3">
                {intro}
              </p>
              <h2 className="font-serif text-[clamp(1.75rem,3.2vw,2.5rem)] leading-[1.05] tracking-tight font-medium max-w-md">
                {introTitle}
              </h2>
            </div>
            <div className="hidden md:flex items-center gap-3 pt-2">
              <span className="font-ui text-[10px] uppercase tracking-[0.3em] text-ivory/50">
                {hint}
              </span>
              <motion.span
                aria-hidden
                className="inline-block text-ivory/60"
                animate={{ x: [0, 6, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                →
              </motion.span>
            </div>
          </div>
        </div>

        <motion.div style={{ x }} className="flex h-full will-change-transform">
          {panels.map((panel, i) => (
            <JourneyPanelSlide key={panel.chapter} panel={panel} index={i} total={panels.length} />
          ))}
        </motion.div>

        <div className="absolute bottom-0 inset-x-0 z-20 px-6 md:px-12 pb-6">
          <div className="max-w-6xl mx-auto">
            <div className="h-[2px] w-full bg-ivory/10 overflow-hidden rounded-full">
              <motion.div
                style={{ width: progressWidth }}
                className="h-full bg-accent-gold origin-left"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function JourneyPanelSlide({
  panel,
  index,
  total,
}: {
  panel: JourneyPanel;
  index: number;
  total: number;
}) {
  return (
    <div className="relative shrink-0 w-screen h-screen flex items-center px-6 md:px-12">
      <img
        src={panel.image}
        alt=""
        aria-hidden
        loading={index === 0 ? 'eager' : 'lazy'}
        className="absolute inset-0 w-full h-full object-cover opacity-35"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-dark via-dark/85 to-dark/40" />
      <div className="absolute inset-0 bg-gradient-to-b from-dark/40 via-transparent to-dark/60" />

      <div className="relative z-10 max-w-6xl mx-auto w-full grid md:grid-cols-12 gap-10 items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.4 }}
          transition={{ duration: 0.8, ease: [0.2, 0, 0, 1] }}
          className="md:col-span-7"
        >
          <div className="flex items-center gap-4 mb-8">
            <span className="font-serif text-5xl md:text-6xl italic font-light text-accent-gold leading-none">
              {panel.chapter}
            </span>
            <span className="h-px w-12 bg-ivory/30" />
            <span className="font-ui text-[10px] uppercase tracking-[0.4em] text-ivory/60">
              {panel.kicker}
            </span>
          </div>

          <h3 className="font-serif text-[clamp(2.25rem,5.5vw,4.5rem)] leading-[1.02] tracking-tighter font-medium mb-8">
            {panel.title}
            <br />
            <span className="italic font-normal text-ivory/85">{panel.titleItalic}</span>
          </h3>

          <p className="font-ui text-base md:text-lg leading-relaxed text-ivory/80 max-w-2xl">
            {panel.body}
          </p>

          <div className="mt-10 font-ui text-[10px] uppercase tracking-[0.35em] text-ivory/40 tabular-nums">
            {String(index + 1).padStart(2, '0')} <span className="opacity-50">/</span>{' '}
            {String(total).padStart(2, '0')}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: false, amount: 0.4 }}
          transition={{ duration: 1, ease: [0.2, 0, 0, 1] }}
          className="hidden md:block md:col-span-5"
        >
          <div className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border border-ivory/10">
            <img
              src={panel.image}
              alt={panel.kicker}
              loading={index === 0 ? 'eager' : 'lazy'}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark/60 via-transparent to-transparent" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
