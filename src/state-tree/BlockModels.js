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

import { FieldViewModel, FieldDocModel } from './FieldModels';
import { CanvasDocModel } from './CanvasDocModel';

import { theme } from "../style/defaultStyleParams";

import { ll, gg, ge } from '../helpers/debug/ll';


// Little models describing how a block gets its position:

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
  parentBlock: ty.reference(ty.late(()=>BlockDocModel))
})

export const BlockDocModel = ty.model("Block", {
    debugName: ty.maybe(ty.string),
    id: ty.identifier,
    title: ty.maybe(ty.string),
    anchor: ty.union(BlockOnCanvas, BlockAttach),
    dragState: ty.optional(ty.enumeration("dragState",["notDragging", "dragging:BeforeCorrect","dragging:Correcting","dragging"]), "notDragging"),
    // dragClickX: ty.maybe(ty.number),
    // dragClickY: ty.maybe(ty.number),
    fields: ty.array(ty.union(FieldDocModel))
  })
  .extend(self => {
    const _headerSize = mx.observable({
      width: 300,
      height: 40,
    });
    let _dragCorrectionX = null;
    let _dragCorrectionY = null;
    let _whenDisposer = null;
    return { 
      views: { 
        get width() {
          return theme.blockLeftTabWidth + _headerSize.width + theme.blockContentMargin * 2;
        },
        get height() {
          ll(this.blockTitle, ()=>_headerSize.height, (result)=> _headerSize.height + theme.blockContentMargin * 2)
          return _headerSize.height + theme.blockContentMargin * 2;
        },
        get x() {
          return self.anchor.x
        },
        get y() {
          return self.anchor.y
        },
        get blockTitle() {
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
            self.debugName = newId("Block")
          }
          if(self.id == undefined) {
            self.id = cuid();
          }
        },
        newHeaderSize(newWidth, newHeight) {
          _headerSize.width = newWidth;
          _headerSize.height = newHeight;
        },
        moveToTop() {
          mst.getParentOfType(self,CanvasDocModel).moveBlockToTop(self);
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
          let [x,y] = uiTracker.startDrag(evt, self); // canvas coords
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
          self.moveToTop();
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
