import * as mx from "mobx";
import * as mxu from "mobx-utils";
import * as mxr from "mobx-react";
import { setLogEnabled } from "mobx-react-devtools";

import * as mst from "mobx-state-tree";
const ty = mst.types;

import {BlockDocModel } from "../state-tree/BlockModels";

import { newId } from "../helpers/idMaker";
import cuid from "cuid";

import {ll} from "../helpers/debug/ll";



export const FieldViewModel = ty.model("FieldDocModel", {
})

export const FieldDocModel = ty.model("FieldDocModel", {
  debugName: ty.maybe(ty.string),
  id: ty.identifier,
  fieldName: ty.string,
  value: ty.maybe(ty.string),
})
.extend(self => {
  const _dimensions = mx.observable({  // one-field observable object feels easier than boxed value observable.
    valueWidth: 0,
    labelWidth: 0
  })
  return {
    views: {
      get label() {
        return self.fieldName + ":";
      },
      get width() {
        return _dimensions.labelWidth + _dimensions.valueWidth;
      },
      get height() {
        return 16;
      },
      get location() {
        return mst.getParentOfType(self,BlockDocModel).fieldPosition(self);
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
      },
      // updateFieldWidth(width) {
      //   _dimensions.fieldWidth = width;
      // },
      updateValueWidth(width) {
        _dimensions.valueWidth = width;
      },
      updateLabelWidth(width) {
        _dimensions.labelWidth = width;
        ll(self.label, ()=> _dimensions.labelWidth)
      }
    }
  }
});