import {union} from "lodash";
import {addToMappedList, arrayIntersection} from "./GraphUtil";
import {
  NODE_APPROX_HEIGHT,
  NODE_APPROX_WIDTH,
  NODE_BASE_Y_COORD_SPACING,
  NODE_X_COORD_SPACING,
  SUBJECT_Y_COORD_SPACING
} from "./GraphConstants";
import {databaseInstance} from "../../config/firebaseConfig";

export function loadFromFirebase(subjectAreas, callback) {
  // console.log("[loadFromFirebase] Loading data...");
  databaseInstance.ref('/Subject Area V2').once('value').then(snapshot => {
    const rawData = snapshot.val();
    let data = {};
    if (rawData === null) {
      console.log("WARNING: Could not get data from firebase");
    } else {
      // console.log("[loadFromFirebase - THEN] val: ", rawData);

      for (const subject of subjectAreas) {
        if (subject in rawData && "courses" in rawData[subject]) {
          let courses = rawData[subject]["courses"];
          for (let course of courses) {
            // if (!("prereq" in course)) {
            //   course["prereq"] = [];
            // }
            if (!("conditions" in course)) {
              course["conditions"] = [];
            }
            if (!("corequisite" in course)) {
              course["corequisite"] = [];
            }
            if (!("equivalent" in course)) {
              course["equivalent"] = [];
            }
            if (!("excluded" in course)) {
              course["excluded"] = [];
            }
            if (!("other" in course)) {
              course["other"] = [];
            }
            if (!("terms" in course)) {
              course["terms"] = [];
            }
          }
          data[subject] = courses;
        } else {
          console.log("WARNING: subject '" + subject + "'/courses was not found in the database");
        }
      }
    }
    // console.log("OUTPUT data: ", data);
    callback(data);
  });
}

export function generateGraphElements(data) {
  // console.log("Generating...", data);

  const {graphNodes, maxCoords} = getGraphNodes(data);
  const allDataList = getFlatData(data);
  const graphEdges = getGraphEdges(allDataList);

  // Adjust the node type based on the final edges
  const edgeSources = graphEdges.map(x => x.source);
  const edgeTargets = graphEdges.map(x => x.target);
  for (let node of graphNodes) {
    let edgeIn = edgeTargets.includes(node.id);
    let edgeOut = edgeSources.includes(node.id);
    if (!edgeIn && !edgeOut) {
      node.type = "solo";
    } else if (!edgeIn) {
      node.type = "input";
    } else if (!edgeOut) {
      node.type = "output";
    }
    // else -> `default` is already the existing node type
  }

  const finalElems = graphNodes.concat(graphEdges);

  // console.log(graphNodes);
  return {
    elements: finalElems,
    nodeMaxCoords: maxCoords
  };
}

function getGraphNodes(data) {
  let graphNodes = [];

  let yCoordOffset = 0;
  let maxCoords = [];
  const subjectAreas = Object.keys(data).sort();
  for (const subjectArea of subjectAreas) {
    const subjectData = data[subjectArea];
    if (subjectData.length === 0) {
      continue;
    }
    const {nodes, maxYStart, maxXStart} = nodePositioningPerSubject(subjectData, yCoordOffset);
    maxCoords.push({
      subject: subjectArea,
      coords: {
        yStart: yCoordOffset,
        yTotal: maxYStart + NODE_APPROX_HEIGHT,
        maxX: maxXStart + NODE_APPROX_WIDTH
      }
    });
    graphNodes.push(...nodes);
    yCoordOffset += ((maxYStart + NODE_APPROX_HEIGHT) + SUBJECT_Y_COORD_SPACING);
  }

  // console.log("[getGraphNodes] maxCoords: ", maxCoords);
  return {
    graphNodes: graphNodes,
    maxCoords: maxCoords
  };
}

/**
 * Generate graph nodes for a particular subject area.
 *
 * The algorithm first partitions the courses in two stages:
 *   1. Partition the courses by level (e.g. COMP2121 is Level 2)
 *   2. Sub-partition each partition to remove vertical dependencies
 *      (i.e. a course's prerequisite cannot be in the same partition)
 *
 * The nodes are then created and arranged into columns for each partition, in order by level.
 * Vertically, nodes are distributed evenly within a column based on the max courses in all columns.
 *
 * @param data          the list of course data for that subject area
 * @param yCoordOffset  the vertical offset for that subject area
 * @returns {{nodes: [], maxYStart: number, maxXStart: number}}
 */
