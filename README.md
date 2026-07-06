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
├── quiz_app.db          # SQLite database
├── index.html           # Login / Register page
├── quiz.html            # Quiz interface
├── admin.html           # Admin dashboard
├── main.js              # Logic for authentication page
├── quiz.js              # Quiz functionality
├── admin.js             # Admin panel logic
└── style.css            # Shared styles
```

