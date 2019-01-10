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
  @observable location;
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
  @computed get 
  isCanvasChild() {
    return this.parent instanceof CanvasModel;
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
  getBlockX(block) {
    return this.x;
  }
  getBlockY(block) {
    const [ , , blockLocations] = this.blocksLayout;
    return blockLocations.get(block)+this.y;
  }
  blockIndex(block) {
    return this.blocks.indexOf(block);
  }
  @computed get
  x() {
    return this.parent.getStackX(this)
  }
  @computed get
  y() {
    return this.parent.getStackY(this)
  }  
  @computed get
  width() {
    const [blocksWidth, , ] = this.blocksLayout;
    return blocksWidth || 50;
  }
  @computed get
  height() {
    const [ ,blocksHeight, ] = this.blocksLayout;
    return blocksHeight || 10;
  }
  @computed get
  hasDropGap() {
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
  @computed get
  blocksLayout() {
    const blockLocations = new Map();
    let currY = 0;
    let maxWidth = 0;
    this.blocks.forEach( (block,idx)=>{
      if(this.hasDropGap && uiTracker.drag.dropPosition === idx) {
        currY += theme.blockSingleLineHeight;
      }
      blockLocations.set(block, currY);
      currY += block.height;
      maxWidth = Math.max(maxWidth, block.width)
    })
    if(this.hasDropGap && uiTracker.drag.dropPosition === this.blocks.length) {
      currY += theme.blockSingleLineHeight;
    }
    return [maxWidth, currY, blockLocations];
  }
  isDropTarget({x,y}) {
    return rectContainsPoint(this, x,y)
  }
  getDropLocation(_,dragCursorPos) {
    // If the blockstack was the topmost item containing the cursor,
    // the cursor is over the current dropgap, so we can return basically the current drop location.
    return [this, uiTracker.drag.dropPosition ]
  }
  @action visitBlockDropTargets(f,acc) {
    acc = f(this,acc);
    for(const b of this.blocks) {
      acc = b.visitBlockDropTargets(f,acc);
    }
    return acc;
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

export class BlockModel {
  //= public 
  @observable debugName;  
  @observable id;
  @observable title;
  @observable parent;
  @observable fields = [];
  @observable substack;

  //= private
  @observable _measurements = {titleWidth:0}


  //todo: replace members 'fields' and 'substack' with 'segments', and have constructor add fields/substack init values as first segment.
  constructor({title, id, fields, substack}, parent) {
    checkType( ()=>title, String );
    checkType( ()=> parent, Object );
    checkOptionalType( ()=> id, String);
    checkOptionalType( ()=> fields, Array);
    checkOptionalType( ()=> substack, Array);
    this.title = title;
    this.parent = parent;
    this.id = id || cuid();
    this.debugName = uniqueName(`Block(${title})`);
    fields = fields || [];
    for(const f of fields) {
      new FieldModel(f, this); // the field will attach itself to 'this' using 'addField()'
    }
    if(substack) {
      new BlockStackModel({blocks: substack}, this) // the stack will attach itself to 'this' using 'addStack()'
    }
    if(this.parent) {
      this.parent.addBlock(this);
    }
  }
  //todo: how to specify /which/ segment to add the field to?
  @action
  addField(f) {
    this.fields.push(f);
  }
  //todo: how to specify /which/ segment to add the stack to?
  @action 
  addStack(stack,location) {
    this.substack = stack;
  }
  //todo: how to specify /which/ segment to remove the stack from?
  //todo: perhaps its better not to remove the substack, just leave it empty.
  //      (this means we're never moving substacks, just blocks and their dependents)
  @action 
  removeStack(stack) {
    this.substack = null;
  }
  @action 
  bringStackToTop(stack) {
    // pass; stack inside block doesn't overlap anything.
  }
  //todo: find segment for provided stack.
  getStackX(stack) {  
    return this.x + theme.blockLeftTabWidth;
  }
  //todo: find segment for provided stack.
  getStackY(stack) { 
    const [ ,fieldsHeight, ] = this.fieldsLayout;
    return this.y + theme.blockContentMarginY * 2 + fieldsHeight
  }
  @computed get
  //todo: adjust for having multiple segments
  //todo: adjust for bottom-arm.
  width() {
    const [fieldsWidth, , ] = this.fieldsLayout;
    const substackWidth = this.substack ? this.substack.width + theme.blockLeftTabWidth : 0;
    const contentWidth = Math.max(fieldsWidth, substackWidth);
    return theme.blockLeftTabWidth + contentWidth + theme.blockContentMarginX * 2;
  }
  //todo: adjust for having multiple segments
  //todo: adjust for bottom-arm.
  //todo: deal with empty substacks.
  @computed get
  height() {
    const [ ,fieldsHeight, ] = this.fieldsLayout;
    const substackHeight = this.substack ? this.substack.height : 0;
    const basicHeight = fieldsHeight + substackHeight + theme.blockContentMarginY * 2;
    return basicHeight;
  }
  @computed get
  x() {
    return this.parent.getBlockX(this)
  }
  @computed get
  y() {
    return this.parent.getBlockY(this)
  }
  @computed get
  indexInStack() {
    return this.parent.blockIndex(this)
  }
  //todo: use title of first segment
  @computed get
  blockTitle() {
    return this.title
  }
  @computed get
  isDragging() {  
    return uiTracker.drag && uiTracker.allDragBlocks.has(this);
  } 
  //todo: adjust for mult. segments
  * allSubBlocks() {
    yield this
    if(this.substack) {
      for(const sb of this.substack.blocks) {
        yield sb;
        yield * sb.allSubBlocks();
      }
    }
  }
  //todo: adjust for mult. segments
  @computed get
  fieldsLayout() {
    const fieldLocations = new Map();
    let currX = this._measurements.titleWidth;
    let maxWidth = currX;
    let currY = 0;
    let lineHeight = 14;
    this.fields.forEach( (field,idx)=>{
      const loc = {};
      const spacedWidth = field.width + ( currX == 0 ? 0 : theme.fieldSeparationSpace)
      if(currX + spacedWidth > theme.blockHeaderMaxWidth) {
        currX = 0;
        currY += lineHeight;
        lineHeight = 0;
        maxWidth = theme.blockHeaderMaxWidth;
      } else {
        currX += theme.fieldSeparationSpace
      }
      loc.x = currX
      loc.y = currY
      currX += field.width
      maxWidth = Math.max(maxWidth, loc.x + field.width)
      lineHeight = Math.max(lineHeight,field.height);
      fieldLocations.set(field,loc)
    })
    return [maxWidth, currY+lineHeight,fieldLocations];
  }
  //todo: adjust for mult. segments
  fieldPosition(field) {
    const [ , ,fieldLocs] = this.fieldsLayout;
    return fieldLocs.get(field);
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
  isDropTarget({x,y}) { 
    //todo: memoize this? how?
    const catchArea = {
      x: this.parent.x,
      y: this.y,
      width: this.parent.width, //TODO: find width of top-blockstack
      height: this.height 
    }
    return rectContainsPoint(catchArea, x,y)
  }

  @action
  getDropLocation(draggedBlocks,dragCursorPos) {
    //todo: at least abstact this in method, and possibly memoize this.
    const catchArea = {
      x: this.parent.x,
      y: this.y,
      width: this.parent.width,
      height: this.height 
    }
    //todo: adjust for hovering over bottom-arm
    //todo: adjust for mult. segments
    if( rectContainsPoint(catchArea, dragCursorPos.x,dragCursorPos.y) ) {
      let dropIndex = this.indexInStack;
      if( dragCursorPos.y > this.y + this.height/2 ) {
        dropIndex += 1;
      }
      return [this.parent,dropIndex]
    } else {
      throw new Error(`Weird: Did not expect getDropLocation() to be called when the mouse is not over it.`)
    }
  }
  //todo: adjust for mult. segments
  @action visitBlockDropTargets(f,acc) {
    acc = f(this,acc)
    if( this.substack ) {
      acc = this.substack.visitBlockDropTargets(f,acc) 
    } 
    return acc;
  }
  //todo: adjust for mult. segments
  @action.bound
  updateTitleWidth(width){
    this._measurements.titleWidth = width;
  }
} 

