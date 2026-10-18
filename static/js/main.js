document.addEventListener('DOMContentLoaded', () => {
    // --- Theme Toggle ---
    const themeToggleBtn = document.getElementById('themeToggle');
    const body = document.body;
    
    // Check local storage for theme
    const currentTheme = localStorage.getItem('theme') || 'light';
    body.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            let theme = body.getAttribute('data-theme');
            theme = theme === 'light' ? 'dark' : 'light';
            body.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            updateThemeIcon(theme);
        });
    }

    function updateThemeIcon(theme) {
        if (!themeToggleBtn) return;
        if (theme === 'dark') {
            themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
        } else {
            themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
        }
    }

    // --- Authentication ---
    checkAuthStatus();

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('regUsername').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            const errorDiv = document.getElementById('registerError');
            const successDiv = document.getElementById('registerSuccess');

            try {
                const res = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password })
                });
                const data = await res.json();
                
                if (res.ok) {
                    errorDiv.classList.add('d-none');
                    successDiv.classList.remove('d-none');
                    registerForm.reset();
                    setTimeout(() => {
                        successDiv.classList.add('d-none');
                        // Hide modal and show login
                        const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
                        registerModal.hide();
                        const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
                        loginModal.show();
                    }, 1500);
                } else {
                    errorDiv.textContent = data.error;
                    errorDiv.classList.remove('d-none');
                }
            } catch (err) {
                console.error(err);
            }
        });
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            const errorDiv = document.getElementById('loginError');

            try {
                const res = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await res.json();

                if (res.ok) {
                    const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                    loginModal.hide();
                    loginForm.reset();
                    checkAuthStatus();
                } else {
                    errorDiv.textContent = data.error;
                    errorDiv.classList.remove('d-none');
                }
            } catch (err) {
                console.error(err);
            }
        });
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await fetch('/api/logout', { method: 'POST' });
            window.location.href = '/';
        });
    }

    // Dashboard Interactions
    const subjectCards = document.querySelectorAll('.subject-card');
    let selectedSubject = 'Mixed';

    subjectCards.forEach(card => {
        card.addEventListener('click', () => {
            subjectCards.forEach(c => c.classList.remove('border-primary'));
            card.classList.add('border-primary');
            selectedSubject = card.getAttribute('data-subject');
        });
    });

    const startQuizBtn = document.getElementById('startQuizBtn');
    if (startQuizBtn) {
        startQuizBtn.addEventListener('click', () => {
            // Save subject to local storage to pass to quiz page
            localStorage.setItem('quizSubject', selectedSubject);
            window.location.href = '/quiz';
        });
    }

});

// Global functions
async function checkAuthStatus() {
    try {
        const res = await fetch('/api/check_auth');
        const data = await res.json();

        if (data.authenticated) {
            document.getElementById('nav-unauth-login')?.classList.add('d-none');
            document.getElementById('nav-unauth-register')?.classList.add('d-none');
            document.getElementById('nav-auth-user')?.classList.remove('d-none');
            document.getElementById('nav-auth-logout')?.classList.remove('d-none');
            document.getElementById('nav-auth-admin')?.classList.remove('d-none');
            
            const usernameDisplay = document.getElementById('usernameDisplay');
            if (usernameDisplay) usernameDisplay.textContent = data.username;
            
            const heroSection = document.getElementById('heroSection');
            const dashboardSection = document.getElementById('dashboardSection');
            
            if (heroSection && dashboardSection) {
                heroSection.classList.add('d-none');
                dashboardSection.classList.remove('d-none');
                const dashUser = document.getElementById('dashUsername');
                if(dashUser) dashUser.textContent = data.username;
                
                loadDashboardData();
            }
        } else {
            // Unauthenticated
            document.getElementById('nav-unauth-login')?.classList.remove('d-none');
            document.getElementById('nav-unauth-register')?.classList.remove('d-none');
            document.getElementById('nav-auth-user')?.classList.add('d-none');
            document.getElementById('nav-auth-logout')?.classList.add('d-none');
            document.getElementById('nav-auth-admin')?.classList.add('d-none');
        }
    } catch (err) {
        console.error("Auth check failed", err);
    }
}

async function loadDashboardData() {
    try {
        // Load Stats
        const statsRes = await fetch('/api/user/stats');
        if (statsRes.ok) {
            const stats = await statsRes.json();
            
            let totalQuizzes = stats.length;
            let totalScore = 0;
            let totalPossible = 0;
            
            const tbody = document.getElementById('historyBody');
            tbody.innerHTML = '';

            stats.forEach(s => {
                totalScore += s.score;
                totalPossible += s.total_questions;
                
                const percentage = Math.round((s.score / s.total_questions) * 100);
                const date = new Date(s.timestamp).toLocaleDateString();
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${s.subject}</td>
                    <td>${s.score}/${s.total_questions}</td>
                    <td>
                        <div class="d-flex align-items-center">
                            <span class="me-2">${percentage}%</span>
                            <div class="progress flex-grow-1" style="height: 6px;">
                                <div class="progress-bar ${percentage >= 70 ? 'bg-success' : percentage >= 40 ? 'bg-warning' : 'bg-danger'}" style="width: ${percentage}%"></div>
                            </div>
                        </div>
                    </td>
                    <td>${date}</td>
                `;
                tbody.appendChild(tr);
            });

            if (totalQuizzes === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No quizzes taken yet.</td></tr>';
            }

            const avg = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
            
            document.getElementById('statTotalQuizzes').textContent = totalQuizzes;
            document.getElementById('statAverageScore').textContent = `${avg}%`;
            document.getElementById('statTotalPoints').textContent = totalScore;
        }

        // Load Leaderboard
        const leadRes = await fetch('/api/leaderboard');
        if (leadRes.ok) {
            const leaders = await leadRes.json();
            const leadBody = document.getElementById('leaderboardBody');
            leadBody.innerHTML = '';
            
            leaders.forEach((l, index) => {
                const tr = document.createElement('tr');
                let rankHtml = `<b>${index + 1}</b>`;
                if (index === 0) rankHtml = `<i class="fa-solid fa-trophy text-warning"></i>`;
                else if (index === 1) rankHtml = `<i class="fa-solid fa-medal text-secondary"></i>`;
                else if (index === 2) rankHtml = `<i class="fa-solid fa-medal" style="color: #cd7f32;"></i>`;

                tr.innerHTML = `
                    <td>${rankHtml}</td>
                    <td class="fw-bold">${l.username}</td>
                    <td class="text-end text-primary fw-bold">${l.total_score}</td>
                `;
                leadBody.appendChild(tr);
            });

            if (leaders.length === 0) {
                leadBody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No data available.</td></tr>';
            }
        }

    } catch (err) {
        console.error("Error loading dashboard data", err);
    }
}
