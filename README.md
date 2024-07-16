# Application de Recherche de Sociétés Photovoltaïques au Maroc

Cette application permet de rechercher et de localiser des sociétés spécialisées dans le domaine photovoltaïque au Maroc. Elle permet également aux installateurs d'enregistrer ou de modifier les informations de leur entreprise.

## Structure du Projet

- `public/`
  - `index.html` : Contient la structure de la page web.
  - `script.js` : Contient le code JavaScript pour les interactions utilisateur.
- `server.js` : Fichier principal du serveur Node.js.
- `README.md` : Ce fichier.

## Prérequis

- Node.js
- MySQL
- XAMPP (ou tout autre outil pour gérer MySQL)

## Installation

1. Clonez le dépôt :
   ```bash
   git clone https://votre-repo.git
   cd photovoltaics-app


// code server
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

async function hashPassword(password) {
    if (!password || password.length < 8) { // Vérifiez que le mot de passe n'est pas vide et qu'il a au moins 8 caractères
      throw new Error('Le mot de passe doit contenir au moins 8 caractères');
    }
    
    try {
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      return hashedPassword;
    } catch (error) {
      throw new Error('Erreur lors du hachage du mot de passe');
    }
  }
  
  // Exemple de route POST pour créer un mot de passe avec validation
  app.post('/api/createPassword', async (req, res) => {
    console.log('Requête reçue pour /api/createPassword'); // Log pour vérifier si la route est appelée
    const { password, nom, adresse, ville, region, numero, mail, site_web, categorie, type_activite } = req.body; // incluez tous les champs requis
    
    // Validation du mot de passe
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères' });
    }
    
    try {
      const hashedPassword = await hashPassword(password);
      const sql = 'INSERT INTO table_pv (password, nom, adresse, ville, region, numero, mail, site_web, categorie, type_activite) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
      db.query(sql, [hashedPassword, nom, adresse, ville, region, numero, mail, site_web, categorie, type_activite], (err, result) => {
        if (err) {
          console.error('Error updating password:', err);
          return res.json({ success: false, error: err.message });
        }
        res.json({ success: true });
      });
    } catch (error) {
      console.error('Error hashing password:', error);
      res.status(500).json({ error: 'Error hashing password' });
    }
    res.send('Endpoint /api/createPassword fonctionne correctement');
  });
  

async function verifyPassword(password, hashedPassword) {
  try {
    const match = await bcrypt.compare(password, hashedPassword);
    return match;
  } catch (error) {
    throw new Error('Erreur lors de la vérification du mot de passe');
  }
}

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

// Route to verify password
app.post('/api/verifyPassword', (req, res) => {
  const { password } = req.body;
  const sql = 'SELECT password FROM table_pv WHERE password = ?';
  db.query(sql, [password], async (err, results) => {
    if (err) {
      return res.json({ success: false, error: err.message });
    }
    if (results.length > 0) {
      const isMatch = await verifyPassword(password, results[0].password);
      if (isMatch) {
        res.json({ success: true });
      } else {
        res.json({ success: false });
      }
    } else {
      res.json({ success: false });
    }
  });
});

// Route pour enregistrer une nouvelle entreprise
// Route pour enregistrer une nouvelle entreprise
app.post('/api/installer', async (req, res) => {
    const { nom, adresse, ville, region, numero, mail, site_web, categorie, type_activite, password } = req.body; // Make sure to include 'password' in destructuring
    
    try {
        // Étape 1 : Hachage du mot de passe de l'installateur
        const hashedPassword = await hashPassword(password);
        
        // Étape 2 : Insertion du mot de passe de l'installateur
        const insertInstallerSql = 'INSERT INTO table_pv (password) VALUES (?)';
        const installerValues = [hashedPassword];
        
        db.query(insertInstallerSql, installerValues, async (err, result) => {
            if (err) {
                console.error('Error saving installer password:', err);
                console.error('SQL Error:', err.sqlMessage);
                return res.status(500).json({ error: 'Error saving installer password' });
            }
            
            // Récupération de l'id auto-incrémenté de l'installateur
            const id = result.insertId; // Use 'insertId' to get the auto-incremented ID
            
            // Étape 3 : Insertion des informations de l'entreprise associées à l'installateur
            const insertCompanySql = 'INSERT INTO table_pv (id, nom, adresse, ville, region, numero, mail, site_web, categorie, type_activite) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
            const companyValues = [id, nom, adresse, ville, region, numero, mail, site_web, categorie, type_activite];
            
            db.query(insertCompanySql, companyValues, (err, result) => {
                if (err) {
                    console.error('Error saving company:', err);
                    console.error('SQL Error:', err.sqlMessage);
                    return res.status(500).json({ error: 'Error saving company' });
                }
                
                res.status(200).json({ success: 'Company saved successfully' });
            });
        });
    } catch (error) {
        console.error('Error hashing password:', error);
        res.status(500).json({ error: 'Error hashing password' });
    }
});

  
// Route to update password
app.put('/api/modifierMotDePasse/:id', async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  try {
    const hashedPassword = await hashPassword(newPassword);
    const sql = 'UPDATE table_pv SET password = ? WHERE id = ?';
    db.query(sql, [hashedPassword, id], (err, result) => {
      if (err) {
        console.error('Error updating password:', err);
        res.status(500).json({ error: 'Error updating password' });
      } else {
        res.status(200).json({ success: 'Password updated successfully' });
      }
    });
  } catch (error) {
    console.error('Error hashing password:', error);
    res.status(500).json({ error: 'Error hashing password' });
  }
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});






// code html
<!DOCTYPE html>
<html>
<head>
  <title>Application photovoltaïques au Maroc</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet/dist/leaflet.js" defer></script>
  <script src="script.js" defer></script>
</head>
<body>
  <h1>Application photovoltaïques au Maroc</h1>
  <div>
    <label for="role">Êtes-vous un utilisateur de panneau photovoltaïque ou un installateur ?</label>
    <select id="role" onchange="handleRoleChange()">
      <option value="">Sélectionnez...</option>
      <option value="installateur">Installateur</option>
      <option value="utilisateur">Utilisateur</option>
    </select>
  </div>
  <div id="installateur-select" style="display:none;">
    <h2>Voulez-vous enregistrer ou modifier les informations de votre entreprise?</h2>
    <button onclick="showCreatePasswordPrompt()">Enregistrer</button>
    <button onclick="showPasswordPrompt()">Modifier</button>
  </div>
  <div id="create-password-prompt" style="display:none;">
    <h2>Veuillez créer un mot de passe pour enregistrer votre entreprise</h2>
    <form id="createPasswordForm">
      <label for="create-password">Mot de passe:</label>
      <input type="password" id="create-password" name="create-password" required><br>
      <button type="submit">Valider</button>
    </form>
  </div>
  <div id="password-prompt" style="display:none;">
    <h2>Veuillez entrer votre mot de passe pour modifier les informations de votre entreprise</h2>
    <form id="passwordForm">
      <label for="password">Mot de passe:</label>
      <input type="password" id="password" name="password" required><br>
      <button type="submit">Valider</button>
    </form>
  </div>
  <div id="installateur-form" style="display:none;">
    <h2>Formulaire d'enregistrement</h2>
    <form id="registerForm">
      <label for="nom">Nom de l'entreprise:</label>
      <input type="text" id="nom" name="nom" required><br>
      <label for="adresse">Adresse:</label>
      <input type="text" id="adresse" name="adresse" required><br>
      <label for="ville">Ville:</label>
      <input type="text" id="ville" name="ville" required><br>
      <label for="region">Région:</label>
      <input type="text" id="region" name="region" required><br>
      <label for="numero">Numéro:</label>
      <input type="text" id="numero" name="numero" required><br>
      <label for="mail">Email:</label>
      <input type="email" id="mail" name="mail" required><br>
      <label for="site_web">Site Web:</label>
      <input type="text" id="site_web" name="site_web"><br>
      <label for="categorie">Catégorie:</label>
      <input type="text" id="categorie" name="categorie" required><br>
      <label for="type_activite">Type d'activité:</label>
      <input type="text" id="type_activite" name="type_activite" required><br>
      <button type="submit">Enregistrer</button>
    </form>
  </div>
  <div id="utilisateur-form" style="display:none;">
    <h2>Rechercher des entreprises par région</h2>
    <label for="region-search">Choisir une région :</label>
    <select id="region-search">
      <!-- Options de sélection des régions disponibles -->
    </select>
    <button id="search-button">Rechercher</button>
    <label for="company-select">Choisir une entreprise :</label>
    <select id="company-select">
      <!-- Options des entreprises seront ajoutées ici -->
    </select>
    <button id="display-company-button">Afficher les informations</button>
    <ul id="company-info"></ul> <!-- Ajouter une liste pour afficher les informations de l'entreprise -->
  </div>
  <div id="map" style="height: 500px; width: 100%;"></div>
  <script>
    function handleRoleChange() {
      const role = document.getElementById('role').value;
      const installateurSelect = document.getElementById('installateur-select');
      const utilisateurForm = document.getElementById('utilisateur-form');
      const installateurForm = document.getElementById('installateur-form');
      const passwordPrompt = document.getElementById('password-prompt');
      const createPasswordPrompt = document.getElementById('create-password-prompt');

      if (role === 'installateur') {
        installateurSelect.style.display = 'block';
        utilisateurForm.style.display = 'none';
        installateurForm.style.display = 'none';
        passwordPrompt.style.display = 'none';
        createPasswordPrompt.style.display = 'none';
      } else if (role === 'utilisateur') {
        installateurSelect.style.display = 'none';
        utilisateurForm.style.display = 'block';
        installateurForm.style.display = 'none';
        passwordPrompt.style.display = 'none';
        createPasswordPrompt.style.display = 'none';
        loadRegions(); // Charger les régions disponibles lors du changement vers utilisateur
      } else {
        installateurSelect.style.display = 'none';
        utilisateurForm.style.display = 'none';
        installateurForm.style.display = 'none';
        passwordPrompt.style.display = 'none';
        createPasswordPrompt.style.display = 'none';
      }
    }

    function showCreatePasswordPrompt() {
      document.getElementById('create-password-prompt').style.display = 'block';
      document.getElementById('password-prompt').style.display = 'none';
      document.getElementById('installateur-form').style.display = 'none';
    }

    function showPasswordPrompt() {
      document.getElementById('password-prompt').style.display = 'block';
      document.getElementById('create-password-prompt').style.display = 'none';
      document.getElementById('installateur-form').style.display = 'none';
    }

    async function handleCreatePasswordSubmit(event) {
        event.preventDefault();
        const password = document.getElementById('create-password').value;
      
        const response = await fetch('/api/createPassword', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ password })
        });
      
        if (response.ok) {
          showRegisterForm();
        } else {
          alert('Erreur lors de la création du mot de passe');
        }
      }

    
    async function handlePasswordSubmit(event) {
      event.preventDefault();
      const password = document.getElementById('password').value;

      const response = await fetch('/api/verifyPassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          showModifyForm();
        } else {
          alert('Mot de passe incorrect');
        }
      } else {
        alert('Erreur lors de la vérification du mot de passe');
      }
    }

    function showRegisterForm() {
      document.getElementById('installateur-form').style.display = 'block';
      document.getElementById('installateur-form').querySelector('h2').textContent = 'Formulaire d\'enregistrement';
      document.getElementById('create-password-prompt').style.display = 'none';
    }

    function showModifyForm() {
      document.getElementById('installateur-form').style.display = 'block';
      document.getElementById('installateur-form').querySelector('h2').textContent = 'Formulaire de modification';
      document.getElementById('password-prompt').style.display = 'none';
      // Code pour pré-remplir les champs du formulaire avec les anciennes informations peut être ajouté ici
    }

    async function loadRegions() {
      const response = await fetch('/api/regions');
      if (response.ok) {
        const regions = await response.json();
        const regionSelect = document.getElementById('region-search');
        regionSelect.innerHTML = '';
        regions.forEach(region => {
          const option = document.createElement('option');
          option.value = region.region;
          option.textContent = region.region;
          regionSelect.appendChild(option);
        });
      } else {
        console.error('Erreur lors du chargement des régions');
      }
    }

    async function searchCompanies() {
      const regionName = document.getElementById('region-search').value;
      const response = await fetch(`/api/table_pv?region=${regionName}`);
      if (response.ok) {
        const companies = await response.json();
        displayCompanies(companies);
      } else {
        console.error('Erreur lors de la recherche des entreprises');
      }
    }

    function displayCompanies(companies) {
      const companySelect = document.getElementById('company-select');
      companySelect.innerHTML = '';
      companies.forEach(company => {
        const option = document.createElement('option');
        option.value = company.id;
        option.textContent = company.nom;
        companySelect.appendChild(option);
      });
    }

    function displayCompanyInfo() {
      const companySelect = document.getElementById('company-select');
      const selectedCompanyId = companySelect.value;
      const selectedCompany = companies.find(company => company.id === selectedCompanyId);

      const companyInfo = document.getElementById('company-info');
      companyInfo.innerHTML = '';

      const infoItems = [
        `Nom: ${selectedCompany.nom}`,
        `Adresse : ${selectedCompany.adresse}`,
        `Ville : ${selectedCompany.ville}`,
        `Région : ${selectedCompany.region}`,
        `Numéro : ${selectedCompany.numero}`,
        `Email : ${selectedCompany.mail}`,
        `Site Web : ${selectedCompany.site_web}`,
        `Type d'activité : ${selectedCompany.type_activite}`,
        `Catégorie : ${selectedCompany.categorie}`
      ];

      infoItems.forEach(info => {
        const listItem = document.createElement('li');
        listItem.innerHTML = info;
        companyInfo.appendChild(listItem);
      });
    


      const locateButton = document.createElement('button');
      locateButton.textContent = 'Localiser sur la carte';
      locateButton.addEventListener('click', () => locateCompanyOnMap(selectedCompany.adresse));
      companyInfo.appendChild(locateButton);
    }

    function locateCompanyOnMap(address) {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`)
        .then(response => response.json())
        .then(data => {
          if (data.length > 0) {
            const { lat, lon } = data[0];
            const map = L.map('map').setView([lat, lon], 13);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            L.marker([lat, lon]).addTo(map)
              .bindPopup(address)
              .openPopup();
          } else {
            alert('Adresse introuvable');
          }
        })
        .catch(error => {
          console.error('Erreur lors de la récupération des coordonnées:', error);
          alert('Une erreur est survenue lors de la localisation de l\'adresse.');
        });
    }

    document.getElementById('createPasswordForm').addEventListener('submit', handleCreatePasswordSubmit);
    document.getElementById('passwordForm').addEventListener('submit', handlePasswordSubmit);
    document.getElementById('registerForm').addEventListener('submit', async function(event) {
      event.preventDefault();
      const formData = new FormData(event.target);
      const data = {};
      formData.forEach((value, key) => {
        data[key] = value;
      });

      const response = await fetch('/api/installer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        alert('Entreprise enregistrée avec succès');
      } else {
        alert('Erreur lors de l\'enregistrement de l\'entreprise');
      }
    });

    document.getElementById('createPasswordForm').addEventListener('submit', handleCreatePasswordSubmit);
    document.getElementById('search-button').addEventListener('click', searchCompanies);
    document.getElementById('display-company-button').addEventListener('click', displayCompanyInfo);
    document.getElementById('role').addEventListener('change', handleRoleChange);
  </script>
</body>
</html>



// code script.js

document.addEventListener("DOMContentLoaded", function() {
    const apiKey = '5b3ce3597851110001cf62488fa64d9126564119b3571283c0e413f8';
    let map;
    let userLocation;

    function initializeMap() {
        if (map !== undefined) {
            map.remove();
        }
        map = L.map('map').setView([31.7917, -7.0926], 6);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Try to get user's location using browser's geolocation
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    const { latitude, longitude } = position.coords;
                    userLocation = L.latLng(latitude, longitude);
                    L.marker(userLocation).addTo(map)
                        .bindPopup("Vous êtes ici")
                        .openPopup();
                },
                function(error) {
                    console.error('Erreur lors de la récupération de la localisation utilisateur:', error);
                }
            );
        } else {
            console.error('La géolocalisation n\'est pas supportée par ce navigateur.');
        }
    }

    function handleRoleChange() {
        const role = document.getElementById('role').value;
        const installateurForm = document.getElementById('installateur-form');
        const utilisateurForm = document.getElementById('utilisateur-form');

        if (role === 'installateur') {
            installateurForm.style.display = 'block';
            utilisateurForm.style.display = 'none';
        } else if (role === 'utilisateur') {
            installateurForm.style.display = 'none';
            utilisateurForm.style.display = 'block';
            loadRegions();
        } else {
            installateurForm.style.display = 'none';
            utilisateurForm.style.display = 'none';
        }
    }
    async function createPassword(password) {
        try {
          const response = await fetch('http://localhost:8080/api/createPassword', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password: 'yourPassword'})
          });
      
          if (!response.ok) {
            const errorData = await response.json();
            console.error('Erreur lors de la création du mot de passe:', errorData.error);
            return null; // Gestion d'erreur, retournez ou gérez l'erreur selon vos besoins
          }
      
          const data = await response.json();
          return data.id; // Récupère l'ID auto-incrémenté de l'installateur depuis la réponse JSON
        } catch (error) {
          console.error('Erreur lors de la requête createPassword:', error);
          return null; // Gestion d'erreur, retournez ou gérez l'erreur selon vos besoins
        }
      }
      
      
      async function registerCompany(nom, adresse, ville, region, numero,mail, site_web, categorie,type_activite) {
        const response = await fetch('/api/installer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({  nom, adresse, ville, region, numero, mail, site_web, categorie,type_activite})
        });
      
        const data = await response.json();
        return data.success;
      }
      
      // Exemple d'utilisation
      document.getElementById('registerForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const password = document.getElementById('password').value;
        const nom = document.getElementById('nom').value;
        const adresse = document.getElementById('adresse').value;
        const ville = document.getElementById('ville').value;
        const region = document.getElementById('region').value;
        const mail = document.getElementById('mail').value;
        const numero = document.getElementById('numero').value;
        const site_web = document.getElementById('site_web').value;
        const categorie = document.getElementById('categorie').value;
        const type_activite = document.getElementById('type_activite').value;

      
        const id = await createPassword(password);
      
        if (id) {
          const success = await registerCompany(id, nom, adresse, ville, region, numero, mail, site_web, categorie, type_activite);
          if (success) {
            console.log('Entreprise enregistrée avec succès');
          } else {
            console.log('Erreur lors de l\'enregistrement de l\'entreprise');
          }
        }
      });
      
    document.getElementById('role').addEventListener('change', handleRoleChange);

    async function loadRegions() {
        try {
            const response = await fetch('/api/regions');
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des régions');
            }
            const regions = await response.json();
            const regionSelect = document.getElementById('region-search');
            regionSelect.innerHTML = '';
            regions.forEach(region => {
                const option = document.createElement('option');
                option.value = region.region;
                option.textContent = region.region;
                regionSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Erreur lors du chargement des régions:', error);
        }
    }

    async function searchCompanies() {
        try {
            const regionName = document.getElementById('region-search').value;
            const response = await fetch(`/api/table_pv?region=${regionName}`);
            if (!response.ok) {
                throw new Error('Erreur lors de la recherche des entreprises');
            }
            const companies = await response.json();
            displayCompanies(companies);
        } catch (error) {
            console.error('Erreur lors de la recherche des entreprises:', error);
        }
    }

    function displayCompanies(companies) {
        const companySelect = document.getElementById('company-select');
        if (!companySelect) {
            console.error('Element #company-select not found');
            return;
        }

        companySelect.innerHTML = '';

        companies.forEach(company => {
            const option = document.createElement('option');
            option.value = JSON.stringify(company);
            option.textContent = company.nom;
            companySelect.appendChild(option);
        });
    }

    function displayCompanyInfo() {
        const companySelect = document.getElementById('company-select');
        if (!companySelect) {
            console.error('Element #company-select not found');
            return;
        }

        const selectedCompany = JSON.parse(companySelect.value);

        const companyInfo = document.getElementById('company-info');
        if (!companyInfo) {
            console.error('Element #company-info not found');
            return;
        }

        companyInfo.innerHTML = '';

        const infoItems = [
            `Nom : ${selectedCompany.nom}`,
            `Adresse : <a href="#" onclick="locateCompanyOnMap('${selectedCompany.adresse}')">${selectedCompany.adresse}</a>`,
            `Ville : ${selectedCompany.ville}`,
            `Région : ${selectedCompany.region}`,
            `Numéro : <a href="tel:${selectedCompany.numero}">${selectedCompany.numero}</a>`,
            `Email : <a href="mailto:${selectedCompany.mail}">${selectedCompany.mail}</a>`,
            `Site Web : <a href="http://${selectedCompany.site_web}" target="_blank">${selectedCompany.site_web}</a>`,
            `Type d'activité : ${selectedCompany.type_activite}`,
            `Catégorie : ${selectedCompany.categorie}`
        ];

        infoItems.forEach(info => {
            const listItem = document.createElement('li');
            listItem.innerHTML = info;
            companyInfo.appendChild(listItem);
        });

        const locateButton = document.createElement('button');
        locateButton.textContent = 'Localiser sur la carte';
        locateButton.addEventListener('click', () => locateCompanyOnMap(selectedCompany.adresse));
        companyInfo.appendChild(locateButton);

        const routeButton = document.createElement('button');
        routeButton.textContent = 'Tracer l\'itinéraire';
        routeButton.addEventListener('click', () => traceItineraryToCompany(selectedCompany.adresse));
        companyInfo.appendChild(routeButton);
    }

    async function locateCompanyOnMap(address) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
            if (!response.ok) {
                throw new Error('Adresse de destination introuvable');
            }
            const data = await response.json();
            if (data.length > 0) {
                const { lat, lon } = data[0];
                const destinationCoords = [lat, lon];

                map.setView(destinationCoords, 13);

                L.marker(destinationCoords).addTo(map)
                    .bindPopup(`<b>${address}</b>`)
                    .openPopup();
            } else {
                alert('Adresse de destination introuvable');
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des coordonnées:', error);
        }
    }

    async function traceItineraryToCompany(address) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
            if (!response.ok) {
                throw new Error('Adresse de destination introuvable');
            }
            const data = await response.json();
            if (data.length > 0) {
                const { lat, lon } = data[0];
                const destinationCoords = [lat, lon];

                if (userLocation) {
                    getRoute(userLocation, destinationCoords);
                } else {
                    alert('Localisation utilisateur introuvable');
                }
            } else {
                alert('Adresse de destination introuvable');
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des coordonnées:', error);
        }
    }

    async function getRoute(start, end) {
        try {
            const apiUrl = `/api/directions?start=${start.lng},${start.lat}&end=${end[1]},${end[0]}`;
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération de l\'itinéraire');
            }
            const routeData = await response.json();

            const coords = routeData.features[0].geometry.coordinates;
            const latLngs = coords.map(coord => [coord[1], coord[0]]);

            const polyline = L.polyline(latLngs, { color: 'blue' }).addTo(map);
            map.fitBounds(polyline.getBounds());
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'itinéraire:', error);
            alert('Erreur lors de la récupération de l\'itinéraire');
        }
    }

    document.getElementById('search-button').addEventListener('click', searchCompanies);
    document.getElementById('display-company-button').addEventListener('click', displayCompanyInfo);

    initializeMap();
});





