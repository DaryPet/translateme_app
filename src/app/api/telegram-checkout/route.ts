// //TODO:
// // src/app/api/telegram-checkout/route.ts
// import { NextResponse } from 'next/server';
// import Stripe from 'stripe';
// import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
// import { addMonths, isBefore } from 'date-fns';

// export const runtime = 'nodejs';

// /**
//  * Этот API-маршрут предназначен исключительно для Telegram-бота.
//  * Он не требует JWT-токена пользователя, а использует Telegram ID.
//  */
// export async function POST(req: Request) {
//   //   if (req.method !== 'POST') {
//   //     return NextResponse.json(
//   //       { error: 'Method Not Allowed. Expected POST.' },
//   //       { status: 405 },
//   //     );
//   //   }

//   let body;
//   try {
//     body = await req.json();
//   } catch (error) {
//     console.error('Ошибка при разборе JSON в POST-запросе:', error);
//     return NextResponse.json(
//       {
//         error: 'Invalid JSON body. Please check the request sent from the bot.',
//       },
//       { status: 400 },
//     );
//   }

//   try {
//     const { type, quantity, currency, telegram_id, secret } = body;

//     if (!process.env.BOT_API_SECRET) {
//       throw new Error('BOT_API_SECRET not set');
//     }
//     if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
//       throw new Error('NEXT_PUBLIC_SUPABASE_URL not set');
//     }
//     if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
//       throw new Error('SUPABASE_SERVICE_ROLE_KEY not set');
//     }
//     if (!process.env.STRIPE_SECRET_KEY) {
//       throw new Error('STRIPE_SECRET_KEY not set');
//     }

//     if (secret !== process.env.BOT_API_SECRET) {
//       console.error('Ошибка аутентификации: Неверный секретный ключ.');
//       return NextResponse.json({ error: 'Invalid secret' }, { status: 403 });
//     }

//     const supabaseAdmin = createSupabaseAdmin(
//       process.env.NEXT_PUBLIC_SUPABASE_URL!,
//       process.env.SUPABASE_SERVICE_ROLE_KEY!,
//     );

//     const { data: userRecord, error: userRecordErr } = await supabaseAdmin
//       .from('telegram_users')
//       .select('user_id')
//       .eq('telegram_id', telegram_id)
//       .maybeSingle();

//     if (userRecordErr || !userRecord) {
//       console.error('Ошибка при поиске user_id по telegram_id:', userRecordErr);
//       return NextResponse.json(
//         { error: 'User not found in Supabase' },
//         { status: 404 },
//       );
//     }
//     const userId = userRecord.user_id;

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

//       const { data: userSubscription, error: subCheckError } =
//         await supabaseAdmin
//           .from('subscriptions')
//           .select(
//             'last_subscription_change, plan, changes_in_cycle_count, status, stripe_sub_id, current_period_end, pending_plan',
//           )
//           .eq('user_id', userId)
//           .maybeSingle();

//       if (subCheckError && subCheckError.code !== 'PGRST116') {
//         console.error(
//           'Ошибка при получении данных подписки для проверки:',
//           subCheckError,
//         );
//         return NextResponse.json(
//           { error: 'Не удалось получить информацию о подписке.' },
//           { status: 500 },
//         );
//       }

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

//       if (userSubscription && userSubscription.last_subscription_change) {
//         const lastChangeDate = new Date(
//           userSubscription.last_subscription_change,
//         );
//         const now = new Date();
//         const cycleEndDate = addMonths(lastChangeDate, 1);
//         if (
//           isBefore(now, cycleEndDate) &&
//           (userSubscription.changes_in_cycle_count ?? 0) >= 2
//         ) {
//           return NextResponse.json(
//             {
//               error: `Вы можете менять план подписки только дважды в месяц. Следующая смена разрешена после ${cycleEndDate.toLocaleDateString('ru-RU')}.`,
//               code: 'TOO_FREQUENT_SUBSCRIPTION_CHANGE',
//               nextAllowedDate: cycleEndDate.toISOString(),
//             },
//             { status: 429 },
//           );
//         }
//       }

//       if (userSubscription && userSubscription.status === 'active') {
//         if (userSubscription.pending_plan === requestedPlanType) {
//           return NextResponse.json(
//             {
//               message: `Смена плана на "${requestedPlanType}" уже запланирована.`,
//               code: 'SUBSCRIPTION_CHANGE_ALREADY_QUEUED',
//             },
//             { status: 200 },
//           );
//         }

//         try {
//           await stripe.subscriptions.update(userSubscription.stripe_sub_id, {
//             cancel_at_period_end: true,
//           });

//           const { error: updatePendingPlanError } = await supabaseAdmin
//             .from('subscriptions')
//             .upsert(
//               {
//                 user_id: userId,
//                 pending_plan: requestedPlanType,
//                 updated_at: new Date().toISOString(),
//               },
//               { onConflict: 'user_id' },
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

//           const activationDate = userSubscription.current_period_end
//             ? new Date(userSubscription.current_period_end).toLocaleDateString(
//                 'ru-RU',
//               )
//             : 'конец текущего периода';

