import fs from 'node:fs';
import path from 'node:path';

const SUPABASE_URL = 'https://regjgitqkyfhaaogijhu.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlZ2pnaXRxa3lmaGFhb2dpamh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDY1NjY2NCwiZXhwIjoyMTAwMjMyNjY0fQ.dYVFWQ7BqG0BW7Y7xiiAppE07oeFV5jMDNTd5Ogm3fg';

async function main() {
  const filePath = path.resolve('SZABLONY STRON/RENDER/HERO KLIP.mov');
  const fileBuffer = fs.readFileSync(filePath);
  console.log('Read file, size:', fileBuffer.length, 'bytes');

  const destinationPath = 'hero/hero-clip.mov';
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/store-assets/${destinationPath}`;

  console.log('Uploading to:', uploadUrl);

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

  console.log('Upload status:', res.status, res.statusText);
  const resultText = await res.text();
  console.log('Upload response:', resultText);

  if (res.ok) {
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/store-assets/${destinationPath}`;
    console.log('Public URL:', publicUrl);

    // Verify public URL accessibility
    const verifyRes = await fetch(publicUrl, { method: 'HEAD' });
    console.log('Verify HEAD status:', verifyRes.status);
    console.log('Content-Type:', verifyRes.headers.get('content-type'));
    console.log('Content-Length:', verifyRes.headers.get('content-length'));
    console.log('Accept-Ranges:', verifyRes.headers.get('accept-ranges'));
  }
}

main().catch(console.error);
