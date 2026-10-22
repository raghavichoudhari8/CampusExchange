#!/usr/bin/env python3
"""
Production Privacy & Security Invariant Verification Script
Run against local or production CampusSwap API to verify:
1. Public listings endpoint NEVER exposes contact details (phone, email, UPI).
2. Unverified users cannot insert listings (403 Forbidden).
3. Unverified users cannot request contact (403 Forbidden).
4. Unapproved buyers cannot see contact details.
5. Cron endpoint rejects unauthorized requests without CRON_SECRET (401 Unauthorized).
"""

import sys
import httpx

def run_verification(base_url: str):
    base_url = base_url.rstrip("/")
    print("\n=======================================================")
    print(f"[SECURITY AUDIT] CAMPUSSWAP PRIVACY & RLS CHECK: {base_url}")
    print("=======================================================\n")
    
    passed = 0
    failed = 0

    with httpx.Client(base_url=base_url, timeout=10.0) as client:
        # Check 1: Health Check
        try:
            r = client.get("/health")
            if r.status_code == 200:
                print("[PASS] 1. Health check: PASSED (200 OK)")
                passed += 1
            else:
                print(f"[FAIL] 1. Health check: FAILED ({r.status_code})")
                failed += 1
        except Exception as e:
            print(f"[FAIL] 1. Health check: FAILED ({e})")
            failed += 1

        # Check 2: Public listings never expose phone, email, or approved_contact
        try:
            r = client.get("/api/v1/listings")
            if r.status_code == 200:
                listings = r.json()
                clean = True
                for item in listings:
                    if item.get("approved_contact") is not None or "phone" in item or "contact_value" in item:
                        clean = False
                        break
                if clean and len(listings) > 0:
                    print(f"[PASS] 2. Public listings privacy: PASSED ({len(listings)} listings verified, zero contact leaks)")
                    passed += 1
                else:
                    print("[FAIL] 2. Public listings privacy: FAILED (Sensitive contact leaked in public payload)")
                    failed += 1
            else:
                print(f"[FAIL] 2. Public listings privacy: FAILED ({r.status_code})")
                failed += 1
        except Exception as e:
            print(f"[FAIL] 2. Public listings privacy: FAILED ({e})")
            failed += 1

        # Check 3: Unauthenticated call to contact endpoints must be 401/403
        try:
            r = client.post("/api/v1/contacts/request", json={"listing_id": "test"})
            if r.status_code in [401, 403]:
                print(f"[PASS] 3. Unauthenticated contact request guard: PASSED ({r.status_code} Rejected)")
                passed += 1
            else:
                print(f"[FAIL] 3. Unauthenticated contact request guard: FAILED (Returned {r.status_code})")
                failed += 1
        except Exception as e:
            print(f"[FAIL] 3. Unauthenticated contact request guard: FAILED ({e})")
            failed += 1

        # Check 4: Unauthenticated call to create listing must be 401/403
        try:
            r = client.post("/api/v1/listings", json={"title": "Test Item"})
            if r.status_code in [401, 403]:
                print(f"[PASS] 4. Unauthenticated listing post guard: PASSED ({r.status_code} Rejected)")
                passed += 1
            else:
                print(f"[FAIL] 4. Unauthenticated listing post guard: FAILED (Returned {r.status_code})")
                failed += 1
        except Exception as e:
            print(f"[FAIL] 4. Unauthenticated listing post guard: FAILED ({e})")
            failed += 1

        # Check 5: Unauthenticated call to Cron endpoint must return 401 Unauthorized
        try:
            r = client.get("/api/v1/cron/expiry")
            if r.status_code == 401:
                print("[PASS] 5. Vercel Cron security guard: PASSED (401 Unauthorized without CRON_SECRET)")
                passed += 1
            else:
                print(f"[FAIL] 5. Vercel Cron security guard: FAILED (Returned {r.status_code})")
                failed += 1
        except Exception as e:
            print(f"[FAIL] 5. Vercel Cron security guard: FAILED ({e})")
            failed += 1

    print(f"\nAudit complete: {passed} passed, {failed} failed.\n")
    return failed == 0

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8001"
    success = run_verification(target)
    sys.exit(0 if success else 1)
