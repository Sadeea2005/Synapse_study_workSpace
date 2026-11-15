import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Shuffle,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Keyboard,
} from 'lucide-react';
import { Flashcard } from '../lib/schema';

interface FlashcardDeckProps {
  cards: Flashcard[];
}

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ cards }) => {
  const [deck, setDeck] = useState<Flashcard[]>(cards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setDeck(cards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setMasteredIds(new Set());
  }, [cards]);

  const currentCard = deck[currentIndex];

  const handleNext = useCallback(() => {
    setIsFlipped(false);
    setShowHint(false);
    setCurrentIndex((prev) => (prev + 1) % deck.length);
  }, [deck.length]);

  const handlePrev = useCallback(() => {
    setIsFlipped(false);
    setShowHint(false);
    setCurrentIndex((prev) => (prev - 1 + deck.length) % deck.length);
  }, [deck.length]);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const toggleMastered = useCallback((id: string) => {
    setMasteredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleShuffle = () => {
    const shuffled = [...deck].sort(() => Math.random() - 0.5);
    setDeck(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Do not intercept keyboard shortcuts when typing in an input or textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT') return;

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleFlip();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key.toLowerCase() === 'm' && currentCard) {
        e.preventDefault();
        toggleMastered(currentCard.id);
      } else if (e.key.toLowerCase() === 'h' && currentCard?.hint) {
        e.preventDefault();
        setShowHint((prev) => !prev);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleFlip, handleNext, handlePrev, toggleMastered, currentCard]);

  if (!currentCard) return null;

  const isMastered = masteredIds.has(currentCard.id);
  const progressPercent = Math.round(((currentIndex + 1) / deck.length) * 100);

  const difficultyStyles = {
    easy: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    medium: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    hard: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Deck Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Card <span className="text-indigo-600 dark:text-indigo-400">{currentIndex + 1}</span> of{' '}
            {deck.length}
          </div>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {masteredIds.size} / {deck.length} Mastered
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleMastered(currentCard.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isMastered
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            title="Shortcut: Press M"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {isMastered ? 'Mastered' : 'Mark Mastered'}
          </button>

          <button
            type="button"
            onClick={handleShuffle}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Shuffle deck order"
          >
            <Shuffle className="w-3.5 h-3.5" />
            Shuffle
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 3D Flip Card Container */}
      <div className="perspective-1000">
        <div
          role="button"
          tabIndex={0}
          aria-label={isFlipped ? 'Flashcard answer side. Click to flip to question.' : 'Flashcard question side. Click to flip to answer.'}
          onClick={handleFlip}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleFlip();
            }
          }}
          className={`relative w-full min-h-[300px] sm:min-h-[340px] cursor-pointer select-none transition-transform duration-500 transform-style-3d focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950 rounded-2xl ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* FRONT FACE */}
          <div className="absolute inset-0 backface-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                <Sparkles className="w-3 h-3" />
                {currentCard.category}
              </span>

              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${
                    difficultyStyles[currentCard.difficulty]
                  }`}
                >
                  {currentCard.difficulty}
                </span>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Prompt
                </span>
              </div>
            </div>

            <div className="my-auto py-6 text-center">
              <p className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                {currentCard.front}
              </p>

              {currentCard.hint && (
                <div className="mt-6">
                  {showHint ? (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="inline-block max-w-md px-4 py-2 rounded-lg bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 text-xs text-amber-800 dark:text-amber-300"
                    >
                      <strong>Hint:</strong> {currentCard.hint}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowHint(true);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      Show Hint (H)
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-slate-400 dark:text-slate-500">
              <RotateCw className="w-3.5 h-3.5" />
              <span>Click card or press Spacebar to reveal answer</span>
            </div>
          </div>

          {/* BACK FACE */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-indigo-50/80 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40 border-2 border-indigo-500/40 dark:border-indigo-500/50 rounded-2xl p-6 sm:p-10 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Answer & Explanation
              </span>
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                {currentCard.category}
              </span>
            </div>

            <div className="my-auto py-6 text-center">
              <p className="text-base sm:text-lg font-medium text-slate-800 dark:text-slate-100 leading-relaxed max-w-2xl mx-auto">
                {currentCard.back}
              </p>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
              <RotateCw className="w-3.5 h-3.5" />
              <span>Click card or press Spacebar to flip back</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
        <div className="flex items-center gap-3 w-full sm:w-auto justify-center">
          <button
            type="button"
            onClick={handlePrev}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <button
            type="button"
            onClick={handleFlip}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
          >
            <RotateCw className="w-4 h-4" />
            {isFlipped ? 'Show Prompt' : 'Reveal Answer'}
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Keyboard Accessibility Legend */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Keyboard className="w-3.5 h-3.5" />
          <span>Shortcuts:</span>
          <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-[11px]">
            Space
          </kbd>
          <span>Flip</span>
          <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-[11px]">
            ←/→
          </kbd>
          <span>Navigate</span>
          <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-[11px]">
            M
          </kbd>
          <span>Master</span>
        </div>
      </div>
    </div>
  );
};
