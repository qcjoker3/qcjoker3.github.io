// --- 1. GESTION DES ONGLETS (Sécurisée) ---
document.addEventListener('DOMContentLoaded', () => {
    try {
        const tabs = document.querySelectorAll('.tab-btn');
        const panes = document.querySelectorAll('.tab-pane');

        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // 1. Enlever la classe active partout
                tabs.forEach(t => t.classList.remove('active'));
                panes.forEach(p => p.classList.remove('active'));
                
                // 2. Ajouter la classe active au bouton cliqué
                this.classList.add('active');
                
                // 3. Afficher le panneau correspondant
                const targetId = this.getAttribute('data-tab');
                const targetPane = document.getElementById('tab-' + targetId);
                if (targetPane) {
                    targetPane.classList.add('active');
                }
            });
        });
        console.log("Onglets chargés avec succès !");
    } catch (error) {
        console.error("Erreur avec les onglets :", error);
    }

    // --- 2. INITIALISATION DE LA JAUGE S&P 500 ---
    try {
        initSP500Gauge();
    } catch (error) {
        console.error("Erreur avec la jauge S&P 500 :", error);
    }
});

// --- 3. FONCTIONS DE CALCUL DES ONGLETS ---
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(amount);
};

function calculateAuto() {
    const repairCost = parseFloat(document.getElementById('repair-cost').value);
    const newCarPrice = parseFloat(document.getElementById('new-car-price').value);
    const resultDiv = document.getElementById('auto-result');
    if (isNaN(repairCost) || isNaN(newCarPrice) || repairCost <= 0 || newCarPrice <= 0) return;

    const rate = 0.08; const years = 7;
    const totalInterest = (newCarPrice * rate * years) * 0.55; 
    const monthlyPayment = (newCarPrice + totalInterest) / (years * 12);
    const monthsEquivalent = Math.round(repairCost / monthlyPayment);

    resultDiv.innerHTML = `Cette réparation de <strong>${formatCurrency(repairCost)}</strong> représente seulement <strong>${monthsEquivalent} mois</strong> de paiement de votre nouvelle voiture. En achetant neuf, vous paierez environ <strong>${formatCurrency(totalInterest)} juste en intérêts</strong>. Considérez réparer !`;
    resultDiv.classList.remove('hidden');
}

function calculateRent() {
    const rent = parseFloat(document.getElementById('rent-cost').value);
    const resultDiv = document.getElementById('rent-result');
    if (isNaN(rent) || rent <= 0) return;

    let totalPaid = 0; let currentRent = rent;
    for (let i = 0; i < 25; i++) { totalPaid += currentRent * 12; currentRent *= 1.025; }

    resultDiv.innerHTML = `En 25 ans, vous aurez payé <strong>${formatCurrency(totalPaid)}</strong> en loyer. <strong>Cependant</strong>, si vous investissez judicieusement l'argent sauvé en taxes et entretien, la location pourrait tout de même vous rendre plus riche.`;
    resultDiv.classList.remove('hidden');
}

function calculateIndependence(targetIncome) {
    const resultDiv = document.getElementById('independence-result');
    const capitalNeeded = targetIncome * 25; 
    resultDiv.innerHTML = `Pour générer <strong>${formatCurrency(targetIncome)}</strong> par an (règle des 4%), votre portefeuille devra atteindre <strong>${formatCurrency(capitalNeeded)}</strong>.`;
    resultDiv.classList.remove('hidden');
}

function calculateExpense() {
    const weekly = parseFloat(document.getElementById('weekly-expense').value);
    const resultDiv = document.getElementById('expense-result');
    if (isNaN(weekly) || weekly <= 0) return;

    const monthlyInvestment = (weekly * 52) / 12;
    const rate = 0.07 / 12; const months = 10 * 12; 
    const futureValue = monthlyInvestment * ((Math.pow(1 + rate, months) - 1) / rate);

    resultDiv.innerHTML = `Si vous aviez investi ces <strong>${formatCurrency(weekly)}</strong> par semaine dans le S&P 500 (~7% de rendement réel) pendant 10 ans, vous auriez <strong>${formatCurrency(futureValue)}</strong> en banque aujourd'hui.`;
    resultDiv.classList.remove('hidden');
}

// --- 4. LE VRAI CODE DE LA JAUGE S&P 500 (100% Statique et Rapide) ---
function initSP500Gauge() {
    // 1. S'assurer que les données existent dans donnees.js
    if (typeof chartDataByYear === 'undefined' || typeof niveauActuelSP500 === 'undefined') {
        console.warn("Fichier donnees.js introuvable ou incomplet.");
        return;
    }

    // 2. Aller chercher les prévisions de l'année en cours
    const annees = Object.keys(chartDataByYear).sort();
    const anneeRecente = annees[annees.length - 1];
    const previsionsBanques = chartDataByYear[anneeRecente].previsions;
    
    // 3. UTILISER VOTRE CHIFFRE MANUEL
    const niveauActuel = niveauActuelSP500; 

    // 4. CALCUL DU CONSENSUS (Moyenne)
    const sommePrevisions = previsionsBanques.reduce((a, b) => a + b, 0);
    const cibleMoyenne = Math.round(sommePrevisions / previsionsBanques.length);
    
    // 5. CALCUL DU POTENTIEL
    const ecart = cibleMoyenne - niveauActuel;
    const potentielPourcentage = ((ecart / niveauActuel) * 100).toFixed(1);
    const signe = ecart >= 0 ? '+' : '';

    // 6. MISE À JOUR DU TEXTE HTML
    const currentTextEl = document.getElementById('currentLevelText');
    const targetTextEl = document.getElementById('gaugeTargetText');
    const gapTextEl = document.getElementById('percentageGap');

    if (currentTextEl) currentTextEl.innerText = niveauActuel.toLocaleString('fr-CA') + " pts";
    if (targetTextEl) targetTextEl.innerHTML = `<strong>${cibleMoyenne.toLocaleString('fr-CA')}</strong><br>Points`;
    if (gapTextEl) {
        gapTextEl.innerText = `${signe}${potentielPourcentage}%`;
        gapTextEl.className = ecart >= 0 ? 'success' : 'failure';
    }

    // 7. CRÉATION DU GRAPHIQUE
    const ctx = document.getElementById('sp500Gauge');
    if (ctx && typeof Chart !== 'undefined') {
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Niveau Actuel', 'Potentiel'],
                datasets: [{
                    data: [niveauActuel, Math.abs(ecart)],
                    backgroundColor: ['#E2E8F0', ecart >= 0 ? '#0D9488' : '#EF4444'],
                    borderWidth: 0,
                    circumference: 180,
                    rotation: 270
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '80%',
                plugins: { legend: { display: false }, tooltip: { enabled: false } }
            }
        });
    } else {
        console.warn("Chart.js n'est pas chargé ou l'élément canvas sp500Gauge est introuvable.");
    }
}
