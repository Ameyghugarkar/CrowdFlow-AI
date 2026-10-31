"""
CrowdFlow AI - Account Service Package
Configures Flask application with Talisman security headers and CORS policies.
"""
from flask import Flask
from flask_talisman import Talisman
from flask_cors import CORS

# ── Content Security Policy ────────────────────────────────────────────────
CONTENT_SECURITY_POLICY = {
    "default-src": "'self'",
    "script-src": [
        "'self'",
        "'unsafe-inline'",
    ],
    "style-src": [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
    ],
    "font-src": [
        "'self'",
        "https://fonts.gstatic.com",
    ],
    "img-src": [
        "'self'",
        "data:",
    ],
    "connect-src": "'self'",
    "frame-ancestors": "'none'",
}


def create_app():
    """Application factory that wires up security headers and CORS."""
    app = Flask(__name__)

    # ── CORS Policy ───────────────────────────────────────────────────────
    # Allow only trusted origins; credentials are NOT exposed by default.
    CORS(
        app,
        resources={r"/accounts/*": {"origins": "*"}},
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
        expose_headers=["X-Total-Count"],
        max_age=600,
    )

    # ── Talisman Security Headers ─────────────────────────────────────────
    Talisman(
        app,
        force_https=False,                      # set True in production
        strict_transport_security=True,
        strict_transport_security_max_age=31536000,
        strict_transport_security_include_subdomains=True,
        strict_transport_security_preload=True,
        content_security_policy=CONTENT_SECURITY_POLICY,
        content_security_policy_nonce_in=["script-src"],
        referrer_policy="strict-origin-when-cross-origin",
        feature_policy={
            "geolocation": "'none'",
            "microphone": "'none'",
            "camera": "'none'",
        },
        frame_options="DENY",
        frame_options_allow_from=None,
        session_cookie_secure=False,            # set True in production
        session_cookie_http_only=True,
        session_cookie_samesite="Lax",
        x_content_type_options=True,
        x_xss_protection=True,
    )

    # ── Register blueprints / routes ──────────────────────────────────────
    from service.app import app as _accounts_app   # noqa: F401 (re-export)

    return app
