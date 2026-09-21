import fs from 'node:fs';
import path from 'node:path';

const SUPABASE_URL = 'https://regjgitqkyfhaaogijhu.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlZ2pnaXRxa3lmaGFhb2dpamh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDY1NjY2NCwiZXhwIjoyMTAwMjMyNjY0fQ.dYVFWQ7BqG0BW7Y7xiiAppE07oeFV5jMDNTd5Ogm3fg';

async function uploadFile(localPath: string, destPath: string, contentType: string) {
  const filePath = path.resolve(localPath);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const stat = fs.statSync(filePath);
  console.log(`\nUploading ${localPath} (${(stat.size / (1024 * 1024)).toFixed(2)} MB) to ${destPath}...`);

  const fileBuffer = fs.readFileSync(filePath);
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/store-assets/${destPath}`;

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
      'Content-Type': contentType,
      'x-upsert': 'true',
    },
    body: fileBuffer,
  });

  console.log(`Response status: ${res.status} ${res.statusText}`);
  const text = await res.text();
  console.log(`Response body: ${text}`);

  if (!res.ok) {
    throw new Error(`Failed to upload ${localPath}: ${res.status} ${text}`);
  }

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/store-assets/${destPath}`;
  console.log(`Public URL: ${publicUrl}`);

  // Verify HEAD request
  const verifyRes = await fetch(publicUrl, { method: 'HEAD' });
  console.log(`Verification HEAD status: ${verifyRes.status}`);
  console.log(`Content-Type: ${verifyRes.headers.get('content-type')}`);
  console.log(`Content-Length: ${verifyRes.headers.get('content-length')}`);
  console.log(`Accept-Ranges: ${verifyRes.headers.get('accept-ranges')}`);

  return publicUrl;
}

async function main() {
  // 1. Upload Video
  const videoUrl = await uploadFile('scratch/hero-clip-nowy.mp4', 'hero/hero-clip-nowy.mp4', 'video/mp4');

  // 2. Upload Poster
  const posterUrl = await uploadFile('scratch/hero-poster-nowy.jpg', 'hero/hero-poster-nowy.jpg', 'image/jpeg');

  console.log('\n=== COMPLETED SUCCESSFULLY ===');
  console.log('VIDEO URL:', videoUrl);
  console.log('POSTER URL:', posterUrl);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
