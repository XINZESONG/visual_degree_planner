import { combineReducers } from 'redux'
import filter from './filter'
import selection from './selection'
import template from './template'
import subject from './subject'
import area from './area'
import rawData from "./rawData"

export default combineReducers({ filter, selection, template, subject, area, rawData })