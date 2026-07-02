export function estimateCrackTimeSeconds(effectiveEntropy: number): number {
  if (effectiveEntropy <= 0) return 0;
  if (effectiveEntropy > 100) return Infinity;
  const combinations = Math.pow(2, effectiveEntropy);
  return combinations / 2 / 1e10;
}

export function formatCrackTime(seconds: number): string {
  if (seconds === Infinity) return 'centuries';
  if (seconds <= 0) return 'instant';

  if (seconds < 1) return 'instant';
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)} minutes`;
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)} hours`;
  if (seconds < 31536000) return `${(seconds / 86400).toFixed(1)} days`;
  if (seconds < 31536000000) return `${(seconds / 31536000).toFixed(1)} years`;

  return 'centuries';
}
