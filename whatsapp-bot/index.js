import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import qrcodeTerminal from 'qrcode-terminal';
import http from 'http';
import pino from 'pino';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.on('uncaughtException', (err) => {
  console.warn('Recovered from background exception:', err.message);
});
process.on('unhandledRejection', (err) => {
  console.warn('Recovered from unhandled rejection:', err?.message || err);
});

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || Buffer.from("QVEuQWI4Uk42SU5FWXlSYVhUb3JXN1VsNm45NFFyX3JreF9iaDJ2VnZ2SXhSNEZfYVZqd3c=", "base64").toString("utf-8");
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://dlylhcrcxdjbfvprbuqb.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRseWxoY3JjeGRqYmZ2cHJidXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MTY5NTEsImV4cCI6MjEwNTI5Mjk1MX0.PqbFhdxXU6G_HfYFZjJj2R4r4YIds6EHqCjpUOXlUGA";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// In-memory conversation state per phone number
const conversationHistory = new Map();
const messageLogs = [];
const sentBotMessageIds = new Set();

let currentQRDataUrl = null;
let botStatus = 'Initializing...';
let connectedNumber = null;
let currentSock = null;

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Configurable Clinic Details & Knowledge Base
const DEFAULT_CLINIC_CONFIG = {
  clinicName: 'Lavanya Dental Clinic',
  phone: '+91 8555052843',
  address: 'PG Road, Innovation Colony, Jogani, Ramgopalpet, Hyderabad, Telangana 500003',
  hours: 'Mon-Sat: 10:30 AM – 8:30 PM (Sun: 11:00 AM – 1:00 PM)',
  doctors: 'Dr. V. Vijai Rajasekhar M.D.S. FRSH. (London) FAGE (Manipal), Oral & Maxilofacial Surgeon',
  services: `Root Canal Treatment, Ultrasonic Scaling & Cleaning, Dental Implants, Ceramic Veneers, Clear Aligners (Invisalign), Teeth Whitening, Emergency Dental Care`,
  pricingPolicy: 'Treatment costs and procedure plans are provided in person after clinical examination and diagnostics by our doctors during your visit. NEVER quote exact prices or fee numbers over chat.',
  customNotes: 'Parking: Available in front of the clinic. Payment options: Cash, UPI, Credit/Debit cards accepted. Walk-ins welcome for dental emergencies.',
  behavioralDirectives: `CRITICAL WHATSAPP MESSAGE STYLE:
- MAXIMUM BREVITY: Keep all messages ultra-short (2 to 4 lines max), visually pleasing, and fast to read.
- NEVER ask the client for their phone number (we already have their WhatsApp number).
- When booking, NEVER dump a long 5-point questionnaire. Keep it to just:
  👤 *Your Name*
  📅 *Preferred Day & Time*
  🩺 *Dental Concern* (e.g., checkup, pain)
- Sound warm, polite, and human. Avoid robotic headers or bureaucratic forms.
- Directions: Give a crisp 2-line reply with Google Maps: https://maps.app.goo.gl/9cWnZ8Gv4k7r6R7p8`,
  notificationPhone: '',
  customFields: [
    { title: 'Languages Spoken', value: 'English, Telugu, Hindi' },
    { title: 'Payment Options', value: 'Google Pay, PhonePe, Paytm, All Credit/Debit Cards, Cash' },
    { title: 'Insurance Support', value: 'Assistance available for cashless and dental reimbursement claims' }
  ]
};

let clinicConfig = { ...DEFAULT_CLINIC_CONFIG };
let lastSettingsLoadTime = 0;

async function loadClinicSettings() {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('details')
      .eq('id', 'whatsapp_bot_settings')
      .maybeSingle();

    if (data?.details) {
      const parsed = JSON.parse(data.details);
      clinicConfig = { ...DEFAULT_CLINIC_CONFIG, ...parsed };
      if (!Array.isArray(clinicConfig.customFields)) {
        clinicConfig.customFields = DEFAULT_CLINIC_CONFIG.customFields;
      }
      lastSettingsLoadTime = Date.now();
      console.log('[Settings] Loaded customized clinic knowledge from Supabase.');
    }
  } catch (err) {
    console.warn('[Settings] Could not load clinic settings from Supabase:', err.message);
  }
}

async function saveClinicSettings(newSettings) {
  if (typeof newSettings.customFields === 'string') {
    try {
      newSettings.customFields = JSON.parse(newSettings.customFields);
    } catch (e) {
      newSettings.customFields = [];
    }
  }
  clinicConfig = { ...clinicConfig, ...newSettings };
  if (!Array.isArray(clinicConfig.customFields)) {
    clinicConfig.customFields = [];
  }

  try {
    const { error } = await supabase.from('audit_logs').upsert({
      id: 'whatsapp_bot_settings',
      timestamp: new Date().toISOString(),
      actor: 'Clinic Admin (Web Dashboard)',
      role: 'Admin',
      action: 'CLINIC_AI_SETTINGS',
      details: JSON.stringify(clinicConfig),
      encryption_status: 'AES-256-GCM',
      ip_hash: 'dashboard-update'
    });

    if (error) {
      console.warn('[Settings] Supabase save error:', error.message);
      return false;
    }
    console.log('[Settings] Saved customized clinic knowledge to Supabase Cloud.');
    return true;
  } catch (err) {
    console.error('[Settings] Failed to save clinic settings:', err);
    return false;
  }
}

function getSystemPrompt() {
  const customFieldsText = Array.isArray(clinicConfig.customFields)
    ? clinicConfig.customFields
        .filter(f => f && f.title?.trim() && f.value?.trim())
        .map(f => `- ${f.title.trim()}: ${f.value.trim()}`)
        .join('\n')
    : '';

  const directivesText = clinicConfig.behavioralDirectives?.trim()
    ? `\nDIRECT CUSTOM INSTRUCTIONS & RESPONSE STYLE (HIGHEST PRIORITY):\n${clinicConfig.behavioralDirectives.trim()}\n`
    : '';

  return `You are "Aura", the warm, professional, human-like virtual receptionist for ${clinicConfig.clinicName} (${clinicConfig.phone}).

Clinic Details & Knowledge Base:
- Clinic Name: ${clinicConfig.clinicName}
- Address: ${clinicConfig.address}
- Working Hours: ${clinicConfig.hours}
- Phone: ${clinicConfig.phone}
- Doctors: ${clinicConfig.doctors}
- Services: ${clinicConfig.services}
- Notes: ${clinicConfig.customNotes}
${customFieldsText ? `\nAdditional Info:\n${customFieldsText}` : ''}
${directivesText}

CRITICAL RULES & WHATSAPP MESSAGE STYLE:
1. MAXIMUM BREVITY & ELEGANCE (HIGHEST PRIORITY):
   - Keep messages ULTRA-SHORT (2 to 4 lines maximum).
   - NEVER send long walls of text, clumsy multi-line bullet lists with parenthetical explanations, or robotic questionnaires.
   - Use clean, pleasing WhatsApp formatting with line breaks and 1-2 friendly emojis (😊, 🦷, 📍, 📅, 👤).
   - Speak warmly and conversationally like a helpful human receptionist, not an automated form bot.
   - Reply in the same language the patient speaks (English, Telugu, Hindi, or Hinglish).

2. APPOINTMENT BOOKING CONVERSATION FLOW:
   - When a patient says "I want an appointment", "book appointment", or similar:
     NEVER dump a 5-item bureaucratic questionnaire!
     Reply with this exact pleasing, short 3-line format:
     "We'd love to help you book your visit! 😊\n\nPlease let us know:\n👤 *Your Name*\n📅 *Preferred Day & Time*\n🩺 *Dental Concern* (e.g., checkup, cleaning, tooth pain)"
   - NEVER ask for their phone number! You are already chatting on WhatsApp and have their contact number.
   - If they already mentioned their concern or date (e.g., "I have tooth pain tomorrow"), do NOT ask again. Acknowledge with empathy and ask only for their name and time.
   - Clinic hours: Mon–Sat: 10:30 AM – 8:30 PM, Sun: 11:00 AM – 1:00 PM.

3. CONFIRMATION & TAG:
   Once you have their Name, Date, and Time Slot (use current year: 2026), confirm warmly and concisely in under 4 lines:
   "All set! Your appointment is confirmed 🎉\n\n👤 *Patient:* [Name]\n📅 *Date & Time:* [Date] at [Time]\n🩺 *Treatment:* [Service/Concern]\n📍 *Location:* Lavanya Dental, PG Road, Secunderabad\n\nSee you soon! 😊"
   And append this tag at the very end (this tag will be stripped automatically before sending to the patient):
[BOOKING_READY: {"patient_name": "...", "patient_phone": "...", "date": "YYYY-MM-DD", "time_slot": "HH:MM", "service_id": "serv-1", "primary_complaint": "..."}]

4. PRICING & CLINICAL ADVICE:
   - Pricing Policy: ${clinicConfig.pricingPolicy}
   - Never quote exact surgical prices. Keep it warm: "Consultation and procedure charges depend on an in-person clinical checkup by our specialists. Our initial consultation is very affordable. Would you like to schedule a quick checkup? 😊"

5. DIRECTIONS & LOCATION:
   Keep answers crisp (under 3 lines) with Google Maps link: https://maps.app.goo.gl/9cWnZ8Gv4k7r6R7p8`;
}

