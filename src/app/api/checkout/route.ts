// import { NextResponse } from 'next/server';
// import Stripe from 'stripe';
// import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

// export const runtime = 'nodejs';

// export async function POST(req: Request) {
//   // а) вытаскиваем токен из заголовка
//   const authHeader = req.headers.get('authorization') || '';
//   if (!authHeader.startsWith('Bearer ')) {
//     return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
//   }
//   const token = authHeader.split(' ')[1];

//   // б) админ-клиент Supabase с service-role ключом
//   const supabaseAdmin = createSupabaseAdmin(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.SUPABASE_SERVICE_ROLE_KEY!,
//   );

//   // в) проверяем пользователя
//   const {
//     data: { user },
//     error: userErr,
//   } = await supabaseAdmin.auth.getUser(token);

//   if (userErr || !user) {
//     return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
//   }

//   // г) остальной код: парсим quantity/currency, считаем цену…
//   const { quantity, currency } = await req.json();
//   const unitPrices: Record<string, Record<number, number>> = {
//     USD: { 10: 99, 100: 1000 },
//     EUR: { 10: 90, 100: 950 },
//     CAD: { 10: 130, 100: 1200 },
//     RUB: { 10: 9900, 100: 99000 },
//     UAH: { 10: 4500, 100: 40000 },
//   };
//   const upper = currency.toUpperCase();
//   const unitAmount = unitPrices[upper]?.[quantity];
//   if (!unitAmount) {
//     return NextResponse.json(
//       { error: 'Invalid quantity or currency' },
//       { status: 400 },
//     );
//   }

//   // д) создаём сессию в Stripe с session_id в success_url
//   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {});
//   const session = await stripe.checkout.sessions.create({
//     mode: 'payment',
//     line_items: [
//       {
//         price_data: {
//           currency: upper.toLowerCase(),
//           product_data: { name: `${quantity} карт (${upper})` },
//           unit_amount: unitAmount,
//         },
//         quantity: 1,
//       },
//     ],
//     success_url: `${process.env.NEXT_PUBLIC_DOMAIN}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
//     cancel_url: `${process.env.NEXT_PUBLIC_DOMAIN}/cancel`,
//     metadata: { user_id: user.id, cards: quantity.toString() },
//   });

//   return NextResponse.json({ url: session.url });
// }

// import { NextResponse } from 'next/server';
// import Stripe from 'stripe';
// import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

// export const runtime = 'nodejs';

// export async function POST(req: Request) {
//   try {
//     // Логируем заголовок авторизации
//     const authHeader = req.headers.get('authorization') || '';
//     console.log('Auth header:', authHeader);

//     if (!authHeader.startsWith('Bearer ')) {
//       console.log('No Bearer token found');
//       return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
//     }
//     const token = authHeader.split(' ')[1];
//     console.log('Token:', token);

//     // Создаём Supabase admin клиента
//     const supabaseAdmin = createSupabaseAdmin(
//       process.env.NEXT_PUBLIC_SUPABASE_URL!,
//       process.env.SUPABASE_SERVICE_ROLE_KEY!,
//     );

//     // Проверяем пользователя
//     const {
//       data: { user },
//       error: userErr,
//     } = await supabaseAdmin.auth.getUser(token);
//     if (userErr || !user) {
//       console.log('Supabase auth error:', userErr);
//       return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
//     }
//     console.log('User ID:', user.id);

//     // Парсим тело запроса
//     const body = await req.json();
//     console.log('Request body:', body);

//     const { type, quantity, currency } = body;

//     // Логи переменных окружения
//     console.log(
//       'STRIPE_SECRET_KEY:',
//       process.env.STRIPE_SECRET_KEY?.slice(0, 10) + '...',
//     );
//     console.log('STRIPE_PRICE_ID_MEDIUM:', process.env.STRIPE_PRICE_ID_MEDIUM);
//     console.log(
//       'STRIPE_PRICE_ID_PREMIUM:',
//       process.env.STRIPE_PRICE_ID_PREMIUM,
//     );
//     console.log('NEXT_PUBLIC_DOMAIN:', process.env.NEXT_PUBLIC_DOMAIN);

//     const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {});

//     let session;

//     // Определяем price ID в зависимости от типа подписки
//     const priceId =
//       type === 'subscription_medium'
//         ? process.env.STRIPE_PRICE_ID_MEDIUM
//         : type === 'subscription_premium'
//           ? process.env.STRIPE_PRICE_ID_PREMIUM
//           : undefined;

//     console.log('Using priceId:', priceId);

//     if (priceId) {
//       session = await stripe.checkout.sessions.create({
//         mode: 'subscription',
//         line_items: [
//           {
//             price: priceId,
//             quantity: 1,
//           },
//         ],
//         success_url: `${process.env.NEXT_PUBLIC_DOMAIN}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
//         cancel_url: `${process.env.NEXT_PUBLIC_DOMAIN}/cancel`,
//         metadata: { user_id: user.id, type },
//       });
//     } else {
//       // Логика для разовых платежей
//       const upper = currency?.toUpperCase();
//       const unitPrices: Record<string, Record<number, number>> = {
//         USD: { 10: 99, 100: 1000 },
//         EUR: { 10: 90, 100: 950 },
//         CAD: { 10: 130, 100: 1200 },
//         RUB: { 10: 9900, 100: 99000 },
//         UAH: { 10: 4500, 100: 40000 },
//       };
//       const unitAmount = unitPrices[upper ?? '']?.[quantity ?? 0];

//       if (!unitAmount) {
//         console.log('Invalid quantity or currency:', quantity, currency);
//         return NextResponse.json(
//           { error: 'Invalid quantity or currency' },
//           { status: 400 },
//         );
//       }

//       session = await stripe.checkout.sessions.create({
//         mode: 'payment',
//         line_items: [
//           {
//             price_data: {
//               currency: upper?.toLowerCase(),
//               product_data: { name: `${quantity} карт (${upper})` },
//               unit_amount: unitAmount,
//             },
//             quantity: 1,
//           },
//         ],
//         success_url: `${process.env.NEXT_PUBLIC_DOMAIN}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
//         cancel_url: `${process.env.NEXT_PUBLIC_DOMAIN}/cancel`,
//         metadata: {
//           user_id: user.id,
//           cards: quantity?.toString() || '',
//           type: type || 'one_time',
//         },
//       });
//     }

//     console.log('Checkout session created:', session.id);

//     return NextResponse.json({ url: session.url });
//   } catch (error) {
//     console.error('Stripe checkout error:', error);
//     return NextResponse.json(
//       { error: 'Internal Server Error' },
//       { status: 500 },
//     );
//   }
// }

//TODO: working one

// import { NextResponse } from 'next/server';
// import Stripe from 'stripe';
// import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

// export const runtime = 'nodejs';

// export async function POST(req: Request) {
//   try {
//     // --- Начало существующего кода: Аутентификация и инициализация ---

//     const authHeader = req.headers.get('authorization') || '';
//     console.log('Auth header:', authHeader);

//     if (!authHeader.startsWith('Bearer ')) {
//       console.log('No Bearer token found');
//       return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
//     }
//     const token = authHeader.split(' ')[1];
//     console.log('Token:', token);

//     const supabaseAdmin = createSupabaseAdmin(
//       process.env.NEXT_PUBLIC_SUPABASE_URL!,
//       process.env.SUPABASE_SERVICE_ROLE_KEY!,
//     );

