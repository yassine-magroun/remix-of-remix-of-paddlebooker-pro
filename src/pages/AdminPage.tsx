import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart2,
  Calendar,
  ChevronRight,
  LogOut,
  Package,
  RefreshCw,
  Search,
  Settings,
  Sunrise,
  Sunset,
  Users,
  Zap,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { INVENTORY_MAX_UNITS, SUNRISE_SLOTS, SUNSET_SLOTS, SUNSET_MIN_GROUP } from '@/lib/constants';

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface SupaSession {
  id: string;
  session_date: string;
  time_slot: string;
  session_label: string | null;
  capacity: number;
  remaining_spots: number;
  price_per_board: number;
}

interface Equipment {
  id: string;
  slug: string;
  label: string;
  total_quantity: number;
  available_quantity: number;
  deposit_amount: number;
  sort_order: number;
}

type Tab = 'planning' | 'bookings' | 'analytics' | 'sessions' | 'equipment';

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  pending:            { label: 'En attente',     dot: 'bg-yellow-400',  badge: 'bg-yellow-100 text-yellow-800'   },
  pending_formation:  { label: 'En formation',   dot: 'bg-blue-400',    badge: 'bg-blue-100 text-blue-800'       },
  confirmed_deposit:  { label: 'Acompte reçu',   dot: 'bg-emerald-400', badge: 'bg-emerald-100 text-emerald-800' },
  confirmed:          { label: 'Confirmé',        dot: 'bg-green-400',   badge: 'bg-green-100 text-green-800'     },
  cancelled:          { label: 'Annulé',          dot: 'bg-red-400',     badge: 'bg-red-100 text-red-800'         },
};

const TODAY = new Date().toISOString().split('T')[0];
const TOMORROW = new Date(Date.now() + 86_400_000).toISOString().split('T')[0];

// Hardcoded admin bypass — grants access to anyone whose Supabase auth email
// matches this address, regardless of any profile/role table checks.
const ADMIN_EMAIL = 'magrouneyy@gmail.com';

// ─── Demo / Mock data (shown when DB is unreachable) ─────────────────────────

const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'demo-001',
    customer_name: 'Sophie Martin',
    email: 'sophie.martin@demo.com',
    phone: '+216 55 123 456',
    session_date: TODAY,
    time_slot: '7:00 – 9:00',
    session_label: 'Paddle · 1h · Sunrise',
    num_boards: 2,
    status: 'confirmed_deposit',
    total_price: 100,
    deposit_amount: 40,
    notes: `RDV Hessi Jerbi`,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-002',
    customer_name: 'Karim Bensalem',
    email: 'karim.b@demo.com',
    phone: '+216 98 765 432',
    session_date: TODAY,
    time_slot: '18:30 – 20:00',
    session_label: 'Kayak Transparent · 25 min · Sunset',
    num_boards: 1,
    status: 'pending',
    total_price: 50,
    deposit_amount: 20,
    notes: `RDV Hessi Jerbi`,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-003',
    customer_name: 'Amira Trabelsi',
    email: 'amira.t@demo.com',
    phone: '+216 22 334 455',
    session_date: TOMORROW,
    time_slot: '10:00 – 12:00',
    session_label: 'Paddle · 2h · Sunrise',
    num_boards: 3,
    status: 'confirmed',
    total_price: 210,
    deposit_amount: 84,
    notes: `RDV Hessi Jerbi`,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-004',
    customer_name: 'Lucas Dubois',
    email: 'lucas.d@demo.com',
    phone: '+33 6 12 34 56 78',
    session_date: TOMORROW,
    time_slot: '18:30 – 20:00',
    session_label: 'Paddle Vélo · 1h · Sunset',
    num_boards: 2,
    status: 'pending_formation',
    total_price: 120,
    deposit_amount: 48,
    notes: `RDV Hessi Jerbi · Groupe en formation`,
    created_at: new Date().toISOString(),
  },
];

// ─── Auth Screen ──────────────────────────────────────────────────────────────

