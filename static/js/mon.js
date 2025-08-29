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
    alert('Veuillez entrer une valeur inférieur à 1440 minutes soit 24 heures');
    input.value = projectionHours * 60;  // Reconversion en minutes pour l'affichage
}
}

// Initialisation de l'affichage du temps de projection
document.addEventListener('DOMContentLoaded', function() {
document.getElementById('projectionTime').value = (projectionHours * 60).toFixed(0);
document.getElementById('projectionInfo').innerHTML =
    `Projection sur ${(projectionHours * 60).toFixed(0)} minutes`;
});

// Icône personnalisée pour votre bateau principal
const customIcon = L.divIcon({
    html: `<div class="ship-icon">

    </div>`,
    className: ''
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

// Fonction pour mettre à jour le marker
const updateShipMarker = (position, angle) => {

    // Normalisation de l'angle
    let normalizedAngle = ((angle % 360) + 360) % 360;

    // Détermine si l'image doit être inversée (quand l'angle est entre 0 et 180)
    const shouldFlip = normalizedAngle > 0 && normalizedAngle < 180;

    // Ajustement de l'angle pour l'orientation correcte de l'image
    const adjustedAngle = normalizedAngle - 270;

    const customIcon = L.divIcon({
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


    // Créer un nouveau marker
    shipMarker = L.marker(position, {
        icon: customIcon
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
icon: customIcon,
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

        // Limiter l'historique à 1000 points par exemple
        if (positionHistory.length > 1000) {
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
        if (shipMarker) {
            shipMarker.bindPopup(`
                <strong>HUAHINE</strong><br>
                Position: ${data.latitude.toFixed(5)}, ${data.longitude.toFixed(5)}<br>
                Cap: ${cog}°<br>
                Vitesse: ${speed.toFixed(1)} nœuds<br>
                Distance projetée: ${distanceInNauticalMiles.toFixed(1)} NM sur ${(projectionHours * 60).toFixed(0)} min
            `);
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
        map.setView(currentPosition, currentZoom);
    }
}