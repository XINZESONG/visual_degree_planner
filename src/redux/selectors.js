
export const getFilterState = store => store.filter;

export const getFilterList = store =>
    getFilterState(store) ? getFilterState(store).filters : [];

export const getSelectionState = store => store.selection;

export const getSelection = store =>
    getSelectionState(store) ? getSelectionState(store).selection : [];

export const getTemplateState = store => store.template;

export const getTemplate = store => 
    getTemplateState(store) ? getTemplateState(store).load_template:false;

export const getSubjectState = store => store.template;

export const getSubject = store => 
    getSubjectState(store) ? getSubjectState(store).subject:[];

export const getAreaState = store => store.area;

export const getArea = store => 
    getAreaState(store) ? getAreaState(store).subject:[];

export const getRawDataState = store => store.rawData;

export const getRawData = store =>
  getRawDataState(store) ? getRawDataState(store).rawData : {};