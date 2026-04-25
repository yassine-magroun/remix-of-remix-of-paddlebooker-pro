import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { Layout } from '@/components/Layout';
import BookingSystem from '@/components/luxe/BookingSystem';
import Chatbot from '@/components/luxe/Chatbot';
import EmblaGallery from '@/components/luxe/EmblaGallery';
import WeatherBadge from '@/components/luxe/WeatherBadge';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  BRAND_IMAGES,
  BRAND_SLOGAN_AR,
  BRAND_SLOGAN_FR,
  EXPERIENCE_CATALOG,
  GROUP_RATE,
  HERO_IMAGES,
  HERO_VIDEOS,
  LOCATION,
  MEETING_POINT,
  PRICING,
} from '@/lib/constants';
import { formatPrice } from '@/lib/utils-booking';

const TAGLINE_CHARS = Array.from(BRAND_SLOGAN_AR);

export default function Home() {
  return (
    <Layout>
      <HeroSection />
      <ActivitiesSection />
      <ImmersiveVideo />
      <StorySection />
      <FoundersJourney />
      <GallerySection />
      <BookSection />
      <LocationSection />
      <FinalCta />
      <Chatbot />
    </Layout>
  );
}

function HeroSection() {
  const [typedCount, setTypedCount] = useState(0);

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      if (i < TAGLINE_CHARS.length) {
        i++;
        setTypedCount(i);
      } else {
        clearInterval(id);
      }
    }, 130);
    return () => clearInterval(id);
  }, []);

  const typed = TAGLINE_CHARS.slice(0, typedCount).join('');
  const done = typedCount === TAGLINE_CHARS.length;

  return (
    <section
      className="relative h-[92svh] min-h-[640px] w-full overflow-hidden -mt-16 md:-mt-20 flex items-center justify-center"
      style={{ background: '#000' }}
    >
      {/* Vidéo plein-écran — fond noir pur derrière, pas de poster pour éviter le flash */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      >
        <source src={HERO_VIDEOS[0]} type="video/mp4" />
        <source src={HERO_VIDEOS[0]} type="video/quicktime" />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Weather badge */}
      <div className="absolute top-20 md:top-24 right-4 md:right-8 z-20">
        <WeatherBadge />
      </div>

      {/* Contenu centré */}
      <div className="relative z-10 text-center text-ivory px-6 max-w-4xl flex flex-col items-center">
        {/* Logo hero — fade-in + zoom arrière, transparent par nature SVG */}
        <motion.img
          src={BRAND_IMAGES.logo}
          alt="Alo Paddle"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: [0.2, 0, 0, 1] }}
          className="w-44 h-44 md:w-64 md:h-64 object-contain mb-6"
          style={{ background: 'transparent' }}
        />

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="font-ui text-[10px] md:text-xs uppercase tracking-[0.4em] text-ivory/70 mb-8"
        >
          Sport Nautique · Zarzis, Tunisie
        </motion.p>

        {/* Slogan arabe — typing effect */}
        <h1
          dir="rtl"
          lang="ar"
          className="font-serif text-[clamp(3rem,9vw,7rem)] leading-[1.15] font-medium min-h-[1.2em]"
        >
          {typed}
          {!done && (
            <span className="inline-block w-[0.05em] animate-typing-cursor text-accent-gold ml-1">
              |
            </span>
          )}
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: done ? 1 : 0 }}
          transition={{ duration: 0.8 }}
          className="font-ui text-[11px] uppercase tracking-[0.35em] text-accent-gold/90 mt-4"
        >
          {BRAND_SLOGAN_FR}
        </motion.p>

        <motion.a
          href="#book"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.8 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="inline-block mt-12 px-10 py-4 rounded-full bg-ivory text-dark font-ui text-[11px] uppercase tracking-[0.25em] font-semibold shadow-lg hover:shadow-xl transition-shadow"
        >
          Réserver maintenant
        </motion.a>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
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

