# Skill: Password Analysis

Guidance for implementing and modifying the password strength analysis engine in **agentic-password-pulse**. Read this before touching entropy math, crack-time estimation, pattern detection, or the password generator.

## Scope

This skill covers:
- Character pool detection
- Entropy calculation
- Crack-time estimation
- Pattern penalty detection (the part that makes this "deep" analysis, not just entropy)
- Suggestion generation
- Password generator logic

All of it is pure, synchronous, local TypeScript — no network calls, no dependencies, no `Math.random()` in security-sensitive paths (use `crypto.getRandomValues`).

## 1. Character Pool Detection

Pool size `R` is the sum of character classes actually present in the password, not the theoretical max:

```ts
const POOLS = {
  lowercase: { regex: /[a-z]/, size: 26 },
  uppercase: { regex: /[A-Z]/, size: 26 },
  digits:    { regex: /[0-9]/, size: 10 },
  symbols:   { regex: /[^a-zA-Z0-9]/, size: 33 },
};

function detectPoolSize(password: string): number {
  return Object.values(POOLS)
    .filter(({ regex }) => regex.test(password))
    .reduce((sum, { size }) => sum + size, 0);
}
```

An empty password has `R = 0`; guard against `log2(0)` by returning `0` entropy early.

## 2. Entropy Calculation

Per AGENTS.md: `E = log₂(R^L)`, which simplifies (and is numerically safer) as `L * log2(R)`:

```ts
function calculateEntropy(password: string): number {
  const L = password.length;
  const R = detectPoolSize(password);
  if (L === 0 || R === 0) return 0;
  return L * Math.log2(R);
}
```

Do not compute `Math.log2(Math.pow(R, L))` — `R^L` overflows to `Infinity` for long passwords before the log is taken.

### Effective entropy (post-penalty)

Raw entropy assumes uniform randomness. Repeated characters, dictionary words, and sequences reduce real-world entropy without shrinking the character pool. Apply penalties from Section 4 to get an **effective entropy** used for the strength meter, and keep raw entropy available for display as "theoretical max."

## 3. Crack-Time Estimation

Fixed assumption per AGENTS.md: **10 billion (1e10) guesses/second**, offline attack.

```ts
const GUESSES_PER_SECOND = 1e10;

function estimateCrackTimeSeconds(entropyBits: number): number {
  const combinations = Math.pow(2, entropyBits);
  // average case: attacker finds it halfway through the keyspace
  return combinations / 2 / GUESSES_PER_SECOND;
}
```

Use **effective entropy**, not raw entropy, as the input — otherwise a password like `Passwordddddddddd1!` reports a misleadingly high crack time.

### Human-readable formatting

Convert seconds to the largest sensible unit (seconds → minutes → hours → days → years → centuries), and cap display at something like `"centuries"` once past ~1e6 years to avoid absurd numbers:

```ts
function formatCrackTime(seconds: number): string {
  const units: [string, number][] = [
    ['second', 1], ['minute', 60], ['hour', 3600],
    ['day', 86400], ['year', 31_536_000],
  ];
  if (seconds < 1) return 'instantly';
  let result = `${seconds.toFixed(0)} seconds`;
  for (const [name, secs] of units) {
    if (seconds / secs >= 1) result = `${(seconds / secs).toFixed(1)} ${name}s`;
  }
  const years = seconds / 31_536_000;
  if (years > 1_000_000) return 'centuries';
  return result;
}
```

## 4. Pattern Penalty Detection

This is what separates the tool from a naive entropy calculator. Each detected pattern reduces effective entropy or flags the password as weak regardless of length. Penalties should be **additive deductions in bits**, applied to raw entropy before crack-time is computed, and floored at 0.

Checks to implement:

