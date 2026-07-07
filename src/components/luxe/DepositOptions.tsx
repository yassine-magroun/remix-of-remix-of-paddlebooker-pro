import { useState } from 'react';
import { Check, Copy, Landmark } from 'lucide-react';
import { ONLINE_PAYMENT_LINK, WERO_PHONE_DISPLAY } from '@/lib/constants';
import { buildWhatsAppUrl, formatPrice } from '@/lib/utils-booking';
import { useToast } from '@/hooks/use-toast';

interface DepositOptionsProps {
  reservationRef: string;
  name: string;
  date: string;
  time: string;
  deposit: number;
}

/** The three ways a client can settle their deposit, shown on every booking success screen. */
export function DepositOptions({ reservationRef, name, date, time, deposit }: DepositOptionsProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const whatsappHref = buildWhatsAppUrl({
    reservationId: reservationRef,
    name,
    date,
    time,
    depositOption: 'Règlement Local',
  });

  const copyWeroNumber = async () => {
    try {
      await navigator.clipboard.writeText(WERO_PHONE_DISPLAY);
      setCopied(true);
      toast({ title: 'Numéro copié', description: 'Collez-le dans votre application bancaire Wero.' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Copie impossible', description: WERO_PHONE_DISPLAY, variant: 'destructive' });
    }
  };

  return (
    <div className="flex flex-col gap-3 text-left">
      <a
        href={ONLINE_PAYMENT_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between px-5 py-3.5 rounded-2xl border border-border-soft hover:bg-ivory-light transition"
      >
        <span className="font-ui text-[12px] uppercase tracking-[0.15em] font-semibold text-dark">
          Règlement International
        </span>
        <span className="font-ui text-[10px] uppercase tracking-wider text-dark-secondary">
          PayPal / CB →
        </span>
      </a>

      <div className="px-5 py-3.5 rounded-2xl border border-border-soft">
        <div className="flex items-center justify-between gap-3">
          <span className="font-ui text-[12px] uppercase tracking-[0.15em] font-semibold text-dark flex items-center gap-2">
            <Landmark className="w-3.5 h-3.5 shrink-0" />
            Wero (Banques FR)
          </span>
          <button
            type="button"
            onClick={copyWeroNumber}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-dark text-ivory font-ui text-[10px] uppercase tracking-wider font-semibold hover:bg-dark-secondary transition shrink-0"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copié' : 'Copier le numéro'}
          </button>
        </div>
        <p className="font-ui text-sm text-dark mt-2 tabular-nums">{WERO_PHONE_DISPLAY}</p>
        <p className="font-ui text-xs text-dark-secondary mt-0.5">
          Envoyez {formatPrice(deposit)} depuis votre application bancaire Wero.
        </p>
      </div>

      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between px-5 py-3.5 rounded-2xl bg-[hsl(142,70%,42%)] text-ivory hover:brightness-105 transition"
      >
        <span className="font-ui text-[12px] uppercase tracking-[0.15em] font-semibold">
          Règlement Local
        </span>
        <span className="font-ui text-[10px] uppercase tracking-wider text-ivory/80">
          Physique / Standard →
        </span>
      </a>
    </div>
  );
}
