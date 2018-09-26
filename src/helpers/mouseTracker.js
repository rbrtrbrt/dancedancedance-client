import {observable, computed, action} from "mobx";

class MouseTracker {
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

  @action.bound
  pointerMoved(evt) {
    if (evt.isPrimary) {
      this.mouseX = evt.x;
      this.mouseY = evt.y;
    }
  }
  @action
  startDrag(evt, model) {
    this.dragPointer = evt.pointerId;
    this.dragStartX = evt.clientX;  
    this.dragStartY = evt.clientY;
    this.dragItem = model;
    document.body.classList.add("noSelect");
    document.body.addEventListener('pointerup', this.endDrag);
    document.body.setPointerCapture(this.dragPointer);
  }
  @action.bound
  endDrag(evt) {
    document.body.releasePointerCapture(this.dragPointer);
    document.body.removeEventListener( 'pointerup', this.endDrag);
    document.body.classList.remove("noSelect");;
    this.dragItem.endDrag();
    this.dragItem = null;
    this.dragStartX = null;
    this.dragStartY = null;
    this.dragPointer = null;
  }
  @computed
  get dragX() {
    if (this.dragStartX) {
      return this.mouseX - this.dragStartX;
    } else {
      throw new Error(`Can't get dragX if not dragging.`)
    }
  }
  @computed
  get dragY() {
    if (this.dragStartY) {
      return this.mouseY - this.dragStartY;
    } else {
      throw new Error(`Can't get dragY if not dragging.`)
    }
  }
}
const theTracker = new MouseTracker()

document.body.addEventListener("pointermove", theTracker.pointerMoved);

export default theTracker