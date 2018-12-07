import React, { Fragment } from "react";
import ReactDOM from 'react-dom';
// import * as mx from "mobx";
import { observer, Observer } from "mobx-react";

import { Spring } from "react-spring";
import classnames from "classnames";

import {AnchorOnCanvas} from "../state-tree/BlockModel";
import { uiTracker } from '../helpers/UITracker'
import { FieldUI } from "./FieldUI"
import { ll, gg, ge, checkDef } from "../helpers/debug/ll";

import { theme } from "../style/defaultStyleParams";
import { Measuring } from "../helpers/measure";


// This component is used to globally define some SVG filters for drop-shadows
export const BlockSVGFilters = () => {
  return  (
    <svg>
      <defs>
        <filter id="filter-blockshadow" filterUnits="objectBoundingBox">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.25" />
        </filter>
        <filter id="filter-blockshadow-drag" filterUnits="objectBoundingBox" x="-20%" y="-50%" width="150%" height="220%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.25" />
        </filter>
      </defs>
    </svg>
  )
}
class BlockBackground extends React.PureComponent {
  displayName = "BlockBackground";
  render() {
    const { width, height, hover, isGhost, onStartDrag} = this.props;
    // need to extend the size to prevent clipping of dropshadow
    const filterId = hover ? "filter-blockshadow-drag" : "filter-blockshadow"
    return <svg width={width} height={height}  
                viewBox={`0 0 ${width} ${height}`} 
                style={{ position: "absolute", top: 0, left: 0,overflow: "visible" }} 
                fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* { !isGhost ? 
       <rect className="blockBackgroundShadow" x="0" y="0" width={width} height={height} rx="5" onPointerDown={onStartDrag} style={{ filter: "url(#"+filterId+")" }}/>
       : null} */}
        <rect className="blockBackgroundLight" x="0" y="0" width={width} height={height} rx="5" onPointerDown={onStartDrag} />
        <rect className="blockBackgroundDarker" x={theme.blockLeftTabWidth+0.5} y="0.5" width={width - theme.blockLeftTabWidth-1} height={height - 1} rx="5" />
      </svg>;
    }
};

class BlockStackBackground extends React.PureComponent {
  displayName = "BlockstackBackground";
  render() {
    const { x,y, width, height, hover, isGhost, onStartDrag} = this.props;
    // need to extend the size to prevent clipping of dropshadow
    const filterId = hover ? "filter-blockshadow-drag" : "filter-blockshadow"
    return <svg width={width} height={height}  
                viewBox={`0 0 ${width} ${height}`} 
                style={{ position: "absolute", left: x, top: y, overflow: "visible" }} 
                fill="none" xmlns="http://www.w3.org/2000/svg">
       <rect className="blockBackgroundShadow" x="0" y="0" width={width} height={height} rx="5" onPointerDown={onStartDrag} style={{ filter: "url(#"+filterId+")" }}/>
    </svg>;
    }
};




const BlockTitle = Measuring(class BlockTitle extends React.PureComponent {
  render() {    
    return <div className="blockTitle">{this.props.text}</div>
  }
})

@observer
class BlockHeader extends React.Component {
  displayName = "BlockHeader";
  render() {
    const { blockInfo:bi } = this.props;
    const fields = bi.fields.map( (field,idx) => {
        return <Fragment key={idx}>
          <FieldUI fieldInfo={field} key={field.debugName} />
        </Fragment>
    })
    // The wierd double-span construct is needed to have the trailing space be subject
    // to .header's word-spacing for separating fields (word-spacing is disabled inside .blockTitle)
    // return <div className="header" ref={this.headerRef}>
    return <div className="header">
      <BlockTitle text={bi.blockTitle} onMeasure={({width})=>bi.updateTitleWidth(width)}/>
      { fields }
    </div>
  }
}

// The core block-component, without any animation logic.
@observer
class BasicBlockUI extends React.Component {
  displayName = "BasicBlockUI";
  render() {
    const { xx, yy, blockInfo:bi, isGhost } = this.props;
    const classes = classnames("block", {ghost:isGhost});
    const style = {}
    if(bi.isDragging) {
      style.transform = "translate(" + xx + "px," + yy + "px)"
    } else {
      style.left = xx
      style.top = yy
    }
    return (
      <div className={classes} style={style} onMouseDown={bi.moveToTop}>
        <BlockBackground width={bi.width} height={bi.blockHeight} 
                         hover={bi.isDragging} 
                         onStartDrag={bi.startDrag}
                         isGhost={isGhost} />
        <BlockHeader blockInfo={bi}/>
      </div>
    );
  }
};

