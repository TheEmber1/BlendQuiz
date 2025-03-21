// Simplified user authentication using only localStorage

// Store for active user
let currentUser = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUIForLoggedInUser();
    }
});

// User registration - simplified without email verification
function registerUser(username, password) {
    // Get existing users or initialize empty array
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Check if username already exists
    if (users.some(user => user.username.toLowerCase() === username.toLowerCase())) {
        return { success: false, message: 'Username already taken' };
    }
    
    // Create new user object
    const newUser = {
        id: generateUserId(),
        username,
        passwordHash: simpleHash(password), // In real app, use proper hashing
        joinDate: new Date().toISOString(),
        scores: []
    };
    
    // Add to users array
    users.push(newUser);
    
    // Save back to localStorage
    localStorage.setItem('users', JSON.stringify(users));
    
    return { 
        success: true, 
        message: 'Registration successful! You can now log in.' 
    };
}

// Login user
function loginUser(username, password) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Find user by username
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    
    // Check if user exists and password is correct
    if (!user || user.passwordHash !== simpleHash(password)) {
        return { success: false, message: 'Invalid username or password' };
    }
    
    // Set current user
    currentUser = {
        id: user.id,
        username: user.username
    };
    
    // Save to localStorage
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Update UI
    updateUIForLoggedInUser();
    
    return { success: true, message: 'Login successful' };
}

// Logout user
function logoutUser() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateUIForLoggedInState(false);
    
    // Redirect to home if on a page that requires login
    if (window.location.pathname.includes('leaderboard.html')) {
        window.location.href = 'index.html';
    }
}

// Save score for current user
function saveScore(scoreData) {
    console.log("SaveScore called with data:", scoreData);
    
    if (!currentUser) {
        console.error("No user logged in");
        return { success: false, message: 'User not logged in' };
    }
    
    try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        
        if (userIndex === -1) {
            console.error("User not found in storage");
            return { success: false, message: 'User not found' };
        }
        
        // Add score with timestamp
        const score = {
            ...scoreData,
            timestamp: new Date().toISOString()
        };
        
        // Add the score
        users[userIndex].scores.push(score);
        
        // Sort scores for this user (highest first)
        users[userIndex].scores.sort((a, b) => b.scorePoints - a.scorePoints);
        
        // Save back to localStorage
        localStorage.setItem('users', JSON.stringify(users));
        
        console.log("Score saved successfully for user", currentUser.username);
        return { success: true, message: 'Score saved successfully' };
    } catch (error) {
        console.error("Error in saveScore:", error);
        return { success: false, message: 'Error saving score' };
    }
}

// Get leaderboard data
function getLeaderboard(limit = 10) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Extract best scores from each user
    const scores = users.filter(u => u.scores.length > 0)
        .map(u => {
            // Get user's best score (already sorted)
            const bestScore = u.scores[0];
            return {
                username: u.username,
                scorePoints: bestScore.scorePoints,
                difficulty: bestScore.difficulty,
                correctAnswers: bestScore.correct.length,
                totalQuestions: bestScore.totalQuestions,
                completionTime: bestScore.completionTime,
                timestamp: bestScore.timestamp
            };
        });
    
    // Sort by score (highest first)
    scores.sort((a, b) => b.scorePoints - a.scorePoints);
    
    // Return top scores
    return scores.slice(0, limit);
}

// Check if user is logged in
function isLoggedIn() {
    return currentUser !== null;
}

// Get current user
function getCurrentUser() {
    return currentUser;
}

// Get user profile data
function getUserProfile() {
    if (!currentUser) {
        return null;
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.id === currentUser.id);
    
    if (!user) {
        return null;
    }
    
    return {
        username: user.username,
        joinDate: user.joinDate,
        scores: user.scores,
        bestScore: user.scores.length > 0 ? user.scores[0] : null
    };
}

// Helper: Generate simple ID
function generateUserId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

// Helper: Simple password hash (NOT secure, just for demo)
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
}

// Helper: Update UI based on login state
function updateUIForLoggedInUser() {
    if (!currentUser) return;
    
    // Find all account status elements
    const accountElements = document.querySelectorAll('.account-status');
    accountElements.forEach(el => {
        // Update text
        el.innerHTML = `
            <span class="username">${currentUser.username}</span>
            <button class="logout-btn">Logout</button>
        `;
        
        // Add logout button listener
        const logoutBtn = el.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logoutUser);
        }
    });
    
    // Update login/signup buttons
    updateUIForLoggedInState(true);
}

// Helper: Toggle visibility of login/signup buttons
function updateUIForLoggedInState(isLoggedIn) {
    // Show/hide login/signup buttons
    const loginButtons = document.querySelectorAll('.login-btn, .signup-btn');
    loginButtons.forEach(btn => {
        btn.style.display = isLoggedIn ? 'none' : 'inline-block';
    });
    
    // Show/hide account elements and leaderboard link
    const accountElements = document.querySelectorAll('.account-status, .leaderboard-link');
    accountElements.forEach(el => {
        el.style.display = isLoggedIn ? 'block' : 'none';
    });
}

// Expose functions to global scope
window.auth = {
    register: registerUser,
    login: loginUser,
    logout: logoutUser,
    saveScore: saveScore,
    getLeaderboard: getLeaderboard,
    isLoggedIn: isLoggedIn,
    getCurrentUser: getCurrentUser,
    getUserProfile: getUserProfile
};
