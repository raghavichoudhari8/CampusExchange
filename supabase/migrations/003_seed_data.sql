-- ====================================================================
-- CampusSwap: Phase 2 - Seed Data
-- Categories, Campuses, Allowed Domains, Demo Users, Sample Listings
-- ====================================================================

-- 1. Insert Allowed Domains
INSERT INTO allowed_domains (id, domain, college_name, is_active) VALUES
('11111111-0000-0000-0000-000000000001', '.edu', 'All Accredited US Higher-Ed Institutions', TRUE),
('11111111-0000-0000-0000-000000000002', '.ac.in', 'All Indian Universities & Colleges', TRUE),
('11111111-0000-0000-0000-000000000003', '.edu.in', 'Indian Educational Institutions', TRUE),
('11111111-0000-0000-0000-000000000004', 'iitb.ac.in', 'Indian Institute of Technology Bombay', TRUE),
('11111111-0000-0000-0000-000000000005', 'mit.edu', 'Massachusetts Institute of Technology', TRUE),
('11111111-0000-0000-0000-000000000006', 'stanford.edu', 'Stanford University', TRUE),
('11111111-0000-0000-0000-000000000007', 'berkeley.edu', 'UC Berkeley', TRUE),
('11111111-0000-0000-0000-000000000008', 'bits-pilani.ac.in', 'BITS Pilani', TRUE)
ON CONFLICT (domain) DO NOTHING;

-- 2. Insert Campuses
INSERT INTO campuses (id, name, code, city) VALUES
('22222222-0000-0000-0000-000000000001', 'Main Campus - Tech Hub', 'CAMPUS-MAIN', 'Cambridge'),
('22222222-0000-0000-0000-000000000002', 'Powai Campus', 'CAMPUS-POWAI', 'Mumbai'),
('22222222-0000-0000-0000-000000000003', 'North Quad Campus', 'CAMPUS-NORTH', 'Berkeley'),
('22222222-0000-0000-0000-000000000004', 'South Medical Campus', 'CAMPUS-SOUTH', 'Boston')
ON CONFLICT (code) DO NOTHING;

-- 3. Insert Categories and Subcategories
-- Top Level
INSERT INTO categories (id, name, slug, parent_id, description, icon, sort_order) VALUES
('33333333-0000-0000-0000-000000000001', 'Electronics & Tech', 'electronics-tech', NULL, 'Laptops, chargers, calculators, microcontrollers, and hardware', 'Laptop', 1),
('33333333-0000-0000-0000-000000000002', 'Subscriptions & Software Keys', 'subscriptions-keys', NULL, 'Shared cloud storage, AI tool seats, developer tools & licenses', 'Key', 2),
('33333333-0000-0000-0000-000000000003', 'Room & Flat Essentials', 'room-essentials', NULL, 'Appliances, study lamps, induction cookers, mini fridges, kettles', 'Home', 3),
('33333333-0000-0000-0000-000000000004', 'Furniture', 'furniture', NULL, 'Study tables, ergonomic chairs, clothes racks, mattresses, bins', 'Armchair', 4),
('33333333-0000-0000-0000-000000000005', 'Academics & Books', 'academics-books', NULL, 'Textbooks, course readers, lab coats, drawing boards, stationery', 'BookOpen', 5)
ON CONFLICT (slug) DO NOTHING;

-- Sub-categories for Electronics
INSERT INTO categories (id, name, slug, parent_id, description, icon, sort_order) VALUES
('33333333-0001-0000-0000-000000000001', 'Laptops & Chargers', 'laptops-chargers', '33333333-0000-0000-0000-000000000001', 'MacBooks, Windows laptops, USB-C chargers', 'Laptop', 1),
('33333333-0001-0000-0000-000000000002', 'Calculators (TI-84, Scientific)', 'calculators', '33333333-0000-0000-0000-000000000001', 'Graphing and engineering calculators', 'Calculator', 2),
('33333333-0001-0000-0000-000000000003', 'Arduino & Raspberry Pi Kits', 'microcontrollers', '33333333-0000-0000-0000-000000000001', 'Dev boards, sensor starter kits, breadboards', 'Cpu', 3),
('33333333-0001-0000-0000-000000000004', 'Monitors & Displays', 'monitors', '33333333-0000-0000-0000-000000000001', 'Desk displays, HDMI cables', 'Monitor', 4)
ON CONFLICT (slug) DO NOTHING;

-- 4. Demo Profiles
INSERT INTO profiles (id, email, domain, is_verified, display_name, campus_id, hostel_building, batch_year, role, avg_response_time_minutes) VALUES
('44444444-0000-0000-0000-000000000001', 'admin@campusswap.edu', 'campusswap.edu', TRUE, 'Campus Admin', '22222222-0000-0000-0000-000000000001', 'Admin Hall', 2023, 'admin', 5),
('44444444-0000-0000-0000-000000000002', 'alex.chen@mit.edu', 'mit.edu', TRUE, 'Alex Chen', '22222222-0000-0000-0000-000000000001', 'Hostel 4 - Next House', 2025, 'student', 15),
('44444444-0000-0000-0000-000000000003', 'priya.sharma@iitb.ac.in', 'iitb.ac.in', TRUE, 'Priya Sharma', '22222222-0000-0000-0000-000000000002', 'Hostel 12 - Wing B', 2026, 'student', 25),
('44444444-0000-0000-0000-000000000004', 'marcus.v@stanford.edu', 'stanford.edu', TRUE, 'Marcus Vance', '22222222-0000-0000-0000-000000000003', 'Roble Hall', 2024, 'student', 40),
('44444444-0000-0000-0000-000000000005', 'unverified.user@gmail.com', 'gmail.com', FALSE, 'Guest User', NULL, NULL, NULL, 'student', NULL)
ON CONFLICT (id) DO NOTHING;

