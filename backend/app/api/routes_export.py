"""FujiNova Itinerary Export & Share Router (Stage 8).

Handles:
- Saving itineraries to SQLite database
- Generating high-resolution QR codes linking to shared trips
- Generating professional, publication-quality PDFs with Unicode Japanese support
- Fetching shared itineraries by token
"""
import io
import json
import secrets
import logging
from datetime import datetime
from typing import Dict, Any, Optional

from fastapi import APIRouter, HTTPException, Query, Response, status
from pydantic import BaseModel, Field

from backend.app.core.database import get_db_connection
from backend.app.services.crowd.attraction_images import get_attraction_image

# ReportLab PDF Generation
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont

# QR Code Generation
import qrcode
from qrcode.image.pil import PilImage

logger = logging.getLogger("fujinova.export")
router = APIRouter(prefix="/api/v1/itinerary", tags=["Itinerary Export & Sharing"])

# Register Japanese CJK Fonts
try:
    pdfmetrics.registerFont(UnicodeCIDFont('HeiseiKakuGo-W5'))
    pdfmetrics.registerFont(UnicodeCIDFont('HeiseiMin-W3'))
    JP_FONT = 'HeiseiKakuGo-W5'
    JP_FONT_SERIF = 'HeiseiMin-W3'
except Exception as e:
    logger.warning(f"Failed to register CID fonts: {e}")
    JP_FONT = 'Helvetica-Bold'
    JP_FONT_SERIF = 'Helvetica'


class SaveTripRequest(BaseModel):
    title: str = Field(default="Mount Fuji Exploration")
    itinerary: Dict[str, Any]
    is_private: bool = False


class SaveTripResponse(BaseModel):
    trip_id: str
    share_token: str
    share_url: str
    qr_url: str
    pdf_url: str
    title: str
    created_at: str


@router.post("/save", response_model=SaveTripResponse)
def save_itinerary(req: SaveTripRequest) -> SaveTripResponse:
    """Save an itinerary and generate a permanent shareable token."""
    trip_id = f"trip_{secrets.token_hex(8)}"
    share_token = f"fn_{secrets.token_urlsafe(10)}"
    now_iso = datetime.utcnow().isoformat()

    itinerary_data = req.itinerary
    title = req.title or itinerary_data.get("title", "Mount Fuji Exploration")
    total_days = int(itinerary_data.get("total_days", 1))
    budget_tier = str(itinerary_data.get("budget_tier", "standard"))
    pace = str(itinerary_data.get("pace", "moderate"))
    party = str(itinerary_data.get("party_composition", "traveller"))

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO saved_trips (
                trip_id, share_token, title, total_days, budget_tier, pace,
                party_composition, itinerary_json, created_at, updated_at, is_private, is_revoked
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0);
        """, (
            trip_id, share_token, title, total_days, budget_tier, pace,
            party, json.dumps(itinerary_data), now_iso, now_iso, 1 if req.is_private else 0
        ))
        conn.commit()

    return SaveTripResponse(
        trip_id=trip_id,
        share_token=share_token,
        share_url=f"http://localhost:5173/trip/{share_token}",
        qr_url=f"/api/v1/itinerary/qr/{share_token}",
        pdf_url=f"/api/v1/itinerary/export-pdf?token={share_token}",
        title=title,
        created_at=now_iso
    )


@router.get("/share/{share_token}")
def get_shared_itinerary(share_token: str) -> Dict[str, Any]:
    """Retrieve saved itinerary data by share token."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT trip_id, share_token, title, total_days, budget_tier, pace,
                   party_composition, itinerary_json, created_at, is_private, is_revoked
            FROM saved_trips
            WHERE share_token = ?;
        """, (share_token,))
        row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Trip not found.")

        if row["is_revoked"] == 1:
            raise HTTPException(status_code=410, detail="This shared itinerary link has been revoked.")

        return {
            "trip_id": row["trip_id"],
            "share_token": row["share_token"],
            "title": row["title"],
            "total_days": row["total_days"],
            "budget_tier": row["budget_tier"],
            "pace": row["pace"],
            "party_composition": row["party_composition"],
            "itinerary": json.loads(row["itinerary_json"]),
            "created_at": row["created_at"],
            "is_private": bool(row["is_private"])
        }


@router.post("/revoke/{share_token}")
def revoke_shared_trip(share_token: str) -> Dict[str, str]:
    """Revoke a previously generated share link."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE saved_trips SET is_revoked = 1 WHERE share_token = ?;", (share_token,))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Trip not found.")
        conn.commit()
    return {"status": "revoked", "share_token": share_token}


