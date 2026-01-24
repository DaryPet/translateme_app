// //TODO: last experiment
// import { NextResponse } from 'next/server';
// import Stripe from 'stripe';
// import { createClient } from '@supabase/supabase-js';

// // Инициализируем Stripe клиент
// // Убедитесь, что process.env.STRIPE_SECRET_KEY установлен в вашем .env.local файле
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2025-04-30.basil', // ИСПОЛЬЗУЙТЕ ВАШУ АКТУАЛЬНУЮ ВЕРСИЮ API! (Например, '2025-04-30')
// });

// // Инициализируем Supabase клиент с правами service_role_key для серверных операций
// // Убедитесь, что эти переменные окружения установлены в вашем .env.local файле
// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY!,
// );

// export async function POST(req: Request) {
//   try {
//     const { userId } = await req.json(); // Получаем userId из тела запроса

//     // Проверяем наличие userId. Если его нет, возвращаем ошибку.
//     if (!userId) {
//       return NextResponse.json(
//         { error: 'User ID is required' },
//         { status: 400 },
//       );
//     }

//     // 1. Находим активную подписку пользователя в вашей таблице `subscriptions`.
//     // Выбираем `stripe_sub_id` (для взаимодействия со Stripe), `user_id` (для обновления в Supabase)
//     // и `current_period_end` (для возврата клиенту, если он понадобится).
//     const { data: userSubscription, error: subError } = await supabase
//       .from('subscriptions')
//       .select('stripe_sub_id, user_id, status, current_period_end')
//       .eq('user_id', userId)
//       .in('status', ['active', 'trialing']) // Ищем только активные или пробные подписки
//       .single(); // Ожидаем одну запись, соответствующую условиям

//     // Обработка ошибок при поиске подписки в базе данных.
//     // 'PGRST116' означает "No rows found", что не является критической ошибкой,
//     // но если подписки нет, мы должны уведомить об этом.
//     if (subError && subError.code !== 'PGRST116') {
//       console.error('Ошибка при поиске подписки пользователя в БД:', subError);
//       return NextResponse.json(
//         { error: 'Не удалось найти данные подписки.' },
//         { status: 500 },
//       );
//     }

//     // Если активная подписка или её Stripe ID не найдены, возвращаем 404.
//     if (!userSubscription || !userSubscription.stripe_sub_id) {
//       console.warn('Активная подписка для пользователя не найдена:', userId);
//       return NextResponse.json(
//         { error: 'Активная подписка для этого пользователя не найдена.' },
//         { status: 404 },
//       );
//     }

//     // 2. Обновляем подписку в Stripe: устанавливаем `cancel_at_period_end` в `true`.
//     // Это говорит Stripe отменить подписку в конце текущего оплаченного периода,
//     // но до этого момента подписка остается активной.
//     const updatedStripeSubscription: Stripe.Subscription =
//       await stripe.subscriptions.update(userSubscription.stripe_sub_id, {
//         cancel_at_period_end: true,
//       });

//     // 3. Обновляем флаг `is_cancellation_pending` в вашей Supabase БД.
//     // Мы устанавливаем этот флаг в `true`, чтобы фронтенд мог отобразить
//     // пользователю информацию о предстоящей отмене.
//     // Важно: здесь мы НАМЕРЕННО НЕ меняем поле `status`,
//     // чтобы сохранить вашу существующую логику списания карт,
//     // которая, как вы указали, зависит от `status: 'active'`.
//     const { error: updateDbError } = await supabase
//       .from('subscriptions')
//       .update({ is_cancellation_pending: true }) // Устанавливаем наш новый флаг
//       .eq('user_id', userSubscription.user_id); // Обновляем запись по user_id

//     // Обработка ошибок при обновлении флага в БД.
//     // Если произошла ошибка здесь, мы её логируем, но продолжаем отправлять
//     // успешный ответ, так как операция в Stripe, вероятно, прошла успешно.
//     if (updateDbError) {
//       console.error(
//         'Ошибка при обновлении флага is_cancellation_pending в БД:',
//         updateDbError,
//       );
//       // При желании можно добавить тут более сложную логику,
//       // например, повторную попытку или уведомление администратора.
//     }

//     // Возвращаем успешный ответ клиенту.
//     // Используем 'as any' для доступа к current_period_end, чтобы обойти ошибку TypeScript,
//     // если она продолжает возникать из-за особенностей среды/версий библиотек.
//     const periodEnd = (updatedStripeSubscription as any).current_period_end;

