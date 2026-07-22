import { getServiceSupabase } from './src/lib/supabase';

async function check() {
  const s = getServiceSupabase();
  const { data, error } = await s.from('stores').select('slug,name,status,config').limit(5);
  console.log(JSON.stringify({data,error}, null, 2));
}

check();