document.addEventListener('DOMContentLoaded', () => {
    const icons = document.querySelectorAll('.icon');
    const iconSize = 30; 

    const positions = JSON.parse(localStorage.getItem('iconPositions')) || [];

    function isOverlapping(x, y, size) {
        return positions.some(({ x: px, y: py, size: ps }) => {
            const dx = px - x;
            const dy = py - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance < (ps / 2 + size / 2) * 2.5;
        });
    }

    icons.forEach((icon, index) => {
        let x, y;

        // Use stored position if available, otherwise find a new position
        if (positions[index]) {
            ({ x, y } = positions[index]);
        } else {
            do {
                x = Math.random() * (window.innerWidth - iconSize);
                y = Math.random() * (window.innerHeight - iconSize);
            } while (isOverlapping(x, y, iconSize));
            positions.push({ x, y, size: iconSize });
            localStorage.setItem('iconPositions', JSON.stringify(positions));
        }

        const size = 22.5 + Math.random() * 20; 
        const rotation = Math.random() * 360; 

        icon.style.left = `${x}px`;
        icon.style.top = `${y}px`;
        icon.style.fontSize = `${size}px`;
        icon.style.transform = `rotate(${rotation}deg)`;
    });
});
