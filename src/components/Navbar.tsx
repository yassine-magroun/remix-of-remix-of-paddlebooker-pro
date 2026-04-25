import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { BRAND_IMAGES } from "@/lib/constants";

const NAV_ITEMS = [
  { label: { fr: "Expérience", en: "Experience" }, href: "/#experiences" },
  { label: { fr: "Tarifs", en: "Pricing" }, href: "/pricing" },
  { label: { fr: "Galerie", en: "Gallery" }, href: "/#gallery" },
  { label: { fr: "Contact", en: "Contact" }, href: "/contact" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { lang, setLang, t } = useLanguage();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const handleLogoError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = BRAND_IMAGES.logoFallback;
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/75 backdrop-blur-lg border-b border-foreground/10"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 h-16 md:h-20 flex items-center justify-between gap-4">
        {/* Left — Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="Alo Paddle">
          <img
            src={BRAND_IMAGES.logo}
            onError={handleLogoError}
            alt="Alo Paddle"
            className="h-11 md:h-14 w-auto object-contain"
            style={{ background: "transparent" }}
          />
        </Link>

        {/* Center — Desktop nav */}
        <ul className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="font-ui text-[13px] tracking-wide text-foreground/80 hover:text-foreground transition-colors"
              >
                {item.label[lang]}
              </a>
            </li>
          ))}
        </ul>

        {/* Right — Lang + CTA + Mobile trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(lang === "fr" ? "en" : "fr")}
            className="hidden sm:flex items-center gap-1 font-ui text-[11px] uppercase tracking-[0.2em] text-foreground/70 hover:text-foreground transition-colors"
            aria-label="Change language"
          >
            <span className={lang === "fr" ? "text-foreground font-semibold" : ""}>FR</span>
            <span className="text-foreground/30">·</span>
            <span className={lang === "en" ? "text-foreground font-semibold" : ""}>EN</span>
          </button>

          <Link
            to="/#book"
            className="hidden md:inline-flex items-center px-5 py-2.5 rounded-full bg-foreground text-background font-ui text-[12px] uppercase tracking-[0.18em] font-semibold hover:bg-foreground/90 transition-colors"
          >
            {t.bookNow}
          </Link>

          <Link
            to="/#book"
            className="md:hidden inline-flex items-center px-4 py-2 rounded-full bg-foreground text-background font-ui text-[11px] uppercase tracking-[0.18em] font-semibold"
          >
            {t.bookNow}
          </Link>

          <button
            onClick={() => setOpen((o) => !o)}
            className="md:hidden w-10 h-10 flex items-center justify-center text-foreground"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden absolute top-full inset-x-0 bg-background/95 backdrop-blur-xl border-b border-foreground/10 shadow-lg animate-fade-in">
          <ul className="px-4 py-4 flex flex-col">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block py-3 font-ui text-sm text-foreground/90 hover:text-foreground"
                >
                  {item.label[lang]}
                </a>
              </li>
            ))}
            <li className="mt-2 pt-3 border-t border-foreground/10 flex items-center gap-4 font-ui text-[11px] uppercase tracking-[0.25em]">
              <button
                onClick={() => setLang("fr")}
                className={lang === "fr" ? "text-foreground font-semibold" : "text-foreground/60"}
              >
                Français
              </button>
              <span className="text-foreground/20">·</span>
              <button
                onClick={() => setLang("en")}
                className={lang === "en" ? "text-foreground font-semibold" : "text-foreground/60"}
              >
                English
              </button>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}
