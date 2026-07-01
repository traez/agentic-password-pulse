# AGENTS.md

## Project: agentic-password-pulse

A local, fast Password Strength Visualizer that provides deep analytical feedback beyond basic weak/strong metrics.

## Stack

- **Vite** — bundler and dev server
- **Vanilla TypeScript** — no frontend frameworks (React, Vue, Svelte)
- **Vanilla CSS** — no CSS utilities (Tailwind, UnoCSS)
- **HTML5** — semantic markup
- **No external crypto/zxcvbn libraries** — all password analysis is implemented from scratch

## Key Features

- Animated strength meter
- Password entropy calculations (`E = log₂(R^L)`)
- Crack-time estimations
- Live security suggestions
- Built-in password generator
- Clipboard copy button

## Code Style

- Clean, modular TypeScript without external runtime helpers
- Structured mathematical logic for algorithms
- Semantic HTML5 elements
- Pure vanilla CSS transitions for animations
- No comments unless explicitly requested
- Follow existing file conventions and patterns

## Commands

- `pnpm dev` — start dev server
- `pnpm build` — type-check and build
- `pnpm preview` — preview production build

## Constraints

- Keep all logic local (no server-side processing, no external API calls)
- Entropy formula: `E = log₂(R^L)` where R = pool size, L = password length
- Character pool sizes: lowercase (26), uppercase (26), digits (10), symbols (~33)
- Crack time based on assumption of 10 billion guesses/second (offline attack)
