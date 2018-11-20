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

import { ll, gg, ge, checkDef } from '../helpers/debug/ll';


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

export const HangingBlock = ty.model("HangingBlock", {
  aboveBlock: ty.reference(ty.late(()=>BlockDocModel))
}).extend(self => {
  return {
    views: {
      get x() {
        return self.aboveBlock.x
      },
      get y() {
        return self.aboveBlock.y + self.aboveBlock.height
      },
    },
    actions: {
    }
  }
})

export const BlockDocModel = ty.model("Block", {
    debugName: ty.maybe(ty.string),
    id: ty.identifier,
    title: ty.maybe(ty.string),
    anchor: ty.union(BlockOnCanvas, HangingBlock),
    fields: ty.array(ty.union(FieldDocModel)),
    blockBelow: ty.late(()=>ty.maybe(ty.reference(BlockDocModel)))
  })
  .extend(self => {
    const _dimensions = mx.observable({
      titleWidth: 0
    });
    let _fieldLayout = mx.observable.map()
    let _dragCorrectionX = null;
    let _dragCorrectionY = null;
    let _whenDisposer = null;

    self.allBlocksBelow = function*(excludeSelf=false) {
      let block = self;
      if(excludeSelf) {
        block = block.blockBelow
      }
      while(block) {
        yield block;
        block = block.blockBelow
      }
    }
  
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
        get distanceFromTopBlock() {
          const aboveBlock = self.anchor.aboveBlock;
          if(aboveBlock){
            return aboveBlock.distanceFromTopBlock + aboveBlock.height
          } else {
            return 0
          }
        },
        get blockTitle() {
          return self.title || self.debugName
        },
        get dragCorrectionX() {
          checkDef(_dragCorrectionX,`Can't get dragCorrectionX of ${self.debugName}`)
          return _dragCorrectionX
        },
        get dragCorrectionY() {
          checkDef(_dragCorrectionY,`Can't get dragCorrectionY of ${self.debugName}`)
          return _dragCorrectionY
        },
        get isDragging() {
          return uiTracker.drag.item === self ||
                 ( self.anchor.aboveBlock && self.anchor.aboveBlock.isDragging )
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
        connectKibbitzers() {
          checkDef(uiTracker.drag.item,"Kibbitzers are not available when not dragging.");
          
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
        afterAttach() {
          if( self.anchor.aboveBlock ) {
            self.anchor.aboveBlock.setBelowBlock(self)
          }
        },
        setBelowBlock(bBlock) {
          self.blockBelow = bBlock;
        },
        moveToTop() {
          mst.getParentOfType(self,CanvasDocModel).moveBlockToTop(self);
        },
        startDrag(evt) {
          let [x,y] = uiTracker.startDrag(evt, self); // canvas coords
          _dragCorrectionX = x - self.anchor.x
          _dragCorrectionY = y - self.anchor.y
        }, 
        endDrag(x,y) {
          self.moveToTop();
          if(uiTracker.drag.correctingState === "beforeCorrect") {
            self.anchor.moveTo(x-_dragCorrectionX,y-_dragCorrectionY);
          } else {
            self.anchor.moveTo(x,y);
          }
          _dragCorrectionX = null;
          _dragCorrectionY = null;
        }, 
        updateTitleWidth(width){
          _dimensions.titleWidth = width;
        }
      }, 
    };
});
