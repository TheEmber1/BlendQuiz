document.addEventListener('DOMContentLoaded', () => {
    // Check if we're in assessment mode
    const isAssessment = sessionStorage.getItem('isAssessment') === 'true';
    
    // Get the selected difficulty from sessionStorage (for regular quiz mode)
    const difficulty = isAssessment ? 'assessment' : (sessionStorage.getItem('quizDifficulty') || 'noob');
    
    // Display the appropriate title
    if (isAssessment) {
        document.getElementById('difficulty').textContent = 'Skill Assessment';
        document.querySelector('.quiz-info').innerHTML = `
            <span id="progress-label">Question <span id="current-question">1</span>/16</span>
            <span id="timer">Time: <span id="time-counter">0:00</span></span>
        `;
    } else {
        document.getElementById('difficulty').textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    }
    
    // Quiz state
    const state = {
        currentQuestion: 0,
        score: 0,
        totalQuestions: isAssessment ? 16 : 5,
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
    
    // Function to generate a set of assessment questions (4 from each difficulty)
    function generateAssessmentQuestions() {
        const difficultyLevels = ['noob', 'easy', 'intermediate', 'pro'];
        let allQuestions = [];
        
        // Update total questions count to 16 (4 from each of the 4 difficulty levels)
        state.totalQuestions = 16;
        
        // Get 4 questions from each difficulty level
        difficultyLevels.forEach(level => {
            const levelShortcuts = [...shortcutsByDifficulty[level]];
            const shuffledShortcuts = levelShortcuts.sort(() => Math.random() - 0.5);
            
            // Take 4 shortcuts from this level
            const selectedShortcuts = shuffledShortcuts.slice(0, 4);
            
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
        
        // Instead of shuffling, organize questions by difficulty level
        // This will make questions go from easiest (noob) to hardest (pro)
        const sortedQuestions = [];
        
        // Add questions from each difficulty level in order
        difficultyLevels.forEach(level => {
            // Get all questions for this difficulty level and shuffle them
            const levelQuestions = allQuestions.filter(q => q.difficulty === level);
            // Shuffle within the same difficulty level for variety
            const shuffledLevelQuestions = shuffleArray(levelQuestions);
            // Add these questions to our sorted array
            sortedQuestions.push(...shuffledLevelQuestions);
        });
        
        state.questions = sortedQuestions;
        
        // Update quiz info to show correct question count
        if (document.getElementById('progress-label')) {
            document.getElementById('progress-label').innerHTML = 
                `Question <span id="current-question">1</span>/${state.totalQuestions}`;
        }
    }
    
    // Function to generate regular quiz questions
    function generateQuestions(shortcuts) {
        // Regular quiz will have 7 questions total (5 from selected difficulty + 2 pro)
        state.totalQuestions = 7;
        
        // Shuffle shortcuts to get random set
        const shuffledShortcuts = [...shortcuts].sort(() => Math.random() - 0.5);
        
        // Take the first 5 shortcuts (or fewer if not enough)
        const questionCount = Math.min(5, shuffledShortcuts.length);
        
        // Create array to hold our questions
        const questionsArray = [];
        
        for (let i = 0; i < questionCount; i++) {
            const correctShortcut = shuffledShortcuts[i];
            
            // Generate 3 incorrect options
            const incorrectOptions = generateIncorrectOptions(correctShortcut);
            
            // Add the question to our array
            questionsArray.push({
                question: `What is the shortcut for "${correctShortcut.action}"?`,
                correctAnswer: correctShortcut.key,
                options: shuffleArray([...incorrectOptions, correctShortcut.key]),
                difficulty: difficulty
            });
        }
        
        // Now add 2 Pro level questions at the end
        // Get Pro shortcuts and shuffle them
        const proShortcuts = [...shortcutsByDifficulty.pro].sort(() => Math.random() - 0.5);
        
        // Take 2 Pro shortcuts that aren't already used
        let bonusCount = 0;
        let proIndex = 0;
        
        while (bonusCount < 2 && proIndex < proShortcuts.length) {
            const proShortcut = proShortcuts[proIndex];
            
            // Check if this shortcut is already used in our questions
            const isAlreadyUsed = questionsArray.some(q => 
                q.correctAnswer === proShortcut.key || 
                q.question.includes(proShortcut.action)
            );
            
            if (!isAlreadyUsed) {
                // Generate incorrect options
                const incorrectOptions = generateIncorrectOptions(proShortcut);
                
                // Add the Pro question
                questionsArray.push({
                    question: `What is the shortcut for "${proShortcut.action}"?`,
                    correctAnswer: proShortcut.key,
                    options: shuffleArray([...incorrectOptions, proShortcut.key]),
                    difficulty: 'pro',
                    isBonus: true
                });
                
                bonusCount++;
            }
            
            proIndex++;
        }
        
        // Set the questions in our state
        state.questions = questionsArray;
        
        // Update quiz info to show correct question count
        document.getElementById('progress-label').innerHTML = 
            `Question <span id="current-question">1</span>/${state.questions.length}`;
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
        
        // Update progress bar
        updateProgressBar();
        
        // Check if this is a bonus pro question and add a visual indicator
        if (question.isBonus) {
            document.getElementById('question').innerHTML = 
                `<span class="bonus-tag">BONUS PRO</span> ${question.question}`;
        } else {
            document.getElementById('question').textContent = question.question;
        }
        
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
    
    // Add function to update progress bar
    function updateProgressBar() {
        const progressBar = document.getElementById('progress-bar');
        const progressPercentage = (state.currentQuestion / state.questions.length) * 100;
        
        // Animate the progress bar
        progressBar.style.width = `${progressPercentage}%`;
        
        // Change the color slightly for visual feedback
        const hue = 260 + (progressPercentage / 100) * 10;
        progressBar.style.backgroundColor = `hsl(${hue}, 70%, 70%)`;
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
                answer: question.correctAnswer,
                isBonus: question.isBonus
            });
            
            // Ensure confetti is triggered for correct answer
            setTimeout(() => {
                if (typeof window.triggerConfetti === 'function') {
                    window.triggerConfetti();
                }
            }, 100);
            
            // Play success sound if available
            playSound('correct');
        } else {
            state.results.incorrect.push({
                question: question.question,
                userAnswer: selectedAnswer,
                correctAnswer: question.correctAnswer,
                isBonus: question.isBonus
            });
            
            // Play error sound if available
            playSound('incorrect');
        }
        
        // Highlight correct/incorrect answers
        const answerButtons = document.querySelectorAll('.answer-btn');
        answerButtons.forEach(button => {
            // Disable the button to prevent multiple answers
            button.disabled = true;
            
            if (button.textContent === question.correctAnswer) {
                // Always show the correct answer
                setTimeout(() => {
                    button.classList.add('correct');
                }, isCorrect ? 0 : 400); // Delay showing correct answer if the user was wrong
            } else if (button.textContent === selectedAnswer && !isCorrect) {
                // Mark the selected wrong answer
                button.classList.add('incorrect');
            } else {
                // Change the styling of unselected options but keep text fully visible
                button.classList.add('unselected');
            }
        });
        
        // Move to next question after a delay
        setTimeout(() => {
            state.currentQuestion++;
            displayQuestion();
        }, 1800); // Increased delay to allow animations to complete
    }
    
    // Small helper function to play sounds if we add them later
    function playSound(type) {
        // This is a placeholder for potential sound effect implementation
        // Could be connected to audio elements or Web Audio API
        // console.log(`Playing ${type} sound`);
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
    
    // Function to show the final results - modify this to redirect to results page
    function showResults() {
        // Stop the timer
        clearInterval(timer);
        
        // Record end time
        state.endTime = new Date();
        const timeTaken = Math.round((state.endTime - state.startTime) / 1000);
        const formattedTime = formatTime(timeTaken);
        
        // Calculate skill level for assessment
        let skillLevel = null;
        let scorePoints = 0;
        if (isAssessment) {
            scorePoints = calculateScorePoints(state.score, timeTaken);
            skillLevel = calculateSkillLevel(scorePoints);
        } else {
            scorePoints = calculateScorePoints(state.score, timeTaken);
        }
        
        // Prepare results data to pass to the results page
        const resultsData = {
            isAssessment: isAssessment,
            difficulty: difficulty,
            score: state.score,
            totalQuestions: state.totalQuestions,
            correct: state.results.correct,
            incorrect: state.results.incorrect,
            completionTime: formattedTime,
            completionSeconds: timeTaken,
            scorePoints: scorePoints,
            skillLevel: skillLevel
        };
        
        // Save results to sessionStorage
        sessionStorage.setItem('quizResults', JSON.stringify(resultsData));
        
        // Redirect to results page
        window.location.href = 'results.html';
    }
    
    // Helper function to calculate score points
    function calculateScorePoints(score, timeTaken) {
        const totalQuestions = state.totalQuestions;
        
        // Accuracy score (0-80 points)
        const accuracyScore = Math.round((score / totalQuestions) * 80);
        
        // Time bonus (0-20 points)
        let timeBonus = 0;
        
        if (isAssessment) {
            // For assessment mode (16 questions)
            if (timeTaken < 45) {
                timeBonus = 20; // Perfect speed - very fast!
            } else if (timeTaken < 80) {
                timeBonus = 15; // Very good speed
            } else if (timeTaken < 160) {
                timeBonus = 10; // Good speed
            } else if (timeTaken < 240) {
                timeBonus = 5;  // Average speed
            }
        } else {
            // For regular quiz (5 questions)
            if (timeTaken < 15) {
                timeBonus = 20; // Perfect speed - 15 seconds for 5 questions
            } else if (timeTaken < 30) {
                timeBonus = 15; // Very good speed
            } else if (timeTaken < 45) {
                timeBonus = 10; // Good speed
            } else if (timeTaken < 60) {
                timeBonus = 5;  // Average speed
            }
        }
        
        return accuracyScore + timeBonus;
    }
    
    // Function to calculate skill level based on score points
    function calculateSkillLevel(scorePoints) {
        // Define skill levels based on 100-point scale
        const skillLevels = [
            {
                threshold: 0,
                title: "Blender Novice",
                description: "You're just beginning your Blender journey.",
                icon: "fas fa-baby",
                className: "skill-novice"
            },
            {
                threshold: 20,
                title: "Blender Beginner",
                description: "You know a few basics, but have a lot to learn.",
                icon: "fas fa-walking",
                className: "skill-beginner"
            },
            {
                threshold: 35,
                title: "Casual User",
                description: "You can find your way around, slowly but surely.",
                icon: "fas fa-child",
                className: "skill-casual"
            },
            {
                threshold: 50,
                title: "Comfortable User",
                description: "You're getting comfortable with Blender's interface.",
                icon: "fas fa-thumbs-up",
                className: "skill-comfortable"
            },
            {
                threshold: 65,
                title: "Proficient User",
                description: "You're working efficiently with Blender's tools.",
                icon: "fas fa-user",
                className: "skill-proficient"
            },
            {
                threshold: 75,
                title: "Advanced User",
                description: "You know Blender well and work efficiently.",
                icon: "fas fa-user-tie",
                className: "skill-advanced"
            },
            {
                threshold: 85,
                title: "Blender Expert",
                description: "You've mastered most of Blender's shortcuts.",
                icon: "fas fa-user-graduate",
                className: "skill-expert"
            },
            {
                threshold: 95,
                title: "Blender Master",
                description: "You're lightning fast and incredibly knowledgeable!",
                icon: "fas fa-crown",
                className: "skill-master"
            },
            {
                threshold: 100,
                title: "Blender Prodigy",
                description: "Wow! You're on Blender developer level!",
                icon: "fas fa-medal",
                className: "skill-prodigy"
            }
        ];
        
        // Find appropriate skill level based on points
        for (let i = skillLevels.length - 1; i >= 0; i--) {
            if (scorePoints >= skillLevels[i].threshold) {
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