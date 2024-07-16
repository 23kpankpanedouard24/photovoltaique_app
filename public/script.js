/*
document.addEventListener("DOMContentLoaded", function() {
    const apiKey = '5b3ce3597851110001cf62488fa64d9126564119b3571283c0e413f8';
    let map;
    let userLocation;

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

    function showLoginPrompt() {
      document.getElementById('login-prompt').style.display = 'block';
      document.getElementById('create-account-form').style.display = 'none';
      document.getElementById('confirm-account-form').style.display = 'none';
      document.getElementById('installateur-form').style.display = 'none';
    }

    function showCreateAccountForm() {
      document.getElementById('login-prompt').style.display = 'none';
      document.getElementById('create-account-form').style.display = 'block';
      document.getElementById('confirm-account-form').style.display = 'none';
      document.getElementById('installateur-form').style.display = 'none';
    }

    function sendConfirmationEmail() {
        var identifiant = document.getElementById('new-identifiant').value;
  
        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'http://localhost:8080/send-confirmation-email', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onreadystatechange = function () {
          if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
              alert('Email de confirmation envoyé. Veuillez vérifier votre boîte mail.');
              // Rediriger ou effectuer d'autres actions après l'envoi réussi de l'email
            } else if (xhr.status === 409) {
              alert('Cet identifiant existe déjà. Veuillez vous connecter.');
              // Gérer le cas où l'identifiant existe déjà
            } else {
              alert('Erreur lors de l\'envoi de l\'email de confirmation.');
              // Gérer d'autres erreurs si nécessaire
            }
          }
        };
        xhr.send(JSON.stringify({ identifiant: identifiant }));
      }
    // Fonction pour confirmer l'inscription
    function confirmAccount() {
        const confirmationCode = document.getElementById('confirmation-code').value; // Récupérer le code de confirmation depuis le formulaire
      
        fetch('/api/confirm-account', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ confirmationCode }),
        })
        .then(response => {
          if (response.ok) {
            return response.json();
          }
          throw new Error('Code de confirmation invalide.');
        })
        .then(data => {
          alert('Compte confirmé avec succès. Veuillez compléter votre enregistrement.');
          document.getElementById('installateur-form').style.display = 'block';
          document.getElementById('confirm-account-form').style.display = 'none';
        })
        .catch(error => {
          console.error('Erreur lors de la confirmation du compte:', error);
          alert('Erreur lors de la confirmation du compte. Veuillez vérifier votre code de confirmation.');
        });
      }

      // Fonction de connexion (à implémenter selon vos besoins)
    function login() {
        const identifiant = document.getElementById('identifiant').value; // Récupérer l'identifiant depuis le formulaire
        const password = document.getElementById('password').value; // Récupérer le mot de passe depuis le formulaire
      
        fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ identifiant, password }),
        })
        .then(response => {
          if (response.ok) {
            return response.json();
          }
          throw new Error('Identifiant ou mot de passe incorrect.');
        })
        .then(data => {
          alert('Connexion réussie.');
          // Redirection ou mise à jour de l'interface utilisateur après la connexion réussie
          document.getElementById('login-prompt').style.display = 'none';
          document.getElementById('installateur-form').style.display = 'block';
        })
        .catch(error => {
          console.error('Erreur lors de la connexion:', error);
          alert('Erreur lors de la connexion. Veuillez vérifier votre identifiant ou mot de passe.');
        });
      }  
       
      async function update(nom, adresse, ville, region, numero, mail, site_web, categorie, type_activite) {
        const response = await fetch('/api/installer/profile/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nom, adresse, ville, region, numero, mail, site_web, categorie, type_activite })
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
          const success = await registerCompany(nom, adresse, ville, region, numero, mail, site_web, categorie, type_activite);
          if (success) {
            console.log('Entreprise enregistrée avec succès');
          } else {
            console.log('Erreur lors de l\'enregistrement de l\'entreprise');
          }
        }
      });
      document.getElementById('role').addEventListener('change', handleRoleChange);
  
// Fonction pour enregistrer une entreprise (initial ou mise à jour)
async function registerCompany(nom, adresse, ville, region, numero, mail, site_web, categorie, type_activite, password) {
    try {
      const hashedPassword = await hashPassword(password); // Hacher le mot de passe
      const response = await fetch('/api/installer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nom, adresse, ville, region, numero, mail, site_web, categorie, type_activite, password: hashedPassword })
      });
  
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'entreprise:', error);
      return false;
    }
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
        const success = await registerCompany(nom, adresse, ville, region, numero, mail, site_web, categorie, type_activite);
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
        if (companyInfo.latitude && companyInfo.longitude) {
            const marker = L.marker([companyInfo.latitude, companyInfo.longitude]).addTo(map);
            map.setView([companyInfo.latitude, companyInfo.longitude], 10);
            marker.bindPopup(`<b>${companyInfo.nom}</b><br>${companyInfo.adresse}`).openPopup();
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
*/