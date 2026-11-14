import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { cn } from '../../lib/utils';

interface LanguageToggleProps {
  className?: string;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ className }) => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div
      role="group"
      aria-label={t.common.languageLabel}
      className={cn(
        'inline-flex items-center gap-1 p-0.5 rounded-lg bg-[#09090b]/90 border border-[#4ade80]/20 shrink-0',
        className
      )}
    >
      <Languages className="w-3.5 h-3.5 text-[#4ade80] ml-1.5 mr-0.5 shrink-0" aria-hidden="true" />
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={cn(
          'px-2 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0',
          language === 'en'
            ? 'bg-[#22c55e] text-zinc-950 font-semibold'
            : 'text-zinc-400 hover:text-zinc-100'
        )}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage('bn')}
        className={cn(
          'px-2 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0',
          language === 'bn'
            ? 'bg-[#22c55e] text-zinc-950 font-semibold'
            : 'text-zinc-400 hover:text-zinc-100'
        )}
      >
        বাংলা
      </button>
    </div>
  );
};
