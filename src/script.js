import { supabase } from './supabaseClient.js'

// Variable globale pour stocker l'utilisateur connecté
let sessionUtilisateur = null;

// Écouteur en temps réel du changement d'état (Connexion / Déconnexion)
supabase.auth.onAuthStateChange((event, session) => {
    sessionUtilisateur = session;
    const authZone = document.getElementById('auth-zone');
    const loginForm = document.getElementById('login-form');
    const userInfo = document.getElementById('user-info');
    const userEmailSpan = document.getElementById('user-email');

    if (session) {
        // Utilisateur connecté
        loginForm.style.display = 'none';
        userInfo.style.display = 'block';
        userEmailSpan.textContent = session.user.email;
        afficherHistoriqueGlobal(); // Charger ses propres analyses
    } else {
        // Utilisateur déconnecté
        loginForm.style.display = 'block';
        userInfo.style.display = 'none';
    }
});


let chartInstance = null; // Stocke le graphique pour pouvoir le détruire/recréer

const bouton = document.getElementById('btn-calculer');
//const bouton = document.querySelector('button');

    bouton.addEventListener('click', async function() {
        // --- ÉTAPE A : RÉCUPÉRATION DES ÉLÉMENTS DU DOM ---
        const inputCap = document.getElementById('cap');
        const inputDette = document.getElementById('dette');
        const inputTreso = document.getElementById('treso');
        const inputEbitda = document.getElementById('ebitda'); // Nouveau champ
        const resultatVe = document.getElementById('ve-valeur-finale');
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
        await sauvegarderCalculBDD(Ve, Multiple);

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



async function sauvegarderCalculBDD(ve, multiple) {
    // Rigueur : On vérifie si une session existe avant d'envoyer
    if (!sessionUtilisateur) {
        alert("Vous devez être connecté pour sauvegarder dans le Cloud.");
        return;
    }

    const { data, error } = await supabase
        .from('Analyses')
        .insert([
            { 
                ve_valeur: ve, 
                multiple_valeur: multiple, 
                user_id: sessionUtilisateur.user.id // Liaison avec le compte
            }
        ]);

    if (error) console.error("Erreur :", error.message);
    else console.log("Sauvegardée sur votre compte !");
}




// 1. Inscription
document.getElementById('btn-signup').addEventListener('click', async () => {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    
    const { data, error } = await supabase.auth.signUp({ email, password });
    
    if (error) alert(error.message);
    else alert("Inscription réussie !");
});

// 2. Connexion
document.getElementById('btn-login').addEventListener('click', async () => {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) alert(error.message);
    else window.location.reload(); // On rafraîchit pour mettre à jour l'interface
});


document.getElementById('btn-logout').addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Erreur déconnexion :", error.message);
    else window.location.reload(); 
});



async function recupererCapBoursiere() {
    const ticker = document.getElementById('ticker').value.toUpperCase();
    const apiKey = import.meta.env.VITE_FMP_API_KEY;
    
    if (!ticker) return;

    try {
        // Utilisation de l'endpoint "profile" qui a fonctionné dans votre test navigateur
        
        // On remplace le domaine externe par notre raccourci local /api-fmp
        const url = `/api-fmp/api/v3/profile/${ticker}?apikey=${apiKey}`;
        const response = await fetch(url);
        
        if (response.status === 403) {
            console.error("Erreur 403 : Le plan gratuit bloque peut-être l'appel depuis localhost.");
            return;
        }

        const data = await response.json();

        if (data && data.length > 0) {
            // Extraction de la Capitalisation (marketCap)
            const marketCap = data[0].marketCap;
            document.getElementById('cap').value = marketCap;
        }
    } catch (error) {
        console.error("Erreur technique :", error);
    }
}


async function recupererCapAlphaVantage() {
    const ticker = document.getElementById('ticker').value.toUpperCase();
    const apiKey = import.meta.env.VITE_ALPHA_VANTAGE_KEY;
    
    if (!ticker) return;

    try {
        // On utilise l'endpoint "OVERVIEW" pour obtenir la Capitalisation
        const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        // Alpha Vantage renvoie "MarketCapitalization" dans l'objet Overview
        if (data && data.MarketCapitalization) {
            const marketCap = parseFloat(data.MarketCapitalization);
            document.getElementById('cap').value = marketCap;
            console.log(`Succès Alpha Vantage pour ${ticker} : ${marketCap}`);
        } else {
            alert("Données non trouvées. Note : Pour Paris, essayez le format 'OR.PAR' ou testez avec 'AAPL'.");
        }
    } catch (error) {
        console.error("Erreur Alpha Vantage :", error);
    }
}


    // Liaison au bouton
    document.getElementById('btn-fetch-api').addEventListener('click', recupererCapAlphaVantage);