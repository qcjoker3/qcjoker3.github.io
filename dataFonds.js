// Variables globales chart
let chartBar = null;
let chartLine = null;

// Trier les mois (format YYYY-MM)
function sortedMonths(rendements) {
  return Object.keys(rendements).sort();
}

// Calcul rendements cumulés : (1+r1)*(1+r2)*... - 1
function cumulerRendements(rendements) {
  let cumule = 1.0;
  const cumulParMois = {};
  const moisTries = sortedMonths(rendements);
  for (const mois of moisTries) {
    cumule *= (1 + rendements[mois]);
    cumulParMois[mois] = cumule - 1;
  }
  return cumulParMois;
}

// Calcule croissance en $ selon valeur initiale
function croissanceInvestissement(values, montantInitial = 10000) {
  const res = {};
  for (const [k, v] of Object.entries(values)) {
    res[k] = v * montantInitial;
  }
  return res;
}

// Vérifie si mois correspond au rebalancement
function isRebalanceMonth(mois, freq) {
  const monthNum = parseInt(mois.split('-')[1], 10);
  if (freq === 'mensuel') return true;
  if (freq === 'trimestriel') return [3, 6, 9, 12].includes(monthNum);
  if (freq === 'annuel') return monthNum === 12;
  return false;
}

// Rebalancement périodique d'un portefeuille
function portefeuilleRebalance(dataFonds, pond, freq = 'annuel') {
  const tickers = Object.keys(dataFonds);
  // Intersection des mois communs
  let allMonths = tickers
    .map(t => Object.keys(dataFonds[t]))
    .reduce((a, b) => a.filter(c => b.includes(c)));
  allMonths.sort();

  let value = 1.0;
  let weights = {...pond};
  const values = {};

  for (const mois of allMonths) {
    let rPort = 0;
    for (const t of tickers) {
      const r = dataFonds[t][mois] || 0;
      rPort += weights[t] * r;
    }
    value *= (1 + rPort);
    values[mois] = value;

    if (isRebalanceMonth(mois, freq)) {
      weights = {...pond}; // reset poids
    }
  }

  return values;
}

// Extraire années à partir des mois
function extraireAnnees(moisList) {
  const annees = new Set();
  for (const mois of moisList) {
    annees.add(mois.split('-')[0]);
  }
  return Array.from(annees).sort();
}

// Calcul rendements annuels depuis rendements cumulés
function rendementsAnnuels(cumulParMois) {
  const annees = extraireAnnees(Object.keys(cumulParMois));
  const rendAnnuels = {};

  for (const annee of annees) {
    const valFinAnnee = cumulParMois[annee + '-12'] ?? null;
    const valDebutAnnee = cumulParMois[(annee - 1) + '-12'] ?? 0;
    if (valFinAnnee !== null) {
      rendAnnuels[annee] = (valFinAnnee - valDebutAnnee) / (1 - valDebutAnnee);
    }
  }
  return rendAnnuels;
}

// Fonction principale d'affichage
function afficherGraphiques(data) {
  const fondActifKey = document.getElementById('fondActifSelect').value;
  const fondActif = data.fonds_actifs[fondActifKey];

  if (!fondActif) {
    alert("Fonds actif non trouvé");
    return;
  }

  const rendActif = fondActif.rendements_mensuels;
  const cumulActif = cumulerRendements(rendActif);

  // Récupération composition passif
  const pondPassif = fondActif.composition_passif;
  if (!pondPassif) {
    alert("Composition passif non définie pour ce fonds actif.");
    return;
  }

  const dataPassif = {};
  for (const ticker of Object.keys(pondPassif)) {
    if (!(ticker in data.fonds_passifs)) {
      alert(`Fonds passif ${ticker} non trouvé dans données.`);
      return;
    }
    dataPassif[ticker] = data.fonds_passifs[ticker].rendements_mensuels;
  }

  const valPassif = portefeuilleRebalance(dataPassif, pondPassif, 'annuel');

  const croissActif = croissanceInvestissement(cumulActif);
  const croissPassif = croissanceInvestissement(valPassif);

  const rendActifAnnuels = rendementsAnnuels(cumulActif);
  const rendPassifAnnuels = rendementsAnnuels(valPassif);

  const annees = extraireAnnees(Object.keys(cumulActif));

  const dataRendActif = annees.map(y => rendActifAnnuels[y] ?? 0);
  const dataRendPassif = annees.map(y => rendPassifAnnuels[y] ?? 0);
  const dataCroissActif = annees.map(y => croissActif[`${y}-12`] ?? 0);
  const dataCroissPassif = annees.map(y => croissPassif[`${y}-12`] ?? 0);

  // Destruction anciens graphiques si existants
  if (chartBar) chartBar.destroy();
  if (chartLine) chartLine.destroy();

  // Graphique rendements annuels (barres)
  const ctxBar = document.getElementById('rendementsAnnuel').getContext('2d');
  chartBar = new Chart(ctxBar, {
    type: 'bar',
    data: {
      labels: annees,
      datasets: [
        { label: 'Rendement Actif', data: dataRendActif, backgroundColor: 'rgba(26, 115, 232, 0.7)' },
        { label: 'Rendement Passif', data: dataRendPassif, backgroundColor: 'rgba(100, 100, 100, 0.7)' }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: v => (v * 100).toFixed(1) + '%' }
        }
      },
      plugins: {
        legend: { labels: { font: { family: "'Assistant', sans-serif", size: 14 } } }
      }
    }
  });

  // Graphique croissance investissement (ligne)
  const ctxLine = document.getElementById('croissanceInvestissement').getContext('2d');
  chartLine = new Chart(ctxLine, {
    type: 'line',
    data: {
      labels: annees,
      datasets: [
        { label: 'Croissance Actif ($)', data: dataCroissActif, borderColor: 'rgba(26, 115, 232, 1)', fill: false, tension: 0.3, pointRadius: 4, pointHoverRadius: 6 },
        { label: 'Croissance Passif ($)', data: dataCroissPassif, borderColor: 'rgba(100, 100, 100, 1)', fill: false, tension: 0.3, pointRadius: 4, pointHoverRadius: 6 }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: false,
          ticks: { callback: v => '$' + v.toLocaleString() }
        }
      },
      plugins: {
        legend: { labels: { font: { family: "'Assistant', sans-serif", size: 14 } } }
      }
    }
  });
}

// Chargement JSON et initialisation
async function loadDataFonds() {
  const response = await fetch('fonds.json');
  if (!response.ok) throw new Error("Erreur chargement fonds.json");
  return await response.json();
}

export async function init() {
  const data = await loadDataFonds();

  // Remplir select fonds actifs
  const actifSelect = document.getElementById('fondActifSelect');
  actifSelect.innerHTML = '';
  for (const ticker in data.fonds_actifs) {
    const opt = document.createElement('option');
    opt.value = ticker;
    opt.textContent = `${data.fonds_actifs[ticker].nom} (${ticker})`;
    actifSelect.appendChild(opt);
  }
  if (actifSelect.options.length > 0) actifSelect.selectedIndex = 0;

  document.getElementById('btnAfficher').addEventListener('click', () => {
    afficherGraphiques(data);
  });

  // Affiche au chargement
  afficherGraphiques(data);
}
