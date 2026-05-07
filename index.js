// ==========================================
// INITIALISATION & NAVIGATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menu-toggle');
    const navLinks = document.getElementById('nav-links');
    
    // Menu hamburger pour mobile
    if(menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('show');
        });
    }
});

// ==========================================
// MICRO-DIAGNOSTIC (Page d'accueil)
// ==========================================
function answerDiag(questionId, answer) {
    const item = document.getElementById(questionId);
    if (!item) return;

    const btns = item.querySelectorAll('.diag-btn');
    btns.forEach(btn => btn.classList.remove('active'));
    item.querySelector(`.diag-${answer}`).classList.add('active');

    const feedbackDiv = item.querySelector('.diag-feedback');
    let feedbackHTML = '';

    // Logique basée sur les 4 piliers
    switch (questionId) {
        case 'diag-budget':
            feedbackHTML = answer === 'oui' 
                ? 'Excellent. La maîtrise du cash-flow est le socle de la liberté financière.' 
                : 'Sans suivi, l\'épargne devient accidentelle plutôt que volontaire. <a href="budget.html" class="diag-link">Optimisez vos liquidités →</a>';
            break;
            
        case 'diag-credit':
            feedbackHTML = answer === 'oui' 
                ? 'Bravo. Une cote solide est un levier puissant pour vos projets immobiliers.' 
                : 'Une mauvaise structure de crédit peut vous coûter des dizaines de milliers en intérêts. <a href="credit.html" class="diag-link">Améliorez votre score →</a>';
            break;

        case 'diag-placements':
            feedbackHTML = answer === 'oui' 
                ? 'Parfait. Vous maximisez l\'abri fiscal pour accélérer votre croissance.' 
                : 'Ne pas utiliser ses droits de cotisation, c\'est faire un cadeau involontaire à l\'impôt. <a href="investissements.html" class="diag-link">Révisez vos placements →</a>';
            break;

        case 'diag-retraite':
            feedbackHTML = answer === 'oui' 
                ? 'Félicitations. La clarté sur vos futurs revenus est la clé de la sérénité.' 
                : 'La plupart des gens sous-estiment le capital nécessaire pour maintenir leur niveau de vie. <a href="retraite.html" class="diag-link">Simulez votre patrimoine →</a>';
            break;
    }

    feedbackDiv.innerHTML = feedbackHTML;
    feedbackDiv.classList.add('show');
}
