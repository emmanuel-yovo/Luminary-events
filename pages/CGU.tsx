import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '../components/UI';
import { Icons } from '../components/Icons';
import { useTranslation } from 'react-i18next';

export const CGU: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const sections = [
    {
      icon: <Icons.Shield size={24} className="text-indigo-400" />,
      title: t('cgu.sections.s1.title'),
      content: t('cgu.sections.s1.content')
    },
    {
      icon: <Icons.User size={24} className="text-emerald-400" />,
      title: t('cgu.sections.s2.title'),
      content: t('cgu.sections.s2.content')
    },
    {
      icon: <Icons.Settings size={24} className="text-amber-400" />,
      title: t('cgu.sections.s3.title'),
      content: t('cgu.sections.s3.content')
    },
    {
      icon: <Icons.Ticket size={24} className="text-pink-400" />,
      title: t('cgu.sections.s4.title'),
      content: t('cgu.sections.s4.content')
    },
    {
      icon: <Icons.Lock size={24} className="text-cyan-400" />,
      title: t('cgu.sections.s5.title'),
      content: t('cgu.sections.s5.content')
    },
    {
      icon: <Icons.AlertTriangle size={24} className="text-rose-400" />,
      title: t('cgu.sections.s6.title'),
      content: t('cgu.sections.s6.content')
    },
    {
      icon: <Icons.Calendar size={24} className="text-violet-400" />,
      title: t('cgu.sections.s7.title'),
      content: t('cgu.sections.s7.content')
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in pb-24">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-block px-4 py-1.5 glass rounded-full mb-4">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">{t('cgu.legal_tag')}</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-[var(--text-main)] tracking-tighter">
          {t('cgu.title_1')}<br /><span className="text-gradient">{t('cgu.title_2')}</span>
        </h1>
        <p className="text-[var(--text-muted)] font-medium text-lg max-w-2xl mx-auto">
          {t('cgu.last_update')} : {new Date().toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {sections.map((section, i) => (
          <Card key={i} className="group">
            <div className="p-8 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[var(--bg-input)] border border-[var(--border-glass)] rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  {section.icon}
                </div>
                <h2 className="text-xl font-black text-[var(--text-main)]">{section.title}</h2>
              </div>
              <p className="text-[var(--text-muted)] leading-relaxed font-medium pl-16">
                {section.content}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Contact & Actions */}
      <Card className="overflow-visible">
        <div className="p-10 text-center space-y-6 relative">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Icons.Mail size={24} className="text-white" />
          </div>
          <h3 className="text-2xl font-black text-[var(--text-main)] pt-4">{t('cgu.question')}</h3>
          <p className="text-[var(--text-muted)] font-medium max-w-md mx-auto">
            {t('cgu.contact_desc')} <span className="text-indigo-400 font-bold">support@luminary-events.com</span>
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <Button variant="outline" onClick={() => navigate(-1)}>{t('cgu.buttons.back')}</Button>
            <Button onClick={() => navigate('/')}>{t('cgu.buttons.home')}</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
