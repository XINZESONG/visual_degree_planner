import{
    ASSIGN_FILTER
} from '../actionTypes'

const initialState = {
    filters: []
  };


export default function(state = initialState, action){
    switch(action.type){
        case ASSIGN_FILTER: {
            const content = action.payload;
            return {
                ...state, 
                filters: content
            }
        }
        default: 
            return state;
    }
}
