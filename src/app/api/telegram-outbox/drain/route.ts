import { NextResponse } from 'next/server';
import { supabaseAdmin } from 'src/lib/supabase/adminClient';
import TelegramBot from 'node-telegram-bot-api';
import { getTranslation } from 'src/lib/tarot-bot/i18n-loader';

const bot = new TelegramBot(process.env.TG_BOT_TOKEN!, { polling: false });

export async function POST() {
  try {
    // 1. Берём все новые события, которые ещё не отправлены
    const { data: events, error } = await supabaseAdmin
      .from('telegram_outbox')
      .select('id, user_id, created_at')
      .is('sent_at', null)
      .limit(50);

    if (error) {
      console.error('Ошибка при получении событий из telegram_outbox:', error);
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }

    if (!events || events.length === 0) {
      return NextResponse.json({ status: 'ok', message: 'Нет новых событий' });
    }

    for (const ev of events) {
      // 2. Находим пользователя и его чат
      const { data: user, error: userError } = await supabaseAdmin
        .from('telegram_users')
        .select('chat_id, language_code')
        .eq('user_id', ev.user_id)
        .maybeSingle();

      if (userError || !user?.chat_id) {
        console.error('Не найден пользователь для user_id:', ev.user_id, userError);
        continue;
      }

      const lang = user.language_code || 'ru';

      // 3. Текст уведомления
      const text = getTranslation(lang, 'bot.weekly_free_credits_awarded') 
        || 'Привет! Тебе начислены 5 бесплатных карт!';

      try {
        // 4. Отправляем сообщение в Telegram
        await bot.sendMessage(user.chat_id, text);

        // 5. Помечаем как отправленное
        await supabaseAdmin
          .from('telegram_outbox')
          .update({ sent_at: new Date().toISOString() })
          .eq('id', ev.id);
      } catch (e) {
        console.error('Ошибка при отправке в Telegram:', e);
      }
    }

    return NextResponse.json({ status: 'ok', sent: events.length });
  } catch (err) {
    console.error('Critical error in drain route:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
