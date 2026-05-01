import os
import requests
from datetime import datetime, timezone, timedelta
from functools import wraps
from flask import Flask, request, jsonify
from flask_cors import CORS
import pymysql.cursors
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# ── KONFIGURASI ──────────────────────────────────────────
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
CORS(app, origins=ALLOWED_ORIGINS)

DB_CONFIG = {
    "host":         os.getenv("DB_HOST", "db"),
    "port":         int(os.getenv("DB_PORT", "3306")),
    "db":           os.getenv("DB_NAME", "santai_tracker"),
    "user":         os.getenv("DB_USER", "santai"),
    "password":     os.getenv("DB_PASSWORD", ""),
    "charset":      "utf8mb4",
    "cursorclass":  pymysql.cursors.DictCursor,
}

API_SECRET       = os.getenv("API_SECRET", "rahasia")
IPINFO_TOKEN     = os.getenv("IPINFO_TOKEN", "")
COOLDOWN_MINUTES = int(os.getenv("COOLDOWN_MINUTES", "30"))
WITA             = timezone(timedelta(hours=8))

# ── FUNGSI PENDUKUNG ─────────────────────────────────────
def get_db():
    return pymysql.connect(**DB_CONFIG)

def get_ip():
    forwarded = request.headers.get("X-Forwarded-For")
    return forwarded.split(",")[0].strip() if forwarded else (request.remote_addr or "unknown")

def get_geo_from_ip(ip_address):
    if ip_address.startswith(("127.", "192.168.", "10.", "172.")):
        return "Local", "Local"
    try:
        token_param = f"?token={IPINFO_TOKEN}" if IPINFO_TOKEN else ""
        resp = requests.get(f"https://ipinfo.io/{ip_address}/json{token_param}", timeout=3).json()
        return resp.get("country", "Unknown"), resp.get("city", "Unknown")
    except:
        return "Unknown", "Unknown"

def require_secret(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if request.args.get("secret") != API_SECRET and request.headers.get("X-API-Secret") != API_SECRET:
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return wrapper

# ── ENDPOINTS ────────────────────────────────────────────
@app.route("/track", methods=["POST"])
def track():
    data = request.get_json(silent=True) or {}
    click_raw = data.get("type", "").lower().strip()
    
    map_click = {"whatsapp": "Wa", "instagram": "ig", "maps": "lokasi", "email": "email"}
    if click_raw not in map_click:
        return jsonify({"error": "Invalid type"}), 400

    click_val = map_click[click_raw]
    visit_val = "Santai Recovery Spa"
    ip = get_ip()
    country, city = get_geo_from_ip(ip)
    
    try:
        conn = get_db()
        with conn.cursor() as cur:
            cur.execute(f"SELECT last_clicked FROM ip_cooldown WHERE ip_address=%s AND click_type=%s AND last_clicked > NOW() - INTERVAL %s MINUTE", (ip, click_val, COOLDOWN_MINUTES))
            if cur.fetchone():
                conn.close()
                return jsonify({"status": "cooldown"}), 429

            cur.execute("""INSERT INTO click_logs (IP_Address, Visit, Click, City, Country, Timestamp) 
                           VALUES (%s, %s, %s, %s, %s, NOW())""",
                        (ip, visit_val, click_val, city, country))
            
            cur.execute("INSERT INTO ip_cooldown (ip_address, click_type, last_clicked) VALUES (%s, %s, NOW()) ON DUPLICATE KEY UPDATE last_clicked=NOW()", (ip, click_val))
            conn.commit()
        conn.close()
        return jsonify({"status": "ok"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/ips", methods=["GET"])
@require_secret
def ips():
    try:
        conn = get_db()
        with conn.cursor() as cur:
            # Menggabungkan Click dari IP yang sama di hari yang sama (Pemisah Koma)
            cur.execute("""
                SELECT 
                    IP_Address, 
                    Visit, 
                    GROUP_CONCAT(DISTINCT Click ORDER BY Timestamp ASC SEPARATOR ', ') AS Click, 
                    City, 
                    Country, 
                    MAX(Timestamp) AS Timestamp
                FROM click_logs
                GROUP BY IP_Address, Visit, City, Country, DATE(Timestamp)
                ORDER BY Timestamp DESC
                LIMIT 500
            """)
            data = cur.fetchall()
        conn.close()
        
        # Format Timestamp & Penomoran otomatis dari 1, 2, 3...
        result = []
        for index, row in enumerate(data):
            if row.get("Timestamp"):
                row["Timestamp"] = row["Timestamp"].strftime("%H:%M %d-%m-%Y")
            
            result.append({
                "No": index + 1,
                "IP_Address": row["IP_Address"],
                "Visit": row["Visit"],
                "Click": row["Click"],
                "City": row["City"],
                "Country": row["Country"],
                "Timestamp": row["Timestamp"]
            })
            
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host=os.getenv("HOST", "0.0.0.0"), port=int(os.getenv("PORT", 5000)))
