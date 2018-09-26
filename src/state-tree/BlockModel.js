import * as mxu from "mobx-utils";
import * as mxr from "mobx-react";

import * as mx from "mobx";
import * as mst from "mobx-state-tree";
const ty = mst.types;

import mouseTracker from "../helpers/mouseTracker"


const BlockOnCanvas = ty.model("BlockOnCanvas", {
  x: ty.number,
  y: ty.number,
}).actions( self => ({
    moveTo(x, y) {
      self.x = x;
      self.y = y;
    },
    move(dx, dy) {
      self.x += dx;
      self.y += dy;
    }, 
}))

const BlockAttach = ty.model("BlockAttach", {
  // connected: BlockModel
})

export const BlockModel = ty.model("Block", {
    anchor: ty.union(BlockOnCanvas, BlockAttach),
    isDragging: ty.optional(ty.boolean, false),
  })
  .extend(self => {
    const _width = 300;
    const _height = 40;
    return { 
      views: { 
        get width() {
          return _width;
        },
        get height() {
          return _height;
        },
        get x() {
          if( self.isDragging )
            return self.anchor.x + mouseTracker.dragX
          else
            return self.anchor.x
        },
        get y() {
          if( self.isDragging )
            return self.anchor.y + mouseTracker.dragY
          else
            return self.anchor.y
        }
      }, 
      actions: {
        grow(dw, dh) {
          self._width += dw;
          self._height += dh;
        }, 
        startDrag(evt) {
          mouseTracker.startDrag(evt, self);
          self.isDragging = true;
        }, 
        endDrag(evt) {
          self.isDragging = false;
          self.anchor.setPos(self.anchor.x + mouseTracker.dragX,self.anchor.y + mouseTracker.dragY)
        }, 
      } 
    };
  });