-- 5. Demo Listings
INSERT INTO listings (id, seller_id, campus_id, category_id, title, description, price, is_free, condition, location_note, status, expires_at) VALUES
(
    '55555555-0000-0000-0000-000000000001',
    '44444444-0000-0000-0000-000000000002',
    '22222222-0000-0000-0000-000000000001',
    '33333333-0000-0000-0000-000000000001',
    'TI-84 Plus CE Color Graphing Calculator',
    'Used for AP Calculus and Linear Algebra. Pristine condition with charging cable and sliding hard case. Battery holds charge for weeks.',
    45.00,
    FALSE,
    'like_new',
    'Barker Engineering Library Lobby',
    'active',
    NOW() + INTERVAL '28 days'
),
(
    '55555555-0000-0000-0000-000000000002',
    '44444444-0000-0000-0000-000000000002',
    '22222222-0000-0000-0000-000000000001',
    '33333333-0000-0000-0000-000000000003',
    'Instant Pot Electric Kettle (1.7L, Auto-Shutoff)',
    'Stainless steel electric kettle, perfect for late night tea or cup noodles in dorm room. Clean and fully functional.',
    12.00,
    FALSE,
    'good',
    'Next House Dining Hall Entrance',
    'active',
    NOW() + INTERVAL '25 days'
),
(
    '55555555-0000-0000-0000-000000000003',
    '44444444-0000-0000-0000-000000000003',
    '22222222-0000-0000-0000-000000000002',
    '33333333-0000-0000-0000-000000000001',
    'Arduino Uno Rev3 Starter Kit with Breadboard & 30+ Sensors',
    'Complete CS/EE project starter kit. Comes in transparent organizer box with resistors, LEDs, ultrasonic distance sensor, and servo motors.',
    22.00,
    FALSE,
    'like_new',
    'Central Library Ground Floor',
    'active',
    NOW() + INTERVAL '29 days'
),
(
    '55555555-0000-0000-0000-000000000004',
    '44444444-0000-0000-0000-000000000003',
    '22222222-0000-0000-0000-000000000002',
    '33333333-0000-0000-0000-000000000005',
    'Thomas Calculus 14th Edition + Physics Lab Coat (Size M)',
    'Passing on course materials from freshman year! Book has some pencil highlights. Lab coat is washed and sanitized.',
    0.00,
    TRUE,
    'good',
    'Hostel 12 Quadrangle',
    'active',
    NOW() + INTERVAL '27 days'
),
(
    '55555555-0000-0000-0000-000000000005',
    '44444444-0000-0000-0000-000000000004',
    '22222222-0000-0000-0000-000000000003',
    '33333333-0000-0000-0000-000000000004',
    'Adjustable Ergonomic Mesh Study Chair',
    'High-back breathable mesh desk chair with lumbar support. Moving out at end of quarter so need it picked up quickly.',
    35.00,
    FALSE,
    'good',
    'Tressider Student Union Patio',
    'active',
    NOW() + INTERVAL '20 days'
),
(
    '55555555-0000-0000-0000-000000000006',
    '44444444-0000-0000-0000-000000000004',
    '22222222-0000-0000-0000-000000000002',
    '33333333-0000-0000-0000-000000000002',
    'JetBrains All-Products Pack 1-Year Educational Share Seat',
    'Surplus team developer license for IntelliJ, PyCharm, WebStorm. Valid until graduation.',
    15.00,
    FALSE,
    'brand_new',
    'Gates Computer Science Building Cafe',
    'active',
    NOW() + INTERVAL '30 days'
)
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Listing Images
INSERT INTO listing_images (id, listing_id, image_url, sort_order) VALUES
('66666666-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80', 0),
('66666666-0000-0000-0000-000000000002', '55555555-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=800&q=80', 0),
('66666666-0000-0000-0000-000000000003', '55555555-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1553406830-ef2513450d76?auto=format&fit=crop&w=800&q=80', 0),
('66666666-0000-0000-0000-000000000004', '55555555-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80', 0),
('66666666-0000-0000-0000-000000000005', '55555555-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1580481077195-c3a821a506cb?auto=format&fit=crop&w=800&q=80', 0),
('66666666-0000-0000-0000-000000000006', '55555555-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80', 0)
ON CONFLICT (id) DO NOTHING;

-- 7. Insert Wanted Posts
INSERT INTO wanted_posts (id, user_id, campus_id, category_id, title, description, budget_max, status) VALUES
(
    '77777777-0000-0000-0000-000000000001',
    '44444444-0000-0000-0000-000000000003',
    '22222222-0000-0000-0000-000000000002',
    '33333333-0000-0000-0000-000000000001',
    'Looking for Dell or Lenovo 65W USB-C Laptop Charger',
    'Left my laptop charger at home during fall break. Need a spare compatible with ThinkPad / XPS.',
    20.00,
    'open'
),
(
    '77777777-0000-0000-0000-000000000002',
    '44444444-0000-0000-0000-000000000002',
    '22222222-0000-0000-0000-000000000001',
    '33333333-0000-0000-0000-000000000005',
    'CS 106B Reader & Algorithms Textbook by Cormen (CLRS)',
    'Willing to buy or borrow for Spring semester. Hardcover or softcover both okay.',
    30.00,
    'open'
)
ON CONFLICT (id) DO NOTHING;
