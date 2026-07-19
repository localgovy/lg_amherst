/**
 * Keyword Matching Utility
 * 
 * Pure function that matches user input to FAQ entries using keyword scoring.
 * Finds FAQ entry with most keyword matches and returns its answer.
 * Returns null if no keywords match, triggering fallback response in chatbot.
 */

import { FAQItem } from '../data';

/**
 * Finds the best matching FAQ answer for a given input
 * @param input - User's question or search text
 * @param qa - Array of FAQ items with keywords and answers
 * @returns Matching answer or null if no match found
 */
export function answerFor(input: string, qa: FAQItem[]): string | null {
  if (!input.trim()) {
    return null;
  }

  const lowerInput = input.toLowerCase();
  // Normalize to a list of word tokens (punctuation stripped) so that
  // "hours?" matches the keyword "hours" and we can compare whole words.
  const words = lowerInput
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Score a single keyword against the input.
  //  - Multi-word phrases match on word boundaries and are weighted by
  //    length so specific phrases ("register my dog") beat generic single
  //    words ("register"). This avoids false substring hits like "gis"
  //    inside "reGISter".
  //  - Single words match when an input word equals the keyword, or starts
  //    with it (to cover simple plurals/inflections: pet -> pets).
  const scoreKeyword = (keyword: string): number => {
    const lowerKeyword = keyword.toLowerCase().trim();
    if (!lowerKeyword) return 0;

    if (lowerKeyword.includes(' ')) {
      const phraseWords = lowerKeyword.split(/\s+/);
      const pattern = new RegExp(`\\b${escapeRegExp(lowerKeyword)}\\b`);
      return pattern.test(lowerInput) ? 2 + phraseWords.length : 0;
    }

    for (const word of words) {
      if (word === lowerKeyword) return 2;
      if (
        lowerKeyword.length >= 3 &&
        word.length > lowerKeyword.length &&
        word.startsWith(lowerKeyword)
      ) {
        return 1;
      }
    }
    return 0;
  };

  // Find FAQ with the highest total keyword score.
  let bestMatch: FAQItem | null = null;
  let maxMatches = 0;

  for (const item of qa) {
    let matches = 0;
    for (const keyword of item.keywords) {
      matches += scoreKeyword(keyword);
    }

    if (matches > maxMatches) {
      maxMatches = matches;
      bestMatch = item;
    }
  }

  return maxMatches > 0 && bestMatch ? bestMatch.answer : null;
}

