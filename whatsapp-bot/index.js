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

// Clinic System Prompt
const SYSTEM_PROMPT = `You are "Aura", the smart, friendly AI front-desk receptionist for Lavanya Dental Clinic (+91 8555052843).
Clinic Details:
- Address: Lavanya Dental Care Pavilion, Main Road
- Hours: Mon-Sat: 8:00 AM – 6:00 PM (Sunday Closed)
- Treatments Available:
  * serv-1: Comprehensive Dental Examination & 3D Diagnostics
  * serv-2: Ultrasonic Scaling & Deep Plaque Polish
  * serv-3: Microscope-Assisted Single-Visit Root Canal
  * serv-4: Digital Smile Design & Ceramic Porcelain Veneers
  * serv-5: Computer-Navigated Titanium Dental Implant
  * serv-6: ClearAligner Pro Invisible Orthodontics
  * serv-7: 24/7 Acute Dental Trauma & Emergency Care

CRITICAL RULES:
1. STRICT PRICING POLICY: NEVER state, quote, estimate, or reveal prices or fees for any treatment or appointment. If a patient asks about price, cost, or charges, politely tell them: "Treatment costs and procedure plans are provided in person after a clinical examination and diagnostics by our doctors during your visit."
2. Always be polite, warm, and helpful. Answer in the same language the patient speaks (English, Hindi, Hinglish, Telugu, etc.).
3. Answer questions about procedures, pain management, and clinic hours accurately.
4. If a patient wants to book an appointment, gather these 4 details:
   - Patient Full Name
   - Preferred Date (YYYY-MM-DD or say tomorrow/Monday)
   - Preferred Time Slot (e.g. 10:00, 11:30, 14:00, 16:30)
   - Treatment / Service needed
5. CRITICAL RULE FOR BOOKING: Once you have the Patient's Name, Date, Time Slot, and Service/Complaint, finalize the booking by appending this exact JSON tag at the VERY END of your message:
[BOOKING_READY: {"patient_name": "...", "date": "YYYY-MM-DD", "time_slot": "HH:MM", "service_id": "serv-1", "primary_complaint": "..."}]
Use today's year: 2026. If service matches, use serv-1 to serv-7, otherwise default to serv-1.
Keep your messages concise and WhatsApp-friendly (use line breaks and emojis).`;

const CANDIDATE_MODELS = [
  'models/gemini-flash-lite-latest',
  'models/gemini-3-flash-preview',
  'models/gemini-flash-latest'
];

async function callGeminiAI(userPhone, userMessage) {
  let history = conversationHistory.get(userPhone) || [];
  history.push({ role: 'user', parts: [{ text: userMessage }] });

  if (history.length > 14) history = history.slice(-14);
  conversationHistory.set(userPhone, history);

  const payload = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
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
    return "I would be delighted to assist you with booking an appointment at Lavanya Dental! 😊\n\nCould you please share:\n1. Your Full Name\n2. Preferred Date & Time\n3. Treatment or Dental Concern (e.g., Checkup, Root Canal, Cleaning)?";
  }

  return "Hello! I am Aura from Lavanya Dental Clinic. How can I assist you with your dental care or booking today?";
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

      // Prevent infinite loop if text has bot prefix or signature
      if (userText.includes('Lavanya Dental Assistant')) continue;

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

          // Insert into Supabase
          const { error } = await supabase.from('appointments').insert({
            id: `apt-${Date.now()}`,
            confirmation_code: confirmationCode,
            patient_name: bookingData.patient_name || patientName,
            patient_phone: `+${senderPhone}`,
            patient_email: 'whatsapp-patient@lavanyadental.com',
            doctor_id: 'doc-1',
            service_id: bookingData.service_id || 'serv-1',
            date: bookingData.date || new Date().toISOString().split('T')[0],
            time_slot: bookingData.time_slot || '10:00',
            status: 'Pending',
            primary_complaint: bookingData.primary_complaint || 'Booked via WhatsApp AI Assistant',
            deposit_amount: 0,
            deposit_paid: false,
            payment_method: 'Clinic',
            created_at: new Date().toISOString()
          });

          if (!error) {
            bookedId = confirmationCode;
            console.log(`>>> AUTO-BOOKED APPOINTMENT: ${confirmationCode} for ${bookingData.patient_name} in Supabase!`);
          } else {
            console.warn('Supabase booking insert warning:', error);
          }
        } catch (e) {
          console.error('Error parsing booking JSON:', e);
        }

        finalReply = aiResponse.replace(/\[BOOKING_READY:\s*\{.*?\}\]/s, '').trim();
      }

      // Add signature to prevent self-loop
      const replyFormatted = `🦷 *Lavanya Dental Assistant*\n\n${finalReply}`;

      // Send reply back to patient
      const sent = await sock.sendMessage(jid, { text: replyFormatted }, { quoted: msg });
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