//     const {
//       data: { user },
//       error: userErr,
//     } = await supabaseAdmin.auth.getUser(token);
//     if (userErr || !user) {
//       console.log('Supabase auth error:', userErr);
//       return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
//     }
//     console.log('User ID:', user.id);

//     const body = await req.json();
//     console.log('Request body:', body);

//     const { type, quantity, currency } = body;

//     console.log(
//       'STRIPE_SECRET_KEY:',
//       process.env.STRIPE_SECRET_KEY?.slice(0, 10) + '...',
//     );
//     console.log('STRIPE_PRICE_ID_MEDIUM:', process.env.STRIPE_PRICE_ID_MEDIUM);
//     console.log(
//       'STRIPE_PRICE_ID_PREMIUM:',
//       process.env.STRIPE_PRICE_ID_PREMIUM,
//     );
//     console.log('NEXT_PUBLIC_DOMAIN:', process.env.NEXT_PUBLIC_DOMAIN);

//     const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {});

//     let session;

//     // Определяем price ID в зависимости от типа подписки
//     const priceId =
//       type === 'subscription_medium'
//         ? process.env.STRIPE_PRICE_ID_MEDIUM
//         : type === 'subscription_premium'
//           ? process.env.STRIPE_PRICE_ID_PREMIUM
//           : undefined;

//     console.log('Using priceId:', priceId);

//     // --- Конец существующего кода ---

//     // --- НОВАЯ ЛОГИКА: Проверка дублирования и логика апгрейда/даунгрейда ---
//     // Эта логика применяется только для подписок, а не для разовых платежей.
//     if (priceId) {
//       // 1. Получаем текущую подписку пользователя из Supabase
//       console.log(`Checking existing subscription for user: ${user.id}`);
//       const { data: existingSubscription, error: subError } =
//         await supabaseAdmin
//           .from('subscriptions')
//           .select('plan, status, stripe_sub_id') // Получаем необходимые поля
//           .eq('user_id', user.id)
//           .single();

//       // Обработка ошибки при запросе подписки, кроме "нет записи"
//       if (subError && subError.code !== 'PGRST116') {
//         // PGRST116 = No rows found (нет подписки)
//         console.error(
//           'Supabase error fetching existing subscription:',
//           subError,
//         );
//         return NextResponse.json(
//           { error: 'Failed to retrieve subscription information' },
//           { status: 500 },
//         );
//       }

//       // Определяем запрошенный тип плана на основе priceId
//       let requestedPlanType: string | undefined;
//       if (priceId === process.env.STRIPE_PRICE_ID_MEDIUM) {
//         requestedPlanType = 'medium';
//       } else if (priceId === process.env.STRIPE_PRICE_ID_PREMIUM) {
//         requestedPlanType = 'premium';
//       }

//       console.log(`Requested plan type: ${requestedPlanType}`);
//       console.log(
//         `Existing subscription: ${existingSubscription ? `Plan: ${existingSubscription.plan}, Status: ${existingSubscription.status}` : 'None'}`,
//       );

//       // 2. Применяем логику предотвращения дублирования/обновления
//       if (existingSubscription) {
//         if (existingSubscription.status === 'active') {
//           // Если текущая подписка активна
//           if (existingSubscription.plan === requestedPlanType) {
//             // Пользователь уже подписан на этот же активный план
//             console.log(
//               `Blocking: User ${user.id} already has an active ${requestedPlanType} plan.`,
//             );
//             return NextResponse.json(
//               {
//                 error: `You are already subscribed to the ${requestedPlanType} plan.`,
//                 code: 'ALREADY_SUBSCRIBED_TO_SAME_PLAN',
//               },
//               { status: 400 },
//             );
//           } else if (
//             existingSubscription.plan === 'medium' &&
//             requestedPlanType === 'premium'
//           ) {
//             // Разрешить апгрейд с Medium на Premium
//             console.log(
//               `Allowing upgrade: User ${user.id} is upgrading from medium to premium.`,
//             );
//             // Продолжаем к созданию сессии
//           } else if (
//             existingSubscription.plan === 'premium' &&
//             requestedPlanType === 'medium'
//           ) {
//             // Разрешить даунгрейд с Premium на Medium
//             console.log(
//               `Allowing downgrade: User ${user.id} is downgrading from premium to medium.`,
//             );
//             // Продолжаем к созданию сессии
//           } else {
//             // Активный план, но попытка купить другой, не являющийся апгрейдом/даунгрейдом
//             console.log(
//               `Blocking: User ${user.id} has an active ${existingSubscription.plan} plan and cannot purchase ${requestedPlanType}.`,
//             );
//             return NextResponse.json(
//               {
//                 error: `You have an active ${existingSubscription.plan} plan. Please manage your existing subscription or cancel it first.`,
//                 code: 'ACTIVE_PLAN_CONFLICT',
//               },
//               { status: 400 },
//             );
//           }
//         } else {
//           // Если подписка существует, но НЕ активна (canceled, past_due, unpaid и т.д.)
//           console.log(
//             `Allowing purchase: User ${user.id} has a non-active ${existingSubscription.status} plan.`,
//           );
//           // Разрешаем создание новой сессии, вебхук обновит существующую запись.
//         }
//       } else {
//         // У пользователя НЕТ записи о подписке в БД - это новая подписка.
//         console.log(
//           `Allowing new subscription: User ${user.id} has no existing subscription record.`,
//         );
//         // Продолжаем к созданию сессии
//       }

//       // --- Конец новой логики ---

//       // --- Начало существующего кода: Создание сессии подписки ---
//       session = await stripe.checkout.sessions.create({
//         mode: 'subscription',
//         line_items: [
//           {
//             price: priceId,
//             quantity: 1,
//           },
//         ],
//         success_url: `${process.env.NEXT_PUBLIC_DOMAIN}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
//         cancel_url: `${process.env.NEXT_PUBLIC_DOMAIN}/cancel`,
//         metadata: { user_id: user.id, type }, // type здесь - это 'subscription_medium' или 'subscription_premium'
//       });
//       // --- Конец существующего кода ---
//     } else {
//       // --- Начало существующего кода: Логика для разовых платежей ---
//       const upper = currency?.toUpperCase();
//       const unitPrices: Record<string, Record<number, number>> = {
//         USD: { 10: 99, 100: 1000 },
//         EUR: { 10: 90, 100: 950 },
//         CAD: { 10: 130, 100: 1200 },
//         RUB: { 10: 9900, 100: 99000 },
//         UAH: { 10: 4500, 100: 40000 },
//       };
//       const unitAmount = unitPrices[upper ?? '']?.[quantity ?? 0];

//       if (!unitAmount) {
//         console.log('Invalid quantity or currency:', quantity, currency);
//         return NextResponse.json(
//           { error: 'Invalid quantity or currency' },
//           { status: 400 },
//         );
//       }

//       session = await stripe.checkout.sessions.create({
//         mode: 'payment',
//         line_items: [
//           {
//             price_data: {
//               currency: upper?.toLowerCase(),
//               product_data: { name: `${quantity} карт (${upper})` },
//               unit_amount: unitAmount,
//             },
//             quantity: 1,
//           },
//         ],
//         success_url: `${process.env.NEXT_PUBLIC_DOMAIN}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
//         cancel_url: `${process.env.NEXT_PUBLIC_DOMAIN}/cancel`,
//         metadata: {
//           user_id: user.id,
//           cards: quantity?.toString() || '',
//           type: type || 'one_time',
//         },
//       });
//       // --- Конец существующего кода ---
//     }

