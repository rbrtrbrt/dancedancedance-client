import React, { Fragment } from "react";
import ReactDOM from "react-dom";

// import * as mx from "mobx";
import { observer } from "mobx-react";

import DevTools from "mobx-react-devtools";

import { Spring } from "react-spring";
import mousetrap from "mousetrap";
import classnames from "classnames";


// import { detect } from "detect-browser";
// const currentBrowser = detect();
// console.log("BROWSER:", currentBrowser);

import { appModel } from "../state-tree/BlockModel";
import { DraggingBlock, BlockUI, BlockSVGFilters } from "./BlockUI";

import { MobxBar, MobxStatus } from '../helpers/debug/mobxBar';
import { mouseTracker } from '../helpers/mouseTracker'

window.noLogging = false

/*
███    ███  ██████  ██████  ███████ ██      ███████
████  ████ ██    ██ ██   ██ ██      ██      ██
██ ████ ██ ██    ██ ██   ██ █████   ██      ███████
██  ██  ██ ██    ██ ██   ██ ██      ██           ██
██      ██  ██████  ██████  ███████ ███████ ███████
*/

/*
We want editors to have multiple views on page. Even very small views
should be  supported, and dnd from other webpages. (The pallette could,
conceivibly, be just another web-page, mixing available blocks with
explanation or other UI) Editor views on a page share the location of the
mouse-cursor, needed to  support intelligent drag and drop interactions.

A Block has several Fields. Fields can be 'inline' (text, number,select,
reference), 'flag' (bool), 'container' for other blocks or `compound` (grouping
other fields). Fields can be required, required with (calculated) default,
strong optional (visible, but deletable) or weak optional (initially not
visible). Fields can have multiplicity: one, one-or-more, possibly bounded?
A field always has a name.


Blocks do not enforce a strict sequencing of inline fields. There is a 'defined'
or 'canonical' sequence, which can be attained using a clean-up command.
  --or--
There is a light concept of sequence, giving each field a place in a start, middle
or end?
  --or--
Multiple variants: overloading??

Blocks have a defined semantics coming from a 'definition' in a 'language'.
This language can live online, but it should be versioned. Online languages
could provide a 'piece of pallette', but should also provide search
capabilities. Perhaps even Language Server Protocol like features. Could we
sandbox such a server, and have it run client-side? perhaps in a web-worker?

Fields can be stand-alone entities, but without inherent semantics.
They can be copied and dropped on other blocks, taking on a role within the new
block that "matches" the field most closely. Dropping a field on another field
could copy just the value?

Blocks and Fields are 'canvas dwellers'


*/


//=======================================================
//=                                                     =
//=   Editor                                            =
//=                                                     =
//=======================================================


let EditorPanel = ({editPanelInfo}) => { 
    const panel = editPanelInfo
    return <div className="editorPanel" ref={panel.measureRef} onWheel={panel.handleWheel} 
                style={{backgroundPositionX: panel.viewportX,backgroundPositionY: panel.viewportY}}>
      <div className="canvasView" style={{left:panel.viewportX,top:panel.viewportY}}>
        { panel.canvas.blocks.map( blockInfo => <BlockUI blockInfo={blockInfo} key={blockInfo.name}/> ) }
      </div>
    </div>;
};
EditorPanel.displayName = "EditorPanel";
EditorPanel = observer(EditorPanel);

let App = ({appInfo}) => {
  const m = mouseTracker
  let editors = [appInfo.editor1,appInfo.editor2] 
  let stats = editors.map( e => {
    return <MobxStatus name={e.name} key={e.name}>
      {(vpx)=>e.viewportX}
      {(vpy)=>e.viewportY}
    </MobxStatus>
  })
  stats = stats.concat( appInfo.canvas.blocks.map( b => {
    return <MobxStatus name={b.name}  key={b.name}>
      {(x)=>b.x}
      {(y)=>b.y}
      {b.dragState}
    </MobxStatus>
  }))
  const qqq = mouseTracker.dragItem ? <DraggingBlock blockInfo={mouseTracker.dragItem}/> : null
  return <Fragment>
      <BlockSVGFilters/>
      <div className="editorArea">
        <EditorPanel editPanelInfo={appInfo.editor1}/>
        <EditorPanel editPanelInfo={appInfo.editor2}/>
      </div>
      { mouseTracker.dragItem ? <DraggingBlock blockInfo={mouseTracker.dragItem}/> : null }
      <DevTools />
      <MobxStatus name="mouse">
        {(x)=>m.mouseX}
        {(y)=>m.mouseY}
      </MobxStatus>
      {stats}
    </Fragment>;
};
App.displayName = "App";
App = observer(App);

export default ()=><App appInfo={appModel}/>;


