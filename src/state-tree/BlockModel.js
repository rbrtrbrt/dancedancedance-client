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

// Little models describing how a block gets its position:

export 
class Anchor {
  // interface:
  // get parent
  // get x
  // get y
  // detachBlockStack
  // insertBockStack
  @action 
  detachBlockStack() {
    
  }
}
export 
class AnchorOnCanvas extends Anchor {
  @observable x = 0; 
  @observable y = 0;
  @observable canvas;

  constructor(canvas, x,y) {
    super()
    checkDef(()=>canvas)
    checkDef(()=>x)
    checkDef(()=>y)
    this.canvas = canvas;
    this.x = x;
    this.y = y;
  }
  get parent() {
    return this.canvas;
  }
  @action
  moveTo(x, y) {
    this.x = Math.round(x);
    this.y = Math.round(y);
  }
}

export 
class AnchorBeneathBlock extends Anchor {
  @observable parent = null;
  constructor(parent) {
    super()
    this.parent = parent
  }
  @computed get
  x() {
    return this.parent.x
  }
  @computed get
  y() {
    return this.parent.y + this.parent.height
  }
}

export class BlockModel {
  //= public 
  @observable debugName;  
  @observable id;
  @observable title;
  @observable anchor;
  @observable fields = [];

  @observable dropRoomNeeded = 0;
  @observable dropRoomIsAbove = false;

  @observable blockBelow = null;

  //= private
  @observable _measurements = {titleWidth:0}

  constructor({title, id, debugName, fields}, anchor) {
    checkType( ()=>title, String );
    checkType( ()=> anchor, Anchor );
    checkOptionalType( ()=> id, String);
    checkOptionalType( ()=> fields, Array);
    checkOptionalType( ()=> debugName, String);
    this.title = title;
    this.anchor = anchor;
    this.id = id || cuid();
    this.debugName = debugName || uniqueName("Block");
    fields = fields || [];
    for(const f of fields) {
      new FieldModel(f, this); // the field will attach itself to 'this' using 'addField()'
    }
    if(this.anchor) {
      this.anchor.parent.addBlock(this);
    }
  }
  get parent() {
    return this.anchor && this.anchor.parent;
  }
  get lastBlockInStack() {
      return this.blockBelow ?
        this.blockBelow.lastBlockInStack
      :
        this;
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
    return this.anchor.x
  }
  @computed get
  y() {
    return this.anchor.y
  }
  @computed get
  distanceFromTopBlock() {
    const aboveBlock = this.anchor.parentBlock;
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
           ( this.anchor.parentBlock && this.anchor.parentBlock.isDragging )
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
  @action
  moveToTop() {
    ll(this.blockTitle, ()=> this.parent)
    this.parent.moveBlockToTop(this);
  }
  @action.bound
  startDrag(evt) {
    uiTracker.startDrag(evt, this); // canvas coords
  } 
  @action
  endDrag(anchor) {
    ll(1,()=>anchor)
    this.moveToTop();
  } 
  @action
  respondToBlockDrag(item,{x,y}) {
    if(! item instanceof BlockModel) {
      ll(`can't handle dragging non-blocks yet.`, ()=>item)
    }
    if(this.isDragging) {
      return;
    }
    if( rectContainsPoint(this, x,y) ) {
      const stackHeight = item.stackDimensions.height
      this.dropRoomNeeded = Math.min(stackHeight, theme.blockSingleLineHeight*3);
      this.dropRoomIsAbove = y < this.y + this.height/2
    } else if( this.dropRoomNeeded ){
      this.dropRoomNeeded = 0;
      this.dropRoomIsAbove = false;
    }
  }
  @action 
  respondToBlockDrop(item) {
    if( !this.dropRoomNeeded ){
      return null; // return nothing: the block must not be dropped here.
    }
    let result;
    if(this.dropRoomIsAbove) {
      result = [this.anchor, this];
    } else if(this.blockBelow) {
      result = [this.blockBelow.anchor, this.blockBelow];
    } else {
      result = [new AnchorBeneathBlock(this),null]
    }
    this.dropRoomIsAbove = null;
    this.dropRoomNeeded = 0;
    return result;
  }
  @action visitBlockDropTargets(f,acc) {
    const resultForThis = f(this,acc);
    if(!this.blockBelow) {
      return resultForThis;
    }
    const resultForAll = this.blockBelow.visitBlockDropTargets(f,resultForThis)
    return resultForAll
  }
  @action.bound
  updateTitleWidth(width){
    this._measurements.titleWidth = width;
  }
} 

