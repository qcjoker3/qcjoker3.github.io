document.addEventListener('DOMContentLoaded', () => {
  // =====================================================================
  // Activation des calculatrices via les cartes de sélection
  // =====================================================================
  const calcCards = document.querySelectorAll('.card.card-link');
  const calcSections = document.querySelectorAll('.calculator-card');

  calcCards.forEach(card => {
    card.addEventListener('click', () => {
      // Mise à jour visuelle des cartes
      calcCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');

      // Activation de la bonne section
      const selected = card.dataset.calc; // "retraite" | "valeur-future" | "hypotheque" | "trex"
      calcSections.forEach(sec => sec.classList.remove('active'));
      const activeSection = document.getElementById(`calc-${selected}`);
      if (activeSection) activeSection.classList.add('active');
    });
  });

  // =====================================================================
  // Helpers
  // =====================================================================
  const fmtCurrency = n =>
    new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 2 }).format(n);

  const toFloat = v => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : NaN;
  };

  // =====================================================================
  // Références graphiques (Chart.js)
  // =====================================================================
  let chartRetraite = null;
  let chartVF = null;
  let chartHypo = null;
  let chartTrex = null;

  // =====================================================================
  // Calculatrice Retraite
  // =====================================================================
  const formRetraite = document.getElementById('form-retraite');
  const resultatRetraite = document.getElementById('resultat-retraite');
  const ctxRetraite = document.getElementById('chart-retraite')?.getContext('2d');

  if (formRetraite) {
    formRetraite.addEventListener('submit', e => {
      e.preventDefault();
      const ageActuel = parseInt(formRetraite['age-actuel'].value);
      const ageRetraite = parseInt(formRetraite['age-retraite'].value);
      const epargneMensuelle = toFloat(formRetraite['epargne-mensuelle'].value);
      const rendementAnnuel = toFloat(formRetraite['rendement'].value) / 100;

      if (
        !Number.isFinite(ageActuel) ||
        !Number.isFinite(ageRetraite) ||
        !Number.isFinite(epargneMensuelle) ||
        !Number.isFinite(rendementAnnuel)
      ) {
        resultatRetraite.textContent = 'Veuillez remplir tous les champs correctement.';
        return;
      }
      if (ageRetraite <= ageActuel) {
        resultatRetraite.textContent = "L'âge de retraite doit être supérieur à l'âge actuel.";
        return;
      }

      const annees = ageRetraite - ageActuel;
      const rMensuel = Math.pow(1 + rendementAnnuel, 1 / 12) - 1;

      let FV;
      if (Math.abs(rMensuel) < 1e-12) {
        // Rendement ~ 0%: somme simple des versements
        FV = epargneMensuelle * 12 * annees;
      } else {
        FV = epargneMensuelle * ((Math.pow(1 + rMensuel, annees * 12) - 1) / rMensuel);
      }

      resultatRetraite.textContent =
        `En économisant ${fmtCurrency(epargneMensuelle)} par mois pendant ${annees} ans ` +
        `avec un rendement annuel moyen de ${(rendementAnnuel * 100).toFixed(2)}%, ` +
        `vous aurez accumulé environ ${fmtCurrency(FV)}.`;

      // Données du graphique (par année)
      const labels = [];
      const dataEpargne = [];
      const dataInteret = [];
      for (let year = 0; year <= annees; year++) {
        labels.push(year.toString());
        const mois = year * 12;
        let fvAnnee;
        if (Math.abs(rMensuel) < 1e-12) {
          fvAnnee = epargneMensuelle * mois;
        } else {
          fvAnnee = epargneMensuelle * ((Math.pow(1 + rMensuel, mois) - 1) / rMensuel);
        }
        const epargneSansInteret = epargneMensuelle * 12 * year;
        dataEpargne.push(epargneSansInteret);
        dataInteret.push(Math.max(0, fvAnnee - epargneSansInteret));
      }

      if (chartRetraite) chartRetraite.destroy();
      chartRetraite = new Chart(ctxRetraite, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            { label: 'Capital épargné', data: dataEpargne, backgroundColor: '#00c48c' },
            { label: 'Intérêts accumulés', data: dataInteret, backgroundColor: '#00a678' }
          ]
        },
        options: {
          responsive: true,
          plugins: { legend: { position: 'top' }, title: { display: true, text: "Évolution de l'épargne avec intérêts" } },
          scales: { y: { beginAtZero: true } }
        }
      });
    });
  }

  // =====================================================================
