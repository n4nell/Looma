import { ArrowLeft, Edit2, Folder, Heart, LogOut, MessageCircle, MoreVertical, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { clearStoredUser } from '../utils/auth';
import AvatarIcon from './AvatarIcon';
import IdeaPostContent from './IdeaPostContent';
import PostCard, { ConfirmModal } from './PostCard';

// Meta kategori (warna & emoji)
const CATEGORY_META = {
  menulis: { label: 'Writing', emoji: '✍️', color: '#FFE2D8' },
  gambar: { label: 'Drawing', emoji: '🎨', color: '#FFD978' },
  ide: { label: 'Ideas', emoji: '💡', color: '#BAE6FD' },
  komik: { label: 'Mood Board', emoji: '📌', color: '#FFE2D8' },
  games: { label: 'Challenges', emoji: '🎮', color: '#A8D8B9' },
};

const ICONS = {
  uploads: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
  drafts: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
  likes: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  saved: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z',
};

export default function Profile({
  currentUser,
  onUpdateProfile,
  onToggleLike,
  onToggleSave,
  onComment,
  onDeleteComment,
  onTogglePinComment,
  onEditPost,
  onDeletePost,
  myUploadedPosts = [],
  likedPosts = [],
  savedPosts = [],
  posts = [],
  drafts = [],
  initialTab = 'uploads',
  onOpenDraft,
  onDeleteDraft,
  onSaveDraftPost,
  onLogout,
  isViewingOther = false,
  onBack,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState(null);
  // Three-dot menu on grid thumbnails (uploads tab)
  const [gridMenuPostId, setGridMenuPostId] = useState(null);
  const [postToDelete, setPostToDelete] = useState(null);
  const [openEditOnMount, setOpenEditOnMount] = useState(false);
  const gridMenuRef = useRef(null);
  const [editData, setEditData] = useState({
    username: currentUser?.username || '',
    bio: currentUser?.bio || '',
    avatar: currentUser?.avatar || '13',
  });

  // Kunci scroll background saat modal edit profil atau logout terbuka
  useEffect(() => {
    if (!showEdit && !showLogoutModal && selectedPostId === null) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setShowEdit(false);
        setShowLogoutModal(false);
        setSelectedPostId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [showEdit, showLogoutModal, selectedPostId]);

  // Close grid three-dot menu when clicking outside
  useEffect(() => {
    if (!gridMenuPostId) return;
    const handleOutside = (e) => {
      if (gridMenuRef.current && !gridMenuRef.current.contains(e.target)) {
        setGridMenuPostId(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [gridMenuPostId]);

  const animalAvatars = Array.from({ length: 25 }, (_, i) => i);

  const tabs = isViewingOther
    ? [{ id: 'uploads', label: 'Posts', icon: ICONS.uploads, count: myUploadedPosts.length }]
    : [
        { id: 'uploads', label: 'Posts', icon: ICONS.uploads, count: myUploadedPosts.length },
        { id: 'drafts', label: 'Drafts', icon: ICONS.drafts, count: drafts.length },
        { id: 'likes', label: 'Likes', icon: ICONS.likes, count: likedPosts.length },
        { id: 'saved', label: 'Saved', icon: ICONS.saved, count: savedPosts.length },
      ];

  const emptyCopy = {
    uploads: {
      emoji: '🎨',
      title: isViewingOther ? 'No posts yet' : 'No posts yet',
      text: isViewingOther ? "This creator hasn't shared any public posts yet." : 'Open Create, choose a category, and share your first post.'
    },
    drafts: { emoji: '📁', title: 'No saved drafts yet', text: 'Move a published post to Drafts using the three-dot menu in the feed, then continue editing it here.' },
    likes: { emoji: '❤️', title: 'No liked posts yet', text: 'Explore Home and like posts you enjoy.' },
    saved: { emoji: '🔖', title: 'No saved posts yet', text: 'Save your favorite posts from Home to find them here.' },
  }[activeTab];

  const handleOpenEdit = () => {
    setEditData({
      username: currentUser?.username || '',
      bio: currentUser?.bio || '',
      avatar: String(currentUser?.avatar ?? '13'),
    });
    setShowEdit(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const updated = {
      ...currentUser,
      ...editData,
      avatar: String(editData.avatar),
    };

    if (onUpdateProfile) {
      onUpdateProfile(updated);
    }
    setShowEdit(false);

    try {
      if (currentUser?.id) {
        await fetch(`http://localhost:8001/api/users/${currentUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editData),
        });
      }
    } catch (err) {
      console.warn('Backend update failed, using local profile state', err);
    }
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    clearStoredUser();
    if (onLogout) {
      onLogout();
    } else if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const getRawActivePosts = () => {
    if (activeTab === 'uploads') return myUploadedPosts;
    if (activeTab === 'likes') return likedPosts;
    if (activeTab === 'saved') return savedPosts;
    return [];
  };

  // Normalisasi data postingan agar 100% kompatibel dengan PostCard
  const activePosts = getRawActivePosts().map((p) => ({
    ...p,
    id: p.id,
    category_id: p.category_id || p.categoryId,
    post_type: p.post_type || p.postType,
    title: p.title || '',
    body_text: p.body_text || p.bodyText || p.body || '',
    image_url: p.image_url || p.imageDataUrl || p.image || null,
    caption: p.caption || '',
    likes_count: p.likes_count ?? p.likesCount ?? (p.isLiked ? 1 : 0),
    isLiked: !!(p.isLiked ?? p.is_liked),
    isSaved: !!(p.isSaved ?? p.is_saved),
    user_id: p.user_id ?? p.owner?.id,
    owner: p.owner || {
      id: p.user_id,
      username: p.username || 'user',
      avatar: p.avatarEmoji || p.avatar || '13',
      avatar_bg: p.avatarBg || '#FFD978',
      role: p.userRole || 'Looma Creator',
    },
    comments: p.comments || [],
  }));

  // Post yang sedang dibuka di modal (selalu ambil data terbaru)
  const selectedPost = activePosts.find((p) => String(p.id) === String(selectedPostId));
  const selectedPostIndex = activePosts.findIndex((p) => String(p.id) === String(selectedPostId));

  const selectAdjacentPost = (offset) => {
    const nextPost = activePosts[selectedPostIndex + offset];
    if (nextPost) setSelectedPostId(nextPost.id);
  };

  // Total apresiasi yang diterima oleh karya kreator ini
  const totalLikesReceived = myUploadedPosts.reduce((acc, p) => acc + (p.likes_count ?? p.likesCount ?? 0), 0);
  const totalCommentsReceived = myUploadedPosts.reduce((acc, p) => acc + (p.comments?.length ?? 0), 0);

  const stats = isViewingOther
    ? [
        { label: 'Posts', value: myUploadedPosts.length, bg: '#FFE2D8' },
        { label: 'Likes', value: totalLikesReceived, bg: '#FFD978' },
        { label: 'Comments', value: totalCommentsReceived, bg: '#BAE6FD' },
      ]
    : [
        { label: 'Posts', value: myUploadedPosts.length, bg: '#FFE2D8' },
        { label: 'Drafts', value: drafts.length, bg: '#A8D8B9' },
        { label: 'Likes', value: likedPosts.length, bg: '#FFD978' },
        { label: 'Saved', value: savedPosts.length, bg: '#BAE6FD' },
      ];

  return (
    <div className="max-w-5xl mx-auto pb-10">
      {/* Tombol Back jika sedang melihat profil kreator lain */}
      {isViewingOther && onBack && (
        <div className="mb-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border-[2.5px] border-[#302541] shadow-[3px_3px_0px_#302541] font-black text-sm text-[#302541] hover:bg-[#FFD978] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Feed</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-5 lg:gap-6 items-start">
        {/* ============ KOLOM KIRI: KARTU PROFIL ============ */}
        <aside className="lg:sticky lg:top-24 bg-[#FFFAF1] rounded-[28px] border-[3px] border-[#302541] shadow-[6px_6px_0px_#302541] overflow-hidden">
          {/* Banner dekoratif */}
          <div className="relative h-28 bg-[#FFD978] border-b-[3px] border-[#302541] overflow-hidden">
            <div
              className="absolute inset-0 opacity-20"
              style={{ backgroundImage: 'radial-gradient(#302541 1.5px, transparent 1.5px)', backgroundSize: '16px 16px' }}
            />
            <div className="absolute -left-5 -top-7 w-24 h-24 rounded-full bg-[#FFE2D8] border-[3px] border-[#302541]" />
            <div className="absolute left-[30%] top-4 w-12 h-12 rounded-xl bg-[#A8D8B9] border-[3px] border-[#302541] rotate-12" />
            <div className="absolute left-[52%] -bottom-7 w-20 h-20 rounded-full bg-[#BAE6FD] border-[3px] border-[#302541]" />
            <div className="absolute right-[12%] top-3 w-10 h-10 rounded-lg bg-[#FFE2D8] border-[3px] border-[#302541] -rotate-12" />
            <div className="absolute -right-5 -bottom-5 w-20 h-20 rounded-full bg-[#BAE6FD] border-[3px] border-[#302541]" />
          </div>

          <div className="px-5 pb-5">
            {/* Avatar & Action Button di Header */}
            <div className="flex items-start justify-between gap-3">
              <AvatarIcon
                id={currentUser?.avatar || '13'}
                style={{ backgroundColor: '#FFFFFF' }}
                className="relative z-10 -mt-12 w-24 h-24 rounded-full border-[3px] border-[#302541] shadow-[3px_3px_0px_#302541] shrink-0 bg-white"
              />
              <div className="mt-3 flex items-center gap-2">
                {!isViewingOther ? (
                  <>
                    <button
                      type="button"
                      onClick={handleOpenEdit}
                      className="bg-white text-[#302541] px-3.5 py-2 rounded-xl font-black text-xs sm:text-sm border-[2.5px] border-[#302541] shadow-[2.5px_2.5px_0px_#302541] hover:bg-[#FFD978] hover:-translate-y-0.5 hover:shadow-[3.5px_3.5px_0px_#302541] active:translate-y-0 active:shadow-[1px_1px_0px_#302541] transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.768-6.768a2.5 2.5 0 013.536 3.536L12.536 16.536 8 18l1-5z" />
                      </svg>
                      <span>Edit Profile</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowLogoutModal(true)}
                      className="bg-[#FFF9F2] text-[#302541] hover:bg-[#FFE2D8] p-2 rounded-xl border-[2.5px] border-[#302541] shadow-[2.5px_2.5px_0px_#302541] hover:-translate-y-0.5 hover:shadow-[3.5px_3.5px_0px_#302541] active:translate-y-0 active:shadow-[1px_1px_0px_#302541] transition-all cursor-pointer flex items-center justify-center"
                      title="Log out"
                      aria-label="Logout"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <span className="bg-[#FFE2D8] text-[#302541] px-3 py-1.5 rounded-xl font-black text-xs border-[2px] border-[#302541] shadow-[2px_2px_0px_#302541]">
                    Creator
                  </span>
                )}
              </div>
            </div>

            {/* Identitas */}
            <div className="mt-3">
              <h2 className="text-2xl font-black text-[#302541] font-display leading-tight break-all">
                @{currentUser?.username || 'creative_user'}
              </h2>
              <span className="inline-block mt-2 px-3 py-1 rounded-full bg-[#FFD978] text-[#302541] border-2 border-[#302541] text-xs font-black">
                {currentUser?.role || 'Looma Creator'}
              </span>
              <p className="mt-3 text-sm font-bold text-[#302541]/80 leading-relaxed">
                {currentUser?.bio || 'Start creating on Looma! ✨ Make something today.'}
              </p>
            </div>

            {/* Statistik ringkas */}
            <div className={`grid ${stats.length === 3 ? 'grid-cols-3' : 'grid-cols-2'} gap-2 mt-4`}>
              {stats.map((s) => (
                <div
                  key={s.label}
                  style={{ backgroundColor: s.bg }}
                  className="rounded-xl border-[2.5px] border-[#302541] shadow-[2px_2px_0px_#302541] py-2 text-center"
                >
                  <div className="font-black text-xl tabular-nums text-[#302541] leading-none">{s.value}</div>
                  <div className="text-[11px] font-black text-[#302541]/80 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ============ KOLOM KANAN: POSTINGAN ============ */}
        <section className="min-w-0 space-y-4">
          {/* Header Bar: Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div role="tablist" className="flex gap-1.5 p-1.5 bg-white rounded-2xl border-[3px] border-[#302541] shadow-[3px_3px_0px_#302541] flex-1">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setSelectedPostId(null);
                    }}
                    className={`flex-1 py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 font-black text-xs sm:text-sm transition-all cursor-pointer border-2 ${
                      isActive
                        ? 'bg-[#FFD978] text-[#302541] border-[#302541] shadow-[2px_2px_0px_#302541]'
                        : 'bg-transparent text-[#302541]/55 border-transparent hover:text-[#302541] hover:bg-[#FFFAF1]'
                    }`}
                  >
                    <svg className="w-4 h-4 shrink-0" fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={isActive ? '0' : '2.5'} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                    </svg>
                    <span>{tab.label}</span>
                    <span className={`min-w-[18px] px-1 rounded-full text-[10px] sm:text-[11px] tabular-nums ${isActive ? 'bg-[#302541] text-[#FFD978]' : 'bg-[#302541]/10'}`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Area Postingan & Draf */}
          {activeTab === 'drafts' ? (
            drafts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {drafts.map((draft) => {
                  const meta = CATEGORY_META[draft.category_id] || { label: 'Posts', emoji: '📁', color: '#FFD978' };
                  const isDoodle = (draft.post_type === 'doodle') && draft.image_url;
                  const isMoodboard = draft.post_type === 'moodboard';
                  const isChallenge = draft.post_type === 'challenge';
                  const isIdea = draft.post_type === 'idea' || draft.category_id === 'ide';
                  const bodyHtml = draft.body_text || '';
                  const isHtmlBody = typeof bodyHtml === 'string' && /<[a-z][\s\S]*>/i.test(bodyHtml);
                  const plainBody = bodyHtml.replace(/<[^>]+>/g, '').trim();
                  let extraData = {};
                  try { if (draft.draft_data) extraData = JSON.parse(draft.draft_data); } catch (_) {}

                  return (
                    <div
                      key={draft.id}
                      className="bg-white rounded-[28px] border-[3px] border-[#302541] shadow-[4px_4px_0px_#302541] hover:shadow-[6px_6px_0px_#302541] hover:-translate-y-0.5 transition-all flex flex-col overflow-hidden"
                    >
                      {/* Card Header — mirrors Feed card header */}
                      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b-[2px] border-[#302541]/10">
                        <span
                          style={{ backgroundColor: meta.color }}
                          className="px-3 py-1 rounded-full border-2 border-[#302541] text-[10px] font-black uppercase text-[#302541] flex items-center gap-1.5 shadow-[1px_1px_0px_#302541]"
                        >
                          <span>{meta.emoji}</span>
                          <span>{meta.label}</span>
                        </span>
                        <span className="text-[10px] font-black uppercase bg-[#FFD978] border border-[#302541] px-2 py-0.5 rounded-full shadow-[1px_1px_0px_#302541]">
                          Draft
                        </span>
                      </div>

                      {/* Content area — same background & min-height as Feed card */}
                      <div
                        style={{ backgroundColor: extraData.paperTheme || undefined }}
                        className={`relative flex min-h-[200px] flex-col justify-center border-b-[2px] border-[#302541]/10 ${isIdea ? 'bg-[#FFFAF1] p-3' : 'bg-gradient-to-br from-[#FFE2D8] to-[#FFFAF1] px-5 py-6'}`}
                      >
                        {isDoodle ? (
                          <div className="flex flex-col items-center">
                            {draft.title && <h3 className="mb-2 font-display text-base font-black text-[#302541] line-clamp-1">{draft.title}</h3>}
                            <img
                              src={draft.image_url}
                              alt="Draft artwork"
                              className="max-h-48 w-full rounded-xl border-2 border-[#302541] bg-white object-contain"
                            />
                          </div>
                        ) : isIdea ? (
                          <IdeaPostContent title={draft.title} body={bodyHtml} compact />
                        ) : isChallenge ? (
                          <div className="rounded-2xl border-[2px] border-[#302541] bg-[#A8D8B9] p-3">
                            <span className="inline-block bg-[#302541] text-[#FFD978] font-black text-[10px] px-2 py-0.5 rounded-full mb-2 uppercase">
                              {/dare/i.test(draft.title || '') ? '⚡ DARE' : '🔮 TRUTH'} Challenge
                            </span>
                            <p className="text-xs font-black text-[#302541] line-clamp-2 mb-2">
                              {(draft.title || '').replace(/^(TRUTH|DARE):\s*/i, '')}
                            </p>
                            {draft.body_text && <p className="text-[11px] font-bold text-[#302541]/80 line-clamp-2">{plainBody}</p>}
                            {draft.image_url && (
                              <img src={draft.image_url} alt="Proof" className="mt-2 h-20 w-20 rounded-lg border-2 border-[#302541] object-contain bg-white" />
                            )}
                          </div>
                        ) : (
                          <div>
                            {draft.title && <h3 className="font-display text-xl font-black text-[#302541] mb-2 line-clamp-2">{draft.title}</h3>}
                            {bodyHtml ? (
                              isHtmlBody
                                ? <div className="text-sm font-bold text-[#302541]/90 line-clamp-4 leading-relaxed" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
                                : <p className="text-sm font-bold text-[#302541]/90 line-clamp-4 leading-relaxed whitespace-pre-line">{plainBody}</p>
                            ) : (
                              <p className="text-xs font-bold text-[#746B7C] italic">(No content yet)</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Caption if present */}
                      {draft.caption && (
                        <div className="px-4 py-2 text-xs font-semibold text-[#302541]/80 line-clamp-1">{draft.caption}</div>
                      )}

                      {/* Action Bar */}
                      <div className="px-4 py-3 flex items-center gap-2 border-t-[2px] border-dashed border-[#302541]/15">
                        <button
                          type="button"
                          onClick={() => onOpenDraft && onOpenDraft(draft)}
                          className="flex-1 bg-[#FFD978] hover:bg-[#ffe08a] text-[#302541] py-2.5 px-3 rounded-xl border-2 border-[#302541] shadow-[2px_2px_0px_#302541] active:translate-y-0.5 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <span>✏️</span>
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDraftToDelete(draft)}
                          className="bg-[#FFF0DF] hover:bg-[#FFE2D8] text-[#FF385C] py-2.5 px-3 rounded-xl border-2 border-[#302541] shadow-[2px_2px_0px_#302541] active:translate-y-0.5 font-black text-xs cursor-pointer transition-colors flex items-center gap-1"
                          title="Delete draft"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-14 text-center px-6 bg-white rounded-[24px] border-[3px] border-[#302541] border-dashed">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#FFFAF1] border-[3px] border-[#302541] shadow-[3px_3px_0px_#302541] flex items-center justify-center text-3xl">
                  📁
                </div>
                <h3 className="text-lg font-black text-[#302541] font-display mb-1">{emptyCopy.title}</h3>
                <p className="text-sm font-bold text-[#746B7C] max-w-xs mx-auto">{emptyCopy.text}</p>
              </div>
            )
          ) : activePosts.length > 0 ? (
            /* ----- GRID ala Instagram: hover = like & komentar, klik = modal ----- */
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {activePosts.map((post) => {
                const isDoodle = (post.post_type === 'doodle' || post.postType === 'doodle') && post.image_url;
                const meta = CATEGORY_META[post.category_id] || { label: 'Posts', emoji: '✨', color: '#FFD978' };
                const likes = post.likes_count ?? 0;
                const commentCount = post.comments_count ?? post.comments?.length ?? 0;
                const isPostOwner = String(post.user_id ?? post.owner?.id) === String(currentUser?.id) ||
                                    Boolean(post.owner?.username && post.owner.username === currentUser?.username);

                return (
                  <div
                    key={post.id}
                    className="group relative aspect-square rounded-[22px] bg-white overflow-hidden border-[3px] border-[#302541] shadow-[3px_3px_0px_#302541] hover:shadow-[5px_5px_0px_#302541] hover:-translate-y-1 active:translate-y-0 transition-all duration-200"
                  >
                    {/* Clickable area to open post */}
                    <button
                      type="button"
                      onClick={() => { setOpenEditOnMount(false); setSelectedPostId(post.id); }}
                      className="absolute inset-0 w-full h-full cursor-pointer text-left"
                      aria-label={`Open ${post.title || 'post'}`}
                    >
                      {isDoodle ? (
                        <img src={post.image_url} alt={post.title} className="w-full h-full object-cover bg-[#FFFAF1]" />
                      ) : (
                        <div className="w-full h-full p-3 sm:p-4 pt-10 flex items-center justify-center text-center" style={{ backgroundColor: meta.color }}>
                          <h3 className="text-xs sm:text-sm font-black text-[#302541] line-clamp-4 leading-snug">
                            {post.title || post.body_text}
                          </h3>
                        </div>
                      )}
                    </button>

                    {/* Category badge */}
                    <span className="absolute top-2 left-2 flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border-2 border-[#302541] text-[10px] sm:text-[11px] font-black text-[#302541] max-w-[65%] pointer-events-none">
                      <span>{meta.emoji}</span>
                      <span className="truncate">{meta.label}</span>
                    </span>

                    {/* Three-dot menu button (own posts only) */}
                    {!isViewingOther && isPostOwner && (
                      <div className="absolute top-2 right-2 z-20" ref={gridMenuPostId === post.id ? gridMenuRef : null}>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setGridMenuPostId(gridMenuPostId === post.id ? null : post.id); }}
                          className="w-7 h-7 rounded-lg bg-white/90 border-2 border-[#302541] flex items-center justify-center shadow-[1px_1px_0px_#302541] hover:bg-[#FFD978] transition-colors"
                          aria-label="Post options"
                          title="Post options"
                        >
                          <MoreVertical className="w-3.5 h-3.5 text-[#302541]" />
                        </button>

                        {gridMenuPostId === post.id && (
                          <div className="absolute right-0 top-9 w-44 space-y-1 rounded-2xl border-2 border-[#302541] bg-white p-1.5 shadow-[3px_3px_0px_#302541]">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setGridMenuPostId(null); setOpenEditOnMount(true); setSelectedPostId(post.id); }}
                              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-bold hover:bg-[#FFFAF1]"
                            >
                              <Edit2 className="h-4 w-4 text-[#FF385C]" />
                              Edit post
                            </button>
                            {onSaveDraftPost && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setGridMenuPostId(null); onSaveDraftPost(post); }}
                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-bold hover:bg-[#FFFAF1]"
                              >
                                <Folder className="h-4 w-4 text-[#FF385C]" />
                                Move to drafts
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setGridMenuPostId(null); setPostToDelete(post); }}
                              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-bold text-[#FF385C] hover:bg-[#FFF0DF]"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete post
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Hover overlay with like/comment counts */}
                    <span className="absolute inset-0 flex items-center justify-center gap-5 bg-[#302541]/55 text-white font-black opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <span className="flex items-center gap-1.5">
                        <Heart className="h-5 w-5 fill-white" />
                        {likes}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MessageCircle className="h-5 w-5 fill-white" />
                        {commentCount}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-14 text-center px-6 bg-white rounded-[24px] border-[3px] border-[#302541] border-dashed">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#FFFAF1] border-[3px] border-[#302541] shadow-[3px_3px_0px_#302541] flex items-center justify-center text-3xl">
                {emptyCopy.emoji}
              </div>
              <h3 className="text-lg font-black text-[#302541] font-display mb-1">{emptyCopy.title}</h3>
              <p className="text-sm font-bold text-[#746B7C] max-w-xs mx-auto">{emptyCopy.text}</p>
            </div>
          )}
        </section>
      </div>

      {/* ============ MODAL POST (portalled to body so it doesn't appear below the grid) ============ */}
      {selectedPost && createPortal(
          <PostCard
            key={selectedPost.id}
            modalOnly={true}
            openCommentsOnMount={!openEditOnMount}
            openEditOnMount={openEditOnMount}
            post={selectedPost}
            currentUser={currentUser}
            onLike={onToggleLike}
            onSave={onToggleSave}
            onComment={onComment}
            onDeleteComment={onDeleteComment}
            onTogglePinComment={onTogglePinComment}
            onEdit={onEditPost}
            onDelete={onDeletePost}
            onSaveDraft={onSaveDraftPost}
            onCloseModal={() => { setSelectedPostId(null); setOpenEditOnMount(false); }}
            onPreviousPost={() => selectAdjacentPost(-1)}
            onNextPost={() => selectAdjacentPost(1)}
            canGoPrevious={selectedPostIndex > 0}
            canGoNext={selectedPostIndex >= 0 && selectedPostIndex < activePosts.length - 1}
          />,
          document.body
      )}

      {/* ============ MODAL EDIT PROFIL ============ */}
      {showEdit && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-[#302541]/65 backdrop-blur-sm flex items-center justify-center p-3 md:p-5"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowEdit(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Edit Creator Profile"
            className="bg-[#FFFAF1] rounded-[28px] border-[3px] border-[#302541] shadow-[6px_6px_0px_#302541] w-full max-w-2xl max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Header Modal */}
            <div className="px-5 py-3.5 border-b-[3px] border-[#302541] flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎨</span>
                <h3 className="font-black text-[#302541] text-lg font-display">Edit Creator Profile</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEdit(false)}
                className="w-9 h-9 rounded-xl bg-[#FFFAF1] border-2 border-[#302541] flex items-center justify-center text-[#302541] hover:bg-[#FF385C] hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body Modal */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <form id="edit-profile-form" onSubmit={handleSaveProfile} className="space-y-4">
                {/* Avatar Picker Section */}
                <div>
                  <div className="flex items-center justify-between mb-1.5 gap-2">
                    <label className="text-xs font-black text-[#302541] uppercase tracking-wide">
                      Choose an Avatar
                    </label>
                    <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-lg border-2 border-[#302541] text-xs font-black text-[#302541] shrink-0">
                      <span className="text-[#746B7C]">Selected:</span>
                      <AvatarIcon id={editData.avatar} className="w-5 h-5 rounded-full" />
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-2xl border-[2.5px] border-[#302541] shadow-[2px_2px_0px_#302541]">
                    <div className="grid grid-cols-5 gap-2 p-1">
                      {animalAvatars.map((av) => {
                        const isSelected = String(editData.avatar) === String(av);
                        return (
                          <button
                            key={av}
                            type="button"
                            onClick={() => setEditData((prev) => ({ ...prev, avatar: String(av) }))}
                            className={`p-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center border-2 ${
                              isSelected
                                ? 'bg-[#FFD978] border-[#302541] ring-2 ring-[#FF385C] shadow-[2px_2px_0px_#302541]'
                                : 'bg-[#FFFAF1] border-[#302541]/15 hover:border-[#302541] hover:bg-white'
                            }`}
                          >
                            <AvatarIcon id={av} className="w-10 h-10 rounded-full bg-white" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Username Field */}
                <div>
                  <label className="block text-xs font-black text-[#302541] mb-1 uppercase tracking-wide">
                    Username
                  </label>
                  <input
                    type="text"
                    value={editData.username}
                    onChange={(e) => setEditData({ ...editData, username: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    className="w-full bg-white px-3 py-2 rounded-xl border-[2px] border-[#302541] shadow-[2px_2px_0px_#302541] font-black text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD978]"
                    placeholder="Enter a username..."
                  />
                </div>

                {/* Bio Field */}
                <div>
                  <label className="block text-xs font-black text-[#302541] mb-1 uppercase tracking-wide">
                    Bio
                  </label>
                  <textarea
                    rows={2}
                    value={editData.bio}
                    onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                    className="w-full bg-white px-3 py-2 rounded-xl border-[2px] border-[#302541] shadow-[2px_2px_0px_#302541] font-bold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD978] resize-none"
                    placeholder="Tell us a little about your work or yourself..."
                  />
                </div>
              </form>
            </div>

            {/* Footer Modal Action */}
            <div className="p-3 bg-white border-t-[2.5px] border-[#302541] shrink-0">
              <button
                type="submit"
                form="edit-profile-form"
                className="w-full bg-[#FFD978] hover:bg-[#ffe08a] text-[#302541] px-4 py-2.5 rounded-xl border-[2px] border-[#302541] shadow-[2px_2px_0px_#302541] font-black text-sm cursor-pointer active:translate-y-0.5 transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ============ MODAL HAPUS DRAF ============ */}
      {draftToDelete && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#302541]/60 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDraftToDelete(null);
          }}
        >
          <ConfirmModal
            icon={Trash2}
            title="Delete this draft?"
            description={<>Post <b>“{draftToDelete.title || 'Untitled draft'}”</b> will be deleted from Drafts.</>}
            confirmText="Yes, delete"
            onCancel={() => setDraftToDelete(null)}
            onConfirm={() => {
              onDeleteDraft?.(draftToDelete.id);
              setDraftToDelete(null);
            }}
          />
        </div>,
        document.body
      )}

      {/* ============ DELETE POST CONFIRM (from grid three-dot menu) ============ */}
      {postToDelete &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#302541]/60 p-4 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setPostToDelete(null); }}
          >
            <ConfirmModal
              icon={Trash2}
              title="Delete this post?"
              description={<>Post <b>&ldquo;{postToDelete.title || 'This post'}&rdquo;</b> will be permanently removed from your feed.</>}
              confirmText="Yes, delete"
              onCancel={() => setPostToDelete(null)}
              onConfirm={() => {
                onDeletePost?.(postToDelete.id);
                setPostToDelete(null);
              }}
            />
          </div>,
          document.body
        )}

      {/* ============ MODAL LOGOUT ============ */}
      {showLogoutModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#302541]/60 p-4 backdrop-blur-sm"
            onClick={() => setShowLogoutModal(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="logout-title"
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[340px] rounded-[30px] border-[3px] border-[#302541] bg-[#FFFAF1] p-6 text-center shadow-[6px_6px_0px_#302541] sm:p-7"
            >
              <div className="relative mx-auto mb-5 flex h-[82px] w-[82px] rotate-[-6deg] items-center justify-center rounded-[26px] border-[3px] border-[#302541] bg-[#FFE2D8] shadow-[4px_4px_0px_#302541]">
                <LogOut className="h-10 w-10 text-[#302541]" strokeWidth={2.8} />
                <span className="absolute -right-3 -top-3 flex h-8 w-8 rotate-[10deg] items-center justify-center rounded-full border-[2.5px] border-[#302541] bg-[#FFD978] text-lg font-black text-[#302541]">
                  ?
                </span>
              </div>

              <h2
                id="logout-title"
                className="mb-2 font-display text-[28px] font-extrabold leading-tight text-[#302541]"
              >
                Leaving Looma?
              </h2>

              <p className="mb-6 text-sm font-medium text-[#746B7C]">
                Are you sure you want to log out, <span className="font-extrabold text-[#302541]">@{currentUser?.username || 'you'}</span>?
              </p>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleConfirmLogout}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border-[2.5px] border-[#302541] bg-[#302541] px-4 py-3 text-sm font-extrabold text-[#FFFAF1] shadow-[3px_3px_0px_#302541] transition-all hover:-translate-y-0.5 hover:bg-[#43355b] hover:shadow-[4px_4px_0px_#302541] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                >
                  <LogOut className="h-4 w-4" strokeWidth={2.5} />
                  Yep, log me out!
                </button>

                <button
                  type="button"
                  onClick={() => setShowLogoutModal(false)}
                  className="min-h-12 w-full rounded-2xl border-[2.5px] border-[#302541] bg-white px-4 py-3 text-sm font-extrabold text-[#302541] transition-all hover:bg-[#FFD978] active:translate-y-0.5"
                >
                  Wait, stay here!
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
