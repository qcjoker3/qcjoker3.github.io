// ==========================================================
// UTILITAIRE
// ==========================================================
const formatCurrency = (val) => {
    return new Intl.NumberFormat('fr-CA', { 
        style: 'currency', 
        currency: 'CAD', 
        maximumFractionDigits: 0 
    }).format(val);
};

// ==========================================================
// MODULE 1 : CALCULATEUR FIRE
// ==========================================================
function calculateFIRE() {
    const monthlyExpense = parseFloat(document.getElementById('fire-expense').value) || 0;
    const swr = parseFloat(document.getElementById('fire-swr').value) / 100 || 0.04;
    const currentCapital = parseFloat(document.getElementById('fire-current').value) || 0;

    const annualExpense = monthlyExpense * 12;
    
    // Le Chiffre Magique (Capital cible)
    const targetCapital = swr > 0 ? annualExpense / swr : 0;
    
    // Pourcentage d'avancement (Capé à 100%)
    let progress = 0;
    if (targetCapital > 0) {
        progress = Math.min((currentCapital / targetCapital) * 100, 100);
    }

    const gap = targetCapital - currentCapital;

    // Mise à jour DOM
    document.getElementById('res-fire-target').innerText = formatCurrency(targetCapital);
    document.getElementById('res-fire-progress-bar').style.width = progress + "%";
    
    const verdictEl = document.getElementById('res-fire-verdict');
    if (gap <= 0) {
        verdictEl.innerText = "🎉 Indépendance atteinte. Vous êtes libre.";
        verdictEl.style.color = "#2DD4BF";
    } else {
        verdictEl.innerText = `Il vous manque ${formatCurrency(gap)} pour être techniquement libre.`;
        verdictEl.style.color = "var(--heading-color)";
    }
}

// ==========================================================
// MODULE 2 : DUEL RRQ VS PRIVÉ (ACTUARIEL)
// ==========================================================
function calculateRRQ() {
    const salary = parseFloat(document.getElementById('rrq-salary').value) || 0;
    const nominalReturn = parseFloat(document.getElementById('rrq-return').value) / 100 || 0;
    const years = parseFloat(document.getElementById('rrq-years').value) || 0;

    // --- PARAMÈTRES RÉELS (Ex: Québec 2026) ---
    const inflation = 0.021; // Cible de la Banque du Canada
    const MGA = 72900;       // Maximum des gains admissibles
    const exemption = 3500;  // Exemption de base
    
    // Taux employé (Régime de base 5.4% + Bonification env. 1% = 6.4%)
    const employeeRate = 0.064; 

    // Calcul du rendement réel (Formule de Fisher) : (1+Nominal)/(1+Inflation) - 1
    const realReturn = (1 + nominalReturn) / (1 + inflation) - 1;

    // 1. L'argent qui sort des poches de l'employé
    const eligibleEarnings = Math.max(0, Math.min(salary, MGA) - exemption);
    const annualEmployeeContrib = eligibleEarnings * employeeRate;

    // 2. Valeur future (en dollars constants d'aujourd'hui)
    let finalCapitalReal = 0;
    if (realReturn === 0) {
        finalCapitalReal = annualEmployeeContrib * years;
    } else {
        // Formule de valeur future d'une rente fin de période
        finalCapitalReal = annualEmployeeContrib * ((Math.pow(1 + realReturn, years) - 1) / realReturn);
    }

    // 3. Rente RRQ Estimée (Approximation de 33.3% du salaire moyen de carrière plafonné)
    const rrqRentAnnual = Math.min(salary, MGA) * 0.3333;

    // 4. Revenu privé (Règle du 4%)
    const privateIncomeAnnual = finalCapitalReal * 0.04;

    // --- MISE À JOUR DOM ---
    document.getElementById('res-rrq-rent').innerText = formatCurrency(rrqRentAnnual) + " / an";
    document.getElementById('res-priv-legacy').innerText = formatCurrency(finalCapitalReal);
    document.getElementById('res-priv-income').innerText = formatCurrency(privateIncomeAnnual) + " / an";

    // --- VERDICT ---
    const verdictEl = document.getElementById('res-rrq-verdict');
    if (rrqRentAnnual > privateIncomeAnnual) {
        verdictEl.innerHTML = `La RRQ garantit une rente plus élevée que le retrait sécuritaire privé. <strong style="color:#EF4444;">Cependant</strong>, pour obtenir cette rente, vous sacrifiez un capital de <span style="color:#2DD4BF; font-weight:bold;">${formatCurrency(finalCapitalReal)}</span> que vous auriez pu léguer à vos proches.`;
    } else {
        verdictEl.innerHTML = `L'investissement privé est supérieur sur toute la ligne : il génère plus de revenus annuels ET vous permet de conserver un patrimoine intact de <span style="color:#2DD4BF; font-weight:bold;">${formatCurrency(finalCapitalReal)}</span>.`;
    }
}

// ==========================================================
// INITIALISATION
// ==========================================================
document.addEventListener('DOMContentLoaded', () => {
    // On lance les calculs initiaux pour remplir les boîtes avec les valeurs par défaut
    calculateFIRE();
    calculateRRQ();
});
