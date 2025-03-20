// This file is now redirecting to the effects.js file
// It's kept for backward compatibility

// Making sure we don't break existing code
if (typeof window.triggerConfetti !== 'function') {
    // Just a fallback in case effects.js isn't loaded
    window.triggerConfetti = function() {
        console.log('Confetti effect triggered! (Effects module not loaded)');
    };
}
