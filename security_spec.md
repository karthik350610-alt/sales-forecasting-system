# Security Specification - Sales Forecasting System

## Data Invariants
1. A Sales Record must belong to a valid user (`userId`).
2. A user can only access (read/write) records where `userId` matches their `auth.uid`.
3. Timestamps `createdAt` and `updatedAt` must be server-generated.
4. Core fields like `sales`, `date`, `storeId`, and `productId` are mandatory for creation.

## The "Dirty Dozen" Payloads (Red Team Test Cases)

1. **Identity Theft (Create)**: Attempt to create a record with `userId` of another user.
2. **Identity Theft (Update)**: Attempt to update another user's record.
3. **Identity Theft (Read)**: Attempt to read another user's record.
4. **Shadow Field Injection**: Attempt to add a field like `isAdmin: true` to a sales record.
5. **Type Poisoning**: Attempt to set `sales` as a string `"one million"`.
6. **Resource Exhaustion**: Attempt to set `storeId` as a 1MB long string.
7. **Future/Past Spoofing**: Attempt to set `createdAt` to a manual date in the past.
8. **ID Injection**: Attempt to use `../../system/config` as a `recordId`.
9. **Terminal State Bypass**: (N/A for this app, but relevant if we had "locked" records).
10. **Data Corruption**: Attempt to set `promotion` to `99` (should be 0 or 1).
11. **PII Leak**: Attempt to query all users' emails without being an owner.
12. **Orphaned Record**: Attempt to create a record without a `userId`.

## Secure Rules Implementation Plan
1. Default-deny catch-all.
2. Helper functions for auth, ownership, and validation.
3. Strict `isValidSalesRecord` schema check.
4. `affectedKeys().hasOnly()` gates for updates.
5. Immortality checks for `userId` and `createdAt`.
