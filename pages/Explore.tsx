import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Input, Badge, Button } from '../components/UI';
import { EventCard } from '../components/EventCard';
import { Icons } from '../components/Icons';
import { Event as EventType, Category, User } from '../types';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icon in Leaflet + React/Vite
// @ts-ignore
import markerIcon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
// @ts-ignore
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIconRetina,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface ExploreProps {
  events: EventType[];
  userCurrency?: string;
  user?: User | null;
  onShowLogin?: () => void;
  onToggleFavorite?: (event: EventType) => void;
}

export const Explore: React.FC<ExploreProps> = ({ events, userCurrency = 'XAF', user, onShowLogin, onToggleFavorite }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'Tous'>((searchParams.get('category') as Category) || 'Tous');
  const [priceFilter, setPriceFilter] = useState<'Tous' | 'Gratuit' | 'Premium'>('Tous');
  const [dateFilter, setDateFilter] = useState<'Toutes' | 'Ce mois' | 'Plus tard'>('Toutes');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          event.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Tous' || event.category === selectedCategory;
    
    const minPrice = event.tickets.length > 0 ? Math.min(...event.tickets.map(t => t.price)) : 0;
    const matchesPrice = priceFilter === 'Tous' || (priceFilter === 'Gratuit' && minPrice === 0) || (priceFilter === 'Premium' && minPrice > 0);

    const eventDate = new Date(event.date);
    const now = new Date();
    const isThisMonth = eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear();
    const isLater = eventDate > now && !isThisMonth;
    
    const matchesDate = dateFilter === 'Toutes' || (dateFilter === 'Ce mois' && isThisMonth) || (dateFilter === 'Plus tard' && isLater);

    return matchesSearch && matchesCategory && matchesPrice && matchesDate;
  });

  return (
    <div className="space-y-12 animate-fade-in pb-20">
      {/* Search & Filter Header */}
      <section className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-black text-[var(--text-main)]">{t('explore.title')}</h1>
          <p className="text-[var(--text-muted)] mt-2 font-medium">{t('explore.subtitle')}</p>
        </div>

        <div className="glass p-8 rounded-[32px] space-y-6">
          <div className="relative group max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[var(--text-muted)] group-focus-within:text-indigo-500 transition-colors">
              <Icons.Search size={20} />
            </div>
            <input 
              type="text" 
              placeholder={t('explore.search_placeholder')} 
              className="w-full bg-[var(--bg-input)] border border-[var(--border-glass)] rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all text-[var(--text-main)] placeholder:text-[var(--text-muted)] font-medium shadow-inner"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button 
              onClick={() => setSelectedCategory('Tous')}
              className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all border ${selectedCategory === 'Tous' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-[var(--bg-card)] border-[var(--border-glass)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'}`}
            >{t('explore.all_categories')}</button>
            {Object.values(Category).map((cat) => (
              <button 
                key={cat} onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all border ${selectedCategory === cat ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-[var(--bg-card)] border-[var(--border-glass)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'}`}
              >{cat}</button>
            ))}
          </div>

          <div className="flex flex-col md:flex-row justify-center items-center gap-6 mt-6 pt-6 border-t border-[var(--border-glass)]">
             <div className="flex flex-wrap gap-4">
                <select 
                   value={priceFilter} 
                   onChange={e => setPriceFilter(e.target.value as any)}
                   className="bg-[var(--bg-input)] border border-[var(--border-glass)] rounded-xl px-4 py-2.5 text-xs font-bold text-[var(--text-muted)] outline-none cursor-pointer hover:border-indigo-500/50 transition-colors focus:ring-2 focus:ring-indigo-500/20"
                >
                   <option value="Tous">{t('explore.filters.price_all')}</option>
                   <option value="Gratuit">{t('explore.filters.price_free')}</option>
                   <option value="Premium">{t('explore.filters.price_premium')}</option>
                </select>

                <select 
                   value={dateFilter} 
                   onChange={e => setDateFilter(e.target.value as any)}
                   className="bg-[var(--bg-input)] border border-[var(--border-glass)] rounded-xl px-4 py-2.5 text-xs font-bold text-[var(--text-muted)] outline-none cursor-pointer hover:border-indigo-500/50 transition-colors focus:ring-2 focus:ring-indigo-500/20"
                >
                   <option value="Toutes">{t('explore.filters.date_all')}</option>
                   <option value="Ce mois">{t('explore.filters.date_month')}</option>
                   <option value="Plus tard">{t('explore.filters.date_later')}</option>
                </select>
             </div>

             <div className="flex bg-[var(--bg-input)] border border-[var(--border-glass)] rounded-xl p-1 gap-1">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)]'}`}
                  title={t('explore.view_grid')}
                >
                  <Icons.Dashboard size={18} />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)]'}`}
                  title={t('explore.view_list')}
                >
                  <Icons.List size={18} />
                </button>
                <button 
                  onClick={() => setViewMode('map')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'map' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)]'}`}
                  title="Vue Carte"
                >
                  <Icons.Map size={18} />
                </button>
             </div>
          </div>
        </div>
      </section>

      {/* Results Grid */}
      <section>
        <div className="flex items-center justify-center gap-6 mb-12">
          <div className="h-px flex-1 bg-gradient-to-l from-[var(--border-glass)] to-transparent"></div>
          <h2 className="text-xl font-bold text-[var(--text-main)] shrink-0">
            {filteredEvents.length === 1 ? t('explore.result_found', { count: 1 }) : t('explore.results_found', { count: filteredEvents.length })}
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-[var(--border-glass)] to-transparent"></div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="text-center py-32 glass rounded-[40px] border-dashed border-2 border-[var(--border-glass)]">
            <div className="flex justify-center mb-6 opacity-20">
               <Icons.Search size={64} />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-main)]">{t('explore.empty.title')}</h3>
            <p className="text-[var(--text-muted)] mt-2 max-w-sm mx-auto">{t('explore.empty.desc')}</p>
            <Button variant="ghost" className="mt-8 text-indigo-400 font-bold" onClick={() => { setSearchQuery(''); setSelectedCategory('Tous'); }}>
              {t('explore.empty.reset')}
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event, i) => (
              <div key={event.id} className="animate-slide-up" style={{animationDelay: `${i * 0.1}s`}}>
                <EventCard event={event} onClick={(e) => navigate(`/event/${e.id}`)} userCurrency={userCurrency} isFavorite={user?.favorites?.includes(event.id)} onToggleFavorite={onToggleFavorite} />
              </div>
            ))}
          </div>
        ) : viewMode === 'list' ? (
          <div className="flex flex-col gap-6">
            {filteredEvents.map((event, i) => (
              <div 
                key={event.id} 
                className="animate-slide-up glass border border-[var(--border-glass)] rounded-[32px] p-4 md:p-6 flex flex-col md:flex-row gap-6 md:gap-8 hover:border-indigo-500/30 transition-all cursor-pointer group shadow-xl" 
                onClick={() => navigate(`/event/${event.id}`)} 
                style={{animationDelay: `${i * 0.1}s`}}
              >
                <div className="w-full md:w-64 h-48 md:h-full rounded-[24px] overflow-hidden shrink-0 relative">
                  <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute top-3 left-3">
                     <Badge color="bg-[var(--bg-page)]/80 backdrop-blur-md text-[var(--text-main)] border-none shadow-lg">{event.category}</Badge>
                  </div>
                  {onToggleFavorite && (
                     <button 
                       onClick={(e) => { e.stopPropagation(); onToggleFavorite(event); }}
                       className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md border border-white/20 transition-all ${user?.favorites?.includes(event.id) ? 'bg-rose-500/80 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)]' : 'bg-black/30 hover:bg-black/50 text-white/70 hover:text-white'}`}
                     >
                       <Icons.Heart size={16} className={user?.favorites?.includes(event.id) ? 'fill-current' : ''} />
                     </button>
                  )}
                </div>
                <div className="flex-1 space-y-4 py-2 flex flex-col justify-center">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="text-2xl md:text-3xl font-black text-[var(--text-main)] group-hover:text-indigo-400 transition-colors leading-tight">{event.title}</h3>
                    <div className="bg-[var(--bg-input)] px-4 py-2 rounded-2xl border border-[var(--border-glass)] shrink-0 text-center">
                       <span className="block text-2xl font-black text-indigo-400">{event.tickets.length > 0 ? (Math.min(...event.tickets.map(t => t.price)) === 0 ? '0' : Math.min(...event.tickets.map(t => t.price))) : '-'}</span>
                       <span className="block text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest">{event.tickets.length > 0 && Math.min(...event.tickets.map(t => t.price)) === 0 ? t('explore.free') : t('explore.currency')}</span>
                    </div>
                  </div>
                  <p className="text-sm md:text-base text-[var(--text-muted)] line-clamp-2 md:line-clamp-3 leading-relaxed font-medium">{event.description}</p>
                  <div className="flex flex-wrap items-center gap-6 pt-4 text-sm font-bold text-[var(--text-muted)]">
                    <span className="flex items-center gap-2 bg-[var(--bg-input)] px-3 py-1.5 rounded-lg border border-[var(--border-glass)]"><Icons.MapPin size={16} className="text-amber-400" /> {event.location}</span>
                    <span className="flex items-center gap-2 bg-[var(--bg-input)] px-3 py-1.5 rounded-lg border border-[var(--border-glass)]"><Icons.Calendar size={16} className="text-indigo-400" /> {new Date(event.date).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-[600px] w-full rounded-[40px] overflow-hidden border border-[var(--border-glass)] shadow-2xl relative z-0">
             <MapContainer 
                center={[4.05, 9.7]} 
                zoom={12} 
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
             >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {filteredEvents.map(event => (
                  event.latitude !== undefined && event.latitude !== null && event.longitude !== undefined && event.longitude !== null && (
                    <Marker key={event.id} position={[event.latitude, event.longitude]}>
                      <Popup>
                        <div className="p-2 space-y-2 min-w-[200px]">
                           <img src={event.image} alt={event.title} className="w-full h-24 object-cover rounded-xl" />
                           <h4 className="font-bold text-sm">{event.title}</h4>
                           <p className="text-[10px] text-gray-500">{event.location}</p>
                           <Button 
                              variant="primary" 
                              className="w-full h-8 text-[10px] uppercase font-black"
                              onClick={() => navigate(`/event/${event.id}`)}
                           >
                             Voir Détails
                           </Button>
                        </div>
                      </Popup>
                    </Marker>
                  )
                ))}
             </MapContainer>
          </div>
        )}
      </section>
    </div>
  );
};
