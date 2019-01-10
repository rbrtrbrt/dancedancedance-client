import chroma from 'chroma-js';
import { ll } from '../helpers/debug/ll';

const blockMaxWidth__px         = 332;
const blockLeftTabWidth__px     = 11;
const blockContentMarginX__px   = 5;
const blockContentMarginY__px   = 2;
const blockHeaderMaxWidth__px   = blockMaxWidth__px - blockLeftTabWidth__px - blockContentMarginX__px * 2;
const blockBackground           = "#F2EFEB";
const blockBackground_light     = chroma(blockBackground).brighten(0.2);
const blockFontColor            = "#222222";
const blockFontSize__px         = 14;
const blockLineHeight__px       = 16;
const blockSingleLineHeight__px = blockLineHeight__px + blockContentMarginY__px * 2;
 

const blockBackground_ghost       = chroma(blockBackground).darken(0.3);
const blockBackground_ghost_light = chroma(blockBackground_ghost).darken(0.2);
const blockFontColor_ghost        = chroma(blockFontColor).brighten(2);

const fieldLabelColor = chroma(blockFontColor).brighten(1.7);
const fieldInputColor = blockFontColor;
const fieldSeparationSpace__px = 4;
const fieldLabelValueSpace__px = 3;

const allStyleParams =  {
  blockMaxWidth__px,
  blockHeaderMaxWidth__px,
  blockLeftTabWidth__px,
  blockContentMarginX__px,
  blockContentMarginY__px,
  blockBackground, 
  blockBackground_light, 
  blockFontColor, 
  blockFontSize__px,
  blockLineHeight__px,
  blockSingleLineHeight__px,
  blockBackground_ghost, 
  blockBackground_ghost_light, 
  blockFontColor_ghost,  
  fieldLabelColor,
  fieldInputColor,
  fieldSeparationSpace__px,
  fieldLabelValueSpace__px,
  
};
export const theme = {};

// set each theme variable as a css cutom property, so we can reference is in CSS styles.
for( let [name,value] of Object.entries(allStyleParams)) {
  let cssValue;
  const [baseName,unit] = name.split("__")
  if(unit) {
    name = baseName
    cssValue = value + unit;
  } else {
    cssValue = value;
  }
  document.documentElement.style.setProperty('--'+name, cssValue);
  theme[name] = value;
}