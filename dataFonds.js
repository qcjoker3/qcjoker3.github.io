// dataFonds.js
// Remplace cet objet par l'import ou fetch réel dans ta prod
// Ici un fetch sur fonds.json
export async function loadDataFonds() {
  const response = await fetch('fonds.json');
  if (!response.ok) throw new Error('Erreur chargement fonds.json');
  return response.json();
}

// Fonction utilitaire : trier les mois (ex: "2020-01")
function sortedMonths(rendements) {
  return Object.keys(rendements).sort();
}

// Calcul des rendements cumulés (1 + r1)*(1 + r2)*... - 1
function cumulerRendements(rendements) {
  let cumule = 1.0;
  const cumulParMois = {};
  for (const mois of sortedMonths(rendements)) {
    cumule *= (1 + rendements[mois]);
    cumulParMois[mois] = cumule - 1;
  }
  return cumulParMois;
}

// Rebalancement périodique portefeuille
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

// Calcul de la croissance avec montant initial
function croissanceInvestissement(values, montantInitial = 10000) {
  const res = {};
  for (const [k, v] of Object.entries(values)) {
    res[k] = v * montantInitial;
  }
  return res;
}

// Rendements annuels à partir des rendements cumulés
function rendementsAnnuels(cumul) {
  const annees = new Set();
  for (const mois of Object.keys(cumul)) {
    annees.add(mois.split('-')[0]);
  }
  const result = {};
  const sortedAnnees = Array.from(annees).sort();

  for (let i = 0; i < sortedAnnees.length; i++) {
    const annee = sortedAnnees[i];
    const decembre = `${annee}-12`;
    const prevDecembre = `${sortedAnnees[i-1] ? sortedAnnees[i-1] : annee}-12`;

    if (cumul[decembre] !== undefined) {
      const prevVal = cumul[prevDecembre] !== undefined ? cumul[prevDecembre] : 0;
      result[annee] = cumul[decembre] - prevVal;
    }
  }
  return result;
}

// Extraction des années depuis les mois (ex: "2020-01")
function extraireAnnees(moisList) {
  const annees = new Set();
  for (const mois of moisList) {
    annees.add(mois.split('-')[0]);
  }
  return Array.from(annees).sort();
}

// Fonction principale d'affichage
export async function init() {
  const data = await loadDataFonds();

  // Remplir selects
  remplirSelects(data);

  document.getElementById('btnAfficher').addEventListener('click', () => {
    afficherGraphiques(data);
  });
}

function remplirSelects(data) {
  const actifSelect = document.getElementById('fondActifSelect');
  actifSelect.innerHTML = '';
  for (const ticker in data.fonds_actifs) {
    const opt = document.createElement('option');
    opt.value = ticker;
    opt.textContent = `${data.fonds_actifs[ticker].nom} (${ticker})`;
    actifSelect.appendChild(opt);
  }

  const passif1 = document.getElementById('fondPassif1');
  const passif2 = document.getElementById('fondPassif2');
  passif1.innerHTML = '';
  passif2.innerHTML = '';
  for (const ticker in data.fonds_passifs) {
    [passif1, passif2].forEach(select => {
      const opt = document.createElement('option');
      opt.value = ticker;
      opt.textContent = `${data.fonds_passifs[ticker].nom} (${ticker})`;
      select.appendChild(opt);
    });
  }
}

let chartBar, chartLine;

function afficherGraphiques(data) {
  const fondActifKey = document.getElementById('fondActifSelect').value;

  const tickerPassif1 = document.getElementById('fondPassif1').value;
  const tickerPassif2 = document.getElementById('fondPassif2').value;
  const pond1 = parseFloat(document.getElementById('pondPassif1').value) / 100;
  const pond2 = parseFloat(document.getElementById('pondPassif2').value) / 100;

  if (Math.abs(pond1 + pond2 - 1) > 0.001) {
    alert("Les pondérations doivent totaliser 100%");
    return;
  }

  const rendActif = data.fonds_actifs[fondActifKey].rendements_mensuels;
  const cumulActif = cumulerRendements(rendActif);

  const dataPassif = {};
  dataPassif[tickerPassif1] = data.fonds_passifs[tickerPassif1].rendements_mensuels;
  dataPassif[tickerPassif2] = data.fonds_passifs[tickerPassif2].rendements_mensuels;
  const valPassif = portefeuilleRebalance(dataPassif, { [tickerPassif1]: pond1, [tickerPassif2]: pond2 }, 'annuel');

  const croissActif = croissanceInvestissement(cumulActif, 10000);
  const croissPassif = croissanceInvestissement(valPassif, 10000);

  const rendActifAnnuels = rendementsAnnuels(cumulActif);
  const rendPassifAnnuels = rendementsAnnuels(valPassif);

  const annees = extraireAnnees(Object.keys(cumulActif));

  const dataRendActif = annees.map(y => rendActifAnnuels[y] ?? 0);
  const dataRendPassif = annees.map(y => rendPassifAnnuels[y] ?? 0);
  const dataCroissActif = annees.map(y => croissActif[`${y}-12`] ?? 0);
  const dataCroissPassif = annees.map(y => croissPassif[`${y}-12`] ?? 0);

  // Destruction charts existants pour éviter superposition
  if (chartBar) chartBar.destroy();
  if (chartLine) chartLine.destroy();

  // Barres rendements annuels
  const ctxBar = document.getElementById('rendementsAnnuel').getContext('2d');
  chartBar = new Chart(ctxBar, {
    type: 'bar',
    data: {
      labels: annees,
      datasets: [
        {
          label: 'Rendement Actif',
          data: dataRendActif,
          backgroundColor: 'rgba(26, 115, 232, 0.7)'
        },
        {
          label: 'Rendement Passif',
          data: dataRendPassif,
          backgroundColor: 'rgba(100, 100, 100, 0.7)'
        }
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

  // Courbes croissance
  const ctxLine = document.getElementById('croissanceInvestissement').getContext('2d');
  chartLine = new Chart(ctxLine, {
    type: 'line',
    data: {
      labels: annees,
      datasets: [
        {
          label: 'Croissance Actif ($)',
          data: dataCroissActif,
          borderColor: 'rgba(26, 115, 232, 1)',
          fill: false,
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: 'Croissance Passif ($)',
          data: dataCroissPassif,
          borderColor: 'rgba(100, 100, 100, 1)',
          fill: false,
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            callback: v => '$' + v.toLocaleString()
          }
        }
      },
      plugins: {
        legend: { labels: { font: { family: "'Assistant', sans-serif", size: 14 } } }
      }
    }
  });
}

// Initialise automatiquement la page
init();
