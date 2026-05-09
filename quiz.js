document.addEventListener('DOMContentLoaded', () => {
    // Only run if we are on the quiz page
    if (!document.getElementById('quizInterface')) return;

    let questions = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let timer;
    let timeLeft = 30; // 30 seconds per question
    let userAnswers = []; // Store correct/incorrect status

    const quizSubject = localStorage.getItem('quizSubject') || 'Mixed';
    const subjectBadge = document.getElementById('subjectBadge');
    if (subjectBadge) subjectBadge.textContent = quizSubject;

    const quizLoading = document.getElementById('quizLoading');
    const quizInterface = document.getElementById('quizInterface');
    const resultScreen = document.getElementById('resultScreen');

    // UI Elements
    const questionText = document.getElementById('questionText');
    const optionsContainer = document.getElementById('optionsContainer');
    const currentQIndexEl = document.getElementById('currentQIndex');
    const totalQsEl = document.getElementById('totalQs');
    const timerDisplay = document.getElementById('timerDisplay');
    const quizProgress = document.getElementById('quizProgress');
    const nextBtn = document.getElementById('nextBtn');
    const quitQuizBtn = document.getElementById('quitQuizBtn');

    // Initialize Quiz
    fetchQuestions();

    async function fetchQuestions() {
        try {
            const url = quizSubject === 'Mixed' ? '/api/questions' : `/api/questions?subject=${encodeURIComponent(quizSubject)}`;
            const res = await fetch(url);
            if (res.status === 401) {
                // Not logged in
                window.location.href = '/';
                return;
            }
            questions = await res.json();

            // Limit to 10 questions max for a session
            if (questions.length > 10) questions = questions.slice(0, 10);

            if (questions.length === 0) {
                quizLoading.innerHTML = '<h4 class="text-danger mt-3">No questions found for this subject.</h4><a href="/" class="btn btn-primary mt-3">Go Back</a>';
                return;
            }

            totalQsEl.textContent = questions.length;
            
            // Hide loading, show quiz
            quizLoading.classList.add('d-none');
            quizInterface.classList.remove('d-none');

            loadQuestion();

        } catch (err) {
            console.error(err);
            quizLoading.innerHTML = '<h4 class="text-danger mt-3">Error loading questions.</h4><a href="/" class="btn btn-primary mt-3">Go Back</a>';
        }
    }

    function loadQuestion() {
        const q = questions[currentQuestionIndex];
        currentQIndexEl.textContent = currentQuestionIndex + 1;
        
        // Update Progress bar
        const progress = (currentQuestionIndex / questions.length) * 100;
        quizProgress.style.width = `${progress}%`;

        questionText.textContent = q.question_text;
        
        optionsContainer.innerHTML = '';
        nextBtn.disabled = true;

        q.options.forEach((opt, index) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerHTML = `<strong>${String.fromCharCode(65 + index)}.</strong> ${opt}`;
            btn.onclick = () => selectOption(btn, index, q.correct_option);
            optionsContainer.appendChild(btn);
        });

        // Reset and start timer
        timeLeft = 30;
        updateTimerDisplay();
        clearInterval(timer);
        timer = setInterval(timerTick, 1000);
        timerDisplay.classList.remove('danger');
    }

    function selectOption(selectedBtn, selectedIndex, correctIndex) {
        // Disable all options
        clearInterval(timer);
        const buttons = optionsContainer.querySelectorAll('.option-btn');
        buttons.forEach(btn => btn.disabled = true);

        // Check if correct
        if (selectedIndex === correctIndex) {
            selectedBtn.classList.add('correct');
            score++;
            userAnswers.push(true);
        } else {
            selectedBtn.classList.add('incorrect');
            buttons[correctIndex].classList.add('correct');
            userAnswers.push(false);
        }

        nextBtn.disabled = false;
    }

    function timerTick() {
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 5) {
            timerDisplay.classList.add('danger');
        }

        if (timeLeft <= 0) {
            clearInterval(timer);
            // Time out - show correct answer
            const buttons = optionsContainer.querySelectorAll('.option-btn');
            buttons.forEach(btn => btn.disabled = true);
            const correctIndex = questions[currentQuestionIndex].correct_option;
            buttons[correctIndex].classList.add('correct');
            userAnswers.push(false);
            nextBtn.disabled = false;
        }
    }

    function updateTimerDisplay() {
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        timerDisplay.textContent = `0${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    nextBtn.addEventListener('click', () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            loadQuestion();
        } else {
            finishQuiz();
        }
    });

    if (quitQuizBtn) {
        quitQuizBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to quit? Your progress will be lost.")) {
                window.location.href = '/';
            }
        });
    }

    async function finishQuiz() {
        quizInterface.classList.add('d-none');
        resultScreen.classList.remove('d-none');

        const total = questions.length;
        document.getElementById('finalScore').textContent = score;
        document.getElementById('finalTotal').textContent = total;
        document.getElementById('resultSubject').textContent = quizSubject;
        
        const percentage = (score / total) * 100;
        const pBar = document.getElementById('resultProgress');
        pBar.style.width = `${percentage}%`;

        if (percentage >= 80) pBar.className = 'progress-bar bg-success';
        else if (percentage >= 50) pBar.className = 'progress-bar bg-warning';
        else pBar.className = 'progress-bar bg-danger';

        // Submit to backend
        try {
            await fetch('/api/results', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: quizSubject,
                    score: score,
                    total: total
                })
            });
        } catch (err) {
            console.error("Failed to save result", err);
        }
    }

    const retryBtn = document.getElementById('retryBtn');
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            window.location.reload();
        });
    }
});
