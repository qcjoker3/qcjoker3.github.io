// ==========================================
// 1. GESTION DES ONGLETS & INITIALISATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    try {
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
    } catch (error) {
        console.error("Erreur avec les onglets :", error);
    }

    try {
        initSP500Gauge();
    } catch (error) {
        console.error("Erreur avec la jauge S&P 500 :", error);
    }

    // Initialiser le calculateur de style de vie
    setTimeout(updateLifestyle, 200);
});

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(amount);
};

// ==========================================
// 2. FONCTIONS DE PRÉSÉLECTION (CHIPS)
// ==========================================
function setAutoPreset(pmt, m, r) {
    document.getElementById('car-payment').value = pmt;
    document.getElementById('car-months').value = m;
    document.getElementById('car-rate').value = r;
    calculateAuto();
}
function setExpensePreset(amount) {
    document.getElementById('weekly-expense').value = amount;
    calculateExpense();
}
function setCreditPreset(bal, pmt) {
    document.getElementById('cc-balance').value = bal;
    document.getElementById('cc-payment').value = pmt;
    calculateCreditCard();
}
function setInflationPreset(amount) {
    document.getElementById('cash-balance').value = amount;
    calculateInflation();
}

// ==========================================
// 3. CALCULS DES PIÈGES FINANCIERS
// ==========================================

// Piège 1 : Auto Neuve
function calculateAuto() {
    const payment = parseFloat(document.getElementById('car-payment').value);
    const months = parseInt(document.getElementById('car-months').value);
    const annualRate = parseFloat(document.getElementById('car-rate').value) / 100;
    const resultDiv = document.getElementById('auto-result');
    
    if (isNaN(payment) || isNaN(months) || isNaN(annualRate) || payment <= 0 || months <= 0) return;

    const monthlyRate = annualRate / 12;
    let principal = 0;
    if (monthlyRate > 0) {
        principal = payment * ((1 - Math.pow(1 + monthlyRate, -months)) / monthlyRate);
    } else {
        principal = payment * months;
    }
    
    const totalPaid = payment * months;
    const totalInterest = totalPaid - principal;

    resultDiv.innerHTML = `Le vendeur vous dira que c'est "seulement ${formatCurrency(payment)}/mois".<br><br>En réalité, vous vous engagez à payer un montant total faramineux de <strong>${formatCurrency(totalPaid)}</strong> sur ${months / 12} ans.<br><br><span style="font-size:0.95rem; color:#EF4444; font-weight:bold;">Le vrai crime : Vous donnerez ${formatCurrency(totalInterest)} en pur intérêt à la banque pour un objet qui perd de la valeur chaque jour.</span>`;
    resultDiv.classList.remove('hidden');
}

// Piège 2 : Micro-dépenses
function calculateExpense() {
    const weekly = parseFloat(document.getElementById('weekly-expense').value);
    const resultDiv = document.getElementById('expense-result');
    if (isNaN(weekly) || weekly <= 0) return;

    const monthlyInvestment = (weekly * 52) / 12;
    const rate = 0.07 / 12; const months = 10 * 12; 
    const futureValue = monthlyInvestment * ((Math.pow(1 + rate, months) - 1) / rate);
    const profit = futureValue - (weekly * 52 * 10);

    resultDiv.innerHTML = `Si vous aviez investi ces <strong>${formatCurrency(weekly)}</strong> par semaine dans la bourse (~7% réel) pendant 10 ans, vous auriez <strong>${formatCurrency(futureValue)}</strong> aujourd'hui.<br><br><span style="font-size:0.9rem; color:var(--subtle-text-color);">Dont <strong>${formatCurrency(profit)}</strong> générés par la magie des intérêts composés !</span>`;
    resultDiv.classList.remove('hidden');
}

