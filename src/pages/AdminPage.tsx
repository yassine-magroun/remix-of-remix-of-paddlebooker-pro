import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Calendar, Users, Eye, RefreshCw, Settings, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Booking {
  id: string;
  customer_name: string;
  email: string;
  phone: string;
  session_date: string;
  time_slot: string;
  session_label: string | null;
  num_boards: number;
  status: string;
  total_price: number;
  deposit_amount: number;
  notes: string | null;
  created_at: string;
}

interface Session {
  id: string;
  session_date: string;
  time_slot: string;
  session_label: string | null;
  capacity: number;
  remaining_spots: number;
  price_per_board: number;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "En attente", className: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Confirmé", className: "bg-green-100 text-green-800" },
  cancelled: { label: "Annulé", className: "bg-destructive/10 text-destructive" },
};

const AdminPage = () => {
  const { toast } = useToast();
  const [tab, setTab] = useState<"bookings" | "sessions">("bookings");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [sessionDateFilter, setSessionDateFilter] = useState(() => new Date().toISOString().split("T")[0]);

  const fetchBookings = async () => {
    setLoading(true);
    const { data } = await supabase.from("bookings").select("*").order("created_at", { ascending: false });
    if (data) setBookings(data as Booking[]);
    setLoading(false);
  };

  const fetchSessions = async () => {
    const { data } = await supabase
      .from("sessions")
      .select("*")
      .gte("session_date", sessionDateFilter)
      .order("session_date")
      .order("time_slot")
      .limit(50);
    if (data) setSessions(data as Session[]);
  };

  useEffect(() => { fetchBookings(); }, []);
  useEffect(() => { if (tab === "sessions") fetchSessions(); }, [tab, sessionDateFilter]);

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from("bookings").update({ status: newStatus }).eq("id", id);
    if (error) {
      toast({ title: "Erreur", description: "Impossible de mettre à jour le statut.", variant: "destructive" });
      return;
    }
    fetchBookings();
    setSelectedBooking(null);
    toast({ title: "Statut mis à jour" });
  };

  const updateSpots = async (sessionId: string, newSpots: number) => {
    const { error } = await supabase.from("sessions").update({ remaining_spots: Math.max(0, newSpots) }).eq("id", sessionId);
    if (error) {
      toast({ title: "Erreur", variant: "destructive" });
      return;
    }
    fetchSessions();
  };

  const filtered = bookings.filter((b) => {
    const matchSearch = b.customer_name.toLowerCase().includes(search.toLowerCase()) || b.email.toLowerCase().includes(search.toLowerCase()) || b.phone.includes(search);
    const matchStatus = filterStatus === "all" || b.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const today = new Date().toISOString().split("T")[0];
  const todayCount = bookings.filter((b) => b.session_date === today).length;
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;
  const totalRevenue = bookings.filter((b) => b.status !== "cancelled").reduce((sum, b) => sum + Number(b.total_price), 0);

  return (
    <Layout hideFooter>
      <div className="min-h-[calc(100vh-4rem)] bg-muted/30">
        <div className="container py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="font-ui text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">Admin</p>
              <h1 className="font-display text-3xl font-bold">Dashboard</h1>
            </div>
            <Button variant="outline" size="sm" onClick={() => { fetchBookings(); if (tab === "sessions") fetchSessions(); }} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Rafraîchir
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button onClick={() => setTab("bookings")} className={`px-5 py-2.5 rounded-full font-ui text-sm font-semibold transition-all ${tab === "bookings" ? "bg-foreground text-background" : "bg-card border border-foreground/10"}`}>
              <Calendar className="w-4 h-4 inline mr-2" />Réservations
            </button>
            <button onClick={() => setTab("sessions")} className={`px-5 py-2.5 rounded-full font-ui text-sm font-semibold transition-all ${tab === "sessions" ? "bg-foreground text-background" : "bg-card border border-foreground/10"}`}>
              <Settings className="w-4 h-4 inline mr-2" />Disponibilité
            </button>
          </div>

          {tab === "bookings" && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Aujourd'hui", value: todayCount, icon: Calendar },
                  { label: "Confirmées", value: confirmedCount, icon: Users },
                  { label: "Total", value: bookings.length, icon: Eye },
                  { label: "Revenus", value: `${totalRevenue} €`, icon: Calendar },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl bg-card p-5 shadow-salt border border-foreground/5">
                    <p className="font-ui text-xs text-muted-foreground uppercase tracking-wider mb-1">{stat.label}</p>
                    <p className="font-ui text-2xl font-bold tabular-nums">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par nom, email, tél…" className="h-12 rounded-2xl pl-11 text-sm" />
                </div>
                <div className="flex gap-2 overflow-x-auto">
                  {["all", "pending", "confirmed", "cancelled"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setFilterStatus(s)}
                      className={`px-4 py-2 rounded-full font-ui text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all active:scale-95 ${
                        filterStatus === s ? "bg-foreground text-background" : "bg-card border border-foreground/10 text-foreground/60 hover:text-foreground"
                      }`}
                    >
                      {s === "all" ? "Tout" : (statusConfig[s]?.label || s)}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="text-center py-20 font-ui text-muted-foreground">Chargement…</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-20 font-ui text-muted-foreground">Aucune réservation trouvée.</div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block rounded-3xl bg-card shadow-salt border border-foreground/5 overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-foreground/5">
                          {["Client", "Tél", "Date", "Créneau", "Planches", "Total", "Acompte", "Statut", ""].map((h) => (
                            <th key={h} className="font-ui text-xs uppercase tracking-wider text-muted-foreground font-semibold text-left px-4 py-4">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((b) => (
                          <tr key={b.id} className="border-b border-foreground/5 last:border-0 hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-4">
                              <p className="font-ui text-sm font-semibold">{b.customer_name}</p>
                              <p className="font-ui text-xs text-muted-foreground">{b.email}</p>
                            </td>
                            <td className="px-4 py-4 font-ui text-sm">{b.phone}</td>
                            <td className="px-4 py-4 font-ui text-sm tabular-nums">{b.session_date}</td>
                            <td className="px-4 py-4 font-ui text-sm">{b.time_slot}</td>
                            <td className="px-4 py-4 font-ui text-sm tabular-nums text-center">{b.num_boards}</td>
                            <td className="px-4 py-4 font-ui text-sm font-semibold tabular-nums">{b.total_price} €</td>
                            <td className="px-4 py-4 font-ui text-sm tabular-nums">{b.deposit_amount} €</td>
                            <td className="px-4 py-4">
                              <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusConfig[b.status]?.className || "bg-muted text-foreground"}`}>
                                {statusConfig[b.status]?.label || b.status}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <Button variant="ghost" size="sm" onClick={() => setSelectedBooking(b)}>Voir</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="md:hidden space-y-3">
                    {filtered.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => setSelectedBooking(b)}
                        className="w-full rounded-2xl bg-card p-5 shadow-salt border border-foreground/5 text-left active:scale-[0.98] transition-all"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-ui text-sm font-semibold">{b.customer_name}</p>
                            <p className="font-ui text-xs text-muted-foreground">{b.session_date} • {b.time_slot}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusConfig[b.status]?.className || "bg-muted"}`}>
                            {statusConfig[b.status]?.label || b.status}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-3">
                          <span className="font-ui text-xs text-muted-foreground">{b.phone} • {b.num_boards} planche{b.num_boards > 1 ? "s" : ""}</span>
                          <span className="font-ui text-sm font-bold tabular-nums">{b.total_price} €</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {tab === "sessions" && (
            <div>
              <div className="mb-6">
                <label className="font-ui text-xs uppercase tracking-wider text-muted-foreground mb-2 block">À partir du</label>
                <Input type="date" value={sessionDateFilter} onChange={(e) => setSessionDateFilter(e.target.value)} className="max-w-xs h-12 rounded-2xl" />
              </div>
              <div className="grid gap-3">
                {sessions.map((s) => (
                  <div key={s.id} className="rounded-2xl bg-card p-5 shadow-salt border border-foreground/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="font-ui text-sm font-semibold">{s.session_date} — {s.time_slot}</p>
                      <p className="font-ui text-xs text-muted-foreground">{s.session_label}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-ui text-xs text-muted-foreground">Places :</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateSpots(s.id, s.remaining_spots - 1)} className="w-8 h-8 rounded-lg border border-foreground/10 flex items-center justify-center hover:bg-muted transition-colors font-bold">−</button>
                        <span className={`font-ui text-lg font-bold tabular-nums w-8 text-center ${s.remaining_spots <= 0 ? "text-destructive" : s.remaining_spots <= 2 ? "text-primary" : ""}`}>{s.remaining_spots}</span>
                        <button onClick={() => updateSpots(s.id, s.remaining_spots + 1)} className="w-8 h-8 rounded-lg border border-foreground/10 flex items-center justify-center hover:bg-muted transition-colors font-bold">+</button>
                      </div>
                      <span className="font-ui text-xs text-muted-foreground">/ {s.capacity}</span>
                    </div>
                  </div>
                ))}
                {sessions.length === 0 && <p className="text-center py-10 font-ui text-muted-foreground">Aucune session trouvée.</p>}
              </div>
            </div>
          )}

          {/* Booking detail modal */}
          {selectedBooking && (
            <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
              <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setSelectedBooking(null)} />
              <div className="relative bg-card rounded-t-3xl md:rounded-3xl p-8 w-full max-w-md shadow-salt-xl animate-fade-in z-10 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="font-ui text-xs text-muted-foreground uppercase tracking-wider">Réservation</p>
                    <h3 className="font-display text-2xl font-bold">{selectedBooking.customer_name}</h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusConfig[selectedBooking.status]?.className || "bg-muted"}`}>
                    {statusConfig[selectedBooking.status]?.label || selectedBooking.status}
                  </span>
                </div>
                <div className="space-y-3 text-sm font-ui">
                  <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{selectedBooking.email}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Téléphone</span><span>{selectedBooking.phone}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="tabular-nums">{selectedBooking.session_date}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Créneau</span><span>{selectedBooking.time_slot}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Planches</span><span className="tabular-nums">{selectedBooking.num_boards}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-bold tabular-nums">{selectedBooking.total_price} €</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Acompte</span><span className="tabular-nums">{selectedBooking.deposit_amount} €</span></div>
                  {selectedBooking.notes && <div className="flex justify-between"><span className="text-muted-foreground">Notes</span><span>{selectedBooking.notes}</span></div>}
                  <div className="flex justify-between"><span className="text-muted-foreground">Créé le</span><span className="tabular-nums">{new Date(selectedBooking.created_at).toLocaleString("fr")}</span></div>
                </div>
                <div className="mt-8 space-y-2">
                  <p className="font-ui text-xs uppercase tracking-wider text-muted-foreground mb-2">Changer le statut</p>
                  <div className="flex gap-2 flex-wrap">
                    {["pending", "confirmed", "cancelled"].map((s) => (
                      <Button
                        key={s}
                        variant={selectedBooking.status === s ? "hero" : "outline"}
                        size="sm"
                        disabled={selectedBooking.status === s}
                        onClick={() => updateStatus(selectedBooking.id, s)}
                      >
                        {statusConfig[s]?.label || s}
                      </Button>
                    ))}
                  </div>
                </div>
                <Button variant="outline" size="lg" className="w-full mt-6" onClick={() => setSelectedBooking(null)}>
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminPage;
