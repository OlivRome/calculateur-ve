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
    });

            document.getElementById('btn-reset').addEventListener('click', function() {
                // Efface les inputs
                document.querySelectorAll('input').forEach(input => input.value = '');
                // Remet les textes à zéro
                document.querySelector('strong').textContent = '... €';
                document.getElementById('multiple-val').textContent = '...';
            });