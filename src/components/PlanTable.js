import React, { Component } from 'react';
import "./PlanTable.css"
import TermTable from './TermTable.js';
import {connect} from 'react-redux';
import { getFilterList, getSelection } from '../redux/selectors'
import { getPositionOfLineAndCharacter } from 'typescript';
import {assignSelection, assignTemplate, assignSubject, assignArea} from "../redux/actions"
import {Button} from 'antd'
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import { InfoOutlined, DeleteOutlined,EditOutlined,SaveOutlined, VerticalAlignBottomOutlined} from '@ant-design/icons';
import {notification, Tooltip } from 'antd';
import SweetAlert from 'sweetalert-react'; // eslint-disable-line import/no-extraneous-dependencies
import 'sweetalert/dist/sweetalert.css';
import { Collapse } from 'antd';
import { Menu, Dropdown } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import html2pdf from 'html2pdf.js';
import Element from 'antd/lib/skeleton/Element';
import {getFlatData} from "./graph/GraphData";
 
const { Panel } = Collapse;

class PlanItem extends React.Component {
    constructor(props) {
        super(props);
        this.state ={
            name : [],
            show:false
        }
    }

    exportPdf = (planId,planName) => {

        const header = document.getElementById('header');
        var copyHeader=header.cloneNode(true);

        const termtable = document.getElementById('term-root');
        var copyTermtable=termtable.cloneNode(true);

        let resultElement =document.createElement('div')
        
        let ReportUOC =  document.createElement('div');
        let UocResult = document.createElement("H1")
        let totalUoc = document.createTextNode("You will get total "+this.totalUoc(planId,this.props.planList)+" UOC after you complete your plan.")
        UocResult.appendChild(totalUoc)
        ReportUOC.appendChild(UocResult)

        resultElement.appendChild(copyHeader);
        resultElement.appendChild(document.createElement("br"));
        resultElement.appendChild(copyTermtable)
        resultElement.appendChild(document.createElement("br"));
        resultElement.appendChild(ReportUOC)

        
        const opt = {
          margin: 1,
          filename: planName[planId-1],
          image: { type: 'jpeg', quality: 0.98 }, 
          html2canvas: { scale: 2, useCORS: true }, 
          jsPDF: { orientation: 'landscape', 
          unit: 'in', 
          format: 'b2' },
        };
        
        if (resultElement) {
          html2pdf().set(opt).from(resultElement).save(); 
        }
      };

    //reshow plan template in termtable by re-assign selection to redux, but still need to work for graph
    reShowPlan=(planId,planList,assignSelection,assignTemplate, assignSubject, assignArea)=>{
        assignSubject(planList[planId-1].selection);
        assignTemplate(true);
        var subjectArea = ["COMP"]
        assignArea(subjectArea);
    }
    
     //get total Uoc for each plan
     totalUoc=(planId,planList)=>{
       let totalUoc=0;
       let course=[]
       if(this.props.rawData!==undefined){
        course = getFlatData(this.props.rawData.rawData);
       }

       console.log(course.length)
       if (course.length!== 0 ) {
         let codeList = []
         // let course = require("./sampleData.json")
         console.log(course)
         for(let i = 0; i<course.length;i++){
           codeList.push(course[i]["code"])
         }

         for(let i=0;i<planList[planId-1].selection.length;i++){
           let index = codeList.indexOf(planList[planId-1].selection[i]);
           if (index !== -1 && index < course.length) {
             let uoc = course[index].uoc
             totalUoc=totalUoc+uoc
           }
         }
       }

        let uocResult = String(totalUoc)
        return uocResult
    }

    getPlanName=(planId,planName)=>{
        if(planName.length==0||planName.length<planId){
            this.props.rename("Plan "+ planId,planId);
            return "Plan "+ planId
        }else{
            return planName[planId-1]
        }
    }


    render() {
        let { planId,planList,planName,assignSelection,deletePlanList,rename, assignTemplate, assignSubject, assignArea} = this.props;
        const menu=(
            
                <Menu className="plan-style">
                    &nbsp;<a>
                    <Tooltip title={"UOC: "+this.totalUoc(planId,planList)+"uoc"}>
                        <Button shape="circle" size="small" icon={< InfoOutlined />}/>
                    </Tooltip>&nbsp;&nbsp;
                    </a>
                    <a>
                    <Tooltip title="Delete">
                        <Button shape="circle" size="small" icon={< DeleteOutlined />} onClick={(event)=>deletePlanList(planId)}/>
                    </Tooltip>&nbsp;&nbsp;</a>
                    <a>
                    <Tooltip title="Edit">
                        <Button shape="circle" size="small" icon={<EditOutlined />} onClick={(event)=>this.setState({ show: true })}/>
                    </Tooltip>&nbsp;</a>
                    <a>
                    <Tooltip title="Download">
                        <Button shape="circle" size="small" icon={< VerticalAlignBottomOutlined />} onClick={(event)=>this.exportPdf(planId,planName)}/>
                    </Tooltip>&nbsp;&nbsp;</a>
                    
               </Menu>
            

        );
        return (
            <div className="plan-item">
                <Dropdown overlay={menu} trigger={['click']} placement="bottomCenter" overlayStyle={{left:"5px"}}>
                    <div className="plan-Name" onClick={(event)=>this.reShowPlan(planId,planList,assignSelection,assignTemplate,assignSubject, assignArea)}>{this.getPlanName(planId,planName)}
                    <a className="expand">
                        <DownOutlined />
                    </a>
                    </div>
                    
                </Dropdown>
                
                {/*<div className="uoc">{this.totalUoc(planId,planList)} UOC</div>*/}
                
                <div className="plan-button">
                </div>
                <SweetAlert
                    show={this.state.show}
                    title="Change the Plan Name"
                    type="input"
                    inputType="text"
                    inputPlaceholder="New Plan Name"
                    showCancelButton
                    onConfirm={inputValue => {
                        console.log(`SweetAlert onConfirm: inputValue=${inputValue}`);
                        rename(inputValue,planId);
                        this.setState({ show: false });
                    }}
                    onCancel={() => {
                        console.log('cancel'); // eslint-disable-line no-console
                        this.setState({ show: false });
                    }}
                />
            </div>
        );
    }
}

