import React, { Fragment } from "react";
import ReactDOM from 'react-dom';
// import * as mx from "mobx";
import { observer, Observer } from "mobx-react";

import { Spring } from "react-spring";
import classnames from "classnames";

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
class BlockBackground extends React.Component {
  displayName = "BlockBackground";
  render() {
    const { width, height, hover, isGhost, onStartDrag} = this.props;
    // need to extend the size to prevent clipping of dropshadow
    const filterId = hover ? "filter-blockshadow-drag" : "filter-blockshadow"
    return <svg width={width} height={height}  
                viewBox={`0 0 ${width} ${height}`} 
                style={{ position: "absolute", top: 0, left: 0,overflow: "visible" }} 
                fill="none" xmlns="http://www.w3.org/2000/svg">
        { !isGhost ? 
       <rect className="blockBackgroundShadow" x="0" y="0" width={width} height={height} rx="5" onPointerDown={onStartDrag} style={{ filter: "url(#"+filterId+")" }}/>
       : null}
        <rect className="blockBackgroundLight" x="0" y="0" width={width} height={height} rx="5" onPointerDown={onStartDrag} />
        <rect className="blockBackgroundDarker" x={theme.blockLeftTabWidth+0.5} y="0.5" width={width - theme.blockLeftTabWidth-1} height={height - 1} rx="5" />
      </svg>;
    }
};


const BlockTitle = Measuring(class BlockTitle extends React.PureComponent {
  render() {    
    return <div className="blockTitle">{this.props.text}</div>
  }
})

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
    const { xx, yy, blockInfo:bi, isGhost, isDragged } = this.props;
    const classes = classnames("block", {ghost:isGhost});
    const style = {}
    if(isDragged) {
      style.transform = "translate(" + xx + "px," + yy + "px)"
    } else {
      style.left = xx
      style.top = yy
    }
    return (
      <div className={classes} style={style} onMouseDown={bi.moveToTop}>
        <BlockBackground width={bi.width} height={bi.height} 
                         hover={isDragged} 
                         onStartDrag={bi.startDrag}
                         isGhost={isGhost} />
        <BlockHeader blockInfo={bi}/>
      </div>
    );
  }
};


@observer 
class BasicDragBlocks extends React.Component {
  render() {
    const result = []
    for(const block of this.props.blockInfo.allBlocksBelow()) {
      result.push(
        <BasicBlockUI blockInfo={block} key={block.debugName} xx={this.props.xx} yy={this.props.yy + block.distanceFromTopBlock} isDragged/>
      )
    }
    return result
  }
}

// This component renders a block that is being dragged. It handles positioning and animation of the
// dragged block.
@observer
export class DraggingBlocks extends React.Component {
  displayName="DraggingBlocks";
  render() {
    const { blockInfo:bi } = this.props;   
    const dragX = uiTracker.mouseX
    const dragY = uiTracker.mouseY
    let result;
    switch(uiTracker.drag.correctingState) {
      case "beforeCorrect":
        result =  ReactDOM.createPortal(
          <BasicDragBlocks blockInfo={bi} xx={dragX-bi.dragCorrectionX-2} yy={dragY-bi.dragCorrectionY-2}/>, 
          document.getElementById("floatPlane"));
        break;
      case "correcting":
        result = ReactDOM.createPortal(
          <Spring key="correcting" 
                  to={{xx:0,yy:0}} 
                  from={{ xx: -bi.dragCorrectionX, yy: -bi.dragCorrectionY }} 
                  delay={0}
                  onRest={uiTracker.correctingDone}>
            {animProps => {
              return <Observer>
                        {()=><BasicDragBlocks blockInfo={bi} xx={dragX+animProps.xx-2} yy={dragY+animProps.yy-2}/>}
                      </Observer>;
            }}  
          </Spring>, 
          document.getElementById("floatPlane"));
        break;
      case "afterCorrect":
        result = ReactDOM.createPortal(
          <BasicDragBlocks blockInfo={bi} xx={dragX-2} yy={dragY-2} isDragged/>, 
          document.getElementById("floatPlane")
        );
      break;
      default: throw new Error(`unexpected dragState: ${uiTracker.drag.correctingState}`)
    }
    return result;
  }
};

// This component animates blocks that are not being dragged. They can change position when 
// the are attached to other blocks that are added/removed/dragged.
@observer
export class BlockUI extends React.Component {
  displayName = "BlockUI";
  render() {
    const { blockInfo:bi } = this.props;
    const isGhost = bi.isDragging;
    const key = isGhost ? "ghost" : "resting";
    return ( 
      <Spring key={key} 
        to={{ xx: bi.x, yy: bi.y }}
        from={{ xx: bi.x, yy: bi.y }} >
        {anim => <BasicBlockUI blockInfo={bi} xx={anim.xx} yy={anim.yy} isGhost={isGhost}/>}
      </Spring>
    )
  };
}
