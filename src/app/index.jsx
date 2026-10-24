import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import confetti from 'canvas-confetti';
import { 
  Volume2, 
  VolumeX, 
  Eraser, 
  RefreshCw, 
  ArrowRight, 
  Heart, 
  MessageCircle, 
  Bookmark, 
  Shuffle, 
  Trophy, 
  Flame, 
  Star, 
  Plus,
  Compass,
  Newspaper,
  Smile
} from 'lucide-react';

const playAudioSound = (type = 'click') => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(840, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'pop') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const startFreq = 260 + Math.random() * 200;
      osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(startFreq * 2.2, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    } else if (type === 'chime') {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);
        gain.gain.setValueAtTime(0.09, ctx.currentTime + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.06 + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.06);
        osc.stop(ctx.currentTime + idx * 0.06 + 0.29);
      });
    }
  } catch {
    // Ignore audio restrictions
  }
};

const CuteMascot = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="20" cy="18" r="10" fill="#FFE2D8" stroke="#302541" strokeWidth="4" />
    <circle cx="60" cy="18" r="10" fill="#A8D8B9" stroke="#302541" strokeWidth="4" />
    <rect x="10" y="16" width="60" height="54" rx="26" fill="#FFD978" stroke="#302541" strokeWidth="4" />
    <circle cx="29" cy="39" r="5.5" fill="#302541" />
    <circle cx="51" cy="39" r="5.5" fill="#302541" />
    <circle cx="27" cy="37" r="2" fill="#FFFFFF" />
    <circle cx="49" cy="37" r="2" fill="#FFFFFF" />
    <ellipse cx="20" cy="45" rx="5" ry="3" fill="#BAE6FD" />
    <ellipse cx="60" cy="45" rx="5" ry="3" fill="#BAE6FD" />
    <path d="M33 47C35 51 45 51 47 47" stroke="#302541" strokeWidth="4" strokeLinecap="round" />
    <path d="M40 16V7M40 7L35 11M40 7L45 11" stroke="#302541" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SAMPLE_PROMPTS = [
  { text: 'Draw a funny little cat wearing oversized rain boots! 🐱🥾', cat: 'DOODLE', xp: 20 },
  { text: 'Write a 4-line poem about the smell of rain on warm pavement. 🌧️☕', cat: 'POETRY', xp: 25 },
  { text: 'Design the most ridiculous yet oddly useful mobile app concept! 💡🚀', cat: 'IDEAS', xp: 20 },
  { text: 'Truth: What was the funniest thing you wholeheartedly believed as a child? 🔮🤫', cat: 'TRUTH', xp: 15 },
  { text: 'Dare: Snap a photo of the brightest colored object near your desk right now! 📸✨', cat: 'DARE', xp: 20 },
];

