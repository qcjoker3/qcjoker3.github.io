document.addEventListener('DOMContentLoaded', () => {
  // ============================================================================
  // Helpers globaux
  // ============================================================================
  const fmtCurrency = n =>
    new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 2
    }).format(n);

  const toFloat = v => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : NaN;
  };

  const parseNum = v =>
    parseFloat(String(v).replace(/\s/g, '').replace(',', '.')) || 0;

  const pctToMonthly = p => {
    const a = parseNum(p) / 100;
    return Math.pow(1 + a, 1 / 12) - 1;
  };

  const annualToMonthlyRate = a => {
    const r = parseNum(a) / 100;
    return Math.pow(1 + r, 1 / 12) - 1;
  };

  // ============================================================================
  // Références graphiques Chart.js
  // ============================================================================
  let chartRetraite = null;
  let chartVF = null;
  let chartHypo = null;
  let chartTrex = null;
  let chartAVL = null;

  // ============================================================================
  // Activation des cartes (affichage des sections)
  // ============================================================================
  const calcCards = document.querySelectorAll('.card.card-link');
  const calcSections = document.querySelectorAll('.calculator-card');

  calcCards.forEach(card => {
    card.addEventListener('click', () => {
      // 1) style visuel carte
      calcCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');

      // 2) section ciblée
      const selected = card.dataset.calc; // ex: "retraite", "vf", "hypotheque", "trex", "avl"
      calcSections.forEach(sec => sec.classList.remove('active'));
      const activeSection = document.getElementById(`calc-${selected}`);
      if (activeSection) activeSection.classList.add('active');
    });
  });

  // ============================================================================
  // Calculatrice Retraite
  // ============================================================================
  const formRetraite = document.getElementById('form-retraite');
  const resultatRetraite = document.getElementById('resultat-retraite');
  const ctxRetraite = document.getElementById('chart-retraite')?.getContext('2d');

  formRetraite?.addEventListener('submit', e => {
    e.preventDefault();

    const ageActuel = parseInt(formRetraite['age-actuel'].value);
    const ageRetraite = parseInt(formRetraite['age-retraite'].value);
    const epargneMensuelle = toFloat(formRetraite['epargne-mensuelle'].value);
    const rendementAnnuel = toFloat(formRetraite['rendement'].value) / 100;

    if (!Number.isFinite(ageActuel) || !Number.isFinite(ageRetraite) ||
        !Number.isFinite(epargneMensuelle) || !Number.isFinite(rendementAnnuel)) {
      resultatRetraite.textContent = 'Veuillez remplir tous les champs correctement.';
      return;
    }
    if (ageRetraite <= ageActuel) {
      resultatRetraite.textContent = "L'âge de retraite doit être supérieur à l'âge actuel.";
      return;
    }

    const annees = ageRetraite - ageActuel;
    const rMensuel = Math.pow(1 + rendementAnnuel, 1 / 12) - 1;
    let FV = Math.abs(rMensuel) < 1e-12
      ? epargneMensuelle * 12 * annees
      : epargneMensuelle * ((Math.pow(1 + rMensuel, annees * 12) - 1) / rMensuel);

    resultatRetraite.textContent =
      `En économisant ${fmtCurrency(epargneMensuelle)} par mois pendant ${annees} ans ` +
      `avec un rendement annuel moyen de ${(rendementAnnuel * 100).toFixed(2)}%, ` +
      `vous aurez accumulé environ ${fmtCurrency(FV)}.`;

    const labels = [], dataEpargne = [], dataInteret = [];
    for (let year = 0; year <= annees; year++) {
      const mois = year * 12;
      const fvAnnee = Math.abs(rMensuel) < 1e-12
        ? epargneMensuelle * mois
        : epargneMensuelle * ((Math.pow(1 + rMensuel, mois) - 1) / rMensuel);

      const epargneSansInteret = epargneMensuelle * 12 * year;
      labels.push(year.toString());
      dataEpargne.push(epargneSansInteret);
      dataInteret.push(Math.max(0, fvAnnee - epargneSansInteret));
    }

    if (chartRetraite) chartRetraite.destroy();
    if (ctxRetraite && typeof Chart !== 'undefined') {
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
          plugins: {
            legend: { position: 'top' },
            title: { display: true, text: "Évolution de l'épargne avec intérêts" }
          },
          scales: { y: { beginAtZero: true } }
        }
      });
    }
  });

  // ============================================================================
  // Valeur future (avec cotisations)
  // ============================================================================
  const formVF = document.getElementById('form-vf');
  const resultatVF = document.getElementById('resultat-vf');
  const ctxVF = document.getElementById('chart-vf')?.getContext('2d');

  formVF?.addEventListener('submit', e => {
    e.preventDefault();

    const montantInitial = toFloat(formVF['montant-initial'].value);
    const duree = parseInt(formVF['duree-vf'].value);
    const taux = toFloat(formVF['taux-vf'].value) / 100;
    const cotisation = toFloat(formVF['cotisation-vf']?.value) || 0;
    const freq = formVF['frequence-vf']?.value || 'annuelle';

    if (!Number.isFinite(montantInitial) || !Number.isFinite(duree) || !Number.isFinite(taux)) {
      resultatVF.textContent = 'Veuillez remplir tous les champs correctement.';
      return;
    }

    const m = freq === 'mensuelle' ? 12 : freq === 'hebdomadaire' ? 52 : 1;
    const rP = Math.pow(1 + taux, 1 / m) - 1;
    const FV_initial = montantInitial * Math.pow(1 + taux, duree);
    const nP = duree * m;
    const FV_cot = Math.abs(rP) < 1e-12
      ? cotisation * nP
      : cotisation * ((Math.pow(1 + rP, nP) - 1) / rP);

    const FV_total = FV_initial + FV_cot;
    const totalCotisations = cotisation * nP;
    const labelFreq = freq === 'mensuelle' ? 'mensuelle' :
                      freq === 'hebdomadaire' ? 'hebdomadaire' : 'annuelle';

    resultatVF.textContent =
      `Après ${duree} ans, votre investissement de ${fmtCurrency(montantInitial)} ` +
      `avec une cotisation ${labelFreq} de ${fmtCurrency(cotisation)} ` +
      `vaudra environ ${fmtCurrency(FV_total)}. ` +
      `(dont ${fmtCurrency(totalCotisations)} de cotisations versées)`;

    const labels = [], dataCapital = [];
    for (let year = 0; year <= duree; year++) {
      const periodsY = year * m;
      const FV_init_y = montantInitial * Math.pow(1 + taux, year);
      const FV_cot_y = Math.abs(rP) < 1e-12
        ? cotisation * periodsY
        : cotisation * ((Math.pow(1 + rP, periodsY) - 1) / rP);

      labels.push(year.toString());
      dataCapital.push(FV_init_y + FV_cot_y);
    }

    if (chartVF) chartVF.destroy();
    if (ctxVF && typeof Chart !== 'undefined') {
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
          plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Évolution de la valeur future' }
          },
          scales: { y: { beginAtZero: true } }
        }
      });
    }
  });

  // ============================================================================
  // Hypothèque
  // ============================================================================
  const formHypo = document.getElementById('form-hypo');
  const resultatHypo = document.getElementById('resultat-hypo');
  const ctxHypo = document.getElementById('chart-hypo')?.getContext('2d');

  formHypo?.addEventListener('submit', e => {
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
    const mensualite = Math.abs(rMensuel) < 1e-12
      ? montantPret / n
      : montantPret * (rMensuel * Math.pow(1 + rMensuel, n)) / (Math.pow(1 + rMensuel, n) - 1);

    resultatHypo.textContent = `Mensualité estimée: ${fmtCurrency(mensualite)} sur ${dureeHypo} ans.`;

    let capitalRestant = montantPret;
    const labels = [], dataInteretsCumul = [], dataCapitalPayes = [];
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
    if (ctxHypo && typeof Chart !== 'undefined') {
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
          plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Évolution du prêt hypothécaire' }
          },
          scales: { y: { beginAtZero: true } }
        }
      });
    }
  });

  // ============================================================================
  // T‑Rex Score
  // ============================================================================
  const formTrex = document.getElementById('form-trex');
  const resultatTrex = document.getElementById('resultat-trex');
  const ctxTrex = document.getElementById('chart-trex')?.getContext('2d');

  formTrex?.addEventListener('submit', e => {
    e.preventDefault();

    const montantInitial = toFloat(formTrex['montant-initial'].value);
    const cotisationAnnuelle = toFloat(formTrex['cotisation-annuelle'].value) || 0;
    const duree = parseInt(formTrex['duree-trex'].value);
    const rendementBrut = toFloat(formTrex['rendement-brut'].value) / 100;
    const fraisAnnuel = toFloat(formTrex['frais-annuels'].value) / 100;

    if (!Number.isFinite(montantInitial) || !Number.isFinite(duree) ||
        !Number.isFinite(rendementBrut) || !Number.isFinite(fraisAnnuel)) {
      resultatTrex.textContent = 'Veuillez remplir tous les champs correctement.';
      return;
    }

    const rendementNet = rendementBrut - fraisAnnuel;
    const fv = (P, r, n, C) => {
      if (Math.abs(r) < 1e-12) return P + C * n;
      return P * Math.pow(1 + r, n) + C * ((Math.pow(1 + r, n) - 1) / r);
    };

    const capitalAvecFrais = fv(montantInitial, rendementNet, duree, cotisationAnnuelle);
    const capitalSansFrais = fv(montantInitial, rendementBrut, duree, cotisationAnnuelle);
    const scoreTrex = capitalAvecFrais / (capitalSansFrais || 1);
    const perteDueAuxFrais = capitalSansFrais - capitalAvecFrais;

    resultatTrex.textContent =
      `Votre score est de ${(scoreTrex * 100).toFixed(1)}%.\n` +
      `Valeur finale avec frais : ${fmtCurrency(capitalAvecFrais)}\n` +
      `Valeur sans frais : ${fmtCurrency(capitalSansFrais)} → Frais payés : ${fmtCurrency(perteDueAuxFrais)}.`;

    if (chartTrex) chartTrex.destroy();
    if (ctxTrex && typeof Chart !== 'undefined') {
      chartTrex = new Chart(ctxTrex, {
        type: 'bar',
        data: {
          labels: ['Avec frais', 'Sans frais'],
          datasets: [{
            label: 'Valeur finale',
            data: [capitalAvecFrais, capitalSansFrais],
            backgroundColor: ['#00a678', '#00c48c']
          }]
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
    }
  });

  // ============================================================================
  // Louer vs Acheter
  // ============================================================================
  const formAVL = document.getElementById('form-avl');
  const resAVL = document.getElementById('resultat-avl');
  const ctxAVL = document.getElementById('chart-avl')?.getContext('2d');

  formAVL?.addEventListener('submit', (e) => {
    e.preventDefault();

    const years = parseNum(document.getElementById('avl-horizon').value);
    const months = Math.max(1, Math.round(years * 12));

    const price = parseNum(document.getElementById('avl-prix').value);
    const down = parseNum(document.getElementById('avl-mise-fonds').value);
    const rateHypoM = annualToMonthlyRate(document.getElementById('avl-taux-hypo').value);
    const amortYears = parseNum(document.getElementById('avl-amortissement').value);
    const amortMonths = Math.max(1, Math.round(amortYears * 12));

    const fraisAchatMode = document.getElementById('avl-frais-achat-mode')?.value; // 'pct' ou 'dollar'
    let fraisInit = 0;

    if (fraisAchatMode === 'pct') {
    const fraisAchatPct = parseNum(document.getElementById('avl-frais-achat-pct').value) / 100;
    fraisInit = price * fraisAchatPct;
    } else {
    fraisInit = parseNum(document.getElementById('avl-frais-achat-dollar').value);
    }

    const taxesMode = document.querySelector('[name="avl-taxes-mode"]:checked')?.value; // 'pct' ou 'dollar'
    let taxesFoncieresM = 0;
    if (taxesMode === 'pct') {
    const taxesPctA = parseNum(document.getElementById('avl-taxes-pct').value) / 100;
    taxesFoncieresM = (valeurMaison * taxesPctA) / 12;
    } else {
    taxesFoncieresM = parseNum(document.getElementById('avl-taxes-dollar').value);
    }
    const entretienMode = document.querySelector('[name="avl-entretien-mode"]:checked')?.value; // 'pct' ou 'dollar'
    let entretienM = 0;
    if (entretienMode === 'pct') {
    const entretienPctA = parseNum(document.getElementById('avl-entretien-pct').value) / 100;
    entretienM = (valeurMaison * entretienPctA) / 12;
    } else {
    entretienM = parseNum(document.getElementById('avl-entretien-dollar').value);
    }
    const assurMaisonM = parseNum(document.getElementById('avl-assurance-maison').value);
    const coproM = parseNum(document.getElementById('avl-copro').value);
    const growthImmoM = pctToMonthly(document.getElementById('avl-croissance-immobilier').value);
    const venteMode = document.querySelector('[name="avl-frais-vente-mode"]:checked')?.value; // 'pct' ou 'dollar'
    let fraisVente = 0;
    if (venteMode === 'pct') {
    const fraisVentePct = parseNum(document.getElementById('avl-frais-vente-pct').value) / 100;
    fraisVente = valeurMaison * fraisVentePct;
    } else {
    fraisVente = parseNum(document.getElementById('avl-frais-vente-dollar').value);
    }

    const loyerM0 = parseNum(document.getElementById('avl-loyer').value);
    const growthLoyerM = pctToMonthly(document.getElementById('avl-croissance-loyer').value);
    const assurLocM = parseNum(document.getElementById('avl-assurance-loc').value);

    const rInvM = annualToMonthlyRate(document.getElementById('avl-rendement').value);

    let allocTFSA = parseNum(document.getElementById('avl-alloc-tfsa').value) / 100;
    let allocRRSP = parseNum(document.getElementById('avl-alloc-rrsp').value) / 100;
    if (allocTFSA + allocRRSP <= 0) { allocTFSA = 1; allocRRSP = 0; }
    const totalAlloc = allocTFSA + allocRRSP;
    allocTFSA /= totalAlloc;
    allocRRSP /= totalAlloc;

    const tauxMarg = parseNum(document.getElementById('avl-taux-marginal').value) / 100;
    const tauxRetrait = parseNum(document.getElementById('avl-taux-retrait').value) / 100;
    const reinvestRefund = document.getElementById('avl-reinvest-remboursement').checked;

    if (down > price) {
      resAVL.textContent = "La mise de fonds ne peut pas excéder le prix d’achat.";
      return;
    }
    if (years <= 0 || price <= 0 || amortYears <= 0) {
      resAVL.textContent = "Veuillez remplir les champs essentiels correctement.";
      return;
    }

    const principal0 = price - down;
    const r = rateHypoM;
    const n = amortMonths;
    const paymentM = Math.abs(r) < 1e-12
      ? (principal0 / n)
      : principal0 * (r / (1 - Math.pow(1 + r, -n)));

    const fraisInit = price * (fraisAchatPct || 0);

    let valeurMaison = price;
    let soldeHypo = principal0;
    let tfsaBuyer = 0, rrspBuyer = 0;
    let tfsaRenter = 0, rrspRenter = 0;

    let investInitialRenter = down + fraisInit;
    if (investInitialRenter > 0) {
      const toTFSA0 = investInitialRenter * allocTFSA;
      const toRRSP0 = investInitialRenter * allocRRSP;
      tfsaRenter += toTFSA0;
      rrspRenter += toRRSP0;
      if (reinvestRefund && toRRSP0 > 0 && tauxMarg > 0) {
        const refund0 = toRRSP0 * tauxMarg;
        tfsaRenter += refund0;
      }
    }

    let loyerM = loyerM0;
    const labels = [], dataBuyer = [], dataRenter = [];

    for (let m = 1; m <= months; m++) {
      valeurMaison *= (1 + (growthImmoM || 0));

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
      const coutRenterM = loyerM + (assurLocM || 0);
      const diff = coutBuyerM - coutRenterM;

      if (diff > 0) {
        const toTFSA = diff * allocTFSA;
        const toRRSP = diff * allocRRSP;
        tfsaRenter += toTFSA;
        rrspRenter += toRRSP;
        if (reinvestRefund && toRRSP > 0 && tauxMarg > 0) {
          const refund = toRRSP * tauxMarg;
          tfsaRenter += refund;
        }
      } else if (diff < 0) {
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

      tfsaRenter *= (1 + (rInvM || 0));
      rrspRenter *= (1 + (rInvM || 0));
      tfsaBuyer *= (1 + (rInvM || 0));
      rrspBuyer *= (1 + (rInvM || 0));

      loyerM *= (1 + (growthLoyerM || 0));

      if (m % 12 === 0) {
        const annee = m / 12;
        labels.push(String(annee));

        const valeurNetMaison = valeurMaison - fraisVente - soldeHypo;
        const buyerAfterTaxRRSP = rrspBuyer * (1 - (tauxRetrait || 0));
        const buyerNW = Math.max(0, valeurNetMaison) + tfsaBuyer + buyerAfterTaxRRSP;

        const renterAfterTaxRRSP = rrspRenter * (1 - (tauxRetrait || 0));
        const renterNW = tfsaRenter + renterAfterTaxRRSP;

        dataBuyer.push(buyerNW);
        dataRenter.push(renterNW);
      }
    }

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

    if (chartAVL) chartAVL.destroy();
    if (ctxAVL && typeof Chart !== 'undefined') {
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
});
