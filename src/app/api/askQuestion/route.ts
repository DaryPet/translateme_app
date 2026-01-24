'use server';
import { OpenAI } from 'openai';
import {
  getSystemPrompt,
  getUserPrompt,
  PromptType,
} from '../../../utils/prompts';
import { NextRequest, NextResponse } from 'next/server';

interface AIResponse {
  interpretation: string;
  tips: string[];
  followUps: string[];
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

async function askQuestion(messages: any[]) {
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    temperature: 0,
  });
  return resp.choices?.[0]?.message?.content?.trim() ?? '';
}

export async function POST(req: NextRequest) {
  try {
    const { question, type = 'prepare', locale = 'en' } = await req.json();

    // Валидация входных данных
    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Invalid question format' },
        { status: 400 },
      );
    }

    // Определение языка ответа
    const supportedLocales = ['ru', 'uk', 'en', 'es'];
    const lang = supportedLocales.includes(locale) ? locale : 'en';

    // Получение промптов
    const systemPrompt = getSystemPrompt(lang);
    const userPrompt = getUserPrompt({ question, type, lang });

    // Формирование запроса к OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    // Вызов OpenAI API
    let answer = '';
    try {
      answer = await askQuestion(messages);
    } catch (e: any) {
      console.error('OpenAI API error:', e.message);
      return NextResponse.json(
        { error: 'AI service unavailable' },
        { status: 503 },
      );
    }

    // Обработка ответа для типа "interpret"
    if (type === 'interpret') {
      try {
        const parsed = JSON.parse(answer) as AIResponse;
        return NextResponse.json(
          { answer: JSON.stringify(parsed) },
          { status: 200 },
        );
      } catch (e) {
        console.warn('Failed to parse interpretation response:', answer);
        return NextResponse.json({
          answer: JSON.stringify({
            interpretation: answer,
            tips: [],
            followUps: [],
          }),
        });
      }
    }

    // Стандартный ответ
    return NextResponse.json({ answer }, { status: 200 });
  } catch (e: any) {
    console.error('Server error:', e.message);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

//TODO: Gemini play around
// 'use server';

// import { NextRequest, NextResponse } from 'next/server';
// import { GoogleGenerativeAI } from '@google/generative-ai';
// import {
//   getSystemPrompt,
//   getUserPrompt,
//   PromptType,
// } from '../../../utils/prompts';

// interface AIResponse {
//   interpretation: string;
//   tips: string[];
//   followUps: string[];
// }

// // -------- Gemini client --------
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
// const MODEL_ID = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';

// // Удаляем возможные ```json ... ``` обёртки и лишний текст до/после JSON
// function extractJsonString(s: string): string {
//   const trimmed = s.trim();
//   // убираем markdown-фенсы
//   const fence = trimmed.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();

//   // пытаемся выдрать первый корректный JSON-объект { ... }
//   const start = fence.indexOf('{');
//   const end = fence.lastIndexOf('}');
//   if (start !== -1 && end !== -1 && end > start) {
//     return fence.slice(start, end + 1);
//   }
//   return fence; // пусть парсинг упадёт в catch, там есть фоллбэк
// }

// // Унифицированный текстовый запрос
// async function askTextGemini(systemText: string, userText: string): Promise<string> {
//   const model = genAI.getGenerativeModel({
//     model: MODEL_ID,
//     systemInstruction: systemText,
//   });

//   const result = await model.generateContent({
//     contents: [{ role: 'user', parts: [{ text: userText }] }],
//     generationConfig: {
//       temperature: 0,
//       responseMimeType: 'text/plain',
//     },
//   });

//   return result.response.text().trim();
// }

// // Запрос, который ДОЛЖЕН вернуть JSON нужной формы
// async function askJsonGemini(systemText: string, userText: string): Promise<string> {
//   const model = genAI.getGenerativeModel({
//     model: MODEL_ID,
//     systemInstruction: systemText,
//   });

//   // Жёстко требуем JSON-ответ именно с нашими полями
//   const jsonGuard = `
// Ты обязана вернуть ТОЛЬКО JSON без пояснений и без markdown. Все **** замениь на жирный шрифт!
// Строго соответствуй этой схеме (поля и типы не менять, лишних не добавлять):
// {
//   "interpretation": "string",
//   "tips": ["string", "..."],
//   "followUps": ["string", "..."]
// }
// `;

//   const result = await model.generateContent({
//     contents: [
//       {
//         role: 'user',
//         parts: [{ text: `${userText}\n\n${jsonGuard}` }],
//       },
//     ],
//     generationConfig: {
//       temperature: 0,
//       // просим чистый JSON
//       responseMimeType: 'application/json',
//     },
//   });

//   // Gemini вернёт текст, мы подстрахуемся и вычистим возможные фенсы
//   const raw = result.response.text();
//   return extractJsonString(raw);
// }

// export async function POST(req: NextRequest) {
//   try {
//     const { question, type = 'prepare', locale = 'en' } = (await req.json()) as {
//       question: string;
//       type?: PromptType | 'interpret' | 'prepare';
//       locale?: 'ru' | 'uk' | 'en' | 'es' | string;
//     };

//     // Валидация
//     if (!question || typeof question !== 'string') {
//       return NextResponse.json(
//         { error: 'Invalid question format' },
//         { status: 400 },
//       );
//     }

//     // Язык
//     const supportedLocales = ['ru', 'uk', 'en', 'es'];
//     const lang = (supportedLocales as string[]).includes(locale) ? locale : 'en';

//     // Промпты как раньше
//     const systemPrompt = getSystemPrompt(lang);
//     const userPrompt = getUserPrompt({ question, type, lang });

//     let answer = '';

//     if (type === 'interpret') {
//       // запрашиваем JSON у Gemini
//       try {
//         const jsonString = await askJsonGemini(systemPrompt, userPrompt);

//         // пытаемся распарсить как AIResponse
//         try {
//           const parsed = JSON.parse(jsonString) as AIResponse;
//           // Возвращаем абсолютно тот же формат, что у тебя был
//           return NextResponse.json(
//             { answer: JSON.stringify(parsed) },
//             { status: 200 },
//           );
//         } catch {
//           // Если по какой-то причине пришёл невалидный JSON — фоллбэк
//           return NextResponse.json({
//             answer: JSON.stringify({
//               interpretation: jsonString,
//               tips: [],
//               followUps: [],
//             } as AIResponse),
//           });
//         }
//       } catch (e: any) {
//         console.error('Gemini API error (interpret):', e?.message || e);
//         return NextResponse.json(
//           { error: 'AI service unavailable' },
//           { status: 503 },
//         );
//       }
//     } else {
//       // обычный текстовый ответ
//       try {
//         answer = await askTextGemini(systemPrompt, userPrompt);
//       } catch (e: any) {
//         console.error('Gemini API error (text):', e?.message || e);
//         return NextResponse.json(
//           { error: 'AI service unavailable' },
//           { status: 503 },
//         );
//       }

//       return NextResponse.json({ answer }, { status: 200 });
//     }
//   } catch (e: any) {
//     console.error('Server error:', e?.message || e);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 },
//     );
//   }
// }
