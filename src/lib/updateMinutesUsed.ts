import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface UpdateMinutesResult {
  success: boolean;
  minutes_used: number;
  free_minutes_used: number;
  paid_minutes_left: number;
  source: 'free' | 'paid' | 'mixed';
  user_id: string;
  insufficient_minutes?: boolean;
  remaining_required?: number;
}

/**
 * Списать использованные минуты по user_id
 */
export async function updateMinutesUsedByUserId(
  userId: string,
  minutesToUse: number
): Promise<UpdateMinutesResult> {
  try {
    if (minutesToUse <= 0) {
      throw new Error('minutesToUse must be greater than 0');
    }

    // Получаем текущий баланс
    const { data: userData, error: selectError } = await supabase
      .from('users')
      .select('free_minutes_used, paid_minutes_left, email')
      .eq('id', userId)
      .single();

    if (selectError) {
      throw new Error(`Failed to get user data: ${selectError.message}`);
    }

    let freeMinutesUsed = userData.free_minutes_used || 0;
    let paidMinutesLeft = userData.paid_minutes_left || 0;

    // Определяем, сколько минут списывать из каждого источника
    let freeMinutesToUse = 0;
    let paidMinutesToUse = 0;
    let source: 'free' | 'paid' | 'mixed' = 'free';

    // Сначала используем бесплатные минуты
    if (freeMinutesUsed < 3) {
      const freeMinutesAvailable = 3 - freeMinutesUsed;
      freeMinutesToUse = Math.min(minutesToUse, freeMinutesAvailable);
      paidMinutesToUse = minutesToUse - freeMinutesToUse;

      if (freeMinutesToUse > 0 && paidMinutesToUse > 0) {
        source = 'mixed';
      } else if (freeMinutesToUse > 0) {
        source = 'free';
      } else if (paidMinutesToUse > 0) {
        source = 'paid';
      }
    } else {
      // Только платные минуты
      paidMinutesToUse = minutesToUse;
      source = 'paid';
    }

    // Проверяем, достаточно ли платных минут
    if (paidMinutesToUse > 0 && paidMinutesLeft < paidMinutesToUse) {
      return {
        success: false,
        minutes_used: 0,
        free_minutes_used: freeMinutesUsed,
        paid_minutes_left: paidMinutesLeft,
        source: 'paid',
        user_id: userId,
        insufficient_minutes: true,
        remaining_required: paidMinutesToUse - paidMinutesLeft
      };
    }

    // Подготавливаем данные для обновления
    const updateData: any = {};

    if (freeMinutesToUse > 0) {
      updateData.free_minutes_used = freeMinutesUsed + freeMinutesToUse;
    }

    if (paidMinutesToUse > 0) {
      updateData.paid_minutes_left = Math.max(0, paidMinutesLeft - paidMinutesToUse);
    }

    // Обновляем баланс пользователя
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId);

      if (updateError) {
        throw new Error(`Failed to update user balance: ${updateError.message}`);
      }
    }

    // Логируем использование
    if (minutesToUse > 0) {
      const { error: logError } = await supabase
        .from('usage_logs')
        .insert({
          user_id: userId,
          minutes_used: minutesToUse,
          source: source === 'mixed' ? 'paid' : source // Для mixed логируем как paid
        });

      if (logError) {
        console.warn('Failed to log usage (non-critical):', logError);
      }
    }

    return {
      success: true,
      minutes_used: minutesToUse,
      free_minutes_used: freeMinutesUsed + freeMinutesToUse,
      paid_minutes_left: Math.max(0, paidMinutesLeft - paidMinutesToUse),
      source,
      user_id: userId
    };

  } catch (error) {
    console.error('Error in updateMinutesUsedByUserId:', error);
    throw error;
  }
}

/**
 * Списать минуты по google_id (для Chrome расширения)
 */
