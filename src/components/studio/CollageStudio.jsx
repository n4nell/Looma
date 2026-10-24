import React, { useState, useRef, useEffect } from 'react';
import { 
  Image as ImageIcon, Sparkles, Plus, Trash2, RotateCw, 
  ZoomIn, ZoomOut, Layers, Upload, Move, Type, Palette
} from 'lucide-react';

const STICKER_LIBRARY = [
  // Emojis & Karakter
  { id: 's1', type: 'emoji', content: '🐱', label: 'Cat', bg: '#FFD978' },
  { id: 's2', type: 'emoji', content: '🐰', label: 'Rabbit', bg: '#FFE2D8' },
  { id: 's3', type: 'emoji', content: '🎧', label: 'Headphone', bg: '#A8D8B9' },
  { id: 's4', type: 'emoji', content: '🎮', label: 'Gameboy', bg: '#FFD978' },
  { id: 's5', type: 'emoji', content: '☕', label: 'Hot Coffee', bg: '#FFE2D8' },
  { id: 's6', type: 'emoji', content: '🍓', label: 'Strawberry', bg: '#FF385C' },
  { id: 's7', type: 'emoji', content: '🌈', label: 'Rainbow', bg: '#E0F2FE' },
  { id: 's8', type: 'emoji', content: '✨', label: 'Star Sparkle', bg: '#FFD978' },
  { id: 's9', type: 'emoji', content: '📷', label: 'Retro Camera', bg: '#A8D8B9' },
  { id: 's10', type: 'emoji', content: '📼', label: 'Cassette Tape', bg: '#FFE2D8' },

  // Badges & Stempel
  { id: 'b1', type: 'badge', content: 'MOOD 100%', bg: '#FF385C', color: '#FFFFFF' },
  { id: 'b2', type: 'badge', content: '✨ VIBES ✨', bg: '#FFD978', color: '#302541' },
  { id: 'b3', type: 'badge', content: 'LOOMA ARTIST', bg: '#A8D8B9', color: '#302541' },
  { id: 'b4', type: 'badge', content: 'TOP SECRET 🤫', bg: '#FFD978', color: '#302541' },
  { id: 'b5', type: 'badge', content: 'MY FAVORITE', bg: '#FFE2D8', color: '#302541' },

  // Washi Tapes
  { id: 'w1', type: 'tape', content: '〰〰〰〰〰', bg: '#FFF9F2', color: '#FF385C' },
  { id: 'w2', type: 'tape', content: '✦ ✦ ✦ ✦ ✦', bg: '#FFE2D8', color: '#FF385C' },
  { id: 'w3', type: 'tape', content: '★★★★★★', bg: '#FFD978', color: '#302541' },
];

const BOARD_THEMES = [
  { id: 'cork', name: 'Cork Board', bg: '#EAD7BB', pattern: 'radial-gradient(#C4A482 1.5px, transparent 1.5px)', size: '14px 14px' },
  { id: 'grid', name: 'Grid Paper', bg: '#F8FAFC', pattern: 'linear-gradient(#E2E8F0 1.5px, transparent 1.5px), linear-gradient(90deg, #E2E8F0 1.5px, transparent 1.5px)', size: '20px 20px' },
  { id: 'pastel', name: 'Pastel Pink', bg: '#FFE2D8', pattern: 'radial-gradient(#FFD0C2 1px, transparent 1px)', size: '16px 16px' },
  { id: 'dark', name: 'Blackboard', bg: '#302541', pattern: 'radial-gradient(#3B2E4D 1px, transparent 1px)', size: '16px 16px' },
];

