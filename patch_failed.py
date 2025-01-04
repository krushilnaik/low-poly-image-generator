import json
import os
import subprocess

import pymongo
import requests
from dotenv import load_dotenv

load_dotenv()

POKEGON_URL = "http://localhost:3030/generate"

if __name__ == "__main__":
    mongo = pymongo.MongoClient(os.getenv("MONGO_URI"))

    db = mongo["pokedex"]
    pokegonDB = db.get_collection("Pokegon")

    api = subprocess.Popen(["node", "./src/js/index.js"])

    failed_retries = []

    with open("failed.txt", "r") as failed:
        for pid in failed:
            search = {"id": pid.strip()}

            pokemon = pokegonDB.find_one(search)

            # pprint(pokemon)

            if pokemon and len(pokemon["paths"]) == 0:
                image_path = pokemon["image"][:-4]
                print(f"Re-attempting {image_path}")

                paths = requests.get(f"{POKEGON_URL}/{image_path}")
                paths = json.loads(paths.text)

                if len(paths) == 0:
                    failed_retries.append(pid.strip())

                print(f"{len(paths)} triangles")

                pokegonDB.update_one(search, {"$set": {"paths": paths}})

    with open("failed.txt", "w") as failed:
        failed.writelines(failed_retries)

    api.terminate()
