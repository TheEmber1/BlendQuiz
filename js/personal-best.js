document.addEventListener('DOMContentLoaded', () => {
    // Check if the personal best container exists on the page
    const pbContainer = document.getElementById('personal-best-container');
    if (!pbContainer) return;
    
    displayPersonalBest();
    
    /**
     * Get and display personal best and recent assessment scores
     */
    function displayPersonalBest() {
        try {
            // Get saved scores from localStorage
            const savedScores = JSON.parse(localStorage.getItem('assessmentScores') || '[]');
            
            // If no scores, show message
            if (savedScores.length === 0) {
                pbContainer.innerHTML = `
                    <div class="empty-pb-message">
                        <i class="fas fa-trophy"></i>
                        <p>Complete a Skill Assessment to see your Personal Best here!</p>
                    </div>
                `;
                return;
            }
            
            // Personal best is the highest score
            const personalBest = savedScores[0];
            
            // Create the personal best card
            let pbHTML = `
                <div class="pb-section">
                    <h3>Personal Best</h3>
                    <div class="pb-card">
                        <div class="pb-score">
                            <span class="pb-score-value">${personalBest.scorePoints}%</span>
                            <span class="pb-score-label">Score</span>
                        </div>
                        <div class="pb-details">
                            <div class="pb-detail">
                                <i class="fas fa-check-circle"></i>
                                <span>${personalBest.correctCount}/${personalBest.totalQuestions} Correct</span>
                            </div>
                            <div class="pb-detail">
                                <i class="fas fa-clock"></i>
                                <span>${personalBest.completionTime}</span>
                            </div>
                            <div class="pb-detail">
                                <i class="fas fa-medal"></i>
                                <span>${personalBest.skillLevel || 'N/A'}</span>
                            </div>
                            <div class="pb-detail">
                                <i class="fas fa-calendar"></i>
                                <span>${formatDate(personalBest.timestamp)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Add recent scores section if there are more than one score
            if (savedScores.length > 1) {
                pbHTML += `
                    <div class="recent-scores-section">
                        <h3>Recent Assessments</h3>
                        <div class="recent-scores">
                `;
                
                // Add each recent score (excluding the first one which is PB)
                for (let i = 1; i < savedScores.length; i++) {
                    const score = savedScores[i];
                    pbHTML += `
                        <div class="recent-score-card">
                            <div class="recent-score">
                                <span class="recent-score-value">${score.scorePoints}%</span>
                            </div>
                            <div class="recent-score-details">
                                <div class="recent-score-detail">
                                    <i class="fas fa-check-circle"></i>
                                    <span>${score.correctCount}/${score.totalQuestions}</span>
                                </div>
                                <div class="recent-score-detail">
                                    <i class="fas fa-clock"></i>
                                    <span>${score.completionTime}</span>
                                </div>
                                <div class="recent-score-detail" title="${score.skillLevel || 'Not available'}">
                                    <i class="fas fa-medal"></i>
                                    <span>${score.skillLevel || 'N/A'}</span>
                                </div>
                                <div class="recent-score-detail">
                                    <i class="fas fa-calendar"></i>
                                    <span>${formatDate(score.timestamp)}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }
                
                pbHTML += `
                        </div>
                    </div>
                `;
            }
            
            // Set the HTML
            pbContainer.innerHTML = pbHTML;
        } catch (error) {
            console.error('Error displaying personal best:', error);
            pbContainer.innerHTML = `<p>Error loading scores: ${error.message}</p>`;
        }
    }
    
    /**
     * Format date to a readable format
     */
    function formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }).format(date);
        } catch (e) {
            return 'Invalid date';
        }
    }
});
