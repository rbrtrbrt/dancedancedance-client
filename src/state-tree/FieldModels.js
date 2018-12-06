import * as mx from "mobx";
const {observable, computed,action} = mx;
import * as mxu from "mobx-utils";
import * as mxr from "mobx-react";
import { setLogEnabled } from "mobx-react-devtools";


import { theme } from "../style/defaultStyleParams";
import { uniqueName } from "../helpers/nameMaker";
import cuid from "cuid";

import {ll, checkDef, checkType, checkOptionalType} from "../helpers/debug/ll";

export class FieldModel {
  @observable fieldName;
  @observable value;
  @observable id;
  @observable debugName;

  @observable _measurements = {valueWidth:0,labelWidth:0};
  @observable parent = null;

  constructor({name, value, id, debugName}, parent) {
    checkType( () => name, String);
    checkType( ()=> value, String);
    checkOptionalType( ()=> id, String);
    checkOptionalType( ()=> debugName, String);
    this.fieldName = name;
    this.value = value;
    this.id = id || cuid();
    this.debugName = debugName || uniqueName("Field")
    if(parent) {
      this.parent = parent;
      parent.addField(this);
    }
  }

  @computed get
  label() { return this.fieldName+":" }

  @computed get 
  width() {
    return this._measurements.labelWidth + this._measurements.valueWidth;
  }

  @computed get
  maxValueWidth() { 
    return theme.blockHeaderMaxWidth - this._measurements.labelWidth;
  }

  @computed get
  height() { return 16; }

  @computed
  get location() {
    return this.parent.fieldPosition(this);
  }
  @action.bound
  handleValueChange(value) {
    this.value = value;
  }

  @action.bound
  updateValueWidth(width) {
    this._measurements.valueWidth = width;
  }

  @action.bound
  updateLabelWidth(width) {
    this._measurements.labelWidth = width;
  }
}

// export const FieldDocModel = ty.model("FieldDocModel", {
//   debugName: ty.maybe(ty.string),
//   id: ty.identifier,
//   fieldName: ty.string,
//   value: ty.maybe(ty.string),
// })
// .extend(self => {
//   const _dimensions = mx.observable({  // one-field observable object feels easier than boxed value observable.
//     valueWidth: 0,
//     labelWidth: 0
//   })
//   return {
//     views: {
//       get label() {
//         return self.fieldName + ":";
//       },
//       get width() {
//         return _dimensions.labelWidth + _dimensions.valueWidth;
//       },
//       get height() {
//         return 16;
//       },
//       get location() {
//         return mst.getParentOfType(self,BlockDocModel).fieldPosition(self);
//       }
//     },
//     actions: {
//       afterCreate() {
//         if(self.debugName == undefined) {
//           self.debugName = newId("inputField")
//         }
//         if(self.id == undefined) {
//           self.id = cuid();
//         }
//       },
//       handleValueChange(value) {
//         self.value = value;
//       },
//       // updateFieldWidth(width) {
//       //   _dimensions.fieldWidth = width;
//       // },
//       updateValueWidth(width) {
//         _dimensions.valueWidth = width;
//       },
//       updateLabelWidth(width) {
//         _dimensions.labelWidth = width;
//       }
//     }
//   }
// });