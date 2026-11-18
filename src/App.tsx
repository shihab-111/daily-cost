/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ModeProvider } from './context/ModeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OfflineIndicator } from './components/ui/PWAControls';

const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const ExpensesPage = lazy(() =>
  import('./pages/ExpensesPage').then((m) => ({ default: m.ExpensesPage }))
);
const ProductsPage = lazy(() =>
  import('./pages/ProductsPage').then((m) => ({ default: m.ProductsPage }))
);
const CustomersPage = lazy(() =>
  import('./pages/CustomersPage').then((m) => ({ default: m.CustomersPage }))
);
const PathaoPage = lazy(() =>
  import('./pages/PathaoPage').then((m) => ({ default: m.PathaoPage }))
);
const PartnersPage = lazy(() =>
  import('./pages/PartnersPage').then((m) => ({ default: m.PartnersPage }))
);
const LoansPage = lazy(() => import('./pages/LoansPage').then((m) => ({ default: m.LoansPage })));
const ReceiptsPage = lazy(() =>
  import('./pages/ReceiptsPage').then((m) => ({ default: m.ReceiptsPage }))
);
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);
const ProfilePage = lazy(() =>
  import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage }))
);
const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));

const RouteLoadingFallback: React.FC = () => (
  <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-zinc-700 border-t-[#22c55e] rounded-full animate-spin" />
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, authLoading, verifyingTenant, isAuthorized } = useAuth();
  const { t } = useLanguage();

  if (authLoading || verifyingTenant) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="flex items-center gap-3 px-5 py-3.5 bg-[#18181b] border border-[#27272a] rounded-xl">
          <div className="w-4 h-4 border-2 border-zinc-700 border-t-[#22c55e] rounded-full animate-spin" />
          <span className="text-sm text-zinc-200">{t.common.verifyingWorkspace}</span>
        </div>
      </div>
    );
  }

  if (!user || !isAuthorized) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <ModeProvider>
            <BrowserRouter>
              <Suspense fallback={<RouteLoadingFallback />}>
                <Routes>
                  <Route path="/login" element={<LoginPage initialMode="login" />} />
                  <Route path="/register" element={<LoginPage initialMode="register" />} />
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/expenses"
                    element={
                      <ProtectedRoute>
                        <ExpensesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/products"
                    element={
                      <ProtectedRoute>
                        <ProductsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/customers"
                    element={
                      <ProtectedRoute>
                        <CustomersPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/pathao"
                    element={
                      <ProtectedRoute>
                        <PathaoPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/partners"
                    element={
                      <ProtectedRoute>
                        <PartnersPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/loans"
                    element={
                      <ProtectedRoute>
                        <LoansPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/receipts"
                    element={
                      <ProtectedRoute>
                        <ReceiptsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <SettingsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute>
                        <AdminPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </ModeProvider>
        </AuthProvider>
        <OfflineIndicator />
      </LanguageProvider>
    </ErrorBoundary>
  );
}
