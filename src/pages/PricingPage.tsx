import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Check, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { BOOKABLE_ACTIVITIES, PRICING } from "@/lib/constants";

const PricingPage = () => {
  const { t, lang } = useLanguage();

  return (
    <Layout>
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-16">
            <p className="font-ui text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">{t.pricing}</p>
            <h1 className="font-display text-5xl md:text-6xl font-bold mb-4">{t.pricingTitle}</h1>
            <p className="font-ui text-lg text-muted-foreground max-w-md mx-auto">{t.pricingDesc}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {BOOKABLE_ACTIVITIES.map((act, i) => {
              const highlighted = act.id === "paddle";
              return (
                <div
                  key={act.id}
                  className={`rounded-3xl p-8 border-2 transition-all animate-fade-in ${
                    highlighted
                      ? "bg-foreground text-background border-foreground shadow-salt-xl scale-[1.02]"
                      : "bg-card border-foreground/5 shadow-salt"
                  }`}
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  {highlighted && (
                    <span className="inline-block px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider mb-4">
                      {t.mostPopular}
                    </span>
                  )}
                  <h3 className="font-display text-2xl font-bold mb-1">{act.label}</h3>
                  <p className={`font-ui text-sm mb-4 ${highlighted ? "text-background/60" : "text-muted-foreground"}`}>
                    {act.tagline[lang]}
                  </p>
                  <div className="mb-6">
                    <span className="font-ui text-4xl font-bold tabular-nums">{act.price} TND</span>
                    <span className={`font-ui text-sm ml-1 ${highlighted ? "text-background/60" : "text-muted-foreground"}`}>
                      / {t.perPerson}
                    </span>
                  </div>
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-2">
                      <Check className={`w-4 h-4 flex-shrink-0 ${highlighted ? "text-primary" : "text-accent"}`} />
                      <span className={`font-ui text-sm ${highlighted ? "text-background/80" : "text-foreground/80"}`}>
                        {act.duration}
                      </span>
                    </div>
                    {act.allowExtraHours && (
                      <div className="flex items-center gap-2">
                        <Check className={`w-4 h-4 flex-shrink-0 ${highlighted ? "text-primary" : "text-accent"}`} />
                        <span className={`font-ui text-sm ${highlighted ? "text-background/80" : "text-foreground/80"}`}>
                          +{PRICING.extraHourTnd} TND / {t.extraHour}
                        </span>
                      </div>
                    )}
                  </div>
                  <Link to="/#book">
                    <Button
                      variant={highlighted ? "hero" : "hero-outline"}
                      size="lg"
                      className="w-full"
                    >
                      {t.bookNow} <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <p className="font-ui text-sm text-muted-foreground">{t.depositNote}</p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default PricingPage;
