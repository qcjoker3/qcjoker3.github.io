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
        'ret-epargne-actuelle', 'ret-cotisation-mensuelle', 
        'vf-montant-initial', 'vf-cotisation', 'hypo-montant', 'trex-montant', 
        'trex-cotisation-annuelle', 'al-prix-propriete', 'al-mise-de-fonds', 
        'al-taxes-annuelles', 'al-assurance-proprio', 'al-frais-condo', 
        'al-loyer-mensuel', 'al-assurance-loc', 'hypo-prix-propriete', 'hypo-mise-de-fonds',
        'duree-montant-initial','duree-retrait-annuel','fire-epargne-actuelle','fire-epargne-annuelle','fire-depenses-annuelles',
        'reer-celi-montant-annuel','cout-montant-depense','fnb-montant-initial','fnb-cotisation-mensuelle'
        
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
    let chartRevenu = null, chartTrajectoire = null, chartDureeCapital = null;
    let chartFire = null, chartReerCeli = null, chartCoutOpportunite = null, chartSimulateurFnb = null, chartFnbAllocation = null;

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
        sessionStorage.setItem('derniereCalculatrice', key);
    };
    calcCards.forEach(card => card.addEventListener('click', () => showCalculator(card.dataset.calc)));
    
    // --- LOGIQUE SPÉCIFIQUE (sliders, etc.) ---
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
                trajectoire.push({ age: age, capital: capitalDebutAnnee });
            }

            const nbAnneesRetraite = trajectoire.length || 1;
            const revenuMoyenNetMensuel = (sommeRevenusNets / nbAnneesRetraite) / 12;
            const pouvoirAchat = revenuMoyenNetMensuel / Math.pow(1 + 0.02, anneesEpargne);

            const rrqInitial = inputs.rrq === 'moyen' ? CONSTANTES.RRQ_MOYEN_ANNUEL : inputs.rrq === 'max' ? CONSTANTES.RRQ_MAX_ANNUEL : 0;
            const svInitial = inputs.sv === 'oui' ? CONSTANTES.SV_ANNUEL : 0;
            let retraitInitialBrut = 0;
            if (trajectoire.length > 0) {
                 const premierRevenuNet = trajectoire[0].revenuNet;
                 const premierImpotEstime = estimerImpot(trajectoire[0].retrait + rrqInitial);
                 retraitInitialBrut = premierRevenuNet - (rrqInitial + svInitial - premierImpotEstime);
            }
            
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

    // [MODIFICATION] On lit la valeur depuis le nouvel input au lieu qu'elle soit fixe
    const tauxInflation = getVal('vf-inflation') / 100;
    
    // [MODIFICATION] On récupère la valeur en % pour l'afficher dans le texte du résultat
    const inflationPourcent = getVal('vf-inflation');

    const m = freq === 'mensuelle' ? 12 : 1;
    const nP = duree * m;
    const rP = taux > 0 ? Math.pow(1 + taux, 1 / m) - 1 : 0;
    
    let fvTotal;
    if (taux > 0) {
        fvTotal = (montantInitial * Math.pow(1 + rP, nP)) + (cotisation * ((Math.pow(1 + rP, nP) - 1) / rP));
    } else {
        fvTotal = montantInitial + (cotisation * nP);
    }

    const fvReelle = fvTotal / Math.pow(1 + tauxInflation, duree);

    // [MODIFICATION] L'affichage du résultat est maintenant dynamique
    resultatVF.innerHTML = `Valeur future estimée : <strong>${fmtNombre(fvTotal)}</strong><br>
                            En dollars d'aujourd'hui (inflation ${inflationPourcent}%) : <strong>${fmtNombre(fvReelle)}</strong>`;
    
    const ctx = document.getElementById('chart-vf')?.getContext('2d');
    if (!ctx || !isFinite(fvTotal)) return;
    if (chartVF) chartVF.destroy();
    
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
        // Le calcul ici utilise déjà la variable `tauxInflation`, donc il se met à jour automatiquement
        valeurReelleData.push(valeurNominaleAnnee / Math.pow(1 + tauxInflation, i));
    }
    
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
                    borderColor: '#A855F7',
                    fill: false,
                    borderDash: [5, 5]
                }
            ] 
        }, 
        options: { 
            maintainAspectRatio: false, 
            scales: { 
                y: { 
                    ticks: { callback: v => fmtNombre(v) } 
                } 
            } 
        } 
    });
});

