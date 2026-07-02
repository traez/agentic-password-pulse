import type { Suggestion } from './suggestions.ts';

export const STYLE_CONFIG = {
  thresholds: [
    { max: 28, label: 'Very Weak', level: 0 },
    { max: 35, label: 'Weak', level: 1 },
    { max: 59, label: 'Fair', level: 2 },
    { max: 79, label: 'Strong', level: 3 },
    { max: Infinity, label: 'Very Strong', level: 4 },
  ] as const,
  meterColors: [
    '#991b1b',
    '#dc2626',
    '#f59e0b',
    '#22c55e',
    '#a855f7',
  ],
  maxEntropyForMeter: 100,
} as const;

export function strengthTier(effectiveBits: number): { label: string; level: number } {
  if (effectiveBits <= 0) return { label: 'Empty', level: 0 };
  for (const t of STYLE_CONFIG.thresholds) {
    if (effectiveBits < t.max) return { label: t.label, level: t.level };
  }
  return { label: 'Very Strong', level: 4 };
}

export interface DOMRefs {
  passwordInput: HTMLInputElement;
  toggleBtn: HTMLButtonElement;
  meterFill: HTMLDivElement;
  meterLabels: HTMLDivElement;
  entropyDisplay: HTMLSpanElement;
  effectiveDisplay: HTMLSpanElement;
  crackTimeDisplay: HTMLSpanElement;
  tierDisplay: HTMLSpanElement;
  suggestionsList: HTMLUListElement;
  genLength: HTMLInputElement;
  genLower: HTMLInputElement;
  genUpper: HTMLInputElement;
  genDigits: HTMLInputElement;
  genSymbols: HTMLInputElement;
  genExcludeAmbiguous: HTMLInputElement;
  genButton: HTMLButtonElement;
  genOutput: HTMLInputElement;
  copyGenBtn: HTMLButtonElement;
  toastContainer: HTMLDivElement;
}

export function initUI(): DOMRefs {
  return {
    passwordInput: document.getElementById('password') as HTMLInputElement,
    toggleBtn: document.getElementById('toggle-visibility') as HTMLButtonElement,
    meterFill: document.querySelector('.meter-fill') as HTMLDivElement,
    meterLabels: document.querySelector('.meter-labels') as HTMLDivElement,
    entropyDisplay: document.getElementById('entropy-bits') as HTMLSpanElement,
    effectiveDisplay: document.getElementById('effective-bits') as HTMLSpanElement,
    crackTimeDisplay: document.getElementById('crack-time') as HTMLSpanElement,
    tierDisplay: document.getElementById('strength-tier') as HTMLSpanElement,
    suggestionsList: document.getElementById('suggestions') as HTMLUListElement,
    genLength: document.getElementById('gen-length') as HTMLInputElement,
    genLower: document.getElementById('gen-lower') as HTMLInputElement,
    genUpper: document.getElementById('gen-upper') as HTMLInputElement,
    genDigits: document.getElementById('gen-digits') as HTMLInputElement,
    genSymbols: document.getElementById('gen-symbols') as HTMLInputElement,
    genExcludeAmbiguous: document.getElementById('gen-exclude-ambiguous') as HTMLInputElement,
    genButton: document.getElementById('generate-btn') as HTMLButtonElement,
    genOutput: document.getElementById('gen-output') as HTMLInputElement,
    copyGenBtn: document.getElementById('copy-gen-btn') as HTMLButtonElement,
    toastContainer: document.getElementById('toast-container') as HTMLDivElement,
  };
}

export function renderMeter(ui: DOMRefs, effectiveBits: number): void {
  const pct = Math.min(100, (effectiveBits / STYLE_CONFIG.maxEntropyForMeter) * 100);
  ui.meterFill.style.width = `${pct}%`;
  const tier = strengthTier(effectiveBits);
  ui.meterFill.style.backgroundColor = STYLE_CONFIG.meterColors[tier.level];
  ui.meterFill.setAttribute('aria-valuenow', String(Math.round(pct)));
}

export function renderStats(ui: DOMRefs, rawBits: number, effectiveBits: number, crackLabel: string): void {
  const tier = strengthTier(effectiveBits);
  ui.entropyDisplay.textContent = rawBits.toFixed(1);
  ui.effectiveDisplay.textContent = effectiveBits.toFixed(1);
  ui.crackTimeDisplay.textContent = crackLabel;
  ui.tierDisplay.textContent = tier.label;
}

export function renderSuggestions(ui: DOMRefs, suggestions: Suggestion[]): void {
  ui.suggestionsList.innerHTML = '';
  for (const s of suggestions) {
    const li = document.createElement('li');
    li.className = `suggestion ${s.met ? 'met' : 'unmet'}`;
    const icon = document.createElement('span');
    icon.className = 'suggestion-icon';
    icon.textContent = s.met ? '✓' : '✗';
    const text = document.createElement('span');
    text.textContent = s.message;
    li.appendChild(icon);
    li.appendChild(text);
    ui.suggestionsList.appendChild(li);
  }
}

export function renderGeneratedPassword(ui: DOMRefs, pw: string): void {
  ui.genOutput.value = pw;
}

export function showToast(ui: DOMRefs, message: string, isError: boolean = false): void {
  const toast = document.createElement('div');
  toast.className = `toast ${isError ? 'toast-error' : 'toast-success'}`;
  toast.textContent = message;
  ui.toastContainer.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.add('toast-visible');
  });
  setTimeout(() => {
    toast.classList.remove('toast-visible');
    toast.classList.add('toast-hiding');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 2000);
}
