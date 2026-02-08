import { supabase } from 'src/lib/supabase/supabaseClient';

export const addCardCredits = async (amount: number) => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error('Ошибка получения пользователя:', userError);
    return;
  }

  if (!user || amount <= 0) return;

  let { data, error } = await supabase
    .from('card_credits')
    .select('credits')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Ошибка чтения credits:', error);
    return;
  }

  // Если записи нет — создаём её с 0 кредитами
  if (!data) {
    const { error: insertError } = await supabase.from('card_credits').insert({
      user_id: user.id,
      credits: 0,
    });

    if (insertError) {
      console.error(
        'Ошибка при создании новой записи card_credits:',
        insertError,
      );
      return;
    }

    // Повторно читаем после вставки
    ({ data, error } = await supabase
      .from('card_credits')
      .select('credits')
      .eq('user_id', user.id)
      .maybeSingle());

    if (error) {
      console.error('Ошибка повторного чтения credits:', error);
      return;
    }
  }

  const current = data?.credits || 0;

  const { error: upsertError } = await supabase.from('card_credits').upsert({
    user_id: user.id,
    credits: current + amount,
  });

  if (upsertError) {
    console.error('Ошибка обновления credits:', upsertError);
  } else {
    console.log(`Кредиты обновлены: ${current} → ${current + amount}`);
  }
};
