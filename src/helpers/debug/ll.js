export default function ll(msg,...fs) {
  const anonFunctionRegex = /^\s*\(?\s*(\w*)\s*\)?\s*=>\s*(.*)/
  if(window.noLogging) {
    if(fs.length>=1){
      if(typeof fs[0] === "function" && anonFunctionRegex.test(fs[0].toString())) {
        return fs[0]()
      } else {
        return f
      }
    } else {
      return
    }
  }
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
      const anonFunctionRegex = /^\s*\(?\s*(\w*)\s*\)?\s*=>\s*(.*)/
      // const anonFunctionRegex = /^\s*\(\s*\)\s*=>\s*(.*)/
      const match = anonFunctionRegex.exec(f.toString())
      if(match) {
        const label = match[1] !== '' ? match[1] : match[2]
        list.push(label + " →")
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

export function pr(str) {
  str = str.replace(/\n/g,"\\n");
  str = str.replace(/\t/g,"\\t");
  str = str.replace(/ /g,"~");
  return str;
}

export const gg = function gg(label) {
  if(window.noLogging) {
    return
  }
  console.group(label)
}
export const ge = function ge() {
  if(window.noLogging) {
    return
  }
  console.groupEnd()
}
