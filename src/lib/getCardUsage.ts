import { supabase } from 'src/lib/supabase/supabaseClient';

export const getTotalCardUsage = async (): Promise<number> => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('User not authenticated', userError);
    return 0;
  }

  const { data, error } = await supabase
    .from('card_usage')
    .select('used_count')
    .eq('user_id', user.id);

  if (error || !data) {
    console.error('Error fetching usage data:', error);
    return 0;
  }

  return data.reduce((sum, row) => sum + row.used_count, 0);
};
