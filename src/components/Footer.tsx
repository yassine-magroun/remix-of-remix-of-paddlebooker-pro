import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-foreground text-background/80 py-16">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="font-display text-3xl font-bold text-background leading-none mb-1">Salt & Fin</h3>
            <p className="font-ui text-xs uppercase tracking-[0.15em] text-background/40 mb-4">Alo Paddle</p>
            <p className="font-ui text-sm text-background/60 max-w-xs">{t.footerDesc}</p>
          </div>
          <div>
            <h4 className="font-ui text-xs uppercase tracking-widest text-background/40 font-semibold mb-4">{t.navigate}</h4>
            <div className="flex flex-col gap-3">
              {[
                { label: t.home, path: "/" },
                { label: t.bookSession, path: "/book" },
                { label: t.pricing, path: "/pricing" },
                { label: t.faq, path: "/faq" },
                { label: t.contact, path: "/contact" },
              ].map((item) => (
                <Link key={item.path} to={item.path} className="font-ui text-sm text-background/60 hover:text-background transition-colors">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-ui text-xs uppercase tracking-widest text-background/40 font-semibold mb-4">{t.hours}</h4>
            <div className="font-ui text-sm text-background/60 space-y-2">
              <p>{t.monFri}</p>
              <p>{t.satSun}</p>
              <p className="mt-4 text-background/40">{t.weatherPermitting}</p>
            </div>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-background/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-ui text-xs text-background/40">{t.allRights}</p>
          <p className="font-ui text-xs text-background/40">{t.craftedWith}</p>
        </div>
      </div>
    </footer>
  );
}
