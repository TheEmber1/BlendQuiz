document.addEventListener('DOMContentLoaded', () => {
    // Check if we're in assessment mode
    const isAssessment = sessionStorage.getItem('isAssessment') === 'true';
    
    // Get the selected difficulty from sessionStorage (for regular quiz mode)
    const difficulty = isAssessment ? 'assessment' : (sessionStorage.getItem('quizDifficulty') || 'noob');
    
    // Display the appropriate title
    if (isAssessment) {
        document.getElementById('difficulty').textContent = 'Skill Assessment';
        document.querySelector('.quiz-info').innerHTML = `
            <span id="progress-label">Question <span id="current-question">1</span>/12</span>
            <span id="timer">Time: <span id="time-counter">0:00</span></span>
        `;
    } else {
        document.getElementById('difficulty').textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    }
    
    // Quiz state
    const state = {
        currentQuestion: 0,
        score: 0,
        totalQuestions: isAssessment ? 12 : 5,
        questions: [],
        results: {
            correct: [],
            incorrect: []
        },
        startTime: new Date(),
        endTime: null,
        questionTimes: [] // Track time for each question
    };
    
    // Set up timer
    let elapsedSeconds = 0;
    const timer = setInterval(() => {
        elapsedSeconds++;
        if (document.getElementById('time-counter')) {
            document.getElementById('time-counter').textContent = formatTime(elapsedSeconds);
        }
    }, 1000);
    
    // Generate questions based on mode
    if (isAssessment) {
        generateAssessmentQuestions();
    } else {
        // Regular mode - get shortcuts for the selected difficulty
        const shortcuts = shortcutsByDifficulty[difficulty];
        generateQuestions(shortcuts);
    }
    
    // Display the first question
    displayQuestion();
    
    // Function to generate a set of assessment questions (3 from each difficulty)
    function generateAssessmentQuestions() {
        const difficultyLevels = ['noob', 'easy', 'intermediate', 'pro'];
        let allQuestions = [];
        
        // Get 3 questions from each difficulty level
        difficultyLevels.forEach(level => {
            const levelShortcuts = [...shortcutsByDifficulty[level]];
            const shuffledShortcuts = levelShortcuts.sort(() => Math.random() - 0.5);
            
            // Take 3 shortcuts from this level
            const selectedShortcuts = shuffledShortcuts.slice(0, 3);
            
            // Create questions for each shortcut
            selectedShortcuts.forEach(shortcut => {
                const incorrectOptions = generateIncorrectOptions(shortcut);
                
                allQuestions.push({
                    question: `What is the shortcut for "${shortcut.action}"?`,
                    correctAnswer: shortcut.key,
                    options: shuffleArray([...incorrectOptions, shortcut.key]),
                    difficulty: level
                });
            });
        });
        
        // Shuffle all questions to mix difficulty levels
        state.questions = shuffleArray(allQuestions);
    }
    
    // Function to generate regular quiz questions
    function generateQuestions(shortcuts) {
        // Shuffle shortcuts to get random set
        const shuffledShortcuts = [...shortcuts].sort(() => Math.random() - 0.5);
        
        // Take the first 5 shortcuts (or fewer if not enough)
        const questionCount = Math.min(state.totalQuestions, shuffledShortcuts.length);
        
        for (let i = 0; i < questionCount; i++) {
            const correctShortcut = shuffledShortcuts[i];
            
            // Generate 3 incorrect options
            const incorrectOptions = generateIncorrectOptions(correctShortcut);
            
            // Add the question to our state
            state.questions.push({
                question: `What is the shortcut for "${correctShortcut.action}"?`,
                correctAnswer: correctShortcut.key,
                options: shuffleArray([...incorrectOptions, correctShortcut.key]),
                difficulty: difficulty
            });
        }
    }
    
    // Function to generate incorrect options for a question
    function generateIncorrectOptions(correctShortcut) {
        const incorrectOptions = [];
        const allOtherShortcuts = allShortcuts.filter(s => s.key !== correctShortcut.key);
        
        // Shuffle all other shortcuts
        const shuffledShortcuts = [...allOtherShortcuts].sort(() => Math.random() - 0.5);
        
        // Take the first 3 shortcuts
        for (let i = 0; i < 3 && i < shuffledShortcuts.length; i++) {
            incorrectOptions.push(shuffledShortcuts[i].key);
        }
        
        return incorrectOptions;
    }
    
    // Function to display the current question
    function displayQuestion() {
        if (state.currentQuestion >= state.questions.length) {
            showResults();
            return;
        }
        
        const question = state.questions[state.currentQuestion];
        
        // Update question number
        document.getElementById('current-question').textContent = state.currentQuestion + 1;
        
        // Set question text
        document.getElementById('question').textContent = question.question;
        
        // Set answer options
        const answerButtons = document.querySelectorAll('.answer-btn');
        
        answerButtons.forEach((button, index) => {
            if (index < question.options.length) {
                button.textContent = question.options[index];
                button.style.display = 'block';
                button.className = 'answer-btn'; // Reset button classes
                button.disabled = false; // Make sure button is enabled
                
                // Remove any existing event listeners by cloning and replacing
                const newButton = button.cloneNode(true);
                button.parentNode.replaceChild(newButton, button);
                
                // Add new click event
                newButton.addEventListener('click', function() {
                    checkAnswer(this.textContent);
                });
            } else {
                button.style.display = 'none';
            }
        });
    }
    
    // Function to check if the answer is correct
    function checkAnswer(selectedAnswer) {
        const question = state.questions[state.currentQuestion];
        const isCorrect = selectedAnswer === question.correctAnswer;
        
        // Update score
        if (isCorrect) {
            state.score++;
            state.results.correct.push({
                question: question.question,
                answer: question.correctAnswer
            });
            
            // Ensure confetti is triggered for correct answer
            setTimeout(() => {
                if (typeof window.triggerConfetti === 'function') {
                    window.triggerConfetti();
                }
            }, 100);
        } else {
            state.results.incorrect.push({
                question: question.question,
                userAnswer: selectedAnswer,
                correctAnswer: question.correctAnswer
            });
        }
        
        // Highlight correct/incorrect answers
        const answerButtons = document.querySelectorAll('.answer-btn');
        answerButtons.forEach(button => {
            if (button.textContent === question.correctAnswer) {
                button.classList.add('correct');
            } else if (button.textContent === selectedAnswer && !isCorrect) {
                button.classList.add('incorrect');
            }
            
            // Disable the button to prevent multiple answers
            button.disabled = true;
        });
        
        // Move to next question after a delay
        setTimeout(() => {
            state.currentQuestion++;
            displayQuestion();
        }, 1500);
    }
    
    // Override the checkAnswer function to track time per question
    const originalCheckAnswer = checkAnswer;
    checkAnswer = function(selectedAnswer) {
        // Record time taken for this question
        const questionEndTime = new Date();
        const questionTime = (questionEndTime - state.startTime) / 1000 - 
            state.questionTimes.reduce((total, time) => total + time, 0);
        state.questionTimes.push(questionTime);
        
        // Call the original function
        originalCheckAnswer(selectedAnswer);
    };
    
    // Function to show the final results
    function showResults() {
        // Stop the timer
        clearInterval(timer);
        
        // Record end time
        state.endTime = new Date();
        const timeTaken = Math.round((state.endTime - state.startTime) / 1000);
        
        // Hide question container and show results
        document.getElementById('question-container').classList.add('hidden');
        const resultsContainer = document.getElementById('results-container');
        resultsContainer.classList.remove('hidden');
        
        // Update score
        document.getElementById('correct-count').textContent = state.score;
        
        if (isAssessment) {
            // Calculate skill level based on score and time
            const skillLevel = calculateSkillLevel(state.score, timeTaken);
            
            // Create the skill level element
            const skillLevelElement = document.createElement('div');
            skillLevelElement.className = 'skill-level';
            skillLevelElement.innerHTML = `
                <h3>Your Blender Skill Level:</h3>
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
            
            // Insert at the top of results
            document.querySelector('.results').prepend(skillLevelElement);
        }
        
        // Add difficulty info with appropriate icon for regular quiz
        if (!isAssessment) {
            const difficultyIcon = getDifficultyIcon(difficulty);
            const difficultyColor = getDifficultyColor(difficulty);
            
            const difficultyElement = document.createElement('div');
            difficultyElement.className = 'quiz-stats';
            difficultyElement.innerHTML = `
                <div class="stat-card" style="border-left-color: ${difficultyColor}">
                    <div class="stat-icon" style="background-color: rgba(${hexToRgb(difficultyColor)}, 0.2); color: ${difficultyColor}">
                        <i class="${difficultyIcon}"></i>
                    </div>
                    <div class="stat-content">
                        <span class="stat-title">Difficulty</span>
                        <span class="stat-value">${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</span>
                    </div>
                </div>
                
                <div class="stat-card" style="border-left-color: var(--main-color)">
                    <div class="stat-icon" style="background-color: rgba(123, 108, 246, 0.2); color: var(--main-color)">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="stat-content">
                        <span class="stat-title">Completion Time</span>
                        <span class="stat-value">${formatTime(timeTaken)}</span>
                    </div>
                </div>
            `;
            
            // Insert at the top of results
            document.querySelector('.results').prepend(difficultyElement);
        }
        
        // Simplify results display
        const resultsList = document.getElementById('result-answers');
        resultsList.innerHTML = '';
        
        // Add completion time to results
        const timeElement = document.createElement('div');
        timeElement.className = 'completion-time';
        timeElement.innerHTML = `Completion Time: <span>${formatTime(timeTaken)}</span>`;
        document.querySelector('.results p').after(timeElement);
        
        // First add correct answers
        state.results.correct.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'correct';
            const questionNumber = state.results.correct.indexOf(item) + state.results.incorrect.findIndex(x => 
                state.questions.findIndex(q => q.question === x.question) < 
                state.questions.findIndex(q => q.question === item.question)
            ) + 1;
            
            const questionText = item.question.replace('What is the shortcut for "', '').replace('"?', '');
            li.textContent = `Question ${questionNumber}: ${questionText} → ${item.answer}`;
            resultsList.appendChild(li);
        });
        
        // Then add incorrect answers
        state.results.incorrect.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'incorrect';
            const questionNumber = state.results.correct.filter(x => 
                state.questions.findIndex(q => q.question === x.question) < 
                state.questions.findIndex(q => q.question === item.question)
            ).length + state.results.incorrect.indexOf(item) + 1;
            
            const questionText = item.question.replace('What is the shortcut for "', '').replace('"?', '');
            li.textContent = `Question ${questionNumber}: ${questionText} → ${item.correctAnswer}`;
            resultsList.appendChild(li);
        });
        
        // Trigger fireworks at the end
        setTimeout(() => {
            if (typeof window.triggerFireworks === 'function') {
                window.triggerFireworks();
            }
        }, 500);
        
        // Set up home button
        document.getElementById('home-btn').addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
    
    // Function to calculate skill level based on score and time
    function calculateSkillLevel(score, timeTaken) {
        // Base skill points on correct answers (0-12 points)
        let skillPoints = score;
        
        // Add time bonus (up to 3 points)
        // For perfect time (less than 60 seconds), award 3 points
        // For good time (less than 120 seconds), award 2 points
        // For decent time (less than 180 seconds), award 1 point
        if (timeTaken < 60) {
            skillPoints += 3;
        } else if (timeTaken < 120) {
            skillPoints += 2;
        } else if (timeTaken < 180) {
            skillPoints += 1;
        }
        
        // Define skill levels (from 15 possible points)
        const skillLevels = [
            {
                threshold: 0,
                title: "Blender Novice",
                description: "You're just beginning your Blender journey.",
                icon: "fas fa-baby",
                className: "skill-novice"
            },
            {
                threshold: 2,
                title: "Blender Beginner",
                description: "You know a few basics, but have a lot to learn.",
                icon: "fas fa-walking",
                className: "skill-beginner"
            },
            {
                threshold: 4,
                title: "Casual User",
                description: "You can find your way around, slowly but surely.",
                icon: "fas fa-child",
                className: "skill-casual"
            },
            {
                threshold: 6,
                title: "Comfortable User",
                description: "You're getting comfortable with Blender's interface.",
                icon: "fas fa-thumbs-up",
                className: "skill-comfortable"
            },
            {
                threshold: 8,
                title: "Proficient User",
                description: "You're working efficiently with Blender's tools.",
                icon: "fas fa-user",
                className: "skill-proficient"
            },
            {
                threshold: 10,
                title: "Advanced User",
                description: "You know Blender well and work efficiently.",
                icon: "fas fa-user-tie",
                className: "skill-advanced"
            },
            {
                threshold: 12,
                title: "Blender Expert",
                description: "You've mastered most of Blender's shortcuts.",
                icon: "fas fa-user-graduate",
                className: "skill-expert"
            },
            {
                threshold: 14,
                title: "Blender Master",
                description: "You're lightning fast and incredibly knowledgeable!",
                icon: "fas fa-crown",
                className: "skill-master"
            },
            {
                threshold: 15,
                title: "Blender Prodigy",
                description: "Wow! You're on Blender developer level!",
                icon: "fas fa-medal",
                className: "skill-prodigy"
            }
        ];
        
        // Find appropriate skill level based on points
        for (let i = skillLevels.length - 1; i >= 0; i--) {
            if (skillPoints >= skillLevels[i].threshold) {
                return skillLevels[i];
            }
        }
        
        // Default if something goes wrong
        return skillLevels[0];
    }
    
    // Format seconds into minutes:seconds
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    }
    
    // Utility function to shuffle an array
    function shuffleArray(array) {
        return [...array].sort(() => Math.random() - 0.5);
    }
    
    // Function to trigger confetti animation
    function triggerConfetti() {
        // Confetti animation logic here
    }
    
    // Helper function to get the appropriate icon for difficulty level
    function getDifficultyIcon(difficulty) {
        switch(difficulty) {
            case 'noob': return 'fas fa-baby';
            case 'easy': return 'fas fa-user';
            case 'intermediate': return 'fas fa-user-graduate';
            case 'pro': return 'fas fa-crown';
            default: return 'fas fa-question';
        }
    }
    
    // Helper function to get the appropriate color for difficulty level
    function getDifficultyColor(difficulty) {
        switch(difficulty) {
            case 'noob': return '#4caf50';
            case 'easy': return '#2196f3';
            case 'intermediate': return '#ff9800';
            case 'pro': return '#f44336';
            default: return '#7b6cf6';
        }
    }
    
    // Utility function to convert hex to rgba
    function hexToRgb(hex) {
        hex = hex.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `${r}, ${g}, ${b}`;
    }
});
