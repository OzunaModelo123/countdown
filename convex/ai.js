import { action } from "./_generated/server";
import { v } from "convex/values";

export const suggestEventDate = action({
  args: { title: v.string(), currentDateISO: v.string() },
  handler: async (ctx, args) => {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) return null;

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content:
            `User is making a countdown for "${args.title}". If this is a known public holiday or recurring event, reply ONLY with its next upcoming date and time in local ISO format (YYYY-MM-DDTHH:mm). If it's not a known public event, reply with "null". Today is ${args.currentDateISO}.`
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
});

export const generateAIFact = action({
  args: { title: v.string(), context: v.string(), timeContext: v.string() },
  handler: async (ctx, args) => {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) return null;

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: 
            "You are an AI that generates fascinating, cool, or shocking facts related to a countdown. You know exactly how much time is left and how much time has passed. Generate a fact about the event itself, or a fun fact about what has happened since the countdown started (e.g., how far the Earth has rotated). DO NOT use emojis. DO NOT use em dashes. DO NOT make jokes or be witty. Keep the tone informative and surprising. Do not use placeholders like 'X days'. Keep your fact under 180 characters, and DO NOT start with 'Did you know'."
          }, { role: 'user', content:
            `Event: "${args.title}". ${args.context ? `Context: ${args.context}.` : ''} ${args.timeContext} Generate ONE cool or shocking fact.`
          }],
          max_tokens: 80,
          temperature: 0.9,
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      let text = data.choices[0].message.content.trim();
      if (text.startsWith('"') && text.endsWith('"')) text = text.slice(1, -1);
      return text;
    } catch {
      return null;
    }
  }
});

export const detectThemeColors = action({
  args: { title: v.string(), context: v.string() },
  handler: async (ctx, args) => {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) return null;

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content:
            `For an event called "${args.title}"${args.context ? ` (${args.context})` : ''}, suggest 3 hex colors that match the mood:
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
});
