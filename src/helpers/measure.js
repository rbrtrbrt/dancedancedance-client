
export function offsetFromDocument(domElement) {
  const {top,right,bottom,left,width,height} = domElement.getBoundingClientRect(),
  scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
  scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const rect = { top: top + scrollTop, left: left + scrollLeft, right,bottom,width,height }
  return rect
}

export function rectContainsPoint(rect,x,y) {
  const {left,right,top,bottom} = rect
  if(x >= left && x < right && y >= top && y < bottom) {
    return rect;
  } else {
    return false;
  }
}

export function vectorLength(dx,dy) {
  return Math.sqrt( dx**2 + dy**2)
}