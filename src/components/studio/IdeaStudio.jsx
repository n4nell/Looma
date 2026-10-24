import React, { useState, useEffect, useRef } from 'react';
import { Lightbulb, Plus, Trash2, Sparkles, CheckCircle2, Target, Rocket, Star } from 'lucide-react';
import { parseIdeaBody, serializeIdeaBody } from '../../utils/ideaContent';

const IDEA_TEMPLATES = [
  {
    tag: 'APP / GAME',
    title: 'Tukar Buku dan Cerita Bareng Teman',
    cards: [
      { id: 1, type: 'vision', title: 'Visi Besar', desc: 'Tempat untuk saling bertukar buku bekas dengan pembaca di sekitar, tanpa biaya.', color: '#FFD978' },
      { id: 2, type: 'problem', title: 'Masalah', desc: 'Buku hanya dibaca sekali lalu menumpuk, sementara membeli buku baru cukup mahal.', color: '#BAE6FD' },
      { id: 3, type: 'solution', title: 'Solusi', desc: 'Sistem pinjam dan tukar buku dengan poin kebaikan serta rekomendasi sesuai minat.', color: '#A8D8B9' },
      { id: 4, type: 'action', title: 'Langkah Pertama', desc: 'Buat komunitas kecil dan uji coba tukar buku dengan 20 buku.', color: '#FFE2D8' },
    ],
  },
  {
    tag: 'COMMUNITY EVENT',
    title: 'Malam Puisi dan Akustik di Taman',
    cards: [
      { id: 1, type: 'vision', title: 'Visi Besar', desc: 'Adakan panggung terbuka santai di taman kota agar siapa pun bisa membacakan puisi pendek.', color: '#FFD978' },
      { id: 2, type: 'problem', title: 'Masalah', desc: 'Banyak orang suka menulis puisi, tetapi malu membacakannya atau tidak punya tempat untuk berbagi.', color: '#FFE2D8' },
      { id: 3, type: 'solution', title: 'Solusi', desc: 'Acara tanpa juri dengan lampu hangat, camilan bawa sendiri, dan tepuk tangan untuk semua.', color: '#A8D8B9' },
      { id: 4, type: 'action', title: 'Langkah Pertama', desc: 'Buat poster seru, minta izin menggunakan taman, lalu tentukan Sabtu sore.', color: '#E0F2FE' },
    ],
  },
  {
    tag: 'COLLABORATIVE PROJECT',
    title: 'Zine Antologi Cerita Bergambar',
    cards: [
      { id: 1, type: 'vision', title: 'Visi Besar', desc: 'Cetak zine terbatas berisi karya lima penulis dan lima ilustrator Looma.', color: '#FFD978' },
      { id: 2, type: 'problem', title: 'Masalah', desc: 'Kreator baru kesulitan menerbitkan buku sendiri karena biaya cetak cukup mahal.', color: '#BAE6FD' },
      { id: 3, type: 'solution', title: 'Solusi', desc: 'Patungan biaya cetak, lipat halaman bersama, gunakan desain vintage, lalu bagikan hasilnya.', color: '#A8D8B9' },
      { id: 4, type: 'action', title: 'Langkah Pertama', desc: 'Ajak kolaborator lewat feed Looma dengan #LoomaZineProject.', color: '#FFE2D8' },
    ],
  },
];

const CARD_TYPES = [
  { id: 'vision', label: 'Vision', color: '#FFD978', emoji: '💡' },
  { id: 'problem', label: 'Problem', color: '#BAE6FD', emoji: '🎯' },
  { id: 'solution', label: 'Solution', color: '#A8D8B9', emoji: '✨' },
  { id: 'action', label: 'Action Step', color: '#A8D8B9', emoji: '🚀' },
  { id: 'target', label: 'Who Needs It', color: '#FFE2D8', emoji: '👥' },
  { id: 'note', label: 'Free Note', color: '#FFF9F2', emoji: '📌' },
];

