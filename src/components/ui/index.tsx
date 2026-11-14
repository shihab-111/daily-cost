import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22c55e]';

  const variants = {
    primary: 'bg-[#22c55e] text-zinc-950 font-semibold hover:bg-[#4ade80]',
    secondary: 'bg-[#18181b] text-zinc-100 border border-[#27272a] hover:bg-zinc-800',
    danger: 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20',
    ghost: 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/70',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
  };

  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
};

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className, id, ...props }) => {
  const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined);
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-zinc-300">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'w-full px-3 py-2 text-base sm:text-sm min-h-[42px] sm:min-h-0 bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg placeholder:text-zinc-500 focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e] disabled:opacity-50',
          error && 'border-red-500/60',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
};

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select: React.FC<SelectProps> = ({ label, error, className, id, children, ...props }) => {
  const selectId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined);
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-medium text-zinc-300">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          'w-full px-3 py-2 text-base sm:text-sm min-h-[42px] sm:min-h-0 bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]',
          error && 'border-red-500/60',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
};

export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={cn('bg-[#18181b] border border-[#27272a] rounded-xl', className)}>
    {children}
  </div>
);

export const Modal: React.FC<{
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClass?: string;
}> = ({ open, title, subtitle, onClose, children, maxWidthClass = 'max-w-3xl' }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-0 sm:p-4 overflow-y-auto no-print"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={cn(
          'bg-[#121214] border border-[#27272a] w-full sm:rounded-xl flex flex-col h-[100dvh] sm:h-auto sm:max-h-[92vh] overflow-hidden',
          maxWidthClass
        )}
      >
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-[#27272a] flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-zinc-100 truncate">{title}</h2>
            {subtitle && <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 inline-flex items-center justify-center p-2 -mr-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
