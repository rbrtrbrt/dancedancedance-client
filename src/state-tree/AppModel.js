import * as mx from "mobx";
const {observable, computed, action} = mx;
import * as mxu from "mobx-utils";
import * as mxr from "mobx-react";
import { setLogEnabled } from "mobx-react-devtools";

import * as mst from "mobx-state-tree";
const ty = mst.types;

import { ll, checkDef } from "../helpers/debug/ll";

import { DocumentModel } from './DocumentModel';
import { EditorModel } from './EditorModel';


export class AppModel {
  @observable editor1;
  @observable editor2;
  @observable document;

  constructor({document,editor1,editor2}) {
    checkDef( ()=> document );
    this.document = new DocumentModel(document);
    editor1.document = this.document;
    this.editor1 = new EditorModel(editor1);
    this.editor1.debugName = "LeftEditor";
    editor2.document = this.document;
    this.editor2 = new EditorModel(editor2);
    this.editor2.debugName = "RightEditor";
  }
  @computed get
  dndPanels() {
    return [this.editor1, this.editor2]
  }
}

// export const AppViewModel = ty.model("AppViewModel", {
//   editor1: EditorViewModel,
//   editor2: EditorViewModel,
//   canvas: CanvasDocModel
// }).extend( self => {
//   return {
//     views: {
//       get dndPanels() {
//         return [self.editor1, self.editor2]
//       }
//     },
//     actions: {
//     }
//   }
// })
