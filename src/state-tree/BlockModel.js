import * as mx from "mobx";
const {observable, computed, action} = mx;

import * as mxu from "mobx-utils";
import * as mxr from "mobx-react";
import { setLogEnabled } from "mobx-react-devtools";

import { uiTracker } from "../helpers/UITracker";
import { rectContainsPoint } from "../helpers/measure";
import { uniqueName } from "../helpers/nameMaker";
import cuid from "cuid";

import { FieldModel } from './FieldModels';
import { CanvasModel } from './DocumentModel';

import { theme } from "../style/defaultStyleParams";

import { ll, gg, ge, check, checkDef, checkType, checkOptionalType } from '../helpers/debug/ll';

export class BlockStackModel {
  @observable debugName;  
  @observable id;
  @observable blocks = [];
  jump = true;  // The nest render should not use animation. Not observable cause an update should not cause a re-render.

  constructor({id,blocks=[],x,y}, parent) {
    checkOptionalType( ()=> id, String);
    checkType( ()=>blocks, Array);
    checkType( ()=> parent, Object );
    checkOptionalType( ()=>x, Number);
    checkOptionalType( ()=>y, Number);
    this.parent = parent;
    this.id = id || cuid();
    this.debugName = uniqueName(`BlockStack`);
    this.parent.addStack(this,{x,y});
    for(const b of blocks) {
      new BlockModel(b,this); // the block will attach itself to parent using 'addBlock()'
    }
  }
  @action
  addBlock(block,position) {
    if(position === undefined) {
      position = this.blocks.length;
    }
    this.blocks.splice(position,0,block);
  }
  @action 
  removeBlock(block) {
    this.blocks.remove(block);
    if(this.blocks.length === 0 && this.isCanvasChild) {
      this.parent.removeStack(this);
    }
  }
  @computed 
  get isCanvasChild() {
    return this.parent instanceof CanvasModel;
  }
  @computed
  get topBlockStack() {
    return this.isCanvasChild ? this 
                              : this.parent.topBlockStack;
  }
  @action 
  moveTo(location, jump = false) { 
    this.parent.moveStackTo(this,location)
    this.jump = jump
  }
  resetJumpFlag() {
    this.jump = false;
  }
  @action
  bringToTop() {
    this.parent.bringStackToTop(this)
  }
  getBlockPosition(block) {
    return this.blocksLayout.blockPositions.get(block);
  }
  blockIndex(block) {
    return this.blocks.indexOf(block);
  }
  @computed 
  get stackDepth() {
    if(this.parent.blockDepth != undefined) {
      return this.parent.blockDepth + 1
    } else {
      return 0;
    }
  }
  //@computed 
  get childX() {
    return this.parent.getStackPosition(this).x;
  }
  //@computed 
  get childY() {
    return this.parent.getStackPosition(this).y;
  }  
  @computed 
  get canvasX() {
    return this.childX + this.parent.canvasX;
  }
  @computed 
  get canvasY() {
    return this.childY + this.parent.canvasY;
  }  
  @computed 
  get width() {
    const {width} = this.blocksLayout;
    return width;
  }
  @computed 
  get height() {
    const {height} = this.blocksLayout;
    return Math.max(height,theme.blockEmptyStackHeight);
  }
  @computed 
  get hasDropGap() {
    if(!uiTracker.drag) return false; // no gap if not dragging
    const { dropContainer, dropPosition } = uiTracker.drag;
    if( dropContainer !== this ) return false; // no gap if dragging over different stack;
    // when the drop-location is next to the ghost of a block that is dragging, don't
    // show a drop-gap: the ghost is the drop-gap.
    const blockBefore = this.blocks[dropPosition-1]
    const blockAfter = this.blocks[dropPosition]
    if(blockBefore && blockBefore.isDragging) return false;
    if(blockAfter && blockAfter.isDragging) return false;
    return true;
  } 
  @computed 
  get blocksLayout() {
    const blockPositions = new Map();
    const padding = this.isCanvasChild ? theme.topStackPadding : 0;
    let currY = padding;
    let maxWidth = 0;
    this.blocks.forEach( (block,idx)=>{
      if(idx > 0) {
        currY += theme.blockMargin;
      }
      if(this.hasDropGap && uiTracker.drag.dropPosition === idx) {
        currY += theme.blockSingleLineHeight;
      }
      blockPositions.set(block, {x:padding, y:currY});
      currY += block.height;
      maxWidth = Math.max(maxWidth, block.width);
    })
    if(this.hasDropGap && uiTracker.drag.dropPosition === this.blocks.length) {
      currY += theme.blockSingleLineHeight;
    }
    currY += padding
    return {width: maxWidth+2*padding, height: currY, blockPositions};
  }
  get isDropTarget() {
    const {x,y} = uiTracker.canvasDragLocation;
    if(y < this.canvasY) return false;
    if(y > this.canvasY+this.height) return false;
    if( x < this.topBlockStack.canvasX)             
      return false;
    if( x > this.topBlockStack.canvasX + this.topBlockStack.width) 
      return false; 
    return true;
  }
  containsPoint({x,y}) {
    if(y < this.canvasY) return false;
    if(y > this.canvasY+this.height) return false;
    if( x < this.canvasX)             
      return false;
    if( x > this.canvasX + this.width) 
      return false; 
    return true;
  }
  getDropLocation(_) {
    if(this.blocks.length==0) {
      return [this,0]  // over an empty C-block
    } else { // over dropGap
      return [this,uiTracker.drag.dropPosition]
    }
  }
  * allBlockDropTargets() {
    if( ! this.isDropTarget ) {
      return;
    }
    yield this;
    for(const b of this.blocks) {
      yield * b.allBlockDropTargets();
    }
  }
  * allHoverResponders() {
    if( ! this.containsPoint(uiTracker.canvasMouseLocation) ) {
      return;
    }
    yield this;
    for(const b of this.blocks) {
      yield * b.allHoverResponders();
    }
  }
  @action
  insertDroppedBlocks(droppedBlocks,position) {
    // this algorithm works regardless of order in droppedBlocks of if some blocks are not in this stack, while others are.
    droppedBlocks.forEach((b,idx)=>{
      if(b.parent === this) {
        const currPos = b.indexInStack;
        if(currPos < position + idx) {
          position--; // taking block out of currentPos moves intended destination one down.
        }
        mxu.moveItem(this.blocks,currPos,position+idx);
      } else {
        b.parent.removeBlock(b);
        b.parent = this;
        b.parent.addBlock(b,position+idx);
      }
    })
  }
}
class FieldSetModel {
  @observable debugName;  
  @observable id;
  @observable title;
  @observable fields = [];

