module.exports = {
    configureWebpack: {
      // Configuration spécifique à Webpack
      resolve: {
        // Autoriser les imports de modules Node.js
        fallback: {
          "http": require.resolve("stream-http"),
          "https": require.resolve("https-browserify"),
          "stream": require.resolve("stream-browserify"),
          "url": require.resolve("url"),
          "util": require.resolve("util"),
          "assert": require.resolve("assert"),
          "crypto": require.resolve("crypto-browserify"),
          "querystring": require.resolve("querystring-es3"),
          "os": require.resolve("os-browserify/browser"),
          "fs": false,
          "tls": false,
          "net": false
        }
      },
      // Configurer les loaders pour les modules Node.js
      module: {
        rules: [
          {
            test: /\.m?js$/,
            resolve: {
              fullySpecified: false
            }
          }
        ]
      }
    }
  };
  
  app.get('/api/role', (req, res) => {
    // Vous pouvez renvoyer une réponse JSON ou utiliser un modèle de vue selon votre structure d'application
    res.json({
        message: 'Choisissez une option',
        options: ['Créer un compte', 'Se connecter']
    });
});