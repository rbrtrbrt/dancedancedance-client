import chroma from 'chroma-js';
import { ll } from '../helpers/debug/ll';


// color gradients, designed with http://gka.github.io/palettes/

const neutral = chroma.scale(["white","#E6E1DB","#55493A","#1F1100"]).correctLightness()

const blockMargin__px              = 2;
const blockCornerRadius__px        = 5;
const blockMaxWidth__px            = 333;
const blockFontSize__px            = 14;
const blockLineSpace__px           = 2;
const blockLineHeight__px          = blockFontSize__px + blockLineSpace__px;
const blockIconSize__px            = blockFontSize__px;
const blockIconMargin__px          = 1;
const blockContentPaddingLeft__px  = blockIconSize__px + 2*blockIconMargin__px;
const blockContentPaddingRight__px = 5;
const blockContentPaddingY__px     = 2;
const blockHeaderMaxWidth__px      = blockMaxWidth__px - blockContentPaddingLeft__px - blockContentPaddingRight__px;
const blockVerticalArmWidth__px    = 10;
const blockSubStackIndent__px      = blockVerticalArmWidth__px + blockMargin__px;
const blockFieldLineIndent__px     = 6;
const blockFinalArmHeight__px      = 12;
const blockFinalArmMinWidth__px    = 50;
const blockFinalArmFontSize__px    = 10;
const blockBackground              = neutral(0.1).hex();
const blockBackground_light        = neutral(0.05).hex();
const blockLabelColor              = neutral(0.6).hex();
const blockInputColor              = neutral(1).hex();
const blockSingleLineHeight__px    = blockFontSize__px + blockContentPaddingY__px * 2;
const blockEmptyStackHeight__px    = blockSingleLineHeight__px/2;
 
// const blockBackground_ghost       = chroma(blockBackground).darken(0.3);
// const blockBackground_ghost_light = chroma(blockBackground_ghost).darken(0.2);
// const blockFontColor_ghost        = chroma(blockFontColor).brighten(2);

const fieldLabelColor = neutral(0.6);
const fieldInputColor = neutral(1);
const fieldSeparationSpace__px = 4;
const fieldLabelValueSpace__px = 3;

const allStyleParams =  {
  blockMargin__px,
  blockCornerRadius__px,
  blockMaxWidth__px,
  blockIconSize__px,
  blockIconMargin__px,
  blockContentPaddingLeft__px,
  blockContentPaddingRight__px,
  blockContentPaddingY__px,
  blockHeaderMaxWidth__px,
  blockVerticalArmWidth__px,
  blockSubStackIndent__px,
  blockFieldLineIndent__px,
  blockFinalArmHeight__px,
  blockEmptyStackHeight__px,
  blockFinalArmMinWidth__px,
  blockFinalArmFontSize__px,
  blockBackground, 
  blockBackground_light, 
  blockFontSize__px,
  blockLineSpace__px,
  blockLineHeight__px,
  blockSingleLineHeight__px,
  // blockBackground_ghost, 
  // blockBackground_ghost_light, 
  // blockFontColor_ghost,  
  blockLabelColor,
  blockInputColor,
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