import {
    Camera,
    Flame,
    Shuffle,
    Trash2,
    Upload
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const TRUTH_PROMPTS = [
  { id: 't1', cat: 'Funny', text: 'Apa hal paling memalukan yang pernah kamu lakukan sendirian di kamar dan untungnya tidak ada yang melihat?' },
  { id: 't2', cat: 'Nostalgia', text: 'Kebohongan masa kecil apa yang kamu percaya sampai remaja sebelum akhirnya tahu kenyataannya?' },
  { id: 't3', cat: 'Creative', text: 'Karya atau unggahan lama mana yang bikin kamu geli atau tertawa saat melihatnya sekarang?' },
  { id: 't4', cat: 'Personal', text: 'Kapan terakhir kali kamu pura-pura paham padahal tidak mengerti yang sedang dibicarakan?' },
  { id: 't5', cat: 'Funny', text: 'Kombinasi makanan aneh apa yang menurut orang lain menjijikkan, tapi menurutmu enak?' },
  { id: 't6', cat: 'Daring', text: 'Pernah diam-diam iri dengan pencapaian kreatif teman? Ceritakan perasaanmu dengan jujur.' },
  { id: 't7', cat: 'Creative', text: 'Kalau hidupmu jadi buku atau film komedi, judul apa yang paling cocok saat ini?' },
  { id: 't8', cat: 'Personal', text: 'Kebiasaan unik apa yang belum pernah kamu ceritakan kepada siapa pun?' },
  { id: 't9', cat: 'Funny', text: 'Pernah salah kirim pesan memalukan ke orang atau grup yang salah? Apa yang terjadi?' },
  { id: 't10', cat: 'Nostalgia', text: 'Siapa idola masa kecilmu yang sekarang bikin kamu bertanya-tanya kenapa dulu ngefans?' },
  { id: 't11', cat: 'Creative', text: 'Kalau kamu bisa menghapus satu karya yang pernah kamu buat dari sejarah, karya apa itu?' },
  { id: 't12', cat: 'Personal', text: 'Apa "guilty pleasure" terbesar yang kamu nikmati tapi malu mengakuinya?' },
  { id: 't13', cat: 'Funny', text: 'Ceritakan momen di mana kamu berpura-pura tidur atau sibuk agar tidak diganggu.' },
  { id: 't14', cat: 'Daring', text: 'Apa pendapat jujurmu tentang tren kreatif yang sedang populer tapi menurutmu tidak keren?' },
  { id: 't15', cat: 'Nostalgia', text: 'Apa fase "cringe" terbesarmu — hal yang sangat kamu sukai dulu tapi sekarang bikin malu?' },
  { id: 't16', cat: 'Personal', text: 'Jika bisa berbicara jujur dengan satu orang tanpa konsekuensi, siapa dan apa yang ingin kamu katakan?' },
  { id: 't17', cat: 'Creative', text: 'Apa ide paling gila yang pernah kamu pikirkan tapi tidak pernah kamu laksanakan karena takut dihakimi?' },
  { id: 't18', cat: 'Funny', text: 'Pernah pura-pura tidak melihat notifikasi pesan seseorang padahal sudah dibaca? Ceritakan!' },
  { id: 't19', cat: 'Daring', text: 'Ceritakan satu momen di mana kamu benar-benar tidak tahu apa yang kamu lakukan tapi pura-pura tahu.' },
  { id: 't20', cat: 'Personal', text: 'Apa hal yang paling kamu regret tidak dikerjakan lebih awal dalam hidupmu?' },
  { id: 't21', cat: 'Funny', text: 'Pernah jatuh atau menabrak sesuatu di tempat umum? Bagaimana reaksimu setelahnya?' },
  { id: 't22', cat: 'Creative', text: 'Kalau hidupmu punya soundtrack, lagu apa yang paling sering berbunyi akhir-akhir ini?' },
  { id: 't23', cat: 'Nostalgia', text: 'Apa keahlian rahasia yang kamu miliki waktu kecil yang tidak ada yang tahu sekarang?' },
  { id: 't24', cat: 'Daring', text: 'Sebutkan sesuatu yang kamu yakini tapi kebanyakan orang tidak setuju denganmu.' },
  { id: 't25', cat: 'Personal', text: 'Apa kalimat yang paling sering kamu ucapkan dalam pikiranmu setiap hari?' },
  { id: 't26', cat: 'Funny', text: 'Apa alasan paling konyol yang pernah kamu pakai untuk membatalkan janji temu seseorang?' },
  { id: 't27', cat: 'Creative', text: 'Kalau kamu bisa punya satu superpower tapi cuma untuk hal kreatif, apa pilihanmu dan kenapa?' },
  { id: 't28', cat: 'Nostalgia', text: 'Apa lagu yang dulu kamu putar berulang-ulang sampai bosan, dan kenapa lagu itu spesial?' },
  { id: 't29', cat: 'Personal', text: 'Apa hal kecil yang bikin harimu jadi langsung lebih baik, tapi jarang kamu lakukan?' },
  { id: 't30', cat: 'Daring', text: 'Pernah ngomong jujur padahal situasi lebih aman kal kamu bohong? Apa hasilnya?' },
  { id: 't31', cat: 'Funny', text: 'Apa kebiasaan orang lain yang menurutmu sangat aneh tapi kamu diam-diam suka melakukannya juga?' },
  { id: 't32', cat: 'Creative', text: 'Kalau kamu harus bikin satu kata baru untuk kamus, kata apa itu dan apa artinya?' },
  { id: 't33', cat: 'Nostalgia', text: 'Apa tempat dari masa kecilmu yang sudah tidak ada lagi tapi kamu masih sering kangen?' },
  { id: 't34', cat: 'Personal', text: 'Apa hal yang paling sering kamu tunda, dan jujur kenapa kamu selalu menundanya?' },
  { id: 't35', cat: 'Daring', text: 'Ceritakan momen di mana kamu berani banget melakukan sesuatu yang tidak karakteristikmu.' },
  { id: 't36', cat: 'Funny', text: 'Apa kesalahpahaman lucu yang pernah terjadi antara kamu dan seseorang tentang sesuatu?' },
  { id: 't37', cat: 'Creative', text: 'Kalau semua karyamu akan hilang besok kecuali satu, mana yang kamu simpan dan kenapa?' },
  { id: 't38', cat: 'Nostalgia', text: 'Apa hadiah paling unik yang pernah kamu terima yang sampai sekarang masih kamu ingat?' },
  { id: 't39', cat: 'Personal', text: 'Apa nasihat yang sering kamu kasih ke orang lain tapi kamu sendiri belum melakukannya?' },
  { id: 't40', cat: 'Daring', text: 'Sebutkan satu hal yang dulu kamu takuti tapi sekarang kamu sudah berani hadapi.' },
];

const DARE_PROMPTS = [
  { id: 'd1', cat: 'Funny', text: 'Buat ekspresi paling konyolmu, lalu selfie seolah-olah baru mendengar lelucon terlucu.' },
  { id: 'd2', cat: 'Creative', text: 'Ubah benda biasa di dekatmu jadi karakter kecil. Gambar wajahnya lalu foto hasilnya.' },
  { id: 'd3', cat: 'Daring', text: 'Pilih pose dramatis seperti poster film dan abadikan dengan foto.' },
  { id: 'd4', cat: 'Creative', text: 'Gambar makhluk baru dengan alat apa pun yang ada di dekatmu, lalu foto hasil gambarmu.' },
  { id: 'd5', cat: 'Funny', text: 'Susun tiga benda ringan yang aman jadi menara paling konyol, lalu foto menaramu.' },
  { id: 'd6', cat: 'Creative', text: 'Buat mahkota kertas kecil untuk benda di dekatmu, lalu foto seperti potret kerajaan.' },
  { id: 'd7', cat: 'Daring', text: 'Lakukan jalan ala peragaan busana yang kocak, pasang pose terbaik, lalu foto.' },
  { id: 'd8', cat: 'Funny', text: 'Cari benda berwarna cerah, berpose seperti bintang pop dengannya, lalu foto.' },
  { id: 'd9', cat: 'Creative', text: 'Buat patung mini dari benda-benda aman di sekitarmu, lalu foto mahakaryamu.' },
  { id: 'd10', cat: 'Daring', text: 'Ciptakan tiga gerakan tarian, lakukan, lalu foto pose akhirmu.' },
  { id: 'd11', cat: 'Creative', text: 'Gambar potret dirimu hanya menggunakan emoji dan tanda baca, lalu bagikan hasilnya.' },
  { id: 'd12', cat: 'Funny', text: 'Buat wajah paling dramatis saat pura-pura menerima penghargaan oscar, lalu foto.' },
  { id: 'd13', cat: 'Daring', text: 'Tulis puisi 4 baris dalam waktu 2 menit tepat dan langsung posting tanpa diedit.' },
  { id: 'd14', cat: 'Creative', text: 'Buat "selfie artistik" di mana wajahmu tersembunyi di balik benda atau karya senimu.' },
  { id: 'd15', cat: 'Funny', text: 'Susun makanan atau minuman di mejamu jadi karya seni instalasi lalu foto sebelum dimakan.' },
  { id: 'd16', cat: 'Daring', text: 'Rekam atau foto dirimu sedang membacakan puisi dengan gaya sepedramatis mungkin.' },
  { id: 'd17', cat: 'Creative', text: 'Buat sketsa wajah temanmu atau orang terdekatmu dari ingatan saja, tanpa melihat foto.' },
  { id: 'd18', cat: 'Funny', text: 'Cari sudut kameramu yang paling absurd dan jadikan itu foto profil sementaramu.' },
  { id: 'd19', cat: 'Daring', text: 'Desain "stiker" atau "label nama" untuk dirimu sendiri pakai kertas dan spidol, lalu foto hasilnya.' },
  { id: 'd20', cat: 'Creative', text: 'Gambar sesuatu dengan mata tertutup selama 30 detik, lalu foto hasilnya — apa pun jadinya!' },
  { id: 'd21', cat: 'Funny', text: 'Bikin meme tentang dirimu sendiri menggunakan foto atau gambar yang ada di galerimu.' },
  { id: 'd22', cat: 'Daring', text: 'Tulis satu kalimat inspirasional hasil ciptaanmu sendiri di kertas besar dan foto.' },
  { id: 'd23', cat: 'Creative', text: 'Buat "aksesori" dari bahan yang ada di sekitarmu (gelang kertas, mahkota daun dll) dan foto.' },
  { id: 'd24', cat: 'Funny', text: 'Ambil foto "behind the scenes" dari meja atau ruanganmu sekarang apa adanya tanpa dirapikan.' },
  { id: 'd25', cat: 'Daring', text: 'Gambar peta imajiner dari kota khayalanmu lengkap dengan nama jalan, lalu foto hasilnya.' },
  { id: 'd26', cat: 'Creative', text: 'Tulis haiku (3 baris, 5-7-5 suku kata) tentang benda pertama yang kamu lihat di kiri, lalu posting.' },
  { id: 'd27', cat: 'Funny', text: 'Rekam suaramu menirukan hewan paling tidak masuk akal yang kamu bisa, lalu bagikan.' },
  { id: 'd28', cat: 'Daring', text: 'Tulis pantun 4 baris tentang teman atau seseorang yang kamu kenal, langsung posting tanpa edit.' },
  { id: 'd29', cat: 'Creative', text: 'Buat "poster film" fiksi dari kehidupanmu sehari-hari menggunakan kertas dan spidol, lalu foto.' },
  { id: 'd30', cat: 'Funny', text: 'Ambil foto benda di dekatmu dari sudut yang bikin benda itu terlihat seperti benda lain.' },
  { id: 'd31', cat: 'Daring', text: 'Tulis surat terbuka singkat ke "diri masa depan 5 tahun" dan bagikan tanpa revisi.' },
  { id: 'd32', cat: 'Creative', text: 'Gambar logo untuk "merek pribadi" versi kamu sendiri, se simpel mungkin, lalu foto.' },
  { id: 'd33', cat: 'Funny', text: 'Buat ekspresi wajah untuk setiap hari dalam seminggu, foto semua, dan susun jadi grid.' },
  { id: 'd34', cat: 'Daring', text: 'Pilih satu kata favoritmu, tulis di kertas dengan font yang kamu rancang sendiri, lalu foto.' },
  { id: 'd35', cat: 'Creative', text: 'Susun benda-benda kecil di mejamu jadi satu komposisi yang terlihat seperti karya seni abstrak, lalu foto.' },
  { id: 'd36', cat: 'Funny', text: 'Buat "tutorial" parodi 30 detik tentang hal paling sepele yang kamu bisa lakukan, lalu bagikan.' },
  { id: 'd37', cat: 'Daring', text: 'Tulis puisi tentang momen paling berkesan bulan ini, dalam 6 baris, langsung posting.' },
  { id: 'd38', cat: 'Creative', text: 'Gambar siluet dirimu dari bayangan yang kamu buat dengan tangan dan cahaya, lalu foto.' },
  { id: 'd39', cat: 'Funny', text: 'Beri caption fiksi yang dramatis untuk foto paling biasa di galerimu, lalu bagikan.' },
  { id: 'd40', cat: 'Daring', text: 'Tulis manifesto kreatif 3 poin untuk tahun ini, tulis tangan di kertas, lalu foto dan bagikan.' },
];

export default function ChallengeStudio({
  title,
  setTitle,
  answer,
  setAnswer,
  proofImage,
  setProofImage,
  onSound,
}) {
  // Randomize mode and prompt on every mount so each entry is different
  const initialModeRef = useState(() => (Math.random() < 0.5 ? 'truth' : 'dare'))[0];
  const [mode, setMode] = useState(initialModeRef);
  const [currentPrompt, setCurrentPrompt] = useState(() => {
    const pool = initialModeRef === 'truth' ? TRUTH_PROMPTS : DARE_PROMPTS;
    return pool[Math.floor(Math.random() * pool.length)];
  });
  const [isSpinning, setIsSpinning] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Stop camera stream when unmounted or deactivated
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Camera is not supported in this browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      if (onSound) onSound('pop');
      // Assign video srcObject on next frame
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch (err) {
      console.error('Could not access camera:', err);
      setCameraError('Camera could not be accessed. Check camera permissions in your browser or device settings.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;
    const scale = Math.min(1, 800 / vw);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(vw * scale);
    canvas.height = Math.round(vh * scale);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      setProofImage(canvas.toDataURL('image/jpeg', 0.8));
      if (onSound) onSound('chime');
    }
    stopCamera();
  };

  // Always keep title in sync with the current prompt so the post title matches what was shown
  useEffect(() => {
    setTitle(`${mode === 'truth' ? 'TRUTH' : 'DARE'}: ${currentPrompt.text}`);
  }, [mode, currentPrompt, setTitle]);

  // Acak Tantangan (Shuffle)
  const handleSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    if (onSound) onSound('coin');

    let count = 0;
    const pool = mode === 'truth' ? TRUTH_PROMPTS : DARE_PROMPTS;

    const interval = setInterval(() => {
      const randomPick = pool[Math.floor(Math.random() * pool.length)];
      setCurrentPrompt(randomPick);
      count++;
      if (count > 7) {
        clearInterval(interval);
        setIsSpinning(false);
      }
    }, 80);
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (onSound) onSound('pop');
    const pool = newMode === 'truth' ? TRUTH_PROMPTS : DARE_PROMPTS;
    setCurrentPrompt(pool[Math.floor(Math.random() * pool.length)]);
  };

  // Upload Foto Bukti (Proof Photo)
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (onSound) onSound('chime');

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setProofImage(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      {/* Truth or dare mode selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-[#FFFAF1] p-1.5 rounded-2xl border-[2.5px] border-[#302541]">
          <button
            type="button"
            onClick={() => handleModeChange('truth')}
            className={`px-4 py-2 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-all ${
              mode === 'truth'
                ? 'bg-[#FFD978] text-[#302541] shadow-[2px_2px_0px_#302541] -translate-y-0.5'
                : 'text-[#302541] hover:bg-white'
            }`}
          >
            <span>🔮</span>
            <span>TRUTH</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('dare')}
            className={`px-4 py-2 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-all ${
              mode === 'dare'
                ? 'bg-[#FFD978] text-[#302541] shadow-[2px_2px_0px_#302541] -translate-y-0.5'
                : 'text-[#302541] hover:bg-white'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>DARE</span>
          </button>
        </div>

      </div>

      {/* Kartu Tantangan Utama (Neo-Brutalist Game Box) */}
      <div className={`p-6 sm:p-8 rounded-[32px] border-[3px] border-[#302541] shadow-[6px_6px_0px_#302541] relative overflow-hidden transition-all ${
        mode === 'truth' ? 'bg-[#A8D8B9]' : 'bg-[#FFE2D8]'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-[#302541]/15 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full border-2 border-[#302541] font-black text-xs uppercase shadow-[1px_1px_0px_#302541] bg-[#302541] text-[#FFD978]">
              {mode === 'truth' ? 'TRUTH CHALLENGE' : 'DARE CHALLENGE'} · {currentPrompt.cat}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSpin}
            disabled={isSpinning}
            className="flex items-center gap-2 bg-[#FFD978] text-[#302541] hover:bg-[#ffe08a] px-4 py-2 rounded-xl border-2 border-[#302541] shadow-[3px_3px_0px_#302541] font-black text-xs sm:text-sm cursor-pointer transition-transform active:translate-y-0.5"
          >
            <Shuffle className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
            <span>Shuffle Another Challenge</span>
          </button>
        </div>

        {/* Pertanyaan / Perintah */}
        <div className="my-4">
          <h2 className="text-xl sm:text-2xl font-black text-[#302541] font-display leading-snug">
            {currentPrompt.text}
          </h2>
        </div>

        {/* Input Jawaban Teks */}
        <div className="mt-6 space-y-3">
          <label className="block text-xs font-black uppercase text-[#302541]">
            Your answer or challenge story:
          </label>
          <textarea
            rows={4}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Write your honest answer or tell us how you completed the challenge..."
            className="w-full bg-white p-4 rounded-2xl border-[2.5px] border-[#302541] font-bold text-sm text-[#302541] focus:outline-none focus:ring-2 focus:ring-[#FFD978] leading-relaxed resize-none shadow-[2px_2px_0px_#302541]"
          />
        </div>

        {/* Upload Foto Bukti (Proof Photo) */}
        <div className="mt-4 pt-4 border-t-2 border-dashed border-[#302541]/20">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-black text-[#302541] flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-[#302541]" />
              <span>Add a Proof Photo (Optional):</span>
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={isCameraActive ? stopCamera : startCamera}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-[#302541] shadow-[2px_2px_0px_#302541] font-black text-xs cursor-pointer transition-colors ${
                  isCameraActive
                    ? 'bg-[#302541] text-white hover:bg-[#43355b]'
                    : 'bg-[#FFD978] text-[#302541] hover:bg-[#ffe08a]'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{isCameraActive ? 'Close Camera' : 'Open Camera'}</span>
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 bg-white hover:bg-[#FFFAF1] text-[#302541] px-3 py-1.5 rounded-xl border-2 border-[#302541] shadow-[2px_2px_0px_#302541] font-black text-xs cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-[#302541]" />
                <span>Choose File</span>
              </button>
            </div>
          </div>

          {/* Kamera Langsung (Live Camera Stream) */}
          {isCameraActive && (
            <div className="mt-4 p-4 rounded-2xl border-2 border-[#302541] bg-[#302541] flex flex-col items-center">
              <div className="relative w-full max-w-md overflow-hidden rounded-xl border-2 border-white bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  controls={false}
                  disablePictureInPicture
                  disableRemotePlayback
                  className="h-auto w-full"
                  style={{ transform: 'scaleX(-1)' }}
                />
              </div>
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="flex items-center gap-2 bg-[#FFD978] text-[#302541] px-5 py-2.5 rounded-xl border-2 border-[#302541] font-black text-xs sm:text-sm shadow-[2px_2px_0px_white] hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Take a Photo</span>
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="bg-white/20 text-white hover:bg-white/30 px-3.5 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {cameraError && (
            <div className="mt-2 text-xs font-bold text-[#302541]">
              ⚠️ {cameraError}
            </div>
          )}

          {/* Preview Foto Bukti Jika Ada */}
          {proofImage && (
            <div className="mt-3 relative inline-block">
              <div className="rounded-xl border-2 border-[#302541] bg-white p-1 shadow-[2px_2px_0px_#302541]">
                <img
                  src={proofImage}
                  alt="Challenge proof"
                  className="h-28 w-28 rounded-lg border border-[#302541]/30 object-cover bg-white"
                />
              </div>
              <button
                type="button"
                onClick={() => setProofImage(null)}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#302541] text-white border-2 border-[#302541] flex items-center justify-center cursor-pointer shadow-sm hover:scale-110"
                title="Remove proof photo"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
