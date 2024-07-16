import express from 'express';
import mysql from 'mysql';
import bodyParser from 'body-parser';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import bcrypt from 'bcrypt';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const apiKey = 'v5b3ce3597851110001cf62488fa64d9126564119b3571283c0e413f8';
const saltRounds = 10;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = mysql.createConnection({
  host: 'localhost',
  user: 'test',
  password: 'test123',
  database: 'photovoltaique'
});

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('MySQL Connected...');
});


app.get('/api/role', (req, res) => {
    // Vous pouvez renvoyer une réponse JSON ou utiliser un modèle de vue selon votre structure d'application
    res.json({
        message: 'Choisissez une option',
        options: ['Créer un compte', 'Se connecter']
    });
});

// Route pour que l'installateur s'inscrive avec son email et mot de passe
app.post('/api/installer/register', async (req, res) => {
    const { identifiant, password } = req.body;

    // Vérification basique de l'email et du mot de passe
    if (!identifiant || !password) {
        return res.status(400).json({ error: 'Email et mot de passe sont requis.' });
    }

    try {
        // Stockage temporaire de l'email et du mot de passe (dans la session ou mémoire)
        req.session.tempIdentifiant = identifiant;
        req.session.tempPassword = password;

        // Envoyer un email de confirmation
        const confirmationToken = generateConfirmationToken(identifiant);
        await sendConfirmationidentifiant(identifiant, confirmationToken);

        res.status(200).json({ message: 'Email de confirmation envoyé. Veuillez vérifier votre boîte de réception.' });
    } catch (error) {
        console.error('Erreur lors de l\'inscription de l\'installateur:', error);
        res.status(500).json({ error: 'Erreur lors de l\'inscription de l\'installateur.' });
    }
});

// Route pour confirmer l'email de l'installateur
app.get('/api/installer/confirm', async (req, res) => {
    const { identifiant, token } = req.query;

    // Vérifier le token de confirmation
    const isValidToken = validateConfirmationToken(identifiant, token);

    if (isValidToken) {
        // Récupérer l'identifiant et le mot de passe temporairement stockés
        const tempidentifiant = req.session.tempidentifiant;
        const tempPassword = req.session.tempPassword;

        const bcrypt = require('bcrypt');

// Fonction pour vérifier si un email existe déjà dans la base de données
async function identifiantExists(identifiant) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT COUNT(*) AS count FROM table_pv WHERE identifiant = ?';
        db.query(sql, [identifiant], (err, result) => {
            if (err) {
                reject(err);
            } else {
                const count = result[0].count;
                resolve(count > 0);
            }
        });
    });
}

// Fonction pour hacher le mot de passe de manière sécurisée avec bcrypt
async function hashPassword(password) {
    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        return hashedPassword;
    } catch (error) {
        throw new Error('Erreur lors du hachage du mot de passe');
    }
}

// Fonction pour enregistrer un nouvel installateur
async function registerInstaller(identifiant, password) {
    try {
        // Vérifier si l'email existe déjà
        const exists = await identifiantExists(identifiant);
        if (exists) {
            throw new Error('Cet email est déjà enregistré, connectez-vous');
        }

        // Hacher le mot de passe avant de l'enregistrer dans la base de données
        const hashedPassword = await hashPassword(password);

        // Enregistrer l'email et le mot de passe dans la base de données
        const sql = 'INSERT INTO installers (identifiant, password) VALUES (?, ?)';
        db.query(sql, [identifiant, hashedPassword], (err, result) => {
            if (err) {
                console.error('Erreur lors de l\'enregistrement de l\'installateur:', err);
                throw err;
            }
            console.log('Compte installateur créé avec succès');
        });
    } catch (error) {
        throw new Error('Erreur lors de la création du compte installateur');
    }
}

// Exemple d'utilisation
const newEmail = 'nouvelEmail@example.com';
const newPassword = 'monMotDePasse123';

