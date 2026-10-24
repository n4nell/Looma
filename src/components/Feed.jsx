import { Lightbulb, Loader2, Search, Shuffle, TrendingUp, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { getTodayChallenge } from '../utils/challenges';
import AvatarIcon from './AvatarIcon';
import PostCard from './PostCard';

const CREATIVE_SPARKS = [
  '🎨 Gambar ekspresimu cuma pakai tiga garis!',
  '✍️ Tulis puisi 3 baris tentang kopi yang keburu dingin.',
  '💡 Pikirkan ide aplikasi paling aneh yang tetap ada gunanya.',
  '📌 Bikin mood board bertema hujan dan kenangan.',
  '🎲 Coba seharian tidak mengucapkan kata "tapi"!',
  '🖼️ Gambar pemandangan impianmu hanya dari bentuk-bentuk geometris.',
  '📖 Tulis cerita pendek yang dimulai dengan kalimat: "Pintu itu tidak pernah ada sebelumnya."',
  '🌈 Buat palet warna 5 warna yang menggambarkan suasana hatimu hari ini.',
  '🦋 Tulis surat untuk dirimu 10 tahun yang akan datang.',
  '🎵 Buat lirik lagu tentang benda paling biasa di mejamu.',
  '🌙 Gambar mimpimu semalam, sekreatif mungkin!',
  '💭 Tuliskan 3 "what if" paling liar yang pernah terpikirkan.',
  '🎭 Buat karakter fiksi dari kepribadian campuran 2 orang yang kamu kenal.',
  '🌿 Desain logo sederhana untuk komunitas khayalanmu.',
  '🚀 Tuliskan pitch 30 detik untuk ide bisnis paling absurd yang tetap bisa cuan.',
  '🎪 Gambar hewan baru hasil kombinasi tiga hewan berbeda.',
  '📝 Tulis dialog singkat antara matahari dan bulan saat mereka bertemu.',
  '🏠 Desain rumah impian dengan aturan: setiap ruangan punya tema warna berbeda.',
  '🔮 Buat ramalan zodiak palsu yang terdengar sangat meyakinkan.',
  '🎨 Coba teknik "blind drawing": gambar tanpa melihat kertasmu!',
  '📚 Rewrite ending favoritmu dari film atau buku yang pernah kamu tonton/baca.',
  '🌊 Tuliskan 5 kata yang terasa seperti "laut" bagimu.',
  '🦄 Gambar hewan mitologis versimu sendiri dan beri nama + kekuatan uniknya.',
  '🍵 Tulis resep minuman ajaib yang bisa mengubah satu hal dalam hidupmu.',
  '🗺️ Buat peta dunia fiksi lengkap dengan nama kerajaan dan ibu kotanya.',
  '⚡ Tuliskan manifesto kreatifmu dalam tepat 10 kata.',
  '🎯 Gambar "self-portrait" tanpa menggambar wajah — hanya dengan simbol dan objek.',
  '🌸 Buat koleksi "micro-poem" 3 kata yang menggambarkan musim favoritmu.',
  '🧩 Ciptakan teka-teki dengan jawaban yang kamu sendiri buat.',
  '🦊 Tulis monolog dari sudut pandang barangmu yang paling sering kamu gunakan.',
  '🎶 Tulis lagu anak-anak versi remix dewasa yang lucu dan nostalgic.',
  '🏔️ Gambar gunung yang di puncaknya ada hal paling tidak terduga.',
  '🤝 Tulis surat permintaan maaf yang tulus untuk dirimu sendiri.',
  '🪐 Bayangkan planet baru: apa namanya, siapa penghuninya, dan apa makanan khasnya?',
  '🎬 Buat sinopsis film 1 kalimat yang bikin semua orang langsung penasaran.',
  '🧪 Racik "potion" fiksi dengan 3 benda di sekitarmu, tulis fungsinya, dan foto.',
  '🎭 Mainkan peran sebagai kritus seni: ulas karyamu sendiri dengan gaya paling serius.',
  '📦 Buka kardus atau laci acak: pilih 3 benda, hubungkan jadi satu cerita pendek.',
  '⏰ Tulis "to-do list" untuk dirimu 5 tahun lalu — apa yang kamu ingin dia kerjakan?',
];

const CATEGORY_META = {
  menulis: ['Writing', '#FFE2D8', '✍️'],
  gambar: ['Drawing', '#FFD978', '🎨'],
  ide: ['Ideas', '#BAE6FD', '💡'],
  komik: ['Mood Board', '#FFE2D8', '📌'],
  games: ['Challenges', '#A8D8B9', '🎮'],
};

function CreatorProfileDialog({ creator, posts, onClose }) {
  if (!creator) return null;
  const creatorId = creator.id ?? creator.user_id ?? creator.owner?.id;
  const username = creator.username || creator.owner?.username || 'creator';
  const creatorPosts = posts.filter((post) => {
    const postCreatorId = post.owner?.id ?? post.user_id;
    return creatorId != null
      ? String(postCreatorId) === String(creatorId)
      : (post.owner?.username || post.username) === username;
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#302541]/60 p-3 sm:p-6 backdrop-blur-sm" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-label={`Creator profile ${username}`} className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-[28px] border-[3px] border-[#302541] bg-[#FFFAF1] shadow-[8px_8px_0px_#302541] animate-in zoom-in-95 duration-150">
        <header className="flex items-center justify-between border-b-2 border-[#302541]/10 bg-white px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <h2 className="font-display text-lg font-black text-[#302541]">Creator Profile</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close profile" className="rounded-full p-2 hover:bg-[#FFFAF1] border-2 border-transparent hover:border-[#302541] transition-all">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="overflow-y-auto p-5 space-y-4">
          {/* Header Card Profile */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border-[2.5px] border-[#302541] bg-white p-5 shadow-[3px_3px_0px_#302541]">
            <div className="flex items-center gap-4 min-w-0">
              <div className="shrink-0">
                <AvatarIcon
                  id={String(creator.avatar || creator.owner?.avatar || '12')}
                  style={{ backgroundColor: '#FFFFFF' }}
                  className="h-16 w-16 rounded-full border-[2.5px] border-[#302541] bg-white"
                />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-xl font-black text-[#302541]">
                  {creator.full_name || creator.owner?.full_name || `@${username}`}
                </h3>
                <p className="text-sm font-bold text-[#FF8A00]">@{username}</p>
                <span className="inline-block mt-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-[#FFE2D8] text-[#302541] border border-[#302541]">
                  {creator.role || creator.owner?.role || 'Looma Creator'}
                </span>
              </div>
            </div>

            {/* Stats Counter (Instagram Style) */}
            <div className="flex items-center justify-around sm:justify-end gap-3 sm:gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#302541]/10">
              <div className="text-center px-4 py-1.5 bg-[#FFFAF1] rounded-xl border border-[#302541]/30">
                <span className="block text-base font-black text-[#302541]">{creatorPosts.length}</span>
                <span className="text-[10px] font-bold text-[#746B7C] uppercase">Posts</span>
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div className="bg-white rounded-2xl border-[2px] border-[#302541] p-4 shadow-[2px_2px_0px_#302541]">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#746B7C] mb-1.5">About Creator</h4>
            <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-[#302541]">
              {creator.bio || creator.owner?.bio || 'This creator has not written a bio yet.'}
            </p>
          </div>

          {/* Posts Feed by this creator */}
          <div>
            <h4 className="mb-3 font-display text-base font-black text-[#302541] flex items-center justify-between">
              <span>Posts by @{username}</span>
              <span className="text-xs font-bold text-[#746B7C]">{creatorPosts.length} posts</span>
            </h4>
            {creatorPosts.length ? (
              <div className="space-y-3">
                {creatorPosts.map((post) => (
                  <article key={post.id} className="rounded-2xl border-2 border-[#302541] bg-white p-4 shadow-[2px_2px_0px_#302541]">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h5 className="truncate font-black text-[#302541] text-base">{post.title || 'Untitled Post'}</h5>
                      <span className="shrink-0 rounded-full border border-[#302541] bg-[#FFD978] px-2.5 py-0.5 text-[10px] font-black uppercase">
                        {post.categoryLabel || post.category_label || post.category_id || post.categoryId || 'Post'}
                      </span>
                    </div>
                    {post.image_url && (
                      <img
                        src={post.image_url}
                        alt={post.title || 'Creator posts'}
                        className="mb-2 max-h-64 w-full rounded-xl border border-[#302541]/20 object-contain bg-[#FFFAF1]"
                      />
                    )}
                    <p className="whitespace-pre-wrap text-sm font-medium text-[#746B7C]">
                      {post.caption || post.body_text || post.bodyText || ''}
                    </p>
                    <div className="mt-3 pt-2 border-t border-[#302541]/10 flex items-center gap-4 text-xs font-bold text-[#746B7C]">
                      <span>❤️ {post.likes_count || 0} Likes</span>
                      <span>💬 {post.comments?.length || 0} Comments</span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="rounded-xl bg-white p-6 text-center text-sm font-semibold text-[#746B7C] border-2 border-[#302541]/20">
                This creator hasn&rsquo;t shared any public posts yet.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function Feed({
  currentUser,
  posts = [],
  onLike,
  onSave,
  onComment,
  onEdit,
  onDelete,
  onDeleteComment,
  onTogglePinComment,
  onMoveToDraft,
  onJoinChallenge,
  challengeInfo,
  onNavigateToCreatorProfile,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedCreator, setSelectedCreator] = useState(null);

  // Instagram-style Creator Search State
  const [creatorSearchResults, setCreatorSearchResults] = useState([]);
  const [isSearchingCreators, setIsSearchingCreators] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem('looma_recent_creator_searches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const searchContainerRef = useRef(null);

  // Close search popover on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search for creators (Instagram style)
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setCreatorSearchResults([]);
      setIsSearchingCreators(false);
      return undefined;
    }
    setIsSearchingCreators(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`http://localhost:8001/api/users/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setCreatorSearchResults(Array.isArray(data) ? data : []);
        } else {
          setCreatorSearchResults([]);
        }
      } catch (err) {
        console.error('Failed searching creators:', err);
        setCreatorSearchResults([]);
      } finally {
        setIsSearchingCreators(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectCreator = (creator) => {
    setIsSearchFocused(false);

    // Save to recent searches (up to 5 unique creators)
    setRecentSearches((prev) => {
      const filtered = prev.filter((c) => c.id !== creator.id && c.username !== creator.username);
      const updated = [creator, ...filtered].slice(0, 6);
      try {
        localStorage.setItem('looma_recent_creator_searches', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (onNavigateToCreatorProfile) {
      onNavigateToCreatorProfile(creator);
    } else {
      setSelectedCreator(creator);
    }
  };

  const handleRemoveRecent = (e, creatorId) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((c) => c.id !== creatorId);
      try {
        localStorage.setItem('looma_recent_creator_searches', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleClearAllRecent = (e) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem('looma_recent_creator_searches');
    } catch {}
  };

  const [suggestedCreators, setSuggestedCreators] = useState([]);

  const fetchSuggestedCreators = () => {
    const userId = currentUser?.id;
    const query = userId != null ? `?user_id=${encodeURIComponent(userId)}` : '';
    fetch(`http://localhost:8001/api/users/suggested${query}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setSuggestedCreators(Array.isArray(data) ? data.filter((creator) => creator?.id != null && creator?.username) : []))
      .catch(() => setSuggestedCreators([]));
  };

  const fetchLeaderboard = () => {
    fetch('http://localhost:8001/api/users/leaderboard')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setLeaderboard(Array.isArray(data) ? data : []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchSuggestedCreators();
    fetchLeaderboard();
  }, [currentUser?.id]);

  // Refresh leaderboard tiap XP user berubah (abis nyelesain tantangan)
  useEffect(() => {
    fetchLeaderboard();
    fetchSuggestedCreators();
  }, [currentUser?.xp, currentUser?.id]);

  const visibleCreatorResults = (searchQuery.trim() ? creatorSearchResults : suggestedCreators)
    .filter((creator) => {
      if (creator?.id != null && currentUser?.id != null) {
        return String(creator.id) !== String(currentUser.id);
      }
      return String(creator?.username || '').trim().toLowerCase() !==
        String(currentUser?.username || '').trim().toLowerCase();
    });

  // Pemetaan dwibahasa (Bilingual Category Keywords)
  const CATEGORY_KEYWORDS = {
    menulis: ['menulis', 'tulisan', 'puisi', 'cerita', 'sastra', 'writing', 'poem', 'poetry', 'story', 'literature', 'quote', 'quotes', 'journal'],
    gambar: ['gambar', 'menggambar', 'lukisan', 'sketsa', 'coretan', 'drawing', 'draw', 'sketch', 'doodle', 'doodles', 'illustration', 'art'],
    ide: ['ide', 'gagasan', 'inovasi', 'proyek', 'rencana', 'ideas', 'idea', 'brainstorming', 'project', 'startup', 'concept'],
    komik: ['komik', 'kolase', 'stiker', 'suasana', 'mood board', 'mood', 'collage', 'stickers', 'zine', 'poster'],
    games: ['games', 'game', 'tantangan', 'permainan', 'kuis', 'truth', 'dare', 'challenge', 'challenges', 'play'],
  };

  const filteredPosts = posts.filter(p => {
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLocaleLowerCase();
      const catId = (p.category_id || p.categoryId || '').toLowerCase();
      const meta = CATEGORY_META[catId];
      const enLabel = meta ? meta[0].toLowerCase() : '';
      const keywords = CATEGORY_KEYWORDS[catId] || [];

      // Periksa apakah query cocok dengan alias kategori dwibahasa
      const matchesCategoryKeywords = keywords.some(k => k.includes(q) || q.includes(k));

      const searchableText = [
        p.categoryLabel,
        p.category_label,
        p.categoryId,
        p.category_id,
        catId,
        enLabel,
        p.username,
        p.owner?.username,
        p.owner?.full_name,
        p.title,
        p.caption,
      ].filter(Boolean).join(' ').toLocaleLowerCase();

      return searchableText.includes(q) || matchesCategoryKeywords;
    }
    return true;
  });

  const [sparkIndex, setSparkIndex] = useState(() => Math.floor(Math.random() * CREATIVE_SPARKS.length));

  const handleNextSpark = () => {
    setSparkIndex((prev) => {
      let next;
      do { next = Math.floor(Math.random() * CREATIVE_SPARKS.length); } while (next === prev && CREATIVE_SPARKS.length > 1);
      return next;
    });
  };

  const todayChallenge = getTodayChallenge();

  const categoryCounts = posts.reduce((acc, p) => {
    const catId = p.category_id || p.categoryId || 'lainnya';
    acc[catId] = (acc[catId] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-center">
      <div className="mx-auto w-full min-w-0 max-w-2xl space-y-5 sm:space-y-6 lg:mx-0">
        <div className="bg-white rounded-[24px] sm:rounded-full border-[3px] border-[#302541] shadow-[4px_4px_0px_#302541] p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 px-4 sm:px-6">
          <h2 className="text-lg sm:text-xl font-black text-[#302541] font-display flex items-center gap-2">
            <span>✨</span> Community Feed
          </h2>
          {/* Instagram-style Creator Search Bar with Floating Popover Dropdown */}
          <div ref={searchContainerRef} className="relative w-full sm:w-80">
            <div className={`flex items-center bg-[#FFFAF1] rounded-full border-[2.5px] border-[#302541] px-4 py-2 transition-all ${isSearchFocused ? 'shadow-[4px_4px_0px_#302541] bg-white ring-2 ring-[#FFD978]' : 'hover:border-[#302541]'}`}>
              {isSearchingCreators ? (
                <Loader2 className="w-4 h-4 text-[#FF8A00] mr-2.5 shrink-0 animate-spin" />
              ) : (
                <Search className="w-4 h-4 text-[#746B7C] mr-2.5 shrink-0" />
              )}
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search creators or categories..."
                style={{ fontSize: '13px' }}
                className="w-full font-bold bg-transparent focus:outline-none placeholder:text-[#746B7C] text-[#302541]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 rounded-full text-[#746B7C] hover:bg-[#302541]/10 hover:text-[#302541] transition-colors ml-1"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Instagram-style Popover Result Dropdown */}
            {isSearchFocused && (
              <div className="absolute right-0 left-0 sm:-right-4 sm:-left-4 top-full mt-2.5 z-50 bg-white border-[2.5px] border-[#302541] rounded-[24px] shadow-[6px_6px_0px_#302541] overflow-hidden max-h-[420px] flex flex-col animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Search query header */}
                <div className="px-4 py-3 bg-[#FFFAF1] border-b-[2px] border-[#302541]/10 flex items-center justify-between shrink-0">
                  <span className="text-xs font-black uppercase tracking-wider text-[#302541]">
                    {searchQuery.trim() ? 'Search Results' : recentSearches.length > 0 ? 'Recent' : 'Suggested for You'}
                  </span>
                  {!searchQuery.trim() && recentSearches.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllRecent}
                      className="text-xs font-bold text-[#FF8A00] hover:underline cursor-pointer"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* List of creators */}
                <div className="overflow-y-auto divide-y divide-[#302541]/5 p-2 flex-1">
                  {/* Mode: Recent searches when input is empty */}
                  {!searchQuery.trim() && recentSearches.length > 0 && (
                    <div className="mb-2">
                      {recentSearches.map((creator) => (
                        <div
                          key={`recent-${creator.id || creator.username}`}
                          onClick={() => handleSelectCreator(creator)}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#FFFAF1] cursor-pointer transition-colors group"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <AvatarIcon
                              id={String(creator.avatar || '12')}
                              style={{ backgroundColor: '#FFFFFF' }}
                              className="w-11 h-11 rounded-full border-2 border-[#302541] shrink-0 bg-white shadow-[1px_1px_0px_#302541]"
                            />
                            <div className="min-w-0 text-left">
                              <p className="font-black text-sm text-[#302541] truncate leading-tight group-hover:text-[#FF8A00] transition-colors">
                                {creator.username}
                              </p>
                              <p className="text-xs font-medium text-[#746B7C] truncate mt-0.5">
                                {creator.full_name || creator.username} {creator.posts_count != null ? `• ${creator.posts_count} posts` : ''}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handleRemoveRecent(e, creator.id)}
                            className="p-1.5 rounded-full text-[#746B7C] hover:bg-[#FFE2D8] hover:text-[#302541] transition-colors"
                            title="Remove from history"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <div className="pt-2.5 pb-1 px-3 border-t border-[#302541]/10">
                        <span className="text-[11px] font-black uppercase tracking-wider text-[#746B7C]">
                          Suggested for You
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Creator List from search results or suggested creators */}
                  {visibleCreatorResults.length > 0 ? (
                    visibleCreatorResults.map((creator) => (
                      <div
                        key={creator.id}
                        onClick={() => handleSelectCreator(creator)}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#FFFAF1] cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <AvatarIcon
                            id={String(creator.avatar || '12')}
                            style={{ backgroundColor: '#FFFFFF' }}
                            className="w-11 h-11 rounded-full border-2 border-[#302541] shrink-0 bg-white shadow-[1px_1px_0px_#302541]"
                          />
                          <div className="min-w-0 text-left">
                            <p className="font-black text-sm text-[#302541] truncate leading-tight group-hover:text-[#FF8A00] transition-colors">
                              {creator.username}
                            </p>
                            <p className="text-xs font-semibold text-[#746B7C] truncate mt-0.5">
                              {creator.full_name || creator.username}
                              {creator.posts_count != null && (
                                <span className="font-normal text-[#746B7C]/80"> • {creator.posts_count} posts</span>
                              )}
                            </p>
                            {creator.bio && (
                              <p className="text-[11px] text-[#746B7C] truncate mt-0.5 italic">
                                {creator.bio}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 pl-2">
                          <span className="text-[11px] font-black text-[#302541] bg-white group-hover:bg-[#FFD978] border-[1.5px] border-[#302541] px-3 py-1 rounded-full shadow-[1.5px_1.5px_0px_#302541] transition-all">
                            View
                          </span>
                        </div>
                      </div>
                    ))
                  ) : !isSearchingCreators ? (
                    <div className="py-8 px-4 text-center">
                      <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-[#FFFAF1] border-2 border-[#302541] flex items-center justify-center text-xl">
                        🔍
                      </div>
                      <p className="text-sm font-black text-[#302541]">No creators found</p>
                      <p className="text-xs text-[#746B7C] mt-1">Try searching for another name or username</p>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>

        {filteredPosts.length > 0 ? (
          <div>
            {filteredPosts.map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                currentUser={currentUser}
                onViewCreator={(creator) => {
                  if (onNavigateToCreatorProfile) {
                    onNavigateToCreatorProfile(creator);
                  } else {
                    setSelectedCreator(creator);
                  }
                }}
                onLike={onLike}
                onSave={onSave}
                onComment={onComment}
                onEdit={onEdit}
                onDelete={onDelete}
                onDeleteComment={onDeleteComment}
                onTogglePinComment={onTogglePinComment}
                onSaveDraft={onMoveToDraft ? (p) => onMoveToDraft(p) : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 font-bold">
            {searchQuery.trim() ? 'No posts match that category or creator.' : 'No posts yet. Be the first to share!'}
          </div>
        )}
      </div>

      {/* Sidebar Komunitas Interaktif & Kreatif */}
      <aside className="hidden w-80 shrink-0 space-y-4 lg:block">
        {/* 1. Tantangan Harian (Daily Challenge Card) - Neo-Brutalist Pop */}
        <div className="rounded-[24px] border-[2.5px] border-[#302541] bg-[#FFE2D8] p-5 shadow-[4px_4px_0px_#302541] relative overflow-hidden transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-black uppercase tracking-wider text-[#302541] flex items-center gap-1.5">
              <span>🎯</span> Today&rsquo;s Challenge
            </span>
            <span className="text-[10px] font-black uppercase bg-white border border-[#302541] px-2 py-0.5 rounded-full shadow-[1px_1px_0px_#302541]">
              Daily
            </span>
          </div>
          <p className="text-sm font-black text-[#302541] leading-snug mb-3">
            {todayChallenge.emoji} {todayChallenge.text}
          </p>
          {challengeInfo?.done ? (
            <div className="rounded-xl border-2 border-[#302541] bg-[#A8D8B9] py-2 px-3 text-center text-xs font-black text-[#302541] shadow-[2px_2px_0px_#302541]">
              Completed Today 🎉 Awesome!
            </div>
          ) : onJoinChallenge ? (
            <button
              type="button"
              onClick={onJoinChallenge}
              className="w-full rounded-xl border-2 border-[#302541] bg-[#FFD978] hover:bg-[#ffe08a] py-2.5 px-3 text-xs font-black text-[#302541] shadow-[2.5px_2.5px_0px_#302541] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>{challengeInfo?.joined ? 'Continue in Studio' : 'Join Challenge'}</span>
              <span>→</span>
            </button>
          ) : null}
        </div>

        {/* 2. Ide & Inspirasi Spontan (Creative Spark Shuffle) */}
        <div className="rounded-[24px] border-[2.5px] border-[#302541] bg-[#A8D8B9] p-5 shadow-[4px_4px_0px_#302541] transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-[#302541] flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-[#302541]" />
              <span>Creative Spark</span>
            </span>
            <button
              type="button"
              onClick={handleNextSpark}
              className="px-2 py-1 rounded-lg border-2 border-[#302541] bg-white hover:bg-[#FFD978] text-[#302541] font-black text-[11px] cursor-pointer shadow-[1.5px_1.5px_0px_#302541] transition-all flex items-center gap-1 active:translate-y-0.5"
              title="Shuffle new idea"
            >
              <Shuffle className="w-3 h-3" />
              <span>Shuffle</span>
            </button>
          </div>
          <div className="p-3.5 rounded-2xl border-2 border-[#302541] bg-white text-xs font-black text-[#302541] leading-relaxed shadow-[2px_2px_0px_#302541]">
            {CREATIVE_SPARKS[sparkIndex]}
          </div>
          <p className="mt-2 text-[10px] font-bold text-[#302541]/70 text-right">
            Need an idea? Tap shuffle anytime ⚡
          </p>
        </div>

        {/* 3. Kategori Populer (Topic Explorer) */}
        {Object.keys(categoryCounts).length > 0 && (
          <div className="bg-white rounded-[24px] border-[2.5px] border-[#302541] p-5 shadow-[4px_4px_0px_#302541]">
            <div className="flex items-center justify-between mb-3.5 px-0.5">
              <span className="text-xs font-black uppercase tracking-wider text-[#746B7C] flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#FF385C]" />
                <span>Popular Categories</span>
              </span>
              <span className="text-[10px] font-bold text-[#746B7C]">Posts</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(categoryCounts).map(([catId, count]) => {
                const meta = CATEGORY_META[catId] || [catId, '#FFD978', '✨'];
                return (
                  <button
                    key={catId}
                    type="button"
                    onClick={() => setSearchQuery(catId)}
                    style={{ backgroundColor: meta[1] }}
                    className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#302541] px-3 py-1.5 text-xs font-black uppercase tracking-wide text-[#302541] shadow-[2px_2px_0px_#302541] hover:-translate-y-0.5 active:translate-y-0 transition-transform cursor-pointer"
                    title={`Search category ${meta[0]}`}
                  >
                    <span>{meta[2]}</span>
                    <span>{meta[0]}</span>
                    <span className="rounded-full bg-[#302541] px-1.5 py-0.2 text-[9px] text-white">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. Tips Kreator Komunitas */}
        <div className="rounded-[24px] border-[2.5px] border-[#302541] bg-[#BAE6FD] p-5 shadow-[4px_4px_0px_#302541]">
          <div className="flex items-center gap-1.5 mb-2 text-xs font-black uppercase tracking-wider text-[#302541]">
            <span>💡</span>
            <span>Creator Tips</span>
          </div>
          <p className="text-xs font-bold leading-relaxed text-[#302541]">
            {"Jangan menunggu karya yang sempurna untuk mulai membagikannya. Ekspresi terbaik lahir dari keberanian untuk mencoba!"}
          </p>
        </div>
        
      </aside>
      {!onNavigateToCreatorProfile && (
        <CreatorProfileDialog creator={selectedCreator} posts={posts} onClose={() => setSelectedCreator(null)} />
      )}
    </div>
  );
}
