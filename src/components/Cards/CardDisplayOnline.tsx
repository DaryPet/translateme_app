// import React from 'react';
// import { Card } from '@/hooks/useTarotAI';

// interface CardDisplayOnlineProps {
//   card: Card | null; // Обновляем тип для card
//   mode: 'version1' | 'version2' | 'offline' | null;
// }

// const CardDisplayOnline: React.FC<CardDisplayOnlineProps> = ({
//   card,
//   mode,
// }) => {
//   // Если карта не выбрана или в режиме офлайн, ничего не рендерим
//   if (mode === 'offline' || !card) {
//     return null; // Возвращаем null, если карта не выбрана или офлайн
//   }

//   // Если в режиме онлайн, показываем карту
//   return (
//     <div>
//       <img src={`/cards/${card.file}`} alt={card.name} />
//       <p>{card.name}</p>
//     </div>
//   );
// };

// export default CardDisplayOnline;

import React from 'react';
import Image from 'next/image';
import { Card } from 'src/hooks/useTarotAI';

interface CardDisplayOnlineProps {
  card: Card | null;
  mode: 'version1' | 'version2' | 'offline' | null;
}

const CardDisplayOnline: React.FC<CardDisplayOnlineProps> = ({
  card,
  mode,
}) => {
  if (mode === 'offline' || !card) {
    return null;
  }

  return (
    <div>
      <Image
        src={`/cards/${card.file}`}
        alt={card.name || 'Tarot card'}
        width={250}
        height={400}
        sizes="(max-width: 600px) 90vw, 300px"
        loading="lazy"
        style={{ objectFit: 'contain' }}
        priority={false}
      />
      <p>{card.name}</p>
    </div>
  );
};

export default CardDisplayOnline;
