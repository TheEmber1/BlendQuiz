/**
 * Simple leaderboard system that works without login
 * Uses localStorage and URL parameters to track and display scores
 */

// Store for active nickname/session
let currentNickname = null;
let sessionId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check for nickname in localStorage
    currentNickname = localStorage.getItem('playerNickname');
    
    // Check URL for score claim
    checkForScoreClaim();
    
    // Update UI based on nickname
    updateUIForNickname();
});

// Set a nickname (used instead of login)
function setNickname(nickname) {
    if (!nickname || nickname.trim() === '') {
        return { success: false, message: 'Please enter a valid nickname' };
    }
    
    // Store nickname
    currentNickname = nickname.trim();
    localStorage.setItem('playerNickname', currentNickname);
    
    // Generate a session ID if not already set
    if (!sessionId) {
        sessionId = generateSessionId();
        localStorage.setItem('sessionId', sessionId);
    }
    
    // Update UI
    updateUIForNickname();
    
    return { success: true, message: 'Nickname set successfully' };
}

// Clear nickname (logout equivalent)
function clearNickname() {
    currentNickname = null;
    localStorage.removeItem('playerNickname');
    updateUIForNickname();
}

// Save score and create a shareable link
function saveScore(scoreData) {
    // If no nickname, prompt for one
    if (!currentNickname) {
        return { 
            success: false, 
            message: 'Please set a nickname first',
            requiresNickname: true 
        };
    }
    
    try {
        // Get existing scores
        const scores = JSON.parse(localStorage.getItem('leaderboardScores') || '[]');
        
        // Create a unique score ID
        const scoreId = generateScoreId();
        
        // Add nickname and timestamp to score data
        const enhancedScore = {
            ...scoreData,
            scoreId: scoreId,
            nickname: currentNickname,
            timestamp: new Date().toISOString(),
            sessionId: sessionId || localStorage.getItem('sessionId') || generateSessionId()
        };
        
        // Add to scores array
        scores.push(enhancedScore);
        
        // Sort scores (highest first)
        scores.sort((a, b) => b.scorePoints - a.scorePoints);
        
        // Save back to localStorage
        localStorage.setItem('leaderboardScores', JSON.stringify(scores));
        
        // Create shareable link
        const shareableLink = generateShareableLink(scoreId);
        
        return { 
            success: true, 
            message: 'Score saved successfully',
            shareableLink: shareableLink 
        };
    } catch (error) {
        console.error("Error saving score:", error);
        return { success: false, message: 'Error saving score' };
    }
}

// Generate a shareable link for a score
function generateShareableLink(scoreId) {
    // Create a URL with the score ID
    const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '/');
    return `${baseUrl}leaderboard.html?claim=${scoreId}`;
}

