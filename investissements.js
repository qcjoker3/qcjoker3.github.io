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

// Plugin Ligne de Réalité
const realityLinePlugin = {
    id: 'realityLine',
    afterDatasetsDraw(chart) {
        if (!chart.options.plugins?.realityLine?.y) return;
        const { ctx, chartArea, scales } = chart;
        const yValue = chart.options.plugins.realityLine.y;
        const yPixel = scales.y.getPixelForValue(yValue);
        ctx.save(); ctx.strokeStyle = '#A855F7'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(chartArea.left, yPixel); ctx.lineTo(chartArea.right, yPixel); ctx.stroke();
        ctx.font = 'bold 12px "Inter"'; ctx.fillStyle = '#A855F7'; ctx.textAlign = 'right';
        ctx.fillText(`Réalité: ${yValue}`, chartArea.right, yPixel - 8);
        ctx.restore();
    }
};
Chart.register(realityLinePlugin, ChartDataLabels);

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

function updatePredCharts(year) {
    const data = chartDataByYear[year];
    if (!data) return;
    const { institutions, previsions, real } = data;
    const base = previsions.map(p => Math.min(p, real)); 
    const ecarts = previsions.map(p => Math.abs(real - p)); 
    const signes = previsions.map(p => p >= real);

    const ctx = document.getElementById('chartCanvas').getContext('2d');
    if (predChartInstance) predChartInstance.destroy();

    predChartInstance = new Chart(ctx, {
        type: 'bar',
        data: { labels: institutions, datasets: [
            { label: 'Prévision', data: base, backgroundColor: 'rgba(45, 212, 191, 0.8)', stack: 'G' },
            { label: 'Erreur', data: ecarts, backgroundColor: 'rgba(239, 68, 68, 0.6)', stack: 'G' }
        ]},
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                realityLine: { y: real },
                datalabels: {
                    display: c => c.datasetIndex === 1, anchor: 'center', align: 'center', color: '#FFF', font: {size: 10, weight: 'bold'},
                    formatter: (v, c) => (signes[c.dataIndex] ? '🔺' : '🔻') + ` ${(v/real*100).toFixed(0)}%`
                }
            },
            scales: { x: { stacked: true, ticks: {color: '#9CA3AF', font: {size: 9}} }, y: { stacked: true, ticks: {color: '#9CA3AF'} } }
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
        tr.style.cursor = 'pointer';
        tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
        if (r.inst === focusedInst) tr.style.background = 'rgba(45,212,191,0.1)';
        
        tr.innerHTML = `<td style="padding:8px;">${i+1}</td><td style="padding:8px; font-weight:600; color:var(--heading-color);">${r.inst}</td><td style="padding:8px; color:#EF4444;">${r.err.toFixed(1)}%</td>`;
        tr.onclick = () => { focusedInst = r.inst; updatePredRanking(endYear); };
        tbody.appendChild(tr);
    });
    drawInstLine(focusedInst);
}

function drawInstLine(inst) {
    if (!inst) return;
    const ctx = document.getElementById('predRealCanvas').getContext('2d');
    if (predLineInstance) predLineInstance.destroy();
    
    const labels = [], preds = [], reals = [];
    Object.keys(chartDataByYear).sort().forEach(y => { 
        const i = chartDataByYear[y].institutions.indexOf(inst); 
        if (i > -1) { labels.push(y); preds.push(chartDataByYear[y].previsions[i]); reals.push(chartDataByYear[y].real); } 
    });

    predLineInstance = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: [
            { label: `${inst}`, data: preds, borderColor: '#2DD4BF', tension: 0.2, borderWidth: 2 },
            { label: 'Réalité', data: reals, borderColor: '#A855F7', borderDash: [5,5], tension: 0.2, borderWidth: 2 }
        ]},
        options: {
            maintainAspectRatio: false, plugins: { datalabels: {display:false}, legend: { labels: {color: '#9CA3AF'} } },
            scales: { x: { ticks:{color:'#9CA3AF'} }, y: { ticks:{color:'#9CA3AF'} } }
        }
    });
}


// ==========================================================
// 2. MODULE : T-REX (IMPACT DES FRAIS DE GESTION)
// ==========================================================
let trexChart = null;

