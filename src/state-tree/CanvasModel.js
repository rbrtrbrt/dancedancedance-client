import * as mxu from "mobx-utils";
import * as mxr from "mobx-react";

import * as mx from "mobx";
import * as mst from "mobx-state-tree";
const ty = mst.types;


const canvasMargin = 40;

export const CanvasModel = ty.model("Canvas", {
  originX: ty.number = 0,
  originY: ty.number = 0,
  scrollX: ty.number = 0,
  scrollY: ty.number = 0,
  })
  .extend(self => {
    return { 
      views: { 
      }, 
      actions: {
        accommodate(canvasX,canvasY) {
          if(-canvasX > self.originX) {
            self.originX = canvasMargin - canvasX
          }
          if(-canvasY > self.originY) {
            self.originY = canvasMargin - canvasY
          }
        },
      } 
    };
  });
