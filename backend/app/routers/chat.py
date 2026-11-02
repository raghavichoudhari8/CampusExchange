from datetime import datetime, timezone
import uuid
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
import httpx

from app.config import settings
from app.database import db
from app.schemas.chat import (
    ConversationStart,
    ConversationResponse,
    ConversationListing,
    ConversationParticipant,
    MessageSend,
    MessageResponse,
)
from app.security.auth import get_current_user
from app.services.websocket_manager import ws_manager

router = APIRouter(prefix="/api/v1/chat", tags=["In-App Chat"])

def _sync_conversations_from_supabase(user_id: str):
    """Syncs user's conversations and messages from Supabase cloud storage."""
    if not (settings.SUPABASE_URL and settings.SUPABASE_KEY):
        return

    try:
        headers = {
            "apikey": settings.SUPABASE_KEY,
            "Authorization": f"Bearer {settings.SUPABASE_KEY}"
        }
        base = settings.SUPABASE_URL.rstrip('/')
        with httpx.Client(timeout=3.0) as client:
            # Sync conversation records
            res = client.get(
                f"{base}/rest/v1/audit_logs?action=eq.conversation_created&select=*",
                headers=headers
            )
            if res.status_code == 200:
                existing_ids = {c["id"] for c in db.conversations}
                for item in res.json():
                    details = item.get("details", {})
                    conv_id = details.get("conversation_id") or str(item.get("target_id"))
                    if conv_id and conv_id not in existing_ids:
                        db.conversations.append({
                            "id": conv_id,
                            "listing_id": details.get("listing_id"),
                            "buyer_id": details.get("buyer_id"),
                            "seller_id": details.get("seller_id"),
                            "created_at": details.get("created_at", item.get("created_at")),
                            "updated_at": details.get("updated_at", item.get("created_at")),
                        })
                        existing_ids.add(conv_id)
    except Exception:
        pass

def _sync_messages_for_conversation(conv_id: str):
    """Syncs messages for a specific conversation from Supabase."""
    if not (settings.SUPABASE_URL and settings.SUPABASE_KEY):
        return

    try:
        headers = {
            "apikey": settings.SUPABASE_KEY,
            "Authorization": f"Bearer {settings.SUPABASE_KEY}"
        }
        base = settings.SUPABASE_URL.rstrip('/')
        with httpx.Client(timeout=3.0) as client:
            res = client.get(
                f"{base}/rest/v1/audit_logs?action=eq.chat_message&target_id=eq.{conv_id}&select=*&order=created_at.asc",
                headers=headers
            )
            if res.status_code == 200:
                existing_msg_ids = {m["id"] for m in db.chat_messages}
                for item in res.json():
                    details = item.get("details", {})
                    msg_id = details.get("message_id") or str(item.get("id"))
                    if msg_id not in existing_msg_ids:
                        db.chat_messages.append({
                            "id": msg_id,
                            "conversation_id": conv_id,
                            "sender_id": details.get("sender_id"),
                            "sender_name": details.get("sender_name", "Student"),
                            "recipient_id": details.get("recipient_id"),
                            "content": details.get("content", ""),
                            "created_at": details.get("created_at", item.get("created_at")),
                            "is_read": details.get("is_read", False),
                        })
                        existing_msg_ids.add(msg_id)
    except Exception:
        pass

def _format_conversation(conv: Dict[str, Any], caller: Dict[str, Any]) -> ConversationResponse:
    # 1. Listing details
    listing = next((l for l in db.listings if l["id"] == conv["listing_id"]), None)
    if not listing and settings.SUPABASE_URL and settings.SUPABASE_KEY:
        try:
            with httpx.Client(timeout=2.0) as client:
                res = client.get(
                    f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1/listings?id=eq.{conv['listing_id']}&select=*",
                    headers={"apikey": settings.SUPABASE_KEY, "Authorization": f"Bearer {settings.SUPABASE_KEY}"}
                )
                if res.status_code == 200 and res.json():
                    listing = res.json()[0]
                    db.listings.append(listing)
        except Exception:
            pass

    # Listing image
    img = next((img["image_url"] for img in db.listing_images if img["listing_id"] == conv["listing_id"]), None)
    
    listing_model = ConversationListing(
        id=conv["listing_id"],
        title=listing["title"] if listing else "Campus Item",
        price=float(listing.get("price") or 0.0) if listing else 0.0,
        is_free=bool(listing.get("is_free", False)) if listing else False,
        image=img,
        status=listing.get("status", "active") if listing else "active",
        location_note=listing.get("location_note") if listing else None,
    )

    # 2. Other user
    other_user_id = conv["seller_id"] if caller["id"] == conv["buyer_id"] else conv["buyer_id"]
    other_profile = next((p for p in db.profiles if p["id"] == other_user_id), None)
    if not other_profile and settings.SUPABASE_URL and settings.SUPABASE_KEY:
        try:
            with httpx.Client(timeout=2.0) as client:
                res = client.get(
                    f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1/profiles?id=eq.{other_user_id}&select=*",
                    headers={"apikey": settings.SUPABASE_KEY, "Authorization": f"Bearer {settings.SUPABASE_KEY}"}
                )
                if res.status_code == 200 and res.json():
                    other_profile = res.json()[0]
                    db.profiles.append(other_profile)
        except Exception:
            pass

    campus = next((c for c in db.campuses if other_profile and c["id"] == other_profile.get("campus_id")), None)
    campus_name = campus["name"] if campus else "PICT"

    participant_model = ConversationParticipant(
        id=other_user_id,
        display_name=other_profile.get("display_name", "Student") if other_profile else "Campus Peer",
        is_verified=bool(other_profile.get("is_verified", False)) if other_profile else False,
        campus_name=campus_name,
    )

    # 3. Last message & unread count
    conv_msgs = [m for m in db.chat_messages if m["conversation_id"] == conv["id"]]
    conv_msgs.sort(key=lambda m: m["created_at"])
    last_msg = conv_msgs[-1] if conv_msgs else None
    unread_count = len([m for m in conv_msgs if m["recipient_id"] == caller["id"] and not m.get("is_read", False)])

    last_msg_model = MessageResponse(
        id=last_msg["id"],
        conversation_id=last_msg["conversation_id"],
        sender_id=last_msg["sender_id"],
        sender_name=last_msg["sender_name"],
        recipient_id=last_msg["recipient_id"],
        content=last_msg["content"],
        created_at=last_msg["created_at"],
        is_read=last_msg.get("is_read", False),
    ) if last_msg else None

    return ConversationResponse(
        id=conv["id"],
        listing=listing_model,
        other_user=participant_model,
        last_message=last_msg_model,
        unread_count=unread_count,
        created_at=conv["created_at"],
        updated_at=conv["updated_at"],
    )

