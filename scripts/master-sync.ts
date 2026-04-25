/**
 * master-sync.ts
 *
 * Unified customer import: Gmail IMAP + WhatsApp .txt exports → Supabase.
 *
 * - Gmail: uses the same parser as master-gmail-sync.ts (structured-form + freeform).
 * - WhatsApp: reads whatsapp_imports/*.txt and parses each message as a mini-email.
 * - Dedupe by phone number (normalised). Falls back to lowercase(name) when no phone.
 * - --dry-run by default; --commit to write to Supabase.
 *
 * Usage:
 *   npx tsx src/scripts/master-sync.ts                      # dry-run, all sources
 *   npx tsx src/scripts/master-sync.ts --source=whatsapp    # only WhatsApp
 *   npx tsx src/scripts/master-sync.ts --source=gmail       # only Gmail
 *   npx tsx src/scripts/master-sync.ts --commit             # writes to Supabase
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { simpleParser, type ParsedMail } from 'mailparser';
import imaps from 'imap-simple';
import { addDays, format, parse, isValid, startOfDay } from 'date-fns';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ---------- CLI ----------
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
const SOURCE = (args.source as string) || 'all'; // all | gmail | whatsapp

// ---------- Config ----------
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const WHATSAPP_DIR = path.join(process.cwd(), 'whatsapp_imports');
const OUT_DIR = path.join(process.cwd(), 'scripts', 'out');
fs.mkdirSync(OUT_DIR, { recursive: true });

// ---------- Types ----------
type Extraction = {
  fullName: string | null;
  phone: string | null;       // normalised: "+216XXXXXXXX" or raw digits if unknown country
  email: string | null;
  sessionDate: string | null;
  timeSlot: string | null;
  numParticipants: number | null;
  estimatedPrice: number | null;
  confidence: number;
};

type RawMessage = {
  source: 'gmail' | 'whatsapp';
  externalId: string;          // gmail messageId or whatsapp line hash
  subject: string;
  from: string;
  receivedAt: Date;
  text: string;
  html: string | null;
};

// ---------- Phone normalisation ----------
function normalisePhone(raw: string): string | null {
  if (!raw) return null;
  let digits = raw.replace(/[^\d+]/g, '');
  // Remove doubled '+'.
  digits = digits.replace(/\++/g, '+');
  if (digits.startsWith('00')) digits = '+' + digits.slice(2);

  const onlyDigits = digits.replace(/\D/g, '');
  if (digits.startsWith('+216') && onlyDigits.length === 11) return digits;
  if (digits.startsWith('+33') && onlyDigits.length === 11) return digits;

  // French national → +33
  if (/^0[1-9]\d{8}$/.test(onlyDigits)) return '+33' + onlyDigits.slice(1);
  // Tunisian 8-digit national → +216
  if (/^[2-9]\d{7}$/.test(onlyDigits)) return '+216' + onlyDigits;
  // Any other +XX international with 10-15 digits
  if (digits.startsWith('+') && onlyDigits.length >= 10 && onlyDigits.length <= 15) return digits;
  // Fallback: keep raw digits if at least 8
  if (onlyDigits.length >= 8) return onlyDigits;
  return null;
}

// ---------- Keyword filter ----------
const BUSINESS_KEYWORDS = [
  // core activity
  'paddle', 'kayak', 'planche', 'sup', 'zarzis', 'salt & fin', 'salt&fin', 'saltfin',
  // booking intent
  'réservation', 'reservation', 'reserver', 'réserver', 'book', 'booking',
  'dispo', 'disponible', 'disponibilité', 'disponibilite', 'available',
  // pricing
  'prix', 'tarif', 'tarifs', 'coût', 'cout', 'combien', 'price',
  // timing
  'heure', 'heures', 'demain', 'samedi', 'dimanche', 'ce soir', 'matin',
  'après-midi', 'apres-midi',
  // group size
  'on sera', 'nous serons', 'pax', 'personnes', 'personne',
  // catch-all conversational inquiries
  'bonjour', 'hello', 'hi,',
];
function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function isBusinessMessage(subject: string, body: string): boolean {
  const hay = stripAccents(`${subject} ${body}`.toLowerCase());
  return BUSINESS_KEYWORDS.some((k) => hay.includes(stripAccents(k.toLowerCase())));
}

const SENDER_BLOCKLIST = [
  'noreply', 'no-reply', 'do-not-reply',
  'accounts.google.com', 'google.com', 'googlemail.com',
  'tiktok.com', 'wetransfer.com', 'facebookmail.com',
  'linkedin.com', 'instagram.com', 'mailer-daemon',
];
function isBlockedSender(from: string): boolean {
  const low = (from || '').toLowerCase();
  return SENDER_BLOCKLIST.some((b) => low.includes(b));
}

// ---------- Generic extractors ----------
function extractPhoneInText(text: string): string | null {
  const patterns = [
    /\+216[\s.-]?\d{2}[\s.-]?\d{3}[\s.-]?\d{3}/g,
    /\+33[\s.-]?\d(?:[\s.-]?\d{2}){4}/g,
    /0\d(?:[\s.-]?\d{2}){4}/g,
    /\b\d{2}[\s.-]?\d{3}[\s.-]?\d{3}\b/g,
    /\+\d{1,3}[\s.-]?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{2,4}/g,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return normalisePhone(m[0]);
  }
  return null;
}

function extractEmailAddr(text: string): string | null {
  const m = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  return m ? m[0].toLowerCase() : null;
}

function extractNameFromFromHeader(from: string): string | null {
  const m = from.match(/^"?([^"<]+?)"?\s*<[^>]+>\s*$/);
  if (m) {
    const name = m[1].trim();
    if (name && !name.includes('@')) return name;
  }
  return null;
}

function extractNameFromBody(text: string): string | null {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const inline = [
    /au\s+nom\s+de\s+([A-ZÉÈÊÀÂÎÏÔÛÇ][\w'-]+(?:\s+[A-ZÉÈÊÀÂÎÏÔÛÇ][\w'-]+){0,3})/i,
    /je\s+(?:suis|m['’]?\s*appelle)\s+([A-ZÉÈÊÀÂÎÏÔÛÇ][\w'-]+(?:\s+[A-ZÉÈÊÀÂÎÏÔÛÇ][\w'-]+){0,3})/i,
    /c['’]?\s*est\s+([A-ZÉÈÊÀÂÎÏÔÛÇ][\w'-]+(?:\s+[A-ZÉÈÊÀÂÎÏÔÛÇ][\w'-]+){0,3})/i,
  ];
  for (const p of inline) {
    const m = text.match(p);
    if (m) return m[1].trim();
  }
  const tail = lines.slice(-6);
  for (const line of tail.reverse()) {
    if (/\b(cordialement|bien\s+à\s+vous|merci|bonjour|salutations|regards|bonne\s+journée)\b/i.test(line)) continue;
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
  const words: Record<string, number> = {
    un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5,
    six: 6, sept: 7, huit: 8, neuf: 9, dix: 10,
  };
  for (const [w, n] of Object.entries(words)) {
    if (new RegExp(`\\b${w}\\s+(?:pax|personnes?|participants?|adultes?)\\b`).test(t)) return n;
    if (new RegExp(`\\bon\\s+sera\\s+${w}\\b`).test(t)) return n;
  }
  return null;
}

function extractTimeSlot(text: string): string | null {
  const t = text.toLowerCase();
  const hhmm = t.match(/\b([01]?\d|2[0-3])\s*[h:]\s*([0-5]\d)?\b/);
  if (hhmm) return `${hhmm[1].padStart(2, '0')}:${hhmm[2] ?? '00'}`;
  if (/\bmatin\b/.test(t)) return 'morning';
  if (/\bapr[eè]s[-\s]?midi\b/.test(t)) return 'afternoon';
  if (/\bsoir\b/.test(t)) return 'evening';
  return null;
}

function extractPrice(text: string): number | null {
  const m = text.match(/(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:€|eur|euro|tnd|dt|dinar)/i);
  return m ? Number(m[1].replace(',', '.')) : null;
}

const WEEKDAYS: Record<string, number> = {
  dimanche: 0, lundi: 1, mardi: 2, mercredi: 3, jeudi: 4, vendredi: 5, samedi: 6,
};
function extractSessionDate(text: string, anchor: Date): string | null {
  const base = startOfDay(anchor);
  const t = stripAccents(text.toLowerCase());
  if (/\baujourd['’ ]?hui\b/.test(t)) return format(base, 'yyyy-MM-dd');
  if (/\bapres[-\s]?demain\b/.test(t)) return format(addDays(base, 2), 'yyyy-MM-dd');
  if (/\bdemain\b/.test(t)) return format(addDays(base, 1), 'yyyy-MM-dd');
  for (const [name, dow] of Object.entries(WEEKDAYS)) {
    if (new RegExp(`\\b${name}\\b`).test(t)) {
      const curDow = base.getDay();
      let diff = (dow - curDow + 7) % 7;
      if (diff === 0) diff = 7;
      if (new RegExp(`${name}\\s+prochain`).test(t) && diff < 7) diff += 7;
      return format(addDays(base, diff), 'yyyy-MM-dd');
    }
  }
  const dmY = t.match(/\b(\d{1,2})[\/.-](\d{1,2})(?:[\/.-](\d{2,4}))?\b/);
  if (dmY) {
    const d = Number(dmY[1]); const m = Number(dmY[2]);
    let y = dmY[3] ? Number(dmY[3]) : base.getFullYear();
    if (y < 100) y += 2000;
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12) {
      const iso = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      if (isValid(parse(iso, 'yyyy-MM-dd', new Date()))) return iso;
    }
  }
  const months: Record<string, number> = {
    janvier: 1, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6,
    juillet: 7, aout: 8, septembre: 9, octobre: 10, novembre: 11, decembre: 12,
  };
  const mName = t.match(new RegExp(`\\b(\\d{1,2})\\s+(${Object.keys(months).join('|')})(?:\\s+(\\d{4}))?\\b`));
  if (mName) {
    const d = Number(mName[1]); const mo = months[mName[2]];
    const y = mName[3] ? Number(mName[3]) : base.getFullYear();
    const iso = `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    if (isValid(parse(iso, 'yyyy-MM-dd', new Date()))) return iso;
  }
  return null;
}

// ---------- Structured website form ----------
type FormFields = Partial<Extraction>;
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
  if (phone) out.phone = normalisePhone(phone[1]);
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

function extractAll(msg: RawMessage): Extraction {
  const body = msg.text || '';
  const form = extractStructuredForm(body, msg.subject);
  const fullName = form?.fullName ?? extractNameFromBody(body) ?? extractNameFromFromHeader(msg.from);
  const phone = form?.phone ?? extractPhoneInText(body) ?? normalisePhone(msg.from);
  const emailAddr = form?.email ?? extractEmailAddr(body) ?? extractEmailAddr(msg.from);
  const sessionDate = form?.sessionDate ?? extractSessionDate(body, msg.receivedAt);
  const timeSlot = form?.timeSlot ?? extractTimeSlot(body);
  const num = form?.numParticipants ?? extractParticipants(body);
  const price = extractPrice(body);

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

// ---------- Gmail source ----------
async function openFirstAvailableBox(
  connection: imaps.ImapSimple,
  candidates: string[],
): Promise<string | null> {
  for (const name of candidates) {
    try {
      await connection.openBox(name);
      return name;
    } catch { /* try next */ }
  }
  return null;
}

