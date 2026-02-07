import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const url = new URL(request.url);
    
    // Получаем google_id из query параметров (для гостей Chrome расширения)
    const googleId = url.searchParams.get('google_id');
    
    // Проверяем авторизацию через Supabase (для пользователей сайта)
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    
    let userData: any = null;
    
    if (supabaseUser) {
      // Пользователь залогинен на сайте через Supabase
      const { data, error } = await supabase
        .from('users')
        .select('paid_minutes_left, free_minutes_used, email, google_id')
        .eq('id', supabaseUser.id)
        .single();
      
      if (error) throw error;
      userData = data;
      
    } else if (googleId) {
      // Гость Chrome расширения (через google_id)
      const { data, error } = await supabase
        .from('users')
        .select('id, paid_minutes_left, free_minutes_used, email, google_id')
        .eq('google_id', googleId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        throw error;
      }
      
      if (!data) {
        // Создаём нового гостя с google_id
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            google_id: googleId,
            free_minutes_used: 0,
            plan_type: 'free'
          })
          .select('paid_minutes_left, free_minutes_used, email, google_id')
          .single();
        
        if (insertError) throw insertError;
        userData = newUser;
      } else {
        userData = data;
      }
      
    } else {
      // Анонимный гость без google_id (сайт)
      const fingerprint = url.searchParams.get('fingerprint');
      
      if (fingerprint) {
        const { data, error } = await supabase
          .from('users')
          .select('paid_minutes_left, free_minutes_used, email, google_id')
          .eq('fingerprint', fingerprint)
          .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        userData = data || { paid_minutes_left: 0, free_minutes_used: 0 };
      } else {
        userData = { paid_minutes_left: 0, free_minutes_used: 0 };
      }
    }
    
    const freeMinutesUsed = userData?.free_minutes_used || 0;
    const paidMinutesLeft = userData?.paid_minutes_left || 0;
    const canUseFree = freeMinutesUsed < 3;
    
    return NextResponse.json({
      paid_minutes_left: paidMinutesLeft,
      free_minutes_used: freeMinutesUsed,
      canUseFree,
      limitReached: !canUseFree && paidMinutesLeft <= 0,
      user_id: userData?.id || null,
      email: userData?.email || null,
      google_id: userData?.google_id || null
    });
    
  } catch (error) {
    console.error('Error in GET /api/minutes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();
    const { minutes_used, google_id, fingerprint, user_id } = body;
    
    if (!minutes_used || minutes_used <= 0) {
      return NextResponse.json(
        { error: 'Invalid minutes_used value' },
        { status: 400 }
      );
    }
    
    // Определяем пользователя
    let targetUserId: string | null = null;
    let targetUserEmail: string | null = null;
    
    if (user_id) {
      // Прямой user_id
      targetUserId = user_id;
    } else {
      // Ищем пользователя по google_id или fingerprint
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      
      if (supabaseUser) {
        targetUserId = supabaseUser.id;
      } else if (google_id) {
        const { data, error } = await supabase
          .from('users')
          .select('id, email')
          .eq('google_id', google_id)
          .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        if (data) {
          targetUserId = data.id;
          targetUserEmail = data.email;
        }
      } else if (fingerprint) {
        const { data, error } = await supabase
          .from('users')
          .select('id, email')
          .eq('fingerprint', fingerprint)
          .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        if (data) {
          targetUserId = data.id;
          targetUserEmail = data.email;
        }
      }
    }
    
    if (!targetUserId) {
      return NextResponse.json(
        { error: 'User not found. Please provide valid identification.' },
        { status: 404 }
      );
    }
    
    // Получаем текущие данные пользователя
    const { data: userData, error: selectError } = await supabase
      .from('users')
      .select('free_minutes_used, paid_minutes_left, email')
      .eq('id', targetUserId)
      .single();
    
    if (selectError) throw selectError;
    
    let freeMinutesUsed = userData.free_minutes_used || 0;
    let paidMinutesLeft = userData.paid_minutes_left || 0;
    
    // Определяем источник минут (бесплатные или платные)
    let source: 'free' | 'paid' = 'free';
    let freeMinutesToUse = 0;
    let paidMinutesToUse = 0;
    
    if (freeMinutesUsed < 3) {
      // Используем бесплатные минуты
      const freeMinutesAvailable = 3 - freeMinutesUsed;
      freeMinutesToUse = Math.min(minutes_used, freeMinutesAvailable);
      paidMinutesToUse = minutes_used - freeMinutesToUse;
      
      if (freeMinutesToUse > 0) source = 'free';
      if (paidMinutesToUse > 0) source = 'paid';
    } else {
      // Только платные минуты
      paidMinutesToUse = minutes_used;
      source = 'paid';
    }
    
    // Проверяем достаточно ли платных минут
    if (paidMinutesToUse > 0 && paidMinutesLeft < paidMinutesToUse) {
      return NextResponse.json(
        { 
          error: 'Insufficient paid minutes',
          paid_minutes_left: paidMinutesLeft,
          required: paidMinutesToUse
        },
        { status: 403 }
      );
    }
    
    // Обновляем баланс
    const updateData: any = {};
    
    if (freeMinutesToUse > 0) {
      updateData.free_minutes_used = freeMinutesUsed + freeMinutesToUse;
    }
    
    if (paidMinutesToUse > 0) {
      updateData.paid_minutes_left = paidMinutesLeft - paidMinutesToUse;
    }
    
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', targetUserId);
      
      if (updateError) throw updateError;
    }
    
    // Логируем использование
    if (minutes_used > 0) {
      await supabase
        .from('usage_logs')
        .insert({
          user_id: targetUserId,
          minutes_used: minutes_used,
          source: source
        });
    }
    
    return NextResponse.json({
      success: true,
      minutes_used: minutes_used,
      free_minutes_used: freeMinutesUsed + freeMinutesToUse,
      paid_minutes_left: paidMinutesLeft - paidMinutesToUse,
      source,
      user_id: targetUserId
    });
    
  } catch (error) {
    console.error('Error in POST /api/minutes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}