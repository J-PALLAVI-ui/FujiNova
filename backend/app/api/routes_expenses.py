"""FujiNova 9.0: Travel Budget & Expense Management Router."""
import secrets
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Query, HTTPException, status
from pydantic import BaseModel, Field
from backend.app.core.database import get_db_connection

router = APIRouter(prefix="/api/v1/expenses", tags=["Budget & Expenses"])


class ExpenseRecordRequest(BaseModel):
    trip_id: Optional[str] = Field(None, description="Associated trip or null for general daily tracking")
    category: str = Field(..., description="transport, admission, meals, accommodation, shopping, other")
    amount_jpy: int = Field(..., ge=0, description="Amount spent in JPY")
    description: str = Field(..., min_length=1, max_length=200)
    is_verified_fee: bool = Field(False, description="True if from official place admission or transit fare")


class ExpenseRecordResponse(BaseModel):
    expense_id: str
    trip_id: Optional[str]
    category: str
    amount_jpy: int
    description: str
    is_verified_fee: int
    created_at: str


@router.get("", response_model=List[ExpenseRecordResponse])
def list_expenses(trip_id: Optional[str] = Query(None)):
    """List recorded travel expenses."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if trip_id:
            cursor.execute("SELECT * FROM expenses WHERE trip_id = ? ORDER BY created_at DESC;", (trip_id,))
        else:
            cursor.execute("SELECT * FROM expenses ORDER BY created_at DESC LIMIT 50;")
        rows = [dict(r) for r in cursor.fetchall()]
    return rows


@router.post("", response_model=ExpenseRecordResponse, status_code=status.HTTP_201_CREATED)
def record_expense(req: ExpenseRecordRequest):
    """Add a new travel expense."""
    exp_id = f"exp_{secrets.token_hex(6)}"
    now_iso = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO expenses (expense_id, trip_id, user_id, category, amount_jpy, description, is_verified_fee, created_at)
            VALUES (?, ?, 'default_user', ?, ?, ?, ?, ?);
        """, (
            exp_id, req.trip_id, req.category, req.amount_jpy, req.description, 1 if req.is_verified_fee else 0, now_iso
        ))
        conn.commit()

    return ExpenseRecordResponse(
        expense_id=exp_id,
        trip_id=req.trip_id,
        category=req.category,
        amount_jpy=req.amount_jpy,
        description=req.description,
        is_verified_fee=1 if req.is_verified_fee else 0,
        created_at=now_iso
    )


@router.delete("/{expense_id}")
def delete_expense(expense_id: str):
    """Remove an expense record."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM expenses WHERE expense_id = ?;", (expense_id,))
        conn.commit()
    return {"success": True, "deleted_id": expense_id}


@router.get("/summary")
def get_budget_summary(trip_id: Optional[str] = Query(None), target_daily_budget_jpy: int = Query(10000)):
    """Compute planned vs actual spending breakdown by category and remaining balance."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if trip_id:
            cursor.execute("SELECT category, SUM(amount_jpy) as total FROM expenses WHERE trip_id = ? GROUP BY category;", (trip_id,))
        else:
            cursor.execute("SELECT category, SUM(amount_jpy) as total FROM expenses GROUP BY category;")
        cat_rows = cursor.fetchall()

    spent_by_category = {
        "transport": 0,
        "admission": 0,
        "meals": 0,
        "accommodation": 0,
        "shopping": 0,
        "other": 0
    }
    total_spent = 0
    for r in cat_rows:
        cat = r["category"]
        amt = r["total"] or 0
        if cat in spent_by_category:
            spent_by_category[cat] = amt
        total_spent += amt

    remaining = target_daily_budget_jpy - total_spent

    return {
        "currency": "JPY (¥)",
        "target_daily_budget_jpy": target_daily_budget_jpy,
        "total_spent_jpy": total_spent,
        "remaining_balance_jpy": remaining,
        "spent_by_category": spent_by_category,
        "status": "UNDER_BUDGET" if remaining >= 0 else "OVER_BUDGET"
    }
