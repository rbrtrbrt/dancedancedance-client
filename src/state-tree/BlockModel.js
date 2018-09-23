import * as mxu from "mobx-utils";
import * as mxr from "mobx-react";

import * as mx from "mobx";
import * as mst from "mobx-state-tree";
const ty = mst.types;

export const BlockModel = types.model("Block", {
    x: ty.number,
    y: ty.number,
    isHovering: ty.optional(ty.boolean, false)
  })
  .extend(self => {
    const _width =  300;
    const _height =  40;
    return {
      views: {
        get width() {
          return _width;
        },
        get height() {
          return _height;
        }
      },
      actions: {
        moveTo(x, y) {
          self.x = x;
          self.y = y;
        },
        move(dx, dy) {
          self.x += dx;
          self.y += dy;
        },
        grow(dw,dh) {
          self._width += dw;
          self._height += dh;
        }
      }
    };
  });