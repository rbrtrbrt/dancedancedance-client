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

  constructor({name, value, id}, parent) {
    checkType( () => name, String);
    checkType( ()=> value, String);
    checkOptionalType( ()=> id, String);
    this.fieldName = name;
    this.value = value;
    this.id = id || cuid();
    this.debugName = uniqueName(`Field(${name})`)
    if(parent) {
      this.parent = parent;
      parent.addField(this);
    }
  }

  @computed get
  label() { return this.fieldName ? this.fieldName+":" : "" }

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