function nodePositioningPerSubject(data, yCoordOffset) {
  // Generate the initial partitioning by course level
  const coursesByLevel = partitionCoursesByLevel(data);

  // Generate the second partitioning for each level to avoid vertical dependencies
  let partitionedCourses = {}
  const sortedLevelKeys = Object.keys(coursesByLevel).sort((a, b) => { return a > b ? 1 : -1 });
  for (const levelKey of sortedLevelKeys) {
    const levelCourses = coursesByLevel[levelKey];
    partitionedCourses[levelKey] = partitionCoursesByDependencies(levelCourses);
  }

  // Flatten the partitioned courses while maintaining order
  let orderedPartitionedCourses = [];
  const sortedPartitionLevelKeys = Object.keys(partitionedCourses).sort((a, b) => { return a > b ? 1 : -1 });
  for (const partitionLevelKey of sortedPartitionLevelKeys) {
    const sortedPartitionKeys = Object.keys(partitionedCourses[partitionLevelKey]).sort((a, b) => { return a > b ? 1 : -1 });
    for (const partitionKey of sortedPartitionKeys) {
      orderedPartitionedCourses.push(partitionedCourses[partitionLevelKey][partitionKey]);
    }
  }

  return generateNodesFromPartition(orderedPartitionedCourses, yCoordOffset);
}

function partitionCoursesByLevel(data) {
  let coursesByLevel = {};
  for (let course of data) {
    const level = "L" + course.code.substring(4,5);
    if (level in coursesByLevel) {
      coursesByLevel[level].push(course);
    } else {
      coursesByLevel[level] = [course];
    }
  }

  return coursesByLevel;
}

function partitionCoursesByDependencies(levelCourses) {
  let partitionedCourses = {};
  let unallocatedCourses = [].concat(levelCourses);
  let partition = 0;
  let max_partition = 5 + Math.floor(Math.random() * Math.floor(4));
  do {
    const independentCourses = findIndependentCourses(unallocatedCourses);
    if (independentCourses.length > 0) {
      // Set a limit on the partition size - otherwise increment a partition
      partitionedCourses["P" + partition] = []
      for (const course of independentCourses) {
        // Add the course to the partition
        if (("P" + partition) in partitionedCourses) {
          partitionedCourses["P" + partition].push(course)
        } else {
          partitionedCourses["P" + partition] = [course]
        }

        // Check if we've exceeded max size
        // Note use slightly modified partition size
        if (partitionedCourses["P" + partition].length >= (max_partition)) {
          partition++;
          max_partition = 5 + Math.floor(Math.random() * Math.floor(4));
        }
      }
      unallocatedCourses = unallocatedCourses.filter(course => !independentCourses.includes(course));
      partition++;
    } else {
      // Something went wrong - can't find any independent courses
      break;
    }

  } while (unallocatedCourses.length > 0);

  return partitionedCourses;
}

function findIndependentCourses(courses) {
  return courses.filter(course => courseIntersection(allFlatPrereqs(course), courses).length === 0)
}

function courseIntersection(prereqCodeList, courseList) {
  return courseList.filter(course => prereqCodeList.includes(course.code));
}

function allFlatPrereqs(course) {
  return course.conditions.flat();
}

function generateNodesFromPartition(orderedPartitionedCourses, yCoordOffset) {
  // Calculate the max vertical spacing
  const maxPartitionSize = orderedPartitionedCourses.map(x => x.length).reduce((acc, curr) => Math.max(acc, curr), 0);
  const maxHeight = (maxPartitionSize - 1) * NODE_BASE_Y_COORD_SPACING;

  let nodes = [];
  let xCoord = 0;
  for (const partitionedCourses of orderedPartitionedCourses) {
    // const courses = partitionedCourses[partitionKey];

    // Calculate vertical spacing based on the number of nodes in the partition
    let yCoord;
    let nodeGapHeight;
    if (partitionedCourses.length === maxPartitionSize) {
      nodeGapHeight = NODE_BASE_Y_COORD_SPACING;
      yCoord = 0;
    } else {
      nodeGapHeight =  maxHeight / (partitionedCourses.length + 1);
      yCoord = nodeGapHeight;
    }

    // Generate the nodes for the Graph component
    for (const course of partitionedCourses) {
      const position = { x: xCoord, y: (yCoord + yCoordOffset) };
      nodes.push(createGraphNode(course, position));
      yCoord += nodeGapHeight;
    }

    xCoord += NODE_X_COORD_SPACING;
  }

  // console.log("Final nodes", nodes);

  return {
    "nodes": nodes,
    // return maxHeight for calculating subject offset
    "maxYStart": maxHeight,
    "maxXStart": ( xCoord > NODE_X_COORD_SPACING ? xCoord - NODE_X_COORD_SPACING : xCoord)
  };
}

