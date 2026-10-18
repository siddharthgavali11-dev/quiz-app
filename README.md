# 🧠 Quiz App

A responsive and interactive quiz web application that allows users to test their knowledge through multiple-choice questions. The app provides real-time scoring, performance tracking, and a leaderboard system to enhance user engagement.

Built using a **Flask backend** and a **vanilla HTML, CSS, and JavaScript frontend**, this project demonstrates full-stack development with authentication, APIs, and database integration.

---

## 🚀 Features

* 🔐 **User Authentication**

  * Secure registration and login system
  * Password hashing using Werkzeug
  * Session-based authentication

* 📝 **Interactive Quizzes**

  * Subject-based multiple-choice questions
  * Randomized question order for each attempt

* ⚡ **Real-Time Scoring**

  * Instant score calculation after submission
  * Automatic result storage

* 📊 **Performance Tracking**

  * View quiz history and progress over time
  * Analyze past performance

* 🏆 **Leaderboard**

  * Top 10 users ranked by total score
  * Encourages competition among users

* 🛠️ **Admin Panel**

  * Add and delete questions
  * Bulk upload questions via JSON file

---

## 🛠️ Tech Stack

| Layer    | Technology                |
| -------- | ------------------------- |
| Backend  | Python, Flask, Flask-CORS |
| Database | SQLite                    |
| Frontend | HTML, CSS, JavaScript     |
| Auth     | Flask Sessions, Werkzeug  |

---

## 📁 Project Structure

```
quiz-app/
├── app.py               # Flask app (routes, APIs, authentication)
├── database.py          # Database setup and connection
├── requirements.txt     # Python dependencies
├── templates/
│   ├── index.html       # Login / Register page
│   ├── quiz.html        # Quiz interface
│   └── admin.html       # Admin dashboard
└── static/
    ├── css/
    │   └── style.css    # Shared styles
    └── js/
        ├── main.js      # Logic for authentication page
        ├── quiz.js      # Quiz functionality
        └── admin.js     # Admin panel logic
```

---

## ▶️ Getting Started

Requires Python 3.

```bash
git clone https://github.com/siddharthgavali11-dev/quiz-app.git
cd quiz-app

python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

pip install -r requirements.txt
python app.py
```

Open http://127.0.0.1:5000 in your browser, register an account, and start a quiz.

On the first run the app creates a local SQLite database (`quiz_app.db`) and seeds it with six sample questions in Data Structures, Operating Systems and Programming.

---

## 🔌 API Overview

| Method | Route | Purpose | Login required |
| ------ | ----- | ------- | -------------- |
| POST | `/api/register` | Create an account (password stored hashed) | No |
| POST | `/api/login` | Log in and start a session | No |
| POST | `/api/logout` | End the session | No |
| GET | `/api/check_auth` | Check whether the session is logged in | No |
| GET | `/api/questions` | Get questions in random order (optional `?subject=`) | No |
| POST | `/api/results` | Save a quiz score | Yes |
| GET | `/api/user/stats` | Get the current user's quiz history | Yes |
| GET | `/api/leaderboard` | Top 10 users by total score | No |
| POST | `/api/admin/questions` | Add a question | Yes |
| DELETE | `/api/admin/questions/<id>` | Delete a question | Yes |
| POST | `/api/admin/questions/upload` | Bulk upload questions from a JSON file | Yes |

### Bulk upload format

The admin panel accepts a JSON file containing a list of questions. `correct_option` is the index (0 to 3) of the right answer in `options`.

```json
[
  {
    "subject": "Data Structures",
    "question_text": "Which data structure uses LIFO?",
    "options": ["Queue", "Stack", "Tree", "Graph"],
    "correct_option": 1
  }
]
```

---

## ⚠️ Known Limitations

This is a learning project, and these are the things I would fix before deploying it:

* Any logged-in user can open the admin panel and use the admin APIs. There is no admin role check yet.
* `/api/questions` sends the correct answer to the browser along with each question, so the answers can be read from the network tab.
* The Flask `secret_key` is hardcoded in `app.py` and should be loaded from an environment variable.
* The app runs with `debug=True`, which is only suitable for local development.

