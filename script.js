let chartInstance = null; // Stocke le graphique pour pouvoir le détruire/recréer

const bouton = document.querySelector('button');

    bouton.addEventListener('click', function() {
        // --- ÉTAPE A : RÉCUPÉRATION DES ÉLÉMENTS DU DOM ---
        const inputCap = document.getElementById('cap');
        const inputDette = document.getElementById('dette');
        const inputTreso = document.getElementById('treso');
        const inputEbitda = document.getElementById('ebitda'); // Nouveau champ
        const resultatVe = document.querySelector('strong');
        const resultatMultiple = document.getElementById('multiple-val'); // Nouveau champ

        // --- ÉTAPE B : CONVERSION EN NOMBRES (parseFloat) ---
        const Cap = parseFloat(inputCap.value);
        const D = parseFloat(inputDette.value);
        const Tr = parseFloat(inputTreso.value);
        const Ebitda = parseFloat(inputEbitda.value);

        // --- ÉTAPE C : VALIDATION RIGOUREUSE ---
        // On vérifie si l'un des 4 champs est vide ou n'est pas un nombre
        if (isNaN(Cap) || isNaN(D) || isNaN(Tr) || isNaN(Ebitda)) {
            resultatVe.textContent = "Erreur : Champs incomplets";
            resultatVe.style.color = "red";
            return; // Arrêt du script
        }

        // --- ÉTAPE D : CALCULS FINANCIERS ---
        // 1. Calcul de la Valeur d'Entreprise
        const Ve = Cap + D - Tr;
        
        // 2. Calcul du Multiple (uniquement si EBITDA > 0 pour éviter l'erreur mathématique)
        let Multiple = 0;
        if (Ebitda > 0) {
            Multiple = Ve / Ebitda;
        }

        // --- ÉTAPE E : AFFICHAGE ET MISE EN FORME ---
        resultatVe.style.color = "#2c3e50"; // On remet la couleur normale
        
        // Affichage de la Ve avec séparateur de milliers
        resultatVe.textContent = Ve.toLocaleString('fr-FR') + " €";
        
        // Affichage du Multiple avec 2 décimales après la virgule
        resultatMultiple.textContent = Multiple.toFixed(2);

        // --- AJOUT DE LA SAUVEGARDE ICI ---
        sauvegarderCalcul(Ve, Multiple);

        // --- ÉTAPE F : MISE À JOUR DU GRAPHIQUE ---
const ctx = document.getElementById('monGraphique').getContext('2d');

// Si un graphique existe déjà, on le détruit pour éviter les superpositions
if (chartInstance) { chartInstance.destroy(); }

chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
        labels: ['Capitalisation', 'Dette'],
        datasets: [{
            data: [Cap, D],
            backgroundColor: ['#3498db', '#e74c3c'], // Bleu et Rouge
            hoverOffset: 4
        }]
    },
    options: {
        responsive: true,
        plugins: {
            legend: { position: 'bottom' }
        }
    }
});

        
    });

            document.getElementById('btn-reset').addEventListener('click', function() {
                // Efface les inputs
                document.querySelectorAll('input').forEach(input => input.value = '');
                // Remet les textes à zéro
                document.querySelector('strong').textContent = '... €';
                document.getElementById('multiple-val').textContent = '...';
            });

// 1. Fonction pour sauvegarder un calcul
function sauvegarderCalcul(ve, multiple) {
    // On récupère l'historique existant ou on crée un tableau vide
    let historique = JSON.parse(localStorage.getItem('monHistorique')) || [];

    // On crée l'entrée avec la date actuelle
    const nouvelleEntree = {
        date: new Date().toLocaleDateString('fr-FR'),
        ve: ve.toLocaleString('fr-FR'),
        multiple: multiple.toFixed(2)
    };

    // On ajoute au début du tableau et on limite aux 5 derniers
    historique.unshift(nouvelleEntree);
    historique = historique.slice(0, 5);

    // On sauvegarde dans le localStorage (en texte JSON)
    localStorage.setItem('monHistorique', JSON.stringify(historique));
    
    afficherHistorique();
}

// 2. Fonction pour afficher le tableau
function afficherHistorique() {
    const corpsTableau = document.querySelector('#tableau-historique tbody');
    const historique = JSON.parse(localStorage.getItem('monHistorique')) || [];

    corpsTableau.innerHTML = historique.map(entree => `
        <tr>
            <td>${entree.date}</td>
            <td>${entree.ve} €</td>
            <td>${entree.multiple} x</td>
        </tr>
    `).join('');
}

// Appeler afficherHistorique au chargement de la page pour voir les anciens calculs
window.onload = afficherHistorique;