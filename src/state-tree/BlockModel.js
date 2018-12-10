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

export class BlockModel {
  //= public 
  @observable debugName;  
  @observable id;
  @observable title;
  @observable parent;
  @observable fields = [];

  @observable dropRoomNeeded = 0;
  @observable dropRoomIsAbove = false;

  @observable blockBelow = null;

  //= private
  @observable _measurements = {titleWidth:0}

  constructor({title, id, debugName, fields,x,y}, parent) {
    checkType( ()=>title, String );
    checkType( ()=> parent, Object );
    checkOptionalType( ()=> id, String);
    checkOptionalType( ()=> fields, Array);
    checkOptionalType( ()=> debugName, String);
    this.title = title;
    this.parent = parent;
    this.id = id || cuid();
    this.debugName = debugName || uniqueName(`Block(${title})`);
    fields = fields || [];
    for(const f of fields) {
      new FieldModel(f, this); // the field will attach itself to 'this' using 'addField()'
    }
    if(this.parent) {
      this.parent.addBlock(this,{x,y});
    }
  }
  @action
  addField(f) {
    this.fields.push(f);
  }
  @action
  addBlock(b) {
    if(this.blockBelow) {
      throw new Error(`Can't handle below-block replacement yet.`);
    }
    this.blockBelow = b;
  }
  @action
  removeBlock(b) {
    if(this.blockBelow !== b) {
      throw new Error(`Can't handle below-block replacement yet.`);
    }
    this.blockBelow = null;
  }
  get lastBlockInStack() {
    return this.blockBelow ?
      this.blockBelow.lastBlockInStack
    :
      this;
  }
  @computed get
  width() {
    const [fieldsWidth, , ] = this.fieldsLayout;
    return theme.blockLeftTabWidth + fieldsWidth + theme.blockContentMarginX * 2;
  }
  @computed get
  height() {
    const [ ,fieldsHeight, ] = this.fieldsLayout;
    const basicHeight = fieldsHeight + theme.blockContentMarginY * 2;
    const heightInclDropRoom = basicHeight + this.dropRoomNeeded
    return heightInclDropRoom;
  }
  @computed get
  blockHeight() {
    const [ ,fieldsHeight, ] = this.fieldsLayout;
    const basicHeight = fieldsHeight + theme.blockContentMarginY * 2;
    return basicHeight;
  }
  @computed get
  x() {
    return this.parent.getChildBlockX(this)
  }
  @computed get
  y() {
    return this.parent.getChildBlockY(this)
  }
  getChildBlockX(child) {
    return this.x
  }
  getChildBlockY(child) {
    return this.y + this.height
  }
  @computed get
  distanceFromTopBlock() {
    const aboveBlock = this.parent;
    if(aboveBlock){
      return aboveBlock.distanceFromTopBlock + aboveBlock.height
    } else {
      return 0
    }
  }
  @computed get
  stackDimensions() {
    let {width, height} = this.blockBelow ? this.blockBelow.stackDimensions : {width:0,height:0};
    width = Math.max(width, this.width);
    height = height + this.height; 
    return {width, height}
  }
  @computed get
  blockTitle() {
    return this.title || this.debugName
  }
  @computed get
  isDragging() {
    return (uiTracker.drag && uiTracker.drag.item === this) ||
           ( this.parent && this.parent.isDragging )
  } 
  @computed get
  fieldsLayout() {
    const fieldLocations = new Map();
    let curX = this._measurements.titleWidth;
    let maxWidth = curX;
    let curY = 0;
    let lineHeight = 14;
    this.fields.forEach( (field,idx)=>{
      const loc = {};
      const spacedWidth = field.width + ( curX == 0 ? 0 : theme.fieldSeparationSpace)
      if(curX + spacedWidth > theme.blockHeaderMaxWidth) {
        curX = 0;
        curY += lineHeight;
        lineHeight = 0;
        maxWidth = theme.blockHeaderMaxWidth;
      } else {
        curX += theme.fieldSeparationSpace
      }
      loc.x = curX
      loc.y = curY
      curX += field.width
      maxWidth = Math.max(maxWidth, loc.x + field.width)
      lineHeight = Math.max(lineHeight,field.height);
      fieldLocations.set(field,loc)
    })
    return [maxWidth, curY+lineHeight,fieldLocations];
  }
  fieldPosition(field) {
    const [ , ,fieldLocs] = this.fieldsLayout;
    return fieldLocs.get(field);
  }
  @action.bound
  moveToTop() {
    ll(1, this.debugName, this.parent)
    this.parent.moveChildBlockToTop(this);
  }
  moveChildBlockToTop(child) {
    // pass; blocks in blockstack don't overlap.
  }
  @action.bound
  startDrag(evt) {
    this.moveToTop();
    uiTracker.startDrag(evt, this); // canvas coords
  } 
  @action
  endDrag() {
  }
  containsPoint({x,y}) {
    return rectContainsPoint(this, x,y)
  }
  @action
  respondToBlockDragOver(item,{x,y}) {
    if(! item instanceof BlockModel) {
      ll(`can't handle dragging non-blocks yet.`, ()=>item)
    }
    if(this.isDragging) {
      return;
    }
    if( rectContainsPoint(this, x,y) ) {
      const stackHeight = item.stackDimensions.height
      this.dropRoomNeeded = theme.blockSingleLineHeight;
      this.dropRoomIsAbove = y < this.y + this.height/2
    } 
  }
  @action 
  respondToBlockDragOut() {
    ll(1,this.debugName)
    this.dropRoomNeeded = 0;
    this.dropRoomIsAbove = false;
  }
  @action 
  respondToBlockDrop(item,location) {
    ll(1,this.debugName)
    if( this.dropRoomNeeded ) {
      let result;
      if(this.dropRoomIsAbove) {
        result = [this.parent, this]
      } else {
        result = [this, this.blockBelow]
      }
      return result;  
    } else if( this.isDragging ) {
      let top = this.parent;
      while(top.isDragging) { top = top.parent };
      let bottom = this.blockBelow;
      while(bottom && bottom.isDragging) {bottom = bottom.blockBelow };
      ll(1,top.debugName,bottom && bottom.debugName)
      if(bottom == null && top instanceof CanvasModel) {
        bottom = location;
      }
      return [top,bottom]
    } else {
      return null;
    }
  }
  @action visitBlockDropTargets(f,acc) {
    const resultForThis = f(this,acc);
    if(!this.blockBelow) {
      return resultForThis;
    }
    const resultForAll = this.blockBelow.visitBlockDropTargets(f,resultForThis)
    return resultForAll
  }
  @action 
  insertDroppedBlocks(droppedStack,blockBelow) {
    if(blockBelow) {  // connect tails
      check(blockBelow === this.blockBelow)
      const lastBlockInStack = droppedStack.lastBlockInStack
      this.removeBlock(blockBelow);  
      blockBelow.parent = lastBlockInStack; 
      lastBlockInStack.addBlock(blockBelow); 
    }      
    // connect new stack to this.
    droppedStack.parent.removeBlock(droppedStack); 
    droppedStack.parent = this;
    this.addBlock(droppedStack);
  }
  @action.bound
  updateTitleWidth(width){
    this._measurements.titleWidth = width;
  }
} 

