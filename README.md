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

Original design: https://www.figma.com/design/udZb5AsWdwZIATCfSWOECC/Battery-Shop-Management-UI