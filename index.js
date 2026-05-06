// ==========================================
// 1. GESTION DES ONGLETS & INITIALISATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab-btn');
    const panes = document.querySelectorAll('.tab-pane');

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

    // Inits
    setTimeout(() => {
        calculateAuto();
        generateCreditPaymentChips(1000); 
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
let autoPrice = 40000;
let autoTerm = 60;

function setAutoPrice(price, btn) {
    autoPrice = price;
    document.querySelectorAll('.auto-price-chip').forEach(b => b.classList.remove('selected-primary'));
    btn.classList.add('selected-primary');
    calculateAuto();
}

function setAutoTerm(months, btn) {
    autoTerm = months;
    document.querySelectorAll('.auto-term-chip').forEach(b => b.classList.remove('selected-primary'));
    btn.classList.add('selected-primary');
    calculateAuto();
}

function calculateAuto() {
    const repairSlider = document.getElementById('repair-slider');
    const repairCost = parseFloat(repairSlider.value);
    document.getElementById('repair-val').innerText = formatCurrency(repairCost);

    const annualRate = parseFloat(document.getElementById('car-rate').value) / 100;
    const monthlyRate = annualRate / 12;
    
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
                <span class="label">Intérêts payés</span>
                <span class="value text-red">${formatCurrency(totalInterest)}</span>
            </div>
            <div style="grid-column: span 2;">
                <span class="label">Coût Total (Financé)</span>
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
    
    const months10 = 10 * 12; 
    const futureValue10 = monthlyInvestment * ((Math.pow(1 + rate, months10) - 1) / rate);

    const months25 = 25 * 12;
    const futureValue25 = monthlyInvestment * ((Math.pow(1 + rate, months25) - 1) / rate);

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
let creditBal = 1000;
let creditPaymentPct = 0.05;

function setCreditBalance(val, btn) {
    creditBal = val;
    document.querySelectorAll('.credit-bal-chip').forEach(b => b.classList.remove('selected-primary'));
    btn.classList.add('selected-primary');
    generateCreditPaymentChips(val);
}

function generateCreditPaymentChips(balance) {
    const container = document.getElementById('credit-payment-chips');
    const percentages = [0.05, 0.10, 0.15, 0.20];
    container.innerHTML = '';
    
    percentages.forEach(pct => {
        const amt = balance * pct;
        const btn = document.createElement('button');
        btn.className = `chip credit-pmt-chip ${pct === creditPaymentPct ? 'selected-primary' : ''}`;
        btn.innerText = `${pct * 100}% (${formatCurrency(amt)})`;
        btn.onclick = function() {
            creditPaymentPct = pct;
            document.querySelectorAll('.credit-pmt-chip').forEach(b => b.classList.remove('selected-primary'));
            this.classList.add('selected-primary');
            calculateCreditCard();
        };
        container.appendChild(btn);
    });
    calculateCreditCard();
}

function calculateCreditCard() {
    const payment = creditBal * creditPaymentPct;
    const annualRate = 0.2099; 
    const monthlyRate = annualRate / 12;
    const res = document.getElementById('credit-result-content');

    if (payment <= creditBal * monthlyRate) {
        res.innerHTML = `<span class="text-red font-bold">Le paiement ne couvre pas l'intérêt. La dette est infinie.</span>`;
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
let inflBal = 10000;
let inflRate = 0.02;

function setInflationBalance(val, btn) {
    inflBal = val;
    document.querySelectorAll('.inflation-bal-chip').forEach(b => b.classList.remove('selected-primary'));
    btn.classList.add('selected-primary');
    calculateInflation();
}
function setInflationRate(val, btn) {
    inflRate = val / 100;
    document.querySelectorAll('.inflation-rate-chip').forEach(b => b.classList.remove('selected-primary'));
    btn.classList.add('selected-primary');
    calculateInflation();
}

function calculateInflation() {
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
    let futureValue = remaining > 0 ? remaining * ((Math.pow(1 + rate, 15 * 12) - 1) / rate) : 0;

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

// À ajouter dans ton document.addEventListener('DOMContentLoaded', ...)
const menuToggle = document.getElementById('menu-toggle');
const navLinks = document.getElementById('nav-links');

if(menuToggle) {
    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('show');
    });
}
