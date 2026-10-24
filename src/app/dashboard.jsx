import confetti from 'canvas-confetti';
import { useRouter } from 'expo-router';
import {
    ArrowLeft,
    Bookmark,
    Folder,
    Heart,
    Home,
    MessageCircle,
    PlusCircle,
    Send,
    Volume2,
    VolumeX
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import AvatarIcon from '../components/AvatarIcon';
import Feed from '../components/Feed';
import IdeaPostContent from '../components/IdeaPostContent';
import Profile from '../components/Profile';
import ChallengeStudio from '../components/studio/ChallengeStudio';
import CollageStudio from '../components/studio/CollageStudio';
import DrawingStudio from '../components/studio/DrawingStudio';
import IdeaStudio from '../components/studio/IdeaStudio';
import WritingStudio from '../components/studio/WritingStudio';
import { clearStoredUser, getStoredUser } from '../utils/auth';
import { getTodayChallenge, getTodayISO } from '../utils/challenges';
import { isSoundEnabled, playSound as playAudioSound, setSoundEnabled as saveSoundEnabled } from '../utils/sound';

// --- Cute Looma Mascot SVG ---
const CuteMascot = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="20" cy="18" r="10" fill="#FFE2D8" stroke="#302541" strokeWidth="4" />
    <circle cx="60" cy="18" r="10" fill="#A8D8B9" stroke="#302541" strokeWidth="4" />
    <rect x="10" y="16" width="60" height="54" rx="26" fill="#FFD978" stroke="#302541" strokeWidth="4" />
    <circle cx="29" cy="39" r="5.5" fill="#302541" />
    <circle cx="51" cy="39" r="5.5" fill="#302541" />
    <circle cx="27" cy="37" r="2" fill="#FFFFFF" />
    <circle cx="49" cy="37" r="2" fill="#FFFFFF" />
    <ellipse cx="20" cy="45" rx="5" ry="3" fill="#FF385C" />
    <ellipse cx="60" cy="45" rx="5" ry="3" fill="#FF385C" />
    <path d="M33 47C35 51 45 51 47 47" stroke="#302541" strokeWidth="4" strokeLinecap="round" />
    <path d="M40 16V7M40 7L35 11M40 7L45 11" stroke="#302541" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// --- Categories Definition ---
const CATEGORIES = [
  {
    id: 'menulis',
    number: '01',
    title: 'Writing & Literature',
    subtitle: 'Poetry, Short Stories, Journals & Quotes',
    badge: 'POETRY & STORY',
    emoji: '✍️',
    color: '#FFE2D8',
    accent: '#FFD978',
    description: 'Write a poem, a short story, a journal entry, or a quote and share it in the feed!',
  },
  {
    id: 'gambar',
    number: '02',
    title: 'Drawing & Doodles',
    subtitle: 'Freehand Sketches, Illustrations & Fun Doodles',
    badge: 'DOODLE ART',
    emoji: '🎨',
    color: '#FFD978',
    accent: '#FFF9F2',
    description: 'Draw a fun character or a quick sketch on the digital canvas, then share it!',
  },
  {
    id: 'ide',
    number: '03',
    title: 'Ideas & Brainstorming',
    subtitle: 'Bold Innovations, Fun Projects & Big Dreams',
    badge: 'WILD SPARK',
    emoji: '💡',
    color: '#BAE6FD',
    accent: '#FFF9F2',
    description: 'Have an app idea, a unique business concept, or a silly invention? Add it to an idea card and discuss it!',
  },
  {
    id: 'komik',
    number: '04',
    title: 'Collage & Mood Boards',
    subtitle: 'Arrange Stickers, Words & Expressive Posters',
    badge: 'MOOD & ZINE',
    emoji: '📌',
    color: '#FFE2D8',
    accent: '#FFF9F2',
    description: 'Make a mini poster with playful stickers and colorful typography that match your mood.',
  },
  {
    id: 'games',
    number: '04',
    title: 'Challenges & Games',
    subtitle: 'Prompt Gacha & Quick Word Games',
    badge: 'PLAY CHALLENGE',
    emoji: '🎮',
    color: '#A8D8B9',
    accent: '#FFD978',
    description: 'Spin the prompt machine, take on a silly challenge, and share what you make!',
  },
];
const CREATE_CATEGORIES = CATEGORIES.filter((category) => category.id !== 'komik');

// --- Post Data Structure (Instagram-style Creative Feed) ---
// We now fetch from the backend API instead of using dummy data

export default function App() {
  const { t } = useTranslation();
  const router = useRouter();
  const [soundEnabled, setSoundEnabled] = useState(() => isSoundEnabled());

  // --- User Profile State ---
  const [currentUser, setCurrentUser] = useState(() => {
    const auth = getStoredUser();
    return {
      id: auth?.id || 1,
      username: auth?.username || 'creative_user',
      bio: auth?.bio || 'I love sharing fun, creative ideas ✨',
      avatar: String(auth?.avatar || '13'),
      avatarBg: auth?.avatar_bg || auth?.avatarBg || '#FFD978',
      role: auth?.role || 'Looma Creator',
      xp: auth?.xp || 0,
      challenge_streak: auth?.challenge_streak || 0,
    };
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // --- SEPARATED PAGES / VIEWS (DIPISAH ANTARA FEED, BIKIN KARYA, DAN HISTORY/SAVED/LIKE/KOMEN) ---
  const [activePage, setActivePage] = useState('feed');
  // Creator lain yang sedang dibuka profil lengkapnya
  const [viewingCreator, setViewingCreator] = useState(null);
  // Tab bawaan saat membuka halaman Profil ('uploads' / 'drafts' / ...)
  const [profileTab, setProfileTab] = useState('uploads');
  // Sub-step inside 'create' page: 'pick-category' or 'studio-editor'
  const [createStep, setCreateStep] = useState('pick');
  const [selectedCategory, setSelectedCategory] = useState('menulis');

  // Sub-tab inside 'activity' (History / Saved / Liked / Comments / My Uploads)
  const [activityTab, setActivityTab] = useState('liked');

  // Feed Filter & Search
  const [feedFilter, setFeedFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // --- Social Feed Posts State ---
  const [posts, setPosts] = useState([]);
  const [commentInputs, setCommentInputs] = useState({});
  const tempCommentIdRef = useRef(0);

  // --- Daily Challenge (fitur gamified: XP + streak) ---
  // Key is per-user so completing a challenge only marks it done for THIS user
  const CHALLENGE_STORAGE_KEY = `looma_daily_challenge_${currentUser?.id || 'guest'}`;
  const [challengeState, setChallengeState] = useState(() => {
    try {
      const key = `looma_daily_challenge_${getStoredUser()?.id || 'guest'}`;
      return JSON.parse(localStorage.getItem(key)) || { date: null, joined: false, done: false };
    } catch {
      return { date: null, joined: false, done: false };
    }
  });

  // Fetch User dari Backend SQLite
  useEffect(() => {
    const auth = getStoredUser();
    const userIdToFetch = auth?.id || 1;
    fetch(`http://localhost:8001/api/users/${userIdToFetch}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch user');
        return res.json();
      })
      .then(userData => {
        if (userData && userData.id) {
          setCurrentUser(prev => ({
            ...prev,
            id: userData.id,
            username: userData.username || prev.username,
            bio: userData.bio || prev.bio,
            avatar: String(userData.avatar || prev.avatar),
            avatarBg: userData.avatar_bg || prev.avatarBg,
            role: userData.role || prev.role,
            xp: userData.xp ?? prev.xp,
            challenge_streak: userData.challenge_streak ?? prev.challenge_streak,
          }));
        }
      })
      .catch(err => console.warn('Could not load user from backend:', err));
  }, []);

  useEffect(() => {
    const auth = getStoredUser();
    const activeUserId = currentUser?.id || auth?.id || 1;
    fetch(`http://localhost:8001/api/posts?user_id=${activeUserId}`)
      .then(res => res.json())
      .then(data => {
        const normalizedPosts = data.map(p => ({
          ...p,
          likesCount: p.likesCount || p.likes_count || 0,
          isLiked: p.isLiked || p.is_liked,
          isSaved: p.isSaved || p.is_saved,
          tags: p.tags || [],
          comments: p.comments || [],
        }));
        setPosts(normalizedPosts);
      })
      .catch(err => console.error(err));
  }, [activePage, currentUser?.id]);

  // --- Studio Creator States ---
  // 1. Menulis (WYSIWYG)
  const [writingGenre, setWritingGenre] = useState('PUISI PENDEK');
  const [writingTitle, setWritingTitle] = useState('');
  const [writingBody, setWritingBody] = useState('');
  const [writingBg, setWritingBg] = useState('#FFFAF1');
  const [writingFont, setWritingFont] = useState('sans');

  // 2. Gambar (Ibis Paint Style)
  const [doodleTitle, setDoodleTitle] = useState('');
  const [doodleImageData, setDoodleImageData] = useState('');
  const [doodleHasContent, setDoodleHasContent] = useState(false); // true only after user actually draws

  // 3. Ideas & Brainstorming
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaBody, setIdeaBody] = useState('');

  // 4. Collage & Mood Boards
  const [moodTitle, setMoodTitle] = useState('Today’s Mood Board ✨');
  const [moodCollageData, setMoodCollageData] = useState(null);

  // 5. Challenges & Games (Truth or Dare)
  const [challengeTitle, setChallengeTitle] = useState('');
  const [challengeAnswer, setChallengeAnswer] = useState('');
  const [challengeProofImage, setChallengeProofImage] = useState(null);
  const handleDoodleImageChange = useCallback((dataUrl) => {
    setDoodleImageData((current) => current === dataUrl ? current : dataUrl);
  }, []);

  // Common Upload Fields
  const [postCaption, setPostCaption] = useState('');

  // --- Drafts State (dikelola dari tab Draf di Profil) ---
  const [drafts, setDrafts] = useState([]);
  const draftsRef = useRef(drafts);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [draftToast, setDraftToast] = useState(null);
  // Konfirmasi keluar studio (ada isinya, jangan sampai ilang)
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showCategorySwitchConfirm, setShowCategorySwitchConfirm] = useState(false);
  const [pendingCategory, setPendingCategory] = useState(null);
  // ID draf yang sedang diedit (null = karya baru, bukan dari draf)
  const [activeDraftId, setActiveDraftId] = useState(null);
  // Snapshot payload draf terakhir yang kesimpen (buat deteksi perubahan → autosave)
  const lastSyncedPayloadRef = useRef(null);
  const autosaveTimerRef = useRef(null);
  const draftSaveQueueRef = useRef(Promise.resolve());
  // Kategori asli draf yang dibuka — autosave cuma jalan kalau kategori ga berubah,
  // biar iseng klik pill kategori ga nulis "kosong" ke draf lama
  const activeDraftCategoryRef = useRef(null);
  // Track draft IDs that were explicitly deleted this session — prevents fetchDrafts from re-adding them
  const deletedDraftIdsRef = useRef(new Set());

  const persistDrafts = (listOrUpdater) => {
    const raw = typeof listOrUpdater === 'function' ? listOrUpdater(draftsRef.current) : listOrUpdater;
    // Always keep newest-first so draft list is sorted by updated_at desc
    const list = [...raw].sort((a, b) => {
      const ta = a.updated_at ? new Date(a.updated_at).getTime() : (a.created_at ? new Date(a.created_at).getTime() : 0);
      const tb = b.updated_at ? new Date(b.updated_at).getTime() : (b.created_at ? new Date(b.created_at).getTime() : 0);
      return tb - ta;
    });
    draftsRef.current = list;
    try {
      localStorage.setItem('looma_drafts', JSON.stringify(list));
    } catch (e) {}
    setDrafts(list);
  };

  const showDraftToast = (message) => {
    setDraftToast(message);
    setTimeout(() => setDraftToast(null), 3500);
  };

  // Reset konteks draf (dipakai pas keluar studio, hapus draf, atau mulai karya baru)
  // — sekalian batalkan autosave yang masih nunggu biar ga nimpa data yang udah bersih.
  const clearDraftContext = () => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    lastSyncedPayloadRef.current = null;
    activeDraftCategoryRef.current = null;
    setActiveDraftId(null);
  };

  const fetchDrafts = (signal) => {
    const auth = getStoredUser();
    const activeUserId = currentUser?.id || auth?.id || 1;
    fetch(`http://localhost:8001/api/drafts?user_id=${activeUserId}`, { signal })
      .then((res) => res.json())
      .then((data) => {
        if (signal?.aborted) return;
        if (Array.isArray(data)) {
          let localOnly = [];
          try {
            const cached = JSON.parse(localStorage.getItem('looma_drafts') || '[]');
            if (Array.isArray(cached)) {
              // Only include local-only drafts that belong to this user
              localOnly = cached.filter((draft) => draft._localOnly && String(draft.user_id) === String(activeUserId));
            }
          } catch (e) {}
          const localOnlyIds = new Set(localOnly.map((draft) => draft.id));
          const merged = [
            ...localOnly,
            ...data.filter((draft) => !localOnlyIds.has(draft.id)),
          ].filter((draft) => !deletedDraftIdsRef.current.has(String(draft.id)));
          // Use persistDrafts to sort by updated_at desc and update both ref and state
          persistDrafts(merged);
          try {
            // Persist only this user's drafts into localStorage
            const allCached = (() => { try { return JSON.parse(localStorage.getItem('looma_drafts') || '[]'); } catch { return []; } })();
            const otherUsersCached = Array.isArray(allCached) ? allCached.filter((d) => String(d.user_id) !== String(activeUserId)) : [];
            localStorage.setItem('looma_drafts', JSON.stringify([...draftsRef.current, ...otherUsersCached]));
          } catch (e) {}
        }
      })
      .catch(() => {
        if (signal?.aborted) return;
        try {
          const auth2 = getStoredUser();
          const uid = currentUser?.id || auth2?.id || 1;
          const cached = localStorage.getItem('looma_drafts');
          if (cached) {
            const allDrafts = JSON.parse(cached);
            // Filter to only this user's drafts
            const myDrafts = Array.isArray(allDrafts) ? allDrafts.filter((d) => String(d.user_id) === String(uid)) : [];
            draftsRef.current = myDrafts;
            setDrafts(myDrafts);
          }
        } catch (e) {}
      });
  };

  useEffect(() => {
    if (activePage !== 'profile') return undefined;
    const controller = new AbortController();
    fetchDrafts(controller.signal);
    return () => controller.abort();
  }, [activePage, currentUser?.id]);

  const resetStudioForm = () => {
    setWritingTitle('');
    setWritingBody('');
    setWritingGenre('');
    setWritingBg('');
    setWritingFont('');
    setDoodleTitle('');
    setDoodleImageData('');
    setDoodleHasContent(false);
    setIdeaTitle('');
    setIdeaBody('');
    setMoodTitle('Today’s Mood Board ✨');
    setMoodCollageData(null);
    setChallengeTitle('');
    setChallengeAnswer('');
    setChallengeProofImage(null);
    setPostCaption('');
  };

  // Cek apakah studio masih punya isian (biar ga ada karya yang ilang waktu klik Back)
  const studioHasContent = () => {
    if (postCaption.trim()) return true;
    if (selectedCategory === 'menulis') {
      return !!(
        writingTitle.trim() ||
        writingBody.trim() ||
        writingGenre ||
        (writingBg && writingBg !== '#FFFAF1') ||
        (writingFont && writingFont !== 'sans')
      );
    }
    if (selectedCategory === 'gambar') return !!(doodleHasContent || doodleImageData || doodleTitle.trim());
    if (selectedCategory === 'ide') return !!(ideaTitle.trim() || ideaBody.trim());
    if (selectedCategory === 'komik') return !!((moodCollageData?.items || []).length);
    if (selectedCategory === 'games') return !!(challengeAnswer.trim() || challengeProofImage);
    return false;
  };

  const handleExitStudio = async () => {
    triggerSound('click');
    // Lagi ngedit draf dari Profil → semua perubahan wajib kesimpen sebelum keluar
    if (activeDraftId) {
      setIsSavingDraft(true);
      let result = 'local';
      try {
        result = await syncDraftChanges();
      } finally {
        setIsSavingDraft(false);
        clearDraftContext();
        resetStudioForm();
        setActivePage('profile');
        setProfileTab('drafts');
        showDraftToast(
          result === 'saved'
            ? 'Draft changes saved 📁✨'
            : 'Changes saved on this device (server is offline) 📁'
        );
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }
    if (studioHasContent()) {
      setShowExitConfirm(true);
    } else {
      setCreateStep('pick');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCategoryClick = (catId) => {
    if (catId === selectedCategory) return;
    triggerSound('pop');
    if (studioHasContent()) {
      setPendingCategory(catId);
      setShowCategorySwitchConfirm(true);
    } else {
      setSelectedCategory(catId);
    }
  };

  // --- Draf: bangun payload dari isi studio yang sekarang ---
  // categoryOverride dipakai buat ngedit draf: selalu serialize pake kategori asli drafnya,
  // biar iseng klik pill kategori lain ga bikin isinya ketimpa/kosong.
  const buildDraftPayload = (categoryOverride) => {
    const catId = categoryOverride || selectedCategory;
    let draftTitle = '';
    let draftBody = '';
    let draftImage = null;
    let postType = 'writing';
    let extraData = {};

    if (catId === 'menulis') {
      draftTitle = writingTitle.trim();
      draftBody = writingBody.trim();
      postType = 'writing';
      extraData = {
        genre: writingGenre,
        paperTheme: writingBg,
        fontStyle: writingFont,
        caption: postCaption,
      };
    } else if (catId === 'gambar') {
      draftTitle = doodleTitle.trim();
      draftImage = doodleImageData;
      postType = 'doodle';
      extraData = {
        caption: postCaption,
      };
    } else if (catId === 'ide') {
      draftTitle = ideaTitle.trim();
      draftBody = ideaBody.trim();
      postType = 'idea';
      extraData = {
        caption: postCaption,
      };
    } else if (catId === 'komik') {
      draftTitle = moodTitle.trim();
      postType = 'moodboard';
      extraData = {
        moodCollageData,
        caption: postCaption,
      };
    } else if (catId === 'games') {
      draftTitle = challengeTitle.trim();
      draftBody = challengeAnswer.trim();
      draftImage = challengeProofImage;
      postType = 'challenge';
      extraData = {
        caption: postCaption,
      };
    }

    const catMeta = CATEGORIES.find((c) => c.id === catId) || { title: 'Post' };
    return {
      user_id: currentUser?.id || 1,
      category_id: catId,
      post_type: postType,
      title: draftTitle || `Draft ${catMeta.title}`,
      body_text: draftBody || null,
      image_url: draftImage || null,
      caption: postCaption || null,
      draft_data: JSON.stringify(extraData),
    };
  };

  // --- Save perubahan draf yang sedang diedit (PUT) ---
  // Return: 'saved' (server) atau 'local' (backend offline, simpan lokal dulu)
  const syncDraftChanges = () => {
    if (!activeDraftId) return 'local';
    // Selalu serialize pake kategori asli drafnya, biar pindah pill kategori ga korup isinya
    const draftId = activeDraftId;
    const payload = buildDraftPayload(activeDraftCategoryRef.current);
    const serialized = JSON.stringify(payload);
    const operation = draftSaveQueueRef.current.catch(() => {}).then(async () => {
      try {
        let res = await fetch(`http://localhost:8001/api/drafts/${draftId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: serialized,
      });
        if (res.status === 404) {
          res = await fetch('http://localhost:8001/api/drafts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: serialized,
          });
        }
        if (!res.ok) throw new Error('Draft save failed');
        const saved = await res.json();
        // Store WITHOUT _localOnly so fetchDrafts won't include it in the localOnly bucket
        // (it's now a real server record — the backend is the source of truth)
        const durableDraft = { ...saved };
        persistDrafts((prev) => [
          durableDraft,
          ...prev.filter((draft) => draft.id !== draftId && draft.id !== durableDraft.id),
        ]);
        if (durableDraft.id !== draftId) setActiveDraftId(durableDraft.id);
        lastSyncedPayloadRef.current = serialized;
        return 'saved';
      } catch {
      // Backend offline → tetap simpan lokal biar perubahan ga ilang
      const localDraft = {
        ...payload,
        id: draftId,
        _localOnly: true,
        updated_at: new Date().toISOString(),
      };
      persistDrafts((prev) => [localDraft, ...prev.filter((draft) => draft.id !== draftId)]);
      lastSyncedPayloadRef.current = serialized;
      return 'local';
      }
    });
    draftSaveQueueRef.current = operation;
    return operation;
  };

  // --- Tombol "SIMPAN PERUBAHAN" (opsional; draf juga kesimpen otomatis) ---
  const handleSaveDraftChanges = async () => {
    if (!activeDraftId || isSavingDraft) return;
    triggerSound('pop');
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    setIsSavingDraft(true);
    let result = 'local';
    try {
      result = await syncDraftChanges();
    } finally {
      setIsSavingDraft(false);
      clearDraftContext();
      resetStudioForm();
      setActivePage('profile');
      setProfileTab('drafts');
      triggerSound('chime');
      showDraftToast(
        result === 'saved'
          ? 'Draft changes saved 📁✨'
          : 'Changes saved on this device (server is offline) 📁'
      );
    }
  };

  const handleSaveNewDraft = async () => {
    if (isSavingDraft) return;
    if (!studioHasContent()) {
      showDraftToast('Add something to your work before saving it as a draft.');
      return;
    }
    triggerSound('pop');
    setIsSavingDraft(true);
    const payload = buildDraftPayload();
    let result = 'local';
    try {
      const res = await fetch('http://localhost:8001/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Draft save failed');
      const created = await res.json();
      persistDrafts((prev) => [created, ...prev.filter((draft) => draft.id !== created.id)]);
      result = 'saved';
    } catch {
      const localDraft = {
        ...payload,
        id: Date.now(),
        _localOnly: true,
        updated_at: new Date().toISOString(),
      };
      persistDrafts((prev) => [localDraft, ...prev]);
    } finally {
      setIsSavingDraft(false);
      resetStudioForm();
      setActivePage('profile');
      setProfileTab('drafts');
      triggerSound('chime');
      showDraftToast(
        result === 'saved'
          ? 'Draft saved 📁✨'
          : 'Draft saved on this device 📁'
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // --- Autosave: kalau lagi ngedit draf, semua perubahan otomatis kesimpen (debounce) ---
  useEffect(() => {
    if (!activeDraftId) return undefined;
    const serialized = JSON.stringify(buildDraftPayload(activeDraftCategoryRef.current));
    // Baru buka draf → jadikan isi awal sebagai baseline, jangan langsung nyimpen
    if (lastSyncedPayloadRef.current === null) {
      lastSyncedPayloadRef.current = serialized;
      return undefined;
    }
    // Belum ada perubahan sejak snapshot terakhir → jangan nyimpen apa-apa
    if (serialized === lastSyncedPayloadRef.current) return undefined;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      syncDraftChanges();
    }, 900);
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeDraftId,
    selectedCategory,
    writingTitle,
    writingBody,
    writingGenre,
    writingBg,
    writingFont,
    doodleTitle,
    doodleImageData,
    ideaTitle,
    ideaBody,
    moodTitle,
    moodCollageData,
    challengeTitle,
    challengeAnswer,
    challengeProofImage,
    postCaption,
  ]);

  const handleOpenDraft = (draft) => {
    triggerSound('bounce');
    // Reset all editor-specific states to avoid leftover data from previous draft
    setWritingTitle('');
    setWritingBody('');
    setWritingGenre('');
    setWritingBg('');
    setWritingFont('');
    setDoodleTitle('');
    setDoodleImageData('');
    setDoodleHasContent(false);
    setIdeaTitle('');
    setIdeaBody('');
    setMoodTitle('');
    setMoodCollageData(null);
    setChallengeTitle('');
    setChallengeAnswer('');
    setChallengeProofImage(null);
    setPostCaption('');
    setSelectedCategory(draft.category_id);
    setCreateStep('editor');
    setActivePage('create');
    setActiveDraftId(draft.id);
    activeDraftCategoryRef.current = draft.category_id;
    // Snapshot di-reset; baseline baru dibuat oleh efek autosave setelah semua isian ke-load
    lastSyncedPayloadRef.current = null;

    let extra = {};
    try {
      if (draft.draft_data) extra = JSON.parse(draft.draft_data);
    } catch (e) {}

    setPostCaption(draft.caption || '');

    if (draft.category_id === 'menulis') {
      setWritingTitle(draft.title || '');
      setWritingBody(draft.body_text || '');
      if (extra.genre) setWritingGenre(extra.genre);
      if (extra.paperTheme) setWritingBg(extra.paperTheme);
      if (extra.fontStyle) setWritingFont(extra.fontStyle);
    } else if (draft.category_id === 'gambar') {
      setDoodleTitle(draft.title || '');
      setDoodleImageData(draft.image_url || '');
      setDoodleHasContent(!!draft.image_url);
    } else if (draft.category_id === 'ide') {
      setIdeaTitle(draft.title || '');
      setIdeaBody(draft.body_text || '');
    } else if (draft.category_id === 'komik') {
      setMoodTitle(draft.title || '');
      if (extra.moodCollageData) setMoodCollageData(extra.moodCollageData);
    } else if (draft.category_id === 'games') {
      setChallengeTitle(draft.title || '');
      setChallengeAnswer(draft.body_text || '');
      if (draft.image_url) setChallengeProofImage(draft.image_url);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteDraft = async (draftId) => {
    triggerSound('pop');
    // Record as deleted so fetchDrafts won't re-add it from the server
    deletedDraftIdsRef.current.add(String(draftId));
    // Optimistically remove from state + localStorage immediately
    if (activeDraftId === draftId) clearDraftContext();
    persistDrafts((prev) => prev.filter((d) => d.id !== draftId));
    showDraftToast('Draft deleted 🗑️');

    // Only call backend for server-side drafts (not purely local ones)
    const isLocal = draftId > 1000000000000; // Date.now()-based IDs are > 13 digits
    if (!isLocal) {
      try {
        const res = await fetch(`http://localhost:8001/api/drafts/${draftId}?user_id=${currentUser?.id || 1}`, { method: 'DELETE' });
        if (!res.ok && res.status !== 404) {
          console.warn('Draft DELETE failed:', res.status);
          // Already removed from UI — don't re-add it, the user intended to delete
        }
      } catch (e) {
        console.warn('Draft DELETE network error:', e);
        // Keep the optimistic removal; don't re-add the draft
      }
    }
  };

  // --- Pindahkan karya yang SUDAH diposting balik ke Draf (menu titik tiga) ---
  const handleMovePostToDraft = async (post) => {
    if (!post) return;
    triggerSound('bounce');

    const activeUserId = currentUser?.id || 1;
    const postId = post.id;

    // Optimistically remove from feed immediately so UI feels instant
    setPosts((prev) => prev.filter((p) => p.id !== postId));

    try {
      // Use the atomic move-to-draft endpoint (idempotent: won't create duplicates)
      const res = await fetch(
        `http://localhost:8001/api/posts/${postId}/move-to-draft?user_id=${activeUserId}`,
        { method: 'POST' }
      );
      if (!res.ok) {
        // Roll back optimistic removal on failure
        const errData = await res.json().catch(() => ({}));
        console.error('Move to draft failed:', errData.detail || res.status);
        // Re-fetch posts to restore correct state
        fetch(`http://localhost:8001/api/posts?user_id=${activeUserId}`)
          .then((r) => r.json())
          .then((data) => {
            const normalized = data.map((p) => ({
              ...p,
              likesCount: p.likesCount || p.likes_count || 0,
              isLiked: p.isLiked || p.is_liked,
              isSaved: p.isSaved || p.is_saved,
              tags: p.tags || [],
              comments: p.comments || [],
            }));
            setPosts(normalized);
          })
          .catch(() => {});
        showDraftToast('Failed to move post to drafts. Please try again.');
        return;
      }
      const createdDraft = await res.json();
      // Add new draft to top of list (dedup by id)
      persistDrafts((prev) => [createdDraft, ...prev.filter((d) => d.id !== createdDraft.id)]);
      showDraftToast('Post moved to Drafts 📁');
    } catch (err) {
      console.error('Move to draft error:', err);
      // Network error — keep optimistic removal but save a local-only draft for resilience
      const localDraft = {
        user_id: activeUserId,
        category_id: post.category_id || post.categoryId || 'menulis',
        post_type: post.post_type || post.postType || 'writing',
        title: post.title || '',
        body_text: post.body_text || post.bodyText || null,
        image_url: post.image_url || post.imageDataUrl || null,
        caption: post.caption || null,
        draft_data: JSON.stringify({ fromPostId: postId }),
        source_post_id: postId,
        id: Date.now(),
        _localOnly: true,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      persistDrafts((prev) => [localDraft, ...prev.filter((d) => d.id !== localDraft.id)]);
      showDraftToast('Post moved to Drafts (offline) 📁');
    }
  };

  const triggerSound = (type = 'pop') => {
    if (soundEnabled) {
      playAudioSound(type);
    }
  };

  // --- Open Category Studio ---
  const openCategoryStudio = (catId) => {
    triggerSound('bounce');
    resetStudioForm();
    setSelectedCategory(catId);
    setCreateStep('editor');
    setActivePage('create');
    clearDraftContext(); // karya baru, bukan lanjutan draf
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- Daily Challenge: join, dan klaim XP+streak setelah karya terbit ---
  const persistChallengeState = (next) => {
    setChallengeState(next);
    try {
      localStorage.setItem(CHALLENGE_STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  const handleJoinChallenge = () => {
    triggerSound('bounce');
    const today = getTodayISO();
    persistChallengeState({
      date: today,
      joined: true,
      done: challengeState.date === today ? Boolean(challengeState.done) : false,
    });
    // Navigate directly to the studio matching today's challenge category
    const challenge = getTodayChallenge();
    const targetCategory = challenge.category || 'menulis';
    resetStudioForm();
    setSelectedCategory(targetCategory);
    setCreateStep('editor');
    setActivePage('create');
    clearDraftContext();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const completeTodayChallenge = async () => {
    const today = getTodayISO();
    if (challengeState.date !== today || !challengeState.joined || challengeState.done) return;
    try {
      const res = await fetch(`http://localhost:8001/api/users/${currentUser?.id || 1}/challenges/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: today }),
      });
      if (res.ok) {
        const data = await res.json();
        persistChallengeState({ date: today, joined: true, done: true });
        if (!data.already_completed) {
          setCurrentUser((prev) => ({ ...prev, xp: data.xp, challenge_streak: data.challenge_streak }));
          showDraftToast(`Challenge complete! +${data.xp_earned} XP · streak ${data.challenge_streak} day streak 🔥`);
          triggerSound('chime');
        }
      }
    } catch (e) {
      console.warn('Challenge sync failed:', e);
    }
  };

  // --- Publish Artwork & Switch to Feed Page ---
  const handlePublishPost = (e) => {
    e.preventDefault();
    const catMeta = CATEGORIES.find((c) => c.id === selectedCategory);

    let newPost = null;

    if (selectedCategory === 'menulis') {
      if (!writingTitle.trim() && !writingBody.trim()) return;
      newPost = {
        id: Date.now(),
        username: currentUser.username,
        avatarEmoji: currentUser.avatar,
        avatarBg: currentUser.avatarBg,
        categoryId: 'menulis',
        categoryLabel: catMeta.title,
        categoryColor: catMeta.color,
        timeAgo: 'Just now',
        postType: 'writing',
        writingSubgenre: writingGenre,
        title: writingTitle.trim() || 'Untitled Note',
        bodyText:
          writingBody.trim() ||
          'A poem or story, written with care.',
        cardBg: writingBg,
        fontStyle: writingFont,
        caption: postCaption.trim() || null,
        likesCount: 1,
        isLiked: true,
        isSaved: false,
        comments: [],
      };
      setWritingTitle('');
      setWritingBody('');
    } else if (selectedCategory === 'gambar') {
      if (!doodleImageData) return;
      newPost = {
        id: Date.now(),
        username: currentUser.username,
        avatarEmoji: currentUser.avatar,
        avatarBg: currentUser.avatarBg,
        categoryId: 'gambar',
        categoryLabel: catMeta.title,
        categoryColor: catMeta.color,
        timeAgo: 'Just now',
        postType: 'doodle',
        title: doodleTitle.trim() || 'Digital Doodle 🎨',
        cardBg: '#FFFAF1',
        imageDataUrl: doodleImageData,
        caption: postCaption.trim() || null,
        likesCount: 1,
        isLiked: true,
        isSaved: false,
        comments: [],
      };
      setDoodleTitle('');
      setDoodleImageData('');
    } else if (selectedCategory === 'ide') {
      if (!ideaTitle.trim() && !ideaBody.trim()) return;
      newPost = {
        id: Date.now(),
        username: currentUser.username,
        avatarEmoji: currentUser.avatar,
        avatarBg: currentUser.avatarBg,
        categoryId: 'ide',
        categoryLabel: catMeta.title,
        categoryColor: catMeta.color,
        timeAgo: 'Just now',
        postType: 'idea',
        writingSubgenre: 'BRAINSTORM 💡',
        title: ideaTitle.trim() || 'A Sudden Idea 💡',
        bodyText: ideaBody.trim() || 'A fun idea ready to explore with friends!',
        cardBg: '#FFF2CC',
        fontStyle: 'sans',
        caption: postCaption.trim() || null,
        likesCount: 1,
        isLiked: true,
        isSaved: false,
        comments: [],
      };
      setIdeaTitle('');
      setIdeaBody('');
    } else if (selectedCategory === 'komik') {
      const stickersList = (moodCollageData?.items || []).map(it => ({
        emoji: it.type === 'emoji' ? it.content : it.type === 'photo' ? '📸' : '📌',
        text: it.type === 'photo' ? (it.caption || 'Moment Photo') : it.content,
        bg: it.bg || '#FFD978',
      }));

      newPost = {
        id: Date.now(),
        username: currentUser.username,
        avatarEmoji: currentUser.avatar,
        avatarBg: currentUser.avatarBg,
        categoryId: 'komik',
        categoryLabel: catMeta.title,
        categoryColor: catMeta.color,
        timeAgo: 'Just now',
        postType: 'moodboard',
        title: moodTitle.trim() || 'Today’s Collage & Mood Board 📌',
        cardBg: '#A8D8B9',
        stickersList: stickersList.length > 0 ? stickersList : [
          { emoji: '🌸', text: 'Stay Soft & Creative', bg: '#FFE2D8' },
          { emoji: '🎨', text: 'Express Yourself!', bg: '#FF385C' }
        ],
        caption: postCaption.trim() || null,
        likesCount: 1,
        isLiked: true,
        isSaved: false,
        comments: [],
      };
    } else if (selectedCategory === 'games') {
      if (!challengeAnswer.trim() && !challengeProofImage) return;
      newPost = {
        id: Date.now(),
        username: currentUser.username,
        avatarEmoji: currentUser.avatar,
        avatarBg: currentUser.avatarBg,
        categoryId: 'games',
        categoryLabel: catMeta.title,
        categoryColor: catMeta.color,
        timeAgo: 'Just now',
        postType: 'challenge',
        writingSubgenre: 'TRUTH OR DARE 🎲',
        title: challengeTitle.trim() || 'Challenge Complete! 🔥',
        bodyText: challengeAnswer.trim() || 'Challenge completed!',
        imageDataUrl: challengeProofImage || null,
        cardBg: '#A8D8B9',
        fontStyle: 'sans',
        caption: postCaption.trim() || null,
        likesCount: 1,
        isLiked: true,
        isSaved: false,
        comments: [],
      };
      setChallengeAnswer('');
      setChallengeProofImage(null);
    }

    if (newPost) {
      triggerSound('chime');

      // Kalau karya ini dibuka dari draf → drafnya dihabiskan setelah posting berhasil
      const publishedDraftId = activeDraftId;
      const publishedDraftCategory = activeDraftCategoryRef.current;
      const isDraftContinuation = Boolean(
        publishedDraftId &&
        (!publishedDraftCategory || newPost.categoryId === publishedDraftCategory)
      );
      // Batalkan autosave yang masih nunggu, biar draf ga "hidup lagi" setelah diposting
      if (publishedDraftId) clearDraftContext();
      if (isDraftContinuation) {
        // Hide it immediately and block an in-flight profile refresh from restoring it.
        deletedDraftIdsRef.current.add(String(publishedDraftId));
        persistDrafts((prev) => prev.filter((d) => String(d.id) !== String(publishedDraftId)));
      }

      fetch('http://localhost:8001/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser?.id || 1,
          category_id: newPost.categoryId,
          post_type: newPost.postType,
          title: newPost.title,
          body_text: newPost.bodyText,
          image_url: newPost.imageDataUrl,
          caption: newPost.caption
        })
      })
      .then(async (res) => {
        let serverPost = null;
        if (res.ok) {
          try {
            serverPost = await res.json();
          } catch (_e) {}
        }
        if (publishedDraftId) {
          if (isDraftContinuation) {
            // Let any autosave already in flight finish before deleting, so a
            // late PUT/404->POST fallback cannot recreate the published draft.
            await draftSaveQueueRef.current.catch(() => {});
            fetch(`http://localhost:8001/api/drafts/${publishedDraftId}?user_id=${currentUser?.id || 1}`, { method: 'DELETE' }).catch(
              () => {}
            );
            persistDrafts((prev) => prev.filter((d) => String(d.id) !== String(publishedDraftId)));
          }
        }

        const postToInsert = serverPost
          ? {
              ...serverPost,
              isLiked: false,
              isSaved: false,
              likesCount: 0,
                    comments: [],
            }
          : newPost;

        setPosts([postToInsert, ...posts.filter((p) => p.id !== (serverPost?.id || newPost.id))]);
        setPostCaption('');
        resetStudioForm();
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#FF385C', '#FFD978', '#A8D8B9', '#FFE2D8', '#BAE6FD'],
        });

        // Langsung pindah ke halaman Feed Komunitas agar user melihat karyanya!
        setFeedFilter('ALL');
        setActivePage('feed');
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Karya ini dianggap menyelesaikan tantangan harian (kalau user ikut tantangan)
        completeTodayChallenge();
      });
    }
  };

  // --- Social Feed Actions (Like, Save, Comment) ---
  const handleToggleLike = async (postId) => {
    triggerSound('like');
    setPosts((currentPosts) =>
      currentPosts.map((post) => {
        if (post.id !== postId) return post;
        const nextLiked = !(post.isLiked ?? post.is_liked);
        const currentCount = Number(post.likesCount ?? post.likes_count ?? 0);
        const nextCount = Math.max(0, currentCount + (nextLiked ? 1 : -1));
        return {
          ...post,
          isLiked: nextLiked,
          is_liked: nextLiked,
          likesCount: nextCount,
          likes_count: nextCount,
        };
      })
    );
    try {
      await fetch(`http://localhost:8001/api/posts/${postId}/like?user_id=${currentUser?.id || 1}`, { method: 'POST' });
    } catch (e) {
      console.warn('Backend like sync failed:', e);
    }
  };

  const handleToggleSave = async (postId) => {
    triggerSound('pop');
    setPosts(posts.map((p) => (p.id === postId ? { ...p, isSaved: !p.isSaved } : p)));
    try {
      await fetch(`http://localhost:8001/api/posts/${postId}/save?user_id=${currentUser?.id || 1}`, { method: 'POST' });
    } catch (e) {
      console.warn('Backend save sync failed:', e);
    }
  };

  const handleCommentPost = async (postId, text, parentId = null) => {
    if (!text || !text.trim()) return;
    triggerSound('pop');
    // ID sementara negatif biar tidak bentrok dengan ID backend
    const tempId = -(++tempCommentIdRef.current);
    const newComment = {
      id: tempId,
      parent_id: parentId,
      username: currentUser.username,
      avatar: currentUser.avatar,
      text: text.trim(),
      timestamp: 'Just now',
      created_at: new Date().toISOString(),
      owner: {
        id: currentUser.id,
        username: currentUser.username,
        avatar: String(currentUser.avatar),
        avatar_bg: currentUser.avatarBg,
      },
    };
    setPosts(
      posts.map((p) => {
        if (p.id !== postId) return p;
        return {
          ...p,
          comments: [...(p.comments || []), newComment],
        };
      })
    );
    try {
      const res = await fetch(`http://localhost:8001/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser?.id || 1,
          text: text.trim(),
          ...(parentId != null ? { parent_id: parentId } : {}),
        }),
      });
      if (res.ok) {
        // Ganti komentar optimistik dengan data asli dari backend (owner, waktu, dst.)
        const saved = await res.json();
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id !== postId) return p;
            return {
              ...p,
              comments: (p.comments || []).map((c) =>
                c.id === tempId ? { ...saved, timestamp: 'Just now' } : c
              ),
            };
          })
        );
      }
    } catch (e) {
      console.warn('Backend comment sync failed:', e);
    }
  };

  const handleEditPost = async (postId, updatedFields) => {
    try {
      triggerSound('pop');
      const res = await fetch(`http://localhost:8001/api/posts/${postId}?user_id=${currentUser?.id || 1}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
      if (res.ok) {
        const updated = await res.json();
        setPosts(posts.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              title: updated.title,
              caption: updated.caption,
              body_text: updated.body_text,
              bodyText: updated.body_text,
              image_url: updated.image_url ?? p.image_url,
            };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error('Failed to update post', err);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      triggerSound('click');
      const res = await fetch(`http://localhost:8001/api/posts/${postId}?user_id=${currentUser?.id || 1}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setPosts(posts.filter(p => p.id !== postId));
      }
    } catch (err) {
      console.error('Failed to delete post', err);
    }
  };

  const handleAddComment = (e, postId) => {
    e.preventDefault();
    const text = (commentInputs[postId] || '').trim();
    if (!text) return;
    triggerSound('pop');

    setPosts(
      posts.map((p) => {
        if (p.id !== postId) return p;
        return {
          ...p,
          comments: [
            ...p.comments,
            {
              id: Date.now(),
              parent_id: null,
              username: currentUser.username,
              avatar: currentUser.avatar,
              text,
              timestamp: 'Just now',
              created_at: new Date().toISOString(),
              owner: {
                id: currentUser.id,
                username: currentUser.username,
                avatar: String(currentUser.avatar),
                avatar_bg: currentUser.avatarBg,
              },
            },
          ],
        };
      })
    );
    setCommentInputs({ ...commentInputs, [postId]: '' });
  };

  const handleDeleteComment = async (postId, commentId) => {
    triggerSound('click');
    try {
      const res = await fetch(`http://localhost:8001/api/posts/${postId}/comments/${commentId}?user_id=${currentUser.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setPosts(
          posts.map((p) => {
            if (p.id !== postId) return p;
            return {
              ...p,
              // Kalau komentar induknya dihapus, ikut hapus semua balasannya
              comments: (p.comments || []).filter((c) => c.id !== commentId && c.parent_id !== commentId),
            };
          })
        );
      } else {
        const err = await res.json().catch(() => ({}));
        console.error('Failed to delete comment:', err.detail || res.status);
      }
    } catch (err) {
      console.error('Failed to delete comment', err);
    }
  };

  const handleTogglePinComment = async (postId, commentId) => {
    triggerSound('click');
    try {
      const res = await fetch(`http://localhost:8001/api/posts/${postId}/comments/${commentId}/pin?user_id=${currentUser.id}`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(
          posts.map((p) => {
            if (p.id !== postId) return p;
            return {
              ...p,
              comments: (p.comments || []).map((c) => {
                if (c.id === commentId) return { ...c, is_pinned: data.is_pinned };
                return data.is_pinned ? { ...c, is_pinned: false } : c;
              }),
            };
          })
        );
      } else {
        const err = await res.json().catch(() => ({}));
        console.error('Failed to pin comment:', err.detail || res.status);
      }
    } catch (err) {
      console.error('Failed to pin comment', err);
    }
  };

  // --- Derived Lists for History / Activity Page ---
  const likedPosts = posts.filter((p) => p.isLiked || p.is_liked);
  const savedPosts = posts.filter((p) => p.isSaved || p.is_saved);
  const myUploadedPosts = posts.filter((p) => (p.username || p.owner?.username) === currentUser.username);

  // Collect all comments made by currentUser across all posts
  const myCommentsHistory = posts.flatMap((p) =>
    (p.comments || [])
      .filter((c) => (c.username || c.owner?.username) === currentUser.username)
      .map((c) => ({
        comment: c, 
        post: p,
      }))
  );

  const activeCategoryObj = CATEGORIES.find((c) => c.id === selectedCategory);

  const filteredFeedPosts = posts.filter((p) => {
    if (feedFilter !== 'ALL' && (p.categoryId || p.category_id) !== feedFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const uname = p.username || p.owner?.username || '';
      const cap = p.caption || '';
      return (
        uname.toLowerCase().includes(q) ||
        cap.toLowerCase().includes(q) ||
        (p.title && p.title.toLowerCase().includes(q)) ||
        ((p.bodyText || p.body_text) && (p.bodyText || p.body_text).toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Reusable Post Card Renderer (Used in Feed & in Liked/Saved/MyUploads tabs)
  const renderPostCard = (post) => {
    const pUsername = post.username || post.owner?.username || 'user';
    const pAvatar = post.avatarEmoji || post.owner?.avatar || '🐰';
    const pAvatarBg = post.avatarBg || post.owner?.avatar_bg || '#FFD978';
    const pBodyText = post.bodyText || post.body_text || '';

    return (
      <article
        key={post.id}
        className="bg-white rounded-[30px] border-[3px] border-[#302541] shadow-[6px_6px_0px_#302541] overflow-hidden flex flex-col justify-between mb-6"
      >
        <div>
          {/* 1. IG Card Top Header: Avatar + Username + Category Badge */}
          <div className="p-4 border-b-2 border-[#302541]/10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <AvatarIcon
                id={pAvatar}
                className="w-11 h-11 rounded-2xl border-2 border-[#302541] shadow-[2px_2px_0px_#302541] shrink-0 bg-white"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-sm text-[#302541]">@{pUsername}</span>
                  <span className="text-[10px] font-bold text-[#746B7C]">· {post.timeAgo || 'Just now'}</span>
                </div>
              </div>
            </div>

            <span
              style={{ backgroundColor: post.categoryColor || '#FFE2D8' }}
              className="px-3 py-1 rounded-xl border-2 border-[#302541] text-[10px] font-black text-[#302541] shrink-0"
            >
              {post.categoryLabel || post.category_id}
            </span>
          </div>

          {/* 2. IG Visual Content Canvas */}
          <div
            onDoubleClick={() => handleToggleLike(post.id)}
            style={{ backgroundColor: post.cardBg }}
            className="p-6 border-b-2 border-[#302541] min-h-[250px] flex flex-col justify-center relative cursor-pointer select-none"
            title="Double-click to like ❤️"
          >
            {post.writingSubgenre && (
              <span className="self-start px-2.5 py-0.5 rounded-md bg-white/80 border border-[#302541] text-[10px] font-black uppercase mb-3">
                {post.writingSubgenre}
              </span>
            )}

            {((post.postType || post.post_type) === 'idea' || post.categoryId === 'ide' || post.category_id === 'ide') ? (
              <IdeaPostContent title={post.title} body={post.bodyText || post.body_text || ''} />
            ) : (post.postType || post.post_type) === 'doodle' && (post.imageDataUrl || post.image_url) ? (
              <div className="flex flex-col items-center">
                {post.title && (
                  <h3 className="text-lg font-black text-[#302541] font-display mb-2">
                    {post.title}
                  </h3>
                )}
                <img
                  src={post.imageDataUrl || post.image_url}
                  alt={post.title || 'Doodle Art'}
                  className="w-full max-h-[230px] object-contain rounded-xl border-2 border-[#302541] bg-white"
                />
              </div>
            ) : post.postType === 'moodboard' && post.stickersList ? (
              <div>
                <h3 className="text-xl font-black text-[#302541] font-display text-center mb-4">
                  {post.title}
                </h3>
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  {post.stickersList.map((st, idx) => (
                    <div
                      key={idx}
                      style={{ backgroundColor: st.bg }}
                      className="px-3.5 py-2 rounded-2xl border-2 border-[#302541] shadow-[2px_2px_0px_#302541] font-black text-xs flex items-center gap-1.5"
                    >
                      <span>{st.emoji}</span>
                      <span>{st.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : ((post.postType || post.post_type) === 'challenge' || post.categoryId === 'games') ? (
              <div className="w-full">
                <div className="rounded-2xl border-2 border-[#302541] bg-white/95 p-4 sm:p-5 shadow-[3px_3px_0px_#302541]">
                  <div className="flex items-center justify-between border-b-2 border-[#302541]/10 pb-3 mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-full border border-[#302541] bg-[#FFD978] px-2.5 py-0.5 text-[10px] font-black uppercase text-[#302541] shadow-[1px_1px_0px_#302541]">
                        🎲 CHALLENGE MISSION
                      </span>
                      <span className="text-[10px] font-bold text-[#746B7C]">
                        Completed ✓
                      </span>
                    </div>
                    <span className="text-sm">🔥</span>
                  </div>

                  {post.title && (
                    <h3 className="mb-3 font-display text-base sm:text-lg font-black leading-snug text-[#302541]">
                      "{post.title}"
                    </h3>
                  )}

                  <div className={`flex flex-col gap-3 ${(post.imageDataUrl || post.image_url) ? 'sm:flex-row sm:items-start sm:gap-4' : ''}`}>
                    <div className="flex-1 rounded-xl border border-[#302541]/20 bg-[#FFFAF1] p-3">
                      <div className="mb-1 text-[10px] font-black uppercase tracking-wider text-[#746B7C]">
                        ✍️ Answer / Proof:
                      </div>
                      <p className="whitespace-pre-line text-xs sm:text-sm font-bold leading-relaxed text-[#302541]">
                        {post.bodyText || 'Challenge completed!'}
                      </p>
                    </div>

                    {(post.imageDataUrl || post.image_url) && (
                      <div className="flex shrink-0 justify-center sm:justify-start">
                        <div className="rounded-xl border-2 border-[#302541] bg-white p-1.5 shadow-[2px_2px_0px_#302541]">
                          <img
                            src={post.imageDataUrl || post.image_url}
                            alt={post.title || 'Proof photo'}
                            className="h-28 w-28 rounded-lg border border-[#302541]/20 bg-[#FFFAF1] object-cover"
                          />
                          <div className="mt-1 text-center text-[10px] font-black text-[#302541]">
                            📸 Proof Photo
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {post.title && (
                  <h3 className="text-2xl font-black text-[#302541] font-display leading-snug mb-3">
                    {post.title}
                  </h3>
                )}
                {(() => {
                  const body = post.bodyText || post.body_text || '';
                  const isHtml = typeof body === 'string' && /<[a-z][\s\S]*>/i.test(body);
                  return isHtml
                    ? <div className={`text-sm sm:text-base font-bold text-[#302541]/90 leading-relaxed ${post.fontStyle === 'serif' ? 'font-serif' : post.fontStyle === 'mono' ? 'font-mono' : 'font-sans'}`} dangerouslySetInnerHTML={{ __html: body }} />
                    : <p className={`text-sm sm:text-base font-bold text-[#302541]/90 whitespace-pre-line leading-relaxed ${post.fontStyle === 'serif' ? 'font-serif' : post.fontStyle === 'mono' ? 'font-mono' : 'font-sans'}`}>{body}</p>;
                })()}
                {(post.imageDataUrl || post.image_url) && (
                  <div className="mt-3 flex justify-center">
                    <div className="relative inline-flex flex-col items-center rounded-xl border-2 border-[#302541] bg-white p-1.5 shadow-[2px_2px_0px_#302541]">
                      <img
                        src={post.imageDataUrl || post.image_url}
                        alt={post.title || 'Proof photo'}
                        className="h-28 w-28 sm:h-32 sm:w-32 rounded-lg border border-[#302541]/30 bg-[#FFFAF1] object-cover"
                      />
                      <span className="mt-1 text-[10px] font-black text-[#302541]">
                        📸 Proof
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 3. IG Action Bar, Likes, Username + Caption & Comments */}
        <div className="p-4 sm:p-5 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => handleToggleLike(post.id)}
                className={`px-3.5 py-1.5 rounded-xl border-2 border-[#302541] shadow-[2px_2px_0px_#302541] font-black text-xs flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95 ${post.isLiked ? 'bg-[#FF385C] text-white' : 'bg-[#FFFAF1] text-[#302541]'
                  }`}
              >
                <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                <span className="tabular-nums">{post.likesCount} Likes</span>
              </button>

              <div className="px-3 py-1.5 rounded-xl border-2 border-[#302541] bg-[#FFFAF1] font-black text-xs flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4" />
                <span className="tabular-nums">{post.comments.length} Comments</span>
              </div>
            </div>

            <button
              onClick={() => handleToggleSave(post.id)}
              className={`px-3 py-1.5 rounded-xl border-2 border-[#302541] shadow-[2px_2px_0px_#302541] font-black text-xs flex items-center gap-1.5 cursor-pointer ${post.isSaved ? 'bg-[#FFD978] text-[#302541]' : 'bg-[#FFFAF1] text-[#302541]'
                }`}
              title="Save post"
            >
              <Bookmark className={`w-4 h-4 ${post.isSaved ? 'fill-current' : ''}`} />
              <span>{post.isSaved ? 'Saved' : 'Save'}</span>
            </button>
          </div>

          {/* IG Username + Caption Block */}
          <div className="text-xs sm:text-sm leading-relaxed">
            <span className="font-black text-[#302541] mr-2">@{post.username}</span>
            <span className="font-semibold text-[#302541]/90">{post.caption}</span>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {post.tags.map((tg, i) => (
                <span key={i} className="text-xs font-black text-[#FF385C]">
                  {tg}
                </span>
              ))}
            </div>
          </div>

          {/* Comments List — hanya komentar utama; balasan ada di balik "View replies" di modal */}
          {post.comments.filter((c) => c?.parent_id == null).length > 0 && (
            <div className="bg-[#FFFAF1] p-3 rounded-2xl border border-[#302541]/15 space-y-1.5">
              {post.comments.filter((c) => c?.parent_id == null).sort((a, b) => {
                const aMine = (a.user_id != null && String(a.user_id) === String(currentUser.id)) || (a.owner?.id != null && String(a.owner.id) === String(currentUser.id)) || a.owner?.username === currentUser.username || a.username === currentUser.username;
                const bMine = (b.user_id != null && String(b.user_id) === String(currentUser.id)) || (b.owner?.id != null && String(b.owner.id) === String(currentUser.id)) || b.owner?.username === currentUser.username || b.username === currentUser.username;
                if (aMine !== bMine) return Number(bMine) - Number(aMine);
                const aTime = a.created_at ? new Date(a.created_at).getTime() : Number(a.id) || 0;
                const bTime = b.created_at ? new Date(b.created_at).getTime() : Number(b.id) || 0;
                return bTime - aTime;
              }).map((c) => (
                <div key={c.id} className="text-xs flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-1">
                    <AvatarIcon id={c.owner?.avatar || c.avatar || '12'} className="w-5 h-5 rounded-full shrink-0" />
                    <div>
                      <span className="font-black text-[#302541] mr-1.5">@{c.owner?.username || c.username}</span>
                      {(c.owner?.id != null && post.user_id != null && String(c.owner.id) === String(post.user_id)) && (
                        <span className="mr-1.5 inline-flex items-center rounded-full bg-[#FFD978] px-1.5 py-0.5 align-middle text-[9px] font-black">Author</span>
                      )}
                      <span className="font-semibold text-[#302541]/85">{c.text}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#746B7C] shrink-0">
                    {c.timestamp || (c.created_at ? new Date(c.created_at).toLocaleDateString('id-ID') : '')}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Add Comment Input */}
          <form onSubmit={(e) => handleAddComment(e, post.id)} className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={commentInputs[post.id] || ''}
              onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
              placeholder={`Write a comment as @${currentUser.username}...`}
              className="flex-1 bg-[#FFFAF1] px-3.5 py-2 rounded-xl border-2 border-[#302541] font-bold text-xs focus:outline-none"
            />
            <button
              type="submit"
              className="bg-[#302541] text-[#FFD978] px-3.5 py-2 rounded-xl border-2 border-[#302541] font-black text-xs cursor-pointer hover:bg-[#FF385C] hover:text-white transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      </article>
    );
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `

@keyframes marquee {
  0% {
    transform: translateX(0%);
  }

  100% {
    transform: translateX(-50%);
  }
}

.animate-marquee {
  display: flex;
  width: max-content;
  animation: marquee 24s linear infinite;
}

@keyframes floatSlow {
  0%, 100% {
    transform: translateY(0px) rotate(var(--tw-rotate, 0deg));
  }

  50% {
    transform: translateY(-10px) rotate(var(--tw-rotate, 0deg));
  }
}

.animate-float {
  animation: floatSlow 3.6s ease-in-out infinite;
}` }} />

      <div className="min-h-screen bg-transparent text-[#302541] selection:bg-[#FFD978] selection:text-[#302541] relative overflow-x-hidden pb-20">
        {/* Subtle Polka-Dot Texture */}
        <div
          className="fixed inset-0 pointer-events-none opacity-15 z-0"
          style={{
            backgroundImage: 'radial-gradient(#302541 1.5px, transparent 1.5px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* ================= TOP NAVIGATION HEADER ================= */}
        <header className="sticky top-0 z-50 bg-[#FFFAF1]/95 backdrop-blur-md border-b-[3px] border-[#302541] px-4 lg:px-8 py-2.5 w-full">
          <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
            {/* Left: Brand Logo Mini */}
            <div
              onClick={() => {
                triggerSound('chime');
                setActivePage('feed');
              }}
              className="flex items-center gap-2 pl-3 pr-2 sm:pr-4 cursor-pointer group"
            >
              <img
                src={require('../../assets/images/looma.png')}
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain transform group-hover:rotate-[20deg] transition-transform duration-300"
                alt="Looma Logo"
              />
              <span className="text-xl sm:text-2xl font-black tracking-widest text-[#302541] font-display hidden md:block mt-1">
                LOOMA
              </span>
            </div>

            <div className="w-px h-8 bg-[#302541]/10 mx-1 hidden sm:block"></div>

            {/* Center: Tabs */}
            <nav className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => {
                  triggerSound('pop');
                  setActivePage('feed');
                }}
                className={`px-3 sm:px-5 py-2.5 rounded-full font-black text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-all ${activePage === 'feed'
                  ? 'bg-[#FFD978] text-[#302541] shadow-inner'
                  : 'text-[#302541]/60 hover:bg-[#FFFAF1] hover:text-[#302541]'
                  }`}
              >
                <Home className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Home</span>
              </button>

              <button
                onClick={() => {
                  triggerSound('bounce');
                  setCreateStep('pick');
                  setActivePage('create');
                }}
                className={`px-3 sm:px-5 py-2.5 rounded-full font-black text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-all ${activePage === 'create'
                  ? 'bg-[#FF385C] text-white shadow-inner'
                  : 'text-[#302541]/60 hover:bg-[#FFFAF1] hover:text-[#302541]'
                  }`}
              >
                <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Create</span>
              </button>
            </nav>

            <div className="w-px h-8 bg-[#302541]/10 mx-1 hidden sm:block"></div>

            {/* Right: User Profile & Sound */}
            <div className="flex items-center gap-1.5 pr-1.5">
              <button
                onClick={() => {
                  const nextState = !soundEnabled;
                  setSoundEnabled(nextState);
                  saveSoundEnabled(nextState);
                  if (nextState) {
                    playAudioSound('click');
                  }
                }}
                className="w-10 h-10 sm:w-11 sm:h-11 bg-[#FFFAF1] rounded-full border-[2px] border-[#302541] flex items-center justify-center cursor-pointer hover:bg-[#FFD978] transition-colors"
                title="Sound"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-[#746B7C]" />}
              </button>

              <button
                onClick={() => {
                  triggerSound('pop');
                  setProfileTab('uploads');
                  setActivePage('profile');
                }}
                className={`flex items-center gap-2 p-1 rounded-full border-[2px] border-[#302541] cursor-pointer transition-colors ${activePage === 'profile' ? 'bg-[#A8D8B9]' : 'bg-[#FFFAF1] hover:bg-[#FFD978]'
                  }`}
              >
                <AvatarIcon 
                  id={currentUser.avatar}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-[2px] border-[#302541] overflow-hidden bg-white" 
                />
              </button>
            </div>
          </div>
        </header>

        {/* ================= MAIN BODY CONTAINER ================= */}
        <main className="max-w-[1440px] mx-auto px-4 lg:px-8 pt-6 relative z-10">

          {/* =====================================================================
            HALAMAN 1: FEED KOMUNITAS (KHUSUS LIHAT KARYA, LIKE, KOMEN, SAVE)
           ===================================================================== */}
          {activePage === 'feed' && (
            <Feed
              currentUser={currentUser}
              posts={posts}
              onLike={handleToggleLike}
              onSave={handleToggleSave}
              onComment={handleCommentPost}
              onEdit={handleEditPost}
              onDelete={handleDeletePost}
              onDeleteComment={handleDeleteComment}
              onTogglePinComment={handleTogglePinComment}
              onMoveToDraft={handleMovePostToDraft}
              onJoinChallenge={handleJoinChallenge}
              challengeInfo={{
                joined: challengeState.date === getTodayISO() && Boolean(challengeState.joined),
                done: challengeState.date === getTodayISO() && Boolean(challengeState.done),
              }}
              onNavigateToCreatorProfile={(creator) => {
                setViewingCreator(creator);
                setActivePage('creator-profile');
              }}
            />
          )}

          {activePage === 'creator-profile' && viewingCreator && (
            <Profile
              currentUser={{
                id: viewingCreator.id,
                username: viewingCreator.username,
                full_name: viewingCreator.full_name || viewingCreator.username,
                bio: viewingCreator.bio || '',
                avatar: String(viewingCreator.avatar || '13'),
                avatar_bg: '#FFFFFF',
                role: viewingCreator.role || 'Looma Creator',
                xp: viewingCreator.xp || 0,
                challenge_streak: viewingCreator.challenge_streak || 0,
              }}
              isViewingOther={true}
              onBack={() => {
                setViewingCreator(null);
                setActivePage('feed');
              }}
              onToggleLike={handleToggleLike}
              onToggleSave={handleToggleSave}
              onComment={handleCommentPost}
              onDeleteComment={handleDeleteComment}
              onTogglePinComment={handleTogglePinComment}
              onEditPost={handleEditPost}
              onDeletePost={handleDeletePost}
              myUploadedPosts={posts.filter((p) => {
                const pUserId = p.user_id ?? p.userId ?? p.owner?.id;
                const pUsername = p.username ?? p.owner?.username;
                return viewingCreator.id != null
                  ? String(pUserId) === String(viewingCreator.id)
                  : pUsername === viewingCreator.username;
              })}
              likedPosts={[]}
              savedPosts={[]}
              posts={posts}
              drafts={[]}
              initialTab="uploads"
            />
          )}

          {activePage === 'profile' && (
            <Profile
              currentUser={currentUser}
              onUpdateProfile={(newData) => setCurrentUser({ ...currentUser, ...newData })}
              onToggleLike={handleToggleLike}
              onToggleSave={handleToggleSave}
              onComment={handleCommentPost}
              onDeleteComment={handleDeleteComment}
              onTogglePinComment={handleTogglePinComment}
              onEditPost={handleEditPost}
              onDeletePost={handleDeletePost}
              myUploadedPosts={myUploadedPosts}
              likedPosts={likedPosts}
              savedPosts={savedPosts}
              posts={posts}
              drafts={drafts}
              initialTab={profileTab}
              onOpenDraft={handleOpenDraft}
              onDeleteDraft={handleDeleteDraft}
              onSaveDraftPost={handleMovePostToDraft}
              onLogout={() => {
                clearStoredUser();
                router.replace('/login');
              }}
            />
          )}

          {/* =====================================================================
            HALAMAN 2: STUDIO BIKIN KARYA / FEED (TERPISAH DARI FEED UTAMA!)
           ===================================================================== */}
          {activePage === 'create' && (
            <div className="max-w-5xl mx-auto">

              {/* STEP 1: PILIH KATEGORI DULU (5 Kartu Kategori Besar, Lucu & Jelas) */}
              {createStep === 'pick' && (
                <div className="space-y-6">
                  <div className="bg-[#FFFAF1] rounded-[40px] border-[3px] border-[#302541] shadow-[4px_4px_0px_#302541] p-8 sm:p-10 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#FFE2D8] via-[#FFD978] to-[#A8D8B9]"></div>
                    <span className="inline-block bg-[#302541] text-[#FFD978] font-black px-4 py-1.5 rounded-full text-xs tracking-wider uppercase mb-4 shadow-[2px_2px_0px_#FF385C]">
                      ✦ CHOOSE A CREATION CATEGORY
                    </span>
                    <h1 className="text-3xl sm:text-5xl font-black text-[#302541] font-display mt-2 mb-3">
                      What Would You Like to Create Today?
                    </h1>
                    <p className="text-sm sm:text-base font-bold text-[#746B7C] max-w-xl mx-auto">
                      Choose a category below to open its studio, then share your creation with the community feed!
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {CREATE_CATEGORIES.map((cat, idx) => (
                      <button
                        key={cat.id}
                        onClick={() => openCategoryStudio(cat.id)}
                        style={{ backgroundColor: cat.color }}
                        className={`text-left rounded-[32px] border-[3px] border-[#302541] shadow-[4px_4px_0px_#302541] p-6 flex flex-col justify-between min-h-[240px] hover:-translate-y-2 hover:shadow-[8px_8px_0px_#302541] hover:scale-[1.02] transition-all duration-300 cursor-pointer group ${idx % 2 === 0 ? '-rotate-1 hover:rotate-2' : 'rotate-1 hover:-rotate-2'
                          }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="w-16 h-16 rounded-[20px] bg-white/60 backdrop-blur-sm flex items-center justify-center text-4xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                            {cat.emoji}
                          </div>
                          <span className="px-3 py-1 rounded-full bg-white/90 text-[#302541] font-black text-xs tabular-nums shadow-sm">
                            {cat.number}
                          </span>
                        </div>

                        <div className="my-5">
                          <span className="text-[10px] font-black uppercase tracking-wider bg-white/50 text-[#302541] px-3 py-1 rounded-full">
                            {cat.badge}
                          </span>
                          <h3 className="text-2xl sm:text-3xl font-black text-[#302541] font-display mt-3 leading-tight">
                            {cat.title}
                          </h3>
                          <p className="text-xs sm:text-sm font-bold text-[#302541]/80 mt-1.5 leading-relaxed">
                            {cat.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t-2 border-[#302541]/10 group-hover:border-[#302541]/20 transition-colors">
                          <span className="text-xs font-black text-[#302541] flex items-center gap-2">
                            OPEN THIS STUDIO
                          </span>
                          <div className="w-10 h-10 rounded-full bg-[#302541] text-[#FFD978] flex items-center justify-center font-black text-xl group-hover:translate-x-1 transition-transform">
                            →
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2: RUANG EDITOR KATEGORI YANG DIPILIH */}
              {createStep === 'editor' && (
                <div className="space-y-5">
                  {/* Back to Category Picker & Quick Switch Bar (1 Baris Sejajar) */}
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <button
                      type="button"
                      onClick={handleExitStudio}
                      className="shrink-0 bg-white hover:bg-[#FFD978] text-[#302541] px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl border-[2.5px] border-[#302541] shadow-[2.5px_2.5px_0px_#302541] font-black text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 cursor-pointer active:translate-y-0.5 transition-all"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>

                    {/* Quick Switch Pills */}
                    <nav aria-label="Creation categories" className="flex-1 grid grid-cols-4 gap-1.5 sm:gap-2 rounded-2xl border-2 border-[#302541]/15 bg-white/70 p-1 sm:p-1.5">
                      {CREATE_CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleCategoryClick(cat.id)}
                          style={{
                            backgroundColor: selectedCategory === cat.id ? cat.color : '#FFFFFF',
                          }}
                          className="flex items-center justify-center gap-1 sm:gap-1.5 rounded-xl border-2 border-[#302541] px-1.5 sm:px-3 py-2 font-black text-[11px] sm:text-xs cursor-pointer transition-transform hover:-translate-y-0.5"
                        >
                          <span className="text-sm sm:text-base">{cat.emoji}</span>
                          <span className="truncate">{cat.title.split(' ')[0]}</span>
                        </button>
                      ))}
                    </nav>
                  </div>

                  {/* Studio Box */}
                  <section
                    style={{ backgroundColor: activeCategoryObj.color }}
                    className="rounded-[32px] border-[3px] border-[#302541] shadow-[8px_8px_0px_#302541] p-5 sm:p-8"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-5 border-b-[2.5px] border-[#302541]/20">
                      <div className="flex items-center gap-3.5">
                        <div className="w-14 h-14 rounded-2xl bg-white border-[3px] border-[#302541] shadow-[4px_4px_0px_#302541] flex items-center justify-center text-3xl">
                          {activeCategoryObj.emoji}
                        </div>
                        <div>
                          <span className="bg-white px-2.5 py-0.5 rounded-lg border-2 border-[#302541] text-[10px] font-black uppercase">
                            {activeDraftId ? '✏️ EDITING DRAFT' : `STUDIO ${activeCategoryObj.number} · ${activeCategoryObj.badge}`}
                          </span>
                          <h2 className="text-2xl sm:text-3xl font-black text-[#302541] font-display mt-1">
                            {activeDraftId ? `Edit: ${activeCategoryObj.title}` : activeCategoryObj.title}
                          </h2>
                        </div>
                      </div>

                      <div className="bg-white px-3.5 py-2 rounded-2xl border-2 border-[#302541]">
                        <div className="text-[9px] font-black uppercase text-[#746B7C]">
                          CREATOR:
                        </div>
                        <div className="text-xs font-black text-[#302541] flex items-center gap-1.5 mt-0.5">
                          <AvatarIcon id={currentUser.avatar} className="w-5 h-5 rounded-full" />
                          <span>@{currentUser.username}</span>
                        </div>
                      </div>
                    </div>

                    {/* Form */}
                    <form
                      onSubmit={handlePublishPost}
                      className="bg-white rounded-[26px] border-[3px] border-[#302541] shadow-[5px_5px_0px_#302541] p-5 sm:p-6"
                    >
                      {/* 1. MENULIS (WYSIWYG Rich Editor) */}
                      {selectedCategory === 'menulis' && (
                        <WritingStudio
                          title={writingTitle}
                          setTitle={setWritingTitle}
                          body={writingBody}
                          setBody={setWritingBody}
                          genre={writingGenre}
                          setGenre={setWritingGenre}
                          paperTheme={writingBg}
                          setPaperTheme={setWritingBg}
                          fontStyle={writingFont}
                          setFontStyle={setWritingFont}
                          onSound={triggerSound}
                        />
                      )}

                      {/* 2. GAMBAR (Ibis Paint Style Art Studio) */}
                      {selectedCategory === 'gambar' && (
                        <DrawingStudio
                          key={activeDraftId ?? 'new-doodle'}
                          title={doodleTitle}
                          setTitle={setDoodleTitle}
                          initialImage={doodleImageData}
                          onImageChange={handleDoodleImageChange}
                          onFirstStroke={() => setDoodleHasContent(true)}
                          onSound={triggerSound}
                        />
                      )}

                      {/* 3. IDE & BRAINSTORM (Mindmap / Sticky Notes) */}
                      {selectedCategory === 'ide' && (
                        <IdeaStudio
                          title={ideaTitle}
                          setTitle={setIdeaTitle}
                          body={ideaBody}
                          setBody={setIdeaBody}
                          onSound={triggerSound}
                        />
                      )}

                      {/* 4. KOLASE & MOODBOARD (Interactive Sticker & Photo Canvas) */}
                      {selectedCategory === 'komik' && (
                        <CollageStudio
                          title={moodTitle}
                          setTitle={setMoodTitle}
                          initialData={moodCollageData}
                          onCollageDataChange={setMoodCollageData}
                          onSound={triggerSound}
                        />
                      )}

                      {/* 5. TANTANGAN & GAMES (Truth or Dare Studio) */}
                      {selectedCategory === 'games' && (
                        <ChallengeStudio
                          title={challengeTitle}
                          setTitle={setChallengeTitle}
                          answer={challengeAnswer}
                          setAnswer={setChallengeAnswer}
                          proofImage={challengeProofImage}
                          setProofImage={setChallengeProofImage}
                          onSound={triggerSound}
                        />
                      )}

                      {/* CAPTION & UPLOAD BAR */}
                      <div className="mt-6 pt-5 border-t-2 border-dashed border-[#302541]/20 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                        <div className="md:col-span-8">
                          <label className="block text-[10px] font-black uppercase text-[#746B7C] mb-1">
                            POST CAPTION
                          </label>
                          <input
                            type="text"
                            value={postCaption}
                            onChange={(e) => setPostCaption(e.target.value)}
                            placeholder="Add a caption (optional)..."
                            className="w-full bg-[#FFFAF1] px-3.5 py-2.5 rounded-xl border-2 border-[#302541] font-bold text-xs sm:text-sm focus:outline-none"
                          />
                        </div>

                        <div className="md:col-span-4 pt-1 md:pt-4 flex flex-col sm:flex-row gap-2">
                          <button
                            type="button"
                            onClick={activeDraftId ? handleSaveDraftChanges : handleSaveNewDraft}
                            disabled={isSavingDraft}
                            title="Save this post as a draft"
                            className="flex-1 bg-[#FFD978] hover:bg-[#ffe08a] text-[#302541] font-black py-3 px-3 rounded-xl border-[2.5px] border-[#302541] shadow-[4px_4px_0px_#302541] flex items-center justify-center gap-1.5 text-xs sm:text-sm cursor-pointer active:translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-wait whitespace-nowrap"
                          >
                            <Folder className="w-4 h-4 shrink-0" />
                            <span>{isSavingDraft ? 'Saving...' : 'SAVE DRAFT'}</span>
                          </button>
                          <button
                            type="submit"
                            className="flex-[1.3] bg-[#FF385C] hover:bg-[#ff5273] text-white font-black py-3 px-3 rounded-xl border-[2.5px] border-[#302541] shadow-[4px_4px_0px_#302541] flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer active:translate-y-0.5 transition-all whitespace-nowrap"
                          >
                            <Send className="w-4 h-4 shrink-0" />
                            <span>{activeDraftId ? 'PUBLISH!' : 'POST!'}</span>
                          </button>
                        </div>
                      </div>

                    </form>
                  </section>
                </div>
              )}
            </div>
          )}


        </main>

        {/* ================= KONFIRMASI KELUAR STUDIO (ADA ISI → MENDING DIPERLANJUT) ================= */}
        {activePage === 'create' &&
          showExitConfirm &&
          createPortal(
            <div
              className="fixed inset-0 z-[9999] bg-[#302541]/65 backdrop-blur-sm flex items-center justify-center p-3 md:p-5"
              onClick={(e) => {
                if (e.target === e.currentTarget) setShowExitConfirm(false);
              }}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Confirm exit studio"
                className="bg-[#FFFAF1] rounded-[28px] border-[3px] border-[#302541] shadow-[6px_6px_0px_#302541] w-full max-w-md p-5 sm:p-6"
              >
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[#FFE2D8] border-[3px] border-[#302541] shadow-[3px_3px_0px_#302541] flex items-center justify-center text-3xl">
                  ⚠️
                </div>
                <h3 className="text-xl font-black text-[#302541] font-display text-center mb-1.5">
                  Discard your changes?
                </h3>
                <p className="text-sm font-bold text-[#746B7C] text-center mb-5">
                  Your changes haven’t been posted or saved as a draft. If you leave, they’ll be lost.
                </p>

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      triggerSound('pop');
                      setShowExitConfirm(false);
                      resetStudioForm();
                      clearDraftContext();
                      setCreateStep('pick');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex-1 bg-white hover:bg-[#FFF0DF] text-[#FF385C] font-black py-2.5 px-3 rounded-xl border-2 border-[#302541] shadow-[2px_2px_0px_#302541] text-xs cursor-pointer active:translate-y-0.5 transition-all"
                  >
                    Discard &amp; Leave
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerSound('click');
                      setShowExitConfirm(false);
                    }}
                    className="flex-1 bg-[#FFD978] hover:bg-[#ffe08a] text-[#302541] font-black py-2.5 px-3 rounded-xl border-2 border-[#302541] shadow-[2px_2px_0px_#302541] text-xs cursor-pointer active:translate-y-0.5 transition-all"
                  >
                    Keep Editing
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

        {/* ================= MODAL KONFIRMASI PINDAH KATEGORI ================= */}
        {showCategorySwitchConfirm &&
          createPortal(
            <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#302541]/60 p-4 backdrop-blur-sm">
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Confirm switch category"
                className="bg-[#FFFAF1] rounded-[28px] border-[3px] border-[#302541] shadow-[6px_6px_0px_#302541] w-full max-w-md p-5 sm:p-6 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[#FFE2D8] border-[3px] border-[#302541] shadow-[3px_3px_0px_#302541] flex items-center justify-center text-3xl">
                  ⚠️
                </div>
                <h3 className="text-xl font-black text-[#302541] font-display text-center mb-1.5">
                  Discard your current work?
                </h3>
                <p className="text-sm font-bold text-[#746B7C] text-center mb-5 leading-relaxed">
                  You have unsaved changes in this studio. If you switch to another category now, your work in this studio will be lost. Are you sure you want to switch?
                </p>

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      triggerSound('pop');
                      setShowCategorySwitchConfirm(false);
                      resetStudioForm();
                      if (pendingCategory) {
                        setSelectedCategory(pendingCategory);
                      }
                      setPendingCategory(null);
                    }}
                    className="flex-1 bg-white hover:bg-[#FFF0DF] text-[#FF385C] font-black py-2.5 px-3 rounded-xl border-2 border-[#302541] shadow-[2px_2px_0px_#302541] text-xs cursor-pointer active:translate-y-0.5 transition-all"
                  >
                    Discard &amp; Switch
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerSound('click');
                      setShowCategorySwitchConfirm(false);
                      setPendingCategory(null);
                    }}
                    className="flex-1 bg-[#FFD978] hover:bg-[#ffe08a] text-[#302541] font-black py-2.5 px-3 rounded-xl border-2 border-[#302541] shadow-[2px_2px_0px_#302541] text-xs cursor-pointer active:translate-y-0.5 transition-all"
                  >
                    Keep Editing
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

        {/* ================= TOAST DRAF ================= */}
        {draftToast &&
          createPortal(
            <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[10000] pointer-events-none">
              <div className="bg-[#302541] text-[#FFFAF1] font-black text-xs sm:text-sm px-5 py-3 rounded-2xl border-[3px] border-[#FFD978] shadow-[4px_4px_0px_#FF385C] flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
                <span>📁</span>
                <span>{draftToast}</span>
              </div>
            </div>,
            document.body
          )}

        {/* ================= MODAL EDIT PROFIL ================= */}
        {isEditingProfile && (
          <div className="fixed inset-0 z-[100] bg-[#302541]/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="bg-[#FFFAF1] rounded-[32px] border-[3px] border-[#302541] shadow-[6px_6px_0px_#302541] max-w-lg w-full my-auto max-h-[88vh] flex flex-col relative overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-5 py-4 border-b-[3px] border-[#302541] flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✨</span>
                  <h3 className="text-lg sm:text-xl font-black text-[#302541] font-display">
                    Edit Creator Profile
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="w-9 h-9 rounded-xl bg-[#FFFAF1] border-2 border-[#302541] font-black text-sm flex items-center justify-center cursor-pointer hover:bg-[#FF385C] hover:text-white transition-colors shrink-0"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs sm:text-sm font-black uppercase tracking-wide text-[#302541]">
                      Choose Avatar
                    </label>
                    <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-xl border-2 border-[#302541] text-xs font-black text-[#302541]">
                      <span className="text-[#746B7C]">Selected:</span>
                      <AvatarIcon id={currentUser.avatar} className="w-6 h-6 rounded-full" />
                    </div>
                  </div>
                  <div className="bg-white p-2.5 sm:p-3 rounded-2xl border-[3px] border-[#302541] shadow-[2px_2px_0px_#302541]">
                    <div className="grid grid-cols-5 gap-2 max-h-48 sm:max-h-56 overflow-y-auto p-1">
                      {Array.from({ length: 25 }, (_, i) => i).map((av) => (
                        <button
                          key={av}
                          type="button"
                          onClick={() => setCurrentUser({ ...currentUser, avatar: String(av) })}
                          className={`p-1.5 rounded-xl border-2 transition-all flex items-center justify-center cursor-pointer ${
                            String(currentUser.avatar) === String(av)
                              ? 'bg-[#FFD978] border-[#302541] ring-2 ring-[#FF385C] shadow-[2px_2px_0px_#302541]'
                              : 'bg-[#FFFAF1] border-[#302541]/15 hover:border-[#302541] hover:bg-white'
                          }`}
                        >
                        <AvatarIcon id={av} className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white" />                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-black uppercase mb-1.5 text-[#302541] tracking-wide">
                    Username
                  </label>
                  <input
                    type="text"
                    value={currentUser.username}
                    onChange={(e) =>
                      setCurrentUser({
                        ...currentUser,
                        username: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                      })
                    }
                    className="w-full bg-white px-3.5 py-2.5 rounded-xl border-[2.5px] border-[#302541] shadow-[2px_2px_0px_#302541] font-black text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD978]"
                  />
                </div>
              </div>

              <div className="p-3 sm:p-4 bg-white border-t-[3px] border-[#302541] shrink-0">
                <button
                  type="button"
                  onClick={async () => {
                    triggerSound('chime');
                    setIsEditingProfile(false);
                    try {
                      await fetch(`http://localhost:8001/api/users/${currentUser.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          username: currentUser.username,
                          avatar: String(currentUser.avatar),
                          bio: currentUser.bio
                        })
                      });
                    } catch (e) {
                      console.warn('Failed to sync with the server:', e);
                    }
                  }}
                  className="w-full bg-[#FF385C] text-white font-black py-3 rounded-xl border-[2.5px] border-[#302541] shadow-[3px_3px_0px_#302541] text-sm cursor-pointer hover:bg-[#ff5273] active:translate-y-0.5 transition-all"
                >
                  SAVE PROFILE →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

