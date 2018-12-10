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

  @observable
  drag = null 
  // this is the interface for 'drag':
  //   startX: number,
  //   startY: number,
  //   lastDragPanel: EditorModel,
  //   item: BlockModel,
  //   phase:  'beforeDrag' | 'beforeCorrect' | 'correcting' | 'afterCorrect'
  //   correctionX: number,
  //   correctionY: number

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
    return this.drag? this.drag.lastDragPanel.clientToCanvas(this.mouseX,this.mouseY) : null;
  }
  @action.bound
  pointerMoved(evt) {
    if (evt.isPrimary) {
      this.mouseX = Math.round(evt.x);
      this.mouseY = Math.round(evt.y);
      if(this.drag) {
        this.dragMove(evt);
      }
    }
  }
  @action
  dragMove(evt) {
    this.drag.lastDragPanel = this.dndPanelWithMouse || this.drag.lastDragPanel;
    const prevTopmost = this.drag.topmostDropTarget;
    this.drag.topmostDropTarget = this.drag.lastDragPanel.document.visitBlockDropTargets( (target,prevTopTarget) => {
      if( target.containsPoint(this.canvasDragLocation) ) {
        return target;
      } else {
        return prevTopTarget;
      }
    })
    if(this.drag.topmostDropTarget !== prevTopmost) {
      prevTopmost && prevTopmost.respondToBlockDragOut && prevTopmost.respondToBlockDragOut()
    }
    this.drag.topmostDropTarget.respondToBlockDragOver(this.drag.item, this.canvasDragLocation )
  }
  @action
  addDndPanels(...panels) {
    panels.forEach(p=>this.dndPanels.push(p))
  }
  _whenDisposer = null
  @action
  startDrag(evt, model) {
    this.refreshPanelRects()
    this.drag = {
      lastDragPanel: this.dndPanelWithMouse,
      pointerId: evt.pointerId,
      item: model,
      startX: this.mouseX = Math.round(evt.clientX),
      startY: this.mouseY = Math.round(evt.clientY),
      phase: "beforeDrag"
    }
    // These two lines can't be part of object literal above because
    // 'get canvasDragLocation()' expects this.drag.lastDragPanel to exist.
    this.drag.correctionX = model.x - this.canvasDragLocation.x;
    this.drag.correctionY = model.y - this.canvasDragLocation.y;
    document.body.classList.add("noSelect");
    document.body.addEventListener('pointerup', this.endDrag);
    document.body.setPointerCapture(this.drag.pointerId);
    this._whenDisposer = mx.when( ()=> {
      return this.drag.phase === "beforeDrag" && 
             vectorLength(this.dragDeltaX, this.dragDeltaY) > 2
    }, this.startDragCorrecting );
  }
  @action.bound
  endDrag(evt) {
    if(this.drag.phase !== "beforeDrag") {
      this.mouseX = Math.round(evt.clientX);
      this.mouseY = Math.round(evt.clientY);
 
      const newLocation = {
        x: this.canvasDragLocation.x + this.drag.correctionX, 
        y: this.canvasDragLocation.y + this.drag.correctionY
      } 
      // const dropResult = this.drag.lastDragPanel.document.visitBlockDropTargets(
        // (target,result) => 
      const dropResult = this.drag.topmostDropTarget.respondToBlockDrop(this.drag.item,newLocation)
      if(!dropResult) {
        throw new Error(`No result found for block drop. At least the canvas should have reported a result for block drop.`)
      }
      dropResult[0].insertDroppedBlocks(this.drag.item, dropResult[1]);   
    }
    if(this.drag.topmostDropTarget.respondToBlockDragOut) {
      this.drag.topmostDropTarget.respondToBlockDragOut();
    }
    this._whenDisposer();
    document.body.releasePointerCapture(this.drag.pointerId);
    document.body.removeEventListener( 'pointerup', this.endDrag);
    document.body.classList.remove("noSelect");
    this.drag = null;
  }
  // called when drag distance > 3
  @action.bound 
  startDragCorrecting() {
    this.drag.phase = "correcting"; 
  }
  // Called by UI when correcting animation is done.
  @action.bound 
  correctingDone() {
    this.drag.phase = "afterCorrect";
    this.drag.correctionX = 0;
    this.drag.correctionY = 0;
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
