# Firestore Security Specification

## 1. Data Invariants
1. **Verified Admin Gate**: Every collection (`/admins`, `/settings`, `/expenses`, `/expenses/{expenseId}/receipts`, `/products`, `/products/{productId}/photos`, `/activityLogs`) denies unauthenticated and unverified users (`request.auth != null && request.auth.token.email_verified == true` AND either bootstrapped owner `shihabahmmed700@gmail.com` or an active `/admins/{uid}` document).
2. **Subcollection Master Gate**: `ReceiptAsset` under `/expenses/{expenseId}/receipts/{receiptId}` and `ProductPhoto` under `/products/{productId}/photos/{photoId}` cannot be read or written unless the parent `/expenses/{expenseId}` or `/products/{productId}` exists and the foreign ID matches the path parameter.
3. **Strict Validation Blueprints**: All `create` and `update` operations validate exact required/allowed keys (`hasAll` + `hasOnly`), enum allowlists, numeric bounds, `.size()` bounds on every string, and regex ID checks (`^[a-zA-Z0-9_\\-]+$`).
4. **Immutable Audit & Ownership Fields**: `authorUid`, `authorEmail`, `actorUid`, `actorEmail`, and `createdAt` (`== request.time` on create) are strictly locked against mutation on update. `activityLogs` are append-only (update and delete forbidden).
5. **Query Enforcer Without List-Time Lookups**: Every `allow list` checks `isRootAdmin()` (token email check with zero DB reads) or `resource.data.<ownerField> == request.auth.uid`, never executing `get()`/`exists()` inside `allow list`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. Unauthenticated `list` on `/expenses` -> `PERMISSION_DENIED`.
2. Spoofed root email with `email_verified: false` -> `PERMISSION_DENIED`.
3. Non-admin verified user creating `/products/p1` -> `PERMISSION_DENIED`.
4. Non-admin self-assigning `/admins/attacker` -> `PERMISSION_DENIED`.
5. Shadow/ghost key `isApproved: true` on `/expenses/e1` -> `PERMISSION_DENIED`.
6. Author UID mismatch on `/products/p1` -> `PERMISSION_DENIED`.
7. Client-backdated `createdAt` on `/expenses/e1` -> `PERMISSION_DENIED`.
8. Mutating `authorUid` on `/products/p1` update -> `PERMISSION_DENIED`.
9. Resource poisoning: >128 char doc ID or negative `stockQty` -> `PERMISSION_DENIED`.
10. Invalid `paymentMethod` enum (`"Bitcoin"`) on `/expenses/e1` -> `PERMISSION_DENIED`.
11. Orphaned `/products/missing/photos/ph1` write -> `PERMISSION_DENIED`.
12. Modifying or deleting immutable `/activityLogs/log1` -> `PERMISSION_DENIED`.
