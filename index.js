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
function setAutoPreset(price, m, r, btnElement) {
    document.getElementById('new-car-price').value = price;
    document.getElementById('car-months').value = m;
    document.getElementById('car-rate').value = r;

    // Éteindre toutes les pastilles de l'auto
    document.querySelectorAll('.auto-chip').forEach(btn => btn.classList.remove('selected-primary'));
    
    // Allumer la pastille cliquée
    if (btnElement) {
        btnElement.classList.add('selected-primary');
    }

    calculateAuto();
}
function setExpensePreset(amount) {
    document.getElementById('weekly-expense').value = amount;
    calculateExpense();
}
function setCreditPreset(bal, pmt, btnElement) {
    document.getElementById('cc-balance').value = bal;
    document.getElementById('cc-payment').value = pmt;

    // Éteindre toutes les pastilles de crédit
    document.querySelectorAll('.credit-chip').forEach(btn => btn.classList.remove('selected-primary'));
    
    // Allumer la pastille cliquée
    if (btnElement) {
        btnElement.classList.add('selected-primary');
    }

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
    const repairCost = parseFloat(document.getElementById('repair-cost').value);
    const newCarPrice = parseFloat(document.getElementById('new-car-price').value);
    const months = parseInt(document.getElementById('car-months').value);
    const annualRate = parseFloat(document.getElementById('car-rate').value) / 100;
    const resultDiv = document.getElementById('auto-result');
    
    if (isNaN(repairCost) || isNaN(newCarPrice) || isNaN(months) || isNaN(annualRate) || newCarPrice <= 0 || months <= 0 || repairCost < 0) {
        resultDiv.classList.add('hidden');
        return;
    }

    const monthlyRate = annualRate / 12;
    let monthlyPayment = 0;
    if (monthlyRate > 0) {
        monthlyPayment = newCarPrice * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    } else {
        monthlyPayment = newCarPrice / months;
    }
    
    const totalPaid = monthlyPayment * months;
    const totalInterest = totalPaid - newCarPrice;
    const monthsEquivalent = (repairCost / monthlyPayment).toFixed(1);
    const differenceInutile = totalPaid - repairCost;

    resultDiv.innerHTML = `Une facture de garage de <strong>${formatCurrency(repairCost)}</strong> fait mal au cœur. Pourtant, ce montant représente à peine <strong>${monthsEquivalent} mois</strong> de paiements de votre nouvelle voiture (qui vous coûtera <strong>${formatCurrency(monthlyPayment)}/mois</strong>) !<br><br>En fuyant cette réparation, vous vous engagez à débourser <strong>${formatCurrency(totalPaid)}</strong> sur ${months / 12} ans. Vous paierez donc <strong>${formatCurrency(differenceInutile)} de plus</strong> que votre facture de garage, sans compter les ${formatCurrency(totalInterest)} jetés par les fenêtres en purs intérêts.<br><br><span style="font-size:0.95rem; color:#EF4444; font-weight:bold;">Changer d'auto pour éviter de réparer l'ancienne est un désastre mathématique. Gardez votre voiture !</span>`;
    resultDiv.classList.remove('hidden');
}

// Optionnel : Éteindre les boutons auto si l'utilisateur modifie les chiffres manuellement
document.querySelectorAll('#new-car-price, #car-months, #car-rate').forEach(input => {
    input.addEventListener('input', () => {
        document.querySelectorAll('.auto-chip').forEach(btn => btn.classList.remove('selected-primary'));
    });
});