// --- Calculatrice d'Hypothèque ---
const formHypotheque = document.getElementById('form-hypotheque');
if (formHypotheque) {
    // On récupère les éléments qui vont déclencher le calcul
    const prixProprieteInput = document.getElementById('hypo-prix-propriete');
    const miseDeFondsInput = document.getElementById('hypo-mise-de-fonds');

    // La fonction qui met à jour le montant du prêt
    const updateMontantPret = () => {
        const prixPropriete = getVal('hypo-prix-propriete');
        const miseDeFonds = getVal('hypo-mise-de-fonds');
        const montantPret = Math.max(0, prixPropriete - miseDeFonds);
        
        // On utilise l'instance AutoNumeric pour mettre à jour le champ formaté
        if (anInputs['hypo-montant']) {
            anInputs['hypo-montant'].set(montantPret);
        }
    };

    // On attache un "écouteur" à chaque champ pour détecter les changements en temps réel
    if (prixProprieteInput && miseDeFondsInput) {
        prixProprieteInput.addEventListener('input', updateMontantPret);
        miseDeFondsInput.addEventListener('input', updateMontantPret);
    }
    
    // On conserve la logique existante pour le bouton "Calculer"
    formHypotheque.addEventListener('submit', e => {
        e.preventDefault();
        const resultatHypo = document.getElementById('resultat-hypotheque');
        const montantPret = getVal('hypo-montant');
        const tauxHypo = getVal('hypo-taux') / 100;
        const dureeHypo = getVal('hypo-duree');
        
        const rMensuel = tauxHypo / 12, n = dureeHypo * 12;
        if (rMensuel <= 0 || montantPret <= 0) {
            resultatHypo.textContent = "Veuillez entrer des valeurs valides.";
            if(chartHypo) chartHypo.destroy();
            return;
        }
        const mensualite = montantPret * rMensuel / (1 - Math.pow(1 + rMensuel, -n));
        resultatHypo.textContent = `Mensualité estimée : ${fmtNombre(mensualite)}`;
        
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
}

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

    // ▼▼▼ MODIFICATION DE L'AFFICHAGE DU RÉSULTAT ▼▼▼
    resultatTrex.innerHTML = `
        <div class="results-side-by-side">
            <div>
                <span>Valeur Potentielle (sans frais)</span>
                <strong class="positive">${fmtNombre(capitalSansFrais)}</strong>
            </div>
            <div>
                <span>Valeur Finale (avec frais)</span>
                <strong>${fmtNombre(capitalAvecFrais)}</strong>
            </div>
        </div>
        <p class="impact-frais">Impact total des frais : ${fmtNombre(capitalSansFrais - capitalAvecFrais)}</p>
    `;
    // ▲▲▲ FIN DE LA MODIFICATION ▲▲▲
    
    const ctx = document.getElementById('chart-trex')?.getContext('2d');
    if (!ctx) return;
    if (chartTrex) chartTrex.destroy();
    
    chartTrex = new Chart(ctx, { 
        type: 'bar', 
        data: { 
            labels: ['Avec Frais', 'Sans Frais'], 
            datasets: [{ 
                //label: 'Valeur finale', 
                data: [capitalAvecFrais, capitalSansFrais], 
                backgroundColor: ['#ef4444', '#22c55e'] // Rouge pour "avec", Vert pour "sans"
            }] 
        }, 
        options: { 
            maintainAspectRatio: false, 
            scales: { 
                y: { 
                    ticks: { callback: v => fmtNombre(v) } 
                } 
            }, 
            plugins: {
            legend: {
                display: false // <-- Ceci cache la légende
             }   
            }
        } 
    });
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
            portefeuilleLocataire += investissementAnnuel;
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
        
        document.getElementById('resultat-acheter-louer').textContent = `Après ${horizon} ans, l'actif net du propriétaire est de ${fmtNombre(resultatFinalProprio)} et celui du locataire de ${fmtNombre(resultatFinalLocataire)}. Différence : ${fmtNombre(Math.abs(difference))} en faveur du ${difference > 0 ? 'propriétaire' : 'locataire'}.`;
        
        const ctx = document.getElementById('chart-acheter-louer')?.getContext('2d');
        if (!ctx) return;
        if (chartAcheterLouer) chartAcheterLouer.destroy();
        chartAcheterLouer = new Chart(ctx, { type: 'line', data: { labels, datasets: [ { label: 'Actif Net Propriétaire', data: dataProprio, borderColor: '#16a34a', backgroundColor: 'rgba(22, 163, 74, 0.1)', fill: true }, { label: 'Actif Net Locataire', data: dataLocataire, borderColor: '#f97316', backgroundColor: 'rgba(249, 115, 22, 0.1)', fill: true } ] }, options: { maintainAspectRatio: false, scales: { y: { ticks: { callback: value => fmtNombre(value) } } } } });
    });
     // =========================================================================
    // === CALCULATRICE DE DURÉE DU CAPITAL (DÉCAISSEMENT) ===
    // =========================================================================   
    
    //let chartDureeCapital = null;
    const formDureeCapital = document.getElementById('form-duree-capital');

    if (formDureeCapital) {
        formDureeCapital.addEventListener('submit', e => {
            e.preventDefault();

            const montantInitial = getVal('duree-montant-initial');
            const retraitAnnuel = getVal('duree-retrait-annuel');
            const rendement = getVal('duree-rendement') / 100;
            const inflation = getVal('duree-inflation') / 100;
            const resultatDiv = document.getElementById('resultat-duree-capital');
            const chartContainer = resultatDiv.nextElementSibling;

            let capitalRestant = montantInitial;
            let retraitIndexe = retraitAnnuel;
            let annees = 0;
            const trajectoireCapital = [montantInitial];
            let messageFinal = '';
            const rendementReel = (1 + rendement) / (1 + inflation) - 1;
            // Cas où le capital dure "éternellement"
           if (rendementReel > 0 && retraitAnnuel <= montantInitial * rendementReel) {
                for (let i = 1; i <= 50; i++) {
                    capitalRestant = (capitalRestant * (1 + rendement)) - retraitIndexe;
                    retraitIndexe *= (1 + inflation);
                    trajectoireCapital.push(capitalRestant);
                }
                messageFinal = `
                    <div class="results-dashboard">
                        <div class="result-box">
                            <span class="result-label">Durée de votre capital</span>
                            <span class="result-value" style="color: var(--accent-color);">Pour toujours</span>
                        </div>
                        <div class="result-box">
                            <span class="result-label">Montant projeté après 50 ans</span>
                            <span class="result-value">${fmtNombre(capitalRestant)}</span>
                        </div>
                    </div>
                    <p style="text-align:center; margin-top: 1rem;">Vos retraits annuels (${fmtNombre(retraitAnnuel)}) sont inférieurs ou égaux aux gains générés. Votre portefeuille ne s'épuisera jamais et continuera même de croître.</p>
                `;
            } else {
                while (capitalRestant > retraitIndexe && annees < 100) {
                    capitalRestant = (capitalRestant * (1 + rendement)) - retraitIndexe;
                    retraitIndexe *= (1 + inflation);
                    annees++;
                    trajectoireCapital.push(capitalRestant);
                }
                if (capitalRestant > 0 && annees < 100) {
                    annees += capitalRestant / retraitIndexe;
                    trajectoireCapital.push(0);
                }
                if (annees >= 100) {
                     messageFinal = `<div class="result-box"><span class="result-label">Votre capital durera</span><span class="result-value">Plus de 100 ans</span></div>`;
                } else {

                messageFinal = `
                        <div class="results-dashboard">
                            <div class="result-box">
                                <span class="result-label">Votre capital durera environ</span>
                                <span class="result-value">${annees.toFixed(1)} ans</span>
                            </div>
                            <div class="result-box">
                                <span class="result-label">Montant restant à la fin</span>
                                <span class="result-value">${fmtNombre(0)}</span>
                            </div>
                        </div>
                    `;
                }
            }

resultatDiv.innerHTML = messageFinal;
            resultatDiv.style.display = 'block';
            chartContainer.style.display = 'block';
            const ctx = document.getElementById('chart-duree-capital').getContext('2d');
            if (chartDureeCapital) chartDureeCapital.destroy();
            const labels = Array.from({ length: trajectoireCapital.length }, (_, i) => `Année ${i}`);
            chartDureeCapital = new Chart(ctx, { type: 'line', data: { labels: labels, datasets: [{ label: 'Évolution du capital', data: trajectoireCapital, borderColor: '#4F46E5', backgroundColor: 'rgba(79, 70, 229, 0.1)', fill: true, tension: 0.1 }] }, options: { maintainAspectRatio: false, scales: { y: { ticks: { callback: v => fmtNombre(v) }, beginAtZero: true } }, plugins: { legend: { display: false } } } });
            resultatDiv.scrollIntoView({ behavior: 'smooth' });
        });
    }
    
