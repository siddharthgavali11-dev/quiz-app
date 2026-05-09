document.addEventListener('DOMContentLoaded', () => {
    // Only run on admin page
    if (!document.getElementById('questionsTableBody')) return;

    loadQuestions();

    // Add Question
    const addForm = document.getElementById('addQuestionForm');
    if (addForm) {
        addForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const subject = document.getElementById('qSubject').value;
            const text = document.getElementById('qText').value;
            const correct = parseInt(document.getElementById('qCorrect').value);
            
            const options = [];
            document.querySelectorAll('.option-input').forEach(input => {
                options.push(input.value);
            });

            try {
                const res = await fetch('/api/admin/questions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        subject,
                        question_text: text,
                        options,
                        correct_option: correct
                    })
                });

                if (res.ok) {
                    addForm.reset();
                    bootstrap.Modal.getInstance(document.getElementById('addQuestionModal')).hide();
                    loadQuestions();
                } else {
                    alert("Failed to add question");
                }
            } catch (err) {
                console.error(err);
                alert("Error adding question");
            }
        });
    }

    // Upload JSON
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fileInput = document.getElementById('jsonFile');
            const file = fileInput.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('file', file);

            try {
                const res = await fetch('/api/admin/questions/upload', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                
                if (res.ok) {
                    alert(data.message);
                    uploadForm.reset();
                    bootstrap.Modal.getInstance(document.getElementById('uploadModal')).hide();
                    loadQuestions();
                } else {
                    alert(data.error);
                }
            } catch (err) {
                console.error(err);
                alert("Error uploading file");
            }
        });
    }
});

async function loadQuestions() {
    try {
        const res = await fetch('/api/questions'); // Fetch all questions
        if (res.status === 401) {
            window.location.href = '/';
            return;
        }
        const questions = await res.json();
        
        const tbody = document.getElementById('questionsTableBody');
        tbody.innerHTML = '';

        questions.forEach(q => {
            const tr = document.createElement('tr');
            
            // Format options array
            let optsHtml = '<ol type="A" class="mb-0 ps-3">';
            q.options.forEach((opt, idx) => {
                if (idx === q.correct_option) {
                    optsHtml += `<li class="text-success fw-bold">${opt}</li>`;
                } else {
                    optsHtml += `<li>${opt}</li>`;
                }
            });
            optsHtml += '</ol>';

            tr.innerHTML = `
                <td>${q.id}</td>
                <td><span class="badge bg-secondary">${q.subject}</span></td>
                <td>${q.question_text}</td>
                <td>${optsHtml}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteQuestion(${q.id})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error("Failed to load questions", err);
    }
}

async function deleteQuestion(id) {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
        const res = await fetch(`/api/admin/questions/${id}`, {
            method: 'DELETE'
        });
        
        if (res.ok) {
            loadQuestions();
        } else {
            alert("Failed to delete question");
        }
    } catch (err) {
        console.error(err);
    }
}