// Piège 3 : Carte de crédit
function calculateCreditCard() {
    const balance = parseFloat(document.getElementById('cc-balance').value);
    const payment = parseFloat(document.getElementById('cc-payment').value);
    const resultDiv = document.getElementById('cc-result');
    if (isNaN(balance) || isNaN(payment) || balance <= 0 || payment <= 0) return;

    const annualRate = 0.2099; 
    const monthlyRate = annualRate / 12;

    if (payment <= balance * monthlyRate) {
        resultDiv.innerHTML = `🚨 <strong>Alerte Rouge :</strong> Votre paiement ne couvre même pas les intérêts mensuels. Votre dette augmentera à l'infini !`;
        resultDiv.classList.remove('hidden');
        return;
    }

    const monthsNeeded = -Math.log(1 - (monthlyRate * balance) / payment) / Math.log(1 + monthlyRate);
    const yearsNeeded = (monthsNeeded / 12).toFixed(1);
    const totalPaid = monthsNeeded * payment;
    const totalInterest = totalPaid - balance;

    resultDiv.innerHTML = `À coup de ${formatCurrency(payment)}/mois, il vous faudra <strong>${yearsNeeded} années</strong> pour rembourser.<br><br><span style="font-size:0.95rem; color:#EF4444; font-weight:bold;">Vous paierez ${formatCurrency(totalInterest)} uniquement en intérêts.</span> Remboursez d'urgence !`;
    resultDiv.classList.remove('hidden');
}

// Piège 4 : Inflation
function calculateInflation() {
    const balance = parseFloat(document.getElementById('cash-balance').value);
    const resultDiv = document.getElementById('inflation-result');
    if (isNaN(balance) || balance <= 0) return;

    const inflationRate = 0.028; 
    const years = 10;
    const purchasingPower = balance / Math.pow(1 + inflationRate, years);
    const loss = balance - purchasingPower;

    resultDiv.innerHTML = `Dans 10 ans, vos <strong>${formatCurrency(balance)}</strong> seront toujours dans votre compte... mais à cause de l'inflation, leur pouvoir d'achat réel ne vaudra plus que <strong>${formatCurrency(purchasingPower)}</strong> en dollars d'aujourd'hui.<br><br>Ne rien faire avec votre argent vient de vous coûter <strong>${formatCurrency(loss)}</strong> de manière invisible.`;
    resultDiv.classList.remove('hidden');
}

// Piège 5 : Style de vie (Interactif)
function toggleExpense(btn) {
    btn.classList.toggle('selected');
    updateLifestyle();
}

