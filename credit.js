document.addEventListener('DOMContentLoaded', () => {
    calculateDebtCost();
    calculateRealEstate();
    calculateLeverage();

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
        { name: "Marge Hypothécaire", rate: 4.9, color: "#2DD4BF", bg: "rgba(45, 212, 191, 0.05)", border: "rgba(45, 212, 191, 0.3)" }
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
// WIDGET 2 : LE DASHBOARD IMMOBILIER (PRO + INFLATION LOCATIVE)
// ==========================================
function calculateRealEstate() {
    const price = parseFloat(document.getElementById('re-price').value) || 0;
    const downPayment = parseFloat(document.getElementById('re-downpayment').value) || 0;
    const rate = parseFloat(document.getElementById('re-rate').value) / 100 || 0;
    const years = parseFloat(document.getElementById('re-years').value) || 25;
    
    // INPUTS : Location
    const rent = parseFloat(document.getElementById('re-rent').value) || 0;
    const rentIncrease = parseFloat(document.getElementById('re-rent-increase').value) / 100 || 0;
    
    // INPUTS : Croissance et Locatif
    const homeAppreciation = parseFloat(document.getElementById('re-appreciation').value) / 100 || 0;
    const marketReturn = parseFloat(document.getElementById('re-market').value) / 100 || 0;
    
    const grossRentalIncome = parseFloat(document.getElementById('re-rental-income').value) || 0;
    const rentalTaxRate = parseFloat(document.getElementById('re-rental-tax').value) / 100 || 0;
    const maintenanceRate = parseFloat(document.getElementById('re-maintenance-rate').value) / 100 || 0.01;

    if (price <= 0 || years <= 0) return;

    // --- 1. CALCUL DU COÛT PROPRIÉTAIRE (AN 1) ---
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

    // B. Mensualité hypothécaire (Fixe)
    const effRate = Math.pow(Math.pow(1 + (rate / 2), 2), 1/12) - 1;
    const n = years * 12;
    const monthlyMortgage = (totalLoan > 0 && effRate > 0) ? (totalLoan * effRate * Math.pow(1 + effRate, n)) / (Math.pow(1 + effRate, n) - 1) : 0;

    // C. Frais Fantômes & Fiscalité Locative (AN 1)
    let taxes = (price * 0.012) / 12; 
    let maintenance = (price * maintenanceRate) / 12; 
    let insurance = grossRentalIncome > 0 ? 200 : 150; 
    
    const rentalTaxAmount = grossRentalIncome * rentalTaxRate;
    const netRentalIncome = grossRentalIncome - rentalTaxAmount;

    const grossMonthlyCost = monthlyMortgage + taxes + maintenance + insurance;
    const netOwnerOutflow = grossMonthlyCost - netRentalIncome;

    // UI : Barre de répartition (Basée sur le coût brut)
    const pctMortgage = (monthlyMortgage / grossMonthlyCost) * 100;
    const pctTaxes = (taxes / grossMonthlyCost) * 100;
    const pctMaint = ((maintenance + insurance) / grossMonthlyCost) * 100;

    document.getElementById('re-cost-bar').innerHTML = `
        <div class="alloc-segment" style="width: ${pctMortgage}%; background: #4F46E5;" title="Hypothèque"></div>
        <div class="alloc-segment" style="width: ${pctTaxes}%; background: #F59E0B;" title="Taxes"></div>
        <div class="alloc-segment" style="width: ${pctMaint}%; background: #EF4444;" title="Entretien & Ass."></div>
    `;

    // UI : Détails des coûts
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
        
        <div style="grid-column: span 2; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1.5rem; margin-top: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
            <span class="label" style="color: var(--heading-color); text-transform: uppercase;">Coût Brut Mensuel</span>
            <span class="value" style="color: var(--subtle-text-color); font-size: 1.4rem;">${formatCurrency(grossMonthlyCost)}</span>
        </div>

        ${grossRentalIncome > 0 ? `
        <div style="grid-column: span 2; background: rgba(16, 185, 129, 0.05); padding: 15px; border-radius: 8px; border: 1px dashed rgba(16, 185, 129, 0.2);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <span class="label" style="color: #10B981;">Revenus Locatifs Bruts</span>
                <span class="value" style="color: #10B981;">+ ${formatCurrency(grossRentalIncome)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; font-size: 0.85rem;">
                <span class="text-muted">Impôt estimé (${(rentalTaxRate*100).toFixed(0)}%)</span>
                <span class="text-red">- ${formatCurrency(rentalTaxAmount)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 8px; margin-top: 5px;">
                <span class="label" style="color: #10B981; text-transform: uppercase; font-size: 0.8rem;">Revenus Locatifs Nets (Après impôt)</span>
                <span class="value" style="color: #10B981; font-size: 1.2rem;">+ ${formatCurrency(netRentalIncome)}</span>
            </div>
        </div>
        ` : ''}

        <div style="grid-column: span 2; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1.5rem; margin-top: 0.5rem;">
            <span class="label" style="color: var(--heading-color); text-transform: uppercase;">Décaissement Net du Propriétaire (An 1)</span>
            <span class="value" style="color: ${netOwnerOutflow < 0 ? '#10B981' : '#2DD4BF'}; font-size: 2.2rem; display: block; margin-top: 5px;">
                ${netOwnerOutflow < 0 ? '+' : ''}${formatCurrency(Math.abs(netOwnerOutflow))}
            </span>
            ${netOwnerOutflow < 0 ? '<span style="color: #10B981; font-size: 0.85rem; font-weight: bold;">(Cash-Flow Positif)</span>' : ''}
        </div>
    `;

    // --- 2. PROJECTION LOUER VS ACHETER DYNAMIQUE SUR 25 ANS ---
    let currentRent = rent;
    let currentTaxes = taxes;
    let currentMaint = maintenance;
    let currentIns = insurance;
    let currentGrossRentInc = grossRentalIncome;

    const generalInflation = 0.02; // Inflation cible de 2% pour les dépenses du proprio

    let homeValue = price;
    let renterPortfolio = downPayment; 
    let ownerPortfolio = 0; 
    let currentLoan = totalLoan;

    for (let year = 1; year <= 25; year++) {
        // A. Appréciation de l'actif
        homeValue *= (1 + homeAppreciation);
        
        // B. Calcul du Cash-flow de cette année précise
        let currentNetRentInc = currentGrossRentInc * (1 - rentalTaxRate);
        let currentOwnerOutflow = (monthlyMortgage + currentTaxes + currentMaint + currentIns) - currentNetRentInc;
        let currentRenterOutflow = currentRent + 30; // 30$ assurance locataire

        let ownerMonthlyInvest = 0;
        let renterMonthlyInvest = 0;

        if (currentOwnerOutflow > currentRenterOutflow) {
            renterMonthlyInvest = currentOwnerOutflow - currentRenterOutflow;
        } else {
            ownerMonthlyInvest = currentRenterOutflow - currentOwnerOutflow;
        }

        // C. Croissance des portefeuilles et ajout de l'épargne mensuelle
        renterPortfolio = (renterPortfolio * (1 + marketReturn)) + (renterMonthlyInvest * 12);
        ownerPortfolio = (ownerPortfolio * (1 + marketReturn)) + (ownerMonthlyInvest * 12);
        
        // D. Remboursement Hypothécaire
        for(let m = 0; m < 12; m++) {
            if (currentLoan > 0) {
                let interest = currentLoan * effRate;
                let principal = monthlyMortgage - interest;
                currentLoan = Math.max(0, currentLoan - principal);
            }
        }

        // E. INFLATION pour l'année suivante (La magie opère ici)
        currentRent *= (1 + rentIncrease);
        currentGrossRentInc *= (1 + rentIncrease); // Le proprio augmente aussi ses loyers
        currentTaxes *= (1 + generalInflation);
        currentMaint *= (1 + generalInflation);
        currentIns *= (1 + generalInflation);
    }

    // Bilan Final
    const finalOwnerNetWorth = Math.max(0, homeValue - currentLoan) + ownerPortfolio;
    const finalRenterNetWorth = renterPortfolio;
    const diff = Math.abs(finalOwnerNetWorth - finalRenterNetWorth);
    const isOwnerWinner = finalOwnerNetWorth > finalRenterNetWorth;

    // DASHBOARD RÉSULTATS
    let ownerBonusText = ownerPortfolio > 0 ? `<br><em>Inclut ${formatCurrency(ownerPortfolio)} en bourse générés par les excédents.</em>` : '';

    document.getElementById('re-verdict-dashboard').innerHTML = `
        <div class="result-metric-grid" style="gap: 1.5rem; margin-bottom: 2rem;">
            
            <div style="background: rgba(45, 212, 191, 0.05); border: 1px solid ${isOwnerWinner ? '#2DD4BF' : 'rgba(45, 212, 191, 0.2)'}; padding: 1.5rem; border-radius: 16px; text-align: center; box-shadow: ${isOwnerWinner ? '0 0 15px rgba(45,212,191,0.1)' : 'none'};">
                <span class="label" style="color: #2DD4BF; text-transform: uppercase;">Valeur Nette Achat</span>
                <span class="value" style="color: #2DD4BF; font-size: 2.2rem; margin: 10px 0; display: block;">${formatCurrency(finalOwnerNetWorth)}</span>
                <span class="subtext">Maison (${(homeAppreciation*100).toFixed(1)}%) moins hypothèque. ${ownerBonusText}</span>
            </div>

            <div style="background: rgba(168, 85, 247, 0.05); border: 1px solid ${!isOwnerWinner ? '#A855F7' : 'rgba(168, 85, 247, 0.2)'}; padding: 1.5rem; border-radius: 16px; text-align: center; box-shadow: ${!isOwnerWinner ? '0 0 15px rgba(168,85,247,0.1)' : 'none'};">
                <span class="label" style="color: #A855F7; text-transform: uppercase;">Valeur Nette Location</span>
                <span class="value" style="color: #A855F7; font-size: 2.2rem; margin: 10px 0; display: block;">${formatCurrency(finalRenterNetWorth)}</span>
                <span class="subtext">Portefeuille boursier (${(marketReturn*100).toFixed(1)}%)</span>
            </div>

        </div>
        
        <div style="text-align: center; padding: 1.5rem; border-radius: 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);">
            <p style="font-size: 1.2rem; color: var(--heading-color); margin: 0 0 10px 0;">
                Dans 25 ans, le <strong>${isOwnerWinner ? 'Propriétaire' : 'Locataire'}</strong> est plus riche de <span style="color: ${isOwnerWinner ? '#2DD4BF' : '#A855F7'}; font-weight: bold;">${formatCurrency(diff)}</span>.
            </p>
            <p style="font-size: 0.85rem; color: var(--subtle-text-color); margin: 0;">
                * Modèle calculé avec une inflation des loyers de ${(rentIncrease*100).toFixed(1)}% par an. Le locataire doit rigoureusement investir la différence initiale et l'écart mensuel pour concurrencer l'effet de levier immobilier.
            </p>
        </div>
    `;
}

// ==========================================
// WIDGET 3 : LE MULTIPLICATEUR DE LEVIER
// ==========================================
function calculateLeverage() {
    const equity = parseFloat(document.getElementById('lev-equity').value) || 0;
    const borrowed = parseFloat(document.getElementById('lev-borrowed').value) || 0;
    const borrowRate = parseFloat(document.getElementById('lev-borrow-rate').value) / 100 || 0;
    const assetReturn = parseFloat(document.getElementById('lev-asset-slider').value) / 100 || 0;

    // Mise à jour visuelle du curseur
    const valDisplay = document.getElementById('lev-asset-val');
    valDisplay.innerText = (assetReturn > 0 ? "+ " : "") + (assetReturn * 100).toFixed(1) + " %";
    valDisplay.style.color = assetReturn >= 0 ? '#2DD4BF' : '#EF4444';

    if (equity <= 0) return;

    const totalInvestment = equity + borrowed;

    // SCÉNARIO SANS LEVIER (On n'investit que nos propres 50k$)
    const noLevProfit = equity * assetReturn;
    const noLevROE = assetReturn; // Return on Equity = Rendement de l'actif directement

    // SCÉNARIO AVEC LEVIER (On investit 250k$)
    const grossProfit = totalInvestment * assetReturn;
    const interestCost = borrowed * borrowRate;
    const netProfit = grossProfit - interestCost;
    const levROE = netProfit / equity;

    const isProfitable = netProfit >= 0;
    const colorClass = isProfitable ? '#2DD4BF' : '#EF4444';
    const bgClass = isProfitable ? 'rgba(45, 212, 191, 0.05)' : 'rgba(239, 68, 68, 0.05)';
    const borderColor = isProfitable ? 'rgba(45, 212, 191, 0.2)' : 'rgba(239, 68, 68, 0.2)';

    let warningHTML = '';
    if (assetReturn > 0 && netProfit < 0) {
        warningHTML = `<p class="text-red" style="font-size: 0.85rem; margin-top: 1rem;"><strong>Attention :</strong> L'actif génère un profit, mais le taux de l'emprunt (${(borrowRate*100).toFixed(1)}%) est trop élevé. Vous perdez de l'argent (Spread négatif).</p>`;
    } else if (netProfit < 0) {
        warningHTML = `<p class="text-red" style="font-size: 0.85rem; margin-top: 1rem;"><strong>Risque de faillite :</strong> L'effet de levier amplifie vos pertes. Une baisse de ${(assetReturn*100).toFixed(1)}% de l'actif détruit <strong>${Math.abs(levROE*100).toFixed(1)}%</strong> de votre capital initial.</p>`;
    } else {
        warningHTML = `<p class="text-muted" style="font-size: 0.85rem; margin-top: 1rem;"><strong>La magie du levier :</strong> Le rendement de l'actif surpasse le coût d'emprunt (Spread positif). Votre rendement sur capitaux propres explose.</p>`;
    }

    document.getElementById('lev-dashboard-results').innerHTML = `
        <div class="result-metric-grid" style="gap: 1rem; margin-bottom: 1.5rem; margin-top: 1.5rem;">
            
            <div style="background: rgba(255,255,255,0.02); padding: 1.5rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                <span class="label" style="text-transform: uppercase;">100% Capital Propre</span>
                <span class="value" style="color: var(--heading-color); font-size: 1.8rem; display: block; margin: 10px 0;">${(noLevROE * 100).toFixed(1)} %</span>
                <span class="subtext">Profit : ${formatCurrency(noLevProfit)}</span>
            </div>

            <div style="background: ${bgClass}; padding: 1.5rem; border-radius: 12px; border: 1px solid ${borderColor}; position: relative; overflow: hidden;">
                <span class="label" style="color: ${colorClass}; text-transform: uppercase;">Avec Levier</span>
                <span class="value" style="color: ${colorClass}; font-size: 1.8rem; display: block; margin: 10px 0;">${(levROE * 100).toFixed(1)} %</span>
                <span class="subtext" style="color: var(--heading-color);">Profit Net : ${formatCurrency(netProfit)}</span>
            </div>

        </div>

        <div style="background: rgba(0,0,0,0.2); border-radius: 8px; padding: 15px; border-left: 3px solid ${colorClass};">
            <div class="d-flex justify-between" style="font-size: 0.85rem; border-bottom: 1px dashed rgba(255,255,255,0.05); padding-bottom: 5px; margin-bottom: 5px;">
                <span class="text-muted">Gain de l'actif (${formatCurrency(totalInvestment)}) :</span>
                <span style="color: var(--heading-color);">${formatCurrency(grossProfit)}</span>
            </div>
            <div class="d-flex justify-between" style="font-size: 0.85rem;">
                <span class="text-muted">Frais d'intérêts payés :</span>
                <span style="color: #EF4444;">- ${formatCurrency(interestCost)}</span>
            </div>
            ${warningHTML}
        </div>
    `;
}
