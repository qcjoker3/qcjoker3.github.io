// ==========================================
// INITIALISATION & NAVIGATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Calculer les widgets dès l'ouverture de la page
    calculateBudgetInflation();
    calculateDashboard();

    // Menu hamburger pour mobile
    const menuToggle = document.getElementById('menu-toggle');
    const navLinks = document.getElementById('nav-links');
    if(menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('show');
        });
    }
});

// Outil de formatage pour les devises (CAD)
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-CA', { 
        style: 'currency', 
        currency: 'CAD', 
        maximumFractionDigits: 0 
    }).format(amount);
};

// ==========================================
// WIDGET 1 : L'ÉROSION DE L'INFLATION
// ==========================================
function calculateBudgetInflation() {
    const balSlider = document.getElementById('infl-bal-slider');
    const rateSlider = document.getElementById('infl-rate-slider');
    
    if (!balSlider || !rateSlider) return;

    const bal = parseFloat(balSlider.value);
    const rate = parseFloat(rateSlider.value) / 100;
    
    // Mise à jour visuelle des valeurs au-dessus des sliders
    document.getElementById('infl-bal-val').innerText = formatCurrency(bal);
    document.getElementById('infl-rate-val').innerText = (rate * 100).toFixed(1) + " %";

    const res = document.getElementById('inflation-result-content');
    
    // Calculs de la perte de pouvoir d'achat (Actualisation)
    const power5 = bal / Math.pow(1 + rate, 5);
    const power10 = bal / Math.pow(1 + rate, 10);
    const power15 = bal / Math.pow(1 + rate, 15);

    // Injection du HTML
    res.innerHTML = `
        <div class="result-list-item" style="border-color: rgba(255,255,255,0.05); padding: 10px 0;">
            <span style="font-size: 0.9rem; color: var(--text-color);">Dans 5 ans</span>
            <strong class="text-red">${formatCurrency(power5)}</strong>
        </div>
        <div class="result-list-item" style="border-color: rgba(255,255,255,0.05); padding: 10px 0;">
            <span style="font-size: 0.9rem; color: var(--text-color);">Dans 10 ans</span>
            <strong class="text-red">${formatCurrency(power10)}</strong>
        </div>
        <div class="result-list-item" style="border-bottom: none; padding: 10px 0;">
            <span style="font-size: 0.9rem; color: var(--text-color);">Dans 15 ans</span>
            <strong class="text-red">${formatCurrency(power15)}</strong>
        </div>
    `;
}