export async function updateMinutesUsedByGoogleId(
  googleId: string,
  minutesToUse: number
): Promise<UpdateMinutesResult> {
  try {
    // Сначала находим user_id по google_id
    const { data: userData, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('google_id', googleId)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      throw new Error(`Failed to find user by google_id: ${findError.message}`);
    }

    // Если пользователя нет - создаём гостя
    let userId: string;
    if (!userData) {
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          google_id: googleId,
          free_minutes_used: 0,
          plan_type: 'free'
        })
        .select('id')
        .single();

      if (insertError) {
        throw new Error(`Failed to create guest user: ${insertError.message}`);
      }
      userId = newUser.id;
    } else {
      userId = userData.id;
    }

    // Используем основную функцию
    return await updateMinutesUsedByUserId(userId, minutesToUse);

  } catch (error) {
    console.error('Error in updateMinutesUsedByGoogleId:', error);
    throw error;
  }
}

/**
 * Списать минуты по fingerprint (для гостей сайта)
 */
export async function updateMinutesUsedByFingerprint(
  fingerprint: string,
  minutesToUse: number
): Promise<UpdateMinutesResult> {
  try {
    // Сначала находим user_id по fingerprint
    const { data: userData, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('fingerprint', fingerprint)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      throw new Error(`Failed to find user by fingerprint: ${findError.message}`);
    }

    // Если пользователя нет - создаём гостя
    let userId: string;
    if (!userData) {
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          fingerprint: fingerprint,
          free_minutes_used: 0,
          plan_type: 'free'
        })
        .select('id')
        .single();

      if (insertError) {
        throw new Error(`Failed to create fingerprint user: ${insertError.message}`);
      }
      userId = newUser.id;
    } else {
      userId = userData.id;
    }

    // Используем основную функцию
    return await updateMinutesUsedByUserId(userId, minutesToUse);

  } catch (error) {
    console.error('Error in updateMinutesUsedByFingerprint:', error);
    throw error;
  }
}

/**
 * Общая функция для списания минут (автоматически определяет тип идентификации)
 */
export async function updateMinutesUsed(
  identifier: {
    user_id?: string;
    google_id?: string;
    fingerprint?: string;
  },
  minutesToUse: number
): Promise<UpdateMinutesResult> {
  if (identifier.user_id) {
    return await updateMinutesUsedByUserId(identifier.user_id, minutesToUse);
  } else if (identifier.google_id) {
    return await updateMinutesUsedByGoogleId(identifier.google_id, minutesToUse);
  } else if (identifier.fingerprint) {
    return await updateMinutesUsedByFingerprint(identifier.fingerprint, minutesToUse);
  } else {
    throw new Error('No valid identifier provided');
  }
}

/**
 * Проверить, достаточно ли минут для использования
 */
export async function checkMinutesAvailability(
  identifier: {
    user_id?: string;
    google_id?: string;
    fingerprint?: string;
  },
  minutesToCheck: number
): Promise<{
  available: boolean;
  free_minutes_available: number;
  paid_minutes_left: number;
  total_available: number;
  insufficient: number;
  need_payment: boolean;
}> {
  try {
    // Получаем баланс
    const { data: userData } = await supabase
      .from('users')
      .select('free_minutes_used, paid_minutes_left')
      .eq(
        identifier.user_id ? 'id' : 
        identifier.google_id ? 'google_id' : 'fingerprint',
        identifier.user_id || identifier.google_id || identifier.fingerprint
      )
      .single();

    const freeMinutesUsed = userData?.free_minutes_used || 0;
    const paidMinutesLeft = userData?.paid_minutes_left || 0;
    
    const freeMinutesAvailable = Math.max(0, 3 - freeMinutesUsed);
    const totalAvailable = freeMinutesAvailable + paidMinutesLeft;

    const available = totalAvailable >= minutesToCheck;
    const insufficient = Math.max(0, minutesToCheck - totalAvailable);
    const need_payment = freeMinutesAvailable < minutesToCheck && paidMinutesLeft === 0;

    return {
      available,
      free_minutes_available: freeMinutesAvailable,
      paid_minutes_left: paidMinutesLeft,
      total_available: totalAvailable,
      insufficient,
      need_payment
    };
  } catch (error) {
    console.error('Error in checkMinutesAvailability:', error);
    throw error;
  }
}