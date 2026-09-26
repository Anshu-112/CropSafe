"""
Automated unit and integration tests for SMS & WhatsApp Outbreak Alert Dispatch System.
Tests radius calculations, nearby farmer queries, message generation, and dispatch endpoints.
"""
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
from fastapi.testclient import TestClient
import sqlite3
from main import app
from database.db import get_db
from services.alert_dispatcher import get_nearby_farmers, generate_alert_messages, dispatch_outbreak_alerts

client = TestClient(app)

def test_nearby_farmers_vadodara():
    print("\n--- Test 1: Nearby Farmers within 35-40 km of Vadodara ---")
    # Vadodara coordinates: 22.3072, 73.1812
    farmers = get_nearby_farmers(22.3072, 73.1812, radius_km=35.0)
    print(f"Found {len(farmers)} farmers within 35 km of Vadodara:")
    for f in farmers:
        print(f"  • {f['name']} ({f['location_name']}) - {f['distance_km']} km away [Phone: {f['masked_phone']}]")
    assert len(farmers) >= 3, f"Expected at least 3 farmers within 35 km, got {len(farmers)}"
    assert any("Padra" in f["location_name"] for f in farmers), "Expected farmer in Padra"

def test_nearby_farmers_karnal():
    print("\n--- Test 2: Nearby Farmers within 35 km of Karnal ---")
    # Karnal coordinates: 29.6857, 76.9905
    farmers = get_nearby_farmers(29.6857, 76.9905, radius_km=35.0)
    print(f"Found {len(farmers)} farmers within 35 km of Karnal:")
    for f in farmers:
        print(f"  • {f['name']} ({f['location_name']}) - {f['distance_km']} km away")
    assert len(farmers) >= 3, f"Expected at least 3 farmers near Karnal, got {len(farmers)}"

def test_message_generator():
    print("\n--- Test 3: Emergency Advisory Message Generation ---")
    mock_report = {
        "id": 101,
        "crop": "wheat",
        "disease_name": "Yellow Rust",
        "disease_name_hi": "पीला रतुआ",
        "severity": "High",
        "district": "Vadodara"
    }
    msgs = generate_alert_messages(mock_report, distance_km=14.5, custom_note="तुरंत प्रोपिकोनाजोल का छिड़काव करें")
    assert "CropSafe" in msgs["hindi"]
    assert "14.5 किमी" in msgs["hindi"]
    assert "पीला रतुआ" in msgs["hindi"]
    assert "Yellow Rust" in msgs["english"]
    print("Hindi Message Preview:\n" + msgs["hindi"])

def test_api_nearby_farmers_endpoint():
    print("\n--- Test 4: GET /api/map/reports/{id}/nearby-farmers ---")
    # Get any valid report ID
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, district FROM disease_outbreak_reports LIMIT 1")
        report = cursor.fetchone()
        report_id = report[0]

    res = client.get(f"/api/map/reports/{report_id}/nearby-farmers?radius_km=40")
    assert res.status_code == 200, f"Failed: {res.text}"
    data = res.json()
    assert "farmers" in data
    assert "farmer_count" in data
    print(f"Report ID {report_id} ({data['district']}): Found {data['farmer_count']} farmers within 40 km.")

def test_api_dispatch_alerts_endpoint():
    print("\n--- Test 5: POST /api/map/reports/{id}/dispatch-alerts ---")
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, district FROM disease_outbreak_reports WHERE district = 'Vadodara' LIMIT 1")
        row = cursor.fetchone()
        if not row:
            cursor.execute("SELECT id, district FROM disease_outbreak_reports LIMIT 1")
            row = cursor.fetchone()
        report_id = row[0]

    payload = {
        "radius_km": 35.0,
        "channels": ["SMS", "WHATSAPP"],
        "custom_note": "Immediate field advisory for neighboring farms"
    }
    res = client.post(f"/api/map/reports/{report_id}/dispatch-alerts", json=payload)
    assert res.status_code == 200, f"Failed: {res.text}"
    data = res.json()
    assert data["success"] is True
    assert data["farmers_count"] > 0
    assert len(data["whatsapp_direct_links"]) > 0
    print(f"Successfully dispatched {data['alerts_dispatched_count']} alerts to {data['farmers_count']} farmers!")
    print(f"Sample WhatsApp Click-to-Chat URL: {data['whatsapp_direct_links'][0]['url']}")

def test_api_dispatched_history_endpoint():
    print("\n--- Test 6: GET /api/map/reports/{id}/dispatched-alerts ---")
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT DISTINCT report_id FROM outbreak_alerts_dispatched LIMIT 1")
        row = cursor.fetchone()
        assert row is not None
        report_id = row[0]

    res = client.get(f"/api/map/reports/{report_id}/dispatched-alerts")
    assert res.status_code == 200
    data = res.json()
    assert data["count"] > 0
    print(f"Retrieved {data['count']} past dispatched alert logs for report {report_id}.")

if __name__ == "__main__":
    test_nearby_farmers_vadodara()
    test_nearby_farmers_karnal()
    test_message_generator()
    test_api_nearby_farmers_endpoint()
    test_api_dispatch_alerts_endpoint()
    test_api_dispatched_history_endpoint()
    print("\n🎉 ALL 6 SMS & WHATSAPP ALERT DISPATCH TESTS PASSED PERFECTLY!\n")
