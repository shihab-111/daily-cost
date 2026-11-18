import React, { useEffect, useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import { Truck } from 'lucide-react';
import { Customer, CustomerNumberOption } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useMode } from '../../context/ModeContext';
import { useProducts, useSettings } from '../../hooks/useBusinessData';
import { dbService } from '../../lib/firebase/db';
import { customerSchema } from '../../lib/validators/schemas';
import {
  BD_DISTRICTS,
  CUSTOMER_NUMBER_OPTIONS,
  convertToBdt,
  formatMoney,
  PRODUCT_SIZE_PRESETS,
} from '../../lib/utils';
import { Button, Input, Modal, Select } from '../ui';

interface CustomerModalProps {
  open: boolean;
  user: User;
  editingCustomer: Customer | null;
  onClose: () => void;
  onSavedAndSendPathao?: (customer: Customer) => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  open,
  user,
  editingCustomer,
  onClose,
  onSavedAndSendPathao,
}) => {
  const { t } = useLanguage();
  const { activeBusinessId, matchesBusiness } = useMode();
  const { products } = useProducts(user, open);
  const { settings } = useSettings(user, open);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [numberOption, setNumberOption] = useState<CustomerNumberOption>('Call / Phone');
  const [email, setEmail] = useState('');
  const [district, setDistrict] = useState<string>('Dhaka');
  const [zone, setZone] = useState('');
  const [area, setArea] = useState('');
  const [address, setAddress] = useState('');

  const [itemType, setItemType] = useState<'parcel' | 'document'>('parcel');
  const [storeName, setStoreName] = useState('');
  const [merchantOrderId, setMerchantOrderId] = useState('');
  const [itemWeight, setItemWeight] = useState('0.5');
  const [productName, setProductName] = useState('');
  const [productSize, setProductSize] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');
  const [orderDetails, setOrderDetails] = useState('');
  const [notes, setNotes] = useState('');
  const [recordAsNewOrder, setRecordAsNewOrder] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const businessProducts = useMemo(
    () => products.filter((p) => matchesBusiness(p.businessId)),
    [products, matchesBusiness]
  );

  useEffect(() => {
    if (!open) return;
    setErrorMsg(null);
    setRecordAsNewOrder(false);
    if (editingCustomer) {
      setName(editingCustomer.name);
      setPhone(editingCustomer.phone);
      setNumberOption(editingCustomer.numberOption || 'Call / Phone');
      setEmail(editingCustomer.email);
      setDistrict(editingCustomer.district || 'Dhaka');
      setZone(editingCustomer.zone || '');
      setArea(editingCustomer.area || '');
      setAddress(editingCustomer.address);
      setItemType(editingCustomer.itemType === 'document' ? 'document' : 'parcel');
      setStoreName(editingCustomer.storeName || '');
      setMerchantOrderId(editingCustomer.merchantOrderId || '');
      setItemWeight(
        editingCustomer.itemWeight && editingCustomer.itemWeight > 0
          ? String(editingCustomer.itemWeight)
          : '0.5'
      );
      setProductName(editingCustomer.productName || '');
      setProductSize(editingCustomer.productSize || '');
      setQuantity(
        editingCustomer.quantity !== undefined && editingCustomer.quantity > 0
          ? String(editingCustomer.quantity)
          : '1'
      );
      setUnitPrice(
        editingCustomer.unitPrice !== undefined && editingCustomer.unitPrice > 0
          ? String(editingCustomer.unitPrice)
          : ''
      );
      setOrderDetails(editingCustomer.orderDetails || '');
      setNotes(editingCustomer.notes);
    } else {
      setName('');
      setPhone('');
      setNumberOption('Call / Phone');
      setEmail('');
      setDistrict('Dhaka');
      setZone('');
      setArea('');
      setAddress('');
      setItemType('parcel');
      setStoreName('');
      setMerchantOrderId('');
      setItemWeight('0.5');
      setProductName('');
      setProductSize('');
      setQuantity('1');
      setUnitPrice('');
      setOrderDetails('');
      setNotes('');
    }
  }, [open, editingCustomer]);

  const numericQty = Math.max(0, Number(quantity) || 0);
  const numericUnitPrice = Math.max(0, Number(unitPrice) || 0);
  const computedOrderTotal = Math.round(numericQty * numericUnitPrice * 100) / 100;

  const handleInventoryPick = (productId: string) => {
    if (!productId) return;
    const picked = businessProducts.find((p) => p.id === productId);
    if (!picked) return;
    setProductName(picked.name);
    const priceInBdt = convertToBdt(
      picked.sellingPrice,
      picked.currency,
      settings?.usdToBdtRate || 120
    );
    setUnitPrice(String(Math.round(priceInBdt * 100) / 100));
    if (!quantity || Number(quantity) <= 0) {
      setQuantity('1');
    }
  };

  const saveCustomerRecord = async (sendToPathao: boolean) => {
    setErrorMsg(null);

    const parsed = customerSchema.safeParse({
      name,
      phone,
      numberOption,
      email,
      district,
      zone,
      area,
      address,
      itemType,
      storeName,
      merchantOrderId,
      itemWeight: itemWeight === '' ? 0.5 : itemWeight,
      productName,
      productSize,
      quantity: quantity === '' ? 1 : quantity,
      unitPrice: unitPrice === '' ? 0 : unitPrice,
      orderDetails,
      notes,
    });

    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message || 'Please check customer details.');
      return;
    }

    setSaving(true);
    try {
      const targetBusinessId = editingCustomer ? editingCustomer.businessId : activeBusinessId;
      const savedId = await dbService.saveCustomer(
        user,
        parsed.data,
        editingCustomer || undefined,
        targetBusinessId,
        editingCustomer ? recordAsNewOrder : undefined
      );

      if (sendToPathao && onSavedAndSendPathao) {
        const orderAmount = Math.round(
          (parsed.data.quantity || 0) * (parsed.data.unitPrice || 0) * 100
        ) / 100;
        const customerSnapshot: Customer = {
          id: savedId,
          userId: user.uid,
          businessId: targetBusinessId || '',
          name: parsed.data.name,
          phone: parsed.data.phone,
          numberOption: parsed.data.numberOption,
          email: parsed.data.email,
          address: parsed.data.address,
          district: parsed.data.district,
          zone: parsed.data.zone,
          area: parsed.data.area,
          itemType: parsed.data.itemType,
          storeName: parsed.data.storeName,
          merchantOrderId: parsed.data.merchantOrderId,
          itemWeight: parsed.data.itemWeight,
          productName: parsed.data.productName,
          productSize: parsed.data.productSize,
          quantity: parsed.data.quantity,
          unitPrice: parsed.data.unitPrice,
          orderDetails: parsed.data.orderDetails,
          notes: parsed.data.notes,
          totalOrders: editingCustomer ? editingCustomer.totalOrders || 1 : 1,
          totalSpent: orderAmount > 0 ? orderAmount : editingCustomer?.totalSpent || 0,
          lastOrderDate: editingCustomer?.lastOrderDate || '',
        };
        onClose();
        onSavedAndSendPathao(customerSnapshot);
      } else {
        onClose();
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save customer.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveCustomerRecord(false);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingCustomer ? 'Edit Customer & Order' : 'Add Customer & Order'}
      subtitle="Save customer name, phone, number option, location, product name, size & price per product."
      maxWidthClass="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {errorMsg && (
          <div className="border border-red-500/30 bg-red-500/10 rounded-lg p-3 text-xs text-red-300">
            {errorMsg}
          </div>
        )}

        {/* Customer Contact & Location */}
        <div className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <Input
              label="Customer Full Name *"
              required
              maxLength={140}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Nusrat Jahan"
            />
            <Input
              label="Phone Number *"
              required
              maxLength={20}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+88017XXXXXXXX or 017XXXXXXXX"
              className="font-mono"
            />
            <Select
              label={t.customers.numberOptionLabel}
              value={numberOption}
              onChange={(e) => setNumberOption(e.target.value as CustomerNumberOption)}
            >
              {CUSTOMER_NUMBER_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Select>
            <Select
              label={t.customers.locationDistrictLabel}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <Input
              label={t.customers.zoneLabel}
              maxLength={80}
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              placeholder="e.g. Uttara, Mirpur, Dhanmondi"
            />
            <Input
              label={t.customers.areaLabel}
              maxLength={80}
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g. Sector 6"
            />
            <Input
              label={t.customers.locationAddressLabel}
              maxLength={240}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. H-1,R-1,S-6, Uttara"
            />
            <Input
              label="Email Address (Optional)"
              type="email"
              maxLength={140}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="optional@email.com"
            />
          </div>
        </div>

        {/* Order & Product Details */}
        <div className="pt-4 border-t border-[#27272a] space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-xs font-semibold text-[#4ade80] tracking-wide">
              {t.customers.orderSectionTitle}
            </h3>
            {computedOrderTotal > 0 && (
              <span className="text-xs font-mono tabular-nums text-zinc-200">
                {t.customers.orderTotalLabel}:{' '}
                <strong className="text-[#4ade80]">{formatMoney(computedOrderTotal, 'BDT')}</strong>
              </span>
            )}
          </div>

          {businessProducts.length > 0 && (
            <Select
              label={t.customers.quickPickProduct}
              value=""
              onChange={(e) => handleInventoryPick(e.target.value)}
            >
              <option value="">{t.customers.selectFromInventory}</option>
              {businessProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — {formatMoney(p.sellingPrice, p.currency)}
                </option>
              ))}
            </Select>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <Input
              label={t.customers.productNameLabel}
              maxLength={160}
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Premium Cotton Panjabi"
            />

            <div className="space-y-1.5">
              <Input
                label={t.customers.productSizeLabel}
                maxLength={40}
                value={productSize}
                onChange={(e) => setProductSize(e.target.value)}
                placeholder="e.g. L, XL, 42, Free Size"
              />
              <div className="flex flex-wrap gap-1.5">
                {PRODUCT_SIZE_PRESETS.map((sz) => {
                  const active = productSize.trim().toLowerCase() === sz.toLowerCase();
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setProductSize(active ? '' : sz)}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#22c55e] text-zinc-950 border-[#22c55e] font-semibold'
                          : 'bg-[#09090b] text-zinc-300 border-[#27272a] hover:border-zinc-500'
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <Select
              label={t.customers.itemTypeLabel}
              value={itemType}
              onChange={(e) =>
                setItemType(e.target.value === 'document' ? 'document' : 'parcel')
              }
            >
              <option value="parcel">{t.customers.parcelOption}</option>
              <option value="document">{t.customers.documentOption}</option>
            </Select>
            <Input
              label={t.customers.itemWeightLabel}
              type="number"
              min="0.1"
              max="500"
              step="0.1"
              value={itemWeight}
              onChange={(e) => setItemWeight(e.target.value)}
              placeholder="0.5"
              className="font-mono"
            />
            <Input
              label={t.customers.quantityLabel}
              type="number"
              min="0"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="1"
              className="font-mono"
            />
            <Input
              label={t.customers.tkPerProductLabel}
              type="number"
              min="0"
              step="0.01"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              placeholder="e.g. 1000"
              className="font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <Input
              label={t.customers.storeNameLabel}
              maxLength={120}
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Leave blank or enter Pathao StoreName"
            />
            <Input
              label={t.customers.merchantOrderIdLabel}
              maxLength={64}
              value={merchantOrderId}
              onChange={(e) => setMerchantOrderId(e.target.value)}
              placeholder="Optional order reference"
              className="font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-300">
              {t.customers.orderDetailsLabel}
            </label>
            <textarea
              rows={2}
              maxLength={500}
              value={orderDetails}
              onChange={(e) => setOrderDetails(e.target.value)}
              placeholder="Color, courier note, advance paid, or special order details..."
              className="w-full px-3 py-2 text-base sm:text-sm bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg placeholder:text-zinc-500 focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]"
            />
          </div>

          {editingCustomer && (productName.trim() || computedOrderTotal > 0) && (
            <label className="flex items-start gap-2.5 text-xs text-zinc-300 cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={recordAsNewOrder}
                onChange={(e) => setRecordAsNewOrder(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-[#27272a] bg-[#09090b] accent-[#22c55e]"
              />
              <span>{t.customers.recordNewOrderLabel}</span>
            </label>
          )}
        </div>

        <div className="pt-4 border-t border-[#27272a] space-y-1.5">
          <label className="block text-xs font-medium text-zinc-300">
            {t.customers.specialInstructionLabel}
          </label>
          <textarea
            rows={2}
            maxLength={1000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="SpecialInstruction / preferred courier or delivery notes..."
            className="w-full px-3 py-2 text-base sm:text-sm bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg placeholder:text-zinc-500 focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]"
          />
        </div>

        <div className="pt-4 border-t border-[#27272a] flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2.5 sm:gap-3">
          <Button
            type="button"
            variant="ghost"
            className="w-full sm:w-auto min-h-[44px] sm:min-h-0"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          {onSavedAndSendPathao && (
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto min-h-[44px] sm:min-h-0"
              disabled={saving}
              onClick={() => void saveCustomerRecord(true)}
            >
              <Truck className="w-4 h-4 text-[#4ade80]" />
              <span>{t.customers.saveAndSendPathaoBtn}</span>
            </Button>
          )}
          <Button
            type="submit"
            className="w-full sm:w-auto min-h-[44px] sm:min-h-0"
            disabled={saving}
          >
            {saving ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Save Customer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
