import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
import httpx
from app.config import settings

# Memory Database Store with initial seed data
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
            {"id": "11111111-0000-0000-0000-000000000008", "domain": "campusswap.edu", "college_name": "CampusSwap Demo Institute", "is_active": True, "created_at": now.isoformat()},
        ]

        # 2. Campuses
        self.campuses = [
            {"id": "22222222-0000-0000-0000-000000000001", "name": "Main Campus - Tech Hub", "code": "CAMPUS-MAIN", "city": "Cambridge", "created_at": now.isoformat()},
            {"id": "22222222-0000-0000-0000-000000000002", "name": "Powai Campus", "code": "CAMPUS-POWAI", "city": "Mumbai", "created_at": now.isoformat()},
            {"id": "22222222-0000-0000-0000-000000000003", "name": "North Quad Campus", "code": "CAMPUS-NORTH", "city": "Berkeley", "created_at": now.isoformat()},
            {"id": "22222222-0000-0000-0000-000000000004", "name": "South Medical Campus", "code": "CAMPUS-SOUTH", "city": "Boston", "created_at": now.isoformat()},
        ]

        # 3. Categories
        self.categories = [
            {"id": "33333333-0000-0000-0000-000000000001", "name": "Electronics & Tech", "slug": "electronics-tech", "parent_id": None, "description": "Laptops, chargers, calculators, microcontrollers, and hardware", "icon": "Laptop", "sort_order": 1},
            {"id": "33333333-0000-0000-0000-000000000002", "name": "Subscriptions & Software Keys", "slug": "subscriptions-keys", "parent_id": None, "description": "Shared cloud storage, AI tool seats, developer tools & licenses", "icon": "Key", "sort_order": 2},
            {"id": "33333333-0000-0000-0000-000000000003", "name": "Room & Flat Essentials", "slug": "room-essentials", "parent_id": None, "description": "Appliances, study lamps, induction cookers, mini fridges, kettles", "icon": "Home", "sort_order": 3},
            {"id": "33333333-0000-0000-0000-000000000004", "name": "Furniture", "slug": "furniture", "parent_id": None, "description": "Study tables, ergonomic chairs, clothes racks, mattresses, bins", "icon": "Armchair", "sort_order": 4},
            {"id": "33333333-0000-0000-0000-000000000005", "name": "Academics & Books", "slug": "academics-books", "parent_id": None, "description": "Textbooks, course readers, lab coats, drawing boards, stationery", "icon": "BookOpen", "sort_order": 5},
            # Subcategories
            {"id": "33333333-0001-0000-0000-000000000001", "name": "Laptops & Chargers", "slug": "laptops-chargers", "parent_id": "33333333-0000-0000-0000-000000000001", "description": "MacBooks, Windows laptops, USB-C chargers", "icon": "Laptop", "sort_order": 1},
            {"id": "33333333-0001-0000-0000-000000000002", "name": "Calculators (TI-84, Scientific)", "slug": "calculators", "parent_id": "33333333-0000-0000-0000-000000000001", "description": "Graphing and engineering calculators", "icon": "Calculator", "sort_order": 2},
            {"id": "33333333-0001-0000-0000-000000000003", "name": "Arduino & Raspberry Pi Kits", "slug": "microcontrollers", "parent_id": "33333333-0000-0000-0000-000000000001", "description": "Dev boards, sensor starter kits, breadboards", "icon": "Cpu", "sort_order": 3},
            {"id": "33333333-0001-0000-0000-000000000004", "name": "Monitors & Displays", "slug": "monitors", "parent_id": "33333333-0000-0000-0000-000000000001", "description": "Desk displays, HDMI cables", "icon": "Monitor", "sort_order": 4},
        ]

        # 4. Profiles
        self.profiles = [
            {
                "id": "44444444-0000-0000-0000-000000000001",
                "email": "admin@campusswap.edu",
                "domain": "campusswap.edu",
                "is_verified": True,
                "display_name": "Campus Admin",
                "campus_id": "22222222-0000-0000-0000-000000000001",
                "hostel_building": "Administration Tower",
                "batch_year": 2023,
                "role": "admin",
                "is_banned": False,
                "avg_response_time_minutes": 5,
                "avatar_url": None,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            },
            {
                "id": "44444444-0000-0000-0000-000000000002",
                "email": "alex.chen@mit.edu",
                "domain": "mit.edu",
                "is_verified": True,
                "display_name": "Alex Chen",
                "campus_id": "22222222-0000-0000-0000-000000000001",
                "hostel_building": "Hostel 4 - Next House",
                "batch_year": 2025,
                "role": "student",
                "is_banned": False,
                "avg_response_time_minutes": 15,
                "avatar_url": None,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            },
            {
                "id": "44444444-0000-0000-0000-000000000003",
                "email": "priya.sharma@iitb.ac.in",
                "domain": "iitb.ac.in",
                "is_verified": True,
                "display_name": "Priya Sharma",
                "campus_id": "22222222-0000-0000-0000-000000000002",
                "hostel_building": "Hostel 12 - Wing B",
                "batch_year": 2026,
                "role": "student",
                "is_banned": False,
                "avg_response_time_minutes": 25,
                "avatar_url": None,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            },
            {
                "id": "44444444-0000-0000-0000-000000000004",
                "email": "marcus.v@stanford.edu",
                "domain": "stanford.edu",
                "is_verified": True,
                "display_name": "Marcus Vance",
                "campus_id": "22222222-0000-0000-0000-000000000003",
                "hostel_building": "Roble Hall",
                "batch_year": 2024,
                "role": "student",
                "is_banned": False,
                "avg_response_time_minutes": 40,
                "avatar_url": None,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            },
            {
                "id": "44444444-0000-0000-0000-000000000005",
                "email": "unverified.user@gmail.com",
                "domain": "gmail.com",
                "is_verified": False,
                "display_name": "Guest User",
                "campus_id": None,
                "hostel_building": None,
                "batch_year": None,
                "role": "student",
                "is_banned": False,
                "avg_response_time_minutes": None,
                "avatar_url": None,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            },
        ]

        # 5. Listings
        self.listings = [
            {
                "id": "55555555-0000-0000-0000-000000000001",
                "seller_id": "44444444-0000-0000-0000-000000000002",
                "campus_id": "22222222-0000-0000-0000-000000000001",
                "category_id": "33333333-0000-0000-0000-000000000001",
                "title": "TI-84 Plus CE Color Graphing Calculator",
                "description": "Used for AP Calculus and Linear Algebra. Pristine condition with charging cable and sliding hard case. Battery holds charge for weeks.",
                "price": 45.0,
                "is_free": False,
                "condition": "like_new",
                "location_note": "Barker Engineering Library Lobby",
                "status": "active",
                "spam_score": 0.02,
                "view_count": 24,
                "expires_at": (now + timedelta(days=28)).isoformat(),
                "created_at": (now - timedelta(days=2)).isoformat(),
                "updated_at": (now - timedelta(days=2)).isoformat()
            },
            {
                "id": "55555555-0000-0000-0000-000000000002",
                "seller_id": "44444444-0000-0000-0000-000000000002",
                "campus_id": "22222222-0000-0000-0000-000000000001",
                "category_id": "33333333-0000-0000-0000-000000000003",
                "title": "Instant Pot Electric Kettle (1.7L, Auto-Shutoff)",
                "description": "Stainless steel electric kettle, perfect for late night tea or cup noodles in dorm room. Clean and fully functional.",
                "price": 12.0,
                "is_free": False,
                "condition": "good",
                "location_note": "Next House Dining Hall Entrance",
                "status": "active",
                "spam_score": 0.01,
                "view_count": 14,
                "expires_at": (now + timedelta(days=25)).isoformat(),
                "created_at": (now - timedelta(days=5)).isoformat(),
                "updated_at": (now - timedelta(days=5)).isoformat()
            },
            {
                "id": "55555555-0000-0000-0000-000000000003",
                "seller_id": "44444444-0000-0000-0000-000000000003",
                "campus_id": "22222222-0000-0000-0000-000000000002",
                "category_id": "33333333-0000-0000-0000-000000000001",
                "title": "Arduino Uno Rev3 Starter Kit with Breadboard & 30+ Sensors",
                "description": "Complete CS/EE project starter kit. Comes in transparent organizer box with resistors, LEDs, ultrasonic distance sensor, and servo motors.",
                "price": 22.0,
                "is_free": False,
                "condition": "like_new",
                "location_note": "Central Library Ground Floor",
                "status": "active",
                "spam_score": 0.01,
                "view_count": 38,
                "expires_at": (now + timedelta(days=29)).isoformat(),
                "created_at": (now - timedelta(days=1)).isoformat(),
                "updated_at": (now - timedelta(days=1)).isoformat()
            },
            {
                "id": "55555555-0000-0000-0000-000000000004",
                "seller_id": "44444444-0000-0000-0000-000000000003",
                "campus_id": "22222222-0000-0000-0000-000000000002",
                "category_id": "33333333-0000-0000-0000-000000000005",
                "title": "Thomas Calculus 14th Edition + Physics Lab Coat (Size M)",
                "description": "Passing on course materials from freshman year! Book has some pencil highlights. Lab coat is washed and sanitized.",
                "price": 0.0,
                "is_free": True,
                "condition": "good",
                "location_note": "Hostel 12 Quadrangle",
                "status": "active",
                "spam_score": 0.01,
                "view_count": 52,
                "expires_at": (now + timedelta(days=27)).isoformat(),
                "created_at": (now - timedelta(days=3)).isoformat(),
                "updated_at": (now - timedelta(days=3)).isoformat()
            },
            {
                "id": "55555555-0000-0000-0000-000000000005",
                "seller_id": "44444444-0000-0000-0000-000000000004",
                "campus_id": "22222222-0000-0000-0000-000000000003",
                "category_id": "33333333-0000-0000-0000-000000000004",
                "title": "Adjustable Ergonomic Mesh Study Chair",
                "description": "High-back breathable mesh desk chair with lumbar support. Moving out at end of quarter so need it picked up quickly.",
                "price": 35.0,
                "is_free": False,
                "condition": "good",
                "location_note": "Tressider Student Union Patio",
                "status": "active",
                "spam_score": 0.02,
                "view_count": 30,
                "expires_at": (now + timedelta(days=20)).isoformat(),
                "created_at": (now - timedelta(days=10)).isoformat(),
                "updated_at": (now - timedelta(days=10)).isoformat()
            },
            {
                "id": "55555555-0000-0000-0000-000000000006",
                "seller_id": "44444444-0000-0000-0000-000000000004",
                "campus_id": "22222222-0000-0000-0000-000000000003",
                "category_id": "33333333-0000-0000-0000-000000000002",
                "title": "JetBrains All-Products Pack 1-Year Educational Share Seat",
                "description": "Surplus team developer license for IntelliJ, PyCharm, WebStorm. Valid until graduation.",
                "price": 15.0,
                "is_free": False,
                "condition": "brand_new",
                "location_note": "Gates Computer Science Building Cafe",
                "status": "active",
                "spam_score": 0.04,
                "view_count": 42,
                "expires_at": (now + timedelta(days=30)).isoformat(),
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            }
        ]

        # 6. Listing images
        self.listing_images = [
            {"id": "66666666-0000-0000-0000-000000000001", "listing_id": "55555555-0000-0000-0000-000000000001", "image_url": "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80", "sort_order": 0},
            {"id": "66666666-0000-0000-0000-000000000002", "listing_id": "55555555-0000-0000-0000-000000000002", "image_url": "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=800&q=80", "sort_order": 0},
            {"id": "66666666-0000-0000-0000-000000000003", "listing_id": "55555555-0000-0000-0000-000000000003", "image_url": "https://images.unsplash.com/photo-1553406830-ef2513450d76?auto=format&fit=crop&w=800&q=80", "sort_order": 0},
            {"id": "66666666-0000-0000-0000-000000000004", "listing_id": "55555555-0000-0000-0000-000000000004", "image_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80", "sort_order": 0},
            {"id": "66666666-0000-0000-0000-000000000005", "listing_id": "55555555-0000-0000-0000-000000000005", "image_url": "https://images.unsplash.com/photo-1580481077195-c3a821a506cb?auto=format&fit=crop&w=800&q=80", "sort_order": 0},
            {"id": "66666666-0000-0000-0000-000000000006", "listing_id": "55555555-0000-0000-0000-000000000006", "image_url": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80", "sort_order": 0},
        ]

        # 7. Wanted Posts
        self.wanted_posts = [
            {
                "id": "77777777-0000-0000-0000-000000000001",
                "user_id": "44444444-0000-0000-0000-000000000003",
                "campus_id": "22222222-0000-0000-0000-000000000002",
                "category_id": "33333333-0000-0000-0000-000000000001",
                "title": "Looking for Dell or Lenovo 65W USB-C Laptop Charger",
                "description": "Left my laptop charger at home during fall break. Need a spare compatible with ThinkPad / XPS.",
                "budget_max": 20.0,
                "status": "open",
                "created_at": (now - timedelta(days=2)).isoformat(),
                "updated_at": (now - timedelta(days=2)).isoformat()
            },
            {
                "id": "77777777-0000-0000-0000-000000000002",
                "user_id": "44444444-0000-0000-0000-000000000002",
                "campus_id": "22222222-0000-0000-0000-000000000001",
                "category_id": "33333333-0000-0000-0000-000000000005",
                "title": "CS 106B Reader & Algorithms Textbook by Cormen (CLRS)",
                "description": "Willing to buy or borrow for Spring semester. Hardcover or softcover both okay.",
                "budget_max": 30.0,
                "status": "open",
                "created_at": (now - timedelta(days=1)).isoformat(),
                "updated_at": (now - timedelta(days=1)).isoformat()
            }
        ]

        # 8. Contact Details (Sample encrypted contact for Alex Chen's calculator)
        from app.security.encryption import encrypt_contact
        enc_phone = encrypt_contact("+1-617-555-0192")
        self.contact_details = [
            {
                "id": "88888888-0000-0000-0000-000000000001",
                "listing_id": "55555555-0000-0000-0000-000000000001",
                "user_id": "44444444-0000-0000-0000-000000000002",
                "contact_type": "phone",
                "encrypted_contact_value": enc_phone,
                "preferred_note": "Text me on WhatsApp or SMS between 2 PM and 8 PM",
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            }
        ]

# Global singleton database instance
db = DatabaseStore()
