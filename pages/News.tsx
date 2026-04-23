import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Badge, Button } from '../components/UI';
import { Icons } from '../components/Icons';
import { Article, User } from '../types';

interface NewsProps {
  articles: Article[];
  user: User | null;
  onAddArticle: (article: Article) => void;
}

export const News: React.FC<NewsProps> = ({ articles, user }) => {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-12 animate-fade-in pb-20">
      <div className="text-center space-y-4">
        <div className="flex justify-center mb-2">
           <Icons.News size={48} className="text-indigo-400 opacity-20" />
        </div>
        <h1 className="text-5xl font-black text-[var(--text-main)] tracking-tight">{t('news.title')}</h1>
        <p className="text-[var(--text-muted)] font-medium text-lg">{t('news.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {articles.map((article, i) => (
          <Card key={article.id} className="group relative overflow-hidden flex flex-col md:flex-row h-full border-[var(--border-glass)] bg-[var(--bg-card)] hover:border-indigo-500/30 transition-all duration-500">
            <div className="md:w-1/3 relative h-64 md:h-auto overflow-hidden">
              <img 
                src={article.imageUrl} 
                alt={article.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100" 
              />
              <div className="absolute inset-0 bg-indigo-900/10 mix-blend-overlay"></div>
            </div>
            
            <div className="md:w-2/3 p-8 flex flex-col space-y-4 justify-between">
              <div className="space-y-4">
                <Badge color="bg-indigo-600/20 text-indigo-400 border-indigo-500/20">{t(article.category)}</Badge>
                <h2 className="text-2xl font-bold text-[var(--text-main)] group-hover:text-indigo-400 transition-colors leading-tight">
                  {t(article.title)}
                </h2>
                <p className="text-[var(--text-muted)] text-sm font-medium line-clamp-3 leading-relaxed">
                  {t(article.excerpt)}
                </p>
              </div>
              
              <div className="pt-6 border-t border-[var(--border-glass)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[var(--bg-input)] border border-[var(--border-glass)] flex items-center justify-center text-[10px] font-black text-indigo-400">
                    {article.author.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[var(--text-main)]">{article.author}</p>
                    <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{article.date}</p>
                  </div>
                </div>
                <button className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  {t('news.read_more')} <Icons.ArrowRight size={12} />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <section className="pt-20">
        <Card className="p-12 text-center glass relative overflow-hidden">
           <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
           <h3 className="text-2xl font-black text-[var(--text-main)] mb-4">{t('news.newsletter_title')}</h3>
           <p className="text-[var(--text-muted)] max-w-md mx-auto mb-8 font-medium italic">{t('news.newsletter_quote')}</p>
           <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
              <input type="email" placeholder={t('news.newsletter_placeholder')} className="flex-1 bg-[var(--bg-input)] border border-[var(--border-glass)] rounded-full px-6 py-3 text-[var(--text-main)] outline-none focus:border-indigo-500/50 transition-all" />
              <Button className="px-10">{t('news.subscribe')}</Button>
           </form>
        </Card>
      </section>
    </div>
  );
};
