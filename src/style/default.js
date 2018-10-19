import chroma from 'chroma-js';
import ll from '../helpers/debug/ll';


const blockBackground       = "#F2EFEB"
const blockBackground_light = chroma(blockBackground).brighten(0.2);
const blockFontColor        = "#333333";

const blockBackground_ghost       = chroma(blockBackground).darken(0.3);
const blockBackground_ghost_light = chroma(blockBackground_ghost).brighten(0.2);
const blockFontColor_ghost        = chroma(blockFontColor).brighten(2);



export const theme = {
  blockBackground, 
  blockBackground_light, 
  blockFontColor, 
  blockBackground_ghost, 
  blockBackground_ghost_light, 
  blockFontColor_ghost,   
}

// set each theme variable as a css cutom property, so we can reference is in CSS styles.
for( const [name,value] of Object.entries(theme)) {
  document.documentElement.style.setProperty('--'+name, value)
}