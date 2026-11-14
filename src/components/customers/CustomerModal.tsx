import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { Customer } from '../../types';
import { useMode } from '../../context/ModeContext';
import { dbService } from '../../lib/firebase/db';
import { customerSchema } from '../../lib/validators/schemas';
import { BD_DISTRICTS } from '../../lib/utils';
import { Button, Input, Modal, Select } from '../ui';

interface CustomerModalProps {
  open: boolean;
  user: User;
  editingCustomer: Customer | null;
  onClose: () => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  open,
  user,
  editingCustomer,
  onClose,
}) => {
  const { activeBusinessId } = useMode();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [district, setDistrict] = useState<string>('Dhaka');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErrorMsg(null);
    if (editingCustomer) {
      setName(editingCustomer.name);
      setPhone(editingCustomer.phone);
      setEmail(editingCustomer.email);
      setDistrict(editingCustomer.district || 'Dhaka');
      setAddress(editingCustomer.address);
      setNotes(editingCustomer.notes);
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setDistrict('Dhaka');
      setAddress('');
      setNotes('');
    }
  }, [open, editingCustomer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsed = customerSchema.safeParse({
      name,
      phone,
      email,
      district,
      address,
      notes,
    });

    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message || 'Please check customer details.');
      return;
    }

    setSaving(true);
    try {
      await dbService.saveCustomer(
        user,
        parsed.data,
        editingCustomer || undefined,
        editingCustomer ? editingCustomer.businessId : activeBusinessId
      );
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save customer.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingCustomer ? 'Edit Customer Profile' : 'Add BD Customer'}
      subtitle="Validates Bangladeshi carrier numbers (+8801XXXXXXXXX) and stores private delivery details."
      maxWidthClass="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
        {errorMsg && (
          <div className="border border-red-500/30 bg-red-500/10 rounded-lg p-3 text-xs text-red-300">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Customer Full Name *"
            required
            maxLength={140}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Nusrat Jahan"
          />
          <Input
            label="BD Mobile Number *"
            required
            maxLength={20}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+88017XXXXXXXX or 017XXXXXXXX"
            className="font-mono"
          />
          <Input
            label="Email Address"
            type="email"
            maxLength={140}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="optional@email.com"
          />
          <Select
            label="BD District"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
          >
            {BD_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </div>

        <Input
          label="Full Delivery Address"
          maxLength={240}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="House, Road, Block / Thana"
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-zinc-300">
            Customer Notes &amp; Delivery Preferences
          </label>
          <textarea
            rows={3}
            maxLength={1000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Preferred courier, size notes, or repeat buyer details..."
            className="w-full px-3 py-2 text-sm bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg placeholder:text-zinc-500 focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]"
          />
        </div>

        <div className="pt-4 border-t border-[#27272a] flex items-center justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Save Customer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
