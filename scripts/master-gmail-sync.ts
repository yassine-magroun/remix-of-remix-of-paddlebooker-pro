/**
 * master-gmail-sync.ts
 *
 * Pulls reservation emails from Gmail (IMAP) and extracts customers + reservations.
 *
 * Defaults to DRY RUN: writes JSON to src/scripts/out/ without touching Supabase.
 * Pass `--commit` to upsert into Supabase (requires SUPABASE_SERVICE_ROLE_KEY).
 *
 * Usage:
 *   npx tsx src/scripts/master-gmail-sync.ts                 # dry-run, 2023-01-01..today
 *   npx tsx src/scripts/master-gmail-sync.ts --since=2024-01-01
 *   npx tsx src/scripts/master-gmail-sync.ts --commit        # actually writes to Supabase
 *   npx tsx src/scripts/master-gmail-sync.ts --limit=100     # sample run
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { simpleParser, type ParsedMail } from 'mailparser';
import imaps from 'imap-simple';
import {
  addDays, addWeeks, format, parse, isValid, startOfDay,
} from 'date-fns';
import { createClient } from '@supabase/supabase-js';

// ---------- CLI args ----------
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? 'true'];
  }),
);
const COMMIT = args.commit === 'true';
const SINCE = (args.since as string) || '2023-01-01';
const UNTIL = (args.until as string) || format(new Date(), 'yyyy-MM-dd');
const LIMIT = args.limit ? Number(args.limit) : Infinity;

// ---------- Config ----------
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!GMAIL_USER || !GMAIL_PASS) {
  console.error('[fatal] GMAIL_USER / GMAIL_APP_PASSWORD missing in .env');
  process.exit(1);
}
if (COMMIT && !SERVICE_ROLE && !ANON_KEY) {
  console.error('[fatal] --commit requires SUPABASE_SERVICE_ROLE_KEY (or at least a Supabase key).');
  process.exit(1);
}

const OUT_DIR = path.join(process.cwd(), 'scripts', 'out');
fs.mkdirSync(OUT_DIR, { recursive: true });

// ---------- Types ----------
type Extraction = {
  fullName: string | null;
  phone: string | null;
  email: string | null;
  sessionDate: string | null;    // yyyy-MM-dd
  timeSlot: string | null;
  numParticipants: number | null;
  estimatedPrice: number | null;
  confidence: number;            // 0..1
};

type RawEmail = {
  messageId: string;
  threadId: string | null;
  subject: string;
  from: string;
  receivedAt: Date;
  text: string;
  html: string | null;
};

// ---------- Filtering keywords ----------
const KEYWORDS = [
  'réservation', 'reservation', 'reserver', 'réserver',
  'paddle', 'kayak', 'sup',
  'demain', 'samedi', 'dimanche',
  'ce soir', 'matin', 'après-midi', 'apres-midi',
  'on sera', 'nous serons', 'pax', 'personnes',
  'booking', 'book',
];

// ---------- Parsing helpers ----------
function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function extractPhone(text: string): string | null {
  // Tunisian (+216 or local 8-digit), French (+33 or 0X XX XX XX XX), generic international.
  const candidates: string[] = [];
  const patterns = [
    /\+216\s?\d{2}\s?\d{3}\s?\d{3}/g,
    /\+33\s?\d(?:[\s.-]?\d{2}){4}/g,
    /0\d(?:[\s.-]?\d{2}){4}/g,                 // French local 10-digit
    /\b\d{2}[\s.-]?\d{3}[\s.-]?\d{3}\b/g,      // Tunisian local 8-digit w/ separators
    /\+\d{1,3}[\s.-]?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{2,4}/g,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) candidates.push(...m);
  }
  if (!candidates.length) return null;
  // Normalise to digits + leading +.
  const raw = candidates[0].trim();
  const plus = raw.startsWith('+') ? '+' : '';
  const digits = raw.replace(/[^\d]/g, '');
  if (digits.length < 8) return null;
  return plus + digits;
}

function extractEmailAddr(text: string): string | null {
  const m = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  return m ? m[0].toLowerCase() : null;
}

function extractNameFromFrom(from: string): string | null {
  // "John Doe <john@x.com>" → "John Doe"
  const m = from.match(/^"?([^"<]+?)"?\s*<[^>]+>\s*$/);
  if (m) {
    const name = m[1].trim();
    if (name && !name.includes('@')) return name;
  }
  return null;
}

function extractNameFromBody(text: string): string | null {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Pattern 1: "Bonjour, je suis X" / "Au nom de X" / "Réservation au nom de X".
  const inlinePatterns = [
    /au\s+nom\s+de\s+([A-ZÉÈÊÀÂÎÏÔÛÇ][\w'-]+(?:\s+[A-ZÉÈÊÀÂÎÏÔÛÇ][\w'-]+){0,3})/i,
    /je\s+(?:suis|m['’]?\s*appelle)\s+([A-ZÉÈÊÀÂÎÏÔÛÇ][\w'-]+(?:\s+[A-ZÉÈÊÀÂÎÏÔÛÇ][\w'-]+){0,3})/i,
    /c['’]?\s*est\s+([A-ZÉÈÊÀÂÎÏÔÛÇ][\w'-]+(?:\s+[A-ZÉÈÊÀÂÎÏÔÛÇ][\w'-]+){0,3})/i,
  ];
  for (const p of inlinePatterns) {
    const m = text.match(p);
    if (m) return m[1].trim();
  }

  // Pattern 2: signature — last 5 non-empty lines, pick a "Firstname Lastname"-shaped one.
  const tail = lines.slice(-6);
  for (const line of tail.reverse()) {
    if (/\b(cordialement|bien\s+à\s+vous|merci|bonjour|bonne\s+journée|salutations|regards)\b/i.test(line)) continue;
    if (/^[-=_*]{2,}/.test(line)) continue;
    if (line.length > 60) continue;
    const m = line.match(/^([A-ZÉÈÊÀÂÎÏÔÛÇ][\w'-]+(?:\s+[A-ZÉÈÊÀÂÎÏÔÛÇ][\w'-]+){1,3})$/);
    if (m) return m[1].trim();
  }

  return null;
}

function extractParticipants(text: string): number | null {
  const t = stripAccents(text.toLowerCase());
  const patterns = [
    /on\s+(?:sera|serons)\s+(\d{1,2})/,
    /nous\s+serons\s+(\d{1,2})/,
    /(\d{1,2})\s*(?:pax|personnes?|pers\.?|adultes?|participants?)/,
    /reservation\s+pour\s+(\d{1,2})/,
    /pour\s+(\d{1,2})\s+personnes?/,
    /(\d{1,2})\s+boards?/,
  ];
  for (const p of patterns) {
    const m = t.match(p);
    if (m) {
      const n = Number(m[1]);
      if (n >= 1 && n <= 30) return n;
    }
  }
  // Word-form (un, deux, trois, …).
  const words: Record<string, number> = {
    'un': 1, 'une': 1, 'deux': 2, 'trois': 3, 'quatre': 4, 'cinq': 5,
    'six': 6, 'sept': 7, 'huit': 8, 'neuf': 9, 'dix': 10,
  };
  for (const [w, n] of Object.entries(words)) {
    const re = new RegExp(`\\b${w}\\s+(?:pax|personnes?|participants?|adultes?)\\b`);
    if (re.test(t)) return n;
    const re2 = new RegExp(`\\bon\\s+sera\\s+${w}\\b`);
    if (re2.test(t)) return n;
  }
  return null;
}

function extractTimeSlot(text: string): string | null {
  const t = text.toLowerCase();
  const hhmm = t.match(/\b([01]?\d|2[0-3])\s*[h:]\s*([0-5]\d)?\b/);
  if (hhmm) {
    const h = hhmm[1].padStart(2, '0');
    const m = hhmm[2] ?? '00';
    return `${h}:${m}`;
  }
  if (/\bmatin\b/.test(t)) return 'morning';
  if (/\bapr[eè]s[-\s]?midi\b/.test(t)) return 'afternoon';
  if (/\bsoir\b/.test(t)) return 'evening';
  return null;
}

function extractPrice(text: string): number | null {
  const m = text.match(/(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:€|eur|euro|tnd|dt|dinar)/i);
  if (!m) return null;
  return Number(m[1].replace(',', '.'));
}

// Convert relative/natural-language dates into ISO, anchored on the email's receivedAt.
const WEEKDAYS: Record<string, number> = {
  dimanche: 0, lundi: 1, mardi: 2, mercredi: 3, jeudi: 4, vendredi: 5, samedi: 6,
};

function extractSessionDate(text: string, receivedAt: Date): string | null {
  const anchor = startOfDay(receivedAt);
  const t = stripAccents(text.toLowerCase());

  // Relative: aujourd'hui / demain / après-demain.
  if (/\baujourd['’ ]?hui\b/.test(t)) return format(anchor, 'yyyy-MM-dd');
  if (/\bapres[-\s]?demain\b/.test(t)) return format(addDays(anchor, 2), 'yyyy-MM-dd');
  if (/\bdemain\b/.test(t)) return format(addDays(anchor, 1), 'yyyy-MM-dd');

  // "ce samedi" / "samedi prochain" / bare weekday.
  for (const [name, dow] of Object.entries(WEEKDAYS)) {
    const re = new RegExp(`\\b(?:ce|le|ce\\s+prochain|${name}\\s+prochain|${name})\\s*${name}\\b|\\b${name}\\b`);
    if (re.test(t)) {
      const currentDow = anchor.getDay();
      let diff = (dow - currentDow + 7) % 7;
      if (diff === 0) diff = 7;                                         // next occurrence
      if (new RegExp(`${name}\\s+prochain`).test(t) && diff < 7) diff += 7;
      return format(addDays(anchor, diff), 'yyyy-MM-dd');
    }
  }

  // Explicit DD/MM or DD/MM/YYYY.
  const dmY = t.match(/\b(\d{1,2})[\/.-](\d{1,2})(?:[\/.-](\d{2,4}))?\b/);
  if (dmY) {
    const d = Number(dmY[1]);
    const m = Number(dmY[2]);
    let y = dmY[3] ? Number(dmY[3]) : anchor.getFullYear();
    if (y < 100) y += 2000;
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12) {
      const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const p = parse(iso, 'yyyy-MM-dd', new Date());
      if (isValid(p)) return iso;
    }
  }

  // French month name ("12 août", "3 juillet 2024").
  const months: Record<string, number> = {
    janvier: 1, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6,
    juillet: 7, aout: 8, septembre: 9, octobre: 10, novembre: 11, decembre: 12,
  };
  const mName = t.match(new RegExp(`\\b(\\d{1,2})\\s+(${Object.keys(months).join('|')})(?:\\s+(\\d{4}))?\\b`));
  if (mName) {
    const d = Number(mName[1]);
    const mo = months[mName[2]];
    const y = mName[3] ? Number(mName[3]) : anchor.getFullYear();
    const iso = `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (isValid(parse(iso, 'yyyy-MM-dd', new Date()))) return iso;
  }

  return null;
}

// Website form ("New Reservation from X") — labeled fields, highest priority.
type FormFields = Partial<Pick<Extraction, 'fullName' | 'phone' | 'email' | 'sessionDate' | 'timeSlot' | 'numParticipants'>>;
function extractStructuredForm(body: string, subject: string): FormFields | null {
  const hasLabels = /\b(Name|Nom)\s*:/i.test(body) && /\b(Phone|T[eé]l|Telephone)\b.*:/i.test(body);
  if (!hasLabels && !/New Reservation from/i.test(subject)) return null;

  const out: FormFields = {};
  const name = body.match(/^\s*(?:Name|Nom)\s*:\s*(.+)$/im);
  if (name) out.fullName = name[1].trim();
  else {
    const sub = subject.match(/New Reservation from\s+(.+)$/i);
    if (sub) out.fullName = sub[1].trim();
  }

  const persons = body.match(/^\s*(?:Number of Persons|Nombre de personnes|Persons|Participants)\s*:\s*(\d{1,3})/im);
  if (persons) {
    const n = Number(persons[1]);
    if (n >= 1 && n <= 50) out.numParticipants = n;
  }

  const phone = body.match(/^\s*(?:Phone(?:\s*Number)?|T[eé]l[eé]?phone|Tel)\s*:\s*([+\d\s().-]{6,})/im);
  if (phone) {
    const digits = phone[1].replace(/[^\d+]/g, '');
    if (digits.length >= 8) out.phone = digits;
  }

  const emailLine = body.match(/^\s*(?:Email|E-mail|Courriel)\s*:\s*([\w.+-]+@[\w-]+\.[\w.-]+)/im);
  if (emailLine) out.email = emailLine[1].toLowerCase();

  const dateLine = body.match(/^\s*Date\s*:\s*(\d{4}-\d{2}-\d{2}|\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/im);
  if (dateLine) {
    const raw = dateLine[1];
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) out.sessionDate = raw;
    else {
      const m = raw.match(/(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/);
      if (m) {
        const d = Number(m[1]); const mo = Number(m[2]);
        let y = Number(m[3]); if (y < 100) y += 2000;
        out.sessionDate = `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      }
    }
  }

  const timeLine = body.match(/^\s*Time\s*:\s*(\d{1,2}\s*[:hH]\s*\d{0,2})/im);
  if (timeLine) {
    const tm = timeLine[1].match(/(\d{1,2})\s*[:hH]\s*(\d{0,2})/);
    if (tm) out.timeSlot = `${tm[1].padStart(2,'0')}:${(tm[2]||'00').padStart(2,'0')}`;
  }

  return Object.keys(out).length ? out : null;
}

// Senders to ignore (no-reply, Google, social, transfers).
const SENDER_BLOCKLIST = [
  'noreply', 'no-reply', 'do-not-reply',
  'accounts.google.com', 'google.com', 'googlemail.com',
  'tiktok.com', 'wetransfer.com', 'facebookmail.com',
  'linkedin.com', 'instagram.com', 'mailer-daemon',
];

function isBlockedSender(from: string): boolean {
  const low = from.toLowerCase();
  return SENDER_BLOCKLIST.some((b) => low.includes(b));
}

function extractAll(email: RawEmail): Extraction {
  const body = email.text || '';

  // 1. Try the structured form first (website-generated "New Reservation from X").
  const form = extractStructuredForm(body, email.subject);

  const fullName = form?.fullName ?? extractNameFromBody(body) ?? extractNameFromFrom(email.from);
  const phone = form?.phone ?? extractPhone(body);
  const emailAddr = form?.email ?? extractEmailAddr(body) ?? extractEmailFromHeader(email.from);
  const sessionDate = form?.sessionDate ?? extractSessionDate(body, email.receivedAt);
  const timeSlot = form?.timeSlot ?? extractTimeSlot(body);
  const num = form?.numParticipants ?? extractParticipants(body);
  const price = extractPrice(body);

  // Confidence: weighted sum of present fields.
  let c = 0;
  if (fullName) c += 0.3;
  if (phone) c += 0.25;
  if (sessionDate) c += 0.25;
  if (num) c += 0.15;
  if (emailAddr) c += 0.05;

  return {
    fullName,
    phone,
    email: emailAddr,
    sessionDate,
    timeSlot,
    numParticipants: num,
    estimatedPrice: price,
    confidence: Number(c.toFixed(2)),
  };
}

function extractEmailFromHeader(from: string): string | null {
  const m = from.match(/<([^>]+)>/);
  return m ? m[1].toLowerCase() : extractEmailAddr(from);
}

function looksLikeReservation(subject: string, body: string): boolean {
  const hay = stripAccents(`${subject} ${body}`.toLowerCase());
  return KEYWORDS.some((k) => hay.includes(stripAccents(k.toLowerCase())));
}

// ---------- IMAP fetch ----------
async function fetchEmails(): Promise<RawEmail[]> {
  console.log(`[imap] connecting to ${GMAIL_USER}`);
  const connection = await imaps.connect({
    imap: {
      user: GMAIL_USER!,
      password: GMAIL_PASS!,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      authTimeout: 10_000,
      tlsOptions: { servername: 'imap.gmail.com' },
    },
  });

  await connection.openBox('[Gmail]/Tous les messages').catch(async () => {
    // English accounts.
    await connection.openBox('[Gmail]/All Mail');
  });

  const sinceDate = parse(SINCE, 'yyyy-MM-dd', new Date());
  const untilDate = parse(UNTIL, 'yyyy-MM-dd', new Date());
  console.log(`[imap] search window ${SINCE} → ${UNTIL}`);

  const criteria: unknown[] = [
    ['SINCE', format(sinceDate, 'dd-MMM-yyyy')],
    ['BEFORE', format(addDays(untilDate, 1), 'dd-MMM-yyyy')],
  ];
  const fetchOptions = { bodies: [''], markSeen: false, struct: true };
  const results = await connection.search(criteria as never, fetchOptions);
  console.log(`[imap] ${results.length} messages in window`);

  const emails: RawEmail[] = [];
  for (const res of results) {
    if (emails.length >= LIMIT) break;
    const raw = res.parts.find((p: { which: string; body: string }) => p.which === '')?.body;
    if (!raw) continue;
    let parsed: ParsedMail;
    try {
      parsed = await simpleParser(raw);
    } catch (e) {
      console.warn('[parse] failed for uid', res.attributes?.uid, e);
      continue;
    }

    const subject = parsed.subject ?? '';
    const text = parsed.text ?? '';
    const from = typeof parsed.from === 'object' && parsed.from ? parsed.from.text : '';
    if (isBlockedSender(from)) continue;
    if (!looksLikeReservation(subject, text)) continue;

    emails.push({
      messageId: parsed.messageId ?? `uid-${res.attributes?.uid ?? Math.random()}`,
      threadId: (parsed.headers.get('thread-index') as string) ?? null,
      subject,
      from,
      receivedAt: parsed.date ?? new Date(),
      text,
      html: parsed.html || null,
    });
  }

  await connection.end();
  console.log(`[imap] ${emails.length} reservation-like messages kept`);
  return emails;
}

// ---------- Supabase upsert ----------
async function commitToSupabase(
  extractions: Array<{ email: RawEmail; data: Extraction }>,
) {
  if (!SUPABASE_URL) throw new Error('VITE_SUPABASE_URL missing');
  const key = SERVICE_ROLE || ANON_KEY!;
  const client = createClient(SUPABASE_URL, key, { auth: { persistSession: false } });

  let customersCreated = 0;
  let customersUpdated = 0;
  let reservationsInserted = 0;
  let reservationsSkipped = 0;

  for (const { email, data } of extractions) {
    // 1. Dedupe customer by phone, else by (email + name).
    let customerId: string | null = null;

    if (data.phone) {
      const { data: existing } = await client
        .from('customers')
        .select('id, first_session_date, last_session_date, total_sessions, total_participants')
        .eq('phone', data.phone)
        .maybeSingle();

      if (existing) {
        customerId = existing.id;
        const newLast = data.sessionDate && (!existing.last_session_date || data.sessionDate > existing.last_session_date)
          ? data.sessionDate : existing.last_session_date;
        const newFirst = data.sessionDate && (!existing.first_session_date || data.sessionDate < existing.first_session_date)
          ? data.sessionDate : existing.first_session_date;
        await client.from('customers').update({
          last_session_date: newLast,
          first_session_date: newFirst,
          total_sessions: (existing.total_sessions ?? 0) + 1,
          total_participants: (existing.total_participants ?? 0) + (data.numParticipants ?? 0),
        }).eq('id', existing.id);
        customersUpdated += 1;
      } else {
        const { data: created, error } = await client.from('customers').insert({
          full_name: data.fullName,
          phone: data.phone,
          email: data.email,
          first_session_date: data.sessionDate,
          last_session_date: data.sessionDate,
          total_sessions: 1,
          total_participants: data.numParticipants ?? 0,
          source: 'gmail_import',
          metadata: { gmail_message_id: email.messageId },
        }).select('id').single();
        if (error) {
          console.warn('[supabase] insert customer failed:', error.message);
        } else if (created) {
          customerId = created.id;
          customersCreated += 1;
        }
      }
    } else if (data.fullName) {
      const { data: created, error } = await client.from('customers').insert({
        full_name: data.fullName,
        email: data.email,
        first_session_date: data.sessionDate,
        last_session_date: data.sessionDate,
        total_sessions: 1,
        total_participants: data.numParticipants ?? 0,
        source: 'gmail_import',
        metadata: { gmail_message_id: email.messageId, no_phone: true },
      }).select('id').single();
      if (!error && created) {
        customerId = created.id;
        customersCreated += 1;
      }
    }

    // 2. Reservation row (full raw content preserved).
    const { error: resErr } = await client.from('reservations').insert({
      customer_id: customerId,
      session_date: data.sessionDate,
      time_slot: data.timeSlot,
      num_participants: data.numParticipants,
      estimated_price: data.estimatedPrice,
      parsed_full_name: data.fullName,
      parsed_phone: data.phone,
      parsed_email: data.email,
      parsing_confidence: data.confidence,
      gmail_message_id: email.messageId,
      gmail_thread_id: email.threadId,
      gmail_subject: email.subject,
      gmail_from: email.from,
      gmail_received_at: email.receivedAt.toISOString(),
      raw_content: {
        text: email.text,
        html: email.html,
      },
    });
    if (resErr) {
      if (resErr.code === '23505') reservationsSkipped += 1; // already imported
      else console.warn('[supabase] insert reservation failed:', resErr.message);
    } else {
      reservationsInserted += 1;
    }
  }

  return { customersCreated, customersUpdated, reservationsInserted, reservationsSkipped };
}

// ---------- Main ----------
async function main() {
  const mode = COMMIT ? 'COMMIT (writes to Supabase)' : 'DRY RUN (no DB writes)';
  console.log(`\n=== master-gmail-sync :: ${mode} ===`);
  console.log(`window: ${SINCE} → ${UNTIL} (limit=${Number.isFinite(LIMIT) ? LIMIT : 'none'})\n`);

  const emails = await fetchEmails();
  const extractions = emails.map((e) => ({ email: e, data: extractAll(e) }));

  // Stats & sample
  const confidences = extractions.map((x) => x.data.confidence);
  const uniquePhones = new Set(extractions.map((x) => x.data.phone).filter(Boolean));
  const totalParticipants = extractions.reduce((s, x) => s + (x.data.numParticipants ?? 0), 0);
  const totalEstimated = extractions.reduce((s, x) => s + (x.data.estimatedPrice ?? 0), 0);

  console.log(`\n[stats]`);
  console.log(`  emails parsed:            ${extractions.length}`);
  console.log(`  unique phones:            ${uniquePhones.size}`);
  console.log(`  with name:                ${extractions.filter((x) => x.data.fullName).length}`);
  console.log(`  with session_date:        ${extractions.filter((x) => x.data.sessionDate).length}`);
  console.log(`  with num_participants:    ${extractions.filter((x) => x.data.numParticipants).length}`);
  console.log(`  total participants sum:   ${totalParticipants}`);
  console.log(`  estimated revenue (sum):  ${totalEstimated.toFixed(2)}`);
  const avgConf = confidences.length ? confidences.reduce((a, b) => a + b, 0) / confidences.length : 0;
  console.log(`  avg confidence:           ${avgConf.toFixed(2)}`);

  // Dump full JSON for manual review.
  const stamp = format(new Date(), 'yyyyMMdd-HHmmss');
  const outPath = path.join(OUT_DIR, `gmail-extract-${stamp}.json`);
  fs.writeFileSync(outPath, JSON.stringify(
    extractions.map(({ email, data }) => ({
      messageId: email.messageId,
      subject: email.subject,
      from: email.from,
      receivedAt: email.receivedAt,
      extracted: data,
      textPreview: email.text.slice(0, 500),
    })),
    null, 2,
  ));
  console.log(`\n[dry-run output] ${outPath}`);

  if (!COMMIT) {
    console.log('\nDry-run only. Re-run with --commit to write to Supabase.');
    return;
  }

  console.log('\n[commit] writing to Supabase…');
  const summary = await commitToSupabase(extractions);
  console.log('\n[commit summary]');
  console.log(`  customers created:        ${summary.customersCreated}`);
  console.log(`  customers updated:        ${summary.customersUpdated}`);
  console.log(`  reservations inserted:    ${summary.reservationsInserted}`);
  console.log(`  reservations skipped(dup):${summary.reservationsSkipped}`);
  console.log(`  estimated revenue total:  ${totalEstimated.toFixed(2)}`);
}

main().catch((e) => {
  console.error('[fatal]', e);
  process.exit(1);
});
