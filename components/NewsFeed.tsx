import React, { useState } from 'react';
import { Article } from '../types';
import { Card, Badge, Button, Input } from './UI';
import { generateNewsArticle } from '../services/geminiService';

interface NewsFeedProps {
  articles: Article[];
  onAddArticle: (article: Article) => void;
  isAdmin: boolean;
}

export const NewsFeed: React.FC<NewsFeedProps> = ({ articles, onAddArticle, isAdmin }) => {
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!topic) return;
    setIsGenerating(true);
    const { title, content } = await generateNewsArticle(topic);
    
    const newArticle: Article = {
      id: Date.now().toString(),
      title,
      content,
      excerpt: content.substring(0, 100) + '...',
      category: 'Actualité IA',
      date: new Date().toLocaleDateString(),
      author: 'Gemini AI',
      imageUrl: `https://picsum.photos/600/400?random=${Math.floor(Math.random() * 1000)}`
    };

    onAddArticle(newArticle);
    setTopic('');
    setIsGenerating(false);
  };

  return (
    <div className="space-y-8">
      {isAdmin && (
        <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
          <h3 className="text-lg font-bold text-indigo-900 mb-2">✨ Assistant de Rédaction IA</h3>
          <p className="text-sm text-indigo-700 mb-4">Entrez un sujet et laissez l'IA rédiger un article pour votre blog.</p>
          <div className="flex gap-4">
            <Input 
              placeholder="Ex: Les tendances événementielles 2025..." 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <Button onClick={handleGenerate} isLoading={isGenerating}>Générer</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {articles.map((article) => (
          <Card key={article.id} className="h-full flex flex-col group cursor-pointer">
            <div className="relative h-48 overflow-hidden">
              <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute top-4 left-4">
                <Badge color="bg-white/90 text-indigo-600 shadow-sm backdrop-blur-sm">{article.category}</Badge>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <div className="text-sm text-slate-500 mb-2 flex justify-between">
                <span>{article.date}</span>
                <span>{article.author}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-primary transition-colors">{article.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-1">{article.excerpt}</p>
              <span className="text-primary font-medium text-sm inline-flex items-center">
                Lire la suite 
                <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};