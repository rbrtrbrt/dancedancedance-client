import React, { Fragment } from "react";
import ReactDOM from 'react-dom';
// import * as mx from "mobx";
import { observer, Observer } from "mobx-react";

import { Spring } from "react-spring";
import classnames from "classnames";

import { InputWidget } from "./InputWidget";
import { ll, gg, ge } from "../helpers/debug/ll";

@observer
export class FieldUI  extends React.Component {
  onValueChange = (evt) => {
    this.props.fieldInfo.handleValueChange(evt.target.value);
  }
  render() {
    gg("render field")
    const field = this.props.fieldInfo
    ge()
    return (
      <div className="field">
        <div className="label">{field.label}&nbsp;</div>
        {' '}<InputWidget value={field.value} onChange={this.onValueChange} onFocusChange={this.props.onFocusChange}/>
      </div>
    )
  }
  componentDidUpdate() {
    // window.requestAnimationFrame(()=>{
      window.requestAnimationFrame(()=>{
        this.props.onUpdate() // used by parent component to re-measure its size.
      })
    // })
  }
} 
