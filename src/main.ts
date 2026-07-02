import './style.css';
import { detectPools } from './pools.ts';
import { calculateRawEntropy, effectiveEntropy } from './entropy.ts';
import { detectPatterns } from './patterns.ts';
import { estimateCrackTimeSeconds, formatCrackTime } from './cracktime.ts';
import { generateSuggestions } from './suggestions.ts';
import { generatePassword } from './generator.ts';
import { copyToClipboard } from './clipboard.ts';
import { initUI, renderMeter, renderStats, renderSuggestions, renderGeneratedPassword, showToast, type DOMRefs } from './ui.ts';

function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return ((...args: unknown[]) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

function getGenOptions(ui: DOMRefs) {
  return {
    length: parseInt(ui.genLength.value, 10) || 20,
    lower: ui.genLower.checked,
    upper: ui.genUpper.checked,
    digits: ui.genDigits.checked,
    symbols: ui.genSymbols.checked,
    excludeAmbiguous: ui.genExcludeAmbiguous.checked,
  };
}

function analyzeAndRender(ui: DOMRefs, value: string): void {
  const pools = detectPools(value);
  const raw = calculateRawEntropy(value);
  const effective = effectiveEntropy(value);
  const crackSeconds = estimateCrackTimeSeconds(effective);
  const crackLabel = formatCrackTime(crackSeconds);
  const patterns = detectPatterns(value);
  const suggestions = generateSuggestions(value, pools, patterns);

  renderMeter(ui, effective);
  renderStats(ui, raw, effective, crackLabel);
  renderSuggestions(ui, suggestions);
}

function handleInput(ui: DOMRefs): void {
  const value = ui.passwordInput.value;
  analyzeAndRender(ui, value);
}

function handleGenerate(ui: DOMRefs): void {
  const options = getGenOptions(ui);
  if (!options.lower && !options.upper && !options.digits && !options.symbols) {
    showToast(ui, 'Select at least one character class', true);
    return;
  }
  const pw = generatePassword(options);
  renderGeneratedPassword(ui, pw);
}

async function handleCopyGen(ui: DOMRefs): Promise<void> {
  const text = ui.genOutput.value;
  if (!text) {
    showToast(ui, 'Nothing to copy', true);
    return;
  }
  const ok = await copyToClipboard(text);
  showToast(ui, ok ? 'Copied!' : 'Copy failed — grant clipboard permission');
}

function toggleVisibility(ui: DOMRefs): void {
  const isPassword = ui.passwordInput.type === 'password';
  ui.passwordInput.type = isPassword ? 'text' : 'password';
  const eyeIcon = ui.toggleBtn.querySelector('.eye-icon');
  const eyeOffIcon = ui.toggleBtn.querySelector('.eye-off-icon');
  if (eyeIcon && eyeOffIcon) {
    eyeIcon.classList.toggle('hidden', !isPassword);
    eyeOffIcon.classList.toggle('hidden', isPassword);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const ui = initUI();

  const debouncedInput = debounce(() => handleInput(ui), 30);
  ui.passwordInput.addEventListener('input', debouncedInput);

  ui.toggleBtn.addEventListener('click', () => toggleVisibility(ui));

  ui.genButton.addEventListener('click', () => handleGenerate(ui));

  ui.copyGenBtn.addEventListener('click', () => handleCopyGen(ui));

  const lengthDisplay = document.getElementById('gen-length-display') as HTMLSpanElement;
  ui.genLength.addEventListener('input', () => {
    lengthDisplay.textContent = ui.genLength.value;
  });

  analyzeAndRender(ui, '');
});

document.getElementById("footer").innerHTML =
  "\u00A9 " +
  new Date().getFullYear() +
  ' <a href="https://github.com/traez/agentic-password-pulse" target="_blank" rel="noopener noreferrer">Zeeofor Technologies</a> | An OpenCode Agentic AI production';