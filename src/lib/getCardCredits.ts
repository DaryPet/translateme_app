// import { supabase } from '@/lib/supabase/supabaseClient';

// export const getCardCredits = async (): Promise<number> => {
//   const {
//     data: { user },
//   } = await supabase.auth.getUser();
//   if (!user) return 0;

//   const { data, error } = await supabase
//     .from('card_credits')
//     .select('credits')
//     .eq('user_id', user.id)
//     .maybeSingle();

//   if (error) return 0;
//   return data?.credits || 0;
// };

// import { supabase } from '@/lib/supabase/supabaseClient';

// /**
//  * Получает кредиты пользователя.
//  * Если строки нет — создаёт с 0 и возвращает 0.
//  */
// export const getCardCredits = async (): Promise<number> => {
//   const {
//     data: { user },
//     error: userError,
//   } = await supabase.auth.getUser();

//   if (userError || !user) {
//     console.error('Ошибка получения пользователя:', userError);
//     return 0;
//   }

//   // Пробуем получить строку
//   let { data, error } = await supabase
//     .from('card_credits')
//     .select('credits')
//     .eq('user_id', user.id)
//     .maybeSingle();

//   if (error) {
//     console.error('Ошибка чтения credits:', error);
//     return 0;
//   }

//   // Если строки нет — создаём её с 0
//   if (!data) {
//     const { error: insertError } = await supabase.from('card_credits').insert({
//       user_id: user.id,
//       credits: 0,
//     });

//     if (insertError) {
//       console.error('Ошибка создания новой строки card_credits:', insertError);
//       return 0;
//     }

//     // Читаем снова
//     ({ data, error } = await supabase
//       .from('card_credits')
//       .select('credits')
//       .eq('user_id', user.id)
//       .maybeSingle());

//     if (error) {
//       console.error('Ошибка повторного чтения credits:', error);
//       return 0;
//     }
//   }

//   return data?.credits || 0;
// };

import { supabase } from 'src/lib/supabase/supabaseClient';

/**
 * Получает общее количество доступных карт пользователя (подписные + разовые).
 * Если строк нет — создаёт с 0 и возвращает 0.
 */
export const getCardCredits = async (): Promise<number> => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('Ошибка получения пользователя:', userError);
    return 0;
  }

  let totalCredits = 0;

  // --- 1. Получаем РАЗОВЫЕ карты из card_credits ---
  let { data: oneTimeCreditsData, error: oneTimeError } = await supabase
    .from('card_credits')
    .select('credits')
    .eq('user_id', user.id)
    .maybeSingle();

  if (oneTimeError) {
    console.error('Ошибка чтения разовых credits:', oneTimeError);
    // Продолжаем выполнение, чтобы попытаться получить подписные карты
  }

  // Если записи для разовых карт нет — создаём её с 0
  if (!oneTimeCreditsData) {
    const { error: insertError } = await supabase.from('card_credits').insert({
      user_id: user.id,
      credits: 0,
    });
    if (insertError) {
      console.error(
        'Ошибка при создании новой записи card_credits:',
        insertError,
      );
    }
    oneTimeCreditsData = { credits: 0 }; // Устанавливаем 0, так как только что создали
  }

  totalCredits += oneTimeCreditsData?.credits || 0;
  console.log(
    `Разовые карты (card_credits): ${oneTimeCreditsData?.credits || 0}`,
  );

  // --- 2. Получаем ПОДПИСНЫЕ карты из subscriptions ---
  let { data: subscriptionData, error: subscriptionError } = await supabase
    .from('subscriptions')
    .select('subscription_credits_remaining') // <-- Используем НОВОЕ поле
    .eq('user_id', user.id)
    .maybeSingle();

  if (subscriptionError) {
    console.error('Ошибка чтения подписных credits:', subscriptionError);
    // Продолжаем выполнение, чтобы вернуть хотя бы разовые карты, если есть
  }

  // Если записи подписки нет или нет данных о подписных картах, считаем 0
  totalCredits += subscriptionData?.subscription_credits_remaining || 0;
  console.log(
    `Подписные карты (subscriptions): ${subscriptionData?.subscription_credits_remaining || 0}`,
  );

  console.log(
    `Общее количество карт для пользователя ${user.id}: ${totalCredits}`,
  );
  return totalCredits;
};
