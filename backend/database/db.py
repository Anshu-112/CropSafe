"""
Database connection and schema initialization for CropSafe.
Uses SQLite for zero-configuration, reliable persistence.
"""
import sqlite3
import os
import json
from pathlib import Path
from contextlib import contextmanager

# Database file location in backend directory
DB_PATH = Path(__file__).resolve().parent.parent / "cropsafe.db"

def get_db_connection():
    """Get a connection to the SQLite database with row factory enabled."""
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

@contextmanager
def get_db():
    """Context manager for safe database transactions."""
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    """Create all required tables if they don't already exist."""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Farmers table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS farmers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                phone TEXT UNIQUE NOT NULL,
                name TEXT,
                location_name TEXT,
                lat REAL,
                lon REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # 2. Diagnosis history & prescriptions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS diagnosis_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                farmer_id INTEGER NOT NULL,
                crop TEXT NOT NULL,
                disease_name TEXT NOT NULL,
                disease_name_hi TEXT,
                confidence REAL DEFAULT 0,
                severity_level TEXT DEFAULT 'Medium',
                severity_percentage REAL DEFAULT 0,
                symptoms TEXT,
                symptoms_hi TEXT,
                remedies TEXT,
                remedies_hi TEXT,
                expert_advice TEXT,
                expert_advice_hi TEXT,
                emergency_contact TEXT DEFAULT '1800-180-1551',
                image_preview TEXT,
                follow_up_status TEXT DEFAULT 'PENDING_TREATMENT',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (farmer_id) REFERENCES farmers (id) ON DELETE CASCADE
            )
        """)
        
        # 3. Saved weather alerts table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS saved_weather_alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                farmer_id INTEGER NOT NULL,
                crop TEXT NOT NULL,
                risk_level TEXT NOT NULL,
                primary_disease TEXT,
                primary_disease_hi TEXT,
                summary TEXT,
                summary_hi TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (farmer_id) REFERENCES farmers (id) ON DELETE CASCADE
            )
        """)
        
        # 4. Disease outbreak reports table (Crowdsourced Map)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS disease_outbreak_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                farmer_id INTEGER,
                reporter_name TEXT DEFAULT 'Farmer',
                reporter_phone TEXT,
                crop TEXT NOT NULL,
                disease_name TEXT NOT NULL,
                disease_name_hi TEXT,
                severity TEXT NOT NULL DEFAULT 'Moderate',
                lat REAL NOT NULL,
                lon REAL NOT NULL,
                district TEXT NOT NULL,
                state TEXT NOT NULL,
                description TEXT,
                image_url TEXT,
                is_ai_verified INTEGER DEFAULT 0,
                upvotes INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (farmer_id) REFERENCES farmers (id) ON DELETE SET NULL
            )
        """)
        
        # 5. Report community comments table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS report_comments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_id INTEGER NOT NULL,
                farmer_name TEXT NOT NULL,
                comment_text TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (report_id) REFERENCES disease_outbreak_reports (id) ON DELETE CASCADE
            )
        """)

        # 6. Dispatched emergency outbreak alerts table (SMS & WhatsApp logs)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS outbreak_alerts_dispatched (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_id INTEGER NOT NULL,
                farmer_id INTEGER,
                farmer_name TEXT NOT NULL,
                farmer_phone TEXT NOT NULL,
                distance_km REAL NOT NULL,
                channel TEXT NOT NULL,
                message_content TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'DELIVERED',
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (report_id) REFERENCES disease_outbreak_reports (id) ON DELETE CASCADE,
                FOREIGN KEY (farmer_id) REFERENCES farmers (id) ON DELETE SET NULL
            )
        """)
        
        # Create indexes for fast lookup
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_diagnosis_farmer ON diagnosis_history(farmer_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_weather_farmer ON saved_weather_alerts(farmer_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_farmers_phone ON farmers(phone)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_outbreaks_crop ON disease_outbreak_reports(crop)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_outbreaks_coords ON disease_outbreak_reports(lat, lon)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_comments_report ON report_comments(report_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_alerts_report ON outbreak_alerts_dispatched(report_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_alerts_farmer ON outbreak_alerts_dispatched(farmer_id)")

        # Seed initial realistic outbreak data if empty
        cursor.execute("SELECT COUNT(*) FROM disease_outbreak_reports")
        if cursor.fetchone()[0] == 0:
            seed_outbreaks = [
                (
                    "Ramesh Kumar", "9876543210", "wheat", "Yellow Rust", "पीला रतुआ",
                    "High", 29.6857, 76.9905, "Karnal", "Haryana",
                    "Spotted yellow stripe rust pustules across 3 acres of HD-2967 wheat. Spreading fast due to cool moist wind.",
                    None, 1, 14
                ),
                (
                    "Harpreet Singh", "9812345678", "wheat", "Leaf Blight", "पत्ती झुलसा",
                    "Moderate", 30.9010, 75.8573, "Ludhiana", "Punjab",
                    "Brown necrotic lesions visible on upper flag leaves. Recommend preventive azoxystrobin spray.",
                    None, 1, 8
                ),
                (
                    "Gurpreet Kaur", "9823456789", "wheat", "Powdery Mildew", "चूर्णिल आसिता",
                    "Low", 30.3398, 76.3869, "Patiala", "Punjab",
                    "White powdery fungal patches on lower leaves. Early stage, under watch.",
                    None, 0, 3
                ),
                (
                    "Sanjay Sharma", "9834567890", "wheat", "Brown Rust", "भूरा रतुआ",
                    "High", 28.9845, 77.7064, "Meerut", "Uttar Pradesh",
                    "Circular brown pustules on leaves. High humidity triggering rapid spread across adjacent plots.",
                    None, 1, 19
                ),
                (
                    "Amitabh Roy", "9845678901", "rice", "Blast Disease", "झोंका रोग",
                    "High", 25.5941, 85.1376, "Patna", "Bihar",
                    "Diamond shaped lesions with gray centers on seedling leaves. Immediate Tricyclazole recommended.",
                    None, 1, 22
                ),
                (
                    "Subhasish Ghosh", "9856789012", "rice", "Brown Spot", "भूरा धब्बा",
                    "Moderate", 23.2324, 87.8615, "Burdwan", "West Bengal",
                    "Small circular reddish-brown spots on paddy foliage. Soil nitrogen supplement and fungicide needed.",
                    None, 0, 6
                ),
                (
                    "Virender Hooda", "9867890123", "wheat", "Yellow Rust", "पीला रतुआ",
                    "Moderate", 28.8955, 76.6066, "Rohtak", "Haryana",
                    "Early signs of stripe rust in early-sown wheat. Alert issued to nearby village cooperative.",
                    None, 1, 11
                ),
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
                )
            ]
            cursor.executemany("""
                INSERT INTO disease_outbreak_reports (
                    reporter_name, reporter_phone, crop, disease_name, disease_name_hi,
                    severity, lat, lon, district, state,
                    description, image_url, is_ai_verified, upvotes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, seed_outbreaks)

            # Seed sample comments
            cursor.execute("""
                INSERT INTO report_comments (report_id, farmer_name, comment_text)
                VALUES 
                    (1, 'Suresh Patel', 'I also noticed similar yellow stripes in neighboring village fields yesterday.'),
                    (1, 'Agri Officer Verma', 'Advisory: Spray Propiconazole 25% EC @ 1ml/L within 48 hours.'),
                    (4, 'Rajendra Prasad', 'Confirmed in Modinagar area too. High spore count in morning mist.')
            """)

        # Seed realistic registered farmers across regions for 30-40km alert demonstrations
        cursor.execute("SELECT COUNT(*) FROM farmers")
        if cursor.fetchone()[0] <= 1:
            sample_farmers = [
                # Gujarat (Vadodara & Central Gujarat region)
                ("Pravinbhai Patel", "9898123456", "Padra, Vadodara", 22.2410, 73.0810),       # ~14 km from Vadodara
                ("Jagdishbhai Solanki", "9898234567", "Karjan, Vadodara", 22.0543, 73.1205),   # ~28 km from Vadodara
                ("Bhavesh Parmar", "9898345678", "Dabhoi, Vadodara", 22.1332, 73.4326),       # ~32 km from Vadodara
                ("Jayeshbhai Shah", "9898456789", "Anand District", 22.5645, 72.9289),         # ~38 km from Vadodara
                ("Naresh Chavda", "9898567890", "Waghodia, Vadodara", 22.3012, 73.3854),      # ~20 km from Vadodara
                # Haryana (Karnal wheat belt region)
                ("Surender Malik", "9812123456", "Nilokheri, Karnal", 29.8335, 76.9182),      # ~17 km from Karnal
                ("Balbir Singh", "9812234567", "Gharaunda, Karnal", 29.5392, 76.9723),        # ~16 km from Karnal
                ("Kuldeep Verma", "9812345678", "Taraori, Karnal", 29.8055, 76.9295),          # ~14 km from Karnal
                ("Mohit Sharma", "9812456789", "Panipat District", 29.3909, 76.9635),         # ~33 km from Karnal
                # Punjab (Ludhiana region)
                ("Gurmeet Singh", "9872123456", "Khanna, Ludhiana", 30.7073, 76.2163),        # ~38 km from Ludhiana
                ("Jaswant Singh", "9872234567", "Phillaur, Jalandhar", 31.0210, 75.7876),     # ~15 km from Ludhiana
                ("Balwinder Kaur", "9872345678", "Sahnewal, Ludhiana", 30.8447, 75.9984)      # ~16 km from Ludhiana
            ]
            for name, phone, loc, lat, lon in sample_farmers:
                cursor.execute("""
                    INSERT OR IGNORE INTO farmers (name, phone, location_name, lat, lon)
                    VALUES (?, ?, ?, ?, ?)
                """, (name, phone, loc, lat, lon))

        conn.commit()

    print(f"[OK] SQLite Database initialized at {DB_PATH}")

if __name__ == "__main__":
    init_db()

