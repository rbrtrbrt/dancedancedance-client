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
 
export const FieldViewModel = ty.model("FieldDocModel", {
})

export const FieldDocModel = ty.model("FieldDocModel", {
  debugName: ty.maybe(ty.string),
  id: ty.identifier,
  fieldName: ty.string,
  value: ty.maybe(ty.string),
})
.extend(self => {

  return {
    views: {
      get label() {
        return self.fieldName + ":"
      }
    },
    actions: {
      afterCreate() {
        if(self.debugName == undefined) {
          self.debugName = newId("inputField")
        }
        if(self.id == undefined) {
          self.id = cuid();
        }
      },
      handleValueChange(value) {
        self.value = value;
      }
    }
  }
});