import React, { Fragment } from "react";
import { observer } from "mobx-react";

import classnames from "classnames";

import { ll, gg, ge } from '../helpers/debug/ll';

import { BlockUI } from "./BlockUI";

@observer
export class EditorPanelUI extends React.Component  { 
  displayName = "EditorPanelUI";
  render() {
    const panel = this.props.editPanelInfo
    const isDragPanel = panel.isDragPanel
    const bgClasses = classnames("editorPanelBackground", {isDragPanel})
    const blocks = panel.document.blocks.map( blockInfo => <BlockUI blockInfo={blockInfo} key={blockInfo.debugName}/> ) 
    return <div className={"editorPanel"} ref={panel.measureRef} onWheel={panel.handleWheel} >
        <div className={bgClasses}
             style={{backgroundPositionX: panel.viewportX,backgroundPositionY: panel.viewportY}}/>
        <div className="canvasView" style={{transform: `translate(${panel.viewportX}px, ${panel.viewportY}px)`}}>
          { blocks }
        </div>
      </div>  
  }
};
 