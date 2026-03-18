import { Layout } from "@/components/Layout";
import { LocationMap } from "@/components/LocationMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const ContactPage = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const { t } = useLanguage();

  return (
    <Layout>
      <section className="py-20">
        <div className="container max-w-4xl">
          <div className="text-center mb-16">
            <p className="font-ui text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">{t.contact}</p>
            <h1 className="font-display text-5xl md:text-6xl font-bold mb-4">{t.contactTitle}</h1>
            <p className="font-ui text-lg text-muted-foreground">{t.contactDesc}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Contact info */}
            <div className="space-y-8">
              {[
                { icon: MapPin, label: t.location, value: "Zarzis, Hessi Jerbi, Tunisia" },
                { icon: Phone, label: t.phone, value: "+216 23 708 993" },
                { icon: Mail, label: t.email, value: "paddleboardzarzis@gmail.com" },
                { icon: Clock, label: t.hoursLabel, value: t.hoursValue },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-ui text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">{item.label}</p>
                    <p className="font-ui text-sm font-medium">{item.value}</p>
                  </div>
                </div>
              ))}

              <div className="flex gap-3 flex-wrap">
                <a
                  href="https://wa.me/21623708993?text=Bonjour%2C%20je%20souhaite%20r%C3%A9server%20une%20session%20paddle."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[hsl(142,70%,45%)] text-primary-foreground rounded-2xl px-6 py-3 font-ui text-sm font-semibold active:scale-95 transition-all shadow-salt"
                >
                  <MessageCircle className="w-5 h-5" />
                  {t.bookViaWhatsApp}
                </a>
                <a
                  href="https://maps.app.goo.gl/DeqKciJvVr8knU3T7?g_st=ic"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border-2 border-foreground/10 rounded-2xl px-6 py-3 font-ui text-sm font-semibold active:scale-95 transition-all hover:bg-foreground hover:text-background"
                >
                  <MapPin className="w-5 h-5" />
                  {t.viewOnMaps}
                </a>
              </div>
            </div>

            {/* Contact form */}
            <div className="rounded-3xl bg-card p-8 shadow-salt border border-foreground/5">
              <h3 className="font-display text-2xl font-bold mb-6">{t.sendMessage}</h3>
              <div className="flex flex-col gap-5">
                <div>
                  <label className="font-ui text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2 block">{t.name}</label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder={t.yourName}
                    className="h-14 rounded-2xl px-5 text-base"
                  />
                </div>
                <div>
                  <label className="font-ui text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2 block">{t.email}</label>
                  <Input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder={t.yourEmail}
                    inputMode="email"
                    className="h-14 rounded-2xl px-5 text-base"
                  />
                </div>
                <div>
                  <label className="font-ui text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2 block">{t.message}</label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder={t.messagePlaceholder}
                    rows={4}
                    className="w-full rounded-2xl border border-input bg-background px-5 py-4 text-base font-ui resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <Button variant="hero" size="lg" className="w-full" onClick={() => alert("Message sent! (Connect backend to enable)")}>
                  {t.sendBtn}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="mt-16">
          <LocationMap compact />
        </div>
      </section>
    </Layout>
  );
};

export default ContactPage;
