import { GoogleGenAI } from '@google/genai';
import { Message } from './storage';

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
  try {
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('Failed to instantiate GoogleGenAI client:', err);
    return null;
  }
}

export const LANGUAGE_NAMES: Record<string, string> = {
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

/**
 * Transcribe spoken audio using Gemini 3.5 Transcribe
 */
export async function transcribeAudio(audioBase64: string, mimeType = 'audio/webm', language = 'en-US'): Promise<string> {
  const aiClient = getAiClient();
  if (!aiClient) {
    throw new Error('AI transcription engine requires a valid GEMINI_API_KEY.');
  }

  try {
    const cleanBase64 = audioBase64.replace(/^data:audio\/[^;]+;base64,/, '');
    const audioPart = {
      inlineData: {
        mimeType: mimeType.split(';')[0],
        data: cleanBase64,
      },
    };

    const targetLangName = LANGUAGE_NAMES[language] || language;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          audioPart,
          { text: `Transcribe this spoken speech accurately in its original language (expected: ${targetLangName}). Output only the verbatim transcribed text, without timestamps, notes, or explanations.` },
        ],
      },
    });

    const text = response.text?.trim() || '';
    return text;
  } catch (err: any) {
    console.error('Transcription error with gemini-3.5-transcribe:', err);
    throw new Error(err?.message || 'Failed to transcribe audio stream.');
  }
}

/**
 * Generate assistant conversation response given contextual message history
 */
export async function generateChatResponse(
  userPrompt: string,
  history: Message[] = [],
  customSystemPrompt?: string,
  language = 'en-US',
  voiceStyle = 'Cute, cheerful, warm and sweet'
): Promise<string> {
  const aiClient = getAiClient();
  const targetLangName = LANGUAGE_NAMES[language] || language;

  const systemInstruction = customSystemPrompt || `You are VoxAI, a state-of-the-art voice conversational assistant with a cute, cheerful, friendly, and heartwarming personality.
Your answers are spoken out loud to the user.
Follow these rules strictly:
1. Target Language: You MUST reply fluently in ${targetLangName} (${language}). Speak with natural, native phrasing and idioms.
2. Tone & Persona: ${voiceStyle}. Be cheerful, sweet, positive, and delightful to listen to.
3. Keep responses concise (typically 1-3 conversational sentences) so listening is effortless, unless the user asks for detailed explanation.
4. Avoid markdown syntax like tables, long bullet lists, complex equations, or formatting that sounds awkward when read aloud.
5. If asked who you are, introduce yourself cheerfully as VoxAI, the intelligent voice conversational companion.`;

  if (aiClient) {
    try {
      const recentHistory = history.slice(-8);

      const contents: any[] = recentHistory.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      contents.push({
        role: 'user',
        parts: [{ text: userPrompt }],
      });

      // Timeout wrapper to prevent hanging requests
      const generatePromise = aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.75,
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI request timeout')), 12000)
      );

      const response: any = await Promise.race([generatePromise, timeoutPromise]);
      const reply = response.text?.trim();
      if (reply) return reply;
    } catch (err: any) {
      console.warn('Gemini chat generation encountered an issue, using conversational fallback:', err?.message);
    }
  }

  // Multilingual conversational fallbacks
  const lower = userPrompt.toLowerCase();
  if (language.startsWith('es')) {
    return '¡Hola! Soy VoxAI, tu asistente de voz. ¡Qué alegría hablar contigo! ¿En qué puedo ayudarte hoy?';
  }
  if (language.startsWith('fr')) {
    return 'Bonjour ! Je suis VoxAI, votre assistante vocale. C’est un plaisir d’échanger avec vous ! Que puis-je faire pour vous aujourd’hui ?';
  }
  if (language.startsWith('ja')) {
    return 'こんにちは！VoxAIです。お話しできて嬉しいです！今日はどのようなお手伝いをしましょうか？';
  }
  if (language.startsWith('de')) {
    return 'Hallo! Ich bin VoxAI, Ihre Sprachassistentin. Schön, mit Ihnen zu sprechen! Wie kann ich Ihnen heute helfen?';
  }
  if (language.startsWith('ko')) {
    return '안녕하세요! 저는 VoxAI예요. 만나서 반가워요! 오늘 어떤 이야기를 나눠볼까요?';
  }
  if (language.startsWith('zh')) {
    return '你好！我是VoxAI智能语音助手。很高兴和你聊天！今天有什么我可以帮你的吗？';
  }
  if (language.startsWith('hi')) {
    return 'नमस्ते! मैं VoxAI हूँ, आपकी वॉइस असिस्टेंट। आपसे बात करके बहुत खुशी हुई! आज मैं आपकी क्या मदद करूँ?';
  }
  if (language.startsWith('te')) {
    return 'నమస్కారం! నేను VoxAI, మీ వాయిస్ అసిస్టెంట్‌ని. మీతో మాట్లాడటం చాలా సంతోషంగా ఉంది! ఈరోజు నేను మీకు ఎలా సహాయపడగలను?';
  }
  if (language.startsWith('kn')) {
    return 'ನಮಸ್ಕಾರ! ನಾನು VoxAI, ನಿಮ್ಮ ಧ್ವನಿ ಸಹಾಯಕ. ನಿಮ್ಮೊಂದಿಗೆ ಮಾತನಾಡಲು ನನಗೆ ತುಂಬಾ ಸಂತೋಷವಾಗಿದೆ! ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?';
  }
  if (language.startsWith('ta')) {
    return 'வணக்கம்! நான் VoxAI, உங்கள் குரல் உதவியாளர். உங்களிடம் பேசுவதில் எனக்கு மிக்க மகிழ்ச்சி! இன்று நான் உங்களுக்கு என்ன உதவி செய்ய வேண்டும்?';
  }
  if (language.startsWith('it')) {
    return 'Ciao! Sono VoxAI, il tuo assistente vocale. Che piacere parlare con te! Come posso aiutarti oggi?';
  }
  if (language.startsWith('pt')) {
    return 'Olá! Eu sou a VoxAI, sua assistente de voz. É uma alegria falar com você! Como posso te ajudar hoje?';
  }

  // English fallbacks
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return "Hi there! I am VoxAI, your cheerful voice assistant. I am so excited to talk with you! How can I brighten your day?";
  }
  if (lower.includes('who are you') || lower.includes('your name')) {
    return "I am VoxAI, your sweet and intelligent conversational companion, powered by real-time voice synthesis and acoustic reasoning!";
  }
  return `I heard you clearly: "${userPrompt}". I'm thinking about it with my cheerful voice engine!`;
}

