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
      // Marquer la catégorie sélectionnée
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

    // Sélectionner le premier fond automatiquement
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

  // --- Sélection initiale de la première catégorie ---
  if (categories.length > 0) {
    categoriesContainer.querySelector('button').click();
  }
}

main();