//     console.log('Checkout session created:', session.id);

//     return NextResponse.json({ url: session.url });
//   } catch (error) {
//     console.error('Stripe checkout error:', error);
//     return NextResponse.json(
//       { error: 'Internal Server Error' },
//       { status: 500 },
//     );
//   }
// }

// import { NextResponse } from 'next/server';
// import Stripe from 'stripe';
// import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

// export const runtime = 'nodejs';

// export async function POST(req: Request) {
//   try {
//     const authHeader = req.headers.get('authorization') || '';

//     if (!authHeader.startsWith('Bearer ')) {
//       return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
//     }
//     const token = authHeader.split(' ')[1];

//     const supabaseAdmin = createSupabaseAdmin(
//       process.env.NEXT_PUBLIC_SUPABASE_URL!,
//       process.env.SUPABASE_SERVICE_ROLE_KEY!,
//     );

//     const {
//       data: { user },
//       error: userErr,
//     } = await supabaseAdmin.auth.getUser(token);
//     if (userErr || !user) {
//       return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
//     }

//     const body = await req.json();
//     const { type, quantity, currency } = body;

//     const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {});

//     let session;

//     const priceId =
//       type === 'subscription_medium'
//         ? process.env.STRIPE_PRICE_ID_MEDIUM
//         : type === 'subscription_premium'
//           ? process.env.STRIPE_PRICE_ID_PREMIUM
//           : undefined;

//     if (priceId) {
//       const { data: existingSubscription, error: subError } =
//         await supabaseAdmin
//           .from('subscriptions')
//           .select('plan, status, stripe_sub_id')
//           .eq('user_id', user.id)
//           .single();

//       if (subError && subError.code !== 'PGRST116') {
//         return NextResponse.json(
//           { error: 'Failed to retrieve subscription information' },
//           { status: 500 },
//         );
//       }

//       let requestedPlanType: string | undefined;
//       if (priceId === process.env.STRIPE_PRICE_ID_MEDIUM) {
//         requestedPlanType = 'medium';
//       } else if (priceId === process.env.STRIPE_PRICE_ID_PREMIUM) {
//         requestedPlanType = 'premium';
//       }

//       if (existingSubscription) {
//         if (existingSubscription.status === 'active') {
//           if (existingSubscription.plan === requestedPlanType) {
//             return NextResponse.json(
//               {
//                 error: `You are already subscribed to the ${requestedPlanType} plan.`,
//                 code: 'ALREADY_SUBSCRIBED_TO_SAME_PLAN',
//               },
//               { status: 400 },
//             );
//           } else {
//             // Cancel the existing active subscription in Stripe
//             try {
//               // This call typically cancels the subscription immediately and prorates.
//               // If you need `at_period_end: true` for your specific Stripe API version,
//               // you may need to consult the official Stripe Node.js library documentation
//               // for the `subscriptions.cancel` method.
//               await stripe.subscriptions.cancel(
//                 existingSubscription.stripe_sub_id,
//               );
//             } catch (stripeCancelError) {
//               return NextResponse.json(
//                 {
//                   error:
//                     'Failed to manage existing subscription during upgrade/downgrade.',
//                   details: (stripeCancelError as Error).message,
//                 },
//                 { status: 500 },
//               );
//             }
//           }
//         } else {
//           // If subscription exists but is NOT active, allow creation of new session
//           // Webhook will update existing record.
//         }
//       } else {
//         // No existing subscription record for the user, allow new subscription.
//       }

//       session = await stripe.checkout.sessions.create({
//         mode: 'subscription',
//         line_items: [
//           {
//             price: priceId,
//             quantity: 1,
//           },
//         ],
//         success_url: `${process.env.NEXT_PUBLIC_DOMAIN}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
//         cancel_url: `${process.env.NEXT_PUBLIC_DOMAIN}/cancel`,
//         subscription_data: {
//           metadata: {
//             user_id: user.id,
//             type: type,
//           },
//         },
//         metadata: { user_id: user.id, type },
//       });
//     } else {
//       const upper = currency?.toUpperCase();
//       const unitPrices: Record<string, Record<number, number>> = {
//         USD: { 10: 99, 100: 1000 },
//         EUR: { 10: 90, 100: 950 },
//         CAD: { 10: 130, 100: 1200 },
//         RUB: { 10: 9900, 100: 99000 },
//         UAH: { 10: 4500, 100: 40000 },
//       };
//       const unitAmount = unitPrices[upper ?? '']?.[quantity ?? 0];

//       if (!unitAmount) {
//         return NextResponse.json(
//           { error: 'Invalid quantity or currency' },
//           { status: 400 },
//         );
//       }

//       session = await stripe.checkout.sessions.create({
//         mode: 'payment',
//         line_items: [
//           {
//             price_data: {
//               currency: upper?.toLowerCase(),
//               product_data: { name: `${quantity} карт (${upper})` },
//               unit_amount: unitAmount,
//             },
//             quantity: 1,
//           },
//         ],
//         success_url: `${process.env.NEXT_PUBLIC_DOMAIN}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
//         cancel_url: `${process.env.NEXT_PUBLIC_DOMAIN}/cancel`,
//         metadata: {
//           user_id: user.id,
//           cards: quantity?.toString() || '',
//           type: type || 'one_time',
//         },
//       });
//     }

//     return NextResponse.json({ url: session.url });
//   } catch (error) {
//     return NextResponse.json(
//       { error: 'Internal Server Error' },
//       { status: 500 },
//     );
//   }
// }

// import { NextResponse } from 'next/server';
// import Stripe from 'stripe';
// import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
// import { addMonths, isBefore } from 'date-fns'; // <-- ДОБАВЛЕН ЭТОТ ИМПОРТ

// export const runtime = 'nodejs';

// export async function POST(req: Request) {
//   try {
//     const authHeader = req.headers.get('authorization') || '';

//     if (!authHeader.startsWith('Bearer ')) {
//       return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
//     }
//     const token = authHeader.split(' ')[1];

//     const supabaseAdmin = createSupabaseAdmin(
//       process.env.NEXT_PUBLIC_SUPABASE_URL!,
//       process.env.SUPABASE_SERVICE_ROLE_KEY!,
//     );

//     const {
//       data: { user },
//       error: userErr,
//     } = await supabaseAdmin.auth.getUser(token);
//     if (userErr || !user) {
//       return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
//     }

//     const body = await req.json();
//     const { type, quantity, currency } = body;

//     const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {});

//     let session;

//     const priceId =
//       type === 'subscription_medium'
//         ? process.env.STRIPE_PRICE_ID_MEDIUM
//         : type === 'subscription_premium'
//           ? process.env.STRIPE_PRICE_ID_PREMIUM
//           : undefined;

//     if (priceId) {
//       // --- НАЧАЛО НОВОЙ ЛОГИКИ ПРОВЕРКИ "РАЗ В МЕСЯЦ" ---
//       const { data: userSubscription, error: subCheckError } =
//         await supabaseAdmin
//           .from('subscriptions')
//           .select('last_subscription_change') // <-- Запрашиваем только это поле
//           .eq('user_id', user.id)
//           .maybeSingle(); // Используем maybeSingle, т.к. записи может не быть

//       if (subCheckError && subCheckError.code !== 'PGRST116') {
//         // PGRST116 = No rows found
//         console.error(
//           'Ошибка при получении last_subscription_change:',
//           subCheckError,
//         );
//         return NextResponse.json(
//           { error: 'Failed to retrieve subscription information for check.' },
//           { status: 500 },
//         );
//       }