class PlanTable extends Component {
    constructor(props) {
        super(props);
        this.state = {
            planList:[],
            planId:[],
            planName:[]
        }
    }
    //store template in planList
    getPlanList =()=>{
        console.log(this.props.selection.selection)
        let id = this.state.planId
        let tmpList = this.state.planList
        
        if(this.props.selection.selection!=null){
            if(this.props.selection.selection.length!=0){
                if(tmpList.length==0){
                    id = [1]
                    tmpList.push(this.props.selection)
                    this.setState({planList:tmpList})
                    this.setState({planId:id})
                }else if(!tmpList.includes(this.props.selection)){
                    if(tmpList[tmpList.length-1].selection!=this.props.selection.selection){
                        id.push(this.state.planList.length+1)
                        tmpList.push(this.props.selection)
                        this.setState({planList:tmpList})
                        this.setState({planId:id})
                    }
                }
            }
        }
        // console.log(this.state.planList)
    }
    //delete the template in planList
    deletePlanList =(planId) =>{
        let tmpList = this.state.planList;
        let id = this.state.planId;
        let name = this.state.planName;
        if(tmpList.length!=1){
            //delete the template
            tmpList.splice(planId-1,1);
            name.splice(planId-1,1)
            id.splice(planId-1,1);
            //change item id for dispaly
            while(planId-1<tmpList.length){
                id[planId-1]=planId;
                planId++;
            }
        }else{
            tmpList = [];
            id =[]
            name = []
        }
        // console.log(id)
        // console.log(tmpList)
        this.setState({planList:tmpList})
        this.setState({planId:id})
        this.setState({planName:name})
    }
    //rename function for plan
    rename=(inputValue,planId)=>{
        let nameList = this.state.planName
        console.log(nameList)
        console.log(nameList.length+"and"+planId)
        if(nameList.length==0||nameList.length<planId){
            nameList.push(inputValue)
        }else{
            nameList[planId-1]=inputValue
        }
        this.setState({planName:nameList})
        console.log( this.state.planName)
    }

    render() {
        let tasks = this.state.course_code
        const {planId, planList,planName} = this.state
        // console.log(planId)
        // console.log(planList)
        if(planId.length==0){
            return (
                <div className="plan-wrapper">
                    <div className="plan-header">
                        <div>PLAN MODE
                            &nbsp;&nbsp;<Tooltip title="Save plan">
                                <Button style={{background:"transparent",border:"none",color:"white"}} shape="circle" size="medium" icon={<SaveOutlined />} onClick={(event)=>this.getPlanList()} />
                            </Tooltip>
                        </div>
                    </div>
                    
                    <div className="plan-col">
                        <div className="plan-item">Default plan</div>
                    </div>
                </div>
            );
        }else{
            return (
                <div className="plan-wrapper">
                    <div className="plan-header">
                        <p>PLAN MODE
                        &nbsp;&nbsp;<Tooltip title="Save plan">
                        <Button style={{background:"transparent",border:"none",color:"white"}} shape="circle" size="medium" icon={<SaveOutlined />} onClick={(event)=>this.getPlanList()} />
                    </Tooltip>
                        </p>
                    </div>
                    <div className="plan-col">
                    {planId.map(id =>
                        <PlanItem planId ={id} planList={planList} planName={planName} assignArea={this.props.assignArea} assignSubject={this.props.assignSubject} assignSelection={this.props.assignSelection} assignTemplate={this.props.assignTemplate} deletePlanList={this.deletePlanList} rename={this.rename} rawData={this.props.rawData}>
                            
                        </PlanItem>
                        
                        
                        // <div className="item">Plan {id}</div>
                        )}
                        
                    {/*<div class="save">
                        <button class="savebutton" onClick={(event)=>this.getPlanList()}>Save</button>
                    </div>*/}
                    </div>
                </div>
            );
        }
    }

}

const mapStateToProps = state =>{
    // console.log("The selected course in state is"+ JSON.stringify(state.selection.selection))
    return {
      ...state.selection,
      ...state.rawData
    };

  }

export default connect(mapStateToProps,{assignSelection, assignTemplate, assignSubject, assignArea})(PlanTable);