import React, { Fragment } from "react";
import { observer } from "mobx-react";

import classnames from "classnames";

import { ll, gg, ge } from '../helpers/debug/ll';

import { BlockStackUI } from "./BlockUI";

// This component uses lifecycle methods to add eventlisteners for "wheel" events
// directly to its DOM element. This is because Chrome (73+) gives warnings if the wheelHandler
// is on the document-root without the option {passive:false}. It also tries to scroll 
// the entire document, with an unfortunate rubberbanding effect. But React (JSX) does not 
// allow us to use that option with events. See https://github.com/facebook/react/issues/14856.
// By installing the wheelHandlers on the editor-panel-divs themselves, we prevent Chrome from
// forcing the eventhandler to be passive, and eliminate the warnings and the rubber banding.
@observer
export class EditorPanelUI extends React.Component  { 
  constructor(props) {
    super(props);
    this.panelRef = React.createRef();
    this.currentWheelHandler = null;
  }
  displayName = "EditorPanelUI";
  render() {
    const panel = this.props.editPanelInfo
    const isDragPanel = panel.isDragPanel
    const bgClasses = classnames("editorPanelBackground", {isDragPanel})
    const stacks = panel.document.stacks.map( stackInfo => 
      <BlockStackUI stackInfo={stackInfo} key={stackInfo.debugName}/> 
    ) 
    return <div className={"editorPanel"} ref={this.panelRef} >
        <div className={bgClasses}
             style={{backgroundPositionX: -panel.viewportX,backgroundPositionY: -panel.viewportY}}/>
        <div className="canvasView" style={{transform: `translate(${-panel.viewportX}px, ${-panel.viewportY}px)`}}>
          { stacks }
        </div>
      </div>  
  }
  afterEachRender() {
    this.props.editPanelInfo.measureRef = this.panelRef
    this.props.editPanelInfo.refreshClientRect()
  }
  componentDidUpdate() {
    if(this.currentWheelHandler !== this.props.editPanelInfo.handleWheel) {
      this.panelRef.current.removeEventListener("wheel", this.currentWheelHandler);
      this.currentWheelHandler = this.props.editPanelInfo.handleWheel;
      this.panelRef.current.addEventListener("wheel", this.currentWheelHandler);  
    }
    this.afterEachRender()
  }
  componentDidMount() {
    this.currentWheelHandler = this.props.editPanelInfo.handleWheel;
    this.panelRef.current.addEventListener("wheel", this.currentWheelHandler);
    this.afterEachRender()
  }
  componentWillUnmount() {
    this.panelRef.current.removeEventListener("wheel", this.currentWheelHandler);
    this.currentWheelHandler = null;
  }
};
 