registerInstaller(newEmail, newPassword)
    .then(() => {
        console.log('Enregistrement réussi');
    })
    .catch(err => {
        console.error('Erreur lors de l\'enregistrement:', err.message);
    });


            // Effacer les données temporaires après l'enregistrement
            req.session.tempidentifiant = null;
            req.session.tempPassword = null;

    }
});


// Route pour envoyer le formulaire d'enregistrement initial ou de mise à jour
app.get('/api/installer/profile', async (req, res) => {
    const userId = req.user.id; // Supposons que vous avez l'ID de l'utilisateur depuis la session ou le token JWT

    try {
        // Récupérer les informations de l'utilisateur depuis la base de données
        const sql = 'SELECT * FROM table_pv WHERE id = ?';
        db.query(sql, [userId], (err, result) => {
            if (err) {
                console.error('Erreur lors de la récupération des informations de l\'installateur:', err);
                return res.status(500).json({ error: 'Erreur lors de la récupération des informations de l\'installateur' });
            }

            if (result.length === 0) {
                return res.status(404).json({ error: 'Installateur non trouvé' });
            }

            const installer = result[0];

            // Construire le formulaire d'enregistrement initial ou de mise à jour
            const profileForm = {
                nom: installer.nom,
                adresse: installer.adresse,
                ville: installer.ville,
                region: installer.region,
                numero: installer.numero,
                mail: installer.mail,
                site_web: installer.site_web,
                categorie: installer.categorie,
                type_activite: installer.type_activite

            };

            res.status(200).json({ success: true, profileForm });
        });
    } catch (error) {
        console.error('Erreur lors de la récupération du profil de l\'installateur:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération du profil de l\'installateur' });
    }
});

// Route pour enregistrer les informations mises à jour
app.post('/api/installer/profile/update', async (req, res) => {
    const userId = req.user.id; // Supposons que vous avez l'ID de l'utilisateur depuis la session ou le token JWT
    const {  nom, adresse, ville, region, numero, mail, site_web, categorie, type_activite } = req.body;

    try {
        // Mettre à jour les informations de l'utilisateur dans la base de données
        const sql = 'UPDATE installers SET  nom = ?, adresse = ?, ville = ?, region, numero= ?, mail = ?, site_web = ?, categorie= ?, type_activite = ?  WHERE id = ?';
        db.query(sql, [ nom, adresse, ville, region, numero, mail, site_web, categorie, type_activite, userId], (err, result) => {
            if (err) {
                console.error('Erreur lors de la mise à jour du profil de l\'installateur:', err);
                return res.status(500).json({ error: 'Erreur lors de la mise à jour du profil de l\'installateur' });
            }

            res.status(200).json({ success: true, message: 'Profil installateur mis à jour avec succès' });
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du profil de l\'installateur:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour du profil de l\'installateur' });
    }
});

// Route to fetch all regions
app.get('/api/regions', (req, res) => {
    const sql = 'SELECT DISTINCT region FROM table_pv';
    db.query(sql, (err, results) => {
      if (err) {
        console.error('Error loading regions:', err);
        res.status(500).json({ error: 'Error loading regions' });
      } else {
        res.json(results);
      }
    });
  });
  
  // Route to fetch companies by region
  app.get('/api/table_pv', (req, res) => {
    const { region } = req.query;
    const sql = 'SELECT * FROM table_pv WHERE region = ?';
    db.query(sql, [region], (err, results) => {
      if (err) {
        console.error('Error searching companies:', err);
        res.status(500).json({ error: 'Error searching companies' });
      } else {
        res.json(results);
      }
    });
  });
  
  app.get('/api/directions', async (req, res) => {
    const { start, end } = req.query;
    try {
      const apiUrl = `https://api.openrouteservice.org/geocode/search?api_key=${apiKey}&start=${start}&end=${end}`;
      const response = await fetch(apiUrl);
      const data = await response.json();
      console.log(response);
  
      res.json(data);
    } catch (error) {
      console.error('Error fetching directions:', error);
      res.status(500).json({ error: 'Error fetching directions' });
    }
  });
  const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});