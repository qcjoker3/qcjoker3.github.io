async function loadData() {
  const resp = await fetch('fonds.json');
  if (!resp.ok) throw new Error("Erreur chargement fonds.json");
  return await resp.json();
}

function sortedMonths(rendements) {
  return Object.keys(rendements).sort();
}

// Rendements du fonds passif sélectionné
function calcRendementPassif(fondsPassifs, keyFond, mois) {
  let rendements = {};
  const fonds = fondsPassifs[keyFond];
  if (!fonds) return rendements;

  mois.forEach(m => {
    rendements[m] = fonds.rendements_mensuels[m] ?? 0;
  });

  return rendements;
}

// Rendements annuels à partir des mensuels
function calcRendementAnnuel(rendementsMensuels) {
  let annuels = {};
  for (let m in rendementsMensuels) {
    let year = m.split('-')[0];
    annuels[year] = (annuels[year] ?? 0) + rendementsMensuels[m];
  }
  return annuels;
}

// Croissance du capital
function calcCroissanceMensuelle(rendements, capitalInitial = 10000) {
  let croissance = {};
  let capital = capitalInitial;
  const mois = Object.keys(rendements).sort();
  mois.forEach(m => {
    capital = capital * (1 + (rendements[m] ?? 0) / 100);
    croissance[m] = capital;
  });
  return croissance;
}

// Création graphique bar (rendement annuel)
function creerGraphRendementAnnuel(ctx, labels, dataFond, dataPassif, nomFond, fondsPassif) {
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        { label: nomFond, data: dataFond, backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color') },
        { label: fondsPassif, data: dataPassif, backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--accent-color') }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'top', labels: { boxWidth: 20 } } }
    }
  });
}

// Création graphique ligne (croissance)
function creerGraphCroissance(ctx, labels, dataFond, dataPassif, nomFond, fondsPassif) {
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        { label: nomFond, data: dataFond, borderColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color'), fill: false, tension: 0.3 },
        { label: fondsPassif, data: dataPassif, borderColor: getComputedStyle(document.documentElement).getPropertyValue('--accent-color'), fill: false, tension: 0.3 }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'top', labels: { boxWidth: 20 } } }
    }
  });
}

// MAIN
async function main() {
  const data = await loadData();
  const institutionsContainer = document.getElementById('institutions');
  const fondsContainer = document.getElementById('fondsContainer');
  let chartRendAnnuel, chartCroiss;
  let selectedFondKey = null;

  const institutions = Object.keys(data.institutions);

  // Crée les boutons des institutions
  institutions.forEach(inst => {
    const btn = document.createElement('button');
    btn.textContent = inst;
    btn.className = 'pastille institution';
    btn.addEventListener('click', () => {
      updateFonds(inst);
      document.querySelectorAll('.institution').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
    institutionsContainer.appendChild(btn);
  });

  // Met à jour les pastilles de fonds selon l'institution
  function updateFonds(institution) {
    fondsContainer.innerHTML = '';
    const fondsKeys = data.institutions[institution];
    fondsKeys.forEach(key => {
      const btn = document.createElement('button');
      btn.textContent = data.fonds_actifs[key]?.nom || key;
      btn.className = 'pastille fond';
      btn.addEventListener('click', () => {
        selectedFondKey = key;
        document.querySelectorAll('.fond').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        updateGraphs();
      });
      fondsContainer.appendChild(btn);
    });
    // Sélection automatique du premier fonds
    if (fondsKeys.length > 0) fondsContainer.querySelector('button').click();
  }

  function updateGraphs() {
    if (!selectedFondKey) return;
    const fondActif = data.fonds_actifs[selectedFondKey];
    const fondsPassifs = data.fonds_passifs || {};
    const rendementsActif = fondActif.rendements_mensuels || {};
    const moisCommuns = sortedMonths(rendementsActif);

    // prend le premier fonds passif
    const keyFondPassif = fondActif.composition_passif?.[0];
    const rendementsPassif = calcRendementPassif(fondsPassifs, keyFondPassif, moisCommuns);

    const rendActifAnnuel = calcRendementAnnuel(rendementsActif);
    const rendPassifAnnuel = calcRendementAnnuel(rendementsPassif);
    const annees = Object.keys(rendActifAnnuel).sort();

    const croissanceActif = calcCroissanceMensuelle(rendementsActif);
    const croissancePassif = calcCroissanceMensuelle(rendementsPassif);
    const moisCroissance = Object.keys(croissanceActif).sort();

    if (chartRendAnnuel) chartRendAnnuel.destroy();
    if (chartCroiss) chartCroiss.destroy();

    const mixLabel = keyFondPassif || "Passif";

    chartRendAnnuel = creerGraphRendementAnnuel(
      document.getElementById('rendementAnnuelChart').getContext('2d'),
      annees,
      annees.map(y => rendActifAnnuel[y]),
      annees.map(y => rendPassifAnnuel[y]),
      fondActif.nom,
      mixLabel
    );

    chartCroiss = creerGraphCroissance(
      document.getElementById('croissanceChart').getContext('2d'),
      moisCroissance,
      moisCroissance.map(m => croissanceActif[m]),
      moisCroissance.map(m => croissancePassif[m]),
      fondActif.nom,
      mixLabel
    );
  }

  // Sélection automatique de la première institution
  if (institutions.length > 0) institutionsContainer.querySelector('button').click();
}

main();
