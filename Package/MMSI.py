class MMSI:
    def __init__(self,table):

        self._table = table  # Une table (liste) pour stocker les données

    def __existe_dans_table(self, mmsi):
        """
        Fonction privée pour vérifier si un MMSI existe dans la table.
        Renvoie l'élément correspondant ou None.
        """
        for item in self._table:
            if item["ais_mmsi"] == mmsi:
                return item
        return None

    def mmsi_navires(self, ais_mmsi=None, name=None, latitude=None, longitude=None, cog=None, sog=None, classe=None):
        """
        Ajoute ou met à jour un seul navire avec les données fournies.
        Ne met à jour que les champs qui ne sont pas None.
        """
        if ais_mmsi is None:
            return

        mmsi = str(ais_mmsi)
        bateau_existant = self.__existe_dans_table(mmsi)

        if bateau_existant:
            # Mise à jour uniquement des données non None
            nouveau_dict = {}
            if name is not None:
                nouveau_dict["name"] = name
            if latitude is not None:
                nouveau_dict["latitude"] = latitude
            if longitude is not None:
                nouveau_dict["longitude"] = longitude
            if cog is not None:
                nouveau_dict["cog"] = cog
            if sog is not None:
                nouveau_dict["sog"] = sog
            if classe is not None:
                nouveau_dict["classe"] = classe

            # Met à jour uniquement les champs présents
            bateau_existant.update(nouveau_dict)
        else:
            # Création d'un nouveau bateau
            nouveau_bateau = {
                "ais_mmsi": mmsi,
                "name": name,
                "latitude": latitude,
                "longitude": longitude,
                "cog": cog,
                "sog": sog,
                "classe": classe
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