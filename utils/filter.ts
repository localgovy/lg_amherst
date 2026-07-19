/**
 * Business Filtering Utility
 * 
 * Pure function that filters businesses based on search text and category.
 * Case-insensitive search across business name and description fields.
 * Returns all businesses if query is empty or category is 'All'.
 */

import { formatCategory } from './formatCategory';

interface Business {
  id: string;
  name: string;
  category: string;
  description: string;
  [key: string]: any;
}

/**
 * Filters businesses by search query and category
 * @param query - Search text to match against name and description
 * @param category - Formatted category display name to filter by, or 'All' for no category filter
 * @param items - Array of businesses to filter
 * @returns Filtered array of businesses
 */
export function filterBusinesses(
  query: string,
  category: string,
  items: Business[]
): Business[] {
  let filtered = items;

  // Filter by category if not 'All'
  if (category !== 'All') {
    // Compare formatted categories since the selected category is already formatted
    filtered = filtered.filter((item) => formatCategory(item.category) === category);
  }

  // Filter by search query
  const trimmedQuery = query.trim();
  if (trimmedQuery) {
    const lowerQuery = trimmedQuery.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.name.toLowerCase().includes(lowerQuery) ||
        item.description.toLowerCase().includes(lowerQuery)
    );
  }

  return filtered;
}

