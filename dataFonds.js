// ===============================================================
// === FONCTIONS UTILES ===
// ===============================================================
async function loadData() {
  const resp = await fetch('fonds.json');
  if (!resp.ok) throw new Error("Erreur chargement fonds.json");
  return await resp.json();
}

function sortedMonths(rendements) {
  return Object.keys(rendements).sort();
}

function calcRendementPassif(fondsPassifs, composition, mois) {
  let rendements = {};
  mois.forEach(m => {
    let total = 0;
    for (let key in composition) {
      const r = fondsPassifs[key].rendements_mensuels[m] || 0;
      total += r * composition[key];
    }
    rendements[m] = total;
  });
  return rendements;
}

function calcRendementAnnuel(rendementsMensuels) {
  let annuels = {};
  for (let m in rendementsMensuels) {
    let year = m.split('-')[0];
    annuels[year] = (annuels[year] || 0) + rendementsMensuels[m];
  }
  return annuels;
}

function calcCroissanceMensuelle(rendements, capitalInitial = 10000) {
  let croissance = {};
  let capital = capitalInitial;
  const mois = Object.keys(rendements).sort();
  mois.forEach(m => {
    capital = capital * (1 + (rendements[m] || 0));
    croissance[m] = capital;
  });
  return croissance;
}

// ===============================================================
// === FONCTIONS DE CRÉATION DES GRAPHIQUES ===
// ===============================================================
function creerGraphRendementAnnuel(ctx, labels, dataFond, dataPassif, nomFond, mixPassif) {
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        { label: nomFond, data: dataFond, backgroundColor: '#0D9488' },
        { label: `Mix Passif (${mixPassif})`, data: dataPassif, backgroundColor: '#A855F7' }
      ]
    },
    options: { responsive: true, plugins: { legend: { position: 'top' } } }
  });
}

function creerGraphCroissance(ctx, labels, dataFond, dataPassif, nomFond, mixPassif) {
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        { label: nomFond, data: dataFond, borderColor: '#0D9488', fill: false, tension: 0.3 },
        { label: `Mix Passif (${mixPassif})`, data: dataPassif, borderColor: '#A855F7', fill: false, tension: 0.3 }
      ]
    },
    options: { responsive: true, plugins: { legend: { position: 'top' } } }
  });
}

// ===============================================================
// === GESTION ACTIVE ===
// ===============================================================
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
    if (fondsKeys.length > 0) fondsContainer.querySelector('button').click();
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

    const croissanceActif = calcCroissanceMensuelle(rendementsActif);
    const croissancePassif = calcCroissanceMensuelle(rendementsPassif);
    const moisCroissance = Object.keys(croissanceActif).sort();

    if (chartRendAnnuel) chartRendAnnuel.destroy();
    if (chartCroiss) chartCroiss.destroy();

    chartRendAnnuel = creerGraphRendementAnnuel(
      document.getElementById('rendementAnnuelChart').getContext('2d'),
      annees,
      annees.map(y => rendActifAnnuel[y]),
      annees.map(y => rendPassifAnnuel[y]),
      fondActif.nom,
      Object.keys(compositionPassif).join(" / ")
    );

    chartCroiss = creerGraphCroissance(
      document.getElementById('croissanceChart').getContext('2d'),
      moisCroissance,
      moisCroissance.map(m => croissanceActif[m]),
      moisCroissance.map(m => croissancePassif[m]),
      fondActif.nom,
      Object.keys(compositionPassif).join(" / ")
    );
  }

  if (categories.length > 0) categoriesContainer.querySelector('button').click();
}

main();
