import React from 'react';
import { Event } from '../types';
import { Badge } from './UI';
import { Icons } from './Icons';
import { formatPrice } from '../utils/currency';

interface EventCardProps {
  event: Event;
  onClick: (event: Event) => void;
  userCurrency?: string;
  isFavorite?: boolean;
  onToggleFavorite?: (event: Event) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onClick, userCurrency = 'XAF', isFavorite, onToggleFavorite }) => {
  const minPriceCfa = event.tickets.length > 0 ? Math.min(...event.tickets.map(t => t.price)) : 0;


  return (
    <div 
      onClick={() => onClick(event)}
      className="group glass-card overflow-hidden cursor-pointer active:scale-[0.98]"
    >
      <div className="relative h-56 overflow-hidden">
        <img 
          src={event.image} 
          alt={event.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-page)] via-transparent to-transparent opacity-60"></div>
        
        <div className="absolute top-4 left-4">
          <Badge className="shadow-xl">{event.category}</Badge>
        </div>

        {onToggleFavorite && (
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(event); }}
            className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur-md border border-white/20 transition-all ${isFavorite ? 'bg-rose-500/80 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)]' : 'bg-black/30 hover:bg-black/50 text-white/70 hover:text-white'}`}
          >
            <Icons.Heart size={16} className={isFavorite ? 'fill-current' : ''} />
          </button>
        )}
        
        <div className="absolute bottom-4 right-4 glass px-3 py-1.5 rounded-2xl">
          <p className="text-[10px] font-black tracking-widest text-indigo-400">
            {minPriceCfa === 0 ? 'Gratuit' : `Dès ${formatPrice(minPriceCfa, userCurrency)}`}
          </p>
        </div>
      </div>
      
      <div className="p-6 space-y-3">
        <div className="flex items-center gap-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">
           <div className="flex items-center gap-1.5 grayscale group-hover:grayscale-0 transition-all">
             <Icons.Calendar size={12} className="text-indigo-500" />
             <span>
               {new Date(event.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
               {event.endDate && event.endDate !== event.date && ` → ${new Date(event.endDate).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}`}
             </span>
           </div>
           <div className="flex items-center gap-1.5 grayscale group-hover:grayscale-0 transition-all">
             <Icons.MapPin size={12} className="text-amber-500" />
             <span className="truncate max-w-[120px]">{event.city && event.country ? `${event.city}, ${event.country}` : event.location}</span>
           </div>
        </div>
        
        <h3 className="text-xl font-bold text-[var(--text-main)] group-hover:text-indigo-400 transition-colors line-clamp-1">
          {event.title}
        </h3>
        
        <p className="text-[var(--text-muted)] text-xs font-medium line-clamp-2 leading-relaxed">
          {event.description}
        </p>
        
        <div className="pt-4 flex items-center justify-between border-t border-[var(--border-glass)]">
           <div className="flex items-center gap-2">
             <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center text-[10px] font-black text-indigo-400 border border-indigo-500/20">
                {event.organizer.charAt(0)}
             </div>
             <span className="text-[10px] font-bold text-[var(--text-muted)]">{event.organizer}</span>
           </div>
           <div className="flex items-center gap-1 text-[10px] font-black text-indigo-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
             <span>VOIR DÉTAILS</span>
             <Icons.ArrowRight size={14} />
           </div>
        </div>
      </div>
    </div>
  );
};
