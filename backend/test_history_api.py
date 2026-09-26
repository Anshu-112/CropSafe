"""
Unit test for Farmer Profile & Diagnosis History API
"""
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_farmer_history_flow():
    print("Testing Farmer History Flow...")
    
    # 1. Login or register farmer
    login_payload = {
        "phone": "9876543210",
        "name": "Ramesh Kumar",
        "location_name": "Karnal, Haryana",
        "lat": 29.6857,
        "lon": 76.9905
    }
    res = client.post("/api/farmers/login", json=login_payload)
    assert res.status_code == 200, f"Login failed: {res.text}"
    farmer = res.json()["farmer"]
    farmer_id = farmer["id"]
    print(f"Farmer registered/logged in: ID {farmer_id}, Name: {farmer['name']}")
    
    # 2. Save a diagnosis record with prescriptions
    record_payload = {
        "farmer_id": farmer_id,
        "crop": "wheat",
        "disease_name": "Yellow Rust",
        "disease_name_hi": "पीला रतुआ",
        "confidence": 94.5,
        "severity_level": "High",
        "severity_percentage": 42.0,
        "symptoms": ["Yellow pustules in stripes on leaves"],
        "symptoms_hi": ["पत्तियों पर धारियों में पीले फफोले"],
        "remedies": ["Spray Propiconazole 25 EC @ 1ml/liter water", "Ensure proper drainage"],
        "remedies_hi": ["प्रोपिकोनाजोल 25 ईसी 1 मिली प्रति लीटर पानी में मिलाकर छिड़कें"],
        "expert_advice": "High risk of spreading to adjacent fields.",
        "expert_advice_hi": "पास के खेतों में फैलने का उच्च जोखिम।",
        "emergency_contact": "1800-180-1551",
        "follow_up_status": "PENDING_TREATMENT",
        "notes": "First noticed in north corner of field."
    }
    res = client.post("/api/history", json=record_payload)
    assert res.status_code == 200, f"Save history failed: {res.text}"
    record = res.json()["record"]
    history_id = record["id"]
    print(f"Diagnosis record saved: ID {history_id}, Disease: {record['disease_name']}")
    
    # 3. Retrieve farmer diagnosis history
    res = client.get(f"/api/history/farmer/{farmer_id}")
    assert res.status_code == 200, f"Get history failed: {res.text}"
    data = res.json()
    assert data["total"] >= 1
    assert data["summary"]["total_scans"] >= 1
    print(f"Retrieved history: {data['total']} scans. Summary: {data['summary']}")
    
    # 4. Update follow-up status to TREATED
    update_payload = {
        "follow_up_status": "TREATED",
        "notes": "Sprayed Propiconazole this morning. Weather is clear."
    }
    res = client.patch(f"/api/history/{history_id}/status", json=update_payload)
    assert res.status_code == 200, f"Update status failed: {res.text}"
    updated_rec = res.json()["record"]
    assert updated_rec["follow_up_status"] == "TREATED"
    print(f"Status updated: {updated_rec['follow_up_status']}, Notes: {updated_rec['notes']}")
    
    # 5. Save weather alert
    alert_payload = {
        "farmer_id": farmer_id,
        "crop": "wheat",
        "risk_level": "HIGH",
        "primary_disease": "Yellow Rust",
        "primary_disease_hi": "पीला रतुआ",
        "summary": "High humidity and moderate temps favor rust outbreak in next 4 days.",
        "summary_hi": "अगले 4 दिनों में उच्च आर्द्रता और मध्यम तापमान रतुआ के प्रकोप के अनुकूल हैं।"
    }
    res = client.post("/api/history/weather-alert", json=alert_payload)
    assert res.status_code == 200, f"Save weather alert failed: {res.text}"
    alert_id = res.json()["alert"]["id"]
    print(f"Weather alert saved: ID {alert_id}")
    
    # 6. Retrieve weather alerts
    res = client.get(f"/api/history/weather-alert/{farmer_id}")
    assert res.status_code == 200, f"Get weather alerts failed: {res.text}"
    alerts = res.json()["alerts"]
    assert len(alerts) >= 1
    print(f"Retrieved {len(alerts)} saved weather alerts.")
    
    print("\nALL API TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_farmer_history_flow()
