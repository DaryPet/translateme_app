// src/app/api/stripe/resume-subscription/route.ts

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// --- Инициализация Stripe ---
// Используйте вашу актуальную версию API Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

// --- Инициализация Supabase Admin Client ---
// Этот клиент использует ваш SUPABASE_SERVICE_ROLE_KEY
// и имеет административные права для записи в базу данных.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
  }

  try {
    const { userId, stripeSubscriptionId } = await req.json();

    if (!userId || !stripeSubscriptionId) {
      console.error(
        'Ошибка 400: Не получен User ID или Stripe Subscription ID для возобновления.',
      );
      return NextResponse.json(
        { error: 'User ID and Stripe Subscription ID are required' },
        { status: 400 },
      );
    }

    // --- Шаг 1: Обновление подписки в Stripe ---
    // Устанавливаем cancel_at_period_end в false, чтобы отменить запланированную отмену.
    const updatedStripeSubscription = await stripe.subscriptions.update(
      stripeSubscriptionId,
      {
        cancel_at_period_end: false,
      },
    );
    // console.log(
    //   `[Stripe API] Подписка ${stripeSubscriptionId} для пользователя ${userId} успешно возобновлена в Stripe (cancel_at_period_end: false).`,
    // );

    // Определяем текущий план из Stripe-подписки
    const stripePriceId = updatedStripeSubscription.items?.data?.[0]?.price?.id;
    let currentActivePlan = 'unknown'; // Значение по умолчанию

    // Сопоставляем Stripe Price ID с вашими планами
    if (stripePriceId === process.env.STRIPE_PRICE_ID_MEDIUM) {
      currentActivePlan = 'medium';
    } else if (stripePriceId === process.env.STRIPE_PRICE_ID_PREMIUM) {
      currentActivePlan = 'premium';
    }

    // console.log(
    //   `[Stripe API] Определен текущий активный план из Stripe: ${currentActivePlan}`,
    // );

    // --- Шаг 2: Обновление статуса подписки в вашей базе данных Supabase ---
    // Используем supabaseAdmin для непосредственного обновления таблицы 'subscriptions'.
    const { error: dbUpdateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        is_cancellation_pending: false, // **Сброс: подписка больше не помечена на отмену.**
        pending_plan: null, // **ОЧЕНЬ ВАЖНО: Сброс pending_plan.**
        status: updatedStripeSubscription.status, // Обновляем статус из Stripe (обычно будет 'active' или 'trialing')
        plan: currentActivePlan, // **ОЧЕНЬ ВАЖНО: Устанавливаем актуальный активный план.**
        updated_at: new Date().toISOString(), // Обновляем timestamp
      })
      .eq('user_id', userId)
      .eq('stripe_sub_id', stripeSubscriptionId);

    if (dbUpdateError) {
      console.error(
        '❌ Ошибка при обновлении Supabase после возобновления подписки:',
        dbUpdateError,
      );
      return NextResponse.json(
        { error: 'Failed to update database after Stripe operation' },
        { status: 500 },
      );
    }

    // console.log(
    //   `[Supabase DB] Статус, план и pending_plan для подписки пользователя ${userId} успешно обновлены в БД.`,
    // );

    return NextResponse.json(
      {
        success: true,
        message:
          'Подписка успешно возобновлена в Stripe и обновлена в базе данных.',
      },
      { status: 200 },
    );
  } catch (error: any) {
    // console.error('❌ Ошибка в API-маршруте возобновления подписки:', error);
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: 'Произошла неизвестная ошибка' },
      { status: 500 },
    );
  }
}
