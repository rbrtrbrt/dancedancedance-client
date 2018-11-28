import * as mx from "mobx";
const {observable, computed, action} = mx;

import * as mxu from "mobx-utils";
import * as mxr from "mobx-react";
import { setLogEnabled } from "mobx-react-devtools";

import { uiTracker } from "../helpers/UITracker";

import { uniqueName } from "../helpers/nameMaker";
import cuid from "cuid";

import { FieldModel } from './FieldModels';
import { CanvasModel } from './DocumentModel';

import { theme } from "../style/defaultStyleParams";

import { ll, gg, ge, check, checkDef, checkType, checkOptionalType } from '../helpers/debug/ll';

// Little models describing how a block gets its position:

class LocationOnCanvas {
  @observable x = 0; 
  @observable y = 0;
  @observable canvas;

  constructor({canvas, x,y}) {
    checkDef(()=>canvas)
    checkDef(()=>x)
    checkDef(()=>y)
    ll("constr Location on Canvas",()=>canvas)
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

class LocationBelowBlock {
  parentBlock = null;
  constructor(parent) {
    this.parentBlock = parent
  }
  @computed get
  x() {
    return this.parentBlock.x
  }
  @computed get
  y() {
    return this.parentBlock.y + this.parentBlock.height
  }
  get parent() {
    return this.parentBlock;
  }
}

export function createBlockChain(blockDataList) {
  checkType(()=>blockDataList, Array);
  check(()=>blockDataList.length > 0);
  let [firstBlockData,...restBlocksData] = blockDataList;
  if(restBlocksData.length>0) {
    firstBlockData = {blocksBelow: restBlocksData,...firstBlockData}
  }
  const firstBlock = new BlockModel(firstBlockData)
  return firstBlock;
}

export class BlockModel {
  //= public 
  @observable debugName;  
  @observable id;
  @observable title;
  @observable anchor;
  @observable fields = [];

  @observable blockBelow = null;
  @observable dragCorrectionX;
  @observable dragCorrectionY;

  //= private
  @observable _measurements = {titleWidth:0}

  constructor({title, id, fields, blocksBelow, debugName}) {
    checkType( ()=>title, String );
    checkOptionalType( ()=> id, String);
    checkOptionalType( ()=> fields, Array);
    checkOptionalType( ()=> blocksBelow, Array);
    checkOptionalType( ()=> debugName, String);
    this.title = title;
    this.id = id || cuid();
    this.debugName = debugName || uniqueName("Block");
    fields = fields || [];
    for(const fieldData of fields) {
      const f = new FieldModel(fieldData);
      this.fields.push(f);
    }
    if(blocksBelow) {
      this.blockBelow = createBlockChain(blocksBelow);
    }
  }
  attachToParent(parent, location) {
    if( parent instanceof BlockModel) {
      this.anchor = new LocationBelowBlock(parent);
    } else if(parent instanceof CanvasModel) {
      this.anchor = new LocationOnCanvas({canvas:parent, ...location})
    }
    for(const field of this.fields) {
      field.attachToParent(this);
    }
    if(this.blockBelow) {
      this.blockBelow.attachToParent(this);
    }
  }
  get parent() {
    return this.anchor.parent;
  }
  allBlocksBelow = function*(excludeSelf=false) {
    let block = this;
    if(excludeSelf) {
      block = block.blockBelow
    }
    while(block) {
      yield block;
      block = block.blockBelow
    }
  }
  @computed get
  width() {
    const [fieldsWidth, , ] = this.fieldsLayout;
    return theme.blockLeftTabWidth + fieldsWidth + theme.blockContentMarginX * 2;
  }
  @computed get
  height() {
    const [ ,fieldsHeight, ] = this.fieldsLayout;
    return fieldsHeight + theme.blockContentMarginY * 2;
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
  blockTitle() {
    return this.title || this.debugName
  }
  @computed get
  isDragging() {
    return uiTracker.drag.item === this ||
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
  setBelowBlock(bBlock) {
    self.blockBelow = bBlock;
  }
  @action
  moveToTop() {
    this.parent.moveBlockToTop(this);
  }
  @action.bound
  startDrag(evt) {
    let [x,y] = uiTracker.startDrag(evt, this); // canvas coords
    this.dragCorrectionX = x - this.anchor.x
    this.dragCorrectionY = y - this.anchor.y
  } 
  @action
  endDrag(x,y) {
    this.moveToTop();
    if(uiTracker.drag.correctingState === "beforeCorrect") {
      this.anchor.moveTo(x-this.dragCorrectionX,y-this.dragCorrectionY);
    } else {
      this.anchor.moveTo(x,y);
    }
    this.dragCorrectionX = null;
    this.dragCorrectionY = null;
  } 
  @action.bound
  updateTitleWidth(width){
    this._measurements.titleWidth = width;
  }
} 

