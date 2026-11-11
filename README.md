# Battery Shop Management UI

This project is organized into two separate folders:

```
Battery Shop Management UI/
├── frontend/    ← React + Vite (TypeScript)
└── backend/     ← Laravel (PHP) REST API
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

## Backend (Laravel)

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```
## Media storage (Supabase)

Voice notes, GPS photos and misc-transaction attachments are written through
`backend/app/Services/MediaStorage.php` to the disk named by `MEDIA_DISK`:

| `MEDIA_DISK` | Where files go | Use for |
|---|---|---|
| `public` (default) | `backend/storage/app/public` (served at `/storage/...`) | local development |
| `supabase` | a Supabase Storage bucket (S3-compatible API) | production — survives redeploys |

To use Supabase:

1. Supabase Dashboard → **Storage → Buckets** → create a bucket (e.g. `battery-shop-media`) and mark it **Public**.
2. **Project Settings → Storage → S3 Connection**: copy the endpoint and region. Under **S3 Access Keys** create a key pair.
3. Set these in `backend/.env` (or your hosting platform's env vars), then run `php artisan config:clear`:

```env
MEDIA_DISK=supabase
SUPABASE_S3_ENDPOINT=https://<project-ref>.supabase.co/storage/v1/s3
SUPABASE_S3_REGION=<project-region>
SUPABASE_S3_ACCESS_KEY_ID=<access-key-id>
SUPABASE_S3_SECRET_ACCESS_KEY=<secret-access-key>
SUPABASE_BUCKET=battery-shop-media
SUPABASE_PUBLIC_URL=https://<project-ref>.supabase.co/storage/v1/object/public/battery-shop-media
```

The database stores relative paths (e.g. `voice_notes/abc.webm`); the API returns full links as
`voice_note_url` (services and process flows), `image_url` (GPS photos) and `attachment_url` (misc transactions).
