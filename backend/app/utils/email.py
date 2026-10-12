"""E-mail helper (OTP codes + patient documents).

If SMTP is configured (SMTP_HOST set) messages are sent by e-mail. Otherwise the
application falls back to "demo mode": the message is written to the server log
so that the flow can be exercised without an external mail provider.
"""
import logging
import smtplib
from email.message import EmailMessage
from html import escape
from typing import Optional

from app.core.config import settings

logger = logging.getLogger("app.email")


def smtp_configured() -> bool:
    return bool(settings.SMTP_HOST)


def send_email(to_email: str, subject: str, body: str, html: Optional[str] = None) -> bool:
    """Send an e-mail (plain text, plus an HTML alternative when given).

    Returns True if handed to SMTP, False in demo mode / on failure."""
    if not to_email:
        return False

    if not smtp_configured():
        logger.warning("DEMO e-mail (no SMTP) to=%s | %s\n%s", to_email, subject, body)
        print(f"\n[DEMO EMAIL] To: {to_email}\nSubject: {subject}\n{body}\n", flush=True)
        return False

    msg = EmailMessage()
    msg["From"] = f"PharmaMS <{settings.SMTP_FROM}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body)
    if html:
        msg.add_alternative(html, subtype="html")

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            if settings.SMTP_TLS:
                server.starttls()
            if settings.SMTP_USER:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        logger.info("E-mail sent to %s (%s)", to_email, subject)
        return True
    except Exception as exc:  # pragma: no cover - network dependent
        logger.error("Failed to send e-mail to %s: %s", to_email, exc)
        print(f"[email] send failed: {exc}", flush=True)
        return False


def send_otp_email(to_email: str, otp: str) -> bool:
    body = (
        f"Your PharmaMS one-time password is: {otp}\n\n"
        f"It is valid for {settings.OTP_EXPIRE_MINUTES} minutes. "
        "If you did not request this, please ignore this e-mail."
    )
    return send_email(to_email, "PharmaMS - Your login OTP", body)


# ----------------------------------------------------------------------------
# HTML templates (inline CSS only - e-mail clients ignore <style>/external CSS)
# ----------------------------------------------------------------------------
_TH = "padding:10px 12px;background:#1b5e20;color:#ffffff;font-size:13px;text-align:{a};border:1px solid #1b5e20;"
_TD = "padding:9px 12px;font-size:14px;color:#222;border:1px solid #e0e0e0;text-align:{a};"


def _money(v) -> str:
    return f"{float(v or 0):,.2f}"


def _page(title: str, inner: str) -> str:
    return (
        '<div style="background:#f3f6f4;padding:24px 8px;font-family:Segoe UI,Arial,sans-serif;">'
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" '
        'style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:10px;'
        'border:1px solid #dfe7e1;overflow:hidden;">'
        '<tr><td style="background:#2e7d32;padding:18px 24px;color:#ffffff;">'
        '<div style="font-size:22px;font-weight:700;letter-spacing:.5px;">PharmaMS</div>'
        f'<div style="font-size:13px;opacity:.9;">{escape(title)}</div></td></tr>'
        f'<tr><td style="padding:22px 24px;">{inner}</td></tr>'
        '<tr><td style="padding:14px 24px;background:#f7faf8;color:#777;font-size:12px;text-align:center;">'
        'Thank you for choosing PharmaMS. Get well soon!</td></tr></table></div>'
    )


def _info_row(label: str, value) -> str:
    return (
        f'<tr><td style="padding:3px 16px 3px 0;color:#666;font-size:13px;">{escape(label)}</td>'
        f'<td style="padding:3px 0;font-size:14px;font-weight:600;color:#222;">{escape(str(value))}</td></tr>'
    )


def render_bill_html(bill: dict) -> str:
    rows = ""
    for n, it in enumerate(bill["items"], 1):
        bg = "#ffffff" if n % 2 else "#f7faf8"
        rows += (
            f'<tr style="background:{bg};">'
            f'<td style="{_TD.format(a="center")}">{n}</td>'
            f'<td style="{_TD.format(a="left")}">{escape(it["name"] or "")}</td>'
            f'<td style="{_TD.format(a="center")}">{it["qty"]}</td>'
            f'<td style="{_TD.format(a="right")}">{_money(it["unit_price"])}</td>'
            f'<td style="{_TD.format(a="right")}">{_money(it["subtotal"])}</td></tr>'
        )

    def total_row(label, value, strong=False):
        st = "font-weight:700;font-size:15px;background:#e8f5e9;" if strong else ""
        return (
            f'<tr><td colspan="4" style="{_TD.format(a="right")}{st}">{label}</td>'
            f'<td style="{_TD.format(a="right")}{st}">&#8377; {_money(value)}</td></tr>'
        )

    paid = str(bill["payment_status"]).lower() == "paid"
    badge = "#2e7d32" if paid else "#ef6c00"
    inner = (
        '<table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">'
        + _info_row("Bill No.", bill["bill_number"])
        + _info_row("Patient", bill["patient_name"])
        + _info_row("Date", bill["sale_date"])
        + _info_row("Payment", f'{bill["payment_method"]} ({bill["payment_status"]})')
        + "</table>"
        '<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">'
        "<thead><tr>"
        f'<th style="{_TH.format(a="center")}width:40px;">#</th>'
        f'<th style="{_TH.format(a="left")}">Medicine</th>'
        f'<th style="{_TH.format(a="center")}">Qty</th>'
        f'<th style="{_TH.format(a="right")}">Rate (&#8377;)</th>'
        f'<th style="{_TH.format(a="right")}">Amount (&#8377;)</th></tr></thead>'
        f"<tbody>{rows}"
        + total_row("Subtotal", bill["total"])
        + total_row("Discount", bill["discount"])
        + total_row("Tax", bill["tax"])
        + total_row("NET PAID" if paid else "NET PAYABLE", bill["net"], strong=True)
        + "</tbody></table>"
        f'<p style="margin:16px 0 0;"><span style="background:{badge};color:#fff;padding:4px 12px;'
        f'border-radius:12px;font-size:12px;font-weight:700;">{escape(str(bill["payment_status"]).upper())}</span></p>'
    )
    return _page("Payment Receipt", inner)


