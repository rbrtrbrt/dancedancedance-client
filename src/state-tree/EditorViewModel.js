import React from 'react';
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

import { CanvasDocModel } from './CanvasDocModel';

import { ll, gg, ge } from '../helpers/debug/ll';

export const EditorViewModel = ty.model("EditorViewModel", {
  debugName: ty.maybe(ty.string),
  canvas: ty.reference(CanvasDocModel),
  viewportX: ty.optional(ty.number,0),
  viewportY: ty.optional(ty.number,0),
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
        return rectContainsPoint( _clientRect, uiTracker.mouseX, uiTracker.mouseY );
      }
    },
    actions: {
      afterCreate() {
        if(self.debugName == undefined) {
          self.debugName = newId("editor")
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
      },
    }
  }
})