def generate_qr_png_bytes(data_url: str) -> bytes:
    """Generate high-resolution PNG bytes for a QR code."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=3,
    )
    qr.add_data(data_url)
    qr.make(fit=True)

    # Use FujiNova dark navy for QR fill
    img = qr.make_image(fill_color="#17253F", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()


@router.get("/qr/{share_token}")
def get_trip_qr_code(share_token: str, base_host: str = "http://localhost:5173") -> Response:
    """Return high-resolution PNG image of QR code for this trip."""
    # Verify token exists and is active
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT is_revoked FROM saved_trips WHERE share_token = ?;", (share_token,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Trip not found.")
        if row["is_revoked"] == 1:
            raise HTTPException(status_code=410, detail="Trip share link has been revoked.")

    target_url = f"{base_host.rstrip('/')}/trip/{share_token}"
    png_bytes = generate_qr_png_bytes(target_url)
    return Response(content=png_bytes, media_type="image/png")


@router.get("/export-pdf")
@router.post("/export-pdf")
def export_itinerary_pdf(
    token: Optional[str] = Query(None),
    body: Optional[Dict[str, Any]] = None
) -> Response:
    """Generate and download a professional PDF of the itinerary with Japanese typography."""
    itinerary_data: Optional[Dict[str, Any]] = None
    share_token_val: str = token or ""

    if token:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT itinerary_json, is_revoked FROM saved_trips WHERE share_token = ?;", (token,))
            row = cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Trip token not found.")
            if row["is_revoked"] == 1:
                raise HTTPException(status_code=410, detail="Trip token has been revoked.")
            itinerary_data = json.loads(row["itinerary_json"])
    elif body:
        itinerary_data = body.get("itinerary") or body
        share_token_val = body.get("share_token") or "fujinova_preview"
    else:
        raise HTTPException(status_code=400, detail="Must supply either 'token' query param or JSON itinerary body.")

    if not itinerary_data:
        raise HTTPException(status_code=400, detail="Invalid itinerary data.")

    pdf_bytes = build_fujinova_pdf(itinerary_data, share_token=share_token_val)
    filename = f"fujinova-itinerary-{datetime.utcnow().strftime('%Y%m%d')}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=\"{filename}\"",
            "Cache-Control": "no-cache"
        }
    )


def build_fujinova_pdf(itinerary: Dict[str, Any], share_token: str) -> bytes:
    """Build multi-page ReportLab PDF document matching FujiNova 7.0 visual identity."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=14 * mm,
        leftMargin=14 * mm,
        topMargin=12 * mm,
        bottomMargin=12 * mm
    )

    styles = getSampleStyleSheet()

    # Custom Brand Colors
    c_fuji_blue = colors.HexColor("#2878B8")
    c_sakura_pink = colors.HexColor("#D96C98")
    c_deep_navy = colors.HexColor("#17253F")
    c_warm_cream = colors.HexColor("#FFF8F0")
    c_slate_dark = colors.HexColor("#1E293B")
    c_slate_muted = colors.HexColor("#64748B")
    c_border = colors.HexColor("#CBD5E1")

    # Custom Typography Styles
    title_style = ParagraphStyle(
        'FujiTitle',
        parent=styles['Heading1'],
        fontName=JP_FONT,
        fontSize=20,
        leading=24,
        textColor=c_deep_navy,
        spaceAfter=3
    )

    subtitle_style = ParagraphStyle(
        'FujiSubtitle',
        parent=styles['Normal'],
        fontName=JP_FONT_SERIF,
        fontSize=10,
        leading=14,
        textColor=c_slate_muted,
        spaceAfter=10
    )

    h2_style = ParagraphStyle(
        'FujiH2',
        parent=styles['Heading2'],
        fontName=JP_FONT,
        fontSize=13,
        leading=16,
        textColor=c_fuji_blue,
        spaceBefore=10,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'FujiBody',
        parent=styles['Normal'],
        fontName=JP_FONT_SERIF,
        fontSize=9,
        leading=12,
        textColor=c_slate_dark
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName=JP_FONT,
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName=JP_FONT_SERIF,
        fontSize=8,
        leading=11,
        textColor=c_slate_dark
    )

    story = []

    # 1. Header Banner Box
    title_text = itinerary.get("title", "Mount Fuji Travel Journey")
    days_count = itinerary.get("total_days", len(itinerary.get("days", [1])))
    budget_tier = str(itinerary.get("budget_tier", "Standard")).title()
    pace = str(itinerary.get("pace", "Moderate")).title()

    # QR Code Image generation for document header/footer
    share_url = f"http://localhost:5173/trip/{share_token}"
    qr_png = generate_qr_png_bytes(share_url)
    qr_flowable = RLImage(io.BytesIO(qr_png), width=28 * mm, height=28 * mm)

    banner_data = [
        [
            Paragraph("<b>FUJINOVA 7.0 • 富士ノヴァ</b><br/><font color='#D96C98'>Mount Fuji & Yamanashi Tourism Intelligence</font>", subtitle_style),
            qr_flowable
        ],
        [
            Paragraph(f"<b>{title_text}</b>", title_style),
            Paragraph(f"<font size=7 color='#64748B'>Scan to open interactive 3D route on mobile</font>", body_style)
        ]
    ]

    banner_table = Table(banner_data, colWidths=[130 * mm, 38 * mm])
    banner_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
    ]))
    story.append(banner_table)
    story.append(Spacer(1, 4 * mm))

    # Divider bar in Sakura Pink / Fuji Blue
    story.append(HRFlowable(width="100%", thickness=2, color=c_sakura_pink, spaceBefore=1, spaceAfter=8))

    # 2. Key Metadata Badges Table
    meta_table_data = [
        [
            Paragraph(f"<b>Duration:</b> {days_count} Day{'s' if days_count > 1 else ''}", body_style),
            Paragraph(f"<b>Budget Tier:</b> {budget_tier}", body_style),
            Paragraph(f"<b>Pace:</b> {pace}", body_style),
            Paragraph(f"<b>Generated:</b> {datetime.utcnow().strftime('%Y-%m-%d')}", body_style),
        ]
    ]
    meta_table = Table(meta_table_data, colWidths=[42 * mm, 42 * mm, 42 * mm, 42 * mm])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), c_warm_cream),
        ('BOX', (0, 0), (-1, -1), 0.5, c_border),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, c_border),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 6 * mm))

    # 3. Day-by-Day Itinerary Tables
    days = itinerary.get("days", [])
    if not days:
        # Fallback if raw list of stops given
        stops = itinerary.get("stops", [])
        if stops:
            days = [{"day_number": 1, "title": "Day 1: Scenic Exploration", "stops": stops}]

    total_est_fee = 0

    for day in days:
        day_num = day.get("day_number", 1)
        day_title = day.get("title", f"Day {day_num}")
        stops = day.get("stops", [])

        story.append(Paragraph(f"<b>{day_title}</b>", h2_style))

        # Table Header
        day_rows = [[
            Paragraph("<b>#</b>", table_header_style),
            Paragraph("<b>Time</b>", table_header_style),
            Paragraph("<b>Destination / Attraction</b>", table_header_style),
            Paragraph("<b>Fuji View</b>", table_header_style),
            Paragraph("<b>Accessibility & Stairs</b>", table_header_style),
            Paragraph("<b>Duration</b>", table_header_style),
            Paragraph("<b>Admission</b>", table_header_style),
        ]]

        for idx, stop in enumerate(stops, 1):
            name_en = stop.get("name_en") or stop.get("name_ja") or f"Stop {idx}"
            name_ja = stop.get("name_ja", "")
            fuji_rating = f"{stop.get('fuji_view_rating', 5)}/5 ★"
            access = stop.get("accessibility_status", "Accessible").replace("VERIFIED_ACCESSIBLE", "Barrier-Free").replace("_", " ").title()
            arrival = stop.get("estimated_arrival") or f"{9 + idx}:00"
            dur = f"{stop.get('duration_minutes', 60)} min"
            adm = stop.get("admission_info") or "Free"

            # Parse fee if possible
            if "¥" in adm:
                try:
                    total_est_fee += int(''.join(filter(str.isdigit, adm)))
                except Exception:
                    pass

            name_cell = Paragraph(f"<b>{name_en}</b><br/><font color='#64748B'>{name_ja}</font>", table_cell_style)

            day_rows.append([
                Paragraph(str(idx), table_cell_style),
                Paragraph(arrival, table_cell_style),
                name_cell,
                Paragraph(fuji_rating, table_cell_style),
                Paragraph(access, table_cell_style),
                Paragraph(dur, table_cell_style),
                Paragraph(adm, table_cell_style),
            ])

        col_widths = [10 * mm, 16 * mm, 58 * mm, 20 * mm, 32 * mm, 16 * mm, 20 * mm]
        day_table = Table(day_rows, colWidths=col_widths)
        day_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), c_fuji_blue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (1, -1), 'CENTER'),
            ('ALIGN', (3, 0), (6, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 0.5, c_border),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))

        story.append(KeepTogether([day_table]))
        story.append(Spacer(1, 4 * mm))

    # 4. Regional Safety & Omotenashi Hospitality Notice
    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph("<b>Mount Fuji Regional Guidelines & Emergency Guidance</b>", h2_style))
    guidance_text = (
        "<b>Omotenashi Travel Etiquette:</b> Please remove outdoor shoes when entering traditional tatami dining rooms or temples. "
        "Keep voices moderate on Fujikyu buses and trains.<br/>"
        "<b>Weather & Fuji Visibility:</b> Mountain weather shifts rapidly. View ratings are optimized for clear mornings (07:00-10:00). "
        "<b>Emergency Numbers:</b> Police 110 • Medical/Fire 119 • Japan Visitor Hotline: 050-3816-2720."
    )
    guidance_table = Table(
        [[Paragraph(guidance_text, body_style)]],
        colWidths=[172 * mm]
    )
    guidance_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F1F5F9")),
        ('BOX', (0, 0), (-1, -1), 0.5, c_border),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(guidance_table)

    # Build Document
    doc.build(story)
    return buffer.getvalue()
