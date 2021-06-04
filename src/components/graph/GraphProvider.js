import {useEffect} from 'react';
import {useStoreActions, useStoreState} from "react-flow-renderer";

const DEBUG_OUTPUT = false;

function GraphProvider({selectedCourses, forceProviderSelectionUpdate}) {
  // if (DEBUG_OUTPUT) console.log("<**GraphProvider**>");

  let nodes = useStoreState((store) => store.nodes);
  // if (DEBUG_OUTPUT) console.log("Nodes: ", nodes);
  const setSelectedElements = useStoreActions((actions) => actions.setSelectedElements);

  useEffect(() => {
    if (DEBUG_OUTPUT) console.log("[GraphProvider] Doing stuff in useEffect...");
    if (DEBUG_OUTPUT) console.log("[GraphProvider] Selected: ", selectedCourses);
    if (DEBUG_OUTPUT) console.log("[GraphProvider] forceProviderSelectionUpdate: ", forceProviderSelectionUpdate);
    // This if condition is to avoid looping with 1 element during user selection
    // The user selects the first element
    //   -> onSelection adds to selectedCourses
    //   -> GraphProvider setSelected( Array[1] )
    //   -> onSelection detects 1 element; already selected - thinks it's a deselection
    //   -> remove from selectedCourses
    // forceProviderSelectionUpdate allows bypassing 1 element check, and is short-circuited in onSelectionUpdate
    if (selectedCourses.length > 1 || forceProviderSelectionUpdate) {
      // Update selected
      const selectedNodes = nodes.filter(node => selectedCourses.includes(node.id));
      if (selectedNodes.length !== selectedCourses.length) {
        console.log("[GraphProvider]: WARNING: selectedCourses contains nodes not in the graph: ",
                    selectedCourses.filter(code => !nodes.map(x => x.id).includes(code)));
      }
      setSelectedElements(selectedNodes);
    }
  }, [selectedCourses, forceProviderSelectionUpdate]);

  return null;
}

export default GraphProvider;
