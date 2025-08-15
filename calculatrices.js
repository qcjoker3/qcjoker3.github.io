document.addEventListener('DOMContentLoaded', () => {
    // Fonctions utilitaires
    const fmtNombre = n => new Intl.NumberFormat('fr-FR', { 
    maximumFractionDigits: 0 // On arrondit à l'entier le plus proche
}).format(n);
    const toFloat = v => parseFloat(String(v).replace(',', '.')) || 0;

    // --- Variables pour stocker les instances de graphiques ---
    let chartRetraite = null;
    let chartVF = null;
    let chartHypo = null;
    let chartTrex = null;

    // --- Navigation entre calculatrices ---
    const calcCards = document.querySelectorAll('.card-grid .card[data-calc]');
    const calcSections = document.querySelectorAll('.calculator-card');

    const showCalculator = (key) => {
        const targetSection = document.getElementById(`calc-${key}`);
        if (!targetSection) return;

        calcSections.forEach(sec => sec.classList.remove('active'));
        targetSection.classList.add('active');

        calcCards.forEach(card => {
            card.classList.toggle('selected', card.dataset.calc === key);
        });
        
        // Déclenche le calcul pour afficher le graphique de la section visible
        targetSection.querySelector('form')?.dispatchEvent(new Event('submit'));
    };

    calcCards.forEach(card => {
        card.addEventListener('click', () => {
            showCalculator(card.dataset.calc);
        });
    });

    // --- Logique des calculatrices ---

    // Calculatrice — Retraite
    document.getElementById('form-retraite')?.addEventListener('submit', e => {
        e.preventDefault();
        const resultatRetraite = document.getElementById('resultat-retraite');
        const ageActuel = toFloat(document.getElementById('age-actuel').value);
        const ageRetraite = toFloat(document.getElementById('age-retraite').value);
        const epargneMensuelle = toFloat(document.getElementById('epargne-mensuelle').value);
        const rendementAnnuel = toFloat(document.getElementById('rendement').value) / 100;

        if (ageRetraite <= ageActuel) { /* ... (validation) ... */ return; }

        const annees = ageRetraite - ageActuel;
        const rMensuel = Math.pow(1 + rendementAnnuel, 1 / 12) - 1;
        const FV = epargneMensuelle * ((Math.pow(1 + rMensuel, annees * 12) - 1) / rMensuel);
        resultatRetraite.textContent = `Capital estimé à la retraite : ${fmtNombre(FV)}.`;

        // Logique du graphique
        const ctx = document.getElementById('chart-retraite').getContext('2d');
        if (chartRetraite) chartRetraite.destroy();
        
        const labels = [];
        const capitalData = [];
        const interetData = [];
        for (let i = 0; i <= annees; i++) {
            labels.push(ageActuel + i);
            let mois = i * 12;
            let totalInvesti = epargneMensuelle * mois;
            let valeurTotale = epargneMensuelle * ((Math.pow(1 + rMensuel, mois) - 1) / rMensuel);
            capitalData.push(totalInvesti);
            interetData.push(valeurTotale - totalInvesti);
        }
        
        chartRetraite = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Capital versé', data: capitalData, backgroundColor: '#00c48c' },
                    { label: 'Intérêts gagnés', data: interetData, backgroundColor: '#00a678' }
                ]
            },
            options: { 
                maintainAspectRatio: false, // <-- AJOUTEZ CETTE LIGNE
                scales: { x: { stacked: true }, y: { stacked: true, ticks: { callback: v => fmtNombre(v) } } } 
            } 
        });
    });

    // Calculatrice — Valeur future
    document.getElementById('form-vf')?.addEventListener('submit', e => {
        e.preventDefault();
        const resultatVF = document.getElementById('resultat-vf');
        // ... (récupération des valeurs) ...
        const montantInitial = toFloat(document.getElementById('vf-montant-initial').value);
        const duree = toFloat(document.getElementById('vf-duree').value);
        const taux = toFloat(document.getElementById('vf-taux').value) / 100;
        const cotisation = toFloat(document.getElementById('vf-cotisation').value);
        const freq = document.getElementById('vf-frequence').value;
        
        const m = freq === 'mensuelle' ? 12 : 1;
        const rP = Math.pow(1 + taux, 1 / m) - 1;
        const nP = duree * m;
        const FV_initial = montantInitial * Math.pow(1 + rP, nP);
        const FV_cot = cotisation * ((Math.pow(1 + rP, nP) - 1) / rP);
        resultatVF.textContent = `Valeur future estimée : ${fmtNombre(FV_initial + FV_cot)}.`;

        // Logique du graphique
        const ctx = document.getElementById('chart-vf').getContext('2d');
        if (chartVF) chartVF.destroy();

        const labels = [];
        const valeurData = [];
        for (let i = 0; i <= duree; i++) {
            labels.push(`Année ${i}`);
            let nP_i = i * m;
            let fv_init_i = montantInitial * Math.pow(1 + rP, nP_i);
            let fv_cot_i = cotisation * ((Math.pow(1 + rP, nP_i) - 1) / rP);
            valeurData.push(fv_init_i + fv_cot_i);
        }
        
        chartVF = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{ label: 'Valeur du portefeuille', data: valeurData, borderColor: '#00c48c', fill: true, backgroundColor: 'rgba(0,196,140,0.1)' }]
            },
            options: { 
                maintainAspectRatio: false, // <-- AJOUTEZ CETTE LIGNE
                scales: { y: { ticks: { callback: v => fmtNombre(v) } } } 
            } 
        });
    });

    // Calculatrice — Hypothèque
    document.getElementById('form-hypotheque')?.addEventListener('submit', e => {
        e.preventDefault();
        const resultatHypo = document.getElementById('resultat-hypotheque');
        const montantPret = toFloat(document.getElementById('hypo-montant').value);
        const tauxHypo = toFloat(document.getElementById('hypo-taux').value) / 100;
        const dureeHypo = toFloat(document.getElementById('hypo-duree').value);

        const rMensuel = tauxHypo / 12;
        const n = dureeHypo * 12;
        const mensualite = montantPret * (rMensuel * Math.pow(1 + rMensuel, n)) / (Math.pow(1 + rMensuel, n) - 1);
        resultatHypo.textContent = `Mensualité estimée : ${fmtNombre(mensualite)}.`;

        // Logique du graphique
        const ctx = document.getElementById('chart-hypotheque').getContext('2d');
        if (chartHypo) chartHypo.destroy();
        
        const labels = [];
        const capitalRestantData = [];
        const capitalRembourseData = [];
        let capitalRestant = montantPret;
        for (let i = 0; i <= dureeHypo; i++) {
            labels.push(`Année ${i}`);
            capitalRestantData.push(capitalRestant);
            capitalRembourseData.push(montantPret - capitalRestant);
            for (let j = 0; j < 12; j++) {
                let interet = capitalRestant * rMensuel;
                let principal = mensualite - interet;
                capitalRestant -= principal;
            }
        }

        chartHypo = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Capital remboursé', data: capitalRembourseData, backgroundColor: '#00c48c' },
                    { label: 'Capital restant dû', data: capitalRestantData, backgroundColor: '#e2e8f0' }
                ]
            },
            options: { 
                maintainAspectRatio: false, // <-- AJOUTEZ CETTE LIGNE
                scales: { x: { stacked: true }, y: { stacked: true, ticks: { callback: v => fmtNombre(v) } } } 
            } 
        });
    });

    // Calculatrice — Frais de gestion
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
        
        // Logique du graphique
        const ctx = document.getElementById('chart-trex').getContext('2d');
        if (chartTrex) chartTrex.destroy();

        chartTrex = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Avec Frais', 'Sans Frais (Potentiel)'],
                datasets: [{
                    label: 'Valeur finale du portefeuille',
                    data: [capitalAvecFrais, capitalSansFrais],
                    backgroundColor: ['#00a678', '#00c48c']
                }]
            },
            options: { 
                maintainAspectRatio: false, // <-- AJOUTEZ CETTE LIGNE
                scales: { y: { ticks: { callback: v => fmtNombre(v) } } } 
            } 
        });
    });
    
    // Affichage initial
    showCalculator('retraite');
    
    // À ajouter à la fin de votre fichier calculatrices.js, à l'intérieur de l'événement DOMContentLoaded

