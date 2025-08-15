document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================
  // 🧰 Fonctions utilitaires
  // ==========================================================
  const fmtCurrency = n =>
    new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 2
    }).format(n);

  const toFloat = v => {
    const n = parseFloat(String(v).replace(',', '.'));
    return Number.isFinite(n) ? n : NaN;
  };

  const parseNum = v =>
    parseFloat(String(v ?? '').replace(/\s/g, '').replace(',', '.')) || 0;

  const annualToMonthlyRate = a => {
    const r = parseNum(a) / 100;
    return Math.pow(1 + r, 1 / 12) - 1;
  };

  // ==========================================================
  // 🎯 Références Chart.js
  // ==========================================================
  let chartRetraite = null;
  let chartVF = null;
  let chartHypo = null;
  let chartTrex = null;
  let chartAVL = null;

  // ==========================================================
  // 📌 Navigation entre calculatrices
  // ==========================================================
  const calcCards = document.querySelectorAll('.card.card-link[data-calc]');
  const calcSections = document.querySelectorAll('.calculator-card');

  calcCards.forEach(card => {
    card.addEventListener('click', () => {
      calcCards.forEach(c => {
        c.classList.remove('selected');
        c.setAttribute('aria-selected', 'false');
      });
      card.classList.add('selected');
      card.setAttribute('aria-selected', 'true');

      const key = card.dataset.calc;
      calcSections.forEach(sec => {
        sec.classList.remove('active');
        sec.setAttribute('aria-hidden', 'true');
      });
      const target = document.getElementById(`calc-${key}`);
      if (target) {
        target.classList.add('active');
        target.setAttribute('aria-hidden', 'false');
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        try { localStorage.setItem('calc:selected', key); } catch {}
        history.replaceState(null, '', `#${key}`);
      }
    });

    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });

  const hashKey = location.hash.replace('#', '');
  const storedKey = localStorage.getItem('calc:selected');
  const initialKey = hashKey || storedKey;
  if (initialKey) {
    const card = Array.from(calcCards).find(c => c.dataset.calc === initialKey);
    card?.click();
  }

  // ==========================================================
  // 🧮 Calculatrice — Retraite
  // ==========================================================
  const formRetraite = document.getElementById('form-retraite');
  formRetraite?.addEventListener('submit', e => {
    e.preventDefault();
    const resultatRetraite = document.getElementById('resultat-retraite');
    const ctxRetraite = document.getElementById('chart-retraite')?.getContext('2d');

    const ageActuel = parseInt(document.getElementById('age-actuel').value);
    const ageRetraite = parseInt(document.getElementById('age-retraite').value);
    const epargneMensuelle = toFloat(document.getElementById('epargne-mensuelle').value);
    const rendementAnnuel = toFloat(document.getElementById('rendement').value) / 100;

    if (!Number.isFinite(ageActuel) || !Number.isFinite(ageRetraite) || !Number.isFinite(epargneMensuelle) || !Number.isFinite(rendementAnnuel)) {
      resultatRetraite.textContent = 'Veuillez remplir tous les champs correctement.';
      return;
    }
    if (ageRetraite <= ageActuel) {
      resultatRetraite.textContent = "L'âge de retraite doit être supérieur à l'âge actuel.";
      return;
    }

    const annees = ageRetraite - ageActuel;
    const rMensuel = Math.pow(1 + rendementAnnuel, 1 / 12) - 1;
    const FV = Math.abs(rMensuel) < 1e-12 ?
      epargneMensuelle * 12 * annees :
      epargneMensuelle * ((Math.pow(1 + rMensuel, annees * 12) - 1) / rMensuel);

    resultatRetraite.textContent = `En économisant ${fmtCurrency(epargneMensuelle)} par mois pendant ${annees} ans avec un rendement annuel de ${(rendementAnnuel * 100).toFixed(2)}%, vous aurez environ ${fmtCurrency(FV)}.`;

    if (!ctxRetraite) return;

    const labels = [], dataEpargne = [], dataInteret = [];
    for (let year = 1; year <= annees; year++) {
        const mois = year * 12;
        const fvAnnee = Math.abs(rMensuel) < 1e-12 ?
            epargneMensuelle * mois :
            epargneMensuelle * ((Math.pow(1 + rMensuel, mois) - 1) / rMensuel);
        const epargneSansInteret = epargneMensuelle * mois;
        labels.push(`Année ${year}`);
        dataEpargne.push(epargneSansInteret);
        dataInteret.push(Math.max(0, fvAnnee - epargneSansInteret));
    }

    if (chartRetraite) chartRetraite.destroy();
    chartRetraite = new Chart(ctxRetraite, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                { label: 'Épargne (Capital)', data: dataEpargne, backgroundColor: '#00c48c', stack: 'stack' },
                { label: 'Intérêts générés', data: dataInteret, backgroundColor: '#00a678', stack: 'stack' }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'top' }, title: { display: true, text: "Croissance de l'épargne retraite" } },
            scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } }
        }
    });
  });

  // ==========================================================
  // 📈 Calculatrice — Valeur future
  // ==========================================================
  const formVF = document.getElementById('form-vf');
  formVF?.addEventListener('submit', e => {
    e.preventDefault();
    const resultatVF = document.getElementById('resultat-vf');
    const ctxVF = document.getElementById('chart-vf')?.getContext('2d');

    const montantInitial = toFloat(document.getElementById('vf-montant-initial').value);
    const duree = parseInt(document.getElementById('vf-duree').value);
    const taux = toFloat(document.getElementById('vf-taux').value) / 100;
    const cotisation = toFloat(document.getElementById('vf-cotisation').value) || 0;
    const freq = document.getElementById('vf-frequence').value || 'annuelle';

    if (!Number.isFinite(montantInitial) || !Number.isFinite(duree) || !Number.isFinite(taux)) {
      resultatVF.textContent = 'Veuillez remplir tous les champs correctement.';
      return;
    }
    
    const m = freq === 'mensuelle' ? 12 : freq === 'hebdomadaire' ? 52 : 1;
    const rP = Math.pow(1 + taux, 1 / m) - 1;
    const nP = duree * m;

    const FV_initial = montantInitial * Math.pow(1 + rP, nP);
    const FV_cot = Math.abs(rP) < 1e-12 ? cotisation * nP : cotisation * ((Math.pow(1 + rP, nP) - 1) / rP);

    const FV_total = FV_initial + FV_cot;

    resultatVF.textContent = `Après ${duree} ans, votre investissement vaudra environ ${fmtCurrency(FV_total)}.`;

    if (!ctxVF) return;

    const labels = [], dataCapital = [];
    for (let year = 0; year <= duree; year++) {
        const periodsY = year * m;
        const FV_init_y = montantInitial * Math.pow(1 + rP, periodsY);
        const FV_cot_y = Math.abs(rP) < 1e-12 ? cotisation * periodsY : cotisation * ((Math.pow(1 + rP, periodsY) - 1) / rP);
        labels.push(year.toString());
        dataCapital.push(FV_init_y + FV_cot_y);
    }

    if (chartVF) chartVF.destroy();
    chartVF = new Chart(ctxVF, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Valeur future',
                data: dataCapital,
                borderColor: '#00c48c',
                backgroundColor: 'rgba(0,196,140,0.2)',
                fill: true,
                tension: 0.3
            }]
        },
        options: { responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Évolution de la valeur future' } }, scales: { y: { beginAtZero: true } } }
    });
  });

  // ==========================================================
  // 🏠 Calculatrice — Hypothèque
  // ==========================================================
  const formHypo = document.getElementById('form-hypotheque');
  formHypo?.addEventListener('submit', e => {
    e.preventDefault();
    const resultatHypo = document.getElementById('resultat-hypotheque');
    const ctxHypo = document.getElementById('chart-hypotheque')?.getContext('2d');

    const montantPret = toFloat(document.getElementById('hypo-montant').value);
    const tauxHypo = toFloat(document.getElementById('hypo-taux').value) / 100;
    const dureeHypo = parseInt(document.getElementById('hypo-duree').value);

    if (!Number.isFinite(montantPret) || !Number.isFinite(tauxHypo) || !Number.isFinite(dureeHypo) || montantPret <= 0 || dureeHypo <= 0) {
      resultatHypo.textContent = 'Veuillez remplir tous les champs avec des valeurs positives.';
      return;
    }

    const rMensuel = tauxHypo / 12;
    const n = dureeHypo * 12;
    const mensualite = Math.abs(rMensuel) < 1e-12 ? montantPret / n : montantPret * (rMensuel * Math.pow(1 + rMensuel, n)) / (Math.pow(1 + rMensuel, n) - 1);

    resultatHypo.textContent = `Mensualité estimée : ${fmtCurrency(mensualite)} sur ${dureeHypo} ans.`;
    
    if (!ctxHypo) return;

    let capitalRestant = montantPret;
    const labels = [], dataCapitalRestant = [], dataCapitalPaye = [];
    for (let an = 0; an <= dureeHypo; an++) {
        labels.push(an.toString());
        dataCapitalRestant.push(capitalRestant);
        dataCapitalPaye.push(montantPret - capitalRestant);
        for(let mois = 0; mois < 12; mois++){
            const interetMois = capitalRestant * rMensuel;
            const capitalMois = Math.min(mensualite - interetMois, capitalRestant);
            capitalRestant = Math.max(0, capitalRestant - capitalMois);
        }
    }

    if (chartHypo) chartHypo.destroy();
    chartHypo = new Chart(ctxHypo, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                { label: 'Capital remboursé', data: dataCapitalPaye, backgroundColor: '#00c48c' },
                { label: 'Capital restant dû', data: dataCapitalRestant, backgroundColor: '#e6ecf1' }
            ]
        },
        options: { responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Amortissement du prêt' } }, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } } }
    });
  });

  // ==========================================================
  // 🦖 Calculatrice — Frais de gestion (T-Rex)
  // ==========================================================
  const formTrex = document.getElementById('form-trex');
  formTrex?.addEventListener('submit', e => {
    e.preventDefault();
    const resultatTrex = document.getElementById('resultat-trex');
    const ctxTrex = document.getElementById('chart-trex')?.getContext('2d');

    const montantInitial = toFloat(document.getElementById('trex-montant').value);
    const cotisationAnnuelle = toFloat(document.getElementById('trex-cotisation-annuelle').value) || 0;
    const duree = parseInt(document.getElementById('trex-duree').value);
    const rendementBrut = toFloat(document.getElementById('trex-rendement-brut').value) / 100;
    const fraisAnnuel = toFloat(document.getElementById('trex-taux').value) / 100;

    if (!Number.isFinite(montantInitial) || !Number.isFinite(duree) || !Number.isFinite(rendementBrut) || !Number.isFinite(fraisAnnuel)) {
      resultatTrex.textContent = 'Veuillez remplir tous les champs correctement.';
      return;
    }

    const rendementNet = rendementBrut - fraisAnnuel;
    const fv = (P, r, n, C) => Math.abs(r) < 1e-12 ? P + C * n : P * Math.pow(1 + r, n) + C * ((Math.pow(1 + r, n) - 1) / r);

    const capitalAvecFrais = fv(montantInitial, rendementNet, duree, cotisationAnnuelle);
    const capitalSansFrais = fv(montantInitial, rendementBrut, duree, cotisationAnnuelle);
    const perteDueAuxFrais = capitalSansFrais - capitalAvecFrais;

    resultatTrex.textContent = `Après ${duree} ans, les frais de ${(fraisAnnuel * 100).toFixed(2)}% vous auront coûté ${fmtCurrency(perteDueAuxFrais)}. Valeur finale: ${fmtCurrency(capitalAvecFrais)}.`;
    
    if (!ctxTrex) return;

    if (chartTrex) chartTrex.destroy();
    chartTrex = new Chart(ctxTrex, {
        type: 'bar',
        data: {
            labels: ['Avec frais', 'Sans frais (potentiel)'],
            datasets: [{
                label: 'Valeur finale',
                data: [capitalAvecFrais, capitalSansFrais],
                backgroundColor: ['#00a678', '#00c48c']
            }]
        },
        options: { responsive: true, plugins: { legend: { display: false }, title: { display: true, text: "Impact des frais sur la valeur finale" } }, scales: { y: { beginAtZero: true } } }
    });
  });