//       if (userSubscription && userSubscription.last_subscription_change) {
//         const lastChangeDate = new Date(
//           userSubscription.last_subscription_change,
//         );
//         const now = new Date();
//         // Разрешаем смену через 1 календарный месяц после lastChangeDate
//         const nextAllowedChangeDate = addMonths(lastChangeDate, 1);

//         if (isBefore(now, nextAllowedChangeDate)) {
//           // Если текущая дата раньше, чем разрешенная дата смены
//           console.warn(
//             `Пользователь ${user.id} пытается сменить подписку слишком часто. Разрешено после: ${nextAllowedChangeDate.toISOString()}`,
//           );
//           return NextResponse.json(
//             {
//               error: `You can only change your subscription once per month. Next change allowed after ${nextAllowedChangeDate.toLocaleDateString()}.`,
//               code: 'TOO_FREQUENT_SUBSCRIPTION_CHANGE',
//               nextAllowedDate: nextAllowedChangeDate.toISOString(),
//             },
//             { status: 429 }, // 429 Too Many Requests
//           );
//         }
//       }
//       // Если userSubscription отсутствует или last_subscription_change не установлен,
//       // это первая подписка или она никогда не менялась, поэтому разрешаем.
//       // --- КОНЕЦ НОВОЙ ЛОГИКИ ПРОВЕРКИ "РАЗ В МЕСЯЦ" ---

//       // --- СУЩЕСТВУЮЩАЯ ЛОГИКА ОБРАБОТКИ СМЕНЫ ПЛАНА (ОСТАЕТСЯ БЕЗ ИЗМЕНЕНИЙ, ТЕПЕРЬ ОНА ВЫПОЛНЯЕТСЯ ПОСЛЕ ПРОВЕРКИ ВЫШЕ) ---
//       const { data: existingSubscription, error: subError } =
//         await supabaseAdmin
//           .from('subscriptions')
//           .select('plan, status, stripe_sub_id')
//           .eq('user_id', user.id)
//           .single();

//       if (subError && subError.code !== 'PGRST116') {
//         return NextResponse.json(
//           { error: 'Failed to retrieve subscription information' },
//           { status: 500 },
//         );
//       }

//       let requestedPlanType: string | undefined;
//       if (priceId === process.env.STRIPE_PRICE_ID_MEDIUM) {
//         requestedPlanType = 'medium';
//       } else if (priceId === process.env.STRIPE_PRICE_ID_PREMIUM) {
//         requestedPlanType = 'premium';
//       }

//       if (existingSubscription) {
//         if (existingSubscription.status === 'active') {
//           if (existingSubscription.plan === requestedPlanType) {
//             return NextResponse.json(
//               {
//                 error: `You are already subscribed to the ${requestedPlanType} plan.`,
//                 code: 'ALREADY_SUBSCRIBED_TO_SAME_PLAN',
//               },
//               { status: 400 },
//             );
//           } else {
//             // Cancel the existing active subscription in Stripe
//             try {
//               // ВАЖНО: Если вы хотите, чтобы смена плана была мгновенной
//               // (с проратацией), этот вызов корректен.
//               // Если нужна отмена в конце периода, измените на:
//               // await stripe.subscriptions.update(existingSubscription.stripe_sub_id, { cancel_at_period_end: true });
//               await stripe.subscriptions.cancel(
//                 existingSubscription.stripe_sub_id,
//               );
//               console.log(
//                 `[Stripe API] Existing subscription ${existingSubscription.stripe_sub_id} cancelled for user ${user.id} due to plan change.`,
//               );
//             } catch (stripeCancelError) {
//               console.error(
//                 'Ошибка при отмене существующей подписки в Stripe:',
//                 stripeCancelError,
//               );
//               return NextResponse.json(
//                 {
//                   error:
//                     'Failed to manage existing subscription during upgrade/downgrade.',
//                   details: (stripeCancelError as Error).message,
//                 },
//                 { status: 500 },
//               );
//             }
//           }
//         } else {
//           // If subscription exists but is NOT active, allow creation of new session
//           // Webhook will update existing record.
//           console.log(
//             `[Stripe API] Existing non-active subscription found for user ${user.id}. Proceeding with new session.`,
//           );
//         }
//       } else {
//         // No existing subscription record for the user, allow new subscription.
//         console.log(
//           `[Stripe API] No existing subscription record for user ${user.id}. Creating new subscription.`,
//         );
//       }

//       session = await stripe.checkout.sessions.create({
//         mode: 'subscription',
//         line_items: [
//           {
//             price: priceId,
//             quantity: 1,
//           },
//         ],
//         success_url: `${process.env.NEXT_PUBLIC_DOMAIN}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
//         cancel_url: `${process.env.NEXT_PUBLIC_DOMAIN}/cancel`,
//         subscription_data: {
//           // Используется для передачи метаданных в объект подписки Stripe
//           metadata: {
//             user_id: user.id,
//             type: type, // 'subscription_medium' или 'subscription_premium'
//           },
//         },
//         metadata: {
//           // Используется для передачи метаданных в объект Checkout Session
//           user_id: user.id,
//           type: type,
//         },
//       });
//     } else {
//       // --- ЛОГИКА ДЛЯ РАЗОВЫХ ПОКУПОК (ОСТАЕТСЯ БЕЗ ИЗМЕНЕНИЙ) ---
//       const upper = currency?.toUpperCase();
//       const unitPrices: Record<string, Record<number, number>> = {
//         USD: { 10: 99, 100: 1000 },
//         EUR: { 10: 90, 100: 950 },
//         CAD: { 10: 130, 100: 1200 },
//         RUB: { 10: 9900, 100: 99000 },
//         UAH: { 10: 4500, 100: 40000 },
//       };
//       const unitAmount = unitPrices[upper ?? '']?.[quantity ?? 0];

//       if (!unitAmount) {
//         return NextResponse.json(
//           { error: 'Invalid quantity or currency' },
//           { status: 400 },
//         );
//       }

//       session = await stripe.checkout.sessions.create({
//         mode: 'payment',
//         line_items: [
//           {
//             price_data: {
//               currency: upper?.toLowerCase(),
//               product_data: { name: `${quantity} карт (${upper})` },
//               unit_amount: unitAmount,
//             },
//             quantity: 1,
//           },
//         ],
//         success_url: `${process.env.NEXT_PUBLIC_DOMAIN}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
//         cancel_url: `${process.env.NEXT_PUBLIC_DOMAIN}/cancel`,
//         metadata: {
//           user_id: user.id,
//           cards: quantity?.toString() || '',
//           type: type || 'one_time',
//         },
//       });
//     }

//     return NextResponse.json({ url: session.url });
//   } catch (error: any) {
//     console.error('Ошибка в API-маршруте create-checkout-session:', error);
//     return NextResponse.json(
//       { error: 'Internal Server Error', details: error.message },
//       { status: 500 },
//     );
//   }
// }

// import { NextResponse } from 'next/server';
// import Stripe from 'stripe';
// import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
// import { addMonths, isBefore } from 'date-fns';

// export const runtime = 'nodejs';

// export async function POST(req: Request) {
//   try {
//     const authHeader = req.headers.get('authorization') || '';

//     if (!authHeader.startsWith('Bearer ')) {
//       return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
//     }
//     const token = authHeader.split(' ')[1];

//     const supabaseAdmin = createSupabaseAdmin(
//       process.env.NEXT_PUBLIC_SUPABASE_URL!,
//       process.env.SUPABASE_SERVICE_ROLE_KEY!,
//     );