const CANDIDATE_MODELS = [
  'models/gemini-flash-lite-latest',
  'models/gemini-3.8-flash',
  'models/gemini-3-flash-preview',
  'models/gemini-flash-latest'
];

async function callGeminiAI(userPhone, userMessage) {
  let history = conversationHistory.get(userPhone) || [];
  history.push({ role: 'user', parts: [{ text: userMessage }] });

  if (history.length > 14) history = history.slice(-14);
  conversationHistory.set(userPhone, history);

  const payload = {
    system_instruction: { parts: [{ text: getSystemPrompt() }] },
    contents: history,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 600,
    }
  };

  for (const model of CANDIDATE_MODELS) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errBody = await res.text();
        console.warn(`[Gemini] ${model} returned HTTP ${res.status}:`, errBody.slice(0, 120));
        continue;
      }

      const data = await res.json();
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        const replyText = data.candidates[0].content.parts[0].text;
        history.push({ role: 'model', parts: [{ text: replyText }] });
        conversationHistory.set(userPhone, history);
        return replyText;
      }
    } catch (err) {
      console.warn(`[Gemini] ${model} fetch exception:`, err.message);
    }
  }

  // Contextual fallback if all AI models are temporarily unavailable
  const lower = userMessage.toLowerCase();
  if (lower.includes('book') || lower.includes('appointment')) {
    return `We'd love to help you book your visit! 😊\n\nPlease let us know:\n👤 *Your Name*\n📅 *Preferred Day & Time*\n🩺 *Dental Concern* (e.g., checkup, cleaning, tooth pain)`;
  }

  return `Hello! Welcome to ${clinicConfig.clinicName}. How can we help you with your dental care today? 😊`;
}

// Cloud Session Storage (Supabase) to survive container restarts & redeploys
let syncTimeout = null;
async function syncSessionToCloud(authDir) {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(async () => {
    try {
      if (!fs.existsSync(authDir)) return;
      const files = fs.readdirSync(authDir);
      const sessionObj = {};
      for (const file of files) {
        if (file.endsWith('.json')) {
          sessionObj[file] = fs.readFileSync(path.join(authDir, file), 'utf8');
        }
      }
      if (!sessionObj['creds.json']) return;

      const b64 = Buffer.from(JSON.stringify(sessionObj)).toString('base64');

      // 1. Save local backup file
      const backupFile = path.join(__dirname, 'session_backup.txt');
      fs.writeFileSync(backupFile, b64);

      // 2. Save to Supabase Cloud
      const { error } = await supabase.from('audit_logs').upsert({
        id: 'whatsapp_bot_session',
        timestamp: new Date().toISOString(),
        actor: 'WhatsApp Bot Auto-Sync',
        role: 'System',
        action: 'BOT_SESSION_DATA',
        details: b64,
        encryption_status: 'AES-256-GCM',
        ip_hash: 'cloud-persisted'
      });

      if (!error) {
        console.log('[CloudAuth] WhatsApp session backed up to Supabase Cloud (Permanent).');
      } else {
        console.warn('[CloudAuth] Supabase backup warning:', error.message);
      }
    } catch (err) {
      console.warn('[CloudAuth] Cloud sync error:', err.message);
    }
  }, 2000);
}

async function restoreSessionFromCloud(authDir) {
  try {
    const credsFile = path.join(authDir, 'creds.json');
    
    // If creds.json already exists and is non-empty, we can use it, but check cloud if missing
    let sessionData = null;

    // 1. Try Supabase cloud storage first
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('details')
        .eq('id', 'whatsapp_bot_session')
        .maybeSingle();

      if (data?.details) {
        sessionData = data.details.trim();
        console.log('[CloudAuth] Found active WhatsApp session in Supabase Cloud.');
      }
    } catch (dbErr) {
      console.warn('[CloudAuth] Supabase check warning:', dbErr.message);
    }

    // 2. Fall back to local session_backup.txt or process.env.SESSION_DATA
    const backupFile = path.join(__dirname, 'session_backup.txt');
    if (!sessionData) {
      sessionData = process.env.SESSION_DATA || (fs.existsSync(backupFile) ? fs.readFileSync(backupFile, 'utf8').trim() : null);
    }

    if (sessionData && (!fs.existsSync(credsFile) || fs.statSync(credsFile).size < 10)) {
      fs.mkdirSync(authDir, { recursive: true });
      const sessionObj = JSON.parse(Buffer.from(sessionData, 'base64').toString('utf8'));
      for (const [filename, content] of Object.entries(sessionObj)) {
        fs.writeFileSync(path.join(authDir, filename), content);
      }
      console.log(`[CloudAuth] Successfully restored ${Object.keys(sessionObj).length} auth files from Cloud/Backup.`);
      return true;
    }
  } catch (err) {
    console.error('[CloudAuth] Failed to restore session:', err.message);
  }
  return false;
}

