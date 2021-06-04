import React, { Component } from 'react';
import { connect } from 'react-redux';
// import CourseList from './CourseList'
import './SubjectList.css'; 
import { assignFilter } from "../redux/actions"

class SubjectList extends Component {
    constructor(props) {
        super(props);
        this.state={
            unselect_subject:[],
            showVaildSubject:true,
            select_subject:[],
            showSelectedSubject:false,
        }
        this.props.assignFilter(this.state.select_subject)
    }


    select_subject = (subject) =>{       //set select coures
        let select_subject = [...this.state.select_subject];
        let unselect_subject = [...this.props.result];
        if(!select_subject.includes(subject)){
            select_subject.push(subject)
            if(select_subject.length===1){
                this.setState({showSelectedSubject: !this.state.showSelectedSubject})
            }
            let index = unselect_subject.indexOf(subject)
            unselect_subject.splice(index,1)
        }else{
            let index = select_subject.indexOf(subject)
            select_subject.splice(index,1)
            if(select_subject.length===0){
                this.setState({showSelectedSubject: !this.state.showSelectedSubject})
            }
            unselect_subject.push(subject)
        }
        // this.setState({showVaildSubject: !this.state.showVaildSubject })
        this.setState({select_subject:select_subject})
        this.setState({unselect_subject:unselect_subject})
        this.props.assignFilter(select_subject)
    }

    deleteSelectedSubj(unselect_subject){
        for(let i=0;i<this.state.select_subject.length;i++){
            if(unselect_subject.includes(this.state.select_subject[i])){
                let index = unselect_subject.indexOf(this.state.select_subject[i])
                unselect_subject.splice(index,1)
            }
        }
        return unselect_subject
    }

    render() {
        const { showVaildSubject,showSelectedSubject,select_subject} = this.state
        const unselect_subject = this.props.result
        return (
            <div  className = "result">
                <div className = "List">
                    <button className="button button2" style={{ display: (showSelectedSubject ? 'block' : 'none') }}>SELECTED SUBJECT</button>
                    <div className = "Button">
                            {select_subject.sort().map((subject) => 
                            <button key={subject} className="button button1" style={{ display: (showSelectedSubject ? 'block' : 'none') }} onClick={() => {this.select_subject(subject)}}>{subject}</button>
                        )}
                    </div>
                    <button className="button button2" style={{ display: (showSelectedSubject ? 'block' : 'none')}}>UNSELECTED SUBJECT</button>
                    <div className = "Button">
                            {this.deleteSelectedSubj(unselect_subject).sort().map((subject) => 
                            <button key={subject} className="button button1" style={{ display: (showVaildSubject ? 'block' : 'none') }}onClick={() => {this.select_subject(subject)}}>{subject}</button>
                        )}
                    </div>
                </div>
                {/* <div>{this.showCourse(showVaildSubject)}</div> */}
            </div>
        );
    }
}

export default connect(
    null,
    { assignFilter }
)(SubjectList)