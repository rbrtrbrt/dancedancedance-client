import React, { Fragment } from "react";
import ReactDOM from "react-dom";

// import * as mx from "mobx";
import { observer } from "mobx-react";
import DevTools from "mobx-react-devtools";

import mousetrap from "mousetrap";
import classnames from "classnames";

// import { detect } from "detect-browser";
// const currentBrowser = detect();
// console.log("BROWSER:", currentBrowser);

import { EditorPanelUI } from "./EditorUI";
import { DraggingBlocks, BlockSVGFilters } from "./BlockUI";

import { MobxBar, MobxStatus } from '../helpers/debug/mobxBar';
import { uiTracker } from '../helpers/UITracker';

window.noLogging = false

@observer
export class AppUI extends React.Component {
  displayName = "AppUI";

  renderDebugComponents() {
    const editors = [this.props.appInfo.editor1,this.props.appInfo.editor2] 
    const editorStatuses = editors.map( e => {
      return <MobxStatus name={e.debugName} key={e.debugName}>
        {(vpx)=>e.viewportX}
        {(vpy)=>e.viewportY}
      </MobxStatus>
    });
    const blockStatuses = this.props.appInfo.document.blocks.map( b => {
      return <MobxStatus name={b.debugName}  key={b.debugName}>
        {(x)=>b.x}
        {(y)=>b.y}
      </MobxStatus>
    });
    
    const uiTrackerStatus = [
      <MobxStatus name="mouse" key="uiTracker">
        {(x)=>uiTracker.mouseX}
        {(y)=>uiTracker.mouseY}
      </MobxStatus>
    ];
    if(uiTracker.drag) {
      const {x,y} = uiTracker.canvasDragLocation
      uiTrackerStatus.push(
        <MobxStatus name="drag" key="uiTracker.drag">
          {(cx)=>x}
          {(cy)=>y}
          {(drag)=>uiTracker.drag.correctingState}
        </MobxStatus>
      )
    }
    return [...editorStatuses, ...blockStatuses, ...uiTrackerStatus, <DevTools key="devtools" />];
  }

  render() {
    const appInfo = this.props.appInfo
    return <Fragment>
        <BlockSVGFilters/>
        <div className="editorArea">
          <EditorPanelUI editPanelInfo={appInfo.editor1} key={appInfo.editor1.debugName}/>
          <EditorPanelUI editPanelInfo={appInfo.editor2} key={appInfo.editor2.debugName}/>
        </div>
        { uiTracker.drag ? <DraggingBlocks blockInfo={uiTracker.drag.item}/> : null }
        {this.renderDebugComponents()}
      </Fragment>;
  }
};

