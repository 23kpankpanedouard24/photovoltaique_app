
document.addEventListener("DOMContentLoaded", function() {
    const apiKey = '5b3ce3597851110001cf62488fa64d9126564119b3571283c0e413f8';
     
    let map;
    let companyMarker;
    // Fonction pour gérer le changement de rôle
    function handleRoleChange() {
      const role = document.getElementById('role').value;
      const installateurOptions = document.getElementById('installateur-options');
      const utilisateurForm = document.getElementById('utilisateur-form');
      const loginPrompt = document.getElementById('login-prompt');
      const createAccountForm = document.getElementById('create-account-form');
      const confirmAccountForm = document.getElementById('confirm-account-form');
      const installateurForm = document.getElementById('installateur-form');

      if (role === 'installateur') {
        installateurOptions.style.display = 'block';
        utilisateurForm.style.display = 'none';
        loginPrompt.style.display = 'none';
        createAccountForm.style.display = 'none';
        confirmAccountForm.style.display = 'none';
        installateurForm.style.display = 'none';
      } else if (role === 'utilisateur') {
        utilisateurForm.style.display = 'block';
        installateurOptions.style.display = 'none';
        loginPrompt.style.display = 'none';
        createAccountForm.style.display = 'none';
        confirmAccountForm.style.display = 'none';
        installateurForm.style.display = 'none';
        loadRegions(); // Charger les régions disponibles lors du changement vers utilisateur
      } else {
        installateurOptions.style.display = 'none';
        utilisateurForm.style.display = 'none';
        loginPrompt.style.display = 'none';
        createAccountForm.style.display = 'none';
        confirmAccountForm.style.display = 'none';
        installateurForm.style.display = 'none';
      }
    }

    // Fonction pour afficher l'invite de connexion
    function showLoginPrompt() {
      document.getElementById('login-prompt').style.display = 'block';
      document.getElementById('create-account-form').style.display = 'none';
      document.getElementById('confirm-account-form').style.display = 'none';
      document.getElementById('installateur-form').style.display = 'none';
    }

    // Fonction pour afficher le formulaire de confirmation d'inscription
    function showConfirmAccountForm() {
      document.getElementById('confirm-account-form').style.display = 'block';
      document.getElementById('login-prompt').style.display = 'none';
      document.getElementById('create-account-form').style.display = 'none';
      document.getElementById('installateur-form').style.display = 'none';
    }

    // Fonction pour afficher le formulaire de création de compte
    function showCreateAccountForm() {
      document.getElementById('login-prompt').style.display = 'none';
      document.getElementById('create-account-form').style.display = 'block';
      document.getElementById('confirm-account-form').style.display = 'none';
      document.getElementById('installateur-form').style.display = 'none';
    }

    // Fonction pour envoyer l'email de confirmation
    function sendConfirmationEmail() {
      var identifiant = document.getElementById('new-identifiant').value;
      var password = document.getElementById('new-password').value;

      axios.post('http://localhost:8080/send-confirmation-email', {
        identifiant: identifiant,
        password: password
      })
      .then(function (response) {
        alert('Email de confirmation envoyé. Veuillez vérifier votre boîte mail.');
        showConfirmAccountForm();
      })
      .catch(function (error) {
        if (error.response && error.response.status === 409) {
          alert('Cet identifiant existe déjà. Veuillez vous connecter.');
        } else {
          alert('Erreur lors de l\'envoi de l\'email de confirmation.');
        }
      });
    }

    // Fonction pour confirmer l'inscription
    function confirmAccount() {
      var identifiant = document.getElementById('confirm-identifiant').value;
      var confirmationCode = document.getElementById('confirmation-code').value;

      axios.post('http://localhost:8080/confirm-email', {
        identifiant: identifiant,
        confirmationCode: confirmationCode
      })
      .then(function (response) {
        alert('Email confirmé avec succès.');
        document.getElementById('installateur-form').style.display = 'block';
        document.getElementById('confirm-account-form').style.display = 'none';
      })
      .catch(function (error) {
        alert('Erreur lors de la confirmation de l\'email.');
      });
    }

    // Fonction pour enregistrer les informations de l'entreprise
function registerCompany() {
  // Récupérer les valeurs du formulaire d'entreprise
  var nom = document.getElementById('nom').value;
  var adresse = document.getElementById('adresse').value;
  var ville = document.getElementById('ville').value;
  var region = document.getElementById('region').value;
  var numero = document.getElementById('numero').value;
  var mail = document.getElementById('mail').value;
  var site_web = document.getElementById('site_web').value;
  var categorie = document.getElementById('categorie').value;
  var type_activite = document.getElementById('type_activite').value;

  var identifiant = document.getElementById('confirm-identifiant').value;

  // Envoyer les données au serveur
  axios.post('http://localhost:8080/register-company', {
    nom: nom,
    adresse: adresse,
    ville: ville,
    region: region,
    numero: numero,
    mail: mail,
    site_web: site_web,
    categorie: categorie,
    type_activite: type_activite
  })
  .then(response => {
    console.log('Réponse du serveur:', response.data);
    alert('Informations de l\'entreprise enregistrées avec succès.');
  })
  .catch(error => {
    console.error('Erreur lors de la requête Axios:', error);
    alert('Erreur lors de l\'enregistrement des informations de l\'entreprise.');
  });
}


function login() {
  const identifiant = document.getElementById('identifiant').value;
  const password = document.getElementById('password').value;

  axios.post('http://localhost:8080/login', {
    identifiant: identifiant,
    password: password
  })
  .then(response => {
    if (response.data.success) {
      const user = response.data.user;
      console.log('Réponse du serveur:', user);

      // Remplir le formulaire de mise à jour avec les données de l'utilisateur
      document.getElementById('nom').value = user.nom;
      document.getElementById('adresse').value = user.adresse;
      document.getElementById('ville').value = user.ville;
      document.getElementById('region').value = user.region;
      document.getElementById('numero').value = user.numero;
      document.getElementById('mail').value = user.mail;
      document.getElementById('site_web').value = user.site_web;
      document.getElementById('categorie').value = user.categorie;
      document.getElementById('type_activite').value = user.type_activite;

      // Afficher le formulaire de mise à jour
      document.getElementById('installateur-form').style.display = 'block';
      document.getElementById('login-prompt').style.display = 'none';
    } else {
      alert('Identifiant ou mot de passe incorrect');
    }
  })
  .catch(error => {
    console.error('Erreur lors de la requête Axios:', error);
    alert('Erreur lors de la connexion. Veuillez réessayer.');
  });
}
    
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

    // Fonction pour localiser une entreprise sur la carte
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
          console.log('destinationCoords')

          // Supprimer le marqueur existant s'il y en a un
          if (companyMarker) {
            map.removeLayer(companyMarker);
          }

          // Ajouter le marqueur à la carte
          companyMarker = L.marker(destinationCoords).addTo(map)
            .bindPopup(`<b>${address}</b>`)
            .openPopup();

          // Centrer la carte sur la position de l'entreprise
          map.setView(destinationCoords, 13);
        } else {
          alert('Adresse de destination introuvable');
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des coordonnées:', error);
      }
    }

    
    function traceItineraryToCompany(address) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          position => {
            const { latitude, longitude } = position.coords;
            const startCoords = `${latitude},${longitude}`;
            const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${startCoords}&destination=${encodeURIComponent(address)}`;
            window.open(mapsUrl, '_blank');
          },
          error => {
            console.error('Erreur lors de l\'obtention de la position de l\'utilisateur:', error);
            alert('Erreur lors de l\'obtention de la position de l\'utilisateur. Veuillez vérifier les paramètres de localisation de votre navigateur.');
          }
        );
      } else {
        alert('La géolocalisation n\'est pas supportée par ce navigateur.');
      }
    }
    
    
    document.getElementById('search-button').addEventListener('click', searchCompanies);
    document.getElementById('display-company-button').addEventListener('click', displayCompanyInfo);
    document.getElementById('role').addEventListener('change', handleRoleChange);

    // Fonction pour initialiser la carte avec Leaflet
    function initializeMap() { 
      var map = L.map('map').setView([31.7917, -7.0926], 8); // Remplacez les coordonnées par celles de votre choix
  
      L.tileLayer('https://services.arcgisonline.com/arcgis/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles © Esri'
    }).addTo(map);
}
  
    // Initialiser la carte lorsque le DOM est chargé
    document.addEventListener('DOMContentLoaded', initializeMap);
  
});
