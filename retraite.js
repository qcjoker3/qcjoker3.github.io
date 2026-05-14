// ==========================================================
// UTILITAIRE
// ==========================================================
const formatCurrency = (val) => {
    return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val);
};

// ==========================================================
// MODULE : PARADOXE RRQ (BACKTEST TSX 1986-2025)
// ==========================================================
const historicalDataTSX = [
    { year: 1986, mga: 25900, ybe: 2500, rate: 0.018, tsx: 0.0880 },
    { year: 1987, mga: 26600, ybe: 2600, rate: 0.019, tsx: 0.0590 },
    { year: 1988, mga: 27500, ybe: 2700, rate: 0.020, tsx: 0.1110 },
    { year: 1989, mga: 28600, ybe: 2800, rate: 0.021, tsx: 0.2130 },
    { year: 1990, mga: 29900, ybe: 3000, rate: 0.022, tsx: -0.1480 },
    { year: 1991, mga: 30500, ybe: 3000, rate: 0.023, tsx: 0.1200 },
    { year: 1992, mga: 32200, ybe: 3200, rate: 0.024, tsx: -0.0140 },
    { year: 1993, mga: 33400, ybe: 3300, rate: 0.025, tsx: 0.3250 },
    { year: 1994, mga: 34400, ybe: 3400, rate: 0.026, tsx: -0.0020 },
    { year: 1995, mga: 34900, ybe: 3400, rate: 0.027, tsx: 0.1450 },
    { year: 1996, mga: 35400, ybe: 3500, rate: 0.028, tsx: 0.2830 },
    { year: 1997, mga: 35800, ybe: 3500, rate: 0.030, tsx: 0.1490 },
    { year: 1998, mga: 36900, ybe: 3500, rate: 0.032, tsx: -0.0160 },
    { year: 1999, mga: 37400, ybe: 3500, rate: 0.035, tsx: 0.3170 },
    { year: 2000, mga: 37600, ybe: 3500, rate: 0.039, tsx: 0.0740 },
    { year: 2001, mga: 38300, ybe: 3500, rate: 0.043, tsx: -0.1260 },
    { year: 2002, mga: 39100, ybe: 3500, rate: 0.047, tsx: -0.1240 },
    { year: 2003, mga: 39900, ybe: 3500, rate: 0.0495, tsx: 0.2670 },
    { year: 2004, mga: 40500, ybe: 3500, rate: 0.0495, tsx: 0.1450 },
    { year: 2005, mga: 41100, ybe: 3500, rate: 0.0495, tsx: 0.2410 },
    { year: 2006, mga: 42100, ybe: 3500, rate: 0.0495, tsx: 0.1730 },
    { year: 2007, mga: 43700, ybe: 3500, rate: 0.0495, tsx: 0.0980 },
    { year: 2008, mga: 44900, ybe: 3500, rate: 0.0495, tsx: -0.3300 },
    { year: 2009, mga: 46300, ybe: 3500, rate: 0.0495, tsx: 0.3510 },
    { year: 2010, mga: 47200, ybe: 3500, rate: 0.0495, tsx: 0.1760 },
    { year: 2011, mga: 48300, ybe: 3500, rate: 0.0495, tsx: -0.0870 },
    { year: 2012, mga: 50100, ybe: 3500, rate: 0.05025, tsx: 0.0720 },
    { year: 2013, mga: 51100, ybe: 3500, rate: 0.0515, tsx: 0.1300 },
    { year: 2014, mga: 52500, ybe: 3500, rate: 0.05275, tsx: 0.1060 },
    { year: 2015, mga: 53600, ybe: 3500, rate: 0.05325, tsx: -0.0830 },
    { year: 2016, mga: 54900, ybe: 3500, rate: 0.054, tsx: 0.2110 },
    { year: 2017, mga: 55300, ybe: 3500, rate: 0.054, tsx: 0.0910 },
    { year: 2018, mga: 55900, ybe: 3500, rate: 0.054, tsx: -0.0890 },
    { year: 2019, mga: 57400, ybe: 3500, rate: 0.0555, tsx: 0.2290 },
    { year: 2020, mga: 58700, ybe: 3500, rate: 0.057, tsx: 0.0560 },
    { year: 2021, mga: 61600, ybe: 3500, rate: 0.059, tsx: 0.2510 },
    { year: 2022, mga: 64900, ybe: 3500, rate: 0.0615, tsx: -0.0580 },
    { year: 2023, mga: 66600, ybe: 3500, rate: 0.064, tsx: 0.1180 },
    { year: 2024, mga: 68500, ybe: 3500, rate: 0.064, tsx: 0.2240 },
    { year: 2025, mga: 71200, ybe: 3500, rate: 0.064, tsx: 0.0850 }
];

