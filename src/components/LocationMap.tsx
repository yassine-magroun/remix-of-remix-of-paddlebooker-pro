import { MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface LocationMapProps {
  compact?: boolean;
}

export function LocationMap({ compact }: LocationMapProps) {
  const { t } = useLanguage();

  return (
    <div className={compact ? "" : "py-20 bg-muted/50"}>
      <div className={compact ? "" : "container"}>
        {!compact && (
          <div className="text-center mb-14">
            <p className="font-ui text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">{t.findUs}</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold">{t.rightOnWater}</h2>
          </div>
        )}
        <div className={`rounded-3xl overflow-hidden shadow-salt border border-foreground/5 ${compact ? "" : "max-w-5xl mx-auto"}`}>
          <iframe
            title="Salt & Fin location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d26700!2d11.0988!3d33.5073!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x13aaa6b4e3a0a0a1%3A0x0!2zMzPCsDMwJzI2LjMiTiAxMcKwMDUnNTUuNyJF!5e0!3m2!1sfr!2stn!4v1700000000000"
            width="100%"
            height={compact ? "280" : "380"}
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full"
          />
          <div className="bg-card p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-ui text-sm font-semibold">{t.locationAddress}</p>
                <p className="font-ui text-xs text-muted-foreground">{t.locationSub}</p>
              </div>
            </div>
            <a
              href="https://maps.app.goo.gl/DeqKciJvVr8knU3T7?g_st=ic"
              target="_blank"
              rel="noopener noreferrer"
              className="font-ui text-xs font-semibold text-primary hover:underline flex-shrink-0"
            >
              {t.viewOnMaps} →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
