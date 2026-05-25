import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  BOOKING_SESSIONS,
  EXPERIENCE_CATALOG,
  INVENTORY_MAX_UNITS,
  MEETING_POINT,
  PRICING,
} from '@/lib/constants';
import { formatPrice, getMinDate } from '@/lib/utils-booking';
import { useToast } from '@/hooks/use-toast';

type Step = 1 | 2 | 3 | 4 | 5;

interface Wizard {
  activityId: string;
  date: string;
  session: string;
  guests: number;
  durationHours: number;
  name: string;
  phone: string;
  email: string;
}

const INITIAL: Wizard = {
  activityId: '',
  date: '',
  session: '',
  guests: 1,
  durationHours: 1,
  name: '',
  phone: '',
  email: '',
};

const WA_NUMBER = '21623708993';

export default function BookingWizard() {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<Wizard>(INITIAL);
  const [remaining, setRemaining] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const activity = EXPERIENCE_CATALOG.find((e) => e.id === data.activityId) ?? null;

  const update = useCallback(<K extends keyof Wizard>(k: K, v: Wizard[K]) => {
    setData((d) => ({ ...d, [k]: v }));
    setError(null);
  }, []);

  // DEMO MODE: populate all slots with full capacity — no DB call
  useEffect(() => {
    if (!data.date) { setRemaining({}); return; }
    const map: Record<string, number> = {};
    for (const s of BOOKING_SESSIONS) map[s] = INVENTORY_MAX_UNITS;
    setRemaining(map);
  }, [data.date]);

  const total = useMemo(
    () =>
      (PRICING.basePriceTnd +
        Math.max(0, data.durationHours - 1) * PRICING.extraHourTnd) *
      data.guests,
    [data.durationHours, data.guests]
  );
  const deposit = Math.round(total * PRICING.depositRate * 100) / 100;
  const remainingForSlot = data.session ? remaining[data.session] ?? INVENTORY_MAX_UNITS : INVENTORY_MAX_UNITS;

  const canContinue = useMemo(() => {
    switch (step) {
      case 1:
        return !!data.activityId;
      case 2:
        return !!(data.date && data.session);
      case 3:
        return data.guests >= 1 && data.guests <= remainingForSlot;
      case 4:
        return !!(data.name.trim() && data.phone.trim() && data.email.trim());
      default:
        return false;
    }
  }, [step, data, remainingForSlot]);

  const next = () => setStep((s) => (Math.min(5, s + 1) as Step));
  const back = () => setStep((s) => (Math.max(1, s - 1) as Step));

  const submit = async () => {
    if (!activity) return;
    // DEMO MODE: instant success — no DB call
    setSubmitting(true);
    setError(null);
    await new Promise((r) => setTimeout(r, 850)); // realistic processing feel
    setSubmitted(true);
    setSubmitting(false);
    toast({
      title: 'Réservation confirmée !',
      description: `Acompte ${formatPrice(deposit)} à régler pour confirmer votre place.`,
    });
  };

  const whatsappHref = useMemo(() => {
    if (!activity) return `https://wa.me/${WA_NUMBER}`;
    const msg = `Bonjour Alo Paddle, je souhaite confirmer une réservation :%0A- ${activity.name}%0A- ${data.date} à ${data.session}%0A- ${data.guests} personne(s) · ${data.durationHours}h%0A- Total ${formatPrice(total)} · Acompte 40 % ${formatPrice(deposit)}%0A- ${data.name} (${data.phone})`;
    return `https://wa.me/${WA_NUMBER}?text=${msg}`;
  }, [activity, data, total, deposit]);

  return (
    <div className="w-full max-w-2xl mx-auto bg-ivory border border-border-soft rounded-3xl shadow-xl overflow-hidden">
      <Header step={step} />

      <div className="px-6 md:px-10 py-8 min-h-[360px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={submitted ? 'done' : step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
          >
            {submitted ? (
              <SuccessStep deposit={deposit} whatsappHref={whatsappHref} />
            ) : step === 1 ? (
              <ActivityStep value={data.activityId} onChange={(v) => update('activityId', v)} />
            ) : step === 2 ? (
              <DateTimeStep
                date={data.date}
                session={data.session}
                remaining={remaining}
                onDate={(v) => update('date', v)}
                onSession={(v) => update('session', v)}
              />
            ) : step === 3 ? (
              <GuestsStep
                guests={data.guests}
                duration={data.durationHours}
                maxGuests={remainingForSlot}
                onGuests={(v) => update('guests', v)}
                onDuration={(v) => update('durationHours', v)}
              />
            ) : step === 4 ? (
              <ContactStep
                data={data}
                activity={activity}
                total={total}
                deposit={deposit}
                onField={(k, v) => update(k, v)}
              />
            ) : (
              <PaymentStep
                deposit={deposit}
                total={total}
                onPay={submit}
                submitting={submitting}
                whatsappHref={whatsappHref}
                error={error}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {!submitted && (
        <div className="flex items-center justify-between gap-3 px-6 md:px-10 py-5 border-t border-border-soft bg-ivory-light/60">
          <button
            type="button"
            onClick={back}
            disabled={step === 1}
            className="inline-flex items-center gap-2 px-4 py-2 font-ui text-[12px] uppercase tracking-wider text-dark-secondary hover:text-dark disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" /> Retour
          </button>

          {step < 5 ? (
            <motion.button
              type="button"
              onClick={next}
              disabled={!canContinue}
              whileHover={canContinue ? { scale: 1.02 } : undefined}
              whileTap={canContinue ? { scale: 0.98 } : undefined}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-dark text-ivory font-ui text-[12px] uppercase tracking-[0.2em] font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continuer <ChevronRight className="w-4 h-4" />
            </motion.button>
          ) : (
            <span className="font-ui text-[11px] text-dark-secondary">
              Étape finale
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function Header({ step }: { step: Step }) {
  const total = 5;
  return (
    <div className="px-6 md:px-10 pt-7 pb-3 border-b border-border-soft">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-ui text-[10px] uppercase tracking-[0.35em] text-dark-secondary">
            Réservation
          </p>
          <h3 className="font-serif text-2xl md:text-3xl text-dark tracking-tight mt-1">
            Étape {step} / {total}
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <motion.span
              key={i}
              layout
              className={`h-1.5 rounded-full transition-colors ${
                i < step ? 'bg-dark' : 'bg-border-soft'
              }`}
              style={{ width: i === step - 1 ? 28 : 12 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ActivityStep({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <h4 className="font-serif text-2xl text-dark tracking-tight mb-1">
        Quelle activité ?
      </h4>
      <p className="font-ui text-sm text-dark-secondary mb-6">
        Toutes nos sessions débutent à {formatPrice(PRICING.basePriceTnd)}.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {EXPERIENCE_CATALOG.map((exp) => {
          const selected = value === exp.id;
          return (
            <button
              key={exp.id}
              type="button"
              onClick={() => onChange(exp.id)}
              className={`text-left p-4 rounded-2xl border transition-all ${
                selected
                  ? 'border-dark bg-dark/[0.04] ring-1 ring-dark'
                  : 'border-border-soft hover:border-dark/40 hover:bg-ivory-light'
              }`}
            >
              <div className="flex items-center gap-4">
                <img
                  src={exp.imageUrl}
                  alt={exp.name}
                  className="w-16 h-16 rounded-xl object-cover shrink-0"
                  loading="lazy"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="font-serif text-lg text-dark tracking-tight">{exp.name}</h5>
                    {selected && <Check className="w-4 h-4 text-dark shrink-0" />}
                  </div>
                  <p className="font-ui text-xs text-dark-secondary line-clamp-2 mt-0.5">
                    {exp.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DateTimeStep({
  date,
  session,
  remaining,
  onDate,
  onSession,
}: {
  date: string;
  session: string;
  remaining: Record<string, number>;
  onDate: (v: string) => void;
  onSession: (v: string) => void;
}) {
  return (
    <div>
      <h4 className="font-serif text-2xl text-dark tracking-tight mb-1">
        Quand ?
      </h4>
      <p className="font-ui text-sm text-dark-secondary mb-6">
        Cinq sessions quotidiennes à Hessi Jerbi.
      </p>
      <label className="block font-ui text-[11px] uppercase tracking-[0.3em] text-dark-secondary mb-2">
        Date
      </label>
      <input
        type="date"
        min={getMinDate()}
        value={date}
        onChange={(e) => onDate(e.target.value)}
        className="w-full px-4 py-3 border border-border-soft rounded-xl font-ui text-sm text-dark bg-ivory focus:outline-none focus:ring-2 focus:ring-accent-gold mb-6"
      />

      <label className="block font-ui text-[11px] uppercase tracking-[0.3em] text-dark-secondary mb-2">
        Session
      </label>
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
        {BOOKING_SESSIONS.map((s) => {
          const left = remaining[s];
          const soldOut = date && left === 0;
          const selected = session === s;
          return (
            <button
              key={s}
              type="button"
              disabled={!!soldOut}
              onClick={() => onSession(s)}
              className={`py-3 rounded-xl text-center transition-all ${
                selected
                  ? 'bg-dark text-ivory'
                  : soldOut
                    ? 'bg-ivory-light text-dark-secondary/50 line-through cursor-not-allowed'
                    : 'bg-ivory-light text-dark hover:bg-border-soft'
              }`}
            >
              <div className="font-ui text-sm font-medium">{s}</div>
              {date && left !== undefined && !soldOut && (
                <div className="font-ui text-[9px] uppercase tracking-wider text-dark-secondary mt-0.5">
                  {left} libres
                </div>
              )}
              {soldOut && (
                <div className="font-ui text-[9px] uppercase tracking-wider text-dark-secondary mt-0.5">
                  Complet
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function GuestsStep({
  guests,
  duration,
  maxGuests,
  onGuests,
  onDuration,
}: {
  guests: number;
  duration: number;
  maxGuests: number;
  onGuests: (v: number) => void;
  onDuration: (v: number) => void;
}) {
  return (
    <div>
      <h4 className="font-serif text-2xl text-dark tracking-tight mb-1">
        Combien êtes-vous ?
      </h4>
      <p className="font-ui text-sm text-dark-secondary mb-6">
        Jusqu'à {maxGuests} planches sur ce créneau.
      </p>

      <Counter
        label="Personnes"
        value={guests}
        min={1}
        max={maxGuests}
        onChange={onGuests}
      />
      <div className="h-px bg-border-soft my-6" />
      <Counter
        label="Durée (heures)"
        value={duration}
        min={1}
        max={4}
        onChange={onDuration}
        hint={`+${formatPrice(PRICING.extraHourTnd)} / heure sup.`}
      />
    </div>
  );
}

function Counter({
  label,
  value,
  min,
  max,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="font-ui text-sm text-dark">{label}</div>
        {hint && <div className="font-ui text-xs text-dark-secondary mt-0.5">{hint}</div>}
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-10 h-10 rounded-full border border-border-soft font-ui text-lg hover:bg-ivory-light disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Moins"
        >
          −
        </button>
        <span className="font-serif text-2xl min-w-[2ch] text-center tabular-nums">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-10 h-10 rounded-full border border-border-soft font-ui text-lg hover:bg-ivory-light disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Plus"
        >
          +
        </button>
      </div>
    </div>
  );
}

function ContactStep({
  data,
  activity,
  total,
  deposit,
  onField,
}: {
  data: Wizard;
  activity: { name: string } | null;
  total: number;
  deposit: number;
  onField: (k: keyof Wizard, v: string) => void;
}) {
  return (
    <div>
      <h4 className="font-serif text-2xl text-dark tracking-tight mb-1">
        Vos coordonnées
      </h4>
      <p className="font-ui text-sm text-dark-secondary mb-6">
        Pour confirmer votre réservation.
      </p>

      <div className="space-y-4">
        <TextInput
          label="Nom complet"
          value={data.name}
          onChange={(v) => onField('name', v)}
          placeholder="Prénom Nom"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextInput
            label="Téléphone"
            type="tel"
            value={data.phone}
            onChange={(v) => onField('phone', v)}
            placeholder="+216 …"
          />
          <TextInput
            label="Email"
            type="email"
            value={data.email}
            onChange={(v) => onField('email', v)}
            placeholder="vous@email.com"
          />
        </div>
      </div>

      <div className="mt-6 p-4 rounded-2xl bg-ivory-light">
        <Summary
          activity={activity?.name ?? '—'}
          date={data.date}
          session={data.session}
          guests={data.guests}
          duration={data.durationHours}
          total={total}
          deposit={deposit}
        />
      </div>
    </div>
  );
}

function PaymentStep({
  deposit,
  total,
  onPay,
  submitting,
  whatsappHref,
  error,
}: {
  deposit: number;
  total: number;
  onPay: () => void;
  submitting: boolean;
  whatsappHref: string;
  error: string | null;
}) {
  return (
    <div>
      <h4 className="font-serif text-2xl text-dark tracking-tight mb-1">
        Acompte de confirmation
      </h4>
      <p className="font-ui text-sm text-dark-secondary mb-6">
        40 % requis pour sécuriser votre session. Le solde se règle à l'arrivée.
      </p>

      <div className="p-5 rounded-2xl bg-dark text-ivory flex items-end justify-between mb-5">
        <div>
          <p className="font-ui text-[10px] uppercase tracking-[0.3em] text-ivory/60">
            Acompte à payer
          </p>
          <p className="font-serif text-4xl mt-1">{formatPrice(deposit)}</p>
        </div>
        <div className="text-right">
          <p className="font-ui text-[10px] uppercase tracking-[0.3em] text-ivory/60">Total</p>
          <p className="font-serif text-xl mt-1">{formatPrice(total)}</p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 mb-4">
          <p className="font-ui text-xs text-red-800">{error}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onPay}
          disabled={submitting}
          className="flex-1 py-4 rounded-full bg-accent-gold text-dark font-ui text-[12px] uppercase tracking-[0.2em] font-semibold hover:brightness-105 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {submitting ? 'Enregistrement…' : `Régler l'acompte · ${formatPrice(deposit)}`}
        </button>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center py-4 rounded-full border border-border-soft text-dark font-ui text-[12px] uppercase tracking-[0.2em] font-semibold hover:bg-ivory-light transition"
        >
          Confirmer via WhatsApp
        </a>
      </div>

      <p className="font-ui text-[11px] text-dark-secondary text-center mt-4">
        Votre réservation reste <strong>en attente</strong> tant que l'acompte n'est pas réglé.
      </p>
    </div>
  );
}

function SuccessStep({
  deposit,
  whatsappHref,
}: {
  deposit: number;
  whatsappHref: string;
}) {
  return (
    <div className="text-center py-6">
      <div className="w-14 h-14 mx-auto rounded-full bg-dark text-ivory flex items-center justify-center mb-5">
        <Check className="w-6 h-6" />
      </div>
      <h4 className="font-serif text-3xl text-dark tracking-tight mb-2">
        Presque prêt !
      </h4>
      <p className="font-ui text-sm text-dark-secondary max-w-md mx-auto mb-6">
        Votre demande est enregistrée. Pour la confirmer définitivement, réglez
        l'acompte de <strong>{formatPrice(deposit)}</strong> ou écrivez-nous sur WhatsApp.
      </p>
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center px-6 py-3 rounded-full bg-dark text-ivory font-ui text-[12px] uppercase tracking-[0.2em] font-semibold"
      >
        Finaliser sur WhatsApp
      </a>
    </div>
  );
}

function Summary({
  activity,
  date,
  session,
  guests,
  duration,
  total,
  deposit,
}: {
  activity: string;
  date: string;
  session: string;
  guests: number;
  duration: number;
  total: number;
  deposit: number;
}) {
  const rows = [
    ['Activité', activity],
    ['Date', date || '—'],
    ['Session', session || '—'],
    ['Personnes', `${guests}`],
    ['Durée', `${duration}h`],
  ];
  return (
    <div className="space-y-1.5">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between font-ui text-sm">
          <span className="text-dark-secondary">{k}</span>
          <span className="text-dark font-medium">{v}</span>
        </div>
      ))}
      <div className="h-px bg-border-soft my-2" />
      <div className="flex justify-between items-end">
        <span className="font-ui text-sm font-semibold text-dark">Total</span>
        <span className="font-serif text-2xl font-semibold text-accent-gold">
          {formatPrice(total)}
        </span>
      </div>
      <p className="font-ui text-xs text-dark-secondary text-right">
        Acompte 40 % · <strong>{formatPrice(deposit)}</strong>
      </p>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="block font-ui text-[11px] uppercase tracking-[0.3em] text-dark-secondary mb-2">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-border-soft rounded-xl font-ui text-sm text-dark bg-ivory focus:outline-none focus:ring-2 focus:ring-accent-gold"
      />
    </label>
  );
}