@router.post("/conversations", response_model=ConversationResponse)
async def start_conversation(
    payload: ConversationStart,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Starts or opens an in-app chat between buyer and seller regarding a listing.
    """
    now = datetime.now(timezone.utc)
    
    # 1. Fetch listing
    listing = next((l for l in db.listings if l["id"] == payload.listing_id), None)
    if not listing and settings.SUPABASE_URL and settings.SUPABASE_KEY:
        try:
            with httpx.Client(timeout=3.0) as client:
                res = client.get(
                    f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1/listings?id=eq.{payload.listing_id}&select=*",
                    headers={"apikey": settings.SUPABASE_KEY, "Authorization": f"Bearer {settings.SUPABASE_KEY}"}
                )
                if res.status_code == 200 and res.json():
                    listing = res.json()[0]
                    db.listings.append(listing)
        except Exception:
            pass

    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    seller_id = listing.get("seller_id") or listing.get("user_id")
    if not seller_id:
        raise HTTPException(status_code=400, detail="Listing does not have an assigned seller")

    buyer_id = current_user["id"]

    if seller_id == buyer_id:
        raise HTTPException(status_code=400, detail="You cannot start a chat for your own listing")

    _sync_conversations_from_supabase(buyer_id)

    # 2. Check existing conversation for this listing and buyer
    conv = next((c for c in db.conversations if c["listing_id"] == payload.listing_id and c["buyer_id"] == buyer_id), None)
    if not conv:
        conv_id = str(uuid.uuid4())
        conv = {
            "id": conv_id,
            "listing_id": payload.listing_id,
            "buyer_id": buyer_id,
            "seller_id": seller_id,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }
        db.conversations.insert(0, conv)

        # Persist conversation to Supabase cloud audit_logs
        if settings.SUPABASE_URL and settings.SUPABASE_KEY:
            try:
                with httpx.Client(timeout=3.0) as client:
                    client.post(
                        f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1/audit_logs",
                        headers={
                            "apikey": settings.SUPABASE_KEY,
                            "Authorization": f"Bearer {settings.SUPABASE_KEY}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "id": str(uuid.uuid4()),
                            "action": "conversation_created",
                            "target_type": "conversation",
                            "target_id": conv_id,
                            "details": {
                                "conversation_id": conv_id,
                                "listing_id": payload.listing_id,
                                "buyer_id": buyer_id,
                                "seller_id": seller_id,
                                "created_at": now.isoformat(),
                                "updated_at": now.isoformat()
                            }
                        }
                    )
            except Exception:
                pass

    # 3. Optional initial message
    if payload.initial_message and payload.initial_message.strip():
        msg_id = str(uuid.uuid4())
        content_text = payload.initial_message.strip()
        sender_name = current_user.get("display_name") or "Student"
        msg = {
            "id": msg_id,
            "conversation_id": conv["id"],
            "sender_id": buyer_id,
            "sender_name": sender_name,
            "recipient_id": seller_id,
            "content": content_text,
            "created_at": now.isoformat(),
            "is_read": False
        }
        db.chat_messages.append(msg)
        conv["updated_at"] = now.isoformat()

        # Persist message to Supabase
        if settings.SUPABASE_URL and settings.SUPABASE_KEY:
            try:
                with httpx.Client(timeout=3.0) as client:
                    client.post(
                        f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1/audit_logs",
                        headers={
                            "apikey": settings.SUPABASE_KEY,
                            "Authorization": f"Bearer {settings.SUPABASE_KEY}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "id": str(uuid.uuid4()),
                            "action": "chat_message",
                            "target_type": "conversation",
                            "target_id": conv["id"],
                            "details": {
                                "message_id": msg_id,
                                "conversation_id": conv["id"],
                                "sender_id": buyer_id,
                                "sender_name": sender_name,
                                "recipient_id": seller_id,
                                "content": content_text,
                                "created_at": now.isoformat(),
                                "is_read": False
                            }
                        }
                    )
            except Exception:
                pass

        # Push realtime notification via WebSocket
        await ws_manager.send_personal_event(seller_id, "chat_message", msg)

    return _format_conversation(conv, current_user)

@router.get("/conversations", response_model=List[ConversationResponse])
def get_conversations(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Returns all active in-app chat conversations for the authenticated user.
    """
    user_id = current_user["id"]
    _sync_conversations_from_supabase(user_id)

    user_convs = [
        c for c in db.conversations
        if c["buyer_id"] == user_id or c["seller_id"] == user_id
    ]

    # Pre-sync messages for all user conversations to compute last message and unread count
    for c in user_convs:
        _sync_messages_for_conversation(c["id"])

    user_convs.sort(key=lambda c: c.get("updated_at", c["created_at"]), reverse=True)
    return [_format_conversation(c, current_user) for c in user_convs]

@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
def get_conversation(
    conversation_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Gets conversation details by conversation ID.
    """
    _sync_conversations_from_supabase(current_user["id"])
    conv = next((c for c in db.conversations if c["id"] == conversation_id), None)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if current_user["id"] not in (conv["buyer_id"], conv["seller_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to access this conversation")

    _sync_messages_for_conversation(conversation_id)
    return _format_conversation(conv, current_user)

@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
def get_messages(
    conversation_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Fetches all messages in a conversation and marks incoming messages as read.
    """
    _sync_conversations_from_supabase(current_user["id"])
    conv = next((c for c in db.conversations if c["id"] == conversation_id), None)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if current_user["id"] not in (conv["buyer_id"], conv["seller_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to view these messages")

    _sync_messages_for_conversation(conversation_id)

    msgs = [m for m in db.chat_messages if m["conversation_id"] == conversation_id]
    
    # Mark incoming unread messages as read
    for m in msgs:
        if m["recipient_id"] == current_user["id"]:
            m["is_read"] = True

    msgs.sort(key=lambda m: m["created_at"])
    return [
        MessageResponse(
            id=m["id"],
            conversation_id=m["conversation_id"],
            sender_id=m["sender_id"],
            sender_name=m["sender_name"],
            recipient_id=m["recipient_id"],
            content=m["content"],
            created_at=m["created_at"],
            is_read=m.get("is_read", False)
        )
        for m in msgs
    ]

@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse)
async def send_message(
    conversation_id: str,
    payload: MessageSend,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Sends a message in an existing in-app conversation.
    """
    _sync_conversations_from_supabase(current_user["id"])
    conv = next((c for c in db.conversations if c["id"] == conversation_id), None)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    sender_id = current_user["id"]
    if sender_id not in (conv["buyer_id"], conv["seller_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to send messages in this conversation")

    recipient_id = conv["seller_id"] if sender_id == conv["buyer_id"] else conv["buyer_id"]
    now = datetime.now(timezone.utc)
    msg_id = str(uuid.uuid4())
    sender_name = current_user.get("display_name") or "Student"
    content_text = payload.content.strip()

    new_msg = {
        "id": msg_id,
        "conversation_id": conversation_id,
        "sender_id": sender_id,
        "sender_name": sender_name,
        "recipient_id": recipient_id,
        "content": content_text,
        "created_at": now.isoformat(),
        "is_read": False
    }

    db.chat_messages.append(new_msg)
    conv["updated_at"] = now.isoformat()

    # Persist message in Supabase
    if settings.SUPABASE_URL and settings.SUPABASE_KEY:
        try:
            with httpx.Client(timeout=3.0) as client:
                client.post(
                    f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1/audit_logs",
                    headers={
                        "apikey": settings.SUPABASE_KEY,
                        "Authorization": f"Bearer {settings.SUPABASE_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "id": str(uuid.uuid4()),
                        "action": "chat_message",
                        "target_type": "conversation",
                        "target_id": conversation_id,
                        "details": {
                            "message_id": msg_id,
                            "conversation_id": conversation_id,
                            "sender_id": sender_id,
                            "sender_name": sender_name,
                            "recipient_id": recipient_id,
                            "content": content_text,
                            "created_at": now.isoformat(),
                            "is_read": False
                        }
                    }
                )
        except Exception:
            pass

    # Realtime push via WebSocket
    await ws_manager.send_personal_event(recipient_id, "chat_message", new_msg)

    return MessageResponse(
        id=new_msg["id"],
        conversation_id=new_msg["conversation_id"],
        sender_id=new_msg["sender_id"],
        sender_name=new_msg["sender_name"],
        recipient_id=new_msg["recipient_id"],
        content=new_msg["content"],
        created_at=new_msg["created_at"],
        is_read=False
    )
