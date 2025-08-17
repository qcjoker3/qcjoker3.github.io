document.addEventListener('DOMContentLoaded', () => {
    // Charge le footer de manière dynamique
    fetch('footer.html')
        .then(response => response.text())
        .then(data => {
            if (document.getElementById('footer-placeholder')) {
                document.getElementById('footer-placeholder').innerHTML = data;
            }
        });

        // --- FONCTIONS UTILITAIRES ---
    const fmtNombre = (n, isCurrency = true) => {
        if (isNaN(n) || n === null) return isCurrency ? "0,00 $" : "0";
        const options = {
            minimumFractionDigits: isCurrency ? 2 : 0,
            maximumFractionDigits: isCurrency ? 2 : 0
        };
        if (isCurrency) {
            options.style = 'currency';
            options.currency = 'CAD';
        }
        return new Intl.NumberFormat('fr-CA', options).format(n);
    };

    // --- INITIALISATION D'AUTONUMERIC ---
    const anInputs = {};
    const champsArgent = [
        'ret-epargne-actuelle', 'ret-cotisation-mensuelle', // Nouveaux champs Retraite
        'vf-montant-initial', 'vf-cotisation', 'hypo-montant', 'trex-montant', 
        'trex-cotisation-annuelle', 'al-prix-propriete', 'al-mise-de-fonds', 
        'al-taxes-annuelles', 'al-assurance-proprio', 'al-frais-condo', 
        'al-loyer-mensuel', 'al-assurance-loc'
        // 'epargne-mensuelle' a été retiré car il n'existe plus
    ];
    const champsEntier = [
        'ret-age-actuel', 'ret-age-retraite', // Nouveaux champs Retraite
        //'vf-duree', 'hypo-duree', 'trex-duree', 'al-amortissement', 'al-horizon'
        // 'age-actuel' et 'age-retraite' ont été retirés
    ];
    
    const optionsArgent = AutoNumeric.getPredefinedOptions().dollar;
    const optionsEntier = { decimalPlaces: 0, digitGroupSeparator: '' };

    champsArgent.forEach(id => {
        const el = document.getElementById(id);
        if (el) anInputs[id] = new AutoNumeric(el, optionsArgent);
    });
    champsEntier.forEach(id => {
        const el = document.getElementById(id);
        if (el) anInputs[id] = new AutoNumeric(el, optionsEntier);
    });

    const getVal = (id) => {
        if (anInputs[id]) return anInputs[id].getNumber();
        const el = document.getElementById(id);
        if (el) return parseFloat(String(el.value).replace(',', '.')) || 0;
        return 0;
    };

    // Variables globales pour les graphiques
    let chartVF = null, chartHypo = null, chartTrex = null, chartAcheterLouer = null;
    let chartRevenu = null, chartTrajectoire = null;

    // --- SYSTÈME DE NAVIGATION ENTRE CALCULATRICES ---
    const calcCards = document.querySelectorAll('.card-grid .card[data-calc]');
    const calcSections = document.querySelectorAll('.calculator-card');
    const allExplications = document.querySelectorAll('.boite-explication');

    const showCalculator = (key) => {
        const targetSection = document.getElementById(`calc-${key}`);
        if (!targetSection) return;
        calcSections.forEach(sec => sec.classList.remove('active'));
        targetSection.classList.add('active');
        calcCards.forEach(card => card.classList.toggle('selected', card.dataset.calc === key));
        const targetExplication = document.getElementById(`explication-${key}`);
        allExplications.forEach(box => box.classList.remove('active'));
        if (targetExplication) targetExplication.classList.add('active');
    };
    calcCards.forEach(card => card.addEventListener('click', () => showCalculator(card.dataset.calc)));

    const typeCompteSelect = document.getElementById('al-type-compte');
    const reinvestOptionDiv = document.getElementById('reinvest-reer-option');
    function toggleReinvestOption() {
        if (typeCompteSelect && reinvestOptionDiv) {
            reinvestOptionDiv.style.display = (typeCompteSelect.value === 'reer') ? 'block' : 'none';
        }
    }
    if (typeCompteSelect) typeCompteSelect.addEventListener('change', toggleReinvestOption);
    toggleReinvestOption();

    // =========================================================================
    // === NOUVELLE CALCULATRICE DE RETRAITE 360° ===
    // =========================================================================
    const formRetraiteAvancee = document.getElementById('form-retraite-avancee');
    if(formRetraiteAvancee) {
        // Mise à jour visuelle des sliders
        ['ret-rendement', 'ret-regle-retrait', 'ret-rendement-retraite'].forEach(id => {
            const slider = document.getElementById(id);
            const valeurDisplay = document.getElementById(`${id}-valeur`);
            if(slider && valeurDisplay) {
                slider.addEventListener('input', () => valeurDisplay.textContent = `${parseFloat(slider.value).toFixed(1)} %`);
            }
        });

        formRetraiteAvancee.addEventListener('submit', (e) => {
            e.preventDefault();

            const CONSTANTES = {
                ANNEE_FISCAL: 2025, RRQ_MAX_ANNUEL: 16370, RRQ_MOYEN_ANNUEL: 9200, SV_ANNUEL: 8560,
                SEUIL_RECUPERATION_SV: 90997, TAUX_RECUPERATION_SV: 0.15,
                PALIERS_FED: [{ l: 55867, t: 0.15, b: 15705 },{ l: 111733, t: 0.205, b: 15705 },{ l: 173205, t: 0.26, b: 15705 },{ l: 246752, t: 0.29, b: 15705 },{ l: Infinity, t: 0.33, b: 15705 }],
                PALIERS_QC: [{ l: 51780, t: 0.14, b: 18056 },{ l: 103545, t: 0.19, b: 18056 },{ l: 126000, t: 0.24, b: 18056 },{ l: Infinity, t: 0.2575, b: 18056 }],
                POURCENTAGES_FERR: { 71: 5.28, 72: 5.40, 73: 5.53, 74: 5.67, 75: 5.82, 76: 5.98, 77: 6.17, 78: 6.36, 79: 6.58, 80: 6.82, 81: 7.08, 82: 7.38, 83: 7.71, 84: 8.08, 85: 8.51, 86: 8.99, 87: 9.55, 88: 10.21, 89: 10.99, 90: 11.92, 91: 13.06, 92: 14.49, 93: 16.34, 94: 18.79, 95: 20.00 },
            };

            const estimerImpot = (revenu) => {
                const calc = (paliers, revenuImposable) => {
                    let impot = 0, dernierPalier = 0;
                    for (const p of paliers) {
                        if (revenuImposable > dernierPalier) {
                            const montantDansPalier = Math.min(revenuImposable - dernierPalier, p.l - dernierPalier);
                            impot += montantDansPalier * p.t;
                        }
                        dernierPalier = p.l;
                    }
                    const creditBase = paliers[0].b * paliers[0].t;
                    return Math.max(0, impot - creditBase);
                };
                return calc(CONSTANTES.PALIERS_FED, revenu) + calc(CONSTANTES.PALIERS_QC, revenu);
            };
            
            const inputs = {
                ageActuel: getVal('ret-age-actuel'), ageRetraite: getVal('ret-age-retraite'),
                epargneActuelle: getVal('ret-epargne-actuelle'), cotisationMensuelle: getVal('ret-cotisation-mensuelle'),
                rendement: getVal('ret-rendement') / 100, rendementRetraite: getVal('ret-rendement-retraite') / 100,
                rrq: document.getElementById('ret-rrq').value, sv: document.getElementById('ret-sv').value,
                regleRetrait: getVal('ret-regle-retrait') / 100, compteImmobilise: document.getElementById('ret-compte-immobilise').checked
            };
            
            const anneesEpargne = inputs.ageRetraite - inputs.ageActuel;
            const moisEpargne = anneesEpargne * 12;
            const rendementMensuel = Math.pow(1 + inputs.rendement, 1/12) - 1;
            const fvEpargneActuelle = inputs.epargneActuelle * Math.pow(1 + inputs.rendement, anneesEpargne);
            const fvCotisations = inputs.cotisationMensuelle * ((Math.pow(1 + rendementMensuel, moisEpargne) - 1) / rendementMensuel);
            let capitalTotal = fvEpargneActuelle + fvCotisations;

            let capitalRestant = capitalTotal;
            const trajectoire = [];
            let sommeRevenusNets = 0;

            for (let age = inputs.ageRetraite; age < 100 && capitalRestant > 0; age++) {
                const capitalDebutAnnee = capitalRestant;
                const rrqAnnuel = inputs.rrq === 'moyen' ? CONSTANTES.RRQ_MOYEN_ANNUEL : inputs.rrq === 'max' ? CONSTANTES.RRQ_MAX_ANNUEL : 0;
                const svAnnuel = inputs.sv === 'oui' ? CONSTANTES.SV_ANNUEL : 0;

                const retraitStrategique = capitalDebutAnnee * inputs.regleRetrait;
                const facteurMinFERR = (age >= 71) ? (CONSTANTES.POURCENTAGES_FERR[age] || 20) / 100 : (age >= inputs.ageRetraite ? 1 / (90 - age) : 0);
                const retraitMinFERR = capitalDebutAnnee * facteurMinFERR;
                let retraitAnnuel = Math.max(retraitStrategique, retraitMinFERR);

                if (inputs.compteImmobilise) {
                    const facteurMaxFRV = 1 / (90 - age);
                    const plafondFRV = capitalDebutAnnee * facteurMaxFRV;
                    retraitAnnuel = Math.min(retraitAnnuel, plafondFRV);
                }
                retraitAnnuel = Math.min(retraitAnnuel, capitalDebutAnnee);
                
                const revenuImposable = retraitAnnuel + rrqAnnuel;
                const revenuBrutTotal = revenuImposable + svAnnuel;
                const recuperationSV = Math.max(0, (revenuBrutTotal - CONSTANTES.SEUIL_RECUPERATION_SV) * CONSTANTES.TAUX_RECUPERATION_SV);
                const svNette = Math.max(0, svAnnuel - recuperationSV);
                const impotEstime = estimerImpot(revenuImposable);
                const revenuNetAnnuel = revenuImposable + svNette - impotEstime;
                sommeRevenusNets += revenuNetAnnuel;

                capitalRestant -= retraitAnnuel;
                capitalRestant *= (1 + inputs.rendementRetraite);
                 trajectoire.push({ age: age, capital: capitalDebutAnnee, retrait: retraitAnnuel });
        }

            const nbAnneesRetraite = trajectoire.length || 1;
            const revenuMoyenNetMensuel = (sommeRevenusNets / nbAnneesRetraite) / 12;
            const pouvoirAchat = revenuMoyenNetMensuel / Math.pow(1 + 0.02, anneesEpargne);

             const rrqInitial = inputs.rrq === 'moyen' ? CONSTANTES.RRQ_MOYEN_ANNUEL : inputs.rrq === 'max' ? CONSTANTES.RRQ_MAX_ANNUEL : 0;
            const svInitial = inputs.sv === 'oui' ? CONSTANTES.SV_ANNUEL : 0;
            const retraitInitial = (trajectoire.length > 0) ? trajectoire[0].retrait : 0;
        
            
            const repartition = { epargne: retraitInitialBrut, rrq: rrqInitial, sv: svInitial };
            
            document.getElementById('resultat-revenu-mensuel').textContent = fmtNombre(revenuMoyenNetMensuel);
            document.getElementById('resultat-pouvoir-achat').textContent = fmtNombre(pouvoirAchat);
            document.getElementById('retraite-resultats').style.display = 'block';

            const ctxRevenu = document.getElementById('chart-revenu-retraite').getContext('2d');
            if (chartRevenu) chartRevenu.destroy();
            chartRevenu = new Chart(ctxRevenu, {
                type: 'doughnut', data: { labels: ['Vos économies', 'RRQ', 'Sécurité de la Vieillesse (SV)'], datasets: [{ data: [repartition.epargne, repartition.rrq, repartition.sv], backgroundColor: ['#4F46E5', '#A855F7', '#10B981'], borderColor: '#1F2937' }] },
                options: { responsive: true, maintainAspectRatio: false }
            });

            const ctxTrajectoire = document.getElementById('chart-trajectoire-retraite').getContext('2d');
            if (chartTrajectoire) chartTrajectoire.destroy();
            chartTrajectoire = new Chart(ctxTrajectoire, {
                type: 'line', data: { labels: trajectoire.map(d => d.age), datasets: [{ label: 'Évolution du capital à la retraite', data: trajectoire.map(d => d.capital), borderColor: '#4F46E5', backgroundColor: 'rgba(79, 70, 229, 0.1)', fill: true, tension: 0.1 }] },
                options: { responsive: true, maintainAspectRatio: false, scales: { x: { title: { display: true, text: 'Âge' } }, y: { title: { display: true, text: 'Capital' }, ticks: { callback: v => fmtNombre(v) } } } }
            });

            document.getElementById('retraite-resultats').scrollIntoView({ behavior: 'smooth' });
        });
    }
// --- Calculatrice de Valeur Future ---
document.getElementById('form-vf')?.addEventListener('submit', e => {
    e.preventDefault();
    const resultatVF = document.getElementById('resultat-vf');
    const montantInitial = getVal('vf-montant-initial');
    const duree = getVal('vf-duree');
    const taux = getVal('vf-taux') / 100;
    const cotisation = getVal('vf-cotisation');
    const freq = document.getElementById('vf-frequence').value;

    // AJOUT : Taux d'inflation annuel fixe
    const tauxInflation = 0.02;
    
    const m = freq === 'mensuelle' ? 12 : 1;
    const nP = duree * m;
    // Pour éviter une division par zéro si le taux est de 0%
    const rP = taux > 0 ? Math.pow(1 + taux, 1 / m) - 1 : 0;
    
    let fvTotal;
    if (taux > 0) {
        fvTotal = (montantInitial * Math.pow(1 + rP, nP)) + (cotisation * ((Math.pow(1 + rP, nP) - 1) / rP));
    } else {
        // Si le taux est 0, la valeur future est simplement le montant initial + les cotisations
        fvTotal = montantInitial + (cotisation * nP);
    }

    // AJOUT : Calcul de la valeur future ajustée pour l'inflation (en dollars courants)
    const fvReelle = fvTotal / Math.pow(1 + tauxInflation, duree);

    // MODIFIÉ : Affichage des deux résultats
    resultatVF.innerHTML = `Valeur future estimée : <strong>${fmtNombre(fvTotal)} $</strong><br>
                           En dollars d'aujourd'hui (inflation 2%) : <strong>${fmtNombre(fvReelle)} $</strong>`;
    
    const ctx = document.getElementById('chart-vf')?.getContext('2d');
    if (!ctx || !isFinite(fvTotal)) return;
    if (chartVF) chartVF.destroy();
    
    // MODIFIÉ : Préparation des données pour les deux courbes du graphique
    const labels = [];
    const valeurNominaleData = [];
    const valeurReelleData = [];

    for (let i = 0; i <= duree; i++) {
        labels.push(`Année ${i}`);
        let nP_i = i * m;
        let valeurNominaleAnnee;

        if (taux > 0) {
            valeurNominaleAnnee = (montantInitial * Math.pow(1 + rP, nP_i)) + (cotisation * ((Math.pow(1 + rP, nP_i) - 1) / rP));
        } else {
            valeurNominaleAnnee = montantInitial + (cotisation * nP_i);
        }
        
        valeurNominaleData.push(valeurNominaleAnnee);
        // AJOUT : Calcul de la valeur réelle pour chaque année du graphique
        valeurReelleData.push(valeurNominaleAnnee / Math.pow(1 + tauxInflation, i));
    }
    
    // MODIFIÉ : Création du graphique avec deux lignes de données
    chartVF = new Chart(ctx, { 
        type: 'line', 
        data: { 
            labels, 
            datasets: [
                { 
                    label: 'Valeur Future (Nominale)', 
                    data: valeurNominaleData, 
                    borderColor: '#22c55e', 
                    fill: true, 
                    backgroundColor: 'rgba(34, 197, 94, 0.1)' 
                },
                {
                    label: "Valeur en dollars d'aujourd'hui",
                    data: valeurReelleData,
                    borderColor: '#A855F7', // Une couleur distincte
                    fill: false, // Ligne simple pour une meilleure lisibilité
                    borderDash: [5, 5] // Ligne en pointillé
                }
            ] 
        }, 
        options: { 
            maintainAspectRatio: false, 
            scales: { 
                y: { 
                    ticks: { callback: v => fmtNombre(v) + ' $' } 
                } 
            } 
        } 
    });
});

    // --- Calculatrice d'Hypothèque ---
    document.getElementById('form-hypotheque')?.addEventListener('submit', e => {
        e.preventDefault();
        const resultatHypo = document.getElementById('resultat-hypotheque');
        const montantPret = getVal('hypo-montant');
        const tauxHypo = getVal('hypo-taux') / 100;
        const dureeHypo = getVal('hypo-duree');
        
        const rMensuel = tauxHypo / 12, n = dureeHypo * 12;
        if (rMensuel <= 0) return;
        const mensualite = montantPret * rMensuel / (1 - Math.pow(1 + rMensuel, -n));
        resultatHypo.textContent = `Mensualité estimée : ${fmtNombre(mensualite)} $`;
        const ctx = document.getElementById('chart-hypotheque')?.getContext('2d');
        if (!ctx || !isFinite(mensualite)) return;
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
        chartHypo = new Chart(ctx, { type: 'bar', data: { labels, datasets: [{ label: 'Capital remboursé', data: capitalRembourseData, backgroundColor: '#86efac' }, { label: 'Capital restant dû', data: capitalRestantData, backgroundColor: '#e2e8f0' }] }, options: { maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true, ticks: { callback: v => fmtNombre(v) + ' $' } } } } });
    });

    // --- Calculatrice de Frais de Gestion ---
    document.getElementById('form-trex')?.addEventListener('submit', e => {
        e.preventDefault();
        const resultatTrex = document.getElementById('resultat-trex');
        const montantInitial = getVal('trex-montant');
        const cotisationAnnuelle = getVal('trex-cotisation-annuelle');
        const duree = getVal('trex-duree');
        const rendementBrut = getVal('trex-rendement-brut') / 100;
        const fraisAnnuel = getVal('trex-taux') / 100;
        
        const rendementNet = rendementBrut - fraisAnnuel;
        const fv = (P, r, n, C) => P * Math.pow(1 + r, n) + (C * ((Math.pow(1 + r, n) - 1) / r));
        const capitalAvecFrais = fv(montantInitial, rendementNet, duree, cotisationAnnuelle);
        const capitalSansFrais = fv(montantInitial, rendementBrut, duree, cotisationAnnuelle);
        resultatTrex.textContent = `Impact des frais : ${fmtNombre(capitalSansFrais - capitalAvecFrais)} $. Valeur finale : ${fmtNombre(capitalAvecFrais)} $.`;
        const ctx = document.getElementById('chart-trex')?.getContext('2d');
        if (!ctx) return;
        if (chartTrex) chartTrex.destroy();
        chartTrex = new Chart(ctx, { type: 'bar', data: { labels: ['Avec Frais', 'Sans Frais (Potentiel)'], datasets: [{ label: 'Valeur finale', data: [capitalAvecFrais, capitalSansFrais], backgroundColor: ['#16a34a', '#86efac'] }] }, options: { maintainAspectRatio: false, scales: { y: { ticks: { callback: v => fmtNombre(v) + ' $' } } } } });
    });
    
    // --- Calculatrice Acheter ou Louer ---
    document.getElementById('form-acheter-louer')?.addEventListener('submit', e => {
        e.preventDefault();
        const sel = id => document.getElementById(id).value;
        const pct = id => getVal(id) / 100;

        const prixPropriete = getVal('al-prix-propriete');
        const miseDeFonds = getVal('al-mise-de-fonds');
        const tauxHypoAnnuel = pct('al-taux-hypotheque');
        const amortissement = getVal('al-amortissement');
        const taxesAnnuelles = getVal('al-taxes-annuelles');
        const entretienPct = pct('al-entretien-annuel');
        const assuranceProprioM = getVal('al-assurance-proprio');
        const fraisCondoM = getVal('al-frais-condo');
        let loyerMensuel = getVal('al-loyer-mensuel');
        const assuranceLocM = getVal('al-assurance-loc');
        const horizon = getVal('al-horizon');
        const croissanceImmo = pct('al-croissance-immo');
        const augmentationLoyer = pct('al-augmentation-loyer');
        const rendementPlacement = pct('al-rendement-placement');
        const typeCompte = sel('al-type-compte');
        const tauxMarginal = pct('al-taux-marginal');
        const reinvestirRetourImpot = document.getElementById('al-reinvestir-reer').checked;

        const montantPret = prixPropriete - miseDeFonds;
        const tauxHypoMensuel = tauxHypoAnnuel / 12;
        if (tauxHypoMensuel <= 0 && montantPret > 0) return;
        
        const paiementHypothecaire = (montantPret > 0) ? (montantPret * tauxHypoMensuel * Math.pow(1 + tauxHypoMensuel, amortissement * 12)) / (Math.pow(1 + tauxHypoMensuel, amortissement * 12) - 1) : 0;
        
        let valeurPropriete = prixPropriete;
        let soldeHypotheque = montantPret;
        let portefeuilleLocataire = miseDeFonds;
        let retourImpotPrecedent = 0;
        
        const labels = ['Année 0'], dataProprio = [miseDeFonds], dataLocataire = [portefeuilleLocataire];

        for (let an = 1; an <= horizon; an++) {
            portefeuilleLocataire += retourImpotPrecedent;
            if (soldeHypotheque > 0) {
                for (let mois = 1; mois <= 12; mois++) {
                    let interetMois = soldeHypotheque * tauxHypoMensuel;
                    soldeHypotheque -= (paiementHypothecaire - interetMois);
                }
            }
            soldeHypotheque = Math.max(0, soldeHypotheque);

            const coutsProprio = (paiementHypothecaire * 12) + taxesAnnuelles + (valeurPropriete * entretienPct) + (assuranceProprioM * 12) + (fraisCondoM * 12);
            const coutsLocataire = (loyerMensuel * 12) + (assuranceLocM * 12);
            const investissementAnnuel = Math.max(0, coutsProprio - coutsLocataire);
            
            if (typeCompte === 'reer' && reinvestirRetourImpot) {
                retourImpotPrecedent = investissementAnnuel * tauxMarginal;
            } else {
                retourImpotPrecedent = 0;
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
            
            let valeurNetteLocataire = portefeuilleLocataire;
            if (typeCompte === 'reer') {
                valeurNetteLocataire *= (1 - tauxMarginal);
            }
            dataLocataire.push(valeurNetteLocataire);
            
            loyerMensuel *= (1 + augmentationLoyer);
        }
        
        const resultatFinalProprio = dataProprio[dataProprio.length - 1];
        const resultatFinalLocataire = dataLocataire[dataLocataire.length - 1];
        const difference = resultatFinalProprio - resultatFinalLocataire;
        
        document.getElementById('resultat-acheter-louer').textContent = `Après ${horizon} ans, l'actif net du propriétaire est de ${fmtNombre(resultatFinalProprio)} $ et celui du locataire de ${fmtNombre(resultatFinalLocataire)} $. Différence : ${fmtNombre(Math.abs(difference))} $ en faveur du ${difference > 0 ? 'propriétaire' : 'locataire'}.`;
        
        const ctx = document.getElementById('chart-acheter-louer')?.getContext('2d');
        if (!ctx) return;
        if (chartAcheterLouer) chartAcheterLouer.destroy();
        chartAcheterLouer = new Chart(ctx, { type: 'line', data: { labels, datasets: [ { label: 'Actif Net Propriétaire', data: dataProprio, borderColor: '#16a34a', backgroundColor: 'rgba(22, 163, 74, 0.1)', fill: true }, { label: 'Actif Net Locataire', data: dataLocataire, borderColor: '#f97316', backgroundColor: 'rgba(249, 115, 22, 0.1)', fill: true } ] }, options: { maintainAspectRatio: false, scales: { y: { ticks: { callback: value => fmtNombre(value) + ' $' } } } } });
    });

    // Affichage initial
    showCalculator('retraite');
});
