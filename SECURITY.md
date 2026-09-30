# CampusSwap — Security Architecture & Key Rotation Guide

CampusSwap is engineered with privacy as a foundational constraint: personal contact information is never publicly queryable or accessible to search crawlers, scraper bots, or unverified accounts.

---

## 1. Threat Model & Privacy Guarantees

| Threat | Architectural Defense |
|---|---|
| **Public Phone / Email Scraping** | Sensitive contact fields (phone, email, WhatsApp, notes) are stored in an isolated `contact_details` table and encrypted with AES-256-GCM. Public listing API responses (`/api/v1/listings`) never contain contact details. |
| **Search Engine / Index Leaks** | Meilisearch and search indexing services only receive public attributes (`id, title, description, category, price, condition, images`). Zero contact fields are ever passed to indexing pipelines. |
| **Non-Student / Outside Scammers** | Mandatory institutional email validation (`.edu`, `.ac.in`, `.edu.in`, or admin whitelisted domains). Enforced server-side (`get_current_verified_user` FastAPI dependency) and database-level (Supabase RLS). |
| **Contact Harassment** | One contact request per buyer per listing. Daily rate-limiting (max 15 requests/24h per user). Sellers must explicitly consent and approve before contact is revealed. |
| **Revocation of Consent** | If a seller revokes access, the buyer's authorization immediately ceases and decryption endpoints refuse to return the plaintext contact. |
| **Spam / Prohibited Goods** | ML classifier scans titles and descriptions for weapons, prescription drugs, pirated software keys, and advance fee wire/crypto scams, automatically redirecting suspicious posts to an admin moderation queue (`flagged`). |

---

## 2. AES-256-GCM Contact Encryption

Contact information is encrypted using the authenticated AEAD cipher **AES-256-GCM**:
- **Key**: 256-bit (32 bytes) cryptographically secure key stored in environment variables (`ENCRYPTION_KEY`).
- **Nonce / IV**: 96-bit (12 bytes) unique random nonce generated via `os.urandom(12)` per encrypted field.
- **Authentication Tag**: 128-bit tag computed by GCM ensuring ciphertext integrity against tampering.
- **Payload format**: `Base64( Nonce [12 bytes] || Ciphertext || Tag [16 bytes] )`.

### Key Generation
To generate a new 32-byte key:
```bash
python -c "import secrets, base64; print(base64.b64encode(secrets.token_bytes(32)).decode())"
```

### Encryption Key Rotation Procedure
When rotating `ENCRYPTION_KEY`:
1. **Define Dual-Key Window**: Set `ENCRYPTION_KEY_NEW` and keep `ENCRYPTION_KEY_OLD` active in configuration.
2. **Execute Re-encryption Migration Script**:
   ```python
   # Migration script outline:
   # 1. Fetch each record in contact_details
   # 2. Decrypt encrypted_contact_value using OLD key
   # 3. Encrypt plaintext using NEW key with fresh random nonce
   # 4. Update contact_details SET encrypted_contact_value = new_cipher
   ```
3. **Promote New Key**: Set `ENCRYPTION_KEY = ENCRYPTION_KEY_NEW` and purge `ENCRYPTION_KEY_OLD`.
4. **Log Audit Event**: Record `key_rotation_executed` in `audit_logs`.

---

## 3. Row Level Security (RLS) Policy Verification Checklist

- [x] `contact_details`:
  - `SELECT` strictly limited to `user_id = auth.uid()` OR `EXISTS (SELECT 1 FROM contact_requests WHERE listing_id = contact_details.listing_id AND buyer_id = auth.uid() AND status = 'approved')`.
- [x] `listings`:
  - `INSERT` strictly limited to `is_verified = true AND is_banned = false`.
- [x] `contact_requests`:
  - `INSERT` blocked if `buyer_id = seller_id` (cannot request own listing).
  - Unique constraint on `(listing_id, buyer_id)`.
- [x] `banned_users`:
  - Users with `is_banned = true` are immediately blocked from all authenticated queries and mutations.

---

## 4. Security Incident Response
If a security vulnerability or anomalous account behavior is identified:
1. Ban the offender via the Admin Portal (`/admin` -> User Management -> Ban User).
2. The ban immediately invalidates JWT claims and terminates active WebSockets.
3. Review audit logs (`/api/v1/admin/audit-logs`) to examine recent requests and actions.
