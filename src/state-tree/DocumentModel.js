import * as mx from "mobx";
const {observable, computed, action} = mx;
import * as mxu from "mobx-utils";
import * as mxr from "mobx-react";
import { setLogEnabled } from "mobx-react-devtools";

import cuid from "cuid";
import { ll, checkType, checkOptionalType } from "../helpers/debug/ll";

import { BlockModel, createBlockChain } from './BlockModel';

export class CanvasModel {

}

export class DocumentModel extends CanvasModel {
  @observable id;
  @observable blocks = [];

  constructor({id,blocks}) {
    super()
    this.id = id || cuid();
    blocks = blocks || [];
    const locationInfo = new Map();
    for(let blockData of blocks) {
      let block;
      if(Array.isArray(blockData)){
        block = createBlockChain(blockData);
        const {x,y} = blockData[0];
        locationInfo.set(block, {x,y});
      } else {
        block = new BlockModel(blockData);
        const {x,y} = blockData;
        locationInfo.set(block, {x,y});
      }
      this.blocks.push(block);
    }
    for(const block of this.blocks) {
      block.attachToParent(this, locationInfo.get(block));
    }
  }
  @action 
  moveBlockToTop(block) {
    // do {
      const idx = this.blocks.indexOf(block);
      mxu.moveItem(this.blocks,idx,this.blocks.length-1)
      // block = block.blockBelow
    // } while(block)
  }

}

// export const CanvasDocModel = ty.model("CanvasDocModel", {
//   id: ty.identifier,
//   blocks: ty.array(BlockDocModel)
// })
// .extend( self => {
//   return {
//     views: {
//     },
//     actions: {
//       afterCreate() {
//         if(self.id == undefined) {
//           self.id = cuid();
//         }
//       },
//       add(block) {
//         blocks.push(block)
//       },
//       moveBlockToTop(block) {
//         do {
//           const idx = self.blocks.indexOf(block);
//           mxu.moveItem(self.blocks,idx,self.blocks.length-1)
//           block = block.blockBelow
//         } while(block)
//       }
//     }
//   }
// })

