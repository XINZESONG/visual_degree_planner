import React, { Component } from 'react';

class CourseList extends Component {

    courseList(){   
        let courseList = []
        let select_subject = this.props.select_subject
        let all_course = require('./'+select_subject+'.json')
        let courseIndex=0
        for(courseIndex = 0; courseIndex<all_course.length; courseIndex++){
            let course_code = all_course[courseIndex].course_code
            courseList.push(course_code)
        }
        console.log(courseList)
        return courseList
    }


    render() {  
        const courseList = this.courseList()
        const { showing } = this.props
        return (
            <div>
                <div style={{ display: (showing ? 'block' : 'none') }}>
                    {courseList.map((course_code) =>
                        <button onClick={() => {}}>{course_code}</button>
                    )}
                </div>
            </div>
        );
    }
    
}


export default CourseList;