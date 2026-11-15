import React, { useEffect, useRef, useState } from 'react';
import { Download, Share, Smartphone, Wifi, WifiOff, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { language } = useLanguage();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showBrowserGuide, setShowBrowserGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const label = language === 'bn' ? 'অফলাইন অ্যাপ ইনস্টল' : 'Install Offline App';

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={`w-full flex items-center justify-center gap-2 px-3 min-h-[40px] lg:min-h-0 py-2 text-xs font-semibold bg-[#22c55e]/15 text-[#4ade80] hover:bg-[#22c55e]/25 border border-[#22c55e]/30 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${className}`}
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>{label}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`w-full flex items-center justify-center gap-2 px-3 min-h-[40px] lg:min-h-0 py-2 text-xs font-semibold bg-[#22c55e]/15 text-[#4ade80] hover:bg-[#22c55e]/25 border border-[#22c55e]/30 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5 shrink-0" />
          <span>{label}</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
            <div className="w-full max-w-sm bg-[#121214] border border-[#27272a] rounded-xl p-5 shadow-2xl space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">
                    {language === 'bn' ? 'iPhone / iPad-এ ইনস্টল করুন' : 'Install on iPhone / iPad'}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    {language === 'bn'
                      ? 'ইন্টারনেট ছাড়াও ব্যবহার করতে হোম স্ক্রিনে যোগ করুন।'
                      : 'Add EkTally to your home screen for offline access.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Close"
                  className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center text-zinc-400 hover:text-zinc-100 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ol className="text-xs text-zinc-300 space-y-2 leading-relaxed">
                <li className="flex items-center gap-2">
                  <Share className="w-3.5 h-3.5 text-[#4ade80] shrink-0" />
                  <span>
                    {language === 'bn'
                      ? '১. Safari টুলবারে Share আইকনে ট্যাপ করুন।'
                      : '1. Tap the Share icon in your Safari toolbar.'}
                  </span>
                </li>
                <li>
                  {language === 'bn'
                    ? '২. নিচে স্ক্রল করে Add to Home Screen চাপুন।'
                    : '2. Scroll down and tap Add to Home Screen.'}
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full min-h-[40px] py-2 text-xs font-semibold bg-[#22c55e] text-zinc-950 rounded-lg hover:bg-[#4ade80] transition-colors cursor-pointer"
              >
                {language === 'bn' ? 'বুঝেছি' : 'Got It'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowBrowserGuide(true)}
        className={`w-full flex items-center justify-center gap-2 px-3 min-h-[40px] lg:min-h-0 py-2 text-xs font-semibold bg-[#22c55e]/15 text-[#4ade80] hover:bg-[#22c55e]/25 border border-[#22c55e]/30 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${className}`}
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>{label}</span>
      </button>

      {showBrowserGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-sm bg-[#121214] border border-[#27272a] rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">
                  {language === 'bn' ? 'অ্যাপ ইনস্টল করুন' : 'Install EkTally App'}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  {language === 'bn'
                    ? 'অফলাইনে দ্রুত ব্যবহারের জন্য আপনার ফোনের হোম স্ক্রিনে যোগ করুন।'
                    : 'Add EkTally to your home screen for quick offline access.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBrowserGuide(false)}
                aria-label="Close"
                className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center text-zinc-400 hover:text-zinc-100 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ol className="text-xs text-zinc-300 space-y-2 leading-relaxed">
              <li>
                {language === 'bn'
                  ? '১. আপনি যদি প্রিভিউ ফ্রেমের ভেতর থাকেন, তবে সরাসরি মোবাইল ব্রাউজারে (Chrome / Samsung Internet) অ্যাপটি খুলুন।'
                  : '1. If viewing inside a preview frame, open the app directly in your mobile browser (Chrome / Edge / Samsung Internet).'}
              </li>
              <li>
                {language === 'bn'
                  ? '২. ব্রাউজারের মেনু (⋮) খুলে "Add to Home screen" বা "Install app" চাপুন।'
                  : '2. Open the browser menu (⋮) and tap "Add to Home screen" or "Install app".'}
              </li>
            </ol>
            <button
              type="button"
              onClick={() => setShowBrowserGuide(false)}
              className="w-full min-h-[40px] py-2 text-xs font-semibold bg-[#22c55e] text-zinc-950 rounded-lg hover:bg-[#4ade80] transition-colors cursor-pointer"
            >
              {language === 'bn' ? 'বুঝেছি' : 'Got It'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const { language } = useLanguage();
  const isOnline = useOnlineStatus();
  const wasOfflineRef = useRef(false);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      wasOfflineRef.current = true;
      setJustReconnected(false);
      return;
    }

    if (wasOfflineRef.current) {
      wasOfflineRef.current = false;
      setJustReconnected(true);
      const timer = window.setTimeout(() => setJustReconnected(false), 3500);
      return () => window.clearTimeout(timer);
    }
  }, [isOnline]);

  if (isOnline && !justReconnected) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 left-4 right-4 sm:right-auto z-50 no-print flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border text-xs font-medium shadow-xl ${
        !isOnline
          ? 'bg-[#18181b] border-amber-500/40 text-amber-300'
          : 'bg-[#18181b] border-[#22c55e]/40 text-[#4ade80]'
      }`}
    >
      {!isOnline ? (
        <>
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>
            {language === 'bn'
              ? 'অফলাইন মোড — ক্যাশ করা ডেটা চলছে, ইন্টারনেট ফিরলে অটো-সিঙ্ক হবে।'
              : 'Offline Mode — Using cached data; changes sync automatically when online.'}
          </span>
        </>
      ) : (
        <>
          <Wifi className="w-4 h-4 shrink-0" />
          <span>
            {language === 'bn'
              ? 'আবার অনলাইন — আপনার পরিবর্তন সিঙ্ক হচ্ছে।'
              : 'Back online — syncing pending changes.'}
          </span>
        </>
      )}
    </div>
  );
};
