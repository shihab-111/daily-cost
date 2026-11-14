import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit3, FileText, Plus, Search, Trash2, Users } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useCustomers, useSettings } from '../hooks/useBusinessData';
import { dbService } from '../lib/firebase/db';
import { formatMoney } from '../lib/utils';
import { Customer } from '../types';
import { DashboardShell } from '../components/layout/DashboardShell';
import { CustomerModal } from '../components/customers/CustomerModal';
import { Button, Card } from '../components/ui';

export const CustomersPage: React.FC = () => {
  const { user } = useAuth();
  const { customers, loading } = useCustomers(user, Boolean(user));
  const { settings } = useSettings(user, Boolean(user));
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const businessName = settings?.businessName || 'Meridian BD Ops';

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.district.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  const metrics = useMemo(() => {
    const totalOrders = customers.reduce((sum, c) => sum + (c.totalOrders || 0), 0);
    const totalSpent = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
    return {
      totalCustomers: customers.length,
      totalOrders,
      totalSpent,
    };
  }, [customers]);

  return (
    <DashboardShell
      businessName={businessName}
      headerAction={
        <Button
          size="sm"
          onClick={() => {
            setEditingCustomer(null);
            setModalOpen(true);
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Customer
        </Button>
      }
    >
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Customer Metrics */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4" aria-label="Customer Metrics">
          <Card className="p-5">
            <p className="text-xs font-medium text-zinc-400">Saved BD Customers</p>
            <p className="text-2xl font-semibold font-mono tabular-nums text-zinc-100 mt-2">
              {metrics.totalCustomers.toLocaleString('en-BD')}
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-xs font-medium text-zinc-400">Recorded Customer Orders</p>
            <p className="text-2xl font-semibold font-mono tabular-nums text-zinc-100 mt-2">
              {metrics.totalOrders.toLocaleString('en-BD')}
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-xs font-medium text-zinc-400">Lifetime Customer Value</p>
            <p className="text-2xl font-semibold font-mono tabular-nums text-[#4ade80] mt-2">
              {formatMoney(metrics.totalSpent, 'BDT')}
            </p>
          </Card>
        </section>

        {/* Search Bar */}
        <Card className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer name, +880 phone, district, or address..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg placeholder:text-zinc-500 focus:outline-none focus:border-[#22c55e]"
            />
          </div>
          <span className="text-xs font-mono tabular-nums text-zinc-400">
            Showing {filteredCustomers.length} of {customers.length} customers
          </span>
        </Card>

        {/* Customers Directory Table */}
        <Card className="overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-12 bg-zinc-900 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-zinc-200">No Customers Saved Yet</p>
              <p className="text-xs text-zinc-500 mt-1">
                Save customer delivery details with validated BD phone numbers for one-click receipt generation.
              </p>
              <Button
                className="mt-4"
                size="sm"
                onClick={() => {
                  setEditingCustomer(null);
                  setModalOpen(true);
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                Add First Customer
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#27272a] bg-[#121214] text-xs font-medium text-zinc-400">
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">BD Phone</th>
                    <th className="py-3 px-4 hidden md:table-cell">District &amp; Address</th>
                    <th className="py-3 px-4 text-right">Orders</th>
                    <th className="py-3 px-4 text-right">Total Spent</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a] text-sm">
                  {filteredCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-zinc-900/60 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-medium text-zinc-100">{c.name}</p>
                        {c.email && (
                          <p className="text-xs text-zinc-400 truncate max-w-[200px]">{c.email}</p>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-xs text-[#4ade80] whitespace-nowrap">
                        {c.phone}
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell text-xs text-zinc-300 max-w-xs truncate">
                        {[c.address, c.district].filter(Boolean).join(', ')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-zinc-200 whitespace-nowrap">
                        {c.totalOrders || 0}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-zinc-100 whitespace-nowrap">
                        {formatMoney(c.totalSpent || 0, 'BDT')}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate('/receipts', { state: { customer: c } })}
                          >
                            <FileText className="w-3.5 h-3.5 text-[#4ade80]" />
                            <span className="hidden sm:inline">Receipt</span>
                          </Button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCustomer(c);
                              setModalOpen(true);
                            }}
                            aria-label={`Edit ${c.name}`}
                            className="p-1.5 text-zinc-400 hover:text-[#4ade80] rounded-md cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {confirmDeleteId === c.id ? (
                            <div className="inline-flex items-center gap-1 bg-red-500/10 border border-red-500/30 rounded px-2 py-0.5">
                              <button
                                type="button"
                                onClick={async () => {
                                  if (user) await dbService.deleteCustomer(user, c);
                                  setConfirmDeleteId(null);
                                }}
                                className="text-xs font-semibold text-red-400 hover:text-red-300 cursor-pointer"
                              >
                                Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(c.id)}
                              aria-label={`Delete ${c.name}`}
                              className="p-1.5 text-zinc-400 hover:text-red-400 rounded-md cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {user && (
        <CustomerModal
          open={modalOpen}
          user={user}
          editingCustomer={editingCustomer}
          onClose={() => {
            setModalOpen(false);
            setEditingCustomer(null);
          }}
        />
      )}
    </DashboardShell>
  );
};
