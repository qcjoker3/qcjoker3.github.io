// ==========================================================
// OUTILS DE FORMATAGE
// ==========================================================
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(amount);
};

// ==========================================================
// 1. MODULE : PRÉDICTIONS (LE CIMETIÈRE)
// ==========================================================
const chartDataByYear = {
    "2020": { real: 3756, institutions: ["Goldman Sachs", "JP Morgan", "BofA", "Morgan Stanley", "UBS", "Wells Fargo", "Barclays", "RBC", "Deutsche", "Credit Suisse", "BMO", "Oppenheimer"], previsions: [3400, 3400, 3300, 3000, 3000, 3300, 3300, 3350, 3250, 3425, 3400, 3500] },
    "2021": { real: 4766, institutions: ["Goldman Sachs", "JP Morgan", "BofA", "Morgan Stanley", "UBS", "Wells Fargo", "Barclays", "RBC", "Deutsche", "Credit Suisse", "BMO", "Oppenheimer"], previsions: [4300, 4400, 3800, 3900, 4100, 4000, 4000, 4100, 3950, 4050, 4200, 4300] },
    "2022": { real: 3840, institutions: ["Goldman Sachs", "JP Morgan", "BofA", "Morgan Stanley", "UBS", "Wells Fargo", "Barclays", "RBC", "Deutsche", "Credit Suisse", "BMO", "Oppenheimer"], previsions: [5100, 5050, 4600, 4400, 4850, 5300, 4800, 5050, 5250, 5200, 5300, 5330] },
    "2023": { real: 4770, institutions: ["Goldman Sachs", "JP Morgan", "BofA", "Morgan Stanley", "UBS", "Wells Fargo", "Barclays", "RBC", "Deutsche", "Credit Suisse", "BMO", "Oppenheimer"], previsions: [4000, 4200, 4000, 3900, 3900, 4400, 4150, 4300, 4500, 4050, 4300, 4400] },
    "2024": { real: 5882, institutions: ["Goldman Sachs", "JP Morgan", "BofA", "Morgan Stanley", "UBS", "Wells Fargo", "Barclays", "RBC", "Deutsche", "BCA Research", "BMO", "Oppenheimer"], previsions: [5100, 4200, 5000, 4500, 4700, 4700, 5300, 5000, 5100, 3300, 5100, 5200] },
};

let predChartInstance = null;
let predLineInstance = null;
let focusedInst = null;
let curHorizon = 1;

function initPredictions() {
    const yearSelect = document.getElementById('yearSelect');
    const years = Object.keys(chartDataByYear).sort();
    years.forEach(y => yearSelect.appendChild(new Option(y, y)));
    yearSelect.value = years[years.length - 1];

    yearSelect.addEventListener('change', e => updatePredCharts(e.target.value));
    
    document.querySelectorAll('.horizon-tabs button').forEach(btn => {
        btn.addEventListener('click', e => {
            document.querySelectorAll('.horizon-tabs button').forEach(b => {
                b.classList.remove('active');
                b.style.borderColor = 'transparent'; b.style.color = 'var(--text-color)';
            });
            btn.classList.add('active');
            btn.style.borderColor = '#2DD4BF'; btn.style.color = '#2DD4BF';
            curHorizon = Number(btn.dataset.h);
            updatePredRanking(yearSelect.value);
        });
    });

    updatePredCharts(yearSelect.value);
    updatePredRanking(yearSelect.value);
}

