/**
 * Supabase Service
 *
 * Live data layer for the Town of Amherst app. All fetch* functions below
 * query real Supabase tables: `amherst_news`, `amherst_events`,
 * `amherst_school`, and `amherst_business`.
 */

import { createClient } from '@supabase/supabase-js';

// Supabase project URL must NOT include a path (supabase-js appends /rest/v1 itself).
const SUPABASE_URL = 'https://ouxfpfhfqmjxvitmxwzj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91eGZwZmhmcW1qeHZpdG14d3pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzOTk3NTMsImV4cCI6MjA5OTk3NTc1M30.pWOKTQdah-tNNNXRSBwbz9-1gzbRvgQyYDQdbYSgw8g';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// News item type from database (extends the local type with created_at)
export interface NewsItemDB {
  id: string;
  title: string;
  date: string;
  summary: string;
  content: string;
  created_at: string;
}

// Event item type from database
export interface EventItemDB {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  address: string;
  category: string;
  description: string;
  organizer: string;
  created_at?: string;
}

// School announcement type from database
export interface SchoolAnnouncementDB {
  id: string;
  title: string;
  date: string;
  summary: string;
  board: string;
  school?: string | null;
  time?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Business type from database
export interface BusinessDB {
  id: string;
  name: string;
  category: string;
  description: string;
  phone: string;
  address: string;
  website?: string | null;
  rating: number | null;
  review_count: number | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Fetch all news articles from Supabase
 * Orders by date descending (newest first)
 */
export async function fetchNews(): Promise<NewsItemDB[]> {
  const { data, error } = await supabase
    .from('amherst_news')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching news from Supabase:', error);
    throw error;
  }
  return data || [];
}

/**
 * Fetch a single news article by ID
 */
export async function fetchNewsById(id: string): Promise<NewsItemDB | null> {
  const { data, error } = await supabase
    .from('amherst_news')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching news item from Supabase:', error);
    throw error;
  }
  return data;
}

/**
 * Fetch all events from Supabase
 * Orders by date ascending (earliest first)
 */
export async function fetchEvents(): Promise<EventItemDB[]> {
  const { data, error } = await supabase
    .from('amherst_events')
    .select('*')
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching events from Supabase:', error);
    throw error;
  }
  return data || [];
}

/**
 * Fetch a single event by ID
 */
export async function fetchEventById(id: string): Promise<EventItemDB | null> {
  const { data, error } = await supabase
    .from('amherst_events')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching event from Supabase:', error);
    throw error;
  }
  return data;
}

/**
 * Fetch all school announcements from Supabase
 * Orders by date ascending (chronological / soonest first), matching the
 * School tab's "Announcements" list which reads top-to-bottom in date order.
 */
export async function fetchSchoolAnnouncements(): Promise<SchoolAnnouncementDB[]> {
  const { data, error } = await supabase
    .from('amherst_school')
    .select('*')
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching school announcements from Supabase:', error);
    throw error;
  }
  return data || [];
}

/**
 * Fetch all businesses from Supabase
 * Orders by name ascending (alphabetical)
 */
export async function fetchBusinesses(): Promise<BusinessDB[]> {
  const { data, error } = await supabase
    .from('amherst_business')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching businesses from Supabase:', error);
    throw error;
  }
  return data || [];
}

/**
 * Fetch a single business by ID
 */
export async function fetchBusinessById(id: string): Promise<BusinessDB | null> {
  const { data, error } = await supabase
    .from('amherst_business')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching business from Supabase:', error);
    throw error;
  }
  return data;
}
