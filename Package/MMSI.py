class MMSI:
    def __init__(self):

        # Variables statiques partagées entre les instances
        self._nom_bateau_a = ""
        self._nom_bateau_b = ""
        self._indicatif_a = ""
        self._indicatif_b = ""
        self._destination_bateau_a = ""
        self._position_mmsi_a = 0
        self._donnees_mmsi_a = 0
        self._position_mmsi_b = 0
        self._donnees_mmsi_b = 0

        self._table = []  # Une table (liste) pour stocker les données

    def __existe_dans_table(self, mmsi):
        """
        Fonction privée pour vérifier si un MMSI existe dans la table.
        Renvoie l'élément correspondant ou None.
        """
        for item in self._table:
            if item["mmsi"] == mmsi:
                return item
        return None

    def mmsi_navires(self, navires_data):
        """
        Ajoute ou met à jour plusieurs navires à partir d'une liste de données
        """
        for navire in navires_data:
            mmsi = str(navire.get("mmsi"))
            if not mmsi:
                continue  # Ignorer les entrées sans MMSI

            bateau_existant = self.__existe_dans_table(mmsi)

            if bateau_existant:
                # Mise à jour des données du bateau existant
                for cle, valeur in navire.items():
                    bateau_existant[cle] = valeur
            else:
                # Création d'un nouveau bateau avec des valeurs par défaut
                nouveau_bateau = {
                    "mmsi": mmsi,
                    "name": navire.get("name", "Navire inconnu"),
                    "latitude": navire.get("latitude", 0.0),
                    "longitude": navire.get("longitude", 0.0),
                    "cog": navire.get("cog", 0),
                    "sog": navire.get("sog", 0.0),
                    "class": navire.get("class", "B")
                }
                self._table.append(nouveau_bateau)

    def get_all_ships(self):
        """
        Retourne tous les navires dans le format attendu
        """
        return self._table

    # Création des données
    #navires_data = [
    #   creer_navire("123456789", "BELLE BRISE", 43.3, 5.4, 90, 12.5, "B"),
    #    creer_navire("987654321", "GRAND BLEU", 43.25, 5.35, 180, 8.3, "A")
    #]

    # Appel de la méthode
    # mmsi_navires(navires_data)