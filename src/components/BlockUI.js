import React, { Fragment } from "react";
import ReactDOM from 'react-dom';
// import * as mx from "mobx";
import * as mxu from "mobx-utils";
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
@observer
class BlockBackground extends React.Component {
  displayName = "BlockBackground";
  
  onStartDrag = (evt) => {
    ll(111,"klik", this.props.blockInfo.blockTitle)
    this.props.blockInfo.startDrag(evt)
  }

  simpleBackground(block, stroke=false) {
    let strokeOffset = stroke ? theme.blockMargin/2 : 0; // strokeOffset
    let result = <rect x={-strokeOffset} y={-strokeOffset} 
                       width={block.width+strokeOffset*2} 
                       height={block.height+strokeOffset*2} 
                       rx={theme.blockCornerRadius+strokeOffset} 
                       onPointerDown={this.onStartDrag} />
    return result;                  
  }

  complexPath(block,stroke=false) {
    let strokeOffset = stroke ? theme.blockMargin/2 : 0; // strokeOffset
    let cornerRadius = theme.blockCornerRadius;
    
    // top-right of fieldset
    let corner1 = `a ${cornerRadius+strokeOffset},${cornerRadius+strokeOffset} 0 0 1  ${cornerRadius+strokeOffset}, ${cornerRadius+strokeOffset}\n`
    // bottom-right of fieldset
    let corner2 = `a ${cornerRadius+strokeOffset},${cornerRadius+strokeOffset} 0 0 1 -${cornerRadius+strokeOffset}, ${cornerRadius+strokeOffset}\n`
    // top-left of stack
    let corner3 = `a ${cornerRadius-strokeOffset},${cornerRadius-strokeOffset} 0 0 0 -${cornerRadius-strokeOffset}, ${cornerRadius-strokeOffset}\n`
    // bottom-left of stack
    let corner4 = `a ${cornerRadius-strokeOffset},${cornerRadius-strokeOffset} 0 0 0  ${cornerRadius-strokeOffset}, ${cornerRadius-strokeOffset}\n`
    // bottom-left of final arm
    let corner5 = `a ${cornerRadius+strokeOffset},${cornerRadius+strokeOffset} 0 0 1 -${cornerRadius+strokeOffset},-${cornerRadius+strokeOffset}\n`
    // top-left of fieldset
    let corner6 = `a ${cornerRadius+strokeOffset},${cornerRadius+strokeOffset} 0 0 1  ${cornerRadius+strokeOffset},-${cornerRadius+strokeOffset}\n`
    
    //const {width,height,fieldPositions, stackPositions} = block.segmentsLayout
    
    let path = `M ${theme.blockVerticalArmWidth+cornerRadius},-${strokeOffset}\n`

    block.segments.forEach( ({fieldSet,stack})=> {
      const fieldsHeight = fieldSet.height + 2 * theme.blockContentPaddingY;
      const stackHeight = stack.height + 2*theme.blockMargin;
      const fieldsWidth = fieldSet.width + theme.blockContentPaddingLeft + theme.blockContentPaddingRight;
      // path segments
      const fieldsTop = `h ${ fieldsWidth -theme.blockVerticalArmWidth- 2*cornerRadius}\n` + corner1
      const fieldsRight = `v ${fieldsHeight - 2*cornerRadius}\n` + corner2
      const fieldsBottom = `h ${-(fieldsWidth-theme.blockVerticalArmWidth-2*cornerRadius)}\n` + corner3
      const stackLeft = `v ${stackHeight - 2*cornerRadius}\n` + corner4
      path += fieldsTop + fieldsRight + fieldsBottom + stackLeft
    })
    path += `H ${block.finalArmWidth - cornerRadius}\n` + corner1
    path += `v ${theme.blockFinalArmHeight - 2* cornerRadius}\n` + corner2
    path += `H ${cornerRadius}\n` + corner5
    path += `V ${cornerRadius}\n` + corner6 + "Z"
    return path;         
  }

  complexBackground(block, classStr) {
    return <path d={this.complexPath(block)} onPointerDown={block.startDrag}/>
  }

