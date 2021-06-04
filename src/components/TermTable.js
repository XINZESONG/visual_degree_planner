import React, { Component } from 'react';
import './TermTable.css'
import {connect} from 'react-redux';
import { getFilterList, getSelection } from '../redux/selectors'
// import selection from '../redux/reducers/selection';
import {Tooltip,Button } from 'antd';
import { InfoOutlined, DeleteOutlined } from '@ant-design/icons';
import { ThreeDRotationSharp } from '@material-ui/icons';
import {getFlatData} from "./graph/GraphData";

let TERM_CODE = {}
// export let selectedCourse;
class TaskItem extends React.Component {
    handleDragStart = (e) => {
        this.props.onDragStart(this.props.id);
    }
    courseName = (course_code)=>{
        let courseNmae = course_code.split(" ",1)
        return courseNmae
    }
    courseUoc = (course_code)=>{
        let uoc = course_code.slice(-5);
        return uoc
    }
    render() {
        let { id, course_code, active, onDragEnd } = this.props;
        return (
          <div
            onDragStart={this.handleDragStart}
            onDragEnd={onDragEnd}
            id={`item-${id}`}
            className={'term-item' + (active ? ' active' : '')}
            draggable="true"
          >
              <header className="item-header">
                  {/*<span className="item-header-course_code">{course_code}</span>*/}
              </header>
              {this.courseName(course_code)}
              <div className="termUoc">
                  <Tooltip title={this.courseUoc(course_code)}>
                      <Button shape="circle" size="small" icon={< InfoOutlined/>}/>

                  </Tooltip>
              </div>

          </div>
        );
    }
}

class SelectedCourseCol extends React.Component {
    state = {
        in: false
    }
    handleDragEnter = (e) => {
        e.preventDefault();
        if (this.props.canDragIn) {
            this.setState({
                in: true
            })
        }
    }
    handleDragLeave = (e) => {
        e.preventDefault();
        if (this.props.canDragIn) {
            this.setState({
                in: false
            })
        }
    }
    handleDrop = (e) => {
        e.preventDefault();
        this.props.dragTo(this.props.TERM);
        this.setState({
            in: false
        })
    }
    getUoC = () => {    
        var uoc = 0;
        for( var i in this.props.children){
            let uocString = this.props.children[i].props.course_code.slice(-5)
            uoc += Number(uocString.match(/\d/g));
        }
        return uoc
    }

    render() {
        let { TERM, children } = this.props;
        // this.CourseLimit()
        return (
          <div
            id={`col-${TERM}`}
            className={'col'}
            onDragEnter={this.handleDragEnter}
            onDragLeave={this.handleDragLeave}
            onDragOver={this.handleDragEnter}
            onDrop={this.handleDrop}
          >
              <header className="col-header">
                  {TERM_CODE[TERM]} <div class="boxed">{this.getUoC()} UoC</div>
                  
              </header>
              <main className={'col-main' + (this.state.in ? ' active' : '')}>
                  {children}
              </main>
          </div>
        );
    }
}