// Graphique 1 : Barre des erreurs en % pour une année spécifique
function updatePredCharts(year) {
    const data = chartDataByYear[year];
    if (!data) return;
    const { institutions, previsions, real } = data;

    // Calcul de l'erreur en % (Prévision vs Réalité)
    const errorsPct = previsions.map(p => ((p - real) / real) * 100);

    const ctx = document.getElementById('chartCanvas').getContext('2d');
    if (predChartInstance) predChartInstance.destroy();

    predChartInstance = new Chart(ctx, {
        type: 'bar',
        data: { 
            labels: institutions, 
            datasets: [{ 
                label: 'Erreur (%)', 
                data: errorsPct, 
                // Teal pour optimiste (au-dessus de 0), Rouge pour pessimiste (en-dessous de 0)
                backgroundColor: errorsPct.map(e => e > 0 ? 'rgba(45, 212, 191, 0.8)' : 'rgba(239, 68, 68, 0.8)'),
                borderRadius: 4
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `Erreur : ${ctx.raw > 0 ? '+' : ''}${ctx.raw.toFixed(1)}%`
                    }
                },
                datalabels: {
                    display: true, 
                    anchor: c => errorsPct[c.dataIndex] > 0 ? 'end' : 'start', 
                    align: c => errorsPct[c.dataIndex] > 0 ? 'top' : 'bottom', 
                    color: '#FFF', 
                    font: {size: 10, weight: 'bold'},
                    formatter: v => (v > 0 ? '+' : '') + v.toFixed(1) + '%'
                }
            },
            scales: { 
                x: { 
                    ticks: {color: '#9CA3AF', font: {size: 9}}, 
                    grid: { color: 'rgba(255,255,255,0.05)' } 
                }, 
                y: { 
                    ticks: {color: '#9CA3AF', callback: v => v + '%'}, 
                    // Rend la ligne de 0% (La Réalité parfaite) plus épaisse et blanche
                    grid: { 
                        color: c => c.tick.value === 0 ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.05)', 
                        lineWidth: c => c.tick.value === 0 ? 2 : 1 
                    },
                    title: { display: true, text: 'Écart vs Réalité (%)', color: '#9CA3AF' }
                } 
            }
        }
    });
}

function updatePredRanking(endYear) {
    const years = Object.keys(chartDataByYear).sort();
    const endIdx = years.indexOf(String(endYear));
    const startIdx = Math.max(0, endIdx - (curHorizon - 1));
    const windowYears = years.slice(startIdx, endIdx + 1);
    
    const stats = {};
    windowYears.forEach(y => { 
        chartDataByYear[y].institutions.forEach((inst, i) => { 
            if (!stats[inst]) stats[inst] = { sumErr: 0, count: 0 }; 
            // On conserve la moyenne de l'erreur absolue pour le classement
            stats[inst].sumErr += Math.abs(chartDataByYear[y].previsions[i] - chartDataByYear[y].real) / chartDataByYear[y].real * 100; 
            stats[inst].count++; 
        }); 
    });
    
    const ranking = Object.entries(stats).map(([k, v]) => ({ inst: k, err: v.sumErr/v.count })).sort((a, b) => a.err - b.err);
    if (!focusedInst && ranking.length > 0) focusedInst = ranking[0].inst;

    const tbody = document.querySelector('#rankingTable tbody');
    tbody.innerHTML = '';
    ranking.forEach((r, i) => {
        const tr = document.createElement('tr');
        
        if (r.inst === focusedInst) {
            tr.classList.add('focused');
        }
        
        tr.innerHTML = `
            <td><span class="rank-badge">${i+1}</span></td>
            <td style="font-weight:600;">${r.inst}</td>
            <td style="color:#EF4444; font-weight:600;">${r.err.toFixed(1)}%</td>
        `;
        
        tr.onclick = () => { focusedInst = r.inst; updatePredRanking(endYear); };
        tbody.appendChild(tr);
    });
    
    drawInstLine(focusedInst);
}

