import math
import os
import urllib.parse
from typing import List, Dict, Any, Optional
from database.db import get_db

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees) using Haversine formula.
    """
    R = 6371.0  # Earth radius in kilometers
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

def mask_phone(phone: str) -> str:
    """Masks phone number for privacy: e.g. 9898123456 -> +91 98981-XXXX-56"""
    clean = "".join(filter(str.isdigit, str(phone)))
    if len(clean) >= 10:
        return f"+91 {clean[:5]}-XXXX-{clean[-2:]}"
    return f"{clean[:3]}-XXXX-{clean[-2:]}" if len(clean) > 5 else clean

def get_nearby_farmers(report_lat: float, report_lon: float, radius_km: float = 35.0, exclude_farmer_id: Optional[int] = None) -> List[Dict[str, Any]]:
    """
    Finds all registered farmers located within radius_km of the given coordinates.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, name, phone, location_name, lat, lon
            FROM farmers
            WHERE lat IS NOT NULL AND lon IS NOT NULL
        """)
        rows = cursor.fetchall()

    nearby = []
    for r in rows:
        f_id, name, phone, loc, f_lat, f_lon = r
        if exclude_farmer_id and f_id == exclude_farmer_id:
            continue
        dist = haversine_km(report_lat, report_lon, f_lat, f_lon)
        if dist <= radius_km:
            nearby.append({
                "farmer_id": f_id,
                "name": name,
                "phone": phone,
                "masked_phone": mask_phone(phone),
                "location_name": loc or "Local Farm",
                "lat": f_lat,
                "lon": f_lon,
                "distance_km": dist
            })

    nearby.sort(key=lambda x: x["distance_km"])
    return nearby

def generate_alert_messages(report: Dict[str, Any], distance_km: float, custom_note: Optional[str] = None) -> Dict[str, str]:
    """
    Generates tailored, high-urgency emergency advisory messages in Hindi and English.
    """
    crop = str(report.get("crop", "crop")).lower()
    crop_names_hi = {
        "wheat": "गेहूं",
        "rice": "धान",
        "cotton": "कपास",
        "potato": "आलू",
        "tomato": "टमाटर",
        "maize": "मक्का",
        "sugarcane": "गन्ना",
        "mustard": "सरसों",
        "soybean": "सोयाबीन",
        "onion": "प्याज",
        "chili": "मिर्च"
    }
    crop_hi = crop_names_hi.get(crop, report.get("crop", "फसल"))
    crop_en = str(report.get("crop", "Crop")).capitalize()
    
    disease_en = report.get("disease_name", "Crop Disease")
    disease_hi = report.get("disease_name_hi") or disease_en
    severity = report.get("severity", "Moderate")
    severity_hi = "🔴 उच्च जोखिम" if severity.lower() == "high" else ("🟠 मध्यम जोखिम" if severity.lower() == "moderate" else "🟡 निगरानी")
    
    district = report.get("district", "आपके पास")
    report_id = report.get("id", 1)
    
    note_hi = f"\nकिसान का संदेश: {custom_note}" if custom_note else ""
    note_en = f"\nFarmer Note: {custom_note}" if custom_note else ""

    hi_msg = (
        f"🚨 [CropSafe आपातकालीन अलर्ट]\n"
        f"सावधान किसान भाई! आपके खेत से केवल {distance_km} किमी दूर ({district}) में {crop_hi} की फसल में '{disease_hi}' ({severity_hi}) का प्रकोप देखा गया है।\n"
        f"कृपया तुरंत अपने खेत की पत्तियों की जांच करें और नजदीकी कृषि सेवा केंद्र से संपर्क करें।{note_hi}\n"
        f"📍 लाइव नक्शा व दवा की जानकारी: http://localhost:3000/map\n"
        f"📞 किसान हेल्पलाइन: 1800-180-1551"
    )

    en_msg = (
        f"🚨 [CropSafe Emergency Alert]\n"
        f"Warning: '{disease_en}' ({severity} severity) confirmed on {crop_en} crops just {distance_km} km from your farm in {district}.\n"
        f"Inspect your crops immediately and take preventive fungicide measures.{note_en}\n"
        f"📍 View Live Outbreak Map & Advisories: http://localhost:3000/map\n"
        f"📞 Kisan Call Center: 1800-180-1551"
    )

    return {
        "hindi": hi_msg,
        "english": en_msg
    }

def generate_whatsapp_link(phone: str, text: str) -> str:
    """Generates direct WhatsApp Click-to-Chat URL."""
    clean_digits = "".join(filter(str.isdigit, str(phone)))
    if len(clean_digits) == 10:
        clean_digits = "91" + clean_digits
    encoded_text = urllib.parse.quote(text)
    return f"https://api.whatsapp.com/send?phone={clean_digits}&text={encoded_text}"

def generate_whatsapp_group_link(text: str) -> str:
    """Generates direct WhatsApp Share URL for Kisan WhatsApp Groups."""
    encoded_text = urllib.parse.quote(text)
    return f"https://api.whatsapp.com/send?text={encoded_text}"

def send_real_sms(phone: str, message: str) -> Dict[str, Any]:
    """
    Attempts to send real SMS via Twilio or Fast2SMS if configured in .env.
    Falls back gracefully to simulated delivery.
    """
    twilio_sid = os.getenv("TWILIO_ACCOUNT_SID")
    twilio_token = os.getenv("TWILIO_AUTH_TOKEN")
    twilio_from = os.getenv("TWILIO_PHONE_NUMBER")
    
    if twilio_sid and twilio_token and twilio_from:
        try:
            from twilio.rest import Client
            client = Client(twilio_sid, twilio_token)
            clean_digits = "".join(filter(str.isdigit, str(phone)))
            to_phone = f"+91{clean_digits}" if len(clean_digits) == 10 else f"+{clean_digits}"
            msg = client.messages.create(
                body=message,
                from_=twilio_from,
                to=to_phone
            )
            return {"success": True, "provider": "Twilio", "status": "DELIVERED", "msg_id": msg.sid}
        except Exception as e:
            return {"success": False, "provider": "Twilio", "error": str(e), "status": "FAILED"}

    fast2sms_key = os.getenv("FAST2SMS_API_KEY")
    if fast2sms_key:
        try:
            import requests
            clean_digits = "".join(filter(str.isdigit, str(phone)))[-10:]
            res = requests.post(
                "https://www.fast2sms.com/dev/bulkV2",
                headers={"authorization": fast2sms_key},
                data={
                    "route": "v3",
                    "sender_id": "TXTIND",
                    "message": message,
                    "language": "unicode",
                    "numbers": clean_digits,
                },
                timeout=8
            )
            if res.status_code == 200:
                return {"success": True, "provider": "Fast2SMS", "status": "DELIVERED"}
        except Exception as e:
            return {"success": False, "provider": "Fast2SMS", "error": str(e), "status": "FAILED"}

    # Simulation Mode (Production-ready logging without external balance costs)
    return {"success": True, "provider": "CropSafe Sandbox", "status": "DELIVERED (SIMULATED)"}

def dispatch_outbreak_alerts(
    report_id: int,
    radius_km: float = 35.0,
    channels: List[str] = ["SMS", "WHATSAPP"],
    custom_note: Optional[str] = None
) -> Dict[str, Any]:
    """
    Dispatches alerts to all farmers residing within radius_km of the outbreak report.
    Logs dispatch records in outbreak_alerts_dispatched SQLite table.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM disease_outbreak_reports WHERE id = ?", (report_id,))
        row = cursor.fetchone()
        if not row:
            raise ValueError(f"Outbreak report with ID {report_id} not found")
        
        cols = [d[0] for d in cursor.description]
        report = dict(zip(cols, row))

    report_lat = float(report["lat"])
    report_lon = float(report["lon"])

    nearby_farmers = get_nearby_farmers(report_lat, report_lon, radius_km=radius_km)
    
    dispatched_records = []
    whatsapp_share_links = []
    
    # Generate generic Kisan WhatsApp group broadcast text
    default_msgs = generate_alert_messages(report, distance_km=round(radius_km, 1), custom_note=custom_note)
    group_whatsapp_url = generate_whatsapp_group_link(default_msgs["hindi"])

    with get_db() as conn:
        cursor = conn.cursor()
        for farmer in nearby_farmers:
            dist = farmer["distance_km"]
            msgs = generate_alert_messages(report, distance_km=dist, custom_note=custom_note)
            selected_msg = msgs["hindi"]  # Default Hindi for Indian farmer network

            for channel in channels:
                chan = channel.upper().strip()
                delivery_status = "DELIVERED"

                if chan == "SMS":
                    sms_result = send_real_sms(farmer["phone"], selected_msg)
                    delivery_status = sms_result.get("status", "DELIVERED (SIMULATED)")

                elif chan == "WHATSAPP":
                    # WhatsApp is prepared with direct Click-to-Chat URL
                    delivery_status = "QUEUED_WHATSAPP"
                    wa_url = generate_whatsapp_link(farmer["phone"], selected_msg)
                    whatsapp_share_links.append({
                        "farmer_name": farmer["name"],
                        "phone": farmer["phone"],
                        "masked_phone": farmer["masked_phone"],
                        "distance_km": dist,
                        "url": wa_url
                    })

                cursor.execute("""
                    INSERT INTO outbreak_alerts_dispatched (
                        report_id, farmer_id, farmer_name, farmer_phone,
                        distance_km, channel, message_content, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    report_id,
                    farmer["farmer_id"],
                    farmer["name"],
                    farmer["phone"],
                    dist,
                    chan,
                    selected_msg,
                    delivery_status
                ))

                dispatched_records.append({
                    "farmer_id": farmer["farmer_id"],
                    "farmer_name": farmer["name"],
                    "phone": farmer["masked_phone"],
                    "distance_km": dist,
                    "location_name": farmer["location_name"],
                    "channel": chan,
                    "status": delivery_status
                })

        conn.commit()

    return {
        "success": True,
        "report_id": report_id,
        "disease_name": report["disease_name"],
        "disease_name_hi": report.get("disease_name_hi"),
        "district": report["district"],
        "radius_km": radius_km,
        "farmers_count": len(nearby_farmers),
        "alerts_dispatched_count": len(dispatched_records),
        "dispatched_records": dispatched_records,
        "whatsapp_direct_links": whatsapp_share_links,
        "group_whatsapp_url": group_whatsapp_url,
        "message_preview": default_msgs
    }