//     return NextResponse.json({
//       success: true,
//       message: 'Подписка будет отменена в конце текущего оплаченного периода.',
//       currentPeriodEnd: periodEnd, // Дата окончания текущего периода из Stripe
//     });
//   } catch (error) {
//     console.error('Ошибка в API-маршруте отмены подписки:', error);
//     if (error instanceof Stripe.errors.StripeError) {
//       // Обработка специфических ошибок Stripe API
//       return NextResponse.json({ error: error.message }, { status: 400 });
//     }
//     // Обработка общих ошибок (например, сетевые проблемы, ошибки парсинга JSON)
//     if (error instanceof Error) {
//       return NextResponse.json({ error: error.message }, { status: 500 });
//     }
//     // Если тип ошибки неизвестен
//     return NextResponse.json(
//       { error: 'Произошла неизвестная ошибка' },
//       { status: 500 },
//     );
//   }
// }

//TODO:
// pages/api/stripe/cancel-subscription.ts

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Инициализируем Stripe клиент
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil', // ИСПОЛЬЗУЙТЕ ВАШУ АКТУАЛЬНУЮ ВЕРСИЮ API! (Например, '2025-04-30')
});

// Инициализируем Supabase клиент с правами service_role_key для серверных операций
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  try {
    // ИЗМЕНЕНО: теперь получаем также pendingPlan из тела запроса
    const { userId, pendingPlan } = await req.json();

    // Проверяем наличие userId. Если его нет, возвращаем ошибку.
    if (!userId) {
      // console.error('Ошибка 400: User ID is required.');
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 },
      );
    }

    // 1. Находим активную подписку пользователя в вашей таблице `subscriptions`.
    // ИЗМЕНЕНО: Добавлено 'pending_plan' в список выбираемых полей
    const { data: userSubscription, error: subError } = await supabase
      .from('subscriptions')
      .select(
        'stripe_sub_id, user_id, status, current_period_end, pending_plan',
      )
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .single();

    // Обработка ошибок при поиске подписки в базе данных.
    if (subError && subError.code !== 'PGRST116') {
      // console.error('Ошибка при поиске подписки пользователя в БД:', subError);
      return NextResponse.json(
        // { error: 'Не удалось найти данные подписки.' },
        { status: 500 },
      );
    }

    // Если активная подписка или её Stripe ID не найдены, возвращаем 404.
    if (!userSubscription || !userSubscription.stripe_sub_id) {
      // console.warn('Активная подписка для пользователя не найдена:', userId);
      return NextResponse.json(
        // { error: 'Активная подписка для этого пользователя не найдена.' },
        { status: 404 },
      );
    }

    const updatedStripeSubscription: Stripe.Subscription =
      await stripe.subscriptions.update(userSubscription.stripe_sub_id, {
        cancel_at_period_end: true,
      });
    // console.log(
    //   `[Stripe API] Подписка ${userSubscription.stripe_sub_id} для пользователя ${userId} помечена на отмену в конце периода.`,
    // );

    let updateData: {
      is_cancellation_pending: boolean;
      pending_plan: string | null;
    } = {
      is_cancellation_pending: true,
      pending_plan: null,
    };
    let responseMessage = '';

    // ИЗМЕНЕНО: Логика определения сообщения и обнуления pending_plan
    // Мы используем userSubscription.pending_plan (из БД), чтобы быть уверенными.
    if (userSubscription.pending_plan) {
      // responseMessage =
      //   'Запланированная смена тарифа отменена. Ваша подписка будет полностью прекращена в конце текущего оплаченного периода.';
      // console.log(
      //   `[Supabase Update] Пользователь ${userId} отменил запланированную смену тарифа (${userSubscription.pending_plan}).`,
      // );
    } else {
      // responseMessage =
      //   'Подписка будет отменена в конце текущего оплаченного периода.';
      // console.log(
      //   `[Supabase Update] Пользователь ${userId} отменил активную подписку.`,
      // );
    }

    const { error: updateDbError } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('user_id', userSubscription.user_id);

    // // Обработка ошибок при обновлении флагов в БД.
    // if (updateDbError) {
    //   console.error(
    //     'Ошибка при обновлении флагов подписки в БД:',
    //     updateDbError,
    //   );
    // }
    const periodEnd = (updatedStripeSubscription as any).current_period_end;

    return NextResponse.json({
      success: true,
      message: responseMessage,
      currentPeriodEnd: periodEnd,
    });
  } catch (error) {
    console.error('Error in API route:', error);
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
  }
}
