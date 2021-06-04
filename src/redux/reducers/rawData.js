import{
  ASSIGN_RAW_DATA
} from '../actionTypes'

const initialState = {
  rawData: {},
};


export default function(state = initialState, action){
  switch(action.type){
    case ASSIGN_RAW_DATA: {
      const content = action.payload;
      return {
        ...state,
        rawData: content
      }
    }
    default:
      return state;
  }
}
