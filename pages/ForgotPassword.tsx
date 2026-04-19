import React, { useState } from 'react';
import { Button } from '../components/UI';
import { Icons } from '../components/Icons';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export const ForgotPassword = ({ apiBase }: { apiBase: string }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        setIsSent(true);
        toast.success(t('auth.forgot.success', { defaultValue: 'Email envoyé ! Vérifiez votre console serveur.' }));
      } else {
        toast.error(t('auth.forgot.error', { defaultValue: 'Erreur lors de la demande.' }));
      }
    } catch {
      toast.error(t('auth.forgot.conn_error', { defaultValue: 'Erreur de connexion.' }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-page)] transition-colors duration-500">
      <div className="w-full max-w-md animate-fade-in">
        <button 
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-main)] mb-8 transition-colors group"
        >
          <div className="p-2 rounded-xl bg-white/5 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-all">
            <Icons.ChevronLeft size={20} />
          </div>
          <span className="font-bold text-sm tracking-tight">{t('login.back_home')}</span>
        </button>

        <div className="glass p-8 md:p-10 rounded-[40px] border-[var(--border-glass)] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-60 h-60 bg-indigo-600/10 rounded-full blur-[80px]"></div>
          
          <div className="relative">
            <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-6 ring-2 ring-indigo-500/20">
              <Icons.ShieldAlert size={32} />
            </div>
            
            <h1 className="text-3xl font-black text-[var(--text-main)] mb-2 tracking-tight">
              {t('auth.forgot.title', { defaultValue: 'Mot de passe oublié' })}
            </h1>
            <p className="text-[var(--text-muted)] font-medium mb-8">
              {isSent 
                ? t('auth.forgot.sent_desc', { defaultValue: 'Si un compte existe pour cet email, un lien de réinitialisation a été généré.' })
                : t('auth.forgot.desc', { defaultValue: 'Entrez votre email pour recevoir un lien de réinitialisation.' })
              }
            </p>

            {!isSent ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">
                    {t('login.email')}
                  </label>
                  <div className="relative group">
                    <Icons.User className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-indigo-400 transition-colors" size={20} />
                    <input 
                      type="email" 
                      required
                      className="w-full bg-[var(--bg-card)] border border-[var(--border-glass)] rounded-2xl py-4 pl-12 pr-4 text-[var(--text-main)] outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full !py-4 shadow-xl shadow-indigo-500/20" 
                  disabled={isLoading}
                >
                  {isLoading ? t('login.loading') : t('auth.forgot.button', { defaultValue: 'Envoyer le lien' })}
                </Button>
              </form>
            ) : (
              <Button 
                onClick={() => navigate('/login')}
                variant="outline"
                className="w-full !py-4"
              >
                {t('auth.forgot.back_login', { defaultValue: 'Retour à la connexion' })}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