async function fetchGmail(): Promise<RawMessage[]> {
  if (!GMAIL_USER || !GMAIL_PASS) {
    console.warn('[gmail] skipped (no GMAIL_USER / GMAIL_APP_PASSWORD)');
    return [];
  }
  console.log(`[gmail] connecting to ${GMAIL_USER}`);
  const connection = await imaps.connect({
    imap: {
      user: GMAIL_USER, password: GMAIL_PASS,
      host: 'imap.gmail.com', port: 993, tls: true, authTimeout: 15_000,
      tlsOptions: { servername: 'imap.gmail.com' },
    },
  });

  const sinceDate = parse(SINCE, 'yyyy-MM-dd', new Date());
  const untilDate = parse(UNTIL, 'yyyy-MM-dd', new Date());
  const criteria: unknown[] = [
    ['SINCE', format(sinceDate, 'dd-MMM-yyyy')],
    ['BEFORE', format(addDays(untilDate, 1), 'dd-MMM-yyyy')],
  ];

  // Deep scan: INBOX + Sent + All Mail (fallback covers every language).
  const mailboxGroups = [
    ['INBOX'],
    ['[Gmail]/Messages envoyés', '[Gmail]/Sent Mail', 'Sent'],
    ['[Gmail]/Tous les messages', '[Gmail]/All Mail'],
  ];

  const seenIds = new Set<string>();
  const out: RawMessage[] = [];
  let analysedCount = 0;
  let keptCount = 0;

  for (const group of mailboxGroups) {
    const boxName = await openFirstAvailableBox(connection, group);
    if (!boxName) {
      console.log(`[gmail] skipping mailbox group (none available): ${group.join(' | ')}`);
      continue;
    }
    console.log(`[gmail] mailbox: ${boxName}  window ${SINCE} → ${UNTIL}`);
    const results = await connection.search(criteria as never, { bodies: [''], markSeen: false, struct: true });
    console.log(`[gmail] ${boxName}: ${results.length} messages in window`);

    for (const res of results) {
      if (out.length >= LIMIT) break;
      const raw = res.parts.find((p: { which: string; body: string }) => p.which === '')?.body;
      if (!raw) continue;
      let parsed: ParsedMail;
      try { parsed = await simpleParser(raw); } catch { continue; }

      const externalId = parsed.messageId ?? `uid-${boxName}-${res.attributes?.uid}`;
      if (seenIds.has(externalId)) continue; // already scanned from another mailbox
      seenIds.add(externalId);

      const subject = parsed.subject ?? '(sans objet)';
      const text = parsed.text ?? '';
      const from = typeof parsed.from === 'object' && parsed.from ? parsed.from.text : '';
      const to = typeof parsed.to === 'object' && parsed.to
        ? (Array.isArray(parsed.to) ? parsed.to.map((t) => t.text).join(', ') : parsed.to.text)
        : '';
      const dateStr = parsed.date ? format(parsed.date, 'yyyy-MM-dd HH:mm') : '????-??-??';

      analysedCount += 1;
      // War logs — per message.
      console.log(`[${dateStr}] - Analyse de : ${subject.slice(0, 80)}`);

      if (isBlockedSender(from)) continue;
      if (!isBusinessMessage(subject, text)) continue;

      // For sent messages, the "customer" is actually the recipient, not the sender.
      const isSent = boxName.toLowerCase().includes('sent') || boxName.toLowerCase().includes('envoy');
      const counterparty = isSent && to ? to : from;
      if (isSent && isBlockedSender(counterparty)) continue;

      keptCount += 1;
      out.push({
        source: 'gmail',
        externalId,
        subject,
        from: counterparty,
        receivedAt: parsed.date ?? new Date(),
        text,
        html: parsed.html || null,
      });
    }
    console.log(`[gmail] running totals → analysed=${analysedCount}  kept=${keptCount}  unique_ids=${seenIds.size}`);
  }

  await connection.end();
  console.log(`[gmail] DONE — analysed=${analysedCount}, kept=${out.length}`);
  return out;
}

