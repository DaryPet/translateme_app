// // src/lib/tarot-bot/handlers.ts

// import TelegramBot from 'node-telegram-bot-api';
// import { getTarotReading, DeckVersion, askQuestion } from './service';
// import { getTranslation } from './i18n-loader';
// import { getSystemPrompt, getUserPrompt } from '../../utils/prompts';
// import fs from 'fs';
// import { supabaseAdmin } from '@/lib/supabase/adminClient';
// import { upsertTelegramUser } from '../tarot-bot/upsertTelegramUser';

// /* ======================= КРЕДИТЫ ======================= */

// const getSupabaseUserId = async (telegramId: number): Promise<string | null> => {
//   const { data: userRecord } = await supabaseAdmin
//     .from('telegram_users')
//     .select('user_id')
//     .eq('telegram_id', telegramId)
//     .maybeSingle<{ user_id: string }>();
//   return userRecord?.user_id ?? null;
// };

// export const getCardCredits = async (telegramId: number): Promise<number> => {
//   const supabaseUserId = await getSupabaseUserId(telegramId);
//   if (!supabaseUserId) return 0;

//   let totalCredits = 0;

//   try {
//     const { data: oneTimeCreditsCheck } = await supabaseAdmin
//       .from('card_credits')
//       .select('credits')
//       .eq('user_id', supabaseUserId)
//       .maybeSingle<{ credits: number | null }>();

//     const { data: subscriptionCheck } = await supabaseAdmin
//       .from('subscriptions')
//       .select('subscription_credits_remaining')
//       .eq('user_id', supabaseUserId)
//       .maybeSingle<{ subscription_credits_remaining: number | null }>();

//     if (!oneTimeCreditsCheck && !subscriptionCheck) {
//       await supabaseAdmin.from('card_credits').insert({ user_id: supabaseUserId, credits: 10 });
//       // console.log(`Выдано 4 стартовых кредита пользователю ${supabaseUserId}`);
//     }

//     const { data: oneTimeCreditsData } = await supabaseAdmin
//       .from('card_credits')
//       .select('credits')
//       .eq('user_id', supabaseUserId)
//       .maybeSingle<{ credits: number | null }>();

//     totalCredits += oneTimeCreditsData?.credits ?? 0;

//     const { data: subscriptionData } = await supabaseAdmin
//       .from('subscriptions')
//       .select('subscription_credits_remaining')
//       .eq('user_id', supabaseUserId)
//       .maybeSingle<{ subscription_credits_remaining: number | null }>();

//     totalCredits += subscriptionData?.subscription_credits_remaining ?? 0;

//     return totalCredits;
//   } catch (e) {
//     console.error('Error getting cards credits:', e);
//     return 0;
//   }
// };

// export const decrementCardCredits = async (telegramId: number): Promise<boolean> => {
//   const supabaseUserId = await getSupabaseUserId(telegramId);
//   if (!supabaseUserId) return false;

//   try {
//     const { data: subData } = await supabaseAdmin
//       .from('subscriptions')
//       .select('subscription_credits_remaining')
//       .eq('user_id', supabaseUserId)
//       .maybeSingle<{ subscription_credits_remaining: number | null }>();

//     const subRemaining = subData?.subscription_credits_remaining ?? 0;
//     if (subRemaining > 0) {
//       const { error } = await supabaseAdmin
//         .from('subscriptions')
//         .update({ subscription_credits_remaining: subRemaining - 1 })
//         .eq('user_id', supabaseUserId);
//       return !error;
//     }

//     const { data: oneTimeData } = await supabaseAdmin
//       .from('card_credits')
//       .select('credits')
//       .eq('user_id', supabaseUserId)
//       .maybeSingle<{ credits: number | null }>();

//     const oneTimeRemaining = oneTimeData?.credits ?? 0;
//     if (oneTimeRemaining > 0) {
//       const { error } = await supabaseAdmin
//         .from('card_credits')
//         .update({ credits: oneTimeRemaining - 1 })
//         .eq('user_id', supabaseUserId);
//       return !error;
//     }

//     return false;
//   } catch (e) {
//     console.error('Ошибка при списании кредитов (сервер):', e);
//     return false;
//   }
// };

// /* ======================= СОСТОЯНИЕ/УТИЛЫ ======================= */

// const userState = new Map<number, {
//   question: string;
//   deckVersion?: DeckVersion;
//   waitingForLanguage?: boolean;
//   lang?: string;
//   followUps?: string[];
//   lastCardTitle?: string;
//   waitingForCustomFU?: boolean;
// }>();

// function t(lang: string, key: string, fallback?: string) {
//   return getTranslation(lang, key) ?? fallback ?? key;
// }

// function toStrArray(v: unknown): string[] {
//   if (Array.isArray(v)) return v.map(String).filter(Boolean);
//   if (v == null) return [];
//   return [String(v)];
// }

// function safeParseJSON(input?: string | null) {
//   if (!input || !input.trim()) return null;
//   try { return JSON.parse(input); } catch { return null; }
// }


// export const handleStartCommand = async (bot: TelegramBot, msg: TelegramBot.Message, startParam: string) => {
//   const chatId = msg.chat.id;
//   const userId = msg.from?.id;
//   if (!userId) return;

//   // Сначала всегда обновляем данные о пользователе
//   await upsertTelegramUser({ message: msg });
  
//   // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//   // +++ НАЧАЛО ИЗМЕНЕНИЙ
//   // +++ Получаем язык пользователя из его состояния или из сообщения. 
//   // +++ 'ru' - язык по умолчанию.
//   const lang = userState.get(userId)?.lang || msg.from?.language_code || 'ru';
//   // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

//   // Проверяем, пришел ли пользователь после оплаты
//   if (startParam === 'paid') {
//     // Пользователь вернулся после успешной оплаты
    
//     const newBalance = await getCardCredits(userId);
    
//     // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//     // +++ Теперь мы берем текст из файла локализации
//     const successMessageTemplate = t(lang, 'bot.payment.success');
//     // +++ И заменяем {balance} на реальное значение
//     const successMessage = successMessageTemplate.replace('{balance}', String(newBalance));
//     // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    
//     // Отправляем сообщение с удобными кнопками
//     await bot.sendMessage(chatId, successMessage, {
//       reply_markup: {
//         inline_keyboard: [
//           // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//           // +++ Текст для кнопок теперь тоже берется из переводов
//           [{ text: t(lang, 'bot.payment.button_ask_new'), callback_data: 'start_tarot' }], 
//           [{ text: t(lang, 'bot.payment.button_check_balance'), callback_data: 'check_balance' }]
//           // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//         ]
//       }
//     });

//   } else if (startParam === 'cancel') {
//     // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//     // +++ Сообщение об отмене теперь тоже переводится
//     await bot.sendMessage(chatId, t(lang, 'bot.payment.cancelled'));
//     // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  
//   } else {
//     // Это стандартный вызов /start без параметров (как было раньше)
//     userState.set(userId, { question: '', waitingForLanguage: true });

