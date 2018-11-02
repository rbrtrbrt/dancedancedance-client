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

import { CanvasModel } from '../state-tree/CanvasModel';
import { EditorModel } from '../state-tree/EditorModel';

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
