from lxml import html
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.common.exceptions import TimeoutException
from collections import namedtuple, OrderedDict
from time import sleep
from os.path import isfile
import re
import json


recache = True
base_href = "http://timetable.unsw.edu.au/2021/"
driver = None
options = None

def setup():
    global driver
    global options

    if driver:
        driver.quit()

    options = Options()
    options.add_argument('headless')
    driver = webdriver.Chrome(options=options)


def scrape_timetable_list(url, pattern, fields):
    DT = namedtuple("DataTuple", fields + ["link"])
    cp = re.compile(pattern)
    page = html.parse(url).getroot()

    page.make_links_absolute(base_href) 

    lp = lambda e: e.getparent().getparent()
    elems = set({(lp(e), l) for e, _, l, _ in page.iterlinks() if cp.search(l)})

    tc = lambda e: [x.text_content() for x in e.find_class("data")]
    dt = lambda d: DT(*d)._asdict()
    data = {d[0]: dt(d[1:]) for d in (tc(e) + [l] for e, l in elems)}

    return data


def handbook_page(url):
    return _handbook_page(url, 1)

def _handbook_page(url, time):
    print("Scraping ", url)
    try:
        driver.get(url)
        WebDriverWait(driver, 5).until(lambda d: d.find_element_by_id("Fees"))
        return html.document_fromstring(driver.page_source)
    except TimeoutException:
        if "Page Not Found" in driver.page_source:
            print("Page not found, continuing...")
            return None

        print("Timed out, retrying in ", time, " seconds...")
        sleep(time)
        return _handbook_page(url, time * 2)


def handbook_url(tt_url):
    hb_re = re.compile(r"http:\/\/www\.handbook\.unsw\.edu\.au")
    undergrad_re = re.compile(r"http:\/\/www\.handbook\.unsw\.edu\.au\/undergraduate")

    try:
        tt_page = html.parse(tt_url).getroot()
    except:
        return handbook_url(tt_url)

    links = []
    for _, _, l, _ in tt_page.iterlinks():
        if hb_re.match(l):
            links.append(l)

    if len(links) == 0:
        raise ValueError("Could not find handbook link.")

    if len(set(links)) > 1:
        undergrad = [x for x in links if undergrad_re.match(x)]
        if len(undergrad) > 0:
            return undergrad[0]

    return links[0]



def scrape_handbook_page(tt_data):
    CourseTuple = namedtuple("CourseTuple", 
            ["name", "uoc", "equivalent", "excluded", "conditions", "faculty", 
                "school", "level", "terms", "campus", "handbook", "timetable"])

    name = tt_data["name"]
    uoc  = tt_data["uoc"]
    tt_url = tt_data["link"]

    url  = handbook_url(tt_url)
    page = handbook_page(url)

    if page == None:
        return None

    # search page for anchors
    equivalent = page.xpath("//div[@id='EquivalentCourses']")
    exclusion  = page.xpath("//div[@id='ExclusionCourses']")
    conditions = page.xpath("//div[@id='ConditionsforEnrolment']")
    attribute_table = page.xpath("//div[@data-testid='attributes-table']")[0]

    #extract data
    maybe = lambda x, y: x if not x else y(x)
    course_links = lambda x: maybe(x, lambda x: [l[-8:] for _, _, l, _ in x[0].iterlinks()])
    first_text = lambda x: maybe(x, lambda x: x[0].text_content())

    equivalent = course_links(equivalent)
    exclusion  = course_links(exclusion)
    conditions = first_text(conditions)

    attributes = OrderedDict({"Faculty": None, "School": None, 
        "Study Level": None, "Offering Terms": None, "Campus": None})
    for elem in attribute_table.getchildren():
        (head, body) = elem.getchildren()
        if head.text.strip() in attributes:
            attributes[head.text.strip()] = body.text_content()

    return CourseTuple(name, uoc, equivalent, exclusion, conditions, 
            *(attributes.values()), url, tt_url)._asdict()


if __name__ == '__main__':
    setup()

    areas = scrape_timetable_list(base_href + "subjectSearch.html",
            "[A-Z]{8}\.html", ["name", "offerer"])

    with open("subjectAreas.json", "w") as saf:
        json.dump(areas, saf, sort_keys=True, indent=4)

    print("Finished scraping subjectAreas.json")

    for area in areas:
        filename = area + ".json"
        if isfile(filename) and not recache:
            continue

        courses = scrape_timetable_list(areas[area]["link"], 
                "[A-Z]{4}[0-9]{4}\.html", ["name", "uoc"])

        course_data = {}

        for k, v in courses.items():
            course_data[k] = scrape_handbook_page(v)

        with open(filename, "w") as cdf:
            json.dump(course_data, cdf, sort_keys=True, indent=4)

        print("Finished scraping ", filename)

