function startQuiz(difficulty) {
    // Store the selected difficulty in sessionStorage
    sessionStorage.setItem('quizDifficulty', difficulty);
    sessionStorage.setItem('isAssessment', 'false');
    
    // Navigate to the quiz page
    window.location.href = 'quiz.html';
}

function startAssessment() {
    // Set up the skill assessment
    sessionStorage.setItem('isAssessment', 'true');
    
    // Navigate to the assessment page
    window.location.href = 'quiz.html';
}
