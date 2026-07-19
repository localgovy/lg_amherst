/**
 * Keyword Matching Tests
 * 
 * Unit tests for the FAQ chatbot keyword matching algorithm.
 * Tests keyword detection, best match selection, case insensitivity,
 * multiple keyword matching, and null return for no matches.
 */

import { answerFor } from '../utils/keywordMatch';
import { FAQItem } from '../data';

const mockFAQ: FAQItem[] = [
  {
    id: '1',
    keywords: ['hours', 'open', 'time'],
    answer: 'We are open 9-5 Monday through Friday.',
  },
  {
    id: '2',
    keywords: ['parking', 'park', 'lot'],
    answer: 'Free parking is available in the rear lot.',
  },
  {
    id: '3',
    keywords: ['trash', 'garbage', 'waste'],
    answer: 'Trash pickup is on Tuesdays and Fridays.',
  },
  {
    id: '4',
    keywords: ['dog', 'pet', 'animal'],
    answer: 'Pets must be leashed in public areas.',
  },
];

describe('answerFor', () => {
  it('returns matching answer for exact keyword', () => {
    const result = answerFor('hours', mockFAQ);
    expect(result).toBe('We are open 9-5 Monday through Friday.');
  });

  it('returns matching answer for keyword in sentence', () => {
    const result = answerFor('What are your hours?', mockFAQ);
    expect(result).toBe('We are open 9-5 Monday through Friday.');
  });

  it('handles case-insensitive matching', () => {
    const result = answerFor('PARKING', mockFAQ);
    expect(result).toBe('Free parking is available in the rear lot.');
  });

  it('returns null when no match found', () => {
    const result = answerFor('xyz123', mockFAQ);
    expect(result).toBeNull();
  });

  it('returns null for empty input', () => {
    const result = answerFor('', mockFAQ);
    expect(result).toBeNull();
  });

  it('returns null for whitespace-only input', () => {
    const result = answerFor('   ', mockFAQ);
    expect(result).toBeNull();
  });

  it('matches multiple keywords and returns best match', () => {
    const result = answerFor('Where can I park my car?', mockFAQ);
    expect(result).toBe('Free parking is available in the rear lot.');
  });

  it('handles partial word matches', () => {
    const result = answerFor('pets', mockFAQ);
    expect(result).toBe('Pets must be leashed in public areas.');
  });
});

