import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { cn } from '../../lib/utils';

interface LanguageToggleProps {
  className?: string;
  compactMobile?: boolean;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  className,
  compactMobile = false,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const hasDisplayOverride = Boolean(
    className && /(?:^|\s)(?:hidden|block|inline-block|flex|inline-flex|grid)\b/.test(className)
  );

  return (
    <div
      role="group"
      aria-label={t.common.languageLabel}
      className={cn(
        !hasDisplayOverride && 'inline-flex',
        'items-center p-0.5 rounded-lg bg-[#09090b]/90 border border-[#4ade80]/20 shrink-0',
        compactMobile ? 'gap-0.5 sm:gap-1' : 'gap-1',
        className
      )}
    >
      <Languages
        className={cn(
          'w-3.5 h-3.5 text-[#4ade80] ml-1.5 mr-0.5 shrink-0',
          compactMobile && 'hidden sm:inline'
        )}
        aria-hidden="true"
      />
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={cn(
          'rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0',
          compactMobile
            ? 'px-1.5 sm:px-2 py-1 text-[11px] sm:text-xs'
            : 'px-2 py-1 text-xs',
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
          'rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0',
          compactMobile
            ? 'px-1.5 sm:px-2 py-1 text-[11px] sm:text-xs'
            : 'px-2 py-1 text-xs',
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
