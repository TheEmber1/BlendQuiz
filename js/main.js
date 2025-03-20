function startQuiz(difficulty) {
    // Store the selected difficulty in sessionStorage
    sessionStorage.setItem('quizDifficulty', difficulty);
    
    // Navigate to the quiz page
    window.location.href = 'quiz.html';
}
