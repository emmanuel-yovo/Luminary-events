import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EventForm } from '../components/EventForm';
import { User } from '../types';
import { Card, Button } from '../components/UI';
import { Icons } from '../components/Icons';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

const API_BASE = 'http://localhost:3000';

interface CreateEventProps {
  user: User | null;
  onSubmit: (event: any) => Promise<void>;
  onShowLogin: () => void;
}

export const CreateEvent: React.FC<CreateEventProps> = ({ user, onSubmit, onShowLogin }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [charterAccepted, setCharterAccepted] = useState<boolean | null>(null);
  const [showCharter, setShowCharter] = useState(false);

  // Check if organizer has accepted charter
  useEffect(() => {
    if (user && (user.role === 'organizer' || user.role === 'admin')) {
      fetch(`${API_BASE}/api/reports/charter-status`, { credentials: 'include' })
        .then(r => r.json())
        .then(data => {
          setCharterAccepted(data.accepted);
          if (!data.accepted) setShowCharter(true);
        })
        .catch(() => setCharterAccepted(false));
    }
  }, [user]);

  const handleAcceptCharter = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/reports/accept-charter`, {
        method: 'POST',
        credentials: 'include'
      });
      if (res.ok) {
        setCharterAccepted(true);
        setShowCharter(false);
        toast.success('Charte acceptée ! Vous pouvez maintenant créer des événements.');
      }
    } catch {
      toast.error('Erreur de connexion');
    }
  };

  if (!user || (user.role !== 'organizer' && user.role !== 'admin')) {
    return (
      <div className="text-center py-40 animate-fade-in">
        <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-float">
          <Icons.Shield size={40} className="text-rose-500 opacity-40" />
        </div>
        <h2 className="text-3xl font-black text-[var(--text-main)] mb-4">{t('createEvent.restricted_title')}</h2>
        <p className="text-[var(--text-muted)] max-w-sm mx-auto mb-10 font-medium">{t('createEvent.restricted_desc')}</p>
        <div className="flex justify-center gap-4">
          <Button onClick={() => navigate('/')} variant="outline">{t('createEvent.back')}</Button>
          {!user && <Button onClick={onShowLogin}>{t('createEvent.login')}</Button>}
        </div>
      </div>
    );
  }

  // Organizer Charter Modal (Policy #1)
  if (showCharter && !charterAccepted) {
    return (
      <div className="max-w-3xl mx-auto animate-fade-in pb-20">
        <Card className="overflow-visible">
          <div className="p-10 md:p-14 space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/30">
                <Icons.Shield size={40} className="text-white" />
              </div>
              <h1 className="text-3xl font-black text-[var(--text-main)]">Charte de l'Organisateur</h1>
              <p className="text-[var(--text-muted)] font-medium">
                Avant de créer votre premier événement, veuillez lire et accepter notre charte.
              </p>
            </div>

            {/* Charter Content */}
            <div className="space-y-6 bg-[var(--bg-input)] p-8 rounded-3xl border border-[var(--border-glass)] max-h-[400px] overflow-y-auto">
              {[
                { icon: <Icons.CheckCircle size={24} className="text-emerald-500" />, title: "Contenu véridique", desc: "Je m'engage à fournir des informations exactes et à jour (titre, date, lieu, description)." },
                { icon: <Icons.Shield size={24} className="text-indigo-400" />, title: "Respect de la loi", desc: "Mon événement respecte la législation en vigueur. Aucun contenu haineux, discriminatoire ou illégal ne sera publié." },
                { icon: <Icons.Ticket size={24} className="text-rose-400" />, title: "Billetterie transparente", desc: "Je m'engage à honorer tous les billets vendus et à rembourser en cas d'annulation." },
                { icon: <Icons.Camera size={24} className="text-blue-400" />, title: "Droits d'image", desc: "Les visuels utilisés sont libres de droits ou m'appartiennent." },
                { icon: <Icons.Lock size={24} className="text-slate-400" />, title: "Protection des données", desc: "Je respecte la vie privée des participants et ne partagerai pas leurs données sans consentement." },
                { icon: <Icons.List size={24} className="text-purple-400" />, title: "Modération", desc: "J'accepte que mon événement soit soumis à validation avant publication. Luminary Events se réserve le droit de rejeter tout contenu inapproprié." },
                { icon: <Icons.AlertTriangle size={24} className="text-red-500" />, title: "Contenu interdit", desc: "Violence, discrimination, arnaques, drogues, contenu adulte et spam sont strictement interdits." },
                { icon: <Icons.Calendar size={24} className="text-orange-400" />, title: "Dates valides", desc: "Les événements doivent être programmés dans le futur avec des dates réalistes." }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="shrink-0 mt-1">{item.icon}</div>
                  <div>
                    <h3 className="text-sm font-black text-[var(--text-main)]">{item.title}</h3>
                    <p className="text-xs text-[var(--text-muted)] font-medium leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Button variant="outline" onClick={() => navigate('/')}>Retour</Button>
              <Button onClick={handleAcceptCharter}>
                <Icons.Check size={16} /> J'accepte la charte
              </Button>
            </div>

            <p className="text-[10px] text-center text-[var(--text-muted)] font-bold uppercase tracking-widest">
              Le non-respect de cette charte entraînera la suspension de votre compte organisateur.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Loading state
  if (charterAccepted === null) {
    return (
      <div className="text-center py-40 animate-fade-in">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
        <p className="text-[var(--text-muted)] mt-6 font-medium">Vérification...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in pb-20">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-black text-[var(--text-main)] tracking-tight" dangerouslySetInnerHTML={{ __html: t('createEvent.title') }}></h1>
        <p className="text-[var(--text-muted)] font-medium text-lg">{t('createEvent.subtitle')}</p>
      </div>

      {/* Info Banner */}
      <div className="flex justify-center -mt-6 mb-2">
        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-[var(--bg-card)] border border-[var(--border-glass)] shadow-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-transparent to-transparent opacity-50"></div>
          <Icons.Shield size={16} className="text-indigo-400 shrink-0 relative z-10" />
          <p className="text-xs text-[var(--text-muted)] font-medium relative z-10">
            Sécurité : Événement soumis à une <strong className="text-indigo-400 font-black uppercase tracking-widest text-[10px] ml-1">validation manuelle</strong>
          </p>
        </div>
      </div>

      <div className="glass-card p-1 shadow-2xl">
        <div className="glass h-full rounded-[30px] p-8 md:p-12">
          <EventForm onSubmit={onSubmit} />
        </div>
      </div>
    </div>
  );
};
