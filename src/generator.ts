export interface GenOptions {
  length: number;
  lower: boolean;
  upper: boolean;
  digits: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
}

const AMBIGUOUS_CHARS = new Set('1lI0O');

const CHARS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?/~',
} as const;

function buildPool(options: GenOptions): string {
  let pool = '';
  if (options.lower) pool += CHARS.lower;
  if (options.upper) pool += CHARS.upper;
  if (options.digits) pool += CHARS.digits;
  if (options.symbols) pool += CHARS.symbols;

  if (options.excludeAmbiguous) {
    pool = [...pool].filter(c => !AMBIGUOUS_CHARS.has(c)).join('');
  }

  return pool;
}

function getRandomInt(max: number): number {
  const array = new Uint32Array(1);
  const maxValid = 0xffffffff - (0xffffffff % max);
  while (true) {
    crypto.getRandomValues(array);
    if (array[0] < maxValid) {
      return array[0] % max;
    }
  }
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = getRandomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function generatePassword(options: GenOptions): string {
  const pool = buildPool(options);
  if (pool.length === 0) return '';

  const activeClasses: (keyof typeof CHARS)[] = [];
  if (options.lower && CHARS.lower) activeClasses.push('lower');
  if (options.upper && CHARS.upper) activeClasses.push('upper');
  if (options.digits && CHARS.digits) activeClasses.push('digits');
  if (options.symbols && CHARS.symbols) activeClasses.push('symbols');

  const chars: string[] = [];

  for (const cls of activeClasses) {
    let classPool: string = CHARS[cls];
    if (options.excludeAmbiguous) {
      classPool = [...classPool].filter(c => !AMBIGUOUS_CHARS.has(c)).join('');
    }
    if (classPool.length > 0) {
      const idx = getRandomInt(classPool.length);
      chars.push(classPool[idx]);
    }
  }

  while (chars.length < options.length) {
    const idx = getRandomInt(pool.length);
    chars.push(pool[idx]);
  }

  return shuffle(chars).join('');
}