//     await bot.sendMessage(chatId, "Please choose your language:", {
//       reply_markup: {
//         inline_keyboard: [
//           [{ text: "English", callback_data: "set_lang_en" }],
//           [{ text: "Русский", callback_data: "set_lang_ru" }],
//           [{ text: "Українська", callback_data: "set_lang_uk" }],
//           [{ text: "Español", callback_data: "set_lang_es" }],
//         ],
//       },
//     });
//   }
// };

// export const handleLanguageSelection = async (bot: TelegramBot, query: TelegramBot.CallbackQuery) => {
//   const userId = query.from.id;
//   const chatId = query.message?.chat.id;
//   if (!userId || !chatId) return;

//   const langCode = query.data?.replace('set_lang_', '');
//   const state = userState.get(userId);

// //   if (state?.waitingForLanguage && langCode) {
// //     try {
// //       await bot.editMessageText(
// //         t(langCode, 'bot.start.welcome', 'Welcome!'),
// //         {
// //           chat_id: chatId,
// //           message_id: query.message?.message_id,
// //           reply_markup: {
// //             inline_keyboard: [
// //               [{ text: t(langCode, 'bot.start.ask_tarot', 'Ask your question'), callback_data: "start_tarot" }],
// //             ],
// //           },
// //         }
// //       );
// //     } catch (e) {
// //       console.error("Failed to edit message:", e);
// //     }

// //     userState.set(userId, { question: '', lang: langCode });
// //     await bot.answerCallbackQuery(query.id);
// //   }
// // };
//   if (langCode) {
//     try {
//       await bot.editMessageText(
//         t(langCode, 'bot.start.welcome', 'Welcome!'),
//         {
//           chat_id: chatId,
//           message_id: query.message?.message_id,
//           reply_markup: {
//             inline_keyboard: [
//               [{ text: t(langCode, 'bot.start.ask_tarot', 'Ask your question'), callback_data: "start_tarot" }],
//                [{ text: t(langCode, 'bot.buttons.check_balance', 'Check Balance'), callback_data: "check_balance" }]
//             ],
//           },
//         }
//       );
//     } catch (e) {
//       console.error("Failed to edit message:", e);
//     }

//     userState.set(userId, { ...(state ?? { question: '' }), lang: langCode, waitingForLanguage: false }); // %%%%%%%%%%%%%%%%%%% ИЗМЕНЕНО
//     await bot.answerCallbackQuery(query.id);
//   }
// };


// // export const handleTarotCommand = async (bot: TelegramBot, msg: TelegramBot.Message,) => {
// //   const chatId = msg.chat.id;
// //   const userId = msg.from?.id;
// //   if (!userId) return;

// //   await upsertTelegramUser({ message: msg });

// //   const lang = userState.get(userId)?.lang || msg.from?.language_code || 'ru';
// //   userState.set(userId, { ...(userState.get(userId) ?? { question: '' }), lang });

// //   await bot.sendMessage(
// //     chatId,
// //     t(lang, 'bot.enter_question', 'Please, enter your question'),
// //     { reply_markup: { force_reply: true, selective: true } }
// //   );
// // };

// export const handleTarotCommand = async (bot: TelegramBot, msg: TelegramBot.Message) => {
//   const chatId = msg.chat.id;
//   const userId = msg.from?.id;
//   if (!userId) return;

//   // Обновляем данные пользователя, как и раньше
//   await upsertTelegramUser({ message: msg });

//   // --- НАЧАЛО ИСПРАВЛЕНИЯ ---

//   // 1. Просто и надежно получаем состояние пользователя
//   const state = userState.get(userId);
  
//   // 2. Берем язык из этого состояния. Если его там нет, используем русский как запасной.
//   const lang = state?.lang || 'ru';
  
//   // Мы больше НЕ используем опасную строчку userState.set(...), которая все ломала.

//   // --- КОНЕЦ ИСПРАВЛЕНИЯ ---

//   // Отправляем сообщение на правильном языке
//   await bot.sendMessage(
//     chatId,
//     t(lang, 'bot.enter_question', 'Please, enter your question'),
//     { reply_markup: { force_reply: true, selective: true } }
//   );
// };

// export const handleQuestionResponse = async (bot: TelegramBot, msg: TelegramBot.Message) => {
//   const chatId = msg.chat.id;
//   const userId = msg.from?.id;
//   const userQuestion = msg.text?.trim();
//   if (!userId || !userQuestion) return;

//   const state = userState.get(userId);

//   // Пользовательский follow-up
//   if (state?.waitingForCustomFU) {
//     const lang = state.lang || msg.from?.language_code || 'ru';
//     userState.set(userId, { ...state, waitingForCustomFU: false });

//     const telegramId = msg.from?.id;
//     if (!telegramId) return;

//     const creditsRemaining = await getCardCredits(telegramId);
//     if (creditsRemaining <= 0) {
//       await bot.sendMessage(chatId, t(lang, 'bot.subscription_needed', 'У вас закончились кредиты. Пожалуйста, оформите подписку.'));
//       await sendPurchaseOptions(bot, chatId, lang);
//       return;
//     }

//     const loaderMsg = await bot.sendMessage(chatId, t(lang, 'bot.loading.reading', '🔮 Провожу гадание...'));

//     try {
//       const reading = await getTarotReading(userQuestion, lang, state.deckVersion!);
//       try { await bot.deleteMessage(chatId, loaderMsg.message_id); } catch {}

//       await sendTarotReading(bot, chatId, reading, lang);

//       const success = await decrementCardCredits(telegramId);
//       if (!success) {
//         bot.sendMessage(chatId, t(lang, 'bot.error_decreasing_credits', 'Ошибка при списании кредита. Пожалуйста, попробуйте еще раз.'));
//         return;
//       }

//       await sendFollowUpOptions(bot, chatId, userId, state, reading);

//     } catch (err) {
//       console.error('Custom FU error:', err);
//       await bot.sendMessage(chatId, t(state?.lang || 'ru', 'bot.general.error_message', 'An error occurred. Please try again.'));
//     }
//     return;
//   }

//   // if (!state || state.deckVersion) return;

//   const currentState = state ?? { question: '' };
//   if (currentState.deckVersion) return;

//   const sanitizedQuestion = userQuestion.substring(0, 250);
//   // userState.set(userId, { ...state, question: sanitizedQuestion });

//   const lang = currentState.lang || msg.from?.language_code || 'ru';

//   userState.set(userId, { ...currentState, question: sanitizedQuestion, lang });

//   const systemPrompt = getSystemPrompt(lang) + `\n\nОтвечай только на языке ${lang}.`;
//   const userPrompt = getUserPrompt({ question: sanitizedQuestion, type: 'prepare', lang });
//   const greeting = await askQuestion([{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }]);

//   await bot.sendMessage(
//     chatId,
//     `${greeting}\n\n${t(lang, 'bot.choose_deck', 'Choose a deck')}`,
//     {
//       reply_markup: {
//         inline_keyboard: [
//           [{ text: t(lang, 'bot.deck_version1', 'Classic'), callback_data: 'tarot_deck_version1' }],
//           [{ text: t(lang, 'bot.deck_version2', 'Modern'),  callback_data: 'tarot_deck_version2' }],
//         ],
//       },
//     }
//   );
// };

// /* ======================= CALLBACKS ======================= */

