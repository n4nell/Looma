import { Eraser, Palette, Sparkles, Type } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const GENRES = [
  'SHORT POEM',
  'SHORT STORY',
  'DAILY JOURNAL',
  'QUOTES',
  'SONG LYRICS',
  'SECRET LETTER',
];

const PAPER_THEMES = [
  { id: 'cream', name: 'Warm Cream', bg: '#FFF9F2', text: '#302541', border: '#302541' },
  { id: 'yellow', name: 'Butter Yellow', bg: '#FFD978', text: '#302541', border: '#302541' },
  { id: 'green', name: 'Soft Green', bg: '#A8D8B9', text: '#302541', border: '#302541' },
  { id: 'peach', name: 'Sweet Peach', bg: '#FFE2D8', text: '#302541', border: '#302541' },
  { id: 'sky', name: 'Sky Breeze', bg: '#E0F2FE', text: '#302541', border: '#302541' },
  { id: 'dark', name: 'Dark Ink', bg: '#302541', text: '#FFF9F2', border: '#302541' },
];

const FONTS = [
  { id: 'sans', label: 'Modern Sans', family: 'Arial, Helvetica, sans-serif' },
  { id: 'serif', label: 'Literary Serif', family: 'Georgia, "Times New Roman", serif' },
  { id: 'mono', label: 'Typewriter', family: '"Courier New", monospace' },
  { id: 'rounded', label: 'Rounded', family: '"Trebuchet MS", Arial, sans-serif' },
  { id: 'humanist', label: 'Humanist', family: 'Verdana, Geneva, sans-serif' },
  { id: 'classic', label: 'Classic Book', family: '"Palatino Linotype", "Book Antiqua", serif' },
  { id: 'narrow', label: 'Clean Narrow', family: '"Arial Narrow", Arial, sans-serif' },
  { id: 'casual', label: 'Casual', family: '"Comic Sans MS", "Trebuchet MS", sans-serif' },
];

const INSPIRATIONS = [
  {
    title: 'Senja di Atas Kertas',
    genre: 'SHORT POEM',
    content: '<p><em>Setiap kata yang kita tulis hari ini,</em></p><p><em>adalah jejak kecil dari mimpi yang besar.</em></p><p>Jangan takut memulai dari kalimat sederhana,</p><p>karena dunia suka membaca ceritamu. ✨</p>',
  },
  {
    title: 'Kopi yang Tak Kunjung Dingin',
    genre: 'SHORT STORY',
    content: '<p>Di sebuah kafe yang masih basah oleh hujan sore, secangkir kopi hitam mengepul pelan.</p><blockquote>"Kenapa kamu masih menunggu sesuatu yang belum pasti?" tanya cangkir itu.</blockquote><p><strong>"Karena hal berharga kadang memang butuh waktu,"</strong> jawab si penulis sambil tersenyum ke arah jendela.</p>',
  },
  {
    title: 'Surat untuk Diriku Esok Pagi',
    genre: 'DAILY JOURNAL',
    content: '<p>Hai, kamu yang bangun pagi hari ini,</p><p>Terima kasih sudah bertahan sampai sejauh ini. Jangan lupa tersenyum, minum air, dan menyelesaikan satu karya kecil hari ini.</p><p><strong>Kamu lebih hebat dari yang kamu kira! 🌻</strong></p>',
  },
  {
    title: 'Langkah-Langkah Sunyi',
    genre: 'QUOTES',
    content: '<blockquote>Karya paling indah tidak selalu lahir dari tepuk tangan, tetapi dari momen hening saat kamu berani mengubah pikiran menjadi kata-kata.</blockquote>',
  },
];

