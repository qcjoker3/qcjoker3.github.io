
document.addEventListener('DOMContentLoaded', () => {
    // Sélectionne tous les boutons de filtre et toutes les cartes d'articles
    const boutonsFiltre = document.querySelectorAll('.filtre-btn');
    const articles = document.querySelectorAll('.carte-article');

    // Ajoute un écouteur d'événement sur chaque bouton
    boutonsFiltre.forEach(bouton => {
        bouton.addEventListener('click', () => {
            // Retire la classe 'active' de tous les boutons
            boutonsFiltre.forEach(btn => btn.classList.remove('active'));
            // Ajoute la classe 'active' au bouton cliqué
            bouton.classList.add('active');

            // Récupère la catégorie du bouton cliqué
            const categorieFiltre = bouton.dataset.categorie;

            // Parcourt chaque article pour décider de l'afficher ou de le cacher
            articles.forEach(article => {
                const categorieArticle = article.dataset.categorie;

                // Si la catégorie correspond ou si on a cliqué sur "Tous"
                if (categorieFiltre === 'tous' || categorieFiltre === categorieArticle) {
                    article.style.display = 'block'; // Affiche l'article
                } else {
                    article.style.display = 'none'; // Cache l'article
                }
            });
        });
    });
});
