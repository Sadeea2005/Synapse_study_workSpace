import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Award,
  ArrowRight,
  Filter,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import { QuizQuestion } from '../lib/schema';

interface QuizViewProps {
  questions: QuizQuestion[];
}

export const QuizView: React.FC<QuizViewProps> = ({ questions }) => {
  // Active subset of questions (either full quiz or only missed questions during re-test)
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>(questions);
  const [isRetestMode, setIsRetestMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [revealedQuestions, setRevealedQuestions] = useState<Record<string, boolean>>({});
  const [isCompleted, setIsCompleted] = useState(false);

  // Reset state when parent passes a fresh set of questions
  useEffect(() => {
    setActiveQuestions(questions);
    setIsRetestMode(false);
    setCurrentIndex(0);
    setSelectedAnswers({});
    setRevealedQuestions({});
    setIsCompleted(false);
  }, [questions]);

  const currentQuestion = activeQuestions[currentIndex];
  const selectedIndex = currentQuestion ? selectedAnswers[currentQuestion.id] : undefined;
  const isRevealed = currentQuestion ? !!revealedQuestions[currentQuestion.id] : false;

  const handleSelectOption = useCallback(
    (optionIndex: number) => {
      if (!currentQuestion || isRevealed) return;
      setSelectedAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: optionIndex,
      }));
      setRevealedQuestions((prev) => ({
        ...prev,
        [currentQuestion.id]: true,
      }));
    },
    [currentQuestion, isRevealed]
  );

  const handleNextQuestion = useCallback(() => {
    if (currentIndex + 1 < activeQuestions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  }, [currentIndex, activeQuestions.length]);

  // Keyboard support: 1-4 to pick option, Enter to advance
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT') return;
      if (isCompleted || !currentQuestion) return;

      if (['1', '2', '3', '4'].includes(e.key) && !isRevealed) {
        const idx = Number(e.key) - 1;
        if (idx < currentQuestion.options.length) {
          e.preventDefault();
          handleSelectOption(idx);
        }
      } else if (e.key === 'Enter' && isRevealed) {
        e.preventDefault();
        handleNextQuestion();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isCompleted, currentQuestion, isRevealed, handleSelectOption, handleNextQuestion]);

  // Calculate score and wrong questions
  const wrongQuestions = activeQuestions.filter(
    (q) => selectedAnswers[q.id] !== q.correctIndex
  );
  const correctCount = activeQuestions.length - wrongQuestions.length;
  const scorePercent =
    activeQuestions.length > 0
      ? Math.round((correctCount / activeQuestions.length) * 100)
      : 0;

  // Dedicated UI Flow: Re-test ONLY wrong answers
  const handleStartRetestWrongOnly = () => {
    if (wrongQuestions.length === 0) return;
    setActiveQuestions(wrongQuestions);
    setIsRetestMode(true);
    setCurrentIndex(0);
    setSelectedAnswers({});
    setRevealedQuestions({});
    setIsCompleted(false);
  };

  // Reset entire quiz back to all original questions
  const handleRestartFullQuiz = () => {
    setActiveQuestions(questions);
    setIsRetestMode(false);
    setCurrentIndex(0);
    setSelectedAnswers({});
    setRevealedQuestions({});
    setIsCompleted(false);
  };

  if (isCompleted) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-8 animate-fade-in">
        {/* Score Header Banner */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${
                wrongQuestions.length === 0
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400'
                  : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400'
              }`}
            >
              <Award className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {wrongQuestions.length === 0
                    ? 'Perfect Mastery Achieved!'
                    : isRetestMode
                    ? 'Targeted Re-Test Complete'
                    : 'Quiz Assessment Complete'}
                </h3>
                {isRetestMode && (
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    Retest Round
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                You answered{' '}
                <strong className="text-slate-900 dark:text-slate-100">{correctCount}</strong> out of{' '}
                <strong className="text-slate-900 dark:text-slate-100">
                  {activeQuestions.length}
                </strong>{' '}
                questions correctly ({scorePercent}%).
              </p>
            </div>
          </div>

          {/* Primary Action Buttons: Re-test Wrong Answers vs Full Reset */}
          <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
            {wrongQuestions.length > 0 && (
              <button
                type="button"
                onClick={handleStartRetestWrongOnly}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-colors"
              >
                <Filter className="w-4 h-4" />
                Re-test {wrongQuestions.length} Missed{' '}
                {wrongQuestions.length === 1 ? 'Question' : 'Questions'}
              </button>
            )}

            <button
              type="button"
              onClick={handleRestartFullQuiz}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Retake Full Quiz ({questions.length})
            </button>
          </div>
        </div>

        {/* Breakdown of Missed Questions (if any) */}
        {wrongQuestions.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4" />
              <span>Review Missed Concepts ({wrongQuestions.length})</span>
            </div>

            <div className="space-y-4">
              {wrongQuestions.map((q) => {
                const userChoice = selectedAnswers[q.id];
                return (
                  <div
                    key={q.id}
                    className="p-4 sm:p-5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {q.question}
                      </p>
                      <span className="shrink-0 px-2 py-0.5 text-xs font-medium rounded bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {q.topic}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-rose-100/70 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
                        <span className="font-semibold block mb-0.5">Your Answer:</span>
                        {userChoice !== undefined ? q.options[userChoice] : 'Skipped'}
                      </div>
                      <div className="p-2.5 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                        <span className="font-semibold block mb-0.5">Correct Answer:</span>
                        {q.options[q.correctIndex]}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
                      <strong className="text-slate-700 dark:text-slate-300">Why:</strong>{' '}
                      {q.explanation}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
            <p className="text-base font-semibold text-emerald-900 dark:text-emerald-200">
              Zero wrong answers! You have mastered every question in this round.
            </p>
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              Try generating a new study set or retaking the full quiz to reinforce retention.
            </p>
          </div>
        )}
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Question{' '}
            <span className="text-indigo-600 dark:text-indigo-400">{currentIndex + 1}</span> of{' '}
            {activeQuestions.length}
          </span>

          {isRetestMode && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              <Filter className="w-3 h-3" />
              Targeted Re-Test Mode (Missed Only)
            </span>
          )}
        </div>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
          {currentQuestion.topic}
        </span>
      </div>

      {/* Question Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 leading-snug">
          {currentQuestion.question}
        </h3>

        {/* Options List */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedIndex === idx;
            const isCorrect = currentQuestion.correctIndex === idx;

            let optionStyle =
              'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200';

            if (isRevealed) {
              if (isCorrect) {
                optionStyle =
                  'border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500';
              } else if (isSelected && !isCorrect) {
                optionStyle =
                  'border-rose-500 bg-rose-50/90 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 ring-1 ring-rose-500';
              } else {
                optionStyle =
                  'border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500 opacity-75';
              }
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={isRevealed}
                onClick={() => handleSelectOption(idx)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${optionStyle}`}
              >
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-sm sm:text-base font-medium leading-relaxed">{option}</span>
                </div>

                {isRevealed && isCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                )}
                {isRevealed && isSelected && !isCorrect && (
                  <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* Immediate Feedback Explanation Box */}
        {isRevealed && (
          <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/70 space-y-1.5 animate-fade-in">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
              {selectedIndex === currentQuestion.correctIndex
                ? 'Correct Answer!'
                : 'Explanation & Concept Review'}
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {currentQuestion.explanation}
            </p>
          </div>
        )}

        {/* Next / Finish Action */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {!isRevealed
              ? 'Select an option (or press keys 1-4)'
              : 'Press Enter or click Next to continue'}
          </span>

          <button
            type="button"
            disabled={!isRevealed}
            onClick={handleNextQuestion}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:pointer-events-none text-white shadow-sm transition-colors"
          >
            {currentIndex + 1 < activeQuestions.length ? 'Next Question' : 'View Results'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