// export const handleCallbackQuery = async (bot: TelegramBot, query: TelegramBot.CallbackQuery) => {
//   const chatId = query.message?.chat.id;
//   const userId = query.from.id;
//   const data = query.data;

//   if (!chatId || !userId || !data) return;

//   await upsertTelegramUser({ callback_query: query });
//   if (data.startsWith('set_lang_')) {
//     await handleLanguageSelection(bot, query);
//     return;
//   }
//   const state = userState.get(userId);
//   const lang = state?.lang || query.from.language_code || 'ru';

//   if (state?.waitingForLanguage) {
//     await handleLanguageSelection(bot, query);
//     return;
//   }

//   // Кнопки покупки
//   if (data.startsWith('buy_')) {
//     await handleBuyCommand(bot, query);
//     return;
//   }

//   switch (data) {
//     case 'check_balance': {
//       await bot.answerCallbackQuery(query.id);
//       const credits = await getCardCredits(userId);
//       await bot.sendMessage(chatId, `${t(lang, 'bot.balance', 'Ваш баланс')}: ${credits}`);
//       return;
//     }
//     case 'fu_custom': {
//       await bot.answerCallbackQuery(query.id);
//       const st = userState.get(userId);
//       if (!st) {
//         await bot.sendMessage(chatId, t(lang, 'bot.general.error_message', 'Start with /tarot.'));
//         return;
//       }
//       await bot.sendMessage(
//         chatId,
//         t(lang, 'bot.custom_follow_up', 'Ask your own follow-up question'),
//         { reply_markup: { force_reply: true, selective: true } }
//       );
//       userState.set(userId, { ...st, waitingForCustomFU: true });
//       return;
//     }
//     case 'restart': {
//       await bot.answerCallbackQuery(query.id);
//       userState.delete(userId);
//       const mockMessage: TelegramBot.Message = {
//         message_id: 0,
//         chat: { id: chatId, type: 'private' },
//         date: Date.now(),
//         from: { id: userId, is_bot: false, first_name: 'User' }
//       };
//       await handleStartCommand(bot, mockMessage, '');
//       return;
//     }
//     case 'start_tarot': {
//       // %%%%%%%%%%%%% ИЗМЕНИЛ ЗДЕСЬ!
//       // Раньше было: await handleTarotCommand(bot, query.message)
//       // Там msg.from указывал на БОТА => язык падал на 'ru'.
//       // Теперь формируем "мок"-сообщение, где from = сам пользователь (query.from)
//       await bot.answerCallbackQuery(query.id); // (на всякий случай)
//       if (query.message) {
//         const mockMessage: TelegramBot.Message = {
//           message_id: query.message.message_id,
//           chat: query.message.chat,
//           date: query.message.date,
//           from: {
//             id: query.from.id,
//             is_bot: false,
//             first_name: query.from.first_name || 'User',
//             last_name: (query.from as any).last_name,
//             username: (query.from as any).username,
//             language_code: (query.from as any).language_code,
//           },
//         };
//         await handleTarotCommand(bot, mockMessage);
//       }
//       return;
//       // %%%%%%%%%%%%% ИЗМЕНИЛ ЗДЕСЬ!
//     }
//     case 'tarot_draw': {
//       if (!state?.deckVersion) {
//         await bot.answerCallbackQuery(query.id, { text: 'Пожалуйста, сначала выберите колоду.' });
//         return;
//       }

//       const telegramId = query.from.id;
//       if (!telegramId) return;

//       const creditsRemaining = await getCardCredits(telegramId);
//       if (creditsRemaining <= 0) {
//         await bot.answerCallbackQuery(query.id, { text: t(lang, 'bot.subscription_needed', 'У вас закончились кредиты. Пожалуйста, оформите подписку.') });
//         await bot.sendMessage(chatId, t(lang, 'bot.subscription_needed', 'У вас закончились кредиты. Пожалуйста, оформите подписку.'));
//         await sendPurchaseOptions(bot, chatId, lang);
//         return;
//       }

//       await bot.answerCallbackQuery(query.id);
//       const loaderMsg = await bot.sendMessage(chatId, t(lang, 'bot.loading.reading', '🔮 Провожу гадание...'));

//       try {
//         const reading = await getTarotReading(state.question, lang, state.deckVersion);
//         try { await bot.deleteMessage(chatId, loaderMsg.message_id); } catch {}

//         await sendTarotReading(bot, chatId, reading, lang);

//         const success = await decrementCardCredits(telegramId);
//         if (!success) {
//           bot.sendMessage(chatId, t(lang, 'bot.error_decreasing_credits', 'Ошибка при списании кредита. Пожалуйста, попробуйте еще раз.'));
//           return;
//         }

//         await sendFollowUpOptions(bot, chatId, userId, state, reading);

//       } catch (error) {
//         console.error('Ошибка в обработчике /tarot:', error);
//         await bot.sendMessage(chatId, t(lang, 'bot.general.error_message', 'An error occurred. Please try again.'));
//       }
//       return;
//     }
//     default: {
//       if (data.startsWith('fu:')) {
//         const idx = Number(data.split(':')[1] ?? -1);
//         const st = userState.get(userId);
//         await bot.answerCallbackQuery(query.id);

//         if (!st || !st.followUps || typeof st.followUps[idx] !== 'string') {
//           await bot.sendMessage(chatId, t(lang, 'bot.general.error_message', 'No suggested question. Start with /tarot.'));
//           return;
//         }

//         const followUpQuestion = st.followUps[idx].trim();
//         const telegramId = query.from.id;
//         if (!telegramId) return;

//         const creditsRemaining = await getCardCredits(telegramId);
//         if (creditsRemaining <= 0) {
//           await bot.sendMessage(chatId, t(lang, 'bot.subscription_needed', 'У вас закончились кредиты. Пожалуйста, оформите подписку.'));
//           await sendPurchaseOptions(bot, chatId, lang);
//           return;
//         }

//         const loaderMsg = await bot.sendMessage(chatId, t(lang, 'bot.loading.reading', '🔮 Провожу гадание...'));

//         try {
//           const reading = await getTarotReading(followUpQuestion, lang, st.deckVersion!);
//           try { await bot.deleteMessage(chatId, loaderMsg.message_id); } catch {}

//           await sendTarotReading(bot, chatId, reading, lang);

//           const success = await decrementCardCredits(telegramId);
//           if (!success) {
//             bot.sendMessage(chatId, t(lang, 'bot.error_decreasing_credits', 'Ошибка при списании кредита. Пожалуйста, попробуйте еще раз.'));
//             return;
//           }

//           await sendFollowUpOptions(bot, chatId, userId, st, reading);

//         } catch (e) {
//           console.error('Follow-up error:', e);
//           await bot.sendMessage(chatId, t(lang, 'bot.general.error_message', 'An error occurred. Please try again.'));
//         }
//         return;
//       }
//       if (data.startsWith('tarot_deck_')) {
//         const deckVersion = data.replace('tarot_deck_', '') as DeckVersion;
//         const st = userState.get(userId);
//         if (!st) {
//           await bot.answerCallbackQuery(query.id, { text: 'Начните с команды /tarot' });
//           return;
//         }
//         userState.set(userId, { ...st, deckVersion });

