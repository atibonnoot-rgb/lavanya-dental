import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  CheckCheck, 
  Stethoscope, 
  Calendar, 
  User, 
  Sparkles,
  ExternalLink,
  Bot
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';

interface WhatsAppBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  options?: { label: string; action: () => void }[];
}

export const WhatsAppBookingModal: React.FC<WhatsAppBookingModalProps> = ({ isOpen, onClose }) => {
  const { doctors, services, createAppointment, setCurrentRole, setShowDoctorMobileSimulator, clinicSettings } = useClinic();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Booking state being collected through AI WhatsApp conversation
  const [bookingData, setBookingData] = useState<{
    step: 'name' | 'phone' | 'service' | 'doctor' | 'date' | 'completed';
    patientName: string;
    patientPhone: string;
    serviceId: string;
    doctorId: string;
    date: string;
    timeSlot: string;
  }>({
    step: 'name',
    patientName: '',
    patientPhone: '',
    serviceId: services[0]?.id || 'serv-1',
    doctorId: doctors[0]?.id || 'doc-1',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '10:00',
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  const formatTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    if (isOpen) {
      // Initial bot welcome message
      setMessages([
        {
          id: '1',
          sender: 'bot',
          text: `Hello! 👋 Welcome to ${clinicSettings.clinicName}. I am your 24/7 AI Dental Assistant on WhatsApp.\n\nI can schedule your visit in less than a minute and instantly alert your specialist on their phone.`,
          timestamp: formatTime(),
        },
        {
          id: '2',
          sender: 'bot',
          text: `May I please have your **Full Name** to get started?`,
          timestamp: formatTime(),
        }
      ]);
      setBookingData({
        step: 'name',
        patientName: '',
        patientPhone: '',
        serviceId: services[0]?.id || 'serv-1',
        doctorId: doctors[0]?.id || 'doc-1',
        date: new Date().toISOString().split('T')[0],
        timeSlot: '10:00',
      });
    }
  }, [isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const addBotReply = (text: string, options?: { label: string; action: () => void }[]) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text,
          timestamp: formatTime(),
          options
        }
      ]);
    }, 800);
  };

  const handleSendText = () => {
    if (!inputText.trim()) return;

    const userMsg = inputText.trim();
    setInputText('');

    // Append user message
    setMessages(prev => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: userMsg,
        timestamp: formatTime(),
      }
    ]);

    // Handle state machine flow based on current step
    if (bookingData.step === 'name') {
      setBookingData(prev => ({ ...prev, patientName: userMsg, step: 'phone' }));
      addBotReply(`Thank you, ${userMsg}! 📱 What is your mobile phone number?`);
    } else if (bookingData.step === 'phone') {
      setBookingData(prev => ({ ...prev, patientPhone: userMsg, step: 'service' }));
      addBotReply(
        `Got it! Which dental service or treatment are you looking to book?`,
        services.slice(0, 4).map(s => ({
          label: s.name,
          action: () => handleSelectService(s.id, s.name)
        }))
      );
    } else {
      addBotReply(`I understand! Please select one of the options above or pick a date below to finalize your booking.`);
    }
  };

  const handleSelectService = (serviceId: string, serviceName: string) => {
    setBookingData(prev => ({ ...prev, serviceId, step: 'doctor' }));
    
    setMessages(prev => [
      ...prev,
      {
        id: `user-srv-${Date.now()}`,
        sender: 'user',
        text: `Selected Service: ${serviceName}`,
        timestamp: formatTime()
      }
    ]);

    addBotReply(
      `Excellent choice. Which doctor would you like to see?`,
      doctors.map(d => ({
        label: `${d.name} (${d.specialty.split(' ')[0]})`,
        action: () => handleSelectDoctor(d.id, d.name)
      }))
    );
  };

  const handleSelectDoctor = (doctorId: string, doctorName: string) => {
    setBookingData(prev => ({ ...prev, doctorId, step: 'date' }));

    setMessages(prev => [
      ...prev,
      {
        id: `user-doc-${Date.now()}`,
        sender: 'user',
        text: `Selected Doctor: ${doctorName}`,
        timestamp: formatTime()
      }
    ]);

    addBotReply(
      `Perfect! I've reserved a slot for today/tomorrow with ${doctorName}.\n\nClick the button below to confirm your booking instantly.`,
      [
        {
          label: 'Confirm & Send to Doctor\'s Phone 🚀',
          action: () => handleConfirmBooking(doctorId, doctorName)
        }
      ]
    );
  };

  const handleConfirmBooking = async (doctorId: string, doctorName: string) => {
    setBookingData(prev => ({ ...prev, step: 'completed' }));

    // Create real appointment in ClinicContext
    const created = await createAppointment({
      patientName: bookingData.patientName || 'WhatsApp Patient',
      patientPhone: bookingData.patientPhone || '+91 98765 43210',
      patientEmail: `${(bookingData.patientName || 'patient').toLowerCase().replace(/\s+/g, '')}@whatsapp.com`,
      doctorId: doctorId || bookingData.doctorId,
      serviceId: bookingData.serviceId,
      date: bookingData.date,
      timeSlot: bookingData.timeSlot,
      primaryComplaint: 'Automated 1-Tap Booking via WhatsApp AI Bot Assistant',
      medicalHistory: {
        hasAllergies: false,
        hasHeartCondition: false,
        hasDiabetes: false,
        hasBleedingDisorder: false,
        isPregnant: false,
        previousDentalAnxiety: false
      },
      depositAmount: 50,
      depositPaid: true,
      paymentMethod: 'Card',
      otpVerified: true
    });

    setMessages(prev => [
      ...prev,
      {
        id: `user-confirm-${Date.now()}`,
        sender: 'user',
        text: `Confirmed! Booking ID: ${created.confirmationCode}`,
        timestamp: formatTime()
      }
    ]);

    addBotReply(
      `🎉 **CONFIRMED!**\n\nYour appointment code is **${created.confirmationCode}**.\n\n📱 **Real-Time Alert Dispatched**: ${doctorName} has received an instant push notification on their phone mobile console!`,
      [
        {
          label: '📱 Open Doctor\'s Phone Console View',
          action: () => {
            setCurrentRole('doctor');
            setShowDoctorMobileSimulator(true);
            onClose();
          }
        }
      ]
    );
  };

  const handleOpenRealWhatsApp = () => {
    const defaultMsg = encodeURIComponent("Hi! I want to book a dental appointment via WhatsApp AI.");
    window.open(`https://wa.me/919876543210?text=${defaultMsg}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
      {/* WhatsApp Window Shell */}
      <div className="bg-[#efeae2] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[650px] max-h-[90vh] border border-slate-700/50">
        
        {/* WhatsApp Top Header Bar */}
        <div className="bg-[#075e54] text-white p-3 sm:p-4 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center border-2 border-emerald-400/40 text-white font-bold text-sm overflow-hidden">
                <Bot className="w-6 h-6 text-teal-200" />
              </div>
              <span className="w-3 h-3 bg-emerald-400 border-2 border-[#075e54] rounded-full absolute bottom-0 right-0"></span>
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight flex items-center gap-1.5">
                <span>{clinicSettings.clinicName} AI</span>
                <span className="bg-emerald-400 text-slate-900 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full uppercase">Official Bot</span>
              </h3>
              <p className="text-[11px] text-emerald-200">
                {isTyping ? 'typing...' : 'online • 24/7 AI Booking Agent'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenRealWhatsApp}
              title="Open in real WhatsApp app"
              className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 font-semibold transition-colors"
            >
              <span>App</span>
              <ExternalLink className="w-3 h-3" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-emerald-700 rounded-full text-white/90 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* WhatsApp Chat Body Area */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]">
          
          {/* Encrypted Disclaimer Badge */}
          <div className="text-center my-1">
            <span className="inline-flex items-center gap-1 bg-amber-100/90 text-amber-900 text-[10px] font-medium px-2.5 py-1 rounded-lg shadow-xs border border-amber-200">
              🔒 End-to-end encrypted • Synchronized to Doctor Phone Console
            </span>
          </div>

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-[#dcf8c6] text-slate-900 rounded-tr-none'
                    : 'bg-white text-slate-900 rounded-tl-none border border-slate-200/80'
                }`}
              >
                <div className="whitespace-pre-line">{msg.text}</div>

                {/* Option Buttons if provided by AI */}
                {msg.options && msg.options.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-100 space-y-1.5">
                    {msg.options.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={opt.action}
                        className="w-full text-left bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300/80 text-xs font-semibold py-2 px-3 rounded-xl transition-all flex items-center justify-between"
                      >
                        <span>{opt.label}</span>
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400">
                  <span>{msg.timestamp}</span>
                  {msg.sender === 'user' && <CheckCheck className="w-3.5 h-3.5 text-teal-600" />}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-1 bg-white p-2.5 rounded-xl rounded-tl-none text-xs text-slate-500 w-24 border border-slate-200/80 shadow-xs">
              <span className="animate-bounce">●</span>
              <span className="animate-bounce delay-100">●</span>
              <span className="animate-bounce delay-200">●</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* WhatsApp Chat Footer Input */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
            placeholder="Type your reply to AI..."
            className="flex-1 bg-white border border-slate-300 rounded-full px-4 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"
          />
          <button
            onClick={handleSendText}
            className="w-10 h-10 rounded-full bg-[#075e54] hover:bg-[#064e46] text-white flex items-center justify-center shrink-0 shadow-md transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
