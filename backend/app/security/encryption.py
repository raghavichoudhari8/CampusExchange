import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.config import settings

def _get_aesgcm() -> AESGCM:
    key_bytes = settings.get_encryption_key_bytes()
    return AESGCM(key_bytes)

def encrypt_contact(plaintext: str) -> str:
    """
    Encrypts sensitive contact info (phone number, personal email, UPI ID)
    using AES-256-GCM with a randomly generated 12-byte nonce.
    Returns base64-encoded string containing (nonce + ciphertext + tag).
    """
    if not plaintext:
        return ""
    aesgcm = _get_aesgcm()
    nonce = os.urandom(12) # 96-bit nonce standard for GCM
    data = plaintext.encode("utf-8")
    ciphertext = aesgcm.encrypt(nonce, data, None)
    payload = nonce + ciphertext
    return base64.b64encode(payload).decode("utf-8")

def decrypt_contact(encrypted_b64: str) -> str:
    """
    Decrypts AES-256-GCM contact info.
    Splits the 12-byte nonce and ciphertext, verifies the GCM authentication tag,
    and returns the original plaintext.
    Raises ValueError on tampering or invalid key.
    """
    if not encrypted_b64:
        return ""
    try:
        payload = base64.b64decode(encrypted_b64.encode("utf-8"))
        if len(payload) < 28: # 12 bytes nonce + 16 bytes tag minimum
            raise ValueError("Encrypted contact payload too short")
        nonce = payload[:12]
        ciphertext = payload[12:]
        aesgcm = _get_aesgcm()
        decrypted_bytes = aesgcm.decrypt(nonce, ciphertext, None)
        return decrypted_bytes.decode("utf-8")
    except Exception as e:
        raise ValueError(f"Failed to decrypt contact information: {str(e)}")
