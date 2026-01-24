// src/lib/tarot-bot/service.ts

import { getSystemPrompt, getUserPrompt } from '../../utils/prompts';
import { tarotCards } from '../../data/tarotCards-1';
import path from 'path';
import fs from 'fs';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function askQuestion(messages: any[]) {
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    temperature: 0,
  });
  return resp.choices?.[0]?.message?.content?.trim() ?? '';
}

export type DeckVersion = 'version1' | 'version2';

interface TarotReadingResponse {
  cardName: string;
  cardTitle: string;
  cardImagePath: string;
  interpretation: string;
  tips: string[];
  followUps: string[];
}

export const getTarotReading = async (
  question: string,
  lang: string,
  deckVersion: DeckVersion,
): Promise<TarotReadingResponse> => {
  const randomCard = tarotCards[Math.floor(Math.random() * tarotCards.length)];
  const cardFileName = randomCard.file.replace('.png', '.webp');
  
  const cardTitleBase = randomCard.titles[lang as keyof typeof randomCard.titles] || randomCard.name;

  // +++ FIX: 30% шанс на перевёрнутую карту
  const isReversed = Math.random() < 0.3;

  // +++ FIX: локализованный текст ориентации карты
  const orientationText = isReversed 
    ? (lang === 'ru' ? ' (перевёрнутая)' 
      : lang === 'uk' ? ' (перевернута)' 
      : lang === 'es' ? ' (invertida)' 
      : ' (reversed)')
    : (lang === 'ru' ? ' (прямая)' 
      : lang === 'uk' ? ' (пряма)' 
      : lang === 'es' ? ' (derecha)' 
      : ' (upright)');

  // +++ FIX: теперь в названии карты есть ориентация
  const cardTitle = cardTitleBase + orientationText;

  // +++ FIX: добавили ориентацию карты в промпт для AI
  const systemPrompt = getSystemPrompt(lang);
  const userPrompt = getUserPrompt({
    question: `Карта, которую я вытянул: ${cardTitle}. Мой вопрос: "${question}"`,
    type: 'interpret',
    lang: lang,
  });

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
  
  const responseText = await askQuestion(messages);

  try {
    // +++ FIX: очищаем кодблоки, если модель вернёт JSON в ````json````
    const cleaned = responseText.replace(/```json\s*|\s*```/g, '');

    const parsedResponse = JSON.parse(cleaned);
    const cardImagePath = path.join(process.cwd(), 'public', 'cards', deckVersion, cardFileName);

    if (!fs.existsSync(cardImagePath)) {
      console.error(`Файл карты не найден: ${cardImagePath}`);
      throw new Error('Файл карты не найден.');
    }

    return {
      cardName: randomCard.name,
      cardTitle: cardTitle, // с ориентацией
      cardImagePath: cardImagePath,
      interpretation: parsedResponse.interpretation,
      tips: parsedResponse.tips,
      followUps: parsedResponse.followUps,
    };
  } catch (error) {
    console.error('Failed to parse OpenAI response:', responseText, error);
    throw new Error('Invalid JSON response from AI.');
  }
};
