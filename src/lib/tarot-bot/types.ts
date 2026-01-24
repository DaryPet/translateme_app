// Определяет структуру ответа от вашего AI
export interface AIResponse {
  interpretation: string;
  tips: string[];
  followUps: string[];
}

// Определяет структуру ответа от вашего API
export interface TarotCard {
  name: string;
  imageUrl: string;
  description: string;
   tips: string[];
  followUps: string[];
}

export interface TarotCardsResponse {
  cards: TarotCard[];
}