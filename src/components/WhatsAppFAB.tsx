import { MessageCircle } from "lucide-react";

export function WhatsAppFAB() {
  return (
    <a
      href="https://wa.me/21623708993?text=Bonjour%2C%20je%20souhaite%20r%C3%A9server%20une%20session%20paddle."
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-[hsl(142,70%,45%)] text-primary-foreground rounded-full p-4 shadow-salt-xl hover:scale-105 active:scale-95 transition-all duration-300"
      aria-label="Contact on WhatsApp"
    >
      <MessageCircle className="w-6 h-6" />
    </a>
  );
}
