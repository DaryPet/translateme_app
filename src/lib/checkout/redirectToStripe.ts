// export const redirectToStripe = async (
//   count: number,
//   currency: string,
// ): Promise<void> => {
//   try {
//     const res = await fetch('/api/checkout', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       credentials: 'include', // ✅ ОБЯЗАТЕЛЬНО!
//       body: JSON.stringify({ quantity: count, currency }),
//     });

//     const data = await res.json();

//     if (data?.url) {
//       window.location.href = data.url;
//     } else {
//       console.error('Stripe URL not received:', data);
//       alert('Ошибка при создании Stripe-сессии.');
//     }
//   } catch (err) {
//     console.error('Ошибка запроса в Stripe:', err);
//     alert('Ошибка подключения к Stripe.');
//   }
// };

// файл: redirectToStripe.ts
'use client';

import { supabase } from '../supabase/supabaseClient';

export const redirectToStripe = async (count: number): Promise<void> => {
  // 1) Получаем текущую сессию (из localStorage)
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    alert('Пожалуйста, войдите перед покупкой.');
    return;
  }

  // 2) Делаем fetch с JWT в заголовке
  try {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // передаём access_token
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ quantity: count, currency: 'EUR' }),
    });

    const data = await res.json();
    // console.log('API /checkout ответ:', data);

    if (data.url) {
      window.location.href = data.url;
    } else {
      console.error('Stripe URL not received:', data);
      alert(`Ошибка при создании Stripe-сессии: ${data.error || 'unknown'}`);
    }
  } catch (err) {
    console.error('Ошибка запроса в Stripe:', err);
    alert('Ошибка подключения к Stripe.');
  }
};