// Calculatrice Valeur Future (avec cotisations)
// =====================================================================
const formVF = document.getElementById('form-vf');
const resultatVF = document.getElementById('resultat-vf');
const ctxVF = document.getElementById('chart-vf')?.getContext('2d');

if (formVF) {
  formVF.addEventListener('submit', e => {
    e.preventDefault();
    const montantInitial = toFloat(formVF['montant-initial'].value);
    const duree = parseInt(formVF['duree-vf'].value);
    const taux = toFloat(formVF['taux-vf'].value) / 100;

    // Nouveaux champs
    const cotisation = toFloat(formVF['cotisation-vf']?.value) || 0;
    const freq = formVF['frequence-vf']?.value || 'annuelle';

    if (!Number.isFinite(montantInitial) || !Number.isFinite(duree) || !Number.isFinite(taux)) {
      resultatVF.textContent = 'Veuillez remplir tous les champs correctement.';
      return;
    }

    // Fréquence → nombre de périodes par an
    const m = (freq === 'mensuelle') ? 12 : (freq === 'hebdomadaire') ? 52 : 1;

    // Taux par période (cohérent avec un taux effectif annuel "taux")
    const rP = Math.pow(1 + taux, 1 / m) - 1;

    // Valeur future de l’apport initial (capitalise annuellement)
    const FV_initial = montantInitial * Math.pow(1 + taux, duree);

    // Valeur future des cotisations (annuité sur rP, avec contributions en fin de période)
    const nP = duree * m;
    const FV_cot = (Math.abs(rP) < 1e-12)
      ? cotisation * nP
      : cotisation * ((Math.pow(1 + rP, nP) - 1) / rP);

    const FV_total = FV_initial + FV_cot;

    // Total des cotisations versées (sans intérêts)
    const totalCotisations = cotisation * nP;

    // Texte de résultat
    const labelFreq =
      freq === 'mensuelle' ? 'mensuelle'
      : freq === 'hebdomadaire' ? 'hebdomadaire'
      : 'annuelle';

    resultatVF.textContent =
      `Après ${duree} ans, votre investissement de ${fmtCurrency(montantInitial)} ` +
      `avec une cotisation ${labelFreq} de ${fmtCurrency(cotisation)} ` +
      `vaudra environ ${fmtCurrency(FV_total)}. ` +
      `(dont ${fmtCurrency(totalCotisations)} de cotisations versées)`;

    // Données du graphique par année (0 → duree)
    const labels = [];
    const dataCapital = [];
    for (let year = 0; year <= duree; year++) {
      labels.push(year.toString());

      const periodsY = year * m;
      const FV_init_y = montantInitial * Math.pow(1 + taux, year);
      const FV_cot_y = (Math.abs(rP) < 1e-12)
        ? cotisation * periodsY
        : cotisation * ((Math.pow(1 + rP, periodsY) - 1) / rP);

      dataCapital.push(FV_init_y + FV_cot_y);
    }

    if (chartVF) chartVF.destroy();
    chartVF = new Chart(ctxVF, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Valeur future (avec cotisations)',
          data: dataCapital,
          borderColor: '#00c48c',
          backgroundColor: 'rgba(0, 196, 140, 0.2)',
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' }, title: { display: true, text: 'Évolution de la valeur future' } },
        scales: { y: { beginAtZero: true } }
      }
    });
  });
}

  // =====================================================================
  // Calculatrice Hypothèque
  // =====================================================================
  const formHypo = document.getElementById('form-hypo');
  const resultatHypo = document.getElementById('resultat-hypo');
  const ctxHypo = document.getElementById('chart-hypo')?.getContext('2d');

  if (formHypo) {
    formHypo.addEventListener('submit', e => {
      e.preventDefault();
      const montantPret = toFloat(formHypo['montant-pret'].value);
      const tauxHypo = toFloat(formHypo['taux-hypo'].value) / 100;
      const dureeHypo = parseInt(formHypo['duree-hypo'].value);

      if (!Number.isFinite(montantPret) || !Number.isFinite(tauxHypo) || !Number.isFinite(dureeHypo)) {
        resultatHypo.textContent = 'Veuillez remplir tous les champs correctement.';
        return;
      }

      const rMensuel = tauxHypo / 12;
      const n = dureeHypo * 12;

      let mensualite;
      if (Math.abs(rMensuel) < 1e-12) {
        // Taux 0%: remboursement linéaire
        mensualite = montantPret / n;
      } else {
        mensualite = montantPret * (rMensuel * Math.pow(1 + rMensuel, n)) / (Math.pow(1 + rMensuel, n) - 1);
      }

      resultatHypo.textContent = `Mensualité estimée: ${fmtCurrency(mensualite)} sur ${dureeHypo} ans.`;

      let capitalRestant = montantPret;
      const labels = [];
      const dataInteretsCumul = [];
      const dataCapitalPayes = [];
      let interetsCumules = 0;

      for (let mois = 0; mois <= n; mois++) {
        labels.push((mois / 12).toFixed(1));
        const interetMois = capitalRestant * rMensuel;
        const capitalMois = Math.min(mensualite - interetMois, capitalRestant);
        interetsCumules += Math.max(0, interetMois);
        capitalRestant = Math.max(0, capitalRestant - capitalMois);
        dataInteretsCumul.push(interetsCumules);
        dataCapitalPayes.push(montantPret - capitalRestant);
      }

      if (chartHypo) chartHypo.destroy();
      chartHypo = new Chart(ctxHypo, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Capital remboursé',
              data: dataCapitalPayes,
              borderColor: '#00c48c',
              backgroundColor: 'rgba(0, 196, 140, 0.4)',
              fill: true,
              tension: 0.3
            },
            {
              label: 'Intérêts cumulés',
              data: dataInteretsCumul,
              borderColor: '#00a678',
              backgroundColor: 'rgba(0, 166, 120, 0.4)',
              fill: true,
              tension: 0.3
            }
          ]
        },
        options: {
          responsive: true,
          plugins: { legend: { position: 'top' }, title: { display: true, text: 'Évolution du prêt hypothécaire' } },
          scales: { y: { beginAtZero: true } }
        }
      });
    });
  }

  // =====================================================================
  // Calculatrice T‑Rex Score
  // =====================================================================
  const formTrex = document.getElementById('form-trex');
  const resultatTrex = document.getElementById('resultat-trex');
  const ctxTrex = document.getElementById('chart-trex')?.getContext('2d');

  if (formTrex) {
    formTrex.addEventListener('submit', e => {
      e.preventDefault();
      const montantInitial = toFloat(formTrex['montant-initial'].value);
      const cotisationAnnuelle = toFloat(formTrex['cotisation-annuelle'].value) || 0;
      const duree = parseInt(formTrex['duree-trex'].value);
      const rendementBrut = toFloat(formTrex['rendement-brut'].value) / 100;
      const fraisAnnuel = toFloat(formTrex['frais-annuels'].value) / 100;

      if (
        !Number.isFinite(montantInitial) ||
        !Number.isFinite(duree) ||
        !Number.isFinite(rendementBrut) ||
        !Number.isFinite(fraisAnnuel)
      ) {
        resultatTrex.textContent = 'Veuillez remplir tous les champs correctement.';
        return;
      }

      const rendementNet = rendementBrut - fraisAnnuel;

      // Valeur finale avec contributions annuelles (fin de période) — gestion des cas r = 0
      const fv = (P, r, n, C) => {
        if (Math.abs(r) < 1e-12) {
          return P + C * n;
        }
        return P * Math.pow(1 + r, n) + C * ((Math.pow(1 + r, n) - 1) / r);
      };

      const capitalAvecFrais = fv(montantInitial, rendementNet, duree, cotisationAnnuelle);
      const capitalSansFrais = fv(montantInitial, rendementBrut, duree, cotisationAnnuelle);

      const scoreTrex = capitalAvecFrais / (capitalSansFrais || 1); // évite division par 0

      // 💸 Montant des frais payés estimé (approx)
    const perteDueAuxFrais = capitalSansFrais - capitalAvecFrais;
    const totalCotisations = cotisationAnnuelle * duree;
    const montantInvesti = montantInitial + totalCotisations;
   
    const fraisPayesEstimes = perteDueAuxFrais;

      resultatTrex.textContent =
  `Votre score T‑Rex est de ${(scoreTrex * 100).toFixed(1)}%.\n` +
  `Valeur finale avec frais : ${fmtCurrency(capitalAvecFrais)}\n` +
  `Valeur sans frais : ${fmtCurrency(capitalSansFrais)} → Frais payés : ${fmtCurrency(fraisPayesEstimes)}

      const labels = ['Avec frais', 'Sans frais'];
      const dataValues = [capitalAvecFrais, capitalSansFrais];

      if (chartTrex) chartTrex.destroy();
      chartTrex = new Chart(ctxTrex, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            { label: 'Valeur finale', data: dataValues, backgroundColor: ['#00a678', '#00c48c'] }
          ]
        },
        options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: true, text: "Impact des frais sur la valeur finale" }
        },
        scales: { y: { beginAtZero: true } }
        }
      });
    });
  }
});
