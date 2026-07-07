import { supabase } from '@/integrations/supabase/client';
import { INVENTORY_MAX_UNITS } from './constants';

/**
 * Live paddle inventory, sourced from the `equipment` table (slug 'paddle').
 * Falls back to the static INVENTORY_MAX_UNITS constant if the row is
 * missing or the table can't be reached, so booking never hard-fails.
 */
export async function fetchPaddleCapacity(): Promise<number> {
  const { data, error } = await supabase
    .from('equipment')
    .select('available_quantity')
    .eq('slug', 'paddle')
    .maybeSingle();
  if (error || !data) return INVENTORY_MAX_UNITS;
  return data.available_quantity;
}