export default function CollageStudio({
  title,
  setTitle,
  initialData = null,
  onCollageDataChange,
  onSound,
}) {
  const [boardTheme, setBoardTheme] = useState(() => {
    if (initialData?.theme) {
      return BOARD_THEMES.find((b) => b.id === initialData.theme) || BOARD_THEMES[0];
    }
    return BOARD_THEMES[0];
  });
  const [items, setItems] = useState(() => {
    if (Array.isArray(initialData?.items) && initialData.items.length > 0) {
      return initialData.items;
    }
    return [
      { id: 1, type: 'badge', content: 'TODAY’S MOOD 📌', x: 20, y: 15, rot: -3, scale: 1.1, bg: '#FFD978', color: '#302541' },
      { id: 2, type: 'emoji', content: '🎧', label: 'Music Vibe', x: 65, y: 20, rot: 8, scale: 1.2, bg: '#A8D8B9' },
      { id: 3, type: 'memo', content: 'Remember to enjoy a cup of hot coffee today ☕✨', x: 25, y: 55, rot: 2, scale: 1, bg: '#FFF9F2' },
    ];
  });
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [customMemoText, setCustomMemoText] = useState('');
  const fileInputRef = useRef(null);
  const canvasBoardRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragTargetRef = useRef(null);
  const dragStartPosRef = useRef({ mouseX: 0, mouseY: 0, itemX: 0, itemY: 0 });
  // Simpan "sidik jari" terakhir initialData yang dimuat dari LUAR
  // agar tidak terjadi loop: items berubah → onCollageDataChange → initialData berubah → setItems lagi
  const lastLoadedExternalKey = useRef(
    initialData ? JSON.stringify({ theme: initialData.theme, count: initialData.items?.length }) : null
  );

  // Sync initialData bila dimuat dari draf (hanya jika berbeda dari yang sudah dimuat)
  useEffect(() => {
    if (!initialData || !Array.isArray(initialData.items)) return;
    const newKey = JSON.stringify({ theme: initialData.theme, count: initialData.items.length, ids: initialData.items.map(i => i.id) });
    if (newKey === lastLoadedExternalKey.current) return; // sudah dimuat, abaikan
    lastLoadedExternalKey.current = newKey;
    setItems(initialData.items);
    if (initialData.theme) {
      const found = BOARD_THEMES.find((b) => b.id === initialData.theme);
      if (found) setBoardTheme(found);
    }
  }, [initialData]);

  // Sync data kolase ke parent component
  useEffect(() => {
    if (onCollageDataChange) {
      onCollageDataChange({
        title,
        items,
        theme: boardTheme.id,
      });
    }
  }, [title, items, boardTheme, onCollageDataChange]);

  const handleAddSticker = (sticker) => {
    if (onSound) onSound('pop');
    const newItem = {
      id: Date.now(),
      type: sticker.type,
      content: sticker.content,
      label: sticker.label,
      bg: sticker.bg,
      color: sticker.color || '#302541',
      x: 35 + Math.random() * 20,
      y: 35 + Math.random() * 20,
      rot: Math.floor(Math.random() * 20) - 10,
      scale: 1,
    };
    setItems([...items, newItem]);
    setSelectedItemId(newItem.id);
  };

  const handleAddMemo = () => {
    if (!customMemoText.trim()) return;
    if (onSound) onSound('pop');
    const colors = ['#FFF9F2', '#FFD978', '#A8D8B9', '#FFE2D8', '#FF385C'];
    const newItem = {
      id: Date.now(),
      type: 'memo',
      content: customMemoText.trim(),
      bg: colors[items.length % colors.length],
      color: '#302541',
      x: 30 + Math.random() * 20,
      y: 40 + Math.random() * 20,
      rot: Math.floor(Math.random() * 16) - 8,
      scale: 1,
    };
    setItems([...items, newItem]);
    setSelectedItemId(newItem.id);
    setCustomMemoText('');
  };

  // Upload foto sendiri untuk ditempel di kolase (polaroid)
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (onSound) onSound('chime');

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (!dataUrl) return;

      const newItem = {
        id: Date.now(),
        type: 'photo',
        src: dataUrl,
        caption: 'Aesthetic Moment 📸',
        x: 40 + Math.random() * 15,
        y: 30 + Math.random() * 15,
        rot: Math.floor(Math.random() * 16) - 8,
        scale: 1,
      };
      setItems([...items, newItem]);
      setSelectedItemId(newItem.id);
    };
    reader.readAsDataURL(file);
  };

  // Drag & drop logic dengan persentase canvas
  const handlePointerDown = (e, item) => {
    // Only primary click
    if (e.button && e.button !== 0) return;
    e.stopPropagation();
    setSelectedItemId(item.id);
    if (onSound) onSound('click');

    const board = canvasBoardRef.current;
    if (!board) return;
    const rect = board.getBoundingClientRect();

    isDraggingRef.current = true;
    dragTargetRef.current = item.id;
    dragStartPosRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      initialX: item.x,
      initialY: item.y,
      rectWidth: rect.width,
      rectHeight: rect.height,
    };

    const handlePointerMove = (moveEvent) => {
      if (!isDraggingRef.current || !dragTargetRef.current) return;
      const { clientX, clientY, initialX, initialY, rectWidth, rectHeight } = dragStartPosRef.current;
      const deltaXPercent = ((moveEvent.clientX - clientX) / rectWidth) * 100;
      const deltaYPercent = ((moveEvent.clientY - clientY) / rectHeight) * 100;

      const newX = Math.max(2, Math.min(88, initialX + deltaXPercent));
      const newY = Math.max(2, Math.min(82, initialY + deltaYPercent));

      setItems((prev) =>
        prev.map((it) => (it.id === dragTargetRef.current ? { ...it, x: newX, y: newY } : it))
      );
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
      dragTargetRef.current = null;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const updateSelectedItem = (field, updater) => {
    if (!selectedItemId) return;
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== selectedItemId) return it;
        const current = it[field];
        return { ...it, [field]: updater(current) };
      })
    );
  };

  const handleRotate = () => {
    if (onSound) onSound('click');
    updateSelectedItem('rot', r => (r + 15) % 360);
  };

  const handleScale = (delta) => {
    if (onSound) onSound('click');
    updateSelectedItem('scale', s => Math.max(0.6, Math.min(2.0, s + delta)));
  };

  const handleDeleteItem = () => {
    if (!selectedItemId) return;
    if (onSound) onSound('bounce');
    setItems(items.filter(it => it.id !== selectedItemId));
    setSelectedItemId(null);
  };

  return (
    <div className="space-y-4">
      {/* Title & Board Theme Selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Collage or mood board title..."
          className="flex-1 bg-white px-4 py-2.5 rounded-2xl border-[2.5px] border-[#302541] shadow-[2px_2px_0px_#302541] font-black text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD978]"
        />

        {/* Board Background Selector */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border-[2.5px] border-[#302541] shadow-[2px_2px_0px_#302541] shrink-0 self-end sm:self-auto">
          <span className="text-[10px] font-black uppercase text-[#746B7C] ml-2 mr-1">Board Theme:</span>
          {BOARD_THEMES.map(theme => (
            <button
              key={theme.id}
              type="button"
              onClick={() => {
                setBoardTheme(theme);
                if (onSound) onSound('pop');
              }}
              style={{ backgroundColor: theme.bg }}
              className={`px-2.5 py-1 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                boardTheme.id === theme.id
                  ? 'border-[#302541] ring-2 ring-[#FF385C] shadow-[1px_1px_0px_#302541]'
                  : 'border-transparent text-[#302541]'
              }`}
            >
              {theme.name}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar Koleksi Stiker & Upload Foto */}
      <div className="bg-[#FFFAF1] p-4 rounded-3xl border-[3px] border-[#302541] shadow-[4px_4px_0px_#302541] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#302541]/15 pb-2.5">
          <span className="text-xs font-black uppercase text-[#302541] flex items-center gap-1.5">
            <span>✨</span> Sticker & Decoration Library (Click to Add to Board)
          </span>

          {/* Tombol Upload Foto Polaroid */}
          <div>
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
              className="flex items-center gap-1.5 bg-[#FF385C] text-white px-3 py-1.5 rounded-xl border-2 border-[#302541] shadow-[2px_2px_0px_#302541] font-black text-xs hover:bg-[#ff5273] cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>+ Add a Polaroid Photo</span>
            </button>
          </div>
        </div>

        {/* Sticker Library Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {STICKER_LIBRARY.map(st => (
            <button
              key={st.id}
              type="button"
              onClick={() => handleAddSticker(st)}
              style={{ backgroundColor: st.bg, color: st.color || '#302541' }}
              className="px-3 py-1.5 rounded-xl border-2 border-[#302541] shadow-[2px_2px_0px_#302541] font-black text-xs whitespace-nowrap cursor-pointer hover:scale-110 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span>{st.content}</span>
              {st.label && <span className="text-[10px] opacity-80">{st.label}</span>}
            </button>
          ))}
        </div>

        {/* Input Memo / Post-It Cepat */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={customMemoText}
            onChange={(e) => setCustomMemoText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMemo())}
            placeholder="Write a quote or a new sticky note..."
            className="flex-1 bg-white px-3.5 py-2 rounded-xl border-2 border-[#302541] font-bold text-xs focus:outline-none"
          />
          <button
            type="button"
            onClick={handleAddMemo}
            className="bg-[#302541] text-[#FFD978] px-3.5 py-2 rounded-xl border-2 border-[#302541] font-black text-xs cursor-pointer hover:bg-[#FF385C] hover:text-white transition-colors"
          >
            + Add Note
          </button>
        </div>
      </div>

      {/* Floating Control Bar untuk Elemen Terpilih */}
      {selectedItemId && (
        <div className="bg-white px-4 py-2 rounded-2xl border-[2.5px] border-[#302541] shadow-[3px_3px_0px_#302541] flex items-center justify-between gap-3 text-xs font-black animate-in fade-in duration-100">
          <span className="text-[#746B7C]">Selected Element:</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRotate}
              className="px-2.5 py-1 rounded-lg border border-[#302541] bg-[#FFFAF1] hover:bg-[#FFD978] flex items-center gap-1 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Rotate (+15°)</span>
            </button>
            <button
              type="button"
              onClick={() => handleScale(0.15)}
              className="px-2 py-1 rounded-lg border border-[#302541] bg-[#FFFAF1] hover:bg-[#FFD978] flex items-center gap-1 cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
              <span>Enlarge</span>
            </button>
            <button
              type="button"
              onClick={() => handleScale(-0.15)}
              className="px-2 py-1 rounded-lg border border-[#302541] bg-[#FFFAF1] hover:bg-[#FFD978] flex items-center gap-1 cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
              <span>Shrink</span>
            </button>
            <button
              type="button"
              onClick={handleDeleteItem}
              className="px-2.5 py-1 rounded-lg border border-[#302541] bg-[#FF385C] text-white hover:bg-[#ff5273] flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* KANVAS MOODBOARD INTERAKTIF */}
      <div
        ref={canvasBoardRef}
        style={{
          backgroundColor: boardTheme.bg,
          backgroundImage: boardTheme.pattern,
          backgroundSize: boardTheme.size,
        }}
        onClick={() => setSelectedItemId(null)}
        className="w-full min-h-[480px] rounded-[32px] border-[3px] border-[#302541] shadow-[6px_6px_0px_#302541] p-6 relative overflow-hidden select-none touch-none"
      >
        <div className="absolute top-3 right-4 text-[10px] font-black text-[#302541]/40 uppercase pointer-events-none tracking-wider">
          📌 Drag and drop stickers anywhere
        </div>

        {items.map((item) => {
          const isSelected = selectedItemId === item.id;

          return (
            <div
              key={item.id}
              onPointerDown={(e) => handlePointerDown(e, item)}
              style={{
                position: 'absolute',
                left: `${item.x}%`,
                top: `${item.y}%`,
                transform: `rotate(${item.rot}deg) scale(${item.scale})`,
                backgroundColor: item.bg || '#FFFFFF',
                color: item.color || '#302541',
                zIndex: isSelected ? 40 : 10,
              }}
              className={`p-3.5 rounded-2xl border-[2.5px] border-[#302541] shadow-[4px_4px_0px_#302541] transition-shadow cursor-grab active:cursor-grabbing max-w-[220px] ${
                isSelected ? 'ring-4 ring-[#FF385C] shadow-[6px_6px_0px_#302541]' : 'hover:shadow-[5px_5px_0px_#302541]'
              }`}
            >
              {/* Pin Merah di atas untuk efek corkboard */}
              <div className="w-3.5 h-3.5 rounded-full bg-[#FF385C] border-2 border-[#302541] mx-auto -mt-5 mb-1.5 shadow-[1px_1px_0px_#302541]" />

              {item.type === 'photo' ? (
                <div className="bg-white p-2 rounded-xl border border-[#302541]">
                  <img
                    src={item.src}
                    alt="Polaroid"
                    className="w-full h-28 object-cover rounded-lg border border-[#302541]"
                  />
                  <div className="text-[10px] font-black text-center mt-1.5 text-[#302541]">
                    {item.caption}
                  </div>
                </div>
              ) : item.type === 'memo' ? (
                <div className="text-xs font-bold font-serif leading-relaxed text-center">
                  "{item.content}"
                </div>
              ) : item.type === 'tape' ? (
                <div className="font-mono font-black text-xs text-center tracking-widest">
                  {item.content}
                </div>
              ) : item.type === 'badge' ? (
                <div className="font-black text-xs text-center uppercase tracking-wider px-2 py-0.5">
                  {item.content}
                </div>
              ) : (
                <div className="flex items-center gap-2 justify-center">
                  <span className="text-3xl">{item.content}</span>
                  {item.label && <span className="font-black text-xs">{item.label}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
