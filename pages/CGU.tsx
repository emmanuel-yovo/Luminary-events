import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '../components/UI';
import { Icons } from '../components/Icons';
import { useTranslation } from 'react-i18next';

export const CGU: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const sections = [
    {
      icon: <Icons.Shield size={24} className="text-indigo-400" />,
      title: "1. Objet de la plateforme",
      content: "Luminary Events est une plateforme de gestion d'événements permettant aux utilisateurs de découvrir, créer et participer à des événements. L'utilisation de nos services implique l'acceptation intégrale des présentes conditions."
    },
    {
      icon: <Icons.User size={24} className="text-emerald-400" />,
      title: "2. Inscription et Comptes",
      content: "L'inscription nécessite un nom, une adresse email valide et un mot de passe. Vos mots de passe sont chiffrés (bcrypt) et ne sont jamais stockés en clair. Vous êtes responsable de la confidentialité de vos identifiants."
    },
    {
      icon: <Icons.Settings size={24} className="text-amber-400" />,
      title: "3. Modération des Événements",
      content: "Tout événement soumis par un organisateur est soumis à validation par notre équipe de modération avant publication. Les contenus haineux, illégaux ou trompeurs seront rejetés sans préavis."
    },
    {
      icon: <Icons.Ticket size={24} className="text-pink-400" />,
      title: "4. Billetterie et Remboursements",
      content: "Les billets achetés sont nominatifs et non transférables. En cas d'annulation par l'organisateur, un remboursement intégral sera effectué sous 14 jours. Les demandes de remboursement volontaires sont acceptées jusqu'à 48h avant l'événement."
    },
    {
      icon: <Icons.Lock size={24} className="text-cyan-400" />,
      title: "5. Protection des Données (RGPD)",
      content: "Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles. Vous pouvez supprimer définitivement votre compte depuis votre profil. Nous ne partageons vos données avec aucun tiers."
    },
    {
      icon: <Icons.AlertTriangle size={24} className="text-rose-400" />,
      title: "6. Responsabilités",
      content: "Luminary Events agit en tant qu'intermédiaire technique. Nous ne sommes pas responsables du contenu des événements publiés par les organisateurs, ni des incidents survenant lors de ces événements."
    },
    {
      icon: <Icons.Calendar size={24} className="text-violet-400" />,
      title: "7. Propriété Intellectuelle",
      content: "L'ensemble des éléments visuels, textuels et techniques de la plateforme sont protégés par le droit d'auteur. Toute reproduction non autorisée est interdite."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in pb-24">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-block px-4 py-1.5 glass rounded-full mb-4">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Document Légal</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-[var(--text-main)] tracking-tighter">
          Conditions Générales<br /><span className="text-gradient">d'Utilisation</span>
        </h1>
        <p className="text-[var(--text-muted)] font-medium text-lg max-w-2xl mx-auto">
          Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
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
          <h3 className="text-2xl font-black text-[var(--text-main)] pt-4">Une question ?</h3>
          <p className="text-[var(--text-muted)] font-medium max-w-md mx-auto">
            Pour toute demande relative à vos données ou à ces conditions, contactez-nous à <span className="text-indigo-400 font-bold">support@luminary-events.com</span>
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <Button variant="outline" onClick={() => navigate(-1)}>Retour</Button>
            <Button onClick={() => navigate('/')}>Accueil</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
