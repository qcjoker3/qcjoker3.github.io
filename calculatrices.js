document.addEventListener('DOMContentLoaded', () => {
  const $ = (id) => document.getElementById(id);
  const fmtMoney = (n) =>
    new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);

  // Convertit un rendement annuel en rendement mensuel équivalent
  const annualToMonthly = (annualPct) => {
    const a = Number(annualPct) / 100;
    return Math.pow(1 + a, 1 / 12) - 1;
  };

  // Valeur future d'une rente de versements mensuels C pendant n mois, au taux mensuel r
  const fvSeries = (C, r, n) => {
    if (C <= 0 || n <= 0) return 0;
    if (Math.abs(r) < 1e-12) return C * n;
    return C * (Math.pow(1 + r, n) - 1) / r;
  };

  // Nombre de mois nécessaires pour atteindre un capital cible avec versements C et taux mensuel r
  const monthsToReachTarget = (target, C, r) => {
    if (target <= 0) return 0;
    if (C <= 0) return Infinity;
    if (Math.abs(r) < 1e-12) return Math.ceil(target / C); // pas de rendement, c'est linéaire
    const rhs = 1 + (target * r) / C;
    if (rhs <= 0) return Infinity;
    const n = Math.log(rhs) / Math.log(1 + r);
    return Math.max(0, Math.ceil(n));
  };

  const form = $('form-retraite');
  const out = $('resultat');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    out.textContent = '';

    const ageActuel = parseInt($('age-actuel').value, 10);
    const ageRetraite = parseInt($('age-retraite').value, 10);
    const epargneMensuelle = Number($('epargne-mensuelle').value);
    const rendementAnnuel = Number($('rendement-annuel').value);
    const capitalCible = Number($('capital-cible').value || 0);

    // Validations
    if (!Number.isFinite(ageActuel) || ageActuel < 0 ||
        !Number.isFinite(ageRetraite) || ageRetraite <= ageActuel) {
      out.textContent = "Vérifie les âges: l'âge de retraite doit être supérieur à l'âge actuel.";
      return;
    }
    if (!Number.isFinite(epargneMensuelle) || epargneMensuelle <= 0) {
      out.textContent = "L'épargne mensuelle doit être positive.";
      return;
    }
    if (!Number.isFinite(rendementAnnuel)) {
      out.textContent = "Le rendement annuel attendu doit être un nombre.";
      return;
    }

    // Paramètres calcul
    const months = (ageRetraite - ageActuel) * 12;
    const r = annualToMonthly(rendementAnnuel);

    // Valeur accumulée à l'âge désiré
    const capitalRetraite = fvSeries(epargneMensuelle, r, months);

    let message = `À ${ageRetraite} ans, en épargnant ${fmtMoney(epargneMensuelle)} par mois ` +
                  `avec un rendement annuel de ${rendementAnnuel.toFixed(2)}%, ` +
                  `tu pourrais accumuler environ ${fmtMoney(capitalRetraite)}.`;

    // Si un capital cible est fourni, calcule l’âge minimal pour l’atteindre
    if (Number.isFinite(capitalCible) && capitalCible > 0) {
      const nNeeded = monthsToReachTarget(capitalCible, epargneMensuelle, r);
      if (!Number.isFinite(nNeeded) || nNeeded === Infinity) {
        message += `\n\nAvec une épargne de ${fmtMoney(epargneMensuelle)}/mois, le capital cible est inatteignable sans rendement positif.`;
      } else {
        const yearsNeeded = Math.floor(nNeeded / 12);
        const monthsRemainder = nNeeded % 12;
        const ageMinYears = ageActuel + yearsNeeded + (monthsRemainder > 0 ? 1 : 0);
        const ageMinLabel = monthsRemainder > 0
          ? `${ageActuel + yearsNeeded} ans et ${monthsRemainder} mois (≈ ${ageMinYears} ans)`
          : `${ageActuel + yearsNeeded} ans`;

        message += `\n\nCapital cible: ${fmtMoney(capitalCible)}.` +
                   `\nÂge minimal pour l'atteindre: ${ageMinLabel}.`;

        // Comparaison avec l’âge désiré
        if (nNeeded <= months) {
          message += `\nBonne nouvelle: à ${ageRetraite} ans, ton capital (${fmtMoney(capitalRetraite)}) dépasse la cible.`;
        } else {
          const manque = Math.max(0, capitalCible - capitalRetraite);
          message += `\nÀ ${ageRetraite} ans, il manquerait environ ${fmtMoney(manque)} pour atteindre la cible.`;
        }
      }
    }

    out.textContent = message;
  });
});
