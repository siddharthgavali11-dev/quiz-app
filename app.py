from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
import sqlite3
import json
import os
from database import init_db, get_db_connection

app = Flask(__name__)
CORS(app)
app.secret_key = 'super_secret_quiz_key_change_in_production'

# Ensure database is initialized
if not os.path.exists('quiz_app.db'):
    init_db()

# --- Page Routes ---
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/quiz')
def quiz():
    if 'user_id' not in session:
        return redirect(url_for('index'))
    return render_template('quiz.html')

@app.route('/admin')
def admin():
    if 'user_id' not in session:
        return redirect(url_for('index'))
    # In a real app, check for admin role. Here we just allow logged in users for demo purposes.
    return render_template('admin.html')

# --- API Routes: Auth ---
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({'error': 'Missing data'}), 400

    hashed_password = generate_password_hash(password)

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', (username, email, hashed_password))
        conn.commit()
        return jsonify({'message': 'User registered successfully'})
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Username or email already exists'}), 400
    finally:
        conn.close()

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    conn = get_db_connection()
    cursor = conn.cursor()
    user = cursor.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
    conn.close()

    if user and check_password_hash(user['password'], password):
        session['user_id'] = user['id']
        session['username'] = user['username']
        return jsonify({'message': 'Login successful', 'username': user['username']})
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out'})

@app.route('/api/check_auth', methods=['GET'])
def check_auth():
    if 'user_id' in session:
        return jsonify({'authenticated': True, 'username': session['username']})
    return jsonify({'authenticated': False})

# --- API Routes: Quiz ---
@app.route('/api/questions', methods=['GET'])
def get_questions():
    subject = request.args.get('subject')
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if subject:
        questions = cursor.execute('SELECT * FROM questions WHERE subject = ? ORDER BY RANDOM()', (subject,)).fetchall()
    else:
        questions = cursor.execute('SELECT * FROM questions ORDER BY RANDOM()').fetchall()
    conn.close()

    q_list = []
    for q in questions:
        q_list.append({
            'id': q['id'],
            'subject': q['subject'],
            'question_text': q['question_text'],
            'options': json.loads(q['options']),
            'correct_option': q['correct_option'] # Note: In a secure app, don't send correct answers to frontend before submit
        })
    return jsonify(q_list)

@app.route('/api/results', methods=['POST'])
def submit_result():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.json
    subject = data.get('subject', 'Mixed')
    score = data.get('score')
    total = data.get('total')

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO results (user_id, subject, score, total_questions) VALUES (?, ?, ?, ?)',
                   (session['user_id'], subject, score, total))
    conn.commit()
    conn.close()

    return jsonify({'message': 'Result saved'})

@app.route('/api/user/stats', methods=['GET'])
def user_stats():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor()
    results = cursor.execute('SELECT subject, score, total_questions, timestamp FROM results WHERE user_id = ? ORDER BY timestamp DESC', (session['user_id'],)).fetchall()
    conn.close()
    
    stats = [dict(r) for r in results]
    return jsonify(stats)

@app.route('/api/leaderboard', methods=['GET'])
def leaderboard():
    conn = get_db_connection()
    cursor = conn.cursor()
    # Get total score per user
    leaders = cursor.execute('''
        SELECT users.username, SUM(results.score) as total_score, SUM(results.total_questions) as total_possible
        FROM results
        JOIN users ON results.user_id = users.id
        GROUP BY users.id
        ORDER BY total_score DESC
        LIMIT 10
    ''').fetchall()
    conn.close()

    return jsonify([dict(l) for l in leaders])

# --- API Routes: Admin ---
@app.route('/api/admin/questions', methods=['POST'])
def add_question():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.json
    subject = data.get('subject')
    text = data.get('question_text')
    options = data.get('options') # list of 4 strings
    correct = data.get('correct_option')

    if not all([subject, text, options, correct is not None]):
        return jsonify({'error': 'Missing fields'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO questions (subject, question_text, options, correct_option) VALUES (?, ?, ?, ?)',
                   (subject, text, json.dumps(options), correct))
    conn.commit()
    conn.close()

    return jsonify({'message': 'Question added'})

@app.route('/api/admin/questions/<int:q_id>', methods=['DELETE'])
def delete_question(q_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM questions WHERE id = ?', (q_id,))
    conn.commit()
    conn.close()

    return jsonify({'message': 'Question deleted'})

@app.route('/api/admin/questions/upload', methods=['POST'])
def upload_questions():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file and file.filename.endswith('.json'):
        content = file.read().decode('utf-8')
        try:
            questions = json.loads(content)
            conn = get_db_connection()
            cursor = conn.cursor()
            for q in questions:
                cursor.execute('INSERT INTO questions (subject, question_text, options, correct_option) VALUES (?, ?, ?, ?)',
                               (q['subject'], q['question_text'], json.dumps(q['options']), q['correct_option']))
            conn.commit()
            conn.close()
            return jsonify({'message': f'{len(questions)} questions uploaded successfully'})
        except Exception as e:
            return jsonify({'error': str(e)}), 400
    else:
        return jsonify({'error': 'Invalid file format. Must be JSON.'}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)
