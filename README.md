# Password Pulse

A local, fast Password Strength Visualizer that provides deep analytical feedback beyond basic weak/strong metrics.

## Table of contents

- [Overview](#overview)
  - [The challenge](#the-challenge)
  - [Screenshot](#screenshot)
  - [Links](#links)
  - [Built with](#built-with)
  - [How It Works](#how-it-works)
    - [Entropy Calculation](#entropy-calculation)
    - [Crack-Time Estimation](#crack-time-estimation)
    - [Strength Tiers](#strength-tiers)
    - [Features](#features)
  - [Continued development](#continued-development)
  - [Useful resources](#useful-resources)
  - [Author](#author)
  - [Acknowledgments](#acknowledgments)

## Overview

### The challenge

Build a fully client-side password strength analyzer that computes entropy, estimates crack times, detects patterns, and provides real-time actionable feedback — all without external libraries or server calls.

### Screenshot

![](/public/screenshot-app.png)

### Links

- Solution URL: [https://github.com/traez/agentic-password-pulse](https://github.com/traez/agentic-password-pulse)
- Live Site URL: [https://agentic-password-pulse.vercel.app/](https://agentic-password-pulse.vercel.app/)

## Built with

- **Vite** — bundler and dev server
- **Vanilla TypeScript** — no frontend frameworks
- **Vanilla CSS** — no CSS utilities
- **No external crypto or password-analysis libraries** — all logic implemented from scratch

## How It Works

### Entropy Calculation

Entropy is calculated using the formula `E = log₂(R^L)` where:

- **R** = size of the active character pool (sum of detected character class sizes)
- **L** = password length (counted by Unicode code points, not UTF-16 code units)

Character pool sizes: lowercase (26), uppercase (26), digits (10), symbols (~33). Only pools actually present in the password contribute to R.

The analysis engine then applies **pattern penalties** (repeated characters, sequential patterns, keyboard walks, dictionary words, date patterns, L33t substitutions) to derive **effective entropy**, which drives the strength meter and crack-time estimate.

### Crack-Time Estimation

Assumes an offline attack at **10 billion guesses/second**. The average-case crack time is `2^(E-1) / 10^10` seconds, displayed in the largest sensible unit (seconds → minutes → hours → days → years → centuries).

### Strength Tiers

| Effective Entropy | Label       |
| ----------------- | ----------- |
| < 28 bits         | Very Weak   |
| 28–35 bits        | Weak        |
| 36–59 bits        | Fair        |
| 60–79 bits        | Strong      |
| ≥ 80 bits         | Very Strong |

### Features

- **Real-time analysis** — live entropy, crack time, and checklist suggestions on every keystroke
- **Pattern detection** — detects repeated chars, sequential patterns, QWERTY walks, dictionary words, dates, and L33t substitutions
- **Password generator** — cryptographically secure (`crypto.getRandomValues`) with customizable length and character classes
- **Clipboard copy** — works on HTTPS (`navigator.clipboard`) and HTTP (`document.execCommand` fallback)
- **Dark/light theme** — follows OS preference via `prefers-color-scheme`

## Continued development

- More projects; increased competence!

## Useful resources

YouTube  
Google  
Artificial Intelligence

## Author

- Website — [Zeeofor Technologies](https://zeeofor.tech)

## Acknowledgments

- Jehovah that keeps breath in my lungs
