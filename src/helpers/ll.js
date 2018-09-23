export default function ll(msg,...fs) {

  let stack = new Error().stack
  let re = /^.*?\n.*?\n\s+at ([\w$./]+)|^.*?\n([\w$]+)/
  let aRegexResult = re.exec(new Error().stack)
  let sCallerName = aRegexResult[2] || aRegexResult[1];

  if(fs.length == 0) {
    console.log("%c%s:%c %s","font-weight:bold;background-color:yellow",sCallerName,"color:#888;", msg)
    return;
  }

  let result
  let toPrint = fs.reduce( (list,f,index) => {
    if(index == 0) result = f;
    if(typeof f !== "function") {
      list.push(f)
    } else {
      const anonFunctionRegex = /^\s*\(\s*\)\s*=>\s*(.*)/
      const match = anonFunctionRegex.exec(f.toString())
      if(match) {
        list.push(match[1] + " →")
        list.push(f())
        if(index == 0) result = f();
      } else {
        list.push(f)
      }
    }
    if(index<fs.length-1) list.push("|")
    return list
  }, [])
  console.log("%c%s:%c %s:","font-weight:bold;background-color:yellow",sCallerName,"color:#888;", msg,...toPrint)
  return result
}
window.ll = ll;

function pr(str) {
  str = str.replace(/\n/g,"\\n");
  str = str.replace(/\t/g,"\\t");
  str = str.replace(/ /g,"~");
  return str;
}

export const gg = function gg(label) {
  console.group(label)
}
export const ge = function ge() {
  console.groupEnd()
}