//         await bot.sendMessage(
//           chatId,
//           t(lang, 'bot.deck_chosen', 'Deck selected'),
//           {
//             reply_markup: {
//               inline_keyboard: [
//                 [{ text: t(lang, 'bot.draw_card', 'Draw a card'), callback_data: 'tarot_draw' }],
//               ],
//             },
//           }
//         );
//         await bot.answerCallbackQuery(query.id);
//         return;
//       }
//     }
//   }
// };

// /* ======================= ОТПРАВКИ ======================= */

// const sendPurchaseOptions = async (bot: TelegramBot, chatId: number, lang: string) => {
//   await bot.sendMessage(chatId, t(lang, 'bot.purchase.prompt', 'Выберите способ пополнения баланса:'), {
//     reply_markup: {
//       inline_keyboard: [
//         [{ text: t(lang, 'bot.purchase.options.one_time_10', '10 карт (разово)'),  callback_data: 'buy_one_time_10' }],
//         [{ text: t(lang, 'bot.purchase.options.one_time_100', '100 карт (разово)'), callback_data: 'buy_one_time_100' }],
//         [{ text: t(lang, 'bot.purchase.options.subscription_medium', 'Подписка Medium'),  callback_data: 'buy_subscription_medium' }],
//         [{ text: t(lang, 'bot.purchase.options.subscription_premium', 'Подписка Premium'), callback_data: 'buy_subscription_premium' }]
//       ],
//     },
//   });
// };

// const sendTarotReading = async (bot: TelegramBot, chatId: number, reading: any, lang: string) => {
//   await bot.sendPhoto(
//     chatId,
//     fs.createReadStream(reading.cardImagePath),
//     { caption: `<b>${reading.cardTitle}</b>`, parse_mode: 'HTML' }
//   );
//   await bot.sendMessage(chatId, reading.interpretation, { parse_mode: 'HTML' });
//   const tips = toStrArray(reading?.tips);
//   if (tips.length) {
//     const tipsBlock =
//       `<b>${t(lang, 'bot.tarot.tips_title', 'Guidance')}:</b>\n` +
//       tips.map((tip: string) => `• ${tip}`).join('\n');
//     await bot.sendMessage(chatId, tipsBlock, { parse_mode: 'HTML' });
//   }
// };

// const sendFollowUpOptions = async (bot: TelegramBot, chatId: number, userId: number, state: any, reading: any) => {
//   const followUps = toStrArray(reading?.followUps);
//   userState.set(userId, { ...state, followUps, lastCardTitle: reading.cardTitle });
//   const buttons: TelegramBot.InlineKeyboardButton[][] = [];
//   followUps.slice(0, 5).forEach((q, i) => {
//     buttons.push([{ text: q, callback_data: `fu:${i}` }]);
//   });
//   const lang = state.lang || 'ru';
//   buttons.push([{ text: t(lang, 'bot.custom_follow_up', 'Ask your own follow-up'), callback_data: 'fu_custom' }]);
//   buttons.push([{ text: t(lang, 'bot.restart', 'Start over'), callback_data: 'restart' }]);
//   await bot.sendMessage(chatId, t(lang, 'bot.tarot.follow_ups_title', 'Path to deeper truth'), {
//     reply_markup: { inline_keyboard: buttons },
//   });
// };

// /* ======================= ОПЛАТА (POST с редиректами + безопасный JSON) ======================= */

// async function postWithRedirect(u: string, body: any) {
//   let resp = await fetch(u, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     redirect: 'manual', // не превращать POST в GET на 301/302
//     body: JSON.stringify(body),
//   });
//   if ([301, 302, 303, 307, 308].includes(resp.status)) {
//     const loc = resp.headers.get('location');
//     if (loc) {
//       const nextUrl = loc.startsWith('http') ? loc : new URL(loc, u).toString();
//       resp = await fetch(nextUrl, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(body),
//       });
//     }
//   }
//   return resp;
// }

// const handleBuyCommand = async (bot: TelegramBot, query: TelegramBot.CallbackQuery) => {
//   const chatId = query.message?.chat.id;
//   const userId = query.from.id;
//   const data = query.data;
//   if (!chatId || !userId || !data) return;

//   await bot.answerCallbackQuery(query.id);

//   const lang = userState.get(userId)?.lang || query.from.language_code || 'ru';
//   const loaderMsg = await bot.sendMessage(chatId, t(lang, 'bot.loading_payment', '🛒 Готовлю страницу оплаты...'));

//   try {
//     let type: string = 'one_time';
//     let quantity: number | undefined;
//     const currency = 'EURO';

//     if (data === 'buy_subscription_medium') type = 'subscription_medium';
//     else if (data === 'buy_subscription_premium') type = 'subscription_premium';
//     else if (data === 'buy_one_time_10') { type = 'one_time'; quantity = 10; }
//     else if (data === 'buy_one_time_100') { type = 'one_time'; quantity = 100; }

//     const baseUrl = process.env.NEXT_PUBLIC_DOMAIN!;
//     const url = `${baseUrl}/api/telegram-checkout`;
//     const payload = { type, quantity, telegram_id: userId, secret: process.env.BOT_API_SECRET, currency };

//     const response = await postWithRedirect(url, payload);
//     const raw = await response.text();
//     const result = safeParseJSON(raw);

//     try { await bot.deleteMessage(chatId, loaderMsg.message_id); } catch {}

//     if (!response.ok) {
//       await bot.sendMessage(chatId, (result as any)?.error || t(lang, 'bot.payment_error', 'Произошла ошибка при создании сессии оплаты.'));
//       return;
//     }

//     if ((result as any)?.url) {
//       await bot.sendMessage(chatId, t(lang, 'bot.checkout_url', 'Перейдите по ссылке для завершения оплаты:'), {
//         reply_markup: {
//           inline_keyboard: [[{ text: t(lang, 'bot.pay_button', 'Оплатить'), url: (result as any).url }]],
//         },
//       });
//     } else if ((result as any)?.message) {
//       await bot.sendMessage(chatId, (result as any).message);
//     } else {
//       await bot.sendMessage(chatId, t(lang, 'bot.payment_error', 'Ответ сервера не распознан. Попробуйте позже.'));
//     }

//   } catch (error) {
//     try { await bot.deleteMessage(chatId, loaderMsg.message_id); } catch {}
//     await bot.sendMessage(chatId, t(lang, 'bot.payment_error', 'Произошла ошибка при создании сессии оплаты.'));
//   }
// };

// /* ======================= ЭКСПОРТ ======================= */

// export {
//   sendPurchaseOptions, 
// };



// src/lib/tarot-bot/handlers.ts

import TelegramBot from 'node-telegram-bot-api';
import { getTarotReading, DeckVersion, askQuestion } from './service';
import { getTranslation } from './i18n-loader';
import { getSystemPrompt, getUserPrompt } from '../../utils/prompts';
import fs from 'fs';
import { supabaseAdmin } from 'src/lib/supabase/adminClient';
import { upsertTelegramUser } from './upsertTelegramUser';

/* ======================= КРЕДИТЫ ======================= */

