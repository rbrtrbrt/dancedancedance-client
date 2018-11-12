
function labelAndValue(thing) {
  const anonFunctionRegex = /^\s*\(?\s*(\w*)\s*\)?\s*=>\s*(.*)/
  if(typeof(thing) !== "function") {
    return [null, thing]
  }
  const match = anonFunctionRegex.exec(thing.toString())
  if(match) {
    const label = match[1] !== '' ? match[1] : match[2]
    return [label, thing()]
  } else {
    return [null,thing]
  }
}

function callerName() {
  let stack = new Error().stack
  let re = /^.*?\n.*?\n.*?\n\s+at ([\w$./]+)|^.*?\n.*?\n([\w$]+)/
  let aRegexResult = re.exec(stack)
  let sCallerName = aRegexResult[2] || aRegexResult[1];
  return sCallerName;
}

export function ll(msg,...fs) {
  const anonFunctionRegex = /^\s*\(?\s*(\w*)\s*\)?\s*=>\s*(.*)/
  if(window.noLogging && fs.length === 0) {
    return 
  }
  if(window.noLogging) {
    const [_,value] = labelAndValue(fs[0])
    return value
  }
  const caller = callerName();
  if(fs.length == 0) {
    console.log("%c%s:%c %s","font-weight:bold;background-color:yellow",caller,"color:#888;", msg)
    return;
  }
  let result
  let toPrint = fs.reduce( (list,f,index) => {
    const [label,value] = labelAndValue(f);
    if(index == 0) result = value;
    if(label) { list.push(label + ":") }
    list.push(value);
    if(index<fs.length-1) list.push("|")
    return list
  }, [])
  console.log("%c%s:%c %s:","font-weight:bold;background-color:yellow",caller,"color:#888;", msg,...toPrint)
  return result
}

export function pr(str) {
  str = str.replace(/\n/g,"\\n");
  str = str.replace(/\t/g,"\\t");
  str = str.replace(/ /g,"~");
  return str;
}

export function gg(label) {
  if(window.noLogging) {
    return
  }
  console.group(label)
}
export function ge() {
  if(window.noLogging) {
    return
  }
  console.groupEnd()
}

function showError( caller, label, value, message) {
  function toStrings(...items) {
    return items.map( itm => {
      if(itm === null) {
        return "null"
      } else if( itm === "undefined") {
        return "undefined"
      } else if( typeof itm === "function" ) {
        return "function "+itm.name
      } else if( Array.isArray(itm) ) {
        return "[" + toStrings(...itm).join(", ") + "]" 
      } else {
        return itm.toString()
      }
    })
  }
  let toPrint = [value]
  if(label) {
    toPrint.unshift(label + ":")
  }
  if(message) { 
    console.log("%c%s:%c %s:","font-weight:bold;background-color:red;color:white",caller,"color:#000;", message,...toPrint)
    return message + ": " + toStrings(...toPrint).join(" ")
  }
  else {
    console.log("%c%s:","font-weight:bold;background-color:red",caller,...toPrint)
    return toStrings(...toPrint).join(" ")
  }
}

export function check(thing,message) {
  const [label,value] =  labelAndValue(thing);
  const caller = callerName();
  if(value === false) {
    const errorText = showError(caller,label,value, message||"check failed");
    throw new Error(errorText);
  }
}

export function checkDef(thing,message) {
  const [label,value] =  labelAndValue(thing);
  const caller = callerName();
  if(value === undefined || value === null) {
    const errorText = showError(caller,label,value, message||"checkDef failed");
    throw new Error(errorText);
  }
}

const typeNames = new Map();
typeNames.set(Number, "number");
typeNames.set(Boolean, "boolean");
typeNames.set(String, "string");
typeNames.set(Function, "function");
typeNames.set(Symbol, "symbol");

export function checkType(thing,type,message) {
  const [label,value] =  labelAndValue(thing);
  const caller = callerName();
  let typeOK = false
  let typeName = typeNames.get(type);
  if(typeName) {
    typeOK = typeof(value) === typeName;
    typeName = type.name
  } else if(type===Array) {
    typeOK = Array.isArray(value);
    typeName = "Array"
  } else if(type === null) {
    typeOK = value === null;
    typeName = "null";
  } else if(type === undefined) {
    typeOK = value === undefined;
    typeName = "undefined";
  } else if(type === Object) {
    typeOK = !Array.isArray(value) && value !== null && typeof(value)==="object";
    typeName = "Object";
  } else if(typeof(value)==="object" && typeof(type)==="function") {
    typeOK = value instanceof type;
    typeName = type.name
  } else {
    typeOK = false;
    typeName = type.name || type.toString()
  }
  if( !typeOK ) {
    const errorText = showError(caller,label,value, message||"checkType("+typeName+") failed");
    throw new Error(errorText);
  }
}