// Check URL for score claim parameter
function checkForScoreClaim() {
    const urlParams = new URLSearchParams(window.location.search);
    const claimCode = urlParams.get('claim');
    
    if (claimCode) {
        const result = claimScore(claimCode);
        showClaimResult(result);
        
        // Clear the URL parameter to prevent repeated claims
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// Claim a score from a shared link
function claimScore(scoreId) {
    // Find the score in local storage
    const scores = JSON.parse(localStorage.getItem('leaderboardScores') || '[]');
    const scoreIndex = scores.findIndex(score => score.scoreId === scoreId);
    
    if (scoreIndex === -1) {
        return { success: false, message: 'Score not found' };
    }
    
    // Add this score to the current session
    const score = scores[scoreIndex];
    
    // If user has a different nickname, ask if they want to update
    if (currentNickname && currentNickname !== score.nickname) {
        return { 
            success: true, 
            message: 'Score found under a different nickname',
            score: score,
            requiresConfirmation: true
        };
    }
    
    // If no nickname set, use the one from the score
    if (!currentNickname) {
        currentNickname = score.nickname;
        localStorage.setItem('playerNickname', currentNickname);
    }
    
    // Update the session ID for this score
    sessionId = localStorage.getItem('sessionId') || generateSessionId();
    score.sessionId = sessionId;
    scores[scoreIndex] = score;
    
    // Save back to localStorage
    localStorage.setItem('leaderboardScores', JSON.stringify(scores));
    
    return { 
        success: true, 
        message: 'Score claimed successfully',
        score: score 
    };
}

// Get all leaderboard scores
function getLeaderboard(limit = 20) {
    const scores = JSON.parse(localStorage.getItem('leaderboardScores') || '[]');
    
    // Sort by score (highest first)
    scores.sort((a, b) => b.scorePoints - a.scorePoints);
    
    // Return top scores
    return scores.slice(0, limit);
}

// Get user's personal scores
function getUserScores() {
    if (!currentNickname) return [];
    
    const allScores = JSON.parse(localStorage.getItem('leaderboardScores') || '[]');
    
    // Filter by current nickname and session ID
    const sessionId = localStorage.getItem('sessionId');
    const userScores = allScores.filter(score => {
        return score.nickname === currentNickname ||
              (sessionId && score.sessionId === sessionId);
    });
    
    // Sort by score (highest first)
    userScores.sort((a, b) => b.scorePoints - a.scorePoints);
    
    return userScores;
}

// Get user's best score
function getUserBestScore() {
    const userScores = getUserScores();
    return userScores.length > 0 ? userScores[0] : null;
}

// Check if user has a nickname
function hasNickname() {
    return currentNickname !== null;
}

// Get current nickname
function getNickname() {
    return currentNickname;
}

// Helper: Generate unique session ID
function generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

// Helper: Generate unique score ID
function generateScoreId() {
    return 'score_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

// Helper: Update UI based on nickname
function updateUIForNickname() {
    const nicknameElements = document.querySelectorAll('.nickname-display');
    nicknameElements.forEach(el => {
        if (currentNickname) {
            el.textContent = currentNickname;
            el.closest('.nickname-container')?.classList.remove('hidden');
        } else {
            el.closest('.nickname-container')?.classList.add('hidden');
        }
    });
    
    // Show/hide nickname form elements
    const nicknameFormElements = document.querySelectorAll('.nickname-form');
    nicknameFormElements.forEach(el => {
        el.style.display = currentNickname ? 'none' : 'block';
    });
    
    // Show/hide elements that should be visible to users with nicknames
    const nicknameRequiredElements = document.querySelectorAll('.nickname-required');
    nicknameRequiredElements.forEach(el => {
        el.style.display = currentNickname ? 'block' : 'none';
    });
}

// Helper: Show claim result message
function showClaimResult(result) {
    // Create a message element if needed
    let messageEl = document.getElementById('claim-message');
    if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.id = 'claim-message';
        messageEl.className = 'claim-message';
        
        // Find a good place to insert this message
        const container = document.querySelector('.leaderboard-container') || 
                         document.querySelector('main') || 
                         document.body;
        container.insertBefore(messageEl, container.firstChild);
    }
    
    if (result.success) {
        messageEl.innerHTML = `
            <div class="success-message">
                <i class="fas fa-check-circle"></i>
                <p>${result.message}</p>
                ${result.score ? `<p>Score: ${result.score.scorePoints}%</p>` : ''}
            </div>
        `;
        
        // If confirmation required, add buttons
        if (result.requiresConfirmation) {
            messageEl.innerHTML += `
                <div class="confirmation-buttons">
                    <button class="btn btn-confirm">Use This Nickname</button>
                    <button class="btn btn-cancel">Keep Current Nickname</button>
                </div>
            `;
            
            // Add button event listeners
            setTimeout(() => {
                const confirmBtn = messageEl.querySelector('.btn-confirm');
                const cancelBtn = messageEl.querySelector('.btn-cancel');
                
                if (confirmBtn) {
                    confirmBtn.addEventListener('click', () => {
                        setNickname(result.score.nickname);
                        messageEl.remove();
                    });
                }
                
                if (cancelBtn) {
                    cancelBtn.addEventListener('click', () => {
                        messageEl.remove();
                    });
                }
            }, 0);
        } else {
            // Add a close button
            messageEl.innerHTML += `
                <button class="btn btn-close">Close</button>
            `;
            
            // Add close button event listener
            setTimeout(() => {
                const closeBtn = messageEl.querySelector('.btn-close');
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => {
                        messageEl.remove();
                    });
                }
            }, 0);
        }
    } else {
        messageEl.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>${result.message}</p>
            </div>
            <button class="btn btn-close">Close</button>
        `;
        
        // Add close button event listener
        setTimeout(() => {
            const closeBtn = messageEl.querySelector('.btn-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    messageEl.remove();
                });
            }
        }, 0);
    }
    
    // Auto-remove message after 10 seconds
    setTimeout(() => {
        if (messageEl && messageEl.parentNode) {
            messageEl.remove();
        }
    }, 10000);
}

// Expose functions globally
window.simpleLeaderboard = {
    setNickname,
    clearNickname,
    saveScore,
    getLeaderboard,
    getUserScores,
    getUserBestScore,
    hasNickname,
    getNickname,
    showClaimResult
};
