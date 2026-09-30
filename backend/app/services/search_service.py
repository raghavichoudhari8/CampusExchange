import httpx
from typing import List, Dict, Any
from app.config import settings

class SearchService:
    def __init__(self):
        self.meili_url = settings.MEILISEARCH_URL.rstrip('/')
        self.master_key = settings.MEILISEARCH_MASTER_KEY
        self.index_name = "campusswap_listings"

    async def index_listing(self, listing: Dict[str, Any]):
        """
        Syncs listing to search index.
        PRIVACY GUARANTEE: ONLY public fields are indexed.
        Sensitive contact info (phone, email, UPI) is NEVER passed to search!
        """
        public_doc = {
            "id": listing["id"],
            "title": listing["title"],
            "description": listing["description"],
            "category_id": listing["category_id"],
            "campus_id": listing["campus_id"],
            "price": float(listing.get("price") or 0.0),
            "is_free": bool(listing.get("is_free", False)),
            "condition": listing["condition"],
            "location_note": listing.get("location_note", ""),
            "status": listing["status"],
            "created_at": listing["created_at"],
        }
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                headers = {"Authorization": f"Bearer {self.master_key}"}
                await client.post(
                    f"{self.meili_url}/indexes/{self.index_name}/documents",
                    headers=headers,
                    json=[public_doc]
                )
        except Exception:
            # Fallback gracefully if Meilisearch service is offline
            pass

    async def search(self, query_str: str, candidate_listings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Searches listings. Attempts Meilisearch query first;
        if unavailable, uses intelligent tokenized in-memory fallback.
        """
        if not query_str.strip():
            return candidate_listings

        query_lower = query_str.lower().strip()
        tokens = query_lower.split()

        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                headers = {"Authorization": f"Bearer {self.master_key}"}
                res = await client.post(
                    f"{self.meili_url}/indexes/{self.index_name}/search",
                    headers=headers,
                    json={"q": query_str, "filter": "status = 'active'"}
                )
                if res.status_code == 200:
                    hits = res.json().get("hits", [])
                    hit_ids = {h["id"] for h in hits}
                    if hit_ids:
                        return [l for l in candidate_listings if l["id"] in hit_ids]
        except Exception:
            pass

        # Intelligent Fallback: match tokens in title, description, location_note
        def score_listing(l: Dict[str, Any]) -> int:
            text = f"{l['title']} {l['description']} {l.get('location_note', '')}".lower()
            score = 0
            if query_lower in text:
                score += 10
            for t in tokens:
                if t in text:
                    score += 2
            return score

        matched = [l for l in candidate_listings if score_listing(l) > 0]
        matched.sort(key=score_listing, reverse=True)
        return matched

search_service = SearchService()
