from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey, Boolean, text, func, or_
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel, field_serializer
from typing import List, Optional
import datetime
import hashlib
import secrets

import os

# Database configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "looma.db")

MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
MYSQL_DB = os.getenv("MYSQL_DB", "looma")
MYSQL_URL = f"mysql+mysqlconnector://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}"
SQLITE_URL = f"sqlite:///{DB_PATH}"

# Try MySQL first (for XAMPP/phpMyAdmin), fallback to SQLite if MySQL is unavailable
try:
    test_engine = create_engine(MYSQL_URL, pool_recycle=3600)
    with test_engine.connect() as test_conn:
        test_conn.execute(text("SELECT 1"))
    engine = test_engine
    DATABASE_URL = MYSQL_URL
    print(" [DATABASE] Connected to MySQL (phpMyAdmin) database:", MYSQL_DB)
except Exception as e:
    print(f" [DATABASE] MySQL unavailable ({e}). Falling back to SQLite: {DB_PATH}")
    engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})
    DATABASE_URL = SQLITE_URL

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

app = FastAPI(title="Looma API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Password Helpers ---
def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), bytes.fromhex(salt), 100000)
    return f"{salt}${key.hex()}"

def verify_password(plain_password: str, stored_hash: str) -> bool:
    if not stored_hash or "$" not in stored_hash:
        return False
    try:
        salt, key = stored_hash.split("$", 1)
        calc_key = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), bytes.fromhex(salt), 100000)
        return secrets.compare_digest(calc_key.hex(), key)
    except Exception:
        return False

# --- Database Models ---
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    full_name = Column(String(100), default="")
    password_hash = Column(Text, nullable=True)
    role = Column(String(100), default="User")
    avatar = Column(String(100), default="13")
    avatar_bg = Column(String(20), default="#FFC93C")
    bio = Column(Text, default="")
    xp = Column(Integer, default=0)
    challenge_streak = Column(Integer, default=0)
    last_challenge_date = Column(String(10), nullable=True)
    posts = relationship("Post", back_populates="owner")

class Post(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    category_id = Column(String(50))
    post_type = Column(String(50))  # e.g. writing, doodle, idea
    title = Column(String(255))
    body_text = Column(Text, nullable=True)
    image_url = Column(Text, nullable=True)  # Data URL for doodles / proof photos
    caption = Column(Text, nullable=True)
    likes_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="posts")
    comments = relationship("Comment", back_populates="post")

