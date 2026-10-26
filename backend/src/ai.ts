import OpenAI, { toFile } from 'openai';
import { Message } from './db';
import { getCurrentWeather } from './tools';

const LANGUAGE_NAMES: Record<string, string> = {
  'en-US': 'English (United States)',
  'en-GB': 'English (United Kingdom)',
  'es-ES': 'Spanish (Español)',
  'fr-FR': 'French (Français)',
  'de-DE': 'German (Deutsch)',
  'it-IT': 'Italian (Italiano)',
  'ja-JP': 'Japanese (日本語)',
  'ko-KR': 'Korean (한국어)',
  'zh-CN': 'Chinese Mandarin (简体中文)',
  'hi-IN': 'Hindi (हिन्दी)',
  'te-IN': 'Telugu (తెలుగు)',
  'kn-IN': 'Kannada (ಕನ್ನಡ)',
  'ta-IN': 'Tamil (தமிழ்)',
  'pt-BR': 'Portuguese (Português)',
  'ar-SA': 'Arabic (العربية)',
  'ru-RU': 'Russian (Русский)',
  'nl-NL': 'Dutch (Nederlands)',
};

const VOICE_MAP: Record<string, 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'> = {
  Kore: 'nova',
  Charon: 'shimmer',
  Puck: 'echo',
  Zephyr: 'fable',
  Fenrir: 'onyx',
  alloy: 'alloy',
  echo: 'echo',
  fable: 'fable',
  onyx: 'onyx',
  nova: 'nova',
  shimmer: 'shimmer',
};

function client(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured on the server.');
  }
  return new OpenAI({ apiKey });
}

export function openaiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function mapVoice(voiceName?: string): 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' {
  if (!voiceName) return 'nova';
  return VOICE_MAP[voiceName] || 'nova';
}

export async function transcribeAudio(audioBase64: string, mimeType = 'audio/webm', language = 'en-US'): Promise<string> {
  const clean = audioBase64.replace(/^data:audio\/[^;]+;base64,/, '');
  const buffer = Buffer.from(clean, 'base64');
  if (!buffer.length) {
    throw new Error('Audio payload was empty.');
  }
  const ext = mimeType.includes('wav') ? 'wav' : mimeType.includes('mp3') || mimeType.includes('mpeg') ? 'mp3' : 'webm';
  const file = await toFile(buffer, `speech.${ext}`, { type: mimeType.split(';')[0] || 'audio/webm' });
  const lang = language.split('-')[0];
  const transcript = await client().audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: lang || undefined,
  });
  return (transcript.text || '').trim();
}

export async function generateChatResponse(
  userPrompt: string,
  history: Message[] = [],
  language = 'en-US',
  voiceStyle = 'Cute, cheerful, warm and sweet'
): Promise<string> {
  const targetLangName = LANGUAGE_NAMES[language] || language;
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `You are VoxAI, a voice conversational assistant with a cute, cheerful, friendly personality.
Your answers are spoken out loud.
1. Reply fluently in ${targetLangName} (${language}).
2. Tone: ${voiceStyle}.
3. Keep replies to 1-3 conversational sentences unless the user asks for detail.
4. Do not use markdown, tables, or symbols that sound awkward when read aloud.
5. If asked who you are, introduce yourself as VoxAI.
6. You have a live weather tool. If the user asks about weather, temperature, rain, humidity, wind, or today's conditions, call get_current_weather before you answer. Never invent a temperature or forecast.
7. If they do not name a city, call get_current_weather with an empty location so it uses their current area.
8. Say the place, the temperature in Celsius, and the sky condition in one or two short spoken sentences. Use Fahrenheit only if they ask for it.`,
    },
  ];

  const recent = history.slice(-8).filter((item) => item.role !== 'system');
  for (const item of recent) {
    messages.push({
      role: item.role === 'assistant' ? 'assistant' : 'user',
      content: item.content,
    });
  }
  const last = recent[recent.length - 1];
  if (!(last && last.role === 'user' && last.content.trim() === userPrompt.trim())) {
    messages.push({ role: 'user', content: userPrompt });
  }

  const tools: OpenAI.Chat.ChatCompletionTool[] = [
    {
      type: 'function',
      function: {
        name: 'get_current_weather',
        description: 'Look up the live current temperature and weather for a city, or for the user\'s current area when no city is given. Use this for any weather or temperature question.',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'City or place name, such as Hyderabad or London. Leave empty to use the user\'s current area.',
            },
          },
        },
      },
    },
  ];

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  for (let step = 0; step < 3; step += 1) {
    const response = await client().chat.completions.create({
      model,
      messages,
      tools,
      tool_choice: 'auto',
      temperature: 0.4,
      max_tokens: 300,
    });
    const choice = response.choices[0]?.message;
    const toolCalls = choice?.tool_calls ?? [];
    if (!toolCalls.length) {
      const reply = choice?.content?.trim();
      if (!reply) throw new Error('The language model returned an empty reply.');
      return reply;
    }

    messages.push(choice);
    for (const call of toolCalls) {
      if (call.type !== 'function') continue;
      let location = '';
      try {
        location = String(JSON.parse(call.function.arguments || '{}').location || '');
      } catch {
        location = '';
      }
      const result = call.function.name === 'get_current_weather'
        ? await getCurrentWeather(location)
        : { error: 'That tool is not available.' };
      console.log('Live tool', call.function.name, result);
      messages.push({
        role: 'tool',
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
  }

  throw new Error('The assistant could not finish the live lookup.');
}

export async function synthesizeSpeech(
  text: string,
  voiceName = 'Kore'
): Promise<{ audioDataUrl: string; format: string }> {
  const sanitized = text.replace(/\*+/g, '').replace(/```[\s\S]*?```/g, 'Code snippet.').slice(0, 1000);
  const speech = await client().audio.speech.create({
    model: 'tts-1',
    voice: mapVoice(voiceName),
    input: sanitized || 'Hello from VoxAI.',
    response_format: 'mp3',
  });
  const buffer = Buffer.from(await speech.arrayBuffer());
  return {
    audioDataUrl: `data:audio/mpeg;base64,${buffer.toString('base64')}`,
    format: 'audio/mpeg',
  };
}
