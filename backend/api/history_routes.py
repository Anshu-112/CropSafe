"""
API routes for Farmer Profile, Diagnosis History, Prescriptions,
and Follow-up Status tracking.
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import json
from datetime import datetime

from database.db import get_db

router = APIRouter(prefix="/api", tags=["history"])

# ----------------- Pydantic Models -----------------

class FarmerLoginRequest(BaseModel):
    phone: str = Field(..., description="10-digit mobile number")
    name: Optional[str] = Field(None, description="Farmer's name")
    location_name: Optional[str] = Field(None, description="Village, District or State")
    lat: Optional[float] = None
    lon: Optional[float] = None

class FarmerProfileUpdate(BaseModel):
    name: Optional[str] = None
    location_name: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None

class DiagnosisRecordCreate(BaseModel):
    farmer_id: int
    crop: str
    disease_name: str
    disease_name_hi: Optional[str] = None
    confidence: Optional[float] = 0.0
    severity_level: Optional[str] = "Medium"
    severity_percentage: Optional[float] = 0.0
    symptoms: Optional[List[str]] = []
    symptoms_hi: Optional[List[str]] = []
    remedies: Optional[List[str]] = []
    remedies_hi: Optional[List[str]] = []
    expert_advice: Optional[str] = None
    expert_advice_hi: Optional[str] = None
    emergency_contact: Optional[str] = "1800-180-1551"
    image_preview: Optional[str] = None
    follow_up_status: Optional[str] = "PENDING_TREATMENT"  # PENDING_TREATMENT, TREATED, RESOLVED, EXPERT_HELP_NEEDED
    notes: Optional[str] = None

class StatusUpdateRequest(BaseModel):
    follow_up_status: str
    notes: Optional[str] = None

class WeatherAlertCreate(BaseModel):
    farmer_id: int
    crop: str
    risk_level: str
    primary_disease: Optional[str] = None
    primary_disease_hi: Optional[str] = None
    summary: Optional[str] = None
    summary_hi: Optional[str] = None

# ----------------- Helper Functions -----------------

def parse_json_field(val: Optional[str]) -> List[str]:
    if not val:
        return []
    try:
        return json.loads(val)
    except Exception:
        return [val]

def format_diagnosis_row(row) -> Dict[str, Any]:
    return {
        "id": row["id"],
        "farmer_id": row["farmer_id"],
        "crop": row["crop"],
        "disease_name": row["disease_name"],
        "disease_name_hi": row["disease_name_hi"],
        "confidence": row["confidence"],
        "severity_level": row["severity_level"],
        "severity_percentage": row["severity_percentage"],
        "symptoms": parse_json_field(row["symptoms"]),
        "symptoms_hi": parse_json_field(row["symptoms_hi"]),
        "remedies": parse_json_field(row["remedies"]),
        "remedies_hi": parse_json_field(row["remedies_hi"]),
        "expert_advice": row["expert_advice"],
        "expert_advice_hi": row["expert_advice_hi"],
        "emergency_contact": row["emergency_contact"],
        "image_preview": row["image_preview"],
        "follow_up_status": row["follow_up_status"],
        "notes": row["notes"],
        "created_at": row["created_at"]
    }

# ----------------- Farmer Profile Endpoints -----------------

@router.post("/farmers/login")
async def login_or_register_farmer(data: FarmerLoginRequest):
    """
    Login or register farmer using phone number.
    Auto-creates profile if phone does not exist.
    """
    phone_clean = data.phone.strip().replace(" ", "").replace("-", "")
    if len(phone_clean) < 10:
        raise HTTPException(status_code=400, detail="Please provide a valid 10-digit phone number.")
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM farmers WHERE phone = ?", (phone_clean,))
        farmer = cursor.fetchone()
        
        if farmer:
            # Update name/location if newly provided
            updates = []
            params = []
            if data.name and not farmer["name"]:
                updates.append("name = ?")
                params.append(data.name.strip())
            if data.location_name and not farmer["location_name"]:
                updates.append("location_name = ?")
                params.append(data.location_name.strip())
            if data.lat is not None:
                updates.append("lat = ?")
                params.append(data.lat)
            if data.lon is not None:
                updates.append("lon = ?")
                params.append(data.lon)
                
            if updates:
                params.append(farmer["id"])
                cursor.execute(f"UPDATE farmers SET {', '.join(updates)} WHERE id = ?", params)
                cursor.execute("SELECT * FROM farmers WHERE id = ?", (farmer["id"],))
                farmer = cursor.fetchone()
        else:
            cursor.execute("""
                INSERT INTO farmers (phone, name, location_name, lat, lon)
                VALUES (?, ?, ?, ?, ?)
            """, (
                phone_clean,
                data.name.strip() if data.name else f"Farmer {phone_clean[-4:]}",
                data.location_name.strip() if data.location_name else None,
                data.lat,
                data.lon
            ))
            farmer_id = cursor.lastrowid
            cursor.execute("SELECT * FROM farmers WHERE id = ?", (farmer_id,))
            farmer = cursor.fetchone()

        return {
            "success": True,
            "farmer": {
                "id": farmer["id"],
                "phone": farmer["phone"],
                "name": farmer["name"],
                "location_name": farmer["location_name"],
                "lat": farmer["lat"],
                "lon": farmer["lon"],
                "created_at": farmer["created_at"]
            }
        }

@router.get("/farmers/{farmer_id_or_phone}")
async def get_farmer_profile(farmer_id_or_phone: str):
    """Retrieve farmer profile by ID or phone number."""
    with get_db() as conn:
        cursor = conn.cursor()
        if farmer_id_or_phone.isdigit() and len(farmer_id_or_phone) < 10:
            cursor.execute("SELECT * FROM farmers WHERE id = ?", (int(farmer_id_or_phone),))
        else:
            clean_phone = farmer_id_or_phone.replace(" ", "").replace("-", "")
            cursor.execute("SELECT * FROM farmers WHERE phone = ?", (clean_phone,))
            
        farmer = cursor.fetchone()
        if not farmer:
            raise HTTPException(status_code=404, detail="Farmer profile not found.")
            
        return {
            "success": True,
            "farmer": {
                "id": farmer["id"],
                "phone": farmer["phone"],
                "name": farmer["name"],
                "location_name": farmer["location_name"],
                "lat": farmer["lat"],
                "lon": farmer["lon"],
                "created_at": farmer["created_at"]
            }
        }

@router.put("/farmers/{farmer_id}")
async def update_farmer_profile(farmer_id: int, data: FarmerProfileUpdate):
    """Update farmer profile details."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM farmers WHERE id = ?", (farmer_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Farmer not found.")
            
        updates = []
        params = []
        if data.name is not None:
            updates.append("name = ?")
            params.append(data.name.strip())
        if data.location_name is not None:
            updates.append("location_name = ?")
            params.append(data.location_name.strip())
        if data.lat is not None:
            updates.append("lat = ?")
            params.append(data.lat)
        if data.lon is not None:
            updates.append("lon = ?")
            params.append(data.lon)
            
        if updates:
            params.append(farmer_id)
            cursor.execute(f"UPDATE farmers SET {', '.join(updates)} WHERE id = ?", params)
            
        cursor.execute("SELECT * FROM farmers WHERE id = ?", (farmer_id,))
        farmer = cursor.fetchone()
        return {
            "success": True,
            "farmer": dict(farmer)
        }

# ----------------- Diagnosis History Endpoints -----------------

@router.post("/history")
async def save_diagnosis_record(data: DiagnosisRecordCreate):
    """Save a disease diagnosis scan, prescriptions, and follow-up status."""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Verify farmer exists
        cursor.execute("SELECT id FROM farmers WHERE id = ?", (data.farmer_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Farmer ID not found. Please log in.")
            
        cursor.execute("""
            INSERT INTO diagnosis_history (
                farmer_id, crop, disease_name, disease_name_hi,
                confidence, severity_level, severity_percentage,
                symptoms, symptoms_hi, remedies, remedies_hi,
                expert_advice, expert_advice_hi, emergency_contact,
                image_preview, follow_up_status, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data.farmer_id,
            data.crop.lower(),
            data.disease_name,
            data.disease_name_hi,
            data.confidence,
            data.severity_level,
            data.severity_percentage,
            json.dumps(data.symptoms or []),
            json.dumps(data.symptoms_hi or []),
            json.dumps(data.remedies or []),
            json.dumps(data.remedies_hi or []),
            data.expert_advice,
            data.expert_advice_hi,
            data.emergency_contact or "1800-180-1551",
            data.image_preview,
            data.follow_up_status or "PENDING_TREATMENT",
            data.notes
        ))
        
        record_id = cursor.lastrowid
        cursor.execute("SELECT * FROM diagnosis_history WHERE id = ?", (record_id,))
        row = cursor.fetchone()
        
        return {
            "success": True,
            "message": "Diagnosis record saved successfully.",
            "record": format_diagnosis_row(row)
        }

@router.get("/history/farmer/{farmer_id}")
async def get_farmer_diagnosis_history(
    farmer_id: int,
    crop: Optional[str] = Query(None, description="Filter by crop (wheat/rice)"),
    status: Optional[str] = Query(None, description="Filter by follow_up_status")
):
    """Retrieve full diagnosis history and prescriptions for a farmer."""
    with get_db() as conn:
        cursor = conn.cursor()
        
        query = "SELECT * FROM diagnosis_history WHERE farmer_id = ?"
        params: List[Any] = [farmer_id]
        
        if crop and crop.lower() != "all":
            query += " AND LOWER(crop) = ?"
            params.append(crop.lower())
            
        if status and status.upper() != "ALL":
            query += " AND follow_up_status = ?"
            params.append(status.upper())
            
        query += " ORDER BY created_at DESC"
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        # Summary counts
        cursor.execute("""
            SELECT 
                COUNT(*) as total_scans,
                SUM(CASE WHEN follow_up_status = 'PENDING_TREATMENT' THEN 1 ELSE 0 END) as pending_count,
                SUM(CASE WHEN follow_up_status = 'TREATED' THEN 1 ELSE 0 END) as treated_count,
                SUM(CASE WHEN follow_up_status = 'RESOLVED' THEN 1 ELSE 0 END) as resolved_count,
                SUM(CASE WHEN follow_up_status = 'EXPERT_HELP_NEEDED' THEN 1 ELSE 0 END) as expert_needed_count
            FROM diagnosis_history WHERE farmer_id = ?
        """, (farmer_id,))
        summary_row = cursor.fetchone()
        
        return {
            "success": True,
            "total": len(rows),
            "summary": {
                "total_scans": summary_row["total_scans"] or 0,
                "pending_count": summary_row["pending_count"] or 0,
                "treated_count": summary_row["treated_count"] or 0,
                "resolved_count": summary_row["resolved_count"] or 0,
                "expert_needed_count": summary_row["expert_needed_count"] or 0,
            },
            "records": [format_diagnosis_row(r) for r in rows]
        }

@router.patch("/history/{history_id}/status")
async def update_follow_up_status(history_id: int, data: StatusUpdateRequest):
    """Update follow-up status (e.g. TREATED, RESOLVED) and notes."""
    valid_statuses = ["PENDING_TREATMENT", "TREATED", "RESOLVED", "EXPERT_HELP_NEEDED"]
    normalized_status = data.follow_up_status.upper()
    if normalized_status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{data.follow_up_status}'. Must be one of: {', '.join(valid_statuses)}"
        )
        
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM diagnosis_history WHERE id = ?", (history_id,))
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Diagnosis record not found.")
            
        if data.notes is not None:
            cursor.execute("""
                UPDATE diagnosis_history
                SET follow_up_status = ?, notes = ?
                WHERE id = ?
            """, (normalized_status, data.notes, history_id))
        else:
            cursor.execute("""
                UPDATE diagnosis_history
                SET follow_up_status = ?
                WHERE id = ?
            """, (normalized_status, history_id))
            
        cursor.execute("SELECT * FROM diagnosis_history WHERE id = ?", (history_id,))
        updated = cursor.fetchone()
        return {
            "success": True,
            "message": "Follow-up status updated successfully.",
            "record": format_diagnosis_row(updated)
        }

@router.delete("/history/{history_id}")
async def delete_diagnosis_record(history_id: int):
    """Delete a diagnosis record."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM diagnosis_history WHERE id = ?", (history_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Diagnosis record not found.")
            
        cursor.execute("DELETE FROM diagnosis_history WHERE id = ?", (history_id,))
        return {"success": True, "message": "Record deleted successfully."}

# ----------------- Weather Alert History Endpoints -----------------

@router.post("/history/weather-alert")
async def save_weather_alert_record(data: WeatherAlertCreate):
    """Save an active weather-based disease risk alert for the farmer."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM farmers WHERE id = ?", (data.farmer_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Farmer not found.")
            
        cursor.execute("""
            INSERT INTO saved_weather_alerts (
                farmer_id, crop, risk_level, primary_disease,
                primary_disease_hi, summary, summary_hi
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            data.farmer_id,
            data.crop.lower(),
            data.risk_level.upper(),
            data.primary_disease,
            data.primary_disease_hi,
            data.summary,
            data.summary_hi
        ))
        alert_id = cursor.lastrowid
        cursor.execute("SELECT * FROM saved_weather_alerts WHERE id = ?", (alert_id,))
        row = cursor.fetchone()
        return {
            "success": True,
            "message": "Weather alert saved.",
            "alert": dict(row)
        }

@router.get("/history/weather-alert/{farmer_id}")
async def get_farmer_weather_alerts(farmer_id: int):
    """Get all saved weather alerts for a farmer."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM saved_weather_alerts
            WHERE farmer_id = ?
            ORDER BY created_at DESC
        """, (farmer_id,))
        rows = cursor.fetchall()
        return {
            "success": True,
            "alerts": [dict(r) for r in rows]
        }

@router.delete("/history/weather-alert/{alert_id}")
async def delete_weather_alert(alert_id: int):
    """Delete a saved weather alert."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM saved_weather_alerts WHERE id = ?", (alert_id,))
        return {"success": True, "message": "Weather alert deleted."}
