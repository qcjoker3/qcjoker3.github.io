document.addEventListener('DOMContentLoaded', () => {

    // ===============================================
    // SECTION 1 : LOGIQUE DU CARROUSEL DES CALCULATRICES
    // ===============================================
    const scroller = document.getElementById('calculators-scroller');
    if (scroller) { // On vérifie si le carrousel existe sur la page
        const leftBtn = document.getElementById('scroll-left-btn');
        const rightBtn = document.getElementById('scroll-right-btn');
        const cardGrid = scroller.querySelector('.card-grid');

        if (leftBtn && rightBtn && cardGrid) {
            const cardCount = cardGrid.children.length;

            if (cardCount > 6) {
                function updateArrowState() {
                    const scrollLeft = scroller.scrollLeft;
                    const maxScroll = scroller.scrollWidth - scroller.clientWidth;
                    leftBtn.disabled = scrollLeft <= 0;
                    rightBtn.disabled = scrollLeft >= maxScroll - 5;
                }
                leftBtn.addEventListener('click', () => {
                    scroller.scrollLeft -= scroller.clientWidth * 0.8;
                });
                rightBtn.addEventListener('click', () => {
                    scroller.scrollLeft += scroller.clientWidth * 0.8;
                });
                scroller.addEventListener('scroll', updateArrowState);
                updateArrowState();
                leftBtn.style.display = 'block';
                rightBtn.style.display = 'block';
            } else {
                leftBtn.style.display = 'none';
                rightBtn.style.display = 'none';
            }
        }
    }

    // ===============================================
    // SECTION 2 : LOGIQUE DU WIDGET DE PRÉVISION S&P 500
    // ===============================================
    const sp500Target = 6679;
    const sp500Current = 6688;

    const percentageElement = document.getElementById('percentageGap');
    const gapLabelElement = document.getElementById('gapLabel');
    const currentLevelElement = document.getElementById('currentLevelText');
    const gaugeTargetElement = document.getElementById('gaugeTargetText');
    const gaugeCanvas = document.getElementById('sp500Gauge');

    // On exécute le code du widget seulement si tous ses éléments sont trouvés
    if (percentageElement && gapLabelElement && currentLevelElement && gaugeTargetElement && gaugeCanvas) {
        let chartData;
        let chartColors;
        
        currentLevelElement.textContent = `${sp500Current} pts`;
        gaugeTargetElement.innerHTML = `Cible: <strong>${sp500Target}</strong> pts`;

        if (sp500Current > sp500Target) {
            const surplus = sp500Current - sp500Target;
            const percentage = (surplus / sp500Target) * 100;
            chartData = [sp500Target, surplus];
            chartColors = ['#0D9488', '#F59E0B'];
            gapLabelElement.textContent = "Surperformance";
            percentageElement.textContent = `+${percentage.toFixed(2)}%`;
            percentageElement.className = 'warning';
        } else {
            const remaining = sp500Target - sp500Current;
            const percentage = ((sp500Target / sp500Current) - 1) * 100;
            chartData = [sp500Current, remaining];
            chartColors = ['#0D9488', '#E5E7EB'];
            gapLabelElement.textContent = "Potentiel Haussier";
            percentageElement.textContent = `+${percentage.toFixed(2)}%`;
            percentageElement.className = 'success';
        }

        const ctx = gaugeCanvas.getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: chartData,
                    backgroundColor: chartColors,
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
    }

    // ===============================================
    // SECTION 3 : CHARGEMENT DU PIED DE PAGE (FOOTER)
    // ===============================================
    fetch('footer.html')
        .then(response => {
            if (!response.ok) {
                throw new Error('footer.html non trouvé');
            }
            return response.text();
        })
        .then(data => {
            const footerPlaceholder = document.getElementById("footer-placeholder");
            if (footerPlaceholder) {
                footerPlaceholder.innerHTML = data;
            }
        })
        .catch(error => {
            console.error('Erreur lors du chargement du footer:', error);
        });

}); // Fin du 'DOMContentLoaded'