let chartAcheterLouer = null; // Variable pour le graphique

document.getElementById('form-acheter-louer')?.addEventListener('submit', e => {
    e.preventDefault();

    // --- Fonctions d'aide pour la lecture des valeurs ---
    const val = id => toFloat(document.getElementById(id).value);
    const pct = id => val(id) / 100;
    const sel = id => document.getElementById(id).value;

    // --- Récupération de toutes les valeurs ---
    // Propriétaire
    const prixPropriete = val('al-prix-propriete');
    const miseDeFonds = val('al-mise-de-fonds');
    const tauxHypoAnnuel = pct('al-taux-hypotheque');
    const amortissement = val('al-amortissement');
    const taxesAnnuelles = val('al-taxes-annuelles');
    const entretienPct = pct('al-entretien-annuel');
    const assuranceProprioM = val('al-assurance-proprio');
    const fraisCondoM = val('al-frais-condo');

    // Locataire
    let loyerMensuel = val('al-loyer-mensuel');
    const assuranceLocM = val('al-assurance-loc');

    // Paramètres communs
    const horizon = val('al-horizon');
    const croissanceImmo = pct('al-croissance-immo');
    const augmentationLoyer = pct('al-augmentation-loyer');
    const rendementPlacement = pct('al-rendement-placement');
    const typeCompte = sel('al-type-compte');
    const tauxMarginal = pct('al-taux-marginal');
    
    // --- Calculs initiaux ---
    const montantPret = prixPropriete - miseDeFonds;
    const tauxHypoMensuel = tauxHypoAnnuel / 12;
    const nbPaiements = amortissement * 12;
    const paiementHypothecaire = montantPret * tauxHypoMensuel / (1 - Math.pow(1 + tauxHypoMensuel, -nbPaiements));

    // --- Initialisation de la simulation ---
    let actifNetProprio = miseDeFonds;
    let actifNetLocataire = 0;
    let valeurPropriete = prixPropriete;
    let soldeHypotheque = montantPret;
    let portefeuilleLocataire = miseDeFonds; // Le locataire investit la mise de fonds au départ

    const labels = ['Année 0'];
    const dataProprio = [actifNetProprio];
    const dataLocataire = [portefeuilleLocataire];

    // --- Simulation année par année ---
    for (let an = 1; an <= horizon; an++) {
        let interetAnnuel = 0;
        let capitalRembourse = 0;
        
        // Calcul hypothèque pour l'année
        for (let mois = 1; mois <= 12; mois++) {
            let interetMois = soldeHypotheque * tauxHypoMensuel;
            let capitalMois = paiementHypothecaire - interetMois;
            interetAnnuel += interetMois;
            capitalRembourse += capitalMois;
            soldeHypotheque -= capitalMois;
        }

        // Coûts annuels du propriétaire
        const coutsProprio = (paiementHypothecaire * 12) + taxesAnnuelles + (prixPropriete * entretienPct) + (assuranceProprioM * 12) + (fraisCondoM * 12);
        
        // Coûts annuels du locataire
        const coutsLocataire = (loyerMensuel * 12) + (assuranceLocM * 12);
        
        // Le locataire investit la différence
        const investissementAnnuel = Math.max(0, coutsProprio - coutsLocataire);
        portefeuilleLocataire += investissementAnnuel;

        // Croissance du portefeuille du locataire (avec impôts si applicable)
        let gainPlacement = portefeuilleLocataire * rendementPlacement;
        if (typeCompte === 'non-enregistre') {
            gainPlacement *= (1 - (tauxMarginal * 0.5)); // Impôt sur 50% du gain en capital
        }
        portefeuilleLocataire += gainPlacement;

        // Mise à jour de la valeur de la propriété
        valeurPropriete *= (1 + croissanceImmo);
        
        // Mise à jour de l'actif net du propriétaire
        actifNetProprio = valeurPropriete - soldeHypotheque;
        
        // On stocke les données pour le graphique
        labels.push(`Année ${an}`);
        dataProprio.push(actifNetProprio);

        // Actif net final du locataire selon le compte
        if (typeCompte === 'reer') {
            dataLocataire.push(portefeuilleLocataire * (1 - tauxMarginal)); // Imposé au retrait
        } else {
            dataLocataire.push(portefeuilleLocataire); // CELI ou déjà imposé
        }

        // Augmentation du loyer pour l'année suivante
        loyerMensuel *= (1 + augmentationLoyer);
    }
    
    // --- Affichage du résultat final ---
    const resultatFinalProprio = dataProprio[dataProprio.length - 1];
    const resultatFinalLocataire = dataLocataire[dataLocataire.length - 1];
    const difference = resultatFinalProprio - resultatFinalLocataire;
    
    document.getElementById('resultat-acheter-louer').textContent = 
        `Après ${horizon} ans, l'actif net du propriétaire est de ${fmtCurrency(resultatFinalProprio)} et celui du locataire est de ${fmtCurrency(resultatFinalLocataire)}. Différence : ${fmtCurrency(difference)} en faveur du ${difference > 0 ? 'propriétaire' : 'locataire'}.`;

    // --- Création du graphique ---
    const ctx = document.getElementById('chart-acheter-louer')?.getContext('2d');
    if (!ctx) return;
    if (chartAcheterLouer) chartAcheterLouer.destroy();
    
    chartAcheterLouer = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Actif Net Propriétaire',
                    data: dataProprio,
                    borderColor: '#16a34a',
                    backgroundColor: 'rgba(22, 163, 74, 0.1)',
                    fill: true
                },
                {
                    label: 'Actif Net Locataire (Investisseur)',
                    data: dataLocataire,
                    borderColor: '#f97316',
                    backgroundColor: 'rgba(249, 115, 22, 0.1)',
                    fill: true
                }
            ]
        },
        options: {
            maintainAspectRatio: false,
            scales: {
                y: { ticks: { callback: value => fmtCurrency(value) } }
            }
        }
    });
});
});
