import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  EXPERIENCE_CATALOG,
  TIME_SLOTS,
  DURATION_OPTIONS,
  SKILL_LEVELS,
  PRICE_MODIFIERS,
} from '@/lib/constants';
import {
  calculateTotal,
  formatPrice,
  getMinDate,
  isWeekend,
} from '@/lib/utils-booking';
import type { BookingFormData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  experienceId: string | null;
}

type Status = 'idle' | 'submitting' | 'error';

export default function BookingModal({ open, onClose, experienceId }: Props) {
  const { toast } = useToast();
  const experience = EXPERIENCE_CATALOG.find((e) => e.id === experienceId) ?? null;

  const [form, setForm] = useState<BookingFormData>({
    experienceType: experienceId ?? '',
    dateReserved: '',
    timeSlot: '',
    durationHours: 1,
    participantCount: 1,
    skillLevel: 'beginner',
  });
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (experienceId) setForm((f) => ({ ...f, experienceType: experienceId }));
  }, [experienceId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  const update = useCallback(<K extends keyof BookingFormData>(k: K, v: BookingFormData[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setError(null);
  }, []);

  const weekend = isWeekend(form.dateReserved);
  const total = experience
    ? calculateTotal(experience.basePrice, form.durationHours, form.participantCount, weekend)
    : 0;
  const deposit = Math.round(total * 0.4 * 100) / 100;
  const valid = Boolean(form.dateReserved && form.timeSlot && experience);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || !experience) return;
    setStatus('submitting');
    setError(null);

    try {
      const { data, error: err } = await supabase
        .from('bookings')
        .insert({
          customer_name: 'Invité',
          phone: '—',
          email: '—',
          session_date: form.dateReserved,
          time_slot: form.timeSlot,
          session_label: experience.name,
          num_boards: form.participantCount,
          total_price: total,
          deposit_amount: deposit,
          status: 'pending',
          notes: `Durée ${form.durationHours}h · Niveau ${form.skillLevel}`,
        } as never)
        .select('id')
        .single();

      if (err) throw err;

      toast({
        title: 'Réservation créée',
        description: `Acompte ${formatPrice(deposit)} à régler pour confirmer.`,
      });
      onClose();
      setForm((f) => ({ ...f, dateReserved: '', timeSlot: '' }));
      console.info('Booking', (data as { id?: string } | null)?.id);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Erreur serveur');
      return;
    }
    setStatus('idle');
  };

  return (
    <AnimatePresence>
      {open && experience && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            aria-hidden
          />
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center pointer-events-none">
            <motion.form
              key="sheet"
              onSubmit={submit}
              role="dialog"
              aria-modal
              aria-labelledby="booking-title"
              className="pointer-events-auto w-full md:max-w-lg bg-ivory md:rounded-2xl rounded-t-2xl shadow-2xl overflow-y-auto max-h-[92vh]"
              initial={{ y: '100%', opacity: 0.8 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0.8 }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            >
              <div className="sticky top-0 z-10 bg-ivory px-8 pt-8 pb-4 flex items-start justify-between border-b border-border-soft">
                <div>
                  <p className="font-sans text-[10px] uppercase tracking-[0.4em] text-dark-secondary mb-2">
                    Réservation
                  </p>
                  <h2 id="booking-title" className="font-serif text-3xl text-dark tracking-tight">
                    {experience.name}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-10 h-10 rounded-full hover:bg-ivory-light flex items-center justify-center"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4 text-dark" />
                </button>
              </div>

              <div className="px-8 py-6 space-y-7">
                <Field label="Date">
                  <input
                    type="date"
                    min={getMinDate()}
                    value={form.dateReserved}
                    onChange={(e) => update('dateReserved', e.target.value)}
                    className="w-full px-4 py-3 border border-border-soft rounded-lg font-sans text-sm text-dark bg-ivory focus:outline-none focus:ring-2 focus:ring-accent-gold focus:border-transparent"
                    required
                  />
                </Field>

                <Field label="Créneau">
                  <div className="grid grid-cols-4 gap-2">
                    {TIME_SLOTS.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => update('timeSlot', slot)}
                        className={`py-3 rounded-lg font-sans text-sm font-medium transition-colors ${
                          form.timeSlot === slot
                            ? 'bg-dark text-ivory'
                            : 'bg-ivory-light text-dark hover:bg-border-soft'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Durée">
                  <div className="grid grid-cols-3 gap-2">
                    {DURATION_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => update('durationHours', opt.value)}
                        className={`py-3 rounded-lg font-sans text-sm font-medium transition-colors ${
                          form.durationHours === opt.value
                            ? 'bg-dark text-ivory'
                            : 'bg-ivory-light text-dark hover:bg-border-soft'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Participants">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => update('participantCount', Math.max(1, form.participantCount - 1))}
                      className="w-11 h-11 border border-border-soft rounded-full font-sans text-lg hover:bg-ivory-light"
                      aria-label="Moins"
                    >
                      −
                    </button>
                    <span className="font-serif text-3xl font-medium min-w-[2ch] text-center tabular-nums">
                      {form.participantCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => update('participantCount', Math.min(6, form.participantCount + 1))}
                      className="w-11 h-11 border border-border-soft rounded-full font-sans text-lg hover:bg-ivory-light"
                      aria-label="Plus"
                    >
                      +
                    </button>
                    <span className="font-sans text-xs text-dark-secondary ml-2">6 max</span>
                  </div>
                </Field>

                <Field label="Niveau">
                  <div className="grid grid-cols-3 gap-2">
                    {SKILL_LEVELS.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => update('skillLevel', l.id)}
                        className={`py-3 rounded-lg font-sans text-xs uppercase tracking-wider font-semibold transition-colors ${
                          form.skillLevel === l.id
                            ? 'bg-dark text-ivory'
                            : 'bg-ivory-light text-dark hover:bg-border-soft'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </Field>

                <div className="p-5 bg-ivory-light rounded-xl space-y-2">
                  <Row label="Base" value={formatPrice(experience.basePrice)} />
                  {form.durationHours > 1 && (
                    <Row
                      label={`Durée +${form.durationHours - 1}h`}
                      value={formatPrice((form.durationHours - 1) * PRICE_MODIFIERS.durationHourExtra)}
                    />
                  )}
                  {form.participantCount > 1 && (
                    <Row
                      label={`${form.participantCount - 1} participant${form.participantCount > 2 ? 's' : ''} en plus`}
                      value={formatPrice((form.participantCount - 1) * PRICE_MODIFIERS.participantExtra)}
                    />
                  )}
                  {weekend && <Row label="Week-end (+15%)" value="inclus" muted />}
                  <div className="h-px bg-border-soft my-2" />
                  <div className="flex justify-between items-end">
                    <span className="font-sans text-sm font-semibold text-dark">Total</span>
                    <span className="font-serif text-3xl font-semibold text-accent-gold">
                      {formatPrice(total)}
                    </span>
                  </div>
                  <p className="font-sans text-xs text-dark-secondary text-right">
                    Acompte 40% · {formatPrice(deposit)}
                  </p>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="font-sans text-xs text-red-800">{error}</p>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-ivory px-8 py-5 border-t border-border-soft flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 border border-border-soft text-dark rounded-full font-sans text-xs uppercase tracking-wider font-semibold hover:bg-ivory-light transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!valid || status === 'submitting'}
                  className="flex-[1.4] py-3 bg-dark text-ivory rounded-full font-sans text-xs uppercase tracking-wider font-semibold hover:bg-dark-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {status === 'submitting' ? 'Enregistrement…' : `Confirmer · ${formatPrice(deposit)}`}
                </button>
              </div>
            </motion.form>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-sans text-[10px] uppercase tracking-[0.4em] text-dark-secondary mb-3">
        {label}
      </label>
      {children}
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex justify-between font-sans text-sm">
      <span className="text-dark-secondary">{label}</span>
      <span className={muted ? 'text-dark-secondary italic' : 'font-semibold text-dark'}>{value}</span>
    </div>
  );
}
