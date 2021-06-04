import{
    ASSIGN_TEMPLATE
} from '../actionTypes'

const initialState = {
    template: false
  };


export default function(state = initialState, action){
    switch(action.type){
        case ASSIGN_TEMPLATE: {
            const content = action.payload;
            return {
                ...state, 
                template: content
            }
        }
        default: 
            return state;
    }
}