// Graphique 2 : Trajectoire de l'erreur en % d'une institution précise
function drawInstLine(inst) {
    if (!inst) return;
    const ctx = document.getElementById('predRealCanvas').getContext('2d');
    if (predLineInstance) predLineInstance.destroy();
    
    const labels = [], errors = [];
    Object.keys(chartDataByYear).sort().forEach(y => { 
        const i = chartDataByYear[y].institutions.indexOf(inst); 
        if (i > -1) { 
            labels.push(y); 
            const real = chartDataByYear[y].real;
            const pred = chartDataByYear[y].previsions[i];
            errors.push(((pred - real) / real) * 100); 
        } 
    });

    predLineInstance = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: [
            { 
                label: `Erreur (%) - ${inst}`, 
                data: errors, 
                borderColor: '#A855F7', 
                backgroundColor: 'rgba(168, 85, 247, 0.1)', 
                tension: 0.3, 
                borderWidth: 3, 
                fill: true, 
                pointBackgroundColor: '#A855F7', 
                pointRadius: 4 
            }
        ]},
        options: {
            maintainAspectRatio: false, 
            plugins: { 
                datalabels: {display:false}, 
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `Erreur : ${ctx.raw > 0 ? '+' : ''}${ctx.raw.toFixed(1)}%`
                    }
                }
            },
            scales: { 
                x: { 
                    ticks:{color:'#9CA3AF'}, 
                    grid: {color: 'rgba(255,255,255,0.05)'} 
                }, 
                y: { 
                    ticks:{color:'#9CA3AF', callback: v => v + '%'}, 
                    grid: { 
                        color: c => c.tick.value === 0 ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.05)', 
                        lineWidth: c => c.tick.value === 0 ? 2 : 1 
                    },
                    title: { display: true, text: 'Trajectoire de l\'erreur (%)', color: '#9CA3AF' }
                } 
            }
        }
    });
}


// ==========================================================
// 2. MODULE : T-REX (IMPACT DES FRAIS DE GESTION)
// ==========================================================
function calculateUnifiedStrategy() {
    // 1. Récupération des entrées (On garde les mêmes IDs)
    const P = parseFloat(document.getElementById('strat-initial').value) || 0;
    const M = parseFloat(document.getElementById('strat-monthly').value) || 0;
    const y = parseFloat(document.getElementById('strat-years').value) || 0;
    const rMarket = parseFloat(document.getElementById('strat-return').value) / 100 || 0;
    const feeL = parseFloat(document.getElementById('strat-fee-low').value) / 100 || 0;
    const feeH = parseFloat(document.getElementById('strat-fee-high').value) / 100 || 0;

    const nMonths = y * 12;
    const rNetL = Math.pow(1 + (rMarket - feeL), 1/12) - 1;
    const rNetH = Math.pow(1 + (rMarket - feeH), 1/12) - 1;

    const calcFV = (rate) => {
        if (rate === 0) return P + (M * nMonths);
        return P * Math.pow(1 + rate, nMonths) + M * ((Math.pow(1 + rate, nMonths) - 1) / rate);
    };

    const finalL = calcFV(rNetL);
    const finalH = calcFV(rNetH);

    // 2. MISE À JOUR DU DOM (UNIQUEMENT LES ÉLÉMENTS QUI EXISTENT DANS TON HTML)
    
    // Le Gap de richesse
    const resGap = document.getElementById('res-gap');
    if (resGap) resGap.innerText = formatCurrency(finalL - finalH);

    // Le % de perte
    const resPctLost = document.getElementById('res-pct-lost');
    if (resPctLost) {
        const pct = finalL > 0 ? ((finalL - finalH) / finalL * 100).toFixed(1) : 0;
        resPctLost.innerText = pct;
    }

    // Valeur Finale Passive (FNB)
    const resFinalLow = document.getElementById('res-final-low');
    if (resFinalLow) resFinalLow.innerText = formatCurrency(finalL);

    // Valeur Finale Active (Fonds)
    const resFinalHigh = document.getElementById('res-final-high');
    if (resFinalHigh) resFinalHigh.innerText = formatCurrency(finalH);
    
    // NOTE : On ne touche plus aux res-invested ou res-growth, 
    // donc le script ne plantera plus même s'ils sont absents du HTML.
}

// ==========================================================
// 3. MODULE : REER VS CELI (LE DUEL)
// ==========================================================
let rcChart = null;

