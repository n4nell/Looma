import React from 'react';
import { Lightbulb, Star } from 'lucide-react';
import { parseIdeaBody } from '../utils/ideaContent';

const CARD_EMOJIS = {
  vision: '🌈',
  problem: '🧩',
  solution: '✨',
  action: '🚀',
  target: '👀',
  note: '💬',
};

export default function IdeaPostContent({ title, body, modal = false, compact = false }) {
  const idea = parseIdeaBody(body);

  if (compact) {
    return (
      <article className="relative w-full overflow-hidden rounded-2xl border-2 border-[#302541] bg-[#FFFAF1] p-3 shadow-[3px_3px_0px_#302541]">
        <header className="mb-2 flex items-start gap-2 border-b border-dashed border-[#302541]/20 pb-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-[#302541] bg-[#FFD978]"><Lightbulb className="h-4 w-4" /></div>
          <div className="min-w-0 flex-1">
            <span className="text-[8px] font-black uppercase tracking-wider text-[#746B7C]">Idea Board</span>
            {title && <h3 className="line-clamp-2 break-words font-display text-sm font-black leading-tight text-[#302541]">{title}</h3>}
            {idea.category && <p className="line-clamp-1 text-[8px] font-black uppercase text-[#746B7C]">{idea.category}</p>}
          </div>
          {idea.impact > 0 && <div className="flex shrink-0 gap-0.5 pt-1">{Array.from({ length: 5 }, (_, index) => <Star key={index} className={`h-2.5 w-2.5 ${index < idea.impact ? 'fill-[#FFD978] text-[#302541]' : 'text-[#302541]/20'}`} />)}</div>}
        </header>
        {idea.cards.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {idea.cards.map((card, index) => (
              <section key={`${card.id}-${card.title}`} style={{ backgroundColor: card.color }} className="min-w-0 overflow-hidden rounded-xl border-2 border-[#302541] p-2 shadow-[2px_2px_0px_#302541]">
                <h4 className="line-clamp-2 break-words text-[10px] font-black leading-tight text-[#302541]">{index + 1}. {card.title}</h4>
                {card.desc && <p className="mt-1 line-clamp-2 whitespace-pre-line break-words text-[9px] font-bold leading-snug text-[#302541]/85">{card.desc}</p>}
              </section>
            ))}
          </div>
        ) : body ? <p className="line-clamp-3 whitespace-pre-line break-words rounded-xl border border-[#302541]/15 bg-white/80 p-2 text-[10px] font-bold text-[#302541]">{body}</p> : null}
      </article>
    );
  }

  return (
    <article className="relative w-full overflow-hidden rounded-[28px] border-[3px] border-[#302541] bg-[#FFFAF1] p-4 shadow-[5px_5px_0px_#302541] sm:p-5">
      <div className="pointer-events-none absolute -right-5 -top-7 h-24 w-24 rotate-12 rounded-[28px] border-[3px] border-[#302541]/15 bg-[#FFE2D8]" />
      <div className="pointer-events-none absolute -bottom-8 -left-5 h-24 w-24 -rotate-12 rounded-full border-[3px] border-[#302541]/15 bg-[#A8D8B9]" />

      <header className="relative mb-4 flex items-start gap-3 border-b-2 border-dashed border-[#302541]/20 pb-4">
        <div className="flex h-12 w-12 shrink-0 rotate-[-6deg] items-center justify-center rounded-2xl border-[2.5px] border-[#302541] bg-[#FFD978] shadow-[2px_2px_0px_#302541]">
          <Lightbulb className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="inline-flex -rotate-1 rounded-full border-2 border-[#302541] bg-[#FFD978] px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-[#302541]">
            Idea Board
          </span>
          {title && <h3 className="mt-2 break-words font-display text-xl font-black leading-tight text-[#302541] sm:text-2xl">{title}</h3>}
          {idea.category && <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-[#746B7C]">{idea.category}</p>}
        </div>
        {idea.impact > 0 && (
          <div className="relative flex shrink-0 -rotate-2 items-center gap-1 rounded-xl border-2 border-[#302541] bg-white px-2 py-1.5 shadow-[2px_2px_0px_#302541]" title={`Potential impact: ${idea.impact}/5`}>
            {Array.from({ length: 5 }, (_, index) => (
              <Star key={index} className={`h-3 w-3 ${index < idea.impact ? 'fill-[#FFD978] text-[#302541]' : 'text-[#302541]/20'}`} />
            ))}
          </div>
        )}
      </header>

      {idea.cards.length > 0 ? (
        <div className={`relative grid grid-cols-1 gap-3 ${modal ? 'sm:grid-cols-2' : 'sm:grid-cols-2'}`}>
          {idea.cards.map((card, index) => (
            <section
              key={`${card.id}-${card.title}`}
              style={{ backgroundColor: card.color }}
              className={`relative min-w-0 overflow-hidden rounded-[20px] border-[2.5px] border-[#302541] p-3.5 shadow-[3px_3px_0px_#302541] ${index % 2 === 0 ? '-rotate-[0.6deg]' : 'rotate-[0.6deg]'}`}
            >
              <span className="absolute -right-1 -top-1 text-2xl opacity-35">{CARD_EMOJIS[card.type] || '✨'}</span>
              <div className="relative flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-[#302541] bg-white text-[10px] font-black">{index + 1}</span>
                {card.title && <h4 className="min-w-0 break-words font-display text-sm font-black leading-snug text-[#302541]">{card.title}</h4>}
              </div>
              {card.desc && <p className="relative mt-2 whitespace-pre-line break-words text-xs font-bold leading-relaxed text-[#302541]/90 sm:text-sm">{card.desc}</p>}
            </section>
          ))}
        </div>
      ) : body ? (
        <p className="relative whitespace-pre-line break-words rounded-2xl border-2 border-[#302541]/15 bg-white/80 p-4 text-sm font-bold leading-relaxed text-[#302541]">{body}</p>
      ) : (
        <p className="relative rounded-2xl border-2 border-dashed border-[#302541]/25 bg-white/70 p-4 text-sm font-bold text-[#746B7C]">A bright idea is brewing…</p>
      )}
    </article>
  );
}
