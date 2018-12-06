import * as mx from "mobx";
const {observable, computed, action} = mx;
import * as mxu from "mobx-utils";
import * as mxr from "mobx-react";
import { setLogEnabled } from "mobx-react-devtools";

import cuid from "cuid";
import { uniqueName } from "../helpers/nameMaker";
import { ll, checkType, checkOptionalType } from "../helpers/debug/ll";

import { BlockModel, AnchorOnCanvas, AnchorBeneathBlock } from './BlockModel';

export class CanvasModel {
}

export class DocumentModel extends CanvasModel {
  @observable id;
  @observable blocks = [];

  constructor({id, debugName, blocks}) {
    super()
    this.id = id || cuid();
    this.debugName = debugName || uniqueName("Document")
    for(let blocksData of blocks) {
      if(!Array.isArray(blocksData)) {
        blocksData = [blocksData];
      }
      let parent;
      blocksData.forEach( (b,idx)=>{
        let anchor;
        if(idx===0){
          anchor = new AnchorOnCanvas(this, b.x,b.y)
        } else {
          anchor = new AnchorBeneathBlock(parent)
        }
        const block = new BlockModel(b,anchor); // the block will attach itself to parent using 'addBlock()'
        parent = block;
      })
    }
  }
  @action 
  addBlock(b) {
    this.blocks.push(b);
  }
  @action 
  moveBlockToTop(block) {
      const idx = this.blocks.indexOf(block);
      mxu.moveItem(this.blocks,idx,this.blocks.length-1)
  }

}

