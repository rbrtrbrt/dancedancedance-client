import React from 'react';
import ReactDOM from 'react-dom';
import makeInspectable from "mobx-devtools-mst";

import './style/defaultStyleParams';
import './style/main.sass';

import cuid from 'cuid';

import { uiTracker } from './helpers/UITracker';
import { AppModel } from './state-tree/AppModel';
import { AppUI } from './components/AppUI';

console.log("HI THERE!!");



/*
███    ███  ██████  ██████  ███████ ██      ███████
████  ████ ██    ██ ██   ██ ██      ██      ██
██ ████ ██ ██    ██ ██   ██ █████   ██      ███████
██  ██  ██ ██    ██ ██   ██ ██      ██           ██
██      ██  ██████  ██████  ███████ ███████ ███████
*/

/*
A Block has several Fields. Fields can be 'inline' (text, number,select,
reference), 'flag' (bool), 'container' for other blocks or `compound` (grouping
other fields). Fields can be required, required with (calculated) default,
strong optional (visible, but deletable) or weak optional (initially not
visible). Fields can have multiplicity: one, one-or-more, possibly bounded?
A field always has a name.

Blocks do not enforce a strict sequencing of inline fields. There is a 'defined'
or 'canonical' sequence, which can be attained using a clean-up command.
  --or--
There is a light concept of sequence, giving each field a place in a start, middle
or end?
  --or--
Multiple variants: overloading??

Blocks have a defined semantics coming from a 'definition' in a 'language'.
This language can live online, but it should be versioned. Online languages
could provide a 'piece of pallette', but should also provide search
capabilities. Perhaps even Language Server Protocol like features. Could we
sandbox such a server, and have it run client-side? perhaps in a web-worker?

Fields can be stand-alone entities, but without inherent semantics.
They can be copied and dropped on other blocks, taking on a role within the new
block that "matches" the field most closely. Dropping a field on another field
could copy just the value?

Blocks and Fields are 'canvas dwellers'
*/

const canvasId=cuid();
export const testAppModel = AppModel.create({
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

uiTracker.init(testAppModel);
window.app = testAppModel
makeInspectable(testAppModel);

ReactDOM.render(<AppUI appInfo={testAppModel}/>, document.getElementById("react-root"))