function createGraphNode(course, position, type = "default") {
  return {
    // TODO: confirm that course code is a valid unique identifier
    id: course.code,
    position: position,
    data: {label: course.code},
    type: type,
    targetPosition: 'left',
    sourcePosition: 'right',
    ...(course.terms.length === 0) && {
      className: "course-unscheduled",
      selectable: false
    }
  }
}


//with new implementation, we require the nodes to be inserted into the graph already in order to create the edge components
//GraphEdge requires the json obj queried from the backend
//only does course prerequisites at the moment
function getGraphEdges(data) {
  var edges = [];
  var visited = [];
  //grab the node results from the api end point, add the end point here
  for (let course of data){
    var prereqList = [];
    if(visited.includes(course.code))
      continue;
    if(course.conditions.length <= 0)
      continue;
    for(const pcourses in course.conditions){
      for (var prereqs of course.conditions[pcourses]){
        if(prereqList.includes(prereqs))
          continue;
        if(idExists(prereqs, data)){
          const newEdge = createGraphEdge(prereqs, course.code);
          edges.push(newEdge);
          prereqList.push(prereqs);
        }
      }
    }
    visited.push(course.code);
  }
  // console.log(edges)
  return edges;
}

function createGraphEdge(source, target, type = "custom", animated = false, isHidden = true) {
  return {
    id: 'e' + source + '-' + target,
    source: source,
    target: target,
    type: type,
    animated: animated,
    arrowHeadType: 'arrowclosed',
    isHidden: isHidden
  }
}

function idExists(courseCode, data){
  for(let course of data){
    if(course.code === courseCode){
      //return course.id;
      return true;
    }
  }
  return false;
}

// //this is to change to unique_id look up in the future
// function idLookUp(courseCode, courseList, data){
//   var id = -1;
//   for(let course in data){
//     if(course.code === courseCode){
//       //return course.id;
//       return course.code
//     }
//   }
//   return id;
// }

export function getCourse(code, dataList) {
  return dataList.find(x => x.code === code);
}

/**
 * Filter the given list of courses to only those that exist in the graph.
 * This will filter out courses that are not under the current subject areas.
 * @param courseCodes     list of course codes to filter
 * @param dataList        list of currently selected subject areas (for loading data)
 * @returns {string[]}    a filtered list of course codes
 */
export function filterForGraph(courseCodes, dataList) {
  return courseCodes.filter(code => idExists(code, dataList));
}

/**
 * Find any existing selected courses that depend on the given courses.
 *
 * @param selectedCourses    the list of currently selected courses
 * @param targetCourseCodes  the list of courses to be checked for as prerequisite
 * @param dataList       the list of currently selected subject areas (used for loading data)
 * @returns {{}}             a mapping of selected courses to a list of prereq dependency lists
 *                           E.g. {COMP2511: [ ["COMP1531"], ["COMP2521", "COMP1927"] ]}
 */
export function findDependentSelectedCourses(selectedCourses, targetCourseCodes, dataList) {
  let dependents = {};
  for (const courseCode of selectedCourses) {
    const course = getCourse(courseCode, dataList);
    if (course === undefined) {
      continue;
    }
    for (const prereqList of course.conditions) {
      if (arrayIntersection(prereqList, targetCourseCodes).length > 0) {
        addToMappedList(dependents, course.code, prereqList)
      }
    }
  }
  return dependents;
}

/**
 * Find any existing selected courses that depend on any courses in the given subject area.
 *
 * @param selectedCourses    the list of currently selected courses
 * @param targetSubjectArea  the subject area for courses to be check for as prereqs
 * @param dataList           the list of currently selected subject areas (used for loading data)
 * @returns {{}}             a mapping of selected courses to a list of prereq dependency lists
 *                           E.g. {COMP2511: [ ["COMP1531"], ["COMP2521", "COMP1927"] ]}
 */
export function findDependentSelectedCoursesForSubjectArea(selectedCourses, targetSubjectArea, dataList) {
  let dependents = {};
  for (const courseCode of selectedCourses) {
    const course = getCourse(courseCode, dataList);
    if (course === undefined) {
      continue;
    }
    for (const prereqList of course.conditions) {
      if (prereqList.map(x => x.substring(0,4).includes(targetSubjectArea))) {
        addToMappedList(dependents, course.code, prereqList)
      }
    }
  }
  return dependents;
}

export function getExclusions(courseCode, dataList) {
  const course = getCourse(courseCode, dataList);
  if (course !== undefined) {
    return union(course.exclusion, course.equivalent);
  }
  return [];
}

/**
 * Convert the object map of courseCode: courses to a list of courses.
 * @param data   the data object from the database
 */
export function getFlatData(data) {
  if (data !== undefined) {
    return Object.values(data).flat();
  }
  return [];
}