class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    text = Column(Text)
    is_pinned = Column(Boolean, default=False)
    parent_id = Column(Integer, ForeignKey("comments.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    post = relationship("Post", back_populates="comments")
    owner = relationship("User")

class PostLike(Base):
    __tablename__ = "post_likes"
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"))
    user_id = Column(Integer, ForeignKey("users.id"))

class PostSave(Base):
    __tablename__ = "post_saves"
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"))
    user_id = Column(Integer, ForeignKey("users.id"))

class Draft(Base):
    __tablename__ = "drafts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    category_id = Column(String(50))
    post_type = Column(String(50))
    title = Column(String(255), default="")
    body_text = Column(Text, nullable=True)
    image_url = Column(Text, nullable=True)
    caption = Column(Text, nullable=True)
    draft_data = Column(Text, nullable=True)
    # source_post_id: tracks which published post this draft came from (for idempotency)
    source_post_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

# --- Pydantic Schemas ---
class UserRegister(BaseModel):
    fullName: Optional[str] = ""
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserSchema(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = ""
    role: str
    avatar: str
    avatar_bg: str
    bio: str
    xp: int = 0
    challenge_streak: int = 0
    class Config:
        orm_mode = True
        from_attributes = True

class AuthResponse(BaseModel):
    message: str
    user: UserSchema

class UserUpdate(BaseModel):
    username: Optional[str] = None
    full_name: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None

class ChallengeComplete(BaseModel):
    date: str  # YYYY-MM-DD

class ChallengeCompleteResponse(BaseModel):
    xp: int
    challenge_streak: int
    xp_earned: int
    already_completed: bool

class CommentSchema(BaseModel):
    id: int
    text: str
    is_pinned: bool = False
    parent_id: Optional[int] = None
    created_at: Optional[datetime.datetime] = None
    owner: UserSchema

    @field_serializer('created_at', when_used='always')
    def serialize_created_at(self, dt: Optional[datetime.datetime]) -> Optional[str]:
        if dt is None:
            return None
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=datetime.timezone.utc)
        return dt.isoformat()

    class Config:
        orm_mode = True
        from_attributes = True

class CommentCreate(BaseModel):
    user_id: int
    text: str
    parent_id: Optional[int] = None

class LikeResponse(BaseModel):
    likes_count: int
    is_liked: bool

class SaveResponse(BaseModel):
    is_saved: bool

class PostSchema(BaseModel):
    id: int
    category_id: str
    post_type: str
    title: str
    body_text: Optional[str]
    image_url: Optional[str]
    caption: Optional[str]
    likes_count: int
    is_liked: bool = False
    is_saved: bool = False
    created_at: Optional[datetime.datetime] = None
    owner: UserSchema
    comments: List[CommentSchema] = []

    @field_serializer('created_at', when_used='always')
    def serialize_created_at(self, dt: Optional[datetime.datetime]) -> Optional[str]:
        if dt is None:
            return None
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=datetime.timezone.utc)
        return dt.isoformat()

    class Config:
        orm_mode = True
        from_attributes = True

class PostCreate(BaseModel):
    user_id: int
    category_id: str
    post_type: str
    title: str
    body_text: Optional[str] = None
    image_url: Optional[str] = None
    caption: Optional[str] = None

class PostUpdate(BaseModel):
    title: Optional[str] = None
    caption: Optional[str] = None
    body_text: Optional[str] = None
    image_url: Optional[str] = None
    category_id: Optional[str] = None

class DraftSchema(BaseModel):
    id: int
    user_id: int
    category_id: str
    post_type: str
    title: str = ""
    body_text: Optional[str] = None
    image_url: Optional[str] = None
    caption: Optional[str] = None
    draft_data: Optional[str] = None
    source_post_id: Optional[int] = None
    created_at: Optional[datetime.datetime] = None
    updated_at: Optional[datetime.datetime] = None

    @field_serializer('created_at', when_used='always')
    def serialize_created_at(self, dt: Optional[datetime.datetime]) -> Optional[str]:
        if dt is None:
            return None
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=datetime.timezone.utc)
        return dt.isoformat()

    @field_serializer('updated_at', when_used='always')
    def serialize_updated_at(self, dt: Optional[datetime.datetime]) -> Optional[str]:
        if dt is None:
            return None
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=datetime.timezone.utc)
        return dt.isoformat()

    class Config:
        orm_mode = True
        from_attributes = True

class DraftCreate(BaseModel):
    user_id: int = 1
    category_id: str
    post_type: str
    title: str = ""
    body_text: Optional[str] = None
    image_url: Optional[str] = None
    caption: Optional[str] = None
    draft_data: Optional[str] = None
    source_post_id: Optional[int] = None

class DraftUpdate(BaseModel):
    category_id: Optional[str] = None
    post_type: Optional[str] = None
    title: Optional[str] = None
    body_text: Optional[str] = None
    image_url: Optional[str] = None
    caption: Optional[str] = None
    draft_data: Optional[str] = None

# --- Dependency ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _serialize_draft(d: Draft) -> dict:
    """Return a dict matching DraftSchema from a Draft ORM object."""
    def _iso(dt):
        if dt is None:
            return None
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=datetime.timezone.utc)
        return dt.isoformat()
    return {
        "id": d.id,
        "user_id": d.user_id,
        "category_id": d.category_id,
        "post_type": d.post_type,
        "title": d.title or "",
        "body_text": d.body_text,
        "image_url": d.image_url,
        "caption": d.caption,
        "draft_data": d.draft_data,
        "source_post_id": d.source_post_id,
        "created_at": _iso(d.created_at),
        "updated_at": _iso(d.updated_at),
    }


