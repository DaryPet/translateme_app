'use client';

import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { tarotCards } from '@/data/tarotCards-1';

export interface Card {
  name: string;
  file: string;
}

export interface AIResponse {
  interpretation: string;
  tips: string[];
  followUps: string[];
}

export interface HistoryItem {
  question: string;
  card: Card;
  response: AIResponse;
}

export function useTarotAI(initialQuestion: string | null) {
  const locale = useLocale();
  const t = useTranslations();

  const [internalUserQuestion, internalSetUserQuestion] =
    useState(initialQuestion);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [deckVersion, setDeckVersion] = useState<
    'version1' | 'version2' | null
  >(null);
  const [greeting, setGreeting] = useState<string | null>(null);
  const [data, setData] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const callAPI = async (
    questionText: string,
    type: 'prepare' | 'interpret',
  ): Promise<AIResponse | string> => {
    setLoading(true);
    try {
      const res = await fetch('/api/askQuestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: questionText, type, locale }),
      });

      const text = await res.text();
      const json = JSON.parse(text);
      if (!res.ok || !json.answer) throw new Error(json.error || 'API error');

      if (type === 'prepare') {
        setGreeting(json.answer);
        return json.answer;
      }

      const parsed: AIResponse = JSON.parse(json.answer);
      setData(parsed);
      return parsed;
    } catch (err) {
      const fallback: AIResponse = {
        interpretation: t('interpretationError'),
        tips: [],
        followUps: [],
      };
      setData(fallback);
      return fallback;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (internalUserQuestion?.trim()) {
      setSelectedCard(null);
      setData(null);
      setGreeting(null);
      setPendingPrompt(null);
      callAPI(internalUserQuestion, 'prepare');
    }
  }, [internalUserQuestion, locale]);

  const drawAndAsk = async (prompt: string) => {
    if (!deckVersion) return;

    const idx = Math.floor(Math.random() * tarotCards.length);
    const baseCard = tarotCards[idx];
    const isReversed = Math.random() < 0.3;

    const card: Card = {
      name: baseCard.name + (isReversed ? ' (reversed)' : ''),
      file: `${deckVersion}/${baseCard.file}`,
    };

    setSelectedCard(card);
    setData(null);
    setGreeting(null);

    const isFollowUp = prompt.startsWith('Follow-up question:');

    const previousCard = selectedCard?.name || 'N/A';
    const previousInterpretation = data?.interpretation || 'N/A';

    const fullPrompt = isFollowUp
      ? [
          `This is a follow-up question in an ongoing tarot reading.`,
          `Original question: "${internalUserQuestion}"`,
          `Previous card drawn: "${previousCard}"`,
          `Its interpretation was: "${previousInterpretation}"`,
          `${prompt}`,
          `New card drawn: "${card.name}"`,
        ].join('\n')
      : `Question: "${internalUserQuestion}"\nCard: "${card.name}"`;

    const result = await callAPI(fullPrompt, 'interpret');

    if (typeof result !== 'string') {
      const actualQuestion = isFollowUp
        ? prompt.replace(/^Follow-up question: "/, '').replace(/"$/, '')
        : internalUserQuestion;

      setHistory((h) => [
        ...h,
        { question: actualQuestion!, card, response: result },
      ]);
    }
  };

  const drawInitial = () => drawAndAsk(`Question: "${internalUserQuestion}"`);

  const prepareFollowUp = (q: string) => {
    setSelectedCard(null);
    setData(null);
    setGreeting(null);
    setPendingPrompt(`Follow-up question: "${q}"`);
  };

  const drawPending = () => {
    setTimeout(() => {
      if (pendingPrompt) {
        drawAndAsk(pendingPrompt);
      }
    }, 0);
  };

  const reset = () => {
    setSelectedCard(null);
    setGreeting(null);
    setData(null);
    setPendingPrompt(null);
  };

  const interpretExternalCard = async (cardName: string) => {
    if (!internalUserQuestion) return;

    setLoading(true);
    setSelectedCard(null);
    setGreeting(null);
    setData(null);

    let prompt: string;

    if (pendingPrompt) {
      const previousCard = selectedCard?.name || 'N/A';
      const previousInterpretation = data?.interpretation || 'N/A';

      prompt = [
        `This is a follow-up question in an ongoing tarot reading.`,
        `Original question: "${internalUserQuestion}"`,
        `Previous card drawn: "${previousCard}"`,
        `Its interpretation was: "${previousInterpretation}"`,
        `${pendingPrompt}`,
        `New card drawn: "${cardName}"`,
      ].join('\n');
    } else {
      prompt = `Question: "${internalUserQuestion}"\nCard: "${cardName}"`;
    }

    const result = await callAPI(prompt, 'interpret');

    if (typeof result !== 'string') {
      const card: Card = {
        name: cardName,
        file: '',
      };

      const actualQuestion = pendingPrompt
        ? pendingPrompt.replace(/^Follow-up question: "/, '').replace(/"$/, '')
        : internalUserQuestion;

      setSelectedCard(card);
      setHistory((h) => [
        ...h,
        { question: actualQuestion, card, response: result },
      ]);
    }

    setPendingPrompt(null);
    setLoading(false);
  };

  const setUserQuestion = (newQuestion: string) => {
    internalSetUserQuestion(newQuestion);
    setSelectedCard(null);
    setData(null);
    setGreeting(null);
    setPendingPrompt(null);
  };

  return {
    selectedCard,
    greeting,
    data,
    loading,
    pendingPrompt,
    history,
    drawInitial,
    prepareFollowUp,
    drawPending,
    reset,
    deckVersion,
    setDeckVersion,
    setPendingPrompt,
    interpretExternalCard,
    setUserQuestion,
  };
}
