# 📍 MuammoXaritasi

O‘zbekiston bo‘ylab mahalliy muammolarni (yo‘l chuquri, ko‘cha chirog‘i, chiqindi, suv oqishi) interaktiv xaritada xabar qilish veb-sayti.

**Texnologiyalar:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase (Auth, Postgres, Storage), Leaflet + OpenStreetMap, Zod.

## Imkoniyatlar
- Ro‘yxatdan o‘tish, kirish, chiqish (Supabase Auth), profil tahrirlash
- Shaxsiy boshqaruv paneli (statistika va o‘z xabarlari)
- Interaktiv xarita, toifa va holat bo‘yicha filtr
- Muammo yuborish: sarlavha, tavsif, toifa, hudud, xaritadan joy tanlash, 3 tagacha rasm (Supabase Storage)
- Muammo sahifasi, holat tarixi, “Men ham ko‘rdim” tasdiqlash
- Bildirishnomalar (holat o‘zgarganda va tasdiqlanganda — SQL trigger orqali)
- Himoyalangan admin paneli (holatni o‘zgartirish, o‘chirish)
- Xavfsizlik: Row Level Security, storage siyosatlari, Zod tekshiruvi, middleware himoyasi

## Talablar (Windows 11)
1. **Node.js 20 LTS yoki yangisi** — https://nodejs.org
2. **VS Code** — https://code.visualstudio.com
3. Bepul **Supabase** akkaunti — https://supabase.com

## Ishga tushirish — qadamma-qadam
### 1. Supabase loyihasini yarating
1. supabase.com ga kiring → **New project**. Nom va ma’lumotlar bazasi parolini kiriting, hududni tanlang.
2. Loyiha tayyor bo‘lgach: **SQL Editor → New query**.
3. `supabase/migrations/001_init.sql` faylining **butun mazmunini** nusxalab qo‘ying va **Run** bosing. Bu jadvallar, xavfsizlik qoidalari va `report-photos` rasm omborini yaratadi.
4. **Project Settings → API** sahifasidan `Project URL` va `anon public` kalitini nusxalang.
5. (Sinov uchun qulay) **Authentication → Providers → Email** da “Confirm email” ni o‘chirib qo‘ysangiz, ro‘yxatdan o‘tgach darhol kira olasiz. Yoqilgan bo‘lsa, pochtadagi havolani bosish kerak. Ishga tushirishda **Authentication → URL Configuration** da Site URL: `http://localhost:3000` va Redirect URLs: `http://localhost:3000/auth/callback` bo‘lsin.

### 2. Loyihani sozlang
VS Code da papkani oching (**File → Open Folder**), **Terminal → New Terminal** (PowerShell):
```powershell
npm install
copy .env.example .env.local
```
`.env.local` faylini oching va qiymatlarni yozing:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sizning-anon-kalitingiz
```
> ⚠️ `service_role` kalitini hech qachon bu loyihaga yozmang va GitHub’ga yuklamang. `.env.local` fayli `.gitignore` da.

### 3. Ishga tushiring
```powershell
npm run dev
```
Brauzerda http://localhost:3000 oching.

### 4. Birinchi administratorni tayinlang
Avval saytda ro‘yxatdan o‘ting. So‘ng Supabase **SQL Editor** da (pochtangizni yozing):
```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'sizning@pochtangiz.uz');
```
Sahifani yangilang — navigatsiyada “Admin” paydo bo‘ladi.

## Foydali buyruqlar
| Buyruq | Vazifasi |
|---|---|
| `npm run dev` | Dasturlash serveri |
| `npm run build` | Production build |
| `npm start` | Production serverni ishga tushirish |
| `npm test` | Tekshiruv (validatsiya) testlari |
| `npm run lint` | Kod tekshiruvi |

## Loyiha tuzilmasi
```
src/app/            sahifalar (/, /xarita, /kirish, /royxatdan-otish, /muammo-yuborish,
                    /muammo/[id], /dashboard, /profil, /bildirishnomalar, /admin)
src/components/     UI komponentlari (xarita, forma, tugmalar)
src/lib/            Supabase mijozlari, validatsiya, konstantalar
src/middleware.ts   sessiya yangilash va himoyalangan yo‘llar
supabase/migrations SQL migratsiya
```

## Xavfsizlik haqida
- Barcha jadvallarda RLS yoqilgan. Foydalanuvchi faqat o‘z xabarini (va faqat “Yangi” holatida) tahrirlaydi/o‘chiradi.
- Holatni faqat admin o‘zgartiradi (trigger va RLS bilan himoyalangan); rolni foydalanuvchi o‘zgartira olmaydi.
- Rasmlar faqat o‘z papkasiga (`<user_id>/...`), JPG/PNG/WEBP, 5 MB gacha yuklanadi.
- Brauzerda faqat `anon` kalit ishlatiladi.

## Muammolar
- **“Invalid API key” / ulanish xatosi** — `.env.local` qiymatlarini tekshiring, serverni qayta ishga tushiring.
- **Rasm yuklanmayapti** — migratsiya to‘liq bajarilganini va `report-photos` bucket borligini tekshiring.
- **Pochta kelmayapti** — Supabase’ning bepul pochta limiti past; sinov uchun “Confirm email” ni o‘chiring.

## Test holati (halol eslatma)
Kod yozilgan, ammo uni yaratgan muhitda internet bo‘lmagani uchun `npm install`, `npm test` va `npm run build` **u yerda ishga tushirilmagan**. Ularni o‘z kompyuteringizda bajaring; xato chiqsa, xabarni yuboring — tuzatamiz.
