export interface PoolResult {
  R: number;
  L: number;
  pools: {
    lower: boolean;
    upper: boolean;
    digit: boolean;
    symbol: boolean;
  };
  isWhitespaceOnly: boolean;
}

const POOL_CONFIG = {
  lower: { size: 26 },
  upper: { size: 26 },
  digit: { size: 10 },
  symbol: { size: 33 },
} as const;

export function detectPools(password: string): PoolResult {
  const pools = { lower: false, upper: false, digit: false, symbol: false };
  let L = 0;

  for (const char of password) {
    L++;
    const code = char.codePointAt(0)!;
    if (code >= 0x61 && code <= 0x7a) {
      pools.lower = true;
    } else if (code >= 0x41 && code <= 0x5a) {
      pools.upper = true;
    } else if (code >= 0x30 && code <= 0x39) {
      pools.digit = true;
    } else {
      pools.symbol = true;
    }
  }

  let R = 0;
  if (pools.lower) R += POOL_CONFIG.lower.size;
  if (pools.upper) R += POOL_CONFIG.upper.size;
  if (pools.digit) R += POOL_CONFIG.digit.size;
  if (pools.symbol) R += POOL_CONFIG.symbol.size;

  const isWhitespaceOnly = L > 0 && password.trim().length === 0;

  return { R, L, pools, isWhitespaceOnly };
}
