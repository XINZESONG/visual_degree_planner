export function arraysAreEqual(array1, array2) {
  if (array1.length !== array2.length) {
    return false;
  }
  for (let i = 0; i < array1.length; i++) {
    if (array1[i] !== array2[i]) {
      return false;
    }
  }
  return true;
}

export function arrayIntersection(array1, array2) {
  return array1.filter(x => array2.includes(x));
}

export function arrayRemoveShallow(array, item) {
  return array.filter(x => x !== item);
}

/**
 * Add a value to an object which maps key to arrays.
 * If the key exists, add to the array, otherwise create a new array.
 * E.g. initial map          -> { key1: [ va1, val2, val3 ]}
 *      add(map, key1, val4) -> { key1: [ va1, val2, val3, val4 ]}
 *      add(map, key2, val9) -> { key1: [ va1, val2, val3 ], key2: [val9] }
 * @param map
 * @param key
 * @param value
 */
export function addToMappedList(map, key, value) {
  if (key in map) {
    map[key].push(value)
  } else {
    map[key] = [value]
  }
}

/**
 * Array comparison function for use with memoizeOne.
 */
export const memoizeArrayCompareFn = (newArgs, lastArgs) => {
  // console.log("[memoizeArrayCompareFn] New: ", newArgs, "Old: ", lastArgs);
  // Args should just have one element - an array of subjects
  if (newArgs.length > 0 && Array.isArray(newArgs[0])
    && lastArgs.length > 0 && Array.isArray(lastArgs[0])) {
    return arraysAreEqual(newArgs[0], lastArgs[0]);
  }
  return false;
}

export function appendCSSClass(existingClassStr, newClass) {
  if (existingClassStr !== undefined) {
    return existingClassStr + (existingClassStr.search(newClass) === -1 ? " " + newClass : "");
  }
  return newClass;
}

export function removeCSSClass(existingClassStr, targetClassRegex) {
  if (existingClassStr !== undefined) {
    let regex = RegExp((typeof(targetClassRegex) === "string" ? targetClassRegex : targetClassRegex.source), "g");
    return existingClassStr.replaceAll(regex, "").replaceAll(/ +/g, " ").trim();
  }
  return "";
}

export function hasCSSClass(existingClassStr, targetClassRegex) {
  return existingClassStr === undefined ? false : existingClassStr.search(targetClassRegex) !== -1;
}
