import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { Icons } from './Icons';
import { useNavigate } from 'react-router-dom';
import { Event } from '../types';

const API_BASE = 'http://localhost:3000';

export const OrganizerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<{stats: any[], chartData: any[], events: Event[]} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const res = await fetch(API_BASE + '/api/dashboard', { credentials: 'include' });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("Failed to load dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 p-6 animate-fade-in flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) {
    return <div className="p-6 text-[var(--text-muted)] text-center">Impossible de charger les statistiques.</div>;
  }

  // Associer les icônes aux statistiques reçues du backend
  const statIcons = [Icons.TrendingUp, Icons.Ticket, Icons.Activity, Icons.Coins];

  return (
    <div className="space-y-8 p-6 animate-fade-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {data.stats.map((stat, i) => {
          const Icon = statIcons[i];
          return (
          <div key={i} className="glass p-6 rounded-[32px] border-white/5 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 blur-2xl transition-opacity`}></div>
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{stat.label}</p>
              <div className={`p-2 rounded-xl bg-white/5 text-[var(--text-muted)] group-hover:text-white transition-colors`}>
                <Icon size={16} />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <h4 className="text-2xl font-black text-[var(--text-main)] leading-none">{stat.value}</h4>
              <span className={`text-[10px] font-bold ${stat.trend.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>{stat.trend}</span>
            </div>
          </div>
          );
        })}
      </div>

      {/* Main Chart */}
      <div className="glass p-8 rounded-[40px] border-white/5 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-black text-[var(--text-main)] uppercase tracking-widest">Performance Hebdomadaire</h3>
          <div className="flex gap-4">
             <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)]">
               <div className="w-2 h-2 rounded-full bg-indigo-500"></div> Ventes
             </div>
             <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)]">
               <div className="w-2 h-2 rounded-full bg-pink-500"></div> Participants
             </div>
          </div>
        </div>
        
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.chartData}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorAttendees" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: 'currentColor', fontSize: 10, fontWeight: 'bold', className: 'text-[var(--text-muted)]'}} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: 'currentColor', fontSize: 10, fontWeight: 'bold', className: 'text-[var(--text-muted)]'}} 
              />
              <Tooltip 
                contentStyle={{backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-glass)', color: 'var(--text-main)'}}
                itemStyle={{fontSize: '12px', fontWeight: 'bold'}}
              />
              <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              <Area type="monotone" dataKey="attendees" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorAttendees)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions / Event List */}
      <div className="glass p-8 rounded-[40px] border-white/5 space-y-8">
         <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-widest">Gestion de la Billetterie</h3>
            <div className="px-4 py-1.5 bg-indigo-500/10 rounded-full border border-indigo-500/20">
               <p className="text-[10px] font-black text-indigo-400 tracking-wider">MODALITÉ DE SCAN ACTIVE</p>
            </div>
         </div>

         <div className="grid grid-cols-1 gap-4">
            {data.events.length === 0 ? (
               <p className="text-center text-[var(--text-muted)] py-10">Aucun événement à gérer pour le moment.</p>
            ) : (
               data.events.map((event) => {
                  const totalSold = event.tickets.reduce((acc, t) => acc + (t.sold || 0), 0);
                  const totalCapacity = event.tickets.reduce((acc, t) => acc + (t.quantity || 0), 0);

                  return (
                     <div key={event.id} className="flex flex-col md:flex-row items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-indigo-500/30 transition-all group">
                        <div className="flex items-center gap-6 mb-4 md:mb-0">
                           <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-white/10 group-hover:border-indigo-500/50 transition-all">
                              <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                           </div>
                           <div className="space-y-1">
                              <h4 className="font-bold text-[var(--text-main)] group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{event.title}</h4>
                              <div className="flex items-center gap-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                 <span className="flex items-center gap-1.5"><Icons.Calendar size={12} className="text-indigo-500" /> {new Date(event.date).toLocaleDateString()}</span>
                                 <span className="flex items-center gap-1.5"><Icons.MapPin size={12} className="text-amber-500" /> {event.city}</span>
                              </div>
                           </div>
                        </div>

                        <div className="flex flex-col md:items-end gap-1 mb-4 md:mb-0 text-center md:text-right px-6 border-l border-white/5">
                           <p className="text-[10px] font-black text-[var(--text-muted)] tracking-widest">REMPLISSAGE</p>
                           <div className="flex items-center gap-2">
                              <p className="text-lg font-black text-[var(--text-main)]">{totalSold} / {totalCapacity}</p>
                              <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                 <div 
                                    className="h-full bg-indigo-500" 
                                    style={{ width: `${Math.min(100, (totalSold / totalCapacity) * 100)}%` }}
                                 ></div>
                              </div>
                           </div>
                        </div>

                        <button 
                           onClick={() => navigate(`/scanner/${event.id}`)}
                           className="flex items-center gap-3 px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                        >
                           <Icons.Camera size={16} />
                           Lancer le Scan
                        </button>
                     </div>
                  );
               })
            )}
         </div>
      </div>
    </div>
  );
};