  @observable _measurements = {titleWidth:0}

  constructor({title, id, fields}, parent) {
    checkType( ()=> parent, Object );
    checkOptionalType( ()=> id, String);
    checkType( ()=> title, String );
    checkOptionalType( ()=> fields, Array);
    this.parent = parent;
    this.id = id || cuid();
    this.title = title;
    this.debugName = uniqueName(`FieldSet(${title})`);
    this.fields = [];
    for(const f of fields||[]) {
      new FieldModel(f, this); // the field will attach itself to this FieldSet using 'addField()'
    }
    if(this.parent) {
      this.parent.addFieldSet(this); 
    }
  }
  @action
  addField(f) {
    this.fields.push(f)
  }
  @computed 
  get fieldsLayout() {
    const fieldPositions = new Map();
    let currX = this._measurements.titleWidth;
    const maxWidth = theme.blockMaxWidth 
                     - theme.blockContentPaddingLeft 
                     - this.parent.blockDepth * (theme.blockVerticalArmWidth + theme.blockMargin);
    let curWidth = this._measurements.titleWidth;
    let currY = 0; 
    let currLineHeight = theme.blockFontSize;
    this.fields.forEach( (field,idx)=>{
      const loc = {};
      const spacedWidth = field.width + ( currX == 0 ? 0 : theme.fieldSeparationSpace)
      if(currX + spacedWidth > maxWidth) {
        currX = theme.blockFieldLineIndent; 
        currY += currLineHeight + theme.blockLineSpace;
        currLineHeight = theme.blockLineHeight;
        curWidth = maxWidth;  
      } else {
        currX += theme.fieldSeparationSpace
      }
      loc.x = currX
      loc.y = currY
      currX += field.width
      curWidth = Math.max(curWidth, currX)
      currLineHeight = Math.max(currLineHeight,field.height);
      fieldPositions.set(field,loc);
    })
    const result = {width: curWidth, height: currY+currLineHeight,fieldPositions};
    return result
  }
  @computed 
  get childX() {
    return this.parent.getFieldSetPosition(this).x;
  }
  @computed 
  get childY() {
    return this.parent.getFieldSetPosition(this).y;
  }
  @computed 
  get canvasX() {
    return this.childX + this.parent.canvasX;
  }
  @computed 
  get canvasY() {
    if(this.title == "while") {
    }
    return this.childY + this.parent.canvasY;
  }
  get width() {
    return this.fieldsLayout.width;
  }
  get height() {
    return this.fieldsLayout.height;
  }
  fieldPosition(field) {
    return this.fieldsLayout.fieldPositions.get(field);
  }
  @action.bound
  updateTitleWidth(width){
    this._measurements.titleWidth = width;
  }
}


