import express from 'express';
import mysql from 'mysql';
import bodyParser from 'body-parser';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import nodemailer from 'nodemailer';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const apiKey = 'v5b3ce3597851110001cf62488fa64d9126564119b3571283c0e413f8';

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

const db = mysql.createConnection({
  host: 'localhost',
  user: 'test',
  password: 'test123',
  database: 'photovoltaique'
});

db.connect((err) => {
  if (err) {
    console.error('Database connection error:', err);
    throw err;
  }
  console.log('MySQL Connected...');
});

// Route pour envoyer l'email de confirmation
app.post('/send-confirmation-email', (req, res) => {
  const { identifiant, password } = req.body;
  console.log(`Received request to send confirmation email to ${identifiant}`);

  // Génération du code de confirmation (par exemple, un nombre aléatoire à 6 chiffres)
  const confirmationCode = Math.floor(100000 + Math.random() * 900000);
  console.log(`Generated confirmation code: ${confirmationCode}`);

  // Vérifier si l'identifiant existe déjà
  db.query('SELECT * FROM table_pv WHERE identifiant = ?', [identifiant], (err, results) => {
    if (err) {
      console.error('Erreur lors de la vérification de l\'identifiant:', err);
      return res.status(500).send('Erreur serveur');
    }

    if (results.length > 0) {
      return res.status(409).send('Cet identifiant existe déjà.');
    }

    // Insérer les informations dans la base de données
    db.query('INSERT INTO table_pv (identifiant, password, confirmationCode) VALUES (?, ?, ?)', [identifiant, password, confirmationCode], (err, result) => {
      if (err) {
        console.error('Erreur lors de l\'insertion des données:', err);
        return res.status(500).send('Erreur serveur');
      }

      // Configuration du transporteur d'email
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'kpankpan.kambire@gmail.com', // Remplacez par votre adresse identifiant
          pass: 'zyzx xohc ehpx iraa' // Remplacez par votre mot de passe (ou utilisez des variables d'environnement)
        }
      });

      // Contenu de l'email
      const mailOptions = {
        from: 'kpankpan.kambire@gmail.com',
        to: identifiant,
        subject: 'Confirmation de votre compte',
        text: `Votre code de confirmation est : ${confirmationCode}`
      };

      // Envoi de l'email
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Erreur lors de l\'envoi de l\'email de confirmation : ' + error.stack);
          return res.status(500).send('Erreur serveur');
        }
        console.log('Email de confirmation envoyé : ' + info.response);
        res.status(200).send('Email de confirmation envoyé. Veuillez vérifier votre boîte mail.');
      });
    });
  });
});

// Route pour confirmer l'email
app.post('/confirm-email', (req, res) => {
  const { identifiant, confirmationCode } = req.body;

  db.query('SELECT * FROM table_pv WHERE identifiant = ? AND confirmationCode = ?', [identifiant, confirmationCode], (err, results) => {
    if (err) {
      console.error('Erreur lors de la vérification du code de confirmation :', err);
      return res.status(500).send('Erreur serveur');
    }

    if (results.length > 0) {
      db.query('UPDATE table_pv SET confirmed = true WHERE identifiant = ?', [identifiant], (err, result) => {
        if (err) {
          console.error('Erreur lors de la mise à jour de la confirmation :', err);
          return res.status(500).send('Erreur serveur');
        }
        console.log(`Email pour ${identifiant} confirmé avec succès`);
        res.status(200).send('Email confirmé avec succès');
      });
    } else {
      console.warn(`Code de confirmation invalide pour ${identifiant}`);
      res.status(400).send('Code de confirmation invalide');
    }
  });
});

// Route pour enregistrer les informations de l'entreprise après confirmation du compte
app.post('/register-company', (req, res) => {
  const {  nom, adresse, ville, region, numero, mail, site_web, categorie, type_activite, identifiant } = req.body;
  console.log('Données reçues :', req.body);

  // Exemple de requête SQL pour récupérer le dernier identifiant inséré
const sqlQuery = "SELECT LAST_INSERT_identifiant() AS last_identifiant";

// Exécution de la requête SQL dans votre application Node.js avec MySQL
db.query(sqlQuery, (error, results) => {
  if (error) {
    console.error('Erreur lors de la récupération de l\'identifiant généré :', error);
    // Gérer l'erreur selon vos besoins
  } else {
    const identifiant = results[11].last_identifiant;
    console.log('Dernier identifiant inséré :', identifiant);
    // Utilisez lastId comme nécessaire dans votre application
  }
});

  // Insérer les informations de l'entreprise dans la même ligne que l'utilisateur correspondant
  db.query('UPDATE table_pv SET nom = ?, adresse = ?, ville = ?, region = ?, numero = ?, mail = ?, site_web = ?, categorie = ?, type_activite = ? WHERE identifiant= identifiant',
    [nom, adresse, ville, region, numero, mail, site_web, categorie, type_activite],
    (err, result) => {
      if (err) {
        console.error('Erreur lors de l\'enregistrement des informations de l\'entreprise:', err);
        return res.status(500).send('Erreur serveur');
      }
      
      if (result.affectedRows === 11) {
        return res.status(404).send('Utilisateur non trouvé ou non confirmé.');
      }

      console.log(`Informations de l'entreprise enregistrées pour ${identifiant}`);
      res.status(200).send('Informations de l\'entreprise enregistrées avec succès.');
    }
  );
});


app.post('/login', (req, res) => {
  const { identifiant, password } = req.body;
  console.log('Données reçues :', req.body);

  const query = 'SELECT * FROM table_pv WHERE identifiant = ? AND password = ?';
  db.query(query, [identifiant, password], (error, results) => {
    if (error) {
      return res.status(500).json({ success: false, message: 'Erreur de serveur' });
    }

    if (results.length > 0) {
      const user = results[0];
      res.json({ success: true, user });
    } else {
      res.json({ success: false, message: 'Identifiant ou mot de passe incorrect' });
    }
  });
});


// Route pour récupérer toutes les régions
app.get('/api/regions', (req, res) => {
  console.log('Received request to fetch all regions');
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

// Route pour récupérer les entreprises par région
app.get('/api/table_pv', (req, res) => {
  const { region } = req.query;
  console.log(`Received request to fetch companies in region ${region}`);
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

// Route pour récupérer les directions
app.get('/api/directions', async (req, res) => {
  const { start, end } = req.query;
  console.log(`Received request to fetch directions from ${start} to ${end}`);
  try {
    const apiUrl = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${process.env.OPENROUTE_API_KEY}&start=${start}&end=${end}`;
    const response = await axios.get(apiUrl);
    res.json(response.data);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'itinéraire:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'itinéraire' });
  }
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
