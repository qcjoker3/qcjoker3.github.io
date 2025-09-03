// --- Fonctions utilitaires ---
async function loadData() {
    return dataFonds; // JSON complet ci-dessous
}

function sortedMonths(rendements) {
    return Object.keys(rendements).sort();
}

function calcRendementPassif(fondsPassifs, composition, mois) {
    const result = {};
    mois.forEach(m => {
        let valeur = 0;
        for (const key in composition) {
            valeur += (fondsPassifs[key].rendements_mensuels[m] || 0) * composition[key];
        }
        result[m] = valeur;
    });
    return result;
}

function calcRendementAnnuel(rendements) {
    const annuels = {};
    for (const mois in rendements) {
        const an = mois.split('-')[0];
        if (!annuels[an]) annuels[an] = 1;
        annuels[an] *= (1 + rendements[mois]);
    }
    for (const an in annuels) {
        annuels[an] -= 1;
    }
    return annuels;
}

function calcCroissanceMensuelle(rendements, capitalInitial = 10000) {
    const croiss = {};
    let capital = capitalInitial;
    const moisTries = sortedMonths(rendements);
    moisTries.forEach(m => {
        capital *= (1 + (rendements[m] || 0));
        croiss[m] = capital;
    });
    return croiss;
}

function creerGraphRendementAnnuel(ctx, labels, dataActif, dataPassif) {
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                { label: 'Actif', data: dataActif, backgroundColor: 'rgba(54, 162, 235, 0.7)' },
                { label: 'Passif', data: dataPassif, backgroundColor: 'rgba(255, 99, 132, 0.7)' }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'top' } },
            scales: { y: { beginAtZero: true, ticks: { callback: v => (v*100).toFixed(1) + '%' } } }
        }
    });
}

function creerGraphCroissance(ctx, labels, dataActif, dataPassif) {
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                { label: 'Actif', data: dataActif, borderColor: 'rgba(54, 162, 235, 1)', fill: false },
                { label: 'Passif', data: dataPassif, borderColor: 'rgba(255, 99, 132, 1)', fill: false }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'top' } },
            scales: { y: { beginAtZero: false } }
        }
    });
}

// --- Fonction principale ---
async function main() {
    const data = await loadData();
    const categoriesContainer = document.getElementById('categories');
    const fondsContainer = document.getElementById('fondsContainer');
    let chartRendAnnuel, chartCroiss;
    let selectedFondKey = null;

    const categories = Object.keys(data.categories);
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.textContent = cat;
        btn.className = 'pastille categorie';
        btn.addEventListener('click', () => {
            updateFonds(cat);
            document.querySelectorAll('.categorie').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
        categoriesContainer.appendChild(btn);
    });

    function updateFonds(categorie) {
        fondsContainer.innerHTML = '';
        const fondsKeys = data.categories[categorie];
        fondsKeys.forEach(key => {
            const btn = document.createElement('button');
            btn.textContent = data.fonds_actifs[key].nom;
            btn.className = 'pastille fond';
            btn.addEventListener('click', () => {
                selectedFondKey = key;
                document.querySelectorAll('.fond').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                updateGraphs();
            });
            fondsContainer.appendChild(btn);
        });
        if (fondsKeys.length > 0) {
            fondsContainer.querySelector('button').click();
        }
    }

    function updateGraphs() {
        if (!selectedFondKey) return;
        const fondActif = data.fonds_actifs[selectedFondKey];
        const compositionPassif = fondActif.composition_passif;
        const fondsPassifs = data.fonds_passifs;
        const rendementsActif = fondActif.rendements_mensuels;
        const moisCommuns = sortedMonths(rendementsActif);
        const rendementsPassif = calcRendementPassif(fondsPassifs, compositionPassif, moisCommuns);
        const rendActifAnnuel = calcRendementAnnuel(rendementsActif);
        const rendPassifAnnuel = calcRendementAnnuel(rendementsPassif);
        const annees = Object.keys(rendActifAnnuel).sort();
        const dataActifAnnuel = annees.map(a => rendActifAnnuel[a]);
        const dataPassifAnnuel = annees.map(a => rendPassifAnnuel[a]);
        const croissanceActif = calcCroissanceMensuelle(rendementsActif);
        const croissancePassif = calcCroissanceMensuelle(rendementsPassif);
        const moisCroissance = Object.keys(croissanceActif).sort();
        const dataCroissActif = moisCroissance.map(m => croissanceActif[m]);
        const dataCroissPassif = moisCroissance.map(m => croissancePassif[m]);
        if (chartRendAnnuel) chartRendAnnuel.destroy();
        if (chartCroiss) chartCroiss.destroy();
        chartRendAnnuel = creerGraphRendementAnnuel(
            document.getElementById('rendementAnnuelChart').getContext('2d'),
            annees,
            dataActifAnnuel,
            dataPassifAnnuel
        );
        chartCroiss = creerGraphCroissance(
            document.getElementById('croissanceChart').getContext('2d'),
            moisCroissance,
            dataCroissActif,
            dataCroissPassif
        );
    }

    if (categories.length > 0) {
        categoriesContainer.querySelector('button').click();
    }
}

