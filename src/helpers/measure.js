
import ReactDOM from "react-dom";

import {ll} from './debug/ll';

export 
function offsetFromDocument(domElement) {
  const {top,right,bottom,left,width,height} = domElement.getBoundingClientRect(),
  scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
  scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const rect = { top: top + scrollTop, left: left + scrollLeft, right,bottom,width,height }
  return rect
}

export 
function domRectContainsPoint(rect,px,py) {
  const {left,right,top,bottom, x,y,width,height} = rect
  return px > left && px < right && py > top && py < bottom
}

export 
function rectContainsPoint(rect,px,py) {
  const {x,y,width,height} = rect;
  return px > x && px < x+width && py > y && py < y+height; 
}

export 
function vectorLength(dx,dy) {
  return Math.sqrt( dx**2 + dy**2)
}


const textMeasureCanvas = document.createElement("canvas");

export 
function measureTextWidth(text, font) {
  var context = textMeasureCanvas.getContext("2d");
  context.font = font;
  var metrics = context.measureText(text);
  return metrics.width;
}



// Higher order component for measuring elements after each render.
// The following caveats apply:
// - The wrapped component must be a class-based component. It can't work with functional components, as they can't have refs.
// - Children do not render by themselves. This component only measures when it re-renders itself. If
//   children re-render without the parent re-rendering, this HOC will not re-measure. For example: do not
//   use children that are MobX observers. 
// - The x and y coordinates are from the offsetParent (i.e. the values that you'd use for top: en left: in 
//   an absolutely positioned element.)
// - static properties of the wrapped component are not copied to the new component.
export function Measuring(CompClass) {
  class Measure extends CompClass {
    constructor(props) {
      super(props);
      // We use a timeout to delay measuring. During this delay, the component is
      // sometimes dismounted. To prevent calling findDOMNode() on dismounted components,
      // we track the mounted-state.
      this.__isMounted = false;
    }
    componentDidUpdate() {
      super.componentDidUpdate && super.componentDidUpdate();
      this.measure();
    }
    componentDidMount() {
      super.componentDidMount && super.componentDidMount();
      this.measure();
      this.__isMounted = true;
    }
    componentWillUnmount() {
      this.__isMounted = false;
    }
    measure() {
      window.setTimeout(() => {  // using requestAnimationFrame sometimes results in incorrect measurements
        if(!this.__isMounted) {
          return;
        }
        const domElement = ReactDOM.findDOMNode(this);
        const {top,left,width,height} = domElement.getBoundingClientRect();
        const offsetParent = domElement.offsetParent;
        const {top:offsetTop,left:offsetLeft} = offsetParent.getBoundingClientRect();
        this.props.onMeasure({top:top-offsetTop, left:left-offsetLeft, width, height});
      }, 0);
    }
  }
  Measure.displayName = "Measuring(" + (CompClass.displayName||CompClass.name) + ")"
  return Measure;
}