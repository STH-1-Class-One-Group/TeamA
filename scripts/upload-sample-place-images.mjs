import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const sampleDir = path.join(projectRoot, 'sample');
const placesJsonPath = path.join(sampleDir, 'places.generated.json');

const SUPABASE_URL = process.env.APP_SUPABASE_URL;
const SUPABASE_KEY = process.env.APP_SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.APP_SUPABASE_PLACE_IMAGE_BUCKET || 'place-images';

if (!SUPABASE_URL) {
  throw new Error('APP_SUPABASE_URL 환경변수가 필요합니다.');
}

if (!SUPABASE_KEY) {
  throw new Error('APP_SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다.');
}

function headers(extra = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    ...extra,
  };
}

function contentTypeFor(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  return 'application/octet-stream';
}

function encodeStoragePath(storagePath) {
  return storagePath.split('/').map((segment) => encodeURIComponent(segment)).join('/');
}

async function patchPlaceImage(place) {
  const query = new URLSearchParams({ slug: `eq.${place.slug}` });
  const response = await fetch(`${SUPABASE_URL}/rest/v1/map?${query.toString()}`, {
    method: 'PATCH',
    headers: headers({
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    }),
    body: JSON.stringify({
      image_url: place.imageUrl,
      image_storage_path: place.imageStoragePath,
    }),
  });

  if (!response.ok) {
    throw new Error(`map patch failed for ${place.slug}: ${response.status} ${await response.text()}`);
  }
}

async function uploadImage(place) {
  const filePath = path.join(sampleDir, place.imageFileName);
  const body = fs.readFileSync(filePath);
  const encodedPath = encodeStoragePath(place.imageStoragePath);
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodedPath}`, {
    method: 'POST',
    headers: headers({
      'Content-Type': contentTypeFor(place.imageFileName),
      'x-upsert': 'true',
    }),
    body,
  });

  if (!response.ok) {
    throw new Error(`storage upload failed for ${place.slug}: ${response.status} ${await response.text()}`);
  }

  place.imageUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${encodedPath}`;
  await patchPlaceImage(place);
}

const payload = JSON.parse(fs.readFileSync(placesJsonPath, 'utf8'));
const places = payload.places ?? [];
if (!Array.isArray(places) || places.length === 0) {
  throw new Error('places.generated.json 에 업로드할 장소 정보가 없습니다.');
}

for (const place of places) {
  await uploadImage(place);
  console.log(`uploaded ${place.slug}`);
}

console.log(`uploaded ${places.length} place images to ${BUCKET}`);
