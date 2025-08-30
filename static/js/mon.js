// Fonction pour afficher les messages
function showMessage(message, type = 'info') {
    // Créer l'élément de message
    const messageElement = document.createElement('div');
    messageElement.innerHTML = message;
    messageElement.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: white;
        padding: 20px 30px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 2000;
        font-family: Arial, sans-serif;
        max-width: 80%;
        text-align: center;
        animation: fadeIn 0.3s ease-out;
        border: 2px solid #1e88e5;
        font-size: 16px;
        font-weight: bold;
    `;

    // Définir les styles selon le type de message
    if (type === 'error') {
        messageElement.style.backgroundColor = 'white';
        messageElement.style.color = '#d32f2f';
        messageElement.style.border = '2px solid #d32f2f';
    } else if (type === 'success') {
        messageElement.style.backgroundColor = 'white';
        messageElement.style.color = '#2e7d32';
        messageElement.style.border = '2px solid #2e7d32';
    } else {
        messageElement.style.backgroundColor = 'white';
        messageElement.style.color = '#1e88e5';
    }

    // Ajouter au document
    document.body.appendChild(messageElement);

    // Supprimer après 3 secondes avec animation de fondu
    setTimeout(() => {
        messageElement.style.animation = 'fadeOut 0.3s ease-in';
        setTimeout(() => {
            messageElement.remove();
        }, 300);
    }, 3000);
}

// Créer le bouton de bascule
// État initial des éléments d'information
let isInfoVisible = true;

// Fonction pour mettre à jour le style des éléments
// Fonction pour mettre à jour le style des éléments
function updateInfoVisibility(visible) {
    const infoElements = document.querySelectorAll('#info, .legend, .history-controls, .leaflet-control-layers');
    infoElements.forEach(element => {
        if (visible) {
            element.classList.remove('hidden');
        } else {
            element.classList.add('hidden');
        }
    });
}

// Gestionnaire d'événements pour le bouton de bascule
document.getElementById('toggleInfoButton').addEventListener('click', function() {
    // Inverser l'état
    isInfoVisible = !isInfoVisible;

    // Mettre à jour la visibilité des éléments
    updateInfoVisibility(isInfoVisible);

    // Ajouter une classe pour l'animation du bouton si désiré
    this.classList.toggle('active');

    // Mettre à jour le titre du bouton pour l'accessibilité
    this.title = isInfoVisible ? "Masquer les informations" : "Afficher les informations";
});

// Initialisation de l'état au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    updateInfoVisibility(isInfoVisible);
});

let popupContent = '';
let forceKeepOpen = false;

// Créer le popup une seule fois
const persistentPopup = L.popup({
    autoClose: false,
    closeOnClick: false,
    closeButton: true
});

// Gestionnaire pour le bouton de fermeture du popup
persistentPopup.on('remove', () => {
    forceKeepOpen = false;
});

// Fonction de mise à jour du marqueur
function updateMarkerInfo(data, cog, speed, distanceInNauticalMiles, projectionHours) {
    if (!shipMarker) return;

    // Mettre à jour le contenu
    popupContent = `
        <strong>HUAHINE</strong><br>
        Position: ${data.latitude.toFixed(5)}, ${data.longitude.toFixed(5)}<br>
        Cap: ${cog}°<br>
        Vitesse: ${speed.toFixed(1)} nœuds<br>
        Distance projetée: ${distanceInNauticalMiles.toFixed(1)} NM sur ${(projectionHours * 60).toFixed(0)} min
    `;

    // Mettre à jour le popup et l'ajouter à la carte si nécessaire
    if (forceKeepOpen) {
        persistentPopup
            .setLatLng(shipMarker.getLatLng())
            .setContent(popupContent)
            .addTo(map);
    }
}

const initialPosition = [43.2438, 5.3656];
console.log('Position initiale:', initialPosition);

// Au début du script, ajoutez :
const positionHistory = [];


// Variable globale pour le temps de projection
let projectionHours = 0.25;

const map = L.map('map', {
center: initialPosition,
zoomSnap: 1,
zoomDelta: 1,
minZoom: 2,
maxZoom: 18,
keepInView: false,  // Empêche le recentrage automatique
maxBounds: null,    // Supprime les limites de la carte
maxBoundsViscosity: 0  // Désactive la "viscosité" des limites
}).setView(initialPosition, 13);


const info = document.getElementById('info');
function updateInfo(text) {
    info.innerHTML = text;
}

// Fonction pour mettre à jour le temps de projection
function updateProjectionTime() {
updatePosition();
const input = document.getElementById('projectionTime');
const minutes = parseFloat(input.value);

if (minutes >= 0 && minutes <= 1440) {
    projectionHours = minutes / 60;  // Conversion des minutes en heures
    document.getElementById('projectionInfo').innerHTML =
        `Projection sur ${minutes.toFixed(0)} minutes`;
    // Mettre à jour tous les navires avec la nouvelle projection
    updateAISData();
} else {
    showMessage('Veuillez entrer une valeur inférieur à 1440 minutes soit 24 heures');
    input.value = projectionHours * 60;  // Reconversion en minutes pour l'affichage
}
}

// Initialisation de l'affichage du temps de projection
document.addEventListener('DOMContentLoaded', function() {
document.getElementById('projectionTime').value = (projectionHours * 60).toFixed(0);
document.getElementById('projectionInfo').innerHTML =
    `Projection sur ${(projectionHours * 60).toFixed(0)} minutes`;
});


// Variable globale pour le marker
let shipMarker = null;

// Fonction pour nettoyer tous les markers de la carte
const clearAllMarkers = () => {
    map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });
    shipMarker = null;
};

// Fonction pour créer l'icône personnalisée
function createCustomIcon(angle = 0, shouldFlip = false) {
    const adjustedAngle = angle - 270;
    return L.divIcon({
        html: `<div class="ship-icon" id="unique-ship-icon">
            <img src="/static/VoilierImage.png"
                 style="transform:
                        rotate(${adjustedAngle}deg)
                        scaleY(${shouldFlip ? -1 : 1});
                        width: 30px; height: 30px;
                        transition: all 0.3s ease;">
        </div>`,
        className: 'custom-ship-icon',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });
}

// Fonction pour mettre à jour le marker
const updateShipMarker = (position, angle) => {
    // Normalisation de l'angle
    let normalizedAngle = ((angle % 360) + 360) % 360;

    // Détermine si l'image doit être inversée (quand l'angle est entre 0 et 180)
    const shouldFlip = normalizedAngle > 0 && normalizedAngle < 180;

    // Ajustement de l'angle pour l'orientation correcte de l'image
    const adjustedAngle = normalizedAngle - 270;

    if (shipMarker) {
        map.removeLayer(shipMarker);
    }

    // Créer un nouveau marker
    shipMarker = L.marker(position, {
        icon: createCustomIcon(angle, shouldFlip),
    }).addTo(map);
};

// Initialisation
const initializeShip = () => {
    const initialPosition = [43.2438, 5.3656];
    updateShipMarker(initialPosition, 0);
};

// Attendre que la carte soit prête
map.whenReady(() => {
    //clearAllMarkers(); // Nettoyer avant l'initialisation
    initializeShip();
});

// Couche MBTiles
// Définition des différentes couches MBTiles
const mondeTileLayer = L.tileLayer('/tile/cartes1.mbtiles/{z}/{x}/{y}', {
tms: true,
opacity: 0.7,
attribution: 'MBTiles Map - Monde',
maxZoom: 18,
minZoom: 2
});

const merTileLayer = L.tileLayer('/tile/cartes2.mbtiles/{z}/{x}/{y}', {
tms: true,
opacity: 0.7,
attribution: 'MBTiles Map - Marseille',
maxZoom: 18,
minZoom: 2
});

const navionicsTileLayer = L.tileLayer('/tile/cartes3.mbtiles/{z}/{x}/{y}', {
tms: true,
opacity: 0.7,
attribution: 'MBTiles Map - Navionics',
maxZoom: 18,
minZoom: 2
});

const corseTileLayer = L.tileLayer('/tile/cartes4.mbtiles/{z}/{x}/{y}', {
tms: true,
opacity: 0.7,
attribution: 'MBTiles Map - Navionics',
maxZoom: 18,
minZoom: 2
});

// Ajout de la couche par défaut
mondeTileLayer.addTo(map);

// Contrôle des couches avec les différentes cartes
const baseMaps = {
"Carte Planette": mondeTileLayer,
"Carte SonarChart": merTileLayer,
"Carte Navionics": navionicsTileLayer
};

L.control.layers(baseMaps, null, {collapsed: false}).addTo(map);

// Marqueur principal
const currentMarker = L.marker(initialPosition, {
icon: createCustomIcon(0),
}).addTo(map)
.bindPopup("Salut tout le monde ! Je suis HUAHINE");
//.openPopup();

// Suivi de la position
const polyline = L.polyline([initialPosition], {
    color: 'red',
    weight: 3,
    opacity: 0.7
}).addTo(map);


// Ensuite, modifions la définition de la ligne
const projectionLine = L.polyline([], {
    color: '#1e88e5',
    weight: 2,
    opacity: 0.8,
    dashArray: '7, 7',
    className: 'animated-dash'  // Ajout de la classe pour l'animation
}).addTo(map);

updateInfo(`Zoom: ${map.getZoom()+1}<br>Position: ${initialPosition[0].toFixed(5)}, ${initialPosition[1].toFixed(5)}`);

// Stockage des marqueurs AIS et des lignes de vitesse
const aisMarkers = {};
const speedLines = {};

// Fonction pour convertir les milles nautiques en degrés
function nauticalMilesToDegrees(nauticalMiles) {
    return nauticalMiles / 60;
}

// Fonction pour mettre à jour ou créer un marqueur AIS
function updateAISMarker(ship) {
    console.log("Mise à jour/création du marqueur pour MMSI:", ship.mmsi);
    const shipColor = ship.class === 'A' ? '#FF0000' : '#00FF00';  // Rouge pour classe A, Vert pour classe B

    // Créer un icône rotatif basé sur le cap du navire
    const rotatedShipIcon = L.divIcon({
        html: `<div class="ship-icon" style="transform: rotate(${ship.cog}deg);">
            <svg viewBox="0 0 100 100" style="width: 24px; height: 24px;">
                <path fill="${shipColor}" stroke="white" stroke-width="2"
                    d="M50,10 L80,80 L50,65 L20,80 Z"/>
            </svg>
        </div>`,
        className: 'ship-marker',
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    });

    // Calculer la distance parcourue
    const speed = ship.sog || 0; // vitesse en nœuds
    const distanceInNauticalMiles = speed * projectionHours;
    const distanceInDegrees = nauticalMilesToDegrees(distanceInNauticalMiles);

    // Calculer le point final de la ligne de vitesse
    const headingRad = (ship.cog * Math.PI) / 180;

    // Calculer les coordonnées du point final
    const endLat = ship.latitude + distanceInDegrees * Math.cos(headingRad);
    const endLon = ship.longitude + distanceInDegrees * Math.sin(headingRad);

    // Mettre à jour ou créer la ligne de vitesse
    if (speedLines[ship.mmsi]) {
        speedLines[ship.mmsi].setLatLngs([
            [ship.latitude, ship.longitude],
            [endLat, endLon]
        ]);
    } else {
        speedLines[ship.mmsi] = L.polyline(
            [[ship.latitude, ship.longitude], [endLat, endLon]],
            {
                color: '#1e88e5',
                weight: 2,
                opacity: 0.8,
                dashArray: '5, 5'
            }
        ).addTo(map);
    }

    // Contenu de la popup avec les informations de projection
    const popupContent = `
        <strong>${ship.name || 'Navire inconnu'}</strong><br>
        <strong>Navire AIS Classe ${ship.class}</strong><br>
        MMSI: ${ship.mmsi}<br>
        Position: ${ship.latitude.toFixed(5)}, ${ship.longitude.toFixed(5)}<br>
        Cap: ${ship.cog}°<br>
        Vitesse: ${ship.sog ? ship.sog.toFixed(1) : 'N/A'} nœuds<br>
        Distance projetée: ${distanceInNauticalMiles.toFixed(1)} NM sur ${(projectionHours * 60).toFixed(0)} min
    `;

    if (aisMarkers[ship.mmsi]) {
        // Mise à jour d'un marqueur existant
        aisMarkers[ship.mmsi].setLatLng([ship.latitude, ship.longitude]);
        aisMarkers[ship.mmsi].setIcon(rotatedShipIcon);
        aisMarkers[ship.mmsi].getPopup().setContent(popupContent);
    } else {
        // Création d'un nouveau marqueur
        aisMarkers[ship.mmsi] = L.marker([ship.latitude, ship.longitude], {
            icon: rotatedShipIcon
        }).addTo(map);
        aisMarkers[ship.mmsi].bindPopup(popupContent);
    }
}

// Fonction de mise à jour des données AIS
async function updateAISData() {
    try {
        console.log("Récupération des données AIS...");
        const response = await fetch('/get_ships');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const ships = await response.json();
        console.log("Données AIS reçues:", ships);

        // Mettre à jour chaque navire
        ships.forEach(ship => updateAISMarker(ship));

        // Supprimer les marqueurs des navires qui ne sont plus présents
        Object.keys(aisMarkers).forEach(mmsi => {
            if (!ships.find(ship => ship.mmsi === mmsi)) {
                console.log("Suppression du navire:", mmsi);
                map.removeLayer(aisMarkers[mmsi]);
                if (speedLines[mmsi]) {
                    map.removeLayer(speedLines[mmsi]);
                    delete speedLines[mmsi];
                }
                delete aisMarkers[mmsi];
            }
        });
    } catch (err) {
        console.error("Erreur lors de la mise à jour des données AIS:", err);
    }
}


// Fonction de mise à jour de la position principale
async function updatePosition() {
    try {
        const response = await fetch('/api/get_coordinates');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (data.latitude && data.longitude) {
            const newLatLng = new L.LatLng(data.latitude, data.longitude);

            // Sauvegarde de l'historique
            positionHistory.push({
                latitude: data.latitude,
                longitude: data.longitude,
                cog: data.cog || 0,
                speed: data.speed || 0,
                timestamp: new Date().toISOString()
            });

        // Limiter l'historique à 14 400 points par exemple (4h)
        if (positionHistory.length > 14400) {
            positionHistory.shift();
        }

        // Toutes les 3 secondes :
        const lastPoint = positionHistory[positionHistory.length - 1];

        // Création de la ligne entre les points
        polyline.addLatLng([lastPoint.latitude, lastPoint.longitude]);

        // Création du point
        L.circleMarker([lastPoint.latitude, lastPoint.longitude], {
            radius: 3,
            fillColor: '#ff4444',
            color: '#000',
            weight: 1,
            opacity: 0.8,
            fillOpacity: 0.6
        }).addTo(map).bindPopup(`
            <strong>Position historique</strong><br>
            Heure: ${new Date(lastPoint.timestamp).toLocaleTimeString()}<br>
            Position: ${lastPoint.latitude.toFixed(5)}, ${lastPoint.longitude.toFixed(5)}<br>
            Cap: ${lastPoint.cog}°<br>
            Vitesse: ${lastPoint.speed.toFixed(1)} nœuds
        `);

        // Mise à jour du marker avec la nouvelle position et rotation
        updateShipMarker([data.latitude, data.longitude], data.cog || 0);

        polyline.addLatLng(newLatLng);

        // Calcul de la projection
        const speed = data.speed || 0;
        const cog = data.cog || 0;

        const distanceInNauticalMiles = speed * projectionHours;
        const distanceInDegrees = nauticalMilesToDegrees(distanceInNauticalMiles);
        const headingRad = (cog * Math.PI) / 180;
        const endLat = data.latitude + distanceInDegrees * Math.cos(headingRad);
        const endLon = data.longitude + distanceInDegrees * Math.sin(headingRad);

        // Mise à jour de la ligne de projection
        projectionLine.setLatLngs([
            [data.latitude, data.longitude],
            [endLat, endLon]
        ]);

        // Mise à jour du popup
        // Au début de votre script, déclarez une variable pour le popup
        if (shipMarker) {
            shipMarker.off('click').on('click', function() {
                forceKeepOpen = !forceKeepOpen;

                if (forceKeepOpen) {
                    // Créer et afficher le popup immédiatement lors du clic
                    persistentPopup
                        .setLatLng(shipMarker.getLatLng())
                        .setContent(`
                            <strong>HUAHINE</strong><br>
                            Position: ${data.latitude.toFixed(5)}, ${data.longitude.toFixed(5)}<br>
                            Cap: ${data.cog}°<br>
                            Vitesse: ${data.speed.toFixed(1)} nœuds<br>
                            Distance projetée: ${(data.speed * projectionHours).toFixed(1)} NM sur ${(projectionHours * 60).toFixed(0)} min
                        `)
                        .addTo(map);
                } else {
                    map.closePopup(persistentPopup);
                }
            });
        }

        updateInfo(`
            Zoom: ${map.getZoom()}<br>
            Position: ${data.latitude.toFixed(5)}, ${data.longitude.toFixed(5)}<br>
            Cap: ${cog}°<br>
            Vitesse: ${speed.toFixed(1)} nœuds
        `);
        }
    } catch (err) {
        console.error("Erreur de mise à jour des coordonnées:", err);
    }
}

// Fonction pour sauvegarder l'historique
function saveHistory() {
    if (positionHistory.length === 0) {
        alert("Pas d'historique à sauvegarder");
        return;
    }

    const historyData = JSON.stringify(positionHistory);
    fetch('/save_history', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: historyData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === "success") {
            showMessage("Historique sauvegardé avec succès","success");
        } else {
            alert("Erreur lors de la sauvegarde: " + data.message);
        }
    })
    .catch(error => {
        console.error('Erreur de sauvegarde:', error);
        alert("Erreur lors de la sauvegarde");
    });
}

// Fonction pour charger l'historique
function loadHistory() {
    fetch('/load_history')
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log("Données reçues:", data);

        // Vérification approfondie des données
        if (!Array.isArray(data)) {
            throw new Error("Les données reçues ne sont pas un tableau");
        }

        // Vider le tableau existant au lieu de réassigner
        positionHistory.length = 0;

        // Nettoyage de la carte
        polyline.setLatLngs([]);
        map.eachLayer((layer) => {
            if (layer instanceof L.CircleMarker || layer instanceof L.Polyline) {
                map.removeLayer(layer);
            }
        });

        // Ajouter les nouveaux points
        data.forEach((point, index) => {
            // Validation des données requises
            if (!point.latitude || !point.longitude || !point.timestamp ||
                typeof point.cog !== 'number' || typeof point.speed !== 'number') {
                console.warn(`Point invalide à l'index ${index}:`, point);
                return;
            }

            try {
                // Ajout du point à l'historique
                positionHistory.push(point);

                // Création du marqueur
                const marker = L.circleMarker([point.latitude, point.longitude], {
                    radius: 3,
                    fillColor: '#ff4444',
                    color: '#000',
                    weight: 1,
                    opacity: 0.8,
                    fillOpacity: 0.6
                });

                // Ajout du popup
                marker.bindPopup(`
                    <strong>Position historique</strong><br>
                    Heure: ${new Date(point.timestamp).toLocaleTimeString()}<br>
                    Position: ${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}<br>
                    Cap: ${point.cog}°<br>
                    Vitesse: ${point.speed.toFixed(1)} nœuds
                `);

                // Ajout à la carte
                marker.addTo(map);

                // Mise à jour de la ligne de trace
                polyline.addLatLng([point.latitude, point.longitude]);

            } catch (err) {
                console.error(`Erreur lors du traitement du point ${index}:`, err);
            }
        });

        // Centrer la carte sur le dernier point si disponible
        if (positionHistory.length > 0) {
            const lastPoint = positionHistory[positionHistory.length - 1];
            map.setView([lastPoint.latitude, lastPoint.longitude]);
            showMessage("Historique chargé avec succès","success");
            console.log("Historique chargé avec succès:", positionHistory.length, "points");
        }

    })
    .catch(error => {
        console.error('Erreur détaillée:', error);
        alert(`Erreur lors du chargement de l'historique: ${error.message}`);
    });
}

// Intervalles de mise à jour
clearAllMarkers();
updatePosition();
const updateInterval = setInterval(updatePosition, 3000);
const aisUpdateInterval = setInterval(updateAISData, 10000);

// Premier appel immédiat pour les données AIS
updateAISData();

// Événements de la carte
map.on('moveend zoomend', () => {
    const center = map.getCenter();
    updateInfo(`Zoom: ${map.getZoom()}<br>Position: ${center.lat.toFixed(5)}, ${center.lng.toFixed(5)}`);
});

// Nettoyage à la fermeture
window.onbeforeunload = function() {
    clearInterval(updateInterval);
    clearInterval(aisUpdateInterval);
};

function centerOnBoat() {
if (shipMarker) {
    const currentPosition = shipMarker.getLatLng();
    const currentZoom = map.getZoom();
    map.setView(currentPosition, currentZoom);}
}