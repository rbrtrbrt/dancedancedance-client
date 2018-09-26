import React, { Fragment } from "react";
// import * as mx from "mobx";
import { observer } from "mobx-react";

import DevTools from "mobx-react-devtools";
import makeInspectable from "mobx-devtools-mst";

import { Spring } from "react-spring";
import mousetrap from "mousetrap";
import classnames from "classnames";

import { detect } from "detect-browser";
const currentBrowser = detect();
console.log("BROWSER:", currentBrowser);

import { BlockModel } from "../state-tree/BlockModel";
import ll from "../helpers/ll";

window.myBlock = BlockModel.create({ anchor: { x: 100, y: 100 }});
makeInspectable(window.myBlock);
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

const BlockBackground = ({ width, height, hover }) => {
  const extend = 30;
  const extendedWidth = width + extend;
  const extendedHeight = height + extend;
  const offsetX = -extend/2;
  const offsetY = -extend/3;
  const shadowStdDev = hover ? 4 : 2;
  return <svg width={extendedWidth} height={extendedHeight} viewBox={`${offsetX} ${offsetY} ${extendedWidth} ${extendedHeight}`} style={{ position: "absolute", top: offsetX, left: offsetY }} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" height="200%" width="200%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy={shadowStdDev/ 2} stdDeviation={shadowStdDev} floodOpacity="0.25" />
        </filter>
      </defs>
      <rect className="block-background-light" width={width} height={height} rx="5" style={{ filter: "url(#shadow)" }} />
      <rect className="block-background-darker" x="20.5" y="0.5" width={width - 21} height={height - 1} rx="5" />
    </svg>;
};

//=======================================================
//=                                                     =
//=   BlockUI                                           =
//=                                                     =
//=======================================================

const BasicBlockUI = observer(({ xx, yy, model }) => {
  return (
    <div className="block" style={{ top: yy, left: xx }} onPointerDown={model.startDrag} >
      <BlockBackground width={model.width} height={model.height} hover={model.isDragging}/>
    </div>
  );
});
// make it animate its position
const AnimBlockUI = ({ model }) => (
  <Spring to={{ xx: model.x, yy: model.y }}>
    {anim => <BasicBlockUI model={model} xx={anim.xx} yy={anim.yy} />}
  </Spring>
);
// make it MobX observer
const BlockUI = observer(AnimBlockUI);

//=======================================================
//=                                                     =
//=   Editor                                            =
//=                                                     =
//=======================================================

const EditorPane = props => {
  return <div className="editor">
      <BlockUI model={myBlock} />
    </div>;
};

const App = props => {
  return <Fragment>
      <DevTools />
      <EditorPane />
    </Fragment>;
};

export default App;
