document.addEventListener('DOMContentLoaded', () => {
    calculateDebtCost();
    calculateRealEstate();

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
// WIDGET 1 : LE POIDS DE LA DETTE
// ==========================================
function calculateDebtCost() {
    const amount = parseFloat(document.getElementById('debt-amount').value) || 0;
    const pmt = parseFloat(document.getElementById('debt-payment').value) || 0;
    const resDiv = document.getElementById('debt-results');

    if (amount <= 0 || pmt <= 0) return;

    const scenarios = [
        { name: "Carte de Crédit", rate: 21.9, color: "#EF4444", bg: "rgba(239, 68, 68, 0.05)", border: "rgba(239, 68, 68, 0.3)" },
        { name: "Marge Personnelle", rate: 10.9, color: "#F59E0B", bg: "rgba(245, 158, 11, 0.05)", border: "rgba(245, 158, 11, 0.3)" },
        { name: "Marge Hypothécaire (HELOC)", rate: 4.9, color: "#2DD4BF", bg: "rgba(45, 212, 191, 0.05)", border: "rgba(45, 212, 191, 0.3)" }
    ];

    let html = '';

    scenarios.forEach(s => {
        const monthlyRate = (s.rate / 100) / 12;
        
        // Si le paiement ne couvre même pas les intérêts
        if (pmt <= amount * monthlyRate) {
            html += `
                <div style="background: ${s.bg}; padding: 2rem; border-radius: 16px; border: 1px solid ${s.border}; text-align: center;">
                    <h3 style="color: var(--heading-color); font-size: 1.1rem; margin-top: 0;">${s.name} <span style="color: ${s.color};">(${s.rate}%)</span></h3>
                    <p class="text-red font-bold" style="margin-top: 2rem;">Dette Infinie</p>
                    <p class="text-muted" style="font-size: 0.85rem;">Votre paiement ne couvre pas les frais d'intérêt mensuels.</p>
                </div>
            `;
        } else {
            const months = -Math.log(1 - (monthlyRate * amount) / pmt) / Math.log(1 + monthlyRate);
            const totalPaid = months * pmt;
            const interestPaid = totalPaid - amount;
            const years = months / 12;

            html += `
                <div style="background: ${s.bg}; padding: 2rem; border-radius: 16px; border: 1px solid ${s.border};">
                    <h3 style="color: var(--heading-color); font-size: 1.1rem; margin-top: 0; text-align: center;">${s.name} <br><span style="color: ${s.color};">(${s.rate}%)</span></h3>
                    <div style="margin-top: 1.5rem;">
                        <span style="display: block; font-size: 0.85rem; color: var(--subtle-text-color);">Temps requis</span>
                        <strong style="color: var(--heading-color); font-size: 1.2rem;">${years.toFixed(1)} ans</strong>
                    </div>
                    <div style="margin-top: 1rem;">
                        <span style="display: block; font-size: 0.85rem; color: var(--subtle-text-color);">Intérêts payés à la banque</span>
                        <strong style="color: ${s.color}; font-size: 1.5rem;">${formatCurrency(interestPaid)}</strong>
                    </div>
                </div>
            `;
        }
    });

    resDiv.innerHTML = html;
}

// ==========================================
// WIDGET 2 : LE DASHBOARD IMMOBILIER
// ==========================================
let reChart = null;

function calculateRealEstate() {
    const price = parseFloat(document.getElementById('re-price').value) || 0;
    const downPayment = parseFloat(document.getElementById('re-downpayment').value) || 0;
    const rate = parseFloat(document.getElementById('re-rate').value) / 100 || 0;
    const years = parseFloat(document.getElementById('re-years').value) || 25;
    const rent = parseFloat(document.getElementById('re-rent').value) || 0;
    
    // NOUVEAUX INPUTS : Les hypothèses de croissance
    const homeAppreciation = parseFloat(document.getElementById('re-appreciation').value) / 100 || 0;
    const marketReturn = parseFloat(document.getElementById('re-market').value) / 100 || 0;

    if (price <= 0 || years <= 0) return;

    // --- 1. CALCUL DU VRAI COÛT PROPRIÉTAIRE ---
    // A. Prime SCHL
    const ratioDown = downPayment / price;
    let cmhc = 0;
    let baseLoan = price - downPayment;
    if (ratioDown < 0.20 && ratioDown >= 0.05) {
        if (ratioDown < 0.10) cmhc = baseLoan * 0.04;
        else if (ratioDown < 0.15) cmhc = baseLoan * 0.031;
        else cmhc = baseLoan * 0.028;
    }
    const totalLoan = baseLoan + cmhc;

    // B. Mensualité hypothécaire
    const effRate = Math.pow(Math.pow(1 + (rate / 2), 2), 1/12) - 1;
    const n = years * 12;
    const monthlyMortgage = (totalLoan > 0 && effRate > 0) ? (totalLoan * effRate * Math.pow(1 + effRate, n)) / (Math.pow(1 + effRate, n) - 1) : 0;

    // C. Frais Fantômes
    const taxes = (price * 0.012) / 12; // ~1.2% annuel
    const maintenance = (price * 0.01) / 12; // 1% annuel
    const insurance = 150; 
    
    const trueMonthlyCost = monthlyMortgage + taxes + maintenance + insurance;

    // UI : Barre et détails
    const pctMortgage = (monthlyMortgage / trueMonthlyCost) * 100;
    const pctTaxes = (taxes / trueMonthlyCost) * 100;
    const pctMaint = ((maintenance + insurance) / trueMonthlyCost) * 100;

    document.getElementById('re-cost-bar').innerHTML = `
        <div class="alloc-segment" style="width: ${pctMortgage}%; background: #4F46E5;" title="Hypothèque"></div>
        <div class="alloc-segment" style="width: ${pctTaxes}%; background: #F59E0B;" title="Taxes"></div>
        <div class="alloc-segment" style="width: ${pctMaint}%; background: #EF4444;" title="Entretien & Ass."></div>
    `;

    document.getElementById('re-cost-details').innerHTML = `
        <div>
            <span class="label"><span class="dot" style="background:#4F46E5;"></span> Hypothèque (inc. SCHL)</span>
            <span class="value" style="color: var(--heading-color);">${formatCurrency(monthlyMortgage)}</span>
        </div>
        <div>
            <span class="label"><span class="dot" style="background:#F59E0B;"></span> Taxes estimées</span>
            <span class="value" style="color: var(--heading-color);">${formatCurrency(taxes)}</span>
        </div>
        <div>
            <span class="label"><span class="dot" style="background:#EF4444;"></span> Entretien & Assurances</span>
            <span class="value" style="color: var(--heading-color);">${formatCurrency(maintenance + insurance)}</span>
        </div>
        <div style="grid-column: span 2; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1.5rem; margin-top: 0.5rem;">
            <span class="label" style="color: var(--heading-color); text-transform: uppercase;">Coût Total Mensuel du Propriétaire</span>
            <span class="value" style="color: #2DD4BF; font-size: 2.2rem; display: block; margin-top: 5px;">${formatCurrency(trueMonthlyCost)}</span>
        </div>
    `;

    // --- 2. PROJECTION LOUER VS ACHETER ---
    const rentInsurance = 30;
    const trueRentCost = rent + rentInsurance;
    const monthlySavings = Math.max(0, trueMonthlyCost - trueRentCost);

    let homeValue = price;
    let renterPortfolio = downPayment; // Mise de fonds investie dès le jour 1
    let currentLoan = totalLoan;

    // Simulation année par année
    for (let year = 1; year <= 25; year++) {
        homeValue *= (1 + homeAppreciation);
        
        // Rendement boursier et ajout de l'épargne mensuelle
        renterPortfolio = (renterPortfolio * (1 + marketReturn)) + (monthlySavings * 12);
        
        // Réduction de l'hypothèque
        for(let m = 0; m < 12; m++) {
            if (currentLoan > 0) {
                let interest = currentLoan * effRate;
                let principal = monthlyMortgage - interest;
                currentLoan = Math.max(0, currentLoan - principal);
            }
        }
    }

    // Le Bilan An 25
    const finalOwner = Math.max(0, homeValue - currentLoan);
    const finalRenter = renterPortfolio;
    const diff = Math.abs(finalOwner - finalRenter);
    const isOwnerWinner = finalOwner > finalRenter;

    // NOUVEAU DASHBOARD RÉSULTATS 
    document.getElementById('re-verdict-dashboard').innerHTML = `
        <div class="result-metric-grid" style="gap: 1.5rem; margin-bottom: 2rem;">
            
            <div style="background: rgba(45, 212, 191, 0.05); border: 1px solid ${isOwnerWinner ? '#2DD4BF' : 'rgba(45, 212, 191, 0.2)'}; padding: 1.5rem; border-radius: 16px; text-align: center; box-shadow: ${isOwnerWinner ? '0 0 15px rgba(45,212,191,0.1)' : 'none'};">
                <span class="label" style="color: #2DD4BF; text-transform: uppercase;">Valeur Nette Achat</span>
                <span class="value" style="color: #2DD4BF; font-size: 2.2rem; margin: 10px 0; display: block;">${formatCurrency(finalOwner)}</span>
                <span class="subtext">Maison (${homeAppreciation*100}%) moins hypothèque</span>
            </div>

            <div style="background: rgba(168, 85, 247, 0.05); border: 1px solid ${!isOwnerWinner ? '#A855F7' : 'rgba(168, 85, 247, 0.2)'}; padding: 1.5rem; border-radius: 16px; text-align: center; box-shadow: ${!isOwnerWinner ? '0 0 15px rgba(168,85,247,0.1)' : 'none'};">
                <span class="label" style="color: #A855F7; text-transform: uppercase;">Valeur Nette Location</span>
                <span class="value" style="color: #A855F7; font-size: 2.2rem; margin: 10px 0; display: block;">${formatCurrency(finalRenter)}</span>
                <span class="subtext">Portefeuille boursier (${marketReturn*100}%)</span>
            </div>

        </div>
        
        <div style="text-align: center; padding: 1.5rem; border-radius: 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);">
            <p style="font-size: 1.2rem; color: var(--heading-color); margin: 0 0 10px 0;">
                Dans 25 ans, le <strong>${isOwnerWinner ? 'Propriétaire' : 'Locataire'}</strong> est plus riche de <span style="color: ${isOwnerWinner ? '#2DD4BF' : '#A855F7'}; font-weight: bold;">${formatCurrency(diff)}</span>.
            </p>
            <p style="font-size: 0.85rem; color: var(--subtle-text-color); margin: 0;">
                *La stratégie du locataire implique une discipline d'acier : placer la mise de fonds initiale de ${formatCurrency(downPayment)} <strong>ET</strong> épargner rigoureusement la différence mensuelle de ${formatCurrency(monthlySavings)}.
            </p>
        </div>
    `;
}
