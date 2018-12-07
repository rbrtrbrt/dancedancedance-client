import React from 'react';
import * as mx from "mobx";
const {observable, computed, action} = mx;
import * as mxu from "mobx-utils";
import * as mxr from "mobx-react";
import { setLogEnabled } from "mobx-react-devtools";

import { uiTracker } from "../helpers/UITracker";
import { offsetFromDocument, vectorLength,domRectContainsPoint } from "../helpers/measure";

import { uniqueName } from "../helpers/nameMaker";
import cuid from "cuid";

import { ll, gg, ge, checkDef } from '../helpers/debug/ll';

export class EditorModel {
  @observable debugName;
  @observable document;
  @observable viewportX;
  @observable viewportY;

  @observable _clientRect;

  constructor({document,x,y,debugName}) {
    checkDef( ()=>document );
    this.document = document;
    this.debugName = debugName || uniqueName("Editor");
    this.viewportX = x;
    this.viewportY = y;

    this._measureRef = React.createRef();
    this._clientRect = null;
  }
  get measureRef() {
    return this._measureRef;
  }
  @computed get
  containsMouse() {
    return domRectContainsPoint( this._clientRect, uiTracker.mouseX, uiTracker.mouseY );
  }
  @computed get 
  isDragPanel() {
    return uiTracker.drag && uiTracker.drag.lastDragPanel === this
  }
  @action
  refreshClientRect() {
    if(this._measureRef.current) {
      return this._clientRect = offsetFromDocument(this._measureRef.current);
    } else {
      return undefined;
    }
  }
  clientToCanvas(x,y) {
    checkDef( this._clientRect );
    return { x: x - this._clientRect.left - this.viewportX,
             y: y - this._clientRect.top - this.viewportY };
  }
  @action.bound
  handleWheel(e) {
    e.preventDefault();
    if (e.ctrlKey) {
      // Your zoom/scale factor
      ll("Wheelzoom:",(scale) => e.deltaY * 0.01, ()=>e.deltaMode )
    } else {
      // Your trackpad X and Y positions
      this.viewportX += e.deltaX
      this.viewportY += e.deltaY
    }
  }
}