// =========================================================================
    // === CALCULATRICE D'INDÉPENDANCE FINANCIÈRE (FIRE) ===
    // =========================================================================
    const formFire = document.getElementById('form-fire');
    if (formFire) {
        formFire.addEventListener('submit', e => {
            e.preventDefault();
            const epargneActuelle = getVal('fire-epargne-actuelle');
            const epargneAnnuelle = getVal('fire-epargne-annuelle');
            const depensesAnnuelles = getVal('fire-depenses-annuelles');
            const rendement = getVal('fire-rendement') / 100;
            const tauxRetrait = 0.04;
            const resultatDiv = document.getElementById('resultat-fire');
            const chartContainer = resultatDiv.nextElementSibling;

            if (depensesAnnuelles <= 0) return;

            const numeroFire = depensesAnnuelles / tauxRetrait;
            let patrimoine = epargneActuelle;
            let annees = 0;
            const trajectoirePatrimoine = [patrimoine];

            if (epargneAnnuelle <= 0 && patrimoine < numeroFire) {
                resultatDiv.innerHTML = `<div class="result-box"><span class="result-label">Objectif FIRE</span><strong>Non atteignable</strong><p class="mt-2 text-sm">Votre épargne annuelle est de 0 ou négative. L'objectif ne peut être atteint sans épargner.</p></div>`;
                resultatDiv.style.display = 'block';
                chartContainer.style.display = 'none';
                return;
            }

            while (patrimoine < numeroFire && annees < 100) {
                patrimoine = patrimoine * (1 + rendement) + epargneAnnuelle;
                annees++;
                trajectoirePatrimoine.push(patrimoine);
            }

            resultatDiv.innerHTML = `
                <div class="results-dashboard">
                    <div class="result-box">
                        <span class="result-label">Vous atteindrez l'indépendance financière dans</span>
                        <span class="result-value">${annees < 100 ? `${annees} ans` : "Plus de 100 ans"}</span>
                    </div>
                    <div class="result-box">
                        <span class="result-label">Votre "Numéro FIRE" est de</span>
                        <span class="result-value">${fmtNombre(numeroFire)}</span>
                    </div>
                </div>
            `;
            resultatDiv.style.display = 'block';
            chartContainer.style.display = 'block';

            const ctx = document.getElementById('chart-fire').getContext('2d');
            if (chartFire) chartFire.destroy();
            const labels = Array.from({ length: trajectoirePatrimoine.length }, (_, i) => `Année ${i}`);
            chartFire = new Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'Croissance du Patrimoine',
                        data: trajectoirePatrimoine,
                        borderColor: '#0D9488',
                        backgroundColor: 'rgba(13, 148, 136, 0.1)',
                        fill: true,
                    }, {
                        label: 'Objectif FIRE',
                        data: Array(labels.length).fill(numeroFire),
                        borderColor: '#4F46E5',
                        borderDash: [5, 5],
                        fill: false,
                    }]
                },
                options: { maintainAspectRatio: false, scales: { y: { ticks: { callback: v => fmtNombre(v) } } } }
            });
            resultatDiv.scrollIntoView({ behavior: 'smooth' });
        });
    }

 // =========================================================================
    // === SIMULATEUR D'OPTIMISATION FISCALE (REER vs CÉLI) ===
    // =========================================================================
    const formReerCeli = document.getElementById('form-reer-celi');
    if (formReerCeli) {
        ['reer-celi-taux-actuel', 'reer-celi-taux-retraite'].forEach(id => {
            const slider = document.getElementById(id);
            const display = document.getElementById(`${id}-valeur`);
            if (slider && display) {
                display.textContent = `${slider.value} %`;
                slider.addEventListener('input', () => { display.textContent = `${slider.value} %`; });
            }
        });
        
        formReerCeli.addEventListener('submit', e => {
            e.preventDefault();
            const montantAnnuel = getVal('reer-celi-montant-annuel');
            const duree = getVal('reer-celi-duree');
            const rendement = getVal('reer-celi-rendement') / 100;
            const tauxActuel = getVal('reer-celi-taux-actuel') / 100;
            const tauxRetraite = getVal('reer-celi-taux-retraite') / 100;
            const resultatDiv = document.getElementById('resultat-reer-celi');
            const chartContainer = resultatDiv.nextElementSibling;
            
            let patrimoineCeli = 0;
            const trajectoireCeli = [0];
            for(let i=0; i < duree; i++) {
                patrimoineCeli = (patrimoineCeli + montantAnnuel) * (1 + rendement);
                trajectoireCeli.push(patrimoineCeli);
            }

            const retourImpot = montantAnnuel * tauxActuel;
            const investissementAnnuelReer = montantAnnuel + retourImpot;
            let patrimoineBrutReer = 0;
            const trajectoireReer = [0];
            for(let i=0; i < duree; i++) {
                patrimoineBrutReer = (patrimoineBrutReer + investissementAnnuelReer) * (1 + rendement);
                trajectoireReer.push(patrimoineBrutReer * (1 - tauxRetraite));
            }
            const patrimoineNetReer = patrimoineBrutReer * (1 - tauxRetraite);
            
            const gagnant = patrimoineNetReer > patrimoineCeli ? 'REER' : 'CÉLI';
            const difference = Math.abs(patrimoineNetReer - patrimoineCeli);
            
            resultatDiv.innerHTML = `
                 <div class="results-dashboard">
                    <div class="result-box">
                        <span class="result-label">Valeur Nette Finale (CÉLI)</span>
                        <span class="result-value">${fmtNombre(patrimoineCeli)}</span>
                    </div>
                    <div class="result-box">
                        <span class="result-label">Valeur Nette Finale (REER)</span>
                        <span class="result-value">${fmtNombre(patrimoineNetReer)}</span>
                    </div>
                </div>
                <p style="text-align:center; margin-top: 1rem; font-size: 1.1em;">Dans ce scénario, la stratégie <strong>${gagnant}</strong> est plus avantageuse de <strong>${fmtNombre(difference)}</strong>.</p>
            `;
            resultatDiv.style.display = 'block';
            chartContainer.style.display = 'block';
            
            const ctx = document.getElementById('chart-reer-celi').getContext('2d');
            if (chartReerCeli) chartReerCeli.destroy();
            const labels = Array.from({ length: duree + 1 }, (_, i) => `Année ${i}`);
            chartReerCeli = new Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'Patrimoine Net CÉLI',
                        data: trajectoireCeli,
                        borderColor: '#0D9488',
                    }, {
                        label: 'Patrimoine Net REER',
                        data: trajectoireReer,
                        borderColor: '#4F46E5',
                    }]
                },
                options: { maintainAspectRatio: false, scales: { y: { ticks: { callback: v => fmtNombre(v) } } } }
            });
            resultatDiv.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // =========================================================================
    // === CALCULATRICE DE COÛT D'OPPORTUNITÉ ===
    // =========================================================================
    const formCoutOpportunite = document.getElementById('form-cout-opportunite');
    if (formCoutOpportunite) {
        formCoutOpportunite.addEventListener('submit', e => {
            e.preventDefault();
            const montantDepense = getVal('cout-montant-depense');
            const frequence = document.getElementById('cout-frequence').value;
            const duree = getVal('cout-duree');
            const rendement = getVal('cout-rendement') / 100;
            const resultatDiv = document.getElementById('resultat-cout-opportunite');
            const chartContainer = resultatDiv.nextElementSibling;

            let montantAnnuel;
            if (frequence === 'quotidienne') montantAnnuel = montantDepense * 365;
            else if (frequence === 'hebdomadaire') montantAnnuel = montantDepense * 52;
            else montantAnnuel = montantDepense * 12;

            let valeurPotentielle = 0;
            for(let i=0; i < duree; i++) {
                valeurPotentielle = (valeurPotentielle + montantAnnuel) * (1 + rendement);
            }
            const totalDepense = montantAnnuel * duree;

            resultatDiv.innerHTML = `<div class="result-box"><span class="result-label">Cette dépense vous coûte réellement</span><span class="result-value">${fmtNombre(valeurPotentielle)}</span><p class="mt-2 text-sm">... sur ${duree} ans, au lieu de seulement ${fmtNombre(totalDepense)} dépensés.</p></div>`;
            resultatDiv.style.display = 'block';
            chartContainer.style.display = 'block';

            const ctx = document.getElementById('chart-cout-opportunite').getContext('2d');
            if (chartCoutOpportunite) chartCoutOpportunite.destroy();
            chartCoutOpportunite = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Total Dépensé', 'Valeur Potentielle si Investi'],
                    datasets: [{
                        data: [totalDepense, valeurPotentielle],
                        backgroundColor: ['#6B7280', '#0D9488']
                    }]
                },
                options: { maintainAspectRatio: false, scales: { y: { ticks: { callback: v => fmtNombre(v) } } }, plugins: { legend: { display: false } } }
            });
            resultatDiv.scrollIntoView({ behavior: 'smooth' });
        });
    }