// ---------- WhatsApp source ----------
const WA_LINE_RE = /^\[(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\]\s*(?:-\s*)?([^:]+?):\s*(.+)$/;
const WA_LINE_RE_ALT = /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4}),?\s+(\d{1,2}):(\d{2})(?:\s*[-–]\s*|\s+)([^:]+?):\s*(.+)$/;

type WAMessage = { date: Date; author: string; body: string };

function parseWhatsappFile(filePath: string): WAMessage[] {
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  const msgs: WAMessage[] = [];
  let current: WAMessage | null = null;

  for (const raw of lines) {
    const m = raw.match(WA_LINE_RE) || raw.match(WA_LINE_RE_ALT);
    if (m) {
      if (current) msgs.push(current);
      const d = Number(m[1]); const mo = Number(m[2]);
      let y = Number(m[3]); if (y < 100) y += 2000;
      const h = Number(m[4]); const mi = Number(m[5]);
      const date = new Date(y, mo - 1, d, h, mi);
      current = { date, author: m[7].trim(), body: m[8].trim() };
    } else if (current && raw.trim()) {
      current.body += '\n' + raw.trim();
    }
  }
  if (current) msgs.push(current);
  return msgs;
}

function hashStr(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16);
}

function collectWhatsapp(): RawMessage[] {
  if (!fs.existsSync(WHATSAPP_DIR)) return [];
  const files = fs.readdirSync(WHATSAPP_DIR).filter((f) => f.toLowerCase().endsWith('.txt'));
  if (!files.length) {
    console.log(`[whatsapp] no .txt files in ${WHATSAPP_DIR}`);
    return [];
  }
  const out: RawMessage[] = [];
  for (const f of files) {
    const full = path.join(WHATSAPP_DIR, f);
    const msgs = parseWhatsappFile(full);
    console.log(`[whatsapp] ${f}: ${msgs.length} parsed lines`);

    // Group consecutive messages by author into "conversations" of up to 10 lines.
    const conversations: WAMessage[][] = [];
    let buffer: WAMessage[] = [];
    let lastAuthor = '';
    for (const m of msgs) {
      if (m.author !== lastAuthor && buffer.length) {
        conversations.push(buffer);
        buffer = [];
      }
      buffer.push(m);
      lastAuthor = m.author;
    }
    if (buffer.length) conversations.push(buffer);

    // Each author (non-business) with ≥1 business-keyword line becomes a RawMessage.
    const byAuthor = new Map<string, WAMessage[]>();
    for (const m of msgs) {
      const key = m.author;
      if (/salt\s*&?\s*fin|paddle\s*board\s*zarzis|admin/i.test(key)) continue; // skip own-side
      if (!byAuthor.has(key)) byAuthor.set(key, []);
      byAuthor.get(key)!.push(m);
    }

    for (const [author, entries] of byAuthor.entries()) {
      const joined = entries.map((e) => `[${format(e.date, 'yyyy-MM-dd HH:mm')}] ${e.body}`).join('\n');
      if (!isBusinessMessage('', joined)) continue;
      const firstDate = entries[0].date;
      out.push({
        source: 'whatsapp',
        externalId: `wa:${f}:${hashStr(author)}`,
        subject: `WhatsApp — ${author}`,
        from: author,
        receivedAt: firstDate,
        text: joined,
        html: null,
      });
    }
  }
  console.log(`[whatsapp] ${out.length} business conversations kept`);
  return out;
}

