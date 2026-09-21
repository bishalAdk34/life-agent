from datetime import date
from decimal import Decimal

from app.services.expense_service import compute_budget_summary, compute_period_bounds


def test_daily_period_bounds():
    ref = date(2026, 9, 21)  # Monday
    assert compute_period_bounds("daily", ref) == (ref, ref)


def test_weekly_period_bounds():
    ref = date(2026, 9, 24)  # Thursday
    assert compute_period_bounds("weekly", ref) == (date(2026, 9, 21), date(2026, 9, 27))


def test_weekly_period_bounds_on_monday():
    ref = date(2026, 9, 21)  # Monday itself
    assert compute_period_bounds("weekly", ref) == (date(2026, 9, 21), date(2026, 9, 27))


def test_monthly_period_bounds_mid_month():
    ref = date(2026, 9, 15)
    assert compute_period_bounds("monthly", ref) == (date(2026, 9, 1), date(2026, 9, 30))


def test_monthly_period_bounds_december_wraps_year():
    ref = date(2026, 12, 10)
    assert compute_period_bounds("monthly", ref) == (date(2026, 12, 1), date(2026, 12, 31))


def test_unknown_period_raises():
    import pytest

    with pytest.raises(ValueError):
        compute_period_bounds("yearly", date(2026, 9, 21))


def test_budget_summary_under_limit():
    result = compute_budget_summary(Decimal("30.00"), Decimal("100.00"))
    assert result["remaining"] == Decimal("70.00")
    assert result["pct_used"] == 30.0
    assert result["exceeded"] is False


def test_budget_summary_exceeded():
    result = compute_budget_summary(Decimal("150.00"), Decimal("100.00"))
    assert result["remaining"] == Decimal("-50.00")
    assert result["pct_used"] == 150.0
    assert result["exceeded"] is True


def test_budget_summary_zero_limit_no_division_error():
    result = compute_budget_summary(Decimal("10.00"), Decimal("0.00"))
    assert result["pct_used"] == 0.0
    assert result["exceeded"] is True
