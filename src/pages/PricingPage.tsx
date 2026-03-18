import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Check, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const PricingPage = () => {
  const { t } = useLanguage();

  const plans = [
    {
      name: t.singleSession,
      price: "$45–65",
      unit: t.perBoard,
      description: t.singleDesc,
      features: ["2-hour session", "Board & paddle included", "PFD included", "Safety briefing", "On-site changing rooms"],
      highlighted: false,
    },
    {
      name: t.dayPass,
      price: "$120",
      unit: t.perPerson,
      description: t.dayDesc,
      features: ["Unlimited sessions", "Priority booking", "Board & paddle included", "PFD included", "Locker access", "Complimentary water"],
      highlighted: true,
    },
    {
      name: t.weeklyPass,
      price: "$350",
      unit: t.perPerson,
      description: t.weeklyDesc,
      features: ["7 days unlimited", "Priority booking", "Premium board selection", "PFD included", "Locker access", "Free parking"],
      highlighted: false,
    },
  ];

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
            {plans.map((plan, i) => (
              <div
                key={i}
                className={`rounded-3xl p-8 border-2 transition-all animate-fade-in ${
                  plan.highlighted
                    ? "bg-foreground text-background border-foreground shadow-salt-xl scale-[1.02]"
                    : "bg-card border-foreground/5 shadow-salt"
                }`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {plan.highlighted && (
                  <span className="inline-block px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider mb-4">
                    {t.mostPopular}
                  </span>
                )}
                <h3 className="font-display text-2xl font-bold mb-1">{plan.name}</h3>
                <p className={`font-ui text-sm mb-4 ${plan.highlighted ? "text-background/60" : "text-muted-foreground"}`}>
                  {plan.description}
                </p>
                <div className="mb-6">
                  <span className="font-ui text-4xl font-bold tabular-nums">{plan.price}</span>
                  <span className={`font-ui text-sm ml-1 ${plan.highlighted ? "text-background/60" : "text-muted-foreground"}`}>
                    {plan.unit}
                  </span>
                </div>
                <div className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <Check className={`w-4 h-4 flex-shrink-0 ${plan.highlighted ? "text-primary" : "text-accent"}`} />
                      <span className={`font-ui text-sm ${plan.highlighted ? "text-background/80" : "text-foreground/80"}`}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link to="/book">
                  <Button
                    variant={plan.highlighted ? "hero" : "hero-outline"}
                    size="lg"
                    className="w-full"
                  >
                    {t.bookNow} <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default PricingPage;
