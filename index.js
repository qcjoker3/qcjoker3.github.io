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
    // === VOS CHIFFRES SONT DÉJÀ ICI ===
    // ==================================================
    const sp500Target = 6679; // La prévision cible pour la fin de l'année
    const sp500Current = 6688; // Le niveau actuel du S&P 500
    // ==================================================

    // Récupération des éléments HTML
    const percentageElement = document.getElementById('percentageGap');
    // Note: .previousSibling peut être fragile. Utilisons une méthode plus robuste si possible,
    // mais pour l'instant, nous gardons votre logique.
    const gapLabelElement = document.getElementById('gapLabel');
    const currentLevelElement = document.getElementById('currentLevelText');
    const gaugeTargetElement = document.getElementById('gaugeTargetText');
    
    // Variables pour la configuration du graphique qui seront définies dans la logique
    let chartData;
    let chartColors;
    
    // Mise à jour des textes qui sont toujours les mêmes
    currentLevelElement.textContent = `${sp500Current} pts`;
    gaugeTargetElement.innerHTML = `Cible: <strong>${sp500Target}</strong> pts`;

    // ----- LOGIQUE POUR GÉRER LES DEUX SCÉNARIOS -----

    if (sp500Current > sp500Target) {
        // --- CAS 1 : SURPERFORMANCE (le niveau actuel DÉPASSE la cible) ---

        const surplus = sp500Current - sp500Target;
        const percentage = (surplus / sp500Target) * 100; // Calcul du % de dépassement

        // Le graphique montrera la cible + le surplus
        chartData = [sp500Target, surplus];
        chartColors = [
            '#0D9488', // Couleur verte jusqu'à la cible
            '#F59E0B'  // Couleur AMBRE pour le surplus qui dépasse
        ];

        // Mettre à jour le texte et la classe CSS
        gapLabelElement.textContent = "Surperformance";
        percentageElement.textContent = `+${percentage.toFixed(2)}%`;
        percentageElement.className = 'warning'; // Applique la classe pour la couleur ambre

    } else {
        // --- CAS 2 : NORMAL (le niveau actuel est EN DESSOUS de la cible) ---

        const remaining = sp500Target - sp500Current;
        const percentage = ((sp500Target / sp500Current) - 1) * 100;

        // Le graphique montrera la progression et ce qu'il reste
        chartData = [sp500Current, remaining];
        chartColors = [
            '#0D9488', // Couleur verte pour la progression
            '#E5E7EB'  // Couleur grise pour ce qu'il reste
        ];

        // Mettre à jour le texte et la classe CSS
        gapLabelElement.textContent = "Potentiel Haussier";
        percentageElement.textContent = `+${percentage.toFixed(2)}%`;
        percentageElement.className = 'success'; // Applique la classe pour la couleur verte
    }

    // --- CRÉATION DU GRAPHIQUE AVEC LES DONNÉES PRÉPARÉES ---
    const ctx = document.getElementById('sp500Gauge').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: chartData, // Utilise les données du bon scénario
                backgroundColor: chartColors, // Utilise les couleurs du bon scénario
                borderWidth: 0,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '80%',
            rotation: -90,
            circumference: 180,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            }
        }
    });
});
