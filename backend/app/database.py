import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import httpx
from app.config import settings

# Memory Database Store with clean initial data
class DatabaseStore:
    def __init__(self):
        self.allowed_domains: List[Dict[str, Any]] = []
        self.campuses: List[Dict[str, Any]] = []
        self.categories: List[Dict[str, Any]] = []
        self.profiles: List[Dict[str, Any]] = []
        self.listings: List[Dict[str, Any]] = []
        self.listing_images: List[Dict[str, Any]] = []
        self.contact_details: List[Dict[str, Any]] = []
        self.contact_requests: List[Dict[str, Any]] = []
        self.wanted_posts: List[Dict[str, Any]] = []
        self.reports: List[Dict[str, Any]] = []
        self.audit_logs: List[Dict[str, Any]] = []
        self.notifications: List[Dict[str, Any]] = []
        self._seed_initial_data()

    def _seed_initial_data(self):
        now = datetime.now(timezone.utc)
        
        # 1. Allowed domains
        self.allowed_domains = [
            {"id": "11111111-0000-0000-0000-000000000001", "domain": ".edu", "college_name": "All Accredited US Higher-Ed Institutions", "is_active": True, "created_at": now.isoformat()},
            {"id": "11111111-0000-0000-0000-000000000002", "domain": ".ac.in", "college_name": "All Indian Universities & Colleges", "is_active": True, "created_at": now.isoformat()},
            {"id": "11111111-0000-0000-0000-000000000003", "domain": ".edu.in", "college_name": "Indian Educational Institutions", "is_active": True, "created_at": now.isoformat()},
            {"id": "11111111-0000-0000-0000-000000000004", "domain": "iitb.ac.in", "college_name": "IIT Bombay", "is_active": True, "created_at": now.isoformat()},
            {"id": "11111111-0000-0000-0000-000000000005", "domain": "mit.edu", "college_name": "MIT", "is_active": True, "created_at": now.isoformat()},
            {"id": "11111111-0000-0000-0000-000000000006", "domain": "stanford.edu", "college_name": "Stanford University", "is_active": True, "created_at": now.isoformat()},
            {"id": "11111111-0000-0000-0000-000000000007", "domain": "berkeley.edu", "college_name": "UC Berkeley", "is_active": True, "created_at": now.isoformat()},
            {"id": "11111111-0000-0000-0000-000000000009", "domain": "pict.edu", "college_name": "PICT - Pune Institute of Computer Technology", "is_active": True, "created_at": now.isoformat()},
        ]

        # 2. Campuses (Only PICT and Other College)
        self.campuses = [
            {"id": "22222222-0000-0000-0000-000000000005", "name": "PICT - Pune Institute of Computer Technology", "code": "CAMPUS-PICT", "city": "Pune", "created_at": now.isoformat()},
            {"id": "22222222-0000-0000-0000-000000000099", "name": "Other College", "code": "CAMPUS-OTHER", "city": "Other", "created_at": now.isoformat()},
        ]

        # 3. Categories
        self.categories = [
            {"id": "33333333-0000-0000-0000-000000000001", "name": "Electronics & Tech", "slug": "electronics-tech", "parent_id": None, "description": "Laptops, chargers, calculators, microcontrollers, and hardware", "icon": "Laptop", "sort_order": 1},
            {"id": "33333333-0000-0000-0000-000000000002", "name": "Subscriptions & Software Keys", "slug": "subscriptions-keys", "parent_id": None, "description": "Shared cloud storage, AI tool seats, developer tools & licenses", "icon": "Key", "sort_order": 2},
            {"id": "33333333-0000-0000-0000-000000000003", "name": "Room & Flat Essentials", "slug": "room-essentials", "parent_id": None, "description": "Appliances, study lamps, induction cookers, mini fridges, kettles", "icon": "Home", "sort_order": 3},
            {"id": "33333333-0000-0000-0000-000000000004", "name": "Furniture", "slug": "furniture", "parent_id": None, "description": "Study tables, ergonomic chairs, clothes racks, mattresses, bins", "icon": "Armchair", "sort_order": 4},
            {"id": "33333333-0000-0000-0000-000000000005", "name": "Academics & Books", "slug": "academics-books", "parent_id": None, "description": "Textbooks, course readers, lab coats, drawing boards, stationery", "icon": "BookOpen", "sort_order": 5},
            {"id": "33333333-0000-0000-0000-000000000006", "name": "Canva & Antigravity Subscriptions", "slug": "canva-antigravity-subscriptions", "parent_id": None, "description": "Canva Pro student team invites, Google Antigravity AI coding seats, design tools & developer cloud licenses", "icon": "Sparkles", "sort_order": 6},
            # Subcategories
            {"id": "33333333-0001-0000-0000-000000000001", "name": "Laptops & Chargers", "slug": "laptops-chargers", "parent_id": "33333333-0000-0000-0000-000000000001", "description": "MacBooks, Windows laptops, USB-C chargers", "icon": "Laptop", "sort_order": 1},
            {"id": "33333333-0001-0000-0000-000000000002", "name": "Calculators (TI-84, Scientific)", "slug": "calculators", "parent_id": "33333333-0000-0000-0000-000000000001", "description": "Graphing and engineering calculators", "icon": "Calculator", "sort_order": 2},
            {"id": "33333333-0001-0000-0000-000000000003", "name": "Arduino & Raspberry Pi Kits", "slug": "microcontrollers", "parent_id": "33333333-0000-0000-0000-000000000001", "description": "Dev boards, sensor starter kits, breadboards", "icon": "Cpu", "sort_order": 3},
            {"id": "33333333-0001-0000-0000-000000000004", "name": "Monitors & Displays", "slug": "monitors", "parent_id": "33333333-0000-0000-0000-000000000001", "description": "Desk displays, HDMI cables", "icon": "Monitor", "sort_order": 4},
            {"id": "33333333-0001-0000-0000-000000000005", "name": "Canva Pro Team Invites", "slug": "canva-pro", "parent_id": "33333333-0000-0000-0000-000000000006", "description": "Canva Pro student design team seats & templates", "icon": "Sparkles", "sort_order": 5},
            {"id": "33333333-0001-0000-0000-000000000006", "name": "Google Antigravity AI Seats", "slug": "antigravity-ai", "parent_id": "33333333-0000-0000-0000-000000000006", "description": "Antigravity developer coding seats & cloud agent compute", "icon": "Cpu", "sort_order": 6},
        ]

        # 4. Production collections: Empty by default (populated by real authenticated users)
        self.profiles = []
        self.listings = []
        self.listing_images = []
        self.contact_details = []
        self.contact_requests = []
        self.wanted_posts = []

# Global singleton database instance
db = DatabaseStore()
