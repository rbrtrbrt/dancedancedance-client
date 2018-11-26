/*  TODO:

  **    handle window deactivation while dragging using window.blur()

*/

import * as mx from "mobx";
const {observable, computed, action} = mx;
import { ll, gg, ge, checkDef } from '../helpers/debug/ll';
import {vectorLength} from '../helpers/measure';
export
class UITracker {

  constructor(appViewModel) {
    if(uiTracker) {
      throw new Error(`uiTracker already exists. Can only create single instance of UITracker.`);
    } 
    uiTracker = this;
    document.body.addEventListener("pointermove", this.pointerMoved);
    this.app = appViewModel
  }

  app = null;

  @observable
  mouseX = 0;

  @observable
  mouseY = 0;

  drag = observable({
    startX: null,
    startY: null,
    lastDragPanel: null,
    item: null,
    correctingState: null, // beforeCorrect | correcting | afterCorrect
  })

  @computed 
  get dndPanels() {
    return this.app.dndPanels
  }

  @action
  refreshPanelRects() {
    this.dndPanels.forEach( panel => {
      return panel.refreshClientRect()})    
  } 
  @computed 
  get dndPanelWithMouse() {
    return this.dndPanels.find( panel => panel.containsMouse )
  }
  @computed
  get canvasDragLocation() {
    return this.drag.lastDragPanel.clientToCanvas(this.mouseX,this.mouseY);
  }
  @action.bound
  pointerMoved(evt) {
    if (evt.isPrimary) {
      this.mouseX = Math.round(evt.x);
      this.mouseY = Math.round(evt.y);
    }
    if(this.drag.item) {
      this.dragMove(evt);
    }
  }
  @action
  dragMove(evt) {
    this.drag.lastDragPanel = this.dndPanelWithMouse || this.drag.lastDragPanel;
  }
  @action
  addDndPanels(...panels) {
    panels.forEach(p=>this.dndPanels.push(p))
  }
  _whenDisposer = null
  @action
  startDrag(evt, model) {
    this.drag.pointerId = evt.pointerId;
    this.drag.item = model;
    this.drag.startX = this.mouseX = evt.clientX;  
    this.drag.startY = this.mouseY = evt.clientY;
    this.drag.correctingState = "beforeCorrect";
    this.refreshPanelRects()
    this.drag.lastDragPanel = this.dndPanelWithMouse;
    document.body.classList.add("noSelect");
    document.body.addEventListener('pointerup', this.endDrag);
    document.body.setPointerCapture(this.drag.pointerId);
    this._whenDisposer = mx.when( ()=> {
      return this.drag.correctingState === "beforeCorrect" && 
             vectorLength(this.dragDeltaX, this.dragDeltaY) > 3
    }, this.startDragCorrecting );

    return this.canvasDragLocation;
  }
  @action.bound
  endDrag(evt) {
    this._whenDisposer();
    this.mouseX = evt.clientX;
    this.mouseY = evt.clientY;
    document.body.releasePointerCapture(this.drag.pointerId);
    document.body.removeEventListener( 'pointerup', this.endDrag);
    document.body.classList.remove("noSelect");
    this.drag.item.endDrag(...this.drag.lastDragPanel.clientToCanvas(this.mouseX, this.mouseY));
    this.drag.correctingState = null;
    this.drag.item = null;
    this.drag.lastDragPanel = null;
    this.drag.startX = null;
    this.drag.startY = null;
    this.drag.pointerId = null;
  }
  // Called by UI when correcting animation is done.
  @action.bound 
  correctingDone() {
    this.drag.correctingState = "afterCorrect";
  }
  // called when drag distance > 3
  @action.bound 
  startDragCorrecting() {
    this.drag.correctingState = "correcting"; 
  }
  @computed
  get dragDeltaX() {
    if (this.drag.item) {
      return this.mouseX - this.drag.startX;
    } else {
      throw new Error(`Can't get dragX if not dragging.`)
    }
  }
  @computed
  get dragDeltaY() {
    if (this.drag.item) {
      return this.mouseY - this.drag.startY;
    } else {
      throw new Error(`Can't get dragY if not dragging.`)
    }
  }
}
export let uiTracker = null;