class TermTable extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedCourses:[],             //used for dag course
            activeId: null,                 //use for detetcd if course can drag
            passInCourses:[],                //store the selected course list in local
            course:[]
        }
    }

    initCourse = (rows,selectedCourses) => {
        let courseInTerm=[]
        for (var i=0;i<rows;i++) {
            courseInTerm[i] = Number(selectedCourses[i].TERM);
        }

        return courseInTerm.reduce(function(prev,next){
            prev[next] = (prev[next] + 1) || 1;
            return prev;
        },{});

    }

    onDragStart = (id) => {
        this.setState({
            activeId: id
        })
    }

    dragTo = (TERM) => {
        let { selectedCourses,  activeId, course} = this.state;
        let selectedCourse = selectedCourses[activeId];
        let courseInTerm=this.initCourse(selectedCourses.length,selectedCourses)
        let courseNmae = selectedCourse.course_code.split(" ",1)[0]
        //set limit 3 course per term
        let codeList = [];
        for(let i = 0; i<this.state.course.length;i++){
            codeList.push(course[i]["code"])
        }
        let index = codeList.indexOf(courseNmae)
        let available_terms = course[index].terms;
        if (selectedCourse.TERM !== TERM) {
            if(TERM in courseInTerm){
                if(courseInTerm[TERM]<3){
                    //check aim term is available
                    if(available_terms.includes(Number(TERM))){
                        selectedCourse.TERM = TERM;
                    }else if(available_terms.length==0){
                        selectedCourse.TERM = TERM;
                    }
                }
            }else{
                selectedCourse.TERM = TERM;
            }
            this.setState({
                selectedCourses: selectedCourses
            })
        }
        this.cancelSelect();
    }

    cancelSelect = () => {
        this.setState({
            activeId: null
        })
    }
    //use selectedCourseList from Redux and produce new list structure for display in termtable
    getCourse = () => {
        let displayCourses = []
        if(this.props.selection !== undefined && ("selection" in this.props.selection) && this.props.rawData !== undefined && ("rawData") in this.props.rawData){
            //get all course code from data
            let {course} = this.state
            let codeList = []
            let tmp_course = getFlatData(this.props.rawData.rawData);
            if(course.length!=tmp_course.length && tmp_course.length!=0){
                this.setState({course:tmp_course})
            }

            for(let i = 0; i<course.length;i++){
                codeList.push(course[i]["code"])
            }
            //console.log("The selected Course in Termtable is " + this.props.selection.selection)
            // selectedCourse=this.props.selection.selection;
            this.props.selection.selection.sort()
            //Loop the selectedCourses list and reproduce new structure in displayCourse list
            if(displayCourses.length!==this.props.selection.selection.length){
                for(let i = 0; i<this.props.selection.selection.length;i++){
                    // console.log(this.props.selection.selection[i])
                    let index = codeList.indexOf(this.props.selection.selection[i])
                    let termNum = 0
                    // console.log("The courseIndex is content with " +index)
                    //try to find correct term number and produce new structure
                    if(index === -1 || index >= course.length || course[index].terms.length===0){
                        termNum = 1
                    }else{
                        termNum = course[index].terms[0]
                    }
                    //this part should be change later
                    // if(this.props.selection.selection[i]=="COMP1921"){
                    //     console.log("Detect the SENG1921 is"+JSON.stringify(displayCourses));
                    //     termNum = this.detectCoursePrereq(displayCourses,termNum,course[index].conditions,course[index].terms)
                    //     console.log("SENG1921 in TERM"+termNum);
                    // }else{
                    // console.log(course[index].terms)
                    termNum = this.detectCoursePrereq(displayCourses,termNum,course[index].conditions,course[index].terms)
                    // }
                    termNum = this.detectTermSpace(displayCourses,termNum,course[index].terms)

                    displayCourses.push({
                        id:i,
                        TERM: String(termNum),
                        course_code:this.props.selection.selection[i]+" "+course[index].uoc+" UOC"
                    })


                    // console.log(displayCourses)
                }
            }
            // console.log("FINAL DISPLAYCOURSE"+JSON.stringify(displayCourses))
            //set displayCourses structure in satate and store the selectedCourse list local for next detected.
            if(this.state.passInCourses!==this.props.selection){
                this.setState({selectedCourses:displayCourses},()=>{
                    // console.log(this.state.selectedCourses)
                })
                this.setState({passInCourses:this.props.selection})

            }
            // console.log("The selected course in term table is " +JSON.stringify(this.state.selectedCourses))
        }
    }
    //detet if there get prereq course in same term, if in same term, then move to next available term
    detectCoursePrereq = (displayCourses,termNum,precourse,terms) =>{
        if(terms==undefined){
            terms=[]
        }
        
        for(let j=0;j<displayCourses.length;j++){
            let course_name = displayCourses[j].course_code.split(" ")[0]
            console.log(course_name)
            if(precourse.length!==0){
                //just detect for first course in prereq list, should change later
                let passPrereq = false;
                let preIndex=0;
                if(passPrereq==false){
                    for(let k=0;k<precourse.length;k++){
                        for(let i=0;i<precourse[k].length;i++){
                            console.log(precourse[k])
                            if(course_name==precourse[k][i]){
                                passPrereq=true
                                preIndex=k
                                break
                            }
                        }
                    }
                }

                for(let i=0;i<precourse[preIndex].length;i++){
                    if(course_name==precourse[preIndex][i]){
                        // console.log(precourse[preIndex][i])
                        if(Number(displayCourses[j].TERM)>=termNum){
                            console.log(terms.length)
                            if(terms.length==0){
                                termNum = termNum+1
                            }else{
                                termNum = termNum+3
                            }
                            termNum = this.detectCoursePrereq(displayCourses,termNum,precourse)
                            break
                        }
                    }
                }
            }
        }
        return termNum
    }
    //detect if there get 3 course in one term, if already get 3 course in one term then move to next year
    detectTermSpace = (displayCourses,termNum,terms) =>{
        let termSpace = 0

        for(let j=0;j<displayCourses.length;j++){
            if(Number(displayCourses[j].TERM)==termNum){
                termSpace++;
            }
            if(termSpace==3){
                if(terms.length==0){
                    termNum = termNum+1
                }else{
                    termNum = termNum+3
                }
                termNum = this.detectTermSpace(displayCourses,termNum, terms)
                break
            }
        }
        // console.log("The Term space is "+termSpace)
        return termNum
    }
    assignCourse = (TERM) => {
        const { activeId,selectedCourses} = this.state;
        let { onDragStart, onDragEnd, cancelSelect } = this;
        return(
          selectedCourses.filter(t => t.TERM === TERM).map(t =>

            <TaskItem
              key={t.id}
              active={t.id === activeId}
              id={t.id}
              course_code={t.course_code}
              onDragStart={onDragStart}
              onDragEnd={cancelSelect}

            />)
        )
    }

    result = (selectedCourses,TERM) => {
        const activeId = this.state.activeId;
        if(activeId!==null){
            // console.log(selectedCourses[activeId].TERM)
            if(selectedCourses[activeId].TERM !== TERM){
                return true
            }
        }
        return true
    }
    //assign term code to produce correct term number
    getTermCode = () => {
        const {selectedCourses} = this.state
        let termCode = []
        TERM_CODE = {}
        for(let i = 0; i<selectedCourses.length;i++){
            let yearNum = 1
            let tmpTerm=selectedCourses[i].TERM
            while(tmpTerm>3){
                yearNum++;
                tmpTerm=tmpTerm-3
            }
            if(!termCode.includes(selectedCourses[i].TERM)){
                let key = Number(selectedCourses[i].TERM)
                let keyValue = "Year "+yearNum+" Term "+tmpTerm
                TERM_CODE[key]=keyValue
            }
        }
        // console.log("The term Code is "+JSON.stringify(TERM_CODE))
        return TERM_CODE
    }

    render() {
        const { activeId,selectedCourses} = this.state;
        let { onDragStart, onDragEnd, cancelSelect } = this;
        this.getCourse()
        this.getTermCode()
        // console.log("The term table selectedCourse is" +JSON.stringify(selectedCourses))
        if(selectedCourses.length==0){
            return (
              <div className="init-wrapper">
                  <header className="init-header">
                      TERM TABLE
                  </header>
                  <main className='init-main'>
                  </main>
              </div>
            );
        }else{
            return (
              <div className="task-wrapper" id="term-root">
                  {
                      Object.keys(TERM_CODE).map(TERM =>
                        <SelectedCourseCol
                          TERM={TERM}
                          key={TERM}
                          dragTo={this.dragTo}
                          canDragIn={this.result(selectedCourses,TERM)}
                        >
                            { this.assignCourse(TERM)
                            }
                        </SelectedCourseCol>
                      )
                  }
              </div>
            )
        }
    }
}


const mapStateToProps = state =>{
    // console.log("The selected course in state is"+ JSON.stringify(state.selection.selection))
    // return state.selection;
    return {
        ...state.selection,
        ...state.rawData
    };
}

export default connect(mapStateToProps)(TermTable);