// --- JSON complet avec rendements simulés ---
const dataFonds = {
    "categories": {
        "Canadian Equity Balanced": ["FONDS_CAN_EQ_BAL1.A","FONDS_CAN_EQ_BAL2.A","FONDS_CAN_EQ_BAL3.A","FONDS_CAN_EQ_BAL4.A","FONDS_CAN_EQ_BAL5.A"],
        "Canadian Neutral Balanced": ["FONDS_CAN_NEUTRAL_BAL1.A","FONDS_CAN_NEUTRAL_BAL2.A","FONDS_CAN_NEUTRAL_BAL3.A","FONDS_CAN_NEUTRAL_BAL4.A","FONDS_CAN_NEUTRAL_BAL5.A"],
        "Canadian Fixed Income Balanced": ["FONDS_CAN_FIX_INC_BAL1.A","FONDS_CAN_FIX_INC_BAL2.A","FONDS_CAN_FIX_INC_BAL3.A","FONDS_CAN_FIX_INC_BAL4.A","FONDS_CAN_FIX_INC_BAL5.A"],
        "Global Equity Balanced": ["FONDS_GLOBAL_EQ_BAL1.A","FONDS_GLOBAL_EQ_BAL2.A","FONDS_GLOBAL_EQ_BAL3.A","FONDS_GLOBAL_EQ_BAL4.A","FONDS_GLOBAL_EQ_BAL5.A"],
        "Global Neutral Balanced": ["FONDS_GLOBAL_NEUTRAL_BAL1.A","FONDS_GLOBAL_NEUTRAL_BAL2.A","FONDS_GLOBAL_NEUTRAL_BAL3.A","FONDS_GLOBAL_NEUTRAL_BAL4.A","FONDS_GLOBAL_NEUTRAL_BAL5.A"],
        "Global Fixed Income Balanced": ["FONDS_GLOBAL_FIX_INC_BAL1.A","FONDS_GLOBAL_FIX_INC_BAL2.A","FONDS_GLOBAL_FIX_INC_BAL3.A","FONDS_GLOBAL_FIX_INC_BAL4.A","FONDS_GLOBAL_FIX_INC_BAL5.A"]
    },
    "fonds_actifs": {},
    "fonds_passifs": {
        "XWD.TO": { "nom": "iShares MSCI World ETF", "rendements_mensuels": {} },
        "XBB.TO": { "nom": "iShares Canadian Bond Index ETF", "rendements_mensuels": {} }
    }
};

// --- Remplissage automatique de rendements simulés ---
function randomRendements(startYear=2025, months=12) {
    const rend = {};
    for(let y=startYear; y<startYear+2; y++) {
        for(let m=1; m<=months; m++) {
            const month = m<10 ? '0'+m : m;
            rend[`${y}-${month}`] = (Math.random()*0.04-0.02); // -2% à +2%
        }
    }
    return rend;
}

// --- Création des fonds actifs avec rendements aléatoires ---
const fondsActifsKeys = Object.values(dataFonds.categories).flat();
fondsActifsKeys.forEach((key,i) => {
    const compositionXWD = 0.5 + (i%5)*0.05;
    const compositionXBB = 1 - compositionXWD;
    dataFonds.fonds_actifs[key] = {
        nom: key.replace(/\./,''),
        composition_passif: { "XWD.TO": compositionXWD, "XBB.TO": compositionXBB },
        rendements_mensuels: randomRendements()
    };
});
dataFonds.fonds_passifs["XWD.TO"].rendements_mensuels = randomRendements();
dataFonds.fonds_passifs["XBB.TO"].rendements_mensuels = randomRendements();

// --- Lancement ---
main();