| Pattern | Detection approach | Penalty |
|---|---|---|
| Repeated characters (`aaaa`, `1111`) | run-length check, 3+ repeats | subtract bits proportional to repeated run length |
| Sequential characters (`abcd`, `1234`, `qwerty` row) | compare char codes / keyboard-adjacency map for ascending/descending runs of 3+ | flat penalty per sequence found |
| Common dictionary words | small embedded wordlist (top ~1000 common passwords/words), case-insensitive substring match | large flat penalty (this is the biggest single risk factor) |
| Keyboard walks (`qwerty`, `asdfgh`) | adjacency map of a QWERTY layout | flat penalty |
| Date-like patterns (`1990`, `01011999`) | regex for 4-digit years / date formats | moderate penalty |
| L33t substitutions of dictionary words (`p4ssw0rd`) | normalize common substitutions (`4→a`, `0→o`, `3→e`, `1→i`, `$→s`) then re-run dictionary check | same as dictionary penalty, slightly reduced |

```ts
interface PatternResult {
  name: string;
  penaltyBits: number;
  detail: string;
}

function detectPatterns(password: string): PatternResult[] {
  const results: PatternResult[] = [];
  // each check below pushes into results if triggered
  return results;
}

function effectiveEntropy(password: string): number {
  const raw = calculateEntropy(password);
  const penalty = detectPatterns(password)
    .reduce((sum, p) => sum + p.penaltyBits, 0);
  return Math.max(0, raw - penalty);
}
```

Keep the embedded common-password/wordlist small and inline (a `const` string array) — no external fetch, no bundled dictionary files that bloat the build. A few hundred entries covering the most common passwords is enough to be meaningful.

## 5. Strength Meter Mapping

Map `effectiveEntropy` to a discrete strength band for the animated meter. Suggested thresholds (tune visually, but keep monotonic and documented wherever they live in code):

- `< 28 bits` → Very Weak
- `28–35 bits` → Weak
- `36–59 bits` → Fair
- `60–79 bits` → Strong
- `≥ 80 bits` → Very Strong

The meter's animated fill percentage should be a smooth function of `effectiveEntropy` (e.g. clamped `entropy / 100`), not a step function, even though the label is discrete — this is what gives the "animated" feel referenced in AGENTS.md.

## 6. Live Suggestions

Suggestions are derived directly from which checks failed, not from a separate rules engine. For each `PatternResult` triggered, and for each missing character class from `detectPoolSize`, emit a specific, actionable string (e.g. "Add a symbol", "Avoid sequential characters like 'abcd'", "This looks like a common password — avoid dictionary words"). Order suggestions by penalty size, largest first, so the highest-impact fix shows first.

## 7. Password Generator

Generate independently of the analyzer — do not reuse analysis code to "check" the generator's own output in a loop (wasteful and can infinite-loop on bad luck with a tiny pool). Instead:

- Use `crypto.getRandomValues` for all randomness, never `Math.random`.
- Let the user pick length and which character classes to include (lowercase/uppercase/digits/symbols), matching the same `POOLS` map from Section 1 so pool size and generator stay consistent.
- Guarantee at least one character from each selected class by seeding one slot per class first, then filling the rest uniformly, then shuffling (Fisher–Yates, using `crypto.getRandomValues` for the swap index) — this avoids the biased "sort by random key" shuffle pattern.

```ts
function generatePassword(length: number, classes: (keyof typeof POOLS)[]): string {
  // 1. build combined pool from selected classes
  // 2. seed one guaranteed char per class
  // 3. fill remaining length uniformly from combined pool
  // 4. Fisher-Yates shuffle using crypto.getRandomValues
  // 5. join and return
}
```

## Non-Goals

- No zxcvbn-style precomputed frequency tables or Markov models — this project's differentiator per AGENTS.md is a from-scratch, transparent, mathematically-explainable engine, not a port of an existing library's heuristics.
- No async analysis — all calculations run synchronously on keystroke; keep the wordlist/pattern checks cheap enough for that (target well under 1ms per keystroke on a typical laptop).
- No storing or transmitting passwords anywhere, including analytics or logs.
