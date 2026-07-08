import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Wind, AlertTriangle, Loader2 } from 'lucide-react';
import { LOCATION, WEATHER } from '@/lib/constants';

interface CurrentWeather {
  temperatureC: number;
  windKmh: number;
}

interface Props {
  className?: string;
  compact?: boolean;
}

export default function WeatherBadge({ className = '', compact = false }: Props) {
  const [data, setData] = useState<CurrentWeather | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LOCATION.lat}&longitude=${LOCATION.lng}&current=temperature_2m,wind_speed_10m&wind_speed_unit=kmh`;

    // Open-Meteo is occasionally slow or briefly unreachable from a given
    // network — a bare fetch with no timeout/retry turned one blip into a
    // permanent "unavailable" for the rest of the page's life. Retry once
    // after a short delay, and cap each attempt so it can't hang forever.
    const load = async (attempt: number) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      try {
        const r = await fetch(url, { signal: controller.signal });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const json = await r.json();
        const c = json?.current;
        if (!c || typeof c.wind_speed_10m !== 'number') throw new Error('bad payload');
        if (!cancelled) {
          setData({ temperatureC: Math.round(c.temperature_2m), windKmh: Math.round(c.wind_speed_10m) });
        }
      } catch {
        if (cancelled) return;
        if (attempt < 1) {
          setTimeout(() => load(attempt + 1), 1500);
        } else {
          setError(true);
        }
      } finally {
        clearTimeout(timeout);
      }
    };

    load(0);
    return () => { cancelled = true; };
  }, []);

  const danger = data ? data.windKmh > WEATHER.windDangerKmh : false;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`inline-flex items-center gap-3 px-4 py-2.5 rounded-full backdrop-blur-md border text-sm font-ui ${
          danger
            ? 'bg-red-500/85 border-red-300/50 text-white'
            : 'bg-ivory/85 border-ivory/30 text-dark'
        } ${className}`}
        role="status"
      >
        {!data && !error && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {error && (
          <span className="text-xs opacity-70">Météo indisponible</span>
        )}
        {data && (
          <>
            <span className="inline-flex items-center gap-1.5">
              {danger ? (
                <AlertTriangle className="w-3.5 h-3.5" />
              ) : (
                <Wind className="w-3.5 h-3.5" />
              )}
              <span className="tabular-nums font-semibold">{data.windKmh} km/h</span>
            </span>
            {!compact && (
              <>
                <span className="opacity-40">·</span>
                <span className="tabular-nums font-semibold">{data.temperatureC}°C</span>
                <span className="opacity-40">·</span>
                <span className="text-[11px] uppercase tracking-wider opacity-80">
                  {danger ? 'Sortie déconseillée' : 'Conditions favorables'}
                </span>
              </>
            )}
            {compact && danger && (
              <span className="text-[11px] uppercase tracking-wider opacity-90">Risque</span>
            )}
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