export default function IdeaStudio({
  title,
  setTitle,
  body,
  setBody,
  onSound,
}) {
  // Guard: tandai update body yang berasal dari dalam komponen ini sendiri
  // agar useEffect([body]) tidak memicu parse ulang yang tidak perlu
  const isInternalBodyUpdate = useRef(false);

  const parseBodyToState = (rawBody) => {
    const parsed = parseIdeaBody(rawBody || '');
    return {
      parsedTag: parsed.category || 'CREATIVE PROJECT',
      parsedImpact: parsed.impact || 4,
      parsedCards: parsed.cards.length ? parsed.cards : null,
    };
  };

  const [tag, setTag] = useState(() => {
    const { parsedTag } = parseBodyToState(body);
    return parsedTag;
  });
  const [impactRating, setImpactRating] = useState(() => {
    const { parsedImpact } = parseBodyToState(body);
    return parsedImpact;
  });
  const [cards, setCards] = useState(() => {
    const { parsedCards } = parseBodyToState(body);
    return parsedCards || [
      { id: 1, type: 'vision', title: 'Big Vision', desc: '', color: '#FFD978' },
      { id: 2, type: 'problem', title: 'Problem to Solve', desc: '', color: '#BAE6FD' },
      { id: 3, type: 'solution', title: 'Unique Solution', desc: '', color: '#A8D8B9' },
      { id: 4, type: 'action', title: 'Action Plan', desc: '', color: '#FFE2D8' },
    ];
  });
  const [cardToDelete, setCardToDelete] = useState(null);

  // Re-parse state ketika body diubah dari LUAR (misalnya, saat membuka draf baru)
  useEffect(() => {
    if (isInternalBodyUpdate.current) {
      // Update berasal dari dalam komponen ini sendiri → abaikan
      isInternalBodyUpdate.current = false;
      return;
    }
    if (!body) return;
    const { parsedTag, parsedImpact, parsedCards } = parseBodyToState(body);
    setTag(parsedTag);
    setImpactRating(parsedImpact);
    if (parsedCards) setCards(parsedCards);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body]);

  // Sinkronisasi cards ke string body postingan
  useEffect(() => {
    const formatted = serializeIdeaBody({ tag, impactRating, cards });
    isInternalBodyUpdate.current = true;
    setBody(formatted);
  }, [tag, impactRating, cards, setBody]);

  const handleAddCard = () => {
    if (onSound) onSound('pop');
    const newId = Date.now();
    const typeObj = CARD_TYPES[cards.length % CARD_TYPES.length];
    setCards([
      ...cards,
      {
        id: newId,
        type: typeObj.id,
        title: '',
        desc: '',
        color: typeObj.color,
      },
    ]);
  };

  const handleUpdateCard = (id, field, value) => {
    setCards(cards.map(c => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const handleDeleteCard = (id) => {
    if (cards.length <= 1) return;
    setCardToDelete(id);
  };

  const confirmDeleteCard = () => {
    if (cardToDelete == null) return;
    if (onSound) onSound('click');
    setCards((prev) => prev.filter((card) => card.id !== cardToDelete));
    setCardToDelete(null);
  };

  const handleLoadTemplate = () => {
    if (onSound) onSound('chime');
    const tpl = IDEA_TEMPLATES[Math.floor(Math.random() * IDEA_TEMPLATES.length)];
    setTitle(tpl.title);
    setTag(tpl.tag);
    setCards(tpl.cards);
  };

  return (
    <div className="space-y-5">
      {/* Top Header: Tag Selector & Template Inspirasi */}
      <div className="space-y-1.5">
        <p className="text-sm font-bold text-[#746B7C]">
          Choose the type of idea you’re creating.
        </p>

        <div className="flex items-center gap-3 w-full">
          <div className="flex flex-nowrap items-center gap-1 flex-1 min-w-0">
            {['CREATIVE PROJECT', 'BUSINESS / STARTUP', 'COMMUNITY EVENT', 'COLLABORATIVE PROJECT', 'WILD CONCEPT'].map((t) => {
              const active = tag === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTag(t);
                    if (onSound) onSound('click');
                  }}
                  className={`px-2.5 py-1.5 rounded-lg border-2 border-[#302541] font-black text-[11px] sm:text-xs cursor-pointer transition-all whitespace-nowrap ${
                    active
                      ? 'bg-[#302541] text-[#FFD978] shadow-[2px_2px_0px_#302541]'
                      : 'bg-[#FFFAF1] text-[#302541] hover:bg-white'
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleLoadTemplate}
            className="flex items-center justify-center gap-1.5 bg-[#FFD978] text-[#302541] px-2.5 py-1.5 rounded-lg border-2 border-[#302541] shadow-[2px_2px_0px_#302541] font-black text-[11px] sm:text-xs hover:bg-[#ffe08a] cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>Example Ideas</span>
          </button>
        </div>
      </div>

      {/* Main Idea Input & Rating */}
      <div className="bg-white p-5 rounded-[28px] border-[3px] border-[#302541] shadow-[4px_4px_0px_#302541] space-y-4">
        <div>
          <label className="block text-xs font-black uppercase text-[#746B7C] mb-1 tracking-wide">
            💡 Idea Title / Project Name
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title for your brilliant idea..."
            style={{ fontSize: '15px' }}
            className="w-full bg-[#FFFAF1] px-4 py-3 rounded-2xl border-2 border-[#302541] font-black text-lg sm:text-xl text-[#302541] placeholder:font-bold focus:outline-none focus:ring-2 focus:ring-[#FFD978]"
          />
        </div>

        {/* Rating Dampak & Tambah Kartu */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#302541]/15">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-[#302541]">Potential Impact:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setImpactRating(star)}
                  className="cursor-pointer transition-transform hover:scale-125"
                >
                  <Star
                    className={`w-5 h-5 ${
                      star <= impactRating ? 'text-[#FFD978] fill-[#FFD978]' : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddCard}
            className="flex items-center gap-1.5 bg-[#FFD978] text-[#302541] px-3.5 py-1.5 rounded-xl border-2 border-[#302541] shadow-[2px_2px_0px_#302541] font-black text-xs hover:bg-[#ffe08a] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Sticky Note</span>
          </button>
        </div>
      </div>

      {/* Sticky Notes Brainstorming Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((card, idx) => (
          <div
            key={card.id}
            style={{ backgroundColor: card.color }}
            className="p-5 rounded-[24px] border-[3px] border-[#302541] shadow-[4px_4px_0px_#302541] flex flex-col justify-between space-y-3 relative group transition-transform hover:-translate-y-1"
          >
            {/* Header Sticky Note: Judul & Warna */}
            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                value={card.title}
                onChange={(e) => handleUpdateCard(card.id, 'title', e.target.value)}
                placeholder="Add your own title..."
                aria-label="Sticky note title"
                className="bg-white/80 px-2.5 py-1 rounded-lg border-2 border-[#302541] font-black text-xs text-[#302541] focus:outline-none flex-1"
              />

              <div className="flex items-center gap-1">
                <label
                  className="relative h-7 w-7 overflow-hidden rounded-lg border-2 border-[#302541] bg-white shadow-sm cursor-pointer"
                  title="Choose any card color"
                >
                  <input
                    type="color"
                    value={card.color || '#FFD978'}
                    onChange={(e) => handleUpdateCard(card.id, 'color', e.target.value)}
                    aria-label={`Choose color for ${card.title || 'sticky note'}`}
                    className="absolute -inset-2 h-11 w-11 cursor-pointer border-0 p-0"
                  />
                </label>

                {/* Hapus Note */}
                {cards.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteCard(card.id)}
                    className="w-6 h-6 rounded-lg bg-white/80 hover:bg-[#FFE2D8] hover:text-[#302541] border border-[#302541] flex items-center justify-center cursor-pointer ml-1 text-xs"
                    title="Delete Note"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Isi Detail Note */}
            <textarea
              rows={3}
              value={card.desc}
              onChange={(e) => handleUpdateCard(card.id, 'desc', e.target.value)}
              placeholder={card.type === 'vision'
                ? 'What is the main goal or vision of this idea?'
                : card.type === 'problem'
                  ? 'What problem are you looking to solve?'
                  : card.type === 'solution'
                    ? 'What unique solution can you offer?'
                    : card.type === 'action'
                      ? 'What is the very first step you will take?'
                      : 'Write your idea details here...'}
              className="w-full bg-white/90 p-3 rounded-xl border-2 border-[#302541] font-bold text-xs sm:text-sm text-[#302541] focus:outline-none resize-none leading-relaxed"
            />
          </div>
        ))}
      </div>

      {cardToDelete != null && (
        <div
          role="presentation"
          onClick={() => setCardToDelete(null)}
          className="fixed inset-0 z-[1200] flex items-center justify-center bg-[#302541]/60 p-4 backdrop-blur-sm"
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-idea-title"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-sm rounded-[28px] border-[3px] border-[#302541] bg-[#FFFAF1] p-6 text-center shadow-[6px_6px_0px_#302541]"
          >
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#302541] bg-[#FFE2D8] text-2xl">🗑️</div>
            <h3 id="delete-idea-title" className="font-display text-xl font-black text-[#302541]">Delete this sticky note?</h3>
            <p className="mt-2 text-sm font-bold text-[#746B7C]">This note will be removed from your idea board.</p>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setCardToDelete(null)} className="flex-1 rounded-xl border-2 border-[#302541] bg-white px-3 py-2.5 text-sm font-black hover:bg-[#FFE2D8]">Cancel</button>
              <button type="button" onClick={confirmDeleteCard} className="flex-1 rounded-xl border-2 border-[#302541] bg-[#302541] px-3 py-2.5 text-sm font-black text-[#FFFAF1] hover:bg-[#43355b]">Delete note</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