@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)

    # Auto-migrate users table
    try:
        with engine.begin() as conn:
            if "sqlite" in DATABASE_URL:
                cols = [col[1] for col in conn.execute(text("PRAGMA table_info(users)")).fetchall()]
            else:
                cols = [col[0] for col in conn.execute(text("SHOW COLUMNS FROM users")).fetchall()]
            if "full_name" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN full_name VARCHAR(100) DEFAULT ''"))
            if "password_hash" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN password_hash TEXT"))
            if "xp" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0"))
                print(" [DATABASE] Added column users.xp")
            if "challenge_streak" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN challenge_streak INTEGER DEFAULT 0"))
                print(" [DATABASE] Added column users.challenge_streak")
            if "last_challenge_date" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN last_challenge_date VARCHAR(10)"))
    except Exception as mig_err:
        print(" [DATABASE] Column migration check notice:", mig_err)

    # Auto-migrate comments table
    try:
        with engine.begin() as conn:
            if "sqlite" in DATABASE_URL:
                ccols = [col[1] for col in conn.execute(text("PRAGMA table_info(comments)")).fetchall()]
            else:
                ccols = [col[0] for col in conn.execute(text("SHOW COLUMNS FROM comments")).fetchall()]
            if ccols and "is_pinned" not in ccols:
                conn.execute(text("ALTER TABLE comments ADD COLUMN is_pinned BOOLEAN DEFAULT 0"))
                print(" [DATABASE] Added column comments.is_pinned")
            if ccols and "parent_id" not in ccols:
                conn.execute(text("ALTER TABLE comments ADD COLUMN parent_id INTEGER"))
                print(" [DATABASE] Added column comments.parent_id")
    except Exception as col_err:
        print(" [DATABASE] Comments column migration notice:", col_err)

    # Auto-migrate drafts table (add source_post_id and created_at columns)
    try:
        with engine.begin() as conn:
            if "sqlite" in DATABASE_URL:
                dcols = [col[1] for col in conn.execute(text("PRAGMA table_info(drafts)")).fetchall()]
            else:
                dcols = [col[0] for col in conn.execute(text("SHOW COLUMNS FROM drafts")).fetchall()]
            if dcols and "source_post_id" not in dcols:
                conn.execute(text("ALTER TABLE drafts ADD COLUMN source_post_id INTEGER"))
                print(" [DATABASE] Added column drafts.source_post_id")
            if dcols and "created_at" not in dcols:
                conn.execute(text("ALTER TABLE drafts ADD COLUMN created_at DATETIME"))
                print(" [DATABASE] Added column drafts.created_at")
    except Exception as draft_mig_err:
        print(" [DATABASE] Drafts column migration notice:", draft_mig_err)

# --- Endpoints ---
@app.get("/")
def read_root():
    return {"message": "Welcome to Looma API"}

# --- Auth Endpoints ---
@app.post("/api/auth/register", response_model=AuthResponse)
@app.post("/api/register", response_model=AuthResponse)
def register(reg: UserRegister, db: Session = Depends(get_db)):
    clean_username = reg.username.strip()
    if not clean_username:
        raise HTTPException(status_code=400, detail="Username wajib diisi")
    if len(clean_username) < 3:
        raise HTTPException(status_code=400, detail="Username minimal 3 karakter")
    if not reg.password or len(reg.password) < 4:
        raise HTTPException(status_code=400, detail="Password minimal 4 karakter")

    existing_user = db.query(User).filter(func.lower(User.username) == clean_username.lower()).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username sudah digunakan, silakan pilih username lain")

    full_name = reg.fullName.strip() if reg.fullName and reg.fullName.strip() else clean_username
    new_user = User(
        username=clean_username,
        full_name=full_name,
        password_hash=hash_password(reg.password),
        role="Looma Creator",
        avatar="13",
        avatar_bg="#FFC93C",
        bio=f"Halo! Saya {full_name} ✨"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "Registrasi berhasil! Selamat datang di Looma 🎉", "user": new_user}

