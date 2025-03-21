document.addEventListener('DOMContentLoaded', () => {
    // Check if simple leaderboard is available and user has a nickname
    if (window.simpleLeaderboard && window.simpleLeaderboard.hasNickname()) {
        // Update the nickname display
        const nicknameContainer = document.querySelector('.nickname-container');
        const nicknameDisplay = document.querySelector('.nickname-display');
        
        if (nicknameContainer && nicknameDisplay) {
            nicknameDisplay.textContent = window.simpleLeaderboard.getNickname();
            nicknameContainer.style.display = 'block';
        }
        
        // Show leaderboard link
        const leaderboardLink = document.querySelector('.leaderboard-link');
        if (leaderboardLink) {
            leaderboardLink.style.display = 'inline-block';
        }
    } else {
        // Always show leaderboard link regardless of nickname status
        const leaderboardLink = document.querySelector('.leaderboard-link');
        if (leaderboardLink) {
            leaderboardLink.style.display = 'inline-block';
        }
    }
});

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
