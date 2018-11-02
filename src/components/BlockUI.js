import React, { Fragment } from "react";
import ReactDOM from 'react-dom';
// import * as mx from "mobx";
import { observer, Observer } from "mobx-react";

import { Spring } from "react-spring";
import classnames from "classnames";

import { uiTracker } from '../helpers/UITracker'
import { FieldUI } from "./FieldUI"
import { ll, gg,ge } from "../helpers/debug/ll";

import { theme } from "../style/defaultStyleParams";


// This component is used to globally define some SVG filters for drop-shadows
export const BlockSVGFilters = () => {
  return  (
    <svg>
      <defs>
        <filter id="filter-blockshadow" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.25" />
        </filter>
        <filter id="filter-blockshadow-drag" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.25" />
        </filter>
      </defs>
    </svg>
  )
}
class BlockBackground extends React.Component {
  displayName = "BlockBackground";
  render() {
    gg("render BlockBackground")
    const { width, height, hover, isGhost, onStartDrag} = this.props;
    // need to extend the size to prevent clipping of dropshadow
    const extend = 30;
    const extendedWidth = width + extend;
    const extendedHeight = height + extend;
    const offsetX = -extend/2;
    const offsetY = -extend/3;
    const filterId = hover ? "filter-blockshadow-drag" : "filter-blockshadow"
    ge()
    return <svg width={extendedWidth} height={extendedHeight} 
                viewBox={`${offsetX} ${offsetY} ${extendedWidth} ${extendedHeight}`} 
                style={{ position: "absolute", top: offsetY, left: offsetX }} 
                fill="none" xmlns="http://www.w3.org/2000/svg">
        { !isGhost ? 
       <rect className="blockBackgroundShadow" x="0" y="0" width={width} height={height} rx="5" onPointerDown={onStartDrag} style={{ filter: "url(#"+filterId+")" }}/>
       : null}
        <rect className="blockBackgroundLight" x="0" y="0" width={width} height={height} rx="5" onPointerDown={onStartDrag} />
        <rect className="blockBackgroundDarker" x={theme.blockLeftTabWidth+0.5} y="0.5" width={width - theme.blockLeftTabWidth-1} height={height - 1} rx="5" />
      </svg>;
    }
};


// The core block-component, without any animation logic.
@observer
class BasicBlockUI extends React.Component {
  displayName = "BasicBlockUI";
  constructor(props) {
    super(props);
    this.headerRef = React.createRef();
  }
  measureSize= () => {
    const {width, height} = this.headerRef.current.getBoundingClientRect();
    this.props.blockInfo.newHeaderSize(width, height)
    ll(this.props.blockInfo.blockTitle, width, height);
  }
  componentDidMount() {
    this.measureSize()
  }
  render(x) {
    gg("render block")
    const { xx, yy, blockInfo:bi, isGhost, isDragged } = this.props;
    const classes = classnames("block", {ghost:isGhost});
    // add 10px to width to allow header to grow wider
    const style = {height:bi.height}
    if(isDragged) {
      style.transform = "translate(" + xx + "px," + yy + "px)"
    } else {
      style.left = xx
      style.top = yy
    }
    const fields = bi.fields.map( (field,idx) => {
        return <Fragment key={idx}>
          {' '}<FieldUI fieldInfo={field} key={field.debugName} onUpdate={this.measureSize} onFocusChange={bi.setFocus}/>
        </Fragment>
    })
    // The wierd double-span construct is needed to have the trailing space be subject
    // to .header's word-spacing for separating fields (word-spacing is disabled inside .blockTitle)
    const header = <div className="header" ref={this.headerRef}>
      <span><span className="blockTitle">{bi.blockTitle}</span> </span>
      { fields }
    </div>
    ge()
    return (
      <div className={classes} style={style} onMouseDown={bi.moveToTop}>
        <BlockBackground width={bi.width} height={bi.height} 
                         hover={isDragged} 
                         onStartDrag={bi.startDrag}
                         isGhost={isGhost} />
        {header}
      </div>
    );
  }
};


// This component renders a block that is being dragged. It handles positioning and animation of the
// dragged block.
@observer
export class DraggingBlock extends React.Component {
  displayName="DraggingBlock";
  render() {
    const { blockInfo:bi } = this.props;     
    const dragX = uiTracker.mouseX
    const dragY = uiTracker.mouseY
    switch(bi.dragState) {
      case "dragging:BeforeCorrect":
        return ReactDOM.createPortal(
          <BasicBlockUI blockInfo={bi} xx={dragX-bi.dragCorrectionX-2} yy={dragY-bi.dragCorrectionY-2} isDragged/>, 
          document.getElementById("floatPlane"));
      case "dragging:Correcting":
        return ReactDOM.createPortal(
          <Spring key="correcting" 
                  to={{xx:0,yy:0}} 
                  from={{ xx: -bi.dragCorrectionX, yy: -bi.dragCorrectionY }} 
                  delay={0}
                  onRest={bi.correctionRest}>
            {animProps => {
              return <Observer>
                        {()=><BasicBlockUI blockInfo={bi} xx={dragX+animProps.xx-2} yy={dragY+animProps.yy-2} isDragged/>}
                      </Observer>;
            }}  
          </Spring>, 
          document.getElementById("floatPlane"));
      case "dragging":
        return ReactDOM.createPortal(
          <BasicBlockUI blockInfo={bi} xx={dragX-2} yy={dragY-2}  isDragged/>, 
          document.getElementById("floatPlane")
        );
      default: throw new Error(`unexpected dragState for block "${bi.debugName}": ${bi.dragState}`)
    }
  }
};

// This component animates blocks that are not being dragged. They can change position when 
// the are attached to other blocks that are added/removed/dragged.
@observer
export class BlockUI extends React.Component {
  displayName = "BlockUI";
  render() {
    const { blockInfo:bi } = this.props;
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
}
