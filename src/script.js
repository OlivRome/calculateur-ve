import { supabase } from './supabaseClient.js'

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

        // 3. NOUVEAU : On envoie vers le Cloud (Supabase)
        // On utilise "await" car c'est une opération réseau qui prend un peu de temps
        sauvegarderCalculBDD(Ve, Multiple, "Test Mac");

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
    
    afficherHistoriqueGlobal();
}


async function afficherHistoriqueGlobal() {
    const corpsTableau = document.querySelector('#tableau-historique tbody');
    
    // On demande à Supabase les 5 dernières lignes de la table "Analyses"
    const { data: analyses, error } = await supabase
        .from('Analyses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Erreur de récupération :", error.message);
        return;
    }

    // On génère le HTML à partir des données réelles du Cloud
    corpsTableau.innerHTML = analyses.map(entree => `
        <tr>
            <td>${new Date(entree.created_at).toLocaleDateString('fr-FR')}</td>
            <td>${Number(entree.ve_valeur).toLocaleString('fr-FR')} €</td>
            <td>${Number(entree.multiple_valeur).toFixed(2)} x</td>
        </tr>
    `).join('');
}

// N'oubliez pas de mettre à jour l'appel au chargement de la page
window.onload = afficherHistoriqueGlobal;




// Appeler afficherHistorique au chargement de la page pour voir les anciens calculs
//window.onload = afficherHistorique;

document.getElementById('btn-export').addEventListener('click', function() {
    // 1. Récupération des données depuis le localStorage
    const historique = JSON.parse(localStorage.getItem('monHistorique')) || [];
    
    if (historique.length === 0) {
        alert("Aucune donnée à exporter.");
        return;
    }

    // 2. Création de l'en-tête du fichier CSV
    let contenuCSV = "Date;Valeur Entreprise (EUR);Multiple EBITDA\n";

    // 3. Ajout des lignes de données
    historique.forEach(entree => {
        // On nettoie les espaces insérés par toLocaleString pour Excel
        const vePropre = entree.ve.replace(/\s/g, ''); 
        contenuCSV += `${entree.date};${vePropre};${entree.multiple}\n`;
    });

    // 4. Création du fichier et déclenchement du téléchargement
    const blob = new Blob([contenuCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a");
    
    lien.setAttribute("href", url);
    lien.setAttribute("download", "historique_analyses_financieres.csv");
    lien.style.visibility = 'hidden';
    
    document.body.appendChild(lien);
    lien.click();
    document.body.removeChild(lien);
});


//Maintenant, modifions votre fonction de sauvegarde dans src/script.js pour qu'elle parle à la base de données PostgreSQL en plus du localStorage.



async function sauvegarderCalculBDD(ve, multiple, label = "Anonyme") {
    // On insère une ligne dans la table "Analyses" que vous avez créée
    const { data, error } = await supabase
        .from('Analyses')
        .insert([
            { 
                ve_valeur: ve, 
                multiple_valeur: multiple, 
                label_entreprise: label 
            }
        ])

    if (error) {
        console.error("Erreur de sauvegarde BDD :", error.message)
    } else {
        console.log("Analyse sauvegardée avec succès dans le Cloud !")
    }
}