//     const {
//       data: { user },
//       error: userErr,
//     } = await supabaseAdmin.auth.getUser(token);
//     if (userErr || !user) {
//       return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
//     }

//     const body = await req.json();
//     const { type, quantity, currency } = body;

//     const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {});

//     let session;

//     const priceId =
//       type === 'subscription_medium'
//         ? process.env.STRIPE_PRICE_ID_MEDIUM
//         : type === 'subscription_premium'
//           ? process.env.STRIPE_PRICE_ID_PREMIUM
//           : undefined;

//     if (priceId) {
//       let requestedPlanType: string | undefined;
//       if (priceId === process.env.STRIPE_PRICE_ID_MEDIUM) {
//         requestedPlanType = 'medium';
//       } else if (priceId === process.env.STRIPE_PRICE_ID_PREMIUM) {
//         requestedPlanType = 'premium';
//       }

//       // --- НАЧАЛО: КЛЮЧЕВЫЕ ИЗМЕНЕНИЯ В ЛОГИКЕ ПРОВЕРКИ ЛИМИТА СМЕН ПОДПИСКИ ---
//       // Получаем ОБА поля: last_subscription_change и changes_in_cycle_count
//       const { data: userSubscription, error: subCheckError } =
//         await supabaseAdmin
//           .from('subscriptions')
//           .select(
//             'last_subscription_change, plan, changes_in_cycle_count, status, stripe_sub_id',
//           ) // <--- ИСПРАВЛЕНО ЗДЕСЬ: добавлен 'stripe_sub_id'
//           .eq('user_id', user.id)
//           .maybeSingle();

//       if (subCheckError && subCheckError.code !== 'PGRST116') {
//         console.error(
//           'Ошибка при получении данных подписки для проверки лимита смен:',
//           subCheckError,
//         );
//         return NextResponse.json(
//           { error: 'Failed to retrieve subscription information for check.' },
//           { status: 500 },
//         );
//       }

//       // Сценарий 1: Пользователь пытается подписаться на тот же план, который у него УЖЕ ЕСТЬ.
//       // Эта проверка должна быть ПЕРЕД логикой лимита смен, так как это не "смена", а попытка подписаться на текущий план.
//       if (
//         userSubscription &&
//         userSubscription.status === 'active' &&
//         userSubscription.plan === requestedPlanType
//       ) {
//         return NextResponse.json(
//           {
//             error: `Вы уже подписаны на план "${requestedPlanType}".`,
//             code: 'ALREADY_SUBSCRIBED_TO_SAME_PLAN',
//           },
//           { status: 400 },
//         );
//       }

//       // Сценарий 2: Проверка на блокировку после второй смены в текущем цикле.
//       // Эта логика применяется только если подписка УЖЕ СУЩЕСТВУЕТ и были предыдущие смены.
//       if (userSubscription && userSubscription.last_subscription_change) {
//         const lastChangeDate = new Date(
//           userSubscription.last_subscription_change,
//         );
//         const now = new Date();
//         // Вычисляем конец 30-дневного окна от даты ПЕРВОЙ смены в цикле
//         const cycleEndDate = addMonths(lastChangeDate, 1);

//         // Если текущая дата раньше, чем конец разрешенного 30-дневного цикла
//         // И количество смен в этом цикле уже 2 (или больше),
//         // то это третья или более попытка смены в пределах этого 30-дневного окна.
//         if (
//           isBefore(now, cycleEndDate) &&
//           (userSubscription.changes_in_cycle_count ?? 0) >= 2
//         ) {
//           console.warn(
//             `Пользователь ${user.id} пытается совершить третью или более смену подписки слишком часто. Следующая смена разрешена после: ${cycleEndDate.toISOString()}`,
//           );
//           return NextResponse.json(
//             {
//               error: `Вы можете менять план подписки только дважды в месяц. Следующая смена разрешена после ${cycleEndDate.toLocaleDateString('ru-RU')}.`,
//               code: 'TOO_FREQUENT_SUBSCRIPTION_CHANGE',
//               nextAllowedDate: cycleEndDate.toISOString(),
//             },
//             { status: 429 }, // 429 Too Many Requests
//           );
//         }
//       }
//       // Если userSubscription отсутствует (у пользователя нет подписки),
//       // или last_subscription_change отсутствует/старше 30 дней,
//       // или количество смен меньше 2 - РАЗРЕШАЕМ создание сессии.
//       // --- КОНЕЦ: КЛЮЧЕВЫЕ ИЗМЕНЕНИЯ В ЛОГИКЕ ПРОВЕРКИ ЛИМИТА СМЕН ПОДПИСКИ ---

//       // --- СУЩЕСТВУЮЩАЯ ЛОГИКА ОБРАБОТКИ СМЕНЫ ПЛАНА (ОТМЕНА СТАРОЙ ПОДПИСКИ) ---
//       // Эта часть кода теперь выполняется ПОСЛЕ новой проверки лимита.
//       // Изменен запрос existingSubscription, чтобы избежать повторного запроса
//       // и использовать данные из userSubscription, если они есть.
//       const existingSubscription = userSubscription; // Используем уже полученные данные, если они есть

//       if (existingSubscription && existingSubscription.status === 'active') {
//         try {
//           // ВНИМАНИЕ: Теперь `userSubscription.stripe_sub_id` доступен благодаря изменению в `.select()` выше.
//           await stripe.subscriptions.cancel(existingSubscription.stripe_sub_id);
//           console.log(
//             `[Stripe API] Существующая подписка ${existingSubscription.stripe_sub_id} отменена для пользователя ${user.id} из-за смены плана.`,
//           );
//         } catch (stripeCancelError) {
//           console.error(
//             'Ошибка при отмене существующей подписки в Stripe:',
//             stripeCancelError,
//           );
//           return NextResponse.json(
//             {
//               error:
//                 'Не удалось управлять существующей подпиской при обновлении/понижении.',
//               details: (stripeCancelError as Error).message,
//             },
//             { status: 500 },
//           );
//         }
//       } else if (existingSubscription) {
//         console.log(
//           `[Stripe API] Найдена неактивная подписка для пользователя ${user.id}. Продолжаем с новой сессией.`,
//         );
//       } else {
//         console.log(
//           `[Stripe API] Нет записи о подписке для пользователя ${user.id}. Создаем новую подписку.`,
//         );
//       }

//       session = await stripe.checkout.sessions.create({
//         mode: 'subscription',
//         line_items: [{ price: priceId, quantity: 1 }],
//         success_url: `${process.env.NEXT_PUBLIC_DOMAIN}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
//         cancel_url: `${process.env.NEXT_PUBLIC_DOMAIN}/cancel`,
//         subscription_data: {
//           metadata: {
//             user_id: user.id,
//             type: type,
//             // changes_in_cycle_count:
//             //   userSubscription?.changes_in_cycle_count ?? 0,
//           },
//         },
//         metadata: { user_id: user.id, type: type },
//       });
//     } else {
//       // --- ЛОГИКА ДЛЯ РАЗОВЫХ ПОКУПОК (без изменений) ---
//       const upper = currency?.toUpperCase();
//       const unitPrices: Record<string, Record<number, number>> = {
//         USD: { 10: 99, 100: 1000 },
//         EUR: { 10: 90, 100: 950 },
//         CAD: { 10: 130, 100: 1200 },
//         RUB: { 10: 9900, 100: 99000 },
//         UAH: { 10: 4500, 100: 40000 },
//       };
//       const unitAmount = unitPrices[upper ?? '']?.[quantity ?? 0];

