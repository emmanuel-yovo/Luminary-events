import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Badge, Card } from '../components/UI';
import { Icons } from '../components/Icons';
import { Event, TicketType } from '../types';
import { ChatWidget } from '../components/ChatWidget';
import { PaymentModal } from '../components/PaymentModal';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { formatPrice } from '../utils/currency';

const API_BASE = 'http://localhost:3000';

const getReportReasons = (t: any) => [
  { value: 'contenu_inapproprie', label: t('eventDetail.reports.contenu_inapproprie') },
  { value: 'arnaque', label: t('eventDetail.reports.arnaque') },
  { value: 'spam', label: t('eventDetail.reports.spam') },
  { value: 'evenement_fictif', label: t('eventDetail.reports.evenement_fictif') },
  { value: 'discrimination', label: t('eventDetail.reports.discrimination') },
  { value: 'autre', label: t('eventDetail.reports.autre') },
];

interface EventDetailProps {
  events: Event[];
  onBuyTicket: (event: Event, ticketId: string) => void;
  user: any;
  onShowLogin: () => void;
  userCurrency?: string;
  onToggleFavorite?: (event: Event) => void;
}

export const EventDetail: React.FC<EventDetailProps> = ({ events, onBuyTicket, user, onShowLogin, userCurrency = 'XAF', onToggleFavorite }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const event = events.find(e => e.id === id);

  const [paymentModal, setPaymentModal] = React.useState<{ open: boolean, ticket: TicketType | null }>({ 
    open: false, 
    ticket: null 
  });
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [isReporting, setIsReporting] = useState(false);

  if (!event) {
    return (
      <div className="text-center py-40">
        <h2 className="text-3xl font-black mb-6 text-[var(--text-main)]">{t('eventDetail.not_found')}</h2>
        <Button onClick={() => navigate('/explore')}>{t('eventDetail.browse_events')}</Button>
      </div>
    );
  }

  const handleBuyClick = (ticketId: string) => {
    if (!user) { onShowLogin(); return; }
    const ticket = event.tickets.find(t => t.id === ticketId);
    if (ticket) setPaymentModal({ open: true, ticket });
  };

  const handlePaymentSuccess = () => {
    if (paymentModal.ticket) onBuyTicket(event, paymentModal.ticket.id);
  };

  const minPrice = event.tickets.length > 0 ? Math.min(...event.tickets.map(t => t.price)) : 0;

  const handleReport = async () => {
    if (!reportReason) { toast.error(t('eventDetail.reports.toast_reason')); return; }
    setIsReporting(true);
    try {
      const res = await fetch(`${API_BASE}/api/reports`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id, reason: reportReason, details: reportDetails })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setShowReportModal(false);
        setReportReason('');
        setReportDetails('');
      } else {
        toast.error(data.error);
      }
    } catch { toast.error(t('eventDetail.reports.conn_error')); }
    finally { setIsReporting(false); }
  };

  const reportReasons = getReportReasons(t);

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-fade-in pb-24">
      <Button onClick={() => navigate(-1)} variant="ghost" className="mb-4 pl-0 text-[var(--text-muted)] hover:text-indigo-400 group flex items-center gap-2">
        <Icons.ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> {t('eventDetail.back')}
      </Button>
      
      {/* Immersive Header */}
      <div className="relative h-[450px] rounded-[40px] overflow-hidden shadow-2xl border border-[var(--border-glass)]">
        <img src={event.image} alt={event.title} className="w-full h-full object-cover scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-page)] via-[var(--bg-page)]/40 to-transparent flex items-end p-8 md:p-12">
          <div className="space-y-4 max-w-2xl">
            <Badge className="shadow-2xl">{t(`categories.${event.category}`)}</Badge>
            <h1 className="text-4xl md:text-6xl font-black text-[var(--text-main)] leading-tight tracking-tighter">
              {event.title}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-[var(--text-muted)] font-medium text-sm">
              <span className="flex items-center gap-2">
                <Icons.MapPin size={16} className="text-indigo-400" /> 
                {event.city && event.country ? `${event.city}, ${event.country}` : event.location}
              </span>
              <a 
                href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&location=${encodeURIComponent(event.location)}`}
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-2 hover:text-indigo-400 transition-colors cursor-pointer bg-[var(--bg-card)] px-3 py-1 rounded-full backdrop-blur-md border border-[var(--border-glass)]"
              >
                <Icons.Calendar size={16} className="text-indigo-400" /> 
                {new Date(event.date).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                {event.endDate && event.endDate !== event.date && (
                  <span> → {new Date(event.endDate).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                )}
                <span className="text-[10px] ml-1 uppercase font-black tracking-wider opacity-70">{t('eventDetail.add_to_calendar')}</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <section className="glass-card p-8 md:p-12">
            <h3 className="text-2xl font-black text-[var(--text-main)] mb-6">{t('eventDetail.about')}</h3>
            <div className="prose prose-invert max-w-none">
              <p className="text-[var(--text-muted)] leading-relaxed text-lg whitespace-pre-line">{event.description}</p>
            </div>
          </section>

          <section className="glass-card p-8 md:p-12 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-[var(--text-main)] flex items-center gap-3">
                <Icons.MapPin className="text-indigo-400" /> {t('eventDetail.location')}
              </h3>
              <a 
                href={event.latitude && event.longitude ? `https://maps.google.com/?q=${event.latitude},${event.longitude}` : `https://maps.google.com/?q=${encodeURIComponent(event.location)}`} 
                target="_blank" 
                rel="noreferrer"
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 underline underline-offset-4"
              >
                {t('eventDetail.open_maps')}
              </a>
            </div>
            <div className="w-full h-64 md:h-80 bg-[var(--bg-card)] rounded-[32px] overflow-hidden border border-[var(--border-glass)] relative">
               <iframe 
                  width="100%" 
                  height="100%" 
                  frameBorder="0" 
                  style={{ border: 0 }} 
                  src={event.latitude && event.longitude ? `https://www.google.com/maps?q=${event.latitude},${event.longitude}&output=embed` : `https://www.google.com/maps?q=${encodeURIComponent(event.location)}&output=embed`} 
                  title={t('eventDetail.map_title')}
                  allowFullScreen
               ></iframe>
               <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-[var(--border-glass)] rounded-[32px]"></div>
            </div>
          </section>
          
          <section className="glass p-8 rounded-[40px] flex items-center justify-between gap-6 border-[var(--border-glass)]">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-2xl shadow-lg ring-4 ring-indigo-500/20 font-black uppercase text-white">
                {event.organizer.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">{t('eventDetail.organizer')}</p>
                <p className="text-xl font-black text-[var(--text-main)]">{event.organizer}</p>
              </div>
            </div>
            <Button variant="outline" className="text-xs px-6">{t('eventDetail.contact')}</Button>
          </section>
        </div>

        <aside className="space-y-8">
          <div className="glass-card p-8 sticky top-32 border-indigo-500/10 shadow-[0_0_50px_-12px_rgba(99,102,241,0.2)]">
            <h3 className="text-lg font-black text-[var(--text-main)] mb-6 text-center uppercase tracking-widest">{t('eventDetail.ticketing')}</h3>
            <div className="mb-8 p-6 bg-[var(--bg-input)] rounded-3xl text-center border border-[var(--border-glass)]">
               <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">{t('eventDetail.from')}</p>
               <div className="flex items-center justify-center gap-1">
                 <span className="text-3xl lg:text-4xl font-black text-indigo-400">{minPrice === 0 ? t('eventDetail.free') : formatPrice(minPrice, userCurrency)}</span>
               </div>
            </div>
            
            <div className="space-y-4">
              {event.tickets.map(ticket => (
                <button 
                  key={ticket.id} 
                  className="w-full flex justify-between items-center p-5 bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] border border-[var(--border-glass)] hover:border-indigo-500/30 rounded-3xl transition-all group"
                  onClick={() => handleBuyClick(ticket.id)}
                >
                  <div className="text-left">
                    <p className="font-bold text-[var(--text-main)] group-hover:text-amber-400 transition-colors">{ticket.name}</p>
                    <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase mt-0.5">{ticket.quantity - ticket.sold} {t('eventDetail.available')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-[var(--text-main)] text-sm md:text-base">{ticket.price === 0 ? t('eventDetail.free') : formatPrice(ticket.price, userCurrency)}</p>
                    <p className="text-[10px] text-indigo-400 font-bold uppercase mt-0.5 group-hover:underline">{t('eventDetail.book')}</p>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="mt-8 pt-6 border-t border-[var(--border-glass)]">
                <div className="flex items-center justify-center gap-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">
                <Icons.Shield size={14} className="text-emerald-500" /> {t('eventDetail.secure_payment')}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {paymentModal.ticket && (
        <PaymentModal 
          isOpen={paymentModal.open}
          onClose={() => setPaymentModal({ open: false, ticket: null })}
          onSuccess={handlePaymentSuccess}
          eventTitle={event.title}
          ticketName={paymentModal.ticket.name}
          price={paymentModal.ticket.price}
          userCurrency={userCurrency}
        />
      )}

      <ChatWidget eventDescription={event.description} />

      {/* Report Button */}
      {user && (
        <div className="text-center pt-8">
          <button 
            onClick={() => setShowReportModal(true)}
            className="text-[10px] text-[var(--text-muted)] hover:text-rose-400 font-bold uppercase tracking-widest transition-colors flex items-center gap-2 mx-auto"
          >
            <Icons.AlertTriangle size={14} /> {t('eventDetail.report_btn', { defaultValue: 'Signaler cet événement' })}
          </button>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setShowReportModal(false)}>
          <div className="glass w-full max-w-md rounded-3xl p-8 space-y-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto">
                <Icons.AlertTriangle size={28} className="text-rose-400" />
              </div>
              <h3 className="text-xl font-black text-[var(--text-main)]">{t('eventDetail.reports.modal_title', { defaultValue: "Signaler l'événement" })}</h3>
              <p className="text-xs text-[var(--text-muted)] font-medium">{t('eventDetail.reports.modal_desc', { defaultValue: 'Aidez-nous à maintenir la qualité de la plateforme.' })}</p>
            </div>

            <div className="space-y-3">
              {reportReasons.map(r => (
                <button
                  key={r.value}
                  onClick={() => setReportReason(r.value)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all text-sm font-bold ${
                    reportReason === r.value 
                      ? 'border-rose-500/50 bg-rose-500/10 text-rose-400' 
                      : 'border-[var(--border-glass)] bg-[var(--bg-input)] text-[var(--text-main)] hover:border-rose-500/20'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <textarea
              placeholder="Détails supplémentaires (optionnel)..."
              value={reportDetails}
              onChange={e => setReportDetails(e.target.value)}
              className="w-full bg-[var(--bg-input)] border border-[var(--border-glass)] rounded-2xl px-4 py-3 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none focus:border-rose-500/50 resize-none h-24"
            />

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowReportModal(false)} className="flex-1">Annuler</Button>
              <Button 
                onClick={handleReport}
                isLoading={isReporting}
                className="flex-1 !bg-gradient-to-r !from-rose-600 !to-red-600 !shadow-rose-500/20"
              >
                Envoyer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
