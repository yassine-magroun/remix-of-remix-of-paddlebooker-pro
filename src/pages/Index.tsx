import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { LocationMap } from "@/components/LocationMap";
import { Button } from "@/components/ui/button";
import { Shield, Clock, Star, MapPin, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import heroImage from "@/assets/hero-paddle.jpg";
import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";
import gallery4 from "@/assets/gallery-4.jpg";
import gallery5 from "@/assets/gallery-5.jpg";
import gallery6 from "@/assets/gallery-6.jpg";

const testimonials = [
  { name: "Sarah M.", text: "Best paddle experience we've ever had. The boards are premium and the whole booking took 30 seconds.", rating: 5 },
  { name: "James R.", text: "Took the whole family. Easy booking, great gear, and the sunset session was unforgettable.", rating: 5 },
  { name: "Lucia T.", text: "So much better than the other rental places. Clean, organized, and the WhatsApp support is 👌", rating: 5 },
];

const galleryImages = [gallery1, gallery2, gallery3, gallery4, gallery5, gallery6];

const Index = () => {
  const { t } = useLanguage();

  const timeSlots = [
    { time: "7:00 – 9:00 AM", label: t.dawnGlide, remaining: 4, description: t.dawnDesc },
    { time: "10:00 – 12:00 PM", label: t.morningCalm, remaining: 2, description: t.morningDesc },
    { time: "1:00 – 3:00 PM", label: t.middaySun, remaining: 6, description: t.middayDesc },
    { time: "4:00 – 6:00 PM", label: t.goldenHour, remaining: 1, description: t.goldenDesc },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-end pb-12 md:pb-20 overflow-hidden">
        <img
          src={heroImage}
          alt="Crystal clear ocean with paddle board from above"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
        <div className="relative container z-10">
          <div className="max-w-lg">
            <p className="font-ui text-xs uppercase tracking-[0.2em] text-background/60 mb-4 animate-fade-in">
              {t.heroSubtitle}
            </p>
            <h1 className="font-display text-5xl md:text-7xl font-bold text-background leading-[0.9] mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              {t.heroHeadline}
            </h1>
            <p className="font-ui text-background/70 text-lg mb-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              {t.heroDesc}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <Link to="/book">
                <Button variant="hero" size="lg" className="w-full sm:w-auto">
                  {t.bookYourBoard}
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="hero-outline" size="lg" className="w-full sm:w-auto bg-background/10 border-background/30 text-background hover:bg-background hover:text-foreground">
                  {t.viewPricing}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Available Today */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="flex items-center justify-between mb-10">
            <div>
              <p className="font-ui text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">{t.availableToday}</p>
              <h2 className="font-display text-4xl md:text-5xl font-bold">{t.pickSession}</h2>
            </div>
            <Link to="/book" className="hidden md:flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              {t.viewAll} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {timeSlots.map((slot, i) => (
              <Link
                to="/book"
                key={slot.time}
                className="group relative rounded-3xl bg-card p-6 shadow-salt border border-foreground/5 active:scale-[0.98] transition-all duration-300 hover:shadow-salt-lg animate-fade-in"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex justify-between items-start">
                  <span className="font-ui text-xs uppercase tracking-widest text-muted-foreground font-semibold tabular-nums">
                    {slot.time}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                    slot.remaining <= 2 
                      ? "bg-primary/10 text-primary" 
                      : "bg-accent/10 text-accent"
                  }`}>
                    {slot.remaining} {t.left}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-2xl font-semibold leading-tight">{slot.label}</h3>
                <p className="font-ui text-sm text-muted-foreground mt-1">{slot.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-muted/50">
        <div className="container">
          <div className="text-center mb-14">
            <p className="font-ui text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">{t.whySaltFin}</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold">{t.paddleConfidence}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: t.safetyFirst, desc: t.safetyDesc },
              { icon: Clock, title: t.sixtySecBooking, desc: t.sixtySecDesc },
              { icon: MapPin, title: t.primeLocation, desc: t.primeDesc },
            ].map((item, i) => (
              <div
                key={i}
                className="rounded-3xl bg-card p-8 shadow-salt border border-foreground/5 text-center animate-fade-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display text-2xl font-semibold mb-3">{item.title}</h3>
                <p className="font-ui text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-14">
            <p className="font-ui text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">{t.gallery}</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold">{t.gallerySubtitle}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {galleryImages.map((img, i) => (
              <div
                key={i}
                className="rounded-2xl overflow-hidden aspect-square animate-fade-in"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <img
                  src={img}
                  alt={`Paddle boarding ${i + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-muted/50">
        <div className="container">
          <div className="text-center mb-14">
            <p className="font-ui text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">{t.reviews}</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold">{t.whatPaddlersSay}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((te, i) => (
              <div
                key={te.name}
                className="rounded-3xl bg-card p-8 shadow-salt border border-foreground/5 animate-fade-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: te.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="font-ui text-sm text-foreground/80 leading-relaxed mb-4">"{te.text}"</p>
                <p className="font-ui text-xs font-semibold text-muted-foreground uppercase tracking-wider">{te.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location Map */}
      <LocationMap />

      {/* CTA Section */}
      <section className="py-20 bg-foreground">
        <div className="container text-center">
          <h2 className="font-display text-4xl md:text-6xl font-bold text-background leading-[0.9] mb-6">
            {t.readyToGet}<br />{t.onTheWater}
          </h2>
          <p className="font-ui text-background/60 text-lg mb-10 max-w-md mx-auto">
            {t.depositInfo}
          </p>
          <Link to="/book">
            <Button variant="hero" size="lg">
              {t.bookYourBoard}
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </Link>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
