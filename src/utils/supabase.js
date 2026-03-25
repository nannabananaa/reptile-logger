import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mobvdbhjdqdhcllldrkj.supabase.co';
const supabaseKey = 'sb_publishable_062Cs774FJz_ONt8oqJktw_S_mJRf5x';

export const supabase = createClient(supabaseUrl, supabaseKey);
