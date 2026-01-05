from fastapi import FastAPI
import psycopg2
import psycopg2.extensions

app = FastAPI()

@app.get("/health/live")
def live():
    # NEVER touch external dependencies here
    return {"status": "alive"}

@app.get("/health/ready")
def ready():
    try:
        conn = psycopg2.connect(
            host="postgres",
            dbname="openlake",
            user="openlake",
            password="openlake_dev",
            connect_timeout=2  # IMPORTANT
        )
        conn.close()
        return {"status": "ready"}
    except Exception as e:
        return {"status": "not-ready", "error": str(e)}
