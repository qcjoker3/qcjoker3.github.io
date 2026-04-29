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

// --- 4. LE VRAI CODE DE LA JAUGE (Chart.js) ---
function initSP500Gauge() {
    // Remplacer ces variables par vos vrais chiffres de consensus si nécessaire
    const currentLevel = 5100;
    const targetLevel = 5500;
    const potential = (((targetLevel - currentLevel) / currentLevel) * 100).toFixed(1);

    // Mettre à jour les textes dans le HTML
    const currentTextEl = document.getElementById('currentLevelText');
    const targetTextEl = document.getElementById('gaugeTargetText');
    const gapTextEl = document.getElementById('percentageGap');

    if (currentTextEl) currentTextEl.innerText = currentLevel.toLocaleString() + " pts";
    if (targetTextEl) targetTextEl.innerHTML = `<strong>${targetLevel.toLocaleString()}</strong> Points`;
    if (gapTextEl) gapTextEl.innerText = `+${potential}%`;

    // Dessiner la jauge si Chart.js est disponible
    const ctx = document.getElementById('sp500Gauge');
    if (ctx && typeof Chart !== 'undefined') {
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Niveau Actuel', 'Potentiel'],
                datasets: [{
                    data: [currentLevel, targetLevel - currentLevel],
                    backgroundColor: ['#E2E8F0', '#0D9488'], // Gris pâle et Teal Finoza
                    borderWidth: 0,
                    circumference: 180, // Fait un demi-cercle (jauge)
                    rotation: 270 // Commence à gauche
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '80%', // Épaisseur de l'anneau
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                }
            }
        });
    } else {
        console.warn("Chart.js n'est pas chargé ou le canvas sp500Gauge est introuvable.");
    }
}    let currentRent = rent;
    for (let i = 0; i < 25; i++) {
        totalPaid += currentRent * 12;
        currentRent *= 1.025;
    }

    resultDiv.innerHTML = `En 25 ans, vous aurez versé <strong>${formatCurrency(totalPaid)}</strong> à votre propriétaire. Est-ce vraiment mieux que d'acheter ? Utilisez notre comparateur complet.`;
    resultDiv.classList.remove('hidden');
}

function calculateIndependence(targetIncome) {
    const resultDiv = document.getElementById('independence-result');
    const capitalNeeded = targetIncome * 25; // Règle du 4%
    resultDiv.innerHTML = `Pour un revenu de <strong>${formatCurrency(targetIncome)}/an</strong>, vous avez besoin d'un capital de <strong>${formatCurrency(capitalNeeded)}</strong>.`;
    resultDiv.classList.remove('hidden');
}

function calculateExpense() {
    const weekly = parseFloat(document.getElementById('weekly-expense').value);
    const resultDiv = document.getElementById('expense-result');
    if (isNaN(weekly) || weekly <= 0) return;

    // Rendement 7% sur 10 ans
    const months = 120;
    const monthlyRate = 0.07 / 12;
    const monthlyInv = (weekly * 52) / 12;
    const futureVal = monthlyInv * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);

    resultDiv.innerHTML = `Investir ces <strong>${formatCurrency(weekly)}</strong> par semaine rapporterait <strong>${formatCurrency(futureVal)}</strong> dans 10 ans.`;
    resultDiv.classList.remove('hidden');
}

/**
 * Logique de la jauge S&P 500
 * Remettez ici votre code Chart.js original si vous en aviez un spécifique.
 */
function initSP500Gauge() {
    const canvas = document.getElementById('sp500Gauge');
    const currentText = document.getElementById('currentLevelText');
    const targetText = document.getElementById('gaugeTargetText');
    const gapText = document.getElementById('percentageGap');

    if (!canvas) return;

    // Vos chiffres réels (Exemple à mettre à jour avec vos données)
    const currentLevel = 5150; 
    const targetLevel = 5600; 
    const potential = ((targetLevel - currentLevel) / currentLevel * 100).toFixed(1);

    if(currentText) currentText.innerText = currentLevel.toLocaleString() + " pts";
    if(targetText) targetText.innerHTML = `<strong>${targetLevel.toLocaleString()}</strong> Points`;
    if(gapText) gapText.innerText = `+${potential}%`;

    // Ici, vous pouvez ajouter le "new Chart(...)" pour dessiner la jauge
    console.log("Jauge S&P 500 initialisée avec succès.");
}
