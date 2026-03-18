import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Calendar, Users, Eye } from "lucide-react";

type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

interface Booking {
  id: string;
  customer: string;
  email: string;
  phone: string;
  date: string;
  slot: string;
  boards: number;
  status: BookingStatus;
  total: number;
  notes: string;
}

const statusConfig: Record<BookingStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-pending/15 text-pending" },
  confirmed: { label: "Ready for You", className: "bg-accent/15 text-accent" },
  completed: { label: "Docked", className: "bg-foreground/10 text-foreground/60" },
  cancelled: { label: "Cancelled", className: "bg-destructive/10 text-destructive" },
};

const mockBookings: Booking[] = [
  { id: "B001", customer: "Sarah Mitchell", email: "sarah@email.com", phone: "+1 555-0101", date: "2026-03-18", slot: "7:00 – 9:00 AM", boards: 2, status: "confirmed", total: 90, notes: "" },
  { id: "B002", customer: "James Rodriguez", email: "james@email.com", phone: "+1 555-0102", date: "2026-03-18", slot: "10:00 – 12:00 PM", boards: 1, status: "pending", total: 55, notes: "First timer" },
  { id: "B003", customer: "Lucia Torres", email: "lucia@email.com", phone: "+1 555-0103", date: "2026-03-18", slot: "4:00 – 6:00 PM", boards: 3, status: "confirmed", total: 180, notes: "Group booking" },
  { id: "B004", customer: "Mike Chen", email: "mike@email.com", phone: "+1 555-0104", date: "2026-03-17", slot: "1:00 – 3:00 PM", boards: 1, status: "completed", total: 55, notes: "" },
  { id: "B005", customer: "Emma Wilson", email: "emma@email.com", phone: "+1 555-0105", date: "2026-03-17", slot: "6:30 – 8:00 PM", boards: 2, status: "cancelled", total: 130, notes: "Weather" },
];

const AdminPage = () => {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<BookingStatus | "all">("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const filtered = mockBookings.filter((b) => {
    const matchSearch = b.customer.toLowerCase().includes(search.toLowerCase()) || b.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || b.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const todayCount = mockBookings.filter((b) => b.date === "2026-03-18").length;
  const confirmedCount = mockBookings.filter((b) => b.status === "confirmed").length;
  const totalRevenue = mockBookings.filter((b) => b.status !== "cancelled").reduce((sum, b) => sum + b.total, 0);

  return (
    <Layout hideFooter>
      <div className="min-h-[calc(100vh-4rem)] bg-muted/30">
        <div className="container py-8">
          <div className="mb-8">
            <p className="font-ui text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">Admin Dashboard</p>
            <h1 className="font-display text-4xl font-bold">Reservations</h1>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Today's Bookings", value: todayCount, icon: Calendar },
              { label: "Confirmed", value: confirmedCount, icon: Users },
              { label: "Total Bookings", value: mockBookings.length, icon: Eye },
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
                placeholder="Search by name or ID…"
                className="h-12 rounded-2xl pl-11 text-sm"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {(["all", "pending", "confirmed", "completed", "cancelled"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-4 py-2 rounded-full font-ui text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all active:scale-95 ${
                    filterStatus === s ? "bg-foreground text-background" : "bg-card border border-foreground/10 text-foreground/60 hover:text-foreground"
                  }`}
                >
                  {s === "all" ? "All" : statusConfig[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* Table - mobile cards / desktop table */}
          <div className="hidden md:block rounded-3xl bg-card shadow-salt border border-foreground/5 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-foreground/5">
                  {["ID", "Customer", "Date", "Session", "Boards", "Total", "Status", ""].map((h) => (
                    <th key={h} className="font-ui text-xs uppercase tracking-wider text-muted-foreground font-semibold text-left px-5 py-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id} className="border-b border-foreground/5 last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4 font-ui text-sm tabular-nums font-medium">{b.id}</td>
                    <td className="px-5 py-4">
                      <p className="font-ui text-sm font-semibold">{b.customer}</p>
                      <p className="font-ui text-xs text-muted-foreground">{b.email}</p>
                    </td>
                    <td className="px-5 py-4 font-ui text-sm tabular-nums">{b.date}</td>
                    <td className="px-5 py-4 font-ui text-sm">{b.slot}</td>
                    <td className="px-5 py-4 font-ui text-sm tabular-nums text-center">{b.boards}</td>
                    <td className="px-5 py-4 font-ui text-sm font-semibold tabular-nums">${b.total}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusConfig[b.status].className}`}>
                        {statusConfig[b.status].label}
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
                    <p className="font-ui text-sm font-semibold">{b.customer}</p>
                    <p className="font-ui text-xs text-muted-foreground">{b.id} • {b.date}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusConfig[b.status].className}`}>
                    {statusConfig[b.status].label}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-3">
                  <span className="font-ui text-xs text-muted-foreground tabular-nums">{b.slot} • {b.boards} board{b.boards > 1 ? "s" : ""}</span>
                  <span className="font-ui text-sm font-bold tabular-nums">${b.total}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Detail modal */}
          {selectedBooking && (
            <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
              <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setSelectedBooking(null)} />
              <div className="relative bg-card rounded-t-3xl md:rounded-3xl p-8 w-full max-w-md shadow-salt-xl animate-fade-in z-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="font-ui text-xs text-muted-foreground uppercase tracking-wider">{selectedBooking.id}</p>
                    <h3 className="font-display text-2xl font-bold">{selectedBooking.customer}</h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusConfig[selectedBooking.status].className}`}>
                    {statusConfig[selectedBooking.status].label}
                  </span>
                </div>
                <div className="space-y-3 text-sm font-ui">
                  <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{selectedBooking.email}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{selectedBooking.phone}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="tabular-nums">{selectedBooking.date}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Session</span><span>{selectedBooking.slot}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Boards</span><span className="tabular-nums">{selectedBooking.boards}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-bold tabular-nums">${selectedBooking.total}</span></div>
                  {selectedBooking.notes && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Notes</span><span>{selectedBooking.notes}</span></div>
                  )}
                </div>
                <div className="mt-8 flex gap-3">
                  <Button variant="hero" size="lg" className="flex-1" onClick={() => setSelectedBooking(null)}>
                    Mark Completed
                  </Button>
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
