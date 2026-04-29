document.addEventListener('DOMContentLoaded', () => {
    // --- GESTION DES ONGLETS (Outils Rapides) ---
    const tabs = document.querySelectorAll('.tab-btn');
    const panes = document.querySelectorAll('.tab-pane');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Retirer la classe active de tous les boutons et panneaux
            tabs.forEach(t => t.classList.remove('active'));
            panes.forEach(p => p.classList.remove('active'));
            
            // Ajouter la classe active au bouton cliqué et à son contenu correspondant
            tab.classList.add('active');
            const targetId = tab.getAttribute('data-tab');
            document.getElementById(`tab-${targetId}`).classList.add('active');
        });
    });
});

// Formateur de devise pour l'affichage ($ CAD)
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(amount);
};

// --- CALCULS DES OUTILS RAPIDES ---

// 1. Outil : Auto vs Réparation
function calculateAuto() {
    const repairCost = parseFloat(document.getElementById('repair-cost').value);
    const newCarPrice = parseFloat(document.getElementById('new-car-price').value);
    const resultDiv = document.getElementById('auto-result');

    if (isNaN(repairCost) || isNaN(newCarPrice) || repairCost <= 0 || newCarPrice <= 0) {
        resultDiv.innerHTML = "Veuillez entrer des montants valides.";
        resultDiv.classList.remove('hidden');
        return;
    }

    // Hypothèse choc : 8% d'intérêt sur 7 ans pour un prêt auto
    const rate = 0.08;
    const years = 7;
    // Formule simplifiée d'intérêts pour l'impact choc
    const totalInterest = (newCarPrice * rate * years) * 0.55; 
    const monthlyPayment = (newCarPrice + totalInterest) / (years * 12);
    
    const monthsEquivalent = Math.round(repairCost / monthlyPayment);

    resultDiv.innerHTML = `Cette réparation de <strong>${formatCurrency(repairCost)}</strong> représente seulement <strong>${monthsEquivalent} mois</strong> de paiement de votre nouvelle voiture. En achetant neuf, vous paierez environ <strong>${formatCurrency(totalInterest)} juste en intérêts</strong>. Considérez réparer votre auto !`;
    resultDiv.classList.remove('hidden');
}

// 2. Outil : Choc du Locataire
function calculateRent() {
    const rent = parseFloat(document.getElementById('rent-cost').value);
    const resultDiv = document.getElementById('rent-result');

    if (isNaN(rent) || rent <= 0) {
        resultDiv.innerHTML = "Veuillez entrer un loyer valide.";
        resultDiv.classList.remove('hidden');
        return;
    }

    // Hypothèse : augmentation de loyer de 2.5% par an sur 25 ans
    let totalPaid = 0;
    let currentRent = rent;
    for (let i = 0; i < 25; i++) {
        totalPaid += currentRent * 12;
        currentRent *= 1.025; // Augmentation annuelle
    }

    resultDiv.innerHTML = `En 25 ans, vous aurez payé <strong>${formatCurrency(totalPaid)}</strong> en loyer. <strong>Cependant</strong>, si vous investissez judicieusement l'argent que vous sauvez en taxes foncières, intérêts hypothécaires et entretien, la location pourrait tout de même vous rendre plus riche.`;
    resultDiv.classList.remove('hidden');
}

// 3. Outil : Indépendance (Règle des 4%)
function calculateIndependence(targetIncome) {
    const resultDiv = document.getElementById('independence-result');
    const capitalNeeded = targetIncome * 25; // Règle des 4%

    resultDiv.innerHTML = `Pour générer <strong>${formatCurrency(targetIncome)}</strong> par an de façon perpétuelle (selon la règle de retrait sécuritaire de 4 %), votre portefeuille de placements devra atteindre <strong>${formatCurrency(capitalNeeded)}</strong>.`;
    resultDiv.classList.remove('hidden');
}

// 4. Outil : Dépenses (Coût d'opportunité)
function calculateExpense() {
    const weekly = parseFloat(document.getElementById('weekly-expense').value);
    const resultDiv = document.getElementById('expense-result');

    if (isNaN(weekly) || weekly <= 0) {
        resultDiv.innerHTML = "Veuillez entrer une dépense valide.";
        resultDiv.classList.remove('hidden');
        return;
    }

    // Investissement de la dépense hebdomadaire à 7% de rendement réel sur 10 ans
    const monthlyInvestment = (weekly * 52) / 12;
    const rate = 0.07 / 12; // Taux mensuel
    const months = 10 * 12; // 10 ans
    const futureValue = monthlyInvestment * ((Math.pow(1 + rate, months) - 1) / rate);

    resultDiv.innerHTML = `Si vous aviez investi ces <strong>${formatCurrency(weekly)}</strong> par semaine dans le S&P 500 (~7% de rendement réel annuel) pendant 10 ans, vous auriez <strong>${formatCurrency(futureValue)}</strong> en banque aujourd'hui.`;
    resultDiv.classList.remove('hidden');
}