//       if (!unitAmount) {
//         return NextResponse.json(
//           { error: 'Неверное количество или валюта' },
//           { status: 400 },
//         );
//       }

//       session = await stripe.checkout.sessions.create({
//         mode: 'payment',
//         line_items: [
//           {
//             price_data: {
//               currency: upper?.toLowerCase(),
//               product_data: { name: `${quantity} карт (${upper})` },
//               unit_amount: unitAmount,
//             },
//             quantity: 1,
//           },
//         ],
//         success_url: `${process.env.NEXT_PUBLIC_DOMAIN}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
//         cancel_url: `${process.env.NEXT_PUBLIC_DOMAIN}/cancel`,
//         metadata: {
//           user_id: user.id,
//           cards: quantity?.toString() || '',
//           type: type || 'one_time',
//         },
//       });
//     }

//     return NextResponse.json({ url: session.url });
//   } catch (error: any) {
//     console.error('Ошибка в API-маршруте create-checkout-session:', error);
//     return NextResponse.json(
//       { error: 'Внутренняя ошибка сервера', details: error.message },
//       { status: 500 },
//     );
//   }
// }
//TODO:
// import { NextResponse } from 'next/server';
// import Stripe from 'stripe';
// import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
// import { addMonths, isBefore } from 'date-fns';

// export const runtime = 'nodejs';

// export async function POST(req: Request) {
//   try {
//     const authHeader = req.headers.get('authorization') || '';

//     if (!authHeader.startsWith('Bearer ')) {
//       return NextResponse.json(
//         { error: 'Не аутентифицирован' },
//         { status: 401 },
//       );
//     }
//     const token = authHeader.split(' ')[1];

//     const supabaseAdmin = createSupabaseAdmin(
//       process.env.NEXT_PUBLIC_SUPABASE_URL!,
//       process.env.SUPABASE_SERVICE_ROLE_KEY!,
//     );

//     const {
//       data: { user },
//       error: userErr,
//     } = await supabaseAdmin.auth.getUser(token);
//     if (userErr || !user) {
//       return NextResponse.json(
//         { error: 'Не аутентифицирован' },
//         { status: 401 },
//       );
//     }

//     const body = await req.json();
//     const { type, quantity, currency } = body;

//     const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {});

//     let session; // Переменная для хранения Stripe Checkout Session, если она будет создана

//     const priceId =
//       type === 'subscription_medium'
//         ? process.env.STRIPE_PRICE_ID_MEDIUM
//         : type === 'subscription_premium'
//           ? process.env.STRIPE_PRICE_ID_PREMIUM
//           : undefined;

//     // Проверяем, является ли запрос на подписку
//     if (priceId) {
//       let requestedPlanType: string | undefined;
//       if (priceId === process.env.STRIPE_PRICE_ID_MEDIUM) {
//         requestedPlanType = 'medium';
//       } else if (priceId === process.env.STRIPE_PRICE_ID_PREMIUM) {
//         requestedPlanType = 'premium';
//       }

//       // --- НАЧАЛО: КЛЮЧЕВЫЕ ИЗМЕНЕНИЯ В ЛОГИКЕ ПРОВЕРКИ ЛИМИТА СМЕН ПОДПИСКИ И ОТЛОЖЕННОЙ СМЕНЫ ---
//       // Получаем ВСЕ необходимые поля для проверки:
//       // last_subscription_change, plan, changes_in_cycle_count, status, stripe_sub_id, current_period_end, pending_plan
//       const { data: userSubscription, error: subCheckError } =
//         await supabaseAdmin
//           .from('subscriptions')
//           .select(
//             'last_subscription_change, plan, changes_in_cycle_count, status, stripe_sub_id, current_period_end, pending_plan',
//           )
//           .eq('user_id', user.id)
//           .maybeSingle(); // maybeSingle() возвращает null, если запись не найдена, вместо ошибки

//       if (subCheckError && subCheckError.code !== 'PGRST116') {
//         // PGRST116 - это код "нет строк", его игнорируем
//         console.error(
//           'Ошибка при получении данных подписки для проверки лимита смен:',
//           subCheckError,
//         );
//         return NextResponse.json(
//           { error: 'Не удалось получить информацию о подписке для проверки.' },
//           { status: 500 },
//         );
//       }

//       // Сценарий 1: Пользователь пытается подписаться на тот же план, который у него УЖЕ ЕСТЬ.
//       if (
//         userSubscription &&
//         userSubscription.status === 'active' &&
//         userSubscription.plan === requestedPlanType
//       ) {
//         return NextResponse.json(
//           {
//             error: `Вы уже подписаны на план "${requestedPlanType}".`,
//             code: 'ALREADY_SUBSCRIBED_TO_SAME_PLAN',
//           },
//           { status: 400 },
//         );
//       }

//       // Сценарий 2: Проверка на блокировку после второй смены в текущем цикле.
//       // Эта логика применяется только если подписка УЖЕ СУЩЕСТВУЕТ и были предыдущие смены.
//       if (userSubscription && userSubscription.last_subscription_change) {
//         const lastChangeDate = new Date(
//           userSubscription.last_subscription_change,
//         );
//         const now = new Date();
//         // Вычисляем конец 30-дневного окна от даты ПЕРВОЙ смены в цикле
//         const cycleEndDate = addMonths(lastChangeDate, 1);

//         // Если текущая дата раньше, чем конец разрешенного 30-дневного цикла
//         // И количество смен в этом цикле уже 2 (или больше),
//         // то это третья или более попытка смены в пределах этого 30-дневного окна.
//         if (
//           isBefore(now, cycleEndDate) &&
//           (userSubscription.changes_in_cycle_count ?? 0) >= 2
//         ) {
//           console.warn(
//             `Пользователь ${user.id} пытается совершить третью или более смену подписки слишком часто. Следующая смена разрешена после: ${cycleEndDate.toISOString()}`,
//           );
//           return NextResponse.json(
//             {
//               error: `Вы можете менять план подписки только дважды в месяц. Следующая смена разрешена после ${cycleEndDate.toLocaleDateString('ru-RU')}.`,
//               code: 'TOO_FREQUENT_SUBSCRIPTION_CHANGE',
//               nextAllowedDate: cycleEndDate.toISOString(),
//             },
//             { status: 429 }, // 429 Too Many Requests
//           );
//         }
//       }

//       // --- КЛЮЧЕВАЯ НОВАЯ ЛОГИКА: ОБРАБОТКА ОТЛОЖЕННОЙ СМЕНЫ ПЛАНА ---
//       // Если у пользователя есть АКТИВНАЯ подписка
//       if (userSubscription && userSubscription.status === 'active') {
//         // Проверяем, не запросил ли пользователь уже этот план как отложенный
//         if (userSubscription.pending_plan === requestedPlanType) {
//           return NextResponse.json(
//             {
//               message: `Смена плана на "${requestedPlanType}" уже запланирована и будет активирована с ${new Date(userSubscription.current_period_end!).toLocaleDateString('ru-RU')}.`,
//               code: 'SUBSCRIPTION_CHANGE_ALREADY_QUEUED',
//             },
//             { status: 200 },
//           );
//         }

