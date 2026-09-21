from datetime import time

from app.services.schedule_service import compute_busy_intervals, compute_free_time


def test_compute_busy_intervals_merges_overlaps():
    blocks = [(time(9, 0), 60), (time(9, 30), 30), (time(14, 0), 30)]
    assert compute_busy_intervals(blocks) == [
        (time(9, 0), time(10, 0)),
        (time(14, 0), time(14, 30)),
    ]


def test_compute_busy_intervals_empty():
    assert compute_busy_intervals([]) == []


def test_compute_busy_intervals_sorts_unordered_input():
    blocks = [(time(14, 0), 30), (time(9, 0), 60)]
    assert compute_busy_intervals(blocks) == [
        (time(9, 0), time(10, 0)),
        (time(14, 0), time(14, 30)),
    ]


def test_compute_free_time_basic_gaps():
    busy = [(time(9, 0), time(10, 0)), (time(14, 0), time(14, 30))]
    assert compute_free_time(busy, day_start=time(7, 0), day_end=time(23, 0)) == [
        (time(7, 0), time(9, 0)),
        (time(10, 0), time(14, 0)),
        (time(14, 30), time(23, 0)),
    ]


def test_compute_free_time_no_busy_returns_full_day():
    assert compute_free_time([], day_start=time(7, 0), day_end=time(23, 0)) == [
        (time(7, 0), time(23, 0))
    ]


def test_compute_free_time_fully_booked():
    busy = [(time(7, 0), time(23, 0))]
    assert compute_free_time(busy, day_start=time(7, 0), day_end=time(23, 0)) == []


def test_compute_free_time_busy_extends_past_day_end():
    busy = [(time(22, 0), time(23, 30))]
    assert compute_free_time(busy, day_start=time(7, 0), day_end=time(23, 0)) == [
        (time(7, 0), time(22, 0))
    ]


def test_compute_free_time_busy_starts_before_day_start():
    busy = [(time(6, 0), time(8, 0))]
    assert compute_free_time(busy, day_start=time(7, 0), day_end=time(23, 0)) == [
        (time(8, 0), time(23, 0))
    ]