// ---------- Dedupe + upsert ----------
type CustomerRow = {
  fullName: string | null;
  phone: string | null;
  email: string | null;
  firstSessionDate: string | null;
  lastSessionDate: string | null;
  totalSessions: number;
  totalParticipants: number;
  sources: Set<'gmail' | 'whatsapp'>;
  rawData: Array<Record<string, unknown>>;
  extractions: Array<Extraction & { externalId: string; source: string }>;
};

function dedupe(records: Array<{ msg: RawMessage; data: Extraction }>): Map<string, CustomerRow> {
  const byKey = new Map<string, CustomerRow>();
  for (const { msg, data } of records) {
    const key = data.phone
      ? `phone:${data.phone}`
      : data.email
      ? `email:${data.email.toLowerCase()}`
      : data.fullName
      ? `name:${data.fullName.toLowerCase()}`
      : `msg:${msg.externalId}`;

    if (!byKey.has(key)) {
      byKey.set(key, {
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        firstSessionDate: data.sessionDate,
        lastSessionDate: data.sessionDate,
        totalSessions: 1,
        totalParticipants: data.numParticipants ?? 0,
        sources: new Set([msg.source]),
        rawData: [{ source: msg.source, externalId: msg.externalId, text: msg.text, subject: msg.subject, receivedAt: msg.receivedAt }],
        extractions: [{ ...data, externalId: msg.externalId, source: msg.source }],
      });
    } else {
      const row = byKey.get(key)!;
      row.fullName ||= data.fullName;
      row.email ||= data.email;
      row.phone ||= data.phone;
      row.totalSessions += 1;
      row.totalParticipants += data.numParticipants ?? 0;
      row.sources.add(msg.source);
      if (data.sessionDate) {
        if (!row.firstSessionDate || data.sessionDate < row.firstSessionDate) row.firstSessionDate = data.sessionDate;
        if (!row.lastSessionDate || data.sessionDate > row.lastSessionDate) row.lastSessionDate = data.sessionDate;
      }
      row.rawData.push({ source: msg.source, externalId: msg.externalId, text: msg.text, subject: msg.subject, receivedAt: msg.receivedAt });
      row.extractions.push({ ...data, externalId: msg.externalId, source: msg.source });
    }
  }
  return byKey;
}

