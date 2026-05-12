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

    if (price <= 0 || years <= 0) return;

    // --- 1. CALCUL DU VRAI COÛT PROPRIÉTAIRE ---
    // A. Prime SCHL (simplifiée)
    const ratioDown = downPayment / price;
    let cmhc = 0;
    let baseLoan = price - downPayment;
    if (ratioDown < 0.20 && ratioDown >= 0.05) {
        if (ratioDown < 0.10) cmhc = baseLoan * 0.04;
        else if (ratioDown < 0.15) cmhc = baseLoan * 0.031;
        else cmhc = baseLoan * 0.028;
    }
    const totalLoan = baseLoan + cmhc;

    // B. Hypothèque (Formule canadienne : composition semi-annuelle)
    const effRate = Math.pow(Math.pow(1 + (rate / 2), 2), 1/12) - 1;
    const n = years * 12;
    const monthlyMortgage = (totalLoan * effRate * Math.pow(1 + effRate, n)) / (Math.pow(1 + effRate, n) - 1);

    // C. Frais Fantômes (Mensuels)
    const taxes = (price * 0.012) / 12; // Taxes scolaires et municipales ~1.2%
    const maintenance = (price * 0.01) / 12; // Règle du 1%
    const insurance = 150; // Assurance proprio
    
    const trueMonthlyCost = monthlyMortgage + taxes + maintenance + insurance;

    // Mise à jour de la barre et des détails
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
            <span class="value">${formatCurrency(monthlyMortgage)}</span>
        </div>
        <div>
            <span class="label"><span class="dot" style="background:#F59E0B;"></span> Taxes estimées</span>
            <span class="value">${formatCurrency(taxes)}</span>
        </div>
        <div>
            <span class="label"><span class="dot" style="background:#EF4444;"></span> Entretien & Assurances</span>
            <span class="value">${formatCurrency(maintenance + insurance)}</span>
        </div>
        <div style="grid-column: span 2; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1rem; margin-top: 0.5rem;">
            <span class="label" style="color: var(--heading-color);">Décaissement Total Mensuel</span>
            <span class="value" style="color: #2DD4BF; font-size: 2rem;">${formatCurrency(trueMonthlyCost)}</span>
        </div>
    `;

    // --- 2. PROJECTION LOUER VS ACHETER (SUR 25 ANS) ---
    const rentInsurance = 30; // Assurance locataire
    const trueRentCost = rent + rentInsurance;
    
    // Le cash-flow disponible pour le locataire
    const monthlySavings = Math.max(0, trueMonthlyCost - trueRentCost);

    // Hypothèses de marché
    const marketReturn = 0.07; // Rendement bourse 7%
    const homeAppreciation = 0.03; // Appréciation immo 3%

    let homeValue = price;
    let renterPortfolio = downPayment; // Le locataire investit la mise de fonds initiale!
    
    const labels = [];
    const dataOwner = [];
    const dataRenter = [];

    // Boucle annuelle
    let currentLoan = totalLoan;
    for (let year = 0; year <= 25; year++) {
        labels.push(`An ${year}`);
        
        // Propriétaire : Valeur de la maison moins l'hypothèque restante
        let ownerEquity = Math.max(0, homeValue - currentLoan);
        dataOwner.push(ownerEquity);

        // Locataire : Croissance du portefeuille + ajout de l'épargne mensuelle
        dataRenter.push(renterPortfolio);

        // Fin de l'année : Calculs pour l'année suivante
        if (year < 25) {
            homeValue *= (1 + homeAppreciation); // La maison prend 3%
            
            // Le locataire fait 7% sur son portefeuille + investit la différence mensuelle
            renterPortfolio = (renterPortfolio * (1 + marketReturn)) + (monthlySavings * 12);
            
            // L'hypothèque descend
            for(let m = 0; m < 12; m++) {
                let interest = currentLoan * effRate;
                let principal = monthlyMortgage - interest;
                currentLoan = Math.max(0, currentLoan - principal);
            }
        }
    }

    // Graphique
    const ctx = document.getElementById('chart-acheter-louer').getContext('2d');
    if (reChart) reChart.destroy();
    
    reChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Valeur Nette Propriétaire',
                    data: dataOwner,
                    borderColor: '#2DD4BF',
                    backgroundColor: 'rgba(45, 212, 191, 0.1)',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Portefeuille du Locataire',
                    data: dataRenter,
                    borderColor: '#A855F7',
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#9CA3AF' } }
            },
            scales: {
                x: { ticks: { color: '#9CA3AF' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { ticks: { color: '#9CA3AF', callback: v => formatCurrency(v) }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
        }
    });

    // Verdict final
    const finalOwner = dataOwner[25];
    const finalRenter = dataRenter[25];
    const diff = Math.abs(finalOwner - finalRenter);
    const winner = finalOwner > finalRenter ? 'Propriétaire' : 'Locataire';

    document.getElementById('re-verdict').innerHTML = `
        <span style="font-size: 1.1rem; color: var(--heading-color); display: block; margin-bottom: 5px;">Dans 25 ans, le <strong>${winner}</strong> est plus riche de ${formatCurrency(diff)}.</span>
        <span style="font-size: 0.85rem; color: var(--subtle-text-color);">*Basé sur une appréciation immobilière de 3% et un rendement boursier de 7%. La discipline du locataire d'investir la différence mensuelle (${formatCurrency(monthlySavings)}) est cruciale dans ce modèle.</span>
    `;
}
