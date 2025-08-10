document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.calculatrice-tabs .tab');
  const panels = document.querySelectorAll('[role="tabpanel"]');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      panels.forEach(panel => panel.hidden = true);

      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      const panelId = tab.getAttribute('aria-controls');
      document.getElementById(panelId).hidden = false;
    });
  });

  let chartRetraite = null;
  let chartVF = null;
  let chartHypo = null;
  let chartTrex = null;

  // RETRAITE
  const formRetraite = document.getElementById('form-retraite');
  const resultatRetraite = document.getElementById('resultat-retraite');
  const ctxRetraite = document.getElementById('chart-retraite').getContext('2d');

  formRetraite.addEventListener('submit', e => {
    e.preventDefault();

    const ageActuel = parseInt(formRetraite['age-actuel'].value);
    const ageRetraite = parseInt(formRetraite['age-retraite'].value);
    const epargneMensuelle = parseFloat(formRetraite['epargne-mensuelle'].value);
    const rendement = parseFloat(formRetraite['rendement'].value) / 100;

    if (isNaN(ageActuel) || isNaN(ageRetraite) || isNaN(epargneMensuelle) || isNaN(rendement)) {
      resultatRetraite.textContent = 'Veuillez remplir tous les champs correctement.';
      return;
    }
    if (ageRetraite <= ageActuel) {
      resultatRetraite.textContent = "L'âge de retraite doit être supérieur à l'âge actuel.";
      return;
    }

    const n = ageRetraite - ageActuel;
    const rMensuel = Math.pow(1 + rendement, 1/12) -1;
    const FV = epargneMensuelle * ((Math.pow(1 + rMensuel, n*12) - 1) / rMensuel);

    resultatRetraite.textContent = `En économisant ${epargneMensuelle.toFixed(2)}$ par mois pendant ${n} ans avec un rendement annuel moyen de ${(rendement*100).toFixed(2)}%, vous aurez accumulé environ ${FV.toFixed(2)}$.`;

    const labels = [];
    const dataEpargne = [];
    const dataInteret = [];

    for(let year=0; year<=n; year++) {
      labels.push(year.toString());
      const mois = year * 12;
      const fvAnnee = epargneMensuelle * ((Math.pow(1 + rMensuel, mois) - 1) / rMensuel);
      dataEpargne.push(epargneMensuelle * 12 * year);
      dataInteret.push(fvAnnee - (epargneMensuelle * 12 * year));
    }

    if(chartRetraite) chartRetraite.destroy();
    chartRetraite = new Chart(ctxRetraite, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Capital épargné', data: dataEpargne, backgroundColor: '#00c48c' },
          { label: 'Intérêts accumulés', data: dataInteret, backgroundColor: '#00a678' }
        ]
      },
      options: { responsive:true, plugins: {legend: {position:'top'}, title:{display:true,text:"Évolution de l'épargne avec intérêts"}}, scales:{ y:{ beginAtZero:true } } }
    });
  });

  // VALEUR FUTURE
  const formVF = document.getElementById('form-vf');
  const resultatVF = document.getElementById('resultat-vf');
  const ctxVF = document.getElementById('chart-vf').getContext('2d');

  formVF.addEventListener('submit', e => {
    e.preventDefault();

    const montantInitial = parseFloat(formVF['montant-initial'].value);
    const duree = parseInt(formVF['duree-vf'].value);
    const taux = parseFloat(formVF['taux-vf'].value) / 100;

    if (isNaN(montantInitial) || isNaN(duree) || isNaN(taux)) {
      resultatVF.textContent = 'Veuillez remplir tous les champs correctement.';
      return;
    }

    const FV = montantInitial * Math.pow(1 + taux, duree);

    resultatVF.textContent = `Après ${duree} ans, votre investissement de ${montantInitial.toFixed(2)}$ vaudra environ ${FV.toFixed(2)}$.`;

    const labels = [];
    const dataCapital = [];

    for(let year=0; year<=duree; year++) {
      labels.push(year.toString());
      dataCapital.push(montantInitial * Math.pow(1 + taux, year));
    }

    if(chartVF) chartVF.destroy();
    chartVF = new Chart(ctxVF, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Valeur Future',
          data: dataCapital,
          borderColor: '#00c48c',
          backgroundColor: 'rgba(0, 196, 140, 0.2)',
          fill: true,
          tension: 0.3,
        }]
      },
      options: { responsive:true, plugins: {legend:{position:'top'}, title:{display:true,text:"Évolution de la valeur future"}}, scales: { y:{ beginAtZero:true } } }
    });
  });

  // HYPOTHÈQUE
  const formHypo = document.getElementById('form-hypo');
  const resultatHypo = document.getElementById('resultat-hypo');
  const ctxHypo = document.getElementById('chart-hypo').getContext('2d');

  formHypo.addEventListener('submit', e => {
    e.preventDefault();

    const montantPret = parseFloat(formHypo['montant-pret'].value);
    const tauxHypo = parseFloat(formHypo['taux-hypo'].value) / 100;
    const dureeHypo = parseInt(formHypo['duree-hypo'].value);

    if (isNaN(montantPret) || isNaN(tauxHypo) || isNaN(dureeHypo)) {
      resultatHypo.textContent = 'Veuillez remplir tous les champs correctement.';
      return;
    }

    const rMensuel = tauxHypo / 12;
    const n = dureeHypo * 12;
    const mensualite = montantPret * (rMensuel * Math.pow(1 + rMensuel, n)) / (Math.pow(1 + rMensuel, n) - 1);

    resultatHypo.textContent = `Mensualité estimée: ${mensualite.toFixed(2)}$ sur ${dureeHypo} ans.`;

    let capitalRestant = montantPret;
    const labels = [];
    const dataInteretsCumul = [];
    const dataCapitalPayes = [];
    let interetsCumules = 0;

    for(let mois=0; mois<=n; mois++) {
      labels.push((mois/12).toFixed(1));
      const interetMois = capitalRestant * rMensuel;
      const capitalMois = mensualite - interetMois;
      interetsCumules += interetMois;
      capitalRestant -= capitalMois;
      if(capitalRestant < 0) capitalRestant = 0;
      dataInteretsCumul.push(interetsCumules);
      dataCapitalPayes.push(montantPret - capitalRestant);
    }

    if(chartHypo) chartHypo.destroy();
    chartHypo = new Chart(ctxHypo, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Capital remboursé', data: dataCapitalPayes, borderColor: '#00c48c', backgroundColor: 'rgba(0, 196, 140, 0.4)', fill: true, tension: 0.3 },
          { label: 'Intérêts cumulés', data: dataInteretsCumul, borderColor: '#00a678', backgroundColor: 'rgba(0, 166, 120, 0.4)', fill: true, tension: 0.3 }
        ]
      },
      options: { responsive:true, plugins:{legend:{position:'top'},title:{display:true,text:"Amortissement hypothécaire"}}, scales:{ y:{beginAtZero:true} } }
    });
  });
});
// === T‑REX SCORE ===
  // Assure-toi d’avoir ajouté la section HTML correspondante:
  // #form-trex, #resultat-trex, #chart-trex
  const formTrex = document.getElementById('form-trex');
  const resultatTrex = document.getElementById('resultat-trex');
  const canvasTrex = document.getElementById('chart-trex');
  const ctxTrex = canvasTrex ? canvasTrex.getContext('2d') : null;

  // Fonctions financières (mêmes hypothèses que précédemment)
  function fvLump(P, r, n) {
    return P * Math.pow(1 + r, n);
  }
  function fvAnnuity(C, r, n) {
    if (Math.abs(r) < 1e-10) return C * n; // contributions fin d'année si r ~ 0
    return C * ((Math.pow(1 + r, n) - 1) / r);
  }

  if (formTrex && resultatTrex && ctxTrex) {
    formTrex.addEventListener('submit', e => {
      e.preventDefault();

      const P = parseFloat(formTrex['montant-initial'].value);
      const C = parseFloat(formTrex['cotisation-annuelle'].value || '0');
      const n = parseInt(formTrex['duree-trex'].value);
      const rGross = parseFloat(formTrex['rendement-brut'].value) / 100;
      const f = parseFloat(formTrex['frais-annuels'].value) / 100;

      if (
        [P, C, n, rGross, f].some(v => Number.isNaN(v)) ||
        n <= 0 || rGross < 0 || f < 0
      ) {
        resultatTrex.textContent = 'Veuillez remplir tous les champs correctement.';
        if (chartTrex) { chartTrex.destroy(); chartTrex = null; }
        return;
      }

      const rNet = rGross - f;

      // Valeurs futures (brut vs net)
      const FVg = fvLump(P, rGross, n) + fvAnnuity(C, rGross, n);
      const FVn = fvLump(P, rNet, n) + fvAnnuity(C, rNet, n);

      // Gains relatifs aux apports
      const totalContribs = P + C * n;
      const GainG = FVg - totalContribs;
      const GainN = FVn - totalContribs;
      const Lost = Math.max(0, GainG - GainN);

      // T‑Rex Score = part du gain conservée
      let trex = 0;
      if (GainG > 0 && GainN > 0) trex = (GainN / GainG) * 100;
      trex = Math.max(0, Math.min(100, trex));

      resultatTrex.textContent =
        `T‑Rex Score: ${trex.toFixed(0)}% | ` +
        `Gain conservé: ${GainN.toFixed(2)}$ | ` +
        `Frais cumulés: ${Lost.toFixed(2)}$ | ` +
        `VF brute: ${FVg.toFixed(2)}$ | ` +
        `VF nette: ${FVn.toFixed(2)}$ | ` +
        `Rendement net estimé: ${(rNet*100).toFixed(2)}%`;

      // Graphique: barres Gain conservé vs Frais cumulés
      if (chartTrex) chartTrex.destroy();
      chartTrex = new Chart(ctxTrex, {
        type: 'bar',
        data: {
          labels: ['Gain conservé', 'Frais cumulés'],
          datasets: [{
            label: 'Impact des frais sur le gain',
            data: [Math.max(0, GainN), Math.max(0, Lost)],
            backgroundColor: ['#22c55e', '#ef4444'],
            borderColor: ['#16a34a', '#dc2626'],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Gain conservé vs Frais cumulés' },
            tooltip: {
              callbacks: {
                label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}$`
              }
            }
          },
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
    });
  }
});


