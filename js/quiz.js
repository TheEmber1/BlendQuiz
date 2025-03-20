document.addEventListener('DOMContentLoaded', () => {
    // Get the selected difficulty from sessionStorage
    const difficulty = sessionStorage.getItem('quizDifficulty') || 'noob';
    
    // Display the difficulty on the page
    document.getElementById('difficulty').textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    
    // Quiz state
    const state = {
        currentQuestion: 0,
        score: 0,
        totalQuestions: 5,
        questions: [],
        results: {
            correct: [],
            incorrect: []
        },
        startTime: new Date(), // Track when the quiz started
        endTime: null // Will store when the quiz ends
    };
    
    // Get shortcuts for the selected difficulty
    const shortcuts = shortcutsByDifficulty[difficulty];
    
    // Generate questions for the quiz
    generateQuestions();
    
    // Display the first question
    displayQuestion();
    
    // Function to generate a set of questions
    function generateQuestions() {
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
                options: shuffleArray([...incorrectOptions, correctShortcut.key])
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
    
    // Function to show the final results
    function showResults() {
        // Record end time
        state.endTime = new Date();
        const timeTaken = Math.round((state.endTime - state.startTime) / 1000); // in seconds
        
        // Hide question container
        document.getElementById('question-container').classList.add('hidden');
        
        // Show results container
        const resultsContainer = document.getElementById('results-container');
        resultsContainer.classList.remove('hidden');
        
        // Update score
        document.getElementById('correct-count').textContent = state.score;
        
        // Add difficulty info with appropriate icon
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
