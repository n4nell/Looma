
import {
    ArrowLeft, ArrowRight,
    Bookmark,
    ChevronDown,
    Edit2,
    Folder,
    Heart, MessageCircle,
    MoreHorizontal,
    MoreVertical,
    Pin, Smile,
    Trash2,
    X,
    ZoomIn,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import AvatarIcon from './AvatarIcon';
import IdeaPostContent from './IdeaPostContent';

const EMOJIS = ['😊', '😂', '😍', '🔥', '👏', '🥹', '✨', '❤️'];
const CATEGORIES = {
  menulis: ['Writing', '#FFE2D8'],
  gambar: ['Drawing', '#FFD978'],
  ide: ['Ideas', '#BAE6FD'],
  komik: ['Mood Board', '#FFE2D8'],
  games: ['Challenges', '#A8D8B9'],
};

const cx = (...classes) => classes.filter(Boolean).join(' ');
const getName = (item) => item?.owner?.username || item?.username || 'user';
const getAvatar = (item) => item?.owner?.avatar || item?.avatarEmoji || item?.avatar || '13';
const getAvatarBg = (item) => '#FFFFFF';

function timeAgo(value) {
  if (!value) return '';
  // Jika string dari backend UTC tanpa penanda zona (e.g. "2026-10-14T00:52:25" atau "2026-10-14 00:52:25"), tambahkan 'Z'
  let dateStr = typeof value === 'string' ? value.trim().replace(' ', 'T') : value;
  if (typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)) {
    dateStr += 'Z';
  }
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(Math.max(0, diffMs) / 60000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  return `${Math.floor(days / 365)}y`;
}

function Portal({ children, onClose, className = '' }) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div
      className={className}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      {children}
    </div>,
    document.body
  );
}