function calculateTrex() {
    const P = parseFloat(document.getElementById('trex-initial').value) || 0;
    const C = parseFloat(document.getElementById('trex-annual').value) || 0;
    const n = parseFloat(document.getElementById('trex-years').value) || 25;
    const rGross = parseFloat(document.getElementById('trex-return').value) / 100 || 0;
    const fee = parseFloat(document.getElementById('trex-fee').value) / 100 || 0;

    const rNet = rGross - fee;
    const fv = (P, r, n, C) => P * Math.pow(1 + r, n) + (r > 0 ? (C * ((Math.pow(1 + r, n) - 1) / r)) : C * n);

    const valGross = fv(P, rGross, n, C);
    const valNet = fv(P, rNet, n, C);
    const cost = valGross - valNet;
    const pctLost = (cost / valGross) * 100;

    document.getElementById('trex-results').innerHTML = `
        <div class="result-metric-grid" style="gap: 1rem;">
            <div style="background: rgba(45, 212, 191, 0.05); padding: 1.5rem; border-radius: 12px; border: 1px solid rgba(45, 212, 191, 0.2);">
                <span class="label" style="color: #2DD4BF;">Potentiel sans frais</span>
                <span class="value" style="color: #2DD4BF;">${formatCurrency(valGross)}</span>
            </div>
            <div style="background: rgba(239, 68, 68, 0.05); padding: 1.5rem; border-radius: 12px; border: 1px solid rgba(239, 68, 68, 0.2);">
                <span class="label" style="color: #EF4444;">Frais totaux confisqués</span>
                <span class="value text-red">${formatCurrency(cost)}</span>
                <span class="subtext" style="color: #EF4444; font-weight: bold;">(-${pctLost.toFixed(1)}% de votre richesse)</span>
            </div>
        </div>
    `;

    const ctx = document.getElementById('chart-trex').getContext('2d');
    if (trexChart) trexChart.destroy();
    
    // Pour que ChartDataLabels ne ruine pas ce chart
    const noLabelsPlugin = { id: 'noLabels', beforeDraw(chart) { chart.options.plugins.datalabels.display = false; } };

    trexChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: ['Valeur Réelle (Après Frais)', 'Potentiel (Marché)'], datasets: [{ data: [valNet, valGross], backgroundColor: ['#0D9488', 'rgba(13, 148, 136, 0.2)'] }] },
        options: { maintainAspectRatio: false, plugins: { legend: {display:false}, datalabels: {display: false} }, scales: { y: { ticks: {color: '#9CA3AF'} }, x: { ticks: {color: '#9CA3AF'} } } },
        plugins: [noLabelsPlugin]
    });
}


// ==========================================================
// 3. MODULE : SIMULATEUR FNB & DCA
// ==========================================================
let fnbAllocChart = null;
let fnbGrowthChart = null;

const fnbData = {
    VBAL: { nom: "Équilibré (VBAL)", frais: 0.24, r: 6.0, eq: 60, fi: 40 },
    VGRO: { nom: "Croissance (VGRO)", frais: 0.24, r: 7.0, eq: 80, fi: 20 },
    VEQT: { nom: "100% Actions (VEQT)", frais: 0.24, r: 8.0, eq: 100, fi: 0 }
};

function calculateFNB() {
    // UI Update Radio buttons
    const radios = document.getElementsByName('fnb-profil');
    let selProfile = 'VGRO';
    radios.forEach(r => { 
        const btn = document.getElementById('btn-' + r.value.toLowerCase());
        if (r.checked) { 
            selProfile = r.value; 
            btn.style.borderColor = '#2DD4BF'; btn.style.color = '#2DD4BF';
        } else {
            btn.style.borderColor = 'var(--border-color)'; btn.style.color = 'var(--text-color)';
        }
    });

    const fnb = fnbData[selProfile];
    const P = parseFloat(document.getElementById('fnb-initial').value) || 0;
    const C = parseFloat(document.getElementById('fnb-monthly').value) || 0;
    const y = parseFloat(document.getElementById('fnb-years').value) || 25;

    const rNet = (fnb.r - fnb.frais) / 100;
    const n = y * 12;
    const rateM = Math.pow(1 + rNet, 1/12) - 1;
    
    let fv = P * Math.pow(1 + rateM, n);
    if (rateM > 0) fv += C * ((Math.pow(1 + rateM, n) - 1) / rateM);
    else fv += C * n;

    document.getElementById('fnb-results').innerHTML = `
        <h3 style="margin:0 0 5px 0; color: var(--heading-color);">${fnb.nom}</h3>
        <p class="text-muted" style="margin:0 0 1rem 0; font-size: 0.85rem;">Frais: ${fnb.frais}% | Rendement espéré: ${fnb.r}%</p>
        <span class="label">Capital projeté (An ${y})</span>
        <span class="value" style="display:block; font-size: 2.2rem; color: #2DD4BF;">${formatCurrency(fv)}</span>
    `;

    // Charts
    const ctxA = document.getElementById('chart-fnb-alloc').getContext('2d');
    if (fnbAllocChart) fnbAllocChart.destroy();
    fnbAllocChart = new Chart(ctxA, {
        type: 'doughnut', data: { labels: ['Actions', 'Obligations'], datasets: [{ data: [fnb.eq, fnb.fi], backgroundColor: ['#2DD4BF', '#4F46E5'], borderWidth: 0 }] },
        options: { cutout: '75%', plugins: { legend: {display:false}, datalabels: {display:false} } }
    });

    const ctxG = document.getElementById('chart-fnb-growth').getContext('2d');
    if (fnbGrowthChart) fnbGrowthChart.destroy();
    
    const traj = []; let cur = P;
    for(let i=0; i<=y; i++) {
        traj.push(cur);
        cur = (cur * Math.pow(1 + rateM, 12)) + (C * ((Math.pow(1 + rateM, 12) - 1) / rateM));
    }
    
    fnbGrowthChart = new Chart(ctxG, {
        type: 'line', data: { labels: Array.from({length: y+1}, (_, i)=>i), datasets: [{ data: traj, borderColor: '#2DD4BF', backgroundColor: 'rgba(45,212,191,0.1)', fill:true, tension: 0.3, pointRadius: 0 }] },
        options: { maintainAspectRatio: false, plugins: { legend: {display:false}, datalabels: {display:false} }, scales: { x:{display:false}, y:{display:false} } }
    });
}

// ==========================================================
// 4. MODULE : REER VS CELI (LE DUEL)
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
    calculateTrex();
    calculateFNB();
    calculateReerCeli();
});
