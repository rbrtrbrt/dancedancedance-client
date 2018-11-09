import * as mx from "mobx";
import * as mxu from "mobx-utils";
import * as mxr from "mobx-react";
import { setLogEnabled } from "mobx-react-devtools";

import * as mst from "mobx-state-tree";
const ty = mst.types;


import { newId } from "../helpers/idMaker";
import cuid from "cuid";

import { CanvasDocModel } from './CanvasDocModel';
import { EditorViewModel } from './EditorViewModel';

export const AppViewModel = ty.model("AppViewModel", {
  editor1: EditorViewModel,
  editor2: EditorViewModel,
  canvas: CanvasDocModel
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
