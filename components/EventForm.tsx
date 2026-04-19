import React, { useState } from 'react';
import { Button, Input } from './UI';
import { Icons } from './Icons';
import { suggestPricing, improveDescription } from '../services/geminiService';
import { toast } from 'sonner';

interface EventFormProps {
  onSubmit: (event: any) => Promise<void>;
}

export const EventForm: React.FC<EventFormProps> = ({ onSubmit }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    endDate: '',
    location: '',
    country: '',
    city: '',
    neighborhood: '',
    latitude: 0,
    longitude: 0,
    category: 'Concert',
    image: 'https://picsum.photos/800/600?random=1',
    tickets: [{ id: '1', name: 'Standard', price: 20, quantity: 100, sold: 0 }]
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImprovingDesc, setIsImprovingDesc] = useState(false);
  const [isSuggestingPrice, setIsSuggestingPrice] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>(form.image);

  const handleSuggestPricing = async () => {
    if (!form.title || !form.category) {
      toast.error("Veuillez saisir au moins un titre et une catégorie.");
      return;
    }
    setIsSuggestingPrice(true);
    try {
      const fullLocationString = [form.location, form.city, form.country].filter(Boolean).join(', ');
      const suggestion = await suggestPricing(form.title, form.category, fullLocationString);
      setForm({ ...form, tickets: [{ ...form.tickets[0], price: suggestion.price }] });
      toast.success(`Gemini suggère ${suggestion.price} XAF : ${suggestion.reason}`);
    } catch (e) {
      toast.error("Échec de la suggestion IA");
    } finally {
      setIsSuggestingPrice(false);
    }
  };

  const handleImproveDesc = async () => {
    if (!form.description) return;
    setIsImprovingDesc(true);
    try {
      const newDesc = await improveDescription(form.description);
      setForm({ ...form, description: newDesc });
      toast.success("Description optimisée par Gemini ✨");
    } catch (e) {
      toast.error("Échec de l'optimisation");
    } finally {
      setIsImprovingDesc(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGeolocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setForm({
            ...form,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          toast.success("Position détectée avec succès !");
        },
        (error) => {
          toast.error("Impossible d'obtenir la position.");
        }
      );
    } else {
      toast.error("La géolocalisation n'est pas supportée par votre navigateur.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validations (Policies #5, #6)
    const errors: string[] = [];

    if (form.title.length < 3) errors.push('Le titre doit contenir au moins 3 caractères.');
    if (form.description.length > 0 && form.description.length < 50) errors.push('La description doit contenir au moins 50 caractères.');
    if (!form.date) errors.push('La date est requise.');
    
    // Policy #6: Future date
    if (form.date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(form.date) < today) {
        errors.push('La date doit être dans le futur.');
      }
    }

    // Policy #5: End date after start date
    if (form.endDate && form.date && new Date(form.endDate) < new Date(form.date)) {
      errors.push('La date de fin doit être après la date de début.');
    }

    if (!form.location || form.location.length < 2) errors.push('Le lieu est requis.');
    if (!form.category) errors.push('La catégorie est requise.');

    if (errors.length > 0) {
      errors.forEach(err => toast.error(err));
      return;
    }

    setIsLoading(true);
    await onSubmit({ ...form, imageFile: selectedFile });
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-12">
      
      {/* SECTION 1: L'Essentiel */}
      <div className="glass p-8 md:p-12 rounded-[40px] border border-[var(--border-glass)] space-y-8 relative overflow-hidden shadow-2xl">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <span className="text-xl font-black text-indigo-400">1</span>
          </div>
          <h3 className="text-2xl font-black text-[var(--text-main)] tracking-tight">L'Essentiel</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-2">
            <Input 
              label="Titre de l'événement" 
              placeholder="Ex: Gala des Étoiles (min. 3 caractères)" 
              value={form.title} 
              onChange={e => setForm({...form, title: e.target.value})} 
              required 
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest px-2">Catégorie</label>
            <div className="relative group">
              <select 
                className="w-full bg-[var(--bg-card)] border border-[var(--border-glass)] rounded-2xl px-6 py-4 outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-[var(--text-main)] appearance-none cursor-pointer"
                value={form.category}
                onChange={e => setForm({...form, category: e.target.value})}
              >
                <option value="Concert">Concert</option>
                <option value="Conférence">Conférence</option>
                <option value="Salon">Salon</option>
                <option value="Mariage">Mariage</option>
                <option value="Sport">Sport</option>
                <option value="Atelier">Atelier</option>
                <option value="Festival">Festival</option>
                <option value="Autre">Autre</option>
              </select>
              <Icons.ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none group-focus-within:text-indigo-400 transition-colors" />
            </div>
          </div>
        </div>

        <div className="space-y-2 relative">
          <label className="block text-xs font-black text-[var(--text-muted)] uppercase tracking-widest px-2">Description <span className="text-rose-500 ml-1">*</span></label>
          <textarea 
            className="w-full h-48 bg-[var(--bg-card)] border border-[var(--border-glass)] rounded-3xl px-6 py-5 outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all text-[var(--text-main)] placeholder:text-[var(--text-muted)] font-medium resize-none leading-relaxed"
            placeholder="Décrivez ce qui rend votre événement unique... (minimum 50 caractères requis pour la validation)"
            value={form.description}
            onChange={e => setForm({...form, description: e.target.value})}
            required
          />
          <div className="absolute bottom-4 right-4 left-4 flex justify-between items-center bg-gradient-to-t from-[var(--bg-card)] to-transparent pt-4 px-2">
            <span className={`text-[#A0AEC0] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${form.description.length < 50 ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
              {form.description.length} / 50 min.
            </span>
            <Button 
                type="button" 
                variant="ghost" 
                onClick={handleImproveDesc} 
                disabled={isImprovingDesc || form.description.length < 10}
                className={`text-[10px] font-black tracking-widest uppercase flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${isImprovingDesc ? 'opacity-50' : 'text-indigo-400 hover:bg-indigo-500/10 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)]'}`}
            >
              {isImprovingDesc ? <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div> : <Icons.Wand size={14} />} 
              {isImprovingDesc ? 'Analyse...' : 'Optimiser via IA'}
            </Button>
          </div>
        </div>
      </div>

      {/* SECTION 2: Visuel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 glass p-8 rounded-[40px] border border-[var(--border-glass)] space-y-6 shadow-2xl flex flex-col justify-center text-center items-center">
          <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 mb-2">
            <Icons.Camera size={28} className="text-blue-400" />
          </div>
          <h3 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Le Visuel</h3>
          <p className="text-sm text-[var(--text-muted)] font-medium max-w-[250px] leading-relaxed">
            Une belle image attire <strong className="text-[var(--text-main)]">3x plus</strong> de participants.
          </p>
          
          <div className="w-full pt-4">
            <input type="file" id="image-upload" accept="image/*" onChange={handleFileChange} className="hidden" />
            <label htmlFor="image-upload" className="w-full block bg-[var(--bg-input)] border-2 border-dashed border-[var(--border-glass)] rounded-2xl py-6 cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group">
              <span className="text-xs font-black text-[var(--text-main)] uppercase tracking-widest group-hover:text-blue-400 transition-colors">Parcourir</span>
              <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase mt-2">JPG, PNG (Max 5Mo)</p>
            </label>
          </div>
        </div>
        
        <div className="lg:col-span-2 relative h-[350px] rounded-[40px] overflow-hidden border border-[var(--border-glass)] bg-[var(--bg-input)] shadow-2xl group flex flex-col items-center justify-center">
          {imagePreview ? (
            <>
              <img src={imagePreview} alt="Aperçu" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                <p className="text-white text-xs font-black uppercase tracking-[0.2em] px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">Aperçu du rendu public</p>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-6 opacity-40">
              <div className="w-24 h-24 rounded-full border border-dashed border-[var(--text-main)] flex items-center justify-center">
                <Icons.Sparkles size={32} className="text-[var(--text-main)] animate-pulse" />
              </div>
              <span className="text-xs text-[var(--text-main)] font-black uppercase tracking-[0.3em]">Aucun visuel sélectionné</span>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: Où & Quand */}
      <div className="glass p-8 md:p-12 rounded-[40px] border border-[var(--border-glass)] shadow-2xl relative overflow-hidden">
        <div className="absolute top-1/2 -left-32 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none -translate-y-1/2"></div>
        <div className="flex flex-col md:flex-row gap-12 relative z-10">
          
          <div className="flex-1 space-y-8 border-b md:border-b-0 md:border-r border-[var(--border-glass)] pb-10 md:pb-0 md:pr-12">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                 <Icons.Calendar size={24} className="text-orange-400" />
              </div>
              <h3 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Le Planning</h3>
            </div>
            
            <div className="space-y-6">
              <Input label="Date de début *" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} min={new Date().toISOString().split('T')[0]} required />
              <Input label="Date de fin (opt.)" type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} min={form.date || new Date().toISOString().split('T')[0]} />
            </div>
          </div>

          <div className="flex-[1.5] space-y-8">
            <div className="flex flex-wrap justify-between items-end gap-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <Icons.MapPin size={24} className="text-emerald-400" />
                </div>
                <h3 className="text-2xl font-black text-[var(--text-main)] tracking-tight">La Localisation</h3>
              </div>
              <Button type="button" variant="ghost" onClick={handleGeolocation} className="text-[10px] text-emerald-400 font-black uppercase tracking-widest flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 py-2">
                <Icons.MapPin size={14} /> Détecter
              </Button>
            </div>

            <div className="space-y-6">
              <Input label="Nom du lieu ou adresse exacte *" placeholder="Ex: Accor Arena, 8 Bd de Bercy" value={form.location} onChange={e => setForm({...form, location: e.target.value})} required />
              <div className="grid grid-cols-2 gap-4">
                 <Input label="Ville *" placeholder="Paris" value={form.city} onChange={e => setForm({...form, city: e.target.value})} required />
                 <Input label="Pays *" placeholder="France" value={form.country} onChange={e => setForm({...form, country: e.target.value})} required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Input label="Quartier (opt.)" placeholder="Ex: Bercy Village" value={form.neighborhood} onChange={e => setForm({...form, neighborhood: e.target.value})} />
                 <div className="grid grid-cols-2 gap-2">
                   <Input label="Lat." type="number" step="any" value={form.latitude} onChange={e => setForm({...form, latitude: parseFloat(e.target.value)})} />
                   <Input label="Long." type="number" step="any" value={form.longitude} onChange={e => setForm({...form, longitude: parseFloat(e.target.value)})} />
                 </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 4: Billetterie */}
      <div className="glass p-8 md:p-12 rounded-[40px] border border-[var(--border-glass)] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/5 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
              <Icons.Ticket size={24} className="text-rose-400" />
            </div>
            <h3 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Billetterie</h3>
          </div>
          
          <Button type="button" variant="ghost" onClick={handleSuggestPricing} disabled={isSuggestingPrice || !form.title} className={`text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 py-3 px-6 rounded-2xl border ${isSuggestingPrice ? 'border-transparent text-[var(--text-muted)]' : 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/50 hover:shadow-[0_0_20px_rgba(244,63,94,0.3)]'} transition-all`}>
            {isSuggestingPrice ? <div className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin"></div> : <Icons.Brain size={16} />} 
             {isSuggestingPrice ? 'Analyse du marché...' : 'Suggérer un prix adaptatif'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <Input 
            label="Prix Unitaire (XAF) *" 
            type="number" 
            min="0"
            value={form.tickets[0].price} 
            onChange={e => setForm({...form, tickets: [{...form.tickets[0], price: Math.max(0, Number(e.target.value))}]})} 
          />
          <Input 
            label="Capacité / Nombre de places *" 
            type="number" 
            min="1"
            value={form.tickets[0].quantity} 
            onChange={e => setForm({...form, tickets: [{...form.tickets[0], quantity: Math.max(1, Number(e.target.value))}]})} 
          />
        </div>
      </div>

      {/* SUBMIT */}
      <div className="pt-4 pb-10">
        <Button type="submit" isLoading={isLoading} className="w-full h-16 text-sm uppercase tracking-[0.3em] font-black shadow-2xl hover:shadow-indigo-500/25 transition-all rounded-[30px]">
          Confirmer et Publier
        </Button>
      </div>

    </form>
  );
};