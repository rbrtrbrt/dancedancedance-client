/*  TODO:

  **    handle window deactivation while dragging using window.blur()

*/

import {observable, computed, action} from "mobx";

class MouseTracker {

  @observable dndPanels = [];
  @observable dndPanelRects = [];

  @observable
  mouseX = 0;

  @observable
  mouseY = 0;

  @observable
  dragStartX = null;

  @observable
  dragStartY = null;

  dragPointer = null;
  
  @observable
  dragItem = null;

  @observable
  dragPanel = null;

  @action
  refreshPanelRects() {
    this.dndPanels.forEach( panel => panel.refreshClientRect() )    
  }
  @computed 
  get dndPanelWithMouse() {
    return this.dndPanels.find( panel => panel.containsMouse )
  }

  @action.bound
  pointerMoved(evt) {
    if (evt.isPrimary) {
      this.mouseX = Math.round(evt.x);
      this.mouseY = Math.round(evt.y);
    }
    if(this.dragItem) {
      this.dragMove(evt);
    }
  }
  @action
  dragMove(evt) {
    this.dragPanel = this.dndPanelWithMouse || this.dragPanel;
  }
  @action
  addDndPanels(...panels) {
    panels.forEach(p=>this.dndPanels.push(p))
  }
  @action
  startDrag(evt, model) {
    this.dragPointer = evt.pointerId;
    this.dragItem = model;
    this.dragStartX = this.mouseX = evt.clientX;  
    this.dragStartY = this.mouseY = evt.clientY;
    this.refreshPanelRects()
    this.dragPanel = this.dndPanelWithMouse
    document.body.classList.add("noSelect");
    document.body.addEventListener('pointerup', this.endDrag);
    document.body.setPointerCapture(this.dragPointer);
    return this.dragPanel.clientToCanvas(this.dragStartX, this.dragStartY);
  }
  @action.bound
  endDrag(evt) {
    this.mouseX = evt.clientX;
    this.mouseY = evt.clientY;
    document.body.releasePointerCapture(this.dragPointer);
    document.body.removeEventListener( 'pointerup', this.endDrag);
    document.body.classList.remove("noSelect");;
    this.dragItem.endDrag(...this.dragPanel.clientToCanvas(this.mouseX, this.mouseY));
    this.dragItem = null;
    this.dragPanel = null;
    this.dragStartX = null;
    this.dragStartY = null;
    this.dragPointer = null;
  }
  @computed
  get dragDeltaX() {
    if (this.dragItem) {
      return this.mouseX - this.dragStartX;
    } else {
      throw new Error(`Can't get dragX if not dragging.`)
    }
  }
  @computed
  get dragDeltaY() {
    if (this.dragItem) {
      return this.mouseY - this.dragStartY;
    } else {
      throw new Error(`Can't get dragY if not dragging.`)
    }
  }
  @computed 
  get dragPanelClientRect() {
    return this.dragPanel.clientRect();
  }
  @computed
  get dragStartPanelX() {
    return this.mouseX - this.dragPanelClientRect.left;
  }
  @computed
  get dragStartPanelY() {
    return this.mouseY - this.dragPanelClientRect.top;
  }
}
export const mouseTracker = new MouseTracker()

document.body.addEventListener("pointermove", mouseTracker.pointerMoved);