const getSupabaseUserId = async (telegramId: number): Promise<string | null> => {
  const { data: userRecord } = await supabaseAdmin
    .from('telegram_users')
    .select('user_id')
    .eq('telegram_id', telegramId)
    .maybeSingle<{ user_id: string }>();
  return userRecord?.user_id ?? null;
};

export const getCardCredits = async (telegramId: number): Promise<number> => {
  const supabaseUserId = await getSupabaseUserId(telegramId);
  if (!supabaseUserId) return 0;

  let totalCredits = 0;

  try {
    const { data: oneTimeCreditsCheck } = await supabaseAdmin
      .from('card_credits')
      .select('credits')
      .eq('user_id', supabaseUserId)
      .maybeSingle<{ credits: number | null }>();

    const { data: subscriptionCheck } = await supabaseAdmin
      .from('subscriptions')
      .select('subscription_credits_remaining')
      .eq('user_id', supabaseUserId)
      .maybeSingle<{ subscription_credits_remaining: number | null }>();

    if (!oneTimeCreditsCheck && !subscriptionCheck) {
      await supabaseAdmin.from('card_credits').insert({ user_id: supabaseUserId, credits: 10 });
      // console.log(`Выдано 4 стартовых кредита пользователю ${supabaseUserId}`);
    }

    const { data: oneTimeCreditsData } = await supabaseAdmin
      .from('card_credits')
      .select('credits')
      .eq('user_id', supabaseUserId)
      .maybeSingle<{ credits: number | null }>();

    totalCredits += oneTimeCreditsData?.credits ?? 0;

    const { data: subscriptionData } = await supabaseAdmin
      .from('subscriptions')
      .select('subscription_credits_remaining')
      .eq('user_id', supabaseUserId)
      .maybeSingle<{ subscription_credits_remaining: number | null }>();

    totalCredits += subscriptionData?.subscription_credits_remaining ?? 0;

    return totalCredits;
  } catch (e) {
    console.error('Error getting cards credits:', e);
    return 0;
  }
};

export const decrementCardCredits = async (telegramId: number): Promise<boolean> => {
  const supabaseUserId = await getSupabaseUserId(telegramId);
  if (!supabaseUserId) return false;

  try {
    const { data: subData } = await supabaseAdmin
      .from('subscriptions')
      .select('subscription_credits_remaining')
      .eq('user_id', supabaseUserId)
      .maybeSingle<{ subscription_credits_remaining: number | null }>();

    const subRemaining = subData?.subscription_credits_remaining ?? 0;
    if (subRemaining > 0) {
      const { error } = await supabaseAdmin
        .from('subscriptions')
        .update({ subscription_credits_remaining: subRemaining - 1 })
        .eq('user_id', supabaseUserId);
      return !error;
    }

    const { data: oneTimeData } = await supabaseAdmin
      .from('card_credits')
      .select('credits')
      .eq('user_id', supabaseUserId)
      .maybeSingle<{ credits: number | null }>();

    const oneTimeRemaining = oneTimeData?.credits ?? 0;
    if (oneTimeRemaining > 0) {
      const { error } = await supabaseAdmin
        .from('card_credits')
        .update({ credits: oneTimeRemaining - 1 })
        .eq('user_id', supabaseUserId);
      return !error;
    }

    return false;
  } catch (e) {
    console.error('Ошибка при списании кредитов (сервер):', e);
    return false;
  }
};

/* ======================= СОСТОЯНИЕ/УТИЛЫ ======================= */

const userState = new Map<number, {
  question: string;
  deckVersion?: DeckVersion;
  waitingForLanguage?: boolean;
  lang?: string;
  followUps?: string[];
  lastCardTitle?: string;
  waitingForCustomFU?: boolean;
}>();

function t(lang: string, key: string, fallback?: string) {
  return getTranslation(lang, key) ?? fallback ?? key;
}

function toStrArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (v == null) return [];
  return [String(v)];
}

function safeParseJSON(input?: string | null) {
  if (!input || !input.trim()) return null;
  try { return JSON.parse(input); } catch { return null; }
}

export const handleStartCommand = async (bot: TelegramBot, msg: TelegramBot.Message, startParam: string) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id;
  if (!userId) return;

  // Сначала всегда обновляем данные о пользователе
  await upsertTelegramUser({ message: msg });
  // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  // +++ НАЧАЛО ИЗМЕНЕНИЙ
  // +++ Получаем язык пользователя из его состояния или из сообщения.
  // +++ 'ru' - язык по умолчанию.
  const lang = userState.get(userId)?.lang || msg.from?.language_code || 'ru';
  // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

  // Проверяем, пришел ли пользователь после оплаты
  if (startParam === 'paid') {
    // Пользователь вернулся после успешной оплаты
    const newBalance = await getCardCredits(userId);
    // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    // +++ Теперь мы берем текст из файла локализации
    const successMessageTemplate = t(lang, 'bot.payment.success');
    // +++ И заменяем {balance} на реальное значение
    const successMessage = successMessageTemplate.replace('{balance}', String(newBalance));
    // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    // Отправляем сообщение с удобными кнопками
    await bot.sendMessage(chatId, successMessage, {
      reply_markup: {
        inline_keyboard: [
          // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
          // +++ Текст для кнопок теперь тоже берется из переводов
          [{ text: t(lang, 'bot.payment.button_ask_new', 'Ask new question'), callback_data: 'start_tarot' }],
          [{ text: t(lang, 'bot.payment.button_check_balance', 'Check balance'), callback_data: 'check_balance' }]
          // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
        ]
      }
    });

  } else if (startParam === 'cancel') {
    // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    // +++ Сообщение об отмене теперь тоже переводится
    await bot.sendMessage(chatId, t(lang, 'bot.payment.cancelled'));
    // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  } else {
    // Это стандартный вызов /start без параметров (как было раньше)
    userState.set(userId, { question: '', waitingForLanguage: true });

    await bot.sendMessage(chatId, "Please choose your language:", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "English", callback_data: "set_lang_en" }],
          [{ text: "Русский", callback_data: "set_lang_ru" }],
          [{ text: "Українська", callback_data: "set_lang_uk" }],
          [{ text: "Español", callback_data: "set_lang_es" }],
        ],
      },
    });
  }
};

export const handleLanguageSelection = async (bot: TelegramBot, query: TelegramBot.CallbackQuery) => {
  const userId = query.from.id;
  const chatId = query.message?.chat.id;
  if (!userId || !chatId) return;

  const langCode = query.data?.replace('set_lang_', '');
  const state = userState.get(userId);

  if (langCode) {
    try {
      await bot.editMessageText(
        t(langCode, 'bot.start.welcome', 'Welcome!'),
        {
          chat_id: chatId,
          message_id: query.message?.message_id,
          reply_markup: {
            inline_keyboard: [
              [{ text: t(langCode, 'bot.start.ask_tarot', 'Ask your question'), callback_data: "start_tarot" }],
              [{ text: t(langCode, 'bot.buttons.check_balance', 'Check Balance'), callback_data: "check_balance" }]
            ],
          },
        }
      );
    } catch (e) {
      console.error("Failed to edit message:", e);
    }

    userState.set(userId, { ...(state ?? { question: '' }), lang: langCode, waitingForLanguage: false }); // %%%%%%%%%%%%%%%%%%% ИЗМЕНЕНО
    await supabaseAdmin
  .from('telegram_users')
  .update({ state: { lang: langCode } })
  .eq('telegram_id', userId);
    await bot.answerCallbackQuery(query.id);
  }
};