  render() {
    const {blockInfo:block, dx=0, dy=0, extraClasses={}} = this.props;
    const classStr = classnames("blockBackground",extraClasses)
    const needsStroke = extraClasses.isHoverBlock || extraClasses.isDragItem
    let shape;
    if(block.segments.length == 1 && block.segments[0].stack == undefined) {
      shape = this.simpleBackground(block,needsStroke)
    } else {
      shape = this.complexBackground(block,needsStroke)
    }
    //todo: need to extend the size to prevent clipping of dropshadow
    const filterId = block.isDragging ? "filter-blockshadow-drag" : "filter-blockshadow"
    return <svg width={block.width} height={block.height} 
                className={classStr} 
                viewBox={`0 0 ${block.width} ${block.height}`} 
                style={{ position: "absolute", top: block.canvasY+dy, left: block.canvasX+dx,overflow: "visible" }} 
                fill="none" xmlns="http://www.w3.org/2000/svg">
        {shape}
      </svg>;
    }
};

class BlockStackBackground extends React.PureComponent {
  displayName = "BlockstackBackground";
  render() {
    const { x,y, width, height, isDragging, onStartDrag, extraClasses={}} = this.props;
    const classStr = classnames("blockStackBackground",extraClasses)
    // need to extend the size to prevent clipping of dropshadow
    const filterId = isDragging ? "filter-blockshadow-drag" : "filter-blockshadow"
    return <svg width={width} height={height}  
                viewBox={`0 0 ${width} ${height}`} 
                className={classStr}
                style={{ position: "absolute", left: x, top: y, overflow: "visible" }} 
                fill="none" xmlns="http://www.w3.org/2000/svg">
       <rect className="blockStackBackground" className={classStr} x="0" y="0" width={width} height={height} rx="5" onPointerDown={onStartDrag} style={{ filter: "url(#"+filterId+")" }}/>
    </svg>;
    }
};




const BlockTitle = Measuring(class BlockTitle extends React.PureComponent {
  render() {    
    const {x,y,text, extraClasses} = this.props;
    const classStr = classnames("blockTitle", extraClasses);
    return <div className={classStr} style={{top: y, left:x}}>{text}</div>
  }
})

const BlockFinalLabel = Measuring(class BlockFinalLabel extends React.PureComponent {
  render() {    
    const {x,y,text, extraClasses} = this.props;
    const classStr = classnames("blockFinalLabel",extraClasses);
    return <div className={classStr} style={{top: y, left:x}}>{text}</div>
  }
})


@observer
class FieldSetUI extends React.Component {
  displayName = "FieldSetUI";
  render() {
    const { fieldSet, dx=0, dy=0, extraClasses } = this.props;
    const fields = fieldSet.fields.map( (field,idx) => {
        return <FieldUI fieldInfo={field} key={field.debugName} dx={dx} dy={dy} extraClasses={extraClasses}/>
    })
    if(fieldSet.title == "Exit program") {
    }
    return <Fragment>
      <BlockTitle text={fieldSet.title} x={fieldSet.canvasX+dx} y={fieldSet.canvasY+dy}  onMeasure={({width})=>fieldSet.updateTitleWidth(width)} extraClasses={extraClasses}/>
      { fields }
    </Fragment>
  }
}

