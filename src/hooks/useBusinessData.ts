import { useEffect, useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import { dbService } from '../lib/firebase/db';
import { EXPENSE_CATEGORY_LABELS } from '../lib/utils';
import {
  ActivityLog,
  AppMode,
  BusinessPartner,
  Customer,
  CustomerReceipt,
  Expense,
  ExpenseCategoryItem,
  PathaoParcel,
  PersonalLoan,
  Product,
  ReceiptTemplate,
  UserSettings,
} from '../types';

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

export function useExpenseCategories(
  user: User | null,
  enabled: boolean,
  mode?: AppMode
) {
  const [categories, setCategories] = useState<ExpenseCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !enabled) {
      setCategories([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const unsub = dbService.subscribeExpenseCategories(
      user,
      (list) => {
        setCategories(list);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user, enabled]);

  const modeCategories = useMemo(
    () => (mode ? categories.filter((c) => c.mode === mode) : categories),
    [categories, mode]
  );

  const categoryLabels = useMemo(() => {
    const map: Record<string, string> = { ...EXPENSE_CATEGORY_LABELS };
    for (const c of categories) {
      map[c.key] = c.label;
    }
    return map;
  }, [categories]);

  const categoryMap = useMemo(() => {
    const map: Record<string, ExpenseCategoryItem> = {};
    for (const c of categories) {
      map[c.key] = c;
    }
    return map;
  }, [categories]);

  return {
    allCategories: categories,
    modeCategories,
    categoryLabels,
    categoryMap,
    loading,
    error,
  };
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

export function useCustomers(user: User | null, enabled: boolean) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !enabled) {
      setCustomers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const unsub = dbService.subscribeCustomers(
      user,
      (list) => {
        setCustomers(list);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user, enabled]);

  return { customers, loading, error };
}

export function useBusinessPartners(user: User | null, enabled: boolean) {
  const [partners, setPartners] = useState<BusinessPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !enabled) {
      setPartners([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const unsub = dbService.subscribeBusinessPartners(
      user,
      (list) => {
        setPartners(list);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user, enabled]);

  return { partners, loading, error };
}

export function usePersonalLoans(user: User | null, enabled: boolean) {
  const [loans, setLoans] = useState<PersonalLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !enabled) {
      setLoans([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const unsub = dbService.subscribePersonalLoans(
      user,
      (list) => {
        setLoans(list);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user, enabled]);

  return { loans, loading, error };
}

export function usePathaoParcels(user: User | null, enabled: boolean) {
  const [parcels, setParcels] = useState<PathaoParcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !enabled) {
      setParcels([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const unsub = dbService.subscribePathaoParcels(
      user,
      (list) => {
        setParcels(list);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user, enabled]);

  return { parcels, loading, error };
}

export function useSettings(user: User | null, enabled: boolean) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !enabled) {
      setSettings(null);
      return;
    }
    const unsub = dbService.subscribeSettings(
      user,
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

export function useReceiptTemplate(user: User | null, enabled: boolean) {
  const [template, setTemplate] = useState<ReceiptTemplate | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !enabled) {
      setTemplate(null);
      return;
    }
    const unsub = dbService.subscribeReceiptTemplate(
      user,
      (t) => setTemplate(t),
      (err) => setError(err.message)
    );
    return () => unsub();
  }, [user, enabled]);

  return { template, error };
}

export function useCustomerReceipts(user: User | null, enabled: boolean) {
  const [receipts, setReceipts] = useState<CustomerReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !enabled) {
      setReceipts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const unsub = dbService.subscribeCustomerReceipts(
      user,
      (items) => {
        setReceipts(items);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user, enabled]);

  return { receipts, loading, error };
}