//           return NextResponse.json(
//             {
//               message: `Ваш план "${requestedPlanType}" будет активирован с ${activationDate}.`,
//               code: 'SUBSCRIPTION_CHANGE_QUEUED',
//             },
//             { status: 200 },
//           );
//         } catch (stripeUpdateError) {
//           console.error(
//             'Ошибка при обновлении подписки в Stripe:',
//             stripeUpdateError,
//           );
//           return NextResponse.json(
//             {
//               error: 'Не удалось запланировать изменение подписки.',
//               details: (stripeUpdateError as Error).message,
//             },
//             { status: 500 },
//           );
//         }
//       } else {
//         session = await stripe.checkout.sessions.create({
//           mode: 'subscription',
//           line_items: [{ price: priceId, quantity: 1 }],
//           // +++ CHANGED: возврат в Telegram-бота, а не на сайт:
//           success_url: 'https://t.me/ai_tarot_soul_bot?start=paid',
//           cancel_url: 'https://t.me/ai_tarot_soul_bot?start=cancel',

//           // +++ END CHANGED
//           subscription_data: {
//             metadata: {
//               user_id: userId,
//               type: type,
//             },
//           },
//           metadata: { user_id: userId, type: type },
//         });
//         return NextResponse.json({ url: session.url });
//       }
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
//         // +++ CHANGED: возврат в Telegram-бота, а не на сайт:
//         success_url: 'https://t.me/ai_tarot_soul_bot?start=paid',
//         cancel_url: 'https://t.me/ai_tarot_soul_bot?start=cancel',

//         // +++ END CHANGED
//         metadata: {
//           user_id: userId,
//           cards: quantity?.toString() || '',
//           type: type || 'one_time',
//         },
//       });
//       return NextResponse.json({ url: session.url });
//     }
//   } catch (error: any) {
//     console.error(
//       'Критическая ошибка в API-маршруте telegram-checkout:',
//       error,
//     );
//     return NextResponse.json(
//       { error: 'Внутренняя ошибка сервера', details: error.message },
//       { status: 500 },
//     );
//   }
// }


// src/app/api/telegram-checkout/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { addMonths, isBefore } from 'date-fns';

export const runtime = 'nodejs';

/**
 * Этот API-маршрут предназначен исключительно для Telegram-бота.
 * Он не требует JWT-токена пользователя, а использует Telegram ID.
 */
