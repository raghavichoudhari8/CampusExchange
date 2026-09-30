from typing import List, Optional
import resend
from app.config import settings

class EmailService:
    def __init__(self):
        self.api_key = settings.RESEND_API_KEY
        self.from_email = settings.RESEND_FROM_EMAIL
        if self.api_key and not self.api_key.startswith("re_test") and not self.api_key.startswith("re_placeholder"):
            resend.api_key = self.api_key

    def _send_or_log(self, to_email: str, subject: str, html_body: str):
        if self.api_key and not self.api_key.startswith("re_test") and not self.api_key.startswith("re_placeholder"):
            try:
                resend.Emails.send({
                    "from": self.from_email,
                    "to": to_email,
                    "subject": subject,
                    "html": html_body,
                })
                return
            except Exception as e:
                print(f"[EmailService Error] Resend dispatch failed: {e}")

        # Local Dry-Run Mode Preview (Graceful Developer Fallback)
        print(f"\n=======================================================")
        print(f"[TRANSACTIONAL EMAIL DISPATCH - RESEND DRY-RUN]")
        print(f"TO: {to_email}")
        print(f"FROM: {self.from_email}")
        print(f"SUBJECT: {subject}")
        print(f"-------------------------------------------------------")
        print(f"{html_body[:300]}...")
        print(f"=======================================================\n")

    def notify_seller_new_request(
        self,
        seller_email: str,
        seller_name: str,
        buyer_name: str,
        buyer_campus: str,
        buyer_badges: List[str],
        listing_title: str,
        message: Optional[str]
    ):
        subject = f"CampusSwap: New Contact Request for '{listing_title}'"
        badges_str = ", ".join(buyer_badges) if buyer_badges else "Verified Student"
        note_str = f"<p><strong>Message from buyer:</strong> <em>\"{message}\"</em></p>" if message else ""
        html = f"""
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
            <h2 style="color: #4f46e5;">New Student Contact Request</h2>
            <p>Hi {seller_name},</p>
            <p>A fellow student has requested your contact information for your listing <strong>"{listing_title}"</strong>:</p>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
                <p style="margin: 0 0 5px 0;"><strong>Buyer:</strong> {buyer_name}</p>
                <p style="margin: 0 0 5px 0;"><strong>Campus:</strong> {buyer_campus}</p>
                <p style="margin: 0 0 5px 0;"><strong>Trust Badges:</strong> {badges_str}</p>
                {note_str}
            </div>
            <p style="margin-top: 15px;">Your personal contact info will <strong>only</strong> be revealed to them if you accept their request.</p>
            <p>Log in to your CampusSwap Dashboard to Accept or Decline this request.</p>
            <p style="color: #64748b; font-size: 12px; margin-top: 25px;">CampusSwap — Privacy-first campus peer-to-peer exchange.</p>
        </div>
        """
        self._send_or_log(seller_email, subject, html)

    def notify_buyer_request_approved(
        self,
        buyer_email: str,
        buyer_name: str,
        seller_name: str,
        listing_title: str,
        contact_type: str,
        contact_value: str,
        preferred_note: Optional[str]
    ):
        subject = f"CampusSwap: Request Approved! Contact info for '{listing_title}'"
        note_str = f"<p><em>Note from seller: \"{preferred_note}\"</em></p>" if preferred_note else ""
        html = f"""
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
            <h2 style="color: #059669;">Contact Request Approved!</h2>
            <p>Hi {buyer_name},</p>
            <p>Good news! {seller_name} has accepted your request for <strong>"{listing_title}"</strong>.</p>
            <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; border: 1px solid #a7f3d0;">
                <p style="margin: 0 0 5px 0;"><strong>{contact_type.upper()}:</strong> <span style="font-size: 16px; font-weight: bold; color: #065f46;">{contact_value}</span></p>
                {note_str}
            </div>
            <p style="margin-top: 15px; font-size: 13px; color: #4b5563;">
                <strong>Safety Reminder:</strong> Always meet in a public campus venue (such as the campus library or student union) and verify the item in person before paying.
            </p>
            <p style="color: #64748b; font-size: 12px; margin-top: 25px;">CampusSwap Platform</p>
        </div>
        """
        self._send_or_log(buyer_email, subject, html)

    def notify_buyer_request_declined(self, buyer_email: str, buyer_name: str, listing_title: str):
        subject = f"CampusSwap: Update regarding your request for '{listing_title}'"
        html = f"""
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
            <p>Hi {buyer_name},</p>
            <p>The seller was unable to accept your contact request for <strong>"{listing_title}"</strong> at this time. This usually happens if the item was reserved or already picked up by another student.</p>
            <p style="color: #64748b; font-size: 12px; margin-top: 25px;">CampusSwap Platform</p>
        </div>
        """
        self._send_or_log(buyer_email, subject, html)

    def notify_listing_expiry(self, seller_email: str, seller_name: str, listing_title: str, days_left: int):
        subject = f"CampusSwap Reminder: Your listing '{listing_title}' expires in {days_left} days"
        html = f"""
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
            <p>Hi {seller_name},</p>
            <p>Your listing <strong>"{listing_title}"</strong> is scheduled to expire in {days_left} days. If this item is still available, visit your dashboard and click <strong>Renew Listing</strong> to keep it active for another 30 days.</p>
            <p style="color: #64748b; font-size: 12px; margin-top: 25px;">CampusSwap Platform</p>
        </div>
        """
        self._send_or_log(seller_email, subject, html)

email_service = EmailService()