// Piège 2 : Micro-dépenses
function toggleHabit(btn) {
    btn.classList.toggle('selected'); // Utilise la pastille rouge
    
    let total = 0;
    // Additionne toutes les pastilles qui sont sélectionnées
    document.querySelectorAll('.expense-habit.selected').forEach(b => {
        total += parseFloat(b.getAttribute('data-cost'));
    });
    
    // Met à jour le champ texte et lance le calcul
    document.getElementById('weekly-expense').value = total > 0 ? total : '';
    calculateExpense();
}
function calculateExpense() {
    const weekly = parseFloat(document.getElementById('weekly-expense').value);
    const resultDiv = document.getElementById('expense-result');
    
    // Si vide ou invalide, on cache
    if (isNaN(weekly) || weekly <= 0) {
        resultDiv.classList.add('hidden');
        return;
    }

    const monthlyInvestment = (weekly * 52) / 12;
    const rate = 0.07 / 12; // 7% rendement historique réel
    
    // Calcul sur 10 ans
    const months10 = 10 * 12; 
    const futureValue10 = monthlyInvestment * ((Math.pow(1 + rate, months10) - 1) / rate);
    const profit10 = futureValue10 - (weekly * 52 * 10);

    // Calcul sur 25 ans (L'effet "Wow")
    const months25 = 25 * 12;
    const futureValue25 = monthlyInvestment * ((Math.pow(1 + rate, months25) - 1) / rate);

    resultDiv.innerHTML = `Si vous aviez investi ces <strong>${formatCurrency(weekly)}/semaine</strong> dans la bourse (~7% réel) plutôt que de les dépenser :<br><br>Dans 10 ans, vous auriez <strong>${formatCurrency(futureValue10)}</strong> dans vos poches.<br><span style="font-size:0.85rem; color:var(--subtle-text-color);">Dont <strong>${formatCurrency(profit10)}</strong> générés purement par la magie des intérêts composés.</span><br><br><span style="font-size:1.05rem; color:var(--primary-color); font-weight:bold;">Sur 25 ans ? Vos habitudes valent une fortune : ${formatCurrency(futureValue25)} !</span>`;
    
    resultDiv.classList.remove('hidden');
}

// 2. Pour les boutons des dépenses
const weeklyExpenseInput = document.getElementById('weekly-expense');
if (weeklyExpenseInput) {
    weeklyExpenseInput.addEventListener('input', () => {
        // Si l'utilisateur tape un chiffre, on éteint toutes les pastilles rouges
        document.querySelectorAll('.expense-habit').forEach(btn => btn.classList.remove('selected'));
    });
}

// Piège 3 : Carte de crédit
function calculateCreditCard() {
    const balance = parseFloat(document.getElementById('cc-balance').value);
    const payment = parseFloat(document.getElementById('cc-payment').value);
    const resultDiv = document.getElementById('cc-result');
    
    if (isNaN(balance) || isNaN(payment) || balance <= 0 || payment <= 0) {
        resultDiv.classList.add('hidden');
        return;
    }

    const annualRate = 0.2099; // Taux de carte de crédit standard au Québec
    const monthlyRate = annualRate / 12;

    // Avertissement critique si le paiement est trop bas
    if (payment <= balance * monthlyRate) {
        resultDiv.innerHTML = `🚨 <strong>Alerte Rouge :</strong> Votre paiement de ${formatCurrency(payment)} ne couvre même pas les intérêts mensuels de ${formatCurrency(balance * monthlyRate)} générés par votre dette. <br><br>Il est mathématiquement impossible de rembourser cette carte de cette façon. Votre solde augmentera à l'infini !`;
        resultDiv.className = "tool-result-box mt-4";
        resultDiv.style.borderLeftColor = "#EF4444";
        return;
    }

    // Calcul du temps de remboursement et des intérêts totaux
    const monthsNeeded = -Math.log(1 - (monthlyRate * balance) / payment) / Math.log(1 + monthlyRate);
    const yearsNeeded = (monthsNeeded / 12).toFixed(1);
    const totalPaid = monthsNeeded * payment;
    const totalInterest = totalPaid - balance;

    resultDiv.innerHTML = `À coup de ${formatCurrency(payment)}/mois, il vous faudra <strong>${yearsNeeded} années</strong> (soit ${Math.ceil(monthsNeeded)} mois) pour rembourser ce solde.<br><br><span style="font-size:0.95rem; color:#EF4444; font-weight:bold;">Le vrai crime : Vous paierez ${formatCurrency(totalInterest)} uniquement en intérêts.</span><br><br>C'est comme si chaque article que vous aviez acheté avec cette carte vous coûtait près du double de son prix en magasin. Augmentez votre paiement d'urgence !`;
    
    // On force la bordure rouge pour ce résultat car une dette de carte de crédit est toujours une urgence
    resultDiv.className = "tool-result-box mt-4";
    resultDiv.style.borderLeftColor = "#EF4444"; 
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
