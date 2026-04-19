import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Badge, Card } from '../components/UI';
import { Icons } from '../components/Icons';
import { useTranslation } from 'react-i18next';
import { EventCard } from '../components/EventCard';
import { Event, User, Category } from '../types';
import { recommendEventsByMood } from '../services/geminiService';

interface HomeProps {
  events: Event[];
  user: User | null;
  onShowLogin: () => void;
  userCurrency?: string;
  onToggleFavorite?: (event: Event) => void;
}

export const Home: React.FC<HomeProps> = ({ events, user, onShowLogin, userCurrency = 'XAF', onToggleFavorite }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const recommendedEvents = useMemo(() => {
    if (!user || user.tickets.length === 0) return events.filter(e => !e.isFeatured).slice(0, 3);
    const boughtEventIds = new Set(user.tickets.map(t => t.eventId));
    const userCategories = new Set(events.filter(e => boughtEventIds.has(e.id)).map(e => e.category));
    return events.filter(e => !boughtEventIds.has(e.id) && userCategories.has(e.category)).slice(0, 3);
  }, [events, user]);

  const [mood, setMood] = React.useState('');
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiRecommendation, setAiRecommendation] = React.useState<{ text: string, events: Event[] } | null>(null);

  const handleMoodSubmit = async () => {
    if (!mood) return;
    setAiLoading(true);
    setAiRecommendation(null);
    const summary = events.map(e => `[ID: ${e.id}] ${e.title} - ${e.category} : ${e.description.slice(0, 80)}`).join('\n');
    const res = await recommendEventsByMood(mood, summary);
    if (res && res.recommendedIds) {
      const recs = events.filter(e => res.recommendedIds.includes(e.id));
      setAiRecommendation({ text: res.text, events: recs });
    }
    setAiLoading(false);
  };

  return (
    <div className="space-y-24 max-w-6xl mx-auto px-4">
      {/* --- HERO SECTION --- */}
      <section className="relative pt-12 text-center space-y-8 animate-fade-in">
        {/* Background Decorative Blurs */}
        <div className="absolute -top-40 -left-20 w-80 h-80 bg-indigo-600/30 rounded-full blur-[120px] -z-10 animate-float"></div>
        <div className="absolute top-20 -right-20 w-60 h-60 bg-purple-600/20 rounded-full blur-[100px] -z-10 animate-float" style={{animationDelay: '2s'}}></div>

        <div className="inline-block px-4 py-1.5 glass rounded-full mb-4 animate-slide-up">
           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">{t('home.hero_tag')}</span>
        </div>
        
        <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] animate-slide-up hero-title">
          <span className="block text-[var(--text-main)]">{t('home.hero_title_1')}</span>
          <span className="text-gradient">{t('home.hero_title_2')}</span>
          <span className="block text-[var(--text-main)]">{t('home.hero_title_3')}</span>
        </h1>
        
        <p className="max-w-xl mx-auto text-lg text-[var(--text-muted)] font-medium leading-relaxed animate-fade-in" style={{animationDelay: '0.5s'}}>
          {t('home.hero_desc')}
        </p>


        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-fade-in" style={{animationDelay: '0.8s'}}>
          <Button onClick={() => navigate('/explore')} className="px-10 py-4 text-sm uppercase tracking-widest">
            {t('home.buttons.explore')}
          </Button>
          <Button onClick={() => { if (!user) onShowLogin(); else navigate('/create'); }} variant="outline" className="px-10 py-4 text-sm uppercase tracking-widest">
            {t('home.buttons.create')}
          </Button>
        </div>
      </section>

      {/* --- VIP CONCIERGE (MOOD AI) --- */}
      <section className="animate-fade-in mx-auto max-w-3xl" style={{animationDelay: '0.9s'}}>
        <div className="glass p-8 rounded-[40px] border-indigo-500/30 relative overflow-hidden shadow-[0_0_50px_-15px_rgba(99,102,241,0.2)]">
           <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 blur-3xl rounded-full"></div>
           <div className="text-center mb-6">
              <h3 className="text-xl font-black text-[var(--text-main)] flex justify-center items-center gap-2 mb-2">
                <Icons.Sparkles className="text-amber-400" /> {t('home.concierge.title')}
              </h3>
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-black">{t('home.concierge.question')}</p>
           </div>
           <div className="flex bg-[var(--bg-input)] rounded-2xl p-1 border border-[var(--border-glass)] focus-within:border-indigo-500/50 transition-colors">
              <input 
                type="text" 
                placeholder={t('home.concierge.placeholder')}
                className="flex-1 bg-transparent text-[var(--text-main)] px-4 py-3 outline-none text-sm placeholder:text-[var(--text-muted)]"

                value={mood}
                onChange={e => setMood(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleMoodSubmit()}
              />
              <button 
                onClick={handleMoodSubmit}
                disabled={aiLoading || !mood}
                className="bg-indigo-600 text-white px-6 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-indigo-500 transition-colors disabled:opacity-50"
              >
                {aiLoading ? t('home.concierge.loading') : t('home.concierge.discover')}
              </button>
           </div>
           
           {aiRecommendation && (
              <div className="mt-8 pt-6 border-t border-[var(--border-glass)] animate-slide-up">
                 <p className="text-[var(--text-muted)] font-medium text-center italic mb-6">"{aiRecommendation.text}"</p>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {aiRecommendation.events.map(event => (
                       <EventCard key={event.id} event={event} onClick={() => navigate(`/event/${event.id}`)} userCurrency={userCurrency} isFavorite={user?.favorites?.includes(event.id)} onToggleFavorite={onToggleFavorite} />
                    ))}
                 </div>
              </div>
           )}
        </div>
      </section>

      {/* --- RECOMMANDÉ CLASSIQUE --- */}
      {recommendedEvents.length > 0 && !aiRecommendation && (
        <section className="animate-fade-in" style={{animationDelay: '1s'}}>
          <div className="flex items-center gap-3 mb-8">
            <h2 className="text-2xl font-black text-[var(--text-main)] flex items-center gap-2">
              <Icons.Sparkles size={24} /> {t('home.recommended')}
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-[var(--border-glass)] to-transparent"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {recommendedEvents.map((event, i) => (
              <div key={event.id} className="animate-slide-up" style={{animationDelay: `${1.2 + i*0.2}s`}}>
                <EventCard event={event} onClick={(e) => navigate(`/event/${e.id}`)} userCurrency={userCurrency} isFavorite={user?.favorites?.includes(event.id)} onToggleFavorite={onToggleFavorite} />
              </div>
            ))}
          </div>
        </section>
      )}


      {/* --- FEATURED --- */}
      <section className="pb-20">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-black text-[var(--text-main)]">{t('home.featured')}</h2>
            <p className="text-sm text-[var(--text-muted)] mt-1">Les événements les plus attendus.</p>
          </div>
          <Button onClick={() => navigate('/explore')} variant="ghost" className="text-xs uppercase tracking-widest text-indigo-400">{t('home.view_all')}</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {events.filter(e => e.isFeatured).map((event, i) => (
             <EventCard key={event.id} event={event} onClick={(e) => navigate(`/event/${e.id}`)} userCurrency={userCurrency} isFavorite={user?.favorites?.includes(event.id)} onToggleFavorite={onToggleFavorite} />
          ))}
        </div>
      </section>

      {/* --- CALL TO ACTION --- */}
      <section className="pb-20">
         <Card className="p-10 md:p-20 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 space-y-6">
              <h2 className="text-4xl md:text-5xl font-black text-[var(--text-main)]">{t('home.cta_title')}</h2>
              <p className="max-w-md mx-auto text-[var(--text-muted)] font-medium">{t('home.cta_desc')}</p>
              <Button onClick={() => navigate('/create')} className="px-10">{t('home.cta_button')}</Button>
            </div>
         </Card>
      </section>
    </div>
  );
};
