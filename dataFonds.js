// Fonction utilitaire : trier les mois (ex: "2020-01")
function sortedMonths(rendements) {
  return Object.keys(rendements).sort();
}

// Calcul des rendements cumulés (1 + r1)*(1 + r2)*... - 1
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

// Rebalancement périodique portefeuille
function portefeuilleRebalance(dataFonds, pond, freq = 'annuel') {
  const tickers = Object.keys(dataFonds);
  // Intersection des mois communs
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
      weights = {...pond}; // Reset poids
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

// --- FETCH du JSON puis calculs ---
fetch('fonds.json')
  .then(response => {
    if (!response.ok) throw new Error("Erreur lors du chargement du fichier JSON");
    return response.json();
  })
  .then(data => {
    const fondActifKey = "0P00016G44.TO"; // Exemple
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

    console.log("Croissance actif (fin 2025):", croissActif[Object.keys(croissActif).pop()]);
    console.log("Croissance passif (fin 2025):", croissPassif[Object.keys(croissPassif).pop()]);

    // Tu peux ici appeler ta fonction d'affichage graphique ou autre traitement
  })
  .catch(err => {
    console.error("Erreur:", err);
  });
