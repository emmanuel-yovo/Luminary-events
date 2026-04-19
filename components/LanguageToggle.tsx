import React from 'react';
import { useTranslation } from 'react-i18next';

export const LanguageToggle: React.FC = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(nextLang);
  };

  return (
    <button 
      onClick={toggleLanguage}
      className="px-3 py-1.5 rounded-full bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] border border-[var(--border-glass)] transition-all text-[10px] font-black tracking-widest text-indigo-400 uppercase flex items-center gap-2 group shadow-sm"
      title="Changer de langue"
    >
      <span className={i18n.language === 'fr' ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)] opacity-50'}>FR</span>
      <div className="w-px h-2 bg-[var(--border-glass)]"></div>
      <span className={i18n.language === 'en' ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)] opacity-50'}>EN</span>
    </button>
  );
};
