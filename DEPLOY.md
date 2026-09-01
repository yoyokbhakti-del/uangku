# 🚀 Deploy Uangku

## Cara Tercepat: Netlify Drop (30 detik)

1. **Build** (sudah dilakukan otomatis):
   ```bash
   cd uangku
   npm run build
   ```

2. **Buka** [app.netlify.com/drop](https://app.netlify.com/drop) di browser

3. **Drag & drop** folder `uangku/dist` ke halaman tersebut

4. **Selesai!** Netlify akan memberikan URL gratis seperti `https://uangku-abc123.netlify.app`

---

## Cara 2: Netlify via Git (3 menit)

1. Push project ke GitHub:
   ```bash
   cd uangku
   git init
   git add .
   git commit -m "Deploy Uangku PWA"
   git remote add origin https://github.com/USERNAME/uangku.git
   git push -u origin main
   ```

2. Buka [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**

3. Pilih **GitHub** → pilih repo `uangku`

4. Settings otomatis:
   - Build command: `npm run build`
   - Publish directory: `dist`

5. Klik **Deploy site** → selesai!

---

## Cara 3: Vercel (3 menit)

1. Push project ke GitHub (sama seperti di atas)

2. Buka [vercel.com](https://vercel.com) → **Add New Project**

3. Import repo GitHub `uangku`

4. Framework: **Vite** (otomatis terdeteksi)

5. Klik **Deploy** → selesai!

---

## ⚠️ Penting: Supabase (Opsional)

Jika menggunakan Supabase:
1. Buat `.env.local`:
   ```
   VITE_SUPABASE_URL=https://xxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbG...
   ```
2. Di Vercel: Settings → Environment Variables → tambahkan 2 variabel di atas
3. Redeploy

Tanpa Supabase, aplikasi tetap berfungsi 100% dengan localStorage.

---

## ✅ Checklist Setelah Deploy

- [ ] Buka URL di HP → langsung masuk dashboard
- [ ] Muncul popup "Install Uangku" → install sebagai PWA
- [ ] Matikan WiFi → aplikasi tetap bisa dibuka
- [ ] Data transaksi tetap tersimpan
