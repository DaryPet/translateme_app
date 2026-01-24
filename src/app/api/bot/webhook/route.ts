

//TODO: changed for beautiful info after payment

import { NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';
import { 
  handleTarotCommand, 
  handleCallbackQuery, 
  handleQuestionResponse, 
  handleStartCommand 
} from '../../../../lib/tarot-bot/handlers';

const bot = new TelegramBot(process.env.TG_BOT_TOKEN!, { polling: false });

export async function POST(req: Request) {
  let update;
  try {
    update = await req.json();
  } catch (error) {
    console.error('Error parsing JSON from Telegram webhook:', error);
    return NextResponse.json({ 
      status: 'error', 
      error: 'Invalid JSON body from webhook' 
    }, { status: 400 });
  }

  try {
    if (update.message) {
      const messageText = update.message.text || ''; // На всякий случай, чтобы избежать ошибок
      const userId = update.message.from?.id;

      // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
      // +++ НАЧАЛО ИЗМЕНЕНИЙ
      // +++ Раньше было: if (messageText === '/start')
      // +++ Теперь мы проверяем, НАЧИНАЕТСЯ ли команда с /start.
      // +++ Это позволяет ловить команды вида "/start paid" или "/start cancel".
      if (messageText.startsWith('/start')) {
        
        // Разделяем команду на части по пробелу, чтобы получить параметр (например, "paid").
        const parts = messageText.split(' ');
        const startParam = parts.length > 1 ? parts[1] : ''; // Если есть что-то после /start, берем это.
        
        // Вызываем наш главный обработчик, передавая ему этот параметр.
        await handleStartCommand(bot, update.message, startParam);

      // +++ КОНЕЦ ИЗМЕНЕНИЙ
      // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

      } else if (messageText === '/tarot') {
        await handleTarotCommand(bot, update.message);
      } else {
        await handleQuestionResponse(bot, update.message);
      }
    } else if (update.callback_query) {
      await handleCallbackQuery(bot, update.callback_query);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ status: 'error', error: (error as Error).message }, { status: 500 });
  }
}

