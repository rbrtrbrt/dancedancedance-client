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
  //   items: [BlockModel],
  //   phase:  'beforeDrag' | 'beforeCorrect' | 'correcting' | 'afterCorrect'
  //   correctionX: number,
  //   correctionY: number
  //   dropContainer: Object,
  //   dropPosition: Number or {x:Number,y:Number} (or String?)

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
  get canvasMouseLocation() {
    if(this.dndPanelWithMouse) {
      return this.dndPanelWithMouse.clientToCanvas(this.mouseX,this.mouseY);
    } else {
      return {x:null,y:null}
    }
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
    const topmostDropTarget = this.drag.lastDragPanel.document.visitBlockDropTargets( 
      (target,prevTopTarget) => {
        if( target.isDropTarget(this.canvasDragLocation) ) {
          return target;
        } else {
          return prevTopTarget;
        }
      }, null)
    // ll("target:", topmostDropTarget.debugName)
    const dragResult = topmostDropTarget.getDropLocation(this.drag.items, this.canvasDragLocation )
    if(dragResult) {
      // ll("droploc:", dragResult[0].debugName, dragResult[1])
      this.drag.dropContainer = dragResult[0]
      this.drag.dropPosition = dragResult[1]
    } else {
      // ll("droploc:", dragResult)
    }
  }
  @action
  addDndPanels(...panels) {
    panels.forEach(p=>this.dndPanels.push(p))
  }
  _whenDisposer = null
  @action
  startDrag(evt, blocks) {
    this.refreshPanelRects()
    this.drag = {
      firstDragPanel: this.dndPanelWithMouse,
      lastDragPanel: this.dndPanelWithMouse,
      pointerId: evt.pointerId,
      items: blocks,
      startX: this.mouseX = Math.round(evt.clientX),
      startY: this.mouseY = Math.round(evt.clientY),
      phase: "beforeDrag",
      dropContainer: blocks[0].parent,
      dropPosition: blocks[0].indexInStack,
    }
    // These two lines can't be part of object literal above because
    // 'get canvasDragLocation()' expects this.drag.lastDragPanel to exist.
    this.drag.correctionX = this.canvasDragLocation.x - blocks[0].x;
    this.drag.correctionY = this.canvasDragLocation.y - blocks[0].y;
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
      // const newLocation = {
      //   x: this.canvasDragLocation.x + this.drag.correctionX, 
      //   y: this.canvasDragLocation.y + this.drag.correctionY
      // } 
      this.drag.dropContainer.insertDroppedBlocks(this.drag.items, this.drag.dropPosition);   
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
    // this.drag.correctionX = 0;
    // this.drag.correctionY = 0;
  }
  @computed
  get dragDeltaX() {
    if (this.drag) {
      return this.mouseX - this.drag.startX;
    } else {
      throw new Error(`Can't get dragX if not dragging.`)
    }
  }
  @computed
  get dragDeltaY() {
    if (this.drag) {
      return this.mouseY - this.drag.startY;
    } else {
      throw new Error(`Can't get dragY if not dragging.`)
    }
  }
  @computed 
  get allDragBlocks() {
    if(!this.drag) {
      throw new Error(`allDragBlocks called while not dragging.`)
    }
    function * allSubBlocks(list) {
      for(const block of list) {
        yield * block.allSubBlocks()
      }
    }
    const result = new Set(allSubBlocks(this.drag.items))
    return result;
  }
}
export let uiTracker = null;
