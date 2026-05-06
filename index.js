// ==========================================
// 1. GESTION DES ONGLETS & INITIALISATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab-btn');
    const panes = document.querySelectorAll('.tab-pane');
    const menuToggle = document.getElementById('menu-toggle');
    const navLinks = document.getElementById('nav-links');
    
    if(menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('show');
        });
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            panes.forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            
            const targetId = this.getAttribute('data-tab');
            const targetPane = document.getElementById('tab-' + targetId);
            if (targetPane) targetPane.classList.add('active');
        });
    });

    setTimeout(() => {
        calculateAuto();
        calculateExpense();
        calculateCreditCard(); 
        calculateInflation();
        updateLifestyle();
    }, 200);
});

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(amount);
};

// ==========================================
// TRAP 1 : AUTO
// ==========================================
function calculateAuto() {
    const repairCost = parseFloat(document.getElementById('repair-slider').value);
    const autoPrice = parseFloat(document.getElementById('car-price-slider').value);
    const autoTerm = parseFloat(document.getElementById('car-term-slider').value);
    const autoRate = parseFloat(document.getElementById('car-rate-slider').value);

    // Maj UI Sliders
    document.getElementById('repair-val').innerText = formatCurrency(repairCost);
    document.getElementById('car-price-val').innerText = formatCurrency(autoPrice);
    document.getElementById('car-term-val').innerText = autoTerm + " mois";
    document.getElementById('car-rate-val').innerText = autoRate.toFixed(1) + " %";

    const monthlyRate = (autoRate / 100) / 12;
    let monthlyPayment = 0;
    if (monthlyRate > 0) {
        monthlyPayment = autoPrice * (monthlyRate * Math.pow(1 + monthlyRate, autoTerm)) / (Math.pow(1 + monthlyRate, autoTerm) - 1);
    } else {
        monthlyPayment = autoPrice / autoTerm;
    }
    
    const totalPaid = monthlyPayment * autoTerm;
    const totalInterest = totalPaid - autoPrice;
    const monthsEquivalent = (repairCost / monthlyPayment).toFixed(1);

    const res = document.getElementById('auto-result-content');
    res.innerHTML = `
        <div class="result-metric">
            <span class="label">La réparation de ${formatCurrency(repairCost)} équivaut à</span>
            <span class="value text-red">${monthsEquivalent} mois</span>
            <span class="subtext">de paiements du véhicule neuf</span>
        </div>
        <hr class="result-divider">
        <div class="result-metric-grid">
            <div>
                <span class="label">Mensualité</span>
                <span class="value">${formatCurrency(monthlyPayment)}</span>
            </div>
            <div>
                <span class="label">Intérêts perdus</span>
                <span class="value text-red">${formatCurrency(totalInterest)}</span>
            </div>
            <div style="grid-column: span 2;">
                <span class="label">Coût Total (Véhicule + Intérêts)</span>
                <span class="value">${formatCurrency(totalPaid)}</span>
            </div>
        </div>
    `;
}

// ==========================================
// TRAP 2 : DÉPENSES
// ==========================================
function toggleHabit(btn) {
    btn.classList.toggle('selected');
    let total = 0;
    document.querySelectorAll('.expense-habit.selected').forEach(b => {
        total += parseFloat(b.getAttribute('data-cost'));
    });
    document.getElementById('weekly-expense').value = total;
    calculateExpense();
}

function calculateExpense() {
    const weekly = parseFloat(document.getElementById('weekly-expense').value) || 0;
    const res = document.getElementById('expense-result-content');
    
    if (weekly <= 0) {
        res.innerHTML = `<p class="text-muted">Sélectionnez des dépenses pour voir l'impact.</p>`;
        return;
    }

    const monthlyInvestment = (weekly * 52) / 12;
    const rate = 0.07 / 12; 
    const futureValue10 = monthlyInvestment * ((Math.pow(1 + rate, 120) - 1) / rate);
    const futureValue25 = monthlyInvestment * ((Math.pow(1 + rate, 300) - 1) / rate);

    res.innerHTML = `
        <div class="result-metric">
            <span class="label">Total dépensé</span>
            <span class="value text-red">${formatCurrency(weekly)} / sem</span>
        </div>
        <hr class="result-divider">
        <p class="mb-2" style="font-size:0.9rem;">Si investi à 7% :</p>
        <div class="result-metric-grid">
            <div>
                <span class="label">Valeur dans 10 ans</span>
                <span class="value">${formatCurrency(futureValue10)}</span>
            </div>
            <div>
                <span class="label">Valeur dans 25 ans</span>
                <span class="value text-primary">${formatCurrency(futureValue25)}</span>
            </div>
        </div>
    `;
}

