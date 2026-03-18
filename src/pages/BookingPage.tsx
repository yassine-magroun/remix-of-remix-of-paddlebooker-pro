import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Minus, Plus, Check, MessageCircle, CreditCard } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const generateDates = () => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }
  return dates;
};

const DEPOSIT = 20;

const BookingPage = () => {
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const dates = generateDates();

  const timeSlots = [
    { id: "1", time: "7:00 – 9:00 AM", label: t.dawnGlide, remaining: 4, price: 45 },
    { id: "2", time: "10:00 – 12:00 PM", label: t.morningCalm, remaining: 2, price: 55 },
    { id: "3", time: "1:00 – 3:00 PM", label: t.middaySun, remaining: 6, price: 55 },
    { id: "4", time: "4:00 – 6:00 PM", label: t.goldenHour, remaining: 1, price: 60 },
    { id: "5", time: "6:30 – 8:00 PM", label: t.sunsetSession, remaining: 3, price: 65 },
  ];

  const selectedSlotData = timeSlots.find((s) => s.id === selectedSlot);
  const total = selectedSlotData ? selectedSlotData.price * quantity : 0;

  const canProceed = () => {
    if (step === 0) return selectedDate && selectedSlot;
    if (step === 1) return form.name && form.phone && form.email;
    return true;
  };

  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedSlotData) return;
    setSubmitting(true);

    const bookingData = {
      customer_name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      session_date: selectedDate.toISOString().split("T")[0],
      time_slot: selectedSlotData.time,
      session_label: selectedSlotData.label,
      num_boards: quantity,
      total_price: total,
      deposit_amount: DEPOSIT * quantity,
      status: "pending",
      notes: form.notes.trim() || null,
    };

    const { error } = await supabase.from("bookings").insert(bookingData);

    setSubmitting(false);

    if (error) {
      toast({
        title: lang === "fr" ? "Erreur" : "Error",
        description: lang === "fr" ? "La réservation n'a pas pu être enregistrée." : "Booking could not be saved.",
        variant: "destructive",
      });
      return;
    }

    setBookingConfirmed(true);
    toast({
      title: lang === "fr" ? "Réservation confirmée !" : "Booking confirmed!",
      description: lang === "fr" ? "Votre réservation a été enregistrée." : "Your booking has been saved.",
    });
  };

  if (bookingConfirmed) {
    return (
      <Layout hideFooter>
        <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center container text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Check className="w-10 h-10 text-primary" />
          </div>
          <h1 className="font-display text-4xl font-bold mb-4">{t.bookingConfirmedTitle}</h1>
          <p className="font-ui text-muted-foreground mb-8 max-w-md">{t.bookingConfirmedDesc}</p>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
            <a
              href="https://wa.me/21623708993?text=Bonjour%2C%20je%20souhaite%20r%C3%A9server%20une%20session%20paddle."
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button variant="hero" size="lg" className="w-full bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)]">
                <MessageCircle className="w-5 h-5 mr-2" />
                {t.bookViaWhatsApp}
              </Button>
            </a>
            <a
              href="https://buy.stripe.com/PLACEHOLDER"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button variant="hero-outline" size="lg" className="w-full">
                <CreditCard className="w-5 h-5 mr-2" />
                {t.payDeposit}
              </Button>
            </a>
          </div>
          <p className="font-ui text-xs text-muted-foreground mt-3">{t.depositRequired}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout hideFooter>
      <div className="min-h-[calc(100vh-4rem)] flex flex-col">
        {/* Progress */}
        <div className="container py-6">
          <div className="flex items-center gap-2 mb-2">
            {step > 0 && (
              <button onClick={() => setStep(step - 1)} className="tap-target flex items-center text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <p className="font-ui text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {t.step} {step + 1} {t.of} 3
            </p>
          </div>
          <div className="flex gap-2">
            {[0, 1, 2].map((s) => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${s <= step ? "bg-primary" : "bg-foreground/10"}`} />
            ))}
          </div>
        </div>

        <div className="flex-1 container pb-32">
          {step === 0 && (
            <div className="animate-fade-in">
              <h1 className="font-display text-4xl font-bold mb-8">{t.chooseSession}</h1>

              <p className="font-ui text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">{t.selectDate}</p>
              <div className="flex gap-2 overflow-x-auto pb-4 -mx-5 px-5 scrollbar-hide">
                {dates.map((d) => {
                  const isSelected = selectedDate?.toDateString() === d.toDateString();
                  const isToday = d.toDateString() === new Date().toDateString();
                  return (
                    <button
                      key={d.toISOString()}
                      onClick={() => setSelectedDate(d)}
                      className={`flex-shrink-0 w-16 py-3 rounded-2xl border-2 text-center transition-all duration-200 active:scale-95 ${
                        isSelected
                          ? "bg-foreground text-background border-foreground"
                          : "bg-card border-foreground/5 hover:border-foreground/20"
                      }`}
                    >
                      <span className="font-ui text-[10px] uppercase tracking-wider block opacity-60">
                        {d.toLocaleDateString(lang === "fr" ? "fr" : "en", { weekday: "short" })}
                      </span>
                      <span className="font-ui text-lg font-bold tabular-nums block">{d.getDate()}</span>
                      {isToday && <span className="font-ui text-[9px] uppercase tracking-wider block text-primary font-bold">{t.today}</span>}
                    </button>
                  );
                })}
              </div>

              <p className="font-ui text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3 mt-8">{t.selectTime}</p>
              <div className="flex flex-col gap-3">
                {timeSlots.map((slot, i) => {
                  const isFull = slot.remaining === 0;
                  const isSelected = selectedSlot === slot.id;
                  return (
                    <button
                      key={slot.id}
                      disabled={isFull}
                      onClick={() => setSelectedSlot(slot.id)}
                      className={`w-full rounded-2xl p-4 border-2 text-left transition-all duration-200 active:scale-[0.98] animate-fade-in ${
                        isFull
                          ? "opacity-40 grayscale pointer-events-none"
                          : isSelected
                          ? "bg-foreground text-background border-foreground"
                          : "bg-card border-foreground/5 hover:border-foreground/20"
                      }`}
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-ui text-xs uppercase tracking-widest opacity-60 block tabular-nums">{slot.time}</span>
                          <span className="font-display text-xl font-semibold block mt-1">{slot.label}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-ui text-lg font-bold tabular-nums block">${slot.price}</span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full inline-block mt-1 ${
                            isSelected
                              ? "bg-background/20 text-background"
                              : slot.remaining <= 2
                              ? "bg-primary/10 text-primary"
                              : "bg-accent/10 text-accent"
                          }`}>
                            {isFull ? t.full : `${slot.remaining} ${t.left.toLowerCase()}`}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedSlot && (
                <div className="mt-8 animate-fade-in">
                  <p className="font-ui text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">{t.numberOfBoards}</p>
                  <div className="flex items-center gap-6">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-14 h-14 rounded-2xl border-2 border-foreground/10 flex items-center justify-center active:scale-95 transition-all hover:border-foreground/30"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="font-ui text-3xl font-bold tabular-nums w-8 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(selectedSlotData?.remaining || 1, quantity + 1))}
                      className="w-14 h-14 rounded-2xl border-2 border-foreground/10 flex items-center justify-center active:scale-95 transition-all hover:border-foreground/30"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="animate-fade-in max-w-md">
              <h1 className="font-display text-4xl font-bold mb-8">{t.yourDetails}</h1>
              <div className="flex flex-col gap-5">
                <div>
                  <label className="font-ui text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2 block">{t.fullName}</label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Smith" className="h-14 rounded-2xl px-5 text-base" />
                </div>
                <div>
                  <label className="font-ui text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2 block">{t.phoneNumber}</label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+216 23 708 993" inputMode="tel" className="h-14 rounded-2xl px-5 text-base" />
                </div>
                <div>
                  <label className="font-ui text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2 block">{t.emailLabel}</label>
                  <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" inputMode="email" className="h-14 rounded-2xl px-5 text-base" />
                </div>
                <div>
                  <label className="font-ui text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2 block">{t.notes}</label>
                  <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="..." className="h-14 rounded-2xl px-5 text-base" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in max-w-md">
              <h1 className="font-display text-4xl font-bold mb-8">{t.confirmPay}</h1>
              <div className="rounded-3xl bg-card p-6 shadow-salt border border-foreground/5 space-y-4">
                <div className="flex justify-between">
                  <span className="font-ui text-sm text-muted-foreground">{t.date}</span>
                  <span className="font-ui text-sm font-semibold">{selectedDate?.toLocaleDateString(lang === "fr" ? "fr" : "en", { weekday: "short", month: "short", day: "numeric" })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-ui text-sm text-muted-foreground">{t.session}</span>
                  <span className="font-ui text-sm font-semibold">{selectedSlotData?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-ui text-sm text-muted-foreground">{t.time}</span>
                  <span className="font-ui text-sm font-semibold tabular-nums">{selectedSlotData?.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-ui text-sm text-muted-foreground">{t.boards}</span>
                  <span className="font-ui text-sm font-semibold tabular-nums">{quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-ui text-sm text-muted-foreground">{t.name}</span>
                  <span className="font-ui text-sm font-semibold">{form.name}</span>
                </div>
                <div className="border-t border-foreground/10 pt-4 mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="font-ui text-sm text-muted-foreground">{t.sessionTotal}</span>
                    <span className="font-ui text-sm font-semibold tabular-nums">${total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-ui text-sm font-bold">{t.depositDueNow}</span>
                    <span className="font-ui text-lg font-bold text-primary tabular-nums">${DEPOSIT * quantity}</span>
                  </div>
                  <p className="font-ui text-xs text-muted-foreground">${total - DEPOSIT * quantity} {t.remainingPayable}</p>
                </div>
              </div>

              <Button
                variant="hero"
                size="lg"
                className="w-full mt-6"
                disabled={submitting}
                onClick={handleConfirmBooking}
              >
                <Check className="w-5 h-5 mr-1" />
                {submitting ? "..." : t.confirmPay} {!submitting && `$${DEPOSIT * quantity}`}
              </Button>
            </div>
          )}
        </div>

        {step < 2 && (
          <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-md border-t border-foreground/5 p-4 z-40">
            <div className="container flex items-center justify-between">
              <div>
                {selectedSlotData && (
                  <>
                    <span className="font-ui text-sm text-muted-foreground">{quantity} {t.boards.toLowerCase()} × ${selectedSlotData.price}</span>
                    <span className="font-ui text-lg font-bold block tabular-nums">${total}</span>
                  </>
                )}
              </div>
              <Button variant="hero" size="lg" disabled={!canProceed()} onClick={() => setStep(step + 1)}>
                {t.continue}
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BookingPage;