// The core block-component, without any animation logic.
// A block will have its own x and y, but sometimes (e.g. while dragging or animating),
// we need to show it at another location. That is what the 'dx' and 'dy' props are for.
@observer
class BasicBlockUI extends React.Component {
  displayName = "BasicBlockUI";
  render() {
    let { blockInfo:block, isDragItem, dx=0, dy=0, jump, extraClasses } = this.props;
    const isGhost = block.isDragging && !isDragItem;
    const isNestingLevelOdd = block.blockDepth % 2 === 1;
    const isHoverBlock = mxu.expr(()=>uiTracker.hoverBlock === block) 
                       && !isGhost && !isDragItem
    extraClasses = { ...extraClasses, isGhost, isNestingLevelOdd, isHoverBlock, isDragItem }
    const fieldsetsJSX = block.segments.map( segm => 
      <FieldSetUI key={segm.fieldSet.id} extraClasses={extraClasses} fieldSet={segm.fieldSet} dx={dx} dy={dy}/> 
    );
    const substacksJSX = block.segments
                          .filter( segm=>segm.stack !=undefined )
                          .map( segm =>
          <BlockStackUI key={segm.stack.id} extraClasses={extraClasses} stackInfo={segm.stack} dx={dx} dy={dy} isDragItem={isDragItem} jump={jump}/>
    );
    const needsFinalLabel = block.segments[block.segments.length-1].stack != undefined
    let finalLabelJSX;
    if(needsFinalLabel) {
      finalLabelJSX = <Spring key={"final_"+block.id} 
          immediate={jump || isDragItem}
          from={{ xx: block.finalLabelCanvasPosition.x+dx, yy: block.finalLabelCanvasPosition.y+dy }} 
          to={{ xx: block.finalLabelCanvasPosition.x+dx, yy: block.finalLabelCanvasPosition.y+dy }} >
          {anim => <BlockFinalLabel text={block.finalArmLabel} 
                                x={anim.xx} 
                                y={anim.yy} 
                                extraClasses={extraClasses} 
                                onMeasure={({width})=>block.updateFinalArmWidth(width)} 
               />  
          }
        </Spring>
    }
    const backgroundJSX = <BlockBackground 
                            blockInfo={block} 
                            key={block.id} 
                            dx={dx} 
                            dy={dy} 
                            extraClasses={extraClasses}/>
    return isHoverBlock ?   // The hoverblock throws a shadow, and needs to
      [ ...substacksJSX,    // be rendered _after_ its children to prevent children
        backgroundJSX,      // from overlapping hoverblock.
        ...fieldsetsJSX,
        finalLabelJSX
      ]
    : [ backgroundJSX,      // If this block is not the hoverblock, render it
        ...fieldsetsJSX,    // _before_ children, because one of the chidren
        finalLabelJSX,      // could be the hoverblock, and must parent must not
        ...substacksJSX     // overlap it.
      ]
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
    return <div className="draggingBlocks">{result}</div>;
  }
  render() {
    const origin = uiTracker.drag.firstDragPanel.canvasToClient(0,0);   
    const dx = uiTracker.dragDeltaX + origin.x // adding origin to convert from canvas coords to client coords.
    const dy = uiTracker.dragDeltaY + origin.y
    const dragCorrectionX = uiTracker.drag.correctionX;
    const dragCorrectionY = uiTracker.drag.correctionY;
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
    let { stackInfo:stack, isDragItem, dx=0, dy=0, extraClasses={} } = this.props;
    const jump = stack.jump || this.props.jump;
    const xx = stack.canvasX + dx;
    const yy = stack.canvasY + dy;
    const stackKey = stack.debugName;
    const needsBackground = stack.isCanvasChild ? 1 : 0;
    const allItems = new Array(stack.blocks.length + needsBackground);
    extraClasses.inHoverStack = extraClasses.inHoverStack || mxu.expr(()=>uiTracker.hoverStack === stack)
    if(needsBackground) {
      allItems[0] = 
        <Spring key={stackKey} 
          immediate={jump}
          from={{ xx: xx, yy: yy, ww: stack.width, hh: stack.height }} 
          to={{ xx: xx, yy: yy, ww: stack.width, hh: stack.height }} >
            {anim => <BlockStackBackground
              extraClasses={extraClasses}
              x={anim.xx} y={anim.yy}
              width={anim.ww} height={anim.hh} />
            }
        </Spring>    
    }
    stack.blocks.forEach( (block,idx) => {
      const blockKey = block.debugName
      allItems[idx+needsBackground] = 
        <Spring key={blockKey+idx} 
          immediate={jump}
          from={{ xx: block.canvasX, yy: block.canvasY }} 
          to={{ xx: block.canvasX, yy: block.canvasY }} >
          {anim => <BasicBlockUI blockInfo={block} dx={anim.xx-block.canvasX+dx} dy={anim.yy-block.canvasY+dy} isDragItem={isDragItem} extraClasses={extraClasses} jump={jump}/>}
        </Spring>
    })
    // take highlighted block (if any) and place it last
    let hoverIndex = stack.blocks.findIndex(b=>uiTracker.hoverBlock===b)
    if(hoverIndex>-1){
      hoverIndex += needsBackground
      const hoverItem = allItems.splice(hoverIndex,1)
      allItems.push(hoverItem)
    }
    return allItems;
  }
  componentDidMount() {
    this.props.stackInfo.resetJumpFlag()
  }
  componentDidUpdate() {
    this.props.stackInfo.resetJumpFlag()
  }
}
