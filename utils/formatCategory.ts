/**
 * Category Formatter Utility
 * 
 * Converts database category strings (snake_case) to professional display names.
 * Handles all business category types from the Supabase amherst_business table.
 */

// Mapping of database categories to professional display names
const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  // Handle both snake_case and exact matches from database
  'health_wellness': 'Health & Wellness',
  'Health & Wellness': 'Health & Wellness',
  'shopping_retail': 'Shopping & Retail',
  'Shopping & Retail': 'Shopping & Retail',
  'food_dining': 'Food & Dining',
  'Food & Dining': 'Food & Dining',
  'education_child_care': 'Education & Child Care',
  'Education & Child Care': 'Education & Child Care',
  'professional_services': 'Professional Services',
  'Professional Services': 'Professional Services',
  'automotive': 'Automotive',
  'Automotive': 'Automotive',
  'entertainment_arts': 'Entertainment & Arts',
  'Entertainment & Arts': 'Entertainment & Arts',
};

/**
 * Format a category string from database format to display format
 * @param category - The category string from the database (e.g., "food_dining" or "Food & Dining")
 * @returns Professional display name (e.g., "Food & Dining")
 */
export function formatCategory(category: string): string {
  // If the category is already in the display name format, return it as-is
  if (Object.values(CATEGORY_DISPLAY_NAMES).includes(category)) {
    return category;
  }
  
  // Otherwise, look it up in the mapping or format it
  return CATEGORY_DISPLAY_NAMES[category] || capitalizeWords(category.replace(/_/g, ' '));
}

/**
 * Capitalize first letter of each word
 * Fallback for categories not in the mapping
 */
function capitalizeWords(str: string): string {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Get all unique categories from a list of businesses
 * Returns formatted category names
 */
export function getUniqueCategories(businesses: Array<{ category: string }>): string[] {
  const categories = [...new Set(businesses.map(b => b.category))];
  return categories.map(formatCategory).sort();
}

/**
 * Get the original database category from a formatted display name
 * Used for filtering
 */
export function getCategoryKey(displayName: string): string | null {
  const entry = Object.entries(CATEGORY_DISPLAY_NAMES).find(
    ([_, value]) => value === displayName
  );
  return entry ? entry[0] : null;
}

