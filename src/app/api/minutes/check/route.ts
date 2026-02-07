import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();
    
    const { google_id, fingerprint, estimated_minutes } = body;
    
    if (!google_id && !fingerprint) {
      return NextResponse.json(
        { error: 'google_id or fingerprint required' },
        { status: 400 }
      );
    }
    
    // Определяем пользователя
    let userData: any = null;
    
    // Сначала проверяем google_id (приоритет для Chrome расширения)
    if (google_id) {
      const { data, error } = await supabase
        .from('users')
        .select('id, free_minutes_used, paid_minutes_left, email')
        .eq('google_id', google_id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      userData = data;
      
      // Если пользователя нет - создаём гостя с google_id
      if (!userData) {
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            google_id: google_id,
            free_minutes_used: 0,
            plan_type: 'free'
          })
          .select('id, free_minutes_used, paid_minutes_left, email')
          .single();
        
        if (insertError) throw insertError;
        userData = newUser;
      }
    } 
    // Если нет google_id, проверяем fingerprint (для сайта)
    else if (fingerprint) {
      const { data, error } = await supabase
        .from('users')
        .select('id, free_minutes_used, paid_minutes_left, email')
        .eq('fingerprint', fingerprint)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      userData = data || { free_minutes_used: 0, paid_minutes_left: 0 };
    }
    
    const freeMinutesUsed = userData?.free_minutes_used || 0;
    const paidMinutesLeft = userData?.paid_minutes_left || 0;
    
    // Проверяем лимиты
    const freeMinutesAvailable = Math.max(0, 3 - freeMinutesUsed);
    const totalAvailable = freeMinutesAvailable + paidMinutesLeft;
    
    // Если запрошена конкретная длительность
    const requestedMinutes = estimated_minutes || 0;
    let allowed = true;
    let reason = '';
    
    if (requestedMinutes > 0) {
      if (requestedMinutes > totalAvailable) {
        allowed = false;
        reason = 'insufficient_minutes';
      } else if (requestedMinutes > freeMinutesAvailable && paidMinutesLeft === 0) {
        allowed = false;
        reason = 'need_payment';
      }
    } else {
      // Просто проверка общего доступа
      if (freeMinutesUsed >= 3 && paidMinutesLeft <= 0) {
        allowed = false;
        reason = 'limit_reached';
      }
    }
    
    return NextResponse.json({
      allowed,
      reason: allowed ? '' : reason,
      free_minutes_used: freeMinutesUsed,
      paid_minutes_left: paidMinutesLeft,
      free_minutes_available: freeMinutesAvailable,
      total_available: totalAvailable,
      user_id: userData?.id || null,
      email: userData?.email || null,
      google_id: google_id || null,
      fingerprint: fingerprint || null
    });
    
  } catch (error) {
    console.error('Error in POST /api/minutes/check:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}