// main.js - Landing page card interactions

document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.algo-card');

    // Staggered entrance animation
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        card.style.transitionDelay = `${index * 0.08}s`;

        requestAnimationFrame(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        });
    });
});
