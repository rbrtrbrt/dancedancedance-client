import React, { Fragment } from "react";
import ReactDOM from 'react-dom';
// import * as mx from "mobx";
import { observer, Observer } from "mobx-react";

import { Spring } from "react-spring";
import classnames from "classnames";

import { InputWidget } from "./InputWidget";
import { ll, gg, ge } from "../helpers/debug/ll";
import { Measuring } from "../helpers/measure";

class FieldLabel extends React.Component {
  render() {
    return <div className="label">{this.props.text}</div>
  }
}

class FieldValue extends React.Component {
  render() {
    const {value, onChange, maxWidth} = this.props;
    return <InputWidget value={value} onChange={onChange} maxWidth={maxWidth} />
  }
}

@observer
class BasicFieldUI extends React.Component {
  constructor(props) {
    super(props);
  }  
  onValueChange = (evt) => {
    this.props.fieldInfo.handleValueChange(evt.target.value);
  }
  render() {
    const field = this.props.fieldInfo
    return (
      <Fragment>
        <FieldLabel text={field.label} />
        <FieldValue value={field.value} 
                    onChange={this.onValueChange} 
                    maxWidth={field.maxValueWidth}/>
      </Fragment>
    )
  }
}

@observer
export class FieldUI  extends React.Component {

  render() {
    const { fieldInfo:field, dx=0, dy=0, extraClasses } = this.props
    const style = {
      left: field.canvasX + dx,
      top: field.canvasY +dy
    }
    const classStr = classnames("field",extraClasses)
    return (
      <div style={style} className={classStr}>
        <BasicFieldUI fieldInfo={this.props.fieldInfo}/>
      </div>
    )
  }
} 
