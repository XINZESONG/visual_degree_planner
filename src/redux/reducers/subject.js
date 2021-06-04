import{
    ASSIGN_SUBJECT
} from '../actionTypes'

const initialState = {
    subject: []
  };


export default function(state = initialState, action){
    switch(action.type){
        case ASSIGN_SUBJECT: {
            const content = action.payload;
            return {
                ...state, 
                subject: content
            }
        }
        default: 
            return state;
    }
}
