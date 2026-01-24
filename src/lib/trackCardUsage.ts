// import { supabase } from '@/lib/supabase/supabaseClient';

// export const logCardUsage = async (): Promise<boolean> => {
//   const {
//     data: { user },
//     error: userError,
//   } = await supabase.auth.getUser();

//   if (userError || !user) {
//     console.error('User not authenticated', userError);
//     return false;
//   }

//   // 1. Получаем, сколько карт у юзера
//   const { data, error } = await supabase
//     .from('card_credits')
//     .select('credits')
//     .eq('user_id', user.id)
//     .single();

//   const credits = data?.credits || 0;

//   // 2. Если есть платные карты — списываем одну
//   if (credits > 0) {
//     const { error: updateError } = await supabase
//       .from('card_credits')
//       .update({ credits: credits - 1 })
//       .eq('user_id', user.id);

//     if (updateError) {
//       console.error('Failed to deduct credit:', updateError);
//       return false;
//     }

//     // Записываем usage
//     await supabase.from('card_usage').insert({
//       user_id: user.id,
//       used_count: 1,
//     });

//     return true;
//   }

//   // 3. Если нет кредитов, не даём использовать
//   console.warn('Нет платных карт!');
//   return false;
// };

// import { supabase } from '@/lib/supabase/supabaseClient';

// export const logCardUsage = async (): Promise<'free' | 'paid' | 'none'> => {
//   const {
//     data: { user },
//   } = await supabase.auth.getUser();
//   if (!user) return 'none';

//   // Получаем общее количество использованных карт
//   const { data: usage } = await supabase
//     .from('card_usage')
//     .select('used_count')
//     .eq('user_id', user.id);

//   const totalUsed = usage?.reduce((sum, row) => sum + row.used_count, 0) || 0;

//   if (totalUsed < 3) {
//     await supabase.from('card_usage').insert({
//       user_id: user.id,
//       used_count: 1,
//     });
//     return 'free';
//   }

//   // Проверяем наличие платных карт
//   const { data, error } = await supabase
//     .from('card_credits')
//     .select('credits')
//     .eq('user_id', user.id)
//     .single();

//   const credits = data?.credits || 0;

//   if (credits > 0) {
//     await supabase
//       .from('card_credits')
//       .update({ credits: credits - 1 })
//       .eq('user_id', user.id);

//     await supabase.from('card_usage').insert({
//       user_id: user.id,
//       used_count: 1,
//     });

//     return 'paid';
//   }

//   return 'none';
// };

// import { supabase } from '@/lib/supabase/supabaseClient';

// export const logCardUsage = async (): Promise<'free' | 'paid' | 'none'> => {
//   const {
//     data: { user },
//     error: userError,
//   } = await supabase.auth.getUser();

//   if (userError || !user) return 'none';

//   // Получаем общее количество использованных карт
//   const { data: usage } = await supabase
//     .from('card_usage')
//     .select('used_count')
//     .eq('user_id', user.id);

//   const totalUsed = usage?.reduce((sum, row) => sum + row.used_count, 0) || 0;

//   if (totalUsed < 3) {
//     await supabase.from('card_usage').insert({
//       user_id: user.id,
//       used_count: 1,
//     });
//     return 'free';
//   }

//   // Проверяем наличие платных карт
//   let { data, error } = await supabase
//     .from('card_credits')
//     .select('credits')
//     .eq('user_id', user.id)
//     .maybeSingle(); // ✅ заменено

//   if (error) {
//     console.error('Ошибка чтения card_credits:', error);
//     return 'none';
//   }

//   // Создаём строку, если её нет
//   if (!data) {
//     const { error: insertError } = await supabase.from('card_credits').insert({
//       user_id: user.id,
//       credits: 0,
//     });

//     if (insertError) {
//       console.error('Ошибка при создании строки card_credits:', insertError);
//       return 'none';
//     }

//     // читаем снова
//     ({ data, error } = await supabase
//       .from('card_credits')
//       .select('credits')
//       .eq('user_id', user.id)
//       .maybeSingle());

//     if (error) {
//       console.error('Ошибка повторного чтения:', error);
//       return 'none';
//     }
//   }

//   const credits = data?.credits || 0;

//   if (credits > 0) {
//     await supabase
//       .from('card_credits')
//       .update({ credits: credits - 1 })
//       .eq('user_id', user.id);

//     await supabase.from('card_usage').insert({
//       user_id: user.id,
//       used_count: 1,
//     });

//     return 'paid';
//   }

//   return 'none';
// };

import { supabase } from 'src/lib/supabase/supabaseClient';

export const logCardUsage = async (): Promise<'free' | 'paid' | 'none'> => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return 'none';

  // Получаем общее количество использованных карт
  const { data: usage } = await supabase
    .from('card_usage')
    .select('used_count')
    .eq('user_id', user.id);

  const totalUsed = usage?.reduce((sum, row) => sum + row.used_count, 0) || 0;

  if (totalUsed < 3) {
    await supabase.from('card_usage').insert({
      user_id: user.id,
      used_count: 1,
    });
    return 'free';
  }

  // Проверяем наличие платных карт
  let { data, error } = await supabase
    .from('card_credits')
    .select('credits')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Ошибка чтения card_credits:', error);
    return 'none';
  }

  // Создаём строку, если её нет
  if (!data) {
    const { error: insertError } = await supabase.from('card_credits').insert({
      user_id: user.id,
      credits: 0,
    });

    if (insertError) {
      console.error('Ошибка при создании строки card_credits:', insertError);
      return 'none';
    }

    // читаем снова
    ({ data, error } = await supabase
      .from('card_credits')
      .select('credits')
      .eq('user_id', user.id)
      .maybeSingle());

    if (error) {
      console.error('Ошибка повторного чтения:', error);
      return 'none';
    }
  }

  const credits = data?.credits || 0;

  if (credits > 0) {
    // <<< Вот сюда добавь обработку ошибки! >>>
    const { error: updateError } = await supabase
      .from('card_credits')
      .update({ credits: credits - 1 })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Ошибка при списании кредита:', updateError);
    }

    await supabase.from('card_usage').insert({
      user_id: user.id,
      used_count: 1,
    });

    return 'paid';
  }

  return 'none';
};
