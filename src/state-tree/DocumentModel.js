import * as mx from "mobx";
const {observable, computed, action} = mx;
import * as mxu from "mobx-utils";
import * as mxr from "mobx-react";
import { setLogEnabled } from "mobx-react-devtools";

import cuid from "cuid";
import { uniqueName } from "../helpers/nameMaker";
import { ll, checkType, checkDef, checkOptionalType } from "../helpers/debug/ll";

import { BlockStackModel } from './BlockModel';

export class CanvasModel {
}

export class DocumentModel extends CanvasModel {
  @observable id;
  @observable stacks = [];
  @observable stackLocations = new Map();

  constructor({id, blocks}) {
    super()
    this.id = id || cuid();
    this.debugName = uniqueName("Document")
    for(let blocksData of blocks) {
      if(!Array.isArray(blocksData)) {
        blocksData = [blocksData];
      }
      const {x,y} = blocksData[0];
      new BlockStackModel({blocks:blocksData, x,y},this); // the stack will attach itself to parent using 'addStack()'
    }
  }
  @action 
  addStack(stack,location) {
    this.stacks.push(stack);
    if(!location) {
      checkType(stack.xx,Number);
      checkType(stack.yy,Number);
      location = {x:stack.xx,y:stack.yy};
    }
    this.stackLocations.set(stack,location)
  }
  @action 
  removeStack(stack) {
    this.stacks.remove(stack);
    this.stackLocations.delete(stack);
  }
  @action 
  bringStackToTop(stack) {
      const idx = this.stacks.indexOf(stack);
      mxu.moveItem(this.stacks, idx, this.stacks.length-1)
  }
  getStackX(stack) {
    return this.stackLocations.get(stack).x
  }
  getStackY(stack) {
    return this.stackLocations.get(stack).y
  }
  @action 
  moveStackTo(stack,location) { 
    ll(1,()=>location)  
    this.stackLocations.set(stack,location)
  }
  isDropTarget(point) {
    return true // Document is ATS-root. Always covers complete editor area.
  }
  @action
  visitBlockDropTargets(f,acc) {
    acc = f(this,acc)
    for(const s of this.stacks) {
      acc = s.visitBlockDropTargets(f,acc);
    } 
    return acc;
  }
  @action
  getDropLocation(_,dragCursorPos) {
    return [this,dragCursorPos]
  }

  @action 
  insertDroppedBlocks(droppedBlocks,position) {
    const parentStack = droppedBlocks[0].parent
    if(droppedBlocks[0].indexInStack === 0) {
      // an existing stack was moved entirely
      parentStack.moveTo(position,true)
      return
    } else {
      const newStack = new BlockStackModel({blocks:[],...position},this)
      for(const b of droppedBlocks) {
        b.parent.removeBlock(b);
        b.parent = newStack;
        newStack.addBlock(b);
      }
    }
  }
}