export const handleTarotCommand = async (bot: TelegramBot, msg: TelegramBot.Message) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id;
  if (!userId) return;

  // Обновляем данные пользователя, как и раньше
  await upsertTelegramUser({ message: msg });

  // --- НАЧАЛО ИСПРАВЛЕНИЯ ---
  const state = userState.get(userId);
  const lang = state?.lang || 'ru';
  // --- КОНЕЦ ИСПРАВЛЕНИЯ ---

  // Отправляем сообщение на правильном языке
  await bot.sendMessage(
    chatId,
    t(lang, 'bot.enter_question', 'Please, enter your question'),
    { reply_markup: { force_reply: true, selective: true } }
  );
};

export const handleQuestionResponse = async (bot: TelegramBot, msg: TelegramBot.Message) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id;
  const userQuestion = msg.text?.trim();
  if (!userId || !userQuestion) return;

  const state = userState.get(userId);

  // Пользовательский follow-up
  if (state?.waitingForCustomFU) {
    const lang = state.lang || msg.from?.language_code || 'ru';
    userState.set(userId, { ...state, waitingForCustomFU: false });

    const telegramId = msg.from?.id;
    if (!telegramId) return;

    const creditsRemaining = await getCardCredits(telegramId);
    if (creditsRemaining <= 0) {
      await bot.sendMessage(chatId, t(lang, 'bot.subscription_needed', 'У вас закончились кредиты. Пожалуйста, оформите подписку.'));
      await sendPurchaseOptions(bot, chatId, lang);
      return;
    }

    const loaderMsg = await bot.sendMessage(chatId, t(lang, 'bot.loading.reading', '🔮 Провожу гадание...'));

    try {
      const reading = await getTarotReading(userQuestion, lang, state.deckVersion!);
      try { await bot.deleteMessage(chatId, loaderMsg.message_id); } catch {}

      await sendTarotReading(bot, chatId, reading, lang);

      const success = await decrementCardCredits(telegramId);
      if (!success) {
        bot.sendMessage(chatId, t(lang, 'bot.error_decreasing_credits', 'Ошибка при списании кредита. Пожалуйста, попробуйте еще раз.'));
        return;
      }

      await sendFollowUpOptions(bot, chatId, userId, state, reading);

    } catch (err) {
      console.error('Custom FU error:', err);
      await bot.sendMessage(chatId, t(state?.lang || 'ru', 'bot.general.error_message', 'An error occurred. Please try again.'));
    }
    return;
  }

  const currentState = state ?? { question: '' };
  if (currentState.deckVersion) return;

  const sanitizedQuestion = userQuestion.substring(0, 250);

  const lang = currentState.lang || msg.from?.language_code || 'ru';

  userState.set(userId, { ...currentState, question: sanitizedQuestion, lang });
  await supabaseAdmin
  .from('telegram_users')
  .update({ state: { lang } })
  .eq('telegram_id', userId);

  const systemPrompt = getSystemPrompt(lang) + `\n\nОтвечай только на языке ${lang}.`;
  const userPrompt = getUserPrompt({ question: sanitizedQuestion, type: 'prepare', lang });
  const greeting = await askQuestion([{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }]);

  await bot.sendMessage(
    chatId,
    `${greeting}\n\n${t(lang, 'bot.choose_deck', 'Choose a deck')}`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: t(lang, 'bot.deck_version1', 'Classic'), callback_data: 'tarot_deck_version1' }],
          [{ text: t(lang, 'bot.deck_version2', 'Modern'), callback_data: 'tarot_deck_version2' }],
        ],
      },
    }
  );
};

/* ======================= CALLBACKS ======================= */

