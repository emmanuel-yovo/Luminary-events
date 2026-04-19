import React, { useState } from 'react';
import { Button, Input, Card } from './UI';
import { Icons } from './Icons';
import { toast } from 'sonner';
import { formatPrice } from '../utils/currency';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  eventTitle: string;
  ticketName: string;
  price: number;
  userCurrency?: string;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  eventTitle, 
  ticketName, 
  price,
  userCurrency = 'XAF'
}) => {
  const [step, setStep] = useState<'details' | 'process' | 'success'>('details');
  const [cardInfo, setCardInfo] = useState({ number: '', expiry: '', cvc: '' });

  if (!isOpen) return null;

  const handlePay = () => {
    if (!cardInfo.number || !cardInfo.expiry || !cardInfo.cvc) {
      return toast.error("Veuillez remplir toutes les informations de paiement.");
    }
    
    setStep('process');
    // Simulate API call
    setTimeout(() => {
      setStep('success');
      toast.success("Paiement validé !");
    }, 2500);
  };

  const handleFinish = () => {
    onSuccess();
    onClose();
    setStep('details');
    setCardInfo({ number: '', expiry: '', cvc: '' });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="glass-card w-full max-w-md overflow-hidden animate-slide-up border-white/10 shadow-[0_0_100px_-20px_rgba(99,102,241,0.3)]">
        {step === 'details' && (
          <div className="p-8 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black text-[var(--text-main)]">Finaliser la commande</h2>
                <p className="text-[var(--text-muted)] text-sm mt-1">{eventTitle}</p>
              </div>
              <button onClick={onClose} className="text-[var(--text-muted)] hover:text-indigo-400 transition-colors">
                <Icons.X size={20} />
              </button>
            </div>

            <div className="bg-[var(--bg-page)] p-6 rounded-3xl border border-[var(--border-glass)] flex justify-between items-center">
              <div>
                <p className="text-[10px] text-[var(--text-muted)] uppercase font-black tracking-widest mb-1">Billet</p>
                <p className="font-bold text-[var(--text-main)] text-lg">{ticketName}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-[var(--text-muted)] uppercase font-black tracking-widest mb-1">Prix</p>
                <p className="font-black text-indigo-400 text-2xl">{formatPrice(price, userCurrency)}</p>
              </div>
            </div>

            <div className="space-y-4">
              <Input 
                label="Numéro de carte" 
                placeholder="4242 4242 4242 4242" 
                value={cardInfo.number}
                onChange={(e) => setCardInfo({...cardInfo, number: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="Date d'expiration" 
                  placeholder="MM/YY" 
                  value={cardInfo.expiry}
                  onChange={(e) => setCardInfo({...cardInfo, expiry: e.target.value})}
                />
                <Input 
                  label="CVC" 
                  placeholder="123" 
                  type="password"
                  value={cardInfo.cvc}
                  onChange={(e) => setCardInfo({...cardInfo, cvc: e.target.value})}
                />
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-3">
               <Button onClick={handlePay} className="w-full py-3 h-12 flex items-center justify-center gap-3">
                  <Icons.CreditCard size={18} /> Payer {formatPrice(price, userCurrency)}
               </Button>
               <div className="flex items-center justify-center gap-2 text-[10px] text-[var(--text-muted)] uppercase font-bold">
                  <Icons.Lock size={12} className="text-emerald-400" />
                  Sécurisé par Stripe
               </div>
            </div>
          </div>
        )}

        {step === 'process' && (
          <div className="p-12 text-center space-y-6">
            <div className="w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mr-auto ml-auto"></div>
            <div>
              <h2 className="text-2xl font-black text-[var(--text-main)]">Traitement en cours</h2>
              <p className="text-[var(--text-muted)] mt-2">Nous sécurisons votre transaction...</p>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="p-12 text-center space-y-6 animate-fade-in">
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg ring-4 ring-white/5">
               <Icons.CheckCircle size={40} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-[var(--text-main)]">Merci !</h2>
              <p className="text-[var(--text-muted)] mt-2">Votre billet est réservé. Vous pouvez le retrouver dans votre profil.</p>
            </div>
            <Button onClick={handleFinish} className="w-full bg-green-600 hover:bg-green-700">
               Fermer
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
