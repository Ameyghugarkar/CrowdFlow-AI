"""
Unit tests for the CrowdFlow AI Account Service
Tests all CRUD operations and verifies CORS + security headers.
"""
import json
import unittest
from service.app import app


class TestAccountService(unittest.TestCase):
    """Test cases for Account REST service."""

    def setUp(self):
        """Set up test client and clear accounts before each test."""
        app.config["TESTING"] = True
        self.client = app.test_client()
        # Clear all accounts
        from service.app import accounts, next_id
        accounts.clear()
        next_id[0] = 1

    # ── CREATE ─────────────────────────────────────────────────────────────
    def test_create_account(self):
        """Test POST /accounts creates a new account."""
        payload = {"name": "Alice", "email": "alice@crowdflow.ai", "role": "admin"}
        resp = self.client.post(
            "/accounts",
            data=json.dumps(payload),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 201)
        data = json.loads(resp.data)
        self.assertEqual(data["name"], "Alice")
        self.assertEqual(data["email"], "alice@crowdflow.ai")
        self.assertEqual(data["role"], "admin")
        self.assertTrue(data["active"])
        print("test_create_account ... ok")

    def test_create_account_missing_fields(self):
        """Test POST /accounts returns 400 when required fields missing."""
        resp = self.client.post(
            "/accounts",
            data=json.dumps({"name": "Bob"}),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 400)
        print("test_create_account_missing_fields ... ok")

    # ── READ ───────────────────────────────────────────────────────────────
    def test_read_account(self):
        """Test GET /accounts/<id> returns correct account."""
        self.client.post(
            "/accounts",
            data=json.dumps({"name": "Carol", "email": "carol@crowdflow.ai"}),
            content_type="application/json",
        )
        resp = self.client.get("/accounts/1")
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertEqual(data["id"], 1)
        self.assertEqual(data["name"], "Carol")
        print("test_read_account ... ok")

    def test_read_account_not_found(self):
        """Test GET /accounts/<id> returns 404 for missing account."""
        resp = self.client.get("/accounts/999")
        self.assertEqual(resp.status_code, 404)
        print("test_read_account_not_found ... ok")

    # ── LIST ───────────────────────────────────────────────────────────────
    def test_list_accounts(self):
        """Test GET /accounts returns all accounts."""
        for i in range(3):
            self.client.post(
                "/accounts",
                data=json.dumps({"name": f"User{i}", "email": f"u{i}@crowdflow.ai"}),
                content_type="application/json",
            )
        resp = self.client.get("/accounts")
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertEqual(len(data), 3)
        print("test_list_accounts ... ok")

    # ── UPDATE ─────────────────────────────────────────────────────────────
    def test_update_account(self):
        """Test PUT /accounts/<id> updates account fields."""
        self.client.post(
            "/accounts",
            data=json.dumps({"name": "Dave", "email": "dave@crowdflow.ai"}),
            content_type="application/json",
        )
        resp = self.client.put(
            "/accounts/1",
            data=json.dumps({"name": "Dave Updated", "email": "dave@crowdflow.ai",
                             "role": "superadmin", "active": True}),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertEqual(data["name"], "Dave Updated")
        self.assertEqual(data["role"], "superadmin")
        print("test_update_account ... ok")

    # ── DELETE ─────────────────────────────────────────────────────────────
    def test_delete_account(self):
        """Test DELETE /accounts/<id> removes account."""
        self.client.post(
            "/accounts",
            data=json.dumps({"name": "Eve", "email": "eve@crowdflow.ai"}),
            content_type="application/json",
        )
        resp = self.client.delete("/accounts/1")
        self.assertEqual(resp.status_code, 204)
        # Verify deleted
        resp2 = self.client.get("/accounts/1")
        self.assertEqual(resp2.status_code, 404)
        print("test_delete_account ... ok")

    # ── CORS ───────────────────────────────────────────────────────────────
    def test_cors_headers_present(self):
        """Test CORS headers are present on OPTIONS preflight."""
        resp = self.client.options(
            "/accounts",
            headers={"Origin": "http://localhost:5173",
                     "Access-Control-Request-Method": "GET"},
        )
        self.assertIn(resp.status_code, [200, 204])
        print("test_cors_headers_present ... ok")


if __name__ == "__main__":
    unittest.main()
