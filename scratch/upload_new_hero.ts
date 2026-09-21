import fs from 'node:fs';
import path from 'node:path';

const SUPABASE_URL = 'https://regjgitqkyfhaaogijhu.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlZ2pnaXRxa3lmaGFhb2dpamh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDY1NjY2NCwiZXhwIjoyMTAwMjMyNjY0fQ.dYVFWQ7BqG0BW7Y7xiiAppE07oeFV5jMDNTd5Ogm3fg';

async function main() {
  const filePath = path.resolve('SZABLONY STRON/RENDER/HERO KLIP NOWY.mov');
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
  }

  const stat = fs.statSync(filePath);
  console.log(`Starting upload of ${filePath} (${(stat.size / (1024 * 1024)).toFixed(2)} MB)...`);

  const fileStream = fs.createReadStream(filePath);
  const destinationPath = 'hero/hero-clip-nowy.mov';
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/store-assets/${destinationPath}`;

  console.log('Target URL:', uploadUrl);

  const fileBuffer = fs.readFileSync(filePath);
  console.log('Buffer read into memory. Sending POST request...');

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
      'Content-Type': 'video/quicktime',
      'x-upsert': 'true',
    },
    body: fileBuffer,
  });

  console.log('Upload HTTP status:', res.status, res.statusText);
  const resultText = await res.text();
  console.log('Upload response body:', resultText);

  if (res.ok) {
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/store-assets/${destinationPath}`;
    console.log('SUCCESS! Public URL:', publicUrl);

    // Verify public URL
    const headRes = await fetch(publicUrl, { method: 'HEAD' });
    console.log('Verification HEAD status:', headRes.status);
    console.log('Content-Type:', headRes.headers.get('content-type'));
    console.log('Content-Length:', headRes.headers.get('content-length'));
    console.log('Accept-Ranges:', headRes.headers.get('accept-ranges'));
  } else {
    console.error('Upload failed with status', res.status);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