//         try {
//           // 1. Помечаем существующую подписку в Stripe на отмену в конце текущего периода.
//           // Это НЕ отменяет ее немедленно, а лишь планирует отмену.
//           await stripe.subscriptions.update(userSubscription.stripe_sub_id, {
//             cancel_at_period_end: true,
//           });
//           console.log(
//             `[Stripe API] Существующая подписка ${userSubscription.stripe_sub_id} для пользователя ${user.id} помечена на отмену в конце периода.`,
//           );

//           // 2. Обновляем запись в нашей БД Supabase:
//           //    - Устанавливаем pending_plan на запрошенный новый план.
//           //    - Обновляем updated_at.
//           //    - ВАЖНО: Мы НЕ меняем 'status' здесь на 'pending_cancel'.
//           //      Статус 'active' должен оставаться до тех пор, пока Stripe
//           //      не уведомит нас о фактическом завершении подписки через вебхук.
//           const { error: updatePendingPlanError } = await supabaseAdmin
//             .from('subscriptions')
//             .upsert(
//               {
//                 user_id: user.id,
//                 pending_plan: requestedPlanType,
//                 updated_at: new Date().toISOString(),
//               },
//               { onConflict: 'user_id' }, // Обновляем существующую запись
//             );

//           if (updatePendingPlanError) {
//             console.error(
//               'Ошибка при сохранении pending_plan в Supabase:',
//               updatePendingPlanError,
//             );
//             return NextResponse.json(
//               {
//                 error: 'Не удалось сохранить информацию о предстоящем плане.',
//                 details: updatePendingPlanError.message,
//               },
//               { status: 500 },
//             );
//           }

//           // 3. Возвращаем успешный ответ клиенту, НЕ перенаправляя на Stripe Checkout.
//           // Сообщаем, что смена запланирована.
//           const activationDate = userSubscription.current_period_end
//             ? new Date(userSubscription.current_period_end).toLocaleDateString(
//                 'ru-RU',
//               )
//             : 'конец текущего периода'; // Fallback если дата не найдена

//           return NextResponse.json(
//             {
//               message: `Ваш план "${requestedPlanType}" будет активирован с ${activationDate}. Текущая подписка будет действовать до этого времени.`,
//               code: 'SUBSCRIPTION_CHANGE_QUEUED',
//             },
//             { status: 200 }, // Возвращаем 200 OK, так как действие успешно запланировано
//           );
//         } catch (stripeUpdateError) {
//           console.error(
//             'Ошибка при обновлении существующей подписки в Stripe для отмены в конце периода:',
//             stripeUpdateError,
//           );
//           return NextResponse.json(
//             {
//               error:
//                 'Не удалось запланировать изменение существующей подписки.',
//               details: (stripeUpdateError as Error).message,
//             },
//             { status: 500 },
//           );
//         }
//       } else {
//         // --- ЛОГИКА ДЛЯ ПЕРВИЧНОЙ ПОДПИСКИ (если у пользователя НЕТ активной подписки) ---
//         console.log(
//           `[Stripe API] Нет активной подписки для пользователя ${user.id}. Создаем новую подписку.`,
//         );

//         session = await stripe.checkout.sessions.create({
//           mode: 'subscription',
//           line_items: [{ price: priceId, quantity: 1 }],
//           success_url: `${process.env.NEXT_PUBLIC_DOMAIN}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
//           cancel_url: `${process.env.NEXT_PUBLIC_DOMAIN}/cancel`,
//           subscription_data: {
//             metadata: {
//               user_id: user.id,
//               type: type,
//             },
//           },
//           metadata: { user_id: user.id, type: type },
//         });
//         // Для первичной подписки возвращаем URL для редиректа на Stripe Checkout
//         return NextResponse.json({ url: session.url });
//       }
//     } else {
//       // --- ЛОГИКА ДЛЯ РАЗОВЫХ ПОКУПОК (без изменений) ---
//       const upper = currency?.toUpperCase();
//       const unitPrices: Record<string, Record<number, number>> = {
//         USD: { 10: 99, 100: 1000 },
//         EUR: { 10: 90, 100: 950 },
//         CAD: { 10: 130, 100: 1200 },
//         RUB: { 10: 9900, 100: 99000 },
//         UAH: { 10: 4500, 100: 40000 },
//       };
//       const unitAmount = unitPrices[upper ?? '']?.[quantity ?? 0];

//       if (!unitAmount) {
//         return NextResponse.json(
//           { error: 'Неверное количество или валюта' },
//           { status: 400 },
//         );
//       }

