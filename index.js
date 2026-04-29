document.addEventListener('DOMContentLoaded', () => {

    // ===============================================
    // SECTION 1 : CHARGEMENT DU PIED DE PAGE (FOOTER)
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


    // ===============================================
    // SECTION 2 : LOGIQUE DU CARROUSEL DES CALCULATRICES
    // ===============================================
    const scroller = document.getElementById('calculators-scroller');
    if (scroller) {
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
                
                // Initialisation
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
    // SECTION 3 : NAVIGATION DES ONGLETS (L'ANALYSEUR)
    // ===============================================
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    if(tabButtons.length > 0) {
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // 1. Retirer la classe 'active' de tous les boutons et contenus
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                // 2. Ajouter la classe 'active' au bouton cliqué et à sa cible
                button.classList.add('active');
                const targetId = button.getAttribute('data-target');
                document.getElementById(targetId).classList.add('active');
            });
        });
    }


    // ===============================================
    // SECTION 4 : WIDGET DE PRÉVISION S&P 500 (ONGLET 1)
    // ===============================================
    const sp500Target = 6679;
    const sp500Current = 6688;

    const percentageElement = document.getElementById('percentageGap');
    const gapLabelElement = document.getElementById('gapLabel');
    const currentLevelElement = document.getElementById('currentLevelText');
    const gaugeCanvas = document.getElementById('sp500Gauge');

    if (percentageElement && gapLabelElement && currentLevelElement && gaugeCanvas) {
        let chartData;
        let chartColors;
        
        currentLevelElement.textContent = `${sp500Current} pts`;

        if (sp500Current > sp500Target) {
            const surplus = sp500Current - sp500Target;
            const percentage = (surplus / sp500Target) * 100;
            chartData = [sp500Target, surplus];
            chartColors = ['#0D9488', '#F59E0B']; // Vert Finoza et Orange (Avertissement)
            gapLabelElement.textContent = "Surperformance";
            percentageElement.textContent = `+${percentage.toFixed(2)}%`;
            percentageElement.className = 'text-green warning'; // Ajout optionnel de couleur
        } else {
            const remaining = sp500Target - sp500Current;
            const percentage = ((sp500Target / sp500Current) - 1) * 100;
            chartData = [sp500Current, remaining];
            chartColors = ['#0D9488', '#E5E7EB']; // Vert Finoza et Gris pâle
            gapLabelElement.textContent = "Potentiel Haussier";
            percentageElement.textContent = `+${percentage.toFixed(2)}%`;
            percentageElement.className = 'text-green success';
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
    // SECTION 5 : CALCULATEUR DE DETTE (ONGLET 2)
    // ===============================================
    const detteInput = document.getElementById('dette-input');
    const detteResult = document.getElementById('dette-result');

    if(detteInput) {
        detteInput.addEventListener('input', (e) => {
            let solde = parseFloat(e.target.value);
            
            if (solde > 0) {
                // Formule estimative de choc (paiement minimum de ~3%)
                let annees = Math.max(1, Math.round(solde * 0.005)); // Estimation simplifiée pour démonstration
                let interets = Math.round(solde * 1.3); // Estimation des intérêts payés
                
                const formatCAD = new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 });

                document.getElementById('dette-annees').innerText = annees;
                document.getElementById('dette-interets').innerText = formatCAD.format(interets);
                detteResult.classList.remove('hidden');
            } else {
                detteResult.classList.add('hidden');
            }
        });
    }


    // ===============================================
    // SECTION 6 : CALCULATEUR INDÉPENDANCE (ONGLET 3)
    // ===============================================
    const depensesInput = document.getElementById('depenses-input');
    const independanceResult = document.getElementById('independance-result');

    if(depensesInput) {
        depensesInput.addEventListener('input', (e) => {
            let depenses = parseFloat(e.target.value);
            
            if (depenses > 0) {
                // Règle des 4% (Dépenses annuelles multipliées par 25)
                let cibleIndependance = depenses * 25;
                const formatCAD = new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 });
                
                document.getElementById('independance-cible').innerText = formatCAD.format(cibleIndependance);
                independanceResult.classList.remove('hidden');
            } else {
                independanceResult.classList.add('hidden');
            }
        });
    }


    // ===============================================
    // SECTION 7 : WIDGET COÛT D'OPPORTUNITÉ (ONGLET 4)
    // ===============================================
    const cafeInput = document.getElementById('cafe-input');
    const opportuniteResult = document.getElementById('opportunite-result');
    const presetBtns = document.querySelectorAll('.preset-btn');

    function calculerOpportunite(montantHebdo) {
        if (montantHebdo > 0) {
            let contributionAnnuelle = montantHebdo * 52;
            let taux = 0.06; // Rendement espéré de 6%
            let annees = 10; // Période de 10 ans

            // Formule de la valeur future d'une annuité
            let valeurFuture = contributionAnnuelle * ((Math.pow(1 + taux, annees) - 1) / taux);

            const formatCAD = new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 });
            document.getElementById('opportunite-cible').innerText = formatCAD.format(valeurFuture);
            opportuniteResult.classList.remove('hidden');
        } else {
            opportuniteResult.classList.add('hidden');
        }
    }

    // A. Écouteur pour la saisie manuelle
    if(cafeInput) {
        cafeInput.addEventListener('input', (e) => {
            calculerOpportunite(parseFloat(e.target.value));
        });
    }

    // B. Écouteurs pour les boutons de présélection
    if(presetBtns.length > 0) {
        presetBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                let valeurPreset = parseFloat(btn.getAttribute('data-value'));
                
                // Met à jour le champ texte visuellement
                if(cafeInput) { cafeInput.value = valeurPreset; }
                
                // Lance le calcul
                calculerOpportunite(valeurPreset);
            });
        });
    }

}); // Fin du 'DOMContentLoaded'
