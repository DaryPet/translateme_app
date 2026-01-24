//TODO:
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { isAfter, isSameDay, parseISO } from 'date-fns';

export const runtime = 'nodejs';

console.log('Initializing Stripe and Supabase...');
console.log('STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
console.log('SUPABASE_URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log(
  'SUPABASE_SERVICE_ROLE_KEY exists:',
  !!process.env.SUPABASE_SERVICE_ROLE_KEY,
);
console.log(
  'STRIPE_WEBHOOK_SECRET exists:',
  !!process.env.STRIPE_WEBHOOK_SECRET,
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Функция для получения количества карт по типу подписки
function getCardsForSubscriptionType(subscriptionType: string): number {
  switch (subscriptionType) {
    case 'medium':
      return 60;
    case 'premium':
      return 150;
    default:
      return 0;
  }
}

export async function POST(req: Request) {
  // console.log('\n--- NEW WEBHOOK REQUEST RECEIVED ---');

  try {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');
    // console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    // console.log('Received signature:', sig);
    // console.log('Raw body length:', body.length);

    if (!sig) {
      // console.error('❌ Missing Stripe signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      // console.log('Attempting to construct Stripe event...');
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
      // console.log(
      //   'Stripe event constructed successfully. Event type:',
      //   event.type,
      // );
      // console.log('Event ID:', event.id);
      // console.log(
      //   'Event data object:',
      //   JSON.stringify(event.data.object, null, 2),
      // );
    } catch (err) {
      // console.error('❌ Stripe webhook construction failed:', err);
      if (err instanceof Error) {
        return NextResponse.json(
          { error: `Webhook Error: ${err.message}` },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { error: 'Unknown webhook error' },
        { status: 400 },
      );
    }

    switch (event.type) {
      case 'checkout.session.completed':
        // console.log('Processing checkout.session.completed event...');
        const session = event.data.object as Stripe.Checkout.Session;
        // console.log(
        //   'Full Checkout Session Object:',
        //   JSON.stringify(session, null, 2),
        // );
        // console.log('Session Metadata:', session.metadata);

        if (session.mode === 'subscription') {
          // console.log('Checkout session mode is subscription.');
          const subscriptionId = session.subscription as string;
          const userIdFromSession = session.metadata?.user_id;

          // console.log(`Debug: Subscription ID from session: ${subscriptionId}`);
          // console.log(
          //   `Debug: User ID from session metadata: ${userIdFromSession}`,
          // );

          if (!subscriptionId) {
            // console.error(
            //   '❌ checkout.session.completed (subscription mode): Missing subscription ID',
            // );
            return NextResponse.json(
              { error: 'Missing subscription ID' },
              { status: 400 },
            );
          }
          if (!userIdFromSession) {
            // console.error(
            //   '❌ checkout.session.completed (subscription mode): Missing user_id in session metadata',
            // );
            return NextResponse.json(
              { error: 'Missing user_id' },
              { status: 400 },
            );
          }

          // console.log(
          //   `Calling handleSubscriptionUpdate with subscriptionId: ${subscriptionId} and userId: ${userIdFromSession}`,
          // );
          await handleSubscriptionUpdate(
            subscriptionId,
            userIdFromSession,
            event,
          );
        } else if (session.mode === 'payment') {
          // console.log('Checkout session mode is payment (one-time).');
          const metadata = session.metadata;
          const user_id = metadata?.user_id;
          const quantity = metadata?.cards ? Number(metadata.cards) : 0;

          // console.log(`Debug (One-Time): Metadata received:`, metadata);
          // console.log(`Debug (One-Time): user_id from metadata: ${user_id}`);
          // console.log(
          //   `Debug (One-Time): quantity (cards) from metadata: ${quantity}`,
          // );

          if (!user_id || !quantity) {
            // console.error(
            //   '❌ Missing user_id or quantity for one-time payment in metadata',
            // );
            return NextResponse.json(
              { error: 'Missing user_id or quantity' },
              { status: 400 },
            );
          }

          // console.log('Processing one-time payment for cards...');
          // console.log('User ID:', user_id, 'Quantity:', quantity);

          // console.log(
          //   `Debug (One-Time): Fetching current credits for user: ${user_id}`,
          // );
          const { data, error: creditError } = await supabase
            .from('card_credits')
            .select('credits')
            .eq('user_id', user_id)
            .single();

          if (creditError && creditError.code !== 'PGRST116') {
            console.error('❌ Credit fetch error (one-time):', creditError);
          } else if (creditError && creditError.code === 'PGRST116') {
            // console.log(
            //   'ℹ️ No existing credits found for user (first purchase?). Initializing with 0.',
            // );
          }

          const currentCredits = data?.credits || 0;
          const newCredits = currentCredits + quantity;
          // console.log(
          //   `Debug (One-Time): Current credits: ${currentCredits}, Quantity to add: ${quantity}, New credits will be: ${newCredits}`,
          // );

          // console.log(
          //   `Debug (One-Time): Upserting credits for user ${user_id} with new amount: ${newCredits}`,
          // );
          const { error: upsertError } = await supabase
            .from('card_credits')
            .upsert(
              {
                user_id,
                credits: newCredits,
              },
              { onConflict: 'user_id' },
            );

          if (upsertError) {
            console.error('❌ Credit upsert error (one-time):', upsertError);
          } else {
            console.log('✅ Credits updated successfully (one-time payment)');
          }
        } else {
          console.log(
            `⚠️ Unhandled checkout.session.completed scenario: mode=${session.mode}, metadata=${JSON.stringify(session.metadata)}`,
          );
        }
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        // console.log(`Processing subscription event: ${event.type}`);
        const subscriptionObject = event.data.object as Stripe.Subscription;
        const userIdFromSubscription = subscriptionObject.metadata?.user_id;

        // console.log(
        //   `Debug (Sub Event): User ID from subscription metadata: ${userIdFromSubscription}`,
        // );

        if (!userIdFromSubscription) {
          console.error(
            `❌ Missing user_id in subscription metadata for ${event.type} event.`,
          );
          return NextResponse.json(
            { error: 'Missing user_id in subscription metadata' },
            { status: 400 },
          );
        }

        await handleSubscriptionUpdate(
          subscriptionObject.id,
          userIdFromSubscription,
          event,
        );
        break;

      case 'invoice.payment_succeeded':
        // console.log(`Processing invoice.payment_succeeded event.`);
        const invoice = event.data.object as Stripe.Invoice;
        let invoiceSubscriptionId: string | undefined;

        // ИСПРАВЛЕНИЕ: Используем утверждение типа 'as any' для доступа к 'subscription'
        // Это говорит TypeScript'у, что мы знаем, что 'subscription' будет существовать.
        // Затем проверяем его тип в рантайме.
        const rawSubscription = (invoice as any).subscription;

        if (
          typeof rawSubscription === 'string' &&
          rawSubscription.startsWith('sub_')
        ) {
          invoiceSubscriptionId = rawSubscription;
        } else if (
          rawSubscription &&
          typeof rawSubscription === 'object' &&
          rawSubscription.id &&
          rawSubscription.id.startsWith('sub_')
        ) {
          invoiceSubscriptionId = rawSubscription.id;
        }

        if (!invoiceSubscriptionId) {
          console.error(
            `❌ Missing or invalid subscription ID in invoice.payment_succeeded event. Invoice object:`,
            JSON.stringify(invoice, null, 2),
          );
          return NextResponse.json(
            { error: 'Missing subscription ID' },
            { status: 400 },
          );
        }

        await handleSubscriptionUpdate(
          invoiceSubscriptionId,
          undefined, // userIdFromEventMetadata is undefined as it's not directly available on invoice event
          event,
        );
        break;

      case 'customer.subscription.deleted':
        // console.log('Processing customer.subscription.deleted event...');
        const deletedSubscription = event.data.object as Stripe.Subscription;
        const deletedSubscriptionId = deletedSubscription.id;
        const stripeCustomerId = deletedSubscription.customer as string;

        // console.log(
        //   `Debug (Subscription Deleted): Stripe Subscription ID: ${deletedSubscriptionId}, Stripe Customer ID: ${stripeCustomerId}`,
        // );

        // console.log(
        //   `Attempting to fetch user_id and pending_plan from Supabase for stripe_sub_id: ${deletedSubscriptionId}...`,
        // );
        let userIdForDeletedSub: string | undefined;
        let pendingPlanForDeletedSub: string | undefined;
        let storedPaymentMethodId: string | undefined;

        const { data: subDataFromDB, error: fetchSubError } = await supabase
          .from('subscriptions')
          .select('user_id, pending_plan, stripe_payment_method_id')
          .eq('stripe_sub_id', deletedSubscriptionId)
          .maybeSingle();

        if (fetchSubError && fetchSubError.code !== 'PGRST116') {
          console.error(
            '❌ Error fetching subscription by sub_id from Supabase:',
            fetchSubError,
          );
          return NextResponse.json(
            { error: 'Failed to find user subscription by sub_id in DB' },
            { status: 500 },
          );
        }

        if (subDataFromDB) {
          userIdForDeletedSub = subDataFromDB.user_id;
          pendingPlanForDeletedSub = subDataFromDB.pending_plan;
          storedPaymentMethodId = subDataFromDB.stripe_payment_method_id;
          console.log(
            `Found user_id ${userIdForDeletedSub}, pending_plan: ${pendingPlanForDeletedSub}, stored_payment_method: ${storedPaymentMethodId}`,
          );
        } else {
          // console.warn(
          //   `⚠️ Subscription ${deletedSubscriptionId} not found in Supabase for deletion. Skipping automatic re-subscription.`,
          // );
          return NextResponse.json(
            {
              message:
                'Subscription not found in DB, skipping re-subscription.',
            },
            { status: 200 },
          );
        }

        // 1. Update old subscription status in Supabase to 'canceled'
        // console.log(
        //   `Attempting to mark subscription ${deletedSubscriptionId} for user ${userIdForDeletedSub} as 'canceled' in Supabase.`,
        // );
        const endTime =
          deletedSubscription.ended_at || deletedSubscription.canceled_at;
        const currentPeriodEndForDB = endTime
          ? new Date(endTime * 1000).toISOString()
          : new Date().toISOString();

        const { error: cancelUpdateError } = await supabase
          .from('subscriptions')
          .upsert(
            {
              user_id: userIdForDeletedSub,
              plan: 'none',
              stripe_sub_id: deletedSubscriptionId,
              stripe_customer_id: stripeCustomerId,
              status: 'canceled',
              current_period_end: currentPeriodEndForDB,
              updated_at: new Date().toISOString(),
              subscription_credits_remaining: 0,
              pending_plan: null,
              is_cancellation_pending: false,
            },
            { onConflict: 'user_id' },
          );

        if (cancelUpdateError) {
          console.error(
            '❌ Supabase subscription cancel upsert error:',
            cancelUpdateError,
          );
        } else {
          // console.log(
          //   `✅ Subscription ${deletedSubscriptionId} for user ${userIdForDeletedSub} successfully marked as 'canceled'.`,
          // );
        }

        // 2. Check if there's a pending_plan and stored payment method for automatic re-subscription
        if (pendingPlanForDeletedSub && storedPaymentMethodId) {
          // console.log(
          //   `Found pending_plan (${pendingPlanForDeletedSub}) and stored payment method (${storedPaymentMethodId}). Attempting to create new subscription automatically.`,
          // );

          let newPriceId: string | undefined;
          if (pendingPlanForDeletedSub === 'medium') {
            newPriceId = process.env.STRIPE_PRICE_ID_MEDIUM;
          } else if (pendingPlanForDeletedSub === 'premium') {
            newPriceId = process.env.STRIPE_PRICE_ID_PREMIUM;
          }

          if (newPriceId) {
            try {
              const newSubscription = await stripe.subscriptions.create({
                customer: stripeCustomerId,
                items: [{ price: newPriceId, quantity: 1 }],
                default_payment_method: storedPaymentMethodId,
                expand: ['latest_invoice.payment_intent'],
                metadata: {
                  user_id: userIdForDeletedSub as string,
                  type: `subscription_${pendingPlanForDeletedSub}`,
                },
              });

              // console.log(
              //   `✅ Successfully created new subscription ${newSubscription.id} for user ${userIdForDeletedSub} on plan ${pendingPlanForDeletedSub}.`,
              // );
            } catch (createSubError: any) {
              console.error(
                `❌ Error creating new subscription for user ${userIdForDeletedSub} (plan: ${pendingPlanForDeletedSub}):`,
                createSubError,
              );

              let errorMessage = 'Failed to create new subscription.';
              if (createSubError.raw?.code === 'card_declined') {
                errorMessage =
                  'Your card was declined. Please update your payment details.';
              } else if (createSubError.raw?.code === 'expired_card') {
                errorMessage =
                  'Your card has expired. Please update your payment details.';
              }
              // console.log(
              //   `Sending notification to user ${userIdForDeletedSub}: ${errorMessage}`,
              // );

              const { error: updatePaymentError } = await supabase
                .from('subscriptions')
                .upsert(
                  {
                    user_id: userIdForDeletedSub,
                    status: 'unpaid',
                    updated_at: new Date().toISOString(),
                  },
                  { onConflict: 'user_id' },
                );
              if (updatePaymentError) {
                console.error(
                  '❌ Error updating Supabase status after payment failure:',
                  updatePaymentError,
                );
              }
            }
          } else {
            // console.warn(
            //   `⚠️ No Stripe price ID found for pending_plan: ${pendingPlanForDeletedSub}. Skipping automatic re-subscription.`,
            // );
          }
        } else {
          // console.log(
          //   `ℹ️ No pending_plan or stored payment method found for user ${userIdForDeletedSub}. Skipping automatic re-subscription.`,
          // );
        }
        break;

      default:
      // console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    // console.log('✅ Webhook processed successfully');
    return NextResponse.json({ received: true });
  } catch (error) {
    // console.error('❌ UNEXPECTED ERROR (main catch block):', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// --- ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ ОБРАБОТКИ ДАННЫХ ПОДПИСКИ ---
async function handleSubscriptionUpdate(
  subscriptionId: string,
  userIdFromEventMetadata: string | undefined,
  event: Stripe.Event,
) {
  // console.log(
  //   `🔄 handleSubscriptionUpdate called for sub ID: ${subscriptionId}, user ID (from event meta): ${userIdFromEventMetadata || 'N/A'} from event type: ${event.type}`,
  // );

  let s: Stripe.Subscription;

  if (event.type.startsWith('customer.subscription.')) {
    s = event.data.object as Stripe.Subscription;
    // console.log(
    //   '✔️ Using subscription object directly from customer.subscription.* event.',
    // );
  } else if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    if (
      typeof session.subscription === 'string' &&
      session.subscription.startsWith('sub_')
    ) {
      // console.log(
      //   `Retrieving subscription details for: ${session.subscription} from Stripe...`,
      // );
      try {
        s = await stripe.subscriptions.retrieve(session.subscription);
        // console.log('✔️ Successfully retrieved subscription from Stripe.');
      } catch (error) {
        // console.error(
        //   `❌ Error retrieving subscription ${session.subscription} from Stripe:`,
        //   error,
        // );
        throw new Error(
          `Failed to retrieve subscription ${session.subscription}`,
        );
      }
    } else {
      // console.error(
      //   `❌ checkout.session.completed event missing or invalid subscription ID.`,
      // );
      throw new Error(`Invalid session data for checkout.session.completed`);
    }
  } else if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice;
    let subIdFromInvoice: string | undefined;

    // ИСПРАВЛЕНИЕ: Используем утверждение типа 'as any' для доступа к 'subscription'
    const rawSubscription = (invoice as any).subscription;

    if (
      typeof rawSubscription === 'string' &&
      rawSubscription.startsWith('sub_')
    ) {
      subIdFromInvoice = rawSubscription;
    } else if (
      rawSubscription &&
      typeof rawSubscription === 'object' &&
      rawSubscription.id &&
      rawSubscription.id.startsWith('sub_')
    ) {
      subIdFromInvoice = rawSubscription.id;
    }

    if (subIdFromInvoice) {
      // console.log(
      //   `Retrieving subscription details for invoice.payment_succeeded: ${subIdFromInvoice} from Stripe...`,
      // );
      try {
        s = await stripe.subscriptions.retrieve(subIdFromInvoice);
        // console.log(
        //   '✔️ Successfully retrieved subscription from Stripe for invoice event.',
        // );
      } catch (error) {
        // console.error(
        //   `❌ Error retrieving subscription ${subIdFromInvoice} from Stripe for invoice event:`,
        //   error,
        // );
        throw new Error(
          `Failed to retrieve subscription ${subIdFromInvoice} for invoice event`,
        );
      }
    } else {
      // console.error(
      //   `❌ invoice.payment_succeeded event missing or invalid subscription ID. Invoice object:`,
      //   JSON.stringify(invoice, null, 2),
      // );
      throw new Error(`Invalid invoice data for invoice.payment_succeeded`);
    }
  } else {
    // console.error(
    //   `❌ handleSubscriptionUpdate called with unhandled event type for getting subscription object: ${event.type}`,
    // );
    throw new Error(`Unhandled event type for subscription update`);
  }

  if (!s || !s.items || s.items.data.length === 0) {
    // console.error(
    //   `❌ Invalid subscription object or no items found for subscription ID: ${subscriptionId}`,
    // );
    throw new Error(
      `Invalid subscription data from Stripe for ${subscriptionId}`,
    );
  }

  // console.log('=== FULL STRIPE SUBSCRIPTION OBJECT ===');
  // console.dir(s, { depth: null }); // Вывод полного объекта подписки Stripe

  const customer_id = s.customer as string;

  let payment_method_id: string | null = null;
  if (s.default_payment_method) {
    if (typeof s.default_payment_method === 'string') {
      payment_method_id = s.default_payment_method;
    } else if (s.default_payment_method.id) {
      payment_method_id = s.default_payment_method.id;
    }
  }

  // Получаем userId. Приоритет: метаданные из события -> метаданные из объекта подписки Stripe
  let userId = userIdFromEventMetadata || s.metadata?.user_id;

  if (!userId) {
    // console.error(
    //   `❌ handleSubscriptionUpdate: User ID not found in event metadata or subscription metadata. Attempting to fetch from DB by Stripe Customer ID.`,
    // );
    const { data: userSub, error: userSubError } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', customer_id)
      .maybeSingle();

    if (userSubError) {
      console.error('❌ Error fetching user_id by customer_id:', userSubError);
    } else if (userSub) {
      userId = userSub.user_id;
      // console.log(
      //   `✔️ Found user ID ${userId} from DB using Stripe Customer ID.`,
      // );
    }
  }

  if (!userId) {
    // console.error(
    //   `❌ handleSubscriptionUpdate: CRITICAL ERROR - User ID could not be determined for subscription ${subscriptionId}. Cannot process webhook.`,
    // );
    throw new Error(
      `User ID not found for subscription ${subscriptionId}. Cannot process webhook.`,
    );
  }

  const rawCurrentPeriodStart = s.items?.data?.[0]?.current_period_start;
  const rawCurrentPeriodEnd = s.items?.data?.[0]?.current_period_end;

  const currentPeriodStart = rawCurrentPeriodStart
    ? new Date(rawCurrentPeriodStart * 1000).toISOString()
    : new Date().toISOString();
  const currentPeriodEnd = rawCurrentPeriodEnd
    ? new Date(rawCurrentPeriodEnd * 1000).toISOString()
    : new Date().toISOString();

  const priceId = s.items?.data?.[0]?.price?.id;
  let subscriptionPlan = 'unknown';

  // console.log(`Debug (Subscription): Price ID detected: ${priceId}`);

  if (priceId === process.env.STRIPE_PRICE_ID_MEDIUM) {
    subscriptionPlan = 'medium';
  } else if (priceId === process.env.STRIPE_PRICE_ID_PREMIUM) {
    subscriptionPlan = 'premium';
  } else {
    // console.warn(
    //   `⚠️ Unknown price ID for subscription: ${priceId || 'null/undefined'}. Defaulting to 'unknown' plan.`,
    // );
  }

  let statusForSupabase = s.status;
  let isCancellationPendingForDB = false;

  if (s.cancel_at_period_end && s.status === 'active') {
    statusForSupabase = 'active';
    isCancellationPendingForDB = true;
  } else if (
    s.status === 'canceled' ||
    s.status === 'unpaid' ||
    s.status === 'incomplete_expired'
  ) {
    statusForSupabase = 'canceled';
    isCancellationPendingForDB = false;
  } else {
    isCancellationPendingForDB = false;
  }

  let newSubscriptionCreditsValue: number;
  let currentSubscriptionCreditsInDB = 0;

  const { data: existingSupabaseSub, error: fetchExistingError } =
    await supabase
      .from('subscriptions')
      .select(
        'subscription_credits_remaining, current_period_start, current_period_end, plan, pending_plan',
      )
      .eq('user_id', userId)
      .maybeSingle();

  if (fetchExistingError && fetchExistingError.code !== 'PGRST116') {
    console.error(
      '❌ Ошибка при получении существующей подписки пользователя из БД:',
      fetchExistingError,
    );
  } else if (existingSupabaseSub) {
    currentSubscriptionCreditsInDB =
      existingSupabaseSub.subscription_credits_remaining || 0;
  }

  // --- НАЧАЛО: ПОДРОБНАЯ ЛОГИКА ОПРЕДЕЛЕНИЯ КРЕДИТОВ ---
  // console.log('\n--- DEBUGGING RENEWAL LOGIC ---');
  // console.log(`Stripe Status (s.status): ${s.status}`);
  // console.log(`Event Type: ${event.type}`);
  // console.log(`User ID: ${userId}`);
  // console.log(`Subscription Plan from Stripe: ${subscriptionPlan}`);

  const oldPeriodStartInDB = existingSupabaseSub?.current_period_start
    ? parseISO(existingSupabaseSub.current_period_start)
    : null;
  const oldPeriodEndInDB = existingSupabaseSub?.current_period_end
    ? parseISO(existingSupabaseSub.current_period_end)
    : null;
  const newPeriodStartFromStripe = rawCurrentPeriodStart
    ? new Date(rawCurrentPeriodStart * 1000)
    : null;
  const newPeriodEndFromStripe = rawCurrentPeriodEnd
    ? new Date(rawCurrentPeriodEnd * 1000)
    : null;

  // console.log(
  //   `existingSupabaseSub from DB: ${existingSupabaseSub ? JSON.stringify(existingSupabaseSub) : 'null'}`,
  // );
  // console.log(
  //   `oldPeriodStartInDB (from DB, parsed): ${oldPeriodStartInDB?.toISOString() || 'null'}`,
  // );
  // console.log(
  //   `oldPeriodEndInDB (from DB, parsed): ${oldPeriodEndInDB?.toISOString() || 'null'}`,
  // );
  // console.log(
  //   `newPeriodStartFromStripe (from Stripe, parsed): ${newPeriodStartFromStripe?.toISOString() || 'null'}`,
  // );
  // console.log(
  //   `newPeriodEndFromStripe (from Stripe, parsed): ${newPeriodEndFromStripe?.toISOString() || 'null'}`,
  // );
  // console.log(
  //   `currentSubscriptionCreditsInDB (before update): ${currentSubscriptionCreditsInDB}`,
  // );

  // const isRenewal =
  //   s.status === 'active' &&
  //   oldPeriodEndInDB &&
  //   newPeriodStartFromStripe &&
  //   isAfter(newPeriodStartFromStripe, oldPeriodEndInDB);

  const isRenewal =
    s.status === 'active' &&
    oldPeriodEndInDB &&
    newPeriodStartFromStripe &&
    (isAfter(newPeriodStartFromStripe, oldPeriodEndInDB) ||
      isSameDay(newPeriodStartFromStripe, oldPeriodEndInDB));

  const isInitialCreationOrActivation =
    (event.type === 'customer.subscription.created' && !existingSupabaseSub) ||
    (event.type === 'checkout.session.completed' && !existingSupabaseSub) ||
    (event.type === 'invoice.payment_succeeded' && !existingSupabaseSub) ||
    (s.status === 'active' && !existingSupabaseSub);

  const isPlanChanged =
    existingSupabaseSub?.plan &&
    existingSupabaseSub.plan !== subscriptionPlan &&
    subscriptionPlan !== 'unknown';

  const cardsToAddToSubscription =
    getCardsForSubscriptionType(subscriptionPlan);

  // console.log(`isRenewal (calculated): ${isRenewal}`);
  // console.log(
  //   `isInitialCreationOrActivation (calculated): ${isInitialCreationOrActivation}`,
  // );
  // console.log(`isPlanChanged (calculated): ${isPlanChanged}`);
  // console.log(
  //   `cardsToAddToSubscription (for new plan): ${cardsToAddToSubscription}`,
  // );

  if (isRenewal) {
    newSubscriptionCreditsValue = cardsToAddToSubscription;
    // console.log(
    //   `>>> LOGIC PATH: Entered 'Renewal' block. Resetting credits to ${newSubscriptionCreditsValue}.`,
    // );
  } else if (isInitialCreationOrActivation) {
    newSubscriptionCreditsValue = cardsToAddToSubscription;
    // console.log(
    //   `>>> LOGIC PATH: Entered 'Initial Creation/Activation' block. Setting credits to ${newSubscriptionCreditsValue}.`,
    // );
  } else if (isPlanChanged) {
    newSubscriptionCreditsValue = cardsToAddToSubscription;
    // console.log(
    //   `>>> LOGIC PATH: Entered 'Plan Change' block. Changing credits to ${newSubscriptionCreditsValue} based on new plan.`,
    // );
  } else if (s.cancel_at_period_end && s.status === 'active') {
    newSubscriptionCreditsValue = currentSubscriptionCreditsInDB;
    // console.log(
    //   `>>> LOGIC PATH: Entered 'Cancellation Pending' block. Credits remain: ${newSubscriptionCreditsValue}.`,
    // );
  } else if (
    s.status === 'canceled' ||
    s.status === 'unpaid' ||
    s.status === 'incomplete_expired'
  ) {
    newSubscriptionCreditsValue = 0;
    // console.log(
    //   `>>> LOGIC PATH: Entered 'Subscription Canceled/Unpaid' block. Credits reset to ${newSubscriptionCreditsValue}.`,
    // );
  } else if (
    s.status === 'active' &&
    currentSubscriptionCreditsInDB === 0 &&
    cardsToAddToSubscription > 0
  ) {
    newSubscriptionCreditsValue = cardsToAddToSubscription;
    // console.log(
    //   `>>> LOGIC PATH: Entered 'Active Subscription with 0 Credits' block. Assigning initial credits: ${newSubscriptionCreditsValue}.`,
    // );
  } else {
    newSubscriptionCreditsValue = currentSubscriptionCreditsInDB;
    // console.log(
    //   `>>> LOGIC PATH: Entered 'Status Update/No Significant Change' block. Credits remain: ${newSubscriptionCreditsValue}.`,
    // );
  }
  // --- КОНЕЦ: ПОДРОБНАЯ ЛОГИКА ОПРЕДЕЛЕНИЯ КРЕДИТОВ ---

  // --- НАЧАЛО: Дополнительные логи перед upsert ---
  // console.log('\n--- Preparing Supabase Upsert Data ---');
  // console.log(`User ID: ${userId}`);
  // console.log(`Plan: ${subscriptionPlan}`);
  // console.log(`Stripe Sub ID: ${s.id}`);
  // console.log(`Stripe Customer ID: ${customer_id}`);
  // console.log(`Status for Supabase: ${statusForSupabase}`);
  // console.log(
  //   `is_cancellation_pending for Supabase: ${isCancellationPendingForDB}`,
  // );
  // console.log(`Current Period Start: ${currentPeriodStart}`);
  // console.log(`Current Period End: ${currentPeriodEnd}`);
  // console.log(`New Subscription Credits Value: ${newSubscriptionCreditsValue}`);
  // console.log(`Payment Method ID: ${payment_method_id}`);
  // console.log('------------------------------------');
  // // --- КОНЕЦ: Дополнительные логи перед upsert ---

  const { error: subError } = await supabase.from('subscriptions').upsert(
    {
      user_id: userId,
      plan: subscriptionPlan,
      stripe_sub_id: s.id,
      stripe_customer_id: customer_id,
      status: statusForSupabase,
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
      updated_at: new Date().toISOString(),
      subscription_credits_remaining: newSubscriptionCreditsValue,
      stripe_payment_method_id: payment_method_id,
      is_cancellation_pending: isCancellationPendingForDB,
    },
    { onConflict: 'user_id' },
  );

  if (subError) {
    console.error('❌ Supabase subscription upsert error:', subError);
    throw new Error(`Supabase upsert failed: ${subError.message}`);
  } else {
    // console.log('✅ Subscription upserted successfully');
  }
}