// This component renders a block that is being dragged. It handles positioning and animation of the
// dragged block.
@observer
export class DraggingBlocks extends React.Component {
  displayName="DraggingBlocks";
  render() {
    const { blockInfo:bi } = this.props;   
    const dragX = uiTracker.mouseX
    const dragY = uiTracker.mouseY
    const dragCorrectionX = uiTracker.drag.correctionX;
    const dragCorrectionY = uiTracker.drag.correctionY;
    let result;
    switch(uiTracker.drag.correctingState) {
      case "beforeDrag":
        result =  ReactDOM.createPortal(
          <BlockUI blockInfo={bi} xx={dragX+dragCorrectionX-2} yy={dragY+dragCorrectionY-2} isDragItem/>, 
          document.getElementById("floatPlane"));
        break;
      case "correcting":
        result = ReactDOM.createPortal(
          <Spring key="correcting" 
                  from={{ xx: dragCorrectionX-2, yy: dragCorrectionY-2 }} 
                  to={{xx:0,yy:0}} 
                  config={{precision: 0.5}}
                  onRest={uiTracker.correctingDone}>
            {animProps => {
              return <Observer>
                        {()=><BlockUI blockInfo={bi} xx={dragX+animProps.xx} yy={dragY+animProps.yy} isDragItem/>}
                      </Observer>;
            }}  
          </Spring>, 
          document.getElementById("floatPlane"));
        break;
      case "afterCorrect":
        result = ReactDOM.createPortal(
          <BlockUI blockInfo={bi} xx={dragX-2} yy={dragY-2} isDragItem/>, 
          document.getElementById("floatPlane")
        );
      break;
      default: throw new Error(`unexpected dragState: ${uiTracker.drag.correctingState}`)
    }
    return result;
  }
}


// A block will have its own x and y, but sometime (e.g. while dragging or animating),
// we need to show it at another location. That is what the xx and yy props are for.
@observer
export class BlockUI extends React.Component {
  displayName = "BlockUI";
  render() {
    let { blockInfo:bi, xx,yy,isDragItem, isBelowBlock } = this.props;
    const xAdjustment = xx ? xx-bi.x : 0;
    const yAdjustment = yy ? yy-bi.y : 0;
    const yDropRoom = bi.dropRoomNeeded && bi.dropRoomIsAbove ? bi.dropRoomNeeded : 0
    const isGhost = bi.isDragging && !isDragItem;
    const key = isGhost ? "ghost" : "resting";
    const isTopBlock = bi.anchor instanceof AnchorOnCanvas;
    // create the background for a blockstack on the canvas.
    let stackBackground = null;
    if(isTopBlock) {
      const {width,height} = bi.stackDimensions;
      stackBackground = <Spring key={key+"_background"} 
          immediate ={bi.isDragging}
          to={{ xx: bi.x+xAdjustment, yy: bi.y+yAdjustment }}
          from={{ xx: bi.x, yy: bi.y }} >
            {anim => <BlockStackBackground
              key="stackBackground"
              x={anim.xx} y={anim.yy}
              width={width} height={height} 
              hover={bi.isDragging} 
              onStartDrag={bi.startDrag}
              isGhost={isGhost} />
            }
        </Spring>
    }
    const thisBlock = 
      <Spring key={key} 
        immediate ={bi.isDragging}
        to={{ xx: bi.x+xAdjustment, yy: bi.y+yAdjustment+yDropRoom }}
        from={{ xx: bi.x, yy: bi.y }} >
        {anim => <BasicBlockUI blockInfo={bi} xx={anim.xx} yy={anim.yy} isGhost={isGhost}/>}
      </Spring>
    let restBlocks;
    const bbl = bi.blockBelow
    if(bi.blockBelow) {
      restBlocks = <BlockUI blockInfo={bbl} key={bbl.debugName} xx={bbl.x+xAdjustment} yy={bbl.y+yAdjustment} isDragItem={isDragItem} isBelowBlock/>
    }
    return [
      stackBackground,
      thisBlock,
      restBlocks
    ]
  };
}