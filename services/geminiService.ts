import { GoogleGenAI } from "@google/genai";
import { Category } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });

export const generateEventDescription = async (
  title: string,
  category: Category,
  keywords: string
): Promise<string> => {
  try {
    const prompt = `
      Rédige une description attrayante et professionnelle pour un événement intitulé "${title}".
      Catégorie : ${category}.
      Mots-clés/Détails : ${keywords}.
      
      La description doit donner envie de s'inscrire, être structurée en 2-3 paragraphes courts, 
      et inclure une phrase d'accroche. Utilise un ton enthousiaste mais professionnel.
      Réponds uniquement avec le texte de la description.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
    });

    return response.text || "Impossible de générer la description pour le moment.";
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return "Une erreur est survenue lors de la génération de la description.";
  }
};

export const suggestPricing = async (
  title: string,
  category: string,
  location: string = "Paris"
): Promise<{ price: number; reason: string }> => {
  try {
    const prompt = `
      Suggère un prix de billet d'entrée (en Euros) pour l'événement suivant :
      Titre: ${title}
      Catégorie: ${category}
      Lieu: ${location}
      
      Donne un prix réaliste basé sur le marché actuel pour ce type d'événement.
      Réponds UNIQUEMENT au format JSON :
      {
        "price": 25,
        "reason": "Une courte explication de 15 mots max"
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    return JSON.parse(response.text || '{"price": 0, "reason": "Erreur"}');
  } catch (error) {
    return { price: 0, reason: "Impossible de suggérer un prix." };
  }
};

export const improveDescription = async (description: string): Promise<string> => {
  try {
    const prompt = `
      Améliore la description suivante pour un événement afin de la rendre plus captivante, professionnelle et structurée.
      Description actuelle : "${description}"
      
      Réponds uniquement avec le texte de la nouvelle description.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
    });

    return response.text || description;
  } catch (error) {
    return description;
  }
};

export const getEventAnswer = async (
  question: string,
  eventDescription: string
): Promise<string> => {
  try {
    const prompt = `
      Tu es un assistant virtuel pour un événement. Voici la description de l'événement :
      "${eventDescription}"
      
      Réponds à la question suivante de l'utilisateur en te basant UNIQUEMENT sur cette description.
      Si l'information n'est pas dans le texte, réponds que tu ne sais pas et suggère de contacter l'organisateur.
      
      Question: ${question}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt
    });

    return response.text || "Je n'ai pas pu trouver de réponse.";
  } catch (error) {
    return "Une erreur est survenue lors de la recherche de la réponse.";
  }
};

export const generateNewsArticle = async (topic: string): Promise<{ title: string; content: string }> => {
  try {
    const prompt = `
      Écris un court article d'actualité pour un blog événementiel sur le sujet : "${topic}".
      Format JSON attendu :
      {
        "title": "Un titre accrocheur",
        "content": "Le contenu de l'article (environ 150 mots)"
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });
    
    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return { title: "Erreur", content: "Impossible de générer l'article." };
  }
};

export const recommendEventsByMood = async (
  mood: string,
  eventsSummary: string
): Promise<{ text: string; recommendedIds: string[] }> => {
  try {
    const prompt = `
      Tu es un VIP Concierge spécialiste de l'événementiel de luxe.
      L'utilisateur exprime l'humeur ou l'envie suivante : "${mood}".
      
      Voici la liste au format texte des événements disponibles (ID + Titre + Catégorie + Description) :
      ${eventsSummary}
      
      Mission:
      1. Choisis les 1 ou 2 événements (en utilisant leur ID exact) qui correspondent parfaitement à cette humeur.
      2. Rédige un message (2 phrases max) très premium, poli, expliquant pourquoi cette sélection va illuminer sa journée.
      3. Réponds uniquement en format JSON avec cette structure et RIEN d'autre :
      {
        "text": "votre message...",
        "recommendedIds": ["id1", "id2"]
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    return JSON.parse(response.text || '{"text": "Erreur", "recommendedIds": []}');
  } catch (error) {
    return { text: "Oups, je n'ai pas pu analyser votre humeur pour le moment.", recommendedIds: [] };
  }
};