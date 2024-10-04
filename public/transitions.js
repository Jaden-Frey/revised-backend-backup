window.onload = () => {
    const transitionCover = document.querySelector('.transition-cover');
    const transitionUncover = document.querySelector('.transition-uncover');
    const anchors = document.querySelectorAll('a');

    // Ensure transitions are initialized and visible
    setTimeout(() => {
        transitionCover.classList.remove('is-active');
        transitionUncover.classList.remove('is-active');
    }, 700);

    anchors.forEach(anchor => {
        anchor.addEventListener('click', e => {
            e.preventDefault();
            const target = e.target.href;

            // Trigger the transition effect
            transitionCover.classList.add('is-active');

            // Delay navigation until the transition is complete
            setTimeout(() => {
                window.location.href = target;
            }, 700); 
        });
    });
};
