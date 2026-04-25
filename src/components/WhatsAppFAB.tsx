import { MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function WhatsAppFAB() {
  const { lang } = useLanguage();
  const label = lang === "fr" ? "Une question ?" : "Got a question?";
  return (
    <a
      href="https://wa.me/21623708993?text=Bonjour%2C%20j%27ai%20une%20question%20sur%20Alo%20Paddle."
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 group inline-flex items-center gap-2 pl-3 pr-4 py-3 rounded-full bg-[hsl(142,70%,45%)] text-white shadow-xl hover:shadow-2xl hover:scale-[1.03] active:scale-95 transition-all"
      aria-label={label}
    >
      <span className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
        <MessageCircle className="w-5 h-5" />
      </span>
      <span className="font-ui text-xs font-semibold uppercase tracking-wide max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-[10rem] group-hover:opacity-100 md:max-w-[10rem] md:opacity-100 transition-all duration-300">
        {label}
      </span>
    </a>
  );
}
