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

    // Gestion de l'état des boutons (visuel)
    const btns = item.querySelectorAll('.diag-btn');
    btns.forEach(btn => btn.classList.remove('active'));
    item.querySelector(`.diag-${answer}`).classList.add('active');

    // Préparation de la boîte de retour (feedback)
    const feedbackDiv = item.querySelector('.diag-feedback');
    let feedbackHTML = '';

    // Logique des réponses
    if (questionId === 'diag-q1') {
        if (answer === 'oui') {
            feedbackHTML = 'Parfait. La conscience de ses sorties d\'argent est le premier pilier de la richesse.';
        } else {
            feedbackHTML = 'Un simple café quotidien peut représenter plus de 30 000 $ perdus sur 25 ans. <a href="pieges.html" class="diag-link">Calculez vos fuites d\'argent →</a>';
        }
    } 
    else if (questionId === 'diag-q2') {
        if (answer === 'oui') {
            feedbackHTML = 'Excellent. Un portefeuille bien structuré est votre meilleur bouclier contre la perte de pouvoir d\'achat.';
        } else {
            feedbackHTML = 'L\'argent qui dort dans un compte chèque perd silencieusement sa valeur. <a href="investissements.html" class="diag-link">Découvrez comment vous protéger →</a>';
        }
    }
    else if (questionId === 'diag-q3') {
        if (answer === 'oui') {
            feedbackHTML = 'Félicitations. Avoir un objectif chiffré est la garantie d\'une retraite sereine.';
        } else {
            feedbackHTML = 'Sans objectif précis, il est impossible de savoir si vous épargnez suffisamment. <a href="simulateur-retraite.html" class="diag-link">Créez votre plan exact →</a>';
        }
    }

    // Affichage avec animation fluide
    feedbackDiv.innerHTML = feedbackHTML;
    feedbackDiv.classList.add('show');
}
