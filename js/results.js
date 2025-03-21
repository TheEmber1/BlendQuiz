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
    
    // Save score to user profile - prioritize simple leaderboard
    if (window.simpleLeaderboard) {
        console.log("Using simple leaderboard system...");
        saveScoreToSimpleLeaderboard(quizResults);
    } else if (window.auth && window.auth.isLoggedIn()) {
        console.log("User is logged in, saving score to auth...");
        saveScoreToProfile(quizResults);
    } else {
        console.log("No user logged in, score not saved");
    }
    
    // Set up the statistics cards
    setupStatCards(quizResults, isAssessment, difficulty);
    
    // Add leaderboard link for logged-in users
    if (window.auth && window.auth.isLoggedIn()) {
        addLeaderboardLink();
    }
    
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
    
    // Function to save score to user profile
    function saveScoreToProfile(results) {
        try {
            // Try to save using the auth system first
            if (window.auth && typeof window.auth.saveScore === 'function' && window.auth.isLoggedIn()) {
                const saveResult = window.auth.saveScore(results);
                console.log("Auth score save result:", saveResult);
                return saveResult;
            } 
            // Fall back to simple leaderboard if available
            else if (window.simpleLeaderboard && typeof window.simpleLeaderboard.saveScore === 'function') {
                console.log("Using simple leaderboard to save score");
                const saveResult = window.simpleLeaderboard.saveScore(results);
                
                // If we need a nickname, show a nickname form
                if (saveResult.requiresNickname) {
                    showNicknameForm(results);
                    return { success: false, pendingSave: true };
                }
                
                // If successful and has a shareable link, show it
                if (saveResult.success && saveResult.shareableLink) {
                    showShareableLink(saveResult.shareableLink);
                }
                
                console.log("Simple leaderboard save result:", saveResult);
                return saveResult;
            } else {
                console.error("No score saving mechanism available");
                return { success: false, message: 'No score saving mechanism available' };
            }
        } catch (error) {
            console.error("Error saving score:", error);
            return { success: false, message: 'Error saving score', error };
        }
    }
    
    // Function to save score to simple leaderboard
    function saveScoreToSimpleLeaderboard(results) {
        try {
            // Try simple leaderboard first
            if (window.simpleLeaderboard && typeof window.simpleLeaderboard.saveScore === 'function') {
                console.log("Saving to simple leaderboard");
                const saveResult = window.simpleLeaderboard.saveScore(results);
                
                // If we need a nickname, show a nickname form
                if (saveResult.requiresNickname) {
                    showNicknameForm(results);
                    return { success: false, pendingSave: true };
                }
                
                // If successful and has a shareable link, show it
                if (saveResult.success && saveResult.shareableLink) {
                    showShareableLink(saveResult.shareableLink);
                }
                
                return saveResult;
            } else {
                console.error("Simple leaderboard not available");
                return { success: false, message: 'Simple leaderboard not available' };
            }
        } catch (error) {
            console.error("Error saving score:", error);
            return { success: false, message: 'Error saving score', error };
        }
    }
    
    // Function to show a nickname form
    function showNicknameForm(results) {
        // Create the form element
        const formContainer = document.createElement('div');
        formContainer.className = 'nickname-form-container';
        formContainer.innerHTML = `
            <div class="nickname-form-inner">
                <h3>Enter a Nickname</h3>
                <p>Set a nickname to save your score to the leaderboard:</p>
                <div class="form-group">
                    <input type="text" id="result-nickname-input" placeholder="Your nickname">
                </div>
                <div class="form-actions">
                    <button id="save-nickname-btn" class="btn btn-primary">Save Score</button>
                    <button id="cancel-nickname-btn" class="btn btn-secondary">Skip</button>
                </div>
            </div>
        `;
        
        // Add to the page
        document.body.appendChild(formContainer);
        
        // Add form event listeners
        document.getElementById('save-nickname-btn').addEventListener('click', () => {
            const nickname = document.getElementById('result-nickname-input').value.trim();
            if (nickname) {
                window.simpleLeaderboard.setNickname(nickname);
                const saveResult = window.simpleLeaderboard.saveScore(results);
                
                // Remove the form
                formContainer.remove();
                
                // Show shareable link if available
                if (saveResult.success && saveResult.shareableLink) {
                    showShareableLink(saveResult.shareableLink);
                }
                
                // Add leaderboard link to actions if not already present
                addLeaderboardLink();
            } else {
                alert('Please enter a valid nickname');
            }
        });
        
        document.getElementById('cancel-nickname-btn').addEventListener('click', () => {
            formContainer.remove();
        });
    }
    
    // Function to show a shareable link
    function showShareableLink(link) {
        // Create the element
        const linkContainer = document.createElement('div');
        linkContainer.className = 'shareable-link-container';
        linkContainer.innerHTML = `
            <div class="shareable-link-inner">
                <h3>Share Your Score</h3>
                <p>Share this link to show off your score:</p>
                <div class="link-group">
                    <input type="text" id="shareable-link-input" value="${link}" readonly>
                    <button id="copy-link-btn" class="btn btn-copy">Copy</button>
                </div>
                <button id="close-link-btn" class="btn btn-secondary">Close</button>
            </div>
        `;
        
        // Add to the page
        document.body.appendChild(linkContainer);
        
        // Add event listeners
        document.getElementById('copy-link-btn').addEventListener('click', () => {
            const linkInput = document.getElementById('shareable-link-input');
            linkInput.select();
            document.execCommand('copy');
            
            // Show success feedback
            const copyBtn = document.getElementById('copy-link-btn');
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.textContent = 'Copy';
            }, 2000);
        });
        
        document.getElementById('close-link-btn').addEventListener('click', () => {
            linkContainer.remove();
        });
    }
    
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
    
    function addLeaderboardLink() {
        const actionsContainer = document.querySelector('.actions');
        
        if (actionsContainer && !document.getElementById('leaderboard-btn')) {
            const leaderboardBtn = document.createElement('button');
            leaderboardBtn.className = 'btn btn-secondary';
            leaderboardBtn.id = 'leaderboard-btn';
            leaderboardBtn.textContent = 'View Leaderboard';
            
            leaderboardBtn.addEventListener('click', () => {
                window.location.href = 'leaderboard.html';
            });
            
            actionsContainer.appendChild(leaderboardBtn);
        }
    }
    
    // Always add leaderboard link regardless of login status
    addLeaderboardLink();
});
