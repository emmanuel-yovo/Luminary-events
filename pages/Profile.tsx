import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Badge, Card } from '../components/UI';
import { OrganizerDashboard } from '../components/OrganizerDashboard';
import { Icons } from '../components/Icons';
import { User, Event } from '../types';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

const API_BASE = 'http://localhost:3000';

import { EventCard } from '../components/EventCard';

interface ProfileProps {
  user: User | null;
  events: Event[];
  onLogout: () => void;
  onShowLogin: () => void;
  onToggleFavorite?: (event: Event) => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, events, onLogout, onShowLogin, onToggleFavorite }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [promotionStatus, setPromotionStatus] = useState<any>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currency, setCurrency] = useState(user?.currency || 'XAF');
  const [isSavingCurrency, setIsSavingCurrency] = useState(false);

  useEffect(() => {
    if (user && user.role === 'attendee') {
      fetch(`${API_BASE}/api/promotions/my-status`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => setPromotionStatus(data))
        .catch(() => {});
    }
  }, [user]);

  const handleRequestPromotion = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/promotions/request`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: requestMessage })
      });
      if (res.ok) {
        toast.success('Demande envoyée avec succès !');
        setShowRequestForm(false);
        const data = await res.json();
        setPromotionStatus({ status: 'pending', message: requestMessage });
      } else {
        const err = await res.json();
        toast.error(err.error || 'Erreur');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCurrencyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCurrency = e.target.value;
    setCurrency(newCurrency);
    setIsSavingCurrency(true);
    try {
      const res = await fetch(`${API_BASE}/auth/account/currency`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: newCurrency })
      });
      if (res.ok) {
        toast.success(`Devise mise à jour vers ${newCurrency}`);
        // We mutate the user object locally for immediately reflecting across the app if App.tsx passes it by ref
        // or trigger a reload/refresh function if one was passed. For now we assume local mutation is acceptable.
        if (user) user.currency = newCurrency;
      } else {
        toast.error('Erreur lors de la sauvegarde');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setIsSavingCurrency(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-40 animate-fade-in">
        <div className="w-24 h-24 bg-[var(--bg-input)] rounded-full flex items-center justify-center mx-auto mb-8 border border-[var(--border-glass)]">
           <Icons.User size={48} className="opacity-20 text-[var(--text-main)]" />
        </div>
        <h2 className="text-3xl font-black text-[var(--text-main)] mb-4">{t('profile.not_logged_tag')}</h2>
        <p className="text-[var(--text-muted)] max-w-sm mx-auto mb-8 font-medium">{t('profile.not_logged_desc')}</p>
        <Button onClick={onShowLogin} className="px-10">{t('profile.login_button')}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-24 animate-fade-in">
      {/* Header Profile */}
      <section className="glass p-10 md:p-14 rounded-[48px] border-[var(--border-glass)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px] -z-10 animate-pulse"></div>
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 p-1 shadow-2xl">
            <div className="w-full h-full bg-[var(--bg-page)] rounded-full flex items-center justify-center text-4xl font-black text-[var(--text-main)] uppercase ring-4 ring-[var(--border-glass)]">
              {user.name.charAt(0)}
            </div>
          </div>
          <div className="text-center md:text-left space-y-2 flex-1">
             <div className="flex flex-col md:flex-row md:items-center gap-4">
               <h1 className="text-4xl font-black text-[var(--text-main)]">{user.name}</h1>
                <Badge color={user.role === 'admin' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : user.role === 'organizer' ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30' : 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30'}>
                  {user.role === 'admin' ? t('profile.admin') : user.role === 'organizer' ? t('profile.organizer') : t('profile.member')}
                </Badge>
             </div>
             <p className="text-[var(--text-muted)] font-medium">{user.email}</p>
              <div className="pt-4 flex flex-wrap justify-center md:justify-start gap-4">
                <Button variant="outline" className="text-xs px-6 py-2" onClick={onLogout}>{t('profile.logout')}</Button>
                {(user.role === 'organizer' || user.role === 'admin') && (
                  <Button onClick={() => navigate('/create')} className="text-xs px-6 py-2">{t('profile.new_event')}</Button>
                )}
              </div>
          </div>
        </div>
      </section>

      {/* Promotion Request Section for attendees */}
      {user.role === 'attendee' && (
        <section className="animate-fade-in">
          <div className="glass p-8 rounded-[40px] border-[var(--border-glass)] space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center ring-2 ring-indigo-500/50">
                <Icons.ShieldPlus size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-[var(--text-main)]">Devenir Organisateur</h3>
                <p className="text-xs text-[var(--text-muted)] font-medium">Créez et gérez vos propres événements sur Luminary.</p>
              </div>
            </div>

            {promotionStatus?.status === 'pending' ? (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                  <Icons.Clock size={20} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-400">Demande en cours d'examen</p>
                  <p className="text-xs text-[var(--text-muted)]">Un administrateur examinera votre candidature prochainement.</p>
                </div>
              </div>
            ) : promotionStatus?.status === 'rejected' ? (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-4">
                <div className="w-10 h-10 bg-rose-500/20 rounded-xl flex items-center justify-center">
                  <Icons.X size={20} className="text-rose-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-rose-400">Demande refusée</p>
                  <p className="text-xs text-[var(--text-muted)]">Vous pouvez soumettre une nouvelle demande.</p>
                </div>
                <Button variant="outline" className="ml-auto text-xs" onClick={() => { setShowRequestForm(true); setPromotionStatus(null); }}>
                  Réessayer
                </Button>
              </div>
            ) : !showRequestForm ? (
              <Button onClick={() => setShowRequestForm(true)} className="w-full h-14 text-xs uppercase tracking-widest">
                <Icons.ShieldPlus size={16} className="mr-2" /> Demander le statut d'organisateur
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Pourquoi souhaitez-vous devenir organisateur ?</label>
                  <textarea
                    className="w-full h-24 bg-[var(--bg-input)] border border-[var(--border-glass)] rounded-2xl px-4 py-3 outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all text-[var(--text-main)] placeholder:text-[var(--text-muted)] font-medium text-sm"
                    placeholder="Décrivez votre projet ou votre expérience dans l'événementiel..."
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="text-xs px-6" onClick={() => setShowRequestForm(false)}>Annuler</Button>
                  <Button className="flex-1 text-xs uppercase tracking-widest" onClick={handleRequestPromotion} isLoading={isSubmitting}>
                    Envoyer la demande
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Mes Billets */}
      <section>
        <div className="flex items-center gap-3 mb-10">
          <h2 className="text-2xl font-black text-[var(--text-main)] flex items-center gap-3">
            <Icons.Ticket size={28} className="text-indigo-400" /> {t('profile.my_tickets')}
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-[var(--border-glass)] to-transparent"></div>
        </div>

        {user.tickets.length === 0 ? (
          <div className="glass-card p-20 text-center border-dashed border-2 border-[var(--border-glass)]">
            <p className="text-[var(--text-muted)] font-medium">{t('profile.no_tickets')}</p>
            <Button variant="ghost" className="mt-4 text-indigo-400" onClick={() => navigate('/explore')}>{t('profile.discover_events')}</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {user.tickets.map((t, i) => (
              <Card key={i} className="group relative">
                <div className="p-8 space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">{t('profile.confirmed_pass')}</p>
                      <h3 className="text-xl font-bold text-[var(--text-main)] group-hover:text-indigo-400 transition-colors">Événement #{t.eventId}</h3>
                    </div>
                    <div className="w-12 h-12 bg-[var(--bg-input)] rounded-2xl flex items-center justify-center group-hover:bg-indigo-500/20 border border-[var(--border-glass)] transition-all">
                       <Icons.Ticket className="w-6 h-6 text-[var(--text-muted)] group-hover:text-indigo-400" />
                    </div>
                  </div>
                  
                  <div className="bg-[var(--bg-input)] p-6 rounded-3xl border border-[var(--border-glass)] flex flex-col items-center gap-4 relative">
                     <div className="p-2 bg-white rounded-2xl shadow-xl">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${t.qrCode}`} 
                          alt="QR Code" 
                          className="w-32 h-32"
                        />
                     </div>
                     <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest bg-[var(--bg-glass)] px-3 py-1 rounded-full border border-[var(--border-glass)]">{t.ticketTypeId}</p>
                  </div>

                  <div className="flex gap-2">
                     <Button variant="outline" className="flex-1 text-xs">{t('profile.details')}</Button>
                     <Button className="flex-[2] text-xs gap-2">
                        <span>📲</span> {t('profile.wallet')}
                     </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Mes Favoris */}
      <section>
        <div className="flex items-center gap-3 mb-10">
          <h2 className="text-2xl font-black text-[var(--text-main)] flex items-center gap-3">
            <Icons.Heart size={28} className="text-rose-500 fill-current" /> Mes Favoris
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-[var(--border-glass)] to-transparent"></div>
        </div>

        {!user.favorites || user.favorites.length === 0 ? (
          <div className="glass-card p-10 text-center border-dashed border-2 border-[var(--border-glass)]">
            <p className="text-[var(--text-muted)] font-medium">Vous n'avez pas encore d'événements favoris.</p>
            <Button variant="ghost" className="mt-4 text-rose-500" onClick={() => navigate('/explore')}>Explorer les événements</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.filter(e => user.favorites?.includes(e.id)).map((event, i) => (
              <EventCard 
                 key={event.id} 
                 event={event} 
                 onClick={() => navigate(`/event/${event.id}`)} 
                 userCurrency={user.currency} 
                 isFavorite={true} 
                 onToggleFavorite={onToggleFavorite} 
              />
            ))}
          </div>
        )}
      </section>

      {/* Dashboard Organisateur */}
      {(user.role === 'organizer' || user.role === 'admin') && (
        <section className="animate-fade-in" style={{animationDelay: '0.3s'}}>
          <div className="flex items-center gap-3 mb-10">
            <h2 className="text-2xl font-black text-[var(--text-main)] flex items-center gap-3">
              <Icons.Dashboard size={28} className="text-indigo-400" /> {t('profile.organizer_dashboard')}
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-[var(--border-glass)] to-transparent"></div>
          </div>
          <Card className="p-2 border-[var(--border-glass)]">
            <OrganizerDashboard />
          </Card>
        </section>
      )}

      {/* Préférences Locales */}
      <section className="animate-fade-in" style={{animationDelay: '0.4s'}}>
        <div className="flex items-center gap-3 mb-10">
          <h2 className="text-2xl font-black text-[var(--text-main)] flex items-center gap-3">
            <Icons.Globe size={28} className="text-blue-400" /> Préférences
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-blue-500/20 to-transparent"></div>
        </div>
        <Card className="border-[var(--border-glass)]">
          <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <h3 className="text-lg font-black text-[var(--text-main)]">Devise d'affichage</h3>
                <p className="text-[var(--text-muted)] text-sm font-medium max-w-md">
                  Choisissez la devise dans laquelle vous souhaitez voir les prix des événements (Conversion basée sur le Franc CFA XAF).
                </p>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative group flex-1 md:w-48">
                  <select 
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-glass)] rounded-2xl px-4 py-3 outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-[var(--text-main)] appearance-none cursor-pointer"
                    value={currency}
                    onChange={handleCurrencyChange}
                    disabled={isSavingCurrency}
                  >
                    <option value="XAF">Franc CFA BEAC (XAF)</option>
                    <option value="XOF">Franc CFA BCEAO (XOF)</option>
                    <option value="EUR">Euro (EUR)</option>
                    <option value="USD">Dollar US (USD)</option>
                    <option value="GBP">Livre Sterling (GBP)</option>
                    <option value="CAD">Dollar Canadien (CAD)</option>
                  </select>
                  <Icons.ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none group-focus-within:text-indigo-400 transition-colors" />
                </div>
                {isSavingCurrency && <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>}
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Zone Danger - RGPD */}
      <section className="animate-fade-in" style={{animationDelay: '0.5s'}}>
        <div className="flex items-center gap-3 mb-10">
          <h2 className="text-2xl font-black text-[var(--text-main)] flex items-center gap-3">
            <Icons.AlertTriangle size={28} className="text-rose-400" /> Zone Danger
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-rose-500/20 to-transparent"></div>
        </div>
        <Card className="border-rose-500/10 hover:border-rose-500/20">
          <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <h3 className="text-lg font-black text-rose-400">Supprimer mon compte</h3>
                <p className="text-[var(--text-muted)] text-sm font-medium max-w-md">
                  Cette action est irréversible. Toutes vos données, événements et billets seront définitivement supprimés conformément au RGPD.
                </p>
              </div>
              <Button 
                variant="outline" 
                className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/50 shrink-0"
                onClick={async () => {
                  if (!confirm('⚠️ Êtes-vous absolument certain(e) de vouloir supprimer votre compte ? Cette action est IRRÉVERSIBLE.')) return;
                  if (!confirm('Dernière chance : toutes vos données seront perdues. Confirmer la suppression ?')) return;
                  try {
                    const res = await fetch(`${API_BASE}/auth/account`, {
                      method: 'DELETE',
                      credentials: 'include'
                    });
                    if (res.ok) {
                      toast.success('Compte supprimé. Au revoir !');
                      onLogout();
                    } else {
                      toast.error('Erreur lors de la suppression');
                    }
                  } catch {
                    toast.error('Erreur de connexion');
                  }
                }}
              >
                <Icons.Trash size={16} /> Supprimer définitivement
              </Button>
            </div>
            <div className="pt-4 border-t border-[var(--border-glass)]">
              <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">
                En utilisant Luminary Events, vous acceptez nos{' '}
                <span className="text-indigo-400 cursor-pointer hover:underline" onClick={() => navigate('/cgu')}>
                  Conditions Générales d'Utilisation
                </span>
              </p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
};
