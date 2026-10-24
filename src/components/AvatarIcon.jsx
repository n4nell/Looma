import React from 'react';

export default function AvatarIcon({ id, className = "w-12 h-12", style = {} }) {
  // If it's still an old emoji, just render the emoji for fallback
  const isEmoji = isNaN(id) && id && !id.toString().startsWith('avatar');
  
  if (isEmoji) {
    return (
      <div className={`flex items-center justify-center shrink-0 ${className}`} style={style}>
        {id}
      </div>
    );
  }

  // Parse ID
  let numericId = 0;
  if (typeof id === 'number') {
    numericId = id;
  } else if (typeof id === 'string') {
    numericId = parseInt(id.replace('avatar_', '')) || 0;
  }
  
  const avatarSrc = `/images/avatars/avatar_${numericId}.png`;

  return (
    <div 
      className={`shrink-0 overflow-hidden flex items-center justify-center bg-white ${className}`}
      style={{ backgroundColor: '#FFFFFF', ...style }}
    >
      <img 
        src={avatarSrc} 
        alt={`Avatar ${numericId}`} 
        className="w-full h-full object-contain pointer-events-none select-none"
        onError={(e) => {
          // Fallback if image fails
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
}