//       session = await stripe.checkout.sessions.create({
//         mode: 'payment',
//         line_items: [
//           {
//             price_data: {
//               currency: upper?.toLowerCase(),
//               product_data: { name: `${quantity} карт (${upper})` },
//               unit_amount: unitAmount,
//             },
//             quantity: 1,
//           },
//         ],
//         success_url: `${process.env.NEXT_PUBLIC_DOMAIN}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
//         cancel_url: `${process.env.NEXT_PUBLIC_DOMAIN}/cancel`,
//         metadata: {
//           user_id: user.id,
//           cards: quantity?.toString() || '',
//           type: type || 'one_time',
//         },
//       });
//       return NextResponse.json({ url: session.url });
//     }
//   } catch (error: any) {
//     console.error('Ошибка в API-маршруте create-checkout-session:', error);
//     return NextResponse.json(
//       { error: 'Внутренняя ошибка сервера', details: error.message },
//       { status: 500 },
//     );
//   }
// }

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { addMonths, isBefore } from 'date-fns';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';

    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'not uathentificated' },
        { status: 401 },
      );
    }
    const token = authHeader.split(' ')[1];

    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const {
      data: { user },
      error: userErr,
    } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !user) {
      return NextResponse.json(
        { error: 'Not aithentificated' },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { type, quantity, currency } = body;

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {});

    let session; // Переменная для хранения Stripe Checkout Session, если она будет создана

    const priceId =
      type === 'subscription_medium'
        ? process.env.STRIPE_PRICE_ID_MEDIUM
        : type === 'subscription_premium'
          ? process.env.STRIPE_PRICE_ID_PREMIUM
          : undefined;

    // Проверяем, является ли запрос на подписку
    if (priceId) {
      let requestedPlanType: string | undefined;
      if (priceId === process.env.STRIPE_PRICE_ID_MEDIUM) {
        requestedPlanType = 'medium';
      } else if (priceId === process.env.STRIPE_PRICE_ID_PREMIUM) {
        requestedPlanType = 'premium';
      }

      // --- НАЧАЛО: КЛЮЧЕВЫЕ ИЗМЕНЕНИЯ В ЛОГИКЕ ПРОВЕРКИ ЛИМИТА СМЕН ПОДПИСКИ И ОТЛОЖЕННОЙ СМЕНЫ ---
      // Получаем ВСЕ необходимые поля для проверки:
      // last_subscription_change, plan, changes_in_cycle_count, status, stripe_sub_id, current_period_end, pending_plan
      const { data: userSubscription, error: subCheckError } =
        await supabaseAdmin
          .from('subscriptions')
          .select(
            'last_subscription_change, plan, changes_in_cycle_count, status, stripe_sub_id, current_period_end, pending_plan',
          )
          .eq('user_id', user.id)
          .maybeSingle(); // maybeSingle() возвращает null, если запись не найдена, вместо ошибки

      if (subCheckError && subCheckError.code !== 'PGRST116') {
        // PGRST116 - это код "нет строк", его игнорируем
        console.error(
          'Ошибка при получении данных подписки для проверки лимита смен:',
          subCheckError,
        );
        return NextResponse.json(
          { error: 'Не удалось получить информацию о подписке для проверки.' },
          { status: 500 },
        );
      }

      // Сценарий 1: Пользователь пытается подписаться на тот же план, который у него УЖЕ ЕСТЬ.
      if (
        userSubscription &&
        userSubscription.status === 'active' &&
        userSubscription.plan === requestedPlanType
      ) {
        return NextResponse.json(
          {
            error: `Вы уже подписаны на план "${requestedPlanType}".`,
            code: 'ALREADY_SUBSCRIBED_TO_SAME_PLAN',
          },
          { status: 400 },
        );
      }

      // Сценарий 2: Проверка на блокировку после второй смены в текущем цикле.
      // Эта логика применяется только если подписка УЖЕ СУЩЕСТВУЕТ и были предыдущие смены.
      if (userSubscription && userSubscription.last_subscription_change) {
        const lastChangeDate = new Date(
          userSubscription.last_subscription_change,
        );
        const now = new Date();
        // Вычисляем конец 30-дневного окна от даты ПЕРВОЙ смены в цикле
        const cycleEndDate = addMonths(lastChangeDate, 1);

        // Если текущая дата раньше, чем конец разрешенного 30-дневного цикла
        // И количество смен в этом цикле уже 2 (или больше),
        // то это третья или более попытка смены в пределах этого 30-дневного окна.
        if (
          isBefore(now, cycleEndDate) &&
          (userSubscription.changes_in_cycle_count ?? 0) >= 2
        ) {
          // console.warn(
          //   `Пользователь ${user.id} пытается совершить третью или более смену подписки слишком часто. Следующая смена разрешена после: ${cycleEndDate.toISOString()}`,
          // );
          return NextResponse.json(
            {
              error: `Вы можете менять план подписки только дважды в месяц. Следующая смена разрешена после ${cycleEndDate.toLocaleDateString('ru-RU')}.`,
              code: 'TOO_FREQUENT_SUBSCRIPTION_CHANGE',
              nextAllowedDate: cycleEndDate.toISOString(),
            },
            { status: 429 }, // 429 Too Many Requests
          );
        }
      }

      // --- КЛЮЧЕВАЯ НОВАЯ ЛОГИКА: ОБРАБОТКА ОТЛОЖЕННОЙ СМЕНЫ ПЛАНА ---
      // Если у пользователя есть АКТИВНАЯ подписка
      if (userSubscription && userSubscription.status === 'active') {
        // Проверяем, не запросил ли пользователь уже этот план как отложенный
        if (userSubscription.pending_plan === requestedPlanType) {
          return NextResponse.json(
            {
              message: `Смена плана на "${requestedPlanType}" уже запланирована и будет активирована с ${new Date(userSubscription.current_period_end!).toLocaleDateString('ru-RU')}.`,
              code: 'SUBSCRIPTION_CHANGE_ALREADY_QUEUED',
            },
            { status: 200 },
          );
        }

        try {
          // 1. Помечаем существующую подписку в Stripe на отмену в конце текущего периода.
          // Это НЕ отменяет ее немедленно, а лишь планирует отмену.
          await stripe.subscriptions.update(userSubscription.stripe_sub_id, {
            cancel_at_period_end: true,
          });
          // console.log(
          //   `[Stripe API] Существующая подписка ${userSubscription.stripe_sub_id} для пользователя ${user.id} помечена на отмену в конце периода.`,
          // );

          // 2. Обновляем запись в нашей БД Supabase:
          //    - Устанавливаем pending_plan на запрошенный новый план.
          //    - Обновляем updated_at.
          //    - ВАЖНО: Мы НЕ меняем 'status' здесь на 'pending_cancel'.
          //      Статус 'active' должен оставаться до тех пор, пока Stripe
          //      не уведомит нас о фактическом завершении подписки через вебхук.
          const { error: updatePendingPlanError } = await supabaseAdmin
            .from('subscriptions')
            .upsert(
              {
                user_id: user.id,
                pending_plan: requestedPlanType,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id' }, // Обновляем существующую запись
            );

          if (updatePendingPlanError) {
            console.error(
              'Ошибка при сохранении pending_plan в Supabase:',
              updatePendingPlanError,
            );
            return NextResponse.json(
              {
                error: 'Не удалось сохранить информацию о предстоящем плане.',
                details: updatePendingPlanError.message,
              },
              { status: 500 },
            );
          }

          // 3. Возвращаем успешный ответ клиенту, НЕ перенаправляя на Stripe Checkout.
          // Сообщаем, что смена запланирована.
          const activationDate = userSubscription.current_period_end
            ? new Date(userSubscription.current_period_end).toLocaleDateString(
                'ru-RU',
              )
            : 'конец текущего периода'; // Fallback если дата не найдена

          return NextResponse.json(
            {
              message: `Ваш план "${requestedPlanType}" будет активирован с ${activationDate}. Текущая подписка будет действовать до этого времени.`,
              code: 'SUBSCRIPTION_CHANGE_QUEUED',
            },
            { status: 200 }, // Возвращаем 200 OK, так как действие успешно запланировано
          );
        } catch (stripeUpdateError) {
          console.error(
            'Ошибка при обновлении существующей подписки в Stripe для отмены в конце периода:',
            stripeUpdateError,
          );
          return NextResponse.json(
            {
              error:
                'Не удалось запланировать изменение существующей подписки.',
              details: (stripeUpdateError as Error).message,
            },
            { status: 500 },
          );
        }
      } else {
        // --- ЛОГИКА ДЛЯ ПЕРВИЧНОЙ ПОДПИСКИ (если у пользователя НЕТ активной подписки) ---
        // console.log(
        //   `[Stripe API] Нет активной подписки для пользователя ${user.id}. Создаем новую подписку.`,
        // );

        session = await stripe.checkout.sessions.create({
          mode: 'subscription',
          line_items: [{ price: priceId, quantity: 1 }],
          success_url: `${process.env.NEXT_PUBLIC_DOMAIN}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.NEXT_PUBLIC_DOMAIN}/cancel`,
          subscription_data: {
            metadata: {
              user_id: user.id,
              type: type,
            },
          },
          metadata: { user_id: user.id, type: type },
        });
        // Для первичной подписки возвращаем URL для редиректа на Stripe Checkout
        return NextResponse.json({ url: session.url });
      }
    } else {
      // --- ЛОГИКА ДЛЯ РАЗОВЫХ ПОКУПОК (без изменений) ---
      const upper = currency?.toUpperCase();
      const unitPrices: Record<string, Record<number, number>> = {
        USD: { 10: 99, 100: 1000 },
        EUR: { 10: 90, 100: 950 },
        CAD: { 10: 130, 100: 1200 },
        RUB: { 10: 9900, 100: 99000 },
        UAH: { 10: 4500, 100: 40000 },
      };
      const unitAmount = unitPrices[upper ?? '']?.[quantity ?? 0];

      if (!unitAmount) {
        return NextResponse.json(
          { error: 'Неверное количество или валюта' },
          { status: 400 },
        );
      }

      session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: upper?.toLowerCase(),
              product_data: { name: `${quantity} карт (${upper})` },
              unit_amount: unitAmount,
            },
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXT_PUBLIC_DOMAIN}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_DOMAIN}/cancel`,
        metadata: {
          user_id: user.id,
          cards: quantity?.toString() || '',
          type: type || 'one_time',
        },
      });
      return NextResponse.json({ url: session.url });
    }
  } catch (error: any) {
    console.error('Ошибка в API-маршруте create-checkout-session:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера', details: error.message },
      { status: 500 },
    );
  }
}
