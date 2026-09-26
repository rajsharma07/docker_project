import os
import sqlite3

from flask import Flask, request, jsonify

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
DATABASE = os.path.join(DATA_DIR, "todo.db")


def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def initialize_database():
    os.makedirs(DATA_DIR, exist_ok=True)
    conn = get_db_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS todos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            completed INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()


@app.get("/")
def home():
    return jsonify({
        "message": "Todo Flask API is running",
        "endpoints": [
            "GET /api/todos",
            "POST /api/todos",
            "PUT /api/todos/<id>",
            "DELETE /api/todos/<id>"
        ]
    })


@app.get("/api/todos")
def get_todos():
    conn = get_db_connection()
    todos = conn.execute(
        "SELECT id, title, completed, created_at "
        "FROM todos ORDER BY id DESC"
    ).fetchall()
    conn.close()

    return jsonify([dict(todo) for todo in todos])


@app.post("/api/todos")
def create_todo():
    data = request.get_json(silent=True) or {}
    title = str(data.get("title", "")).strip()

    if not title:
        return jsonify({"error": "Todo title is required"}), 400

    conn = get_db_connection()
    cursor = conn.execute(
        "INSERT INTO todos (title, completed) VALUES (?, 0)",
        (title,)
    )
    conn.commit()

    todo = conn.execute(
        "SELECT id, title, completed, created_at FROM todos WHERE id = ?",
        (cursor.lastrowid,)
    ).fetchone()
    conn.close()

    return jsonify(dict(todo)), 201


@app.put("/api/todos/<int:todo_id>")
def update_todo(todo_id):
    data = request.get_json(silent=True) or {}
    completed = bool(data.get("completed", False))

    conn = get_db_connection()
    cursor = conn.execute(
        "UPDATE todos SET completed = ? WHERE id = ?",
        (1 if completed else 0, todo_id)
    )
    conn.commit()

    if cursor.rowcount == 0:
        conn.close()
        return jsonify({"error": "Todo not found"}), 404

    todo = conn.execute(
        "SELECT id, title, completed, created_at FROM todos WHERE id = ?",
        (todo_id,)
    ).fetchone()
    conn.close()

    return jsonify(dict(todo))


@app.delete("/api/todos/<int:todo_id>")
def delete_todo(todo_id):
    conn = get_db_connection()
    cursor = conn.execute(
        "DELETE FROM todos WHERE id = ?",
        (todo_id,)
    )
    conn.commit()
    conn.close()

    if cursor.rowcount == 0:
        return jsonify({"error": "Todo not found"}), 404

    return jsonify({"message": "Todo deleted successfully"})


if __name__ == "__main__":
    initialize_database()
    app.run(host="0.0.0.0", port=5000)