export default function LandingPage() {
  const router = useRouter();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState('drawing');
  const [promptIdx, setPromptIdx] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [activeNav, setActiveNav] = useState('');

  // Sync active nav item dynamically with current viewport scroll position
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      const studiosEl = document.getElementById('studios');
      const playgroundEl = document.getElementById('playground');
      const communityEl = document.getElementById('community');

      // If user is at top hero section (before studios reached middle of screen)
      if (studiosEl) {
        const studiosRect = studiosEl.getBoundingClientRect();
        if (studiosRect.top > window.innerHeight * 0.55) {
          setActiveNav('');
          return;
        }
      }

      // Check which section is closest to the middle of the viewport
      const viewportCenter = window.innerHeight * 0.45;
      const sectionElements = [
        { id: 'studios', el: studiosEl },
        { id: 'playground', el: playgroundEl },
        { id: 'community', el: communityEl },
      ];

      let bestId = '';
      let minDistance = Infinity;

      for (const { id, el } of sectionElements) {
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        // Section is considered on-screen if any part of it overlaps the viewport
        if (rect.top <= window.innerHeight && rect.bottom >= 80) {
          const sectionCenter = (rect.top + rect.bottom) / 2;
          const distance = Math.abs(sectionCenter - viewportCenter);
          if (distance < minDistance) {
            minDistance = distance;
            bestId = id;
          }
        }
      }

      if (bestId) {
        setActiveNav(bestId);
      }
    };

    // Capture phase ensures we catch non-bubbling scroll events from any nested scroll containers
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    document.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    if (document.body) {
      document.body.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    }

    // Run on mount
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener('scroll', handleScroll, true);
      if (document.body) {
        document.body.removeEventListener('scroll', handleScroll, true);
      }
    };
  }, []);

  const handleNavClick = (sectionId) => {
    setActiveNav(sectionId);
    triggerSound('click');
    const el = document.getElementById(sectionId);
    if (!el) return;

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Canvas State for Drawing Preview
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#302541');
  const [brushSize] = useState(6);
  const [isEraser, setIsEraser] = useState(false);

  // Interactive Sticky Notes for Ideas Preview
  const [stickyNotes, setStickyNotes] = useState([
    { id: 1, title: 'Big Vision', desc: 'Build a cozy space where everyone creates without overthinking! ✨', color: '#FFD978' },
    { id: 2, title: 'Key Solution', desc: 'Provide 4 specialized studios and joyful daily prompts! 🎯', color: '#FFE2D8' },
    { id: 3, title: 'Action Step', desc: 'Invite friends to share their doodles and drop friendly likes! 💖', color: '#A8D8B9' },
  ]);

  const triggerSound = (type = 'click') => {
    if (soundEnabled) {
      playAudioSound(type);
    }
  };

  const handleGlobalConfetti = (e) => {
    triggerSound('chime');
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 50,
      spread: 70,
      origin: { x, y },
      colors: ['#FFD978', '#A8D8B9', '#BAE6FD', '#FFE2D8', '#302541']
    });
  };

  const nextPrompt = () => {
    triggerSound('pop');
    setIsSpinning(true);
    setTimeout(() => {
      setPromptIdx((prev) => (prev + 1) % SAMPLE_PROMPTS.length);
      setIsSpinning(false);
    }, 150);
  };

  const addStickyNote = () => {
    triggerSound('pop');
    const notePalette = ['#FFD978', '#FFE2D8', '#A8D8B9'];
    const sampleCards = [
      { title: 'Novel Concept', desc: 'A story about a friendly robot learning to paint the sunrise.' },
      { title: 'Writing Habit', desc: 'Free-write for 10 minutes every morning without backspacing.' },
      { title: 'Dream Studio', desc: 'A room filled with books, hanging ivy plants, and ambient light.' },
      { title: 'Comic Character', desc: 'A detective cat who frequently misplaces his investigation notes.' },
    ];
    const picked = sampleCards[Math.floor(Math.random() * sampleCards.length)];
    const newNote = {
      id: Date.now(),
      title: picked.title,
      desc: picked.desc,
      color: notePalette[Math.floor(Math.random() * notePalette.length)],
    };
    setStickyNotes((prev) => [...prev, newNote]);
    confetti({ particleCount: 20, spread: 45 });
  };

  // Canvas Setup
  useEffect(() => {
    if (activeTab !== 'drawing') return;
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [activeTab]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    triggerSound('click');
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    ctx.strokeStyle = isEraser ? '#FFFFFF' : brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    triggerSound('pop');
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="landing-page min-h-screen bg-[#FFFAF1] text-[#302541] selection:bg-[#FFD978] selection:text-[#302541] font-sans overflow-x-hidden relative">
      
      {/* Background Dot Pattern */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-20 z-0"
        style={{
          backgroundImage: 'radial-gradient(#302541 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* ================= STICKY HEADER ================= */}
      <header className="sticky top-0 z-50 bg-[#FFFAF1]/90 backdrop-blur-md border-b-[3px] border-[#302541] px-4 md:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo & Brand */}
          <div 
            onClick={handleGlobalConfetti}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <img 
              src={require('../../assets/images/looma.png')} 
              className="w-12 h-12 sm:w-14 sm:h-14 object-contain transform group-hover:rotate-12 transition-transform duration-200" 
              alt="Looma Logo" 
            />
            <div className="flex items-center gap-2.5">
              <span className="text-2xl sm:text-3xl font-black tracking-wider text-[#302541] font-display">
                LOOMA
              </span>
              <span className="bg-[#FFD978] text-[#302541] text-[10px] font-black px-2.5 py-0.5 rounded-full border-2 border-[#302541] shadow-[2px_2px_0px_#302541] hidden sm:inline-block">
                CREATIVE SPACE
              </span>
            </div>
          </div>

          {/* Navigation Shortcuts */}
          <nav className="hidden md:flex items-center gap-1 bg-white p-1 rounded-2xl border-2 border-[#302541] shadow-[3px_3px_0px_#302541]">
            <a 
              href="#studios" 
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('studios');
              }}
              className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                activeNav === 'studios'
                  ? 'bg-[#FFE2D8] text-[#302541] border-2 border-[#302541] shadow-[2px_2px_0px_#302541] -translate-y-0.5'
                  : 'text-[#746B7C] hover:text-[#302541] hover:bg-[#FFE2D8]/50 border-2 border-transparent'
              }`}
            >
              Studios
            </a>
            <a 
              href="#playground" 
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('playground');
              }}
              className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                activeNav === 'playground'
                  ? 'bg-[#BAE6FD] text-[#302541] border-2 border-[#302541] shadow-[2px_2px_0px_#302541] -translate-y-0.5'
                  : 'text-[#746B7C] hover:text-[#302541] hover:bg-[#BAE6FD]/50 border-2 border-transparent'
              }`}
            >
              Live Demo
            </a>
            <a 
              href="#community" 
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('community');
              }}
              className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                activeNav === 'community'
                  ? 'bg-[#A8D8B9] text-[#302541] border-2 border-[#302541] shadow-[2px_2px_0px_#302541] -translate-y-0.5'
                  : 'text-[#746B7C] hover:text-[#302541] hover:bg-[#A8D8B9]/50 border-2 border-transparent'
              }`}
            >
              Community
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                triggerSound('click');
              }}
              className="w-10 h-10 bg-white rounded-xl border-2 border-[#302541] shadow-[2px_2px_0px_#302541] active:translate-y-0.5 flex items-center justify-center font-bold text-sm cursor-pointer hover:bg-[#BAE6FD] transition-colors"
              title={soundEnabled ? "Mute audio" : "Enable audio"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-[#302541]" /> : <VolumeX className="w-4 h-4 text-[#746B7C]" />}
            </button>

            <button
              onClick={() => {
                triggerSound('click');
                router.push('/login');
              }}
              className="bg-white text-[#302541] hover:bg-[#FFE2D8] px-4 py-2 rounded-xl border-2 border-[#302541] shadow-[2px_2px_0px_#302541] active:translate-y-0.5 font-black text-xs sm:text-sm transition-colors cursor-pointer"
            >
              Log in
            </button>

            <button
              onClick={() => {
                triggerSound('chime');
                router.push('/register');
              }}
              className="bg-[#FFD978] hover:bg-[#ffe08a] text-[#302541] px-4 sm:px-5 py-2 rounded-xl border-2 border-[#302541] shadow-[2px_2px_0px_#302541] active:translate-y-0.5 font-black text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Sign Up</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* ================= HERO SECTION ================= */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 z-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          <div className="lg:col-span-7 flex flex-col items-start gap-6">
            
            <div className="inline-flex items-center gap-2 bg-[#A8D8B9] border-2 border-[#302541] shadow-[3px_3px_0px_#302541] px-3.5 py-1.5 rounded-full transform -rotate-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#302541] animate-ping" />
              <span className="text-xs font-black uppercase text-[#302541] tracking-wider">
                UNLEASH YOUR CREATIVE SPARK ✨
              </span>
            </div>

            <h1 className="text-3xl sm:text-6xl md:text-6xl font-black text-[#302541] font-display leading-[1.08] tracking-tight flex flex-col items-start">
              <span>Your Free Space to</span>
              <span className="inline-block bg-[#FFD978] px-3.5 pt-1 pb-2 mt-2 rounded-2xl border-[3px] border-[#302541] shadow-[4px_4px_0px_#302541] transform rotate-1 leading-none">
                Write & Draw,
              </span>
              <span className="inline-block bg-[#BAE6FD] px-3.5 pt-1 pb-2 mt-2 rounded-2xl border-[3px] border-[#302541] shadow-[4px_4px_0px_#302541] transform -rotate-1 leading-none">
                & Share Big Ideas!
              </span>
            </h1>

            <p className="text-base sm:text-lg font-bold text-[#746B7C] max-w-xl leading-relaxed">
              Write a little, doodle a lot, and let your imagination run wild. Just play, create, and have fun!
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <button
                onClick={() => {
                  triggerSound('chime');
                  router.push('/register');
                }}
                className="bg-[#FFD978] hover:bg-[#ffe08a] text-[#302541] text-base sm:text-lg font-black px-7 py-3.5 rounded-2xl border-[3px] border-[#302541] shadow-[4px_4px_0px_#302541] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#302541] active:translate-y-0.5 active:shadow-[1px_1px_0px_#302541] transition-all flex items-center gap-2.5 cursor-pointer"
              >
                <span>START CREATING 🚀</span>
              </button>

              <a
                href="#studios"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick('studios');
                }}
                className="bg-white hover:bg-[#FFE2D8] text-[#302541] text-base sm:text-lg font-black px-6 py-3.5 rounded-2xl border-[3px] border-[#302541] shadow-[4px_4px_0px_#302541] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#302541] active:translate-y-0.5 active:shadow-[1px_1px_0px_#302541] transition-all flex items-center gap-2"
              >
                <Compass className="w-5 h-5 text-[#302541]" />
                <span>Explore Studios</span>
              </a>
            </div>

          </div>

          {/* Hero Showcase Widget */}
          <div className="lg:col-span-5 relative">
            <div className="bg-[#FFE2D8] rounded-[32px] p-6 border-[3px] border-[#302541] shadow-[6px_6px_0px_#302541] relative">
              
              <div className="absolute -top-3 -left-4 bg-[#A8D8B9] text-[#302541] font-black px-3.5 py-1.5 rounded-xl border-2 border-[#302541] shadow-[2px_2px_0px_#302541] transform -rotate-6 text-xs">
                Creative Studios ✨
              </div>
              <div className="absolute -bottom-4 -right-4 bg-[#BAE6FD] text-[#302541] font-black px-3.5 py-1.5 rounded-xl border-2 border-[#302541] shadow-[2px_2px_0px_#302541] transform rotate-6 text-xs">
                Looma Community 🎈
              </div>

              {/* Inside Live Preview Card */}
              <div className="bg-white rounded-[24px] p-6 border-2 border-[#302541] shadow-[3px_3px_0px_#302541] flex flex-col gap-4">
                
                <div className="flex items-center justify-between pb-3 border-b-2 border-[#302541]/10">
                  <div className="flex items-center gap-2.5">
                    <CuteMascot className="w-10 h-10" />
                    <div>
                      <h3 className="font-black text-sm text-[#302541]">Looma Daily</h3>
                      <p className="text-[10px] font-bold text-[#746B7C]">Today’s Active Challenge</p>
                    </div>
                  </div>
                  <span className="bg-[#FFD978] text-[#302541] px-2.5 py-0.5 rounded-full border-2 border-[#302541] font-black text-[10px]">
                    +{SAMPLE_PROMPTS[promptIdx].xp} XP
                  </span>
                </div>

                <div className="bg-[#FFFAF1] p-4 rounded-2xl border-2 border-[#302541] shadow-[2px_2px_0px_#302541]">
                  <span className="inline-block bg-[#A8D8B9] text-[#302541] text-[10px] font-black px-2 py-0.5 rounded-md border border-[#302541] uppercase mb-2">
                    {SAMPLE_PROMPTS[promptIdx].cat}
                  </span>
                  <p className="font-display font-black text-base sm:text-lg text-[#302541] leading-snug">
                    {SAMPLE_PROMPTS[promptIdx].text}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5 text-xs font-black text-[#746B7C]">
                    <Flame className="w-4 h-4 text-[#302541]" />
                    <span>Streak Active</span>
                  </div>
                  <button
                    onClick={nextPrompt}
                    className="flex items-center gap-1.5 bg-[#BAE6FD] hover:bg-[#8fd3fb] text-[#302541] px-3.5 py-2 rounded-xl border-2 border-[#302541] shadow-[2px_2px_0px_#302541] font-black text-xs cursor-pointer active:translate-y-0.5 transition-all"
                  >
                    <Shuffle className={`w-3.5 h-3.5 ${isSpinning ? 'animate-spin' : ''}`} />
                    <span>Next Prompt</span>
                  </button>
                </div>

              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ================= 4 STUDIOS SECTION ================= */}
      <section id="studios" className="scroll-mt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 z-10 relative">
        
        <div className="text-center max-w-2xl mx-auto mb-6">
          <span className="bg-[#FFD978] text-[#302541] font-black px-4 py-1 rounded-full border-2 border-[#302541] shadow-[2px_2px_0px_#302541] text-xs uppercase tracking-wider inline-block mb-3">
            CREATION PLATFORM 🎨
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-[#302541] font-display">
            Creative Spaces to Explore
          </h2>
          <p className="text-sm sm:text-base font-bold text-[#746B7C] mt-2">
            Choose your favorite way to create and explore tools that let your creativity flow freely.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Studio 1: Writing */}
          <div className="bg-[#FFE2D8] rounded-[28px] border-[3px] border-[#302541] shadow-[4px_4px_0px_#302541] p-6 flex flex-col justify-between hover:-translate-y-1.5 transition-transform duration-200">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-white rounded-2xl border-2 border-[#302541] shadow-[2px_2px_0px_#302541] flex items-center justify-center text-3xl">
                  ✍️
                </div>
                <span className="px-2.5 py-1 rounded-full bg-white text-[#302541] font-black text-xs border border-[#302541]">
                  01
                </span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/80 text-[#302541] px-2.5 py-0.5 rounded-full border border-[#302541]">
                POETRY & STORY
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#302541] font-display mt-2.5">
                Writing Studio
              </h3>
              <p className="text-xs sm:text-sm font-bold text-[#302541]/80 mt-2 leading-relaxed">
                Write poetry, heartfelt stories, and daily journals on cozy paper themes with beautiful typography.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t-2 border-[#302541]/10 flex items-center justify-between font-black text-xs text-[#302541]">
              <span>Curated Themes & Literary Fonts</span>
            </div>
          </div>

          {/* Studio 2: Drawing */}
          <div className="bg-[#FFD978] rounded-[28px] border-[3px] border-[#302541] shadow-[4px_4px_0px_#302541] p-6 flex flex-col justify-between hover:-translate-y-1.5 transition-transform duration-200">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-white rounded-2xl border-2 border-[#302541] shadow-[2px_2px_0px_#302541] flex items-center justify-center text-3xl">
                  🎨
                </div>
                <span className="px-2.5 py-1 rounded-full bg-white text-[#302541] font-black text-xs border border-[#302541]">
                  02
                </span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/80 text-[#302541] px-2.5 py-0.5 rounded-full border border-[#302541]">
                DOODLE ART
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#302541] font-display mt-2.5">
                Drawing Studio
              </h3>
              <p className="text-xs sm:text-sm font-bold text-[#302541]/80 mt-2 leading-relaxed">
                Sketch doodles, paint watercolor dreams, and let your creativity flow with smooth, versatile brushes.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t-2 border-[#302541]/10 flex items-center justify-between font-black text-xs text-[#302541]">
              <span>Custom Brushes & Color Palettes</span>
            </div>
          </div>

          {/* Studio 3: Ideas */}
          <div className="bg-[#BAE6FD] rounded-[28px] border-[3px] border-[#302541] shadow-[4px_4px_0px_#302541] p-6 flex flex-col justify-between hover:-translate-y-1.5 transition-transform duration-200">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-white rounded-2xl border-2 border-[#302541] shadow-[2px_2px_0px_#302541] flex items-center justify-center text-3xl">
                  💡
                </div>
                <span className="px-2.5 py-1 rounded-full bg-white text-[#302541] font-black text-xs border border-[#302541]">
                  03
                </span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/80 text-[#302541] px-2.5 py-0.5 rounded-full border border-[#302541]">
                WILD SPARK
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#302541] font-display mt-2.5">
                Idea Studio
              </h3>
              <p className="text-xs sm:text-sm font-bold text-[#302541]/80 mt-2 leading-relaxed">
                Map out thoughts, brainstorm project concepts, and organize visual sticky cards with actionable steps.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t-2 border-[#302541]/10 flex items-center justify-between font-black text-xs text-[#302541]">
              <span>Interactive Sticky Board</span>
            </div>
          </div>

          {/* Studio 4: Challenges */}
          <div className="bg-[#A8D8B9] rounded-[28px] border-[3px] border-[#302541] shadow-[4px_4px_0px_#302541] p-6 flex flex-col justify-between hover:-translate-y-1.5 transition-transform duration-200">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-white rounded-2xl border-2 border-[#302541] shadow-[2px_2px_0px_#302541] flex items-center justify-center text-3xl">
                  🎮
                </div>
                <span className="px-2.5 py-1 rounded-full bg-white text-[#302541] font-black text-xs border border-[#302541]">
                  04
                </span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/80 text-[#302541] px-2.5 py-0.5 rounded-full border border-[#302541]">
                PLAY CHALLENGE
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#302541] font-display mt-2.5">
                Challenge Studio
              </h3>
              <p className="text-xs sm:text-sm font-bold text-[#302541]/80 mt-2 leading-relaxed">
                Tackle creative daily prompts, spin for Truth or Dare, and snap photo proof to level up your streak.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t-2 border-[#302541]/10 flex items-center justify-between font-black text-xs text-[#302541]">
              <span>Daily Prompts & Photo Proof</span>
            </div>
          </div>

        </div>
      </section>

      {/* ================= INTERACTIVE PLAYGROUND DEMO ================= */}
      <section id="playground" className="scroll-mt-72 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 z-10 relative">
        
        <div className="text-center max-w-2xl mx-auto mb-5">
          <span className="bg-[#A8D8B9] text-[#302541] font-black px-4 py-1 rounded-full border-2 border-[#302541] shadow-[2px_2px_0px_#302541] text-xs uppercase tracking-wider inline-block mb-3">
            TRY IT RIGHT HERE 🕹️
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-[#302541] font-display">
            Interactive Studio Playground
          </h2>
          <p className="text-sm sm:text-base font-bold text-[#746B7C] mt-2">
            Test drive our creative canvas, sticky board, or prompt machine below before signing up!
          </p>
        </div>

        {/* Tab Switcher - 3 distinct colors */}
        <div className="flex flex-wrap justify-center gap-2.5 mb-5">
          <button
            onClick={() => {
              setActiveTab('drawing');
              triggerSound('click');
            }}
            className={`px-5 py-2.5 rounded-2xl border-2 border-[#302541] font-black text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === 'drawing'
                ? 'bg-[#FFD978] text-[#302541] shadow-[3px_3px_0px_#302541] -translate-y-0.5'
                : 'bg-white text-[#746B7C] hover:bg-[#FFE2D8]'
            }`}
          >
            🎨 Digital Canvas
          </button>
          
          <button
            onClick={() => {
              setActiveTab('ideas');
              triggerSound('click');
            }}
            className={`px-5 py-2.5 rounded-2xl border-2 border-[#302541] font-black text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === 'ideas'
                ? 'bg-[#BAE6FD] text-[#302541] shadow-[3px_3px_0px_#302541] -translate-y-0.5'
                : 'bg-white text-[#746B7C] hover:bg-[#BAE6FD]'
            }`}
          >
            💡 Sticky Idea Board
          </button>

          <button
            onClick={() => {
              setActiveTab('challenges');
              triggerSound('click');
            }}
            className={`px-5 py-2.5 rounded-2xl border-2 border-[#302541] font-black text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === 'challenges'
                ? 'bg-[#A8D8B9] text-[#302541] shadow-[3px_3px_0px_#302541] -translate-y-0.5'
                : 'bg-white text-[#746B7C] hover:bg-[#A8D8B9]'
            }`}
          >
            🎯 Daily Prompt Gacha
          </button>
        </div>

        {/* TAB 1: DRAWING DEMO */}
        {activeTab === 'drawing' && (
          <div className="bg-[#FFFAF1] rounded-[32px] p-6 md:p-8 border-[3px] border-[#302541] shadow-[6px_6px_0px_#302541] max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-[#302541] font-display">
                  Digital Doodle Pad 🖌️
                </h3>
                <p className="text-xs font-bold text-[#746B7C]">Sketch whatever comes to mind using your mouse or finger!</p>
              </div>

              {/* Tools Bar */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border-2 border-[#302541]">
                  {['#302541', '#FFD978', '#A8D8B9', '#BAE6FD', '#FFE2D8'].map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        setBrushColor(color);
                        setIsEraser(false);
                        triggerSound('click');
                      }}
                      className={`w-6 h-6 rounded-full border-2 border-[#302541] transition-transform cursor-pointer ${
                        brushColor === color && !isEraser ? 'scale-125 shadow-[1px_1px_0px_#302541]' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                <button
                  onClick={() => {
                    setIsEraser(!isEraser);
                    triggerSound('click');
                  }}
                  className={`px-3 py-1.5 rounded-xl border-2 border-[#302541] font-black text-xs flex items-center gap-1 cursor-pointer transition-colors ${
                    isEraser ? 'bg-[#FFD978] text-[#302541]' : 'bg-white text-[#302541] hover:bg-[#FFE2D8]'
                  }`}
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Eraser</span>
                </button>

                <button
                  onClick={clearCanvas}
                  className="px-3 py-1.5 rounded-xl border-2 border-[#302541] bg-white text-[#302541] hover:bg-[#BAE6FD] font-black text-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              </div>
            </div>

            <div className="w-full h-72 sm:h-80 bg-white rounded-2xl border-2 border-[#302541] shadow-inner overflow-hidden relative cursor-crosshair touch-none">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-full"
              />
            </div>
          </div>
        )}

        {/* TAB 2: IDEAS DEMO */}
        {activeTab === 'ideas' && (
          <div className="bg-[#BAE6FD] rounded-[32px] p-6 md:p-8 border-[3px] border-[#302541] shadow-[6px_6px_0px_#302541] max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-[#302541] font-display">
                  Sticky Ideas Board 💡
                </h3>
                <p className="text-xs font-bold text-[#302541]/80">Capture wandering sparks and organize them into actionable concepts!</p>
              </div>
              <button
                onClick={addStickyNote}
                className="bg-[#FFD978] hover:bg-[#ffe08a] text-[#302541] font-black px-4 py-2 rounded-xl border-2 border-[#302541] shadow-[2px_2px_0px_#302541] text-xs flex items-center gap-1.5 cursor-pointer active:translate-y-0.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Note</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {stickyNotes.map((note) => (
                <div
                  key={note.id}
                  style={{ backgroundColor: note.color }}
                  className="p-5 rounded-2xl border-2 border-[#302541] shadow-[3px_3px_0px_#302541] flex flex-col justify-between min-h-[140px] transform hover:-translate-y-1 transition-transform"
                >
                  <div>
                    <span className="text-[10px] font-black uppercase bg-white/80 px-2 py-0.5 rounded border border-[#302541]">
                      {note.title}
                    </span>
                    <p className="font-bold text-xs text-[#302541] mt-2.5 leading-relaxed">
                      {note.desc}
                    </p>
                  </div>
                  <div className="text-[10px] font-black text-[#302541]/60 pt-2 border-t border-[#302541]/15">
                    ✦ Looma Sticky Card
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CHALLENGES DEMO */}
        {activeTab === 'challenges' && (
          <div className="bg-[#A8D8B9] rounded-[32px] p-6 md:p-8 border-[3px] border-[#302541] shadow-[6px_6px_0px_#302541] max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-[#302541] font-display">
                  Daily Challenge Machine 🎯
                </h3>
                <p className="text-xs font-bold text-[#302541]/80">Take on today’s creative prompt to earn XP and level up your creator streak!</p>
              </div>
              <button
                onClick={nextPrompt}
                className="bg-[#FFD978] hover:bg-[#ffe08a] text-[#302541] font-black px-4 py-2 rounded-xl border-2 border-[#302541] shadow-[2px_2px_0px_#302541] text-xs flex items-center gap-1.5 cursor-pointer active:translate-y-0.5 transition-all"
              >
                <Shuffle className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
                <span>Spin Random Prompt</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-[#302541] shadow-[3px_3px_0px_#302541] text-center">
              <span className="inline-block bg-[#FFE2D8] text-[#302541] px-3 py-1 rounded-full border-2 border-[#302541] font-black text-xs uppercase mb-3">
                {SAMPLE_PROMPTS[promptIdx].cat} · +{SAMPLE_PROMPTS[promptIdx].xp} XP
              </span>
              <h4 className="text-2xl sm:text-3xl font-black text-[#302541] font-display max-w-xl mx-auto leading-snug">
                {SAMPLE_PROMPTS[promptIdx].text}
              </h4>
              <p className="text-xs font-bold text-[#746B7C] mt-3">
                Complete and publish this in your dashboard to upload photo proof and unlock badges!
              </p>
            </div>
          </div>
        )}

      </section>

      {/* ================= COMMUNITY & FEATURES ================= */}
      <section id="community" className="scroll-mt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 z-10 relative">
        <div className="text-center max-w-2xl mx-auto mb-6">
          <span className="bg-[#FFE2D8] text-[#302541] font-black px-4 py-1 rounded-full border-2 border-[#302541] shadow-[2px_2px_0px_#302541] text-xs uppercase tracking-wider inline-block mb-3">
            MORE THAN JUST AN APP
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-[#302541] font-display">
            A Space for Creative Minds
          </h2>
          <p className="text-sm sm:text-base font-bold text-[#746B7C] mt-2">
            Find your people, share your creations, and enjoy a space where creativity comes first.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Social Feed */}
          <div className="bg-[#A8D8B9] p-7 rounded-[28px] border-[3px] border-[#302541] shadow-[4px_4px_0px_#302541] flex flex-col justify-between hover:-translate-y-1 transition-transform">
            <div>
              <div className="w-12 h-12 bg-white rounded-2xl border-2 border-[#302541] shadow-[2px_2px_0px_#302541] flex items-center justify-center mb-5">
                <Newspaper className="w-6 h-6 text-[#302541]" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-[#302541] font-display mb-2">
                Gallery Community Feed
              </h3>
              <p className="font-bold text-xs sm:text-sm text-[#302541]/80 leading-relaxed">
                Explore fun creations from creative minds everywhere! Like your favorites, leave sweet comments, and save little sparks of inspiration for later.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between gap-1.5 pt-3 border-t-2 border-[#302541]/10 text-[11px] font-black text-[#302541] flex-nowrap">
              <span className="flex items-center gap-1 bg-white px-2 sm:px-2.5 py-1 rounded-xl border-2 border-[#302541] shadow-[1.5px_1.5px_0px_#302541] shrink-0">
                <Heart className="w-3.5 h-3.5 text-[#302541]" />
                <span>Like</span>
              </span>
              <span className="flex items-center gap-1 bg-white px-2 sm:px-2.5 py-1 rounded-xl border-2 border-[#302541] shadow-[1.5px_1.5px_0px_#302541] shrink-0">
                <MessageCircle className="w-3.5 h-3.5 text-[#302541]" />
                <span>Comment</span>
              </span>
              <span className="flex items-center gap-1 bg-white px-2 sm:px-2.5 py-1 rounded-xl border-2 border-[#302541] shadow-[1.5px_1.5px_0px_#302541] shrink-0">
                <Bookmark className="w-3.5 h-3.5 text-[#302541]" />
                <span>Save</span>
              </span>
            </div>
          </div>

          {/* Card 2: Gamification XP & Streak */}
          <div className="bg-[#BAE6FD] p-7 rounded-[28px] border-[3px] border-[#302541] shadow-[4px_4px_0px_#302541] flex flex-col justify-between hover:-translate-y-1 transition-transform">
            <div>
              <div className="w-12 h-12 bg-white rounded-2xl border-2 border-[#302541] shadow-[2px_2px_0px_#302541] flex items-center justify-center mb-5">
                <Trophy className="w-6 h-6 text-[#302541]" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-[#302541] font-display mb-2">
                Gamified XP & Streaks
              </h3>
              <p className="font-bold text-xs sm:text-sm text-[#302541]/80 leading-relaxed">
                Share your creations, complete fun daily challenges, and earn XP points along the way! Build your creative streak and make every day a little more inspiring.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 pt-3 border-t-2 border-[#302541]/10 text-xs font-black text-[#302541]">
              <Trophy className="w-4 h-4 text-[#302541]" />
              <span className="bg-white/70 px-2 py-0.5 rounded border border-[#302541]">Build Lasting Habits</span>
            </div>
          </div>

          {/* Card 3: Custom Profiles & Avatars */}
          <div className="bg-[#FFE2D8] p-7 rounded-[28px] border-[3px] border-[#302541] shadow-[4px_4px_0px_#302541] flex flex-col justify-between hover:-translate-y-1 transition-transform">
            <div>
              <div className="w-12 h-12 bg-white rounded-2xl border-2 border-[#302541] shadow-[2px_2px_0px_#302541] flex items-center justify-center mb-5">
                <Smile className="w-6 h-6 text-[#302541]" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-[#302541] font-display mb-2">
                Custom Profiles & Avatars
              </h3>
              <p className="font-bold text-xs sm:text-sm text-[#302541]/80 leading-relaxed">
                Choose your favorite cute avatar, personalize your creative profile, and save your drafts for later! Make your space feel more like you while your creations grow.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 pt-3 border-t-2 border-[#302541]/10 text-xs font-black text-[#302541]">
              <Star className="w-4 h-4 text-[#302541]" />
              <span className="bg-white/70 px-2 py-0.5 rounded border border-[#302541]">Personalized Identity</span>
            </div>
          </div>

        </div>
      </section>

      {/* ================= FINAL CALL TO ACTION ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 z-10 relative">
        <div className="bg-[#FFD978] rounded-[36px] p-8 md:p-14 border-[3px] border-[#302541] shadow-[6px_6px_0px_#302541] flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          
          <div className="max-w-xl">
            <span className="bg-white text-[#302541] font-black px-3.5 py-1 rounded-full border-2 border-[#302541] text-xs uppercase mb-3 inline-block shadow-[1px_1px_0px_#302541]">
              JOIN THE FUN 🎪
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-[#302541] font-display leading-tight">
              Ready to Bring Your Imagination to Life?
            </h2>
            <p className="font-bold text-sm sm:text-base text-[#302541]/80 mt-3 leading-relaxed">
              Create a free account in seconds. Get access to every studio and connect with creators today.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => {
                triggerSound('chime');
                router.push('/register');
              }}
              className="w-full sm:w-auto bg-[#302541] hover:bg-[#43355b] text-[#FFFAF1] px-7 py-3.5 rounded-2xl border-2 border-[#302541] font-black text-sm sm:text-base shadow-[3px_3px_0px_white] active:translate-y-0.5 transition-all cursor-pointer"
            >
              Sign Up for Free ✨
            </button>
            <button
              onClick={() => {
                triggerSound('click');
                router.push('/login');
              }}
              className="w-full sm:w-auto bg-white hover:bg-[#FFE2D8] text-[#302541] px-6 py-3.5 rounded-2xl border-2 border-[#302541] font-black text-sm sm:text-base shadow-[3px_3px_0px_#302541] active:translate-y-0.5 transition-all cursor-pointer"
            >
              Log In to Account →
            </button>
          </div>

        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-[#302541] text-[#FFFAF1] border-t-[3px] border-[#302541] mt-12 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-3">
            <img 
              src={require('../../assets/images/looma.png')} 
              className="w-12 h-12 object-contain" 
              alt="Looma Logo" 
            />
            <div>
              <span className="font-black text-2xl tracking-wider font-display">LOOMA</span>
              <p className="text-[11px] font-bold text-gray-400">Playful creative space & community feed.</p>
            </div>
          </div>

          <button
            onClick={handleGlobalConfetti}
            className="bg-[#A8D8B9] hover:bg-[#8ee0b0] text-[#302541] px-5 py-2.5 rounded-xl border-2 border-[#302541] font-bold text-xs transition-colors cursor-pointer font-display"
          >
            SPARK CELEBRATION 🎉
          </button>

        </div>
      </footer>

    </div>
  );
}
