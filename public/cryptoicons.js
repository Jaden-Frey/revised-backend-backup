document.addEventListener('DOMContentLoaded', () => {
    const icons = document.querySelectorAll('.icon');
    const iconSize = 30; 
    const gap = 40;  

    const positions = JSON.parse(localStorage.getItem('iconPositions')) || [];

    function calculateGridPosition(index) {
        const columns = Math.floor(window.innerWidth / (iconSize + gap));
        const x = (index % columns) * (iconSize + gap);
        const y = Math.floor(index / columns) * (iconSize + gap);
        return { x, y };
    }

    icons.forEach((icon, index) => {
        let x, y;

        if (positions[index]) {
            ({ x, y } = positions[index]);
        } else {
            ({ x, y } = calculateGridPosition(index));
            positions.push({ x, y, size: iconSize });
            localStorage.setItem('iconPositions', JSON.stringify(positions));
        }

        const size = 16 + Math.random() * 10; 
        const rotation = Math.random() * 30 - 15; 

        icon.style.position = 'absolute';
        icon.style.left = `${x}px`;
        icon.style.top = `${y}px`;
        icon.style.fontSize = `${size}px`;
        icon.style.transform = `rotate(${rotation}deg)`;
    });
});
