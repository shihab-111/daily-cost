import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { AlertCircle, CheckCircle2, Send, Truck } from 'lucide-react';
import { Customer, PathaoDeliveryType, PathaoItemType, PathaoParcel } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useMode } from '../../context/ModeContext';
import { dbService } from '../../lib/firebase/db';
import { PathaoServerStatus, PathaoStoreOption } from '../../lib/services/pathaoService';
import { pathaoParcelSchema } from '../../lib/validators/schemas';
import { BD_DISTRICTS, generateSafeId, toLocalBdPhone11 } from '../../lib/utils';
import { Button, Input, Modal, Select } from '../ui';

interface PathaoDispatchModalProps {
  open: boolean;
  user: User;
  customer?: Customer | null;
  editingParcel?: PathaoParcel | null;
  onClose: () => void;
  onSuccess?: (result: {
    parcelId: string;
    consignmentId: string;
    orderStatus: string;
    mode: 'api' | 'queued';
  }) => void;
}

export const PathaoDispatchModal: React.FC<PathaoDispatchModalProps> = ({
  open,
  user,
  customer,
  editingParcel,
  onClose,
  onSuccess,
}) => {
  const { t } = useLanguage();
  const { activeBusinessId } = useMode();

  const [serverStatus, setServerStatus] = useState<PathaoServerStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [stores, setStores] = useState<PathaoStoreOption[]>([]);
  const [storesLoading, setStoresLoading] = useState(false);

  const [storeId, setStoreId] = useState('0');
  const [merchantOrderId, setMerchantOrderId] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientDistrict, setRecipientDistrict] = useState('Dhaka');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [deliveryType, setDeliveryType] = useState<PathaoDeliveryType>(48);
  const [itemType, setItemType] = useState<PathaoItemType>(2);
  const [itemQuantity, setItemQuantity] = useState('1');
  const [itemWeight, setItemWeight] = useState('0.5');
  const [amountToCollect, setAmountToCollect] = useState('0');
  const [itemDescription, setItemDescription] = useState('');
  const [specialInstruction, setSpecialInstruction] = useState('');

  const [submitting, setSubmitting] = useState<'api' | 'queued' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErrorMsg(null);
    setSubmitting(null);

    if (editingParcel) {
      setStoreId(String(editingParcel.storeId || 0));
      setMerchantOrderId(editingParcel.merchantOrderId);
      setRecipientName(editingParcel.recipientName);
      setRecipientPhone(toLocalBdPhone11(editingParcel.recipientPhone));
      setRecipientDistrict(editingParcel.recipientDistrict || 'Dhaka');
      setRecipientAddress(editingParcel.recipientAddress);
      setDeliveryType(editingParcel.deliveryType === 12 ? 12 : 48);
      setItemType(editingParcel.itemType === 1 ? 1 : 2);
      setItemQuantity(String(editingParcel.itemQuantity || 1));
      setItemWeight(String(editingParcel.itemWeight || 0.5));
      setAmountToCollect(String(Math.round(editingParcel.amountToCollect || 0)));
      setItemDescription(editingParcel.itemDescription || '');
      setSpecialInstruction(editingParcel.specialInstruction || '');
    } else if (customer) {
      const qty = Math.max(1, Math.round(customer.quantity || 1));
      const unitPrice = Number(customer.unitPrice || 0);
      const deliveryCharge = Math.max(0, Number(customer.deliveryCharge || 0));
      const computedTotal =
        unitPrice > 0 || deliveryCharge > 0
          ? Math.round(qty * unitPrice + deliveryCharge)
          : Math.round(customer.totalSpent || 0);
      const composedAddress = [
        customer.address?.trim(),
        customer.area?.trim(),
        customer.zone?.trim(),
        customer.district?.trim(),
      ]
        .filter(Boolean)
        .join(', ');
      const composedDesc = [
        customer.productName?.trim(),
        customer.productSize?.trim() ? `Size: ${customer.productSize.trim()}` : '',
        customer.orderDetails?.trim(),
      ]
        .filter(Boolean)
        .join(' · ')
        .slice(0, 300);

      setStoreId('0');
      setMerchantOrderId(
        (customer.merchantOrderId?.trim() || generateSafeId('ORD')).slice(0, 28)
      );
      setRecipientName(customer.name || '');
      setRecipientPhone(toLocalBdPhone11(customer.phone || ''));
      setRecipientDistrict(customer.district || 'Dhaka');
      setRecipientAddress(composedAddress);
      setDeliveryType(48);
      setItemType(customer.itemType === 'document' ? 1 : 2);
      setItemQuantity(String(qty));
      setItemWeight(
        customer.itemWeight && customer.itemWeight > 0 ? String(customer.itemWeight) : '0.5'
      );
      setAmountToCollect(String(Math.max(0, computedTotal)));
      setItemDescription(composedDesc);
      setSpecialInstruction((customer.notes || '').slice(0, 300));
    } else {
      setStoreId('0');
      setMerchantOrderId(generateSafeId('ORD').slice(0, 28));
      setRecipientName('');
      setRecipientPhone('');
      setRecipientDistrict('Dhaka');
      setRecipientAddress('');
      setDeliveryType(48);
      setItemType(2);
      setItemQuantity('1');
      setItemWeight('0.5');
      setAmountToCollect('0');
      setItemDescription('');
      setSpecialInstruction('');
    }
  }, [open, customer, editingParcel]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setStatusLoading(true);
    setStores([]);

    const merchantCtx = {
      userId: user.uid,
      userEmail: user.email,
      businessId: editingParcel ? editingParcel.businessId : activeBusinessId,
    };

    dbService
      .fetchPathaoServerStatus(merchantCtx)
      .then(async (status) => {
        if (!active) return;
        setServerStatus(status);
        if (status.defaultStoreId && !editingParcel?.storeId) {
          setStoreId(String(status.defaultStoreId));
        }
        if (status.configured) {
          setStoresLoading(true);
          try {
            const storeList = await dbService.fetchPathaoStores(merchantCtx);
            if (!active) return;
            setStores(storeList);
            if (storeList.length > 0 && (!editingParcel || !editingParcel.storeId)) {
              const preferred =
                storeList.find((s) => s.store_id === status.defaultStoreId) ||
                storeList.find((s) => s.is_default_store) ||
                storeList[0];
              if (preferred) {
                setStoreId(String(preferred.store_id));
              }
            }
          } catch {
            // Keep defaultStoreId fallback if stores list endpoint fails
          } finally {
            if (active) setStoresLoading(false);
          }
        }
      })
      .catch(() => {
        if (active) {
          setServerStatus({ configured: false, environment: 'production', defaultStoreId: null });
        }
      })
      .finally(() => {
        if (active) setStatusLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, editingParcel, user.uid, user.email, activeBusinessId]);

  const handleDispatch = async (dispatchMode: 'api' | 'queued') => {
    setErrorMsg(null);
    const numericStoreId = Number(storeId) || 0;
    const selectedStore = stores.find((s) => s.store_id === numericStoreId);

    const parsed = pathaoParcelSchema.safeParse({
      customerId: editingParcel ? editingParcel.customerId : customer?.id || '',
      merchantOrderId,
      storeId: numericStoreId,
      storeName: selectedStore?.store_name || editingParcel?.storeName || '',
      recipientName,
      recipientPhone,
      recipientAddress,
      recipientDistrict,
      deliveryType,
      itemType,
      itemQuantity,
      itemWeight,
      amountToCollect,
      itemDescription,
      specialInstruction,
    });

    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message || 'Please check parcel details.');
      return;
    }

    if (dispatchMode === 'api' && numericStoreId <= 0 && !serverStatus?.defaultStoreId) {
      setErrorMsg('Select a Pathao Pickup Store before sending live.');
      return;
    }

    setSubmitting(dispatchMode);
    try {
      const result = await dbService.dispatchPathaoParcel(user, parsed.data, {
        businessId: editingParcel ? editingParcel.businessId : activeBusinessId,
        mode: dispatchMode,
        existing: editingParcel || undefined,
      });
      onSuccess?.({ ...result, mode: dispatchMode });
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to process Pathao parcel.');
    } finally {
      setSubmitting(null);
    }
  };

  const canSendLive = Boolean(serverStatus?.configured);
  const alreadyDispatched = editingParcel?.dispatchMode === 'api' && Boolean(editingParcel.consignmentId);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingParcel ? t.pathao.modalEditTitle : t.pathao.modalTitle}
      subtitle={t.pathao.modalSubtitle}
      maxWidthClass="max-w-2xl"
    >
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {!statusLoading && serverStatus && (
          <div
            className={`rounded-lg border p-3 flex items-start gap-2.5 text-xs ${
              serverStatus.configured
                ? 'bg-[#22c55e]/10 border-[#22c55e]/30 text-zinc-200'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
            }`}
          >
            {serverStatus.configured ? (
              <CheckCircle2 className="w-4 h-4 text-[#4ade80] shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="min-w-0">
              <p className="font-semibold">
                {serverStatus.configured
                  ? `${t.pathao.serverConnectedTitle} (${serverStatus.environment})`
                  : t.pathao.serverNotConfiguredTitle}
              </p>
              {serverStatus.configured &&
                (serverStatus.merchantLabel ||
                  serverStatus.merchantId ||
                  serverStatus.defaultStoreId) && (
                  <p className="text-[11px] font-mono text-[#4ade80] mt-0.5 break-words">
                    {[
                      serverStatus.merchantLabel,
                      serverStatus.merchantId ? `Merchant #${serverStatus.merchantId}` : '',
                      serverStatus.defaultStoreId ? `Store #${serverStatus.defaultStoreId}` : '',
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
              <p className="text-[11px] opacity-85 mt-0.5 leading-relaxed">
                {serverStatus.configured
                  ? t.pathao.serverConnectedDesc
                  : t.pathao.serverNotConfiguredDesc}
              </p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="border border-red-500/30 bg-red-500/10 rounded-lg p-3 text-xs text-red-300">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          {stores.length > 0 ? (
            <Select
              label={t.pathao.storeLabel}
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
            >
              {stores.map((s) => (
                <option key={s.store_id} value={s.store_id}>
                  {s.store_name} (#{s.store_id})
                </option>
              ))}
            </Select>
          ) : (
            <Input
              label={t.pathao.storeLabel}
              type="number"
              min="0"
              value={Number(storeId) > 0 ? storeId : ''}
              onChange={(e) => setStoreId(e.target.value)}
              placeholder={storesLoading ? t.pathao.loadingStores : 'e.g. 131172 (Store ID)'}
              disabled={storesLoading}
              className="font-mono"
            />
          )}

          <Input
            label={t.pathao.orderIdLabel}
            required
            maxLength={64}
            value={merchantOrderId}
            onChange={(e) => setMerchantOrderId(e.target.value)}
            className="font-mono"
          />

          <Input
            label={t.pathao.recipientNameLabel}
            required
            maxLength={140}
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="e.g. Nusrat Jahan"
          />

          <Input
            label={t.pathao.recipientPhoneLabel}
            required
            maxLength={20}
            value={recipientPhone}
            onChange={(e) => setRecipientPhone(e.target.value)}
            placeholder="017XXXXXXXX"
            className="font-mono"
          />

          <Select
            label={t.pathao.districtLabel}
            value={recipientDistrict}
            onChange={(e) => setRecipientDistrict(e.target.value)}
          >
            {BD_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>

          <Input
            label={t.pathao.codAmountLabel}
            type="number"
            min="0"
            step="1"
            value={amountToCollect}
            onChange={(e) => setAmountToCollect(e.target.value)}
            className="font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-zinc-300">
            {t.pathao.addressLabel}
          </label>
          <textarea
            rows={2}
            maxLength={300}
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            placeholder="House 12, Road 4, Block B, Mirpur 10, Dhaka"
            className="w-full px-3 py-2 text-base sm:text-sm bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-lg placeholder:text-zinc-500 focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]"
          />
          <p className="text-[11px] text-zinc-400">{t.pathao.addressHint}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Select
            label={t.pathao.deliveryTypeLabel}
            value={String(deliveryType)}
            onChange={(e) => setDeliveryType(Number(e.target.value) === 12 ? 12 : 48)}
          >
            <option value="48">{t.pathao.normalDelivery}</option>
            <option value="12">{t.pathao.onDemandDelivery}</option>
          </Select>

          <Select
            label={t.pathao.itemTypeLabel}
            value={String(itemType)}
            onChange={(e) => setItemType(Number(e.target.value) === 1 ? 1 : 2)}
          >
            <option value="2">{t.pathao.parcelType}</option>
            <option value="1">{t.pathao.documentType}</option>
          </Select>

          <Input
            label={t.pathao.quantityLabel}
            type="number"
            min="1"
            step="1"
            value={itemQuantity}
            onChange={(e) => setItemQuantity(e.target.value)}
            className="font-mono"
          />

          <Input
            label={t.pathao.weightLabel}
            type="number"
            min="0.1"
            max="500"
            step="0.1"
            value={itemWeight}
            onChange={(e) => setItemWeight(e.target.value)}
            className="font-mono"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label={t.pathao.itemDescLabel}
            maxLength={300}
            value={itemDescription}
            onChange={(e) => setItemDescription(e.target.value)}
            placeholder="e.g. Cotton Panjabi · Size: L"
          />
          <Input
            label={t.pathao.instructionLabel}
            maxLength={300}
            value={specialInstruction}
            onChange={(e) => setSpecialInstruction(e.target.value)}
            placeholder="Call customer before delivery..."
          />
        </div>

        <div className="pt-4 border-t border-[#27272a] flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2.5 sm:gap-3">
          <Button
            type="button"
            variant="ghost"
            className="w-full sm:w-auto min-h-[44px] sm:min-h-0"
            onClick={onClose}
            disabled={Boolean(submitting)}
          >
            {t.common.close}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-auto min-h-[44px] sm:min-h-0"
            onClick={() => handleDispatch('queued')}
            disabled={Boolean(submitting)}
          >
            <Truck className="w-4 h-4 text-[#4ade80]" />
            <span>
              {submitting === 'queued'
                ? t.common.saving
                : alreadyDispatched
                ? t.common.edit
                : t.pathao.saveQueueDraftBtn}
            </span>
          </Button>
          {!alreadyDispatched && (
            <Button
              type="button"
              className="w-full sm:w-auto min-h-[44px] sm:min-h-0"
              onClick={() => handleDispatch('api')}
              disabled={Boolean(submitting) || !canSendLive}
              title={
                !canSendLive ? t.pathao.serverNotConfiguredTitle : t.pathao.sendToPathaoSubmit
              }
            >
              <Send className="w-4 h-4" />
              <span>
                {submitting === 'api' ? t.pathao.sendingBtn : t.pathao.sendToPathaoSubmit}
              </span>
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
