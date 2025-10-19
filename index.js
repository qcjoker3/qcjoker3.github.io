document.addEventListener('DOMContentLoaded', () => {
        const scroller = document.getElementById('calculators-scroller');
        const leftBtn = document.getElementById('scroll-left-btn');
        const rightBtn = document.getElementById('scroll-right-btn');
        const cardGrid = scroller.querySelector('.card-grid');

        if (scroller && leftBtn && rightBtn && cardGrid) {
            const cardCount = cardGrid.children.length;

            // N'active le carrousel que s'il y a plus de 6 cartes
            if (cardCount > 6) {
                
                function updateArrowState() {
                    const scrollLeft = scroller.scrollLeft;
                    const maxScroll = scroller.scrollWidth - scroller.clientWidth;

                    leftBtn.disabled = scrollLeft <= 0;
                    rightBtn.disabled = scrollLeft >= maxScroll - 5; // -5 pour la marge d'erreur
                }

                leftBtn.addEventListener('click', () => {
                    scroller.scrollLeft -= scroller.clientWidth * 0.8;
                });

                rightBtn.addEventListener('click', () => {
                    scroller.scrollLeft += scroller.clientWidth * 0.8;
                });

                scroller.addEventListener('scroll', updateArrowState);

                // Initialiser l'état des flèches
                updateArrowState();
                
                // Afficher les flèches
                leftBtn.style.display = 'block';
                rightBtn.style.display = 'block';

            } else {
                // Si 6 cartes ou moins, on cache les flèches
                leftBtn.style.display = 'none';
                rightBtn.style.display = 'none';
            }
        }
    });