export class BlockModel {
  //= public 
  @observable debugName;  
  @observable id;
  @observable title;
  @observable parent;
  @observable segments;

  //= private
  @observable _measurements = {finalArmLabelWidth:0}

  // A block can contain multiple segments. Each segment has a title, an optional list of fields 
  // and a substack (list of blocks in the 'C'). If there is only one segment, the substack is also optional.
  // For convenience, members of first segment can 
  // be specified directly.
  // To specify that a segment has no C-slot, use 'undefined' for the stack. To specify that it /has/ a C-slot, 
  // but that the slot is empty, use an empty array []. 
  constructor({title, id, fields, substack, segments}, parent) {
    checkType( ()=> parent, Object );
    checkOptionalType( ()=> id, String);
    checkOptionalType( ()=> title, String );
    checkOptionalType( ()=> fields, Array);
    checkOptionalType( ()=> substack, Array);
    checkOptionalType( ()=> segments, Array);
    this.parent = parent;
    this.id = id || cuid();
    this.debugName = uniqueName(`Block(${title})`);
    segments = segments || [];
    if(title || fields || substack) {
      segments.unshift({title,fields,stack:substack});
    }
    this.debugName = uniqueName(`Block(${segments[0].title})`);
    this.segments = [];
    segments.forEach(segmentData => {
      checkType(()=>segmentData.title, String);
      checkOptionalType(()=> segmentData.fields, Array);
      checkOptionalType(()=> segmentData.stack, Array);
      if(segments.length !==1 ) { // substack not optional when multiple segments. 
        checkDef(segmentData.stack);
      }
    })
    for(const segmentData of segments) {
      new FieldSetModel( {title: segmentData.title, fields: segmentData.fields}, this );
      if(segmentData.stack) {
        new BlockStackModel({blocks: segmentData.stack}, this) // the stack will attach itself to last segment using 'addStack()'
      }
    }
    if(this.parent) {
      this.parent.addBlock(this);
    }
  }
  @action  
  addFieldSet(fieldSet,segmentIdx) { //todo: better semantics for addStack and addFieldSet
    if(segmentIdx==undefined){
      segmentIdx = this.segments.length-1;
    }
    if(this.segments[segmentIdx] && this.segments[segmentIdx].fieldSet == undefined) {
      this.segments[segmentIdx].fieldSet = fieldSet
    } else {
      this.segments.push( {fieldSet} );
    }
  }
  @action 
  addStack(stack) {  //todo: better semantics for addStack and addFieldSet
    const segmentIdx = this.segments.length-1;
    if(this.segments[segmentIdx].stack == undefined) {
      this.segments[segmentIdx].stack = stack
    } else {
      throw new Error(`Can only add stack to block if last segment has no stack yet.`)
      //this.segments.push( {stack} );
    }
  }
  @computed
  get topBlockStack() {
    return this.parent.topBlockStack
  }
  @computed
  get segmentsLayout() {
    let fieldSetPositions = new Map();
    let subStackPositions = new Map();
    let currY = 0;
    let currWidth = 0;
    for( const {fieldSet,stack} of this.segments ) {
      currY += theme.blockContentPaddingY;
      const fieldsLayout = fieldSet.fieldsLayout;
      const fieldsWidth = theme.blockContentPaddingLeft + fieldsLayout.width + theme.blockContentPaddingRight;
      const fPos = { 
        x: theme.blockContentPaddingLeft, y: currY
      };
      fieldSetPositions.set(fieldSet, fPos);
      currY += fieldsLayout.height + theme.blockContentPaddingY;
      currWidth = Math.max(currWidth, fieldsWidth);
      if( stack !== undefined) {
        currY += theme.blockMargin
        const sPos = {
          x: theme.blockSubStackIndent, y: currY 
        }
        subStackPositions.set(stack, sPos);
        currY += stack.height + theme.blockMargin; 
        currWidth = Math.max(currWidth, stack.width + theme.blockSubStackIndent);
      }
    }
    let finalLabelPosition;
    const finalStack = this.segments[this.segments.length-1].stack // could be missing.
    if(finalStack) {
      finalLabelPosition = {x:theme.blockContentPaddingLeft, y: currY-2 }
      currY += theme.blockFinalArmHeight;
      currWidth = Math.max(currWidth, this.finalArmWidth);
    }
    const result = { width: currWidth, height: currY, fieldSetPositions, subStackPositions, finalLabelPosition }; 
    return result;
  }
  @action 
  bringStackToTop(stack) {
    // pass; stack inside block doesn't overlap anything.
  }
  getStackPosition(stack) {  
    return this.segmentsLayout.subStackPositions.get(stack);
  }
  getFieldSetPosition(fieldSet) {  
    return this.segmentsLayout.fieldSetPositions.get(fieldSet);
  }
  @computed 
  get width() {
    const {width} = this.segmentsLayout;
    return width;
  }
  @computed 
  get height() {
    const {height} = this.segmentsLayout;
    return height;
  }
  // @computed 
  get childX() {
    return this.parent.getBlockPosition(this).x;
  }
  // @computed 
  get childY() {
    return this.parent.getBlockPosition(this).y;
  }
  @computed
  get canvasX() {
    return this.childX + this.parent.canvasX;
  }
  @computed
  get canvasY() {
    return this.childY + this.parent.canvasY;
  }
  @computed 
  get indexInStack() {
    return this.parent.blockIndex(this)
  }
  @computed 
  get blockTitle() {
    return this.segments[0].fieldSet.title
  }
  @computed 
  get finalArmLabel() {  
    return "end " + this.blockTitle
  }
  @computed 
  get isDragging() {  
    return uiTracker.drag && uiTracker.allDragBlocks.has(this);
  } 
  * allSubBlocks() {
    yield this
    for(const segm of this.segments) {
      if(segm.stack) {
        for(const sb of segm.stack.blocks) {
          yield sb;
          yield * sb.allSubBlocks();
        }
      }
    }
  }
  @computed 
  get blockDepth() {
    if(this.parent.stackDepth != undefined) {
      return this.parent.stackDepth
    } else {
      throw new Error(`Wierd that a block exists outside of a blockstack.`)
    }
  }
  @action.bound
  bringToTop() {  
    this.parent.bringToTop(this);
  }
  @action.bound
  startDrag(evt) {
    const dragBlocks = this.parent.blocks.slice(this.indexInStack)  // grab this block and all blocks beneath.
    uiTracker.startDrag(evt, dragBlocks);
  } 
  get isDropTarget() { 
    const {x,y} = uiTracker.canvasDragLocation;
    const margin = theme.blockMargin;
    if( y < this.canvasY - margin ) 
      return false;
    if( y > this.canvasY + this.height + margin ) 
      return false;
    if( x < this.topBlockStack.canvasX)             
      return false;
    if( x > this.topBlockStack.canvasX + this.topBlockStack.width) 
      return false; 
    if( this.isDragging ) return false;
    return true;
  }
  containsPoint({x,y}) {
    if( y < this.canvasY ) 
      return false;
    if( y > this.canvasY + this.height ) 
      return false;
    if( x < this.canvasX)             
      return false;
    if( x > this.canvasX + this.width) 
      return false; 
    // is in a FieldSet?
    const inFieldSet = this.segments.some( segm=> {
      const fs = segm.fieldSet
      const fsX = fs.canvasX
      const fsY = fs.canvasY
      if(x < fsX - theme.blockContentPaddingLeft) return false;
      if(x > fsX + fs.width + theme.blockContentPaddingRight) return false;
      if(y < fsY - theme.blockContentPaddingY) return false;
      if(y > fsY + fs.height + theme.blockContentPaddingY) return false;
      return true;
    })
    if(inFieldSet) return true;
    if(x<this.canvasX+theme.blockVerticalArmWidth) return true; // in vertical arm;
    if(y>this.canvasY+this.height-theme.finalArmHeight && x < this.canvasX+this.finalArmWidth) // in final arm
      return true;
  }
  @action
  getDropLocation(dragCursorPos) {
    const {fieldSetPositions} = this.segmentsLayout;
    const margin = theme.blockMargin;
    const padding = theme.blockContentPaddingY;
    const dragY = dragCursorPos.y
    const segmentIdx = this.segments.findIndex((segm,idx)=>{
      let y = segm.fieldSet.canvasY //fieldSetPositions.get(segm.fieldSet);
      // y += this.canvasY;
      if(dragY < y - padding - margin ) return false;
      if(dragY > y + padding + segm.fieldSet.height + margin) return false;
      // no need to check x: this block contains cursor and we don't have blocks side-by-side.
      return true;
    })
    if( segmentIdx > -1 ) {
      const theSegm = this.segments[segmentIdx];
      let fieldsY = theSegm.fieldSet.canvasY;
      // fieldsY += this.y
      if( dragY < fieldsY + theSegm.fieldSet.height/2) {
        if(segmentIdx==0) {
          return [this.parent, this.indexInStack]
        } else {
          const prevStack = this.segments[segmentIdx-1].stack
          return [prevStack,prevStack.blocks.length]
        }
      } else {
        if(theSegm.stack == undefined) {
          check(()=>this.segments.length == 1,"Only blocks with a single fieldset can omit stack")
          return [this.parent, this.indexInStack+1]
        }
        return [theSegm.stack,0]
      }
    } else { // no segment/fieldSet found; must be final arm. 
      const lastSegm = this.segments[ this.segments.length -1];
      if( lastSegm.stack == undefined ) {
        throw new Error(`Weird: in drop-target block, cursor not above a fieldset, and there is no final arm.`);
      }
      const finalArmHeight = theme.blockFinalArmHeight;
      const finalArmTop = this.canvasY + this.height - finalArmHeight - margin; 
      if( dragY >= finalArmTop && dragY <= finalArmTop + finalArmHeight  + 2*margin)  {
        const dropIndex = this.indexInStack + 1;
        return [this.parent, dropIndex]
      } else {
          throw new Error(`Weird: in Droptarget block, not on fieldset, not on final arm. "${this.blockTitle}"`)
      }
    }
  }
  * allBlockDropTargets() {
    if(! this.isDropTarget ) {
      return;
    }
    yield this;
    for( const segm of this.segments ) {
      if( segm.stack ) {
        yield * segm.stack.allBlockDropTargets()      
      } 
    }
  }
  * allHoverResponders() {
    if( this.containsPoint(uiTracker.canvasMouseLocation) ) {
      yield this;
    }
    for( const segm of this.segments ) {
      if( segm.stack ) {
        yield * segm.stack.allHoverResponders()      
      } 
    }
  }
  @computed
  get finalArmWidth() {
    const realWidth = theme.blockContentPaddingLeft 
                      + this._measurements.finalArmLabelWidth 
                      + theme.blockContentPaddingRight;
    return Math.max(realWidth, theme.blockFinalArmMinWidth);
  }
  @computed
  get finalLabelCanvasPosition() {
    let {x,y} = this.segmentsLayout.finalLabelPosition
    x += this.canvasX;
    y += this.canvasY;
    return {x,y};
  }
  @action.bound
  updateFinalArmWidth(width){
    this._measurements.finalArmLabelWidth = width;
  }
} 

