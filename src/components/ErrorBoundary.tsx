import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { TRANSLATIONS } from '../lib/i18n';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'An unexpected application error occurred.',
    };
  }

  render() {
    if (this.state.hasError) {
      let lang: 'en' | 'bn' = 'en';
      try {
        lang = window.localStorage.getItem('ektally_language') === 'bn' ? 'bn' : 'en';
      } catch {
        lang = 'en';
      }
      const t = TRANSLATIONS[lang];

      return (
        <div className="min-h-screen bg-[#09090b] text-zinc-100 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-[#18181b] border border-[#27272a] rounded-xl p-8">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h1 className="text-lg font-semibold text-zinc-100">
                {t.common.errorTitle}
              </h1>
            </div>
            <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
              {t.common.errorDesc}
            </p>
            <pre className="text-xs font-mono bg-[#09090b] border border-[#27272a] rounded-lg p-3 overflow-auto max-h-48 text-zinc-300 mb-6">
              {this.state.message}
            </pre>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-[#22c55e] text-zinc-950 rounded-lg hover:bg-[#4ade80] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
              {t.common.reloadApp}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
