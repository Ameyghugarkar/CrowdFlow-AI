"""
CrowdFlow AI - Account Management REST Service
Provides CRUD operations for user accounts
"""
from flask import Flask, jsonify, request, abort

app = Flask(__name__)

# In-memory account store
accounts = {}
next_id = [1]


def make_account(name, email, role="user", active=True):
    """Helper to build an account dict."""
    return {
        "id": next_id[0],
        "name": name,
        "email": email,
        "role": role,
        "active": active,
    }


# ── CREATE ────────────────────────────────────────────────────────────────────
@app.route("/accounts", methods=["POST"])
def create_account():
    """Create a new account."""
    data = request.get_json()
    if not data or "name" not in data or "email" not in data:
        abort(400, description="Missing required fields: name, email")

    account = make_account(
        name=data["name"],
        email=data["email"],
        role=data.get("role", "user"),
        active=data.get("active", True),
    )
    accounts[next_id[0]] = account
    next_id[0] += 1
    return jsonify(account), 201


# ── READ ONE ──────────────────────────────────────────────────────────────────
@app.route("/accounts/<int:account_id>", methods=["GET"])
def read_account(account_id):
    """Return a single account by ID."""
    account = accounts.get(account_id)
    if not account:
        abort(404, description=f"Account {account_id} not found")
    return jsonify(account), 200


# ── LIST ALL ──────────────────────────────────────────────────────────────────
@app.route("/accounts", methods=["GET"])
def list_accounts():
    """Return all accounts."""
    return jsonify(list(accounts.values())), 200


# ── UPDATE ────────────────────────────────────────────────────────────────────
@app.route("/accounts/<int:account_id>", methods=["PUT"])
def update_account(account_id):
    """Update an existing account."""
    account = accounts.get(account_id)
    if not account:
        abort(404, description=f"Account {account_id} not found")
    data = request.get_json()
    account.update({k: v for k, v in data.items() if k != "id"})
    return jsonify(account), 200


# ── DELETE ────────────────────────────────────────────────────────────────────
@app.route("/accounts/<int:account_id>", methods=["DELETE"])
def delete_account(account_id):
    """Delete an account."""
    if account_id not in accounts:
        abort(404, description=f"Account {account_id} not found")
    del accounts[account_id]
    return "", 204


# ── HEALTH ────────────────────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "CrowdFlow AI Account Service"}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
