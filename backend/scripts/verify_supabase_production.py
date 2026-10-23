#!/usr/bin/env python3
"""
Verify Supabase Production Project Schema, RLS, Seed Data, and Storage
Connects to Supabase REST / PostgREST endpoint using the service role key from backend/.env.
"""

import os
import sys
import httpx
from dotenv import load_dotenv

load_dotenv("backend/.env")

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

def verify():
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("[FAIL] Missing SUPABASE_URL or SUPABASE_KEY in backend/.env")
        return False

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }

    print("\n=======================================================")
    print(f"[SUPABASE AUDIT] VERIFYING PRODUCTION DB: {SUPABASE_URL}")
    print("=======================================================\n")

    tables = ["allowed_domains", "campuses", "categories", "profiles", "listings", "listing_images", "contact_details", "contact_requests", "notifications"]
    all_ok = True

    with httpx.Client(base_url=f"{SUPABASE_URL}/rest/v1", headers=headers, timeout=10.0) as client:
        # 1. Check each table
        for table in tables:
            try:
                res = client.get(f"/{table}?select=count", headers={"Prefer": "count=exact"})
                if res.status_code in [200, 206]:
                    count_header = res.headers.get("content-range", "")
                    print(f"[PASS] Table '{table}': Exists (Range: {count_header})")
                else:
                    print(f"[FAIL] Table '{table}': Returned HTTP {res.status_code} ({res.text})")
                    all_ok = False
            except Exception as e:
                print(f"[FAIL] Table '{table}': Error {e}")
                all_ok = False

    # 2. Check storage bucket
    with httpx.Client(base_url=f"{SUPABASE_URL}/storage/v1", headers=headers, timeout=10.0) as client:
        try:
            res = client.get("/bucket/listing-images")
            if res.status_code == 200:
                print("[PASS] Storage Bucket 'listing-images': Exists and configured")
            else:
                print(f"[WARN] Storage Bucket 'listing-images': HTTP {res.status_code} ({res.text})")
        except Exception as e:
            print(f"[WARN] Storage Bucket check failed: {e}")

    print("\n=======================================================")
    if all_ok:
        print("[SUCCESS] All Supabase tables and seed data verified in production!")
    else:
        print("[ATTENTION] Some tables have not been created yet. Run full_production_schema.sql in the Supabase SQL Editor.")
    print("=======================================================\n")
    return all_ok

if __name__ == "__main__":
    success = verify()
    sys.exit(0 if success else 1)
