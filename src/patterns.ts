import { COMMON_PASSWORDS } from './wordlist.ts';

export interface PatternResult {
  name: string;
  penaltyBits: number;
  detail: string;
}

const KEYBOARD_ROWS = [
  'qwertyuiop',
  'asdfghjkl',
  'zxcvbnm',
];

function buildAdjacencyMap(): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const row of KEYBOARD_ROWS) {
    for (let i = 0; i < row.length; i++) {
      const neighbors: string[] = [];
      if (i > 0) neighbors.push(row[i - 1]);
      if (i < row.length - 1) neighbors.push(row[i + 1]);
      map.set(row[i], neighbors);
    }
  }
  return map;
}

const ADJACENCY = buildAdjacencyMap();

function detectRepeatedChars(password: string): PatternResult | null {
  let runLength = 1;
  let maxRun = 0;
  let runChar = '';

  for (let i = 1; i < password.length; i++) {
    if (password[i] === password[i - 1]) {
      runLength++;
      if (runLength > maxRun) {
        maxRun = runLength;
        runChar = password[i];
      }
    } else {
      runLength = 1;
    }
  }

  if (maxRun >= 3) {
    const penalty = (maxRun - 2) * 3;
    const detail = `Repeated character '${runChar}' appears ${maxRun} times`;
    return { name: 'repeated', penaltyBits: penalty, detail };
  }
  return null;
}

function detectSequentialChars(password: string): PatternResult | null {
  const lower = password.toLowerCase();
  let seqLength = 1;
  const sequences: { char: string; len: number }[] = [];

  for (let i = 1; i < lower.length; i++) {
    const prev = lower.charCodeAt(i - 1);
    const curr = lower.charCodeAt(i);
    if (curr === prev + 1 || curr === prev - 1) {
      seqLength++;
    } else {
      if (seqLength >= 3) {
        sequences.push({ char: lower[i - seqLength], len: seqLength });
      }
      seqLength = 1;
    }
  }
  if (seqLength >= 3) {
    sequences.push({ char: lower[lower.length - seqLength], len: seqLength });
  }

  if (sequences.length > 0) {
    const totalPenalty = sequences.length * 8;
    const seqDetails = sequences.map(s => `'${s.char.repeat(Math.min(s.len, 4))}...'`).join(', ');
    return { name: 'sequential', penaltyBits: totalPenalty, detail: `Sequential characters: ${seqDetails}` };
  }
  return null;
}

function detectKeyboardWalks(password: string): PatternResult | null {
  const lower = password.toLowerCase();
  let walkLength = 1;
  let walkCount = 0;

  for (let i = 1; i < lower.length; i++) {
    const prev = lower[i - 1];
    const curr = lower[i];
    const neighbors = ADJACENCY.get(prev);
    if (neighbors && neighbors.includes(curr)) {
      walkLength++;
    } else {
      if (walkLength >= 3) walkCount++;
      walkLength = 1;
    }
  }
  if (walkLength >= 3) walkCount++;

  if (walkCount > 0) {
    return {
      name: 'keyboard',
      penaltyBits: walkCount * 10,
      detail: `Keyboard pattern (${walkCount} sequence${walkCount > 1 ? 's' : ''})`,
    };
  }
  return null;
}

function detectDictionaryWords(password: string): PatternResult | null {
  const lower = password.toLowerCase();
  let longestMatch = '';
  let matchedWord = '';

  for (const word of COMMON_PASSWORDS) {
    const idx = lower.indexOf(word);
    if (idx !== -1 && word.length > longestMatch.length) {
      longestMatch = word;
      matchedWord = word;
    }
  }

  if (longestMatch.length >= 3) {
    const penalty = Math.max(20, longestMatch.length * 2);
    return {
      name: 'dictionary',
      penaltyBits: penalty,
      detail: `Contains common word '${matchedWord}'`,
    };
  }
  return null;
}

const YEAR_PATTERN = /\b(19\d\d|20\d\d)\b/;

function detectDatePatterns(password: string): PatternResult | null {
  if (YEAR_PATTERN.test(password)) {
    return {
      name: 'date',
      penaltyBits: 10,
      detail: 'Contains a year (e.g. 1990-2099)',
    };
  }
  const lower = password.toLowerCase();
  const months = ['january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december',
    'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  for (const month of months) {
    if (lower.includes(month)) return { name: 'date', penaltyBits: 10, detail: `Contains month name '${month}'` };
  }
  return null;
}

const L33T_MAP: Record<string, string> = {
  '4': 'a', '0': 'o', '3': 'e', '1': 'i', '$': 's',
  '@': 'a', '5': 's', '7': 't',
};

function normalizeL33t(password: string): string {
  let result = '';
  for (const char of password) {
    result += L33T_MAP[char] ?? char;
  }
  return result;
}

function detectL33tWords(password: string): PatternResult | null {
  const normalized = normalizeL33t(password);
  const lower = normalized.toLowerCase();

  let longestMatch = '';
  for (const word of COMMON_PASSWORDS) {
    if (lower.includes(word) && word.length > longestMatch.length) {
      longestMatch = word;
    }
  }

  if (longestMatch.length >= 3) {
    return {
      name: 'l33t',
      penaltyBits: 16,
      detail: `L33t variant of common word '${longestMatch}'`,
    };
  }
  return null;
}

export function detectPatterns(password: string): PatternResult[] {
  const results: PatternResult[] = [];

  const repeated = detectRepeatedChars(password);
  if (repeated) results.push(repeated);

  const sequential = detectSequentialChars(password);
  if (sequential) results.push(sequential);

  const keyboard = detectKeyboardWalks(password);
  if (keyboard) results.push(keyboard);

  const dictionary = detectDictionaryWords(password);
  if (dictionary) results.push(dictionary);

  const date = detectDatePatterns(password);
  if (date) results.push(date);

  const l33t = detectL33tWords(password);
  if (l33t) results.push(l33t);

  return results;
}