// ==========================================
// TRAP 3 : CRÉDIT
// ==========================================
function calculateCreditCard() {
    const creditBal = parseFloat(document.getElementById('credit-bal-slider').value);
    const creditPaymentPct = parseFloat(document.getElementById('credit-pmt-slider').value);
    
    // Maj UI Sliders
    document.getElementById('credit-bal-val').innerText = formatCurrency(creditBal);
    document.getElementById('credit-pmt-val').innerText = creditPaymentPct + " %";
    
    const payment = creditBal * (creditPaymentPct / 100);
    document.getElementById('credit-pmt-dollar').innerText = formatCurrency(payment);

    const annualRate = 0.2099; 
    const monthlyRate = annualRate / 12;
    const res = document.getElementById('credit-result-content');

    if (payment <= creditBal * monthlyRate) {
        res.innerHTML = `<span class="text-red font-bold">Le paiement ne couvre pas l'intérêt mensuel. La dette est infinie.</span>`;
        return;
    }

    const monthsNeeded = -Math.log(1 - (monthlyRate * creditBal) / payment) / Math.log(1 + monthlyRate);
    const yearsNeeded = (monthsNeeded / 12).toFixed(1);
    const totalPaid = monthsNeeded * payment;
    const totalInterest = totalPaid - creditBal;

    res.innerHTML = `
        <div class="result-metric-grid">
            <div>
                <span class="label">Temps pour payer</span>
                <span class="value">${yearsNeeded} ans</span>
            </div>
            <div>
                <span class="label">Intérêt payé</span>
                <span class="value text-red">${formatCurrency(totalInterest)}</span>
            </div>
            <div style="grid-column: span 2;">
                <span class="label">Coût total réel de la dette</span>
                <span class="value">${formatCurrency(totalPaid)}</span>
            </div>
        </div>
    `;
}

// ==========================================
// TRAP 4 : INFLATION
// ==========================================
function calculateInflation() {
    const inflBal = parseFloat(document.getElementById('infl-bal-slider').value);
    const inflRate = parseFloat(document.getElementById('infl-rate-slider').value) / 100;
    
    // Maj UI Sliders
    document.getElementById('infl-bal-val').innerText = formatCurrency(inflBal);
    document.getElementById('infl-rate-val').innerText = (inflRate * 100).toFixed(1) + " %";

    const res = document.getElementById('inflation-result-content');
    const power5 = inflBal / Math.pow(1 + inflRate, 5);
    const power10 = inflBal / Math.pow(1 + inflRate, 10);
    const power15 = inflBal / Math.pow(1 + inflRate, 15);

    res.innerHTML = `
        <p class="mb-3" style="font-size:0.9rem;">Pouvoir d'achat réel restant :</p>
        <div class="result-list">
            <div class="result-list-item">
                <span>Dans 5 ans</span>
                <strong class="text-red">${formatCurrency(power5)}</strong>
            </div>
            <div class="result-list-item">
                <span>Dans 10 ans</span>
                <strong class="text-red">${formatCurrency(power10)}</strong>
            </div>
            <div class="result-list-item">
                <span>Dans 15 ans</span>
                <strong class="text-red">${formatCurrency(power15)}</strong>
            </div>
        </div>
    `;
}

// ==========================================
// TRAP 5 : STYLE DE VIE
// ==========================================
function toggleLifestyleExpense(btn) {
    btn.classList.toggle('selected');
    updateLifestyle();
}

function updateLifestyle() {
    const before = parseFloat(document.getElementById('salary-before').value) || 0;
    const after = parseFloat(document.getElementById('salary-after').value) || 0;
    const res = document.getElementById('lifestyle-result-content');

    if (after <= before) {
        res.innerHTML = `<p class="text-muted">Entrez une augmentation valide.</p>`;
        return;
    }

    const netRaiseMonthly = ((after - before) * 0.65) / 12;

    let totalRewards = 0;
    document.querySelectorAll('.lifestyle-chip.selected').forEach(btn => {
        totalRewards += parseFloat(btn.getAttribute('data-cost'));
    });

    const remaining = netRaiseMonthly - totalRewards;
    const rate = 0.07 / 12; 
    let futureValue = remaining > 0 ? remaining * ((Math.pow(1 + rate, 180) - 1) / rate) : 0;

    res.innerHTML = `
        <div class="result-table">
            <div class="row">
                <span>Hausse mensuelle nette</span>
                <strong class="text-primary">+${formatCurrency(netRaiseMonthly)}</strong>
            </div>
            <div class="row">
                <span>Récompenses</span>
                <strong class="text-red">-${formatCurrency(totalRewards)}</strong>
            </div>
            <div class="row total ${remaining < 0 ? 'text-red' : ''}">
                <span>Reste à investir</span>
                <strong>${formatCurrency(remaining)}</strong>
            </div>
        </div>
        ${remaining > 0 ? `
            <div class="mt-3 text-center">
                <span class="label">Investi sur 15 ans, cela donnera</span>
                <span class="value text-primary" style="font-size: 1.5rem;">${formatCurrency(futureValue)}</span>
            </div>
        ` : `<p class="text-red text-center mt-3 font-bold">Vous vous endettez !</p>`}
    `;
}
