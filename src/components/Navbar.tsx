import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { lang, setLang, t } = useLanguage();

  const navItems = [
    { label: t.home, path: "/" },
    { label: t.pricing, path: "/pricing" },
    { label: t.faq, path: "/faq" },
    { label: t.contact, path: "/contact" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-foreground/5">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex flex-col leading-none">
          <span className="font-display text-2xl font-bold tracking-tight">Salt & Fin</span>
          <span className="font-ui text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Alo Paddle</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`font-ui text-sm tracking-tight transition-colors hover:text-primary ${
                location.pathname === item.path ? "text-primary font-semibold" : "text-muted-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}

          {/* Language switcher */}
          <div className="flex items-center gap-1 border border-foreground/10 rounded-full px-1 py-1">
            <button
              onClick={() => setLang("en")}
              className={`font-ui text-xs font-semibold px-2.5 py-1 rounded-full transition-all ${
                lang === "en" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang("fr")}
              className={`font-ui text-xs font-semibold px-2.5 py-1 rounded-full transition-all ${
                lang === "fr" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              FR
            </button>
          </div>

          <Link to="/book">
            <Button variant="hero" size="default">
              {t.bookNow}
            </Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden tap-target flex items-center justify-center"
          aria-label="Toggle menu"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-background border-b border-foreground/5 animate-fade-in">
          <div className="container py-6 flex flex-col gap-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={`font-ui text-lg py-2 transition-colors ${
                  location.pathname === item.path ? "text-primary font-semibold" : "text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}

            {/* Mobile language switcher */}
            <div className="flex items-center gap-2 py-2">
              <button
                onClick={() => setLang("en")}
                className={`font-ui text-sm font-semibold px-3 py-1.5 rounded-full transition-all ${
                  lang === "en" ? "bg-foreground text-background" : "border border-foreground/10 text-muted-foreground"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang("fr")}
                className={`font-ui text-sm font-semibold px-3 py-1.5 rounded-full transition-all ${
                  lang === "fr" ? "bg-foreground text-background" : "border border-foreground/10 text-muted-foreground"
                }`}
              >
                FR
              </button>
            </div>

            <Link to="/book" onClick={() => setOpen(false)}>
              <Button variant="hero" size="lg" className="w-full mt-2">
                {t.bookNow}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