function runHistoricalBacktest() {
    let portEmp = 0;
    let portTotal = 0;

    historicalDataTSX.forEach(data => {
        // La cotisation annuelle : (MGA - Exemption) * Taux
        let contribEmp = (data.mga - data.ybe) * data.rate;
        // La part employeur est égale à la part employé
        let contribTotal = contribEmp * 2; 

        // Ajout au portefeuille
        portEmp += contribEmp;
        portTotal += contribTotal;

        // Croissance TSX
        portEmp = portEmp * (1 + data.tsx);
        portTotal = portTotal * (1 + data.tsx);
    });

    // Mise à jour DOM
    const empCapEl = document.getElementById('res-rrq-part-emp');
    const empIncEl = document.getElementById('res-rrq-inc-emp');
    const totCapEl = document.getElementById('res-rrq-part-total');
    const totIncEl = document.getElementById('res-rrq-inc-total');

    if (empCapEl) empCapEl.innerText = formatCurrency(portEmp);
    if (empIncEl) empIncEl.innerText = formatCurrency(portEmp * 0.04);
    if (totCapEl) totCapEl.innerText = formatCurrency(portTotal);
    if (totIncEl) totIncEl.innerText = formatCurrency(portTotal * 0.04);
}

// ==========================================================
// MODULE : SIMULATEUR DE SURVIE (GRAPHIQUE)
// ==========================================================
let decumulationChartInstance = null;

function calculateDecumulation() {
    const capitalInput = document.getElementById('dec-capital');
    if (!capitalInput) return;

    const initialCapital = parseFloat(capitalInput.value) || 0;
    const swr = parseFloat(document.getElementById('dec-swr').value) / 100 || 0;
    // On utilise directement un rendement net réel (après inflation) pour simplifier le visuel
    const realReturn = parseFloat(document.getElementById('dec-return').value) / 100 || 0; 

    const annualIncome = initialCapital * swr;

    let labels = [];
    let dataPoints = [];
    let currentCapital = initialCapital;

    // Décaissement de 60 à 100 ans
    for (let age = 60; age <= 100; age++) {
        labels.push(age);
        dataPoints.push(currentCapital);

        // Retrait en début d'année, puis croissance du solde restant
        currentCapital -= annualIncome;
        
        if (currentCapital <= 0) {
            currentCapital = 0;
        } else {
            currentCapital = currentCapital * (1 + realReturn);
        }
    }

    renderChart(labels, dataPoints);
}

function renderChart(labels, data) {
    const ctx = document.getElementById('decumulationChart').getContext('2d');
    
    if (decumulationChartInstance) {
        decumulationChartInstance.destroy();
    }

    // Couleur : rouge si la simulation finit à 0, teal sinon
    const goesToZero = data[data.length - 1] === 0;
    const lineColor = goesToZero ? '#EF4444' : '#2DD4BF';
    
    // Dégradé sous la courbe
    const gradient = ctx.createLinearGradient(0, 0, 0, 350);
    gradient.addColorStop(0, goesToZero ? 'rgba(239, 68, 68, 0.4)' : 'rgba(45, 212, 191, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    decumulationChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Capital Restant ($)',
                data: data,
                borderColor: lineColor,
                backgroundColor: gradient,
                borderWidth: 3,
                fill: true,
                pointRadius: 0,
                pointHoverRadius: 6,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        color: '#9CA3AF',
                        // Affichage à coup de 5 ans sur l'axe des X
                        callback: function(value, index) {
                            const age = labels[index];
                            return age % 5 === 0 ? age : null;
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: {
                        color: '#9CA3AF',
                        callback: function(value) {
                            return '$' + (value / 1000) + 'k';
                        }
                    }
                }
            }
        }
    });
}

// ==========================================================
// INITIALISATION
// ==========================================================
document.addEventListener('DOMContentLoaded', () => {
    runHistoricalBacktest();
    calculateDecumulation();
});
