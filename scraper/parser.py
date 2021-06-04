from json import load, dump, loads
from functools import reduce
from enum import Enum
import re


listify = lambda x: x if isinstance(x, list) else [x]
degroup = lambda x: None if x == None else x.groups()
maybe_first = lambda x: None if x == None else x[0]

def clean_whitespace(thing):
    if isinstance(thing, dict):
        for key, value in thing.items():
            thing[key] = clean_whitespace(value)
        return thing
    elif isinstance(thing, list):
        return [clean_whitespace(x) for x in thing]
    elif isinstance(thing, str):
        return thing.strip()
    elif isinstance(thing, int) or isinstance(thing, float) or thing == None:
        return thing
    else:
        raise ValueError(str(thing) + " not expected in JSON.")


def parse_terms(course_data):
    term_dict = {"Summer Term": 0, "Term 1": 1, "Term 2": 2, "Term 3": 3, 
            "Summer Canberra": 0}
    term_map = lambda x: term_dict[x.strip()]

    if course_data["terms"]:    
        term_list = course_data["terms"].split(",")
        course_data["terms"] = list(map(term_map, term_list))
    else:
        course_data["terms"] = []


def parse_uoc(course_data):
    course_data["uoc"] = int(course_data["uoc"])


def parse_opening(conditions):
    standard_opening = re.compile(r'Conditions for Enrolment(.*)')
    match = degroup(standard_opening.match(conditions))[0].strip()
    if match == None:
        raise ValueError("Unexpected opening pattern.")
    return match

class Token(object):
    EXCLUSION    = 0
    PREREQUISITE = 1
    COREQUISITE  = 2
    CODE         = 3
    OR           = 4
    AND          = 5
    CREDIT       = 6
    DISTINCTION  = 7
    OTHER        = 8
    L_PAREN      = 9
    R_PAREN      = 10

    tokens = (
        (re.compile(r"Exclusion:"), EXCLUSION),
        (re.compile(r"(Prerequisite|Pre-requisite):"), PREREQUISITE),
        (re.compile(r"Corequisite:"), COREQUISITE),
        (re.compile(r"[A-Z]{4}[0-9]{4}"), CODE),
        (re.compile(r"(or|OR)"), OR),
        (re.compile(r"(and|OR)"), AND),
        (re.compile(r"&"), AND),
        (re.compile(r"\(CR\)"), CREDIT),
        (re.compile(r"\(DN\)"), DISTINCTION),
        (re.compile(r"\d+? units of credit in Level 2 Math(ematics|s|) courses"), OTHER),
        (re.compile(r"\("), L_PAREN),
        (re.compile(r"\)"), R_PAREN),
    )

    def match(string):
        for token_re, category in Token.tokens:
            match = token_re.match(string)
            if match:
                return (match.group(), category)
        return None


class Chaff(object):
    chaff = (
        re.compile(r"\s+"), 
        re.compile(r"[,;.]"),
    )

    def match(string):
        for chaff_re in Chaff.chaff:
            match = chaff_re.match(string)
            if match:
                return match.group()
        return None


def tokenize(conditions):
    tokens = []
    while conditions:
        token_match = Token.match(conditions)
        chaff_match = Chaff.match(conditions)

        if token_match:
            idx = len(token_match[0])
            tokens.append(token_match)
        elif chaff_match:
            idx = len(chaff_match)
        else:
            return []

        conditions = conditions[idx:]

    return tokens

def flatten_and_clear(l):
    if isinstance(l, list):
        n = []
        for x in l:
            x = flatten_and_clear(x)
            if x:
                n + x
        return n
    else:
        return [l]

def parse_tokens(tokens, output):
    upper_list = None
    curr_list = None
    mode = None
    for string, category in tokens:
        if category == Token.EXCLUSION:
            upper_list = output['excluded']
            curr_list = []
            upper_list.append(curr_list)
        elif category == Token.PREREQUISITE:
            upper_list = output['prerequisite']
            curr_list = []
            upper_list.append(curr_list)
        elif category == Token.COREQUISITE:
            upper_list = output['corequisite']
            curr_list = []
            upper_list.append(curr_list)
        elif category == Token.CODE:
            curr_list.append([string, None])
        elif category == Token.AND:
            curr_list = []
            upper_list.append(curr_list)
        elif category == Token.CREDIT:
            curr_list[-1][-1] = 'CR'
        elif category == Token.DISTINCTION:
            curr_list[-1][-1] = 'DN'
        elif category == Token.OTHER:
            output['other'].append(string)

    output["excluded"] = flatten_and_clear(output["excluded"])


def get_custom(conditions, output):
    print(conditions)
    for key in output:
        while True:
            try:
                output[key] = loads(input(key + ': '))
                break
            except:
                continue

def parse_conditions(course_data):
    conditions = course_data["conditions"]
    output = {'corequisite': [], 'prerequisite': [], 'excluded': [], 'other': []}

    if conditions:
        conditions = parse_opening(conditions)
        tokens = tokenize(conditions)
        if tokens:
            try:
                parse_tokens(tokens, output)
            except:
                #print(conditions)
                get_custom(conditions, output)
        else:
            #print(conditions)
            get_custom(conditions, output)

    course_data["conditions"] = output['prerequisite']
    course_data["excluded"]   = list(set(course_data["excluded"]) | set(output["excluded"]))
    course_data["corequisite"] = output["corequisite"]
    course_data["other"] = output["other"]


with open("pre/subjectAreas.json", "r") as subject_area_file:
    subject_area_json = load(subject_area_file)

for area_code in subject_area_json.keys():
    if area_code != "PHYS":
        continue

    with open("pre/" + area_code + ".json", "r") as area_file:
        area_json = load(area_file)

    for course, course_data in area_json.items():
        try:
            clean_whitespace(course_data)
            parse_terms(course_data)
            parse_uoc(course_data)
            parse_conditions(course_data)
        except Exception as e:
            print(course)
            print(course_data)
            raise(e)

    with open("out/" + area_code + ".json", "w") as area_file:
        dump(area_json, area_file, sort_keys=True, indent=4)

