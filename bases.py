import sqlite3

# Connexion à la base de données "Navionic"
conn_planette = sqlite3.connect('D:/Alain/cartes1.mbtiles')
cur_planette = conn_planette.cursor()

# Attacher la base de données OpenSeaMap
cur_planette.execute("ATTACH DATABASE 'E:/Alain/cartesN.mbtiles' AS seamap")

# Copie des tuiles de SeaMap (zoom 10-19) dans la base Navionic
cur_planette.execute("""
    INSERT OR REPLACE INTO tiles (zoom_level, tile_column, tile_row, tile_data)
    SELECT zoom_level, tile_column, tile_row, tile_data s
    FROM seamap.tiles
    WHERE zoom_level BETWEEN 10 AND 19
""")

# Validation des changements
conn_planette.commit()

# Détacher la base de données OpenSeaMap
cur_planette.execute("DETACH DATABASE seamap")

# Fermeture de la connexion
cur_planette.close()
conn_planette.close()