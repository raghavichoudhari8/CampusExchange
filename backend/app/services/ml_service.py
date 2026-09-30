import re
from typing import Tuple, Dict, Any, List, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from app.database import db

# Prohibited keywords and off-platform scam patterns
PROHIBITED_PATTERNS = [
    (r"\b(weapon|gun|pistol|firearm|ammo|knife|knives|sword|explosive)\b", "Weapons or hazardous materials are strictly prohibited"),
    (r"\b(drugs|cocaine|weed|marijuana|adderall|prescription|pills|vape|nicotine)\b", "Controlled substances or prescription drugs prohibited"),
    (r"\b(pirated|crack|keygen|warez|torrent|nulled)\b", "Pirated or unauthorized software keys are prohibited"),
    (r"\b(wire transfer|western union|crypto|bitcoin|usdt|eth|gift card|zelle upfront|paypal friends and family)\b", "Off-platform payment solicitation or advance fee scam detected"),
    (r"\b(bank transfer upfront|ship it to|courier payment|telegram me at)\b", "Suspicious shipping or advance payment solicitation"),
]

# Baseline training data for the 5 campus categories
SYNTHETIC_DATA = [
    # Electronics & Tech
    ("MacBook Pro M2 16GB RAM 512GB SSD with charger", "electronics-tech"),
    ("Texas Instruments TI-84 Plus CE Graphing Calculator color screen", "electronics-tech"),
    ("Arduino Uno R3 starter kit with breadboard LEDs jumper wires", "electronics-tech"),
    ("Dell 27 inch 4K Monitor IPS USB-C HDMI display", "electronics-tech"),
    ("Logitech MX Master 3S wireless mouse Bluetooth", "electronics-tech"),
    ("Raspberry Pi 4 Model B 4GB with official power supply", "electronics-tech"),
    ("Anker 65W GaN USB-C fast wall charger cable", "electronics-tech"),
    ("Breadboard resistor capacitor jumper wire component pack", "electronics-tech"),
    ("HP Pavilion gaming laptop GTX 1650 16GB RAM", "electronics-tech"),
    ("Casio FX-991EX ClassWiz scientific calculator engineering", "electronics-tech"),

    # Subscriptions & Software Keys
    ("JetBrains educational account team license IntelliJ PyCharm", "subscriptions-keys"),
    ("Shared cloud storage 2TB Google Drive OneDrive slot", "subscriptions-keys"),
    ("GitHub Copilot student team license seat subscription", "subscriptions-keys"),
    ("ChatGPT Plus team workspace seat shared invite", "subscriptions-keys"),
    ("Spotify student family premium plan open slot", "subscriptions-keys"),
    ("Adobe Creative Cloud all apps student subscription seat", "subscriptions-keys"),
    ("Notion Plus workspace student member slot", "subscriptions-keys"),
    ("Grammarly Premium shared annual student plan", "subscriptions-keys"),

    # Room & Flat Essentials
    ("Instant Pot Duo 7-in-1 electric pressure cooker 6 quart", "room-essentials"),
    ("Dorm mini fridge with freezer compartment clean working", "room-essentials"),
    ("Electric kettle 1.7 liter stainless steel auto shutoff", "room-essentials"),
    ("Induction cooktop portable hot plate for dorm room", "room-essentials"),
    ("LED desk lamp with wireless charging base and touch control", "room-essentials"),
    ("Mini microwave oven 700W clean dorm ready", "room-essentials"),
    ("Handheld clothes steamer iron compact travel", "room-essentials"),
    ("Dorm vacuum cleaner lightweight stick vacuum cleaner", "room-essentials"),

    # Furniture
    ("IKEA Linnmon study desk table white with adjustable legs", "furniture"),
    ("Ergonomic office chair with lumbar support mesh high back", "furniture"),
    ("Clothes hanging rack heavy duty metal on wheels", "furniture"),
    ("Twin XL memory foam mattress topper 3 inch cooling gel", "furniture"),
    ("Plastic 3-drawer storage rolling cart organizer bin", "furniture"),
    ("Wooden bedside nightstand table with storage drawer", "furniture"),
    ("Foldable study desk chair compact dorm apartment", "furniture"),
    ("Shoe rack 4-tier stackable entryway organizer", "furniture"),

    # Academics & Books
    ("Thomas Calculus early transcendentals 14th edition textbook", "academics-books"),
    ("Introduction to Algorithms CLRS 3rd edition Cormen Leiserson", "academics-books"),
    ("Organic Chemistry 8th edition textbook study guide solutions", "academics-books"),
    ("Physics for Scientists and Engineers Serway Jewett book", "academics-books"),
    ("White laboratory lab coat size medium 100% cotton washed", "academics-books"),
    ("Engineering drawing board with T-square and drafting kit", "academics-books"),
    ("Campbell Biology 11th edition hardcover textbook", "academics-books"),
    ("Microeconomics and Macroeconomics course reader spiral bound", "academics-books"),
]

