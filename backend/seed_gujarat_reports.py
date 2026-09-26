import sqlite3

def seed_gujarat():
    conn = sqlite3.connect("cropsafe.db")
    cursor = conn.cursor()
    
    # Check if Vadodara report already exists
    cursor.execute("SELECT COUNT(*) FROM disease_outbreak_reports WHERE district = 'Vadodara'")
    count = cursor.fetchone()[0]
    if count == 0:
        reports = [
            (
                "Pravinbhai Patel", "9898123456", "rice", "Blast Disease", "झोंका रोग",
                "Moderate", 22.3072, 73.1812, "Vadodara", "Gujarat",
                "Spindle-shaped blast spots on paddy foliage near Karjan canal. Advised tricyclazole spray.",
                None, 1, 9
            ),
            (
                "Ketan Shah", "9898654321", "wheat", "Brown Rust", "भूरा रतुआ",
                "Low", 22.5645, 72.9289, "Anand", "Gujarat",
                "Early leaf rust pustules spotted in irrigated wheat crop. Monitoring closely.",
                None, 1, 5
            ),
            (
                "Bharat Solanki", "9879112233", "rice", "Bacterial Leaf Blight", "जीवाणु पत्ती झुलसा",
                "High", 22.7533, 72.6847, "Kheda", "Gujarat",
                "Water-soaked lesions turning yellow-white on leaf tips. Nitrogen top-dressing halted.",
                None, 1, 12
            )
        ]
        cursor.executemany("""
            INSERT INTO disease_outbreak_reports (
                reporter_name, reporter_phone, crop, disease_name, disease_name_hi,
                severity, lat, lon, district, state,
                description, image_url, is_ai_verified, upvotes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, reports)
        conn.commit()
        print(f"Added {len(reports)} Gujarat outbreak reports successfully!")
    else:
        print(f"Vadodara reports already exist ({count}).")
    conn.close()

if __name__ == "__main__":
    seed_gujarat()
