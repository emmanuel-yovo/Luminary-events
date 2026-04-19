import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button, Input } from '../components/UI';
import { useTranslation } from 'react-i18next';

interface LoginProps {
  onLogin: (form: any) => Promise<void>;
  onRegister: (form: any) => Promise<void>;
  apiBase: string;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onRegister, apiBase }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [staySignedIn, setStaySignedIn] = useState(true);
  const [acceptedCgu, setAcceptedCgu] = useState(false);

  const from = (location.state as any)?.from?.pathname || "/";

  const handleGoogleLogin = () => {
    window.location.href = apiBase + '/auth/google';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (mode === 'login') {
        await onLogin({ email: form.email, password: form.password });
        navigate(from, { replace: true });
      } else {
        if (!acceptedCgu) {
          alert('Vous devez accepter les Conditions Générales d\'Utilisation pour vous inscrire.');
          setIsLoading(false);
          return;
        }
        await onRegister({ ...form, acceptedCgu: true });
        setMode('login');
      }
    } catch (error) {
      // Errors handled by toasts
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[var(--bg-page)] flex items-center justify-center p-4 z-[100] overflow-y-auto">
      <div className="w-full max-w-[450px] bg-[var(--bg-card)] rounded-[40px] p-8 md:p-12 shadow-2xl border border-[var(--border-glass)] animate-scale-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="text-3xl font-black text-[var(--text-main)] flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-xl text-white transform rotate-12">L</div>
            Luminary
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-10 mb-10 border-b border-[var(--border-glass)] pb-2">
          <button 
            onClick={() => setMode('login')}
            className={`text-xs font-black tracking-[0.2em] transition-all pb-3 border-b-2 ${
              mode === 'login' ? 'text-[var(--text-main)] border-indigo-500' : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-main)]'
            }`}
          >
            {t('login.signin')}
          </button>
          <button 
            onClick={() => setMode('register')}
            className={`text-xs font-black tracking-[0.2em] transition-all pb-3 border-b-2 ${
              mode === 'register' ? 'text-[var(--text-main)] border-indigo-500' : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-main)]'
            }`}
          >
            {t('login.signup')}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === 'register' && (
            <div className="animate-fade-in">
              <input 
                type="text"
                placeholder={t('login.name')}
                className="w-full bg-[var(--bg-page)] border border-[var(--border-glass)] text-[var(--text-main)] px-6 py-4 rounded-full font-medium placeholder:text-[var(--text-muted)] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none transition-all"
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
                required
              />
            </div>
          )}
          
          <input 
            type="email"
            placeholder={t('login.email')}
            className="w-full bg-[var(--bg-page)] border border-[var(--border-glass)] text-[var(--text-main)] px-6 py-4 rounded-full font-medium placeholder:text-[var(--text-muted)] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none transition-all"
            value={form.email}
            onChange={(e) => setForm({...form, email: e.target.value})}
            required
          />

          <input 
            type="password"
            placeholder={t('login.password')}
            className="w-full bg-[var(--bg-page)] border border-[var(--border-glass)] text-[var(--text-main)] px-6 py-4 rounded-full font-medium placeholder:text-[var(--text-muted)] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none transition-all"
            value={form.password}
            onChange={(e) => setForm({...form, password: e.target.value})}
            required
          />

          <div className="flex items-center gap-2 px-2">
            <input 
              type="checkbox" 
              id="stay"
              checked={staySignedIn}
              onChange={() => setStaySignedIn(!staySignedIn)}
              className="w-4 h-4 rounded bg-[var(--bg-page)] border-[var(--border-glass)] text-indigo-500 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="stay" className="text-xs text-[var(--text-muted)] font-medium cursor-pointer uppercase tracking-widest">{t('login.stay_signed_in')}</label>
          </div>

          {/* CGU Acceptance - Registration only */}
          {mode === 'register' && (
            <div className="flex items-start gap-3 px-2 animate-fade-in">
              <input 
                type="checkbox" 
                id="cgu"
                checked={acceptedCgu}
                onChange={() => setAcceptedCgu(!acceptedCgu)}
                className="w-4 h-4 mt-0.5 rounded bg-[var(--bg-page)] border-[var(--border-glass)] text-indigo-500 focus:ring-0 cursor-pointer shrink-0"
              />
              <label htmlFor="cgu" className="text-xs text-[var(--text-muted)] font-medium cursor-pointer leading-relaxed">
                J'accepte les{' '}
                <Link to="/cgu" target="_blank" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 font-bold">
                  Conditions Générales d'Utilisation
                </Link>
                {' '}et la politique de confidentialité.
              </label>
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#6366f1] hover:bg-[#4f46e5] text-white font-black py-4 rounded-full tracking-widest transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
          >
            {isLoading ? t('login.loading') : mode === 'login' ? t('login.signin') : t('login.signup')}
          </button>
        </form>

        {/* Social / Links */}
        <div className="mt-8 space-y-4 text-center">
          <button 
            onClick={handleGoogleLogin}
            className="text-[10px] text-[var(--text-muted)] font-black tracking-widest hover:text-indigo-400 transition-colors uppercase"
          >
            {t('login.google_login')}
          </button>
          
          <div>
            <Link to="/forgot-password" size="sm" className="text-xs text-[var(--text-muted)] hover:text-indigo-400 transition-colors font-medium">
              {t('login.forgot_password')}
            </Link>
          </div>
        </div>

        <button 
          onClick={() => navigate('/')}
          className="mt-10 w-full text-[10px] text-[var(--text-muted)] hover:text-indigo-400 font-black tracking-[0.3em] transition-colors"
        >
          {t('login.back_home')}
        </button>
      </div>
    </div>
  );
};