function calculateReerCeli() {
    const pmtNet = parseFloat(document.getElementById('rc-amount').value) || 0;
    const r = parseFloat(document.getElementById('rc-return').value) / 100 || 0;
    const years = parseFloat(document.getElementById('rc-years').value) || 25;
    const taxNow = parseFloat(document.getElementById('rc-tax-now').value) / 100 || 0;
    const taxRet = parseFloat(document.getElementById('rc-tax-ret').value) / 100 || 0;

    // CELI (Croissance standard)
    const fvCeli = pmtNet * ((Math.pow(1 + r, years) - 1) / r);

    // REER (Cotisation gonflée par le retour d'impôt investi)
    // Maths: Pour que la cotisation nette de votre poche soit X, la cotisation brute doit être X / (1 - TaxRate)
    const grossRrspPmt = pmtNet / (1 - taxNow);
    const fvGrossRrsp = grossRrspPmt * ((Math.pow(1 + r, years) - 1) / r);
    const fvNetRrsp = fvGrossRrsp * (1 - taxRet);

    const winner = fvNetRrsp > fvCeli ? 'REER' : (fvCeli > fvNetRrsp ? 'CELI' : 'Égalité');
    const diff = Math.abs(fvNetRrsp - fvCeli);
    const isReerWinner = fvNetRrsp >= fvCeli;

    document.getElementById('rc-results').innerHTML = `
        <div class="result-metric-grid" style="gap: 1rem; margin-bottom: 1.5rem;">
            <div style="background: rgba(13, 148, 136, 0.05); padding: 1.5rem; border-radius: 12px; border: 1px solid ${!isReerWinner ? '#2DD4BF' : 'transparent'};">
                <span class="label" style="color: #2DD4BF;">Capital Net CELI</span>
                <span class="value" style="color: #2DD4BF;">${formatCurrency(fvCeli)}</span>
            </div>
            <div style="background: rgba(79, 70, 229, 0.05); padding: 1.5rem; border-radius: 12px; border: 1px solid ${isReerWinner ? '#4F46E5' : 'transparent'};">
                <span class="label" style="color: #4F46E5;">Capital Net REER</span>
                <span class="value" style="color: #4F46E5;">${formatCurrency(fvNetRrsp)}</span>
            </div>
        </div>
        <p style="text-align: center; color: var(--heading-color); font-weight: bold; font-size: 1.1rem; margin:0;">
            Avantage au ${winner} (+ ${formatCurrency(diff)})
        </p>
    `;

    const ctx = document.getElementById('chart-reer-celi').getContext('2d');
    if (rcChart) rcChart.destroy();
    
    // Génération des trajectoires
    const trajCeli = [], trajReer = [];
    for(let i=0; i<=years; i++){
        trajCeli.push( pmtNet * ((Math.pow(1 + r, i) - 1) / r) || (pmtNet*i) );
        trajReer.push( (grossRrspPmt * ((Math.pow(1 + r, i) - 1) / r) || (grossRrspPmt*i)) * (1 - taxRet) );
    }

    rcChart = new Chart(ctx, {
        type: 'line', data: { labels: Array.from({length: years+1}, (_, i)=>`An ${i}`), datasets: [
            { label: 'Net REER', data: trajReer, borderColor: '#4F46E5', tension: 0.3 },
            { label: 'Net CELI', data: trajCeli, borderColor: '#2DD4BF', borderDash: [5,5], tension: 0.3 }
        ]},
        options: { maintainAspectRatio: false, plugins: { datalabels:{display:false}, legend: { labels: {color: '#9CA3AF'} } }, scales: { y: { ticks: {color: '#9CA3AF', callback: v => formatCurrency(v)} }, x: { ticks: {color: '#9CA3AF'} } } }
    });
}

// Initialisation globale
document.addEventListener('DOMContentLoaded', () => {
    initPredictions();
    calculateUnifiedStrategy()
    calculateReerCeli();
});
