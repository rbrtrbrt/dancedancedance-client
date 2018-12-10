import * as mx from "mobx";
const {observable, computed, action} = mx;
import * as mxu from "mobx-utils";
import * as mxr from "mobx-react";
import { setLogEnabled } from "mobx-react-devtools";

import cuid from "cuid";
import { uniqueName } from "../helpers/nameMaker";
import { ll, checkType, checkDef, checkOptionalType } from "../helpers/debug/ll";

import { BlockModel } from './BlockModel';

export class CanvasModel {
}

export class DocumentModel extends CanvasModel {
  @observable id;
  @observable blocks = [];
  @observable blockLocations = new Map();

  constructor({id, debugName, blocks}) {
    super()
    this.id = id || cuid();
    this.debugName = debugName || uniqueName("Document")
    for(let blocksData of blocks) {
      if(!Array.isArray(blocksData)) {
        blocksData = [blocksData];
      }
      let parent = this;
      blocksData.forEach( (b)=>{
        const block = new BlockModel(b,parent); // the block will attach itself to parent using 'addBlock()'
        parent = block;
      })
    }
  }
  @action 
  addBlock(b,location) {
    this.blocks.push(b);
    if(!location) {
      checkType(b.xx,Number);
      checkType(b.yy,Number);
      location = {x:b.xx,y:b.yy};
    }
    this.blockLocations.set(b,location)
  }
  @action 
  removeBlock(b) {
    this.blocks.remove(b);
    this.blockLocations.delete(b);
  }
  @action 
  moveChildBlockToTop(block) {
      const idx = this.blocks.indexOf(block);
      mxu.moveItem(this.blocks,idx,this.blocks.length-1)
  }
  getChildBlockX(child) {
    return this.blockLocations.get(child).x
  }
  getChildBlockY(child) {
    return this.blockLocations.get(child).y
  }
  @action moveChildBlock(child,{x,y}) {
    this.blockLocations.set(child,{x,y})
  }
  containsPoint(point) {
    return true // Document is ATS-root. Always covers complete editor area.
  }
  @action
  visitBlockDropTargets(f,acc) {
    acc = f(this,acc)
    for(const b of this.blocks) {
      acc = b.visitBlockDropTargets(f,acc);
    } 
    return acc
  }
  @action respondToBlockDragOver(item,{x,y}={}) {
    // pass
  }
  @action respondToBlockDrop(item,location) {
    return [this,location];
  }
  @action insertDroppedBlocks(droppedStack,where) {
    ll(1,droppedStack,this.debugName,()=>where)
    if(where instanceof BlockModel) {
      const location = this.blockLocations.get(where);
      this.removeBlock(where);
      const lastBlockInStack = droppedStack.lastBlockInStack
      where.parent = lastBlockInStack;
      lastBlockInStack.addBlock(where);
      droppedStack.parent.removeBlock(droppedStack);
      droppedStack.parent = this;
      this.addBlock(droppedStack,location);
    } else if(droppedStack.parent === this) {
      checkDef(()=>where.x)
      checkDef(()=>where.y)
      this.moveChildBlock(droppedStack,where)
    } else { // move to free spot on canvas
      droppedStack.parent.removeBlock(droppedStack);
      droppedStack.parent = this;
      checkDef(()=>where.x)
      checkDef(()=>where.y)
      this.addBlock(droppedStack,where);      
    }
  }
}

