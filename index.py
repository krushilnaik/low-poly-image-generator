import json
import os
import re
import subprocess
import time
from pprint import pprint

import pymongo
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

from evo import get_chains
from helpers import decimal, get_text, minify

START_POKEMON = "arceus"

BASE_URL = "https://pokemondb.net/pokedex"
POKEGON_URL = "http://localhost:3030/generate"


current_pokemon = START_POKEMON

keep_running = True

if __name__ == "__main__":
    start_time = time.time()

    # load environment variables
    load_dotenv()

    # start low poly generator
    api = subprocess.Popen(["node", "./src/js/index.js"])

    try:
        mongo = pymongo.MongoClient(os.getenv("MONGO_URI"))
        print("Connected to database")

        db = mongo["pokedex"]
        pokegonDB = db.get_collection("Pokegon")

        if str(START_POKEMON) == "bulbasaur":
            open("failed.txt", "w+").close()
            print(f"Clearing collection '{pokegonDB.name}'")
            pokegonDB.delete_many({})
        else:
            page = requests.get(f"{BASE_URL}/{current_pokemon}")
            soup = BeautifulSoup(page.content, "html.parser")
            name = get_text(soup, "h1")
            print(f"Resetting {name}")
            pokegonDB.delete_many({"name": name})

        while keep_running:
            print()
            print(f"Processing {current_pokemon}")

            page = requests.get(f"{BASE_URL}/{current_pokemon}")
            soup = BeautifulSoup(page.content, "html.parser")

            tabs = soup.select("#main > div.tabset-basics.sv-tabs-wrapper > div.sv-tabs-tab-list .sv-tabs-tab")
            num_forms = len(tabs)
            print(f"found {num_forms} form(s)")

            for x in range(num_forms):
                tab = tabs[x].attrs["href"]

                name = get_text(soup, "h1")

                suffix = tabs[x].text.replace(name, "").replace(" ", "")

                # grab data from page
                form = re.sub(r"\s+", " ", tabs[x].text.replace(name, " ")).strip()
                forms = [x.text.replace(name, "").replace(" ", "") for x in tabs]
                number = get_text(soup, f"{tab} .vitals-table tr:nth-child(1) td")
                types = soup.select(f"{tab} .vitals-table tr:nth-child(2) td a")
                species = get_text(soup, f"{tab} .vitals-table tr:nth-child(3) td")
                height = get_text(soup, f"{tab} .vitals-table tr:nth-child(4) td")
                weight = get_text(soup, f"{tab} .vitals-table tr:nth-child(5) td")
                # description = get_text(soup, "#main > div:nth-child(14) > table > tbody > tr:last-child > td")

                # skip partner pokemon
                if form == "Partner":
                    continue

                # cleanup
                form = form or "Base"
                forms = [f"{number}-{x}" if x else number for x in forms if x != "Partner"]
                types = [t.text for t in types]
                pid = number if not suffix else f"{number}-{suffix}"
                species = species.replace("Pokémon", "").strip()
                height = float(re.split(r"\s", height)[0])
                weight = float(re.split(r"\s", weight)[0].replace("—", "0"))

                multipliers = soup.select(f"{tab} .active .type-table td")
                if len(multipliers) == 0:
                    multipliers = soup.select(f"{tab} .type-table td")

                effectivenesses = [
                    {
                        "type": (y := str(x.attrs["title"]))[: y.index(" ")],
                        "multiplier": decimal(x.text or "1"),
                    }
                    for x in multipliers
                ]

                print("Building evolution tree")

                # get evolution chain
                evo_charts = get_chains(soup.select("#main > .infocard-list-evo"))

                evolutions = []

                for y in evo_charts.values():
                    evolutions += [c for c in y if pid in c["chain"]]

                image_file = number if (i := forms.index(pid)) == 0 else f"{number}-{i}"
                print(f"Generating pokegon paths from {image_file}.png")
                retries = 0
                paths = []

                while len(paths) == 0 and retries < 5:
                    paths = requests.get(f"{POKEGON_URL}/{image_file}")
                    paths = json.loads(paths.text)
                    retries += 1

                if len(paths) == 0:
                    with open("failed.txt", "a+", encoding="utf-8") as failed:
                        failed.write(pid + "\n")

                print()

                print(f"======= {name} ({form}) =======")
                print("number:", number)
                print("id:", pid)
                print("species:", species)
                print("height:", height)
                print("weight:", weight)
                print("types:", types)
                print("forms:", forms)
                print("paths:", f"{len(paths)} triangles")
                print("search:", minify(f"{form if form != 'Base' else ''} {name}"))
                print("evolution chains:")
                # pprint(effectivenesses)
                pprint(evolutions)

                pokegonDB.insert_one(
                    {
                        "name": name,
                        "id": pid,
                        "image": f"{image_file}.png",
                        "variant": form,
                        "species": species,
                        "height": height,
                        "weight": weight,
                        "types": types,
                        "paths": paths,
                        "forms": forms,
                        "evolutions": evolutions,
                        "effectivenesses": effectivenesses,
                        "search": minify(f"{form if form != 'Base' else ''} {name}"),
                    }
                )

            next_pokemon = soup.select_one('a[rel="next"]')
            if next_pokemon:
                current_pokemon = next_pokemon.attrs["href"].split("/")[-1]
            else:
                print()
                print("Finished processing")
                keep_running = False
    finally:
        # stop low poly generator
        api.terminate()

        end_time = time.time()

        print(f"Script took {(end_time - start_time) / 60:.02f} minute(s)")