export const handleCallbackQuery = async (bot: TelegramBot, query: TelegramBot.CallbackQuery) => {
  const chatId = query.message?.chat.id;
  const userId = query.from.id;
  const data = query.data;

  if (!chatId || !userId || !data) return;

  await upsertTelegramUser({ callback_query: query });
  if (data.startsWith('set_lang_')) {
    await handleLanguageSelection(bot, query);
    return;
  }
  const state = userState.get(userId);
  const lang = state?.lang || query.from.language_code || 'ru';

  if (state?.waitingForLanguage) {
    await handleLanguageSelection(bot, query);
    return;
  }

  // Кнопки покупки
  if (data.startsWith('buy_')) {
    await handleBuyCommand(bot, query);
    return;
  }

  switch (data) {
    case 'check_balance': {
      await bot.answerCallbackQuery(query.id);
      const credits = await getCardCredits(userId);
      await bot.sendMessage(chatId, `${t(lang, 'bot.balance', 'Ваш баланс')}: ${credits}`);
      // Показать меню управления подпиской (новые кнопки)
      // await sendSubscriptionMenu(bot, chatId, lang);
      await sendSubscriptionMenu(bot, chatId, lang, userId);

      return;
    }

    // ====== НОВЫЕ КНОПКИ УПРАВЛЕНИЯ ПОДПИСКОЙ ======
    case 'sub_subscribe':
    case 'sub_change': {
      await bot.answerCallbackQuery(query.id);
      // Показываем существующие опции (разовые и две подписки), ничего не ломая
      await sendPurchaseOptions(bot, chatId, lang);
      return;
    }

    case 'sub_cancel': {
      await bot.answerCallbackQuery(query.id);
      await bot.sendMessage(
        chatId,
        t(lang, 'bot.subscription.cancel.confirm', 'Отменить подписку в конце текущего периода?'),
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: t(lang, 'bot.yes', 'Да'), callback_data: 'sub_cancel_confirm' }],
              [{ text: t(lang, 'bot.no', 'Нет'), callback_data: 'sub_cancel_abort' }],
            ],
          },
        }
      );
      return;
    }

    case 'sub_cancel_abort': {
      await bot.answerCallbackQuery(query.id, { text: t(lang, 'bot.cancelled', 'Действие отменено') });
      return;
    }

    case 'sub_cancel_confirm': {
      await bot.answerCallbackQuery(query.id);
      const loaderMsg = await bot.sendMessage(chatId, t(lang, 'bot.loading_payment', '🛒 Готовлю страницу...'));

      try {
        const baseUrl = process.env.NEXT_PUBLIC_DOMAIN!;
        const url = `${baseUrl}/api/telegram-checkout`;
        const payload = { type: 'cancel_subscription', telegram_id: userId, secret: process.env.BOT_API_SECRET };

        const resp = await postWithRedirect(url, payload);
        const raw = await resp.text();
        const result = safeParseJSON(raw);

        try { await bot.deleteMessage(chatId, loaderMsg.message_id); } catch {}

        if (!resp.ok) {
          await bot.sendMessage(chatId, (result as any)?.error || t(lang, 'bot.payment_error', 'Произошла ошибка.'));
          return;
        }

        await bot.sendMessage(
          chatId,
          (result as any)?.message || t(lang, 'bot.subscription.cancel.scheduled', 'Отмена подписки запланирована на конец текущего периода.')
        );
      } catch {
        try { await bot.deleteMessage(chatId, loaderMsg.message_id); } catch {}
        await bot.sendMessage(chatId, t(lang, 'bot.payment_error', 'Произошла ошибка.'));
      }
      return;
    }
    // ====== КОНЕЦ НОВЫХ КНОПОК ======

    case 'fu_custom': {
      await bot.answerCallbackQuery(query.id);
      const st = userState.get(userId);
      if (!st) {
        await bot.sendMessage(chatId, t(lang, 'bot.general.error_message', 'Start with /tarot.'));
        return;
      }
      await bot.sendMessage(
        chatId,
        t(lang, 'bot.custom_follow_up', 'Ask your own follow-up question'),
        { reply_markup: { force_reply: true, selective: true } }
      );
      userState.set(userId, { ...st, waitingForCustomFU: true });
      return;
    }
    case 'restart': {
      await bot.answerCallbackQuery(query.id);
      userState.delete(userId);
      const mockMessage: TelegramBot.Message = {
        message_id: 0,
        chat: { id: chatId, type: 'private' },
        date: Date.now(),
        from: { id: userId, is_bot: false, first_name: 'User' }
      };
      await handleStartCommand(bot, mockMessage, '');
      return;
    }
    case 'start_tarot': {
      // %%%%%%%%%%%%% ИЗМЕНИЛ ЗДЕСЬ!
      await bot.answerCallbackQuery(query.id); // (на всякий случай)
      if (query.message) {
        const mockMessage: TelegramBot.Message = {
          message_id: query.message.message_id,
          chat: query.message.chat,
          date: query.message.date,
          from: {
            id: query.from.id,
            is_bot: false,
            first_name: query.from.first_name || 'User',
            last_name: (query.from as any).last_name,
            username: (query.from as any).username,
            language_code: (query.from as any).language_code,
          },
        };
        await handleTarotCommand(bot, mockMessage);
      }
      return;
      // %%%%%%%%%%%%% ИЗМЕНИЛ ЗДЕСЬ!
    }
    case 'tarot_draw': {
      if (!state?.deckVersion) {
        await bot.answerCallbackQuery(query.id, { text: 'Пожалуйста, сначала выберите колоду.' });
        return;
      }

      const telegramId = query.from.id;
      if (!telegramId) return;

      const creditsRemaining = await getCardCredits(telegramId);
      if (creditsRemaining <= 0) {
        await bot.answerCallbackQuery(query.id, { text: t(lang, 'bot.subscription_needed', 'У вас закончились кредиты. Пожалуйста, оформите подписку.') });
        await bot.sendMessage(chatId, t(lang, 'bot.subscription_needed', 'У вас закончились кредиты. Пожалуйста, оформите подписку.'));
        await sendPurchaseOptions(bot, chatId, lang);
        return;
      }

      await bot.answerCallbackQuery(query.id);
      const loaderMsg = await bot.sendMessage(chatId, t(lang, 'bot.loading.reading', '🔮 Провожу гадание...'));

      try {
        const reading = await getTarotReading(state.question, lang, state.deckVersion);
        try { await bot.deleteMessage(chatId, loaderMsg.message_id); } catch {}

        await sendTarotReading(bot, chatId, reading, lang);

        const success = await decrementCardCredits(telegramId);
        if (!success) {
          bot.sendMessage(chatId, t(lang, 'bot.error_decreasing_credits', 'Ошибка при списании кредита. Пожалуйста, попробуйте еще раз.'));
          return;
        }

        await sendFollowUpOptions(bot, chatId, userId, state, reading);

      } catch (error) {
        console.error('Ошибка в обработчике /tarot:', error);
        await bot.sendMessage(chatId, t(lang, 'bot.general.error_message', 'An error occurred. Please try again.'));
      }
      return;
    }
    default: {
      if (data.startsWith('fu:')) {
        const idx = Number(data.split(':')[1] ?? -1);
        const st = userState.get(userId);
        await bot.answerCallbackQuery(query.id);

        if (!st || !st.followUps || typeof st.followUps[idx] !== 'string') {
          await bot.sendMessage(chatId, t(lang, 'bot.general.error_message', 'No suggested question. Start with /tarot.'));
          return;
        }

        const followUpQuestion = st.followUps[idx].trim();
        const telegramId = query.from.id;
        if (!telegramId) return;

        const creditsRemaining = await getCardCredits(telegramId);
        if (creditsRemaining <= 0) {
          await bot.sendMessage(chatId, t(lang, 'bot.subscription_needed', 'У вас закончились кредиты. Пожалуйста, оформите подписку.'));
          await sendPurchaseOptions(bot, chatId, lang);
          return;
        }

        const loaderMsg = await bot.sendMessage(chatId, t(lang, 'bot.loading.reading', '🔮 Провожу гадание...'));

        try {
          const reading = await getTarotReading(followUpQuestion, lang, st.deckVersion!);
          try { await bot.deleteMessage(chatId, loaderMsg.message_id); } catch {}

          await sendTarotReading(bot, chatId, reading, lang);

          const success = await decrementCardCredits(telegramId);
          if (!success) {
            bot.sendMessage(chatId, t(lang, 'bot.error_decreasing_credits', 'Ошибка при списании кредита. Пожалуйста, попробуйте еще раз.'));
            return;
          }

          await sendFollowUpOptions(bot, chatId, userId, st, reading);

        } catch (e) {
          console.error('Follow-up error:', e);
          await bot.sendMessage(chatId, t(lang, 'bot.general.error_message', 'An error occurred. Please try again.'));
        }
        return;
      }
      if (data.startsWith('tarot_deck_')) {
        const deckVersion = data.replace('tarot_deck_', '') as DeckVersion;
        const st = userState.get(userId);
        if (!st) {
          await bot.answerCallbackQuery(query.id, { text: 'Начните с команды /tarot' });
          return;
        }
        userState.set(userId, { ...st, deckVersion });

        await bot.sendMessage(
          chatId,
          t(lang, 'bot.deck_chosen', 'Deck selected'),
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: t(lang, 'bot.draw_card', 'Draw a card'), callback_data: 'tarot_draw' }],
              ],
            },
          }
        );
        await bot.answerCallbackQuery(query.id);
        return;
      }
    }
  }
};

/* ======================= ОТПРАВКИ ======================= */

const sendPurchaseOptions = async (bot: TelegramBot, chatId: number, lang: string) => {
  await bot.sendMessage(chatId, t(lang, 'bot.purchase.prompt', 'Выберите способ пополнения баланса:'), {
    reply_markup: {
      inline_keyboard: [
        [{ text: t(lang, 'bot.purchase.options.one_time_10', '10 карт (разово)'), callback_data: 'buy_one_time_10' }],
        [{ text: t(lang, 'bot.purchase.options.one_time_100', '100 карт (разово)'), callback_data: 'buy_one_time_100' }],
        [{ text: t(lang, 'bot.purchase.options.subscription_medium', 'Подписка Medium'), callback_data: 'buy_subscription_medium' }],
        [{ text: t(lang, 'bot.purchase.options.subscription_premium', 'Подписка Premium'), callback_data: 'buy_subscription_premium' }]
      ],
    },
  });
};

