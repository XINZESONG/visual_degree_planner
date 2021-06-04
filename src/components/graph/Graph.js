import React from 'react';
import ReactFlow, {isEdge, isNode, ReactFlowProvider} from 'react-flow-renderer';
import {cloneDeep, difference, union, uniq} from "lodash";
import {connect} from 'react-redux';
import {assignSelection, assignTemplate, assignFilter, assignRawData} from "../../redux/actions"
import {notification} from "antd";
import 'antd/dist/antd.css';
import {databaseInstance} from "../../config/firebaseConfig";
import {NODE_APPROX_HEIGHT, NODE_APPROX_WIDTH} from "./GraphConstants";
import {
  filterForGraph,
  findDependentSelectedCourses,
  findDependentSelectedCoursesForSubjectArea,
  generateGraphElements,
  getCourse,
  getExclusions,
  getFlatData,
  loadFromFirebase
} from './GraphData';
import {
  addToMappedList,
  appendCSSClass,
  arrayIntersection,
  arrayRemoveShallow,
  arraysAreEqual,
  hasCSSClass,
  removeCSSClass
} from "./GraphUtil";
import GraphProvider from "./GraphProvider";
import CustomBackground from "./CustomBackground";
import CustomControls, {ControlViewsEnum} from "./CustomControls";
import CustomEdge from "./CustomEdge";
import Legend from "./Legend";
import DefaultNode from "./nodes/DefaultNode";
import InputNode from "./nodes/InputNode";
import OutputNode from "./nodes/OutputNode";
import SoloNode from "./nodes/SoloNode";
import './Graph.css';
import GraphSearch from "./GraphSearch";

const DEBUG_OUTPUT = false;
// export let selected=[];
// export let selectedSubjects=[];

