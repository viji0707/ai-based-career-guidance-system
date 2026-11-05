
from flask import Flask, render_template, request, redirect, session, url_for
import sqlite3
import pyotp
import ollama

app = Flask(__name__)
app.secret_key = "secretkey"

DB = "users.db"

def init_db():
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            otp_secret TEXT
        )
    ''')
    conn.commit()
    conn.close()

init_db()

@app.route("/")
def home():
    if "user" in session:
        return render_template("dashboard.html", user=session["user"])
    return redirect(url_for("login"))

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]

        secret = pyotp.random_base32()

        conn = sqlite3.connect(DB)
        c = conn.cursor()

        try:
            c.execute(
                "INSERT INTO users (username,password,otp_secret) VALUES (?,?,?)",
                (username, password, secret)
            )
            conn.commit()
        except:
            return "User already exists"

        conn.close()

        return f"Registered! Your 2FA Secret: {secret}"

    return render_template("register.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]

        conn = sqlite3.connect(DB)
        c = conn.cursor()

        c.execute(
            "SELECT * FROM users WHERE username=? AND password=?",
            (username, password)
        )

        user = c.fetchone()
        conn.close()

        if user:
            session["temp_user"] = username
            return redirect(url_for("verify"))

        return "Invalid credentials"

    return render_template("login.html")

@app.route("/verify", methods=["GET", "POST"])
def verify():
    if request.method == "POST":
        otp = request.form["otp"]

        conn = sqlite3.connect(DB)
        c = conn.cursor()

        c.execute(
            "SELECT otp_secret FROM users WHERE username=?",
            (session["temp_user"],)
        )

        secret = c.fetchone()[0]
        conn.close()

        totp = pyotp.TOTP(secret)

        if totp.verify(otp):
            session["user"] = session["temp_user"]
            return redirect(url_for("home"))

        return "Invalid OTP"

    return render_template("verify.html")

@app.route("/agent", methods=["POST"])
def agent():
    topic = request.form["topic"]

    response = ollama.chat(
        model="llama3",
        messages=[
            {
                "role": "user",
                "content": f"Research and summarize this topic: {topic}"
            }
        ]
    )

    result = response["message"]["content"]

    return render_template(
        "dashboard.html",
        user=session["user"],
        result=result
    )

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))

if __name__ == "__main__":
    app.run(debug=True)
