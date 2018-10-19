import React, { Fragment } from "react";
import ReactDOM from 'react-dom';

// import * as mx from "mobx";
import { observer, Observer } from "mobx-react";

import { Spring } from "react-spring";

import classnames from "classnames";

import { BlockModel } from "../state-tree/BlockModel";

import { MobxBar, MobxStatus } from '../helpers/debug/mobxBar';
import { mouseTracker } from '../helpers/mouseTracker'
import ll from "../helpers/debug/ll";

export const BlockSVGFilters = () => {
  return  (
    <svg>
      <defs>
        <filter id="filter-blockshadow" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.25" />
        </filter>
        <filter id="filter-blockshadow-drag" height="200%" width="200%" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.25" />
        </filter>
      </defs>
    </svg>
  )
}

let BlockBackground = ({ width, height, hover, startDrag, isGhost }) => {
  const extend = 30;
  const extendedWidth = width + extend;
  const extendedHeight = height + extend;
  const offsetX = -extend/2;
  const offsetY = -extend/3;
  const filterId = hover ? "filter-blockshadow-drag" : "filter-blockshadow"

  return <svg width={extendedWidth} height={extendedHeight} 
              viewBox={`${offsetX} ${offsetY} ${extendedWidth} ${extendedHeight}`} 
              style={{ position: "absolute", top: offsetY, left: offsetX }} 
              fill="none" xmlns="http://www.w3.org/2000/svg">
      { !isGhost ? 
     <rect className="blockBackgroundShadow" x="0" y="0" width={width} height={height} rx="5" onPointerDown={startDrag} style={{ filter: "url(#"+filterId+")" }}/>
     : null}
      <rect className="blockBackgroundLight" x="0" y="0" width={width} height={height} rx="5" onPointerDown={startDrag} />
      <rect className="blockBackgroundDarker" x="20.5" y="0.5" width={width - 21} height={height - 1} rx="5" />
    </svg>;
};
BlockBackground.displayName = "BlockBackground"

//=======================================================
//=                                                     =
//=   BlockUI                                           =
//=                                                     =
//=======================================================

let BasicBlockUI = ({ xx, yy, blockInfo, isGhost }) => {
  const bi = blockInfo
  const classes = classnames("block", {ghost:isGhost});
  return (
    <div className={classes} style={{ top: yy, left: xx, width: bi.width, height:bi.height}} >
      <BlockBackground width={bi.width} height={bi.height} 
                       hover={bi.dragState !== "notDragging"} 
                       startDrag={bi.startDrag}
                       isGhost={isGhost} />
      <div className="header" >I am {bi.name}</div>
    </div>
  );
};
BasicBlockUI.displayName = "BasicBlockUI";
BasicBlockUI = observer(BasicBlockUI);

export let DraggingBlock = ({ blockInfo }) => {
  const bi = blockInfo
  const dragX = mouseTracker.mouseX
  const dragY = mouseTracker.mouseY
  switch(bi.dragState) {
    case "dragging:BeforeCorrect":
      return ReactDOM.createPortal(
        <BasicBlockUI blockInfo={bi} xx={dragX-bi.dragCorrectionX-2} yy={dragY-bi.dragCorrectionY-2} />, 
        document.getElementById("dndPlane"));
    case "dragging:Correcting":
      return ReactDOM.createPortal(
        <Spring key="correcting" 
                to={{xx:0,yy:0}} 
                from={{ xx: -bi.dragCorrectionX, yy: -bi.dragCorrectionY }} 
                delay={0}
                onRest={bi.correctionRest}>
          {animProps => {
            return <Observer>
                      {()=><BasicBlockUI blockInfo={bi} xx={dragX+animProps.xx-2} yy={dragY+animProps.yy-2} />}
                    </Observer>;
          }}  
        </Spring>, 
        document.getElementById("dndPlane"));
    case "dragging":
      return ReactDOM.createPortal(
        <BasicBlockUI blockInfo={bi} xx={dragX-2} yy={dragY-2} />, 
        document.getElementById("dndPlane")
      );
    default: throw new Error(`unexpected dragState for block "${bi.name}": ${bi.dragState}`)
  }
};
DraggingBlock.displayName="DraggingBlock"
DraggingBlock = observer(DraggingBlock);

// make it animate its position
const AnimBlockUI = ({ blockInfo }) => {
  const bi = blockInfo
  const isGhost = bi.dragState !== "notDragging"
  const key = isGhost ? "ghost" : "resting";
  return ( 
    <Spring key={key} 
      to={{ xx: bi.x, yy: bi.y }}
      from={{ xx: bi.x, yy: bi.y }} >
      {anim => <BasicBlockUI blockInfo={bi} xx={anim.xx} yy={anim.yy} isGhost={isGhost}/>}
    </Spring>
  )
};
  
// make it MobX observer
export const BlockUI = observer(AnimBlockUI);