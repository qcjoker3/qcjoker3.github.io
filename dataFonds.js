async function loadData() {
  const resp = await fetch('fonds.json');
  if (!resp.ok) throw new Error("Erreur chargement fonds.json");
  return await resp.json();
}

function sortedMonths(rendements) {
  return Object.keys(rendements).sort();
}

function calcCroissanceMensuelle(rendements, capitalInitial = 10000) {
  const moisTries = sortedMonths(rendements);
  let valeurCourante = capitalInitial;
  const valeurs = {};
  for (const mois of moisTries) {
    valeurCourante *= (1 + rendements[mois]);
    valeurs[mois] = valeurCourante;
  }
  return valeurs;
}

function calcRendementAnnuel(rendements) {
  const annees = {};
  for (const mois in rendements) {
    const annee = mois.split('-')[0];
    annees[annee] = (annees[annee] || 1) * (1 + rendements[mois]);
  }
  for (const annee in annees) {
    annees[annee] -= 1;
  }
  return annees;
}

function calcRendementPassif(dataPassifs, compositionPassif, moisList) {
  const rendements = {};
  for (const mois of moisList) {
    let r = 0;
    for (const ticker in compositionPassif) {
      const pond = compositionPassif[ticker];
      const rTicker = (dataPassifs[ticker]?.rendements_mensuels[mois]) ?? 0;
      r += pond * rTicker;
    }
    rendements[mois] = r;
  }
  return rendements;
}

function creerGraphRendementAnnuel(ctx, labels, dataActif, dataPassif) {
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: "Rendement Annuel Actif", data: dataActif, backgroundColor: 'rgba(54, 162, 235, 0.7)' },
        { label: "Rendement Annuel Passif", data: dataPassif, backgroundColor: 'rgba(255, 159, 64, 0.7)' }
      ]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: val => (val * 100).toFixed(1) + '%' }
        }
      }
    }
  });
}

function creerGraphCroissance(ctx, labels, dataActif, dataPassif) {
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: "Croissance Actif ($)",
          data: dataActif,
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          fill: true,
          tension: 0.3
        },
        {
          label: "Croissance Passif ($)",
          data: dataPassif,
          borderColor: 'rgba(255, 159, 64, 1)',
          backgroundColor: 'rgba(255, 159, 64, 0.2)',
          fill: true,
          tension: 0.3
        }
      ]
    },
    options: {
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

async function main() {
  const data = await loadData();

  const select = document.getElementById('fondActifSelect');
  const keysActifs = Object.keys(data.fonds_actifs);

  for (const key of keysActifs) {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = data.fonds_actifs[key].nom;
    select.appendChild(option);
  }

  let chartRendAnnuel, chartCroiss;

  function updateGraphs() {
    const fondActifKey = select.value;
    if (!fondActifKey) return;

    const fondActif = data.fonds_actifs[fondActifKey];
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

  select.addEventListener('change', updateGraphs);

  // Affichage initial
  select.selectedIndex = 0;
  updateGraphs();
}

main();
