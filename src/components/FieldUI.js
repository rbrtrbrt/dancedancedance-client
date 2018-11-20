import React, { Fragment } from "react";
import ReactDOM from 'react-dom';
// import * as mx from "mobx";
import { observer, Observer } from "mobx-react";

import { Spring } from "react-spring";
import classnames from "classnames";

import { InputWidget } from "./InputWidget";
import { ll, gg, ge } from "../helpers/debug/ll";
import { Measuring } from "../helpers/measure";

const FieldLabel = Measuring(class FieldLabel extends React.Component {
  render() {
    ll("render",this.props.text)
    return <div className="label">{this.props.text}&nbsp;</div>
  }
})

const FieldValue = Measuring(class FieldValue extends React.Component {
  render() {
    return <InputWidget value={this.props.value} onChange={this.props.onChange} />
  }
})

@observer
class BasicFieldUI extends React.Component {
  constructor(props) {
    super(props);
    this.fieldRef = React.createRef();
  }  
  onValueChange = (evt) => {
    this.props.fieldInfo.handleValueChange(evt.target.value);
  }
  render() {
    const field = this.props.fieldInfo
    ll("render",field.label, (props)=>this.props)
    return (
      <Fragment>
        <FieldLabel text={field.label} onMeasure={({width})=>field.updateLabelWidth(width)} />
        <FieldValue value={field.value} onChange={this.onValueChange} onMeasure={({width})=>field.updateValueWidth(width)}/>
      </Fragment>
    )
  }
}

@observer
export class FieldUI  extends React.Component {
  // measureSize = () => {
  //   const {width} = this.fieldRef.current.getBoundingClientRect();
  //   this.props.fieldInfo.updateFieldWidth(width);
  //   ll(this.props.fieldInfo.fieldName, ()=>width);
  // }
  // componentDidMount() {
  //   this.measureSize()
  // }
  render() {
    const field = this.props.fieldInfo
    ll("render",field.label, (props)=>this.props)
    const style = {
      left: field.location.x,
      top: field.location.y
    }
    return (
      <div className="field" ref={this.fieldRef} style={style}>
        <BasicFieldUI fieldInfo={this.props.fieldInfo}/>
      </div>
    )
  }
  // componentDidUpdate() {
  //     window.requestAnimationFrame(()=>{
  //       this.measureSize()
  //     })
  // }
} 
