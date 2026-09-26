"""
Verification script for CropSafe Disease Outbreak Map API.
Tests:
1. Fetching all seeded outbreak reports.
2. Submitting a new disease outbreak report.
3. Upvoting an outbreak report.
4. Adding a community comment.
5. Querying nearby outbreaks within 50 km (Haversine distance).
"""
import urllib.request
import json

BASE_URL = "http://localhost:8000/api/map"

def test_api():
    print(">>> Testing GET /api/map/reports ...")
    req = urllib.request.Request(f"{BASE_URL}/reports")
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print(f"Total reports retrieved: {data['count']}")
        assert data['count'] >= 7, "Expected at least 7 seeded reports"
        sample_report = data['reports'][0]
        print(f"Sample report: {sample_report['disease_name']} in {sample_report['district']}, {sample_report['state']}")

    print("\n>>> Testing POST /api/map/reports (New sighting) ...")
    new_report_payload = {
        "crop": "wheat",
        "disease_name": "Yellow Rust",
        "disease_name_hi": "पीला रतुआ",
        "severity": "High",
        "lat": 29.9695,
        "lon": 76.8783,
        "district": "Kurukshetra",
        "state": "Haryana",
        "description": "Yellow stripes observed on 2 acres of wheat in Ladwa block.",
        "reporter_name": "Kuldeep Singh",
        "reporter_phone": "9871122334",
        "is_ai_verified": True
    }
    req = urllib.request.Request(
        f"{BASE_URL}/reports",
        data=json.dumps(new_report_payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        created_id = res['report']['id']
        print(f"Created report ID: {created_id} (Status: {res['status']})")
        assert created_id > 0

    print(f"\n>>> Testing POST /api/map/reports/{created_id}/upvote ...")
    req = urllib.request.Request(f"{BASE_URL}/reports/{created_id}/upvote", data=b'', method='POST')
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        print(f"Updated upvotes: {res['upvotes']}")
        assert res['upvotes'] == 1

    print(f"\n>>> Testing POST /api/map/reports/{created_id}/comment ...")
    comment_payload = {
        "farmer_name": "Satpal Farmer",
        "comment_text": "I am in Shahbad nearby, I will inspect my crop today!"
    }
    req = urllib.request.Request(
        f"{BASE_URL}/reports/{created_id}/comment",
        data=json.dumps(comment_payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        print(f"Comment added by {res['comment']['farmer_name']}: {res['comment']['comment_text']}")

    print("\n>>> Testing GET /api/map/reports/nearby/alerts (Near Karnal ~35km from Kurukshetra) ...")
    req = urllib.request.Request(f"{BASE_URL}/reports/nearby/alerts?lat=29.6857&lon=76.9905&radius_km=40")
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        print(f"Nearby outbreaks found within 40 km: {res['count']}")
        for r in res['reports']:
            print(f"  - {r['disease_name']} ({r['district']}): {r['distance_km']} km away [Severity: {r['severity']}]")
        assert res['count'] >= 2, "Expected at least 2 reports near Karnal/Kurukshetra"

    print("\n[SUCCESS] All Outbreak Map API tests passed 100%!")

if __name__ == "__main__":
    test_api()
