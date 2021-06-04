import {ASSIGN_FILTER, ASSIGN_SELECTION, ASSIGN_TEMPLATE, ASSIGN_SUBJECT, ASSIGN_AREA, ASSIGN_RAW_DATA} from "./actionTypes"

export const assignFilter = content =>({
    type: ASSIGN_FILTER,
    payload: {
        filter: content
    }
});


export const assignSelection = content => ({
    type: ASSIGN_SELECTION,
    payload:{
        selection: content
    }
})

export const assignTemplate = content => ({
    type: ASSIGN_TEMPLATE,
    payload:{
        template: content
    }
})

export const assignSubject = content => ({
    type: ASSIGN_SUBJECT,
    payload:{
        subject: content
    }
})

export const assignArea = content => ({
    type: ASSIGN_AREA,
    payload:{
        area: content
    }
})

export const assignRawData = content => ({
  type: ASSIGN_RAW_DATA,
  payload: {
    rawData: content
  }
})