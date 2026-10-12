"""Time helpers. The database stores naive UTC; people read India Standard Time."""
from datetime import datetime, timedelta, timezone
from typing import Optional

IST = timezone(timedelta(hours=5, minutes=30))


def now_utc() -> datetime:
    """Current UTC time as a naive datetime (matches the DB column type)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def as_utc(dt: Optional[datetime]) -> Optional[datetime]:
    """Naive-UTC datetime -> timezone-aware UTC (so JSON carries an explicit offset)."""
    if dt is None:
        return None
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt


def to_ist(dt: Optional[datetime]) -> Optional[datetime]:
    return as_utc(dt).astimezone(IST) if dt else None


def fmt_ist(dt: Optional[datetime]) -> str:
    local = to_ist(dt)
    return local.strftime("%d %b %Y, %I:%M %p") if local else ""


def today_ist_compact() -> str:
    return datetime.now(IST).strftime("%Y%m%d")
