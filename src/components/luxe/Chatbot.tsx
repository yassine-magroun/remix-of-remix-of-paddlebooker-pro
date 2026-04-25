import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, X, MapPin } from 'lucide-react';
import {
  BOOKING_SESSIONS,
  MEETING_POINT,
  PRICING,
  BRAND_SLOGAN_AR,
  WEATHER,
} from '@/lib/constants';
import { formatPrice } from '@/lib/utils-booking';

interface Message {
  id: string;
  from: 'bot' | 'user';
  text: string;
  link?: { label: string; url: string };
}

interface Topic {
  id: string;
  prompt: string;
  buildAnswer: () => { text: string; link?: { label: string; url: string } };
}

const SPOTS = {
  weekday: {
    name: 'Plage Jwabi',
    url: 'https://maps.app.goo.gl/dSvwmdJXUkpomcCh8?g_st=ic',
  },
  weekend: {
    name: 'Plage Hessi Jerbi',
    url: 'https://maps.app.goo.gl/JcJorbPFy9xSXuHPA?g_st=ic',
  },
};

function getTodaySpot() {
  const day = new Date().getDay(); // 0=Sun, 1=Mon … 6=Sat
  return day === 0 || day >= 5 ? SPOTS.weekend : SPOTS.weekday;
}

function getSpotForDate(dateStr: string) {
  if (!dateStr) return getTodaySpot();
  const day = new Date(dateStr).getDay();
  return day === 0 || day >= 5 ? SPOTS.weekend : SPOTS.weekday;
}

const greeting = (): Message => ({
  id: crypto.randomUUID(),
  from: 'bot',
  text: `Bienvenue chez Alo Paddle — ${BRAND_SLOGAN_AR}. Que souhaitez-vous savoir ?`,
});

const TOPICS: Topic[] = [
  {
    id: 'prices',
    prompt: 'Tarifs',
    buildAnswer: () => ({
      text: `Session Paddle 1h : ${formatPrice(PRICING.basePriceTnd)}. Heure sup. : +${formatPrice(PRICING.extraHourTnd)}. Kayak Transparent (25 min) : 50 TND. Paddle Vélo (1h) : 60 TND. Un acompte de ${Math.round(PRICING.depositRate * 100)} % confirme la réservation.`,
    }),
  },
  {
    id: 'hours',
    prompt: 'Horaires',
    buildAnswer: () => ({
      text: `Cinq sessions quotidiennes : ${BOOKING_SESSIONS.join(', ')}. Les créneaux du matin offrent la meilleure lumière et les eaux les plus calmes.`,
    }),
  },
  {
    id: 'spot',
    prompt: 'Spot du jour',
    buildAnswer: () => {
      const spot = getTodaySpot();
      const day = new Date().getDay();
      const period = day === 0 || day >= 5 ? 'Vendredi–Dimanche' : 'Lundi–Jeudi';
      return {
        text: `Spot actif (${period}) : ${spot.name}. Notre équipe vous attend 15 min avant le départ pour l'équipement et le briefing sécurité.`,
        link: { label: `Voir ${spot.name} sur Maps`, url: spot.url },
      };
    },
  },
  {
    id: 'spots-schedule',
    prompt: 'Spots & planning',
    buildAnswer: () => ({
      text: `Lundi – Jeudi : ${SPOTS.weekday.name}. Vendredi – Dimanche : ${SPOTS.weekend.name}. Les deux spots sont à Zarzis, à quelques minutes l'un de l'autre.`,
      link: { label: 'Spot Jwabi (Lun-Jeu)', url: SPOTS.weekday.url },
    }),
  },
  {
    id: 'weather',
    prompt: 'Météo & annulations',
    buildAnswer: () => ({
      text: `Nous surveillons le vent en temps réel. Si les rafales dépassent ${WEATHER.windDangerKmh} km/h, la sortie est reportée et votre acompte intégralement remboursé. La sécurité prime toujours.`,
    }),
  },
  {
    id: 'story',
    prompt: 'Qui sommes-nous ?',
    buildAnswer: () => ({
      text: `Alo Paddle est né de deux jumeaux — l'un étudiant à Tunis, l'autre vivant en France. Séparés par la distance mais unis par la mer de Zarzis, ils ont bâti une équipe locale de passionnés. Tout a grandi par le bouche à oreille.`,
    }),
  },
];

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([greeting()]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const ask = (topic: Topic) => {
    const { text, link } = topic.buildAnswer();
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), from: 'user', text: topic.prompt },
      { id: crypto.randomUUID(), from: 'bot', text, link },
    ]);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
            className="fixed bottom-24 right-4 md:right-6 z-50 w-[90vw] max-w-sm h-[520px] bg-ivory border border-border-soft rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-soft bg-dark text-ivory shrink-0">
              <div>
                <p className="font-sans text-[9px] uppercase tracking-[0.4em] text-ivory/60">
                  Concierge
                </p>
                <p className="font-serif text-lg leading-none mt-1">Alo Paddle</p>
              </div>
              <div className="flex items-center gap-3">
                <SpotPill />
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-ivory/10 flex items-center justify-center"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-ivory-light/40"
            >
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`max-w-[85%] flex flex-col gap-1.5 ${
                    m.from === 'user' ? 'ml-auto items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`px-4 py-2.5 rounded-2xl font-sans text-sm leading-relaxed ${
                      m.from === 'bot'
                        ? 'bg-ivory text-dark rounded-tl-sm border border-border-soft'
                        : 'bg-dark text-ivory rounded-tr-sm'
                    }`}
                  >
                    {m.text}
                  </div>
                  {m.link && (
                    <a
                      href={m.link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-gold/20 border border-accent-gold/40 font-sans text-xs text-dark font-medium hover:bg-accent-gold/40 transition-colors"
                    >
                      <MapPin className="w-3 h-3 shrink-0" />
                      {m.link.label}
                    </a>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Quick replies */}
            <div className="px-4 py-3 border-t border-border-soft bg-ivory shrink-0">
              <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-dark-secondary mb-2">
                Questions fréquentes
              </p>
              <div className="flex flex-wrap gap-2">
                {TOPICS.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => ask(topic)}
                    className="px-3 py-1.5 rounded-full bg-ivory-light border border-border-soft font-sans text-xs text-dark hover:bg-accent-gold hover:border-accent-gold hover:text-dark transition-colors"
                  >
                    {topic.prompt}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-4 md:right-6 z-50 w-14 h-14 bg-dark text-ivory rounded-full shadow-xl flex items-center justify-center"
        aria-label={open ? 'Fermer le chat' : 'Ouvrir le chat'}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="x"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-5 h-5" />
            </motion.span>
          ) : (
            <motion.span
              key="msg"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageCircle className="w-5 h-5" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}

/** Pill in the chat header showing today's active spot */
function SpotPill() {
  const spot = getTodaySpot();
  return (
    <a
      href={spot.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-ivory/10 hover:bg-ivory/20 transition-colors"
    >
      <MapPin className="w-3 h-3 text-accent-gold shrink-0" />
      <span className="font-sans text-[10px] text-ivory/80 leading-none">{spot.name}</span>
    </a>
  );
}

export { getTodaySpot, getSpotForDate, SPOTS };
