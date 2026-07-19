/**
 * Filter Utility Tests
 * 
 * Unit tests for the business filtering function.
 * Tests search query matching, category filtering, case insensitivity,
 * whitespace handling, and edge cases. Ensures filtering logic works correctly.
 */

import { filterBusinesses } from '../utils/filter';
import { Business } from '../data';

const mockBusinesses: Business[] = [
  {
    id: '1',
    name: 'Coffee Shop',
    category: 'Dining',
    description: 'Great coffee and pastries',
    phone: '555-0001',
    address: '123 Main St',
    website: 'https://www.coffeeshop.com/',
    rating: 4.5,
    reviewCount: 100,
  },
  {
    id: '2',
    name: 'Pizza Place',
    category: 'Dining',
    description: 'Best pizza in town',
    phone: '555-0002',
    address: '456 Oak Ave',
    website: 'https://www.pizzaplace.com/',
    rating: 4.0,
    reviewCount: 50,
  },
  {
    id: '3',
    name: 'Book Store',
    category: 'Shops',
    description: 'Books and magazines',
    phone: '555-0003',
    address: '789 Elm St',
    website: 'https://www.bookstore.com/',
    rating: 4.2,
    reviewCount: 75,
  },
  {
    id: '4',
    name: 'Auto Repair',
    category: 'Auto',
    description: 'Fast and reliable car service',
    phone: '555-0004',
    address: '321 Industrial Way',
    website: 'https://www.autorepair.com/',
    rating: 3.8,
    reviewCount: 25,
  },
];

describe('filterBusinesses', () => {
  it('returns all businesses when no filters applied', () => {
    const result = filterBusinesses('', 'All', mockBusinesses);
    expect(result).toHaveLength(4);
    expect(result).toEqual(mockBusinesses);
  });

  it('filters by category correctly', () => {
    const result = filterBusinesses('', 'Dining', mockBusinesses);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Coffee Shop');
    expect(result[1].name).toBe('Pizza Place');
  });

  it('filters by search query in name', () => {
    const result = filterBusinesses('coffee', 'All', mockBusinesses);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Coffee Shop');
  });

  it('filters by search query in description', () => {
    const result = filterBusinesses('books', 'All', mockBusinesses);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Book Store');
  });

  it('applies both category and query filters', () => {
    const result = filterBusinesses('pizza', 'Dining', mockBusinesses);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Pizza Place');
  });

  it('returns empty array when no matches found', () => {
    const result = filterBusinesses('xyz', 'All', mockBusinesses);
    expect(result).toHaveLength(0);
  });

  it('handles case-insensitive search', () => {
    const result = filterBusinesses('COFFEE', 'All', mockBusinesses);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Coffee Shop');
  });

  it('handles whitespace in query', () => {
    const result = filterBusinesses('  coffee  ', 'All', mockBusinesses);
    expect(result).toHaveLength(1);
  });
});

