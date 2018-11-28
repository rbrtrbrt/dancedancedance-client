import React from 'react';
import ReactDOM from 'react-dom';
import makeInspectable from "mobx-devtools-mst";

import './style/defaultStyleParams';
import './style/main.sass';

import cuid from 'cuid';

import { UITracker } from './helpers/UITracker';
import { AppModel } from './state-tree/AppModel';
import { AppUI } from './components/AppUI';
import { ll } from './helpers/debug/ll';

console.log("HI THERE!!");


const eye1Block = { 
  title: "circle",
  fields: [
    {name: "x", value: "150"},
    {name: "y", value: "100"},
    {name: "r", value: "15"},
  ]
}
const eye2Block = { 
  title: "circle",
  fields: [
    {name: "x", value: "200"},
    {name: "y", value: "100"},
    {name: "r", value: "15"},
  ]
}
const noseBlock = { 
  title: "line",
  fields: [
    {name: "start x", value: "175"},
    {name: "start y", value: "120"},
    {name: "end x", value: "175"},
    {name: "end y", value: "150"},
  ]
}
const mouthBlock = { 
  title: "arc",
  fields: [
    {name: "center x", value: "175"},
    {name: "center y", value: "120"},
    {name: "width", value: "70"},
    {name: "height", value: "80"},
    {name: "start angle", value: "225"},
    {name: "end angle", value: "315"},
  ]
}

export const testAppModel = new AppModel({
  document: {
    blocks: [
      [{...eye1Block,x:200,y:200}, eye2Block, noseBlock, mouthBlock],
      { x: 0, y: 0, 
        title: "open file",
        fields: [
          { name: "fileName", value: "~/my-poems.txt"},
          { name: "seek position", value: "853"},
        ] 
      },
      { x: 400, y: 50, title: "Exit program"},
      { x: -10, y: 150,
        title: "create table column",
        fields: [
          {name: "column name", value: "id"},
          {name: "type", value: "int"},
          {name: "nullable", value: "no"},
          {name: "indexed",value: ""},
        ] 
      },
    ]
  },
  editor1: {
    x:0, y:0
  },
  editor2: {
    x:-100, y:-100
  }
});

const theUITracker = new UITracker(testAppModel);
window.app = testAppModel
makeInspectable(testAppModel);

ReactDOM.render(<AppUI appInfo={testAppModel}/>, document.getElementById("react-root"))