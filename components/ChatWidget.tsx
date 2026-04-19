import React, { useState, useRef, useEffect } from 'react';
import { Button, Input } from './UI';
import { Icons } from './Icons';
import { getEventAnswer } from '../services/geminiService';

interface Message {
  text: string;
  isUser: boolean;
}

interface ChatWidgetProps {
  eventDescription: string;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ eventDescription }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { text: "Bonjour ! Je suis l'assistant de cet événement. Comment puis-je vous aider ?", isUser: false }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { text: userMsg, isUser: true }]);
    setIsLoading(true);

    try {
      const answer = await getEventAnswer(userMsg, eventDescription);
      setMessages(prev => [...prev, { text: answer, isUser: false }]);
    } catch (e) {
      setMessages(prev => [...prev, { text: "Désolé, j'ai rencontré une erreur.", isUser: false }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      {isOpen ? (
        <div className="glass-card w-80 md:w-96 flex flex-col border-white/10 animate-slide-up h-[500px] shadow-[0_0_50px_-10px_rgba(99,102,241,0.2)] overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-indigo-600 backdrop-blur-xl text-white flex justify-between items-center border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                <Icons.Brain size={18} />
              </div>
              <div>
                <p className="font-black text-xs uppercase tracking-widest">Assistant Luminary</p>
                <p className="text-[10px] text-indigo-100 font-bold">IA Générative</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-2 rounded-full transition-colors">
              <Icons.X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-3xl text-sm ${
                  msg.isUser 
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg' 
                    : 'bg-[var(--bg-page)] text-[var(--text-main)] border border-[var(--border-glass)] rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[var(--bg-page)] p-4 rounded-3xl rounded-tl-none border border-[var(--border-glass)] animate-pulse text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                  <Icons.Brain size={12} className="animate-bounce" />
                  Gemini réfléchit...
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/5 bg-black/20">
            <div className="flex gap-2">
              <Input 
                placeholder="Votre question..." 
                value={input} 
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              />
              <Button onClick={handleSend} isLoading={isLoading} className="p-2 w-10 h-10 flex items-center justify-center">
                <Icons.Send size={18} />
              </Button>
            </div>
            <p className="text-[10px] font-black text-[var(--text-muted)] mt-3 text-center uppercase tracking-widest flex items-center justify-center gap-2">
              Propulsé par Gemini AI <Icons.Wand size={12} className="text-amber-400" />
            </p>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Icons.MessageSquare size={24} className="group-hover:scale-110 transition-transform relative z-10" />
        </button>
      )}
    </div>
  );
};
