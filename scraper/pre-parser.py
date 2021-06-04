from json import load, dump

def remove_adfa(subject_areas):
    adfa = set(["YCAN", "ZBUS", "ZEIT", "ZGEN", "ZHSS", "ZINT", "ZPEM", "ZZCA"])
    return {k:v for k, v in subject_areas.items() if k not in adfa}

def remove_empty_areas(subject_area):
    return {k:v for k, v in subject_area.items() if v != None}

def remove_postgrad(subject_area):
    return {k:v for k, v in subject_area.items() if v["level"].strip() == "Undergraduate"}

def empty_subject(area):
    for value in area.values():
        if value != None:
            return False
    return True

def remove_empty_subjects(sa, empty_areas):
    return {k:v for k, v in sa.items() if k not in empty_areas}

def main():
    with open("subjectAreas.json", "r") as saf:
        sa = load(saf)
    sa = remove_adfa(sa)

    empty_areas = set({})

    for area_code in sa:
        with open("raw/" + area_code + ".json", "r") as af:
            area = load(af)

        area = remove_empty_areas(area)
        area = remove_postgrad(area)

        if empty_subject(area):
            empty_areas.add(area_code)
        else:
            with open("pre/" + area_code + ".json", "w") as af:
                dump(area, af, sort_keys=True, indent=4)

    sa = remove_empty_subjects(sa, empty_areas)

    with open("pre/subjectAreas.json", "w") as saf:
        dump(sa, saf, sort_keys=True, indent=4)


if __name__ == "__main__":
    main()