code server
import express from 'express';
import mysql from 'mysql';
import bodyParser from 'body-parser';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const apiKey = 'v5b3ce3597851110001cf62488fa64d9126564119b3571283c0e413f8';
const saltRounds = 10;

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
    throw err;
  }
  console.log('MySQL Connected...');
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'votre_adresse_email@gmail.com',
    pass: 'votre_mot_de_passe_gmail'
  }
});



// Route pour que l'installateur s'inscrive avec son email et mot de passe
app.post('/api/confirm-account', async (req, res) => {
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
app.post('/api/send-confirmation-email', async (req, res) => {
  const { email } = req.body;

  // Génération du code de confirmation (à générer et stocker dans une base de données)
  const confirmationCode = Math.floor(100000 + Math.random() * 900000);

  // Paramètres de l'email
  const mailOptions = {
    from: 'votre_adresse_email@gmail.com',
    to: email,
    subject: 'Code de confirmation pour votre compte',
    text: `Votre code de confirmation est : ${confirmationCode}`
  };
  try {
    // Envoi de l'email
    await transporter.sendMail(mailOptions);
    console.log(`Email de confirmation envoyé à : ${email}`);
    res.status(200).json({ message: 'Email de confirmation envoyé.' });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de confirmation:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email de confirmation.' });
  }
});
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
const newIdentifiant= 'nouvelEmail@example.com';
const newPassword = 'monMotDePasse123';

registerInstaller(newIdentifiant, newPassword)
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



// Route pour envoyer le formulaire d'enregistrement initial ou de mise à jour
app.get('/api/installer', async (req, res) => {
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
// Simulation d'une base de données d'utilisateurs installateurs (à remplacer par une vraie base de données)
const installateurs = [
  { identifiant: 'installateur1', password: 'password1' },
  { identifiant: 'installateur2', password: 'password2' }
];

// Route pour la connexion de l'installateur
app.post('/api/login', (req, res) => {
  const { identifiant, password } = req.body;

  // Rechercher l'utilisateur dans la "base de données" simulée
  const installateur = installateurs.find(user => user.identifiant === identifiant && user.password === password);

  if (installateur) {
    // Authentification réussie
    res.status(200).json({ message: 'Connexion réussie.' });
  } else {
    // Identifiant ou mot de passe incorrect
    res.status(401).json({ error: 'Identifiant ou mot de passe incorrect.' });
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









////////////////////////////////////////////




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
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    throw new Error('Erreur lors du hachage du mot de passe');
  }
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'kpankpan.kambire@gmail.com',
    pass: 'votre_mot_de_passe_gmail'
  }
});

// Stockage temporaire des codes de confirmation
const confirmationCodes = {};

// Route pour envoyer le code de confirmation
app.post('/api/send-confirmation-email', async (req, res) => {
  const { newIdentifiant, newPassword } = req.body; // Utilisation de destructuring pour récupérer newIdentifiant et newPassword

  try {
    const exists = await identifiantExists(newIdentifiant);
    if (exists) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé. Veuillez vous connecter.' });
    }

    // Génération du code de confirmation
    const confirmationCode = Math.floor(100000 + Math.random() * 900000);
    confirmationCodes[newIdentifiant] = { code: confirmationCode, password: await bcrypt.hash(newPassword, 10) };

    // Paramètres de l'email
    const mailOptions = {
      from: 'kpankpan.kambire@gmail.com',
      to: newIdentifiant,
      subject: 'Code de confirmation pour votre compte',
      text: `Votre code de confirmation est : ${confirmationCode}`
    };

    // Envoi de l'email
    await transporter.sendMail(mailOptions);
    console.log(`Email de confirmation envoyé à : ${newIdentifiant}`);
    res.status(200).json({ message: 'Email de confirmation envoyé.' });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de confirmation:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email de confirmation.' });
  }
});

// Route pour confirmer l'inscription de l'installateur
app.post('/api/confirm-account', (req, res) => {
  const { identifiant, confirmationCode } = req.body;

  if (confirmationCodes[identifiant] && confirmationCodes[identifiant].code == confirmationCode) {
    // Enregistrer l'utilisateur dans la base de données
    const hashedPassword = confirmationCodes[identifiant].password;
    db.query('INSERT INTO table_pv (identifiant, password) VALUES (?, ?)', [identifiant, hashedPassword], (error, results) => {
      if (error) {
        console.error('Erreur de requête SQL:', error);
        return res.status(500).json({ error: 'Erreur interne du serveur.' });
      }
      delete confirmationCodes[identifiant]; // Supprimer le code de confirmation après utilisation
      res.status(200).json({ message: 'Compte confirmé et créé avec succès.' });
    });
  } else {
    res.status(400).json({ error: 'Code de confirmation invalide.' });
  }
});

// Route pour envoyer le formulaire d'enregistrement initial ou de mise à jour
app.get('/api/installer', async (req, res) => {
  const userId = req.table_pv.id; // Supposons que vous avez l'ID de l'utilisateur depuis la session ou le token JWT
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
  const userId = req.table_pv.id; // Supposons que vous avez l'ID de l'utilisateur depuis la session ou le token JWT
  const { nom, adresse, ville, region, numero, mail, site_web, categorie, type_activite } = req.body;

  try {
    // Mettre à jour les informations de l'utilisateur dans la base de données
    const sql = 'UPDATE table_pv SET nom = ?, adresse = ?, ville = ?, region = ?, numero = ?, mail = ?, site_web = ?, categorie = ?, type_activite = ? WHERE id = ?';
    db.query(sql, [nom, adresse, ville, region, numero, mail, site_web, categorie, type_activite, userId], (err, result) => {
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

// Route pour la connexion de l'installateur
app.post('/api/login', (req, res) => {
  const { identifiant, password } = req.body;

  db.query('SELECT * FROM table_pv WHERE identifiant = ?', [identifiant], async (err, results) => {
    if (err) {
      console.error('Erreur lors de la vérification de l\'identifiant:', err);
      return res.status(500).json({ error: 'Erreur interne du serveur.' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect.' });
    }

    const installateur = results[0];
    const passwordMatch = await bcrypt.compare(password, installateur.password);

    if (passwordMatch) {
      res.status(200).json({ message: 'Connexion réussie.' });
    } else {
      res.status(401).json({ error: 'Identifiant ou mot de passe incorrect.' });
    }
  });
});


/////////////////////////////////////:::
c'est ça j'utilise et ça ne marche pas là: async function traceItineraryToCompany(address) {
      try {
        const response = await fetch(https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)});
        if (!response.ok) {
          throw new Error('Adresse de destination introuvable');
        }
        const data = await response.json();
        if (data.length > 0) {
          const { lat, lon } = data[0];
          const destinationCoords = ${lat},${lon};
    
          // Rediriger l'utilisateur vers Google Maps avec les coordonnées de destination
          const mapsUrl = https://www.google.com/maps/dir/?api=1&destination=${destinationCoords};
          window.open(mapsUrl, '_blank');
        } else {
          alert('Adresse de destination introuvable');
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des coordonnées:', error);
        alert('Erreur lors de la récupération des coordonnées');
      }
    }