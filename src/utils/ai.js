const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

const FACTS = [
  "If you started walking now, you'd cover over 1,200 miles before this moment arrives.",
  "Over 4.5 million coffees will be consumed globally while you wait.",
  "Earth will travel another 1.6 million miles through space before this hits zero.",
  "The International Space Station will orbit Earth about 96 times before this moment.",
  "Approximately 350,000 babies will be born worldwide before this countdown completes.",
  "Your heart will beat roughly 400,000 times between now and the big moment.",
  "Light from the Sun takes 8 minutes to reach Earth. Your wait is a bit longer.",
  "NASA's Voyager 1 will travel another 38,000 miles in just one day of your wait.",
  "A hummingbird's wings will beat about 4 billion times before this countdown ends.",
  "The moon moves about 1.5 inches farther from Earth each year.",
  "Water covers about 71 percent of the Earth surface.",
  "The Eiffel Tower grows about 6 inches every summer due to heat expansion.",
  "Honey never spoils, so your countdown will definitely end first.",
  "A bolt of lightning is 5 times hotter than the surface of the sun.",
  "A single strand of spider silk is stronger than steel of the same thickness.",
  "The shortest war in history lasted 38 minutes. This countdown is slightly longer.",
];

const URGENT = [
  "The finish line is in sight. Almost there.",
  "Final stretch, this is where it gets good.",
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

const HOLIDAY_DATES = {
  "christmas": { month: 11, day: 25 },
  "xmas": { month: 11, day: 25 },
  "halloween": { month: 9, day: 31 },
  "valentine": { month: 1, day: 14 },
  "st patrick": { month: 2, day: 17 },
  "saint patrick": { month: 2, day: 17 },
  "new year": { month: 0, day: 1 },
  "nye": { month: 0, day: 1 },
  "independence day": { month: 6, day: 4 },
  "july 4": { month: 6, day: 4 },
  "earth day": { month: 3, day: 22 },
  "star wars day": { month: 4, day: 4 },
};

export async function suggestEventDate(title) {
  const lower = title.toLowerCase();
  
  // Local fallback check
  for (const [keyword, dateObj] of Object.entries(HOLIDAY_DATES)) {
    if (lower.includes(keyword)) {
      const now = new Date();
      let year = now.getFullYear();
      let suggested = new Date(year, dateObj.month, dateObj.day, 0, 0, 0);
      
      // If it already passed this year, suggest next year
      if (suggested.getTime() < now.getTime()) {
        suggested.setFullYear(year + 1);
      }
      
      // Adjust timezone offset to get local ISO string format
      const tzoffset = suggested.getTimezoneOffset() * 60000;
      return new Date(suggested.getTime() - tzoffset).toISOString().slice(0, 16);
    }
  }

  // AI fallback
  if (!OPENAI_API_KEY) return null;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content:
          `User is making a countdown for "${title}". If this is a known public holiday or recurring event, reply ONLY with its next upcoming date and time in local ISO format (YYYY-MM-DDTHH:mm). If it's not a known public event, reply with "null". Today is ${new Date().toISOString()}.`
        }],
        max_tokens: 20,
        temperature: 0.1,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data.choices[0].message.content.trim();
    if (text === 'null' || !text.includes('T')) return null;
    return text;
  } catch {
    return null;
  }
}


export async function generateAIFact(title, _theme, context, timeLeft, createdAt) {
  if (!OPENAI_API_KEY) return getLocalFact(title, timeLeft);

  try {
    const daysLeft = timeLeft ? timeLeft.days : 0;
    const hoursLeft = timeLeft ? timeLeft.hours : 0;
    const daysPassed = createdAt ? Math.floor((Date.now() - createdAt) / 86400000) : 0;

    let timeContext = `There are exactly ${daysLeft} days and ${hoursLeft} hours left until the event.`;
    if (daysPassed > 0) {
      timeContext += ` It has been ${daysPassed} days since this countdown was started.`;
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: 
          "You are an AI that generates fascinating, cool, or shocking facts related to a countdown. You know exactly how much time is left and how much time has passed. Generate a fact about the event itself, or a fun fact about what has happened since the countdown started (e.g., how far the Earth has rotated). DO NOT use emojis. DO NOT use em dashes. DO NOT make jokes or be witty. Keep the tone informative and surprising. Do not use placeholders like 'X days'. Keep your fact under 180 characters, and DO NOT start with 'Did you know'."
        }, { role: 'user', content:
          `Event: "${title}". ${context ? `Context: ${context}.` : ''} ${timeContext} Generate ONE cool or shocking fact.`
        }],
        max_tokens: 80,
        temperature: 0.9,
      }),
    });
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    let text = data.choices[0].message.content.trim();
    // Strip quotes if AI wraps it
    if (text.startsWith('"') && text.endsWith('"')) text = text.slice(1, -1);
    return text;
  } catch {
    return getLocalFact(title, timeLeft);
  }
}

function getLocalFact(title, timeLeft) {
  let pool = [...FACTS];
  if (timeLeft && timeLeft.days < 1) pool = [...pool, ...URGENT, ...URGENT];
  pool.push(`The countdown to ${title} has the whole room buzzing.`);
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
  if (clicks >= 50) return "LEGENDARY!";
  if (clicks >= 30) return "UNSTOPPABLE!";
  if (clicks >= 20) return "ON FIRE!";
  if (clicks >= 10) return "Keep going!";
  if (clicks >= 5) return "Hype rising!";
  return "Let's go!";
}
