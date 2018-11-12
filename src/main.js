import React from 'react';
import ReactDOM from 'react-dom';
import makeInspectable from "mobx-devtools-mst";

import './style/defaultStyleParams';
import './style/main.sass';

import cuid from 'cuid';

import { UITracker } from './helpers/UITracker';
import { AppViewModel } from './state-tree/AppViewModel';
import { AppUI } from './components/AppUI';
import { ll } from './helpers/debug/ll';

console.log("HI THERE!!");

const canvasId=cuid();
export const testAppModel = AppViewModel.create({
  canvas: {
    id: canvasId,
    blocks: [
      { id: cuid(), anchor: { x: 100, y: 100 }, 
        title: "circle",
        fields: [
          {id: cuid(),fieldName: "x", value: "150"},
          {id: cuid(),fieldName: "y", value: "300"},
          {id: cuid(),fieldName: "r", value: "100"},
        ]
      },
      { id: cuid(), anchor: { x: 0, y: 0 }, 
        title: "open file",
        fields: [
          {id: cuid(),fieldName: "fileName", value: "~/my-poems.txt"},
          {id: cuid(),fieldName: "seek position", value: "853"},
        ] 
      },
      { id: cuid(), anchor: { x: 400, y: 50 }, fields: []},
      { id: cuid(), anchor: { x: -10, y: 150 },
        title: "create table column",
        fields: [
          {id: cuid(),fieldName: "column name", value: "id"},
          {id: cuid(),fieldName: "type", value: "int"},
          {id: cuid(),fieldName: "nullable", value: "no"},
          {id: cuid(),fieldName: "indexed",},
        ] 
      },
    ]
  },
  editor1: {
    canvas: canvasId,
  },
  editor2: {
    canvas: canvasId,
  }
});

const theUITracker = new UITracker(testAppModel);
window.app = testAppModel
makeInspectable(testAppModel);

ReactDOM.render(<AppUI appInfo={testAppModel}/>, document.getElementById("react-root"))