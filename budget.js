document.addEventListener('DOMContentLoaded', () => {
    // Initialisation
    calculateBudgetInflation();
    calculateCashFlow();
    
    // Menu Mobile
    const menuToggle = document.getElementById('menu-toggle');
    const navLinks = document.getElementById('nav-links');
    if(menuToggle) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('show');
        });
    }
});

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(amount);
};

// ==========================================
// WIDGET 1 : INFLATION
// ==========================================
function calculateBudgetInflation() {
    const bal = parseFloat(document.getElementById('infl-bal-slider').value);
    const rate = parseFloat(document.getElementById('infl-rate-slider').value) / 100;
    
    document.getElementById('infl-bal-val').innerText = formatCurrency(bal);
    document.getElementById('infl-rate-val').innerText = (rate * 100).toFixed(1) + " %";

    const res = document.getElementById('inflation-result-content');
    
    const power5 = bal / Math.pow(1 + rate, 5);
    const power10 = bal / Math.pow(1 + rate, 10);
    const power15 = bal / Math.pow(1 + rate, 15);

    res.innerHTML = `
        <div class="result-list-item" style="border-color: rgba(255,255,255,0.05); padding: 10px 0;">
            <span style="font-size: 0.9rem;">Dans 5 ans</span>
            <strong class="text-red">${formatCurrency(power5)}</strong>
        </div>
        <div class="result-list-item" style="border-color: rgba(255,255,255,0.05); padding: 10px 0;">
            <span style="font-size: 0.9rem;">Dans 10 ans</span>
            <strong class="text-red">${formatCurrency(power10)}</strong>
        </div>
        <div class="result-list-item" style="border-bottom: none; padding: 10px 0;">
            <span style="font-size: 0.9rem;">Dans 15 ans</span>
            <strong class="text-red">${formatCurrency(power15)}</strong>
        </div>
    `;
}

// ==========================================
// WIDGET 2 : CASH-FLOW
// ==========================================
function calculateCashFlow() {
    const biweekly = parseFloat(document.getElementById('income-biweekly').value) || 0;
    const monthlyIncome = (biweekly * 26) / 12;

    const housing = parseFloat(document.getElementById('exp-housing').value) || 0;
    const transport = parseFloat(document.getElementById('exp-transport').value) || 0;
    const life = parseFloat(document.getElementById('exp-life').value) || 0;
    const fees = parseFloat(document.getElementById('exp-fees').value) || 0;

    const totalExp = housing + transport + life + fees;
    const surplus = monthlyIncome - totalExp;

    // Projection 25 ans à 7%
    const r = 0.07 / 12;
    const n = 25 * 12;
    const wealthPotential = surplus > 0 ? surplus * ((Math.pow(1 + r, n) - 1) / r) : 0;

    const resultDiv = document.getElementById('cashflow-result');

    if (surplus > 0) {
        resultDiv.innerHTML = `
            <div class="result-metric-grid" style="gap: 2rem;">
                <div>
                    <span class="label">Revenu Mensuel Lissé</span>
                    <span class="value" style="color: var(--heading-color); font-size: 1.5rem;">${formatCurrency(monthlyIncome)}</span>
                </div>
                <div>
                    <span class="label">Capacité d'investissement</span>
                    <span class="value" style="color: var(--accent-color); font-size: 1.5rem;">+${formatCurrency(surplus)} / mois</span>
                </div>
                <div style="grid-column: span 2; margin-top: 1rem; padding-top: 2rem; border-top: 1px solid rgba(255,255,255,0.1);">
                    <span class="label" style="text-transform: uppercase; letter-spacing: 1px;">Le Pouvoir de l'Arbitrage</span>
                    <p class="text-muted" style="margin-top: 10px; font-size: 1rem;">
                        En redirigeant ce surplus (et les frais bancaires sauvés) vers des investissements à un rendement moyen de 7 %, vous pourriez accumuler d'ici 25 ans :
                    </p>
                    <span class="value" style="color: #2DD4BF; font-size: 3rem; display: block; margin: 15px 0;">${formatCurrency(wealthPotential)}</span>
                    <a href="investissements.html" class="btn-primary-large" style="width: 100%; text-align: center; margin-top: 20px;">Apprendre à investir ce capital →</a>
                </div>
            </div>
        `;
    } else {
        resultDiv.innerHTML = `
            <div class="text-center">
                <span class="label">Bilan de trésorerie</span>
                <span class="value text-red" style="font-size: 2rem; display: block; margin: 10px 0;">${formatCurrency(surplus)} / mois</span>
                <p class="text-muted" style="max-width: 500px; margin: 0 auto;">
                    Vos sorties de fonds sont supérieures à vos entrées. Avant d'investir, analysez vos forfaits et abonnements pour libérer du capital sans réduire votre qualité de vie.
                </p>
            </div>
        `;
    }
}
