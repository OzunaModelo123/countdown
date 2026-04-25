const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

const FACTS = [
  "If you started walking now, you'd cover over 1,200 miles before this moment arrives.",
  "Over 4.5 million coffees will be consumed globally while you wait.",
  "Earth will travel another 1.6 million miles through space before this hits zero.",
  "The International Space Station will orbit Earth about 96 times before this moment.",
  "Approximately 350,000 babies will be born worldwide before this countdown completes.",
  "Your heart will beat roughly 400,000 times between now and the big moment.",
  "Light from the Sun takes 8 minutes to reach Earth — your wait is a bit longer.",
  "NASA's Voyager 1 will travel another 38,000 miles in just one day of your wait.",
  "A hummingbird's wings will beat about 4 billion times before this countdown ends.",
  "The moon moves about 1.5 inches farther from Earth each year. Patience, right?",
  "Every 60 seconds in Africa, a minute passes. And one less minute on your countdown.",
  "The Eiffel Tower grows about 6 inches every summer due to heat expansion.",
  "Honey never spoils — and your countdown won't last nearly as long.",
  "A bolt of lightning is 5x hotter than the surface of the sun. That's how hot this event is.",
  "Bananas are slightly radioactive. This fact is unrelated but now you know.",
  "The shortest war in history lasted 38 minutes. This countdown is slightly longer.",
];

const URGENT = [
  "The finish line is in sight. Almost there.",
  "Final stretch — this is where it gets good.",
  "Hours away. The anticipation is electric.",
];

const KEYWORDS_COLORS = {
  christmas: { accent: '#c0392b', accentSecondary: '#27ae60', background: '#0a1a0f' },
  xmas: { accent: '#c0392b', accentSecondary: '#27ae60', background: '#0a1a0f' },
  holiday: { accent: '#c0392b', accentSecondary: '#2ecc71', background: '#0d1117' },
  halloween: { accent: '#e67e22', accentSecondary: '#8e44ad', background: '#0a0514' },
  spooky: { accent: '#e67e22', accentSecondary: '#9b59b6', background: '#0a0514' },
  birthday: { accent: '#e91e63', accentSecondary: '#ff9800', background: '#0d0a14' },
  party: { accent: '#e91e63', accentSecondary: '#ffc107', background: '#0d0a14' },
  wedding: { accent: '#d4a574', accentSecondary: '#e8b4b8', background: '#0f0d0b' },
  anniversary: { accent: '#d4a574', accentSecondary: '#c9a96e', background: '#0f0d0b' },
  launch: { accent: '#3498db', accentSecondary: '#00bcd4', background: '#060a10' },
  release: { accent: '#3498db', accentSecondary: '#26c6da', background: '#060a10' },
  'new year': { accent: '#ffd700', accentSecondary: '#c0c0c0', background: '#0a0a14' },
  nye: { accent: '#ffd700', accentSecondary: '#e0e0e0', background: '#0a0a14' },
  graduation: { accent: '#1a237e', accentSecondary: '#ffc107', background: '#080810' },
  summer: { accent: '#00acc1', accentSecondary: '#ffb74d', background: '#060d10' },
  valentine: { accent: '#e53935', accentSecondary: '#f48fb1', background: '#10060a' },
  superbowl: { accent: '#1565c0', accentSecondary: '#c62828', background: '#060810' },
  concert: { accent: '#aa00ff', accentSecondary: '#00e5ff', background: '#08060f' },
  vacation: { accent: '#00897b', accentSecondary: '#ffb300', background: '#060d0c' },
  baby: { accent: '#f8bbd0', accentSecondary: '#b3e5fc', background: '#0d0a0c' },
  retirement: { accent: '#c9b037', accentSecondary: '#4a7c59', background: '#0a0a08' },
};

export async function generateAIFact(title, _theme, context, timeLeft) {
  if (!OPENAI_API_KEY) return getLocalFact(title, timeLeft);

  try {
    const urgency = timeLeft && timeLeft.days < 1 ? "Less than a day remains!" :
                    timeLeft && timeLeft.days < 3 ? "Only a few days left." : "";

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content:
          `Generate ONE short, interesting fact or message (max 2 sentences) for a countdown to "${title}". ${context ? `Context: ${context}.` : ''} ${urgency} Be witty and surprising. Include one emoji. Don't say "Did you know". Keep under 180 chars.`
        }],
        max_tokens: 80,
        temperature: 0.9,
      }),
    });
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    return data.choices[0].message.content.trim();
  } catch {
    return getLocalFact(title, timeLeft);
  }
}

function getLocalFact(title, timeLeft) {
  let pool = [...FACTS];
  if (timeLeft && timeLeft.days < 1) pool = [...pool, ...URGENT, ...URGENT];
  pool.push(`The countdown to ${title} has the whole room buzzing. ⚡`);
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Auto-detect colors from event title
 */
export async function detectThemeColors(title, context) {
  const lower = title.toLowerCase();

  // Keyword matching first
  for (const [keyword, colors] of Object.entries(KEYWORDS_COLORS)) {
    if (lower.includes(keyword)) return colors;
  }

  // GPT fallback
  if (!OPENAI_API_KEY) return null;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content:
          `For an event called "${title}"${context ? ` (${context})` : ''}, suggest 3 hex colors that match the mood:
1. Primary accent color (vibrant)
2. Secondary accent color (complementary)
3. Dark background color (very dark, near-black)

Reply ONLY with JSON: {"accent":"#hex","accentSecondary":"#hex","background":"#hex"}`
        }],
        max_tokens: 60,
        temperature: 0.7,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data.choices[0].message.content.trim();
    const json = JSON.parse(text.replace(/```json?\n?/g, '').replace(/```/g, ''));
    if (json.accent && json.accentSecondary && json.background) return json;
    return null;
  } catch {
    return null;
  }
}

export function generateHypeMessage(clicks) {
  if (clicks >= 50) return "LEGENDARY! 🔥🔥🔥";
  if (clicks >= 30) return "UNSTOPPABLE! 💥";
  if (clicks >= 20) return "ON FIRE! ⚡";
  if (clicks >= 10) return "Keep going! 🚀";
  if (clicks >= 5) return "Hype rising! 🚂";
  return "Let's go! 🎉";
}
