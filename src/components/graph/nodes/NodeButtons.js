import React, {memo} from "react";
import {Button, notification, Tooltip} from "antd";
import {BookOutlined, CalendarOutlined, InfoOutlined} from "@ant-design/icons";
import {databaseInstance} from "../../../config/firebaseConfig";

const handleChildClick = (data,e) => {
  e.stopPropagation();
  var str_cond;
  let graph = [];
  var id = data.label;
  //console.log(typeof(data.label));
  //ref.on("value", function(snapshot) {
  //snapshot.forEach((child) => {
  for(var i=0;i<160;i++){
    //if(child.val()[i].course){
    //console.log(child.val()[i].course);
    var ref1 = databaseInstance.ref("Subject Area/"+i+"/course");
    ref1.on("value", function(snapshot) {
      snapshot.forEach((child) => {

        if(child.key===id){
          //str_cond = child.val().conditions;
          //console.log(child.val().conditions);
          //console.log("happy");
          notification.open({
            duration:6,
            top:70,
            message: id+' Pre-req',
            description:
            //str.split(8),
            child.val().conditions,

            onClick: () => {
              console.log('Notification Clicked!');
            },
            icon: <InfoOutlined style={{ color: '#108ee9' }} />,
            style: {
              width: 650,
            },

          });
        }
      });
    }, function (error) {
      console.log("Error: " + error.code);
    });
  }
  //});
  //}, function (error) {
  //  console.log("Error: " + error.code);
  //});

}

const ClickHandbook = (data,e) => {
  e.stopPropagation();
  var str_cond;
  let graph = [];
  var id = data.label;
  //console.log(typeof(data.label));
  //ref.on("value", function(snapshot) {
  //snapshot.forEach((child) => {
  for(var i=0;i<160;i++){
    //if(child.val()[i].course){
    //console.log(child.val()[i].course);
    var ref1 = databaseInstance.ref("Subject Area/"+i+"/course");
    ref1.on("value", function(snapshot) {
      snapshot.forEach((child) => {

        if(child.key===id){
          //str_cond = child.val().conditions;
          //console.log(child.val().conditions);
          //console.log("happy");
          var str = child.val().handbook;
          //http://www.handbook.unsw.edu.au/undergraduate/courses/2021/COMP1511.html
          //https://www.handbook.unsw.edu.au/undergraduate/courses/2021/COMP1511
          //http://www.handbook.unsw.edu.au/undergraduate/courses/2021/COMP1511
          //https://blog.csdn.net/think_yang_1991/article/details/84819948
          var s1 = str.substring(0,str.length-5);
          notification.open({
            duration:6,
            top:70,
            message: id+' Handbook link',
            description:
            //child.val().handbook,
              <a href={s1} target="_blank">Redirect to handbook</a>,
            onClick: () => {
              console.log('Notification Clicked!');
            },
            icon: <BookOutlined style={{ color: '#108ee9' }} />,
            style: {
              width: 650,
            },
          });
        }
      });
    }, function (error) {
      console.log("Error: " + error.code);
    });
  }
  //});
  //}, function (error) {
  //  console.log("Error: " + error.code);
  //});

}

const ClickTimetable = (data,e) => {
  e.stopPropagation();
  var str_cond;
  let graph = [];
  var id = data.label;
  //console.log(typeof(data.label));
  //ref.on("value", function(snapshot) {
  //snapshot.forEach((child) => {
  for(var i=0;i<160;i++){
    //if(child.val()[i].course){
    //console.log(child.val()[i].course);
    var ref1 = databaseInstance.ref("Subject Area/"+i+"/course");
    ref1.on("value", function(snapshot) {
      snapshot.forEach((child) => {

        if(child.key===id){
          //str_cond = child.val().conditions;
          //console.log(child.val().conditions);
          //console.log("happy");
          var str = child.val().timetable;
          //http://timetable.unsw.edu.au/2021/SENG2011.html
          //var s1 = str.substring(0,str.length-5);
          notification.open({
            duration:6,
            top:70,
            message: id+' Timetable link',
            description:
            //child.val().timetable,
              <a href={str} target="_blank">Redirect to timetable</a>,
            onClick: () => {
              console.log('Notification Clicked!');
            },
            icon: <CalendarOutlined style={{ color: '#108ee9' }} />,
            style: {
              width: 650,
            },
          });
        }
      });
    }, function (error) {
      console.log("Error: " + error.code);
    });
  }
  //});
  //}, function (error) {
  //  console.log("Error: " + error.code);
  //});

}

const NodeButtons = ({ data }) => {
  return (
    <>
      <Tooltip title="Pre-req">
        <Button shape="circle" size="small" icon={< InfoOutlined/>} onClick={handleChildClick.bind(this,data)} />
      </Tooltip>&nbsp;&nbsp;
      <Tooltip title="Handbook">
        <Button shape="circle" size="small" icon={< BookOutlined/>} onClick={ClickHandbook.bind(this,data)} />
      </Tooltip>&nbsp;&nbsp;
      <Tooltip title="Timetable">
        <Button shape="circle" size="small" icon={< CalendarOutlined/>} onClick={ClickTimetable.bind(this,data)} />
      </Tooltip>
    </>
  );
}

export default memo(NodeButtons);