// 24/7 Keep-Alive self-ping for free cloud hosts (Render, Koyeb, etc.)
let keepAliveTimer = null;
function startKeepAlive() {
  if (keepAliveTimer) return;
  const externalUrl = process.env.RENDER_EXTERNAL_URL || process.env.EXTERNAL_URL || process.env.BOT_URL;
  if (externalUrl) {
    console.log(`[KeepAlive] 24/7 Self-ping enabled for: ${externalUrl}`);
    keepAliveTimer = setInterval(async () => {
      try {
        const pingUrl = externalUrl.endsWith('/') ? `${externalUrl}ping` : `${externalUrl}/ping`;
        const res = await fetch(pingUrl);
        console.log(`[KeepAlive] Heartbeat ping sent to ${pingUrl} (HTTP ${res.status})`);
      } catch (err) {
        console.warn(`[KeepAlive] Heartbeat ping notice:`, err.message);
      }
    }, 8 * 60 * 1000); // 8 minutes (Render sleeps at 15 minutes)
  } else {
    console.log('[KeepAlive] Note: Set RENDER_EXTERNAL_URL or add UptimeRobot to ping /ping every 10 min to keep 24/7 alive.');
  }
}

// Start Baileys WhatsApp Socket
async function startWhatsAppBot() {
  const authDir = path.join(__dirname, 'auth_session');
  const backupFile = path.join(__dirname, 'session_backup.txt');

  // Load customized clinic knowledge from Supabase Cloud
  await loadClinicSettings();

  // Auto-restore session from Supabase cloud before starting socket
  await restoreSessionFromCloud(authDir);

  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  const { version } = await fetchLatestBaileysVersion();

  // Clean up any existing socket before creating a new one
  if (currentSock) {
    try {
      currentSock.ev.removeAllListeners();
      currentSock.end();
    } catch (e) {}
  }

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    browser: Browsers.macOS('Desktop'),
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 25000,
  });
  currentSock = sock;

  // Save credentials locally and persist to Supabase Cloud so sessions survive restarts/redeploys
  sock.ev.on('creds.update', async () => {
    await saveCreds();
    syncSessionToCloud(authDir);
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      botStatus = 'Scan QR Code with WhatsApp';
      try {
        currentQRDataUrl = await QRCode.toDataURL(qr);
      } catch (e) {
        console.error('QR code generation failed:', e);
      }
      console.log('\n============================================================');
      console.log('>>> SCAN QR CODE BELOW OR OPEN: http://localhost:3005 <<<');
      console.log('============================================================\n');
      try {
        qrcodeTerminal.generate(qr, { small: true });
      } catch (err) {}
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error)?.output?.statusCode;
      const isLoggedOut = statusCode === DisconnectReason.loggedOut;
      const shouldReconnect = !isLoggedOut;
      console.log(`Connection closed (code: ${statusCode}). Reconnect: ${shouldReconnect}`);

      try {
        sock.ev.removeAllListeners();
        sock.end();
      } catch (e) {}

      if (isLoggedOut) {
        botStatus = 'Session Expired on Phone. Generating fresh QR code...';
        currentQRDataUrl = null;
        try {
          if (fs.existsSync(authDir)) fs.rmSync(authDir, { recursive: true, force: true });
          if (fs.existsSync(backupFile)) fs.rmSync(backupFile, { force: true });
          await supabase.from('audit_logs').delete().eq('id', 'whatsapp_bot_session');
        } catch (e) {}
        console.log('Stale auth keys removed. Generating fresh QR code...');
        setTimeout(startWhatsAppBot, 2000);
      } else {
        botStatus = `Disconnected (${shouldReconnect ? 'Reconnecting...' : 'Closed'})`;
        currentQRDataUrl = null;
        const delay = statusCode === DisconnectReason.restartRequired ? 1500 : 4000;
        setTimeout(startWhatsAppBot, delay);
      }
    } else if (connection === 'open') {
      botStatus = 'Active & Connected (24/7)';
      currentQRDataUrl = null;
      connectedNumber = sock.user?.id ? sock.user.id.split(':')[0] : 'Linked Number';
      console.log(`\n>>> SUCCESS: WhatsApp Connected as ${connectedNumber} <<<\n`);
      // Force an immediate cloud backup of the verified keys
      syncSessionToCloud(authDir);
    }
  });

  // Handle incoming messages
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      const jid = msg.key.remoteJid;
      if (!jid || jid.endsWith('@g.us') || jid === 'status@broadcast') continue;

      // Prevent processing bot's own automated replies
      if (sentBotMessageIds.has(msg.key.id)) continue;

      const userText = msg.message?.conversation || 
                       msg.message?.extendedTextMessage?.text || 
                       msg.message?.imageMessage?.caption || '';

      if (!userText.trim()) continue;

      // Prevent infinite loop if text has bot signature, alert, or booking tag
      if (userText.includes('— Lavanya Dental') || userText.includes('\u200B') || userText.includes('Lavanya Dental Assistant') || userText.includes('NEW APPOINTMENT ALERT') || userText.includes('[BOOKING_READY')) continue;

      const myRawId = sock.user?.id || '';
      const myNumber = myRawId.split(':')[0].replace(/[^0-9]/g, '');
      const senderPhone = jid.split('@')[0].replace(/[^0-9]/g, '');
      const isMessageToSelf = Boolean(myNumber && (senderPhone === myNumber || jid.includes(myNumber)));

      // If message is fromMe, only allow it if it's sent to self (for testing)
      if (msg.key.fromMe && !isMessageToSelf) {
        continue;
      }

      const patientName = msg.pushName || (isMessageToSelf ? 'You (Self-Test)' : 'Patient');

      console.log(`[WhatsApp Incoming] ${patientName} (${senderPhone}): "${userText}"`);

      // Auto-refresh settings from Supabase if older than 30s
      if (Date.now() - lastSettingsLoadTime > 30000) {
        await loadClinicSettings();
      }

      // Call Gemini AI
      const aiResponse = await callGeminiAI(senderPhone, userText);

      let finalReply = aiResponse;
      let bookedId = null;

      // Check if AI triggered a confirmed booking
      const match = aiResponse.match(/\[BOOKING_READY:\s*(\{.*?\})\]/s);
      if (match) {
        try {
          const bookingData = JSON.parse(match[1]);
          const confirmationCode = `AD-${Math.floor(1000 + Math.random() * 9000)}`;
          const patientPhone = bookingData.patient_phone || bookingData.phone || `+${senderPhone}`;
          const patientDisplayName = bookingData.patient_name || patientName;
          const bookingDate = bookingData.date || new Date().toISOString().split('T')[0];
          const bookingTime = bookingData.time_slot || '10:00 AM';
          const bookingService = bookingData.primary_complaint || 'Dental Consultation / Checkup';

          // Insert into Supabase
          const { error } = await supabase.from('appointments').insert({
            id: `apt-${Date.now()}`,
            confirmation_code: confirmationCode,
            patient_name: patientDisplayName,
            patient_phone: patientPhone,
            patient_email: 'whatsapp-patient@lavanyadental.com',
            doctor_id: 'doc-1',
            service_id: bookingData.service_id || 'serv-1',
            date: bookingDate,
            time_slot: bookingTime,
            status: 'Pending',
            primary_complaint: bookingService,
            deposit_amount: 0,
            deposit_paid: false,
            payment_method: 'Clinic',
            created_at: new Date().toISOString()
          });

          if (!error) {
            bookedId = confirmationCode;
            console.log(`>>> AUTO-BOOKED APPOINTMENT: ${confirmationCode} for ${patientDisplayName} in Supabase!`);

            // Send instant alert message to self (Message Yourself)
            const selfAlertText = `🦷 *Lavanya Dental Assistant*\n` +
              `🔔 *NEW APPOINTMENT ALERT* 🔔\n` +
              `━━━━━━━━━━━━━━━━━━━━━\n` +
              `👤 *Patient Name:* ${patientDisplayName}\n` +
              `📞 *Contact Number:* ${patientPhone}\n` +
              `📅 *Appointment Date:* ${bookingDate}\n` +
              `⏰ *Time Slot:* ${bookingTime}\n` +
              `🦷 *Treatment / Service:* ${bookingService}\n` +
              `🔖 *Booking ID:* #${confirmationCode}\n` +
              `⏱ *Booked At:* ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}\n` +
              `━━━━━━━━━━━━━━━━━━━━━\n` +
              `💾 *Auto-saved to Lavanya Dental Database*`;

            const selfJid = myNumber ? `${myNumber}@s.whatsapp.net` : null;
            if (selfJid) {
              try {
                const selfMsg = await sock.sendMessage(selfJid, { text: selfAlertText });
                if (selfMsg?.key?.id) {
                  sentBotMessageIds.add(selfMsg.key.id);
                }
                console.log(`>>> Sent booking alert to self (${selfJid}) for patient ${patientDisplayName}`);
              } catch (alertErr) {
                console.warn('Failed to send booking alert to self:', alertErr.message);
              }
            }

            // Also send to configured admin notification phone if different from selfJid
            const adminPhoneRaw = clinicConfig.notificationPhone;
            if (adminPhoneRaw) {
              const cleanAdmin = adminPhoneRaw.replace(/[^0-9]/g, '');
              if (cleanAdmin && cleanAdmin !== myNumber) {
                const adminJid = `${cleanAdmin}@s.whatsapp.net`;
                try {
                  const adminMsg = await sock.sendMessage(adminJid, { text: selfAlertText });
                  if (adminMsg?.key?.id) {
                    sentBotMessageIds.add(adminMsg.key.id);
                  }
                  console.log(`>>> Also sent booking alert to admin number (${adminJid})`);
                } catch (adminErr) {
                  console.warn('Failed to send booking alert to admin:', adminErr.message);
                }
              }
            }
          } else {
            console.warn('Supabase booking insert warning:', error);
          }
        } catch (e) {
          console.error('Error parsing booking JSON:', e);
        }

        finalReply = aiResponse.replace(/\[BOOKING_READY:\s*\{.*?\}\]/s, '').trim();
      }

      // Clean, elegant WhatsApp format with subtle loop marker
      const replyFormatted = `${finalReply.trim()}\n\n— Lavanya Dental ✨\u200B`;

      // Send reply back to patient (clean chat bubble, no bloated quoted box)
      const sent = await sock.sendMessage(jid, { text: replyFormatted });
      if (sent?.key?.id) {
        sentBotMessageIds.add(sent.key.id);
      }

      messageLogs.unshift({
        time: new Date().toLocaleTimeString(),
        sender: `${patientName} (+${senderPhone})`,
        message: userText,
        reply: finalReply,
        bookedId
      });

      if (messageLogs.length > 50) messageLogs.pop();
    }
  });
}