class MLService:
    def __init__(self):
        self.pipeline: Optional[Pipeline] = None
        self._train_model()

    def _train_model(self):
        """Trains a baseline TF-IDF + MultinomialNB model on synthetic campus listings."""
        try:
            texts = [item[0] for item in SYNTHETIC_DATA]
            labels = [item[1] for item in SYNTHETIC_DATA]

            self.pipeline = Pipeline([
                ("tfidf", TfidfVectorizer(ngram_range=(1, 2), stop_words="english", lowercase=True)),
                ("clf", MultinomialNB(alpha=0.1))
            ])
            self.pipeline.fit(texts, labels)
        except Exception as e:
            print("Failed to train ML model:", e)
            self.pipeline = None

    def check_content(self, title: str, description: str) -> Tuple[bool, float, Optional[str]]:
        """
        Scans title and description for prohibited goods, weapons, drugs, and advance-payment scams.
        Returns: (is_prohibited, spam_score, reason)
        """
        combined = f"{title} {description}".lower()
        
        # 1. Regex rule checks for high-severity prohibited content
        for pattern, reason in PROHIBITED_PATTERNS:
            if re.search(pattern, combined, re.IGNORECASE):
                return True, 0.95, reason

        # 2. Heuristic scoring for spam indicators
        spam_score = 0.02
        if "http://" in combined or "https://" in combined or "bit.ly" in combined:
            spam_score += 0.35
        if re.search(r"\b(call me|text me|whatsapp me at \+?\d{8,})\b", combined):
            # Attempt to bypass private contact flow directly in public description
            spam_score += 0.40
        if combined.count("$") > 4 or combined.count("free") > 3:
            spam_score += 0.15

        is_prohibited = spam_score >= 0.70
        reason = "Potential policy violation or external link detected" if is_prohibited else None
        return is_prohibited, min(round(spam_score, 2), 1.0), reason

    def predict_category(self, title: str, description: str) -> Dict[str, Any]:
        """
        Predicts category based on title and description.
        Returns matched category_id, category_name, and confidence.
        """
        text = f"{title} {description}".strip()
        if not self.pipeline or not text:
            default_cat = db.categories[0]
            return {
                "category_id": default_cat["id"],
                "category_name": default_cat["name"],
                "confidence": 0.5
            }

        try:
            predicted_slug = self.pipeline.predict([text])[0]
            probs = self.pipeline.predict_proba([text])[0]
            max_prob = float(max(probs))

            matched_cat = next((c for c in db.categories if c["slug"] == predicted_slug), None)
            if not matched_cat:
                matched_cat = db.categories[0]

            return {
                "category_id": matched_cat["id"],
                "category_name": matched_cat["name"],
                "confidence": round(max_prob, 2)
            }
        except Exception:
            default_cat = db.categories[0]
            return {
                "category_id": default_cat["id"],
                "category_name": default_cat["name"],
                "confidence": 0.5
            }

ml_service = MLService()