function ModalHeader({ title, onClose }) {
  return (
    <div className="flex shrink-0 items-center justify-between border-b-2 border-[#302541]/10 bg-white px-5 py-4">
      <h3 className="font-display text-lg font-black text-[#302541]">{title}</h3>
      <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 hover:bg-[#FFFAF1]">
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

function ConfirmModal({ icon: Icon, title, description, preview, confirmText, onCancel, onConfirm, color = '#FF385C' }) {
  return (
    <div className="w-full max-w-sm rounded-[28px] border-[2.5px] border-[#302541] bg-[#FFFAF1] p-6 text-center shadow-[5px_5px_0px_#302541]">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: color === '#A8D8B9' ? '#A8D8B9' : '#FFE2D8' }}>
        <Icon className="h-7 w-7" style={{ color: color === '#A8D8B9' ? '#302541' : '#FF385C' }} />
      </div>
      <h3 className="mb-2 font-display text-xl font-black text-[#302541]">{title}</h3>
      <p className="text-sm leading-relaxed text-[#746B7C]">{description}</p>
      {preview && <div className="mt-4 rounded-xl bg-white px-3 py-2.5 text-left text-xs leading-relaxed text-[#746B7C]">{preview}</div>}
      <div className="mt-6 flex gap-3">
        <button type="button" onClick={onCancel} className="flex-1 rounded-xl border-2 border-[#302541] bg-white px-3 py-2.5 text-sm font-black hover:bg-[#FFE2D8]">Cancel</button>
        <button type="button" onClick={onConfirm} className="flex-1 rounded-xl border-2 border-[#302541] px-3 py-2.5 text-sm font-black text-white hover:opacity-80" style={{ backgroundColor: color }}>{confirmText}</button>
      </div>
    </div>
  );
}

export default function PostCard({
  post, onLike, onSave, onComment, onEdit, onDelete,
  onDeleteComment, onTogglePinComment, onSaveDraft, currentUser, onViewCreator,
  viewerMode = false, hideCommentsButton = false,
  openCommentsOnMount = false, openEditOnMount = false, onCloseModal,
  onPreviousPost, onNextPost, canGoPrevious = true, canGoNext = true,
  modalOnly = false,
}) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [showCommentsModal, setShowCommentsModal] = useState(openCommentsOnMount);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [activeCommentMenu, setActiveCommentMenu] = useState(null);
  const [isEditing, setIsEditing] = useState(openEditOnMount);
  const [replyTo, setReplyTo] = useState(null);
  const [expandedThreads, setExpandedThreads] = useState([]);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title || '');
  const [editCaption, setEditCaption] = useState(post.caption || '');
  const [lightboxImage, setLightboxImage] = useState(null);
  const [loadedProofImage, setLoadedProofImage] = useState(null);
  const [failedProofImage, setFailedProofImage] = useState(null);

  const modalInputRef = useRef(null);
  const commentMenuRef = useRef(null);

  const isOwner = Boolean(currentUser && (
    (post.user_id != null && String(post.user_id) === String(currentUser.id)) ||
    (post.userId != null && String(post.userId) === String(currentUser.id)) ||
    (post.owner?.id != null && String(post.owner.id) === String(currentUser.id)) ||
    (post.owner?.user_id != null && String(post.owner.user_id) === String(currentUser.id)) ||
    (post.owner?.username && String(post.owner.username).trim().toLowerCase() === String(currentUser.username || '').trim().toLowerCase()) ||
    (post.username && String(post.username).trim().toLowerCase() === String(currentUser.username || '').trim().toLowerCase())
  ));

  const postAuthorId = post.user_id ?? post.owner?.id;
  const postAuthorName = post.owner?.username || post.username;
  const comments = Array.isArray(post.comments) ? post.comments : [];
  // Komentar biasa (bukan balasan) vs balasan yang menempel via parent_id
  const topLevelComments = comments.filter((c) => c?.parent_id == null);
  const isCurrentUserComment = (comment) => {
    const commentUserId = comment?.user_id ?? comment?.owner?.id;
    return (commentUserId != null && currentUser?.id != null && String(commentUserId) === String(currentUser.id)) ||
      Boolean(currentUser?.username && getName(comment) === currentUser.username);
  };
  const sortedTopLevelComments = [...topLevelComments].sort((a, b) => {
    const mineOrder = Number(isCurrentUserComment(b)) - Number(isCurrentUserComment(a));
    if (mineOrder) return mineOrder;
    const pinnedOrder = Number(Boolean(b.is_pinned)) - Number(Boolean(a.is_pinned));
    if (pinnedOrder) return pinnedOrder;
    const aTime = a?.created_at ? new Date(a.created_at).getTime() : Number(a?.id) || 0;
    const bTime = b?.created_at ? new Date(b.created_at).getTime() : Number(b?.id) || 0;
    return bTime - aTime;
  });
  const category = CATEGORIES[post.category_id || post.categoryId || 'menulis'] || [
    post.category_id || post.categoryId || 'Creation', '#FFD978',
  ];
  const username = getName(post);
  const role = post.owner?.role || post.userRole || 'Looma Creator';
  const avatarId = getAvatar(post);
  const avatarBg = getAvatarBg(post);
  const imageUrl = post.image_url || post.imageDataUrl || post.image;
  const postType = post.post_type || post.postType;
  const categoryId = post.category_id || post.categoryId;
  const isIdea = postType === 'idea' || categoryId === 'ide';
  const isChallenge = postType === 'challenge' || categoryId === 'games';
  const isDoodle = ['doodle'].includes(postType) && imageUrl;
  const stickers = post.stickers || post.stickersList || [];
  const bodyText = post.body_text || post.bodyText || post.body || '';
  const isHtmlText = typeof bodyText === 'string' && /<[a-z][\s\S]*>/i.test(bodyText);
  const fontClass = post.fontStyle === 'serif' ? 'font-serif' : post.fontStyle === 'mono' ? 'font-mono' : 'font-sans';
  const isLiked = post.isLiked || post.is_liked;
  const isSaved = post.isSaved || post.is_saved;
  const likesCount = post.likes_count ?? post.likesCount ?? 0;

  const canDeleteComment = (comment) => {
    if (!currentUser) return false;
    if (isOwner) return true;
    const id = comment.user_id ?? comment.owner?.id;
    return (id != null && currentUser.id != null && String(id) === String(currentUser.id)) ||
      (getName(comment) === currentUser.username && Boolean(currentUser.username));
  };

  const isCommentByPostOwner = (comment) => {
    const id = comment.user_id ?? comment.owner?.id;
    return (id != null && postAuthorId != null && String(id) === String(postAuthorId)) ||
      Boolean(getName(comment) && postAuthorName && getName(comment) === postAuthorName);
  };

  const getReplies = (parentId) => comments
    .filter((c) => c?.parent_id === parentId)
    .sort((a, b) => {
      const ta = a?.created_at ? new Date(a.created_at).getTime() : 0;
      const tb = b?.created_at ? new Date(b.created_at).getTime() : 0;
      return ta - tb || (a?.id ?? 0) - (b?.id ?? 0);
    });

  const isThreadExpanded = (id) => expandedThreads.includes(id);

  const toggleThread = (id) => {
    setExpandedThreads((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  useEffect(() => {
    setEditTitle(post.title || '');
    setEditCaption(post.caption || '');
    setCaptionExpanded(false);
  }, [post.id, post.title, post.caption]);

  useEffect(() => {
    if (!showCommentsModal && !isEditing && !showDeleteModal && !showDraftModal && !commentToDelete) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [showCommentsModal, isEditing, showDeleteModal, showDraftModal, commentToDelete]);

  useEffect(() => {
    if (!showCommentsModal) {
      setShowEmoji(false);
      setActiveCommentMenu(null);
    }
  }, [showCommentsModal]);

  useEffect(() => {
    if (!activeCommentMenu) return;
    const closeOutside = (e) => {
      if (commentMenuRef.current && !commentMenuRef.current.contains(e.target)) setActiveCommentMenu(null);
    };
    document.addEventListener('mousedown', closeOutside);
    return () => document.removeEventListener('mousedown', closeOutside);
  }, [activeCommentMenu]);

  useEffect(() => {
    if (!showCommentsModal) return;
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      if (commentToDelete) setCommentToDelete(null);
      else if (activeCommentMenu) setActiveCommentMenu(null);
      else {
        setShowCommentsModal(false);
        onCloseModal?.();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showCommentsModal, commentToDelete, activeCommentMenu, onCloseModal]);

  const submitComment = (e) => {
    e.preventDefault();
    const text = commentText.trim();
    if (!text || !onComment) return;
    // Balasan dikasih mention orang yang dibalas di depan teksnya (gaya IG)
    const finalText = replyTo ? `@${getName(replyTo)} ${text}` : text;
    onComment(post.id, finalText, replyTo?.id ?? null);
    setCommentText('');
    setReplyTo(null);
    setShowEmoji(false);
  };

  const handleReply = (comment) => {
    // Balasan selalu menempel ke komentar utama paling atas (aliran percakapan seperti IG)
    const rootId = comment?.parent_id ?? comment?.id ?? null;
    setReplyTo(rootId != null ? { ...comment, id: rootId } : comment);
    if (rootId != null) {
      setExpandedThreads((prev) => (prev.includes(rootId) ? prev : [...prev, rootId]));
    }
    setCommentText('');
    setActiveCommentMenu(null);
    requestAnimationFrame(() => modalInputRef.current?.focus());
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    await onEdit?.(post.id, { title: editTitle, caption: editCaption });
    setIsEditing(false);
  };

  const renderContent = (modal = false) => (
    <div className="w-full">
      {isIdea ? (
        <IdeaPostContent title={post.title} body={bodyText} modal={modal} />
      ) : isDoodle ? (
        <div className="flex flex-col items-center">
          {post.title && <h3 className="mb-3 font-display text-xl font-black text-[#302541]">{post.title}</h3>}
          <img src={imageUrl} alt={post.title || 'Doodle'} className={cx('w-full rounded-xl border-2 border-[#302541] bg-white object-contain', modal ? 'max-h-[70vh]' : 'max-h-[480px]')} />
        </div>
      ) : stickers.length ? (
        <div>
          {post.title && <h3 className="mb-5 text-center font-display text-2xl font-black text-[#302541]">{post.title}</h3>}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {stickers.map((sticker, i) => (
              <div key={i} style={{ backgroundColor: sticker.bg || '#FFD978' }} className="flex items-center gap-1.5 rounded-2xl border-2 border-[#302541] px-4 py-2.5 text-sm font-black shadow-[2px_2px_0px_#302541]">
                <span>{sticker.emoji}</span><span>{sticker.text}</span>
              </div>
            ))}
          </div>
        </div>
      ) : isChallenge ? (() => {
        const titleStr = post.title || '';
        const isTruth = /truth|jujur/i.test(titleStr);
        const isDare = /dare|tantangan aksi/i.test(titleStr);
        const promptTheme = isTruth
          ? { badge: '🔮 TRUTH', bg: '#302541', boxBg: '#A8D8B9', labelColor: '#302541' }
          : isDare
          ? { badge: '⚡ DARE', bg: '#302541', boxBg: '#FFE2D8', labelColor: '#302541' }
          : { badge: '🎲 TRUTH OR DARE', bg: '#302541', boxBg: '#FFD978', labelColor: '#302541' };

        // Bersihkan prefix judul jika ada (e.g. "🔮 TRUTH: Pertanyaan..." -> "Pertanyaan...")
        const cleanPrompt = titleStr.replace(/^(?:TRUTH|DARE|JUJUR|TANTANGAN AKSI):\s*/i, '').replace(/^(?:🔮\s*TRUTH|⚡\s*DARE|🎲\s*GAME):\s*/i, '').trim();

        return (
          <div className="w-full">
            {/* Box Truth or Dare */}
            <div
              style={{ backgroundColor: promptTheme.boxBg }}
              className="rounded-2xl border-[2.5px] border-[#302541] p-4 sm:p-5 shadow-[3px_3px_0px_#302541]"
            >
              {/* Header Badge */}
              <div className="flex items-center justify-between border-b-2 border-[#302541]/15 pb-2.5 mb-3">
                <span
                  style={{ backgroundColor: promptTheme.bg }}
                  className="rounded-full border border-[#302541] px-3 py-1 text-[10px] sm:text-[11px] font-black uppercase text-white shadow-[1px_1px_0px_#302541]"
                >
                  {promptTheme.badge}
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#746B7C] bg-white/80 px-2 py-0.5 rounded-md border border-[#302541]/20">
                  Completed ✓
                </span>
              </div>

              {/* Kartu Pertanyaan / Tantangan */}
              {cleanPrompt && (
                <div className="mb-3 rounded-xl border-2 border-[#302541] bg-white p-3 sm:p-3.5 shadow-[2px_2px_0px_#302541]">
                  <div className="text-[10px] font-black uppercase tracking-wider text-[#746B7C] mb-1">
                    🎯 Prompt:
                  </div>
                  <h3 className="font-display text-sm sm:text-base font-black leading-snug text-[#302541]">
                    &ldquo;{cleanPrompt}&rdquo;
                  </h3>
                </div>
              )}

              {/* Answer and full-image square proof thumbnail */}
              <div className={cx('flex items-stretch gap-3', imageUrl ? 'flex-row' : 'flex-col')}>
                <div className={cx('min-w-0 rounded-xl border border-[#302541]/20 bg-white/90 p-3 sm:p-3.5', imageUrl && 'flex-1')}>
                  <div className="mb-1 text-[10px] font-black uppercase tracking-wider text-[#746B7C]">
                    {isTruth ? '💬 Honest Answer:' : '💥 Challenge Proof:'}
                  </div>
                  <p className="whitespace-pre-line text-xs sm:text-sm font-bold leading-relaxed text-[#302541]">
                    {bodyText || 'Challenge completed!'}
                  </p>
                </div>

                {/* Proof photo thumbnail — tap to view full size */}
                {imageUrl && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setLightboxImage(imageUrl); }}
                    className="group relative block aspect-square w-24 shrink-0 self-center overflow-hidden rounded-xl border-2 border-[#302541] bg-[#F2EEF5] shadow-[2px_2px_0px_#302541] cursor-pointer hover:shadow-[3px_3px_0px_#302541] transition-shadow sm:w-32"
                    title="Tap to view full size"
                  >
                    {loadedProofImage !== imageUrl && (
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#746B7C]">
                        {failedProofImage === imageUrl ? 'Photo unavailable' : 'Loading photo…'}
                      </span>
                    )}
                    <img
                      src={imageUrl}
                      alt="Challenge proof"
                      onLoad={() => { setLoadedProofImage(imageUrl); setFailedProofImage(null); }}
                      onError={() => { setFailedProofImage(imageUrl); setLoadedProofImage(null); }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        maxWidth: 'none',
                        objectFit: 'cover',
                        objectPosition: 'center',
                        opacity: loadedProofImage === imageUrl ? 1 : 0,
                        transition: 'opacity 150ms',
                      }}
                    />
                    {loadedProofImage === imageUrl && (
                      <span className="absolute inset-0 flex items-center justify-center bg-[#302541]/0 transition-colors group-hover:bg-[#302541]/20">
                        <ZoomIn className="h-7 w-7 text-white opacity-0 drop-shadow-lg transition-opacity group-hover:opacity-100" />
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })() : (
        <div>
          {post.writingSubgenre && <span className="mb-3 inline-block rounded-md border border-[#302541] bg-white/80 px-2.5 py-0.5 text-[10px] font-black uppercase">{post.writingSubgenre}</span>}
          {post.title && <h3 className={cx('mb-4 font-display font-black leading-snug text-[#302541]', modal ? 'text-2xl lg:text-3xl' : 'text-2xl')}>{post.title}</h3>}
          {bodyText && (isHtmlText ? (
            <div className={cx('text-sm font-bold leading-relaxed text-[#302541]/90 sm:text-base', fontClass)} dangerouslySetInnerHTML={{ __html: bodyText }} />
          ) : (
            <p className={cx('whitespace-pre-line text-sm font-bold leading-relaxed text-[#302541]/90 sm:text-base', fontClass)}>{bodyText}</p>
          ))}
          {imageUrl && (
            <div className="mt-3">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setLightboxImage(imageUrl); }}
                className="group/photo relative block w-full overflow-hidden rounded-xl border-2 border-[#302541] bg-black/5 shadow-[2px_2px_0px_#302541] cursor-pointer hover:shadow-[3px_3px_0px_#302541] transition-shadow"
                title="Tap to view full size"
              >
                <img
                  src={imageUrl}
                  alt={post.title || 'Proof Photo'}
                  style={{ display: 'block', width: '100%', height: 'auto', maxHeight: '400px', objectFit: 'contain' }}
                />
                <span className="absolute inset-0 flex items-center justify-center bg-[#302541]/0 group-hover/photo:bg-[#302541]/20 transition-colors">
                  <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover/photo:opacity-100 transition-opacity drop-shadow-lg" />
                </span>
                <span className="absolute bottom-2 right-2 bg-[#302541]/70 text-white text-[10px] font-black px-2 py-0.5 rounded-full pointer-events-none">
                  📸 Tap to expand
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const isRootComment = (comment) => comment?.parent_id == null && comment?.parentId == null;

  const commentMenu = (comment) => (
    <div className="absolute right-0 top-8 z-30 w-52 rounded-2xl border-2 border-[#302541] bg-white p-1.5 shadow-[3px_3px_0px_#302541]">
      {isOwner && onTogglePinComment && isRootComment(comment) && <button type="button" onClick={() => { onTogglePinComment(post.id, comment.id); setActiveCommentMenu(null); }} className="flex w-full items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-left text-xs font-bold hover:bg-[#FFFAF1]"><Pin className="h-4 w-4 shrink-0 text-[#FF385C]" />{comment.is_pinned ? 'Unpin comment' : 'Pin comment'}</button>}
      {canDeleteComment(comment) && onDeleteComment && <button type="button" onClick={() => { setCommentToDelete(comment); setActiveCommentMenu(null); }} className="flex w-full items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-left text-xs font-bold text-[#FF385C] hover:bg-[#FFF0DF]"><Trash2 className="h-4 w-4 shrink-0" />Delete comment</button>}
    </div>
  );

  const renderCommentItem = (comment, { isReply = false } = {}) => {
    const key = comment?.id ?? comment?.text;
    const menuOpen = activeCommentMenu === key;
    const canShowMenu = Boolean(onComment || (isOwner && onTogglePinComment && isRootComment(comment) && !isReply) || (canDeleteComment(comment) && onDeleteComment));
    return (
      <div className={cx('flex items-start gap-3', isReply && 'mt-3')}>
        <AvatarIcon id={comment?.owner?.avatar || comment?.avatar || '12'} style={{ backgroundColor: '#FFFFFF' }} className={cx('shrink-0 rounded-full border-2 border-[#302541] bg-white', isReply ? 'h-7 w-7' : 'h-9 w-9')} />
        <div className="min-w-0 flex-1">
          <p className="break-words text-[13px] leading-relaxed">
            <b className="mr-1.5 text-[#302541]">{getName(comment)}</b>
            {isCommentByPostOwner(comment) && <span className="mr-1.5 inline-flex items-center rounded-full bg-[#FFD978] px-1.5 py-0.5 align-middle text-[9px] font-black">Author</span>}
            <span className="font-medium text-[#302541]/90">{comment?.text}</span>
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] font-bold text-[#746B7C]">
            <span>{timeAgo(comment?.created_at)}</span>
            {!isReply && comment?.is_pinned && <span className="inline-flex items-center gap-1 text-[#9A7B00]"><Pin className="h-3 w-3" />Pinned</span>}
            {onComment && <button type="button" onClick={() => handleReply(comment)} className="hover:text-[#302541]">Reply</button>}
          </div>
        </div>
        {canShowMenu && <div ref={menuOpen ? commentMenuRef : null} className="relative shrink-0">
          <button type="button" onClick={() => setActiveCommentMenu(menuOpen ? null : key)} aria-label={`Options for ${getName(comment)}`} className="flex h-8 w-8 items-center justify-center rounded-full text-[#746B7C] hover:bg-[#FFFAF1] hover:text-[#302541]"><MoreHorizontal className="h-5 w-5" /></button>
          {menuOpen && commentMenu(comment)}
        </div>}
      </div>
    );
  };

  const commentForm = (inModal = false) => (
    <form onSubmit={submitComment} className={cx('flex items-center gap-2', inModal ? 'relative shrink-0 gap-3 border-t border-[#302541]/10 px-4 py-3' : 'pt-1')}>
      {inModal && replyTo && (
        <div className="absolute bottom-full left-3 right-3 mb-2 flex items-center justify-between rounded-xl border border-[#302541]/10 bg-[#FFFAF1] px-3 py-2 text-xs">
          <span className="font-semibold text-[#746B7C]">Replying to <b className="text-[#302541]">@{getName(replyTo)}</b></span>
          <button type="button" onClick={() => { setReplyTo(null); setCommentText(''); }} aria-label="Cancel reply"><X className="h-4 w-4" /></button>
        </div>
      )}
      {inModal && showEmoji && (
        <div className="absolute bottom-full left-3 z-10 mb-2 flex gap-1 rounded-2xl border-2 border-[#302541] bg-white p-2 shadow-[3px_3px_0px_#302541]">
          {EMOJIS.map((emoji) => <button key={emoji} type="button" onClick={() => { setCommentText((v) => `${v}${emoji}`); modalInputRef.current?.focus(); }} className="h-8 w-8 rounded-lg text-xl hover:bg-[#FFFAF1]">{emoji}</button>)}
        </div>
      )}
      {inModal && <button type="button" onClick={() => setShowEmoji((v) => !v)} aria-label="Choose emoji" className="shrink-0"><Smile className="h-6 w-6" /></button>}
      <input ref={inModal ? modalInputRef : null} value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder={replyTo ? 'Write a reply...' : inModal ? 'Add a comment...' : 'Write a comment...'} className={cx('min-w-0 flex-1 bg-transparent font-medium text-[#302541] focus:outline-none placeholder:text-[#746B7C]', inModal ? 'text-sm' : 'text-xs font-semibold')} />
      {commentText.trim() && <button type="submit" className="shrink-0 text-xs font-black text-[#FF385C] disabled:opacity-40">Post</button>}
    </form>
  );

  return (
    <article className={cx('group relative flex flex-col justify-between overflow-hidden bg-white', viewerMode ? 'mb-0 min-h-full rounded-none border-0 shadow-none' : modalOnly ? 'hidden' : 'mb-8 rounded-[32px] border-[2.5px] border-[#302541] shadow-[4px_4px_0px_#302541] transition-shadow hover:shadow-[6px_6px_0px_#302541]')}>
      <header className="relative z-20 flex items-center justify-between gap-2 bg-white p-4 sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <AvatarIcon id={avatarId} style={{ backgroundColor: avatarBg }} className="h-11 w-11 shrink-0 rounded-full border-2 border-[#302541] shadow-[2px_2px_0px_#302541]" />
          <div className="min-w-0">
            <button type="button" onClick={() => onViewCreator?.(post.owner || { id: post.user_id, username })} className="block max-w-full truncate text-left text-sm font-black text-[#302541] hover:underline">@{username}</button>
            <div className="mt-0.5 text-xs font-bold text-[#746B7C]">{role}</div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span style={{ backgroundColor: category[1] }} className="rounded-full border-2 border-[#302541] px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-[#302541]">{category[0]}</span>
          {isOwner && (
            <div className="relative">
              <button type="button" onClick={() => setShowMenu((v) => !v)} aria-label="Post options" className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#302541] bg-[#FFFAF1] hover:bg-[#FFD978]"><MoreVertical className="h-4 w-4" /></button>
              {showMenu && <>
                <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-10 z-40 w-44 space-y-1 rounded-2xl border-2 border-[#302541] bg-white p-1.5 shadow-[3px_3px_0px_#302541]">
                  <button type="button" onClick={() => { setShowMenu(false); setIsEditing(true); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-bold hover:bg-[#FFFAF1]"><Edit2 className="h-4 w-4 text-[#FF385C]" />Edit post</button>
                  {onSaveDraft && <button type="button" onClick={() => { setShowMenu(false); setShowDraftModal(true); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-bold hover:bg-[#FFFAF1]"><Folder className="h-4 w-4 text-[#FF385C]" />Move to drafts</button>}
                  <button type="button" onClick={() => { setShowMenu(false); setShowDeleteModal(true); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-bold text-[#FF385C] hover:bg-[#FFF0DF]"><Trash2 className="h-4 w-4" />Delete post</button>
                </div>
              </>}
            </div>
          )}
        </div>
      </header>

      <div onDoubleClick={() => onLike?.(post.id)} style={{ backgroundColor: post.cardBg || undefined }} className="relative flex min-h-[250px] cursor-pointer select-none flex-col justify-center border-y-[2.5px] border-[#302541] bg-gradient-to-br from-[#FFE2D8] to-[#FFFAF1] px-6 py-8">
        {renderContent()}
      </div>

      <div className="space-y-3 bg-white p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => onLike?.(post.id)} className={cx('flex items-center gap-1.5 rounded-xl border-2 border-[#302541] px-3 py-1.5 text-xs font-black shadow-[2px_2px_0px_#302541] active:scale-95', isLiked ? 'bg-[#FF385C] text-white' : 'bg-[#FFFAF1] text-[#302541]')}><Heart className={cx('h-4 w-4', isLiked && 'fill-current')} />{likesCount} Likes</button>
            {!hideCommentsButton && <button type="button" onClick={() => setShowCommentsModal(true)} className="flex items-center gap-1.5 rounded-xl border-2 border-[#302541] bg-[#FFFAF1] px-3 py-1.5 text-xs font-black hover:bg-[#FFD978]"><MessageCircle className="h-4 w-4" />{comments.length} Comments</button>}
          </div>
          <button type="button" onClick={() => onSave?.(post.id)} className={cx('flex items-center gap-1.5 rounded-xl border-2 border-[#302541] px-3 py-1.5 text-xs font-black shadow-[2px_2px_0px_#302541]', isSaved ? 'bg-[#FFD978]' : 'bg-[#FFFAF1]')}><Bookmark className={cx('h-4 w-4', isSaved && 'fill-current')} />{isSaved ? 'Saved' : 'Save'}</button>
        </div>

        {post.caption && (() => {
          const captionLines = post.caption.split('\n');
          const firstLine = captionLines[0];
          const isLong = captionLines.length > 1 || firstLine.length > 110;
          const collapsedText = firstLine.length > 110 ? `${firstLine.slice(0, 110).trimEnd()}…` : firstLine;
          return <p className="break-words text-xs leading-relaxed sm:text-sm">
            <b className="mr-1.5 text-[#302541]">@{username}</b>
            <span className="whitespace-pre-line font-semibold text-[#302541]/90">{captionExpanded ? post.caption : collapsedText}</span>
            {isLong && (captionExpanded
              ? <button type="button" onClick={() => setCaptionExpanded(false)} className="ml-1 font-bold text-[#746B7C] hover:text-[#302541]">less</button>
              : <button type="button" onClick={() => setCaptionExpanded(true)} className="ml-1 font-bold text-[#746B7C] hover:text-[#302541]">… more</button>)}
          </p>;
        })()}
      </div>

      {showCommentsModal && <Portal onClose={() => { setShowCommentsModal(false); onCloseModal?.(); }} className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#302541]/65 p-0 backdrop-blur-sm md:p-8">
        {onPreviousPost && <button type="button" onClick={onPreviousPost} disabled={!canGoPrevious} aria-label="Previous post" className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#302541] bg-white shadow-[2px_2px_0px_#302541] hover:bg-[#FFD978] disabled:opacity-30 md:left-6"><ArrowLeft className="h-5 w-5" /></button>}
        {onNextPost && <button type="button" onClick={onNextPost} disabled={!canGoNext} aria-label="Next post" className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#302541] bg-white shadow-[2px_2px_0px_#302541] hover:bg-[#FFD978] disabled:opacity-30 md:right-6"><ArrowRight className="h-5 w-5" /></button>}
        <button type="button" onClick={() => { setShowCommentsModal(false); onCloseModal?.(); }} aria-label="Close comments" className="absolute right-5 top-4 hidden text-white md:flex"><X className="h-7 w-7" /></button>
        <div className="flex h-full w-full flex-col overflow-hidden bg-white md:h-[86vh] md:max-w-5xl md:flex-row md:rounded-[28px] md:border-[2.5px] md:border-[#302541] md:shadow-[6px_6px_0px_#302541]">
          <div style={{ backgroundColor: post.cardBg || undefined }} className="hidden w-[55%] shrink-0 items-center justify-center overflow-y-auto border-r-2 border-[#302541]/15 bg-gradient-to-br from-[#FFE2D8] to-[#FFFAF1] p-8 md:flex">{renderContent(true)}</div>
          <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">
            <div className="flex shrink-0 items-center gap-3 border-b border-[#302541]/10 px-4 py-3">
              <AvatarIcon id={avatarId} style={{ backgroundColor: avatarBg }} className="h-10 w-10 shrink-0 rounded-full border-2 border-[#302541]" />
              <div className="min-w-0 flex-1"><div className="truncate text-sm font-black">@{username}</div><div className="truncate text-[11px] font-bold text-[#746B7C]">{role}</div></div>
              <button type="button" onClick={() => { setShowCommentsModal(false); onCloseModal?.(); }} aria-label="Close comments" className="rounded-full p-1.5 hover:bg-[#FFFAF1] md:hidden"><X className="h-5 w-5" /></button>
            </div>

            {post.caption && <div className="flex max-h-[28%] shrink-0 gap-3 overflow-y-auto border-b border-[#302541]/10 bg-[#FFFAF1]/70 px-4 py-3">
              <AvatarIcon id={avatarId} style={{ backgroundColor: avatarBg }} className="h-9 w-9 shrink-0 rounded-full border-2 border-[#302541]" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2 text-[13px] font-black text-[#302541]">@{username}{timeAgo(post.created_at) && <span className="text-[11px] font-bold text-[#746B7C]">{timeAgo(post.created_at)} ago</span>}</div>
                <p className="mt-1 whitespace-pre-line break-words text-[13px] font-medium leading-relaxed text-[#302541]/90">{post.caption}</p>
              </div>
            </div>}

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
              {sortedTopLevelComments.length ? sortedTopLevelComments.map((comment, index) => {
                const key = comment.id ?? index;
                const replies = getReplies(comment.id);
                const expanded = isThreadExpanded(comment.id);
                // Semua balasan disembunyikan di balik tombol View/Hide replies
                const visibleReplies = expanded ? replies : [];
                return <div key={key}>
                  {renderCommentItem(comment)}
                  {replies.length > 0 && <div className="ml-12">
                    <button type="button" onClick={() => toggleThread(comment.id)} className="mt-2 flex items-center gap-2 text-xs font-bold text-[#746B7C] hover:text-[#302541]">
                      <span className="h-px w-6 bg-[#746B7C]" />
                      {expanded ? 'Hide replies' : `View ${replies.length} replies`}
                      <ChevronDown className={cx('h-3.5 w-3.5 transition-transform', expanded && 'rotate-180')} />
                    </button>
                    {visibleReplies.length > 0 && <div className="mt-1">
                      {visibleReplies.map((reply, rIndex) => <React.Fragment key={reply.id ?? rIndex}>{renderCommentItem(reply, { isReply: true })}</React.Fragment>)}
                    </div>}
                  </div>}
                </div>;
              }) : <div className="py-10 text-center"><div className="mb-2 text-3xl">💬</div><p className="text-sm font-bold">No comments yet</p><p className="mt-1 text-xs text-[#746B7C]">Start a little conversation.</p></div>}
            </div>

            <div className="shrink-0 border-t border-[#302541]/10 px-4 pb-2 pt-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => onLike?.(post.id)} aria-label="Like" className="active:scale-90"><Heart className={cx('h-6 w-6', isLiked ? 'fill-[#FF385C] text-[#FF385C]' : 'text-[#302541]')} /></button>
                  <button type="button" onClick={() => modalInputRef.current?.focus()} aria-label="Write a comment"><MessageCircle className="h-6 w-6" /></button>
                </div>
                <button type="button" onClick={() => onSave?.(post.id)} aria-label="Save" className="active:scale-90"><Bookmark className={cx('h-6 w-6', isSaved ? 'fill-[#FFD978]' : 'text-[#302541]')} /></button>
              </div>
              <div className="mt-2 text-sm font-black">{likesCount} likes</div>
              <div className="mt-0.5 text-[11px] font-bold text-[#746B7C]">{timeAgo(post.created_at) && `${timeAgo(post.created_at)} ago`}</div>
            </div>
            {commentForm(true)}
          </section>
        </div>
      </Portal>}

      {commentToDelete && <Portal onClose={() => setCommentToDelete(null)} className="fixed inset-0 z-[1100] flex items-center justify-center bg-[#302541]/50 p-4 backdrop-blur-sm">
        <ConfirmModal icon={Trash2} title="Delete comment?" description="This comment will be removed." preview={`“${commentToDelete.text}”`} confirmText="Delete" onCancel={() => setCommentToDelete(null)} onConfirm={() => { onDeleteComment?.(post.id, commentToDelete.id); setCommentToDelete(null); }} />
      </Portal>}

      {isEditing && <Portal onClose={() => setIsEditing(false)} className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#302541]/60 p-3 backdrop-blur-sm sm:p-5">
        <div className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-[28px] border-[2.5px] border-[#302541] bg-[#FFFAF1] shadow-[5px_5px_0px_#302541]">
          <ModalHeader title="Edit post" onClose={() => setIsEditing(false)} />
          <form id={`edit-post-${post.id}`} onSubmit={saveEdit} className="flex-1 space-y-4 overflow-y-auto p-5">
            <label className="block text-xs font-black">Title<input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Post title..." className="mt-1.5 w-full rounded-xl border-2 border-[#302541] bg-white px-3.5 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#FFD978]" /></label>
            <div className="rounded-xl border-2 border-[#302541] bg-[#FFD978]/30 px-3.5 py-2.5 text-xs font-bold text-[#302541]">
              ✍️ To edit the main content of your post, use <b>&ldquo;Move to drafts&rdquo;</b> from the menu, then reopen it in the studio editor.
            </div>
            <label className="block text-xs font-black">Caption<textarea rows={2} value={editCaption} onChange={(e) => setEditCaption(e.target.value)} placeholder="Write a short caption..." className="mt-1.5 w-full resize-none rounded-xl border-2 border-[#302541] bg-white px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FFD978]" /></label>
          </form>
          <div className="flex shrink-0 gap-3 border-t-2 border-[#302541]/10 bg-white p-4">
            <button type="button" onClick={() => setIsEditing(false)} className="flex-1 rounded-xl border-2 border-[#302541] bg-[#FFFAF1] py-2.5 text-xs font-black">Cancel</button>
            <button type="submit" form={`edit-post-${post.id}`} className="flex-1 rounded-xl border-2 border-[#302541] bg-[#FF385C] py-2.5 text-xs font-black text-white shadow-[2px_2px_0px_#302541] hover:bg-[#ff5273]">Save changes</button>
          </div>
        </div>
      </Portal>}

      {showDeleteModal && <Portal onClose={() => setShowDeleteModal(false)} className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#302541]/60 p-4 backdrop-blur-sm">
        <ConfirmModal icon={Trash2} title="Delete this post?" description={<> <span>“{post.title || post.caption?.slice(0, 30) || 'This post'}”</span> will be removed from your Looma feed.</>} confirmText="Yes, delete" onCancel={() => setShowDeleteModal(false)} onConfirm={() => { onDelete?.(post.id); setShowDeleteModal(false); }} />
      </Portal>}

      {showDraftModal && onSaveDraft && <Portal onClose={() => setShowDraftModal(false)} className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#302541]/60 p-4 backdrop-blur-sm">
        <ConfirmModal icon={Folder} title="Move to drafts?" description="This post will be removed from your feed and saved as a draft." confirmText="Move to drafts" color="#FFD978" onCancel={() => setShowDraftModal(false)} onConfirm={() => { onSaveDraft(post); setShowDraftModal(false); }} />
      </Portal>}

      {/* Lightbox for challenge proof photo fullscreen */}
      {lightboxImage && (
        <Portal onClose={() => setLightboxImage(null)} className="fixed inset-0 z-[1200] flex items-center justify-center bg-[#302541]/90 backdrop-blur-sm p-4">
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            aria-label="Close"
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/40 bg-[#302541]/70 text-white hover:bg-[#302541] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="relative max-h-full max-w-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxImage}
              alt="Proof photo full size"
              className="max-h-[85vh] max-w-[90vw] rounded-2xl border-[3px] border-white/20 object-contain shadow-[0_8px_40px_rgba(0,0,0,0.6)]"
            />
          </div>
        </Portal>
      )}
    </article>
  );
}

export { ConfirmModal };

