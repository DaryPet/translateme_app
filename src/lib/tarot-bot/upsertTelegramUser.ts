// src/lib/telegram/upsertTelegramUser.ts
import { supabaseAdmin } from 'src/lib/supabase/adminClient';
import TelegramBot from 'node-telegram-bot-api';
import crypto from 'crypto';

type UpdateLike = {
  message?: TelegramBot.Message;
  callback_query?: TelegramBot.CallbackQuery;
};

// ДОБАВЛЯЕМ ПРОСТОЙ КЭШ
const userCache = new Map<number, string>(); // telegram_id -> user_id

export async function upsertTelegramUser(update: UpdateLike) {
  const from = update?.message?.from || update?.callback_query?.from;
  const chatId = update?.message?.chat?.id || update?.callback_query?.message?.chat?.id || null;
  
  if (!from) return;
  
  const telegram_id = from.id;
  
  // ПРОВЕРЯЕМ КЭШ СНАЧАЛА
  if (userCache.has(telegram_id)) {
    const cached_user_id = userCache.get(telegram_id)!;
    
    // Обновляем данные в фоне (не ждем результата)
    updateUserInBackground(telegram_id, from, chatId, cached_user_id);
    
    return cached_user_id;
  }

  // Шаг 1: Проверяем, существует ли уже запись в telegram_users
  const { data: existingUser, error: fetchError } = await supabaseAdmin
    .from('telegram_users')
    .select('user_id')
    .eq('telegram_id', telegram_id)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('upsertTelegramUser fetch error:', fetchError);
    return;
  }

  let user_id: string;

  if (existingUser) {
    // Если пользователь уже есть, используем его user_id
    user_id = existingUser.user_id;
  } else {
    // Если это новый пользователь, создаем запись в auth.users
    const email = `tg_${telegram_id}@souldestiny.app`;
    const password = crypto.randomUUID();

    const { data: newAuthUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
    });

    if (authError || !newAuthUser?.user) {
      console.error('upsertTelegramUser auth create error:', authError);
      return;
    }

    user_id = newAuthUser.user.id;
  }

  // ДОБАВЛЯЕМ В КЭШ
  userCache.set(telegram_id, user_id);

  // Шаг 2: Создаем payload для upsert в telegram_users
  const payload: Record<string, any> = {
    telegram_id: telegram_id,
    user_id: user_id,
    username: from.username ?? null,
    first_name: from.first_name ?? null,
    last_name: from.last_name ?? null,
    language_code: from.language_code ?? null,
    chat_id: chatId,
  };

  // Шаг 3: Выполняем upsert
  const { error } = await supabaseAdmin
    .from('telegram_users')
    .upsert(payload, { onConflict: 'telegram_id' });

  if (error) {
    console.error('upsertTelegramUser error:', error);
  } else {
    console.log(`User ${telegram_id} upserted successfully with user_id: ${user_id}`);
  }

  return user_id;
}

// НОВАЯ ФУНКЦИЯ для фонового обновления
async function updateUserInBackground(
  telegram_id: number, 
  from: TelegramBot.User, 
  chatId: number | null,
  user_id: string
) {
  try {
    const payload = {
      telegram_id: telegram_id,
      user_id: user_id,
      username: from.username ?? null,
      first_name: from.first_name ?? null,
      last_name: from.last_name ?? null,
      language_code: from.language_code ?? null,
      chat_id: chatId,
    };

    await supabaseAdmin
      .from('telegram_users')
      .upsert(payload, { onConflict: 'telegram_id' });
      
  } catch (error) {
    console.error('Background update error:', error);
  }
}

// ОЧИСТКА КЭША каждые 10 минут
setInterval(() => {
  if (userCache.size > 1000) { // Если кэш слишком большой
    userCache.clear();
    console.log('Cache cleared');
  }
}, 10 * 60 * 1000);


// //TODO: new with useState in DB

// import { supabaseAdmin } from '@/lib/supabase/adminClient';
// import TelegramBot from 'node-telegram-bot-api';
// import crypto from 'crypto';

