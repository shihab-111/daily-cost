/**
 * Firestore Security Rules Verification Suite (Dirty Dozen Adversarial Matrix)
 */
import fs from 'node:fs';
import path from 'node:path';

export interface SecurityTestCase {
  id: number;
  name: string;
  collectionPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  auth: { uid: string; email?: string; email_verified?: boolean } | null;
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED';
}

export const dirtyDozenPayloads: SecurityTestCase[] = [
  { id: 1, name: 'Unauthenticated list on /expenses', collectionPath: 'expenses', operation: 'list', auth: null, expected: 'PERMISSION_DENIED' },
  { id: 2, name: 'Email spoof with email_verified=false', collectionPath: 'expenses/exp_01', operation: 'create', auth: { uid: 'spoof', email: 'shihabahmmed700@gmail.com', email_verified: false }, payload: { title: 'Spoof' }, expected: 'PERMISSION_DENIED' },
  { id: 3, name: 'Non-admin creating product', collectionPath: 'products/prod_01', operation: 'create', auth: { uid: 'user1', email: 'user@example.com', email_verified: true }, payload: { name: 'Shirt' }, expected: 'PERMISSION_DENIED' },
  { id: 4, name: 'Self-assigned admin escalation', collectionPath: 'admins/user1', operation: 'create', auth: { uid: 'user1', email: 'user@example.com', email_verified: true }, payload: { uid: 'user1', role: 'owner', active: true }, expected: 'PERMISSION_DENIED' },
  { id: 5, name: 'Shadow field injection on expense', collectionPath: 'expenses/exp_02', operation: 'create', auth: { uid: 'owner', email: 'shihabahmmed700@gmail.com', email_verified: true }, payload: { title: 'FB Ads', shadow: true }, expected: 'PERMISSION_DENIED' },
  { id: 6, name: 'Author UID spoofing on product', collectionPath: 'products/prod_02', operation: 'create', auth: { uid: 'owner', email: 'shihabahmmed700@gmail.com', email_verified: true }, payload: { authorUid: 'other', name: 'Jacket' }, expected: 'PERMISSION_DENIED' },
  { id: 7, name: 'Backdated createdAt on expense', collectionPath: 'expenses/exp_03', operation: 'create', auth: { uid: 'owner', email: 'shihabahmmed700@gmail.com', email_verified: true }, payload: { createdAt: '2020-01-01', title: 'Old' }, expected: 'PERMISSION_DENIED' },
  { id: 8, name: 'Immortal authorUid mutation on product update', collectionPath: 'products/prod_01', operation: 'update', auth: { uid: 'owner', email: 'shihabahmmed700@gmail.com', email_verified: true }, payload: { authorUid: 'new_owner' }, expected: 'PERMISSION_DENIED' },
  { id: 9, name: 'Negative stockQty resource poisoning', collectionPath: 'products/prod_03', operation: 'create', auth: { uid: 'owner', email: 'shihabahmmed700@gmail.com', email_verified: true }, payload: { stockQty: -5 }, expected: 'PERMISSION_DENIED' },
  { id: 10, name: 'Invalid paymentMethod enum on expense', collectionPath: 'expenses/exp_04', operation: 'create', auth: { uid: 'owner', email: 'shihabahmmed700@gmail.com', email_verified: true }, payload: { paymentMethod: 'Crypto' }, expected: 'PERMISSION_DENIED' },
  { id: 11, name: 'Orphaned product photo write', collectionPath: 'products/missing/photos/ph_1', operation: 'create', auth: { uid: 'owner', email: 'shihabahmmed700@gmail.com', email_verified: true }, payload: { productId: 'missing' }, expected: 'PERMISSION_DENIED' },
  { id: 12, name: 'Deleting immutable activity log', collectionPath: 'activityLogs/log_1', operation: 'delete', auth: { uid: 'owner', email: 'shihabahmmed700@gmail.com', email_verified: true }, expected: 'PERMISSION_DENIED' },
];

export function verifyRulesFilePresent(): boolean {
  return fs.existsSync(path.resolve(process.cwd(), 'firestore.rules'));
}
