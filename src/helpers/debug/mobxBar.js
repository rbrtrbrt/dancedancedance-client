import React, { Fragment } from "react";
import ReactDOM from "react-dom";

// import * as mx from "mobx";
import { observer } from "mobx-react";

import { ll, gg, ge } from './ll';

let barNode;
const statusNodes = {}

function ensureMobxBar() {
  if(window.noLogging) {
    return
  }
  barNode = document.getElementById("_mobxBar_")
  if(!barNode) {
    barNode = document.createElement("div");
    barNode.id="_mobxBar_"
    document.body.append(barNode) 
  }
}

function processParams(fs) {
  if( !Array.isArray(fs) ) {
    fs = [fs]
  }
  let keyNum = 0;
  let toPrint = fs.reduce( (list,f,index) => {
    let value;
    if(typeof f !== "function") {
      value = f
    } else {
      const anonFunctionRegex = /^\s*\(?\s*(\w*)\s*\)?\s*=>\s*(.*)/
      const match = anonFunctionRegex.exec(f.toString())
      if(match) {
        const label = match[1] !== '' ? match[1] : match[2]
        list.push(<span className="name" key={keyNum++}>{label} </span>)
        value = f();
      } else {
        value = f
      }
    }
    if(typeof value === "string") {
      value = '"'+value +'"'
    }
    if( Array.isArray(value)) {
      value = "["+value.toString()+"]"
    }
    value = value === undefined ? "undefined" : value
    value = value === null ? "null" : value
    value = value.toString()
    if(window.doll) {
    }
    list.push(<span className="value" key={keyNum++}>{value} </span>)
    return list
  }, [])
  return toPrint;
}

@observer
class RealMobxStatus extends React.Component {
  constructor(props) {
    super(props);
    this.name = this.props.name +":"+ Math.floor(Math.random()*1000)
    ensureMobxBar()
  }
  render() {
    const items = processParams( this.props.children );
    if( statusNodes[this.name] ) {
      return ReactDOM.createPortal(
        <span className="title"><b>{this.props.name}: </b>{items}</span>,
        statusNodes[this.name]
      );  
    } else {
      ll("statusNode unfound for ", this.name)
      return null;
    }
  }
  componentWillMount() {
    let node = statusNodes[this.name]
    if(node) {
      barNode.removeChild(node);
      delete statusNodes[this.name]
    }
    node = document.createElement("div")
    node.classList.add("mobxStatus")
    barNode.appendChild(node)
    statusNodes[this.name] = node
  }
  componentWillUnmount() {
    let node = statusNodes[this.name]
    barNode.removeChild(node);
    delete statusNodes[this.name]
  }
}

export class MobxStatus extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
      return !window.dontLog ? <RealMobxStatus {...this.props} /> : null;
  }
}