// Safely load Quill in browser (avoids "document is not defined" on SSR/Node)
function loadQuillClient() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return reject(new Error('SSR environment: document is not available'));
    }

    if (!document.getElementById('quill-snow-css')) {
      const link = document.createElement('link');
      link.id = 'quill-snow-css';
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css';
      document.head.appendChild(link);
    }

    const win = window;
    if (win.Quill) {
      return resolve(win.Quill);
    }

    let script = document.getElementById('quill-cdn-script');
    if (!script) {
      script = document.createElement('script');
      script.id = 'quill-cdn-script';
      script.src = 'https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.js';
      script.async = true;
      document.body.appendChild(script);
    }

    const onScriptLoad = () => {
      if (win.Quill) {
        resolve(win.Quill);
      } else {
        reject(new Error('Quill failed to attach to window'));
      }
    };

    script.addEventListener('load', onScriptLoad);
    script.addEventListener('error', () => reject(new Error('Failed to load Quill script')));

    if (win.Quill) {
      resolve(win.Quill);
    }
  });
}

export default function WritingStudio({
  title,
  setTitle,
  body,
  setBody,
  genre,
  setGenre,
  paperTheme,
  setPaperTheme,
  fontStyle,
  setFontStyle,
  onSound,
}) {
  const editorHostRef = useRef(null);
  const quillInstanceRef = useRef(null);
  const savedSelectionRef = useRef(null);
  const isQuillChangingRef = useRef(false);
  const lastBodyFromQuillRef = useRef('');
  const [isQuillLoaded, setIsQuillLoaded] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState(
    PAPER_THEMES.find((p) => p.bg === paperTheme) || PAPER_THEMES[0]
  );
  const [stats, setStats] = useState({ words: 0, chars: 0, readingSec: 1 });

  // Initialize Quill Editor (browser-only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let isMounted = true;

    loadQuillClient()
      .then((QuillClass) => {
        if (!isMounted || !editorHostRef.current) return;
        if (quillInstanceRef.current) return;

        const quill = new QuillClass(editorHostRef.current, {
          theme: 'snow',
          placeholder: 'Write a poem, short story, reflection, or lyrics here...',
          modules: {
            toolbar: [
              [{ header: [1, 2, 3, false] }],
              ['bold', 'italic', 'underline', 'strike'],
              [{ color: [] }, { background: [] }],
              [{ list: 'ordered' }, { list: 'bullet' }],
              [{ align: [] }],
              ['blockquote', 'code-block'],
              ['clean'],
            ],
          },
        });

        quillInstanceRef.current = quill;
        setIsQuillLoaded(true);

        // Load initial content
        if (body) {
          if (body.includes('<')) {
            quill.root.innerHTML = body;
          } else {
            quill.setText(body);
          }
          const initialText = quill.getText().trim();
          const w = initialText ? initialText.split(/\s+/).length : 0;
          setStats({
            words: w,
            chars: initialText.length,
            readingSec: Math.max(1, Math.round(w / 3.5)),
          });
        }

        // Text change listener
        quill.on('text-change', () => {
          isQuillChangingRef.current = true;
          const text = quill.getText().trim();
          const words = text ? text.split(/\s+/).length : 0;
          const chars = text.length;
          const readingSec = Math.max(1, Math.round(words / 3.5));

          setStats({ words, chars, readingSec });

          const html = quill.root.innerHTML;
          const nextBody = (html === '<p><br></p>' || !text) ? '' : html;
          lastBodyFromQuillRef.current = nextBody;
          setBody(nextBody);
          // Reset guard after React flushes effects
          requestAnimationFrame(() => { isQuillChangingRef.current = false; });
        });
      })
      .catch((err) => {
        console.error('Failed to initialize Quill:', err);
      });

    return () => {
      isMounted = false;
      quillInstanceRef.current = null;
    };
  }, []);

  // Keyboard shortcuts for Quill formatting
  useEffect(() => {
    const quill = quillInstanceRef.current;
    if (!quill) return;

    const handleKeyDown = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      const key = e.key.toLowerCase();

      if (key === 'b') {
        e.preventDefault();
        quill.format('bold', !quill.getSelection()?.length ? undefined : 'user');
        const range = quill.getSelection();
        if (range && !range.length) quill.format('bold');
      } else if (key === 'i') {
        e.preventDefault();
        quill.format('italic');
      } else if (key === 'u') {
        e.preventDefault();
        quill.format('underline');
      }
    };

    quill.root.addEventListener('keydown', handleKeyDown);
    return () => quill.root.removeEventListener('keydown', handleKeyDown);
  }, [isQuillLoaded]);

  // Sync body into Quill only from EXTERNAL sources (draft load, reset, inspiration)
  useEffect(() => {
    if (isQuillChangingRef.current) return;
    if (body === lastBodyFromQuillRef.current) return;

    const quill = quillInstanceRef.current;
    if (!quill) return;
    const currentHtml = quill.root.innerHTML;
    const currentText = quill.getText().trim();
    const isQuillEmpty = !currentText && (currentHtml === '<p><br></p>' || currentHtml === '');
    const isTargetEmpty = !body;

    if (isTargetEmpty && !isQuillEmpty) {
      quill.setText('');
      setStats({ words: 0, chars: 0, readingSec: 1 });
    } else if (!isTargetEmpty && currentHtml !== body) {
      if (body.includes('<')) {
        quill.root.innerHTML = body;
      } else {
        quill.setText(body);
      }
      const initialText = quill.getText().trim();
      const w = initialText ? initialText.split(/\s+/).length : 0;
      setStats({
        words: w,
        chars: initialText.length,
        readingSec: Math.max(1, Math.round(w / 3.5)),
      });
    }
  }, [body]);

  const handlePickInspiration = () => {
    if (onSound) onSound('chime');
    const pick = INSPIRATIONS[Math.floor(Math.random() * INSPIRATIONS.length)];
    setTitle(pick.title);
    setGenre(pick.genre);
    if (quillInstanceRef.current) {
      quillInstanceRef.current.root.innerHTML = pick.content;
      const text = quillInstanceRef.current.getText().trim();
      const words = text ? text.split(/\s+/).length : 0;
      setStats({
        words,
        chars: text.length,
        readingSec: Math.max(1, Math.round(words / 3.5)),
      });
    }
    lastBodyFromQuillRef.current = pick.content;
    setBody(pick.content);
  };

  const handleThemeChange = (theme) => {
    if (onSound) onSound('click');
    setSelectedPaper(theme);
    setPaperTheme(theme.bg);
  };

  const currentFont = FONTS.find((f) => f.id === fontStyle) || FONTS[0];

  const handlePaperColorChange = (color) => {
    const customTheme = { id: 'custom', name: 'Custom', bg: color, text: '#302541', border: '#302541' };
    setSelectedPaper(customTheme);
    setPaperTheme(color);
  };

  const handleTextColorChange = (color) => {
    const quill = quillInstanceRef.current;
    if (!quill) return;
    const range = savedSelectionRef.current || quill.getSelection();
    if (range?.length) {
      quill.formatText(range.index, range.length, 'color', color, 'user');
    } else {
      quill.format('color', color, 'user');
    }
    quill.focus();
    savedSelectionRef.current = null;
  };

  const handleClearBackground = () => {
    const quill = quillInstanceRef.current;
    if (!quill) return;
    const range = savedSelectionRef.current || quill.getSelection();
    if (range?.length) {
      quill.formatText(range.index, range.length, 'background', false, 'user');
    } else {
      quill.format('background', false, 'user');
    }
    quill.focus();
    savedSelectionRef.current = null;
    if (onSound) onSound('pop');
  };

  return (
    <div className="space-y-4">
      {/* Custom Quill Neo-brutalist Stylesheet */}
      <style>{`
        .looma-quill-wrapper .ql-toolbar.ql-snow {
          border: 2.5px solid #302541 !important;
          border-radius: 20px !important;
          background-color: #FFF9F2 !important;
          box-shadow: 3px 3px 0px #302541 !important;
          padding: 8px 12px !important;
          display: flex !important;
          flex-wrap: wrap !important;
          gap: 4px !important;
          align-items: center !important;
        }
        .looma-quill-wrapper .ql-snow .ql-stroke {
          stroke: #302541 !important;
          stroke-width: 2 !important;
        }
        .looma-quill-wrapper .ql-snow .ql-fill {
          fill: #302541 !important;
        }
        .looma-quill-wrapper .ql-snow .ql-picker {
          color: #302541 !important;
          font-weight: 800 !important;
          font-size: 14px !important;
        }
        .looma-quill-wrapper .ql-snow .ql-picker-label {
          border: 1.5px solid #302541 !important;
          border-radius: 8px !important;
          padding-left: 8px !important;
          padding-right: 4px !important;
          background: #FFFFFF !important;
        }
        .looma-quill-wrapper .ql-snow .ql-picker-options {
          border: 2px solid #302541 !important;
          border-radius: 12px !important;
          background-color: #FFF9F2 !important;
          box-shadow: 3px 3px 0px #302541 !important;
          padding: 6px !important;
        }
        .looma-quill-wrapper .ql-snow button {
          border-radius: 8px !important;
          transition: all 0.15s ease !important;
        }
        .looma-quill-wrapper .ql-snow button:hover {
          background-color: #FFD978 !important;
        }
        .looma-quill-wrapper .ql-snow button.ql-active {
          background-color: #A8D8B9 !important;
        }
        .looma-quill-wrapper .ql-snow button.ql-active .ql-stroke {
          stroke: #302541 !important;
        }
        .looma-quill-wrapper .ql-snow button.ql-active .ql-fill {
          fill: #302541 !important;
        }

        /* ---- Toolbar button tooltips ---- */
        .looma-quill-wrapper .ql-snow .ql-formats > button {
          position: relative !important;
        }
        .looma-quill-wrapper .ql-snow .ql-formats > button::after {
          position: absolute !important;
          bottom: calc(100% + 6px) !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          background: #302541 !important;
          color: #FFFAF1 !important;
          font-size: 10px !important;
          font-weight: 800 !important;
          white-space: nowrap !important;
          padding: 3px 8px !important;
          border-radius: 6px !important;
          pointer-events: none !important;
          opacity: 0 !important;
          transition: opacity 0.15s ease !important;
          z-index: 50 !important;
        }
        .looma-quill-wrapper .ql-snow .ql-formats > button:hover::after {
          opacity: 1 !important;
        }
        .looma-quill-wrapper .ql-bold::after { content: 'Bold (Ctrl+B)' !important; }
        .looma-quill-wrapper .ql-italic::after { content: 'Italic (Ctrl+I)' !important; }
        .looma-quill-wrapper .ql-underline::after { content: 'Underline (Ctrl+U)' !important; }
        .looma-quill-wrapper .ql-strike::after { content: 'Strikethrough' !important; }
        .looma-quill-wrapper .ql-blockquote::after { content: 'Blockquote' !important; }
        .looma-quill-wrapper .ql-code-block::after { content: 'Code Block' !important; }
        .looma-quill-wrapper .ql-clean::after { content: 'Remove Formatting' !important; }

        /* Header picker tooltip */
        .looma-quill-wrapper .ql-snow .ql-header .ql-picker-label::after {
          content: 'Heading Style' !important;
          position: absolute !important;
          bottom: calc(100% + 6px) !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          background: #302541 !important;
          color: #FFFAF1 !important;
          font-size: 10px !important;
          font-weight: 800 !important;
          white-space: nowrap !important;
          padding: 3px 8px !important;
          border-radius: 6px !important;
          pointer-events: none !important;
          opacity: 0 !important;
          transition: opacity 0.15s ease !important;
          z-index: 50 !important;
        }
        .looma-quill-wrapper .ql-snow .ql-header .ql-picker-label:hover::after {
          opacity: 1 !important;
        }
        /* Color & Background pickers */
        .looma-quill-wrapper .ql-snow .ql-color .ql-picker-label::after,
        .looma-quill-wrapper .ql-snow .ql-background .ql-picker-label::after {
          position: absolute !important;
          bottom: calc(100% + 6px) !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          background: #302541 !important;
          color: #FFFAF1 !important;
          font-size: 10px !important;
          font-weight: 800 !important;
          white-space: nowrap !important;
          padding: 3px 8px !important;
          border-radius: 6px !important;
          pointer-events: none !important;
          opacity: 0 !important;
          transition: opacity 0.15s ease !important;
          z-index: 50 !important;
        }
        .looma-quill-wrapper .ql-snow .ql-color .ql-picker-label:hover::after { opacity: 1 !important; content: 'Text Color' !important; }
        .looma-quill-wrapper .ql-snow .ql-background .ql-picker-label:hover::after { opacity: 1 !important; content: 'Highlight Color' !important; }
        /* List & Align pickers */
        .looma-quill-wrapper .ql-snow .ql-list .ql-picker-label::after,
        .looma-quill-wrapper .ql-snow .ql-align .ql-picker-label::after {
          position: absolute !important;
          bottom: calc(100% + 6px) !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          background: #302541 !important;
          color: #FFFAF1 !important;
          font-size: 10px !important;
          font-weight: 800 !important;
          white-space: nowrap !important;
          padding: 3px 8px !important;
          border-radius: 6px !important;
          pointer-events: none !important;
          opacity: 0 !important;
          transition: opacity 0.15s ease !important;
          z-index: 50 !important;
        }
        .looma-quill-wrapper .ql-snow .ql-list .ql-picker-label:hover::after { opacity: 1 !important; content: 'List' !important; }
        .looma-quill-wrapper .ql-snow .ql-align .ql-picker-label:hover::after { opacity: 1 !important; content: 'Alignment' !important; }

        .looma-quill-wrapper .ql-container.ql-snow {
          border: none !important;
          font-size: 18px !important;
        }
        .looma-quill-wrapper .ql-editor {
          min-height: 240px !important;
          padding: 8px 0 !important;
          line-height: 1.7 !important;
          font-style: normal !important;
          overflow-wrap: anywhere !important;
          word-break: normal !important;
          outline: none !important;
        }
        .looma-quill-wrapper .ql-editor.ql-blank::before {
          color: inherit !important;
          opacity: 0.35 !important;
          font-style: normal !important;
          left: 0 !important;
          right: 0 !important;
        }
        .looma-quill-wrapper .ql-editor blockquote {
          border-left: 4px solid #FFD978 !important;
          padding-left: 14px !important;
          margin-left: 0 !important;
          font-style: italic !important;
        }
        .looma-quill-wrapper .ql-editor pre.ql-syntax {
          background-color: #302541 !important;
          color: #FFFAF1 !important;
          border-radius: 12px !important;
          padding: 12px !important;
        }
      `}</style>

      {/* Genre Pills & Action Bar */}
      <div className="space-y-1.5">
        <p className="text-sm font-bold text-[#746B7C]">
          Choose the type of writing you&rsquo;re creating.
        </p>

        <div className="flex items-center gap-2 w-full">
          <div className="flex flex-nowrap items-center gap-1.5 flex-1 min-w-0">
            {GENRES.map((g) => {
              const active = genre === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => {
                    if (onSound) onSound('click');
                    setGenre(g);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg border-2 border-[#302541] font-black text-[11px] sm:text-xs cursor-pointer transition-all whitespace-nowrap ${
                    active
                      ? 'bg-[#FFD978] text-[#302541] shadow-[2px_2px_0px_#302541] -translate-y-0.5'
                      : 'bg-[#FFF9F2] text-[#302541] hover:bg-white'
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handlePickInspiration}
            title="Load a random writing example to get started"
            className="flex items-center justify-center gap-1.5 bg-[#FFD978] text-[#302541] px-2.5 py-1.5 rounded-lg border-2 border-[#302541] shadow-[2px_2px_0px_#302541] font-black text-[11px] sm:text-xs hover:bg-[#ffe08a] active:translate-y-0.5 cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>Example Writing</span>
          </button>
        </div>
      </div>

      {/* Font Family & Theme Picker Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#FFFAF1] p-2.5 rounded-2xl border-[2px] border-[#302541] shadow-[2px_2px_0px_#302541]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-black uppercase text-[#746B7C]">Font:</span>
          <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-[#302541]" title="Choose a font family for your text">
            <Type className="w-3.5 h-3.5 text-[#746B7C]" />
            <select
              value={fontStyle}
              onChange={(e) => setFontStyle(e.target.value)}
              className="max-w-[150px] bg-transparent text-sm font-black text-[#302541] focus:outline-none cursor-pointer"
            >
              {FONTS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-black uppercase text-[#746B7C]">Paper:</span>
          <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-[#302541]">
            {PAPER_THEMES.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => handleThemeChange(theme)}
                title={`Paper: ${theme.name}`}
                style={{ backgroundColor: theme.bg }}
                className={`w-5 h-5 rounded-full border-2 border-[#302541] cursor-pointer transition-transform ${
                  selectedPaper.id === theme.id ? 'scale-125 ring-2 ring-[#FFD978]' : 'hover:scale-110'
                }`}
              />
            ))}
            <label
              title="Choose any paper color"
              className="relative flex h-6 w-6 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-[#302541] bg-white text-[#302541] hover:scale-110"
            >
              <Palette className="pointer-events-none h-3.5 w-3.5" />
              <input
                type="color"
                aria-label="Choose custom paper color"
                value={selectedPaper.bg}
                onChange={(e) => handlePaperColorChange(e.target.value)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </label>
          </div>
        </div>

        {/* Clear Highlight button — removes background/highlight color from selection */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleClearBackground}
            title="Clear Highlight — remove text background color"
            className="flex items-center gap-1.5 rounded-xl border border-[#302541] bg-white px-2 py-1 text-sm font-black text-[#302541] hover:bg-[#FFD978] transition-colors cursor-pointer"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear Highlight</span>
          </button>
        </div>
      </div>

      {/* Quill WYSIWYG Wrapper */}
      <div className="looma-quill-wrapper space-y-3">
        {/* Editor Canvas Card */}
        <div
          style={{
            backgroundColor: selectedPaper.bg,
            color: selectedPaper.text,
            borderColor: selectedPaper.border,
          }}
          className="p-6 rounded-[28px] border-[3px] shadow-[4px_4px_0px_#302541] space-y-4 transition-colors duration-200"
        >
          {/* Card Header Tag */}
          <div className="flex items-center justify-between border-b-2 border-dashed border-[#302541]/20 pb-3">
            <span className="text-[11px] font-black uppercase px-3 py-1 rounded-lg bg-white/80 border-2 border-[#302541] text-[#302541] shadow-[1px_1px_0px_#302541]">
              {genre}
            </span>
            <div className="flex items-center gap-3 text-xs font-black opacity-75">
              <span>{stats.words} words</span>
              <span>·</span>
              <span>{stats.chars} chars</span>
            </div>
          </div>

          {/* Title Input */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter your title..."
            style={{ color: selectedPaper.text }}
            className="w-full bg-transparent text-2xl sm:text-2xl font-black placeholder:opacity-40 focus:outline-none font-display border-b border-[#302541]/15 pb-2"
          />

          {/* Loading status indicator */}
          {!isQuillLoaded && (
            <div className="py-8 text-center text-xs font-black text-[#746B7C] animate-pulse flex items-center justify-center gap-2">
              <span>✍️ Loading the Looma editor...</span>
            </div>
          )}

          {/* Quill Host Element */}
          <div
            ref={editorHostRef}
            style={{ color: selectedPaper.text, fontFamily: currentFont.family }}
          />
        </div>
      </div>
    </div>
  );
}
