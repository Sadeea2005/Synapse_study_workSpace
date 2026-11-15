import React from 'react';
import { AlertTriangle, RefreshCw, ShieldAlert, Terminal } from 'lucide-react';
import { ValidationFailureDetails } from '../lib/schema';

interface ErrorStateCardProps {
  error: ValidationFailureDetails;
  onRetryClean: () => void;
  onRetrySame: () => void;
}

export const ErrorStateCard: React.FC<ErrorStateCardProps> = ({
  error,
  onRetrySame,
}) => {
  return (
    <div
      role="alert"
      className="bg-white dark:bg-slate-900 border-2 border-rose-200 dark:border-rose-900/70 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in"
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/90 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <div className="space-y-1.5 flex-1">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{error.title}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {error.message}
          </p>
        </div>
      </div>

      {/* Zod Schema Issues List (if applicable) */}
      {error.issues && error.issues.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Validation Details:</span>
          </div>
          <ul className="list-disc list-inside text-xs font-mono text-rose-900 dark:text-rose-200 space-y-1">
            {error.issues.map((issue, idx) => (
              <li key={idx}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Raw Payload Inspector */}
      {error.rawSnippet && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Terminal className="w-3.5 h-3.5" />
            <span>Received Output Snippet:</span>
          </div>
          <pre className="p-3.5 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto border border-slate-800">
            {error.rawSnippet}
          </pre>
        </div>
      )}

      {/* Single Clean Retry Action */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={onRetrySame}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    </div>
  );
};

export const LoadingSkeleton: React.FC<{ activeRequestId: number }> = () => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="h-6 w-2/5 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
          <div className="h-4 w-4/5 bg-slate-100 dark:bg-slate-800/70 rounded-lg animate-pulse" />
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
          Generating study set…
        </span>
      </div>

      <div className="flex gap-2">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="h-6 w-24 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse"
          />
        ))}
      </div>

      <div className="h-[280px] w-full bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-8 flex flex-col justify-between animate-pulse">
        <div className="flex justify-between">
          <div className="h-5 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
        <div className="space-y-3 max-w-lg mx-auto w-full">
          <div className="h-6 w-full bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-6 w-3/4 mx-auto bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
        <div className="h-4 w-48 mx-auto bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    </div>
  );
};