@app.post("/api/auth/login", response_model=AuthResponse)
@app.post("/api/login", response_model=AuthResponse)
def login(log: UserLogin, db: Session = Depends(get_db)):
    clean_username = log.username.strip()
    if not clean_username or not log.password:
        raise HTTPException(status_code=400, detail="Username dan password wajib diisi")

    user = db.query(User).filter(func.lower(User.username) == clean_username.lower()).first()
    if not user:
        raise HTTPException(status_code=401, detail="Username atau password salah")

    if not user.password_hash:
        user.password_hash = hash_password(log.password)
        db.commit()
    elif not verify_password(log.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Username atau password salah")

    return {"message": "Login berhasil! Selamat berkreasi 🚀", "user": user}

@app.get("/api/auth/me", response_model=UserSchema)
def get_current_user_info(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    return user

# Penting: dideklarasikan SEBELUM /api/users/{user_id}
@app.get("/api/users/suggested")
def get_suggested_users(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    # Suggestions come from persisted accounts, including new creators with no posts yet.
    query = db.query(User)
    if user_id is not None:
        query = query.filter(User.id != user_id)
    users = query.order_by(User.xp.desc(), User.id.desc()).limit(24).all()

    return [
        {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name or user.username,
            "role": user.role or "Looma Creator",
            "avatar": user.avatar or "13",
            "avatar_bg": "#FFFFFF",
            "bio": user.bio or "",
            "xp": user.xp or 0,
            "challenge_streak": user.challenge_streak or 0,
            "posts_count": db.query(Post).filter(Post.user_id == user.id).count(),
        }
        for user in users
    ]

@app.get("/api/users/search")
def search_users(q: str = "", db: Session = Depends(get_db)):
    query = (q or "").strip()
    if not query:
        users = db.query(User).order_by((User.xp or 0).desc()).limit(8).all()
    else:
        search_pattern = f"%{query.lower()}%"
        users = db.query(User).filter(
            or_(
                func.lower(User.username).like(search_pattern),
                func.lower(User.full_name).like(search_pattern)
            )
        ).limit(10).all()

    result = []
    for u in users:
        post_count = db.query(Post).filter(Post.user_id == u.id).count()
        result.append({
            "id": u.id,
            "username": u.username,
            "full_name": u.full_name or u.username,
            "role": u.role or "Looma Creator",
            "avatar": u.avatar or "13",
            "avatar_bg": "#FFFFFF",
            "bio": u.bio or "",
            "xp": u.xp or 0,
            "challenge_streak": u.challenge_streak or 0,
            "posts_count": post_count
        })
    return result

@app.get("/api/users/leaderboard")
def get_user_leaderboard(db: Session = Depends(get_db)):
    users = db.query(User).order_by((User.xp or 0).desc()).limit(5).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "avatar": u.avatar,
            "avatar_bg": u.avatar_bg,
            "xp": u.xp or 0,
            "challenge_streak": u.challenge_streak or 0,
        }
        for u in users
    ]

@app.get("/api/users/{user_id}", response_model=UserSchema)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.put("/api/users/{user_id}", response_model=UserSchema)
def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if user_update.username is not None:
        db_user.username = user_update.username
    if user_update.full_name is not None:
        db_user.full_name = user_update.full_name
    if user_update.avatar is not None:
        db_user.avatar = user_update.avatar
    if user_update.bio is not None:
        db_user.bio = user_update.bio

    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/api/users/{user_id}/challenges/complete", response_model=ChallengeCompleteResponse)
def complete_daily_challenge(user_id: int, payload: ChallengeComplete, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.last_challenge_date == payload.date:
        return {
            "xp": user.xp or 0,
            "challenge_streak": user.challenge_streak or 0,
            "xp_earned": 0,
            "already_completed": True,
        }

    try:
        yesterday = (datetime.date.fromisoformat(payload.date) - datetime.timedelta(days=1)).isoformat()
    except ValueError:
        yesterday = None
    streak = (user.challenge_streak or 0) + 1 if user.last_challenge_date == yesterday else 1
    xp_earned = 20 + min((streak - 1) * 5, 25)

    user.xp = (user.xp or 0) + xp_earned
    user.challenge_streak = streak
    user.last_challenge_date = payload.date
    db.commit()
    db.refresh(user)

    return {
        "xp": user.xp,
        "challenge_streak": streak,
        "xp_earned": xp_earned,
        "already_completed": False,
    }

@app.get("/api/posts", response_model=List[PostSchema])
def get_posts(user_id: int = 1, db: Session = Depends(get_db)):
    posts = db.query(Post).order_by(Post.created_at.desc()).all()
    result = []
    for p in posts:
        is_liked = db.query(PostLike).filter(PostLike.post_id == p.id, PostLike.user_id == user_id).first() is not None
        is_saved = db.query(PostSave).filter(PostSave.post_id == p.id, PostSave.user_id == user_id).first() is not None
        p_dict = {
            "id": p.id,
            "category_id": p.category_id,
            "post_type": p.post_type,
            "title": p.title,
            "body_text": p.body_text,
            "image_url": p.image_url,
            "caption": p.caption,
            "likes_count": p.likes_count,
            "created_at": p.created_at,
            "is_liked": is_liked,
            "is_saved": is_saved,
            "owner": p.owner,
            "comments": sorted(p.comments, key=lambda c: (not bool(c.is_pinned), c.created_at))
        }
        result.append(p_dict)
    return result

@app.post("/api/posts", response_model=PostSchema)
def create_post(post: PostCreate, db: Session = Depends(get_db)):
    db_post = Post(**post.dict())
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    full_post = db.query(Post).filter(Post.id == db_post.id).first()
    if full_post is None:
        raise HTTPException(status_code=500, detail="Post creation failed")
    return {
        "id": full_post.id,
        "category_id": full_post.category_id,
        "post_type": full_post.post_type,
        "title": full_post.title,
        "body_text": full_post.body_text,
        "image_url": full_post.image_url,
        "caption": full_post.caption,
        "likes_count": full_post.likes_count,
        "created_at": full_post.created_at,
        "is_liked": False,
        "is_saved": False,
        "owner": full_post.owner,
        "comments": [],
    }

@app.put("/api/posts/{post_id}", response_model=PostSchema)
def update_post(post_id: int, post_update: PostUpdate, user_id: int = 1, db: Session = Depends(get_db)):
    db_post = db.query(Post).filter(Post.id == post_id).first()
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")
    if db_post.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this post")

    if post_update.title is not None:
        db_post.title = post_update.title
    if post_update.caption is not None:
        db_post.caption = post_update.caption
    if post_update.body_text is not None:
        db_post.body_text = post_update.body_text
    if post_update.image_url is not None:
        db_post.image_url = post_update.image_url
    if post_update.category_id is not None:
        db_post.category_id = post_update.category_id

    db.commit()
    db.refresh(db_post)
    updated = db.query(Post).filter(Post.id == post_id).first()
    is_liked = db.query(PostLike).filter(PostLike.post_id == post_id, PostLike.user_id == user_id).first() is not None
    is_saved = db.query(PostSave).filter(PostSave.post_id == post_id, PostSave.user_id == user_id).first() is not None
    return {
        "id": updated.id,
        "category_id": updated.category_id,
        "post_type": updated.post_type,
        "title": updated.title,
        "body_text": updated.body_text,
        "image_url": updated.image_url,
        "caption": updated.caption,
        "likes_count": updated.likes_count,
        "created_at": updated.created_at,
        "is_liked": is_liked,
        "is_saved": is_saved,
        "owner": updated.owner,
        "comments": sorted(updated.comments, key=lambda c: (not bool(c.is_pinned), c.created_at)),
    }

@app.delete("/api/posts/{post_id}")
def delete_post(post_id: int, user_id: int = 1, db: Session = Depends(get_db)):
    db_post = db.query(Post).filter(Post.id == post_id).first()
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")
    if db_post.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")

    db.query(PostLike).filter(PostLike.post_id == post_id).delete()
    db.query(PostSave).filter(PostSave.post_id == post_id).delete()
    db.query(Comment).filter(Comment.post_id == post_id).delete()
    db.delete(db_post)
    db.commit()
    return {"message": "Post deleted successfully", "id": post_id}

# --- Move published post to draft (idempotent) ---
@app.post("/api/posts/{post_id}/move-to-draft")
def move_post_to_draft(post_id: int, user_id: int = 1, db: Session = Depends(get_db)):
    """
    Convert a published Post into a Draft atomically.
    Idempotent: if a draft for this post already exists, returns it without creating a duplicate.
    """
    db_post = db.query(Post).filter(Post.id == post_id).first()
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")
    if db_post.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Idempotency: check if we already have a draft that came from this post
    existing_draft = db.query(Draft).filter(
        Draft.source_post_id == post_id,
        Draft.user_id == user_id
    ).first()
    if existing_draft:
        # Post may already have been deleted in a previous call — clean up if it still exists
        still_exists = db.query(Post).filter(Post.id == post_id).first()
        if still_exists:
            db.query(PostLike).filter(PostLike.post_id == post_id).delete()
            db.query(PostSave).filter(PostSave.post_id == post_id).delete()
            db.query(Comment).filter(Comment.post_id == post_id).delete()
            db.delete(still_exists)
            db.commit()
        return _serialize_draft(existing_draft)

    # Build extra data to preserve studio-specific fields
    import json as _json
    extra = {"fromPostId": post_id}

    now = datetime.datetime.utcnow()
    new_draft = Draft(
        user_id=user_id,
        category_id=db_post.category_id,
        post_type=db_post.post_type,
        title=db_post.title or "",
        body_text=db_post.body_text,
        image_url=db_post.image_url,
        caption=db_post.caption,
        draft_data=_json.dumps(extra),
        source_post_id=post_id,
        created_at=now,
        updated_at=now,
    )
    db.add(new_draft)

    # Delete the published post and its relations atomically
    db.query(PostLike).filter(PostLike.post_id == post_id).delete()
    db.query(PostSave).filter(PostSave.post_id == post_id).delete()
    db.query(Comment).filter(Comment.post_id == post_id).delete()
    db.delete(db_post)

    db.commit()
    db.refresh(new_draft)
    return _serialize_draft(new_draft)

@app.post("/api/posts/{post_id}/comments", response_model=CommentSchema)
def add_comment(post_id: int, comment: CommentCreate, db: Session = Depends(get_db)):
    db_post = db.query(Post).filter(Post.id == post_id).first()
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")

    db_comment = Comment(post_id=post_id, user_id=comment.user_id, text=comment.text, parent_id=comment.parent_id)
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment

@app.delete("/api/posts/{post_id}/comments/{comment_id}")
def delete_comment(post_id: int, comment_id: int, user_id: int = 1, db: Session = Depends(get_db)):
    db_comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not db_comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    db_post = db.query(Post).filter(Post.id == post_id).first()
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")

    if db_comment.user_id != user_id and db_post.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")

    db.query(Comment).filter(Comment.parent_id == comment_id).delete(synchronize_session=False)
    db.delete(db_comment)
    db.commit()
    return {"message": "Comment deleted successfully", "id": comment_id}

@app.post("/api/posts/{post_id}/comments/{comment_id}/pin")
def toggle_pin_comment(post_id: int, comment_id: int, user_id: int = 1, db: Session = Depends(get_db)):
    db_comment = db.query(Comment).filter(Comment.id == comment_id, Comment.post_id == post_id).first()
    if not db_comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    db_post = db.query(Post).filter(Post.id == post_id).first()
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")

    if db_post.user_id != user_id:
        raise HTTPException(status_code=403, detail="Hanya pembuat postingan yang bisa menyematkan komentar")

    if db_comment.is_pinned:
        db_comment.is_pinned = False
        db.commit()
        return {"message": "Komentar dilepas dari sematan", "id": comment_id, "is_pinned": False}

    db.query(Comment).filter(Comment.post_id == post_id, Comment.is_pinned == True).update({"is_pinned": False})
    db_comment.is_pinned = True
    db.commit()
    db.refresh(db_comment)
    return {"message": "Komentar disematkan", "id": comment_id, "is_pinned": True}

@app.delete("/api/comments/{comment_id}")
def delete_comment_direct(comment_id: int, user_id: int = 1, db: Session = Depends(get_db)):
    db_comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not db_comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    db_post = db.query(Post).filter(Post.id == db_comment.post_id).first()
    post_owner_id = db_post.user_id if db_post else None

    if db_comment.user_id != user_id and post_owner_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")

    db.query(Comment).filter(Comment.parent_id == comment_id).delete(synchronize_session=False)
    db.delete(db_comment)
    db.commit()
    return {"message": "Comment deleted successfully", "id": comment_id}

@app.post("/api/posts/{post_id}/like", response_model=LikeResponse)
def toggle_like(post_id: int, user_id: int = 1, db: Session = Depends(get_db)):
    db_post = db.query(Post).filter(Post.id == post_id).first()
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")

    like = db.query(PostLike).filter(PostLike.post_id == post_id, PostLike.user_id == user_id).first()
    if like:
        db.delete(like)
        db_post.likes_count = max(0, db_post.likes_count - 1)
        is_liked = False
    else:
        new_like = PostLike(post_id=post_id, user_id=user_id)
        db.add(new_like)
        db_post.likes_count += 1
        is_liked = True

    db.commit()
    return {"likes_count": db_post.likes_count, "is_liked": is_liked}

@app.post("/api/posts/{post_id}/save", response_model=SaveResponse)
def toggle_save(post_id: int, user_id: int = 1, db: Session = Depends(get_db)):
    db_post = db.query(Post).filter(Post.id == post_id).first()
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")

    save = db.query(PostSave).filter(PostSave.post_id == post_id, PostSave.user_id == user_id).first()
    if save:
        db.delete(save)
        is_saved = False
    else:
        new_save = PostSave(post_id=post_id, user_id=user_id)
        db.add(new_save)
        is_saved = True

    db.commit()
    return {"is_saved": is_saved}

# --- Drafts Endpoints ---
@app.get("/api/drafts", response_model=List[DraftSchema])
def get_drafts(user_id: int = 1, db: Session = Depends(get_db)):
    drafts = db.query(Draft).filter(Draft.user_id == user_id).order_by(Draft.updated_at.desc()).all()
    return [_serialize_draft(d) for d in drafts]

@app.post("/api/drafts", response_model=DraftSchema)
def save_draft(draft: DraftCreate, db: Session = Depends(get_db)):
    now = datetime.datetime.utcnow()
    db_draft = Draft(
        user_id=draft.user_id,
        category_id=draft.category_id,
        post_type=draft.post_type,
        title=draft.title,
        body_text=draft.body_text,
        image_url=draft.image_url,
        caption=draft.caption,
        draft_data=draft.draft_data,
        source_post_id=draft.source_post_id,
        created_at=now,
        updated_at=now,
    )
    db.add(db_draft)
    db.commit()
    db.refresh(db_draft)
    return _serialize_draft(db_draft)

@app.put("/api/drafts/{draft_id}", response_model=DraftSchema)
def update_draft(draft_id: int, draft: DraftUpdate, db: Session = Depends(get_db)):
    db_draft = db.query(Draft).filter(Draft.id == draft_id).first()
    if not db_draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    for key, value in draft.dict(exclude_unset=True).items():
        setattr(db_draft, key, value)
    db_draft.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(db_draft)
    return _serialize_draft(db_draft)

@app.delete("/api/drafts/{draft_id}")
def delete_draft(draft_id: int, user_id: int = 1, db: Session = Depends(get_db)):
    db_draft = db.query(Draft).filter(Draft.id == draft_id).first()
    if not db_draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    if db_draft.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this draft")
    db.delete(db_draft)
    db.commit()
    return {"message": "Draft deleted successfully", "id": draft_id}
