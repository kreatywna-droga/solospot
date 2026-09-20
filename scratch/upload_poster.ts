import fs from 'node:fs';
import path from 'node:path';

const SUPABASE_URL = 'https://regjgitqkyfhaaogijhu.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlZ2pnaXRxa3lmaGFhb2dpamh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDY1NjY2NCwiZXhwIjoyMTAwMjMyNjY0fQ.dYVFWQ7BqG0BW7Y7xiiAppE07oeFV5jMDNTd5Ogm3fg';

async function main() {
  const srcImage = 'C:/Users/HP/.gemini/antigravity-ide/brain/5621a77f-b4cc-4676-9596-dde11e852d68/.user_uploaded/media_1789914998112.png';
  if (!fs.existsSync(srcImage)) {
    console.error('Source image not found:', srcImage);
    return;
  }
  const imgBuffer = fs.readFileSync(srcImage);
  fs.writeFileSync(path.resolve('public/hero-cinematic-poster.png'), imgBuffer);
  console.log('Copied to public/hero-cinematic-poster.png, size:', imgBuffer.length);

  const destinationPath = 'hero/hero-poster.png';
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/store-assets/${destinationPath}`;

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
      'Content-Type': 'image/png',
      'x-upsert': 'true',
    },
    body: imgBuffer,
  });

  console.log('Upload status:', res.status, res.statusText);
  if (res.ok) {
    console.log('Public Poster URL:', `${SUPABASE_URL}/storage/v1/object/public/store-assets/${destinationPath}`);
  }
}

main().catch(console.error);
