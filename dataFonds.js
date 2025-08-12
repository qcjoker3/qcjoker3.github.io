// Fonctions utilitaires
function sortedMonths(rendements) {
  return Object.keys(rendements).sort();
}

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

function portefeuilleRebalance(dataFonds, pond, freq = 'annuel') {
  const tickers = Object.keys(dataFonds);
  let allMonths = tickers
    .map(t => Object.keys(dataFonds[t]))
    .reduce((a, b) => a.filter(c => b.includes(c)));
  allMonths.sort();

  function isRebalanceMonth(m) {
    const monthNum = parseInt(m.split('-')[1], 10);
    if (freq === 'mensuel') return true;
    if (freq === 'trimestriel') return [3, 6, 9, 12].includes(monthNum);
    if (freq === 'annuel') return monthNum === 12;
    return false;
  }

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

    if (isRebalanceMonth(mois)) {
      weights = {...pond};
    }
  }
  return values;
}

function croissanceInvestissement(values, montantInitial = 10000) {
  const res = {};
  for (const [k, v] of Object.entries(values)) {
    res[k] = v * montantInitial;
  }
  return res;
}

function rendementsAnnuels(rendementsCumul) {
  const annees = {};
  let anneePrec = null;
  let valPrec = 0;
  for (const mois of sortedMonths(rendementsCumul)) {
    const [annee, moisNum] = mois.split('-');
    if (annee !== anneePrec && anneePrec !== null) {
      annees[anneePrec] = rendementsCumul[`${anneePrec}-12`] - valPrec;
    }
    if (moisNum === '12') {
      valPrec = rendementsCumul[mois];
      anneePrec = annee;
    }
  }
  // Dernière année si pas calculée
  if (anneePrec !== null && !(anneePrec in annees)) {
    const anneeAvant = (parseInt(anneePrec) - 1).toString();
    annees[anneePrec] = rendementsCumul[`${anneePrec}-12`] - (rendementsCumul[`${anneeAvant}-12`] || 0);
  }
  return annees;
}

function extraireAnnees(moisList) {
  const annees = new Set();
  for (const mois of moisList) {
    annees.add(mois.split('-')[0]);
  }
  return Array.from(annees).sort();
}

function afficherGraphiques(annees, dataRendActif, dataRendPassif, dataCroissActif, dataCroissPassif) {
  const ctxBar = document.getElementById('rendementsAnnuel').getContext('2d');
  new Chart(ctxBar, {
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
        legend: {
          labels: { font: { family: "'Assistant', sans-serif", size: 14 } }
        }
      }
    }
  });

  const ctxLine = document.getElementById('croissanceInvestissement').getContext('2d');
  new Chart(ctxLine, {
    type: 'line',
    data: {
      labels: annees,
      datasets: [
        { label: 'Croissance Actif ($)', data: dataCroissActif, borderColor: 'rgba(26, 115, 232, 1)', fill: false },
        { label: 'Croissance Passif ($)', data: dataCroissPassif, borderColor: 'rgba(100, 100, 100, 1)', fill: false }
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
        legend: {
          labels: { font: { family: "'Assistant', sans-serif", size: 14 } }
        }
      }
    }
  });
}

// --- Chargement et traitement des données ---
fetch('fonds.json')
  .then(response => {
    if (!response.ok) throw new Error("Erreur lors du chargement du fichier JSON");
    return response.json();
  })
  .then(data => {
    const fondActifKey = "0P00016G44.TO"; // Exemple : fonds actif sélectionné
    const rendActif = data.fonds_actifs[fondActifKey].rendements_mensuels;
    const cumulActif = cumulerRendements(rendActif);

    const pondPassif = { "XWD.TO": 0.6, "XBB.TO": 0.4 };
    const dataPassif = {};
    for (const ticker of Object.keys(pondPassif)) {
      dataPassif[ticker] = data.fonds_passifs[ticker].rendements_mensuels;
    }
    const valPassif = portefeuilleRebalance(dataPassif, pondPassif, 'annuel');

    const croissActif = croissanceInvestissement(cumulActif, 10000);
    const croissPassif = croissanceInvestissement(valPassif, 10000);

    const rendActifAnnuels = rendementsAnnuels(cumulerRendements(rendActif));
    const rendPassifAnnuels = rendementsAnnuels(valPassif);

    const annees = extraireAnnees(Object.keys(cumulerRendements(rendActif)));

    const dataRendActif = annees.map(y => rendActifAnnuels[y] ?? 0);
    const dataRendPassif = annees.map(y => rendPassifAnnuels[y] ?? 0);
    const dataCroissActif = annees.map(y => croissActif[`${y}-12`] ?? 0);
    const dataCroissPassif = annees.map(y => croissPassif[`${y}-12`] ?? 0);

    afficherGraphiques(annees, dataRendActif, dataRendPassif, dataCroissActif, dataCroissPassif);
  })
  .catch(err => {
    console.error("Erreur:", err);
  });
