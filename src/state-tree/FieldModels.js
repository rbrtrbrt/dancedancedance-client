import * as mx from "mobx";
const {observable, computed,action} = mx;
import * as mxu from "mobx-utils";
import * as mxr from "mobx-react";
import { setLogEnabled } from "mobx-react-devtools";

import { measureTextWidth } from "../helpers/measure";

import { theme } from "../style/defaultStyleParams";
import { uniqueName } from "../helpers/nameMaker";
import cuid from "cuid";

import {ll, checkDef, checkType, checkOptionalType} from "../helpers/debug/ll";

export class FieldModel {
  @observable fieldName;
  @observable value;
  @observable id;
  @observable debugName;

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
  @computed 
  get label() { 
    return this.fieldName ? this.fieldName+":" : "" 
  }
  @computed 
  get width() {
    return this.labelWidth + this.valueWidth;
  }
  @computed 
  get maxValueWidth() { 
    return theme.blockHeaderMaxWidth - this.labelWidth;
  }
  @computed 
  get height() { 
    return theme.blockFontSize; 
  }
  // @computed
  get childX() {
    return this.parent.fieldPosition(this).x;
  }
  // @computed
  get childY() {
    return this.parent.fieldPosition(this).y;
  }
  @computed
  get canvasX() {
    return this.childX + this.parent.canvasX;
  }
  @computed
  get canvasY() {
    return this.childY + this.parent.canvasY;
  }
  @computed
  get labelWidth() {
    const {blockFontSize, fieldLabelFont} = theme;
    const fontSpec = `400 ${blockFontSize}px "${fieldLabelFont}"`;
    const width = measureTextWidth(this.label, fontSpec) + theme.fieldLabelValueSpace;
    return width;
  }
  @computed
  get valueWidth() {
    const {blockFontSize, fieldInputFont} = theme;
    const fontSpec = `500 ${blockFontSize}px "${fieldInputFont}"`;
    const width = measureTextWidth(this.value||'\u00a0\u00a0', fontSpec);
    return width;
  }  
  @action.bound
  handleValueChange(value) {
    this.value = value;
  }
}