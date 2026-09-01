# 🚀 Tutorial Lengkap Setup Supabase untuk Uangku

## 📋 Daftar Isi

1. [Persiapan](#1-persiapan)
2. [Buat Project Supabase](#2-buat-project-supabase)
3. [Setup Database](#3-setup-database)
4. [Konfigurasi Autentikasi](#4-konfigurasi-autentikasi)
5. [Konfigurasi Environment Variables](#5-konfigurasi-environment-variables)
6. [Jalankan Aplikasi](#6-jalankan-aplikasi)
7. [Deploy ke Production](#7-deploy-ke-production)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Persiapan

### Syarat
- Akun Supabase gratis di https://supabase.com
- Node.js v18 atau lebih tinggi
- Terminal/Command Prompt

### Cek Versi Node
```bash
node --version
# Harus v18.0.0 atau lebih tinggi
```

---

## 2. Buat Project Supabase

### Langkah 1: Daftar/Login
1. Buka https://supabase.com
2. Klik **"Start your project"** atau **"Sign in"**
3. Login dengan GitHub (paling mudah)

### Langkah 2: Buat Project Baru
1. Klik **"New Project"**
2. Isi form:
   - **Organization**: Pilih atau buat baru
   - **Project name**: `uangku-app`
   - **Database Password**: Buat password kuat (simpan!)
   - **Region**: Pilih **Southeast Asia (Singapore)** untuk Indonesia
3. Klik **"Create new project"**
4. Tunggu 1-2 menit sampai selesai

### Langkah 3: Catat API Keys
Setelah project selesai, Anda akan melihat dashboard. Catat:

1. Buka **Settings** → **API** (di sidebar kiri)
2. Catat:
   - **Project URL**: `https://xxxxxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

⚠️ **JANGAN** bagikan `anon key` ke publik - tapi untuk app client-side, ini aman digunakan.

---

## 3. Setup Database

### Langkah 1: Buka SQL Editor
1. Di dashboard Supabase, klik **"SQL Editor"** (di sidebar kiri)
2. Klik **"New query"**

### Langkah 2: Jalankan Schema
1. Buka file `D:\project\uangku\supabase\schema.sql`
2. Copy **SELURUH** isi file
3. Paste ke SQL Editor di Supabase
4. Klik **"Run"** (tombol biru di pojok kanan atas)
5. Tunggu sampai muncul "Success"

### Langkah 3: Jalankan Seed Data
1. Buka file `D:\project\uangku\supabase\seed.sql`
2. Copy seluruh isi
3. Buka query baru di SQL Editor
4. Paste dan klik **"Run"**

### Verifikasi
Buka **Table Editor** di Supabase, pastikan ada tabel:
- ✅ profiles
- ✅ financial_accounts
- ✅ categories
- ✅ transactions
- ✅ receivables_payables
- ✅ debt_payments
- ✅ budgets

---

## 4. Konfigurasi Autentikasi

### Aktifkan Email Auth
1. Di Supabase dashboard, klik **"Authentication"** (di sidebar)
2. Klik **"Providers"**
3. Pastikan **Email** sudah aktif (default sudah aktif)
4. (Opsional) Matikan **"Confirm email"** untuk testing:
   - Klik **"Email Templates"**
   - Atau di **Providers** → **Email** → matikan "Confirm email"

### (Opsional) Aktifkan Google Auth
1. Di **Providers**, klik **"Google"**
2. Ikuti instruksi untuk membuat Google OAuth credentials
3. Masukkan Client ID dan Client Secret
4. Klik **"Save"**

---

## 5. Konfigurasi Environment Variables

### Langkah 1: Buat File .env.local
Buat file baru bernama `.env.local` di folder `D:\project\uangku\`:

```
# Supabase Configuration
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App Settings
VITE_APP_NAME=Uangku
```

### Langkah 2: Isi dengan Data Anda
Ganti placeholder dengan data dari Supabase:

```env
VITE_SUPABASE_URL=https://abc123.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiYzEyMw...
```

### ⚠️ Penting
- **JANGAN** commit file `.env.local` ke Git
- File sudah ada di `.gitignore` secara default
- Setiap environment variable harus diawali dengan `VITE_`

---

## 6. Jalankan Aplikasi

### Langkah 1: Install Dependencies (jika belum)
```bash
cd D:\project\uangku
npm install
```

### Langkah 2: Jalankan Development Server
```bash
npm run dev
```

### Langkah 3: Buka Browser
```
http://localhost:5173
```

### Langkah 4: Register Akun Baru
1. Klik **"Daftar"**
2. Masukkan email dan password
3. Cek email untuk verifikasi (jika aktif)
4. Login dengan akun baru

### ⚡ Perbedaan Mode
- **Tanpa Supabase**: Aplikasi menggunakan localStorage (data tersimpan di browser)
- **Dengan Supabase**: Data tersimpan di cloud, bisa diakses dari mana saja

---

## 7. Deploy ke Production

### Option A: Vercel (Recommended)

#### 1. Push ke GitHub
```bash
cd D:\project\uangku
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/uangku.git
git push -u origin main
```

#### 2. Deploy ke Vercel
1. Buka https://vercel.com
2. Login dengan GitHub
3. Klik **"New Project"**
4. Import repository `uangku`
5. Tambahkan Environment Variables:
   - `VITE_SUPABASE_URL` = URL Supabase Anda
   - `VITE_SUPABASE_ANON_KEY` = Anon key Anda
6. Klik **"Deploy"**
7. Tunggu selesai, dapat URL seperti `https://uangku.vercel.app`

#### 3. Konfigurasi Supabase
1. Buka Supabase Dashboard → **Authentication** → **URL Configuration**
2. Tambahkan:
   - **Site URL**: `https://uangku.vercel.app`
   - **Redirect URLs**: `https://uangku.vercel.app/*`

### Option B: Netlify
1. Buka https://netlify.com
2. Drag & drop folder `dist` (setelah `npm run build`)
3. Atau connect ke GitHub untuk auto-deploy

---

## 8. Troubleshooting

### Masalah: "Invalid API key"
**Solusi**:
- Pastikan URL dan key di `.env.local` benar
- Restart development server setelah mengubah `.env.local`
- Cek spasi atau karakter tersembunyi

### Masalah: "Email not confirmed"
**Solusi**:
1. Supabase Dashboard → **Authentication** → **Providers** → **Email**
2. Matikan **"Confirm email"** untuk development
3. Untuk production, cek email masuk di folder spam

### Masalah: "Row Level Security policy"
**Solusi**:
- Pastikan schema SQL sudah dijalankan dengan benar
- Cek di Table Editor → pilih tabel → policies
- Harus ada policy untuk authenticated users

### Masalah: Data tidak muncul
**Solusi**:
1. Login ulang
2. Cek console browser (F12) untuk error
3. Pastikan `.env.local` ada di root folder uangku

### Masalah: "CORS error"
**Solusi**:
1. Supabase Dashboard → **Settings** → **API**
2. Cek **Application URLs**
3. Tambahkan URL app Anda (misal: `http://localhost:5173`)

---

## 📚 Referensi

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode)

---

## 🆘 Butuh Bantuan?

Jika mengalami masalah:
1. Cek error message di console browser (F12)
2. Pastikan semua langkah di atas dilakukan
3. Restart development server
4. Hapus localStorage browser dan coba login lagi

---

**Selamat menggunakan Uangku! 🎉**
