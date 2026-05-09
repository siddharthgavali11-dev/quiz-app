import sqlite3
import json
import os

DB_NAME = 'quiz_app.db'

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Users Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    ''')

    # Questions Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject TEXT NOT NULL,
            question_text TEXT NOT NULL,
            options TEXT NOT NULL, -- JSON string of options
            correct_option INTEGER NOT NULL -- 0, 1, 2, or 3
        )
    ''')

    # Results Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            subject TEXT NOT NULL,
            score INTEGER NOT NULL,
            total_questions INTEGER NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')

    conn.commit()

    # Insert some default questions if empty
    cursor.execute('SELECT COUNT(*) FROM questions')
    count = cursor.fetchone()[0]
    if count == 0:
        default_questions = [
            ("Data Structures", "Which data structure uses LIFO?", json.dumps(["Queue", "Stack", "Tree", "Graph"]), 1),
            ("Data Structures", "What is the worst-case time complexity of QuickSort?", json.dumps(["O(n)", "O(n log n)", "O(n^2)", "O(1)"]), 2),
            ("Operating Systems", "What is the core of the operating system called?", json.dumps(["Shell", "Kernel", "GUI", "Command Prompt"]), 1),
            ("Operating Systems", "Which scheduling algorithm is non-preemptive?", json.dumps(["Round Robin", "Shortest Remaining Time First", "First Come First Serve", "Multilevel Queue"]), 2),
            ("Programming", "Which language is platform-independent?", json.dumps(["C", "C++", "Java", "Assembly"]), 2),
            ("Programming", "What does 'self' represent in Python?", json.dumps(["A keyword", "The current class instance", "A built-in function", "None of the above"]), 1)
        ]
        cursor.executemany('''
            INSERT INTO questions (subject, question_text, options, correct_option)
            VALUES (?, ?, ?, ?)
        ''', default_questions)
        conn.commit()

    conn.close()

if __name__ == '__main__':
    init_db()
    print("Database initialized.")