function updateLifestyle() {
    const before = parseFloat(document.getElementById('salary-before').value);
    const after = parseFloat(document.getElementById('salary-after').value);
    const breakdownDiv = document.getElementById('raise-breakdown');
    const resultDiv = document.getElementById('lifestyle-result');

    if (isNaN(before) || isNaN(after) || after <= before) {
        breakdownDiv.classList.add('hidden');
        resultDiv.classList.add('hidden');
        return;
    }

    const grossRaise = after - before;
    const netRaise = grossRaise * 0.65; // ~35% impôt
    
    const monthlyRaise = netRaise / 12;
    const biweeklyRaise = netRaise / 26;
    const weeklyRaise = netRaise / 52;

    breakdownDiv.innerHTML = `
        <div style="font-size:0.85rem; color:var(--subtle-text-color); text-align:center; text-transform:uppercase; font-weight:bold;">Ce qu'il vous reste vraiment (Après impôt)</div>
        <div class="breakdown-grid">
            <div><strong>${formatCurrency(monthlyRaise)}</strong><br><small>Par mois</small></div>
            <div><strong>${formatCurrency(biweeklyRaise)}</strong><br><small>Aux 2 semaines</small></div>
            <div><strong>${formatCurrency(weeklyRaise)}</strong><br><small>Par semaine</small></div>
        </div>
    `;
    breakdownDiv.classList.remove('hidden');

    let totalExpenses = 0;
    document.querySelectorAll('.expense-toggle.selected').forEach(btn => {
        totalExpenses += parseFloat(btn.getAttribute('data-cost'));
    });

    const remainingMonthly = monthlyRaise - totalExpenses;

    if (remainingMonthly < 0) {
        resultDiv.innerHTML = `🚨 <strong>Alerte Rouge :</strong> Vous venez de dépenser <strong>${formatCurrency(Math.abs(remainingMonthly))} DE PLUS</strong> par mois que ce que votre augmentation nette vous rapporte.<br><br>C'est exactement comme ça qu'on s'endette alors qu'on vient de recevoir une promotion.`;
        resultDiv.className = "tool-result-box mt-4";
        resultDiv.style.borderLeftColor = "#EF4444";
    } else {
        const rate = 0.07 / 12;
        const months = 15 * 12;
        let futureValue = 0;
        
        if (remainingMonthly > 0) {
            futureValue = remainingMonthly * ((Math.pow(1 + rate, months) - 1) / rate);
        }

        if (totalExpenses === 0) {
            resultDiv.innerHTML = `Si vous gardez votre style de vie actuel (aucune récompense cliquée) et investissez la totalité de cette hausse (${formatCurrency(monthlyRaise)}/mois), cette promotion générera <strong>${formatCurrency(futureValue)}</strong> dans 15 ans.`;
        } else {
            resultDiv.innerHTML = `Malgré vos ajouts, il vous reste encore <strong>${formatCurrency(remainingMonthly)}/mois</strong> de votre promotion.<br><br>Si vous l'investissez en bourse, vous générerez tout de même <strong>${formatCurrency(futureValue)}</strong> dans 15 ans. Le secret est l'équilibre !`;
        }
        resultDiv.className = "tool-result-box mt-4";
        resultDiv.style.borderLeftColor = "var(--primary-color)";
    }
}

// ==========================================
// 4. JAUGE S&P 500 (STATIQUE)
// ==========================================
function initSP500Gauge() {
    if (typeof chartDataByYear === 'undefined' || typeof niveauActuelSP500 === 'undefined') {
        console.warn("Fichier donnees.js introuvable.");
        return;
    }

    const annees = Object.keys(chartDataByYear).sort();
    const anneeRecente = annees[annees.length - 1];
    const previsionsBanques = chartDataByYear[anneeRecente].previsions;
    
    const niveauActuel = niveauActuelSP500; 

    const sommePrevisions = previsionsBanques.reduce((a, b) => a + b, 0);
    const cibleMoyenne = Math.round(sommePrevisions / previsionsBanques.length);
    
    const ecart = cibleMoyenne - niveauActuel;
    const potentielPourcentage = ((ecart / niveauActuel) * 100).toFixed(1);
    const signe = ecart >= 0 ? '+' : '';

    const currentTextEl = document.getElementById('currentLevelText');
    const targetTextEl = document.getElementById('gaugeTargetText');
    const gapTextEl = document.getElementById('percentageGap');

    if (currentTextEl) currentTextEl.innerText = niveauActuel.toLocaleString('fr-CA') + " pts";
    if (targetTextEl) targetTextEl.innerHTML = `<strong>${cibleMoyenne.toLocaleString('fr-CA')}</strong><br>Points`;
    if (gapTextEl) {
        gapTextEl.innerText = `${signe}${potentielPourcentage}%`;
        gapTextEl.className = ecart >= 0 ? 'success' : 'failure';
    }

    const ctx = document.getElementById('sp500Gauge');
    if (ctx && typeof Chart !== 'undefined') {
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Niveau Actuel', 'Potentiel'],
                datasets: [{
                    data: [niveauActuel, Math.abs(ecart)],
                    backgroundColor: ['#E2E8F0', ecart >= 0 ? '#0D9488' : '#EF4444'],
                    borderWidth: 0,
                    circumference: 180,
                    rotation: 270
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '80%',
                plugins: { legend: { display: false }, tooltip: { enabled: false } }
            }
        });
    }
}
