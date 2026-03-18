import { MessageCircle } from "lucide-react";

export function WhatsAppFAB() {
  return (
    <a
      href="https://wa.me/21623708993?text=Hi!%20I'd%20like%20to%20book%20a%20paddle%20session."
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-[hsl(142,70%,45%)] text-primary-foreground rounded-full p-4 shadow-salt-xl hover:scale-105 active:scale-95 transition-all duration-300"
      aria-label="Contact on WhatsApp"
    >
      <MessageCircle className="w-6 h-6" />
    </a>
  );
}
