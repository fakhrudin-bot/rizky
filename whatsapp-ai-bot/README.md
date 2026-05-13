# 🤖 WhatsApp AI Bot

Bot WhatsApp otomatis berbasis AI menggunakan **Baileys** + **Groq API**.

---

## ✨ Fitur

- ✅ Auto-reply semua pesan private dengan AI
- ✅ Di group, hanya balas jika di-mention/di-tag (@bot)
- ✅ Konteks percakapan per user (ingat history chat)
- ✅ Typing indicator sebelum balas
- ✅ Delay alami agar terasa seperti manusia
- ✅ Anti-spam & burst protection
- ✅ Auto reconnect jika koneksi putus
- ✅ Session tersimpan (tidak perlu scan QR ulang)
- ✅ Logging terminal berwarna & informatif
- ✅ Error handling agar bot stabil 24 jam

---

## 📁 Struktur Folder

```
whatsapp-ai-bot/
├── src/
│   ├── index.js              # Entry point
│   ├── config.js             # Konfigurasi & environment
│   ├── whatsapp.js           # Koneksi & event WhatsApp
│   ├── handlers/
│   │   ├── messageHandler.js # Logic routing pesan
│   │   └── aiHandler.js      # Integrasi Groq AI
│   └── utils/
│       ├── logger.js         # Logger berwarna
│       ├── helpers.js        # Fungsi utilitas
│       └── antiSpam.js       # Anti-spam sederhana
├── auth_info_baileys/        # Session WhatsApp (auto-created)
├── .env                      # Environment variables (buat sendiri)
├── .env.example              # Contoh env
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Cara Install & Menjalankan

### 1. Prasyarat
- **Node.js v18+** — cek dengan `node -v`
- **Akun Groq** — daftar gratis di [console.groq.com](https://console.groq.com)

### 2. Clone / Download project
```bash
# Jika dari git
git clone <repo-url>
cd whatsapp-ai-bot

# Atau extract ZIP lalu masuk ke folder
cd whatsapp-ai-bot
```

### 3. Install dependencies
```bash
npm install
```

### 4. Buat file `.env`
```bash
cp .env.example .env
```
Lalu edit `.env` dan isi `GROQ_API_KEY` dengan API key kamu:
```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
BOT_NAME=Aria
```

### 5. Jalankan bot
```bash
npm start
```

### 6. Scan QR Code
- QR code akan muncul di terminal
- Buka WhatsApp > Linked Devices > Link a Device
- Scan QR code tersebut
- Bot langsung aktif! ✅

---

## ⚙️ Konfigurasi `.env`

| Variable | Default | Keterangan |
|----------|---------|------------|
| `GROQ_API_KEY` | *(wajib)* | API key dari console.groq.com |
| `BOT_NAME` | `Aria` | Nama kepribadian bot |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | Model AI yang digunakan |
| `SPAM_COOLDOWN_MS` | `3000` | Jeda minimum antar balasan (ms) |
| `REPLY_DELAY_MIN` | `1500` | Delay minimum sebelum balas (ms) |
| `REPLY_DELAY_MAX` | `4000` | Delay maksimum sebelum balas (ms) |
| `MAX_HISTORY` | `20` | Jumlah turn percakapan yang diingat |
| `LOG_LEVEL` | `info` | Level log: trace/debug/info/warn/error |

---

## 💡 Tips

- **Session tersimpan** di folder `auth_info_baileys/`. Jangan hapus agar tidak perlu scan QR lagi.
- Jika mau **ganti nomor**, hapus folder `auth_info_baileys/` lalu restart.
- Untuk **deploy 24 jam**, gunakan PM2: `npm install -g pm2 && pm2 start src/index.js --name wa-bot`
- Model `llama-3.1-8b-instant` lebih cepat & hemat, cocok untuk respons ringan.

---

## 🔧 Run dengan PM2 (opsional, untuk 24 jam)

```bash
npm install -g pm2
pm2 start src/index.js --name wa-ai-bot
pm2 save
pm2 startup  # agar auto-start saat server reboot
```
