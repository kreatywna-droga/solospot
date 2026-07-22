const fs = require('fs');
const envFile = fs.readFileSync('c:/Users/HP/Documents/GOOGLE ANTIGRAVITY AGENT/na_dobranoc/frontend-web/.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    env[match[1].trim()] = val;
  }
});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['NEXT_PUBLIC_SUPABASE_ANON_KEY']);
async function test() {
  const { data, error } = await supabase.from('forum_stats').select('*');
  console.log('Error:', error);
  console.log('Data:', data);
}
test();