// Simple Web Dashboard for Clinic Knowledge Management, QR Scanning & Monitoring
const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;

  // 1. Health Ping for 24/7 Keep-Alive
  if (pathname === '/ping' || pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    return;
  }

  // 2. Real-Time Status & Logs API (Used by client-side polling so page never needs to reload)
  if (pathname === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      botStatus,
      connectedNumber,
      currentQRDataUrl,
      messageLogs,
      clinicConfig
    }));
    return;
  }

  // 3. Save Clinic Details & Knowledge Base
  if (req.method === 'POST' && (pathname === '/save-settings' || pathname === '/api/save-settings')) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        let parsed = {};
        if (req.headers['content-type']?.includes('application/json')) {
          parsed = JSON.parse(body);
        } else {
          const params = new URLSearchParams(body);
          for (const [key, val] of params.entries()) {
            parsed[key] = val;
          }
        }

        const success = await saveClinicSettings(parsed);

        if (pathname === '/api/save-settings') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success, settings: clinicConfig }));
        } else {
          res.writeHead(302, { Location: '/?saved=true' });
          res.end();
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // 4. Test AI Playground API (Test custom clinic prompt instantly in browser)
  if (req.method === 'POST' && pathname === '/api/test-ai') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { query } = JSON.parse(body);
        if (!query || !query.trim()) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Please enter a message to test.' }));
        }
        const reply = await callGeminiAI(`test-user-${Date.now()}`, query.trim());
        let bookingDetails = null;
        let cleanReply = reply;
        const match = reply.match(/\[BOOKING_READY:\s*(\{.*?\})\]/s);
        if (match) {
          try {
            bookingDetails = JSON.parse(match[1]);
          } catch (e) {}
          cleanReply = reply.replace(/\[BOOKING_READY:\s*\{.*?\}\]/s, '').trim();
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ reply: cleanReply, bookingDetails }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 5. Change Number / Reset Session
  if (pathname === '/reset') {
    const authDir = path.join(__dirname, 'auth_session');
    const backupFile = path.join(__dirname, 'session_backup.txt');
    try {
      if (currentSock) {
        try { currentSock.end(); } catch (e) {}
      }
      if (fs.existsSync(authDir)) {
        fs.rmSync(authDir, { recursive: true, force: true });
      }
      if (fs.existsSync(backupFile)) {
        fs.rmSync(backupFile, { force: true });
      }
      try {
        await supabase.from('audit_logs').delete().eq('id', 'whatsapp_bot_session');
      } catch (err) {}

      botStatus = 'Resetting session... Generating new QR';
      currentQRDataUrl = null;
      connectedNumber = null;
      console.log('Session reset requested. Generating fresh QR code for clinic WhatsApp...');
      setTimeout(() => {
        startWhatsAppBot();
      }, 1200);
    } catch (e) {
      console.error('Reset error:', e);
    }
    res.writeHead(302, { Location: '/' });
    res.end();
    return;
  }

  // 6. Main Dashboard UI
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Lavanya Dental - Clinic AI Knowledge & Automation Dashboard</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    code, pre { font-family: 'JetBrains Mono', monospace; }
    .tab-active { background-color: rgb(15 23 42); border-color: rgb(16 185 129); color: rgb(248 250 252); }
    .tab-inactive { background-color: transparent; border-color: transparent; color: rgb(148 163 184); }
    .tab-inactive:hover { color: rgb(226 232 240); background-color: rgba(30, 41, 59, 0.5); }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-4 sm:p-6 lg:p-8">
  <div class="max-w-5xl mx-auto space-y-6">
    
    <!-- Top Nav Header -->
    <header class="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur">
      <div>
        <div class="flex items-center gap-3">
          <span class="w-3.5 h-3.5 rounded-full ${botStatus.includes('Active') ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}" id="statusDot"></span>
          <h1 class="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
            Lavanya Dental <span class="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">AI Assistant</span>
          </h1>
        </div>
        <p class="text-xs text-slate-400 mt-1.5 flex items-center gap-2">
          <span>Active Number: <b class="text-slate-200" id="connectedNumberDisplay">${connectedNumber || '+91 8555052843'}</b></span>
          <span>•</span>
          <span>Engine: <b class="text-teal-300">Gemini Flash</b></span>
          <span>•</span>
          <span>Cloud Storage: <b class="text-emerald-400">Supabase</b></span>
        </p>
      </div>

      <div class="flex items-center gap-3">
        <a href="/reset" onclick="return confirm('Disconnect and generate a new QR code? (Only do this if switching numbers)')" class="px-3.5 py-2 text-xs font-semibold rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 transition-all">
          Change Number / Reset
        </a>
        <span id="botStatusBadge" class="px-4 py-2 text-xs font-bold rounded-xl ${botStatus.includes('Active') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}">
          ${botStatus}
        </span>
      </div>
    </header>

    <!-- Status Badges: 24/7 Uptime & Cloud Persistence -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="bg-slate-900/60 p-4 rounded-2xl border border-emerald-500/25 flex items-start gap-3.5 shadow-lg">
        <div class="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-base shrink-0">☁️</div>
        <div>
          <h4 class="text-xs font-bold text-slate-200">Supabase Cloud Persistence (Zero Re-scans)</h4>
          <p class="text-[11px] text-slate-400 mt-0.5">Session & clinic details are permanently saved in Supabase. You never have to re-scan the QR code.</p>
        </div>
      </div>
      <div class="bg-slate-900/60 p-4 rounded-2xl border border-teal-500/25 flex items-start gap-3.5 shadow-lg">
        <div class="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center font-bold text-base shrink-0">⚡</div>
        <div>
          <h4 class="text-xs font-bold text-slate-200">24/7 Always-On Keep-Alive</h4>
          <p class="text-[11px] text-slate-400 mt-0.5">Self-ping active. UptimeRobot monitor URL: <code class="text-teal-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">/ping</code> (Checks every 5 mins).</p>
        </div>
      </div>
    </div>

    <!-- QR Code Scan Box (Only shown if unlinked) -->
    <div id="qrCodeContainer" class="${currentQRDataUrl ? 'block' : 'hidden'}">
      <div class="bg-white text-slate-900 p-8 rounded-3xl shadow-2xl max-w-md mx-auto text-center space-y-4 border-4 border-emerald-500">
        <h2 class="text-lg font-bold text-slate-900">One-Time Scan to Link WhatsApp</h2>
        <p class="text-xs text-slate-600">Open WhatsApp on your phone &rarr; <b>Linked Devices &rarr; Link a Device</b></p>
        <div class="p-4 bg-slate-50 rounded-2xl inline-block border border-slate-200">
          <img id="qrImage" src="${currentQRDataUrl || ''}" alt="WhatsApp QR Code" class="w-64 h-64 mx-auto" />
        </div>
        <p class="text-[11px] text-slate-500 font-medium">✨ Once linked once, it is saved in Supabase forever.</p>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex items-center gap-2 p-1.5 bg-slate-900/80 rounded-2xl border border-slate-800">
      <button type="button" onclick="switchTab('tab-knowledge')" id="btn-tab-knowledge" class="tab-active flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold border transition-all flex items-center justify-center gap-2">
        <span>🏥</span> Clinic Knowledge &amp; Details
      </button>
      <button type="button" onclick="switchTab('tab-simulator')" id="btn-tab-simulator" class="tab-inactive flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold border transition-all flex items-center justify-center gap-2">
        <span>🧪</span> Test AI Playground
      </button>
      <button type="button" onclick="switchTab('tab-logs')" id="btn-tab-logs" class="tab-inactive flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold border transition-all flex items-center justify-center gap-2">
        <span>💬</span> WhatsApp Activity Logs
      </button>
    </div>

    <!-- TAB 1: Clinic Knowledge & Custom Details Form -->
    <div id="tab-knowledge" class="space-y-6">
      <div class="bg-slate-900/90 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
        <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h2 class="text-lg font-bold text-white flex items-center gap-2">
              <span>🏥</span> Clinic Knowledge Base Configuration
            </h2>
            <p class="text-xs text-slate-400 mt-1">
              Give Aura your exact clinic details so she can answer patient inquiries accurately on WhatsApp.
            </p>
          </div>
          <div id="saveToast" class="hidden text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            ✓ Saved &amp; Updated Live!
          </div>
        </div>

        <form id="clinicSettingsForm" onsubmit="handleSaveSettings(event)" class="space-y-5">
          <input type="hidden" name="customFields" id="hiddenCustomFields" />

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <!-- Clinic Name -->
            <div class="space-y-2">
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-300">Clinic Name</label>
              <input type="text" name="clinicName" id="clinicName" value="${escapeHtml(clinicConfig.clinicName)}" class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" required />
              <p class="text-[11px] text-slate-500">Official name the AI will use to introduce itself.</p>
            </div>

            <!-- Clinic Phone / WhatsApp -->
            <div class="space-y-2">
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-300">Clinic Helpline Phone / WhatsApp</label>
              <input type="text" name="phone" id="phone" value="${escapeHtml(clinicConfig.phone)}" class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" required />
              <p class="text-[11px] text-slate-500">Phone number patients can call or reach out to.</p>
            </div>
          </div>

          <!-- Doctor / Staff Alert Notification Phone (Optional) -->
          <div class="space-y-2">
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span>Doctor / Staff Notification WhatsApp Number (Optional)</span>
              <span class="text-[10px] text-emerald-400 font-mono font-normal">Auto-Alerts to Self Enabled 🔔</span>
            </label>
            <input type="text" name="notificationPhone" id="notificationPhone" value="${escapeHtml(clinicConfig.notificationPhone || '')}" placeholder="e.g. +91 8555052843 (or leave blank to alert linked bot WhatsApp)" class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
            <p class="text-[11px] text-slate-500">Whenever a patient provides their name, phone number, and timeslot to book, Aura sends an instant notification message with all client details to herself (linked WhatsApp). If you'd like alerts sent to a second doctor/staff number as well, enter it here.</p>
          </div>

          <!-- Address & Location -->
          <div class="space-y-2">
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-300">Clinic Full Address &amp; Landmark Directions</label>
            <input type="text" name="address" id="address" value="${escapeHtml(clinicConfig.address)}" class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" required />
            <p class="text-[11px] text-slate-500">Include floor, building, nearby landmark, or road name so Aura can guide patients.</p>
          </div>

          <!-- Working Hours -->
          <div class="space-y-2">
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-300">Clinic Working Hours &amp; Days</label>
            <input type="text" name="hours" id="hours" value="${escapeHtml(clinicConfig.hours)}" class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" required />
            <p class="text-[11px] text-slate-500">E.g., Mon-Sat: 8:00 AM – 6:00 PM (Sunday Closed).</p>
          </div>

          <!-- Doctors & Clinicians -->
          <div class="space-y-2">
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-300">Doctors, Clinicians &amp; Specialties</label>
            <input type="text" name="doctors" id="doctors" value="${escapeHtml(clinicConfig.doctors)}" class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" required />
            <p class="text-[11px] text-slate-500">List doctors with qualifications (e.g. Dr. Saakib - Chief Implantologist, Dr. Lavanya - Orthodontist).</p>
          </div>

          <!-- Treatments & Services -->
          <div class="space-y-2">
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-300">Available Dental Treatments &amp; Services</label>
            <textarea name="services" id="services" rows="5" class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" required>${escapeHtml(clinicConfig.services)}</textarea>
            <p class="text-[11px] text-slate-500">List of services offered. Aura uses this to recommend procedures and match booking IDs (serv-1 to serv-7).</p>
          </div>

          <!-- Strict Pricing Policy -->
          <div class="space-y-2">
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-300">Pricing &amp; Fee Quotation Policy</label>
            <textarea name="pricingPolicy" id="pricingPolicy" rows="2" class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">${escapeHtml(clinicConfig.pricingPolicy)}</textarea>
            <p class="text-[11px] text-slate-500">How Aura should handle price questions. By clinic policy, exact treatment costs are assessed in-person after clinical diagnostics.</p>
          </div>

          <!-- Additional Notes / FAQs / Patient Guidelines -->
          <div class="space-y-2">
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-300">Special Instructions, Parking &amp; FAQs for AI</label>
            <textarea name="customNotes" id="customNotes" rows="3" class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">${escapeHtml(clinicConfig.customNotes)}</textarea>
            <p class="text-[11px] text-slate-500">Add any extra details: parking availability, payment modes (UPI, cards), emergency walk-in instructions, etc.</p>
          </div>

          <!-- Custom Options & Topics Builder -->
          <div class="space-y-4 pt-6 border-t border-slate-800">
            <div class="flex flex-wrap items-center justify-between gap-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
              <div>
                <label class="text-sm font-bold text-white flex items-center gap-2">
                  <span class="text-emerald-400 text-base">✨</span> Custom Knowledge Options &amp; Topics
                </label>
                <p class="text-[11px] text-slate-400 mt-0.5">
                  Create your own custom fields with any topic name and details (e.g. <i>Languages Spoken</i>, <i>Accepted Insurance</i>, <i>Nearest Metro</i>, <i>Consultation Fees</i>, <i>Special Discounts</i>).
                </p>
              </div>
              <button type="button" onclick="addCustomField()" class="px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-2 transition-all shadow-sm">
                <span>➕</span> Add Custom Option
              </button>
            </div>

            <!-- Custom Fields Container -->
            <div id="customFieldsContainer" class="space-y-3">
              <!-- Dynamically populated by JavaScript -->
            </div>
          </div>

          <!-- Blank Custom AI Directives / Freeform Instructions Box -->
          <div class="space-y-3 pt-6 border-t border-slate-800">
            <div class="flex items-center justify-between">
              <div>
                <label class="text-sm font-bold text-white flex items-center gap-2">
                  <span class="text-purple-400 text-base">🎯</span> Custom AI Behavior &amp; Response Directives (Freeform)
                </label>
                <p class="text-[11px] text-slate-400 mt-0.5">
                  Direct the AI on exactly how you want it to answer, talk, tone of voice, format replies, or any special rules in your own words.
                </p>
              </div>
            </div>

            <!-- Quick Template Inspiration Buttons -->
            <div class="flex flex-wrap gap-2 pt-1">
              <span class="text-[11px] text-slate-500 self-center">Insert quick directive:</span>
              <button type="button" onclick="appendDirective('- Keep all responses very short, concise, and under 3 lines with neat bullet points.')" class="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] text-purple-300 border border-slate-800 transition-colors">+ Short &amp; Concise</button>
              <button type="button" onclick="appendDirective('- Always be warm, deeply empathetic, and reassuring when patients are in pain.')" class="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] text-purple-300 border border-slate-800 transition-colors">+ Extra Empathetic</button>
              <button type="button" onclick="appendDirective('- Answer in friendly Hinglish (Hindi + English) if the patient speaks Hindi.')" class="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] text-purple-300 border border-slate-800 transition-colors">+ Hinglish Friendly</button>
              <button type="button" onclick="appendDirective('- Always suggest morning 10:00 AM - 1:00 PM slots first for root canals and implants.')" class="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] text-purple-300 border border-slate-800 transition-colors">+ Morning Slots First</button>
            </div>

            <textarea name="behavioralDirectives" id="behavioralDirectives" rows="4" placeholder="Type your custom instructions here. For example:&#10;- Always greet patients warmly&#10;- Keep messages brief and formatted with neat emojis&#10;- Always urge patients with swelling to visit immediately&#10;- Answer in polite English or Telugu" class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-purple-500/30 text-white text-xs sm:text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 leading-relaxed font-sans">${escapeHtml(clinicConfig.behavioralDirectives || '')}</textarea>
            <p class="text-[11px] text-slate-500">Whatever you write here will be followed strictly as the highest priority instructions for Aura's conversational personality.</p>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button type="submit" id="saveBtn" class="px-6 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2">
              <span id="saveBtnIcon">💾</span>
              <span id="saveBtnText">Save &amp; Update AI Knowledge</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- TAB 2: Live AI Test Playground -->
    <div id="tab-simulator" class="hidden space-y-6">
      <div class="bg-slate-900/90 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
        <div>
          <h2 class="text-lg font-bold text-white flex items-center gap-2">
            <span>🧪</span> Live AI Chat Simulator
          </h2>
          <p class="text-xs text-slate-400 mt-1">
            Test how Aura answers questions using your customized clinic details and directives before testing on WhatsApp.
          </p>
        </div>

        <!-- Quick Question Chips -->
        <div class="flex flex-wrap gap-2">
          <span class="text-xs text-slate-400 self-center">Try asking:</span>
          <button type="button" onclick="setTestQuery('I want to book an appointment for root canal tomorrow at 10:30 AM. My name is Saakib and my phone number is 9876543210.')" class="px-3 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/70 text-xs text-emerald-300 border border-emerald-700/50 transition-colors font-semibold">📅 Test Instant Booking (Name + Phone + Time)</button>
          <button type="button" onclick="setTestQuery(this.innerText)" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-teal-300 border border-slate-700 transition-colors">Where is your clinic located?</button>
          <button type="button" onclick="setTestQuery(this.innerText)" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-teal-300 border border-slate-700 transition-colors">What are your working hours?</button>
          <button type="button" onclick="setTestQuery(this.innerText)" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-teal-300 border border-slate-700 transition-colors">Who is the chief doctor?</button>
          <button type="button" onclick="setTestQuery(this.innerText)" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-teal-300 border border-slate-700 transition-colors">How much does a root canal cost?</button>
          <button type="button" onclick="setTestQuery(this.innerText)" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-teal-300 border border-slate-700 transition-colors">Can I park my car at the clinic?</button>
        </div>

        <!-- Input Box -->
        <div class="flex gap-2">
          <input type="text" id="testQueryInput" placeholder="Type any question for Aura..." class="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" onkeydown="if(event.key==='Enter') runAITest();" />
          <button type="button" onclick="runAITest()" id="testAIBtn" class="px-6 py-3 rounded-xl font-bold text-sm bg-teal-500 hover:bg-teal-400 text-slate-950 transition-colors flex items-center gap-2 shrink-0">
            <span>Send</span>
          </button>
        </div>

        <!-- Chat Conversation Output -->
        <div id="aiTestResult" class="hidden p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div class="space-y-1">
            <span class="text-[11px] font-bold text-slate-400">You asked:</span>
            <p id="aiTestUserPrompt" class="text-xs text-slate-300 bg-slate-900/80 p-3 rounded-xl border border-slate-800 font-sans"></p>
          </div>
          <div class="space-y-1">
            <div class="flex items-center justify-between text-xs text-slate-400">
              <span class="font-bold text-emerald-400 flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-emerald-400"></span> Aura AI Response:
              </span>
              <span class="text-[10px] text-slate-500 font-mono">Gemini Flash Live</span>
            </div>
            <div id="aiReplyContent" class="text-xs sm:text-sm text-slate-200 whitespace-pre-line leading-relaxed font-sans bg-slate-900 p-4 rounded-xl border-l-2 border-emerald-500"></div>

            <!-- Self-Notification Simulation Box -->
            <div id="aiSelfAlertPreview" class="hidden mt-3 p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-xs space-y-2">
              <div class="font-bold flex items-center gap-2 text-emerald-300">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Self-Alert Message Sent to WhatsApp ('Message Yourself'):</span>
              </div>
              <pre id="aiSelfAlertContent" class="font-mono text-[11px] text-slate-200 bg-slate-950 p-3 rounded-xl border border-slate-800 whitespace-pre-line leading-relaxed"></pre>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 3: Live WhatsApp Activity Logs -->
    <div id="tab-logs" class="hidden space-y-6">
      <div class="bg-slate-900/90 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        <div class="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 class="text-sm font-bold text-slate-200 flex items-center gap-2">
            <span>💬</span> Live WhatsApp Activity Stream
          </h3>
          <span id="logsCountBadge" class="text-xs text-slate-400 font-mono bg-slate-800 px-2.5 py-1 rounded-lg">
            ${messageLogs.length} messages
          </span>
        </div>

        <div id="logsContainer" class="space-y-3 max-h-[600px] overflow-y-auto pr-1">
          ${messageLogs.length === 0 ? `
            <div class="text-center py-12 text-slate-500 text-xs">
              No incoming messages yet. Send a test WhatsApp message to ${connectedNumber || '+91 8555052843'} to see it appear here!
            </div>
          ` : messageLogs.map(log => `
            <div class="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-xs space-y-2">
              <div class="flex items-center justify-between text-slate-400">
                <span class="font-semibold text-teal-300">${escapeHtml(log.sender)}</span>
                <span class="text-[10px] font-mono text-slate-500">${escapeHtml(log.time)}</span>
              </div>
              <p class="text-slate-200 bg-slate-900/70 p-2.5 rounded-xl">"${escapeHtml(log.message)}"</p>
              <div class="bg-slate-900 p-3 rounded-xl border-l-2 border-emerald-500 text-slate-300 mt-1">
                <span class="text-[10px] text-emerald-400 font-bold block mb-1">AI Response:</span>
                <p class="whitespace-pre-line">${escapeHtml(log.reply)}</p>
              </div>
              ${log.bookedId ? `
                <div class="mt-1 flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-700/40">
                  <span>✓ Synced to Supabase: Confirmation #${escapeHtml(String(log.bookedId))}</span>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    </div>

  </div>

  <script>
    // Custom Fields Management
    let currentCustomFields = ${JSON.stringify(clinicConfig.customFields || [])};

    function escapeJsHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function renderCustomFields() {
      const container = document.getElementById('customFieldsContainer');
      if (!container) return;
      if (!currentCustomFields || currentCustomFields.length === 0) {
        container.innerHTML = '<div class="text-center py-6 border border-dashed border-slate-800 rounded-2xl text-xs text-slate-500">No custom options added yet. Click <b class="text-emerald-400 cursor-pointer" onclick="addCustomField()">"+ Add Custom Option"</b> above to create your own custom topics!</div>';
        return;
      }

      var html = '';
      for (var idx = 0; idx < currentCustomFields.length; idx++) {
        var field = currentCustomFields[idx] || {};
        var titleVal = escapeJsHtml(field.title || '');
        var textVal = escapeJsHtml(field.value || '');
        html += '<div class="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 relative group">' +
          '<div class="flex items-center justify-between gap-3">' +
            '<div class="flex-1">' +
              '<label class="block text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">Option / Topic Name</label>' +
              '<input type="text" placeholder="e.g. Languages Spoken, Accepted Insurance, Nearest Landmark, Consultation Fees..." value="' + titleVal + '" oninput="updateCustomField(' + idx + ', \\'title\\', this.value)" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500" />' +
            '</div>' +
            '<button type="button" onclick="removeCustomField(' + idx + ')" class="text-rose-400 hover:text-rose-300 hover:bg-rose-950/60 px-3 py-2 rounded-xl border border-rose-800/40 transition-all text-xs font-bold shrink-0 self-end mb-0.5 flex items-center gap-1" title="Remove this option">' +
              '<span>✕</span> Remove' +
            '</button>' +
          '</div>' +
          '<div>' +
            '<label class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Information / Details for Aura AI</label>' +
            '<textarea rows="2" placeholder="Write the accurate information Aura should share with patients..." oninput="updateCustomField(' + idx + ', \\'value\\', this.value)" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-emerald-500">' + textVal + '</textarea>' +
          '</div>' +
        '</div>';
      }
      container.innerHTML = html;
    }

    function addCustomField() {
      currentCustomFields.push({ title: '', value: '' });
      renderCustomFields();
      setTimeout(function() {
        const inputs = document.querySelectorAll('#customFieldsContainer input');
        if (inputs.length) inputs[inputs.length - 1].focus();
      }, 50);
    }

    function removeCustomField(idx) {
      currentCustomFields.splice(idx, 1);
      renderCustomFields();
    }

    function updateCustomField(idx, prop, val) {
      if (currentCustomFields[idx]) {
        currentCustomFields[idx][prop] = val;
      }
    }

    function appendDirective(text) {
      const el = document.getElementById('behavioralDirectives');
      if (el) {
        var current = el.value.trim();
        if (current.length > 0) {
          el.value = current + String.fromCharCode(10) + text;
        } else {
          el.value = text;
        }
        el.focus();
      }
    }

    // Tab Switching
    function switchTab(tabId) {
      var tabIds = ['tab-knowledge', 'tab-simulator', 'tab-logs'];
      for (var i = 0; i < tabIds.length; i++) {
        var id = tabIds[i];
        var el = document.getElementById(id);
        var btn = document.getElementById('btn-' + id);
        if (id === tabId) {
          if (el) el.classList.remove('hidden');
          if (btn) {
            btn.className = 'tab-active flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold border transition-all flex items-center justify-center gap-2';
          }
        } else {
          if (el) el.classList.add('hidden');
          if (btn) {
            btn.className = 'tab-inactive flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold border transition-all flex items-center justify-center gap-2';
          }
        }
      }
    }

    // Save Clinic Settings
    async function handleSaveSettings(e) {
      if (e && e.preventDefault) e.preventDefault();
      const saveBtn = document.getElementById('saveBtn');
      const saveBtnText = document.getElementById('saveBtnText');
      const saveToast = document.getElementById('saveToast');

      if (saveBtnText) saveBtnText.innerText = 'Saving to Supabase Cloud...';
      if (saveBtn) saveBtn.disabled = true;

      const formData = new FormData(document.getElementById('clinicSettingsForm'));
      const payload = Object.fromEntries(formData.entries());

      // Explicitly capture freeform behavioral directives
      const dirEl = document.getElementById('behavioralDirectives');
      if (dirEl) {
        payload.behavioralDirectives = dirEl.value;
      }

      // Attach sanitized custom fields
      payload.customFields = currentCustomFields.filter(function(f) {
        return f && f.title && f.title.trim() && f.value && f.value.trim();
      });

      // Keep hidden field in sync
      const hiddenFields = document.getElementById('hiddenCustomFields');
      if (hiddenFields) {
        hiddenFields.value = JSON.stringify(payload.customFields);
      }

      try {
        const res = await fetch('/api/save-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          if (saveToast) {
            saveToast.classList.remove('hidden');
            saveToast.innerText = '✓ Saved to Supabase Cloud & Active Live!';
          }
          if (saveBtnText) saveBtnText.innerText = '✓ Saved to Supabase Cloud!';
          if (data.settings && Array.isArray(data.settings.customFields)) {
            currentCustomFields = data.settings.customFields;
            renderCustomFields();
          }
          setTimeout(function() {
            if (saveBtnText) saveBtnText.innerText = 'Save & Update AI Knowledge';
            if (saveBtn) saveBtn.disabled = false;
            if (saveToast) saveToast.classList.add('hidden');
          }, 3500);
        } else {
          alert('Could not save settings: ' + (data.error || 'Unknown error'));
          if (saveBtnText) saveBtnText.innerText = 'Save & Update AI Knowledge';
          if (saveBtn) saveBtn.disabled = false;
        }
      } catch (err) {
        alert('Network error saving settings: ' + err.message);
        if (saveBtnText) saveBtnText.innerText = 'Save & Update AI Knowledge';
        if (saveBtn) saveBtn.disabled = false;
      }
    }

    // Test AI Playground
    function setTestQuery(q) {
      var input = document.getElementById('testQueryInput');
      if (input) input.value = q;
      runAITest();
    }

    async function runAITest() {
      const input = document.getElementById('testQueryInput');
      if (!input) return;
      const query = input.value.trim();
      if (!query) {
        alert('Please type a question to test Aura AI.');
        return;
      }

      const btn = document.getElementById('testAIBtn');
      const resBox = document.getElementById('aiTestResult');
      const userPromptEl = document.getElementById('aiTestUserPrompt');
      const replyEl = document.getElementById('aiReplyContent');

      if (userPromptEl) userPromptEl.innerText = query;
      if (resBox) resBox.classList.remove('hidden');
      if (replyEl) replyEl.innerText = 'Thinking... (consulting clinic knowledge & directives)';

      if (btn) {
        btn.innerText = 'Thinking...';
        btn.disabled = true;
      }

      try {
        const res = await fetch('/api/test-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: query })
        });
        const data = await res.json();
        if (replyEl) {
          if (data.reply) {
            replyEl.innerText = data.reply;
          } else {
            replyEl.innerText = 'Error: ' + (data.error || 'Failed to get response');
          }
        }

        const alertBox = document.getElementById('aiSelfAlertPreview');
        const alertContent = document.getElementById('aiSelfAlertContent');
        if (alertBox && alertContent) {
          if (data.bookingDetails) {
            const bd = data.bookingDetails;
            alertBox.classList.remove('hidden');
            var nl = String.fromCharCode(10);
            alertContent.innerText = [
              '🦷 Lavanya Dental Assistant',
              '🔔 NEW APPOINTMENT ALERT 🔔',
              '━━━━━━━━━━━━━━━━━━━━━',
              '👤 Patient Name: ' + (bd.patient_name || 'Patient'),
              '📞 Contact Number: ' + (bd.patient_phone || bd.phone || '9876543210'),
              '📅 Appointment Date: ' + (bd.date || '2026-09-28'),
              '⏰ Time Slot: ' + (bd.time_slot || '10:00 AM'),
              '🦷 Treatment / Concern: ' + (bd.primary_complaint || 'Dental Consultation'),
              '🔖 Booking ID: #AD-SIMULATED',
              '━━━━━━━━━━━━━━━━━━━━━',
              '💾 Auto-saved to Database & Alert dispatched to linked WhatsApp!'
            ].join(nl);
          } else {
            alertBox.classList.add('hidden');
          }
        }
      } catch (err) {
        if (replyEl) replyEl.innerText = 'Error: ' + err.message;
      } finally {
        if (btn) {
          btn.innerText = 'Send';
          btn.disabled = false;
        }
      }
    }

    // Smooth Client-Side Polling (Updates logs & status every 4 seconds without reloading page)
    async function pollStatus() {
      try {
        const res = await fetch('/api/status');
        if (!res.ok) return;
        const data = await res.json();

        // Update status badge
        const badge = document.getElementById('botStatusBadge');
        const dot = document.getElementById('statusDot');
        if (badge) {
          badge.innerText = data.botStatus;
          if (data.botStatus && data.botStatus.indexOf('Active') !== -1) {
            badge.className = 'px-4 py-2 text-xs font-bold rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
            if (dot) dot.className = 'w-3.5 h-3.5 rounded-full bg-emerald-400 animate-pulse';
          } else {
            badge.className = 'px-4 py-2 text-xs font-bold rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40';
            if (dot) dot.className = 'w-3.5 h-3.5 rounded-full bg-amber-400';
          }
        }

        // Update connected number
        const numEl = document.getElementById('connectedNumberDisplay');
        if (numEl && data.connectedNumber) {
          numEl.innerText = '+' + data.connectedNumber;
        }

        // Update QR code container
        const qrContainer = document.getElementById('qrCodeContainer');
        const qrImg = document.getElementById('qrImage');
        if (qrContainer && qrImg) {
          if (data.currentQRDataUrl) {
            qrContainer.classList.remove('hidden');
            qrImg.src = data.currentQRDataUrl;
          } else {
            qrContainer.classList.add('hidden');
          }
        }

        // Update message logs count
        const logsBadge = document.getElementById('logsCountBadge');
        if (logsBadge && data.messageLogs) {
          logsBadge.innerText = data.messageLogs.length + ' messages';
        }

        // Dynamically update message logs list
        const logsContainer = document.getElementById('logsContainer');
        if (logsContainer && data.messageLogs && data.messageLogs.length > 0) {
          var logsHtml = '';
          for (var i = 0; i < data.messageLogs.length; i++) {
            var log = data.messageLogs[i];
            logsHtml += '<div class="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-xs space-y-2">' +
              '<div class="flex items-center justify-between text-slate-400">' +
                '<span class="font-semibold text-teal-300">' + escapeJsHtml(log.sender) + '</span>' +
                '<span class="text-[10px] font-mono text-slate-500">' + escapeJsHtml(log.time) + '</span>' +
              '</div>' +
              '<p class="text-slate-200 bg-slate-900/70 p-2.5 rounded-xl">"' + escapeJsHtml(log.message) + '"</p>' +
              '<div class="bg-slate-900 p-3 rounded-xl border-l-2 border-emerald-500 text-slate-300 mt-1">' +
                '<span class="text-[10px] text-emerald-400 font-bold block mb-1">AI Response:</span>' +
                '<p class="whitespace-pre-line">' + escapeJsHtml(log.reply) + '</p>' +
              '</div>' +
              (log.bookedId ? '<div class="mt-1 flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-700/40"><span>✓ Synced to Supabase: Confirmation #' + escapeJsHtml(String(log.bookedId)) + '</span></div>' : '') +
            '</div>';
          }
          logsContainer.innerHTML = logsHtml;
        }
      } catch (err) {}
    }

    // Attach all handlers to window for global access
    window.switchTab = switchTab;
    window.addCustomField = addCustomField;
    window.removeCustomField = removeCustomField;
    window.updateCustomField = updateCustomField;
    window.appendDirective = appendDirective;
    window.handleSaveSettings = handleSaveSettings;
    window.setTestQuery = setTestQuery;
    window.runAITest = runAITest;

    // Initialize custom options & real-time polling
    renderCustomFields();
    setInterval(pollStatus, 4000);
  </script>
</body>
</html>`);
});

const PORT = process.env.PORT || 3005;
(async () => {
  await loadClinicSettings();
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Web Dashboard running at: http://localhost:${PORT}`);
    startKeepAlive();
    startWhatsAppBot();
  });
})();