def render_prescription_html(rx: dict) -> str:
    rows = ""
    for n, it in enumerate(rx["items"], 1):
        bg = "#ffffff" if n % 2 else "#f7faf8"
        rows += (
            f'<tr style="background:{bg};">'
            f'<td style="{_TD.format(a="center")}">{n}</td>'
            f'<td style="{_TD.format(a="left")}">{escape(it["name"] or "")}</td>'
            f'<td style="{_TD.format(a="center")}">{it["quantity"]}</td>'
            f'<td style="{_TD.format(a="left")}">{escape(it["dosage"] or "As directed")}</td></tr>'
        )
    inner = (
        '<table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">'
        + _info_row("Prescription", rx["prescription_number"])
        + _info_row("Patient", rx["patient_name"])
        + _info_row("Doctor", rx["doctor_name"])
        + _info_row("Issued", rx["issue_date"])
        + _info_row("Status", rx["status"])
        + "</table>"
        '<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">'
        "<thead><tr>"
        f'<th style="{_TH.format(a="center")}width:40px;">#</th>'
        f'<th style="{_TH.format(a="left")}">Medicine</th>'
        f'<th style="{_TH.format(a="center")}">Qty</th>'
        f'<th style="{_TH.format(a="left")}">Dosage</th></tr></thead>'
        f"<tbody>{rows}</tbody></table>"
        '<p style="margin:16px 0 0;font-size:13px;color:#555;">'
        "Please follow the dosage as directed by your doctor.</p>"
    )
    return _page("Prescription", inner)


def send_bill_email(to_email: str, bill: dict) -> bool:
    """E-mail a sale/bill (HTML table + plain-text fallback) to the patient."""
    w = 56
    paid = str(bill["payment_status"]).lower() == "paid"
    lines = [
        "PHARMAMS - PAYMENT RECEIPT",
        "=" * w,
        f"Bill No. : {bill['bill_number']}",
        f"Patient  : {bill['patient_name']}",
        f"Date     : {bill['sale_date']}",
        f"Payment  : {bill['payment_method']} ({bill['payment_status']})",
        "-" * w,
        f"{'Item':<26}{'Qty':>5}{'Rate':>11}{'Amount':>12}",
        "-" * w,
    ]
    for it in bill["items"]:
        lines.append(f"{(it['name'] or '')[:25]:<26}{it['qty']:>5}{it['unit_price']:>11.2f}{it['subtotal']:>12.2f}")
    lines += [
        "-" * w,
        f"{'Subtotal':<44}{bill['total']:>12.2f}",
        f"{'Discount':<44}{bill['discount']:>12.2f}",
        f"{'Tax':<44}{bill['tax']:>12.2f}",
        f"{'NET PAID' if paid else 'NET PAYABLE':<44}{bill['net']:>12.2f}",
        "=" * w,
        "",
        "Thank you for choosing PharmaMS. Get well soon!",
    ]
    return send_email(
        to_email, f"PharmaMS bill {bill['bill_number']}", "\n".join(lines), html=render_bill_html(bill)
    )


def send_prescription_email(to_email: str, rx: dict) -> bool:
    lines = [
        f"PharmaMS - Prescription {rx['prescription_number']}",
        "-" * 46,
        f"Patient : {rx['patient_name']}",
        f"Doctor  : {rx['doctor_name']}",
        f"Issued  : {rx['issue_date']}",
        f"Status  : {rx['status']}",
        "-" * 46,
        "Medicines:",
    ]
    for it in rx["items"]:
        lines.append(f"  - {it['name']}  x{it['quantity']}  ({it['dosage'] or 'as directed'})")
    lines += [
        "-" * 46,
        "",
        "Please follow the dosage as directed by your doctor.",
        "Thank you for choosing PharmaMS. Get well soon!",
    ]
    return send_email(
        to_email,
        f"PharmaMS prescription {rx['prescription_number']}",
        "\n".join(lines),
        html=render_prescription_html(rx),
    )
