import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Calendar, Users, Eye, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

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

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Confirmed", className: "bg-green-100 text-green-800" },
  completed: { label: "Completed", className: "bg-foreground/10 text-foreground/60" },
  cancelled: { label: "Cancelled", className: "bg-destructive/10 text-destructive" },
};

const AdminPage = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setBookings(data as Booking[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    await supabase.from("bookings").update({ status: newStatus }).eq("id", id);
    fetchBookings();
    setSelectedBooking(null);
  };

  const filtered = bookings.filter((b) => {
    const matchSearch = b.customer_name.toLowerCase().includes(search.toLowerCase()) || b.email.toLowerCase().includes(search.toLowerCase());
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
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="font-ui text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">Admin Dashboard</p>
              <h1 className="font-display text-4xl font-bold">Reservations</h1>
            </div>
            <Button variant="outline" size="sm" onClick={fetchBookings} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Today's Bookings", value: todayCount, icon: Calendar },
              { label: "Confirmed", value: confirmedCount, icon: Users },
              { label: "Total Bookings", value: bookings.length, icon: Eye },
              { label: "Revenue", value: `$${totalRevenue}`, icon: Calendar },
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
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="h-12 rounded-2xl pl-11 text-sm"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {["all", "pending", "confirmed", "completed", "cancelled"].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-4 py-2 rounded-full font-ui text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all active:scale-95 ${
                    filterStatus === s ? "bg-foreground text-background" : "bg-card border border-foreground/10 text-foreground/60 hover:text-foreground"
                  }`}
                >
                  {s === "all" ? "All" : (statusConfig[s]?.label || s)}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 font-ui text-muted-foreground">Loading bookings…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 font-ui text-muted-foreground">No bookings found.</div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block rounded-3xl bg-card shadow-salt border border-foreground/5 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-foreground/5">
                      {["Customer", "Date", "Session", "Boards", "Total", "Status", ""].map((h) => (
                        <th key={h} className="font-ui text-xs uppercase tracking-wider text-muted-foreground font-semibold text-left px-5 py-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((b) => (
                      <tr key={b.id} className="border-b border-foreground/5 last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-ui text-sm font-semibold">{b.customer_name}</p>
                          <p className="font-ui text-xs text-muted-foreground">{b.email}</p>
                        </td>
                        <td className="px-5 py-4 font-ui text-sm tabular-nums">{b.session_date}</td>
                        <td className="px-5 py-4 font-ui text-sm">{b.time_slot}</td>
                        <td className="px-5 py-4 font-ui text-sm tabular-nums text-center">{b.num_boards}</td>
                        <td className="px-5 py-4 font-ui text-sm font-semibold tabular-nums">${b.total_price}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusConfig[b.status]?.className || "bg-muted text-foreground"}`}>
                            {statusConfig[b.status]?.label || b.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedBooking(b)}>View</Button>
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
                        <p className="font-ui text-xs text-muted-foreground">{b.session_date}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusConfig[b.status]?.className || "bg-muted"}`}>
                        {statusConfig[b.status]?.label || b.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <span className="font-ui text-xs text-muted-foreground tabular-nums">{b.time_slot} • {b.num_boards} board{b.num_boards > 1 ? "s" : ""}</span>
                      <span className="font-ui text-sm font-bold tabular-nums">${b.total_price}</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Detail modal */}
          {selectedBooking && (
            <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
              <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setSelectedBooking(null)} />
              <div className="relative bg-card rounded-t-3xl md:rounded-3xl p-8 w-full max-w-md shadow-salt-xl animate-fade-in z-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="font-ui text-xs text-muted-foreground uppercase tracking-wider">Booking</p>
                    <h3 className="font-display text-2xl font-bold">{selectedBooking.customer_name}</h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusConfig[selectedBooking.status]?.className || "bg-muted"}`}>
                    {statusConfig[selectedBooking.status]?.label || selectedBooking.status}
                  </span>
                </div>
                <div className="space-y-3 text-sm font-ui">
                  <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{selectedBooking.email}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{selectedBooking.phone}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="tabular-nums">{selectedBooking.session_date}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Session</span><span>{selectedBooking.time_slot}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Boards</span><span className="tabular-nums">{selectedBooking.num_boards}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-bold tabular-nums">${selectedBooking.total_price}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Deposit</span><span className="tabular-nums">${selectedBooking.deposit_amount}</span></div>
                  {selectedBooking.notes && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Notes</span><span>{selectedBooking.notes}</span></div>
                  )}
                  <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span className="tabular-nums">{new Date(selectedBooking.created_at).toLocaleString()}</span></div>
                </div>
                <div className="mt-8 flex gap-3">
                  {selectedBooking.status === "pending" && (
                    <Button variant="hero" size="lg" className="flex-1" onClick={() => updateStatus(selectedBooking.id, "confirmed")}>
                      Confirm
                    </Button>
                  )}
                  {selectedBooking.status === "confirmed" && (
                    <Button variant="hero" size="lg" className="flex-1" onClick={() => updateStatus(selectedBooking.id, "completed")}>
                      Mark Completed
                    </Button>
                  )}
                  <Button variant="outline" size="lg" onClick={() => setSelectedBooking(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminPage;
