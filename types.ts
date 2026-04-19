export enum Category {
  CONFERENCE = 'Conférence',
  CONCERT = 'Concert',
  SALON = 'Salon',
  MARIAGE = 'Mariage',
  SPORT = 'Sport',
  ATELIER = 'Atelier',
  AUTRE = 'Autre'
}

export interface TicketType {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sold: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  endDate?: string;
  location: string;
  country: string;
  city: string;
  neighborhood: string;
  latitude?: number;
  longitude?: number;
  image: string;
  category: Category;
  organizer: string;
  tickets: TicketType[];
  isFeatured?: boolean;
}

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  imageUrl: string;
  date: string;
  author: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role?: 'attendee' | 'organizer';
  currency?: string;
  favorites?: string[];
  tickets: { eventId: string; ticketTypeId: string; qrCode: string }[];
}

export type ViewState = 'HOME' | 'EXPLORE' | 'CREATE' | 'NEWS' | 'PROFILE' | 'EVENT_DETAIL';