/**
 * Synthesize voice speech using gemini-3.8-flash-lite-tts
 */
export async function synthesizeSpeech(
  text: string,
  voiceName = 'Kore',
  speechStyle = 'Cute, cheerful, warm, sweet and enthusiastic tone'
): Promise<{ audioDataUrl: string; format: string }> {
  const aiClient = getAiClient();
  if (!aiClient) {
    throw new Error('Voice synthesis requires a valid GEMINI_API_KEY.');
  }

  // Prebuilt voices: 'Puck' (Playful boyish), 'Zephyr' (Cute soft male), 'Kore' (Cute cheerful female), 'Charon' (Warm female), 'Fenrir' (Deep calm male)
  const validVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
  const selectedVoice = validVoices.includes(voiceName) ? voiceName : 'Kore';

  const sanitizedText = text
    .replace(/\*+/g, '')
    .replace(/```[\s\S]*?```/g, 'Code snippet.')
    .replace(/`([^`]+)`/g, '$1')
    .slice(0, 1000);

  try {
    const ttsPromise = aiClient.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: sanitizedText,
              speechMetadata: {
                style: speechStyle || 'Cute, cheerful, friendly and sweet voice with expressive inflection',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: selectedVoice },
          },
        },
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('TTS request timeout')), 10000)
    );

    const response: any = await Promise.race([ttsPromise, timeoutPromise]);
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error('TTS model did not return audio data.');
    }

    return {
      audioDataUrl: `data:audio/wav;base64,${base64Audio}`,
      format: 'audio/wav',
    };
  } catch (err: any) {
    console.warn('TTS synthesis notice:', err?.message);
    throw new Error(err?.message || 'Failed to synthesize speech audio.');
  }
}