// ==========================================
// WIDGET 2 : DASHBOARD DE TRÉSORERIE (50/30/20)
// ==========================================
function calculateDashboard() {
    // 1. Calcul du Revenu Mensuel Lissé
    const incomeBiweekly = parseFloat(document.getElementById('cf-income').value) || 0;
    const incomeMonthly = (incomeBiweekly * 26) / 12;

    // 2. Calcul des Dépenses Structurelles (Besoins - 50%)
    const housing = parseFloat(document.getElementById('cf-needs-housing').value) || 0;
    const living = parseFloat(document.getElementById('cf-needs-living').value) || 0;
    const debt = parseFloat(document.getElementById('cf-needs-debt').value) || 0;
    const needs = housing + living + debt;

    // 3. Calcul des Dépenses Comportementales (Désirs - 30%)
    const fun = parseFloat(document.getElementById('cf-wants-fun').value) || 0;
    const shopping = parseFloat(document.getElementById('cf-wants-shopping').value) || 0;
    const wants = fun + shopping;

    // 4. Bilan
    const totalExpenses = needs + wants;
    const surplus = incomeMonthly - totalExpenses; // (Épargne - 20%)

    // 5. Calcul des Pourcentages réels
    let needsPct = incomeMonthly > 0 ? (needs / incomeMonthly) * 100 : 0;
    let wantsPct = incomeMonthly > 0 ? (wants / incomeMonthly) * 100 : 0;
    let surplusPct = incomeMonthly > 0 ? (surplus / incomeMonthly) * 100 : 0;

    // Ajustement des pourcentages visuels pour la barre CSS (pour ne pas dépasser 100% visuellement)
    let visualNeeds = Math.min(needsPct, 100);
    let visualWants = Math.min(wantsPct, Math.max(0, 100 - visualNeeds));
    let visualSurplus = Math.max(0, 100 - visualNeeds - visualWants);

    // 6. Projection 25 ans à 7% d'intérêts composés (si surplus il y a)
    const r = 0.07 / 12; // Taux mensuel
    const n = 25 * 12;   // Nombre de mois
    const wealthPotential = surplus > 0 ? surplus * ((Math.pow(1 + r, n) - 1) / r) : 0;

    // 7. Mise à jour de l'interface
    const dashDiv = document.getElementById('cf-dashboard');
    if (!dashDiv) return;

    // Création de la jauge visuelle et du bilan de base
    let html = `
        <h3 style="margin-top: 0; margin-bottom: 2rem; font-size: 1.5rem; color: var(--heading-color);">Bilan Mensuel</h3>
        
        <div class="alloc-bar-container mb-4">
            <div class="alloc-bar">
                <div class="alloc-segment needs" style="width: ${visualNeeds}%;"></div>
                <div class="alloc-segment wants" style="width: ${visualWants}%;"></div>
                <div class="alloc-segment savings" style="width: ${visualSurplus}%;"></div>
            </div>
            <div class="alloc-labels mt-2">
                <div class="alloc-label"><span class="dot needs-dot"></span>Besoins (${needsPct.toFixed(0)}%)</div>
                <div class="alloc-label"><span class="dot wants-dot"></span>Désirs (${wantsPct.toFixed(0)}%)</div>
                <div class="alloc-label"><span class="dot savings-dot"></span>Épargne (${surplusPct.toFixed(0)}%)</div>
            </div>
        </div>

        <div class="result-metric-grid mb-4" style="gap: 1rem;">
            <div style="background: rgba(255,255,255,0.03); padding: 1.2rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                <span class="label">Revenu Mensuel Lissé</span>
                <span class="value" style="font-size: 1.3rem; color: var(--heading-color);">${formatCurrency(incomeMonthly)}</span>
            </div>
            <div style="background: rgba(255,255,255,0.03); padding: 1.2rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                <span class="label">Total des Dépenses</span>
                <span class="value ${totalExpenses > incomeMonthly ? 'text-red' : ''}" style="font-size: 1.3rem;">${formatCurrency(totalExpenses)}</span>
            </div>
        </div>
    `;

    // Si on dégage de l'épargne (Vert)
    if (surplus >= 0) {
        html += `
            <div style="background: rgba(45, 212, 191, 0.05); padding: 2rem; border-radius: 16px; border: 1px solid rgba(45, 212, 191, 0.2); text-align: center;">
                <span class="label" style="color: #2DD4BF; font-weight: 600;">Capacité d'investissement mensuelle</span>
                <span class="value" style="color: #2DD4BF; font-size: 2.8rem; display: block; margin: 10px 0;">+${formatCurrency(surplus)}</span>
                
                <hr style="border: 0; border-top: 1px dashed rgba(45, 212, 191, 0.2); margin: 1.5rem 0;">
                
                <span class="label" style="color: var(--text-color);">Potentiel de Richesse (25 ans à 7%)</span>
                <span class="value" style="color: #FFF; font-size: 2rem; display: block; margin-top: 5px;">${formatCurrency(wealthPotential)}</span>
                
                <a href="investissements.html" class="btn-primary-large mt-4" style="width: 100%;">Placer ce capital →</a>
            </div>
        `;
    } 
    // Si on est en déficit (Rouge)
    else {
        html += `
            <div style="background: rgba(239, 68, 68, 0.05); padding: 2rem; border-radius: 16px; border: 1px solid rgba(239, 68, 68, 0.2); text-align: center;">
                <span class="label text-red" style="font-weight: 600;">Déficit de trésorerie</span>
                <span class="value text-red" style="font-size: 2.8rem; display: block; margin: 10px 0;">${formatCurrency(surplus)}</span>
                <p class="text-muted" style="font-size: 0.95rem; margin-top: 1rem; line-height: 1.5;">
                    Vos sorties d'argent dépassent vos entrées. L'urgence est de restructurer vos frais fixes (assurances, télécom) et de limiter les dépenses comportementales pour ramener votre flux de trésorerie dans le positif.
                </p>
            </div>
        `;
    }

    dashDiv.innerHTML = html;
}
