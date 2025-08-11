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
// Calculatrice Acheter ou Louer
// =====================================================================
<script>
  // Helpers locaux si besoin
  function parseNum(v) {
    if (v == null) return 0;
    return parseFloat(String(v).replace(/\s/g, '').replace(',', '.')) || 0;
  }
  function pctToMonthly(p) {
    const a = parseNum(p) / 100;
    return Math.pow(1 + a, 1/12) - 1;
  }
  function annualToMonthlyRate(a) {
    const r = parseNum(a) / 100;
    return Math.pow(1 + r, 1/12) - 1;
  }
  function fmtCurrency(n) {
    try {
      return n.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0, maximumFractionDigits: 2 });
    } catch {
      return `${Math.round(n).toString()} $`;
    }
  }

  let chartAVL;

  const formAVL = document.getElementById('form-avl');
  const resAVL = document.getElementById('resultat-avl');
  const ctxAVL = document.getElementById('chart-avl')?.getContext('2d');

  if (formAVL) {
    formAVL.addEventListener('submit', (e) => {
      e.preventDefault();

      // Inputs
      const years = parseNum(document.getElementById('avl-horizon').value);
      const months = Math.max(1, Math.round(years * 12));

      const price = parseNum(document.getElementById('avl-prix').value);
      const down = parseNum(document.getElementById('avl-mise-fonds').value);
      const rateHypoM = annualToMonthlyRate(document.getElementById('avl-taux-hypo').value);
      const amortYears = parseNum(document.getElementById('avl-amortissement').value);
      const amortMonths = Math.max(1, Math.round(amortYears * 12));

      const fraisAchatPct = parseNum(document.getElementById('avl-frais-achat').value) / 100;
      const taxesFoncieresPctA = parseNum(document.getElementById('avl-taxes-foncieres').value) / 100;
      const entretienPctA = parseNum(document.getElementById('avl-entretien').value) / 100;
      const assurMaisonM = parseNum(document.getElementById('avl-assurance-maison').value);
      const coproM = parseNum(document.getElementById('avl-copro').value);
      const growthImmoM = pctToMonthly(document.getElementById('avl-croissance-immobilier').value);
      const fraisVentePct = parseNum(document.getElementById('avl-frais-vente').value) / 100;

      const loyerM0 = parseNum(document.getElementById('avl-loyer').value);
      const growthLoyerM = pctToMonthly(document.getElementById('avl-croissance-loyer').value);
      const assurLocM = parseNum(document.getElementById('avl-assurance-loc').value);

      const rInvM = annualToMonthlyRate(document.getElementById('avl-rendement').value);

      let allocTFSA = parseNum(document.getElementById('avl-alloc-tfsa').value) / 100;
      let allocRRSP = parseNum(document.getElementById('avl-alloc-rrsp').value) / 100;
      if (allocTFSA + allocRRSP <= 0) { allocTFSA = 1; allocRRSP = 0; }
      // Normalise
      const totalAlloc = allocTFSA + allocRRSP;
      allocTFSA /= totalAlloc; allocRRSP /= totalAlloc;

      const tauxMarg = parseNum(document.getElementById('avl-taux-marginal').value) / 100;
      const tauxRetrait = parseNum(document.getElementById('avl-taux-retrait').value) / 100;
      const reinvestRefund = document.getElementById('avl-reinvest-remboursement').checked;

      // Validations de base
      if (down > price) {
        resAVL.textContent = "La mise de fonds ne peut pas excéder le prix d’achat.";
        return;
      }
      if (years <= 0 || price <= 0 || amortYears <= 0) {
        resAVL.textContent = "Veuillez remplir les champs essentiels correctement.";
        return;
      }

      // Hypothèque
      const principal0 = price - down;
      const r = rateHypoM;
      const n = amortMonths;
      const paymentM = (Math.abs(r) < 1e-12)
        ? (principal0 / n)
        : principal0 * (r / (1 - Math.pow(1 + r, -n)));

      // Frais initiaux (approx: % du prix)
      const fraisInit = price * (fraisAchatPct || 0);

      // Valeur de départ
      let valeurMaison = price;
      let soldeHypo = principal0;

      // Investissements des deux côtés (TFSA/REER)
      let tfsaBuyer = 0, rrspBuyer = 0;
      let tfsaRenter = 0, rrspRenter = 0;

      // Le locataire investit la mise de fonds + frais initiaux au départ
      let investInitialRenter = down + fraisInit;
      if (investInitialRenter > 0) {
        const toTFSA0 = investInitialRenter * allocTFSA;
        const toRRSP0 = investInitialRenter * allocRRSP;
        tfsaRenter += toTFSA0;
        rrspRenter += toRRSP0;
        if (reinvestRefund && toRRSP0 > 0 && tauxMarg > 0) {
          const refund0 = toRRSP0 * tauxMarg;
          tfsaRenter += refund0; // Réinvesti au CELI par défaut
        }
      }

      // Le loyer actualisé
      let loyerM = loyerM0;

      // Séries temporelles pour le graphique (par année)
      const labels = [];
      const dataBuyer = [];
      const dataRenter = [];

      // Boucle mensuelle
      for (let m = 1; m <= months; m++) {
        // Evolution de la valeur de la maison
        valeurMaison *= (1 + (growthImmoM || 0));

        // Coûts propriétaire du mois
        const taxesM = (valeurMaison * (taxesFoncieresPctA || 0)) / 12;
        const entretienM = (valeurMaison * (entretienPctA || 0)) / 12;

        let interetM = soldeHypo > 0 ? soldeHypo * r : 0;
        let principalM = 0;
        let versementHypo = 0;
        if (soldeHypo > 0) {
          if (Math.abs(r) < 1e-12) {
            principalM = Math.min(soldeHypo, paymentM);
            versementHypo = principalM;
          } else {
            versementHypo = Math.min(paymentM, soldeHypo + interetM);
            principalM = versementHypo - interetM;
          }
          soldeHypo = Math.max(0, soldeHypo - principalM);
        }

        const coutBuyerM = versementHypo + taxesM + entretienM + (assurMaisonM || 0) + (coproM || 0);

        // Coûts locataire du mois
        const coutRenterM = loyerM + (assurLocM || 0);

        // Différence
        const diff = coutBuyerM - coutRenterM;

        // Contributions d'investissement (différence positive pour le locataire, négative pour le propriétaire)
        if (diff > 0) {
          // Le locataire investit la différence
          const toTFSA = diff * allocTFSA;
          const toRRSP = diff * allocRRSP;
          tfsaRenter += toTFSA;
          rrspRenter += toRRSP;
          if (reinvestRefund && toRRSP > 0 && tauxMarg > 0) {
            const refund = toRRSP * tauxMarg;
            tfsaRenter += refund; // réinvesti au CELI
          }
        } else if (diff < 0) {
          // Le propriétaire investit la différence (si son coût est inférieur au loyer)
          const investBuyer = -diff;
          const toTFSA = investBuyer * allocTFSA;
          const toRRSP = investBuyer * allocRRSP;
          tfsaBuyer += toTFSA;
          rrspBuyer += toRRSP;
          if (reinvestRefund && toRRSP > 0 && tauxMarg > 0) {
            const refund = toRRSP * tauxMarg;
            tfsaBuyer += refund;
          }
        }

        // Croissance des placements
        tfsaRenter *= (1 + (rInvM || 0));
        rrspRenter *= (1 + (rInvM || 0));
        tfsaBuyer *= (1 + (rInvM || 0));
        rrspBuyer *= (1 + (rInvM || 0));

        // Actualiser le loyer (mensuel)
        loyerM *= (1 + (growthLoyerM || 0));

        // Capture annuelle pour le graphique
        if (m % 12 === 0) {
          const annee = m / 12;
          labels.push(String(annee));

          // Valeur nette acheteur si on vendait maintenant
          const valeurNetMaison = (valeurMaison * (1 - (fraisVentePct || 0))) - soldeHypo;
          const buyerAfterTaxRRSP = rrspBuyer * (1 - (tauxRetrait || 0));
          const buyerNW = Math.max(0, valeurNetMaison) + tfsaBuyer + buyerAfterTaxRRSP;

          // Valeur nette locataire
          const renterAfterTaxRRSP = rrspRenter * (1 - (tauxRetrait || 0));
          const renterNW = tfsaRenter + renterAfterTaxRRSP;

          dataBuyer.push(buyerNW);
          dataRenter.push(renterNW);
        }
      }

      // Valeur finale au terme
      const valeurNetMaisonFinale = (valeurMaison * (1 - (fraisVentePct || 0))) - soldeHypo;
      const buyerAfterTaxRRSPF = rrspBuyer * (1 - (tauxRetrait || 0));
      const renterAfterTaxRRSPF = rrspRenter * (1 - (tauxRetrait || 0));

      const buyerNWFinal = Math.max(0, valeurNetMaisonFinale) + tfsaBuyer + buyerAfterTaxRRSPF;
      const renterNWFinal = tfsaRenter + renterAfterTaxRRSPF;

      const ecart = buyerNWFinal - renterNWFinal;

      resAVL.textContent =
        `Actif net acheteur: ${fmtCurrency(buyerNWFinal)} | ` +
        `Actif net locataire: ${fmtCurrency(renterNWFinal)} | ` +
        `Écart: ${fmtCurrency(ecart)} (positif = avantage à l’achat).`;

      // Graphique
      if (chartAVL) chartAVL.destroy();
      if (ctxAVL) {
        chartAVL = new Chart(ctxAVL, {
          type: 'line',
          data: {
            labels,
            datasets: [
              {
                label: 'Acheter - Actif net (après impôt REER)',
                data: dataBuyer,
                borderColor: '#00c48c',
                backgroundColor: 'rgba(0, 196, 140, 0.15)',
                fill: true,
                tension: 0.25
              },
              {
                label: 'Louer - Actif net (après impôt REER)',
                data: dataRenter,
                borderColor: '#4f5d75',
                backgroundColor: 'rgba(79, 93, 117, 0.15)',
                fill: true,
                tension: 0.25
              }
            ]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'top' },
              title: { display: true, text: 'Évolution de l’actif net — Acheter vs Louer' }
            },
            scales: { y: { beginAtZero: true } }
          }
        });
      }
    });
  }
</script>
  
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
  `Votre score est de ${(scoreTrex * 100).toFixed(1)}%.\n` +
  `Valeur finale avec frais : ${fmtCurrency(capitalAvecFrais)}\n` +
  `Valeur sans frais : ${fmtCurrency(capitalSansFrais)} → Frais payés : ${fmtCurrency(fraisPayesEstimes)}.`;

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