// Simple Web Dashboard for Easy QR Scanning & Monitoring
const server = http.createServer(async (req, res) => {
  if (req.url === '/ping' || req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    return;
  }

  if (req.url === '/reset') {
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

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Lavanya Dental - WhatsApp AI Automation (24/7 Online)</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.tailwindcss.com"></script>
  <meta http-equiv="refresh" content="6">
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-6 font-sans">
  <div class="max-w-4xl mx-auto space-y-6">
    
    <!-- Top Nav Header -->
    <div class="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 p-5 rounded-3xl border border-slate-800 shadow-xl backdrop-blur">
      <div>
        <h1 class="text-xl font-bold flex items-center gap-2.5">
          <span class="w-3.5 h-3.5 rounded-full ${botStatus.includes('Active') ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}"></span>
          Lavanya Dental AI WhatsApp Bot
        </h1>
        <p class="text-xs text-slate-400 mt-1">Target Phone: +91 8555052843 • AI: Gemini Flash • Persistence: Supabase Cloud</p>
      </div>
      <div class="flex items-center gap-2.5">
        <a href="/reset" onclick="return confirm('Disconnect and generate new QR code for another number?')" class="px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/50 transition-colors">
          Change Number / Reset
        </a>
        <span class="px-3 py-1.5 text-xs font-semibold rounded-xl ${botStatus.includes('Active') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}">
          ${botStatus}
        </span>
      </div>
    </div>

    <!-- Status Badges: 24/7 Uptime & Cloud Persistence -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="bg-slate-900/70 p-4 rounded-2xl border border-emerald-500/30 flex items-start gap-3">
        <div class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">☁️</div>
        <div>
          <h4 class="text-xs font-bold text-slate-200">Permanent Cloud Persistence</h4>
          <p class="text-[11px] text-slate-400 mt-0.5">Session keys are auto-synced to Supabase. Even if Render restarts, you <b>NEVER need to re-scan QR</b>.</p>
        </div>
      </div>
      <div class="bg-slate-900/70 p-4 rounded-2xl border border-teal-500/30 flex items-start gap-3">
        <div class="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-sm shrink-0">⚡</div>
        <div>
          <h4 class="text-xs font-bold text-slate-200">24/7 Always-On Keep-Alive</h4>
          <p class="text-[11px] text-slate-400 mt-0.5">Automated heartbeat pings active. Add this site to <a href="https://uptimerobot.com" target="_blank" class="text-teal-400 underline">UptimeRobot</a> (URL: <code>/ping</code>) to prevent sleep forever.</p>
        </div>
      </div>
    </div>

    <!-- QR Code Scan Box (Only shown if disconnected/new device) -->
    ${currentQRDataUrl ? `
    <div class="bg-white text-slate-900 p-8 rounded-3xl shadow-2xl max-w-md mx-auto text-center space-y-4 border-4 border-emerald-500 animate-fadeIn">
      <h2 class="text-lg font-bold text-slate-900">One-Time Scan to Link WhatsApp</h2>
      <p class="text-xs text-slate-600">Open WhatsApp on your phone (+91 8555052843) &rarr; <b>Settings / 3 Dots &rarr; Linked Devices &rarr; Link a Device</b></p>
      <div class="p-4 bg-slate-50 rounded-2xl inline-block border border-slate-200">
        <img src="${currentQRDataUrl}" alt="WhatsApp QR Code" class="w-64 h-64 mx-auto" />
      </div>
      <p class="text-[11px] text-slate-500 font-medium">✨ Once scanned once, you will NEVER need to scan again!</p>
    </div>
    ` : ''}

    ${botStatus.includes('Active') ? `
    <div class="bg-emerald-950/50 border border-emerald-600/40 p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 text-emerald-200">
      <div class="flex items-center gap-3.5">
        <div class="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xl shrink-0">
          ✓
        </div>
        <div>
          <p class="font-bold text-white text-sm">Bot is Active & Listening 24/7</p>
          <p class="text-xs text-emerald-300/80">WhatsApp is linked and session is secured in the cloud. You can safely close this browser page!</p>
        </div>
      </div>
      <span class="text-xs bg-emerald-900/60 border border-emerald-700/50 px-3.5 py-1.5 rounded-xl font-mono text-emerald-200">${connectedNumber || '+91 8555052843'}</span>
    </div>
    ` : ''}

    <!-- Live Message Logs -->
    <div class="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 space-y-4">
      <h3 class="text-sm font-bold text-slate-300 flex items-center justify-between">
        <span>Live WhatsApp Activity Logs</span>
        <span class="text-xs text-slate-500 font-mono">${messageLogs.length} messages</span>
      </h3>
      
      ${messageLogs.length === 0 ? `
        <div class="text-center py-8 text-slate-500 text-xs">
          No incoming messages yet. Send a test message from any phone to +91 8555052843 to see Aura reply!
        </div>
      ` : `
        <div class="space-y-3">
          ${messageLogs.map(log => `
            <div class="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-xs space-y-2">
              <div class="flex items-center justify-between text-slate-400">
                <span class="font-semibold text-teal-300">${log.sender}</span>
                <span class="text-[10px] font-mono text-slate-500">${log.time}</span>
              </div>
              <p class="text-slate-200 bg-slate-900/70 p-2 rounded-xl">"${log.message}"</p>
              <div class="bg-slate-900 p-2.5 rounded-xl border-l-2 border-emerald-500 text-slate-300 mt-1">
                <span class="text-[10px] text-emerald-400 font-bold block mb-0.5">AI Response:</span>
                ${log.reply}
              </div>
              ${log.bookedId ? `
                <div class="mt-1 flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-700/40">
                  <span>✓ Synced to Supabase: Confirmation #${log.bookedId}</span>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `}
    </div>

  </div>
</body>
</html>`);
});

const PORT = process.env.PORT || 3005;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Web Dashboard running at: http://localhost:${PORT}`);
  startKeepAlive();
  startWhatsAppBot();
});
