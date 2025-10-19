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
    const champsArgent = ['ret-epargne-actuelle', 'ret-cotisation-mensuelle', 'vf-montant-initial', 'vf-cotisation', 'hypo-montant', 'trex-montant', 'trex-cotisation-annuelle', 'al-prix-propriete', 'al-mise-de-fonds', 'al-taxes-annuelles', 'al-assurance-proprio', 'al-frais-condo', 'al-loyer-mensuel', 'al-assurance-loc', 'hypo-prix-propriete', 'hypo-mise-de-fonds', 'duree-montant-initial','duree-retrait-annuel','fire-epargne-actuelle','fire-epargne-annuelle','fire-depenses-annuelles', 'reer-celi-montant-annuel','cout-montant-depense','fnb-montant-initial','fnb-cotisation-mensuelle'];
    const champsEntier = ['ret-age-actuel', 'ret-age-retraite'];
    
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

    // ==========================================================
    // === SYSTÈME DE NAVIGATION ENTRE CALCULATRICES (CORRIGÉ) ===
    // ==========================================================
    const calcCards = document.querySelectorAll('.card-grid .card[data-calc]');
    const calcSections = document.querySelectorAll('.calculator-card');
    const allExplications = document.querySelectorAll('.boite-explication');

    const showCalculator = (key) => {
        if (!key) return;

        const targetSection = document.getElementById(`calc-${key}`);
        const targetExplication = document.getElementById(`explication-${key}`);
        
        calcSections.forEach(sec => sec.classList.remove('active'));
        allExplications.forEach(box => box.classList.remove('active'));
        calcCards.forEach(card => card.classList.remove('selected'));

        if (targetSection) targetSection.classList.add('active');
        if (targetExplication) targetExplication.classList.add('active');

        const selectedCard = document.querySelector(`.card[data-calc='${key}']`);
        if (selectedCard) selectedCard.classList.add('selected');

        sessionStorage.setItem('derniereCalculatrice', key);
    };

    calcCards.forEach(card => {
        card.addEventListener('click', () => {
            const calculatorId = card.dataset.calc;
            showCalculator(calculatorId);
        });
    });

    // --- LOGIQUE D'AFFICHAGE INITIAL ---
    const ancreURL = window.location.hash.substring(1);
    const cardForAncre = document.querySelector(`.card[data-calc='${ancreURL}']`);

    if (ancreURL && cardForAncre) {
        showCalculator(ancreURL);
        const calculatorElement = document.getElementById(`calc-${ancreURL}`);
        if (calculatorElement) {
            setTimeout(() => {
                calculatorElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    } else {
        const derniereCalc = sessionStorage.getItem('derniereCalculatrice');
        if (derniereCalc && document.querySelector(`.card[data-calc='${derniereCalc}']`)) {
            showCalculator(derniereCalc);
        } else if (calcCards.length > 0) {
            const defaultCalcId = calcCards[0].dataset.calc;
            showCalculator(defaultCalcId);
        }
    }
// =========================================================================
// === NOUVELLE CALCULATRICE DE RETRAITE 360° ===
// =========================================================================

const formRetraite = document.getElementById('financial-plan-form');
if (formRetraite) {
    // --- DÉCLARATIONS INITIALES ---
    const spinner = document.getElementById('spinner');
    const resultsArea = document.getElementById('results-area');
    const wizardSteps = formRetraite.querySelectorAll('.wizard-step');
    const conjointToggle = document.getElementById('toggleConjoint');
    const allocationInputs = formRetraite.querySelectorAll('.allocation');
    const allocationError = document.getElementById('allocation-error');
    const submitButton = document.getElementById('submit-button');
    let currentStep = 1;
    let charts = {};

    // --- NAVIGATION DU FORMULAIRE ---
    formRetraite.addEventListener('click', (e) => {
        if (e.target.matches('[data-next]')) { goToStep(parseInt(e.target.dataset.next)); }
        else if (e.target.matches('[data-prev]')) { goToStep(parseInt(e.target.dataset.prev)); }
    });
    
    function goToStep(step) {
        if (step > 0 && step <= wizardSteps.length) {
            wizardSteps[currentStep - 1].classList.remove('active');
            wizardSteps[step - 1].classList.add('active');
            currentStep = step;
        }
    }

    // --- GESTION DES CHAMPS DU FORMULAIRE ---
    function handleConjointView() {
        const isCouple = conjointToggle.checked;
        ['conjoint-profil-group', 'conjoint-bilan-group', 'conjoint-revenus-group'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.classList.toggle('hidden', !isCouple);
        });
        
        ['alloc-reer2', 'alloc-celi2'].forEach(id => {
            const el = document.getElementById(id);
            if(el) {
                el.closest('.form-group').style.display = isCouple ? 'block' : 'none';
                el.disabled = !isCouple;
            }
        });
        validateAllocation();
    }

    function validateAllocation() {
        const getVal = (id) => parseFloat(document.getElementById(id).value) || 0;
        const totalEpargne = getVal('epargneAnnuelle');
        let totalAllocated = 0;
        allocationInputs.forEach(input => { if (!input.disabled) { totalAllocated += getVal(input.id); } });
        const isValid = Math.abs(totalAllocated - totalEpargne) < 0.01;
        allocationError.textContent = isValid ? '' : `Répartition (${totalAllocated.toLocaleString('fr-CA')} $) ≠ Total (${totalEpargne.toLocaleString('fr-CA')} $).`;
        submitButton.disabled = !isValid;
    }

    conjointToggle.addEventListener('change', handleConjointView);
    document.getElementById('epargneAnnuelle').addEventListener('input', validateAllocation);
    allocationInputs.forEach(input => input.addEventListener('input', validateAllocation));
    handleConjointView();
    
    // --- SOUMISSION ET ORCHESTRATION DE LA SIMULATION ---
    formRetraite.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("ÉTAPE 1 : Clic sur le bouton 'Lancer l'Analyse' détecté."); // <-- AJOUTEZ CECI
        if (submitButton.disabled) return;
        spinner.style.display = 'block';
        resultsArea.style.display = 'none';
        await new Promise(resolve => setTimeout(resolve, 50));

        try {
            const plan = getPlanInputs();
            console.log("ÉTAPE 2 : Données du formulaire lues :", plan); // <-- AJOUTEZ CECI
            const objectif = document.getElementById('objectif').value;

            const strategies = [
                { name: "REER/CRI d'abord (fiscalité élevée)", order: ['reer', 'cri', 'nonEnr', 'celi'] },
                { name: "Non-Enregistré d'abord", order: ['nonEnr', 'reer', 'cri', 'celi'] },
                { name: "Optimale 'Laferrière' (anti-récupération)", order: ['celi', 'nonEnr', 'reer', 'cri'] },
                { name: "Revenu Lissé (Décaissement Mixte)", order: { reer: 0.6, cri: 0, nonEnr: 0.2, celi: 0.2 } }
            ];

            const allResults = strategies.map(strategy => {
                const result = runMonteCarlo(plan, strategy.order);
                result.strategyName = strategy.name;
                return result;
            });

            let bestResult;
            switch (objectif) {
                case 'duree':
                    bestResult = allResults.sort((a, b) => b.successRate - a.successRate)[0];
                    break;
                case 'impot':
                    bestResult = allResults.sort((a, b) => a.medianTax - b.medianTax)[0];
                    break;
                case 'capital':
                default:
                    bestResult = allResults.sort((a, b) => b.medianCapital - a.medianCapital)[0];
                    break;
            }
            
            displayResults(bestResult, plan);

        } catch (error) {
            console.error("Simulation Error:", error);
            alert("Une erreur est survenue durant la simulation.");
        } finally {
            spinner.style.display = 'none';
            resultsArea.style.display = 'block';
            resultsArea.scrollIntoView({ behavior: 'smooth' });
        }
    });

    // --- EXTRACTION ET PRÉPARATION DES DONNÉES ---
function getPlanInputs() {
    const isCouple = document.getElementById('toggleConjoint').checked;
    const getVal = (id) => parseFloat(document.getElementById(id).value) || 0;

    return {
        isCouple,
        p1: { id: 'p1', age: getVal('age1'), revenu: getVal('revenu1'), croissanceRevenu: getVal('croissanceRevenu1') / 100, ageDebutTravail: getVal('ageDebutTravail1'), reer: getVal('reer1'), cri: getVal('cri1'), celi: getVal('celi1'), ageDebutRrq: getVal('ageDebutRrq1'), ageDebutPsv: getVal('ageDebutPsv1'), pension: { amount: getVal('pension1'), isIndexed: document.getElementById('pensionIndexee1').checked }, travail: { amount: getVal('travail1'), ageFin: getVal('ageFinTravail1') } },
        p2: isCouple ? { id: 'p2', age: getVal('age2'), revenu: getVal('revenu2'), croissanceRevenu: getVal('croissanceRevenu2') / 100, ageDebutTravail: getVal('ageDebutTravail2'), reer: getVal('reer2'), cri: getVal('cri2'), celi: getVal('celi2'), ageDebutRrq: getVal('ageDebutRrq2'), ageDebutPsv: getVal('ageDebutPsv2'), pension: { amount: getVal('pension2'), isIndexed: document.getElementById('pensionIndexee2').checked }, travail: { amount: getVal('travail2'), ageFin: getVal('ageFinTravail2') } } : null,
        commun: { 
            ageRetraite: getVal('ageRetraite'), 
            esperanceVie: getVal('esperanceVie'), 
            depenseVisee: getVal('depenseVisee'), 
            inflation: getVal('inflation') / 100, 
            rendementMoyen: getVal('rendementMoyen') / 100, 
            volatilite: getVal('volatilite') / 100, 
            nonEnr: getVal('nonEnr'), 
            nonEnrCoutBase: getVal('nonEnrCoutBase'), 
            epargne: { reer1: getVal('alloc-reer1'), celi1: getVal('alloc-celi1'), reer2: isCouple ? getVal('alloc-reer2') : 0, celi2: isCouple ? getVal('alloc-celi2') : 0, nonEnr: getVal('alloc-nonEnr') } 
        }
    };
}
        
    const K = {
        fed: { bpa: 15705, ageAmount: 8790, ageAmountThreshold: 42335, pensionAmount: 2000, brackets: [[55867, 0.15], [111733, 0.205], [173205, 0.26], [246752, 0.29], [Infinity, 0.33]] },
        qc: { bpa: 18056, ageAmount: 3464, pensionAmount: 3464, brackets: [[51780, 0.14], [103545, 0.19], [126000, 0.24], [Infinity, 0.2575]] },
        oas: { clawbackThreshold: 90997, maxAmount: 8560 },
        gis: { maxAmountSingle: 12500, clawbackRate: 0.5, exemption: 5000 },
        solidarity: { maxAmountSingle: 1200, threshold: 41000, clawbackRate: 0.04 },
        ympe: {1980:13100, 1990:28900, 2000:37600, 2010:47200, 2020:58700, 2025:69700, 2030:78000, 2040:95000, 2050:115000},
        rrifFactors: { 71: 0.0528, 72: 0.054, 73: 0.0553, 74: 0.0567, 75: 0.0582, 76: 0.0598, 77: 0.0617, 78: 0.0636, 79: 0.0658, 80: 0.0682, 81: 0.0708, 82: 0.0738, 83: 0.0771, 84: 0.0808, 85: 0.0851, 86: 0.0899, 87: 0.0955, 88: 0.1021, 89: 0.1099, 90: 0.1192, 91: 0.1306, 92: 0.1449, 93: 0.1634, 94: 0.1879, 95: 0.2 }
    };

    // --- MOTEUR DE SIMULATION ---
    function estimateQPP(person, croissanceRevenu) {
        const contributingYears = 65 - person.ageDebutTravail;
        if (contributingYears <= 0) return 0;
        let totalNormalizedEarnings = 0;
        const currentYear = new Date().getFullYear();
        for (let i = 0; i < contributingYears; i++) {
            const year = currentYear - (person.age - person.ageDebutTravail) + i;
            const ympeYear = Object.keys(K.ympe).reduce((prev, curr) => Math.abs(curr - year) < Math.abs(prev - year) ? curr : prev);
            
            const salary = person.revenu * Math.pow(1 + croissanceRevenu, i);
            totalNormalizedEarnings += Math.min(salary, K.ympe[ympeYear]) / K.ympe[ympeYear];
        }
        const avgNormalizedEarnings = totalNormalizedEarnings / contributingYears;
        return avgNormalizedEarnings * K.ympe[2025] * 0.25;
    }

    function runMonteCarlo(plan, strategy) {
        plan.p1.rrqEst = estimateQPP(plan.p1, plan.p1.croissanceRevenu);
        if (plan.isCouple) { plan.p2.rrqEst = estimateQPP(plan.p2, plan.p2.croissanceRevenu); }
        const results = Array.from({ length: 1000 }, () => runSingleProjection(plan, strategy));
        const finalCapitals = results.map(r => r.finalCapital).sort((a, b) => a - b);
        const totalTaxes = results.map(r => r.totalTax).sort((a, b) => a - b);
        const successCount = finalCapitals.filter(c => c > 0).length;
        const medianCapital = ss.median(finalCapitals);
        const medianSimIndex = results.findIndex(r => r.finalCapital >= medianCapital);
        return { 
        successRate: (successCount / 1000) * 100, 
        medianCapital, 
        medianTax: ss.median(totalTaxes), // <--- MODIFICATION ICI
        projections: results.map(r => r.capitalTrajectory), 
        medianProjection: results[medianSimIndex] 
    };
}

    function runSingleProjection(plan, strategy) {
        const { p1, p2, commun, isCouple } = plan;
        const numYears = commun.esperanceVie - p1.age + 1;
        const returnSequence = Array.from({length: numYears}, () => ss.probit(Math.random()) * commun.volatilite + commun.rendementMoyen);
        let comptes = { p1: { ...p1 }, p2: isCouple ? { ...p2 } : null, commun: { ...commun } };
        let capitalTrajectory = [], incomeTrajectory = [], decaissementTrajectory = [], totalTax = 0;

        for (let i = 0; i < numYears; i++) {
            const age1 = p1.age + i;
            const age2 = isCouple ? p2.age + i : 0;
            const currentReturn = returnSequence[i];
            const inflationMultiplier = Math.pow(1 + commun.inflation, i);
            if (age1 < commun.ageRetraite) {
                const { epargne } = commun;
                comptes.p1.reer += epargne.reer1; comptes.p1.celi += epargne.celi1;
                if (isCouple) { comptes.p2.reer += epargne.reer2; comptes.p2.celi += epargne.celi2; }
                comptes.commun.nonEnr += epargne.nonEnr;
                comptes.commun.nonEnrCoutBase += epargne.nonEnr;
            }
            const soldesDebutAnnee = JSON.parse(JSON.stringify(comptes));
            if (age1 >= commun.ageRetraite) {
                const depenseNetteVisee = commun.depenseVisee * inflationMultiplier;
                const fiscalYear = calculateYearlyFinances(soldesDebutAnnee, depenseNetteVisee, plan, {age1, age2}, inflationMultiplier, strategy);
                totalTax += fiscalYear.totalTax;
                ['reer', 'cri', 'celi'].forEach(type => {
                    comptes.p1[type] -= fiscalYear.retraits[type + '1'];
                    if (isCouple) comptes.p2[type] -= fiscalYear.retraits[type + '2'];
                });
                comptes.commun.nonEnr -= fiscalYear.retraits.nonEnr;
                comptes.commun.nonEnrCoutBase -= fiscalYear.coutBaseConsomme;
                incomeTrajectory.push({ age: age1, ...fiscalYear });
            }
            Object.keys(comptes.p1).filter(k => ['reer', 'cri', 'celi'].includes(k)).forEach(type => comptes.p1[type] *= (1 + currentReturn));
            if (isCouple) Object.keys(comptes.p2).filter(k => ['reer', 'cri', 'celi'].includes(k)).forEach(type => comptes.p2[type] *= (1 + currentReturn));
            comptes.commun.nonEnr *= (1 + currentReturn);
            let totalCapital = comptes.p1.reer + comptes.p1.cri + comptes.p1.celi + (isCouple ? (comptes.p2.reer + comptes.p2.cri + comptes.p2.celi) : 0) + comptes.commun.nonEnr;
            capitalTrajectory.push({ age: age1, capital: totalCapital });
            decaissementTrajectory.push({ age: age1, reer: comptes.p1.reer + (isCouple ? comptes.p2.reer : 0), cri: comptes.p1.cri + (isCouple ? comptes.p2.cri : 0), celi: comptes.p1.celi + (isCouple ? comptes.p2.celi : 0), nonEnr: comptes.commun.nonEnr });
        }
        return { finalCapital: capitalTrajectory.slice(-1)[0].capital, totalTax, capitalTrajectory, incomeTrajectory, decaissementTrajectory };
    }
    
    // --- MOTEUR FISCAL ET FINANCIER ---
    function calculateYearlyFinances(soldes, depenseVisee, plan, ages, inflation, strategy) {
        const { p1, p2, isCouple } = plan;
        // La logique est simplifiée pour une personne seule pour la clarté. L'extension pour un couple suivrait la même structure.
        const revenus = {
            rrq1: calculatePension(p1.rrqEst, 65, p1.ageDebutRrq, ages.age1, inflation, true),
            psv1: calculatePension(K.oas.maxAmount, 65, p1.ageDebutPsv, ages.age1, inflation, false),
            pension1: calculatePension(p1.pension.amount, plan.commun.ageRetraite, plan.commun.ageRetraite, ages.age1, inflation, false, p1.pension.isIndexed),
            travail1: (ages.age1 < p1.travail.ageFin) ? p1.travail.amount * inflation : 0,
        };
    
        const retraits = { reer1: 0, cri1: 0, celi1: 0, nonEnr: 0, reer2: 0, cri2: 0, celi2: 0 };
        let besoinRetraitNet = Math.max(0, depenseVisee - (revenus.rrq1 + revenus.pension1 + revenus.travail1));
    
        // Retraits FERR/FRV minimums (bruts, donc ils réduisent le besoin de retrait net)
        ['p1', 'p2'].forEach(p_key => {
            if (!plan[p_key]) return;
            ['reer', 'cri'].forEach(type => {
                const age = ages[p_key.replace('p', 'age')];
                if (age >= 71) {
                    const factor = K.rrifFactors[Math.min(age, 95)] || 0.2;
                    const retraitMin = soldes[p_key][type] * factor;
                    retraits[type + p_key.slice(-1)] = retraitMin;
                }
            });
        });
        const retraitsMinimauxImposables = retraits.reer1 + retraits.cri1 + retraits.reer2 + retraits.cri2;
    
        // Le besoin de retrait brut est estimé. Une version avancée serait itérative.
        let besoinRetraitBrut = Math.max(0, besoinRetraitNet / 0.75 - retraitsMinimauxImposables);

        if (Array.isArray(strategy)) { // Mode séquentiel
            for (const type of strategy) {
                if (besoinRetraitBrut <= 0) break;
                const compte = type === 'nonEnr' ? 'nonEnr' : type + '1';
                const solde = (type === 'nonEnr') ? soldes.commun.nonEnr : soldes.p1[type];
                const retrait = Math.min(besoinRetraitBrut, solde - (retraits[compte] || 0));
                retraits[compte] += retrait;
                besoinRetraitBrut -= retrait;
            }
        } else { // Mode mixte (pro-rata)
            const totalProportions = Object.values(strategy).reduce((a, b) => a + b, 0);
            if (totalProportions > 0) {
                for (const type in strategy) {
                    const proportion = strategy[type];
                    const montantRetrait = besoinRetraitBrut * proportion;
                    const compte = type === 'nonEnr' ? 'nonEnr' : type + '1';
                    const solde = (type === 'nonEnr') ? soldes.commun.nonEnr : soldes.p1[type];
                    const retrait = Math.min(montantRetrait, solde - (retraits[compte] || 0));
                    retraits[compte] += retrait;
                }
            }
        }
    
        const gainCapitalRealise = (retraits.nonEnr / soldes.commun.nonEnr) * (soldes.commun.nonEnr - soldes.commun.nonEnrCoutBase) || 0;
        const coutBaseConsomme = retraits.nonEnr - gainCapitalRealise;
    
        const incomeP1 = { 
            ordinaire: revenus.rrq1 + revenus.pension1 + revenus.travail1 + retraits.reer1 + retraits.cri1, 
            gainCapital: gainCapitalRealise, 
            pension: revenus.pension1 + retraits.reer1 + retraits.cri1,
            travail: revenus.travail1
        };
        
        const fiscalP1 = calculateTaxesAndBenefits(incomeP1, revenus.psv1, ages.age1, inflation, isCouple);
    
        return { 
            totalTax: fiscalP1.totalTax, 
            retraits, 
            revenus, 
            coutBaseConsomme,
            credits: { gis: fiscalP1.gis, solidarity: fiscalP1.solidarity },
            netIncome: fiscalP1.netIncome
        };
    }
    
    function calculateTaxesAndBenefits(income, psv, age, inflationMultiplier, isCouple) {
        const i = (val) => val * inflationMultiplier;
        let netIncomeForBenefits = income.ordinaire + income.gainCapital;
        
        const gisIncome = Math.max(0, netIncomeForBenefits - (income.travail > 0 ? i(K.gis.exemption) : 0));
        const gisClawback = gisIncome * K.gis.clawbackRate;
        const gisAmount = Math.max(0, i(K.gis.maxAmountSingle) - gisClawback);
    
        const solidarityClawback = Math.max(0, (netIncomeForBenefits - i(K.solidarity.threshold)) * K.solidarity.clawbackRate);
        const solidarityAmount = Math.max(0, i(K.solidarity.maxAmountSingle) - solidarityClawback);
    
        const oasClawback = Math.max(0, (netIncomeForBenefits - i(K.oas.clawbackThreshold)) * 0.15);
        const psvNet = Math.max(0, psv - oasClawback);
        
        let taxableIncome = income.ordinaire + (income.gainCapital * 0.5) + psvNet;
    
        const calcBracketTax = (brackets) => {
            let tax = 0; let lastLimit = 0;
            for (const [limit, rate] of brackets) {
                if (taxableIncome > lastLimit) tax += (Math.min(taxableIncome, i(limit)) - lastLimit) * rate;
                lastLimit = i(limit);
            }
            return tax;
        };
        let fedTax = calcBracketTax(K.fed.brackets);
        let qcTax = calcBracketTax(K.qc.brackets);
    
        let fedCredits = i(K.fed.bpa);
        let qcCredits = i(K.qc.bpa);
    
        if (age >= 65) {
            const fedAgeAmountReduction = Math.max(0, (netIncomeForBenefits - i(K.fed.ageAmountThreshold)) * 0.15);
            fedCredits += Math.max(0, i(K.fed.ageAmount) - fedAgeAmountReduction);
            qcCredits += i(K.qc.ageAmount);
        }
        if (income.pension > 0) {
            fedCredits += Math.min(i(K.fed.pensionAmount), income.pension);
            qcCredits += Math.min(i(K.qc.pensionAmount), income.pension);
        }
    
        fedTax = Math.max(0, fedTax - (fedCredits * 0.15));
        qcTax = Math.max(0, qcTax - (qcCredits * 0.14));
        const totalTax = fedTax + qcTax;
        
        const netIncome = netIncomeForBenefits + psvNet + gisAmount + solidarityAmount - totalTax;
    
        return { 
            totalTax: totalTax, 
            gis: gisAmount, 
            solidarity: solidarityAmount,
            netIncome: netIncome
        };
    }
    
    function calculatePension(base, baseAge, startAge, currentAge, inflationMultiplier, isRrq, isIndexed) {
        if (currentAge < startAge || !base) return 0;
        const factor = isRrq ? (startAge > baseAge ? 0.007 : -0.006) : (startAge > baseAge ? 0.006 : -0.006);
        const adjustment = (startAge - baseAge) * 12 * factor;
        let adjustedBase = base * (1 + adjustment);
        
        if(isIndexed === false){ // Unindexed private pension
            // Value is fixed at retirement date in future dollars, then stays constant
            const yearsToRetirement = plan.commun.ageRetraite - plan.p1.age;
            return base * Math.pow(1 + plan.commun.inflation, yearsToRetirement);
        }
        
        // Government pensions and indexed private pensions are inflated every year
        return adjustedBase * inflationMultiplier;
    }
    
    // --- AFFICHAGE DES RÉSULTATS ---
    function displayResults(result, plan) {
        console.log("ÉTAPE 3 : Affichage des résultats demandé.", result); // <-- AJOUTEZ CECI
        const { successRate, medianCapital, medianTax, projections, medianProjection, strategyName } = result;
        const fmt = (val) => (val || 0).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 });
        
        document.getElementById('tauxSucces').textContent = `${successRate.toFixed(1)}%`;
        document.getElementById('capitalMedian').textContent = fmt(medianCapital);
        document.getElementById('strategieOptimale').textContent = strategyName;
        document.getElementById('impotMedian').textContent = fmt(medianTax); 
        document.getElementById('tauxSucces').className = `result-value ${successRate >= 85 ? 'success' : successRate >= 60 ? 'warning' : 'danger'}`;
        
        const firstYearRetirementIncome = result.medianProjection.incomeTrajectory[0];
        if (firstYearRetirementIncome && firstYearRetirementIncome.netIncome) {
            document.getElementById('revenuNetAnnuel').textContent = fmt(firstYearRetirementIncome.netIncome);
        } else {
            document.getElementById('revenuNetAnnuel').textContent = "N/A";
        }

        generateRecommendations(result, plan);
        
        const labels = projections[0].map(p => p.age);
        const p10 = labels.map((_, i) => ss.quantile(projections.map(p => p[i] ? p[i].capital : 0), 0.1));
        const p50 = labels.map((_, i) => ss.quantile(projections.map(p => p[i] ? p[i].capital : 0), 0.5));
        const p90 = labels.map((_, i) => ss.quantile(projections.map(p => p[i] ? p[i].capital : 0), 0.9));

        renderChart('chartMonteCarlo', { type: 'line', data: { labels, datasets: [ { label: 'Pire 10% (P10)', data: p10, borderColor: 'rgba(239, 68, 68, 0.5)', fill: '+1', backgroundColor: 'rgba(239, 68, 68, 0.1)'}, { label: 'Médian (P50)', data: p50, borderColor: '#0D9488', borderWidth: 2.5 }, { label: 'Meilleur 10% (P90)', data: p90, borderColor: 'rgba(16, 185, 129, 0.5)', fill: false }]}});
        
        const incomeData = medianProjection.incomeTrajectory;
        renderChart('chartSourcesFonds', { type: 'bar', data: { labels: incomeData.map(d => d.age), datasets: [ { label: 'Retrait REER/CRI', data: incomeData.map(d => (d.retraits.reer1 || 0) + (d.retraits.reer2 || 0) + (d.retraits.cri1 || 0) + (d.retraits.cri2 || 0)), backgroundColor: '#4338CA' }, { label: 'Retrait Non-Enr.', data: incomeData.map(d => d.retraits.nonEnr || 0), backgroundColor: '#A855F7' }, { label: 'Pension Employeur', data: incomeData.map(d => (d.revenus.pension1 || 0) + (d.revenus.pension2 || 0)), backgroundColor: '#6D28D9'}, { label: 'Revenu de Travail', data: incomeData.map(d => (d.revenus.travail1 || 0) + (d.revenus.travail2 || 0)), backgroundColor: '#be185d'}, { label: 'RRQ/PSV & Prestations', data: incomeData.map(d => (d.revenus.rrq1 || 0) + (d.revenus.rrq2 || 0) + (d.revenus.psv1 || 0) + (d.revenus.psv2 || 0) + (d.credits.gis || 0) + (d.credits.solidarity || 0)), backgroundColor: '#10B981' }, ] }, options: { scales: { x: { stacked: true }, y: { stacked: true } } }});

        const decaissementData = medianProjection.decaissementTrajectory;
        renderChart('chartDecaissement', { type: 'line', data: { labels: decaissementData.map(d => d.age), datasets: [ { label: 'Non-Enregistré', data: decaissementData.map(d => d.nonEnr), backgroundColor: 'rgba(168, 85, 247, 0.7)', borderColor: 'rgba(168, 85, 247, 1)', fill: true, tension: 0.3 }, { label: 'CELI', data: decaissementData.map(d => d.celi), backgroundColor: 'rgba(16, 185, 129, 0.7)', borderColor: 'rgba(16, 185, 129, 1)', fill: true, tension: 0.3 }, { label: 'CRI', data: decaissementData.map(d => d.cri), backgroundColor: 'rgba(239, 68, 68, 0.7)', borderColor: 'rgba(239, 68, 68, 1)', fill: true, tension: 0.3 }, { label: 'REER', data: decaissementData.map(d => d.reer), backgroundColor: 'rgba(67, 56, 202, 0.7)', borderColor: 'rgba(67, 56, 202, 1)', fill: true, tension: 0.3 }, ] }, options: { scales: { y: { stacked: true }}}});

        const creditsList = document.getElementById('creditsList');
        creditsList.innerHTML = '';
        if (firstYearRetirementIncome) {
            creditsList.insertAdjacentHTML('beforeend', `<li>Supplément de Revenu Garanti (SRG): <strong>${fmt(firstYearRetirementIncome.credits.gis)}</strong></li>`);
            creditsList.insertAdjacentHTML('beforeend', `<li>Crédit d'impôt pour solidarité: <strong>${fmt(firstYearRetirementIncome.credits.solidarity)}</strong></li>`);
        }
    }
    
    function generateRecommendations({successRate}, plan) {
        const recList = document.getElementById('recommendationsList');
        recList.innerHTML = '';
        const addRec = (text) => recList.insertAdjacentHTML('beforeend', `<li>${text}</li>`);
        
        if (successRate >= 85) { addRec(`Félicitations! Avec <strong>${successRate.toFixed(1)}%</strong> de succès, votre plan est très robuste.`);
        } else if (successRate < 60) { addRec(`Attention: avec <strong>${successRate.toFixed(1)}%</strong> de succès, des ajustements significatifs sont recommandés.`);
        } else { addRec(`Avec <strong>${successRate.toFixed(1)}%</strong> de succès, votre plan est viable mais pourrait être renforcé.`); }

        if (successRate < 85) {
            if (successRate === 0) {
                addRec("Le taux de succès est de 0%. Il est primordial de revoir le plan en profondeur (établir un plan d'épargne, réduire les dépenses visées ou retarder la retraite).");
                return;
            }
            const totalEpargne = Object.values(plan.commun.epargne).reduce((a, b) => a + b, 0);
            if (totalEpargne > 0) {
                const extraSavings = totalEpargne * (85 / successRate - 1);
                if (extraSavings > 1) { addRec(`Pour viser 85% de succès, vous pourriez augmenter votre épargne annuelle d'environ <strong>${extraSavings.toLocaleString('fr-CA', {style:'currency', currency:'CAD', maximumFractionDigits:0})}</strong> ou retarder la retraite.`); }
            } else {
                if(plan.commun.depenseVisee > 0){
                    const estimatedSavings = plan.commun.depenseVisee * (85 / successRate - 1);
                    if (estimatedSavings > 1) { addRec(`Comme vous n'épargnez pas actuellement, il est crucial de commencer. Pour viser 85% de succès, vous pourriez établir un objectif d'épargne annuelle d'environ <strong>${estimatedSavings.toLocaleString('fr-CA', {style:'currency', currency:'CAD', maximumFractionDigits:0})}</strong>.`); }
                }
            }
        }
    }

    function renderChart(canvasId, config) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        if (charts[canvasId]) { charts[canvasId].destroy(); }
        
        const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        const textColor = isDarkMode ? '#F9FAFB' : '#374151';

        const defaultOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: textColor } } }, interaction: { mode: 'index', intersect: false }, scales: { x: { ticks: { color: textColor }, grid: { color: gridColor } }, y: { ticks: { color: textColor, callback: (v) => (v || 0).toLocaleString('fr-CA', {style:'currency', currency:'CAD', maximumFractionDigits: 0}) }, grid: { color: gridColor } }}};

        const options = { ...defaultOptions, ...config.options };
        if (config.options && config.options.scales) {
            options.scales.x = { ...defaultOptions.scales.x, ...config.options.scales.x };
            options.scales.y = { ...defaultOptions.scales.y, ...config.options.scales.y };
        }

        charts[canvasId] = new Chart(ctx, { type: config.type, data: config.data, options: options });
    }
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
