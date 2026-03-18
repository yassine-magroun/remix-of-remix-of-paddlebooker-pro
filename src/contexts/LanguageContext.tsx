import { createContext, useContext, useState, ReactNode } from "react";

type Lang = "en" | "fr";

const translations = {
  en: {
    // Nav
    home: "Home",
    pricing: "Pricing",
    faq: "FAQ",
    contact: "Contact",
    bookNow: "Book Now",
    viewPricing: "View Pricing",
    bookYourBoard: "Book Your Board",

    // Hero
    heroSubtitle: "Salt & Fin | Alo Paddle",
    heroHeadline: "The water is waiting.",
    heroDesc: "Premium boards. Prime spots. Book your session in under 60 seconds.",

    // Available Today
    availableToday: "Available Today",
    pickSession: "Pick your session",
    viewAll: "View all",
    left: "LEFT",
    dawnGlide: "Dawn Glide",
    morningCalm: "Morning Calm",
    middaySun: "Midday Sun",
    goldenHour: "Golden Hour",
    sunsetSession: "Sunset Session",
    dawnDesc: "Glassy water, golden light",
    morningDesc: "Perfect for beginners",
    middayDesc: "Peak warmth, lively waves",
    goldenDesc: "Sunset paddle, stunning views",

    // Trust
    whySaltFin: "Why Salt & Fin",
    paddleConfidence: "Paddle with confidence",
    safetyFirst: "Safety First",
    safetyDesc: "Coast Guard-rated boards, PFDs included, and a safety briefing with every session.",
    sixtySecBooking: "60-Second Booking",
    sixtySecDesc: "No calls, no emails. Pick your slot, pay your deposit, and show up ready to paddle.",
    primeLocation: "Prime Location",
    primeDesc: "Steps from the water. Easy parking, changing facilities, and board storage on-site.",

    // Testimonials
    reviews: "Reviews",
    whatPaddlersSay: "What paddlers say",

    // Gallery
    gallery: "Gallery",
    gallerySubtitle: "Sun, salt & perfect sessions",

    // Location
    findUs: "Find Us",
    rightOnWater: "Right on the water",
    locationAddress: "Zarzis, Hessi Jerbi, Tunisia",
    locationSub: "Steps from the water • Free parking available",
    viewOnMaps: "View on Google Maps",

    // CTA
    readyToGet: "Ready to get",
    onTheWater: "on the water?",
    depositInfo: "Deposit of $20 secures your board. Pay the rest at the beach.",

    // Footer
    footerDesc: "Premium paddle board rentals. Sun, salt, and the perfect session — every time.",
    navigate: "Navigate",
    bookSession: "Book a Session",
    hours: "Hours",
    monFri: "Mon – Fri: 7:00 AM – 7:00 PM",
    satSun: "Sat – Sun: 6:00 AM – 8:00 PM",
    weatherPermitting: "Weather permitting",
    allRights: "© 2026 Salt & Fin | Alo Paddle. All rights reserved.",
    craftedWith: "Crafted with ☀️ on the coast",

    // Contact
    contactTitle: "Get in touch",
    contactDesc: "Questions, group bookings, or just want to say hey — we're here.",
    location: "Location",
    phone: "Phone",
    email: "Email",
    hoursLabel: "Hours",
    hoursValue: "Mon–Fri 7AM–7PM • Sat–Sun 6AM–8PM",
    chatWhatsApp: "Chat on WhatsApp",
    sendMessage: "Send a message",
    name: "Name",
    yourName: "Your name",
    yourEmail: "you@example.com",
    message: "Message",
    messagePlaceholder: "Tell us how we can help…",
    sendBtn: "Send Message",

    // Pricing
    pricingTitle: "Simple, honest pricing",
    pricingDesc: "No hidden fees. Deposit of $20 secures your board.",
    singleSession: "Single Session",
    dayPass: "Day Pass",
    weeklyPass: "Weekly Pass",
    mostPopular: "Most Popular",
    perBoard: "per board",
    perPerson: "per person",
    singleDesc: "Perfect for a one-time paddle experience",
    dayDesc: "Unlimited sessions for the entire day",
    weeklyDesc: "A full week of paddling freedom",

    // Booking
    chooseSession: "Choose your session",
    selectDate: "Select a Date",
    selectTime: "Select a Time Slot",
    numberOfBoards: "Number of Boards",
    yourDetails: "Your details",
    fullName: "Full Name",
    phoneNumber: "Phone Number",
    emailLabel: "Email",
    notes: "Notes (optional)",
    confirmPay: "Confirm & Pay",
    date: "Date",
    session: "Session",
    time: "Time",
    boards: "Boards",
    sessionTotal: "Session total",
    depositDueNow: "Deposit due now",
    remainingPayable: "payable at the beach.",
    continue: "Continue",
    step: "Step",
    of: "of",
    today: "Today",
    full: "FULL",

    // FAQ
    faqTitle: "Questions? Answered.",
    faqDesc: "Everything you need to know before hitting the water.",
    faq1q: "Do I need experience to paddle board?",
    faq1a: "Not at all! We provide a complimentary safety briefing with every session. Our calm bay is perfect for beginners, and our staff are always on hand to help.",
    faq2q: "What's included in a session?",
    faq2a: "Every session includes a premium stand-up paddle board, paddle, personal flotation device (PFD), and a safety briefing. We also have changing rooms and lockers on-site.",
    faq3q: "How does the deposit work?",
    faq3a: "A $20 deposit per board secures your booking. The remaining balance is payable when you arrive at the beach. If you cancel 24+ hours in advance, your deposit is fully refundable.",
    faq4q: "What if the weather is bad?",
    faq4a: "Safety is our priority. If conditions are unsafe, we'll contact you to reschedule or provide a full refund. Light rain doesn't usually affect paddling — it can actually be magical!",
    faq5q: "Can I bring my kids?",
    faq5a: "Absolutely! Children under 12 must be accompanied by an adult on a tandem board. We have youth-sized PFDs available. Kids 12+ can paddle solo with parental consent.",
    faq6q: "What should I wear?",
    faq6a: "Wear comfortable clothes you don't mind getting wet — swimwear, board shorts, or athletic wear. We recommend water shoes and sun protection. We provide dry bags for your valuables.",
    faq7q: "How early should I arrive?",
    faq7a: "Please arrive 15 minutes before your session for check-in and your safety briefing. Late arrivals may have their session time shortened.",
    faq8q: "Do you offer group rates?",
    faq8a: "Yes! Groups of 6 or more receive a 15% discount. Contact us via WhatsApp or the contact page to arrange group bookings.",
  },
  fr: {
    home: "Accueil",
    pricing: "Tarifs",
    faq: "FAQ",
    contact: "Contact",
    bookNow: "Réserver",
    viewPricing: "Voir les prix",
    bookYourBoard: "Réserver votre planche",

    heroSubtitle: "Salt & Fin | Alo Paddle",
    heroHeadline: "L'eau vous attend.",
    heroDesc: "Planches premium. Spots idéaux. Réservez en moins de 60 secondes.",

    availableToday: "Disponible aujourd'hui",
    pickSession: "Choisissez votre session",
    viewAll: "Voir tout",
    left: "DISPO",
    dawnGlide: "Glisse matinale",
    morningCalm: "Calme du matin",
    middaySun: "Soleil de midi",
    goldenHour: "Heure dorée",
    sunsetSession: "Session coucher de soleil",
    dawnDesc: "Eau lisse, lumière dorée",
    morningDesc: "Parfait pour les débutants",
    middayDesc: "Chaleur maximale, vagues animées",
    goldenDesc: "Paddle au coucher du soleil, vues magnifiques",

    whySaltFin: "Pourquoi Salt & Fin",
    paddleConfidence: "Pagayez en toute confiance",
    safetyFirst: "Sécurité avant tout",
    safetyDesc: "Planches homologuées, gilets de sauvetage inclus, et un briefing sécurité à chaque session.",
    sixtySecBooking: "Réservation en 60 secondes",
    sixtySecDesc: "Pas d'appels, pas d'emails. Choisissez votre créneau, payez votre acompte, et venez pagayer.",
    primeLocation: "Emplacement idéal",
    primeDesc: "À deux pas de l'eau. Parking facile, vestiaires et stockage des planches sur place.",

    reviews: "Avis",
    whatPaddlersSay: "Ce que disent nos pagayeurs",

    gallery: "Galerie",
    gallerySubtitle: "Soleil, sel & sessions parfaites",

    findUs: "Nous trouver",
    rightOnWater: "Au bord de l'eau",
    locationAddress: "Zarzis, Hessi Jerbi, Tunisie",
    locationSub: "À deux pas de l'eau • Parking gratuit",
    viewOnMaps: "Voir sur Google Maps",

    readyToGet: "Prêt à prendre",
    onTheWater: "le large ?",
    depositInfo: "Un acompte de 20 $ réserve votre planche. Le reste se paie sur la plage.",

    footerDesc: "Location de paddle premium. Soleil, sel et la session parfaite — à chaque fois.",
    navigate: "Navigation",
    bookSession: "Réserver une session",
    hours: "Horaires",
    monFri: "Lun – Ven : 7h00 – 19h00",
    satSun: "Sam – Dim : 6h00 – 20h00",
    weatherPermitting: "Selon les conditions météo",
    allRights: "© 2026 Salt & Fin | Alo Paddle. Tous droits réservés.",
    craftedWith: "Fait avec ☀️ sur la côte",

    contactTitle: "Contactez-nous",
    contactDesc: "Questions, réservations de groupe, ou juste envie de dire bonjour — nous sommes là.",
    location: "Adresse",
    phone: "Téléphone",
    email: "Email",
    hoursLabel: "Horaires",
    hoursValue: "Lun–Ven 7h–19h • Sam–Dim 6h–20h",
    chatWhatsApp: "Discuter sur WhatsApp",
    sendMessage: "Envoyer un message",
    name: "Nom",
    yourName: "Votre nom",
    yourEmail: "vous@exemple.com",
    message: "Message",
    messagePlaceholder: "Dites-nous comment nous pouvons vous aider…",
    sendBtn: "Envoyer",

    pricingTitle: "Tarifs simples et honnêtes",
    pricingDesc: "Pas de frais cachés. Un acompte de 20 $ réserve votre planche.",
    singleSession: "Session unique",
    dayPass: "Pass journée",
    weeklyPass: "Pass semaine",
    mostPopular: "Le plus populaire",
    perBoard: "par planche",
    perPerson: "par personne",
    singleDesc: "Parfait pour une première expérience",
    dayDesc: "Sessions illimitées toute la journée",
    weeklyDesc: "Une semaine de paddle en liberté",

    chooseSession: "Choisissez votre session",
    selectDate: "Sélectionnez une date",
    selectTime: "Sélectionnez un créneau",
    numberOfBoards: "Nombre de planches",
    yourDetails: "Vos coordonnées",
    fullName: "Nom complet",
    phoneNumber: "Numéro de téléphone",
    emailLabel: "Email",
    notes: "Notes (optionnel)",
    confirmPay: "Confirmer & Payer",
    date: "Date",
    session: "Session",
    time: "Heure",
    boards: "Planches",
    sessionTotal: "Total session",
    depositDueNow: "Acompte à payer",
    remainingPayable: "à payer sur la plage.",
    continue: "Continuer",
    step: "Étape",
    of: "sur",
    today: "Auj.",
    full: "COMPLET",

    faqTitle: "Questions ? Réponses.",
    faqDesc: "Tout ce que vous devez savoir avant de prendre l'eau.",
    faq1q: "Ai-je besoin d'expérience pour faire du paddle ?",
    faq1a: "Pas du tout ! Nous offrons un briefing sécurité gratuit à chaque session. Notre baie calme est idéale pour les débutants.",
    faq2q: "Qu'est-ce qui est inclus dans une session ?",
    faq2a: "Chaque session inclut une planche de paddle premium, une pagaie, un gilet de sauvetage et un briefing sécurité. Vestiaires et casiers sur place.",
    faq3q: "Comment fonctionne l'acompte ?",
    faq3a: "Un acompte de 20 $ par planche sécurise votre réservation. Le solde est à payer sur place. Annulation gratuite 24h à l'avance.",
    faq4q: "Et si le temps est mauvais ?",
    faq4a: "La sécurité est notre priorité. Si les conditions sont dangereuses, nous vous contactons pour reporter ou rembourser intégralement.",
    faq5q: "Puis-je venir avec mes enfants ?",
    faq5a: "Bien sûr ! Les enfants de moins de 12 ans doivent être accompagnés d'un adulte sur un paddle tandem. Gilets enfants disponibles.",
    faq6q: "Comment dois-je m'habiller ?",
    faq6a: "Portez des vêtements confortables qui peuvent être mouillés — maillot, short, tenue de sport. Chaussures d'eau et crème solaire recommandées.",
    faq7q: "À quelle heure dois-je arriver ?",
    faq7a: "Veuillez arriver 15 minutes avant votre session pour l'inscription et le briefing sécurité.",
    faq8q: "Proposez-vous des tarifs de groupe ?",
    faq8a: "Oui ! Les groupes de 6+ bénéficient de 15 % de réduction. Contactez-nous via WhatsApp ou la page contact.",
  },
} as const;

type Translations = Record<string, string>;

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: translations.en,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
