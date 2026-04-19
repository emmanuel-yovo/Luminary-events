import React, { useState, useEffect } from 'react';
import { Button } from '../components/UI';
import { Icons } from '../components/Icons';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface AdminProps {
  user: any;
  apiBase: string;
}

export const Admin: React.FC<AdminProps> = ({ user, apiBase }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'events' | 'requests' | 'audit'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [promotionRequests, setPromotionRequests] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditFilter, setAuditFilter] = useState('all');

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'overview') {
        const res = await fetch(`${apiBase}/api/admin/stats`, { credentials: 'include' });
        if(res.ok) setStats(await res.json());
      } else if (activeTab === 'users') {
        const res = await fetch(`${apiBase}/api/admin/users`, { credentials: 'include' });
        if(res.ok) setUsers(await res.json());
      } else if (activeTab === 'events') {
        const res = await fetch(`${apiBase}/api/events`);
        if(res.ok) setEvents(await res.json());
      } else if (activeTab === 'requests') {
        const res = await fetch(`${apiBase}/api/promotions/all`, { credentials: 'include' });
        if(res.ok) setPromotionRequests(await res.json());
      } else if (activeTab === 'audit') {
        const res = await fetch(`${apiBase}/api/admin/audit-logs`, { credentials: 'include' });
        if(res.ok) setAuditLogs(await res.json());
      }
    } catch (e) {
      toast.error(t('admin.alerts.conn_error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm(t('admin.alerts.ban_confirm'))) return;
    try {
      const res = await fetch(`${apiBase}/api/admin/users/${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) {
        toast.success(t('admin.alerts.banned'));
        fetchAdminData();
      } else {
        toast.error((await res.json()).error);
      }
    } catch { toast.error("Erreur !"); }
  };

  const handleUpdateRole = async (id: string, role: string) => {
    try {
      const res = await fetch(`${apiBase}/api/admin/users/${id}/role`, { 
        method: 'PUT', 
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      if (res.ok) {
        toast.success(t('admin.alerts.role_updated', { role }));
        fetchAdminData();
      } else {
        toast.error((await res.json()).error);
      }
    } catch { toast.error(t('admin.alerts.error')); }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm(t('admin.alerts.delete_confirm'))) return;
    try {
      const res = await fetch(`${apiBase}/api/admin/events/${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) {
        toast.success(t('admin.alerts.deleted'));
        fetchAdminData();
      }
    } catch { toast.error(t('admin.alerts.error')); }
  };

  const handleApproveRequest = async (id: string) => {
    try {
      const res = await fetch(`${apiBase}/api/promotions/${id}/approve`, { method: 'PUT', credentials: 'include' });
      if (res.ok) {
        toast.success('Demande approuvée !');
        fetchAdminData();
      }
    } catch { toast.error(t('admin.alerts.error')); }
  };

  const handleRejectRequest = async (id: string) => {
    try {
      const res = await fetch(`${apiBase}/api/promotions/${id}/reject`, { method: 'PUT', credentials: 'include' });
      if (res.ok) {
        toast.success('Demande refusée.');
        fetchAdminData();
      }
    } catch { toast.error(t('admin.alerts.error')); }
  };

  const handleFeatureEvent = async (id: string) => {
    try {
      const res = await fetch(`${apiBase}/api/admin/events/${id}/feature`, { method: 'PUT', credentials: 'include' });
      if (res.ok) fetchAdminData();
    } catch { toast.error(t('admin.alerts.error')); }
  };

  if (user?.role !== 'admin') {
      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
              <Icons.ShieldAlert size={64} className="text-rose-500" />
              <h2 className="text-3xl font-black text-[var(--text-main)]">{t('admin.restricted_title')}</h2>
              <p className="text-[var(--text-muted)]">{t('admin.restricted_desc')}</p>
          </div>
      );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto mt-8">
      
      {/* Header Admin */}
      <div className="glass p-8 rounded-[40px] border-indigo-500/30 shadow-[0_0_50px_-10px_rgba(99,102,241,0.2)]">
        <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center ring-2 ring-indigo-500/50 shadow-inner">
                <Icons.Settings size={24} />
            </div>
             <div>
              <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">{t('admin.title')}</h1>
              <p className="text-[var(--text-muted)] font-bold text-sm">{t('admin.subtitle')}</p>
            </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-[var(--bg-card)] p-2 rounded-full border border-[var(--border-glass)] w-max max-w-full overflow-x-auto">
        {['overview', 'users', 'events', 'requests', 'audit'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all relative ${
              activeTab === tab ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            {tab === 'requests' ? 'Demandes' : tab === 'audit' ? 'Audit' : t(`admin.tabs.${tab}`)}
            {tab === 'requests' && promotionRequests.filter(r => r.status === 'pending').length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {promotionRequests.filter(r => r.status === 'pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading && <div className="flex justify-center p-12"><div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>}

      {/* OVERVIEW CONTENT */}
      {!isLoading && activeTab === 'overview' && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="glass p-6 rounded-[32px] border-[var(--border-glass)] text-center">
                <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">{t('admin.stats.users')}</p>
                <p className="text-4xl text-[var(--text-main)] font-black mt-2">{stats.totalUsers}</p>
            </div>
            <div className="glass p-6 rounded-[32px] border-[var(--border-glass)] text-center">
                <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">{t('admin.stats.events')}</p>
                <p className="text-4xl text-[var(--text-main)] font-black mt-2">{stats.totalEvents}</p>
            </div>
            <div className="glass p-6 rounded-[32px] border-[var(--border-glass)] text-center">
                <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">{t('admin.stats.tickets_sold')}</p>
                <p className="text-4xl text-[var(--text-main)] font-black mt-2">{stats.totalTicketsSold}</p>
            </div>
            <div className="glass p-6 rounded-[32px] border-indigo-500/20 text-center relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500 rounded-full blur-2xl opacity-20"></div>
                <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest relative">{t('admin.stats.revenue')}</p>
                <p className="text-4xl text-indigo-400 font-black mt-2 relative">{stats.totalRevenue.toLocaleString()}€</p>
            </div>
        </div>
      )}

      {/* USERS CONTENT */}
      {!isLoading && activeTab === 'users' && (
        <div className="space-y-6">
            {/* Search & Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                    <input 
                        type="text" 
                        placeholder={t('admin.users.search_placeholder', { defaultValue: 'Rechercher un nom ou un email...' })}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[var(--bg-card)] border border-[var(--border-glass)] rounded-2xl py-3 pl-12 pr-4 text-sm text-[var(--text-main)] focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                    />
                </div>
                <div className="flex gap-2">
                    {['all', 'attendee', 'organizer', 'admin'].map(role => (
                        <button 
                            key={role}
                            onClick={() => setRoleFilter(role)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                roleFilter === role ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-[var(--bg-card)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] border border-[var(--border-glass)]'
                            }`}
                        >
                            {role === 'all' ? t('admin.filter.all', { defaultValue: 'Tout' }) : role}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Users Table */}
                <div className={`glass rounded-[32px] border-[var(--border-glass)] overflow-hidden transition-all duration-500 ${selectedUser ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                    <table className="w-full text-left text-sm text-[var(--text-main)]">
                        <thead className="bg-[var(--bg-hover)] border-b border-[var(--border-glass)] text-xs uppercase font-black text-[var(--text-muted)]">
                            <tr>
                                <th className="px-6 py-4">{t('admin.table.user')}</th>
                                <th className="px-6 py-4">{t('admin.table.role')}</th>
                                <th className="px-6 py-4 text-right">{t('admin.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-glass)]">
                            {users
                                .filter(u => {
                                    const matchQuery = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
                                    const matchRole = roleFilter === 'all' || u.role === roleFilter;
                                    return matchQuery && matchRole;
                                })
                                .map(u => (
                                <tr 
                                    key={u.id} 
                                    onClick={() => setSelectedUser(selectedUser?.id === u.id ? null : u)}
                                    className={`group hover:bg-[var(--bg-hover)] transition-all cursor-pointer ${selectedUser?.id === u.id ? 'bg-indigo-500/10' : ''}`}
                                >
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-[var(--border-glass)] flex items-center justify-center font-black text-indigo-400">
                                                {u.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-black text-[var(--text-main)]">{u.name}</p>
                                                <p className="text-xs text-[var(--text-muted)]">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                                            u.role === 'admin' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 
                                            u.role === 'organizer' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                                            'bg-[var(--bg-input)] border border-[var(--border-glass)] text-[var(--text-muted)]'
                                        }`}>{u.role}</span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                            {u.role !== 'admin' && (
                                                <>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleUpdateRole(u.id, u.role === 'attendee' ? 'organizer' : 'attendee'); }} 
                                                        className="p-2 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-xl transition-all"
                                                        title={u.role === 'attendee' ? t('admin.actions.promote') : t('admin.actions.demote')}
                                                    >
                                                        <Icons.ShieldPlus size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteUser(u.id); }} 
                                                        className="p-2 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all"
                                                        title={t('admin.actions.ban')}
                                                    >
                                                        <Icons.UserX size={18} />
                                                    </button>
                                                </>
                                            )}
                                            <button className="p-2 text-[var(--text-muted)] hover:text-white rounded-xl transition-all">
                                                <Icons.ChevronRight size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Selected User Detail Drawer */}
                {selectedUser && (
                    <div className="glass p-8 rounded-[40px] border-indigo-500/30 animate-slide-in-right h-max sticky top-32">
                        <div className="flex justify-between items-start mb-6">
                             <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-black text-white shadow-xl">
                                {selectedUser.name.charAt(0)}
                             </div>
                             <button onClick={() => setSelectedUser(null)} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] rounded-full transition-all">
                                <Icons.X size={20} />
                             </button>
                        </div>
                        <h2 className="text-2xl font-black text-[var(--text-main)] mb-1">{selectedUser.name}</h2>
                        <p className="text-[var(--text-muted)] font-bold mb-6">{selectedUser.email}</p>

                        <div className="space-y-6">
                            <div className="p-4 rounded-3xl bg-[var(--bg-input)] border border-[var(--border-glass)]">
                                <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mb-2">{t('admin.users.tickets_info', { defaultValue: 'Billets possédés' })}</p>
                                <p className="text-2xl font-black text-indigo-400">{selectedUser.tickets?.length || 0}</p>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">{t('admin.users.details', { defaultValue: 'Détails du compte' })}</p>
                                <div className="flex justify-between items-center text-sm py-2 border-b border-[var(--border-glass)]">
                                    <span className="text-[var(--text-muted)]">{t('admin.table.role')}</span>
                                    <span className="font-bold text-[var(--text-main)] uppercase tracking-wider">{selectedUser.role}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm py-2 border-b border-[var(--border-glass)]">
                                    <span className="text-[var(--text-muted)]">ID</span>
                                    <span className="font-mono text-[10px] text-[var(--text-muted)]">{selectedUser.id}</span>
                                </div>
                            </div>

                            {selectedUser.role !== 'admin' && (
                                <div className="pt-4 flex gap-2">
                                    <Button variant="outline" className="flex-1 !py-3" onClick={() => handleUpdateRole(selectedUser.id, selectedUser.role === 'attendee' ? 'organizer' : 'attendee')}>
                                        {selectedUser.role === 'attendee' ? t('admin.actions.promote') : t('admin.actions.demote')}
                                    </Button>
                                    <button onClick={() => handleDeleteUser(selectedUser.id)} className="w-12 h-12 flex items-center justify-center bg-rose-500/10 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all">
                                        <Icons.Trash2 size={20} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* EVENTS CONTENT */}
      {!isLoading && activeTab === 'events' && (
        <div className="space-y-6">
            {/* Search & Category Filter */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                    <input 
                        type="text" 
                        placeholder={t('admin.events.search_placeholder', { defaultValue: 'Rechercher par titre ou organisateur...' })}
                        value={eventSearchQuery}
                        onChange={(e) => setEventSearchQuery(e.target.value)}
                        className="w-full bg-[var(--bg-card)] border border-[var(--border-glass)] rounded-2xl py-3 pl-12 pr-4 text-sm text-[var(--text-main)] focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto max-w-full pb-2 md:pb-0">
                    {['all', 'Conférence', 'Concert', 'Salon', 'Sport', 'Atelier'].map(cat => (
                        <button 
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                                categoryFilter === cat ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-[var(--bg-card)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] border border-[var(--border-glass)]'
                            }`}
                        >
                            {cat === 'all' ? t('explore.all_categories') : cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Events List */}
                <div className={`space-y-4 transition-all duration-500 ${selectedEvent ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                    {events
                        .filter(e => {
                            const matchQuery = e.title.toLowerCase().includes(eventSearchQuery.toLowerCase()) || e.organizer.toLowerCase().includes(eventSearchQuery.toLowerCase());
                            const matchCat = categoryFilter === 'all' || e.category === categoryFilter;
                            return matchQuery && matchCat;
                        })
                        .map((e) => {
                            const sold = e.tickets.reduce((sum: number, t: any) => sum + (Number(t.sold) || 0), 0);
                            const income = e.tickets.reduce((sum: number, t: any) => sum + ((Number(t.sold) || 0) * (Number(t.price) || 0)), 0);
                            const totalQty = e.tickets.reduce((sum: number, t: any) => sum + (Number(t.quantity) || 0), 0);
                            const fillRate = totalQty > 0 ? Math.round((sold / totalQty) * 100) : 0;

                            return (
                                <div 
                                    key={e.id} 
                                    onClick={() => setSelectedEvent(selectedEvent?.id === e.id ? null : e)}
                                    className={`glass p-4 rounded-3xl border transition-all cursor-pointer group ${
                                        selectedEvent?.id === e.id ? 'border-indigo-500 bg-indigo-500/5' : 'border-[var(--border-glass)] hover:bg-[var(--bg-hover)]'
                                    }`}
                                >
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 w-full md:w-auto">
                                            <div className="relative">
                                                <img src={e.image} alt={e.title} className="w-16 h-16 rounded-2xl object-cover shadow-lg" />
                                                {e.isFeatured && (
                                                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-white border-2 border-[var(--bg-card)]">
                                                        <Icons.Star size={12} className="fill-current" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-[var(--text-main)] group-hover:text-indigo-400 transition-colors">{e.title}</h3>
                                                <p className="text-xs text-[var(--text-muted)] font-bold">{e.organizer} • <span className="text-indigo-500/70">{e.category}</span></p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                                            <div className="text-right">
                                                <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">{t('admin.event_item.tickets')}</p>
                                                <p className="font-black text-[var(--text-main)]">{sold} <span className="text-[10px] text-[var(--text-muted)] font-bold">/ {totalQty}</span></p>
                                                <div className="w-20 h-1 bg-[var(--bg-hover)] rounded-full mt-1 overflow-hidden">
                                                    <div className="h-full bg-indigo-500" style={{ width: `${fillRate}%` }}></div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">{t('admin.event_item.income')}</p>
                                                <p className="font-black text-emerald-400">{income}€</p>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleFeatureEvent(e.id); }} 
                                                    className={`p-2 rounded-xl transition-all ${e.isFeatured ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-[var(--bg-input)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-glass)]'}`}
                                                    title={t('admin.actions.feature')}
                                                >
                                                    <Icons.Star size={18} className={e.isFeatured ? 'fill-current' : ''} />
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteEvent(e.id); }} 
                                                    className="p-2 text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-inner"
                                                    title={t('admin.actions.delete')}
                                                >
                                                    <Icons.Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    }
                </div>

                {/* Event Detail Drawer */}
                {selectedEvent && (
                    <div className="glass p-8 rounded-[40px] border-indigo-500/30 animate-slide-in-right h-max sticky top-32">
                        <div className="flex justify-between items-start mb-6">
                            <img src={selectedEvent.image} alt="" className="w-20 h-20 rounded-3xl object-cover shadow-2xl" />
                            <button onClick={() => setSelectedEvent(null)} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] rounded-full transition-all">
                                <Icons.X size={20} />
                            </button>
                        </div>
                        <h2 className="text-2xl font-black text-[var(--text-main)] mb-1">{selectedEvent.title}</h2>
                        <p className="text-sm text-indigo-400 font-bold mb-6">{selectedEvent.category} • {selectedEvent.date}</p>

                        <div className="space-y-6">
                            <div className="p-4 rounded-3xl bg-[var(--bg-input)] border border-[var(--border-glass)] space-y-4">
                                <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">{t('admin.events.ticket_breakdown', { defaultValue: 'Répartition des ventes' })}</p>
                                {selectedEvent.tickets.map((t: any) => {
                                    const tFill = t.quantity > 0 ? Math.round((t.sold / t.quantity) * 100) : 0;
                                    return (
                                        <div key={t.id} className="space-y-1">
                                            <div className="flex justify-between text-xs font-bold">
                                                <span className="text-[var(--text-main)]">{t.name}</span>
                                                <span className="text-[var(--text-muted)]">{t.sold} / {t.quantity}</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-black/20 rounded-full overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${tFill}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">{t('admin.users.details')}</p>
                                <div className="flex justify-between items-center text-sm py-2 border-b border-[var(--border-glass)]">
                                    <span className="text-[var(--text-muted)]">{t('admin.event_item.by')}</span>
                                    <span className="font-bold text-[var(--text-main)]">{selectedEvent.organizer}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm py-2 border-b border-[var(--border-glass)]">
                                    <span className="text-[var(--text-muted)]">{t('explore.location', { defaultValue: 'Lieu' })}</span>
                                    <span className="font-bold text-[var(--text-main)] text-right">
                                        {selectedEvent.location}
                                        {(selectedEvent.city || selectedEvent.country) && (
                                            <span className="block text-xs text-[var(--text-muted)] font-normal mt-1">
                                                {[selectedEvent.neighborhood, selectedEvent.city, selectedEvent.country].filter(Boolean).join(', ')}
                                            </span>
                                        )}
                                    </span>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-2">
                                <button 
                                    onClick={() => handleFeatureEvent(selectedEvent.id)} 
                                    className={`flex-1 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                                        selectedEvent.isFeatured ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-[var(--bg-input)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] border border-[var(--border-glass)]'
                                    }`}
                                >
                                    {selectedEvent.isFeatured ? t('admin.actions.unfeature', { defaultValue: 'Retirer des vedettes' }) : t('admin.actions.feature')}
                                </button>
                                <button onClick={() => handleDeleteEvent(selectedEvent.id)} className="w-12 h-12 flex items-center justify-center bg-rose-500/10 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all">
                                    <Icons.Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* PROMOTION REQUESTS CONTENT */}
      {!isLoading && activeTab === 'requests' && (
        <div className="space-y-4">
          {promotionRequests.length === 0 ? (
            <div className="glass p-12 rounded-3xl border-[var(--border-glass)] text-center">
              <Icons.ShieldPlus size={48} className="text-[var(--text-muted)] mx-auto mb-4 opacity-20" />
              <p className="text-[var(--text-muted)] font-bold">Aucune demande de promotion pour le moment.</p>
            </div>
          ) : (
            promotionRequests.map((req) => (
              <div key={req.id} className={`glass p-6 rounded-3xl border transition-all ${
                req.status === 'pending' ? 'border-amber-500/30' : req.status === 'approved' ? 'border-emerald-500/30' : 'border-rose-500/30'
              }`}>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black ${
                      req.status === 'pending' ? 'bg-amber-500/10 text-amber-400' : req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {req.userName?.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-black text-[var(--text-main)]">{req.userName}</h4>
                      <p className="text-xs text-[var(--text-muted)]">{req.userEmail}</p>
                      {req.message && <p className="text-sm text-[var(--text-muted)] mt-2 italic">"{req.message}"</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      req.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {req.status === 'pending' ? 'En attente' : req.status === 'approved' ? 'Approuvée' : 'Refusée'}
                    </span>
                    {req.status === 'pending' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleApproveRequest(req.id)}
                          className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl hover:bg-emerald-500 hover:text-white transition-all"
                          title="Approuver"
                        >
                          <Icons.Check size={18} />
                        </button>
                        <button 
                          onClick={() => handleRejectRequest(req.id)}
                          className="p-2.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
                          title="Refuser"
                        >
                          <Icons.X size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-[var(--text-muted)] mt-3 font-bold">Demandé le {new Date(req.requestDate).toLocaleDateString('fr-FR')}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* AUDIT LOGS CONTENT */}
      {!isLoading && activeTab === 'audit' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['all', 'event:create', 'event:update', 'event:delete', 'user:update_role', 'user:delete', 'promotion:approve', 'promotion:reject', 'ticket:purchase'].map(action => (
              <button
                key={action}
                onClick={() => setAuditFilter(action)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                  auditFilter === action ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-[var(--bg-card)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] border border-[var(--border-glass)]'
                }`}
              >
                {action === 'all' ? 'Tout' : action.replace(':', ' / ')}
              </button>
            ))}
          </div>

          {/* Logs List */}
          <div className="space-y-3">
            {auditLogs.length === 0 ? (
              <div className="glass p-12 rounded-3xl border-[var(--border-glass)] text-center">
                <Icons.List size={48} className="text-[var(--text-muted)] mx-auto mb-4 opacity-20" />
                <p className="text-[var(--text-muted)] font-bold">Aucun log d'audit pour le moment.</p>
              </div>
            ) : (
              auditLogs
                .filter(log => auditFilter === 'all' || log.action === auditFilter)
                .map((log: any) => {
                  const actionColors: Record<string, string> = {
                    'event:create': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                    'event:update': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                    'event:delete': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                    'event:feature_toggle': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                    'event:add_coorganizer': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                    'event:remove_coorganizer': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
                    'user:update_role': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                    'user:delete': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                    'promotion:request': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                    'promotion:approve': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                    'promotion:reject': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                    'ticket:purchase': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
                  };
                  const colorClass = actionColors[log.action] || 'bg-[var(--bg-input)] text-[var(--text-muted)] border-[var(--border-glass)]';

                  return (
                    <div key={log.id} className="glass p-4 rounded-2xl border-[var(--border-glass)] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black ${colorClass.split(' ').slice(0, 2).join(' ')}`}>
                          {log.userName?.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-[var(--text-main)] text-sm">{log.userName}</span>
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${colorClass}`}>
                              {log.action}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--text-muted)] mt-1">
                            {log.resourceType}: <span className="font-mono text-[10px]">{log.resourceId?.slice(0, 12)}...</span>
                            {log.details?.title && <span> — {log.details.title}</span>}
                            {log.details?.newRole && <span> → <span className="font-bold">{log.details.newRole}</span></span>}
                            {log.details?.promotedUser && <span> — {log.details.promotedUser}</span>}
                            {log.details?.coOrganizerName && <span> — {log.details.coOrganizerName}</span>}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] font-bold whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

    </div>
  );
};
