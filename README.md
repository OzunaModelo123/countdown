# Countdown

A premium countdown timer app with intelligent theming, real-time facts, and interactive celebrations.

![React](https://img.shields.io/badge/React-18-blue) ![Vite](https://img.shields.io/badge/Vite-5-purple) ![License](https://img.shields.io/badge/License-MIT-green)

## What It Does

Create beautiful, shareable countdown timers for any event. The app intelligently adapts its color palette based on the event name — type "Christmas" and it shifts to festive reds and greens, type "Halloween" and it goes orange and purple. Every color is fully customizable.

### Features

- **Flip-clock timer** — Split-flap style digits with smooth 3D flip animations on each tick
- **Intelligent theming** — Auto-detects appropriate colors from your event title (20+ built-in keyword mappings + GPT-powered suggestions)
- **Full color customization** — Pick any primary, secondary, and background color you want
- **Live facts** — Rotating interesting facts and contextual messages powered by GPT (with curated fallback library)
- **Hype button** — Escalating confetti system with combo counter, screen shake at high combos, and milestone bursts
- **Celebration overlay** — Multi-wave confetti explosion when the countdown hits zero
- **Sound effects** — Web Audio API tick sounds, escalating hype tones, and completion fanfare (toggleable)
- **Multi-countdown support** — Save up to 10 countdowns to localStorage, switch between them
- **Shareable kiosk URLs** — Generate a link to display your countdown on a TV or second screen
- **Keyboard shortcuts** — `E` Edit, `M` Mute, `Space` Hype
- **Responsive** — Works on desktop, tablet, and mobile

## Tech Stack

- **React 18** + **Vite 5**
- **Vanilla CSS** with CSS custom properties for dynamic theming
- **OpenAI GPT-4o-mini** for intelligent fact generation and color suggestions
- **Web Audio API** for zero-dependency sound effects
- **canvas-confetti** for celebration particles
- **lucide-react** for icons

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## GPT Integration (Optional)

To enable AI-powered facts and automatic color detection from event titles:

1. Get an API key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create a `.env` file in the project root:

```
VITE_OPENAI_API_KEY=your-key-here
```

The app works great without an API key — it uses a curated library of facts and keyword-based color matching.

## Kiosk Mode

Share your countdown on a TV or second screen by clicking the **Share** button. It generates a URL with `?mode=kiosk` that hides edit controls and displays the countdown full-screen.

## License

MIT
