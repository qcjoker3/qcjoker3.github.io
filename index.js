/**
 * FINOZA - index.js
 * Gestion des onglets, des calculateurs rapides et de la jauge S&P 500
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. GESTION DES ONGLETS (Outils Rapides) ---
    const tabs = document.querySelectorAll('.tab-btn');
    const panes = document.querySelectorAll('.tab-pane');

    if (tabs.length > 0) {
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // Retirer la classe active de tous les boutons et contenus
                tabs.forEach(t => t.classList.remove('active'));
                panes.forEach(p => p.classList.remove('active'));
                
                // Activer le bouton cliqué et son contenu
                this.classList.add('active');
                const targetId = this.getAttribute('data-tab');
                const targetPane = document.getElementById('tab-' + targetId);
                if (targetPane) {
                    targetPane.classList.add('active');
                }
            });
        });
    }

    // --- 2. INITIALISATION DE LA JAUGE S&P 500 ---
    // Cette partie utilise vos IDs originaux pour ne pas briser votre widget
    initSP500Gauge();

});

// --- 3. FONCTIONS DE CALCUL (Accessibles par les boutons HTML) ---

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(amount);
};

function calculateAuto() {
    const repairCost = parseFloat(document.getElementById('repair-cost').value);
    const newCarPrice = parseFloat(document.getElementById('new-car-price').value);
    const resultDiv = document.getElementById('auto-result');
    
    if (isNaN(repairCost) || isNaN(newCarPrice) || repairCost <= 0 || newCarPrice <= 0) return;

    // Hypothèse : 8% intérêt sur 7 ans
    const rate = 0.08;
    const monthlyPayment = (newCarPrice * (1 + (rate * 7))) / (7 * 12);
    const monthsEquivalent = Math.round(repairCost / monthlyPayment);

    resultDiv.innerHTML = `Cette réparation de <strong>${formatCurrency(repairCost)}</strong> représente environ <strong>${monthsEquivalent} mois</strong> de paiements pour votre nouvelle auto. En achetant neuf, vous paierez des milliers de dollars en intérêts. Réparez !`;
    resultDiv.classList.remove('hidden');
}

function calculateRent() {
    const rent = parseFloat(document.getElementById('rent-cost').value);
    const resultDiv = document.getElementById('rent-result');
    if (isNaN(rent) || rent <= 0) return;

    // Calcul cumulatif sur 25 ans avec 2.5% d'augmentation annuelle
    let totalPaid = 0;
    let currentRent = rent;
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
