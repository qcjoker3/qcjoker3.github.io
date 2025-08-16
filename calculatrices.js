document.addEventListener('DOMContentLoaded', () => {
    // Charge le footer de manière dynamique
    fetch('footer.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('footer-placeholder').innerHTML = data;
        });
    
    // Fonctions utilitaires (CORRIGÉES)
    const fmtNombre = n => new Intl.NumberFormat('fr-FR', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(n);
    
    const toFloat = v => parseFloat(String(v).replace(',', '.')) || 0;

    // Déclaration unique de toutes les variables de graphiques
    let chartRetraite = null, chartVF = null, chartHypo = null, chartTrex = null, chartAcheterLouer = null;

    // --- Navigation entre calculatrices ---
    const calcCards = document.querySelectorAll('.card-grid .card[data-calc]');
    const calcSections = document.querySelectorAll('.calculator-card');
    const allExplications = document.querySelectorAll('.boite-explication');

    const showCalculator = (key) => {
        const targetSection = document.getElementById(`calc-${key}`);
        if (!targetSection) return;

        calcSections.forEach(sec => sec.classList.remove('active'));
        targetSection.classList.add('active');

        calcCards.forEach(card => card.classList.toggle('selected', card.dataset.calc === key));

        // Gère l'affichage des boîtes d'explication
        const targetExplication = document.getElementById(`explication-${key}`);
        allExplications.forEach(box => box.classList.remove('active')); // Cache toutes les boîtes
        if (targetExplication) {
            targetExplication.classList.add('active'); // Affiche la bonne boîte
        }
                
        const form = targetSection.querySelector('form');
        if (form) {
             form.dispatchEvent(new Event('submit'));
        }
    };

    calcCards.forEach(card => card.addEventListener('click', () => showCalculator(card.dataset.calc)));

    // --- Calculatrice de Retraite ---
    document.getElementById('form-retraite')?.addEventListener('submit', e => {
        e.preventDefault();
        const resultatRetraite = document.getElementById('resultat-retraite');
        const ageActuel = toFloat(document.getElementById('age-actuel').value);
        const ageRetraite = toFloat(document.getElementById('age-retraite').value);
        const epargneMensuelle = toFloat(document.getElementById('epargne-mensuelle').value);
        const rendementAnnuel = toFloat(document.getElementById('rendement').value) / 100;
        if (ageRetraite <= ageActuel) { resultatRetraite.textContent = "L'âge de retraite doit être supérieur."; return; }
        const annees = ageRetraite - ageActuel;
        const rMensuel = Math.pow(1 + rendementAnnuel, 1 / 12) - 1;
        const FV = epargneMensuelle * ((Math.pow(1 + rMensuel, annees * 12) - 1) / rMensuel);
        resultatRetraite.textContent = `Capital estimé à la retraite : ${fmtNombre(FV)}.`;
        const ctx = document.getElementById('chart-retraite')?.getContext('2d');
        if (!ctx) return;
        if (chartRetraite) chartRetraite.destroy();
        const labels = [], capitalData = [], interetData = [];
        for (let i = 0; i <= annees; i++) {
            labels.push(ageActuel + i);
            let mois = i * 12, totalInvesti = epargneMensuelle * mois;
            let valeurTotale = isFinite(rMensuel) && rMensuel !== 0 ? epargneMensuelle * ((Math.pow(1 + rMensuel, mois) - 1) / rMensuel) : totalInvesti;
            capitalData.push(totalInvesti);
            interetData.push(valeurTotale - totalInvesti);
        }
        chartRetraite = new Chart(ctx, { type: 'bar', data: { labels, datasets: [{ label: 'Capital versé', data: capitalData, backgroundColor: '#86efac' }, { label: 'Intérêts gagnés', data: interetData, backgroundColor: '#16a34a' }] }, options: { maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true, ticks: { callback: v => fmtNombre(v) } } } } });
    });

    // --- Calculatrice de Valeur Future ---
    document.getElementById('form-vf')?.addEventListener('submit', e => {
        e.preventDefault();
        const resultatVF = document.getElementById('resultat-vf');
        const montantInitial = toFloat(document.getElementById('vf-montant-initial').value);
        const duree = toFloat(document.getElementById('vf-duree').value);
        const taux = toFloat(document.getElementById('vf-taux').value) / 100;
        const cotisation = toFloat(document.getElementById('vf-cotisation').value);
        const freq = document.getElementById('vf-frequence').value;
        const m = freq === 'mensuelle' ? 12 : 1, rP = Math.pow(1 + taux, 1 / m) - 1, nP = duree * m;
        const fvTotal = (montantInitial * Math.pow(1 + rP, nP)) + (cotisation * ((Math.pow(1 + rP, nP) - 1) / rP));
        resultatVF.textContent = `Valeur future estimée : ${fmtNombre(fvTotal)}.`;
        const ctx = document.getElementById('chart-vf')?.getContext('2d');
        if (!ctx) return;
        if (chartVF) chartVF.destroy();
        const labels = [], valeurData = [];
        for (let i = 0; i <= duree; i++) {
            labels.push(`Année ${i}`);
            let nP_i = i * m;
            valeurData.push((montantInitial * Math.pow(1 + rP, nP_i)) + (cotisation * ((Math.pow(1 + rP, nP_i) - 1) / rP)));
        }
        chartVF = new Chart(ctx, { type: 'line', data: { labels, datasets: [{ label: 'Valeur du portefeuille', data: valeurData, borderColor: '#22c55e', fill: true, backgroundColor: 'rgba(34,197,94,0.1)' }] }, options: { maintainAspectRatio: false, scales: { y: { ticks: { callback: v => fmtNombre(v) } } } } });
    });

    // --- Calculatrice d'Hypothèque ---
    document.getElementById('form-hypotheque')?.addEventListener('submit', e => {
        e.preventDefault();
        const resultatHypo = document.getElementById('resultat-hypotheque');
        const montantPret = toFloat(document.getElementById('hypo-montant').value);
        const tauxHypo = toFloat(document.getElementById('hypo-taux').value) / 100;
        const dureeHypo = toFloat(document.getElementById('hypo-duree').value);
        const rMensuel = tauxHypo / 12, n = dureeHypo * 12;
        if (rMensuel <= 0) return;
        const mensualite = montantPret * rMensuel / (1 - Math.pow(1 + rMensuel, -n));
        resultatHypo.textContent = `Mensualité estimée : ${fmtNombre(mensualite)}.`;
        const ctx = document.getElementById('chart-hypotheque')?.getContext('2d');
        if (!ctx) return;
        if (chartHypo) chartHypo.destroy();
        const labels = [], capitalRestantData = [], capitalRembourseData = [];
        let capitalRestant = montantPret;
        for (let i = 0; i <= dureeHypo; i++) {
            labels.push(`Année ${i}`);
            capitalRestantData.push(capitalRestant);
            capitalRembourseData.push(montantPret - capitalRestant);
            for (let j = 0; j < 12 && capitalRestant > 0; j++) {
                let interet = capitalRestant * rMensuel;
                capitalRestant -= (mensualite - interet);
            }
        }
        chartHypo = new Chart(ctx, { type: 'bar', data: { labels, datasets: [{ label: 'Capital remboursé', data: capitalRembourseData, backgroundColor: '#86efac' }, { label: 'Capital restant dû', data: capitalRestantData, backgroundColor: '#e2e8f0' }] }, options: { maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true, ticks: { callback: v => fmtNombre(v) } } } } });
    });

    // --- Calculatrice de Frais de Gestion ---
    document.getElementById('form-trex')?.addEventListener('submit', e => {
        e.preventDefault();
        const resultatTrex = document.getElementById('resultat-trex');
        const montantInitial = toFloat(document.getElementById('trex-montant').value);
        const cotisationAnnuelle = toFloat(document.getElementById('trex-cotisation-annuelle').value);
        const duree = toFloat(document.getElementById('trex-duree').value);
        const rendementBrut = toFloat(document.getElementById('trex-rendement-brut').value) / 100;
        const fraisAnnuel = toFloat(document.getElementById('trex-taux').value) / 100;
        const rendementNet = rendementBrut - fraisAnnuel;
        const fv = (P, r, n, C) => P * Math.pow(1 + r, n) + C * ((Math.pow(1 + r, n) - 1) / r);
        const capitalAvecFrais = fv(montantInitial, rendementNet, duree, cotisationAnnuelle);
        const capitalSansFrais = fv(montantInitial, rendementBrut, duree, cotisationAnnuelle);
        resultatTrex.textContent = `Impact des frais : ${fmtNombre(capitalSansFrais - capitalAvecFrais)}. Valeur finale : ${fmtNombre(capitalAvecFrais)}.`;
        const ctx = document.getElementById('chart-trex')?.getContext('2d');
        if (!ctx) return;
        if (chartTrex) chartTrex.destroy();
        chartTrex = new Chart(ctx, { type: 'bar', data: { labels: ['Avec Frais', 'Sans Frais (Potentiel)'], datasets: [{ label: 'Valeur finale', data: [capitalAvecFrais, capitalSansFrais], backgroundColor: ['#16a34a', '#86efac'] }] }, options: { maintainAspectRatio: false, scales: { y: { ticks: { callback: v => fmtNombre(v) } } } } });
    });
    
    // --- Calculatrice Acheter ou Louer ---
    document.getElementById('form-acheter-louer')?.addEventListener('submit', e => {
        e.preventDefault();
        const val = id => toFloat(document.getElementById(id).value);
        const pct = id => val(id) / 100;
        const sel = id => document.getElementById(id).value;
        const prixPropriete = val('al-prix-propriete');
        const miseDeFonds = val('al-mise-de-fonds');
        const tauxHypoAnnuel = pct('al-taux-hypotheque');
        const amortissement = val('al-amortissement');
        const taxesAnnuelles = val('al-taxes-annuelles');
        const entretienPct = pct('al-entretien-annuel');
        const assuranceProprioM = val('al-assurance-proprio');
        const fraisCondoM = val('al-frais-condo');
        let loyerMensuel = val('al-loyer-mensuel');
        const assuranceLocM = val('al-assurance-loc');
        const horizon = val('al-horizon');
        const croissanceImmo = pct('al-croissance-immo');
        const augmentationLoyer = pct('al-augmentation-loyer');
        const rendementPlacement = pct('al-rendement-placement');
        const typeCompte = sel('al-type-compte');
        const tauxMarginal = pct('al-taux-marginal');
        const montantPret = prixPropriete - miseDeFonds;
        const tauxHypoMensuel = tauxHypoAnnuel / 12;
        const nbPaiements = amortissement * 12;
        if (tauxHypoMensuel <= 0) return;
        const paiementHypothecaire = montantPret * tauxHypoMensuel / (1 - Math.pow(1 + tauxHypoMensuel, -nbPaiements));
        let valeurPropriete = prixPropriete;
        let soldeHypotheque = montantPret;
        let portefeuilleLocataire = miseDeFonds;
        let retourImpotPrecedent = 0;
        const labels = ['Année 0'];
        const dataProprio = [miseDeFonds];
        const dataLocataire = [portefeuilleLocataire];
        for (let an = 1; an <= horizon; an++) {
            portefeuilleLocataire += retourImpotPrecedent;
            for (let mois = 1; mois <= 12; mois++) {
                let interetMois = soldeHypotheque * tauxHypoMensuel;
                soldeHypotheque -= (paiementHypothecaire - interetMois);
            }
            const coutsProprio = (paiementHypothecaire * 12) + taxesAnnuelles + (prixPropriete * entretienPct) + (assuranceProprioM * 12) + (fraisCondoM * 12);
            const coutsLocataire = (loyerMensuel * 12) + (assuranceLocM * 12);
            const investissementAnnuel = Math.max(0, coutsProprio - coutsLocataire);
            if (typeCompte === 'reer') {
            retourImpotPrecedent = investissementAnnuel * tauxMarginal;
            } else {
            retourImpotPrecedent = 0; // Important: remettre à zéro si le type de compte n'est pas REER
            }
            portefeuilleLocataire += investissementAnnuel;
            let gainPlacement = portefeuilleLocataire * rendementPlacement;
            if (typeCompte === 'non-enregistre') {
                gainPlacement *= (1 - (tauxMarginal * 0.5));
            }
            portefeuilleLocataire += gainPlacement;
            valeurPropriete *= (1 + croissanceImmo);
            labels.push(`Année ${an}`);
            dataProprio.push(valeurPropriete - soldeHypotheque);
            if (typeCompte === 'reer') {
                dataLocataire.push(portefeuilleLocataire * (1 - tauxMarginal));
            } else {
                dataLocataire.push(portefeuilleLocataire);
            }
            loyerMensuel *= (1 + augmentationLoyer);
        }
        const resultatFinalProprio = dataProprio[dataProprio.length - 1];
        const resultatFinalLocataire = dataLocataire[dataLocataire.length - 1];
        const difference = resultatFinalProprio - resultatFinalLocataire;
        
        document.getElementById('resultat-acheter-louer').textContent = `Après ${horizon} ans, l'actif net du propriétaire est de ${fmtNombre(resultatFinalProprio)} et celui du locataire de ${fmtNombre(resultatFinalLocataire)}. Différence : ${fmtNombre(difference)} en faveur du ${difference > 0 ? 'propriétaire' : 'locataire'}.`;
        
        const ctx = document.getElementById('chart-acheter-louer')?.getContext('2d');
        if (!ctx) return;
        if (chartAcheterLouer) chartAcheterLouer.destroy();
        chartAcheterLouer = new Chart(ctx, { 
            type: 'line', 
            data: { 
                labels, 
                datasets: [
                    { label: 'Actif Net Propriétaire', data: dataProprio, borderColor: '#16a34a', backgroundColor: 'rgba(22, 163, 74, 0.1)', fill: true }, 
                    { label: 'Actif Net Locataire', data: dataLocataire, borderColor: '#f97316', backgroundColor: 'rgba(249, 115, 22, 0.1)', fill: true }
                ] 
            }, 
            options: { 
                maintainAspectRatio: false, 
                scales: { 
                    y: { ticks: { callback: value => fmtNombre(value) } } 
                } 
            } 
        });
    });

    // Affichage initial
    showCalculator('retraite');
});
