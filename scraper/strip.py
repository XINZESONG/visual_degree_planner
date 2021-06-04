from json import load, dump
from os import scandir

for entry in scandir("out"):
    with open(entry.path, "r") as f:
        data = load(f)

    for key in data:
        for row in data[key]["conditions"]:
            for i in range(len(row)):
                row[i] = row[i][0]

    with open("stripped/" + entry.name, "w") as f:
        dump(data, f, sort_keys=True, indent=4)