function AuthScreen() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: 'Accès refusé', description: error.message, variant: 'destructive' });
      return;
    }
    // Hardcoded bypass: reject any email that isn't the registered admin.
    if (data.user?.email !== 'magrouneyy@gmail.com') {
      await supabase.auth.signOut();
      toast({ title: 'Accès refusé', description: 'Ce compte n\'est pas autorisé.', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <p className="font-sans text-[10px] uppercase tracking-[0.4em] text-ivory/40 mb-2 text-center">
          Alo Paddle · Admin
        </p>
        <h1 className="font-serif text-3xl text-ivory text-center mb-8">Accès Control Center</h1>
        <form onSubmit={login} className="space-y-4">
          <input
            type="email"
            placeholder="Email administrateur"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-ivory placeholder:text-ivory/30 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-accent-gold"
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-ivory placeholder:text-ivory/30 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-accent-gold"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full bg-ivory text-dark font-sans text-xs uppercase tracking-[0.3em] font-semibold disabled:opacity-50"
          >
            {loading ? 'Connexion…' : 'Entrer'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────

const AdminPage = () => {
  const { toast } = useToast();

  // Auth
  const [authReady, setAuthReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Hardcoded bypass: only ADMIN_EMAIL is granted access — no profile/role DB lookup needed.
      const email = session?.user?.email ?? '';
      const isAdmin = !!session && email === ADMIN_EMAIL;
      setAuthed(isAdmin);
      // Pre-seed mock data immediately so the dashboard is never blank.
      if (isAdmin) {
        setBookings(MOCK_BOOKINGS);
        setPlannerBookings(MOCK_BOOKINGS.filter((b) => b.session_date === TODAY));
      }
      setAuthReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      const email = s?.user?.email ?? '';
      const isAdmin = !!s && email === ADMIN_EMAIL;
      setAuthed(isAdmin);
      if (isAdmin) {
        setBookings(MOCK_BOOKINGS);
        setPlannerBookings(MOCK_BOOKINGS.filter((b) => b.session_date === TODAY));
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // UI state
  const [tab, setTab] = useState<Tab>('planning');
  const [loading, setLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Data state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [sessions, setSessions] = useState<SupaSession[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [plannerDate, setPlannerDate] = useState(TODAY);
  const [plannerBookings, setPlannerBookings] = useState<Booking[]>([]);

  // Bookings tab filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sessionDateFilter, setSessionDateFilter] = useState(TODAY);

  // Analytics range
  const [analyticsRange, setAnalyticsRange] = useState<7 | 30 | 90 | 365>(30);

  // ── Fetchers ───────────────────────────────────────────────────────────────

  const fetchBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('session_date', { ascending: false })
      .order('time_slot');
    if (error) toast({ title: 'Erreur chargement réservations', description: error.message, variant: 'destructive' });
    if (data) setBookings(data as Booking[]);
    setLoading(false);
  };

  const fetchPlannerData = async (date: string) => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('session_date', date)
      .neq('status', 'cancelled')
      .order('time_slot')
      .order('created_at');
    if (error) console.error('fetchPlannerData:', error.message);
    setPlannerBookings((data as Booking[]) ?? []);
  };

  const fetchSessions = async () => {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .gte('session_date', sessionDateFilter)
      .order('session_date')
      .order('time_slot')
      .limit(50);
    if (error) toast({ title: 'Erreur chargement sessions', description: error.message, variant: 'destructive' });
    if (data) setSessions(data as SupaSession[]);
  };

  const fetchEquipment = async () => {
    const { data, error } = await supabase.from('equipment' as never).select('*').order('sort_order');
    if (error) toast({ title: 'Erreur chargement matériel', description: (error as { message: string }).message, variant: 'destructive' });
    if (data) setEquipment(data as unknown as Equipment[]);
  };

  useEffect(() => { if (authed) { fetchBookings(); fetchPlannerData(TODAY); } }, [authed]);
  useEffect(() => { if (authed) fetchPlannerData(plannerDate); }, [plannerDate, authed]);
  useEffect(() => { if (tab === 'sessions' && authed) fetchSessions(); }, [tab, sessionDateFilter, authed]);
  useEffect(() => { if (tab === 'equipment' && authed) fetchEquipment(); }, [tab, authed]);

  // ── Update handlers ────────────────────────────────────────────────────────

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('bookings').update({ status: newStatus }).eq('id', id);
    if (error) { toast({ title: 'Erreur', variant: 'destructive' }); return; }
    fetchBookings();
    if (plannerDate) fetchPlannerData(plannerDate);
    setSelectedBooking(null);
    toast({ title: 'Statut mis à jour' });
  };

  const updateSpots = async (id: string, newSpots: number) => {
    await supabase.from('sessions').update({ remaining_spots: Math.max(0, newSpots) }).eq('id', id);
    fetchSessions();
  };

  const updateEquipment = async (id: string, nextAvailable: number) => {
    await supabase.from('equipment' as never).update({ available_quantity: Math.max(0, nextAvailable) } as never).eq('id', id);
    fetchEquipment();
  };

  // ── KPIs (computed from bookings) ─────────────────────────────────────────

  const kpis = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - analyticsRange);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    const inRange = bookings.filter((b) => b.session_date >= cutoffStr);
    // Treat null/unknown status as 'confirmed' for historical rows
    const normalizeStatus = (s: string | null) => s ?? 'confirmed';
    const active = inRange.filter((b) => normalizeStatus(b.status) !== 'cancelled');

    const totalCA      = active.reduce((s, b) => s + (b.total_price ?? 0), 0);
    const encaisse     = active.filter((b) => ['confirmed_deposit', 'confirmed'].includes(normalizeStatus(b.status))).reduce((s, b) => s + (b.deposit_amount ?? 0), 0);
    const previsionnel = active.filter((b) => !['confirmed_deposit', 'confirmed'].includes(normalizeStatus(b.status))).reduce((s, b) => s + ((b.total_price ?? 0) - (b.deposit_amount ?? 0)), 0);

    // Fill rate by session type
    const usageMap: Record<string, number> = {};
    for (const b of active) {
      const k = `${b.session_date}|${b.time_slot}`;
      usageMap[k] = (usageMap[k] ?? 0) + b.num_boards;
    }
    const entries = Object.entries(usageMap);
    const sunriseEntries = entries.filter(([k]) => SUNRISE_SLOTS.some(s => k.endsWith(`|${s}`)));
    const sunsetEntries  = entries.filter(([k]) => SUNSET_SLOTS.some(s => k.endsWith(`|${s}`)));
    const avgFill = (arr: [string, number][]) =>
      arr.length === 0 ? 0 : Math.round(arr.reduce((s, [, c]) => s + (c / INVENTORY_MAX_UNITS), 0) / arr.length * 100);

    const statusDist: Record<string, number> = {};
    for (const b of inRange) {
      const s = normalizeStatus(b.status);
      statusDist[s] = (statusDist[s] ?? 0) + 1;
    }

    return {
      totalCA, encaisse, previsionnel,
      sunriseFill: avgFill(sunriseEntries),
      sunsetFill:  avgFill(sunsetEntries),
      totalBookings: inRange.length,
      statusDist,
    };
  }, [bookings, analyticsRange]);

  // ── Planner: group by session ──────────────────────────────────────────────

  const plannerGroups = useMemo(() => {
    const groups: Record<string, Booking[]> = {};
    for (const slot of [...SUNRISE_SLOTS, ...SUNSET_SLOTS]) {
      groups[slot] = plannerBookings.filter((b) => b.time_slot === slot);
    }
    return groups;
  }, [plannerBookings]);

  // ── Filtered bookings ──────────────────────────────────────────────────────

  const filtered = useMemo(() =>
    bookings.filter((b) => {
      const matchSearch =
        b.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        b.email.toLowerCase().includes(search.toLowerCase()) ||
        b.phone.includes(search);
      const matchStatus = filterStatus === 'all' || b.status === filterStatus;
      return matchSearch && matchStatus;
    }),
    [bookings, search, filterStatus]
  );

  // ── Guards ─────────────────────────────────────────────────────────────────

  if (!authReady) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <span className="font-sans text-ivory/40 text-sm">Chargement…</span>
      </div>
    );
  }
  if (!authed) return <AuthScreen />;

  // ── Render ─────────────────────────────────────────────────────────────────

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'planning',   label: 'Planning',      icon: Calendar   },
    { id: 'bookings',   label: 'Réservations',  icon: Users      },
    { id: 'analytics',  label: 'Analytics',     icon: BarChart2  },
    { id: 'sessions',   label: 'Disponibilité', icon: Settings   },
    { id: 'equipment',  label: 'Matériel',      icon: Package    },
  ];

  return (
    <div className="min-h-screen bg-[#f5f4f0]">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-dark text-ivory">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-serif text-lg">Alo Paddle</span>
            <span className="font-sans text-[9px] uppercase tracking-[0.3em] text-ivory/40">Control Center</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { fetchBookings(); fetchPlannerData(plannerDate); }}
              disabled={loading}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 font-sans text-xs text-ivory/60 hover:text-ivory transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Tab nav */}
      <div className="bg-white border-b border-gray-100 sticky top-14 z-30">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex gap-1 overflow-x-auto py-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-sans text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all ${
                tab === id ? 'bg-dark text-ivory' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">

        {/* ── PLANNING ────────────────────────────────────────────────────── */}
        {tab === 'planning' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div>
                <label className="block font-sans text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-1.5">
                  Date du planning
                </label>
                <input
                  type="date"
                  value={plannerDate}
                  onChange={(e) => setPlannerDate(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl font-sans text-sm bg-white focus:outline-none focus:ring-2 focus:ring-dark"
                />
              </div>
              <div className="mt-4 font-sans text-sm text-gray-400">
                {plannerBookings.length === 0 ? 'Aucune réservation ce jour' : `${plannerBookings.reduce((s, b) => s + b.num_boards, 0)} personnes planifiées`}
              </div>
            </div>

            {[...SUNRISE_SLOTS, ...SUNSET_SLOTS].map((slot) => {
              const group = plannerGroups[slot] ?? [];
              const total = group.reduce((s, b) => s + b.num_boards, 0);
              const isSunset = SUNSET_SLOTS.includes(slot);
              const fillPct = Math.round((total / INVENTORY_MAX_UNITS) * 100);

              let sessionStatus: 'full' | 'formation' | 'available';
              if (total >= INVENTORY_MAX_UNITS) sessionStatus = 'full';
              else if (isSunset && total < SUNSET_MIN_GROUP) sessionStatus = 'formation';
              else sessionStatus = 'available';

              const statusLabel = {
                full:       { text: 'Complet',      cls: 'bg-red-100 text-red-700' },
                formation:  { text: 'En formation', cls: 'bg-blue-100 text-blue-700' },
                available:  { text: 'Disponible',   cls: 'bg-emerald-100 text-emerald-700' },
              }[sessionStatus];

              return (
                <div key={slot} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Session header */}
                  <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                      {isSunset
                        ? <Sunset className="w-5 h-5 text-orange-400" />
                        : <Sunrise className="w-5 h-5 text-amber-400" />}
                      <div>
                        <p className="font-sans text-base font-semibold text-gray-900">{slot}</p>
                        <p className="font-sans text-xs text-gray-400">{isSunset ? 'Session Sunset' : 'Session Sunrise'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-full font-sans text-[10px] font-bold uppercase tracking-wider ${statusLabel.cls}`}>
                        {statusLabel.text}
                      </span>
                      <span className="font-sans text-sm font-semibold text-gray-700 tabular-nums">
                        {total} / {INVENTORY_MAX_UNITS}
                      </span>
                    </div>
                  </div>

                  {/* Fill bar */}
                  <div className="h-1.5 bg-gray-100">
                    <div
                      className={`h-full transition-all ${fillPct >= 100 ? 'bg-red-400' : fillPct >= 60 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                      style={{ width: `${Math.min(100, fillPct)}%` }}
                    />
                  </div>

                  {/* Client list */}
                  {group.length === 0 ? (
                    <p className="px-5 py-4 font-sans text-sm text-gray-400">Aucune réservation.</p>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {group.map((b) => (
                        <div
                          key={b.id}
                          onClick={() => setSelectedBooking(b)}
                          className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-2 hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_CONFIG[b.status]?.dot ?? 'bg-gray-300'}`} />
                            <div>
                              <p className="font-sans text-sm font-semibold text-gray-900">{b.customer_name}</p>
                              <p className="font-sans text-xs text-gray-400">{b.phone}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 font-sans text-sm tabular-nums">
                            <span className="text-gray-500">{b.num_boards} paddle{b.num_boards > 1 ? 's' : ''}</span>
                            <span className="text-gray-700 font-semibold">{b.total_price} TND</span>
                            <span className="text-emerald-600 font-semibold">
                              Reste : {b.total_price - b.deposit_amount} TND
                            </span>
                            <ChevronRight className="w-4 h-4 text-gray-300" />
                          </div>
                        </div>
                      ))}

                      {/* Session total row */}
                      <div className="px-5 py-3 flex justify-between items-center bg-gray-50">
                        <span className="font-sans text-xs uppercase tracking-wider text-gray-400">Total session</span>
                        <div className="flex gap-6 font-sans text-sm tabular-nums">
                          <span className="font-semibold">{group.reduce((s, b) => s + b.total_price, 0)} TND</span>
                          <span className="text-emerald-600 font-semibold">
                            Encaissé : {group.reduce((s, b) => s + b.deposit_amount, 0)} TND
                          </span>
                          <span className="text-gray-500">
                            Sur place : {group.reduce((s, b) => s + (b.total_price - b.deposit_amount), 0)} TND
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── ANALYTICS ───────────────────────────────────────────────────── */}
        {tab === 'analytics' && (
          <div className="space-y-6">
            {/* Range selector */}
            <div className="flex gap-2">
              {([7, 30, 90, 365] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setAnalyticsRange(r)}
                  className={`px-4 py-1.5 rounded-full font-sans text-xs font-semibold transition-all ${analyticsRange === r ? 'bg-dark text-ivory' : 'bg-white border border-gray-200 text-gray-500'}`}
                >
                  {r === 365 ? 'Tout' : `${r}j`}
                </button>
              ))}
            </div>

            {/* Revenue cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'CA Total', value: `${kpis.totalCA} TND`, sub: 'Hors annulées', color: 'text-gray-900' },
                { label: 'Acomptes encaissés', value: `${kpis.encaisse} TND`, sub: 'Confirmés + dépôt reçu', color: 'text-emerald-600' },
                { label: 'Soldes prévisionnels', value: `${kpis.previsionnel} TND`, sub: 'À encaisser sur place', color: 'text-amber-600' },
              ].map((card) => (
                <div key={card.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <p className="font-sans text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-1">{card.label}</p>
                  <p className={`font-serif text-3xl font-medium ${card.color} tabular-nums`}>{card.value}</p>
                  <p className="font-sans text-xs text-gray-400 mt-1">{card.sub}</p>
                </div>
              ))}
            </div>

            {/* Fill rates */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <p className="font-sans text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-5">
                Taux de remplissage moyen
              </p>
              <div className="space-y-4">
                {[
                  { label: '🌅 Sessions Sunrise', value: kpis.sunriseFill, color: 'bg-amber-400' },
                  { label: '🌇 Sessions Sunset',  value: kpis.sunsetFill,  color: 'bg-orange-400' },
                ].map((bar) => (
                  <div key={bar.label}>
                    <div className="flex justify-between font-sans text-sm mb-1.5">
                      <span className="text-gray-700">{bar.label}</span>
                      <span className="font-semibold tabular-nums">{bar.value}%</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${bar.color} transition-all duration-700`}
                        style={{ width: `${bar.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status distribution */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <p className="font-sans text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-4">
                Distribution des statuts ({kpis.totalBookings} réservations)
              </p>
              <div className="space-y-2">
                {Object.entries(kpis.statusDist).map(([status, count]) => {
                  const cfg = STATUS_CONFIG[status];
                  const pct = kpis.totalBookings > 0 ? Math.round((count / kpis.totalBookings) * 100) : 0;
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${cfg?.dot ?? 'bg-gray-300'}`} />
                      <span className="font-sans text-sm text-gray-700 w-36">{cfg?.label ?? status}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${cfg?.dot ?? 'bg-gray-300'} transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="font-sans text-xs tabular-nums text-gray-400 w-12 text-right">{count} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notification setup card */}
            <div className="bg-dark text-ivory rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-accent-gold" />
                <p className="font-sans text-[10px] uppercase tracking-[0.35em] text-ivory/50">
                  Notifications automatiques
                </p>
              </div>
              <p className="font-sans text-sm text-ivory/80 mb-4">
                Déclencher une alerte dès qu'un acompte est reçu (status = <code className="bg-white/10 px-1 rounded text-xs">confirmed_deposit</code>).
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="font-sans text-xs font-semibold text-ivory mb-1">✉️ Resend (recommandé)</p>
                  <p className="font-sans text-xs text-ivory/60 mb-2">Email professionnel, templates HTML. Gratuit jusqu'à 3 000 emails/mois.</p>
                  <code className="block text-[10px] text-ivory/50 leading-relaxed">
                    Supabase → Edge Function → Resend API<br />
                    POST /v1/emails • API key dans .env
                  </code>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="font-sans text-xs font-semibold text-ivory mb-1">📱 Telegram Bot (plus rapide)</p>
                  <p className="font-sans text-xs text-ivory/60 mb-2">Notification push instantanée sur ton téléphone. 0 coût.</p>
                  <code className="block text-[10px] text-ivory/50 leading-relaxed">
                    Supabase Webhook → Telegram Bot API<br />
                    /sendMessage • chat_id + BOT_TOKEN
                  </code>
                </div>
              </div>
              <details className="mt-4">
                <summary className="font-sans text-xs text-ivory/50 cursor-pointer hover:text-ivory/80">
                  Voir le SQL Supabase webhook →
                </summary>
                <pre className="mt-3 text-[10px] text-ivory/50 bg-white/5 rounded-lg p-3 overflow-x-auto leading-relaxed whitespace-pre-wrap">{WEBHOOK_SQL}</pre>
              </details>
            </div>
          </div>
        )}

        {/* ── BOOKINGS ────────────────────────────────────────────────────── */}
        {tab === 'bookings' && (
          <>
            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Aujourd'hui", value: bookings.filter((b) => b.session_date === TODAY).length },
                { label: 'Acomptes reçus', value: bookings.filter((b) => b.status === 'confirmed_deposit').length },
                { label: 'En formation', value: bookings.filter((b) => b.status === 'pending_formation').length },
                { label: 'Total', value: bookings.length },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <p className="font-sans text-[10px] uppercase tracking-wider text-gray-400 mb-1">{s.label}</p>
                  <p className="font-sans text-2xl font-bold tabular-nums">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom, email, téléphone…" className="h-11 rounded-xl pl-11 text-sm bg-white" />
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {['all', 'pending', 'pending_formation', 'confirmed_deposit', 'confirmed', 'cancelled'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`px-3 py-2 rounded-full font-sans text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap transition-all ${
                      filterStatus === s ? 'bg-dark text-ivory' : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {s === 'all' ? 'Tout' : (STATUS_CONFIG[s]?.label ?? s)}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-20 font-sans text-gray-400">Chargement…</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 font-sans text-gray-400">Aucune réservation.</div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Desktop */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {['Client', 'Date', 'Créneau', 'Planches', 'Total', 'Acompte', 'Reste', 'Statut', ''].map((h) => (
                          <th key={h} className="font-sans text-[10px] uppercase tracking-wider text-gray-400 font-semibold text-left px-4 py-3.5">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((b) => (
                        <tr key={b.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3.5">
                            <p className="font-sans text-sm font-semibold text-gray-900">{b.customer_name}</p>
                            <p className="font-sans text-xs text-gray-400">{b.phone}</p>
                          </td>
                          <td className="px-4 py-3.5 font-sans text-sm tabular-nums text-gray-700">{b.session_date}</td>
                          <td className="px-4 py-3.5 font-sans text-sm">{b.time_slot}</td>
                          <td className="px-4 py-3.5 font-sans text-sm tabular-nums text-center">{b.num_boards}</td>
                          <td className="px-4 py-3.5 font-sans text-sm font-semibold tabular-nums">{b.total_price} TND</td>
                          <td className="px-4 py-3.5 font-sans text-sm tabular-nums text-emerald-600">{b.deposit_amount} TND</td>
                          <td className="px-4 py-3.5 font-sans text-sm tabular-nums text-amber-600">{b.total_price - b.deposit_amount} TND</td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${STATUS_CONFIG[b.status]?.badge ?? 'bg-gray-100 text-gray-700'}`}>
                              {STATUS_CONFIG[b.status]?.label ?? b.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <button onClick={() => setSelectedBooking(b)} className="font-sans text-xs text-gray-400 hover:text-gray-900 transition-colors">Voir →</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile */}
                <div className="md:hidden divide-y divide-gray-50">
                  {filtered.map((b) => (
                    <button key={b.id} onClick={() => setSelectedBooking(b)} className="w-full px-5 py-4 text-left hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-1.5">
                        <p className="font-sans text-sm font-semibold text-gray-900">{b.customer_name}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${STATUS_CONFIG[b.status]?.badge ?? 'bg-gray-100'}`}>
                          {STATUS_CONFIG[b.status]?.label ?? b.status}
                        </span>
                      </div>
                      <p className="font-sans text-xs text-gray-400">{b.session_date} · {b.time_slot} · {b.num_boards} paddle(s)</p>
                      <div className="flex gap-4 mt-1.5 font-sans text-xs tabular-nums">
                        <span className="font-semibold">{b.total_price} TND</span>
                        <span className="text-emerald-600">Acompte {b.deposit_amount} TND</span>
                        <span className="text-amber-600">Reste {b.total_price - b.deposit_amount} TND</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── SESSIONS ────────────────────────────────────────────────────── */}
        {tab === 'sessions' && (
          <div>
            <div className="mb-5">
              <label className="block font-sans text-[10px] uppercase tracking-wider text-gray-400 mb-1.5">À partir du</label>
              <Input type="date" value={sessionDateFilter} onChange={(e) => setSessionDateFilter(e.target.value)} className="max-w-xs h-11 rounded-xl bg-white" />
            </div>
            <div className="space-y-3">
              {sessions.map((s) => (
                <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-sans text-sm font-semibold text-gray-900">{s.session_date} — {s.time_slot}</p>
                    <p className="font-sans text-xs text-gray-400">{s.session_label}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-sans text-xs text-gray-400">Places :</span>
                    <button onClick={() => updateSpots(s.id, s.remaining_spots - 1)} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-100 font-bold text-lg">−</button>
                    <span className={`font-sans text-lg font-bold tabular-nums w-8 text-center ${s.remaining_spots <= 0 ? 'text-red-500' : s.remaining_spots <= 3 ? 'text-amber-500' : ''}`}>{s.remaining_spots}</span>
                    <button onClick={() => updateSpots(s.id, s.remaining_spots + 1)} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-100 font-bold text-lg">+</button>
                    <span className="font-sans text-xs text-gray-400">/ {s.capacity}</span>
                  </div>
                </div>
              ))}
              {sessions.length === 0 && <p className="text-center py-10 font-sans text-gray-400">Aucune session trouvée.</p>}
            </div>
          </div>
        )}

        {/* ── EQUIPMENT ───────────────────────────────────────────────────── */}
        {tab === 'equipment' && (
          <div className="space-y-3">
            {equipment.map((e) => {
              const utilisation = e.total_quantity > 0 ? Math.round(((e.total_quantity - e.available_quantity) / e.total_quantity) * 100) : 0;
              return (
                <div key={e.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-sans text-base font-semibold text-gray-900">{e.label}</p>
                    <p className="font-sans text-xs text-gray-400">Acompte {Number(e.deposit_amount)} TND · Utilisation {utilisation}%</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => updateEquipment(e.id, e.available_quantity - 1)} className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-100 font-bold text-lg">−</button>
                    <span className={`font-sans text-xl font-bold tabular-nums w-10 text-center ${e.available_quantity <= 0 ? 'text-red-500' : e.available_quantity <= 2 ? 'text-amber-500' : ''}`}>{e.available_quantity}</span>
                    <button onClick={() => updateEquipment(e.id, Math.min(e.total_quantity, e.available_quantity + 1))} className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-100 font-bold text-lg">+</button>
                    <span className="font-sans text-xs text-gray-400">/ {e.total_quantity}</span>
                  </div>
                </div>
              );
            })}
            {equipment.length === 0 && <p className="text-center py-10 font-sans text-gray-400">Table `equipment` non trouvée.</p>}
          </div>
        )}
      </div>

      {/* ── Booking detail modal ─────────────────────────────────────────── */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedBooking(null)} />
          <div className="relative bg-white rounded-t-3xl md:rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="font-sans text-[10px] uppercase tracking-wider text-gray-400">Réservation</p>
                <h3 className="font-serif text-2xl text-gray-900 mt-0.5">{selectedBooking.customer_name}</h3>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${STATUS_CONFIG[selectedBooking.status]?.badge ?? 'bg-gray-100'}`}>
                {STATUS_CONFIG[selectedBooking.status]?.label ?? selectedBooking.status}
              </span>
            </div>

            <div className="space-y-2.5 font-sans text-sm">
              {[
                ['Email',    selectedBooking.email],
                ['Téléphone', selectedBooking.phone],
                ['Date',      selectedBooking.session_date],
                ['Créneau',   selectedBooking.time_slot],
                ['Activité',  selectedBooking.session_label ?? '—'],
                ['Planches',  String(selectedBooking.num_boards)],
                ['Total',     `${selectedBooking.total_price} TND`],
                ['Acompte',   `${selectedBooking.deposit_amount} TND`],
                ['Reste',     `${selectedBooking.total_price - selectedBooking.deposit_amount} TND`],
                ...(selectedBooking.notes ? [['Notes', selectedBooking.notes]] : []),
                ['Créé le',   new Date(selectedBooking.created_at).toLocaleString('fr-FR')],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-400">{label}</span>
                  <span className="font-medium text-gray-900 text-right max-w-[60%]">{value}</span>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <p className="font-sans text-[10px] uppercase tracking-wider text-gray-400 mb-2">Changer le statut</p>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(STATUS_CONFIG).map(([s, cfg]) => (
                  <button
                    key={s}
                    disabled={selectedBooking.status === s}
                    onClick={() => updateStatus(selectedBooking.id, s)}
                    className={`px-3 py-1.5 rounded-full font-sans text-[10px] font-semibold uppercase tracking-wider transition-all ${
                      selectedBooking.status === s
                        ? `${cfg.badge} opacity-60 cursor-default`
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setSelectedBooking(null)}
              className="w-full mt-6 py-3 rounded-full border border-gray-200 font-sans text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Webhook SQL (affiché dans l'UI Analytics) ────────────────────────────────

const WEBHOOK_SQL = `-- Activer l'extension pg_net si pas encore fait
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Fonction déclenchée sur confirmed_deposit
CREATE OR REPLACE FUNCTION notify_deposit_received()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'confirmed_deposit'
     AND (OLD.status IS DISTINCT FROM 'confirmed_deposit') THEN
    PERFORM net.http_post(
      url     := 'https://api.telegram.org/bot<BOT_TOKEN>/sendMessage',
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body    := json_build_object(
        'chat_id', '<CHAT_ID>',
        'text', format(
          '✅ Acompte reçu%nClient : %s%nDate : %s  Créneau : %s%nMontant : %s TND',
          NEW.customer_name, NEW.session_date,
          NEW.time_slot, NEW.deposit_amount
        )
      )::text
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger sur INSERT et UPDATE
DROP TRIGGER IF EXISTS on_deposit_confirmed ON bookings;
CREATE TRIGGER on_deposit_confirmed
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION notify_deposit_received();`;

export default AdminPage;
