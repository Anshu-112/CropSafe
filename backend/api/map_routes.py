"""
API Routes for Crowdsourced Disease Outbreak Map.
Provides endpoints for retrieving, reporting, upvoting, commenting, and geospatial proximity queries.
"""
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field
from typing import List, Optional
import math
from datetime import datetime

from database.db import get_db

router = APIRouter(prefix="/api/map", tags=["Disease Outbreak Map"])

# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------

class CreateReportRequest(BaseModel):
    crop: str = Field(..., description="Crop type: 'wheat' or 'rice'")
    disease_name: str = Field(..., description="Name of the detected or spotted disease")
    disease_name_hi: Optional[str] = Field(None, description="Hindi disease name")
    severity: str = Field("Moderate", description="'Low', 'Moderate', or 'High'")
    lat: float = Field(..., description="Latitude coordinate")
    lon: float = Field(..., description="Longitude coordinate")
    district: str = Field(..., description="District name (e.g. Karnal, Ludhiana)")
    state: str = Field(..., description="State name (e.g. Haryana, Punjab)")
    description: Optional[str] = Field(None, description="Detailed field notes from farmer")
    image_url: Optional[str] = Field(None, description="Optional photo URL or base64 preview")
    reporter_name: Optional[str] = Field("Farmer", description="Name of reporter")
    reporter_phone: Optional[str] = Field(None, description="Phone of reporter")
    farmer_id: Optional[int] = Field(None, description="Optional foreign key to farmers table")
    is_ai_verified: Optional[bool] = Field(False, description="True if report was generated from AI leaf scan")

class CreateCommentRequest(BaseModel):
    farmer_name: str = Field(..., description="Name of the commenting farmer or expert")
    comment_text: str = Field(..., description="Comment or corroboration details")

class DispatchAlertsRequest(BaseModel):
    radius_km: float = Field(35.0, ge=5.0, le=100.0, description="Alert radius in kilometers (e.g. 30-40 km)")
    channels: List[str] = Field(["SMS", "WHATSAPP"], description="Channels to dispatch: SMS, WHATSAPP")
    custom_note: Optional[str] = Field(None, description="Optional custom advisory note from reporting farmer")

from services.alert_dispatcher import (
    get_nearby_farmers,
    dispatch_outbreak_alerts,
    generate_alert_messages,
    generate_whatsapp_group_link
)

# ---------------------------------------------------------------------------
# Helper Functions
# ---------------------------------------------------------------------------

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great circle distance between two points in kilometers."""
    R = 6371.0 # Earth radius in km
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 2)

# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/reports")
async def get_all_reports(
    crop: Optional[str] = Query(None, description="Filter by crop ('wheat' or 'rice')"),
    severity: Optional[str] = Query(None, description="Filter by severity ('Low', 'Moderate', 'High')"),
    days: int = Query(60, description="Show reports from last N days")
):
    """Retrieve disease outbreak reports with optional crop, severity, and timeframe filters."""
    query = """
        SELECT r.*, COUNT(c.id) as comment_count
        FROM disease_outbreak_reports r
        LEFT JOIN report_comments c ON r.id = c.report_id
        WHERE datetime(r.created_at) >= datetime('now', '-' || ? || ' days')
    """
    params = [days]

    if crop and crop.lower() != 'all':
        query += " AND LOWER(r.crop) = LOWER(?)"
        params.append(crop)

    if severity and severity.lower() != 'all':
        query += " AND LOWER(r.severity) = LOWER(?)"
        params.append(severity)

    query += " GROUP BY r.id ORDER BY r.created_at DESC"

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        rows = cursor.fetchall()
        reports = [dict(row) for row in rows]

    return {
        "count": len(reports),
        "reports": reports
    }

@router.post("/reports", status_code=status.HTTP_201_CREATED)
async def submit_report(payload: CreateReportRequest):
    """Submit a new disease outbreak report."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO disease_outbreak_reports (
                farmer_id, reporter_name, reporter_phone, crop,
                disease_name, disease_name_hi, severity, lat, lon,
                district, state, description, image_url, is_ai_verified
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            payload.farmer_id,
            payload.reporter_name or "Farmer",
            payload.reporter_phone,
            payload.crop.lower(),
            payload.disease_name,
            payload.disease_name_hi,
            payload.severity,
            payload.lat,
            payload.lon,
            payload.district,
            payload.state,
            payload.description,
            payload.image_url,
            1 if payload.is_ai_verified else 0
        ))
        new_id = cursor.lastrowid

        cursor.execute("SELECT * FROM disease_outbreak_reports WHERE id = ?", (new_id,))
        created_report = dict(cursor.fetchone())

    return {
        "status": "success",
        "message": "Disease outbreak report submitted successfully",
        "report": created_report
    }

