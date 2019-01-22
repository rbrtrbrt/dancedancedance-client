import React from "react";
import ReactDOM from "react-dom";
import * as mx from "mobx";
import * as mxu from "mobx-utils";
import { observer } from "mobx-react";

import "./styles.css";

function App() {
  return (
    <div className="App">
      <h1>Hello CodeSandbox</h1>
      <h2>Start editing to see some magic happen!</h2>
    </div>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);

const ll = console.log.bind(console);

class Grid {
  constructor(data = []) {
    this.data = data.map(r => new Row(r));
  }
  get gridSum() {
    let sum = 0;
    for (const r of this.data) {
      sum += r.sum;
    }
    return sum;
  }
  push(arr) {
    this.data.push(new Row(arr));
  }
  shift(arr) {
    this.data.shift();
  }
}

class Row {
  constructor(data) {
    this.data = data;
  }
  get sum() {
    const result = this.data.reduce((a, b) => a + b);
    console.log("rowSum([" + this.data + "]) =", result);
    return result;
  }
}



mx.decorate(Grid, {
  data: mx.observable,
  gridSum: mx.computed,
  push: mx.action,
  shift: mx.action,
});
mx.decorate(Row, {
  data: mx.observable,
  sum: mx.computed
});

const g1 = new Grid([[11, 11], [22, 22], [33, 33]]);
window.g1 = g1;
mx.autorun(() => {
  ll("g1 SUM:", g1.gridSum);
});


class Grid2 {
  constructor(data = []) {
    this.data = data;
    this.rowSumT = mxu.createTransformer(row=>{
      const result = row.reduce((a, b) => a + b);
      console.log("rowSumT([" + row + "]) =", result);
      return result;
    })
  }
  // rowSum(r) {
  //   const result = this.data[r].reduce((a, b) => a + b);
  //   console.log("rowSum("+r+") =", result);
  //   return result;
  // }
  get gridSum() {
    let sum = 0;
    for (const r of this.data.values()) {
      sum += this.rowSumT(r);
    }
    return sum;
  }
}

mx.decorate(Grid2, {
  data: mx.observable,
  gridSum: mx.computed,
});
const g2 = new Grid2([[11, 11], [22, 22], [33, 33]]);
window.g2 = g2;
mx.autorun(() => {
  ll("g2 SUM:", g2.gridSum);
});
