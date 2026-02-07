import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface MinutesBalance {
  paid_minutes_left: number;
  free_minutes_used: number;
  free_minutes_available: number;
  total_available: number;
  canUseFree: boolean;
  limitReached: boolean;
  user_id?: string;
  email?: string | null;
  google_id?: string | null;
}

/**
 * Получить баланс минут по user_id
 */
export async function getMinutesBalanceByUserId(userId: string): Promise<MinutesBalance> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('paid_minutes_left, free_minutes_used, email, google_id')
      .eq('id', userId)
      .single();

    if (error) {
      throw new Error(`Failed to get user balance: ${error.message}`);
    }

    const freeMinutesUsed = data.free_minutes_used || 0;
    const paidMinutesLeft = data.paid_minutes_left || 0;
    const freeMinutesAvailable = Math.max(0, 3 - freeMinutesUsed);
    const totalAvailable = freeMinutesAvailable + paidMinutesLeft;
    const canUseFree = freeMinutesUsed < 3;
    const limitReached = !canUseFree && paidMinutesLeft <= 0;

    return {
      paid_minutes_left: paidMinutesLeft,
      free_minutes_used: freeMinutesUsed,
      free_minutes_available: freeMinutesAvailable,
      total_available: totalAvailable,
      canUseFree,
      limitReached,
      user_id: userId,
      email: data.email,
      google_id: data.google_id
    };
  } catch (error) {
    console.error('Error in getMinutesBalanceByUserId:', error);
    throw error;
  }
}

/**
 * Получить баланс минут по google_id (для Chrome расширения)
 */
export async function getMinutesBalanceByGoogleId(googleId: string): Promise<MinutesBalance> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, paid_minutes_left, free_minutes_used, email, google_id')
      .eq('google_id', googleId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get balance by google_id: ${error.message}`);
    }

    // Если пользователя нет - создаём гостя
    if (!data) {
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          google_id: googleId,
          free_minutes_used: 0,
          plan_type: 'free'
        })
        .select('id, paid_minutes_left, free_minutes_used, email, google_id')
        .single();

      if (insertError) {
        throw new Error(`Failed to create guest user: ${insertError.message}`);
      }

      return {
        paid_minutes_left: 0,
        free_minutes_used: 0,
        free_minutes_available: 3,
        total_available: 3,
        canUseFree: true,
        limitReached: false,
        user_id: newUser.id,
        email: null,
        google_id: googleId
      };
    }

    const freeMinutesUsed = data.free_minutes_used || 0;
    const paidMinutesLeft = data.paid_minutes_left || 0;
    const freeMinutesAvailable = Math.max(0, 3 - freeMinutesUsed);
    const totalAvailable = freeMinutesAvailable + paidMinutesLeft;
    const canUseFree = freeMinutesUsed < 3;
    const limitReached = !canUseFree && paidMinutesLeft <= 0;

    return {
      paid_minutes_left: paidMinutesLeft,
      free_minutes_used: freeMinutesUsed,
      free_minutes_available: freeMinutesAvailable,
      total_available: totalAvailable,
      canUseFree,
      limitReached,
      user_id: data.id,
      email: data.email,
      google_id: data.google_id
    };
  } catch (error) {
    console.error('Error in getMinutesBalanceByGoogleId:', error);
    throw error;
  }
}

/**
 * Получить баланс минут по fingerprint (для гостей сайта)
 */
export async function getMinutesBalanceByFingerprint(fingerprint: string): Promise<MinutesBalance> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, paid_minutes_left, free_minutes_used, email, google_id')
      .eq('fingerprint', fingerprint)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get balance by fingerprint: ${error.message}`);
    }

    // Если пользователя нет - создаём гостя с fingerprint
    if (!data) {
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          fingerprint: fingerprint,
          free_minutes_used: 0,
          plan_type: 'free'
        })
        .select('id, paid_minutes_left, free_minutes_used, email, google_id')
        .single();

      if (insertError) {
        throw new Error(`Failed to create fingerprint user: ${insertError.message}`);
      }

      return {
        paid_minutes_left: 0,
        free_minutes_used: 0,
        free_minutes_available: 3,
        total_available: 3,
        canUseFree: true,
        limitReached: false,
        user_id: newUser.id,
        email: null,
        google_id: null
      };
    }

    const freeMinutesUsed = data.free_minutes_used || 0;
    const paidMinutesLeft = data.paid_minutes_left || 0;
    const freeMinutesAvailable = Math.max(0, 3 - freeMinutesUsed);
    const totalAvailable = freeMinutesAvailable + paidMinutesLeft;
    const canUseFree = freeMinutesUsed < 3;
    const limitReached = !canUseFree && paidMinutesLeft <= 0;

    return {
      paid_minutes_left: paidMinutesLeft,
      free_minutes_used: freeMinutesUsed,
      free_minutes_available: freeMinutesAvailable,
      total_available: totalAvailable,
      canUseFree,
      limitReached,
      user_id: data.id,
      email: data.email,
      google_id: data.google_id
    };
  } catch (error) {
    console.error('Error in getMinutesBalanceByFingerprint:', error);
    throw error;
  }
}

/**
 * Общая функция для получения баланса (автоматически определяет тип идентификации)
 */
export async function getMinutesBalance(identifier: {
  user_id?: string;
  google_id?: string;
  fingerprint?: string;
}): Promise<MinutesBalance> {
  if (identifier.user_id) {
    return getMinutesBalanceByUserId(identifier.user_id);
  } else if (identifier.google_id) {
    return getMinutesBalanceByGoogleId(identifier.google_id);
  } else if (identifier.fingerprint) {
    return getMinutesBalanceByFingerprint(identifier.fingerprint);
  } else {
    throw new Error('No valid identifier provided');
  }
}
