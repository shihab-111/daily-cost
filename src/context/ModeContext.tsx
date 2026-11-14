import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppMode, BusinessProfile } from '../types';
import { useAuth } from '../hooks/useAuth';
import { dbService } from '../lib/firebase/db';
import { getDefaultBusinessId } from '../lib/services/businessService';
import { businessProfileSchema } from '../lib/validators/schemas';

const MODE_STORAGE_KEY = 'bd_ledger_active_mode';
const BIZ_STORAGE_PREFIX = 'bd_ledger_active_business_';

interface ModeContextValue {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
  businesses: BusinessProfile[];
  businessesLoading: boolean;
  activeBusiness: BusinessProfile | null;
  activeBusinessId: string;
  defaultBusinessId: string;
  setActiveBusinessId: (businessId: string) => void;
  addBusiness: (name: string) => Promise<BusinessProfile>;
  renameBusiness: (business: BusinessProfile, newName: string) => Promise<void>;
  deleteBusiness: (business: BusinessProfile) => Promise<void>;
  matchesBusiness: (itemBusinessId?: string) => boolean;
}

const ModeContext = createContext<ModeContextValue | null>(null);

export const ModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthorized } = useAuth();

  const [mode, setModeState] = useState<AppMode>(() => {
    try {
      const saved = window.localStorage.getItem(MODE_STORAGE_KEY);
      return saved === 'personal' ? 'personal' : 'business';
    } catch {
      return 'business';
    }
  });

  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [businessesLoading, setBusinessesLoading] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');

  useEffect(() => {
    try {
      window.localStorage.setItem(MODE_STORAGE_KEY, mode);
    } catch {
      // ignore storage errors
    }
  }, [mode]);

  useEffect(() => {
    if (!user || !isAuthorized) {
      setBusinesses([]);
      setSelectedBusinessId('');
      setBusinessesLoading(false);
      return;
    }

    try {
      const savedBiz = window.localStorage.getItem(`${BIZ_STORAGE_PREFIX}${user.uid}`);
      if (savedBiz) {
        setSelectedBusinessId(savedBiz);
      }
    } catch {
      // ignore
    }

    setBusinessesLoading(true);
    const unsub = dbService.subscribeBusinesses(
      user,
      (list) => {
        setBusinesses(list);
        setBusinessesLoading(false);
      },
      () => {
        setBusinessesLoading(false);
      }
    );

    return () => unsub();
  }, [user, isAuthorized]);

  const defaultBusinessId = useMemo(() => {
    const found = businesses.find((b) => b.isDefault);
    if (found) return found.id;
    return user ? getDefaultBusinessId(user.uid) : '';
  }, [businesses, user]);

  const activeBusiness = useMemo(() => {
    if (businesses.length === 0) return null;
    if (selectedBusinessId) {
      const matched = businesses.find((b) => b.id === selectedBusinessId);
      if (matched) return matched;
    }
    return businesses.find((b) => b.isDefault) || businesses[0] || null;
  }, [businesses, selectedBusinessId]);

  const activeBusinessId = activeBusiness?.id || defaultBusinessId || '';

  const setActiveBusinessId = useCallback(
    (businessId: string) => {
      setSelectedBusinessId(businessId);
      if (user) {
        try {
          window.localStorage.setItem(`${BIZ_STORAGE_PREFIX}${user.uid}`, businessId);
        } catch {
          // ignore
        }
      }
    },
    [user]
  );

  const addBusiness = useCallback(
    async (name: string): Promise<BusinessProfile> => {
      if (!user) throw new Error('You must be signed in.');
      const parsed = businessProfileSchema.safeParse({ name });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message || 'Business name is required.');
      }
      const normalized = parsed.data.name.toLowerCase();
      const existing = businesses.find((b) => b.name.trim().toLowerCase() === normalized);
      if (existing) {
        setActiveBusinessId(existing.id);
        throw new Error('A business with this name already exists.');
      }
      const created = await dbService.addBusiness(user, parsed.data.name);
      setActiveBusinessId(created.id);
      return created;
    },
    [user, businesses, setActiveBusinessId]
  );

  const renameBusiness = useCallback(
    async (business: BusinessProfile, newName: string): Promise<void> => {
      if (!user) throw new Error('You must be signed in.');
      const parsed = businessProfileSchema.safeParse({ name: newName });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message || 'Business name is required.');
      }
      const normalized = parsed.data.name.toLowerCase();
      if (businesses.some((b) => b.id !== business.id && b.name.trim().toLowerCase() === normalized)) {
        throw new Error('A business with this name already exists.');
      }
      await dbService.renameBusiness(user, business, parsed.data.name);
    },
    [user, businesses]
  );

  const deleteBusiness = useCallback(
    async (business: BusinessProfile): Promise<void> => {
      if (!user) throw new Error('You must be signed in.');
      await dbService.deleteBusiness(user, business);
      if (activeBusinessId === business.id && defaultBusinessId) {
        setActiveBusinessId(defaultBusinessId);
      }
    },
    [user, activeBusinessId, defaultBusinessId, setActiveBusinessId]
  );

  const matchesBusiness = useCallback(
    (itemBusinessId?: string): boolean => {
      if (!activeBusinessId) return true;
      if (itemBusinessId && itemBusinessId.trim().length > 0) {
        return itemBusinessId === activeBusinessId;
      }
      return activeBusinessId === defaultBusinessId;
    },
    [activeBusinessId, defaultBusinessId]
  );

  const setMode = (next: AppMode) => setModeState(next);
  const toggleMode = () => setModeState((prev) => (prev === 'business' ? 'personal' : 'business'));

  return (
    <ModeContext.Provider
      value={{
        mode,
        setMode,
        toggleMode,
        businesses,
        businessesLoading,
        activeBusiness,
        activeBusinessId,
        defaultBusinessId,
        setActiveBusinessId,
        addBusiness,
        renameBusiness,
        deleteBusiness,
        matchesBusiness,
      }}
    >
      {children}
    </ModeContext.Provider>
  );
};

export function useMode(): ModeContextValue {
  const ctx = useContext(ModeContext);
  if (!ctx) {
    throw new Error('useMode must be used inside a ModeProvider');
  }
  return ctx;
}
