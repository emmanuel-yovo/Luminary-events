import React, { useState } from 'react';
import { Button } from '../components/UI';
import { Icons } from '../components/Icons';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const ResetPassword = ({ apiBase }: { apiBase: string }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error(t('auth.reset.mismatch', { defaultValue: 'Les mots de passe ne correspondent pas.' }));
    }
    
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      if (res.ok) {
        setIsSuccess(true);
        toast.success(t('auth.reset.success', { defaultValue: 'Mot de passe réinitialisé !' }));
      } else {
        const data = await res.json();
        toast.error(data.error || t('auth.reset.error', { defaultValue: 'Lien invalide ou expiré.' }));
      }
    } catch {
      toast.error(t('auth.reset.conn_error', { defaultValue: 'Erreur de connexion.' }));
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-page)] transition-colors duration-500">
            <div className="glass p-12 rounded-[40px] text-center border-rose-500/20 max-w-md">
                <div className="w-16 h-16 bg-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                    <Icons.ShieldAlert size={32} />
                </div>
                <h1 className="text-2xl font-black text-white mb-4">Lien manquant</h1>
                <p className="text-[var(--text-muted)] mb-8">Ce lien de réinitialisation est invalide ou corrompu.</p>
                <Button onClick={() => navigate('/login')} className="w-full">Retour à la connexion</Button>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-page)] transition-colors duration-500">
      <div className="w-full max-w-md animate-fade-in">
        <div className="glass p-8 md:p-10 rounded-[40px] border-[var(--border-glass)] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-60 h-60 bg-emerald-600/10 rounded-full blur-[80px]"></div>
          
          <div className="relative">
            <div className={`w-16 h-16 ${isSuccess ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'} rounded-2xl flex items-center justify-center mb-6 ring-2 ring-current ring-opacity-20 transition-all`}>
              {isSuccess ? <Icons.CheckCircle size={32} /> : <Icons.Lock size={32} />}
            </div>
            
            <h1 className="text-3xl font-black text-[var(--text-main)] mb-2 tracking-tight">
              {isSuccess ? t('auth.reset.success_title', { defaultValue: 'C\'est fait !' }) : t('auth.reset.title', { defaultValue: 'Nouveau mot de passe' })}
            </h1>
            <p className="text-[var(--text-muted)] font-medium mb-8">
              {isSuccess 
                ? t('auth.reset.success_desc', { defaultValue: 'Votre mot de passe a été mis à jour avec succès.' })
                : t('auth.reset.desc', { defaultValue: 'Choisissez un mot de passe fort pour protéger votre compte.' })
              }
            </p>

            {!isSuccess ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">
                    {t('login.password')}
                  </label>
                  <input 
                    type="password" 
                    required
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-glass)] rounded-2xl py-4 px-6 text-[var(--text-main)] outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">
                    Confirmation
                  </label>
                  <input 
                    type="password" 
                    required
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-glass)] rounded-2xl py-4 px-6 text-[var(--text-main)] outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full !py-4 shadow-xl shadow-indigo-500/20" 
                  disabled={isLoading}
                >
                  {isLoading ? t('login.loading') : t('auth.reset.button', { defaultValue: 'Mettre à jour' })}
                </Button>
              </form>
            ) : (
              <Button 
                onClick={() => navigate('/login')}
                className="w-full !py-4 bg-gradient-to-r from-emerald-500 to-teal-600 shadow-xl shadow-emerald-500/20"
              >
                {t('login.signin')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
