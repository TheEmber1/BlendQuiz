document.addEventListener('DOMContentLoaded', () => {
    // Get results data from sessionStorage
    const quizResults = JSON.parse(sessionStorage.getItem('quizResults'));
    const isAssessment = sessionStorage.getItem('isAssessment') === 'true';
    const difficulty = sessionStorage.getItem('quizDifficulty');
    
    if (!quizResults) {
        // If there's no data, redirect back to home
        window.location.href = 'index.html';
        return;
    }
    
    // Trigger fireworks for celebration
    setTimeout(() => {
        if (typeof window.triggerFireworks === 'function') {
            window.triggerFireworks();
        }
    }, 300);
    
    // Set up the statistics cards
    setupStatCards(quizResults, isAssessment, difficulty);
    
    // Set up the score donut chart
    setupScoreDonut(quizResults);
    
    // Show the skill level badge for assessment
    if (isAssessment && quizResults.skillLevel) {
        setupSkillLevel(quizResults.skillLevel);
    }
    
    // Fill the answers list
    populateAnswers(quizResults.correct, quizResults.incorrect);
    
    // Set up tab switching
    setupTabs();
    
    // Set up button event listeners
    document.getElementById('home-btn').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    
    document.getElementById('retry-btn').addEventListener('click', () => {
        // If it was an assessment, go back to assessment
        if (isAssessment) {
            sessionStorage.setItem('isAssessment', 'true');
        } else {
            sessionStorage.setItem('quizDifficulty', difficulty);
            sessionStorage.setItem('isAssessment', 'false');
        }
        window.location.href = 'quiz.html';
    });
    
    function setupStatCards(results, isAssessment, difficulty) {
        const statsContainer = document.querySelector('.stat-cards');
        const totalQuestions = results.correct.length + results.incorrect.length;
        const difficultyIcon = getDifficultyIcon(difficulty);
        const difficultyColor = getDifficultyColor(difficulty);
        
        // Create only two cards, aligned with the skill level box above
        let statsHTML = '';
        
        if (isAssessment) {
            statsHTML = `
                <div class="stat-card left-card" style="border-left-color: var(--main-color)">
                    <div class="stat-icon" style="color: var(--main-color)">
                        <i class='bx bxs-check-circle'></i>
                    </div>
                    <div class="stat-content">
                        <span class="stat-title">Correct Answers</span>
                        <span class="stat-value">${results.correct.length}/${totalQuestions}</span>
                    </div>
                </div>
                
                <div class="stat-card right-card" style="border-left-color: var(--main-color)">
                    <div class="stat-icon" style="color: var(--main-color)">
                        <i class='bx bxs-time-five'></i>
                    </div>
                    <div class="stat-content">
                        <span class="stat-title">Completion Time</span>
                        <span class="stat-value">${results.completionTime}</span>
                    </div>
                </div>
            `;
        } else {
            statsHTML = `
                <div class="stat-card left-card" style="border-left-color: ${difficultyColor}">
                    <div class="stat-icon" style="color: ${difficultyColor}">
                        <i class="${difficultyIcon}"></i>
                    </div>
                    <div class="stat-content">
                        <span class="stat-title">Difficulty</span>
                        <span class="stat-value">${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</span>
                    </div>
                </div>
                
                <div class="stat-card right-card" style="border-left-color: var(--main-color)">
                    <div class="stat-icon" style="color: var(--main-color)">
                        <i class='bx bxs-check-circle'></i>
                    </div>
                    <div class="stat-content">
                        <span class="stat-title">Correct Answers</span>
                        <span class="stat-value">${results.correct.length}/${totalQuestions}</span>
                    </div>
                </div>
            `;
        }
        
        statsContainer.innerHTML = statsHTML;
    }
    
    function setupScoreDonut(results) {
        // Use the score percentage for the donut
        const scorePercentage = results.scorePoints;
        
        // Set the score text to show percentage
        document.querySelector('.score-text').textContent = `${scorePercentage}%`;
        
        // Remove the "/100" scale text as it's now shown as a percentage
        const scaleText = document.querySelector('.score-scale');
        if (scaleText) scaleText.remove();
        
        // Set the donut progress
        const scoreValue = document.querySelector('.score-value');
        const circumference = 2 * Math.PI * 80; // 2πr where r=80
        scoreValue.style.strokeDasharray = circumference;
        scoreValue.style.strokeDashoffset = circumference - (scorePercentage / 100) * circumference;
        
        // Update the score messages based on the new 100-point scale
        const scoreMessage = document.querySelector('.score-message');
        if (scorePercentage >= 90) {
            scoreMessage.innerHTML = '<strong>Incredible!</strong> You have exceptional knowledge and speed with Blender shortcuts. You\'re a true power user!';
        } else if (scorePercentage >= 75) {
            scoreMessage.innerHTML = '<strong>Excellent!</strong> You have a great command of Blender shortcuts and very good speed. Keep up the good work!';
        } else if (scorePercentage >= 60) {
            scoreMessage.innerHTML = '<strong>Good job!</strong> You know many shortcuts and have decent speed, but there\'s still room for improvement.';
        } else if (scorePercentage >= 40) {
            scoreMessage.innerHTML = '<strong>Not bad!</strong> You have a basic understanding of shortcuts, but practicing more would help both your knowledge and speed.';
        } else {
            scoreMessage.innerHTML = '<strong>Keep practicing!</strong> Learning these shortcuts will significantly improve your Blender workflow and efficiency.';
        }
    }
    
    function setupSkillLevel(skillLevel) {
        const skillContainer = document.getElementById('skill-level-container');
        
        // Remove the heading and just display the skill badge
        skillContainer.innerHTML = `
            <div class="skill-badge ${skillLevel.className}">
                <div class="skill-icon">
                    <i class="${skillLevel.icon}"></i>
                </div>
                <div class="skill-content">
                    <span class="skill-title">${skillLevel.title}</span>
                    <span class="skill-desc">${skillLevel.description}</span>
                </div>
            </div>
        `;
    }
    
    function populateAnswers(correctAnswers, incorrectAnswers) {
        const answersList = document.getElementById('answers-list');
        let allAnswers = [];
        
        // Process correct answers
        correctAnswers.forEach(item => {
            const questionText = item.question.replace('What is the shortcut for "', '').replace('"?', '');
            allAnswers.push({
                question: questionText,
                answer: item.answer,
                isCorrect: true,
                // Keep isBonus property only for assessment mode
                isBonus: isAssessment ? item.isBonus : false
            });
        });
        
        // Process incorrect answers
        incorrectAnswers.forEach(item => {
            const questionText = item.question.replace('What is the shortcut for "', '').replace('"?', '');
            allAnswers.push({
                question: questionText,
                answer: item.correctAnswer,
                userAnswer: item.userAnswer,
                isCorrect: false,
                // Keep isBonus property only for assessment mode
                isBonus: isAssessment ? item.isBonus : false
            });
        });
        
        // Sort answers by original question number (if available)
        allAnswers.sort((a, b) => {
            if (a.questionNumber && b.questionNumber) {
                return a.questionNumber - b.questionNumber;
            }
            return 0;
        });
        
        // Generate answer list items
        allAnswers.forEach((answer, index) => {
            const li = document.createElement('li');
            li.className = answer.isCorrect ? 'correct' : 'incorrect';
            li.dataset.type = answer.isCorrect ? 'correct' : 'incorrect';
            
            // Add bonus class if it's a bonus question
            if (answer.isBonus) {
                li.classList.add('bonus');
            }
            
            if (answer.isCorrect) {
                li.innerHTML = `
                    <div class="answer-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="answer-content">
                        <span class="question-text">${answer.isBonus ? '<span class="bonus-tag">BONUS</span> ' : ''}${answer.question}</span>
                        <span class="answer-text">Correct: <span class="answer-key">${answer.answer}</span></span>
                    </div>
                `;
            } else {
                li.innerHTML = `
                    <div class="answer-icon">
                        <i class="fas fa-times-circle"></i>
                    </div>
                    <div class="answer-content">
                        <span class="question-text">${answer.isBonus ? '<span class="bonus-tag">BONUS</span> ' : ''}${answer.question}</span>
                        <span class="answer-text">Your answer: <span class="answer-key">${answer.userAnswer}</span></span>
                        <span class="answer-text">Correct answer: <span class="answer-key">${answer.answer}</span></span>
                    </div>
                `;
            }
            
            answersList.appendChild(li);
        });
    }
    
    function setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const answerItems = document.querySelectorAll('.answers-list li');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons
                tabButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to the clicked button
                button.classList.add('active');
                
                const tabType = button.dataset.tab;
                
                // Show or hide answers based on tab
                answerItems.forEach(item => {
                    if (tabType === 'all' || item.dataset.type === tabType) {
                        item.style.display = 'flex';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        });
    }
    
    // Helper functions
    function getDifficultyIcon(difficulty) {
        switch(difficulty) {
            case 'noob': return 'fas fa-baby';
            case 'easy': return 'fas fa-user';
            case 'intermediate': return 'fas fa-user-graduate';
            case 'pro': return 'fas fa-crown';
            default: return 'fas fa-question';
        }
    }
    
    function getDifficultyColor(difficulty) {
        switch(difficulty) {
            case 'noob': return '#4caf50';
            case 'easy': return '#2196f3';
            case 'intermediate': return '#ff9800';
            case 'pro': return '#f44336';
            default: return '#7b6cf6';
        }
    }
    
    function hexToRgb(hex) {
        hex = hex.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `${r}, ${g}, ${b}`;
    }
});
