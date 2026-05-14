// --- Utilitaires ---
const formatCurrency = (val) => {
    return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val);
};

function calculateFIRE() {
    // 1. Récupération des entrées
    const monthlyExpense = parseFloat(document.getElementById('fire-expense').value) || 0;
    const swr = parseFloat(document.getElementById('fire-swr').value) / 100 || 0.04;
    const currentCapital = parseFloat(document.getElementById('fire-current').value) || 0;

    const annualExpense = monthlyExpense * 12;

    // 2. Calcul du chiffre FIRE (Règle du 25x si SWR est 4%)
    // Formule : Capital = Dépenses Annuelles / Taux de retrait
    const targetCapital = annualExpense / swr;
    const gap = targetCapital - currentCapital;

    // 3. Mise à jour du DOM
    document.getElementById('fire-target').innerText = formatCurrency(targetCapital);
    document.getElementById('fire-annual-income').innerText = formatCurrency(annualExpense);

    const statusBadge = document.getElementById('fire-status');
    if (gap <= 0) {
        statusBadge.innerText = "Félicitations : Vous êtes Libre !";
        statusBadge.style.color = "#2DD4BF";
        statusBadge.style.background = "rgba(45, 212, 191, 0.1)";
    } else {
        statusBadge.innerText = `Manque à gagner : ${formatCurrency(gap)}`;
        statusBadge.style.color = "#EF4444";
        statusBadge.style.background = "rgba(239, 68, 68, 0.1)";
    }
}

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', () => {
    calculateFIRE();
});
