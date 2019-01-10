import React, { Fragment } from "react";
import { observer } from "mobx-react";

import classnames from "classnames";

import { ll, gg, ge } from '../helpers/debug/ll';

import { BlockStackUI } from "./BlockUI";

@observer
export class EditorPanelUI extends React.Component  { 
  displayName = "EditorPanelUI";
  render() {
    const panel = this.props.editPanelInfo
    const isDragPanel = panel.isDragPanel
    const bgClasses = classnames("editorPanelBackground", {isDragPanel})
    const stacks = panel.document.stacks.map( stackInfo => 
      <BlockStackUI stackInfo={stackInfo} key={stackInfo.debugName}/> 
    ) 
    return <div className={"editorPanel"} ref={panel.measureRef} onWheel={panel.handleWheel} >
        <div className={bgClasses}
             style={{backgroundPositionX: -panel.viewportX,backgroundPositionY: -panel.viewportY}}/>
        <div className="canvasView" style={{transform: `translate(${-panel.viewportX}px, ${-panel.viewportY}px)`}}>
          { stacks }
        </div>
      </div>  
  }
  componentDidMount() {
    this.props.editPanelInfo.refreshClientRect()
  }
  componentDidUpdate() {
    this.props.editPanelInfo.refreshClientRect()
  }
};
 