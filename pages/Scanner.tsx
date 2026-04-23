import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { toast } from 'sonner';
import { Button } from '../components/UI';
import { Icons } from '../components/Icons';
import { useNavigate, useParams } from 'react-router-dom';

interface ScannerProps {
  apiBase: string;
}

import { useTranslation } from 'react-i18next';

export const Scanner: React.FC<ScannerProps> = ({ apiBase }) => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Basic setup for html5-qrcode
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        // Success callback
        if (!isProcessing) {
          handleScan(decodedText);
        }
      },
      (error) => {
        // Ignore errors (happens when no code is visible frames)
      }
    );

    return () => {
      scanner.clear().catch(err => console.error("Failed to clear scanner", err));
    };
  }, [isProcessing]);

  const handleScan = async (qrCodeText: string) => {
    setScanResult(qrCodeText);
    setIsProcessing(true);
    
    try {
      const res = await fetch(`${apiBase}/api/events/${eventId}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ qrCode: qrCodeText })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success(`${data.message} - ${t('scanner.success_ticket')} ${data.attendee}`);
      } else {
        toast.error(`❌ ${data.error}`);
      }
    } catch (e) {
      toast.error(t('scanner.network_error'));
    } finally {
      // Re-arm scanner after 3 seconds
      setTimeout(() => {
        setIsProcessing(false);
        setScanResult(null);
      }, 3000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in p-4">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-3 bg-[var(--bg-input)] rounded-full hover:bg-[var(--bg-hover)] border border-[var(--border-glass)] transition-all text-[var(--text-main)]">
          <Icons.ChevronLeft size={20} />
        </button>
        <h1 className="text-3xl font-black text-[var(--text-main)]">{t('scanner.title')}</h1>
      </div>

      <div className="glass p-6 md:p-10 rounded-[32px] border border-[var(--border-glass)] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px] -z-10 animate-pulse"></div>
        
        <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-[var(--text-main)]">{t('scanner.event_prefix')} #{eventId}</h2>
            <p className="text-[var(--text-muted)] text-sm mt-1">{t('scanner.instruction')}</p>
        </div>

        <div className="bg-black/40 rounded-3xl overflow-hidden border border-white/10 p-2 md:p-6 shadow-inner mx-auto max-w-[400px]">
           <div id="qr-reader" className="w-full text-white"></div>
        </div>
        
        {isProcessing && (
           <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-center animate-pulse">
             <p className="text-amber-400 font-bold tracking-widest text-sm uppercase">{t('scanner.verifying')}</p>
           </div>
        )}
      </div>
    </div>
  );
};