// ====== НОВОЕ: меню управления подпиской (три кнопки) ======
// const sendSubscriptionMenu = async (bot: TelegramBot, chatId: number, lang: string) => {
//   await bot.sendMessage(
//     chatId,
//     t(lang, 'bot.subscription.menu.title', 'Управление подпиской'),
//     {
//       reply_markup: {
//         inline_keyboard: [
//           [{ text: t(lang, 'bot.subscription.buttons.subscribe', 'Оформить подписку'), callback_data: 'sub_subscribe' }],
//           [{ text: t(lang, 'bot.subscription.buttons.change', 'Сменить подписку'), callback_data: 'sub_change' }],
//           [{ text: t(lang, 'bot.subscription.buttons.cancel', 'Отменить подписку'), callback_data: 'sub_cancel' }],
//         ],
//       },
//     }
//   );
// };

const sendSubscriptionMenu = async (
  bot: TelegramBot,
  chatId: number,
  lang: string,
  userId: number
) => {
  const supabaseUserId = await getSupabaseUserId(userId);
  let userSubscription: any = null;

  if (supabaseUserId) {
    const { data } = await supabaseAdmin
      .from('subscriptions')
      .select('status, plan')
      .eq('user_id', supabaseUserId)
      .maybeSingle();
    userSubscription = data;
  }

  const buttons: TelegramBot.InlineKeyboardButton[][] = [];

  if (!userSubscription || userSubscription.status !== 'active') {
    // подписки нет
    buttons.push([
      {
        text: t(lang, 'bot.subscription.buttons.subscribe', 'Оформить подписку'),
        callback_data: 'sub_subscribe',
      },
    ]);
  } else {
    // подписка есть
    buttons.push([
      {
        text: t(lang, 'bot.subscription.buttons.change', 'Сменить подписку'),
        callback_data: 'sub_change',
      },
    ]);
    buttons.push([
      {
        text: t(lang, 'bot.subscription.buttons.cancel', 'Отменить подписку'),
        callback_data: 'sub_cancel',
      },
    ]);
  }

  await bot.sendMessage(
    chatId,
    t(lang, 'bot.subscription.menu.title', 'Управление подпиской'),
    {
      reply_markup: { inline_keyboard: buttons },
    },
  );
};

// ====== КОНЕЦ НОВОГО ======

const sendTarotReading = async (bot: TelegramBot, chatId: number, reading: any, lang: string) => {
  await bot.sendPhoto(
    chatId,
    fs.createReadStream(reading.cardImagePath),
    { caption: `<b>${reading.cardTitle}</b>`, parse_mode: 'HTML' }
  );
  await bot.sendMessage(chatId, reading.interpretation, { parse_mode: 'HTML' });
  const tips = toStrArray(reading?.tips);
  if (tips.length) {
    const tipsBlock =
      `<b>${t(lang, 'bot.tarot.tips_title', 'Guidance')}:</b>\n` +
      tips.map((tip: string) => `• ${tip}`).join('\n');
    await bot.sendMessage(chatId, tipsBlock, { parse_mode: 'HTML' });
  }
};

const sendFollowUpOptions = async (bot: TelegramBot, chatId: number, userId: number, state: any, reading: any) => {
  const followUps = toStrArray(reading?.followUps);
  userState.set(userId, { ...state, followUps, lastCardTitle: reading.cardTitle });
  const buttons: TelegramBot.InlineKeyboardButton[][] = [];
  followUps.slice(0, 5).forEach((q, i) => {
    buttons.push([{ text: q, callback_data: `fu:${i}` }]);
  });
  const lang = state.lang || 'ru';
  buttons.push([{ text: t(lang, 'bot.custom_follow_up', 'Ask your own follow-up'), callback_data: 'fu_custom' }]);
  buttons.push([{ text: t(lang, 'bot.restart', 'Start over'), callback_data: 'restart' }]);
  await bot.sendMessage(chatId, t(lang, 'bot.tarot.follow_ups_title', 'Path to deeper truth'), {
    reply_markup: { inline_keyboard: buttons },
  });
};

/* ======================= ОПЛАТА (POST с редиректами + безопасный JSON) ======================= */

async function postWithRedirect(u: string, body: any) {
  let resp = await fetch(u, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    redirect: 'manual', // не превращать POST в GET на 301/302
    body: JSON.stringify(body),
  });
  if ([301, 302, 303, 307, 308].includes(resp.status)) {
    const loc = resp.headers.get('location');
    if (loc) {
      const nextUrl = loc.startsWith('http') ? loc : new URL(loc, u).toString();
      resp = await fetch(nextUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }
  }
  return resp;
}

const handleBuyCommand = async (bot: TelegramBot, query: TelegramBot.CallbackQuery) => {
  const chatId = query.message?.chat.id;
  const userId = query.from.id;
  const data = query.data;
  if (!chatId || !userId || !data) return;

  await bot.answerCallbackQuery(query.id);

  const lang = userState.get(userId)?.lang || query.from.language_code || 'ru';
  const loaderMsg = await bot.sendMessage(chatId, t(lang, 'bot.loading_payment', '🛒 Готовлю страницу оплаты...'));

  try {
    let type: string = 'one_time';
    let quantity: number | undefined;
    const currency = 'EUR';

    if (data === 'buy_subscription_medium') type = 'subscription_medium';
    else if (data === 'buy_subscription_premium') type = 'subscription_premium';
    else if (data === 'buy_one_time_10') { type = 'one_time'; quantity = 10; }
    else if (data === 'buy_one_time_100') { type = 'one_time'; quantity = 100; }

    const baseUrl = process.env.NEXT_PUBLIC_DOMAIN!;
    const url = `${baseUrl}/api/telegram-checkout`;
    const payload = { type, quantity, telegram_id: userId, secret: process.env.BOT_API_SECRET, currency };

    const response = await postWithRedirect(url, payload);
    const raw = await response.text();
    const result = safeParseJSON(raw);

    try { await bot.deleteMessage(chatId, loaderMsg.message_id); } catch {}

    if (!response.ok) {
      await bot.sendMessage(chatId, (result as any)?.error || t(lang, 'bot.payment_error', 'Произошла ошибка при создании сессии оплаты.'));
      return;
    }

    if ((result as any)?.url) {
      await bot.sendMessage(chatId, t(lang, 'bot.checkout_url', 'Перейдите по ссылке для завершения оплаты:'), {
        reply_markup: {
          inline_keyboard: [[{ text: t(lang, 'bot.pay_button', 'Оплатить'), url: (result as any).url }]],
        },
      });
    } else if ((result as any)?.message) {
      await bot.sendMessage(chatId, (result as any).message);
    } else {
      await bot.sendMessage(chatId, t(lang, 'bot.payment_error', 'Ответ сервера не распознан. Попробуйте позже.'));
    }

  } catch (error) {
    try { await bot.deleteMessage(chatId, loaderMsg.message_id); } catch {}
    await bot.sendMessage(chatId, t(lang, 'bot.payment_error', 'Произошла ошибка при создании сессии оплаты.'));
  }
};

/* ======================= ЭКСПОРТ ======================= */

export {
  sendPurchaseOptions, // если нужно использовать снаружи
};
