// src/app/api/purchase/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {});
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      console.error('Missing session_id');
      return NextResponse.json(
        { error: 'Missing session_id' },
        { status: 400 },
      );
    }

    // 1) Получаем сессию
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items'],
    });
    // console.log('Stripe session metadata:', session.metadata);

    const user_id = session.metadata?.user_id;
    const quantity = Number(session.metadata?.cards ?? 0);
    if (!user_id) {
      console.error('Missing user_id in metadata');
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    // 2) Читаем текущие кредиты
    const { data, error: selectError } = await supabaseAdmin
      .from('card_credits')
      .select('credits')
      .eq('user_id', user_id)
      .single();
    if (selectError && selectError.code !== 'PGRST116') {
      console.error('Select error:', selectError);
      return NextResponse.json({ error: selectError.message }, { status: 500 });
    }

    const current = data?.credits ?? 0;
    const newTotal = current + quantity;

    // 3) Апсертим новую сумму (onConflict — строка!)
    const { data: upsertData, error: upsertError } = await supabaseAdmin
      .from('card_credits')
      .upsert({ user_id, credits: newTotal }, { onConflict: 'user_id' });

    if (upsertError) {
      console.error('Upsert error:', upsertError);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    // console.log(
    //   `Updated user ${user_id}: ${current} → ${newTotal}`,
    //   upsertData,
    // );
    return NextResponse.json({ bought: quantity, total: newTotal });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
