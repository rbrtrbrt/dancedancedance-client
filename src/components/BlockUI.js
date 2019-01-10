import React, { Fragment } from "react";
import ReactDOM from 'react-dom';
// import * as mx from "mobx";
import { observer, Observer } from "mobx-react";

import { Spring } from "react-spring";
import classnames from "classnames";

import { CanvasModel } from "../state-tree/DocumentModel.js";
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
    const { width, height, hover, onStartDrag} = this.props;
    // need to extend the size to prevent clipping of dropshadow
    const filterId = hover ? "filter-blockshadow-drag" : "filter-blockshadow"
    return <svg width={width} height={height}  
                viewBox={`0 0 ${width} ${height}`} 
                style={{ position: "absolute", top: 0, left: 0,overflow: "visible" }} 
                fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect className="blockBackgroundDarker" x="0" y="0" width={width} height={height} rx="5" onPointerDown={onStartDrag} />
        {/* <rect className="blockBackgroundDarker" x={theme.blockLeftTabWidth+0.5} y="0.5" width={width - theme.blockLeftTabWidth-1} height={height - 1} rx="5" /> */}
      </svg>;
    }
};

class BlockStackBackground extends React.PureComponent {
  displayName = "BlockstackBackground";
  render() {
    const { x,y, width, height, hover, onStartDrag} = this.props;
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
// A block will have its own x and y, but sometimes (e.g. while dragging or animating),
// we need to show it at another location. That is what the 'dx' and 'dy' props are for.
@observer
class BasicBlockUI extends React.Component {
  displayName = "BasicBlockUI";
  render() {
    let { blockInfo:block, isDragItem, dx=0, dy=0, jump } = this.props;
    const xx = block.x + dx;
    const yy = block.y + dy;
    let style;
    if(block.isDragging) {
      style = { transform: "translate(" + xx + "px," + yy + "px)" }
    } else {
      style = { left: xx, top: yy }
    }
    const isGhost = block.isDragging && !isDragItem;
    const classes = classnames("block", {ghost:isGhost});
    let substack;
    if( block.substack ) {
      substack = <BlockStackUI key="substack" stackInfo={block.substack} dx={dx} dy={dy} isDragItem={isDragItem} jump={jump}/>
    }
    return [
      <div className={classes} style={style} onMouseUp={block.bringToTop} key="block">
        <BlockBackground width={block.width} height={block.height} 
                         hover={block.isDragging} 
                         onStartDrag={block.startDrag} />
        <BlockHeader blockInfo={block}/>
      </div>
      ,
      substack
    ];
  }
};

// This component renders a set of blocks that is being dragged. It handles positioning and animation of the
// dragged block.
@observer
export class DraggingBlocks extends React.Component {
  displayName="DraggingBlocks";
  renderDragBlocks(dx,dy) {
    const {dragBlocks} = this.props
    const result = [];
    let currDY = dy;
    for(const block of dragBlocks) {
      const key = block.debugName+"_dragging";
      result.push(<BasicBlockUI key={key} blockInfo={block} dx={dx} dy={currDY} isDragItem/>)
      // currDY += block.height
    }
    return <div className="dragShadow">{result}</div>;
  }
  render() {
    const { dragBlocks:bs } = this.props;
    const origin = uiTracker.drag.firstDragPanel.canvasToClient(0,0);   
    const dx = uiTracker.dragDeltaX + origin.x
    const dy = uiTracker.dragDeltaY + origin.y
    const dragCorrectionX = uiTracker.drag.correctionX;
    const dragCorrectionY = uiTracker.drag.correctionY;
    const blocks = new Array(bs.length);
    let result;
    switch(uiTracker.drag.phase) {
      case "beforeDrag":
        result =  ReactDOM.createPortal(
          this.renderDragBlocks(dx-2, dy-2),
          document.getElementById("floatPlane"));
        break;
      case "beforeCorrect":
        result =  ReactDOM.createPortal(
          this.renderDragBlocks(dx-2, dy-2),
          document.getElementById("floatPlane"));
        break;
      case "correcting":
        result = ReactDOM.createPortal(
          <Spring key="correcting" 
                  to={{ xx: dragCorrectionX-2, yy: dragCorrectionY-2 }} 
                  from={{xx:0,yy:0}} 
                  config={{precision: 0.5}}
                  onRest={uiTracker.correctingDone}>
            {animProps => {
              return <Observer>
                        {()=>this.renderDragBlocks(dx+animProps.xx,dy+animProps.yy)}
                      </Observer>;
            }}  
          </Spring>, 
          document.getElementById("floatPlane"));
        break;
      case "afterCorrect":
        result = ReactDOM.createPortal(
          this.renderDragBlocks(dx+dragCorrectionX-2, dy+dragCorrectionY-2),
          document.getElementById("floatPlane")
        );
      break;
      default: throw new Error(`unexpected dragState: ${uiTracker.drag.phase}`)
    }
    return result;
  }
}

@observer
export class BlockStackUI extends React.Component {
  displayName = "BlockStack";
  render() {
    const { stackInfo:stack, isDragItem, dx=0, dy=0 } = this.props;
    const jump = stack.jump || this.props.jump;
    const xx = stack.x + dx;
    const yy = stack.y + dy;
    const stackKey = stack.debugName;
    const needsBackground = stack.isCanvasChild ? 1 : 0;
    const allItems = new Array(stack.blocks.length + needsBackground);
    if(needsBackground) {
      allItems[0] = 
        <Spring key={stackKey} 
          immediate={jump}
          from={{ xx: xx, yy: yy, ww: stack.width, hh: stack.height }} 
          to={{ xx: xx, yy: yy, ww: stack.width, hh: stack.height }} >
            {anim => <BlockStackBackground
              x={anim.xx} y={anim.yy}
              width={anim.ww} height={anim.hh} />
            }
        </Spring>    
    }
    stack.blocks.forEach( (block,idx) => {
      const blockKey = block.debugName
      ll("render block in stack", blockKey, ()=>jump);
      allItems[idx+needsBackground] = 
        <Spring key={blockKey+idx} 
          immediate={jump}
          from={{ xx: block.x, yy: block.y }} 
          to={{ xx: block.x, yy: block.y }} >
          {anim => <BasicBlockUI blockInfo={block} dx={anim.xx-block.x+dx} dy={anim.yy-block.y+dy} isDragItem={isDragItem} jump={jump}/>}
        </Spring>
    })
    return allItems;
  }
  componentDidMount() {
    this.props.stackInfo.resetJumpFlag()
  }
  componentDidUpdate() {
    this.props.stackInfo.resetJumpFlag()
  }
}
