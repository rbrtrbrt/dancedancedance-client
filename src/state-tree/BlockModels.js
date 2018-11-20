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
    const _dimensions = mx.observable({
      titleWidth: 0
    });
    let _fieldLayout = mx.observable.map()
    let _dragCorrectionX = null;
    let _dragCorrectionY = null;
    let _whenDisposer = null;
    return { 
      views: { 
        get width() {
          const [fieldsWidth, , ] = self.fieldsLayout;
          return theme.blockLeftTabWidth + fieldsWidth + theme.blockContentMarginX * 2;
        },
        get height() {
          const [ ,fieldsHeight, ] = self.fieldsLayout;
          return fieldsHeight + theme.blockContentMarginY * 2;
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
        get fieldsLayout() {
          const fieldLocations = new Map();
          let curX = _dimensions.titleWidth;
          let maxWidth = curX;
          let curY = 0;
          let lineHeight = 14;
          const space = theme.fieldSeparationSpace
          self.fields.forEach( (field,idx)=>{
            const loc = {};
            const spacedWidth = field.width + ( curX == 0 ? 0 : space)
            if(curX + spacedWidth > theme.blockHeaderMaxWidth) {
              curX = 0;
              curY += lineHeight;
              lineHeight = 0;
              maxWidth = theme.blockHeaderMaxWidth;
            } else {
              curX += theme.fieldSeparationSpace
            }
            loc.x = curX
            loc.y = curY
            curX += field.width
            maxWidth = Math.max(maxWidth, loc.x + field.width)
            lineHeight = Math.max(lineHeight,field.height);
            fieldLocations.set(field,loc)
          })
          return [maxWidth, curY+lineHeight,fieldLocations];
        },
        fieldPosition(field) {
          const [ , ,fieldLocs] = self.fieldsLayout;
          return fieldLocs.get(field);
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
        updateTitleWidth(width){
          _dimensions.titleWidth = width;
          ll(self.title,()=>_dimensions.titleWidth)
        }
      }, 
    };
});