export class Graph extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      graphData: {},
      graphElements: [],
      nodeMaxCoords: {},
      selectedCourses: [],
      forkedDependencies: {},
      forceProviderSelectionUpdate: false,
      stickyHighlights: false,
      showLegend: false,
      showGraphSearch: false
    };
  }

  setGraphState = (newState) => {
    // console.log("[setGraphState] newState: ", newState);
    this.setState(newState);
    if ('selectedCourses' in newState) {
      this.props.assignSelection(newState.selectedCourses);
    }
    if ('graphData' in newState) {
      this.props.assignRawData(newState.graphData);
    }
  }

  /**
   * Interface to GraphData function calls which require passing subject areas to load data.
   */
  dataFilterForGraph = (courseCodes) => filterForGraph(courseCodes, getFlatData(this.state.graphData));
  dataFindDependentSelectedCourses = (selectedCourses, targetCourseCodes) => findDependentSelectedCourses(selectedCourses, targetCourseCodes, getFlatData(this.state.graphData));
  dataFindDependentSelectedCoursesForSubjectArea = (selectedCourses, targetSubjectArea) => findDependentSelectedCoursesForSubjectArea(selectedCourses, targetSubjectArea, getFlatData(this.state.graphData));
  dataGetCourse = (code) => getCourse(code, getFlatData(this.state.graphData));
  dataGetExclusions = (courseCode) => getExclusions(courseCode, getFlatData(this.state.graphData));


  componentDidUpdate(prevProps, prevState, snapshot) {
    if (DEBUG_OUTPUT) console.log("componentDidUpdate...");
    if (prevProps.selectedSubjects !== this.props.selectedSubjects) {
      loadFromFirebase(this.props.selectedSubjects, (data) => this.handleChangedSubjectAreas(prevProps, data));
    }
    if(this.props.template.template.template==true){
      //this.props.assignFilter(this.props.area.area.area);
      this.restoreSelectedCourses(this.props.subject.subject.subject);
      //this.props.assignSelection(this.props.subject.subject.subject);
      this.props.assignTemplate(false);
      //assign subjectAreas to filter list
    }
    
  }

  handleChangedSubjectAreas(prevProps, data) {
    if (DEBUG_OUTPUT) console.log("[handleChangedSubjectAreas] Different props: ", prevProps.selectedSubjects, " vs ", this.props.selectedSubjects);

    // Generate the graph with the new subject areas
    const {elements, nodeMaxCoords} = generateGraphElements(data);

    // Updated selectedCourses and forkedDependencies based on the new data
    let newSelected;
    let newForked;
    let forceProviderSelectionUpdate;

    // Remove any subject areas from selectedCourses and forkedDependencies
    const removedSubjects = prevProps.selectedSubjects.filter(x => !this.props.selectedSubjects.includes(x));
    const removedSelected = this.state.selectedCourses.filter(courseCode => removedSubjects.includes(courseCode.substring(0,4)));
    if (DEBUG_OUTPUT) console.log("[handleChangedSubjectAreas] Removed subjects: ", removedSubjects, " Removed selected: ", removedSelected);
    if (removedSelected.length > 0) {
      ({ selectedCourses: newSelected, forkedDependencies: newForked, forceProviderSelectionUpdate } = this.removeSelectedCourses(removedSelected));
    }

    // Update forkedDependencies to account for any new courses (potential prereqs)
    const addedSubjects = this.props.selectedSubjects.filter(x => !prevProps.selectedSubjects.includes(x));
    if (DEBUG_OUTPUT) console.log("[handleChangedSubjectAreas] Added subjects: ", addedSubjects);
    if (addedSubjects.length > 0) {
      let updatedForkedDeps = cloneDeep(this.state.forkedDependencies);
      for (const addedSubject of addedSubjects) {
        const dependents = this.dataFindDependentSelectedCoursesForSubjectArea(this.state.selectedCourses, addedSubject);
        this.deepMergeIntoForkedDependencies(updatedForkedDeps, dependents);
        this.pruneForkedDependencies(updatedForkedDeps, this.state.selectedCourses);
      }
      newForked = updatedForkedDeps;
    }

    this.updateCSSExcludedCourses(elements, (newSelected !== undefined ? newSelected : this.state.selectedCourses));
    this.updateCSSForkedCourses(elements, (newForked !== undefined ? newForked : this.state.forkedDependencies));
    this.updateAnimatedEdges(elements,
      (newSelected !== undefined ? newSelected : this.state.selectedCourses),
      (newForked !== undefined ? newForked : this.state.forkedDependencies));

    this.setGraphState({
      graphData: data,
      graphElements: elements,
      nodeMaxCoords: nodeMaxCoords,
      ...(newSelected !== undefined) && { selectedCourses: newSelected },
      ...(newForked !== undefined) && { forkedDependencies: newForked },
      ...(forceProviderSelectionUpdate !== undefined) && { forceProviderSelectionUpdate: forceProviderSelectionUpdate }
    });
  }

  /**
   * Handle selection changes from the graph.
   * @param elements    list of selected react-flow elements
   *
   * Selection changes happen from three places:
   *   1) Selection weirdness during initial render (set to null and empty and stuff)
   *   2) User clicks on a node
   *   3) 'Loopback' from manually updating the selection in GraphProvider (thus selectionChange)
   * We want to try and ignore any 'loopbacks' and only update on user clicks
   *
   * There are three situations currently handled:
   *   1) elements is null or empty
   *       - This usually indicates that the user has clicked off the graph, emptying the selection
   *       - Action: reset the selection back to the current state.selectedCourses
   *   2) elements = 1
   *       - This should only occur through user selection
   *       - Action: check if element is already selected and add/remove accordingly
   *       - NOTE: if users can manually select multiple courses then this logic will be broken
   *   3) forceProviderSelectionUpdate is true
   *       - forceProviderSelectionUpdate = true will always update in GraphProvider and thus always trigger loopback
   *       - Action: catch the loopback and reset forceProviderSelectionUpdate
   *       - This is for GraphProvider to actually trigger on single element arrays
   *       - and to catch/ignore the loopback of a single element so it doesn't look like a user click
   */
  onSelectionChange(elements) {
    if (DEBUG_OUTPUT) console.log("[Graph] On Selection change: ", elements);

    // If forceProviderSelectionUpdate is true then setSelected will always be called
    // and so there will always be a loopback onSelectionChange()
    if (this.state.forceProviderSelectionUpdate) {
      if (DEBUG_OUTPUT) console.log("[Graph] Resetting forceProviderSelectionUpdate...");
      this.setGraphState({
        forceProviderSelectionUpdate: false
      })
    } else if (elements === null || elements.length === 0) {
      // Disable deselecting all elements by clicking off the graph
      // If selection is null/empty reset selection to stored selected courses
      this.setGraphState({
        selectedCourses: [...this.state.selectedCourses],  // new array (shallow copy) so useEffect activates
        forceProviderSelectionUpdate: true  // force so 1 selection isn't skipped
      });
    } else if (elements.length === 1) {
      // User selection of single node
      // Note: deselection down to 1 loopback is covered earlier and selection up to 1 does not loopback
      // TODO: Check that multiple selection on the graph isn't possible
      const selectedCourse = elements[0].id;
      let newGraphElements = cloneDeep(this.state.graphElements);
      let selectedCourses;
      let forkedDependencies;
      let forceProviderSelectionUpdate = false;

      if (this.state.selectedCourses.includes(selectedCourse)) {
        // Deselect the selected course
        ({ selectedCourses, forkedDependencies, forceProviderSelectionUpdate } = this.handleCourseDeselection(selectedCourse));
      } else {
        // Add the selected course
        ({ selectedCourses, forkedDependencies } = this.handleNewCourseSelection(selectedCourse));
      }

      this.updateCSSExcludedCourses(newGraphElements, selectedCourses);
      this.updateCSSForkedCourses(newGraphElements, forkedDependencies);
      this.updateAnimatedEdges(newGraphElements, selectedCourses, forkedDependencies);
      this.removeAllCSSHighlights(newGraphElements);

      this.setGraphState({
        graphElements: newGraphElements,
        selectedCourses: selectedCourses,
        forkedDependencies: forkedDependencies,
        forceProviderSelectionUpdate: forceProviderSelectionUpdate
      });
      if (DEBUG_OUTPUT) console.log("[onSelectionChange] FINAL Elements: ", newGraphElements);
      if (DEBUG_OUTPUT) console.log("[onSelectionChange] FINAL Selected: ", selectedCourses);
      if (DEBUG_OUTPUT) console.log("[onSelectionChange] FINAL Forked: ", forkedDependencies);
    }
  }

  updateCSSExcludedCourses(newGraphElems, newSelected) {
    const exclusions = this.getSelectedExclusionsFlat(newSelected);
    // Filter out cases where exclusions are self-referential (e.g. MATH2801 excludes itself)
    // Also should handle where exclusions are one way (e.g. selecting a course that excludes a selected
    // (possible because one-way exclusion), both are now selected so should be unselectable)
    const filteredExclusions = difference(exclusions, newSelected);
    if (DEBUG_OUTPUT) console.log("[updateCSSExcludedCourses] filteredExclusions: ", filteredExclusions);
    newGraphElems.filter(x => isNode(x)).forEach(elem => {
      if (filteredExclusions.includes(elem.id)) {
        elem.className = appendCSSClass(elem.className, "course-exclusion")
        elem.selectable = false;
      } else {
        elem.className = removeCSSClass(elem.className, "course-exclusion")
        if (!hasCSSClass(elem.className, "course-unscheduled")) {
          elem.selectable = true;
        }
      }
    });
  }

  getSelectedExclusions(selectedCourses = this.state.selectedCourses) {
    return selectedCourses.reduce((exclusions, course) => ({
      ...exclusions,
      [course]: this.dataGetExclusions(course)
    }), {});
  }

  getSelectedExclusionsFlat(selectedCourses = this.state.selectedCourses) {
    const exclusions = this.getSelectedExclusions(selectedCourses);
    return uniq(Object.values(exclusions).flat());
  }

  getUnscheduledCourses() {
    return this.state.graphElements
      .filter(elem => isNode(elem) && hasCSSClass(elem.className, "course-unscheduled"))
      .map(elem => elem.id);
  }

  updateCSSForkedCourses(newGraphElements, forkedDependencies) {
    if (DEBUG_OUTPUT) console.log("[updateForkedCourses] forkedDependencies: ", forkedDependencies);

    // Reset all fork CSS classes
    newGraphElements.filter(elem => isNode(elem)).forEach(elem => elem.className = removeCSSClass(elem.className, /course-fork(-\d+)?/));

    let forkedDepsList = Object.values(forkedDependencies).flat();
    if (DEBUG_OUTPUT) console.log("[updateForkedCourses] forkedDepsList: ", forkedDepsList);
    // TODO: What if course is a dependency of multiple courses? - CSS classes will override each other
    for (let i = 0; i < forkedDepsList.length; i++) {
      // TODO: Maybe want to filter out non-rendered nodes here, save on some i uses
      for (const courseCode of forkedDepsList[i]) {
        const elem = newGraphElements.find(x => x.id === courseCode);
        if (elem !== undefined) {
          elem.className = appendCSSClass(elem.className, "course-fork" + (i > 8 ? "" : "-"+i));  // Limit .course-fork-[0-8]
        }
      }
    }
    // if (DEBUG_OUTPUT) console.log("[GraphProvider] Updated node classes: ", newGraphElements);
  }

  /**
   * Update all the edges based on the new selected courses and forked dependencies
   * Edges that link to selected or forked courses are set as animated and unhidden
   * @param newGraphElements    the set of elements with edges to modify
   * @param selectedCourses     the current list of selected courses
   * @param forkedDependencies  the current list of forked dependencies
   */
  updateAnimatedEdges(newGraphElements, selectedCourses, forkedDependencies) {
    const edges = newGraphElements.filter(x => isEdge(x));
    for (const edge of edges) {
      const highlightEdge = ((selectedCourses.includes(edge.source) && selectedCourses.includes(edge.target))
        || (edge.target in forkedDependencies
          && forkedDependencies[edge.target].flat().includes(edge.source)));
      edge.animated = highlightEdge;
      edge.isHidden = !highlightEdge;
    }
    // if (DEBUG_OUTPUT) console.log("[updateAnimatedEdges] updated new elements: ", newGraphElements);
  }

  updateAnimatedEdgesIgnoreHidden(newGraphElements, selectedCourses, forkedDependencies) {
    const edges = newGraphElements.filter(x => isEdge(x)).forEach(edge => {
      edge.animated = ((selectedCourses.includes(edge.source) && selectedCourses.includes(edge.target))
        || (edge.target in forkedDependencies
          && forkedDependencies[edge.target].flat().includes(edge.source)));
    });
  }

  handleCourseDeselection(selectedCourse) {
    return this.removeSelectedCourses([selectedCourse]);
  }

  removeSelectedCourses(removeCourses) {
    // Step 1 - remove from selectedCourses
    const newCourses = this.state.selectedCourses.filter(x => !removeCourses.includes(x));
    let newForkedDependencies = cloneDeep(this.state.forkedDependencies);
    // Step 2 - remove from forkedCourses
    for (const course of removeCourses) {
      if (course in newForkedDependencies) {
        delete newForkedDependencies[course];
      }
    }
    // Step 3 - find any new forked courses to be added (where removed are prereqs)
    const dependents = this.dataFindDependentSelectedCourses(newCourses, removeCourses);
    if (DEBUG_OUTPUT) console.log("[removeSelectedCourses] Dependents: ", dependents);
    this.deepMergeIntoForkedDependencies(newForkedDependencies, dependents);
    // Step 4 - prune in case any new forks are already satisfied
    this.pruneForkedDependencies(newForkedDependencies, newCourses);
    if (DEBUG_OUTPUT) console.log("[removeSelectedCourses] newForked: ", newForkedDependencies);
    return {
      selectedCourses: newCourses,
      forkedDependencies: newForkedDependencies,
      forceProviderSelectionUpdate: true  // force updating even if only left with one element
    };
  }

  deepMergeIntoForkedDependencies(existingDeps, newDeps) {
    for (const course of Object.keys(newDeps)) {
      if (course in existingDeps) {
        this.mergeForkedDepsPrereqs(existingDeps[course], newDeps[course]);
      } else {
        existingDeps[course] = newDeps[course];
      }
    }
  }

  mergeForkedDepsPrereqs(existingPrereqs, newPrereqs) {
    for (const prereqList of newPrereqs) {
      let foundMatch = false;
      for (const pList of existingPrereqs) {
        if (arraysAreEqual(prereqList, pList)) {
          foundMatch = true;
          break;
        }
      }
      if (!foundMatch) {
        existingPrereqs.push(prereqList);
      }
    }
  }

  handleNewCourseSelection(selectedCourse) {
    const {selected, forkedDependencies} = this.getSelectedDependencies([selectedCourse]);
    const allSelected = union(this.state.selectedCourses, selected);
    let allForkedDependencies = cloneDeep(this.state.forkedDependencies);
    this.simpleMergeForkedDependencies(allForkedDependencies, forkedDependencies);
    this.pruneForkedDependencies(allForkedDependencies, allSelected);
    return {
      selectedCourses: allSelected,
      forkedDependencies: allForkedDependencies
    };
  }

  getSelectedDependencies(selectedCourses) {
    let selected = []
    let exclusions = this.getSelectedExclusionsFlat();
    const allUnscheduled = this.getUnscheduledCourses();
    let unvisited = [...selectedCourses];
    if (DEBUG_OUTPUT) console.log("[getSelectedDependencies] unvisited: ", unvisited);
    let currCourseCode;
    let forkedDependencies = {};
    let COUNTER = 0;
    while (unvisited.length > 0 && COUNTER < 100) {
      currCourseCode = unvisited[0];
      const course = this.dataGetCourse(currCourseCode)
      // if (DEBUG_OUTPUT) console.log(course);
      if (course !== undefined) {
        selected.push(currCourseCode);
        // TODO: Merge this after debugging
        const newExclusions = this.dataGetExclusions(currCourseCode);
        exclusions = union(exclusions, newExclusions);
        const prereqs = course.conditions;
        for (const prereqList of prereqs) {
          // Filter out non-existent nodes
          const graphExistingNodes = this.dataFilterForGraph(prereqList);
          // Filter out exclusions + unscheduled courses
          let filteredPrereqs = difference(graphExistingNodes, exclusions, allUnscheduled);
          if (arrayIntersection(filteredPrereqs, selectedCourses) > 0 || filteredPrereqs.length === 1) {
            // Already exists in selection; or
            // AND course -> safe to add
            unvisited = unvisited.concat(filteredPrereqs);
          } else {
            // if length > 1 -> OR course, stop processing this path
            // if length = 0 -> All dependencies are not nodes in the current graph (probably other subject areas)
            addToMappedList(forkedDependencies, currCourseCode, prereqList);
          }
        }
      }
      unvisited = arrayRemoveShallow(unvisited, currCourseCode);
      if (DEBUG_OUTPUT) console.log("[getSelectedDependencies] unvisited: ", unvisited);
      COUNTER++;
    }
    if (COUNTER === 100) {
      if (DEBUG_OUTPUT) console.log("[getSelectedDependencies] COUNTER === 100!!!");
    }
    if (DEBUG_OUTPUT) console.log("[getSelectedDependencies] courses: ", selectedCourses);
    if (DEBUG_OUTPUT) console.log("[getSelectedDependencies] selectedCourses: ", selected);
    if (DEBUG_OUTPUT) console.log("[getSelectedDependencies] forkedDependencies: ", forkedDependencies);
    return {
      selected: selected,
      forkedDependencies: forkedDependencies
    }
  }

  simpleMergeForkedDependencies(existingDeps, newDeps) {
    // Simplistic merge -> only add new keys
    // If a key already exists in the dependencies, then either it will have
    // all the prereqs (that are in newDeps), or it will have been pruned by user selections
    // in which case the new dependencies will also presumably be pruned by selectedCourses
    return Object.keys(newDeps).filter(key => !(key in existingDeps)).forEach(x => existingDeps[x] = newDeps[x]);
  }

  /**
   * Remove any forked dependencies that are already satisfied
   * by existing selected courses (including the newly added course).
   */
  pruneForkedDependencies(forkedDeps, selectedCourses) {
    for (const courseCode of Object.keys(forkedDeps)) {
      const newPrereqs = forkedDeps[courseCode].filter(prereqList => arrayIntersection(prereqList, selectedCourses).length === 0);
      if (newPrereqs.length === 0) {
        delete forkedDeps[courseCode];
      } else {
        forkedDeps[courseCode] = newPrereqs;
      }
    }
  }

  clearSelectedCourses = () => {
    let newGraphElements = cloneDeep(this.state.graphElements);
    let newForkedDependencies = {};
    let newSelectedCourses = [];
    this.updateCSSExcludedCourses(newGraphElements, newSelectedCourses);
    this.updateCSSForkedCourses(newGraphElements, newForkedDependencies);
    this.updateAnimatedEdges(newGraphElements, newSelectedCourses, newForkedDependencies);
    this.removeAllCSSHighlights(newGraphElements);
    this.setGraphState({
      graphElements: newGraphElements,
      selectedCourses: newSelectedCourses,
      forkedDependencies: newForkedDependencies,
      forceProviderSelectionUpdate: true
    });
  }

  restoreSelectedCourses = (selected) => {
    let {selected: newSelected, forkedDependencies} = this.getSelectedDependencies(selected);
    newSelected = uniq(newSelected);
    this.pruneForkedDependencies(forkedDependencies, newSelected);

    let newGraphElements = cloneDeep(this.state.graphElements);
    this.updateCSSExcludedCourses(newGraphElements, newSelected);
    this.updateCSSForkedCourses(newGraphElements, forkedDependencies);
    this.updateAnimatedEdges(newGraphElements, newSelected, forkedDependencies);
    this.removeAllCSSHighlights(newGraphElements);

    this.setGraphState({
      graphElements: newGraphElements,
      selectedCourses: newSelected,
      forkedDependencies: forkedDependencies,
      forceProviderSelectionUpdate: true
    });
  }

  onNodeMouseEnter = (event, node) => {
    if (DEBUG_OUTPUT) console.log("[onNodeMouseEnter] Event: ", event, " Node: ", node);
    const newElems = cloneDeep(this.state.graphElements);
    // Clear existing highlights
    this.updateAnimatedEdges(newElems, this.state.selectedCourses, this.state.forkedDependencies);
    this.removeAllCSSHighlights(newElems);
    // Add new highlights
    this.highlightLinkedCourses(newElems, node.id);
    this.setGraphState({
      graphElements: newElems
    });
  }

  highlightLinkedCourses(elements, courseCode) {
    let nodesToHighlight = [courseCode];
    // Show the linked edges
    elements.filter(x => isEdge(x)).forEach(edge => {
      if (edge.source === courseCode) {
        nodesToHighlight.push(edge.target);
        edge.isHidden = false;
        edge.animated = false;
      } else if (edge.target === courseCode) {
        nodesToHighlight.push(edge.source);
        edge.isHidden = false;
        edge.animated = false;
      }
    });

    if (DEBUG_OUTPUT) console.log("[highlightLinkedCourses] nodesToHighlight: ", nodesToHighlight);

    // Highlight the linked nodes
    elements.filter(x => isNode(x) && nodesToHighlight.includes(x.id)).forEach(node => {
      node.className = appendCSSClass(node.className, "node-highlight");
    });

    if (DEBUG_OUTPUT) console.log("[highlightLinkedCourses] elements: ", elements);
  }

  onNodeMouseLeave = (event, node) => {
    if (DEBUG_OUTPUT) console.log("[onNodeMouseLeave] Event: ", event, " Node: ", node);
    if (this.state.stickyHighlights) {
      this.resetAnimatedLinkedEdges();
    } else {
      this.clearLinkedCourses();
    }
  }

  /**
   * Set highlighted edges (solid) back to being animated.
   */
  resetAnimatedLinkedEdges() {
    const newElems = cloneDeep(this.state.graphElements);
    this.updateAnimatedEdgesIgnoreHidden(newElems, this.state.selectedCourses, this.state.forkedDependencies);
    this.setGraphState({
      graphElements: newElems
    });
  }

  /**
   * Remove all highlights from nodes and hide edges.
   */
  clearLinkedCourses() {
    const newElems = cloneDeep(this.state.graphElements);
    this.updateAnimatedEdges(newElems, this.state.selectedCourses, this.state.forkedDependencies);
    this.removeAllCSSHighlights(newElems);
    this.setGraphState({
      graphElements: newElems
    });
  }

  /**
   * Remove mouse-over highlighted courses.
   * @param elements  the set of elements to modify
   */
  removeAllCSSHighlights(elements) {
    elements.filter(x => isNode(x)).forEach(node => {
      node.className = removeCSSClass(node.className, "node-highlight");
    });
  }

  toggleStickyHighlights = () => {
    let newSticky = !this.state.stickyHighlights;
    if (!newSticky) {
      this.clearLinkedCourses();
    }
    this.setGraphState({
      stickyHighlights: newSticky
    });
  }

  toggleControlViews(viewType) {
    if (viewType === ControlViewsEnum.LEGEND) {
      this.setGraphState({
        showLegend: !this.state.showLegend,
          ...(!this.state.showLegend) && {showGraphSearch: false}  // hide other views
      });
    } else if (viewType === ControlViewsEnum.SEARCH) {
      this.setGraphState({
        showGraphSearch: !this.state.showGraphSearch,
      ...(!this.state.showGraphSearch) && {showLegend: false}
      });
    }
  }

  focusNode = (courseCode) => {
    console.log("[focusNode] courseCode: ", courseCode);
    const node = this.state.graphElements.find(x => x.id === courseCode);
    if (node === undefined) {
      return
    }
    // we need graphDiv to work out the dimensions of the graph for centering
    if (this.graphDiv === undefined) {
      return
    }

    const zoom = 0.7;
    const max_width = this.graphDiv.clientWidth / zoom;
    const max_height = this.graphDiv.clientHeight / zoom;

    const position = node.position;
    const targetX = (-(position.x + NODE_APPROX_WIDTH/2) + max_width/2) * zoom;
    const targetY = (-(position.y + NODE_APPROX_HEIGHT/2) + max_height/2) * zoom;

    this.state.reactFlowInstance.setTransform({x: targetX, y: targetY, zoom: zoom});

    //Set highlighting for the focused node
    this.onNodeMouseEnter(null, node);
  }

  showRequirements = () => {
    //if (onShowInfo) {
    //}
    //let dependency = selected;
    //console.log(selected);
    let preList=[];
    let integrateRepeat=[];
    let integrate=[];
    for(var j=0;j<this.state.selectedCourses.length;j++){
      
      let course = this.dataGetCourse(this.state.selectedCourses[j]);
      if (course === undefined) {
        continue;
      }
      preList=course.conditions
      preList.toString().split(",");
      //console.log("for loop happy",this.state.selectedCourses);
      //console.log("testYYY",preList);
      if (preList.length === 0) {
        continue;
      }
      for(var i=0;i<preList[0].length;i++){
        integrateRepeat.push(preList[0][i]); //get all the pre-req courses for selected courses
      }
    }
    //console.log("testUUU",integrateRepeat);
    for(var i=0;i<integrateRepeat.length;i++){
      if(!integrate.includes(integrateRepeat[i])){
        integrate.push(integrateRepeat[i]); //integrate: pre-req list for selected courses without repeat course
      }
    }
    //console.log("test---------",integrate);
    //console.log("testT",selectedSubjects);
    let  course=integrate;
    //let dependency = (course.toString()).split(",");
    let dependency=this.state.selectedCourses;
    var len = dependency.length;
    var str_cond;
    let graph = [];
    // var id = data.label;
    databaseInstance.ref().on("value", function(snapshot) {
      //snapshot.forEach((child) => {
      for(var i=0;i<160;i++){
        var ref1 = databaseInstance.ref("Subject Area/"+i+"/course");
        ref1.on("value", function(snapshot) {
            snapshot.forEach((child) => {
              for(var k=0;k<len;k++){
                //console.log(course[k]);
                //console.log("depen",dependency[0]);
                if(dependency[k]===child.key){

                  console.log("push",dependency[k]);
                  graph.push(dependency[k]);
                  graph.push(" : ");
                  graph.push(child.val().conditions);
                  graph.push(<br/>);
                  graph.push(<br/>);
                  //alert("searching",graph);
                }
              }
            });
          }//, function (error) {
          //console.log("Error: " + error.code);
          //}
        );
      }

      notification.open({

        duration:8,
        top:70,
        message: ' Selected course requirements',
        description:
        graph,
        onClick: () => {
          console.log('Notification Clicked!');
        },
        style: {
          width: 650,
          overflowY:"scroll",
          height:200
        },

      });

    }, function (error) {
      console.log("Error: " + error.code);
    });

  }

  onGraphLoad = (reactFlowInstance) => {
    this.setGraphState({
      reactFlowInstance: reactFlowInstance
    });
    reactFlowInstance.setTransform({x: 50, y: 10, zoom: 0.6});
  }

  // getSelectedCourses = (e) => {
  //   var str = e.target.innerText;
  //   var str1 = str.trim();
  //   selectedSubjects=this.props.selectedSubjects;
  //   //console.log(str1);
  //   //console.log(this.props.selectedSubjects);
  //   //console.log("Graph.js",selectedCourse);
  //   selected=getCourse(str1,this.props.selectedSubjects).prereq
  //   //console.log(selected);
  //   //console.log(typeof(e.target.innerText));
  //   //console.log(str.trim());
  // }

  render() {
    if (DEBUG_OUTPUT) console.log("<**Graph**>");

    return (
      <div className="Graph" ref={graphDiv => this.graphDiv = graphDiv}>
        <ReactFlowProvider>
          <div className="GraphFlow">
            <ReactFlow
              // onElementClick={this.getSelectedCourses}
              elements={this.state.graphElements}
              onNodeMouseEnter={this.onNodeMouseEnter}
              onNodeMouseLeave={this.onNodeMouseLeave}
              onLoad={this.onGraphLoad}
              onSelectionChange={(elements) => this.onSelectionChange(elements)}
              nodeTypes={ {default: DefaultNode, input: InputNode, output: OutputNode, solo: SoloNode} }
              edgeTypes={ {custom: CustomEdge} }
              nodesDraggable={false}
              nodesConnectable={false} >
              <CustomControls showCourseInfo={true}
                              onShowCourseInfo={this.showRequirements}
                              showClearSelection={true}
                              onClearSelection={this.clearSelectedCourses}
                              showStickyHighlights={true}
                              onStickyHighlights={this.toggleStickyHighlights}
                              isStickyHighlights={this.state.stickyHighlights}
                              showLegend={true}
                              onShowLegend={() => this.toggleControlViews(ControlViewsEnum.LEGEND)}
                              showSearch={true}
                              onShowSearch={() => this.toggleControlViews(ControlViewsEnum.SEARCH)}/>
              <CustomBackground nodeMaxCoords={this.state.nodeMaxCoords} />
              <Legend showLegend={this.state.showLegend} />
              <GraphSearch showGraphSearch={this.state.showGraphSearch} graphSearch={this.focusNode} />
            </ReactFlow>
          </div>
          <GraphProvider
            selectedCourses={this.state.selectedCourses}
            forkedDependencies={this.state.forkedDependencies}
            forceProviderSelectionUpdate={this.state.forceProviderSelectionUpdate}
          />
        </ReactFlowProvider>
      </div>
    );
  }

}

const mapStateToProps = state => {
  // console.log("The selected course in state is"+ JSON.stringify(state.selection.selection))
  
  var selection = state.selection;
  var template = state.template;
  var subject = state.subject;
  var area = state.area;
  return {selection, template, subject, area}

}

//export default Graph;
export default connect(mapStateToProps, { assignSelection, assignTemplate, assignFilter, assignRawData})(Graph);
