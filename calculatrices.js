document.addEventListener('DOMContentLoaded', () => {
    // Fonctions utilitaires
    const fmtCurrency = n => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
    const toFloat = v => parseFloat(String(v).replace(',', '.')) || 0;

    // --- Navigation entre calculatrices (SECTION CORRIGÉE) ---
    const calcCards = document.querySelectorAll('.card-grid .card[data-calc]');
    const calcSections = document.querySelectorAll('.calculator-card');

    // Fonction pour afficher une calculatrice spécifique
    const showCalculator = (key) => {
        const targetSection = document.getElementById(`calc-${key}`);
        if (!targetSection) return;

        // Met à jour la visibilité des sections de calculatrices
        calcSections.forEach(sec => {
            sec.classList.remove('active');
        });
        targetSection.classList.add('active');

        // Met à jour le style des cartes de sélection
        calcCards.forEach(card => {
            if (card.dataset.calc === key) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });
    };

    // Ajoute un écouteur d'événement sur chaque carte
    calcCards.forEach(card => {
        card.addEventListener('click', () => {
            const calculatorKey = card.dataset.calc;
            showCalculator(calculatorKey);
        });
    });
    
    // --- Logique des calculatrices (inchangée) ---

    // Calculatrice — Retraite
    document.getElementById('form-retraite')?.addEventListener('submit', e => {
        e.preventDefault();
        const resultatRetraite = document.getElementById('resultat-retraite');
        const ageActuel = toFloat(document.getElementById('age-actuel').value);
        const ageRetraite = toFloat(document.getElementById('age-retraite').value);
        const epargneMensuelle = toFloat(document.getElementById('epargne-mensuelle').value);
        const rendementAnnuel = toFloat(document.getElementById('rendement').value) / 100;

        if (ageRetraite <= ageActuel) {
            resultatRetraite.textContent = "L'âge de retraite doit être supérieur à l'âge actuel.";
            return;
        }

        const annees = ageRetraite - ageActuel;
        const rMensuel = Math.pow(1 + rendementAnnuel, 1 / 12) - 1;
        const FV = epargneMensuelle * ((Math.pow(1 + rMensuel, annees * 12) - 1) / rMensuel);
        resultatRetraite.textContent = `Capital estimé à la retraite : ${fmtCurrency(FV)}.`;
    });

    // Calculatrice — Valeur future
    document.getElementById('form-vf')?.addEventListener('submit', e => {
        e.preventDefault();
        const resultatVF = document.getElementById('resultat-vf');
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
        resultatVF.textContent = `Valeur future estimée : ${fmtCurrency(FV_initial + FV_cot)}.`;
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
        resultatHypo.textContent = `Mensualité estimée : ${fmtCurrency(mensualite)}.`;
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
        resultatTrex.textContent = `Impact des frais : ${fmtCurrency(capitalSansFrais - capitalAvecFrais)}. Valeur finale : ${fmtCurrency(capitalAvecFrais)}.`;
    });
    
    // Déclencher le calcul initial pour la première calculatrice visible
    document.getElementById('form-retraite')?.dispatchEvent(new Event('submit'));
});
