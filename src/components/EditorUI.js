import React, { Fragment } from "react";
import ReactDOM from "react-dom";
import * as mx from "mobx";
import { observer } from "mobx-react";

import classnames from "classnames";

import { ll, gg, ge } from '../helpers/debug/ll';

import { BlockUI } from "./BlockUI";

import { uiTracker } from '../helpers/UITracker';

@observer
export class EditorPanelUI extends React.Component  { 
  displayName = "EditorPanelUI";
  render() {
    const panel = this.props.editPanelInfo
    const isDragPanel = panel === uiTracker.dragPanel
    const bgClasses = classnames("editorPanelBackground", {isDragPanel})
    return <div className={"editorPanel"} ref={panel.measureRef} onWheel={panel.handleWheel} >
        <div className={bgClasses}
             style={{backgroundPositionX: panel.viewportX,backgroundPositionY: panel.viewportY}}/>
        <div className="canvasView" style={{transform: `translate(${panel.viewportX}px, ${panel.viewportY}px)`}}>
          { panel.canvas.blocks.map( blockInfo => <BlockUI blockInfo={blockInfo} key={blockInfo.debugName}/> ) }
        </div>
      </div>  
  }
};
 