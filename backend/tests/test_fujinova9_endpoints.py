"""Integration tests for FujiNova 9.0 API Endpoints: Essentials, Disruptions, Expenses, Businesses."""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_essentials_endpoints():
    # 1. Emergency Directory
    res = client.get("/api/v1/essentials/emergency")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert len(data["hotlines"]) >= 3
    assert any("110" in h["number"] for h in data["hotlines"])
    assert any("119" in h["number"] for h in data["hotlines"])

    # 2. List Essentials
    res_list = client.get("/api/v1/essentials")
    assert res_list.status_code == 200
    services = res_list.json()
    assert len(services) > 0

    # 3. Filter by category
    res_hosp = client.get("/api/v1/essentials?category=hospital")
    assert res_hosp.status_code == 200
    hosps = res_hosp.json()
    assert len(hosps) >= 1
    assert all(h["category"] == "hospital" for h in hosps)


def test_disruptions_endpoints():
    res = client.get("/api/v1/disruptions")
    assert res.status_code == 200
    disruptions = res.json()
    assert isinstance(disruptions, list)
    if disruptions:
        first = disruptions[0]
        assert "disruption_id" in first
        assert "severity" in first
        assert "line_or_area" in first


def test_expenses_lifecycle():
    # 1. Record expense
    payload = {
        "category": "meals",
        "amount_jpy": 1800,
        "description": "Hoto Noodles lunch at Kawaguchiko",
        "is_verified_fee": False
    }
    res_post = client.post("/api/v1/expenses", json=payload)
    assert res_post.status_code == 201
    created = res_post.json()
    assert created["amount_jpy"] == 1800
    exp_id = created["expense_id"]

    # 2. List expenses
    res_list = client.get("/api/v1/expenses")
    assert res_list.status_code == 200
    exps = res_list.json()
    assert any(e["expense_id"] == exp_id for e in exps)

    # 3. Budget Summary
    res_summary = client.get("/api/v1/expenses/summary?target_daily_budget_jpy=15000")
    assert res_summary.status_code == 200
    summary = res_summary.json()
    assert summary["target_daily_budget_jpy"] == 15000
    assert summary["total_spent_jpy"] >= 1800
    assert "spent_by_category" in summary

    # 4. Delete expense
    res_del = client.delete(f"/api/v1/expenses/{exp_id}")
    assert res_del.status_code == 200
    assert res_del.json()["success"] is True


def test_business_directory_endpoint():
    res = client.get("/api/v1/businesses")
    assert res.status_code == 200
    listings = res.json()
    assert len(listings) >= 1
    assert any(b["category"] == "bicycle_rental" for b in listings)
