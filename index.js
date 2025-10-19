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

        // ==================================================
    // === METTEZ VOS CHIFFRES À JOUR ICI ===
    // ==================================================
    const sp500Target = 5500; // La prévision cible pour la fin de l'année
    const sp500Current = 5200; // Le niveau actuel du S&P 500
    // ==================================================

    // Calculs automatiques
    const percentage = ((sp500Target / sp500Current) - 1) * 100;
    const remaining = sp500Target - sp500Current;

    // Mise à jour des éléments HTML
    const percentageElement = document.getElementById('percentageGap');
    const currentLevelElement = document.getElementById('currentLevelText');
    const gaugeTargetElement = document.getElementById('gaugeTargetText');
    
    currentLevelElement.textContent = `${sp500Current} pts`;
    gaugeTargetElement.innerHTML = `Cible: <strong>${sp500Target}</strong> pts`;
    percentageElement.textContent = `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;

    // Appliquer la bonne couleur (vert si positif, rouge si négatif)
    if (percentage >= 0) {
        percentageElement.classList.add('success');
        percentageElement.classList.remove('failure');
    } else {
        percentageElement.classList.add('failure');
        percentageElement.classList.remove('success');
    }

    // Configuration du graphique en jauge (demi-cercle)
    const ctx = document.getElementById('sp500Gauge').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [sp500Current, remaining > 0 ? remaining : 0], // Affiche le remplissage et ce qu'il reste
                backgroundColor: [
                    '#0D9488', // Couleur principale (remplissage)
                    '#E5E7EB'  // Couleur de fond (ce qu'il reste à atteindre)
                ],
                borderWidth: 0,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '80%', // Épaisseur de l'anneau
            rotation: -90, // Fait commencer le graphique à gauche
            circumference: 180, // Fait un demi-cercle
            plugins: {
                legend: { display: false }, // Cache la légende
                tooltip: { enabled: false } // Désactive les infobulles
            }
        }
    });
    });