// =========================================================================
    // === SIMULATEUR DE PORTEFEUILLE FNB ===
    // =========================================================================
    const formSimulateurFnb = document.getElementById('form-simulateur-fnb');
    if (formSimulateurFnb) {
        const fnbData = {
            VBAL: { nom: "Portefeuille Équilibré (VBAL)", frais: 0.24, rendement: 6.5, allocation: { Actions: 60, Obligations: 40 } },
            VGRO: { nom: "Portefeuille de Croissance (VGRO)", frais: 0.24, rendement: 7.5, allocation: { Actions: 80, Obligations: 20 } },
            VEQT: { nom: "Portefeuille 100% Actions (VEQT)", frais: 0.24, rendement: 8.5, allocation: { Actions: 100, Obligations: 0 } }
        };

        formSimulateurFnb.addEventListener('submit', e => {
            e.preventDefault();
            const profil = formSimulateurFnb.querySelector('input[name="fnb-profil"]:checked').value;
            const fnb = fnbData[profil];
            const montantInitial = getVal('fnb-montant-initial');
            const cotisationMensuelle = getVal('fnb-cotisation-mensuelle');
            const duree = getVal('fnb-duree');
            const resultatDiv = document.getElementById('resultat-simulateur-fnb');
            const chartContainer = resultatDiv.nextElementSibling;
            
            const rendementNet = (fnb.rendement - fnb.frais) / 100;
            const n = duree * 12;
            const r = Math.pow(1 + rendementNet, 1/12) - 1;
            let valeurFinale = montantInitial * Math.pow(1 + r, n);
            if(r > 0) {
                valeurFinale += cotisationMensuelle * ( (Math.pow(1 + r, n) - 1) / r );
            } else {
                valeurFinale += cotisationMensuelle * n;
            }

            resultatDiv.innerHTML = `
                <div class="results-dashboard">
                     <div class="result-box">
                        <span class="result-label">Valeur Finale Projetée</span>
                        <span class="result-value">${fmtNombre(valeurFinale)}</span>
                    </div>
                    <div class="result-box" id="fnb-allocation-chart-container" style="height: 150px;">
                        <canvas id="chart-fnb-allocation"></canvas>
                    </div>
                </div>
                <p style="text-align:center; margin-top: 1rem;">Basé sur le FNB <strong>${fnb.nom}</strong> avec des frais annuels de <strong>${fnb.frais}%</strong>.</p>
            `;
            resultatDiv.style.display = 'block';
            chartContainer.style.display = 'block';
            
            const ctxAlloc = document.getElementById('chart-fnb-allocation').getContext('2d');
            if (chartFnbAllocation) chartFnbAllocation.destroy();
            chartFnbAllocation = new Chart(ctxAlloc, {
                type: 'doughnut',
                data: {
                    labels: ['Actions', 'Obligations'],
                    datasets: [{
                        data: [fnb.allocation.Actions, fnb.allocation.Obligations],
                        backgroundColor: ['#0D9488', '#4F46E5'],
                        borderColor: 'var(--card-bg-color)'
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
            });

            const trajectoire = [montantInitial];
            let patrimoine = montantInitial;
            for(let i=0; i<duree * 12; i++) {
                patrimoine = patrimoine * (1 + r) + cotisationMensuelle;
                if((i + 1) % 12 === 0) trajectoire.push(patrimoine);
            }
            const ctxCroissance = document.getElementById('chart-simulateur-fnb').getContext('2d');
            if (chartSimulateurFnb) chartSimulateurFnb.destroy();
            const labels = Array.from({ length: duree + 1 }, (_, i) => `Année ${i}`);
            chartSimulateurFnb = new Chart(ctxCroissance, {
                type: 'line',
                data: { labels, datasets: [{ label: 'Croissance du portefeuille', data: trajectoire, borderColor: '#0D9488', fill: true, backgroundColor: 'rgba(13, 148, 136, 0.1)' }] },
                options: { maintainAspectRatio: false, scales: { y: { ticks: { callback: v => fmtNombre(v) } } } }
            });
            resultatDiv.scrollIntoView({ behavior: 'smooth' });
        });
    }
    
    
// Logique d'affichage initial améliorée
const ancreURL = window.location.hash.substring(1); // Récupère le mot après le # (ex: "hypotheque")

if (ancreURL) {
    // Si une ancre est présente dans l'URL, on affiche la calculatrice correspondante
    showCalculator(ancreURL);

} else {
    // Sinon, on applique l'ancienne logique avec la mémoire de session
    const derniereCalc = sessionStorage.getItem('derniereCalculatrice');
    if (derniereCalc) {
        showCalculator(derniereCalc);
    } else {
        showCalculator('retraite'); // Calculatrice par défaut
    }
}
    // =========================================================================
    // === CARROUSEL DES CALCULATRICES ===
    // =========================================================================
    const gridContainer = document.getElementById('calculator-grid-container');
    const scrollLeftBtn = document.getElementById('scroll-left-btn');
    const scrollRightBtn = document.getElementById('scroll-right-btn');

    if (gridContainer && scrollLeftBtn && scrollRightBtn) {
        const checkScrollButtons = () => {
            setTimeout(() => {
                const maxScrollLeft = gridContainer.scrollWidth - gridContainer.clientWidth;
                scrollLeftBtn.disabled = gridContainer.scrollLeft < 10;
                scrollRightBtn.disabled = gridContainer.scrollLeft > maxScrollLeft - 10;
            }, 100);
        };

        const scrollGrid = (direction) => {
            const scrollAmount = gridContainer.clientWidth * 0.8;
            gridContainer.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
        };

        scrollLeftBtn.addEventListener('click', () => scrollGrid(-1));
        scrollRightBtn.addEventListener('click', () => scrollGrid(1));
        gridContainer.addEventListener('scroll', checkScrollButtons);
        window.addEventListener('resize', checkScrollButtons);
        checkScrollButtons();
    }
});
