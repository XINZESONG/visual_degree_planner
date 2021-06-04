import React from "react";
import {databaseInstance} from "../../config/firebaseConfig";

class Uploader extends React.Component {
  writeSubjectCourseData = (subjectArea, courseDataList) => {
    /*
     * Database structure
     * courses: { MATH: [ {code: MATH1131, name: 'Mathematics 1A', ...}, {code: 'MATH1231', ...} ] }
     */
    const dbData = { courses: courseDataList };
    // console.log("courses: { " + subjectArea + ": ", dbData, "}");
    console.log("Starting write for subject: " + subjectArea);
    databaseInstance.ref('courses/' + subjectArea).set(dbData)
      .then(function() {
        console.log("Synchronization succeeded for subject: '" + subjectArea + "'");
      })
      .catch(function(error) {
        console.log("Synchronization failed for subject: '" + subjectArea + "'. Error: ", error);
      });
  }

  deleteSubjectCourseData = (subjectArea) => {
    console.log("Deleting data for subject: " + subjectArea);
    databaseInstance.ref('courses/' + subjectArea).remove()
      .then(function() {
        console.log("Remove succeeded for subject: " + subjectArea);
      })
      .catch(function(error) {
        console.log("Remove failed for subject: " + subjectArea + " Error: " + error.message);
      });
  }

  uploadCourseData = () => {
    console.log("Uploading...");
    this.fileInput.click();
  }

  handleFiles = (e) => {
    console.log("Selected files: ", e.target.files);
    const files = e.target.files;
    for (const file of files) {
      let reader = new FileReader();
      reader.readAsText(file);
      reader.onload = readerEvent => {
        const content = readerEvent.target.result;
        // console.log("Read content: ", content);
        const fileData = JSON.parse(content);
        // console.log("File data: ", fileData);
        const subject = file.name.replace(".json", "");
        // console.log("Writing data for subject: " + subject);
        this.writeSubjectCourseData(subject, fileData);
      };
      reader.onabort = reader.onerror = readerEvent => {
        console.log("Error loading file: " + file + " Error: ", readerEvent.target.error);
      }
    }
  }

  render() {
    return (
      <div>
        <button onClick={this.uploadCourseData}>Upload...</button>
        <input type="file" id="file" multiple ref={input => this.fileInput = input} onChange={this.handleFiles} style={{display: "none"}} />
      </div>
    );
  }
}

export default Uploader;
