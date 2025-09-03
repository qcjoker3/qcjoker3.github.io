// --- Simule le chargement des données depuis dataFonds.js ---
async function loadData() {
    // Ici tu peux remplacer par fetch('dataFonds.json') si tu as un vrai fichier JSON
    return dataFonds; // dataFonds est ton JSON défini dans dataFonds.js
}

// --- Trie les mois pour s'assurer de l'ordre chronologique ---
function sortedMonths(rendements) {
    return Object.keys(rendements).sort();
}

// --- Rendements passifs selon la composition du fond actif ---
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

// --- Rendement annuel à partir des rendements mensuels ---
function calcRendementAnnuel(rendements) {
    const annuels = {};
    for (const mois in rendements) {
        const an = mois.split('-')[0];
        if (!annuels[an]) annuels[an] = 1;
        annuels[an] *= (1 + rendements[mois]);
    }
    for (const an in annuels) {
        annuels[an] = annuels[an] - 1;
    }
    return annuels;
}

// --- Croissance du capital à partir des rendements mensuels ---
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

// --- Création d'un graphique de rendements annuels ---
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

// --- Création d'un graphique de croissance du capital ---
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

    // --- Création des pastilles de catégories ---
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

    // --- Affichage des fonds pour une catégorie ---
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

        // Sélection automatique du premier fond
        if (fondsKeys.length > 0) {
            fondsContainer.querySelector('button').click();
        }
    }

    // --- Mise à jour des graphiques ---
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

    // --- Sélection initiale ---
    if (categories.length > 0) {
        categoriesContainer.querySelector('button').click();
    }
}

// --- Exemple de rendements mensuels pour tester ---
const dataFonds = {
    "categories": {
        "Canadian Equity Balanced": ["FONDS_CAN_EQ_BAL1.A", "FONDS_CAN_EQ_BAL2.A"]
    },
    "fonds_actifs": {
        "FONDS_CAN_EQ_BAL1.A": {
            "nom": "Fonds Canadian Equity Balanced 1",
            "composition_passif": {"XWD.TO":0.7,"XBB.TO":0.3},
            "rendements_mensuels": {
                "2025-01":0.01, "2025-02":0.015, "2025-03":0.02, "2025-04":-0.005, "2025-05":0.01
            }
        },
        "FONDS_CAN_EQ_BAL2.A": {
            "nom": "Fonds Canadian Equity Balanced 2",
            "composition_passif": {"XWD.TO":0.65,"XBB.TO":0.35},
            "rendements_mensuels": {
                "2025-01":0.012, "2025-02":0.01, "2025-03":0.018, "2025-04":0, "2025-05":0.008
            }
        }
    },
    "fonds_passifs": {
        "XWD.TO": { "nom": "iShares MSCI World ETF", "rendements_mensuels": {"2025-01":0.01,"2025-02":0.015,"2025-03":0.018,"2025-04":-0.002,"2025-05":0.01} },
        "XBB.TO": { "nom": "iShares Canadian Bond Index ETF", "rendements_mensuels": {"2025-01":0.005,"2025-02":0.004,"2025-03":0.003,"2025-04":0.002,"2025-05":0.004} }
    }
};

main();
