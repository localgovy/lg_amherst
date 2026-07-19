/**
 * Data Module
 * 
 * Central import/export point for static JSON data that is intentionally
 * NOT backed by Supabase (FAQ, polls, contacts, snow day score). News,
 * events, school announcements, and businesses are fetched live from
 * Supabase via services/supabase.ts instead.
 */

// Type definitions
export interface Business {
  id: string;
  name: string;
  category: string;
  description: string;
  phone: string;
  address: string;
  website: string | null;
  rating: number;
  reviewCount: number;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  description?: string;
  options: PollOption[];
}

export interface FAQItem {
  id: string;
  keywords: string[];
  answer: string;
}

export interface Contact {
  id: string;
  name: string;
  title: string;
  phone: string;
  email: string;
  department: string;
}

export interface SnowDayScore {
  weekOf: string;
  score: number;
  factors: {
    temperatureForecast: string;
    precipitationChance: string;
    windSpeed: string;
    roadConditions: string;
  };
  lastUpdated: string;
}

// Static data imports
import pollData from '../assets/data/poll.json';
import faqData from '../assets/data/faq.json';
import snowDayScoreData from '../assets/data/snowDayScore.json';
import contactsData from '../assets/data/contacts.json';

export const polls: Poll[] = pollData;
export const faq: FAQItem[] = faqData;
export const snowDayScore: SnowDayScore = snowDayScoreData;
export const contacts: Contact[] = contactsData;
