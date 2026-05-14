// ==========================================================
// UTILITAIRE
// ==========================================================
const formatCurrency = (val) => {
    return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val);
};

// ==========================================================
// MODULE 1 : CALCULATEUR FIRE
// ==========================================================
function calculateFIRE() {
    const expInput = document.getElementById('fire-expense');
    if(!expInput) return; // Sécurité si l'élément n'est pas sur la page
    
    const monthlyExp = parseFloat(expInput.value) || 0;
    const fireTarget = (monthlyExp * 12) / 0.04;
    document.getElementById('res-fire-target').innerText = formatCurrency(fireTarget);
}

// ==========================================================
// MODULE 2 : BACKTEST RRQ VS S&P/TSX (1986-2025)
// ==========================================================
// Base de données historique (1986-2025)
// mga = Maximum des gains admissibles (RRQ)
// ybe = Exemption de base (RRQ)
// rate = Taux de cotisation de l'employé (RRQ)
// tsx = Rendement TOTAL annuel du S&P/TSX Composite (incluant les dividendes réinvestis)
const historicalData1986_2025 = [
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
    { year: 2025, mga: 71200, ybe: 3500, rate: 0.064, tsx: 0.0850 } // Rendement estimé projeté pour l'année complète
];

function runHistoricalBacktest() {
    let portfolioValue = 0;
    let totalContributed = 0;

    // Simulation de l'investissement année par année
    historicalData1986_2025.forEach(data => {
        // La cotisation annuelle de l'employé
        let contribution = (data.mga - data.ybe) * data.rate;
        
        // Ajout de la nouvelle cotisation au portefeuille
        portfolioValue += contribution;
        totalContributed += contribution;

        // La croissance boursière du TSX pour cette année-là s'applique sur le tout
        portfolioValue = portfolioValue * (1 + data.tsx);
    });

    const income4Percent = portfolioValue * 0.04;
    const maxRRQ2026 = 18091; // Valeur approximative de la rente max à 65 ans en 2026

    // Mise à jour de l'interface
    const capEl = document.getElementById('res-hist-cap');
    const incEl = document.getElementById('res-hist-income');
    const verdictEl = document.getElementById('res-hist-verdict');

    if (capEl) capEl.innerText = formatCurrency(portfolioValue);
    if (incEl) incEl.innerText = formatCurrency(income4Percent);

    if (verdictEl) {
        verdictEl.innerHTML = `
            Sur 40 ans, vos cotisations RRQ n'ont représenté que <strong>${formatCurrency(totalContributed)}</strong> de votre poche. 
            Investi dans le S&P/TSX (le marché canadien), ce capital a traversé les krachs de 2000, 2008 et 2020 pour atteindre <strong style="color:#2DD4BF;">${formatCurrency(portfolioValue)}</strong>.<br><br>
            Aujourd'hui, vous pourriez vous verser <strong>${formatCurrency(income4Percent)}/an</strong> pour le reste de vos jours (un montant qui rivalise avec la RRQ), 
            <strong>MAIS</strong> avec l'avantage massif de conserver l'entièreté de votre capital pour le léguer à votre famille, au lieu de voir l'État l'absorber à votre décès.
        `;
    }
}

// ==========================================================
// INITIALISATION
// ==========================================================
document.addEventListener('DOMContentLoaded', () => {
    calculateFIRE();
    runHistoricalBacktest();
});