export async function POST(req: Request) {
  //   if (req.method !== 'POST') {
  //     return NextResponse.json(
  //       { error: 'Method Not Allowed. Expected POST.' },
  //       { status: 405 },
  //     );
  //   }

  let body;
  try {
    body = await req.json();
  } catch (error) {
    console.error('Ошибка при разборе JSON в POST-запросе:', error);
    return NextResponse.json(
      {
        error: 'Invalid JSON body. Please check the request sent from the bot.',
      },
      { status: 400 },
    );
  }

  try {
    const { type, quantity, currency, telegram_id, secret } = body;

    if (!process.env.BOT_API_SECRET) {
      throw new Error('BOT_API_SECRET not set');
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL not set');
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY not set');
    }
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY not set');
    }

    if (secret !== process.env.BOT_API_SECRET) {
      console.error('Ошибка аутентификации: Неверный секретный ключ.');
      return NextResponse.json({ error: 'Invalid secret' }, { status: 403 });
    }

    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data: userRecord, error: userRecordErr } = await supabaseAdmin
      .from('telegram_users')
      .select('user_id')
      .eq('telegram_id', telegram_id)
      .maybeSingle();

    if (userRecordErr || !userRecord) {
      console.error('Ошибка при поиске user_id по telegram_id:', userRecordErr);
      return NextResponse.json(
        { error: 'User not found in Supabase' },
        { status: 404 },
      );
    }
    const userId = userRecord.user_id;

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {});
    let session;

    /* =====================================================================
       НОВОЕ: явная отмена подписки из бота
       ===================================================================== */
    if (type === 'cancel_subscription') {
      const { data: userSubscription, error: subErr } = await supabaseAdmin
        .from('subscriptions')
        .select('status, stripe_sub_id, current_period_end')
        .eq('user_id', userId)
        .maybeSingle();

      if (subErr && subErr.code !== 'PGRST116') {
        return NextResponse.json(
          { error: 'Не удалось получить информацию о подписке.' },
          { status: 500 },
        );
      }

      if (
        !userSubscription ||
        userSubscription.status !== 'active' ||
        !userSubscription.stripe_sub_id
      ) {
        return NextResponse.json(
          { error: 'Активная подписка не найдена.' },
          { status: 400 },
        );
      }

      await stripe.subscriptions.update(userSubscription.stripe_sub_id, {
        cancel_at_period_end: true,
      });

      // (опционально) можно сохранить отметку у себя, если есть колонка для этого
      await supabaseAdmin
        .from('subscriptions')
        .upsert(
          {
            user_id: userId,
            updated_at: new Date().toISOString(),
            // cancel_at_period_end: true, // раскомментируйте, если у вас есть такое поле
          },
          { onConflict: 'user_id' },
        );

      const when = userSubscription.current_period_end
        ? new Date(userSubscription.current_period_end).toLocaleDateString(
            'ru-RU',
          )
        : 'конец текущего периода';

      return NextResponse.json({
        message: `Отмена подписки запланирована. Доступ действует до ${when}.`,
        code: 'SUBSCRIPTION_CANCEL_SCHEDULED',
      });
    }
    /* =================================================================== */

    const priceId =
      type === 'subscription_medium'
        ? process.env.STRIPE_PRICE_ID_MEDIUM
        : type === 'subscription_premium'
          ? process.env.STRIPE_PRICE_ID_PREMIUM
          : undefined;

    if (priceId) {
      let requestedPlanType: string | undefined;
      if (priceId === process.env.STRIPE_PRICE_ID_MEDIUM) {
        requestedPlanType = 'medium';
      } else if (priceId === process.env.STRIPE_PRICE_ID_PREMIUM) {
        requestedPlanType = 'premium';
      }

      const { data: userSubscription, error: subCheckError } =
        await supabaseAdmin
          .from('subscriptions')
          .select(
            'last_subscription_change, plan, changes_in_cycle_count, status, stripe_sub_id, current_period_end, pending_plan',
          )
          .eq('user_id', userId)
          .maybeSingle();

      if (subCheckError && subCheckError.code !== 'PGRST116') {
        console.error(
          'Ошибка при получении данных подписки для проверки:',
          subCheckError,
        );
        return NextResponse.json(
          { error: 'Не удалось получить информацию о подписке.' },
          { status: 500 },
        );
      }

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

      if (userSubscription && userSubscription.last_subscription_change) {
        const lastChangeDate = new Date(
          userSubscription.last_subscription_change,
        );
        const now = new Date();
        const cycleEndDate = addMonths(lastChangeDate, 1);
        if (
          isBefore(now, cycleEndDate) &&
          (userSubscription.changes_in_cycle_count ?? 0) >= 2
        ) {
          return NextResponse.json(
            {
              error: `Вы можете менять план подписки только дважды в месяц. Следующая смена разрешена после ${cycleEndDate.toLocaleDateString('ru-RU')}.`,
              code: 'TOO_FREQUENT_SUBSCRIPTION_CHANGE',
              nextAllowedDate: cycleEndDate.toISOString(),
            },
            { status: 429 },
          );
        }
      }

      if (userSubscription && userSubscription.status === 'active') {
        if (userSubscription.pending_plan === requestedPlanType) {
          return NextResponse.json(
            {
              message: `Смена плана на "${requestedPlanType}" уже запланирована.`,
              code: 'SUBSCRIPTION_CHANGE_ALREADY_QUEUED',
            },
            { status: 200 },
          );
        }

        try {
          await stripe.subscriptions.update(userSubscription.stripe_sub_id, {
            cancel_at_period_end: true,
          });

          const { error: updatePendingPlanError } = await supabaseAdmin
            .from('subscriptions')
            .upsert(
              {
                user_id: userId,
                pending_plan: requestedPlanType,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id' },
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

          const activationDate = userSubscription.current_period_end
            ? new Date(userSubscription.current_period_end).toLocaleDateString(
                'ru-RU',
              )
            : 'конец текущего периода';

          return NextResponse.json(
            {
              message: `Ваш план "${requestedPlanType}" будет активирован с ${activationDate}.`,
              code: 'SUBSCRIPTION_CHANGE_QUEUED',
            },
            { status: 200 },
          );
        } catch (stripeUpdateError) {
          console.error(
            'Ошибка при обновлении подписки в Stripe:',
            stripeUpdateError,
          );
          return NextResponse.json(
            {
              error: 'Не удалось запланировать изменение подписки.',
              details: (stripeUpdateError as Error).message,
            },
            { status: 500 },
          );
        }
      } else {
        session = await stripe.checkout.sessions.create({
          mode: 'subscription',
          line_items: [{ price: priceId, quantity: 1 }],
          // +++ CHANGED: возврат в Telegram-бота, а не на сайт:
          success_url: 'https://t.me/ai_tarot_soul_bot?start=paid',
          cancel_url: 'https://t.me/ai_tarot_soul_bot?start=cancel',

          // +++ END CHANGED
          subscription_data: {
            metadata: {
              user_id: userId,
              type: type,
            },
          },
          metadata: { user_id: userId, type: type },
        });
        return NextResponse.json({ url: session.url });
      }
    } else {
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

      const session = await stripe.checkout.sessions.create({
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
        // +++ CHANGED: возврат в Telegram-бота, а не на сайт:
        success_url: 'https://t.me/ai_tarot_soul_bot?start=paid',
        cancel_url: 'https://t.me/ai_tarot_soul_bot?start=cancel',

        // +++ END CHANGED
        metadata: {
          user_id: userId,
          cards: quantity?.toString() || '',
          type: type || 'one_time',
        },
      });
      return NextResponse.json({ url: session.url });
    }
  } catch (error: any) {
    console.error(
      'Критическая ошибка в API-маршруте telegram-checkout:',
      error,
    );
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера', details: error.message },
      { status: 500 },
    );
  }
}