@router.get("/reports/{report_id}")
async def get_report_details(report_id: int):
    """Get complete details and comments for a specific report."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM disease_outbreak_reports WHERE id = ?", (report_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Outbreak report not found")
        
        report = dict(row)

        cursor.execute("""
            SELECT id, farmer_name, comment_text, created_at
            FROM report_comments
            WHERE report_id = ?
            ORDER BY created_at ASC
        """, (report_id,))
        comments = [dict(c) for c in cursor.fetchall()]
        report["comments"] = comments

    return report

@router.post("/reports/{report_id}/upvote")
async def upvote_report(report_id: int):
    """Community 'I saw this too' confirmation upvote."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, upvotes FROM disease_outbreak_reports WHERE id = ?", (report_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Outbreak report not found")
        
        cursor.execute("""
            UPDATE disease_outbreak_reports
            SET upvotes = upvotes + 1
            WHERE id = ?
        """, (report_id,))

        cursor.execute("SELECT upvotes FROM disease_outbreak_reports WHERE id = ?", (report_id,))
        updated_upvotes = cursor.fetchone()[0]

    return {
        "status": "success",
        "report_id": report_id,
        "upvotes": updated_upvotes
    }

@router.post("/reports/{report_id}/comment", status_code=status.HTTP_201_CREATED)
async def add_comment(report_id: int, payload: CreateCommentRequest):
    """Add a community farmer or expert comment on an outbreak report."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM disease_outbreak_reports WHERE id = ?", (report_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Outbreak report not found")

        cursor.execute("""
            INSERT INTO report_comments (report_id, farmer_name, comment_text)
            VALUES (?, ?, ?)
        """, (report_id, payload.farmer_name, payload.comment_text))
        new_comment_id = cursor.lastrowid

        cursor.execute("SELECT * FROM report_comments WHERE id = ?", (new_comment_id,))
        comment = dict(cursor.fetchone())

    return {
        "status": "success",
        "comment": comment
    }

@router.get("/reports/nearby/alerts")
async def get_nearby_reports(
    lat: float = Query(..., description="Farmer's current latitude"),
    lon: float = Query(..., description="Farmer's current longitude"),
    radius_km: float = Query(50.0, description="Radius in kilometers to check"),
    crop: Optional[str] = Query(None, description="Optional crop filter ('wheat' or 'rice')")
):
    """
    Find active outbreak reports within radius_km of the provided coordinates using Haversine distance.
    Returns reports sorted from closest to farthest, with exact distance in kilometers.
    """
    query = """
        SELECT * FROM disease_outbreak_reports
        WHERE datetime(created_at) >= datetime('now', '-30 days')
    """
    params = []
    if crop and crop.lower() != 'all':
        query += " AND LOWER(crop) = LOWER(?)"
        params.append(crop)

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        rows = cursor.fetchall()

    nearby_reports = []
    for row in rows:
        r_dict = dict(row)
        dist = haversine_distance_km(lat, lon, r_dict["lat"], r_dict["lon"])
        if dist <= radius_km:
            r_dict["distance_km"] = dist
            nearby_reports.append(r_dict)

    nearby_reports.sort(key=lambda x: x["distance_km"])

    return {
        "center": {"lat": lat, "lon": lon},
        "radius_km": radius_km,
        "count": len(nearby_reports),
        "reports": nearby_reports
    }

@router.get("/reports/{report_id}/nearby-farmers")
async def get_report_nearby_farmers(
    report_id: int,
    radius_km: float = Query(35.0, ge=5.0, le=100.0, description="Radius in km to find registered farmers")
):
    """
    Finds registered farmers located within radius_km (e.g. 30-40 km) of the reported disease outbreak.
    Returns list with distance, village/district, and masked phone numbers.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, crop, disease_name, disease_name_hi, severity, lat, lon, district, state FROM disease_outbreak_reports WHERE id = ?", (report_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Outbreak report not found")
        report = dict(row)

    nearby = get_nearby_farmers(report["lat"], report["lon"], radius_km=radius_km)
    
    # Generate message preview
    msg_preview = generate_alert_messages(report, distance_km=round(radius_km, 1))

    return {
        "report_id": report_id,
        "district": report["district"],
        "state": report["state"],
        "disease_name": report["disease_name"],
        "disease_name_hi": report["disease_name_hi"],
        "radius_km": radius_km,
        "farmer_count": len(nearby),
        "farmers": nearby,
        "message_preview": msg_preview
    }

@router.post("/reports/{report_id}/dispatch-alerts")
async def dispatch_alerts_for_report(
    report_id: int,
    payload: DispatchAlertsRequest
):
    """
    Dispatches emergency SMS and WhatsApp alerts to all farmers residing within radius_km (30-40 km).
    Returns real/simulated delivery status and 1-click WhatsApp Click-to-Chat links.
    """
    try:
        result = dispatch_outbreak_alerts(
            report_id=report_id,
            radius_km=payload.radius_km,
            channels=payload.channels,
            custom_note=payload.custom_note
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to dispatch alerts: {str(e)}")

@router.get("/reports/{report_id}/dispatched-alerts")
async def get_report_dispatched_alerts(report_id: int):
    """
    Retrieves the history of emergency alerts previously dispatched for this outbreak report.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM outbreak_alerts_dispatched
            WHERE report_id = ?
            ORDER BY sent_at DESC
        """, (report_id,))
        rows = cursor.fetchall()
        alerts = [dict(r) for r in rows]

    return {
        "report_id": report_id,
        "count": len(alerts),
        "alerts": alerts
    }

@router.get("/farmer/{farmer_id}/notifications")
async def get_farmer_notifications(farmer_id: int):
    """
    Retrieves all emergency disease outbreak alerts received by a specific registered farmer.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT a.*, r.crop, r.disease_name, r.disease_name_hi, r.severity, r.district, r.state
            FROM outbreak_alerts_dispatched a
            JOIN disease_outbreak_reports r ON a.report_id = r.id
            WHERE a.farmer_id = ?
            ORDER BY a.sent_at DESC
            LIMIT 30
        """, (farmer_id,))
        rows = cursor.fetchall()
        notifications = [dict(r) for r in rows]

    return {
        "farmer_id": farmer_id,
        "count": len(notifications),
        "notifications": notifications
    }

