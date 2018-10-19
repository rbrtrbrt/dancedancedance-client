import React from 'react';

import * as mx from "mobx";
import * as mxu from "mobx-utils";
import * as mxr from "mobx-react";
import makeInspectable from "mobx-devtools-mst";

import * as mst from "mobx-state-tree";
const ty = mst.types;

import { mouseTracker } from "../helpers/mouseTracker";
import { offsetFromDocument, vectorLength,rectContainsPoint } from "../helpers/measure";

import { newId } from "../helpers/idMaker";
import { setLogEnabled } from "mobx-react-devtools";
import ll from '../helpers/debug/ll';

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
  // connected: BlockModel
})

export const BlockModel = ty.model("Block", {
    name: ty.maybe(ty.string),
    anchor: ty.union(BlockOnCanvas, BlockAttach),
    dragState: ty.optional(ty.enumeration("dragState",["notDragging", "dragging:BeforeCorrect","dragging:Correcting","dragging"]), "notDragging"),
  })
  .extend(self => {
    const _width = 300;
    const _height = 40;
    let _dragCorrectionX = null;
    let _dragCorrectionY = null;
    let _whenDisposer = null;
    return { 
      views: { 
        get width() {
          return _width;
        },
        get height() {
          return _height;
        },
        get x() {
          return self.anchor.x
        },
        get y() {
          return self.anchor.y
        },
        get dragCorrectionX() {
          if( self.dragState !== "notDragging" ) {
            return _dragCorrectionX
          } else {
            throw new Error(`Can't get dragCorrectionX of ${self.name} with dragState ${self.dragState}`)
          }
        },
        get dragCorrectionY() {
          if( self.dragState !== "notDragging" ) {
            return _dragCorrectionY
          } else {
            throw new Error(`Can't get dragCorrectionY of ${self.name} with dragState ${self.dragState}`)
          }
        },
      }, 
      actions: {
        grow(dw, dh) {
          self._width += dw;
          self._height += dh;
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
          let [x,y] = mouseTracker.startDrag(evt, self);
          _dragCorrectionX = x - self.anchor.x
          _dragCorrectionY = y - self.anchor.y
          self.dragState = "dragging:BeforeCorrect"
          _whenDisposer = mx.when( ()=> {
            return self.dragState === "dragging:BeforeCorrect" && 
                   vectorLength(mouseTracker.dragDeltaX,mouseTracker.dragDeltaY) > 3
          }, self.startDragCorrecting );
        }, 
        endDrag(x,y) {
          _whenDisposer();
          ll(11,()=>mst.getParentOfType(self,CanvasModel)).moveBlockToTop(self);
          self.anchor.moveTo(x,y);
          _dragCorrectionX = null;
          _dragCorrectionY = null;
          self.dragState = "notDragging"
        }, 
        afterCreate() {
          if(self.name == undefined) {
            self.name = newId("block")
          }
        }
      } 
    };
  });

export const CanvasModel = ty.model("CanvasModel", {
    id: ty.identifierNumber,
    blocks: ty.array(BlockModel)
  }).extend( self => {
    return {
      views: {
        // get extent() {
        // }
      },
      actions: {
        add(block) {
          blocks.push(block)
        },
        moveBlockToTop(block) {
          ll("before:", ()=>self.blocks)
          const idx = self.blocks.indexOf(block);
          mxu.moveItem(self.blocks,idx,self.blocks.length-1)
          ll("after:", ()=>self.blocks)
        }
      }
    }
  })
  
  export const EditorModel = ty.model("EditorModel", {
    name: ty.maybe(ty.string),
    canvas: ty.reference(CanvasModel),
    viewportX: ty.optional(ty.number,0),
    viewportY: ty.optional(ty.number,0)
  }).extend( self => {
    const _measureRef = React.createRef();
    let _clientRect = null;

    return {
      views: {
        get measureRef() {
          return _measureRef;
        },
        get clientRect() {
          return _clientRect;
        },
        get containsMouse() {
          return rectContainsPoint( _clientRect, mouseTracker.mouseX, mouseTracker.mouseY );
        }
      },
      actions: {
        afterCreate() {
          if(self.name == undefined) {
            self.name = newId("editor")
          }
        },
        refreshClientRect() {
          if(_measureRef.current) {
            return _clientRect = offsetFromDocument(_measureRef.current);
          } else {
            return undefined;
          }
        },
        clientToCanvas(x,y) {
          return _clientRect && [x - _clientRect.left - self.viewportX, y - _clientRect.top - self.viewportY ]
        },
        handleWheel(e) {
          e.preventDefault();
          if (e.ctrlKey) {
            // Your zoom/scale factor
            ll(12,(scale) => e.deltaY * 0.01, ()=>e.deltaMode )
          } else {
            // Your trackpad X and Y positions
            self.viewportX += e.deltaX
            self.viewportY += e.deltaY
          }
        }
      }
    }
  })




  export const AppModel = ty.model("AppModel", {
    editor1: EditorModel,
    editor2: EditorModel,
    canvas: CanvasModel
  }).extend( self => {
    return {
      views: {
        get dndPanels() {
          return [self.editor1, self.editor2]
        }
      },
      actions: {
      }
    }
  })


  export const appModel = AppModel.create({
    canvas: {
      id: 12345,
      blocks: [
        { anchor: { x: 100, y: 100 } },
        { anchor: { x: 0, y: 0 } },
        { anchor: { x: 400, y: 50 } },
        { anchor: { x: -10, y: 150 } },
      ]
    },
    editor1: {
      canvas: 12345
    },
    editor2: {
      canvas: 12345
    }
  });
mouseTracker.addDndPanels(...appModel.dndPanels)
window.app = appModel
makeInspectable(appModel);
  