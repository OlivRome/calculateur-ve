import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      // Ce "raccourci" permet de contourner l'erreur 403 en faisant passer 
      // la requête par votre propre ordinateur plutôt que par le navigateur.
      '/api-fmp': {
        target: 'https://financialmodelingprep.com',
        changeOrigin: true,
        secure: false, // Évite les blocages liés aux certificats SSL locaux
        rewrite: (path) => path.replace(/^\/api-fmp/, ''),
        // On force des en-têtes (headers) pour que l'API pense que 
        // c'est un humain qui consulte la page
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://financialmodelingprep.com/'
        }
      }
    }
  }
})