async function commitCustomers(
  rows: Map<string, CustomerRow>,
  client: SupabaseClient,
): Promise<{ created: number; updated: number; failed: number }> {
  let created = 0, updated = 0, failed = 0;

  for (const row of rows.values()) {
    let customerId: string | null = null;
    // Dedupe precedence: phone → email (when no phone match) → else always insert.
    let existing: {
      id: string; first_session_date: string | null; last_session_date: string | null;
      total_sessions: number | null; total_participants: number | null;
      sources: string[] | null; raw_data: unknown;
    } | null = null;

    if (row.phone) {
      const r = await client
        .from('customers')
        .select('id, first_session_date, last_session_date, total_sessions, total_participants, sources, raw_data')
        .eq('phone', row.phone)
        .maybeSingle();
      existing = r.data as typeof existing;
    }
    if (!existing && row.email) {
      const r = await client
        .from('customers')
        .select('id, first_session_date, last_session_date, total_sessions, total_participants, sources, raw_data')
        .eq('email', row.email)
        .is('phone', null)
        .maybeSingle();
      existing = r.data as typeof existing;
    }

    if (existing) {
      // Delta update: only count messages whose externalId isn't already stored.
      const existingRaw: Array<Record<string, unknown>> = Array.isArray(existing.raw_data) ? existing.raw_data as never : [];
      const seenExternalIds = new Set(existingRaw.map((r) => r.externalId as string));
      const newRaw = row.rawData.filter((r) => !seenExternalIds.has(r.externalId as string));
      const newExtractions = row.extractions.filter((e) => !seenExternalIds.has(e.externalId));
      const addedSessions = newRaw.length;
      const addedParticipants = newExtractions.reduce((s, e) => s + (e.numParticipants ?? 0), 0);

      const mergedSources = Array.from(new Set([...(existing.sources ?? []), ...row.sources]));
      const mergedRaw = [...existingRaw, ...newRaw];
      const newFirst = row.firstSessionDate && (!existing.first_session_date || row.firstSessionDate < existing.first_session_date)
        ? row.firstSessionDate : existing.first_session_date;
      const newLast = row.lastSessionDate && (!existing.last_session_date || row.lastSessionDate > existing.last_session_date)
        ? row.lastSessionDate : existing.last_session_date;
      const { error } = await client.from('customers').update({
        full_name: row.fullName ?? undefined,
        email: row.email ?? undefined,
        phone: row.phone ?? undefined,
        first_session_date: newFirst,
        last_session_date: newLast,
        total_sessions: (existing.total_sessions ?? 0) + addedSessions,
        total_participants: (existing.total_participants ?? 0) + addedParticipants,
        sources: mergedSources,
        raw_data: mergedRaw,
      }).eq('id', existing.id);
      if (error) { console.warn('[commit] update failed:', error.message); failed += 1; continue; }
      customerId = existing.id;
      updated += 1;
      // Still attempt reservation inserts below so new messages are linked.
      for (const ex of row.extractions) {
        const raw = row.rawData.find((r) => r.externalId === ex.externalId) || {};
        await client.from('reservations').insert({
          customer_id: customerId,
          session_date: ex.sessionDate,
          time_slot: ex.timeSlot,
          num_participants: ex.numParticipants,
          estimated_price: ex.estimatedPrice,
          parsed_full_name: ex.fullName,
          parsed_phone: ex.phone,
          parsed_email: ex.email,
          parsing_confidence: ex.confidence,
          gmail_message_id: ex.source === 'gmail' ? ex.externalId : null,
          gmail_subject: (raw.subject as string) ?? null,
          gmail_from: ex.source === 'gmail' ? ((raw as { from?: string }).from ?? null) : null,
          gmail_received_at: (raw.receivedAt as Date) ?? null,
          raw_content: raw,
        }).then(({ error: e }) => {
          if (e && e.code !== '23505') console.warn('[commit] reservation insert failed:', e.message);
        });
      }
      continue;
    }

    const { data: ins, error } = await client.from('customers').insert({
      full_name: row.fullName,
      phone: row.phone,
      email: row.email,
      first_session_date: row.firstSessionDate,
      last_session_date: row.lastSessionDate,
      total_sessions: row.totalSessions,
      total_participants: row.totalParticipants,
      source: Array.from(row.sources)[0] + '_import',
      sources: Array.from(row.sources),
      raw_data: row.rawData,
      metadata: { imported_at: new Date().toISOString() },
    }).select('id').single();
    if (error) { console.warn('[commit] insert failed:', error.message); failed += 1; continue; }
    customerId = ins!.id;
    created += 1;

    // Insert one reservation row per message for this customer.
    for (const ex of row.extractions) {
      const raw = row.rawData.find((r) => r.externalId === ex.externalId) || {};
      await client.from('reservations').insert({
        customer_id: customerId,
        session_date: ex.sessionDate,
        time_slot: ex.timeSlot,
        num_participants: ex.numParticipants,
        estimated_price: ex.estimatedPrice,
        parsed_full_name: ex.fullName,
        parsed_phone: ex.phone,
        parsed_email: ex.email,
        parsing_confidence: ex.confidence,
        gmail_message_id: ex.source === 'gmail' ? ex.externalId : null,
        gmail_subject: (raw.subject as string) ?? null,
        gmail_from: ex.source === 'gmail' ? ((raw as { from?: string }).from ?? null) : null,
        gmail_received_at: (raw.receivedAt as Date) ?? null,
        raw_content: raw,
      }).then(({ error: e }) => {
        if (e && e.code !== '23505') console.warn('[commit] reservation insert failed:', e.message);
      });
    }
  }

  return { created, updated, failed };
}

