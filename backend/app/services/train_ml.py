"""
CampusSwap ML Pipeline: Model Training and Evaluation Script
Categorizes listings into the 5 core campus categories and detects prohibited goods/scams.
"""

from typing import List, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from app.services.ml_service import ml_service, PROHIBITED_PATTERNS

# Expanded Synthetic Dataset for campus student marketplace
EXPANDED_DATA: List[Tuple[str, str]] = [
    # Electronics & Tech
    ("Apple MacBook Air M1 256GB Space Gray 8GB RAM", "electronics-tech"),
    ("Texas Instruments TI-84 Plus Silver Edition graphing calculator with sliding cover", "electronics-tech"),
    ("Arduino Uno starter kit with breadboard, LEDs, resistors, buzzer", "electronics-tech"),
    ("Raspberry Pi 4 Model B 8GB RAM starter kit with 64GB micro SD card", "electronics-tech"),
    ("Dell 24 inch IPS 1080p desktop monitor with HDMI and power cable", "electronics-tech"),
    ("Anker 737 Power Bank 24000mAh 140W fast portable charger", "electronics-tech"),
    ("Logitech MX Mechanical wireless keyboard tactile quiet switches", "electronics-tech"),
    ("Sony WH-1000XM4 noise cancelling wireless Bluetooth headphones", "electronics-tech"),
    ("USB-C Hub multi-port adapter with 4K HDMI, USB 3.0, SD card reader", "electronics-tech"),
    ("Casio FX-991CW scientific calculator for engineering and calculus", "electronics-tech"),
    ("Breadboards, jumper wires, sensors, and resistors pack for EE lab", "electronics-tech"),
    ("Apple Magic Mouse and Magic Keyboard with Lightning cable", "electronics-tech"),
    ("Lenovo ThinkPad 65W USB-C AC wall adapter charger", "electronics-tech"),
    ("iPad 9th Generation 64GB Wi-Fi with Apple Pencil 1st gen", "electronics-tech"),
    ("Crucial 16GB DDR4 3200MHz SODIMM Laptop RAM memory stick", "electronics-tech"),

    # Subscriptions & Software Keys
    ("Shared 2TB Google Drive cloud storage slot on student annual family plan", "subscriptions-keys"),
    ("JetBrains educational developer account license IntelliJ PyCharm WebStorm", "subscriptions-keys"),
    ("Notion Plus student workspace team seat invitation", "subscriptions-keys"),
    ("GitHub Copilot student team license seat valid for 1 year", "subscriptions-keys"),
    ("Spotify Premium Family open membership slot for semester", "subscriptions-keys"),
    ("Adobe Creative Cloud Photography plan shared seat Photoshop Lightroom", "subscriptions-keys"),
    ("ChatGPT Plus team workspace seat split cost with classmates", "subscriptions-keys"),
    ("Grammarly Premium student account access for thesis writing", "subscriptions-keys"),
    ("Overleaf Professional subscription seat with Git integration", "subscriptions-keys"),
    ("NordVPN 1 year student shared license 2 slots available", "subscriptions-keys"),

    # Room & Flat Essentials
    ("Instant Pot Duo 7-in-1 multi-use programmable pressure cooker 6 Qt", "room-essentials"),
    ("Dorm mini fridge with compact freezer door clean working perfectly", "room-essentials"),
    ("Electric kettle 1.7 liter stainless steel with auto shut-off boiling", "room-essentials"),
    ("Portable single burner induction cooktop hot plate for dorm cooking", "room-essentials"),
    ("LED desk lamp with wireless smartphone charging base touch dimmer", "room-essentials"),
    ("Compact 700W microwave oven clean dorm ready with turntable", "room-essentials"),
    ("Clothes garment steamer handheld portable for suits and shirts", "room-essentials"),
    ("Brita water filter pitcher with 2 replacement filter cartridges", "room-essentials"),
    ("Stick vacuum cleaner lightweight bagless for dorm rugs and hardwood", "room-essentials"),
    ("Desk fan personal quiet oscillating fan with 3 speeds", "room-essentials"),

    # Furniture
    ("IKEA Linnmon white study desk table with adjustable height legs", "furniture"),
    ("Ergonomic breathable mesh office chair with lumbar back support", "furniture"),
    ("Heavy duty metal clothes hanging garment rack on wheels", "furniture"),
    ("Twin XL memory foam mattress topper cooling gel 3 inch", "furniture"),
    ("Plastic 3-tier rolling storage cart organizer bins with drawers", "furniture"),
    ("Wooden nightstand bedside table with storage drawer and shelf", "furniture"),
    ("Foldable compact student study desk chair set for dorm rooms", "furniture"),
    ("Shoe rack organizer 4 tiers stackable entryway storage", "furniture"),
    ("Full length standing mirror with jewelry storage cabinet", "furniture"),
    ("Bean bag chair cozy memory foam reading lounger", "furniture"),

    # Academics & Books
    ("Thomas Calculus 14th edition early transcendentals hardcover textbook", "academics-books"),
    ("Introduction to Algorithms 4th edition by Cormen Leiserson Rivest (CLRS)", "academics-books"),
    ("Organic Chemistry 9th edition Wade solutions manual study guide", "academics-books"),
    ("Halliday Resnick Fundamentals of Physics 11th edition textbook", "academics-books"),
    ("White 100% cotton laboratory lab coat size Medium clean washed", "academics-books"),
    ("Engineering drawing drafting board with T-square and compass set", "academics-books"),
    ("Campbell Biology 12th edition hardcover textbook for Bio 101", "academics-books"),
    ("Economics Principles Problems and Policies McConnell Brue textbook", "academics-books"),
    ("Five Star spiral notebooks, binders, pens, and highlighters bundle", "academics-books"),
    ("Molecular model chemistry kit for organic chemistry stereochemistry", "academics-books"),
]

def train_and_evaluate():
    texts = [item[0] for item in EXPANDED_DATA]
    labels = [item[1] for item in EXPANDED_DATA]

    X_train, X_test, y_train, y_test = train_test_split(
        texts, labels, test_size=0.25, random_state=42, stratify=labels
    )

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), stop_words="english")),
        ("clf", LogisticRegression(C=1.0, max_iter=200))
    ])

    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)

    acc = accuracy_score(y_test, y_pred)
    print(f"=== Category Classifier Evaluation ===")
    print(f"Accuracy: {acc * 100:.2f}%\n")
    print(classification_report(y_test, y_pred))

    # Test Content Moderation & Spam Detection
    print("\n=== Spam / Prohibited Goods Moderation Evaluation ===")
    test_cases = [
        ("TI-84 Graphing calculator with case", "Good condition used in math", False),
        ("Airsoft assault rifle gun and tactical knife", "Meet off campus cash or wire transfer", True),
        ("Adderall and study prescription pills", "Text me for fast study drugs", True),
        ("Pirated cracked Adobe Photoshop serial key", "Nulled keygen torrent download link", True),
        ("IKEA desk chair", "Pay me upfront via Western Union and I will courier it", True),
        ("Calculus textbook", "Passing down my calculus reader", False),
    ]

    for title, desc, expected_flag in test_cases:
        is_prohibited, score, reason = ml_service.check_content(title, desc)
        status_str = "FLAGGED" if is_prohibited else "CLEAN"
        expected_str = "FLAGGED" if expected_flag else "CLEAN"
        match = (is_prohibited == expected_flag)
        print(f"[{'PASS' if match else 'FAIL'}] '{title[:30]}...' -> {status_str} (Score: {score}) - Reason: {reason or 'None'}")

if __name__ == "__main__":
    train_and_evaluate()
