import pandas as pd
import numpy as np

data = pd.read_csv("./priceE85.csv", sep=';')

clean = data.dropna()

new_price = {}
# date look like that : 2024-01-03T08:35:20+01:00 i want to transform it to datetime
clean["prix_maj"] = pd.to_datetime(clean["prix_maj"], errors='coerce',utc=True)


clean["prix_valeur"] = pd.to_numeric(clean["prix_valeur"])
clean.to_csv("./priceE85-clean.csv")

E85 = clean[clean["prix_nom"] == "E85"]

#GPL = clean[clean["prix_nom"] == "GPLc"]

# do mean by month from all line
E85 = E85.groupby(pd.Grouper(key='prix_maj', freq='M')).mean()

#GPL.to_csv("./priceE85-clean-GPL.csv")