// ============================================================================
// Louer vs Acheter — corrigé et renforcé
// ============================================================================
const formAVL = document.getElementById('form-avl');
const resAVL = document.getElementById('resultat-avl');
const ctxAVL = document.getElementById('chart-avl')?.getContext('2d');
let chartAVL = null;

formAVL?.addEventListener('submit', (e) => {
  e.preventDefault();

  // --------- Helpers d'extraction sûrs ----------
  const num = (id) => parseNum(document.getElementById(id)?.value);
  const pct = (id) => (num(id) / 100) || 0;
  const chk = (id, fallback = true) => document.getElementById(id)?.checked ?? fallback;

  // --------- Paramètres de base ----------
  const years = num('avl-horizon');
  const months = Math.max(1, Math.round(years * 12));

  const price = num('avl-prix');
  const down = num('avl-mise-fonds');
  const rateHypoM = annualToMonthlyRate(document.getElementById('avl-taux-hypo')?.value || 0);
  const amortYears = num('avl-amortissement');
  const amortMonths = Math.max(1, Math.round(amortYears * 12));

  // --------- Propriétaire — coûts ----------
  const fraisAchatPct = pct('avl-frais-achat');
  const taxesFoncieresPctA = pct('avl-taxes-foncieres');
  const entretienPctA = pct('avl-entretien');
  const assurMaisonM = num('avl-assurance-maison') || 0;
  const coproM = num('avl-copro') || 0;
  const growthImmoM = pctToMonthly(document.getElementById('avl-croissance-immobilier')?.value || 0) || 0;
  const fraisVentePct = pct('avl-frais-vente');

  // --------- Locataire ----------
  let loyerM = num('avl-loyer');
  const growthLoyerM = pctToMonthly(document.getElementById('avl-croissance-loyer')?.value || 0) || 0;
  const assurLocM = num('avl-assurance-loc') || 0;

  // --------- Investissements / fiscalité ----------
  const rInvM = annualToMonthlyRate(document.getElementById('avl-rendement')?.value || 0) || 0;
  let allocTFSA = (num('avl-alloc-tfsa') / 100) || 0;
  let allocRRSP = (num('avl-alloc-rrsp') / 100) || 0;
  if (allocTFSA + allocRRSP <= 0) { allocTFSA = 1; allocRRSP = 0; }
  const totalAlloc = allocTFSA + allocRRSP;
  allocTFSA /= totalAlloc;
  allocRRSP /= totalAlloc;

  const tauxMarg = (num('avl-taux-marginal') / 100) || 0;
  const tauxRetrait = (num('avl-taux-retrait') / 100) || 0;
  const reinvestRefund = chk('avl-reinvest-remboursement', true);

  // --------- Validations ----------
  if (!Number.isFinite(years) || years <= 0 ||
      !Number.isFinite(price) || price <= 0 ||
      !Number.isFinite(down) || down < 0 ||
      !Number.isFinite(amortYears) || amortYears <= 0) {
    resAVL.textContent = "Veuillez remplir les champs essentiels correctement.";
    return;
  }
  if (down > price) {
    resAVL.textContent = "La mise de fonds ne peut pas excéder le prix d’achat.";
    return;
  }
  if (!Number.isFinite(loyerM) || loyerM < 0) {
    resAVL.textContent = "Veuillez fournir un loyer valide (>= 0).";
    return;
  }

  // --------- Hypothèque ----------
  const principal0 = Math.max(0, price - down);
  const r = rateHypoM;
  const n = amortMonths;
  const paymentM = Math.abs(r) < 1e-12
    ? (principal0 / n)
    : principal0 * (r / (1 - Math.pow(1 + r, -n)));

  // --------- États initiaux ----------
  let valeurMaison = price;
  let soldeHypo = principal0;

  let tfsaBuyer = 0, rrspBuyer = 0;
  let tfsaRenter = 0, rrspRenter = 0;

  const fraisInit = price * fraisAchatPct;
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

  const labels = [];
  const dataBuyer = [];
  const dataRenter = [];

  // --------- Simulation mois par mois ----------
  for (let m = 1; m <= months; m++) {
    // Valeur maison et coûts proportionnels
    valeurMaison *= (1 + growthImmoM);
    const taxesM = (valeurMaison * taxesFoncieresPctA) / 12;
    const entretienM = (valeurMaison * entretienPctA) / 12;

    // Hypothèque
    const interetM = soldeHypo > 0 ? soldeHypo * r : 0;
    let principalM = 0;
    let versementHypo = 0;

    if (soldeHypo > 0) {
      if (Math.abs(r) < 1e-12) {
        principalM = Math.min(paymentM, soldeHypo);
        versementHypo = principalM;
      } else {
        // Paiement constant, mais protège la dernière échéance
        versementHypo = Math.min(paymentM, soldeHypo + interetM);
        principalM = Math.max(0, versementHypo - interetM);
      }
      soldeHypo = Math.max(0, soldeHypo - principalM);
    }

    const coutBuyerM = versementHypo + taxesM + entretienM + (assurMaisonM || 0) + (coproM || 0);
    const coutRenterM = loyerM + (assurLocM || 0);
    const diff = coutBuyerM - coutRenterM;

    if (diff > 0) {
      // Locataire investit la différence
      const toTFSA = diff * allocTFSA;
      const toRRSP = diff * allocRRSP;
      tfsaRenter += toTFSA;
      rrspRenter += toRRSP;
      if (reinvestRefund && toRRSP > 0 && tauxMarg > 0) {
        const refund = toRRSP * tauxMarg;
        tfsaRenter += refund;
      }
    } else if (diff < 0) {
      // Acheteur investit la différence
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

    // Croissance des portefeuilles
    tfsaRenter *= (1 + rInvM);
    rrspRenter *= (1 + rInvM);
    tfsaBuyer  *= (1 + rInvM);
    rrspBuyer  *= (1 + rInvM);

    // Loyer indexé
    loyerM *= (1 + growthLoyerM);

    // Échantillon annuel pour le graphe
    if (m % 12 === 0) {
      const valeurNetMaison = valeurMaison - (valeurMaison * fraisVentePct) - soldeHypo;
      const buyerAfterTaxRRSP = rrspBuyer * (1 - (tauxRetrait || 0));
      const renterAfterTaxRRSP = rrspRenter * (1 - (tauxRetrait || 0));

      const buyerNW = Math.max(0, valeurNetMaison) + tfsaBuyer + buyerAfterTaxRRSP;
      const renterNW = tfsaRenter + renterAfterTaxRRSP;

      labels.push(`Année ${m / 12}`);
      dataBuyer.push(buyerNW);
      dataRenter.push(renterNW);
    }
  }

  // --------- Valeurs finales ----------
  const valeurNetMaisonFinale = (valeurMaison * (1 - fraisVentePct)) - soldeHypo;
  const buyerAfterTaxRRSPF = rrspBuyer * (1 - (tauxRetrait || 0));
  const renterAfterTaxRRSPF = rrspRenter * (1 - (tauxRetrait || 0));

  const buyerNWFinal = Math.max(0, valeurNetMaisonFinale) + tfsaBuyer + buyerAfterTaxRRSPF;
  const renterNWFinal = tfsaRenter + renterAfterTaxRRSPF;
  const ecart = buyerNWFinal - renterNWFinal;

  resAVL.textContent =
    `Actif net acheteur: ${fmtCurrency(buyerNWFinal)} | ` +
    `Actif net locataire: ${fmtCurrency(renterNWFinal)} | ` +
    `Écart: ${fmtCurrency(ecart)} (positif = avantage à l’achat).`;

  // --------- Graphe ----------
  if (!ctxAVL) return;

  if (chartAVL) chartAVL.destroy();
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
      resizeDelay: 200,
      plugins: {
        legend: { position: 'top' },
        title: { display: true, text: 'Évolution de l’actif net — Acheter vs Louer' }
      },
      scales: { y: { beginAtZero: false } }
    }
  });
});