function ActivitiesSection() {
  return (
    <section id="experiences" className="py-20 md:py-28 px-6 md:px-12 bg-ivory scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
          className="mb-12 md:mb-16 max-w-2xl"
        >
          <p className="font-ui text-[10px] uppercase tracking-[0.4em] text-dark-secondary mb-4">
            Nos expériences
          </p>
          <h2 className="font-serif text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.05] tracking-tighter font-medium text-dark">
            Paddle · Kayak · Wakeboard.<br />
            <span className="italic font-normal">Trois signatures, une même mer.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-7">
          {EXPERIENCE_CATALOG.map((exp, i) => (
            <motion.a
              key={exp.id}
              href="#book"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px 0px -60px 0px' }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.2, 0, 0, 1] }}
              whileHover={{ y: -4 }}
              className="group block rounded-3xl overflow-hidden bg-dark text-ivory relative hover:shadow-2xl transition-shadow"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <motion.img
                  src={exp.imageUrl}
                  alt={exp.name}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.9, ease: [0.2, 0, 0, 1] }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                <span className="absolute top-4 left-4 px-3 py-1 bg-ivory/95 rounded-full font-ui text-[10px] uppercase tracking-wider text-dark font-semibold">
                  {exp.duration}
                </span>
                <div className="absolute bottom-0 inset-x-0 p-6">
                  <h3 className="font-serif text-3xl tracking-tight">{exp.name}</h3>
                  <p className="font-ui text-xs text-ivory/80 mt-2 leading-relaxed line-clamp-2">
                    {exp.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-ui text-[10px] uppercase tracking-wider text-ivory/70">
                      dès {formatPrice(PRICING.basePriceTnd)}
                    </span>
                    <span className="font-ui text-[11px] uppercase tracking-wider text-accent-gold group-hover:translate-x-1 transition-transform">
                      Réserver →
                    </span>
                  </div>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}

function ImmersiveVideo() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  return (
    <section
      ref={ref}
      className="relative h-[90svh] min-h-[520px] w-full overflow-hidden bg-dark"
    >
      <video
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="none"
        poster={HERO_IMAGES.wake}
      >
        <source src={HERO_VIDEOS[1]} type="video/mp4" />
        <source src={HERO_VIDEOS[1]} type="video/quicktime" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/10" />

      <motion.div
        style={{ opacity }}
        className="relative z-10 h-full flex items-center px-6 md:px-16"
      >
        <div className="max-w-xl text-ivory">
          <p className="font-ui text-[10px] uppercase tracking-[0.4em] text-ivory/70 mb-5">
            Expérience immersive
          </p>
          <h2 className="font-serif text-[clamp(2.25rem,5vw,4rem)] leading-[1.05] tracking-tighter font-medium">
            Le silence de l'eau,<br />
            <span className="italic font-normal">le grondement du vent.</span>
          </h2>
          <p className="font-ui text-base md:text-lg text-ivory/85 leading-relaxed mt-6 max-w-md">
            Chaque session est un instant suspendu. Laissez Zarzis vous dicter le rythme.
          </p>
        </div>
      </motion.div>
    </section>
  );
}

function StorySection() {
  return (
    <section className="py-20 md:py-28 px-6 md:px-12 bg-ivory-light">
      <div className="max-w-3xl mx-auto text-center">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8 }}
          className="font-ui text-[10px] uppercase tracking-[0.4em] text-dark-secondary mb-5"
        >
          Notre histoire
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-serif text-[clamp(1.75rem,3.6vw,2.75rem)] leading-[1.15] tracking-tight font-medium text-dark"
        >
          Deux âmes, une idée folle.<br />
          <span className="italic font-normal">Offrir le calme là où tout n'est que mouvement.</span>
        </motion.h2>
      </div>
    </section>
  );
}

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

function FoundersJourney() {
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
            <JourneyPanel key={panel.chapter} panel={panel} index={i} total={panels.length} />
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

function JourneyPanel({
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

function GallerySection() {
  return (
    <section id="gallery" className="py-20 md:py-28 bg-ivory scroll-mt-20">
      <div className="max-w-6xl mx-auto mb-10 md:mb-14 px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"
        >
          <div>
            <p className="font-ui text-[10px] uppercase tracking-[0.4em] text-dark-secondary mb-4">
              Galerie
            </p>
            <h2 className="font-serif text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.05] tracking-tighter font-medium text-dark">
              Instants <span className="italic font-normal">de mer.</span>
            </h2>
          </div>
          <p className="font-ui text-sm text-dark-secondary max-w-xs">
            Faites glisser pour parcourir les sessions.
          </p>
        </motion.div>
      </div>

      <EmblaGallery />
    </section>
  );
}

function BookSection() {
  return (
    <section id="book" className="py-20 md:py-28 px-6 md:px-12 bg-ivory-light scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-8 md:mb-10"
        >
          <p className="font-ui text-[10px] uppercase tracking-[0.4em] text-dark-secondary mb-4">
            Réservation
          </p>
          <h2 className="font-serif text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.05] tracking-tighter font-medium text-dark">
            Réservez en quelques secondes.
          </h2>
          <p className="font-ui text-sm text-dark-secondary mt-3 max-w-lg mx-auto">
            Rendez-vous à <strong>{MEETING_POINT}</strong>. Un acompte de 40 % confirme votre session.
          </p>

          <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-3">
            <span className="px-3 py-1 rounded-full bg-ivory border border-border-soft font-ui text-xs text-dark">
              Session 1h · {formatPrice(PRICING.basePriceTnd)}
            </span>
            <span className="px-3 py-1 rounded-full bg-ivory border border-border-soft font-ui text-xs text-dark">
              Heure sup. · +{formatPrice(PRICING.extraHourTnd)}
            </span>
            <span className="px-3 py-1 rounded-full bg-dark text-ivory font-ui text-xs font-semibold">
              Groupe {GROUP_RATE.minPax}–{GROUP_RATE.maxPax} pax · {formatPrice(GROUP_RATE.priceTnd)}
            </span>
          </div>
        </motion.div>

        <BookingSystem />
      </div>
    </section>
  );
}

function LocationSection() {
  return (
    <section className="py-20 md:py-28 px-6 md:px-12 bg-ivory">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
          className="mb-10 md:mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-4"
        >
          <div>
            <p className="font-ui text-[10px] uppercase tracking-[0.4em] text-dark-secondary mb-4">
              Point de rendez-vous
            </p>
            <h2 className="font-serif text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.05] tracking-tighter font-medium text-dark">
              {LOCATION.name}
            </h2>
            <p className="font-ui text-sm text-dark-secondary mt-2">{LOCATION.address}</p>
          </div>
          <WeatherBadge />
        </motion.div>

        <div className="rounded-3xl overflow-hidden shadow-xl border border-border-soft">
          <iframe
            title="Alo Paddle · Zarzis"
            src={LOCATION.mapsEmbed}
            width="100%"
            height="420"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full"
          />
          <div className="bg-ivory p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-dark/5 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-dark" />
              </div>
              <div>
                <p className="font-ui text-sm font-semibold text-dark">{LOCATION.address}</p>
                <p className="font-ui text-xs text-dark-secondary">
                  Vent &gt; 20 km/h : sortie déconseillée pour votre sécurité.
                </p>
              </div>
            </div>
            <a
              href={LOCATION.mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="font-ui text-xs font-semibold text-dark hover:text-accent-gold transition-colors shrink-0"
            >
              Voir sur Maps →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative py-24 md:py-32 px-6 md:px-12 overflow-hidden">
      <img
        src={HERO_IMAGES.wake}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/60" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-3xl mx-auto text-center text-ivory"
      >
        <h2 className="font-serif text-[clamp(2.25rem,5vw,4rem)] leading-[1.05] tracking-tighter font-medium">
          Prêt à prendre le large ?
        </h2>
        <p className="font-ui text-base md:text-lg text-ivory/80 mt-5 max-w-lg mx-auto">
          Cinq sessions par jour. Une expérience qui grandit par le bouche à oreille.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#book"
            className="px-10 py-4 rounded-full bg-ivory text-dark font-ui text-[11px] uppercase tracking-[0.25em] font-semibold hover:bg-accent-gold transition-colors"
          >
            Réserver ma session
          </a>
          <Link
            to="/contact"
            className="px-10 py-4 rounded-full border border-ivory/60 text-ivory font-ui text-[11px] uppercase tracking-[0.25em] font-semibold hover:bg-ivory hover:text-dark transition-colors"
          >
            Nous contacter
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
