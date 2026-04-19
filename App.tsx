import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { User, Event, Article, Category } from './types';
import { Button } from './components/UI';
import { Icons } from './components/Icons';
import { LanguageToggle } from './components/LanguageToggle';
import { useTranslation } from 'react-i18next';

// Pages
import { Home } from './pages/Home';
import { Explore } from './pages/Explore';
import { EventDetail } from './pages/EventDetail';
import { Profile } from './pages/Profile';
import { News } from './pages/News';
import { CreateEvent } from './pages/CreateEvent';
import { Login } from './pages/Login';
import { Admin } from './pages/Admin';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { CGU } from './pages/CGU';
import { Scanner } from './pages/Scanner';

let API_BASE = 'http://localhost:3000';
try {
  // @ts-ignore
  if (typeof __API_BASE__ !== 'undefined') {
    // @ts-ignore
    API_BASE = __API_BASE__;
  }
} catch (e) {}

export default function App() {
  return (
    <BrowserRouter>
      <div className="relative min-h-screen">
        <div className="mesh-gradient fixed inset-0 -z-10"></div>
        <AppContent />
      </div>
      <Toaster position="top-right" richColors theme="dark" />
    </BrowserRouter>
  );
}

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const { t } = useTranslation();
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'light') {
       root.classList.add('light');
       root.classList.remove('dark');
    } else {
       root.classList.add('dark');
       root.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const [news, setNews] = useState<Article[]>([
    {
      id: '1',
      title: 'Les 5 tendances événementielles à suivre',
      excerpt: 'Découvrez comment la technologie transforme l\'expérience des participants...',
      content: 'Full content here...',
      category: 'Conseils',
      imageUrl: 'https://picsum.photos/600/400?random=10',
      date: '12 Oct 2024',
      author: 'Sophie Martin'
    }
  ]);

  // --- API Calls ---

  useEffect(() => {
    fetch(API_BASE + '/auth/user', { credentials: 'include' })
      .then(r => r.json())
      .then(data => { if (data && !data.error) setUser(data); })
      .catch(() => {});

    fetch(API_BASE + '/api/events')
      .then(r => r.json())
      .then(data => setEvents(data))
      .catch(() => {});
  }, []);

  // Update Page Title
  useEffect(() => {
    const titles: Record<string, string> = {
      '/': 'Luminary | Moments Inoubliables',
      '/explore': 'Explorer | Luminary Events',
      '/create': 'Créer | Luminary Events',
      '/news': 'Infos | Luminary Events',
      '/profile': 'Mon Profil | Luminary',
      '/login': 'Connexion | Luminary'
    };
    document.title = titles[location.pathname] || 'Luminary Events';
    window.scrollTo(0, 0);
  }, [location]);

  const handleCreateEvent = async (eventData: any) => {
    try {
      const formData = new FormData();
      Object.keys(eventData).forEach(key => {
        if (key === 'tickets') {
          formData.append(key, JSON.stringify(eventData[key]));
        } else if (key === 'imageFile' && eventData[key]) {
          formData.append('image', eventData[key]);
        } else if (eventData[key] !== undefined) {
          formData.append(key, eventData[key]);
        }
      });

      const res = await fetch(API_BASE + '/api/events', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      if (res.ok) {
        toast.success("Événement publié ! ✨");
        // Re-fetch events to get the correct server paths for images
        fetch(API_BASE + '/api/events')
          .then(r => r.json())
          .then(data => setEvents(data))
          .catch(() => {});
        navigate('/explore');
      }
    } catch (e) { toast.error("Erreur réseau"); }
  };

  const handleBuyTicket = async (event: Event, ticketId: string) => {
    if (!user) { navigate('/login', { state: { from: location } }); return; }
    const promise = fetch(API_BASE + `/api/events/${event.id}/buy`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId })
    });
    
    toast.promise(promise, {
      loading: 'Achat en cours...',
      success: async (res) => {
        if (!res.ok) {
           const data = await res.json();
           throw new Error(data.error || 'Erreur lors de l\'achat');
        }
        // Update user tickets
        if (user) {
          const updatedUserRes = await fetch(API_BASE + '/auth/user', { credentials: 'include' });
          if (updatedUserRes.ok) setUser(await updatedUserRes.json());
        }
        return `Billet pour ${event.title} acheté avec succès ! 🎉`;
      },
      error: (err) => err.message
    });
  };

  const handleToggleFavorite = async (event: Event) => {
    if (!user) { navigate('/login', { state: { from: location } }); return; }
    
    // Optimistic UI update
    const isCurrentlyFavorite = user.favorites?.includes(event.id);
    const newFavorites = isCurrentlyFavorite 
      ? user.favorites?.filter(id => id !== event.id) 
      : [...(user.favorites || []), event.id];
      
    setUser({ ...user, favorites: newFavorites });
    
    try {
      const res = await fetch(API_BASE + `/api/events/${event.id}/favorite`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!res.ok) {
         // Revert on error
         setUser({ ...user });
         toast.error("Erreur lors de la sauvegarde du favori.");
      }
    } catch(e) {
       setUser({ ...user });
       toast.error("Service indisponible.");
    }
  };

  const handleRegister = async (form: any) => {
    const res = await fetch(API_BASE + '/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error);
      throw new Error(data.error);
    }
  };

  const handleLogin = async (form: any) => {
    const res = await fetch(API_BASE + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form)
    });
    if (res.ok) {
      const data = await res.json();
      setUser(data);
      toast.success(`Content de vous revoir, ${data.name} !`);
    } else { throw new Error("Invalide"); }
  };

  const handleLogout = async () => {
    await fetch(API_BASE + '/auth/logout', { credentials: 'include' });
    setUser(null);
    toast.info("À bientôt !");
    navigate('/');
  };

  const onShowLogin = () => navigate('/login', { state: { from: location } });

  return (
    <div className="relative">
      {/* Floating Modern Navigation */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-5xl">
        <div className="glass px-6 py-3 rounded-full flex justify-between items-center shadow-2xl">
          <Link to="/" className="text-2xl font-black text-[var(--text-main)] tracking-tighter transition-colors">
            Luminary
          </Link>
          
          <div className="hidden md:flex items-center gap-1 bg-[var(--bg-input)] p-1 rounded-full border border-[var(--border-glass)]">
            <NavLink to="/" className={({isActive}) => `px-4 py-2 rounded-full text-xs font-bold transition-all ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>{t('nav.home')}</NavLink>
            <NavLink to="/explore" className={({isActive}) => `px-4 py-2 rounded-full text-xs font-bold transition-all ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>{t('nav.explore')}</NavLink>
            <NavLink to="/news" className={({isActive}) => `px-4 py-2 rounded-full text-xs font-bold transition-all ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>{t('nav.news')}</NavLink>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <LanguageToggle />
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-[var(--bg-hover)] border border-[var(--border-glass)] transition-colors text-[var(--text-main)] shadow-sm"
              title="Changer le thème"
            >
              {theme === 'dark' ? <Icons.Sun size={20} /> : <Icons.Moon size={20} />}
            </button>
            
            {user?.role === 'admin' && (
               <button 
                  onClick={() => navigate('/admin')}
                  className="p-2 ml-2 rounded-full bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white transition-colors"
                  title="Administration"
               >
                 <Icons.Settings size={20} />
               </button>
            )}

            {user ? (
              <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/profile')}>
                <div className="text-right hidden lg:block">
                  <p className="text-xs font-bold text-[var(--text-main)] group-hover:text-indigo-400 transition-colors">{user.name}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-sm ring-2 ring-[var(--border-glass)] group-hover:ring-indigo-500/50 transition-all text-white">
                  {user.name.charAt(0)}
                </div>
              </div>
            ) : (
              <Button variant="outline" onClick={onShowLogin} className="text-xs px-5 py-2">Connexion</Button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="pt-32 min-h-screen px-4 pb-24 md:pb-12">
        <Routes>
          <Route path="/" element={<Home events={events} user={user} onShowLogin={onShowLogin} userCurrency={user?.currency} onToggleFavorite={handleToggleFavorite} />} />
          <Route path="/explore" element={<Explore events={events} user={user} userCurrency={user?.currency} onToggleFavorite={handleToggleFavorite} onShowLogin={onShowLogin} />} />
          <Route path="/event/:id" element={<EventDetail events={events} onBuyTicket={handleBuyTicket} user={user} onShowLogin={onShowLogin} userCurrency={user?.currency} onToggleFavorite={handleToggleFavorite} />} />
          <Route path="/create" element={<CreateEvent user={user} onSubmit={handleCreateEvent} onShowLogin={onShowLogin} />} />
          <Route path="/news" element={<News articles={news} user={user} onAddArticle={(a) => setNews([a, ...news])} />} />
          <Route path="/scanner/:eventId" element={user && (user.role === 'organizer' || user.role === 'admin') ? <Scanner apiBase={API_BASE} /> : <Navigate to="/" />} />
          <Route path="/profile" element={user ? <Profile user={user} events={events} onLogout={handleLogout} onShowLogin={onShowLogin} onToggleFavorite={handleToggleFavorite} /> : <Navigate to="/" />} />
          <Route path="/login" element={<Login onLogin={handleLogin} onRegister={handleRegister} apiBase={API_BASE} />} />
          <Route path="/admin" element={<Admin user={user} apiBase={API_BASE} />} />
          <Route path="/forgot-password" element={<ForgotPassword apiBase={API_BASE} />} />
          <Route path="/reset-password" element={<ResetPassword apiBase={API_BASE} />} />
          <Route path="/cgu" element={<CGU />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="hidden md:block text-center pb-8 pt-4">
        <div className="flex items-center justify-center gap-6 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
          <Link to="/cgu" className="hover:text-indigo-400 transition-colors">Conditions Générales</Link>
          <span className="w-1 h-1 rounded-full bg-[var(--border-glass)]"></span>
          <span>© {new Date().getFullYear()} Luminary Events</span>
          <span className="w-1 h-1 rounded-full bg-[var(--border-glass)]"></span>
          <span>Tous droits réservés</span>
        </div>
      </footer>

      {/* Mobile Glass Bar */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] glass rounded-full flex justify-between items-center p-2 z-[100] shadow-2xl">
        <NavLink to="/" className={({isActive}) => `flex-1 flex flex-col items-center py-2 transition-all ${isActive ? 'text-indigo-400' : 'text-slate-400'}`}>
          <Icons.Home />
        </NavLink>
        <NavLink to="/explore" className={({isActive}) => `flex-1 flex flex-col items-center py-2 transition-all ${isActive ? 'text-indigo-400' : 'text-slate-400'}`}>
          <Icons.Explore />
        </NavLink>
        <div className="flex-1 flex justify-center -mt-8">
           <button onClick={() => { if (!user) onShowLogin(); else navigate('/create'); }} className="w-12 h-12 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center animate-pulse">
             <Icons.Create />
           </button>
        </div>
        <NavLink to="/news" className={({isActive}) => `flex-1 flex flex-col items-center py-2 transition-all ${isActive ? 'text-indigo-400' : 'text-slate-400'}`}>
          <Icons.News />
        </NavLink>
        <NavLink to="/profile" className={({isActive}) => `flex-1 flex flex-col items-center py-2 transition-all ${isActive ? 'text-indigo-400' : 'text-slate-400'}`}>
          <Icons.User />
        </NavLink>
      </div>
    </div>
  );
}