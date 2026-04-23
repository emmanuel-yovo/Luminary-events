import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Input, Badge, Button } from '../components/UI';
import { EventCard } from '../components/EventCard';
import { Icons } from '../components/Icons';
import { Event as EventType, Category, User } from '../types';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { calculateDistance, formatDistance } from '../utils/geo';
import { toast } from 'sonner';

// Custom Marker Icons
const createUserIcon = () => L.divIcon({
  className: 'user-location-marker',
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const createEventIcon = (category: string) => {
  const colors: Record<string, string> = {
    [Category.CONCERT]: '#ec4899', // Pink
    [Category.CONFERENCE]: '#6366f1', // Indigo
    [Category.SPORT]: '#f59e0b', // Amber
    [Category.MARIAGE]: '#10b981', // Emerald
    [Category.ATELIER]: '#8b5cf6', // Violet
    'default': '#6366f1'
  };
  
  const color = colors[category] || colors.default;
  
  return L.divIcon({
    className: 'event-marker-modern',
    html: `
      <div class="event-pin" style="background-color: ${color}">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

// Map Controller for smooth flyTo and layout fixes
const MapController = ({ center }: { center: [number, number] | null }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.flyTo(center, 14, { animate: true, duration: 1.5 });
    }
  }, [center, map]);

  // Fix for partial rendering (invalidateSize)
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [map]);

  return null;
};

interface ExploreProps {
  events: EventType[];
  userCurrency?: string;
  user?: User | null;
  onShowLogin?: () => void;
  onToggleFavorite?: (event: EventType) => void;
  theme?: 'dark' | 'light';
}

export const Explore: React.FC<ExploreProps> = ({ events, userCurrency = 'XAF', user, onShowLogin, onToggleFavorite, theme = 'dark' }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'Tous'>((searchParams.get('category') as Category) || 'Tous');
  const [priceFilter, setPriceFilter] = useState<'Tous' | 'Gratuit' | 'Premium'>('Tous');
  const [dateFilter, setDateFilter] = useState<'Toutes' | 'Ce mois' | 'Plus tard'>('Toutes');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  
  // Geolocation State
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [sortByDistance, setSortByDistance] = useState(false);

  // Auto-locate user
  const handleLocate = () => {
    if (!navigator.geolocation) {
      toast.error("Géolocalisation non supportée par votre navigateur.");
      return;
    }
    
    toast.info("Localisation en cours...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(coords);
        setMapCenter(coords);
        toast.success("Position trouvée ! ✨");
      },
      () => {
        toast.error("Impossible d'accéder à votre position.");
      },
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    if (viewMode === 'map' && !userPos) {
      handleLocate();
    }
  }, [viewMode]);

  const filteredEvents = useMemo(() => {
    let result = events.filter((event) => {
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

    if (sortByDistance && userPos) {
      result = [...result].sort((a, b) => {
        if (!a.latitude || !a.longitude) return 1;
        if (!b.latitude || !b.longitude) return -1;
        const distA = calculateDistance(userPos[0], userPos[1], a.latitude, a.longitude);
        const distB = calculateDistance(userPos[0], userPos[1], b.latitude, b.longitude);
        return distA - distB;
      });
    }

    return result;
  }, [events, searchQuery, selectedCategory, priceFilter, dateFilter, sortByDistance, userPos]);

  return (
    <div className="space-y-12 animate-fade-in pb-20">
      {/* Search & Filter Header */}
      <section className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-black text-[var(--text-main)] tracking-tighter">{t('explore.title')}</h1>
          <p className="text-[var(--text-muted)] mt-2 font-medium">{t('explore.subtitle')}</p>
        </div>

        <div className="glass p-8 rounded-[40px] space-y-6">
          <div className="relative group max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-[var(--text-muted)] group-focus-within:text-indigo-500 transition-colors">
              <Icons.Search size={22} />
            </div>
            <input 
              type="text" 
              placeholder={t('explore.search_placeholder')} 
              className="w-full bg-[var(--bg-input)] border border-[var(--border-glass)] rounded-[24px] pl-14 pr-6 py-5 outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all text-[var(--text-main)] placeholder:text-[var(--text-muted)] font-bold shadow-inner text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button 
              onClick={() => setSelectedCategory('Tous')}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${selectedCategory === 'Tous' ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-500/20' : 'bg-[var(--bg-card)] border-[var(--border-glass)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'}`}
            >{t('explore.all_categories')}</button>
            {Object.values(Category).map((cat) => (
              <button 
                key={cat} onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${selectedCategory === cat ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-500/20' : 'bg-[var(--bg-card)] border-[var(--border-glass)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'}`}
              >{t(`categories.${cat}`)}</button>
            ))}
          </div>

          <div className="flex flex-col md:flex-row justify-center items-center gap-6 mt-6 pt-6 border-t border-[var(--border-glass)]">
             <div className="flex flex-wrap gap-4">
                <select 
                   value={priceFilter} 
                   onChange={e => setPriceFilter(e.target.value as any)}
                   className="bg-[var(--bg-input)] border border-[var(--border-glass)] rounded-2xl px-5 py-3 text-xs font-bold text-[var(--text-main)] outline-none cursor-pointer hover:border-indigo-500/50 transition-colors focus:ring-2 focus:ring-indigo-500/20 appearance-none"
                >
                   <option value="Tous">{t('explore.filters.price_all')}</option>
                   <option value="Gratuit">{t('explore.filters.price_free')}</option>
                   <option value="Premium">{t('explore.filters.price_premium')}</option>
                </select>

                <select 
                   value={dateFilter} 
                   onChange={e => setDateFilter(e.target.value as any)}
                   className="bg-[var(--bg-input)] border border-[var(--border-glass)] rounded-2xl px-5 py-3 text-xs font-bold text-[var(--text-main)] outline-none cursor-pointer hover:border-indigo-500/50 transition-colors focus:ring-2 focus:ring-indigo-500/20 appearance-none"
                >
                   <option value="Toutes">{t('explore.filters.date_all')}</option>
                   <option value="Ce mois">{t('explore.filters.date_month')}</option>
                   <option value="Plus tard">{t('explore.filters.date_later')}</option>
                </select>

                {userPos && (
                  <button 
                    onClick={() => setSortByDistance(!sortByDistance)}
                    className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all border flex items-center gap-2 ${sortByDistance ? 'bg-amber-500 border-amber-400 text-white shadow-lg' : 'bg-[var(--bg-input)] border-[var(--border-glass)] text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                  >
                    <Icons.Navigation size={14} />
                    {sortByDistance ? "Trié par proximité" : "Trier par distance"}
                  </button>
                )}
             </div>

             <div className="flex bg-[var(--bg-input)] border border-[var(--border-glass)] rounded-2xl p-1.5 gap-1.5">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)]'}`}
                  title={t('explore.view_grid')}
                >
                  <Icons.Dashboard size={20} />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)]'}`}
                  title={t('explore.view_list')}
                >
                  <Icons.List size={20} />
                </button>
                <button 
                  onClick={() => setViewMode('map')}
                  className={`p-2.5 rounded-xl transition-all ${viewMode === 'map' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)]'}`}
                  title="Vue Carte"
                >
                  <Icons.Map size={20} />
                </button>
             </div>
          </div>
        </div>
      </section>

      {/* Grid Header Info */}
      <div className="flex items-center justify-center gap-6 mb-12 px-4">
        <div className="h-px flex-1 bg-gradient-to-l from-[var(--border-glass)] to-transparent"></div>
        <h2 className="text-sm md:text-lg font-black text-[var(--text-main)] shrink-0 uppercase tracking-widest">
          {filteredEvents.length === 1 ? t('explore.result_found', { count: 1 }) : t('explore.results_found', { count: filteredEvents.length })}
        </h2>
        <div className="h-px flex-1 bg-gradient-to-r from-[var(--border-glass)] to-transparent"></div>
      </div>

      {/* Results Rendering */}
      <section className="px-4">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-32 glass rounded-[40px] border-dashed border-2 border-[var(--border-glass)]">
            <div className="flex justify-center mb-6 opacity-20">
               <Icons.Search size={64} />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-main)]">{t('explore.empty.title')}</h3>
            <p className="text-[var(--text-muted)] mt-2 max-w-sm mx-auto">{t('explore.empty.desc')}</p>
            <Button variant="ghost" className="mt-8 text-indigo-400 font-black uppercase text-sm tracking-widest" onClick={() => { setSearchQuery(''); setSelectedCategory('Tous'); setSortByDistance(false); }}>
              {t('explore.empty.reset')}
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event, i) => (
              <div key={event.id} className="animate-slide-up" style={{animationDelay: `${i * 0.1}s`}}>
                <EventCard event={event} onClick={(e) => navigate(`/event/${e.id}`)} userCurrency={userCurrency} isFavorite={user?.favorites?.includes(event.id)} onToggleFavorite={onToggleFavorite} />
                {userPos && event.latitude && event.longitude && (
                   <div className="mt-2 text-center">
                     <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                        📍 {formatDistance(calculateDistance(userPos[0], userPos[1], event.latitude, event.longitude))}
                     </span>
                   </div>
                )}
              </div>
            ))}
          </div>
        ) : viewMode === 'list' ? (
          <div className="flex flex-col gap-6 max-w-5xl mx-auto">
            {filteredEvents.map((event, i) => (
              <div 
                key={event.id} 
                className="animate-slide-up glass border border-[var(--border-glass)] rounded-[32px] p-4 md:p-6 flex flex-col md:flex-row gap-6 md:gap-8 hover:border-indigo-500/30 transition-all cursor-pointer group shadow-xl" 
                onClick={() => navigate(`/event/${event.id}`)} 
                style={{animationDelay: `${i * 0.1}s`}}
              >
                <div className="w-full md:w-64 h-48 md:h-56 rounded-[24px] overflow-hidden shrink-0 relative">
                  <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute top-4 left-4">
                     <Badge className="shadow-lg">{t(`categories.${event.category}`)}</Badge>
                  </div>
                  {onToggleFavorite && (
                     <button 
                       onClick={(e) => { e.stopPropagation(); onToggleFavorite(event); }}
                       className={`absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-md border border-white/20 transition-all ${user?.favorites?.includes(event.id) ? 'bg-rose-500/80 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)]' : 'bg-black/30 hover:bg-black/50 text-white/70 hover:text-white'}`}
                     >
                       <Icons.Heart size={18} className={user?.favorites?.includes(event.id) ? 'fill-current' : ''} />
                     </button>
                  )}
                </div>
                <div className="flex-1 space-y-4 py-2 flex flex-col justify-center">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <h3 className="text-2xl md:text-3xl font-black text-[var(--text-main)] group-hover:text-indigo-400 transition-colors leading-tight tracking-tight">{event.title}</h3>
                      {userPos && event.latitude && event.longitude && (
                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1">
                          <Icons.Navigation size={12} /> {formatDistance(calculateDistance(userPos[0], userPos[1], event.latitude, event.longitude))}
                        </p>
                      )}
                    </div>
                    <div className="bg-[var(--bg-input)] px-5 py-3 rounded-2xl border border-[var(--border-glass)] shrink-0 text-center shadow-inner">
                       <span className="block text-2xl font-black text-indigo-400">{event.tickets.length > 0 ? (Math.min(...event.tickets.map(t => t.price)) === 0 ? '0' : Math.min(...event.tickets.map(t => t.price))) : '-'}</span>
                       <span className="block text-[10px] text-[var(--text-muted)] uppercase font-black tracking-[0.2em]">{event.tickets.length > 0 && Math.min(...event.tickets.map(t => t.price)) === 0 ? t('explore.free') : t('explore.currency')}</span>
                    </div>
                  </div>
                  <p className="text-sm md:text-base text-[var(--text-muted)] line-clamp-2 md:line-clamp-3 leading-relaxed font-medium">{event.description}</p>
                  <div className="flex flex-wrap items-center gap-4 pt-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                    <span className="flex items-center gap-2 bg-[var(--bg-input)] px-4 py-2 rounded-xl border border-[var(--border-glass)]"><Icons.MapPin size={16} className="text-amber-400" /> {event.location}</span>
                    <span className="flex items-center gap-2 bg-[var(--bg-input)] px-4 py-2 rounded-xl border border-[var(--border-glass)]"><Icons.Calendar size={16} className="text-indigo-400" /> {new Date(event.date).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-[700px] w-full rounded-[48px] overflow-hidden border border-[var(--border-glass)] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] relative z-0 animate-fade-in group">
             <MapContainer 
                center={userPos || [4.05, 9.7]} 
                zoom={12} 
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
                zoomControl={false}
             >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url={theme === 'dark' 
                    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  }
                />
                <ZoomControl position="bottomright" />
                <MapController center={mapCenter} />
                
                {/* User Position */}
                {userPos && (
                  <Marker position={userPos} icon={createUserIcon()}>
                    <Popup>
                      <div className="p-3 text-center">
                        <p className="text-sm font-black text-indigo-400 uppercase tracking-widest">Vous êtes ici</p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Event Markers */}
                {filteredEvents.map(event => (
                  event.latitude !== undefined && event.latitude !== null && event.longitude !== undefined && event.longitude !== null && (
                    <Marker 
                      key={event.id} 
                      position={[event.latitude, event.longitude]}
                      icon={createEventIcon(event.category)}
                    >
                      <Popup closeButton={false}>
                        <div className="p-0 overflow-hidden rounded-3xl translate-z-0">
                           <div className="relative h-32">
                             <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                             <div className="absolute top-2 left-2">
                               <Badge className="text-[8px] py-0.5">{t(`categories.${event.category}`)}</Badge>
                             </div>
                           </div>
                           <div className="p-5 space-y-3">
                              <h4 className="font-black text-[var(--text-main)] text-base tracking-tight leading-tight">{event.title}</h4>
                              <div className="flex flex-col gap-1">
                                <p className="text-[10px] text-[var(--text-muted)] font-bold flex items-center gap-1.5 ">
                                  <Icons.MapPin size={12} className="text-amber-400" /> {event.location}
                                </p>
                                {userPos && (
                                  <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest">
                                    {formatDistance(calculateDistance(userPos[0], userPos[1], event.latitude, event.longitude))}
                                  </p>
                                )}
                              </div>
                              <Button 
                                  variant="primary" 
                                  className="w-full h-10 text-[10px] uppercase font-black tracking-widest rounded-xl shadow-lg shadow-indigo-500/20"
                                  onClick={() => navigate(`/event/${event.id}`)}
                              >
                                {t('admin.actions.details', { defaultValue: 'Voir Détails' })}
                              </Button>
                           </div>
                        </div>
                      </Popup>
                    </Marker>
                  )
                ))}
             </MapContainer>

             {/* Locate Me Floating Button */}
             <button 
                onClick={handleLocate}
                className="absolute top-6 right-6 z-[100] glass w-14 h-14 rounded-2xl flex items-center justify-center text-white hover:text-indigo-400 transition-all hover:scale-110 active:scale-95 group shadow-2xl"
                title="Ma position"
             >
               <Icons.Navigation size={24} className="group-hover:animate-pulse" />
             </button>

             {/* Map Stats Overlay */}
             <div className="absolute bottom-6 left-6 z-[100] glass px-6 py-4 rounded-3xl pointer-events-none hidden md:block">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Radar Luminary</p>
                <p className="text-sm font-bold text-white">
                  {filteredEvents.length} événements visibles
                </p>
                {userPos && (
                   <p className="text-[10px] font-medium text-[var(--text-muted)] mt-1">Centré sur votre localité</p>
                )}
             </div>
          </div>
        )}
      </section>
    </div>
  );
};
