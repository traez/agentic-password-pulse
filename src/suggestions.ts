import type { PoolResult } from './pools.ts';
import type { PatternResult } from './patterns.ts';

export interface Suggestion {
  message: string;
  met: boolean;
}

export function generateSuggestions(password: string, pools: PoolResult, patterns: PatternResult[]): Suggestion[] {
  const suggestions: Suggestion[] = [];

  suggestions.push({ message: 'Uses lowercase letters', met: pools.pools.lower });
  suggestions.push({ message: 'Uses uppercase letters', met: pools.pools.upper });
  suggestions.push({ message: 'Uses digits', met: pools.pools.digit });
  suggestions.push({ message: 'Uses symbols', met: pools.pools.symbol });
  suggestions.push({ message: '8+ characters long', met: password.length >= 8 });
  suggestions.push({ message: '16+ characters long', met: password.length >= 16 });

  const isWhitespaceOnly = password.length > 0 && password.trim().length === 0;
  suggestions.push({ message: 'Not whitespace-only', met: !isWhitespaceOnly });

  for (const pattern of patterns) {
    if (pattern.name === 'repeated') {
      suggestions.push({ message: pattern.detail, met: false });
    } else if (pattern.name === 'sequential') {
      suggestions.push({ message: 'Avoid sequential characters like "abc" or "321"', met: false });
    } else if (pattern.name === 'keyboard') {
      suggestions.push({ message: 'Avoid keyboard patterns like "qwerty"', met: false });
    } else if (pattern.name === 'dictionary') {
      suggestions.push({ message: pattern.detail, met: false });
    } else if (pattern.name === 'date') {
      suggestions.push({ message: 'Avoid predictable dates or years', met: false });
    } else if (pattern.name === 'l33t') {
      suggestions.push({ message: pattern.detail, met: false });
    }
  }

  const noPatterns = patterns.length === 0;
  const goodLength = password.length >= 12;
  const allPools = pools.pools.lower && pools.pools.upper && pools.pools.digit && pools.pools.symbol;
  if (password.length > 0 && noPatterns && goodLength && allPools) {
    suggestions.push({ message: 'This is a strong, unique password', met: true });
  }

  return suggestions;
}
