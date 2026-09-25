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

// Start Baileys WhatsApp Socket
async function startWhatsAppBot() {
  const authDir = path.join(__dirname, 'auth_session');
  const backupFile = path.join(__dirname, 'session_backup.txt');
  const credsFile = path.join(authDir, 'creds.json');

  // Auto-restore session if auth_session is missing or lacks creds.json
  if (!fs.existsSync(credsFile)) {
    const sessionData = process.env.SESSION_DATA || (fs.existsSync(backupFile) ? fs.readFileSync(backupFile, 'utf8') : null);
    if (sessionData) {
      try {
        fs.mkdirSync(authDir, { recursive: true });
        const sessionObj = JSON.parse(Buffer.from(sessionData, 'base64').toString('utf8'));
        for (const [filename, content] of Object.entries(sessionObj)) {
          fs.writeFileSync(path.join(authDir, filename), content);
        }
        console.log('Restored auth session from session backup.');
      } catch (e) {
        console.error('Failed to unpack session backup:', e.message);
      }
    }
  }

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

  // Save credentials and update backup copy so sessions survive restarts/redeploys
  sock.ev.on('creds.update', async () => {
    await saveCreds();
    try {
      const files = fs.readdirSync(authDir);
      const sessionObj = {};
      for (const file of files) {
        if (file.endsWith('.json')) {
          sessionObj[file] = fs.readFileSync(path.join(authDir, file), 'utf8');
        }
      }
      const b64 = Buffer.from(JSON.stringify(sessionObj)).toString('base64');
      fs.writeFileSync(backupFile, b64);
    } catch (err) {}
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
      botStatus = 'Active & Connected';
      currentQRDataUrl = null;
      connectedNumber = sock.user?.id ? sock.user.id.split(':')[0] : 'Linked Number';
      console.log(`\n>>> SUCCESS: WhatsApp Connected as ${connectedNumber} <<<\n`);
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
    try {
      if (currentSock) {
        try { currentSock.end(); } catch (e) {}
      }
      if (fs.existsSync(authDir)) {
        fs.rmSync(authDir, { recursive: true, force: true });
      }
      botStatus = 'Resetting session... Generating new QR';
      currentQRDataUrl = null;
      connectedNumber = null;
      console.log('Session reset requested. Generating fresh QR code for +91 8555052843...');
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
  <title>Lavanya Dental - WhatsApp AI Automation</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.tailwindcss.com"></script>
  <meta http-equiv="refresh" content="5">
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen p-6 font-sans">
  <div class="max-w-4xl mx-auto space-y-6">
    
    <!-- Header -->
    <div class="flex items-center justify-between bg-slate-800 p-5 rounded-2xl border border-slate-700">
      <div>
        <h1 class="text-xl font-bold flex items-center gap-2">
          <span class="w-3 h-3 rounded-full ${botStatus.includes('Active') ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}"></span>
          Lavanya Dental AI WhatsApp Bot
        </h1>
        <p class="text-xs text-slate-400 mt-1">Target Number: +91 8555052843 • Engine: Google Gemini Flash • Database: Supabase</p>
      </div>
      <div class="text-right flex items-center gap-2">
        <a href="/reset" onclick="return confirm('Disconnect and generate new QR code for another number?')" class="px-3 py-1 text-xs font-semibold rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-300 border border-rose-700/50 transition-colors">
          Change Number / Reset
        </a>
        <span class="px-3 py-1 text-xs font-semibold rounded-full ${botStatus.includes('Active') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}">
          ${botStatus}
        </span>
      </div>
    </div>

    <!-- QR Code Scan Box (If not yet connected) -->
    ${currentQRDataUrl ? `
    <div class="bg-white text-slate-900 p-8 rounded-3xl shadow-2xl max-w-md mx-auto text-center space-y-4 border-4 border-emerald-500">
      <h2 class="text-lg font-bold text-slate-900">Scan to Link WhatsApp</h2>
      <p class="text-xs text-slate-600">Open WhatsApp on your phone (+91 8555052843) &rarr; <b>Settings / 3 Dots &rarr; Linked Devices &rarr; Link a Device</b></p>
      <div class="p-4 bg-slate-50 rounded-2xl inline-block border border-slate-200">
        <img src="${currentQRDataUrl}" alt="WhatsApp QR Code" class="w-64 h-64 mx-auto" />
      </div>
      <p class="text-[11px] text-slate-400">QR code refreshes automatically every 20 seconds</p>
    </div>
    ` : ''}

    ${botStatus.includes('Active') ? `
    <div class="bg-emerald-950/60 border border-emerald-700/50 p-4 rounded-2xl flex items-center justify-between text-emerald-200 text-sm">
      <div class="flex items-center gap-3">
        <span class="text-2xl">✓</span>
        <div>
          <p class="font-bold">Bot is Active & Listening</p>
          <p class="text-xs text-emerald-300/80">Patients messaging +91 8555052843 receive automated intelligent booking assistance.</p>
        </div>
      </div>
      <span class="text-xs bg-emerald-800/60 px-3 py-1 rounded-lg font-mono">${connectedNumber || '+91 8555052843'}</span>
    </div>
    ` : ''}

    <!-- Live Message Logs -->
    <div class="bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-4">
      <h3 class="text-sm font-bold text-slate-300 flex items-center justify-between">
        <span>Live WhatsApp Activity Logs</span>
        <span class="text-xs text-slate-500">${messageLogs.length} messages</span>
      </h3>
      
      ${messageLogs.length === 0 ? `
        <div class="text-center py-8 text-slate-500 text-xs">
          No incoming messages yet. Send a message to your WhatsApp number to test the automation!
        </div>
      ` : `
        <div class="space-y-3">
          ${messageLogs.map(log => `
            <div class="bg-slate-900 p-3 rounded-xl border border-slate-700/80 text-xs space-y-1.5">
              <div class="flex items-center justify-between text-slate-400">
                <span class="font-semibold text-teal-300">${log.sender}</span>
                <span class="text-[10px] font-mono">${log.time}</span>
              </div>
              <p class="text-slate-200">"${log.message}"</p>
              <div class="bg-slate-800/80 p-2.5 rounded-lg border-l-2 border-emerald-500 text-slate-300 mt-1">
                <span class="text-[10px] text-emerald-400 font-bold block mb-0.5">AI Response:</span>
                ${log.reply}
              </div>
              ${log.bookedId ? `
                <div class="mt-1 flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-700/40">
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
  startWhatsAppBot();
});
