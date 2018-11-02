import * as mx from "mobx";
import * as mxu from "mobx-utils";
import * as mxr from "mobx-react";
import { setLogEnabled } from "mobx-react-devtools";

import * as mst from "mobx-state-tree";
const ty = mst.types;

import { uiTracker } from "../helpers/UITracker";
import { offsetFromDocument, vectorLength,rectContainsPoint } from "../helpers/measure";

import { newId } from "../helpers/idMaker";
import cuid from "cuid";

import { InputFieldModel } from '../state-tree/FieldModel';
import { CanvasModel } from '../state-tree/CanvasModel';

import { theme } from "../style/defaultStyleParams";

import { ll, gg, ge } from '../helpers/debug/ll';

const BlockOnCanvas = ty.model("BlockOnCanvas", {
  x: ty.number,  // canvas coord
  y: ty.number,  // canvas coord
}).actions( self => ({
    moveTo(x, y) {
      self.x = Math.round(x);
      self.y = Math.round(y);
    },
    moveBy(dx, dy) {
      self.x += Math.round(dx);
      self.y += Math.round(dy);
    }, 
}))

const BlockAttach = ty.model("BlockAttach", {
  parentBlock: ty.reference(ty.late(()=>BlockModel))
})

export const BlockModel = ty.model("Block", {
    debugName: ty.maybe(ty.string),
    id: ty.identifier,
    title: ty.maybe(ty.string),
    anchor: ty.union(BlockOnCanvas, BlockAttach),
    dragState: ty.optional(ty.enumeration("dragState",["notDragging", "dragging:BeforeCorrect","dragging:Correcting","dragging"]), "notDragging"),
    fields: ty.array(ty.union(InputFieldModel))
  })
  .extend(self => {
    const _headerSize = mx.observable({
      width: 300,
      height: 40,
    })
    let _hasFocus = false;
    let _dragCorrectionX = null;
    let _dragCorrectionY = null;
    let _whenDisposer = null;
    return { 
      views: { 
        get width() {
          return theme.blockLeftTabWidth + _headerSize.width + theme.blockContentMargin * 2;
        },
        get height() {
          return _headerSize.height + theme.blockContentMargin * 2;
        },
        get x() {
          return self.anchor.x
        },
        get y() {
          return self.anchor.y
        },
        get blockTitle() {
          ll(1, ()=> self.title, ()=> self.debugName)
          return self.title || self.debugName
        },
        get dragCorrectionX() {
          if( self.dragState !== "notDragging" ) {
            return _dragCorrectionX
          } else {
            throw new Error(`Can't get dragCorrectionX of ${self.debugName} with dragState ${self.dragState}`)
          }
        },
        get dragCorrectionY() {
          if( self.dragState !== "notDragging" ) {
            return _dragCorrectionY
          } else {
            throw new Error(`Can't get dragCorrectionY of ${self.debugName} with dragState ${self.dragState}`)
          }
        },
      }, 
      actions: {
        afterCreate() {
          if(self.debugName == undefined) {
            self.debugName = newId("block")
          }
          if(self.id == undefined) {
            self.id = cuid();
          }
        },
        newHeaderSize(newWidth, newHeight) {
          _headerSize.width = newWidth;
          _headerSize.height = newHeight;
        },
        setFocus(hasFocus) {
          _hasFocus = hasFocus;
        },
        moveToTop() {
          mst.getParentOfType(self,CanvasModel).moveBlockToTop(self);
        },
        // called when drag distance > 3
        startDragCorrecting() {
          self.dragState = "dragging:Correcting"; 
        },
        // called by UI when correction animation is done
        correctionRest() {
          self.dragState = "dragging";
        },
        startDrag(evt) {
          let [x,y] = uiTracker.startDrag(evt, self);
          _dragCorrectionX = x - self.anchor.x
          _dragCorrectionY = y - self.anchor.y
          self.dragState = "dragging:BeforeCorrect"
          _whenDisposer = mx.when( ()=> {
            return self.dragState === "dragging:BeforeCorrect" && 
                   vectorLength(uiTracker.dragDeltaX, uiTracker.dragDeltaY) > 3
          }, self.startDragCorrecting );
        }, 
        endDrag(x,y) {
          _whenDisposer();
          mst.getParentOfType(self,CanvasModel).moveBlockToTop(self);
          if(self.dragState === "dragging:BeforeCorrect") {
            self.anchor.moveTo(x-_dragCorrectionX,y-_dragCorrectionY);
          } else {
            self.anchor.moveTo(x,y);
          }
          _dragCorrectionX = null;
          _dragCorrectionY = null;
          self.dragState = "notDragging"
        }, 
      } 
    };
});