document.addEventListener('DOMContentLoaded', function () {
    // Personalize the username
    const usernameElement = document.getElementById('username');
    const username = usernameElement.textContent.trim();
    usernameElement.innerHTML = `<span class="wobble">${username}</span>`;

     // Trigger confetti from both ends
     const duration = 3 * 1000; // Reduce duration to 3 seconds
     const animationEnd = Date.now() + duration;
     const defaults = { startVelocity: 20, spread: 180, ticks: 30, zIndex: 0 }; // Reduced velocity, spread, and ticks
 
     function randomInRange(min, max) {
         return Math.random() * (max - min) + min;
     }
 
     const interval = setInterval(function() {
         const timeLeft = animationEnd - Date.now();
 
         if (timeLeft <= 0) {
             return clearInterval(interval);
         }
 
         const particleCount = 75 * (timeLeft / duration); // Reduce particle count
         // Different colors for confetti
         const colors = ['#a3e4d7', '#76d7c4', '#48c9b0', '#1abc9c', '#16a085', '#ffeb3b', '#ff5722', '#e91e63'];
 
         colors.forEach(color => {
             confetti(Object.assign({}, defaults, { particleCount, origin: { x: Math.random() * 0.2, y: Math.random() - 0.2 }, colors: [color] }));
             confetti(Object.assign({}, defaults, { particleCount, origin: { x: Math.random() * 0.2 + 0.8, y: Math.random() - 0.2 }, colors: [color] }));
         });
     }, 250);

});
