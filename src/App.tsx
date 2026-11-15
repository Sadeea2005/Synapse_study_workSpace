import React, { useState, useRef, useEffect } from 'react';
import {
  BookOpen,
  Layers,
  CheckSquare,
  Sparkles,
  Moon,
  Sun,
  Zap,
  FileText,
  XCircle,
} from 'lucide-react';
import {
  StudySet,
  ValidationFailureDetails,
  parseAndValidateStudySet,
} from './lib/schema';
import { SAMPLE_PRESETS } from './lib/presets';
import { FlashcardDeck } from './components/FlashcardDeck';
import { QuizView } from './components/QuizView';
import { ErrorStateCard, LoadingSkeleton } from './components/ErrorAndLoadingStates';

type AppViewState = 'empty' | 'loading' | 'error' | 'success';
type StudyTab = 'flashcards' | 'quiz';

export function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [notes, setNotes] = useState<string>(SAMPLE_PRESETS[0].content);
  const [viewState, setViewState] = useState<AppViewState>('empty');
  const [activeTab, setActiveTab] = useState<StudyTab>('flashcards');
  const [studySet, setStudySet] = useState<StudySet | null>(null);
  const [errorDetails, setErrorDetails] = useState<ValidationFailureDetails | null>(null);
  const [activeRequestId, setActiveRequestId] = useState<number>(0);

  const abortControllerRef = useRef<AbortController | null>(null);
  const latestRequestIdRef = useRef<number>(0);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  const handleGenerate = async () => {
    // 1. Race Condition Protection: Abort any in-flight request before starting a new one
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // 2. Monotonic Request ID tracking so stale responses can never overwrite newer state
    const currentReqId = latestRequestIdRef.current + 1;
    latestRequestIdRef.current = currentReqId;
    setActiveRequestId(currentReqId);

    setViewState('loading');
    setErrorDetails(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          notes,
          requestId: String(currentReqId),
        }),
      });

      // Guard against stale responses resolving after a newer request was fired
      if (currentReqId !== latestRequestIdRef.current) {
        return;
      }

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setErrorDetails({
          kind: 'network_error',
          title: `Could Not Generate Study Set (HTTP ${response.status})`,
          message:
            payload?.error ||
            'The server encountered an error while generating your study materials. Please try again.',
        });
        setViewState('error');
        return;
      }

      // 3. Strict Frontend Zod Validation of untrusted AI output
      const validation = parseAndValidateStudySet(payload?.rawOutput);

      if (!validation.success) {
        setErrorDetails(validation.error);
        setViewState('error');
        return;
      }

      setStudySet(validation.data);
      setViewState('success');
    } catch (err: any) {
      // Ignore AbortError from cancelled stale requests
      if (err?.name === 'AbortError') {
        return;
      }
      if (currentReqId !== latestRequestIdRef.current) {
        return;
      }
      setErrorDetails({
        kind: 'network_error',
        title: 'Connection Error',
        message:
          err?.message ||
          'Could not reach the backend server. Ensure `npm start` is running.',
      });
      setViewState('error');
    }
  };

  const handleCancelInFlight = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setViewState(studySet ? 'success' : 'empty');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Top SaaS Navigation Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                  Synopsis
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-semibold rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                  Study Assistant
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Turn your notes or topics into interactive flashcards and quizzes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDarkMode((prev) => !prev)}
              aria-label="Toggle Dark Mode"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Responsive Split Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* LEFT PANEL: Clean Study Notes Input (5 cols on desktop) */}
          <section className="lg:col-span-5 space-y-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="study-notes-input"
                  className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Your Study Notes or Topic
                </label>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {notes.trim().length} chars
                </span>
              </div>

              {/* Sample Topic Pills */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Try an example topic:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {SAMPLE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setNotes(preset.content)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 dark:bg-slate-800 dark:hover:bg-indigo-950/60 dark:text-slate-300 dark:hover:text-indigo-300 border border-slate-200/80 dark:border-slate-700 transition-colors"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Free-form Textarea */}
              <textarea
                id="study-notes-input"
                rows={12}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Paste your lecture notes, textbook excerpts, or type any topic (e.g., 'React Hooks', 'Photosynthesis', 'World War II')..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-3.5 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all resize-y leading-relaxed"
              />

              {/* Single Clean Action Button */}
              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  disabled={notes.trim().length < 3}
                  onClick={handleGenerate}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-40 disabled:pointer-events-none text-white shadow-sm transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  {viewState === 'loading' ? 'Generating...' : 'Generate Study Material'}
                </button>

                {viewState === 'loading' && (
                  <button
                    type="button"
                    onClick={handleCancelInFlight}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-colors"
                    title="Cancel generation"
                  >
                    <XCircle className="w-4 h-4" />
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* RIGHT PANEL: Interactive Study Workspace (7 cols on desktop) */}
          <section className="lg:col-span-7 space-y-6">
            {/* STATE 1: EMPTY INITIAL VIEW */}
            {viewState === 'empty' && (
              <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-8 sm:p-12 text-center space-y-5 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                  <Zap className="w-7 h-7" />
                </div>
                <div className="space-y-2 max-w-md mx-auto">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    Ready to Build Your Study Deck
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Paste your study notes or type a topic on the left, then click{' '}
                    <strong className="text-slate-800 dark:text-slate-200">
                      Generate Study Material
                    </strong>{' '}
                    to create interactive flashcards and a multiple-choice quiz.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleGenerate}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    Generate from Current Notes
                  </button>
                </div>
              </div>
            )}

            {/* STATE 2: LOADING SKELETON */}
            {viewState === 'loading' && <LoadingSkeleton activeRequestId={activeRequestId} />}

            {/* STATE 3: GRACEFUL ERROR & RECOVERY UI */}
            {viewState === 'error' && errorDetails && (
              <ErrorStateCard
                error={errorDetails}
                onRetryClean={handleGenerate}
                onRetrySame={handleGenerate}
              />
            )}

            {/* STATE 4: VALIDATED INTERACTIVE STUDY SET */}
            {viewState === 'success' && studySet && (
              <div className="space-y-6 animate-fade-in">
                {/* Study Set Overview Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                        {studySet.title}
                      </h1>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {studySet.summary}
                      </p>
                    </div>
                  </div>

                  {studySet.keyConcepts.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {studySet.keyConcepts.map((concept, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        >
                          #{concept}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Mode Switcher Tabs: Flashcards vs Quiz Mode */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('flashcards')}
                      className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                        activeTab === 'flashcards'
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <Layers className="w-4 h-4" />
                      <span>Flashcards ({studySet.flashcards.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('quiz')}
                      className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                        activeTab === 'quiz'
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <CheckSquare className="w-4 h-4" />
                      <span>Quiz Mode ({studySet.quiz.length})</span>
                    </button>
                  </div>
                </div>

                {/* Active Interactive Mode */}
                {activeTab === 'flashcards' ? (
                  <FlashcardDeck cards={studySet.flashcards} />
                ) : (
                  <QuizView questions={studySet.quiz} />
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
export default App;
