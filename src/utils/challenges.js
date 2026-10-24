// Looma daily challenges — dipilih berdasarkan tanggal, jadi SEMUA user
// melihat tantangan yang sama di hari yang sama (dan reset tiap tengah malam).

export const CHALLENGES = [
  { id: 'puisi-hujan', emoji: '🌧️', text: 'Tulis puisi 4 baris yang memuat kata "hujan".', category: 'menulis' },
  { id: 'ide-3-menit', emoji: '💡', text: 'Tulis 1 ide kreatif dalam 3 menit tanpa menghapus kata.', category: 'ide' },
  { id: 'mood-coretan', emoji: '🎨', text: 'Gambar bebas selama 5 menit bertema "Perasaan Hari Ini".', category: 'gambar' },
  { id: 'dialog-bus', emoji: '💬', text: 'Tulis dialog fiktif 6 baris antara 2 orang di halte bus.', category: 'menulis' },
  { id: 'puisi-minuman', emoji: '☕', text: 'Buat puisi pendek yang setiap baitnya menyebut minuman favoritmu.', category: 'menulis' },
  { id: 'ide-konyol', emoji: '🤪', text: 'Bikin ide produk paling konyol yang bisa bikin orang tertawa.', category: 'ide' },
  { id: 'judul-3-kata', emoji: '📖', text: 'Tulis cerita pendek dengan judul yang cuma terdiri dari 3 kata.', category: 'menulis' },
  { id: 'mood-3-warna', emoji: '🌈', text: 'Gambar suasana hatimu hari ini hanya dengan 3 warna.', category: 'gambar' },
  { id: 'haiku-pagi', emoji: '🌄', text: 'Tulis haiku 5-7-5 tentang benda pertama yang kamu lihat pagi ini.', category: 'menulis' },
  { id: 'kata-acak', emoji: '🎲', text: 'Buka kamus/buku acak, pilih satu kata, dan buat karya darinya.', category: 'ide' },
];

export function getTodayChallenge() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - start) / 86400000);
  return CHALLENGES[dayOfYear % CHALLENGES.length];
}

export function getTodayISO() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}
