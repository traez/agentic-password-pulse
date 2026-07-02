import { detectPools } from './pools.ts';
import { detectPatterns } from './patterns.ts';

export function calculateRawEntropy(password: string): number {
  if (password.length === 0) return 0;
  const { R, L, isWhitespaceOnly } = detectPools(password);
  if (L === 0 || R === 0) return 0;
  if (isWhitespaceOnly) return 0;
  return L * Math.log2(R);
}

export function effectiveEntropy(password: string): number {
  const raw = calculateRawEntropy(password);
  if (raw === 0) return 0;
  const patterns = detectPatterns(password);
  const penalty = patterns.reduce((sum, p) => sum + p.penaltyBits, 0);
  return Math.max(0, raw - penalty);
}