// type UpdateLike = {
//   message?: TelegramBot.Message;
//   callback_query?: TelegramBot.CallbackQuery;
// };

// // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// // +++ НАЧАЛО ИЗМЕНЕНИЙ
// // +++ Определяем, как выглядит объект состояния, для чистоты кода
// type UserState = { [key: string]: any }; 

// // +++ Теперь кэш будет хранить не просто user_id, а объект с user_id и состоянием
// const userCache = new Map<number, { userId: string; state: UserState }>();
// // +++ КОНЕЦ ИЗМЕНЕНИЙ
// // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

// // +++ Функция теперь возвращает Promise с объектом { userId, state }
// export async function upsertTelegramUser(update: UpdateLike): Promise<{ userId: string; state: UserState } | undefined> {
//   const from = update?.message?.from || update?.callback_query?.from;
//   const chatId = update?.message?.chat?.id || update?.callback_query?.message?.chat?.id || null;
  
//   if (!from) return;
  
//   const telegram_id = from.id;
  
//   // +++ Проверяем кэш, как и раньше
//   if (userCache.has(telegram_id)) {
//     const cachedData = userCache.get(telegram_id)!;
//     // Обновляем данные в фоне (не ждем результата)
//     updateUserInBackground(telegram_id, from, chatId, cachedData.userId);
//     // +++ Возвращаем кэшированные данные
//     return cachedData;
//   }

//   // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//   // +++ НАЧАЛО ИЗМЕНЕНИЙ
//   // +++ Теперь мы запрашиваем не только user_id, но и новую колонку state
//   const { data: existingUser, error: fetchError } = await supabaseAdmin
//     .from('telegram_users')
//     .select('user_id, state') // <--- ИЗМЕНЕНО
//     .eq('telegram_id', telegram_id)
//     .single();
//   // +++ КОНЕЦ ИЗМЕНЕНИЙ
//   // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++


//   if (fetchError && fetchError.code !== 'PGRST116') {
//     console.error('upsertTelegramUser fetch error:', fetchError);
//     return;
//   }

//   let user_id: string;
//   let state: UserState = {}; // +++ Переменная для хранения состояния

//   if (existingUser) {
//     // +++ Если пользователь есть, берем его user_id и его состояние
//     user_id = existingUser.user_id;
//     state = existingUser.state || {}; // Если state вдруг пустой, используем {}
//   } else {
//     // +++ Если это новый пользователь, создаем его, как и раньше
//     const email = `tg_${telegram_id}@souldestiny.app`;
//     const password = crypto.randomUUID();

//     const { data: newAuthUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
//       email: email,
//       password: password,
//     });

//     if (authError || !newAuthUser?.user) {
//       console.error('upsertTelegramUser auth create error:', authError);
//       return;
//     }
//     user_id = newAuthUser.user.id;
//     // +++ Состояние для нового пользователя - пустой объект
//     state = {};
//   }

//   // +++ Кэшируем и user_id, и state
//   userCache.set(telegram_id, { userId: user_id, state: state });

//   const payload: Record<string, any> = {
//     telegram_id: telegram_id,
//     user_id: user_id,
//     username: from.username ?? null,
//     first_name: from.first_name ?? null,
//     last_name: from.last_name ?? null,
//     language_code: from.language_code ?? null,
//     chat_id: chatId,
//   };

//   const { error } = await supabaseAdmin
//     .from('telegram_users')
//     .upsert(payload, { onConflict: 'telegram_id' });

//   if (error) {
//     console.error('upsertTelegramUser error:', error);
//   } else {
//     console.log(`User ${telegram_id} upserted successfully with user_id: ${user_id}`);
//   }

//   // +++ Возвращаем объект с user_id и состоянием
//   return { userId: user_id, state: state };
// }

// // Фоновое обновление остается без изменений, оно не трогает state
// async function updateUserInBackground(
//   telegram_id: number, 
//   from: TelegramBot.User, 
//   chatId: number | null,
//   user_id: string
// ) {
//   // ... (код без изменений)
// }

// // Очистка кэша остается без изменений
// setInterval(() => {
//   // ... (код без изменений)
// }, 10 * 60 * 1000);