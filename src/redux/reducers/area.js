import{
    ASSIGN_AREA
} from '../actionTypes'

const initialState = {
    area: []
  };


export default function(state = initialState, action){
    switch(action.type){
        case ASSIGN_AREA: {
            const content = action.payload;
            return {
                ...state, 
                area: content
            }
        }
        default: 
            return state;
    }
}
