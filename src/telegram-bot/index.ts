import TelegramBot from 'node-telegram-bot-api';
import 'dotenv/config'; 
import { handleStartCommand, handleCallbackQuery, handleTarotCommand } from '../lib/tarot-bot/handlers';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error('Telegram Bot Token не найден в .env.local');
}
const bot = new TelegramBot(token, { polling: true });

// Регистрируем обработчики команд
// bot.onText(/\/start/, (msg) => handleStartCommand(bot, msg));
bot.onText(/\/start(.*)/, (msg, match) => {
  // match[1] - это и есть наш параметр ('paid', 'cancel' или пустота)
  const startParam = match ? (match[1] ? match[1].trim() : '') : '';
  handleStartCommand(bot, msg, startParam); // Передаем параметр в обработчик
});
bot.onText(/\/tarot/, (msg) => handleTarotCommand(bot, msg));

// Регистрируем обработчик для кнопок
bot.on('callback_query', (query) => handleCallbackQuery(bot, query));

console.log('Бот запущен...');