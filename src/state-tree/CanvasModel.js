import * as mx from "mobx";
import * as mxu from "mobx-utils";
import * as mxr from "mobx-react";
import { setLogEnabled } from "mobx-react-devtools";

import * as mst from "mobx-state-tree";
const ty = mst.types;

import { newId } from "../helpers/idMaker";
import cuid from "cuid";

import { BlockModel } from '../state-tree/BlockModel';


export const CanvasModel = ty.model("CanvasModel", {
  id: ty.identifier,
  blocks: ty.array(BlockModel)
})
.extend( self => {
  return {
    views: {
      // get extent() {
      // }
    },
    actions: {
      afterCreate() {
        if(self.id == undefined) {
          self.id = cuid();
        }
      },
      add(block) {
        blocks.push(block)
      },
      moveBlockToTop(block) {
        const idx = self.blocks.indexOf(block);
        mxu.moveItem(self.blocks,idx,self.blocks.length-1)
      }
    }
  }
})

