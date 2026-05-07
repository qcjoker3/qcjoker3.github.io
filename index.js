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
            feedbackHTML = answer === 'non' 
                ? 'Bravo ! Vous faites partie des exceptions de ce monde. <a href="budget.html" class="diag-link">En savoir plus →</a>' 
                : 'Les frais bancaires sont aberrants et détruisent votre patrimoine. <a href="budget.html" class="diag-link">En savoir plus →</a>';
            break;
            
        case 'diag-credit':
            feedbackHTML = answer === 'non' 
                ? 'Bravo ! Vous planifiez très bien vos besoins futurs en liquidités. <a href="credit.html" class="diag-link">En savoir plus →</a>' 
                : 'Les frais d\'intérêt sont vicieux et détruisent votre patrimoine. <a href="credit.html" class="diag-link">En savoir plus →</a>';
            break;

        case 'diag-placements':
            feedbackHTML = answer === 'oui' 
                ? 'Parfait. Vous avez des placements et connaissez le niveau de risque adapté à votre situation. <a href="investissements.html" class="diag-link">En savoir plus →</a>' 
                : 'Ne pas connaître son profil d\'investisseur, c\'est comme naviguer en haute mer sans boussole. <a href="investissements.html" class="diag-link">En savoir plus →</a>';
            break;

        case 'diag-retraite':
            feedbackHTML = answer === 'oui' 
                ? 'Félicitations. Avoir un plan financier est la première étape de la création d\'un patrimoine. <a href="retraite.html" class="diag-link">En savoir plus →</a>' 
                : 'La plupart des gens sous-estiment le capital nécessaire pour maintenir leur niveau de vie. <a href="retraite.html" class="diag-link">En savoir plus →</a>';
            break;
    }

    feedbackDiv.innerHTML = feedbackHTML;
    feedbackDiv.classList.add('show');
}            
        case 'diag-credit':
            feedbackHTML = answer === 'non' 
                ? 'Bravo! Vous planifiez très bien vos besoins futurs en liquidités. <a href="credit.html" class="diag-link">En savoir plus →</a>' 
                : 'Les frais d\'intérêts sont vicieux et détruisent votre patrimoine. <a href="credit.html" class="diag-link">En savoir plus →</a>';
            break;

        case 'diag-placements':
            feedbackHTML = answer === 'oui' 
                ? 'Parfait. Vous avez des placements et connaissez le risque adapté à votre situation. <a href="investissements.html" class="diag-link">En savoir plus →</a>' 
                : 'Ne pas connaître son profil d\'investisseur c\'est comme naviguer en haute mer sans boussole. c\'est faire un cadeau involontaire à l\'impôt. <a href="investissements.html" class="diag-link">En savoir plus →</a>';
            break;

        case 'diag-retraite':
            feedbackHTML = answer === 'oui' 
                ? 'Félicitations. Avoir un plan financier est la première étape de la création d\'un patrimoine.  <a href="retraite.html" class="diag-link">En savoir plus →</a>' 
                : 'La plupart des gens sous-estiment le capital nécessaire pour maintenir leur niveau de vie. <a href="retraite.html" class="diag-link">En savoir plus →</a>';
            break;
    }

    feedbackDiv.innerHTML = feedbackHTML;
    feedbackDiv.classList.add('show');
}
