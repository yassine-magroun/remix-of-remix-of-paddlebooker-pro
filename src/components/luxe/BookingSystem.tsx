import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ArrowRight, Users, Wind } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  BOOKING_SESSIONS,
  INVENTORY_MAX_UNITS,
  MEETING_POINT,
  PRICING,
  SCARCITY_THRESHOLD,
  SUNSET_MIN_GROUP,
  SUNSET_SLOTS,
  WEATHER,
} from '@/lib/constants';
import { addDays, formatDateShort, formatPrice, getMinDate } from '@/lib/utils-booking';
import { useToast } from '@/hooks/use-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = 'idle' | 'checking' | 'submitting' | 'error' | 'success';
type ActivityId = 'paddle' | 'kayak-transparent' | 'paddle-velo';
type BookingStatus = 'pending' | 'pending_formation' | 'confirmed_deposit' | 'cancelled';

interface Activity {
  id: ActivityId;
  label: string;
  sublabel: string;
  price: number;
  allowExtraHours: boolean;
}

interface AlternativeSlot {
  date: string;
  slot: string;
  remaining: number;
}

interface PoolGroup {
  date: string;
  slot: string;
  currentCount: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTIVITIES: Activity[] = [
  { id: 'paddle',           label: 'Paddle',            sublabel: '1h · 50 TND',    price: PRICING.basePriceTnd, allowExtraHours: true  },
  { id: 'kayak-transparent',label: 'Kayak Transparent', sublabel: '25 min · 50 TND', price: 50,                   allowExtraHours: false },
  { id: 'paddle-velo',      label: 'Paddle Vélo',       sublabel: '1h · 60 TND',    price: 60,                   allowExtraHours: false },
];

const INITIAL = {
  activity: 'paddle' as ActivityId,
  date: '',
  session: '',
  durationHours: 1,
  units: 1,
  name: '',
  phone: '',
  email: '',
  notes: '',
};

// ─── Async helpers (outside component to avoid re-creation) ───────────────────

async function fetchUsageForDate(date: string): Promise<Record<string, number>> {
  const { data } = await supabase
    .from('bookings')
    .select('time_slot, num_boards, status')
    .eq('session_date', date)
    .neq('status', 'cancelled');

  const map: Record<string, number> = {};
  for (const row of data ?? []) {
    map[row.time_slot] = (map[row.time_slot] ?? 0) + (row.num_boards ?? 0);
  }
  return map;
}

async function fetchAlternatives(date: string, slot: string): Promise<AlternativeSlot[]> {
  const tomorrow = addDays(date, 1);
  const candidates: { date: string; slot: string }[] = [
    { date: tomorrow, slot },
    ...SUNSET_SLOTS.filter((s) => s !== slot).map((s) => ({ date, slot: s })),
  ];

  const { data } = await supabase
    .from('bookings')
    .select('session_date, time_slot, num_boards')
    .in('session_date', [date, tomorrow])
    .neq('status', 'cancelled');

  const usageMap: Record<string, number> = {};
  for (const row of data ?? []) {
    const k = `${row.session_date}_${row.time_slot}`;
    usageMap[k] = (usageMap[k] ?? 0) + (row.num_boards ?? 0);
  }

  return candidates
    .map(({ date: d, slot: s }) => ({
      date: d,
      slot: s,
      remaining: Math.max(0, INVENTORY_MAX_UNITS - (usageMap[`${d}_${s}`] ?? 0)),
    }))
    .filter((a) => a.remaining > 0);
}

async function fetchPoolGroups(date: string, slot: string): Promise<PoolGroup[]> {
  const from = addDays(date, 1);
  const to   = addDays(date, 7);

  const { data } = await supabase
    .from('bookings')
    .select('session_date, time_slot, num_boards')
    .eq('time_slot', slot)
    .gte('session_date', from)
    .lte('session_date', to)
    .neq('status', 'cancelled');

  const countByDate: Record<string, number> = {};
  for (const row of data ?? []) {
    countByDate[row.session_date] = (countByDate[row.session_date] ?? 0) + (row.num_boards ?? 0);
  }

  return Object.entries(countByDate)
    .filter(([, c]) => c > 0 && c < INVENTORY_MAX_UNITS)
    .map(([d, currentCount]) => ({ date: d, slot, currentCount }))
    .sort((a, b) => b.currentCount - a.currentCount)
    .slice(0, 2);
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BookingSystem() {
  const { toast } = useToast();
  const [form, setForm] = useState(INITIAL);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [remainingBySession, setRemainingBySession] = useState<Record<string, number>>({});
  const [alternatives, setAlternatives] = useState<AlternativeSlot[]>([]);
  const [poolGroups, setPoolGroups] = useState<PoolGroup[]>([]);

  const update = useCallback(<K extends keyof typeof INITIAL>(key: K, value: (typeof INITIAL)[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setError(null);
  }, []);

  const selectedActivity = ACTIVITIES.find((a) => a.id === form.activity)!;
  const isSunsetSlot = SUNSET_SLOTS.includes(form.session);

  // ── Fetch availability for date ────────────────────────────────────────────
  useEffect(() => {
    if (!form.date) {
      setRemainingBySession({});
      return;
    }
    let cancelled = false;
    (async () => {
      setStatus('checking');
      const usageMap = await fetchUsageForDate(form.date);
      if (cancelled) return;
      const remaining: Record<string, number> = {};
      for (const slot of BOOKING_SESSIONS) {
        remaining[slot] = Math.max(0, INVENTORY_MAX_UNITS - (usageMap[slot] ?? 0));
      }
      setRemainingBySession(remaining);
      setStatus('idle');
    })();
    return () => { cancelled = true; };
  }, [form.date]);

  // ── Yield management: alternatives & pool groups ───────────────────────────
  useEffect(() => {
    setAlternatives([]);
    setPoolGroups([]);
    if (!form.date || !form.session) return;

    const remaining = remainingBySession[form.session];
    if (remaining === undefined) return;

    if (remaining === 0) {
      fetchAlternatives(form.date, form.session).then(setAlternatives);
    } else if (isSunsetSlot) {
      fetchPoolGroups(form.date, form.session).then(setPoolGroups);
    }
  }, [form.session, form.date, remainingBySession, isSunsetSlot]);

  // ── Pricing ────────────────────────────────────────────────────────────────
  const unitPrice = useMemo(() => {
    if (!selectedActivity.allowExtraHours) return selectedActivity.price;
    return selectedActivity.price + Math.max(0, form.durationHours - 1) * PRICING.extraHourTnd;
  }, [form.durationHours, selectedActivity]);

  const totalForBooking = unitPrice * form.units;
  const deposit  = Math.round(totalForBooking * PRICING.depositRate);
  const balance  = totalForBooking - deposit;

  // ── Derived state ──────────────────────────────────────────────────────────
  const remainingForPicked = form.session ? (remainingBySession[form.session] ?? null) : null;
  const exceedsStock = remainingForPicked !== null && form.units > remainingForPicked;
  const scarce = remainingForPicked !== null && remainingForPicked > 0 && remainingForPicked < SCARCITY_THRESHOLD;

  const currentUsed = remainingForPicked !== null ? INVENTORY_MAX_UNITS - remainingForPicked : 0;
  const totalWithMe = currentUsed + form.units;
  const needsFormation = isSunsetSlot && remainingForPicked !== null && totalWithMe < SUNSET_MIN_GROUP;

  const valid =
    !!form.date &&
    !!form.session &&
    remainingForPicked !== 0 && // session not full
    !!form.name.trim() &&
    !!form.phone.trim() &&
    !!form.email.trim() &&
    !exceedsStock;

  // ── Select alternative ─────────────────────────────────────────────────────
  const selectAlternative = useCallback((date: string, slot: string) => {
    setForm((f) => ({ ...f, date, session: slot }));
    setAlternatives([]);
    setPoolGroups([]);
  }, []);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setStatus('submitting');
    setError(null);

    try {
      // Atomic re-check
      const { data: existing, error: checkErr } = await supabase
        .from('bookings')
        .select('num_boards')
        .eq('session_date', form.date)
        .eq('time_slot', form.session)
        .neq('status', 'cancelled');
      if (checkErr) throw checkErr;

      const used = (existing ?? []).reduce((s, r) => s + (r.num_boards ?? 0), 0);
      if (used + form.units > INVENTORY_MAX_UNITS) {
        const left = Math.max(0, INVENTORY_MAX_UNITS - used);
        throw new Error(
          left === 0
            ? 'Ce créneau vient d\'être complet. Choisissez une alternative ci-dessous.'
            : `Il ne reste que ${left} place(s) sur ce créneau.`
        );
      }

      const totalAfter = used + form.units;
      const bookingStatus: BookingStatus =
        isSunsetSlot && totalAfter < SUNSET_MIN_GROUP ? 'pending_formation' : 'pending';

      const durationLabel = selectedActivity.allowExtraHours
        ? `${form.durationHours}h`
        : selectedActivity.id === 'kayak-transparent' ? '25 min' : '1h';

      const { error: insertErr } = await supabase.from('bookings').insert({
        customer_name:  form.name.trim(),
        phone:          form.phone.trim(),
        email:          form.email.trim(),
        session_date:   form.date,
        time_slot:      form.session,
        session_label:  `${selectedActivity.label} · ${durationLabel} · ${isSunsetSlot ? 'Sunset' : 'Sunrise'}`,
        num_boards:     form.units,
        total_price:    totalForBooking,
        deposit_amount: deposit,
        status:         bookingStatus,
        notes: form.notes.trim()
          ? `${form.notes.trim()} · RDV ${MEETING_POINT}`
          : `RDV ${MEETING_POINT}`,
      });
      if (insertErr) throw insertErr;

      setStatus('success');

      if (bookingStatus === 'pending_formation') {
        toast({
          title: 'Groupe en formation',
          description: `${totalAfter}/${SUNSET_MIN_GROUP} pers. enregistrées. Acompte ${formatPrice(deposit)} à régler pour valider votre place.`,
        });
      } else {
        toast({
          title: 'Réservation enregistrée',
          description: `Acompte ${formatPrice(deposit)} à régler pour confirmer. Rendez-vous à ${MEETING_POINT}.`,
        });
      }
      setForm(INITIAL);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Erreur lors de la réservation.');
      // Re-fetch availability after an error (session may have filled up)
      const usageMap = await fetchUsageForDate(form.date);
      const remaining: Record<string, number> = {};
      for (const slot of BOOKING_SESSIONS) {
        remaining[slot] = Math.max(0, INVENTORY_MAX_UNITS - (usageMap[slot] ?? 0));
      }
      setRemainingBySession(remaining);
      fetchAlternatives(form.date, form.session).then(setAlternatives);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <form
      onSubmit={submit}
      className="w-full max-w-xl mx-auto bg-ivory border border-border-soft rounded-2xl p-6 md:p-8 shadow-xl"
    >
      <p className="font-sans text-[10px] uppercase tracking-[0.4em] text-dark-secondary mb-2">
        Réservation
      </p>
      <h3 className="font-serif text-3xl md:text-4xl text-dark tracking-tight mb-6">
        Réservez votre session
      </h3>

      <div className="space-y-5">
        {/* Activity */}
        <Field label="Activité">
          <div className="grid grid-cols-3 gap-2">
            {ACTIVITIES.map((act) => {
              const selected = form.activity === act.id;
              return (
                <motion.button
                  key={act.id}
                  type="button"
                  onClick={() => {
                    update('activity', act.id);
                    if (!act.allowExtraHours) update('durationHours', 1);
                  }}
                  whileHover={{ y: -2 }}
                  className={`px-3 py-3 rounded-lg font-sans text-sm font-medium transition-colors text-left ${
                    selected ? 'bg-dark text-ivory' : 'bg-ivory-light text-dark hover:bg-border-soft'
                  }`}
                >
                  <div className="font-semibold leading-tight">{act.label}</div>
                  <div className={`mt-0.5 text-[10px] uppercase tracking-wider ${selected ? 'text-ivory/60' : 'text-dark-secondary'}`}>
                    {act.sublabel}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </Field>

        {/* Date */}
        <Field label="Date">
          <input
            type="date"
            min={getMinDate()}
            value={form.date}
            onChange={(e) => { update('date', e.target.value); update('session', ''); }}
            className="w-full px-4 py-3 border border-border-soft rounded-lg font-sans text-sm text-dark bg-ivory focus:outline-none focus:ring-2 focus:ring-accent-gold focus:border-transparent"
            required
          />
        </Field>

        {/* Session selector */}
        <Field label="Session">
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
            {BOOKING_SESSIONS.map((slot) => {
              const remaining = remainingBySession[slot];
              const soldOut   = form.date && remaining === 0;
              const selected  = form.session === slot;
              const isSunset  = SUNSET_SLOTS.includes(slot);
              const isLowStock = !soldOut && remaining !== undefined && remaining > 0 && remaining < SCARCITY_THRESHOLD;

              return (
                <motion.button
                  key={slot}
                  type="button"
                  disabled={!!soldOut}
                  onClick={() => update('session', slot)}
                  whileHover={!soldOut ? { y: -2 } : undefined}
                  className={`relative px-3 py-3 rounded-lg font-sans text-sm font-medium transition-colors ${
                    selected
                      ? 'bg-dark text-ivory'
                      : soldOut
                        ? 'bg-ivory-light text-dark-secondary/60 line-through cursor-not-allowed'
                        : 'bg-ivory-light text-dark hover:bg-border-soft'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {slot}
                    {isSunset && <span className="text-[8px]">🌅</span>}
                  </div>
                  {form.date && remaining !== undefined && !soldOut && !isLowStock && (
                    <div className="mt-0.5 font-sans text-[9px] uppercase tracking-wider text-dark-secondary">
                      {remaining} libres
                    </div>
                  )}
                  {isLowStock && (
                    <div className={`mt-0.5 font-sans text-[9px] uppercase tracking-wider font-semibold ${selected ? 'text-amber-300' : 'text-amber-600'}`}>
                      ⚡ {remaining} restantes
                    </div>
                  )}
                  {soldOut && (
                    <div className="mt-0.5 font-sans text-[9px] uppercase tracking-wider text-dark-secondary">
                      Complet
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </Field>

        {/* Alternatives panel (session full) */}
        <AnimatePresence>
          {alternatives.length > 0 && remainingForPicked === 0 && (
            <AlternativesPanel
              fullDate={form.date}
              fullSlot={form.session}
              alternatives={alternatives}
              onSelect={selectAlternative}
            />
          )}
        </AnimatePresence>

        {/* Pool formation panel (sunset) */}
        <AnimatePresence>
          {poolGroups.length > 0 && needsFormation && (
            <PoolPanel groups={poolGroups} onSelect={selectAlternative} />
          )}
        </AnimatePresence>

        {/* Duration + Units */}
        <div className="grid grid-cols-2 gap-5">
          {selectedActivity.allowExtraHours ? (
            <Field label="Durée (heures)">
              <div className="flex items-center gap-3">
                <CounterButton onClick={() => update('durationHours', Math.max(1, form.durationHours - 1))} label="Moins">−</CounterButton>
                <span className="font-serif text-2xl font-medium min-w-[2ch] text-center tabular-nums">{form.durationHours}</span>
                <CounterButton onClick={() => update('durationHours', Math.min(4, form.durationHours + 1))} label="Plus">+</CounterButton>
              </div>
            </Field>
          ) : (
            <Field label="Durée">
              <p className="font-serif text-2xl font-medium text-dark pt-1">
                {selectedActivity.id === 'kayak-transparent' ? '25 min' : '1 h'}
              </p>
            </Field>
          )}

          <Field label={`Paddles (max ${INVENTORY_MAX_UNITS})`}>
            <div className="flex items-center gap-3">
              <CounterButton onClick={() => update('units', Math.max(1, form.units - 1))} label="Moins">−</CounterButton>
              <span className="font-serif text-2xl font-medium min-w-[2ch] text-center tabular-nums">{form.units}</span>
              <CounterButton onClick={() => update('units', Math.min(INVENTORY_MAX_UNITS, form.units + 1))} label="Plus">+</CounterButton>
            </div>
          </Field>
        </div>

        {/* Pending-formation notice */}
        <AnimatePresence>
          {needsFormation && form.session && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200"
            >
              <Users className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-sans text-xs font-semibold text-amber-800">
                  Session Sunset · Groupe en formation
                </p>
                <p className="font-sans text-xs text-amber-700 mt-0.5">
                  {totalWithMe}/{SUNSET_MIN_GROUP} personnes minimum pour garantir le départ.
                  Votre acompte n'est débité que si le groupe est constitué.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nom complet">
            <TextInput value={form.name} onChange={(v) => update('name', v)} placeholder="Prénom Nom" required />
          </Field>
          <Field label="Téléphone">
            <TextInput value={form.phone} onChange={(v) => update('phone', v)} placeholder="+216 …" required type="tel" />
          </Field>
        </div>

        <Field label="Email">
          <TextInput value={form.email} onChange={(v) => update('email', v)} placeholder="vous@email.com" required type="email" />
        </Field>

        {/* Price breakdown */}
        <div className="p-5 bg-ivory-light rounded-xl space-y-1.5">
          <Row label={`${selectedActivity.label} (1 unité)`} value={formatPrice(selectedActivity.price)} />
          {selectedActivity.allowExtraHours && form.durationHours > 1 && (
            <Row label={`+ ${form.durationHours - 1}h supplémentaire(s)`} value={formatPrice((form.durationHours - 1) * PRICING.extraHourTnd)} />
          )}
          {form.units > 1 && (
            <Row label={`× ${form.units} unités`} value="—" muted />
          )}
          <div className="h-px bg-border-soft my-2" />
          <Row label="Prix Total" value={formatPrice(totalForBooking)} />
          <Row
            label={`Acompte de Réservation (${Math.round(PRICING.depositRate * 100)}%)`}
            value={formatPrice(deposit)}
            highlight
          />
          <Row label="Solde à payer sur place" value={formatPrice(balance)} muted />

          {/* Weather guarantee */}
          <div className="flex items-start gap-2 pt-2 border-t border-border-soft mt-2">
            <Wind className="w-3.5 h-3.5 text-dark-secondary shrink-0 mt-0.5" />
            <p className="font-sans text-[10px] text-dark-secondary leading-relaxed">
              Acompte <span className="font-semibold">100% remboursable</span> ou déplaçable si le vent dépasse {WEATHER.windDangerKmh} km/h (wind-check automatique).
            </p>
          </div>
        </div>

        {/* Scarcity banner */}
        <AnimatePresence>
          {scarce && form.session && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 font-sans text-xs font-semibold text-amber-700"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              Plus que {remainingForPicked} place{remainingForPicked! > 1 ? 's' : ''} disponible{remainingForPicked! > 1 ? 's' : ''} sur ce créneau.
            </motion.p>
          )}
        </AnimatePresence>

        {exceedsStock && (
          <p className="font-sans text-xs text-red-700">
            Seulement {remainingForPicked} paddle(s) disponible(s) sur ce créneau.
          </p>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="font-sans text-xs text-red-800">{error}</p>
          </div>
        )}

        <motion.button
          type="submit"
          disabled={!valid || status === 'submitting'}
          whileHover={valid ? { scale: 1.01 } : undefined}
          whileTap={valid ? { scale: 0.99 } : undefined}
          className="w-full py-4 bg-dark text-ivory rounded-full font-sans text-xs uppercase tracking-[0.3em] font-semibold hover:bg-dark-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {status === 'submitting'
            ? 'Envoi…'
            : status === 'checking'
              ? 'Vérification…'
              : needsFormation
                ? `Rejoindre le groupe · Acompte ${formatPrice(deposit)}`
                : `Confirmer · Acompte ${formatPrice(deposit)}`}
        </motion.button>

        <p className="font-sans text-[11px] text-dark-secondary text-center">
          Rendez-vous à <span className="font-semibold text-dark">{MEETING_POINT}</span>
        </p>
      </div>
    </form>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AlternativesPanel({
  fullDate,
  fullSlot,
  alternatives,
  onSelect,
}: {
  fullDate: string;
  fullSlot: string;
  alternatives: AlternativeSlot[];
  onSelect: (date: string, slot: string) => void;
}) {
  const isSunrise = !SUNSET_SLOTS.includes(fullSlot);
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="p-4 rounded-xl bg-dark text-ivory space-y-3"
    >
      <p className="font-sans text-xs leading-relaxed text-ivory/90">
        Le {isSunrise ? 'lever de soleil' : 'coucher de soleil'} du{' '}
        <span className="font-semibold">{formatDateShort(fullDate)}</span> est complet.{' '}
        <span className="font-semibold">{INVENTORY_MAX_UNITS} aventuriers</span> ont déjà validé leur place.
        {isSunrise
          ? ' Rejoignez l\'expédition de demain ou profitez de la magie du crépuscule ce soir.'
          : ' Rejoignez l\'expédition du lendemain.'}
      </p>
      <div className="flex flex-col gap-2">
        {alternatives.map((alt) => (
          <button
            key={`${alt.date}_${alt.slot}`}
            type="button"
            onClick={() => onSelect(alt.date, alt.slot)}
            className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-ivory/10 hover:bg-ivory/20 transition-colors font-sans text-sm"
          >
            <span>
              <span className="font-semibold">{formatDateShort(alt.date)}</span>
              {' · '}{alt.slot}
              {SUNSET_SLOTS.includes(alt.slot) ? ' 🌅' : ' 🌅'}
            </span>
            <span className="flex items-center gap-1.5 text-ivory/70 text-xs">
              {alt.remaining} places
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function PoolPanel({
  groups,
  onSelect,
}: {
  groups: PoolGroup[];
  onSelect: (date: string, slot: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="p-4 rounded-xl border border-border-soft bg-ivory space-y-2"
    >
      <div className="flex items-center gap-2 mb-1">
        <Users className="w-3.5 h-3.5 text-dark-secondary" />
        <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-dark-secondary">
          Groupes proches — garantissez votre départ
        </p>
      </div>
      {groups.map((g) => (
        <button
          key={`${g.date}_${g.slot}`}
          type="button"
          onClick={() => onSelect(g.date, g.slot)}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-ivory-light hover:bg-border-soft transition-colors font-sans text-sm text-dark"
        >
          <span>
            Rejoignez le groupe du{' '}
            <span className="font-semibold">{formatDateShort(g.date)}</span>{' '}
            (déjà {g.currentCount} inscrits) pour garantir votre départ !
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-dark-secondary shrink-0 ml-2" />
        </button>
      ))}
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-sans text-[10px] uppercase tracking-[0.35em] text-dark-secondary mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}

function Row({ label, value, muted, highlight }: { label: string; value: string; muted?: boolean; highlight?: boolean }) {
  return (
    <div className="flex justify-between font-sans text-sm">
      <span className="text-dark-secondary">{label}</span>
      <span className={
        highlight ? 'font-bold text-dark text-base' :
        muted ? 'text-dark-secondary italic' :
        'font-semibold text-dark'
      }>
        {value}
      </span>
    </div>
  );
}

function CounterButton({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="w-10 h-10 border border-border-soft rounded-full font-sans text-lg hover:bg-ivory-light"
    >
      {children}
    </button>
  );
}

function TextInput({ value, onChange, placeholder, required, type = 'text' }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="w-full px-4 py-3 border border-border-soft rounded-lg font-sans text-sm text-dark bg-ivory focus:outline-none focus:ring-2 focus:ring-accent-gold focus:border-transparent"
    />
  );
}