// ---------- Main ----------
async function main() {
  const mode = COMMIT ? 'COMMIT (writes to Supabase)' : 'DRY RUN (no DB writes)';
  console.log(`\n=== master-sync :: ${mode} ===`);
  console.log(`sources=${SOURCE} | window ${SINCE} → ${UNTIL} | limit=${Number.isFinite(LIMIT) ? LIMIT : 'none'}\n`);

  const gmailMsgs = (SOURCE === 'all' || SOURCE === 'gmail') ? await fetchGmail() : [];
  const waMsgs = (SOURCE === 'all' || SOURCE === 'whatsapp') ? collectWhatsapp() : [];
  const allMsgs = [...gmailMsgs, ...waMsgs];

  const records = allMsgs.map((msg) => ({ msg, data: extractAll(msg) }));
  const customers = dedupe(records);

  // Stats
  const gmailCustomers = new Set<string>();
  const waCustomers = new Set<string>();
  for (const [key, row] of customers.entries()) {
    if (row.sources.has('gmail')) gmailCustomers.add(key);
    if (row.sources.has('whatsapp')) waCustomers.add(key);
  }
  const totalParticipants = Array.from(customers.values()).reduce((s, r) => s + r.totalParticipants, 0);
  const totalEstimated = records.reduce((s, r) => s + (r.data.estimatedPrice ?? 0), 0);

  console.log(`\n[stats]`);
  console.log(`  messages scanned:          ${allMsgs.length} (gmail=${gmailMsgs.length}, whatsapp=${waMsgs.length})`);
  console.log(`  unique customers:          ${customers.size}`);
  console.log(`    from gmail:              ${gmailCustomers.size}`);
  console.log(`    from whatsapp:           ${waCustomers.size}`);
  console.log(`    overlap (gmail ∩ wa):    ${[...gmailCustomers].filter((k) => waCustomers.has(k)).length}`);
  console.log(`  total participants:        ${totalParticipants}`);
  console.log(`  estimated revenue (€):     ${totalEstimated.toFixed(2)}`);

  const stamp = format(new Date(), 'yyyyMMdd-HHmmss');
  const outPath = path.join(OUT_DIR, `master-sync-${stamp}.json`);
  fs.writeFileSync(outPath, JSON.stringify(
    Array.from(customers.values()).map((r) => ({
      fullName: r.fullName, phone: r.phone, email: r.email,
      firstSessionDate: r.firstSessionDate, lastSessionDate: r.lastSessionDate,
      totalSessions: r.totalSessions, totalParticipants: r.totalParticipants,
      sources: [...r.sources],
      messagesPreview: r.rawData.slice(0, 2).map((m) => ({
        source: m.source, subject: m.subject, preview: String(m.text).slice(0, 200),
      })),
    })), null, 2,
  ));
  console.log(`\n[dry-run output] ${outPath}`);

  if (!COMMIT) {
    console.log('\nDry-run only. Re-run with --commit to write.');
    return;
  }
  if (!SUPABASE_URL || (!SERVICE_ROLE && !ANON_KEY)) {
    console.error('[fatal] VITE_SUPABASE_URL + (SERVICE_ROLE or ANON_KEY) required for --commit');
    process.exit(1);
  }
  const client = createClient(SUPABASE_URL, (SERVICE_ROLE || ANON_KEY)!, { auth: { persistSession: false } });

  // Probe: ensure tables exist.
  const probe = await client.from('customers').select('id').limit(1);
  if (probe.error) {
    console.error(`[fatal] customers table missing: ${probe.error.message}`);
    console.error(`Apply supabase/migrations/20260420120000_customers_and_reservations.sql first.`);
    process.exit(2);
  }

  console.log('\n[commit] writing to Supabase…');
  const summary = await commitCustomers(customers, client);
  console.log('\n=== FINAL REPORT ===');
  console.log(`Gmail customers:     ${gmailCustomers.size}`);
  console.log(`WhatsApp customers:  ${waCustomers.size}`);
  console.log(`Total in Supabase:   ${summary.created + summary.updated} (created=${summary.created}, updated=${summary.updated}, failed=${summary.failed})`);
}

main().catch((e) => { console.error('[fatal]', e); process.exit(1); });
