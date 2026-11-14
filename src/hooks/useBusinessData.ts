import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { dbService } from '../lib/firebase/db';
import { ActivityLog, AdminUser, BusinessSettings, Expense, Product } from '../types';

export function useExpenses(user: User | null, enabled: boolean) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !enabled) {
      setExpenses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const unsub = dbService.subscribeExpenses(
      user,
      (list) => {
        setExpenses(list);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user, enabled]);

  return { expenses, loading, error };
}

export function useProducts(user: User | null, enabled: boolean) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !enabled) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const unsub = dbService.subscribeProducts(
      user,
      (list) => {
        setProducts(list);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user, enabled]);

  return { products, loading, error };
}

export function useSettings(user: User | null, enabled: boolean) {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !enabled) {
      setSettings(null);
      return;
    }
    const unsub = dbService.subscribeSettings(
      (s) => setSettings(s),
      (err) => setError(err.message)
    );
    return () => unsub();
  }, [user, enabled]);

  return { settings, error };
}

export function useActivityLogs(user: User | null, enabled: boolean) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !enabled) {
      setLogs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = dbService.subscribeActivityLogs(
      user,
      (items) => {
        setLogs(items);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [user, enabled]);

  return { logs, loading };
}

export function useAdmins(user: User | null, enabled: boolean) {
  const [admins, setAdmins] = useState<AdminUser[]>([]);

  useEffect(() => {
    if (!user || !enabled) {
      setAdmins([]);
      return;
    }
    const unsub = dbService.subscribeAdmins(
      user,
      (items) => setAdmins(items),
      () => {}
    );
    return () => unsub();
  }, [user, enabled]);

  return { admins };
}
