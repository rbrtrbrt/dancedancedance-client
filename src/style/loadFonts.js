import { ll } from "../helpers/debug/ll";

const allFonts = {
    "Barlow": {
        /* thin */
        // normal_100: 'barlow-100.woff2',
        // italic_100: 'barlow-100italic.woff2',
        // /* extralight */
        // normal_200: 'barlow-200.woff2',
        // italic_200: 'barlow-200italic.woff2',
        // /* light */
        // normal_300: 'barlow-300.woff2',
        // italic_300: 'barlow-300italic.woff2',
        /* regular */
        normal_400: 'barlow-400.woff2',
        italic_400: 'barlow-400italic.woff2',
        /* medium */
        normal_500: 'barlow-500.woff2',
        italic_500: 'barlow-500italic.woff2',
        /* semibold */
        normal_600: 'barlow-600.woff2',
        italic_600: 'barlow-600italic.woff2',
        /* bold */
        normal_700: 'barlow-700.woff2',
        italic_700: 'barlow-700italic.woff2',
        // /* extrabold */
        // normal_800: 'barlow-800.woff2',
        // italic_800: 'barlow-800italic.woff2',
        // /* black */
        // normal_900: 'barlow-900.woff2',
        // italic_900: 'barlow-900italic.woff2',
    },
    "Barlow Semi Condensed": {
        // /* thin */
        // normal_100: 'barlow-semi-condensed-100.woff2',
        // italic_100: 'barlow-semi-condensed-100italic.woff2',
        // /* extralight */
        // normal_200: 'barlow-semi-condensed-200.woff2',
        // italic_200: 'barlow-semi-condensed-200italic.woff2',
        // /* light */
        // normal_300: 'barlow-semi-condensed-300.woff2',
        // italic_300: 'barlow-semi-condensed-300italic.woff2',
        /* regular */
        normal_400: 'barlow-semi-condensed-400.woff2',
        italic_400: 'barlow-semi-condensed-400italic.woff2',
        /* medium */
        normal_500: 'barlow-semi-condensed-500.woff2',
        italic_500: 'barlow-semi-condensed-500italic.woff2',
        /* semibold */
        normal_600: 'barlow-semi-condensed-600.woff2',
        italic_600: 'barlow-semi-condensed-600italic.woff2',
        /* bold */
        normal_700: 'barlow-semi-condensed-700.woff2',
        italic_700: 'barlow-semi-condensed-700italic.woff2',
        // /* extrabold */
        // normal_800: 'barlow-semi-condensed-800.woff2',
        // italic_800: 'barlow-semi-condensed-800italic.woff2',
        // /* black */
        // normal_900: 'barlow-semi-condensed-900.woff2',
        // italic_900: 'barlow-semi-condensed-900italic.woff2',
    },
    "Barlow Condensed": {
        // /* thin */
        // normal_100: 'barlow-condensed-100.woff2',
        // italic_100: 'barlow-condensed-100italic.woff2',
        // /* extralight */
        // normal_200: 'barlow-condensed-200.woff2',
        // italic_200: 'barlow-condensed-200italic.woff2',
        // /* light */
        // normal_300: 'barlow-condensed-300.woff2',
        // italic_300: 'barlow-condensed-300italic.woff2',
        /* regular */
        normal_400: 'barlow-condensed-400.woff2',
        italic_400: 'barlow-condensed-400italic.woff2',
        // /* medium */
        // normal_500: 'barlow-condensed-500.woff2',
        // italic_500: 'barlow-condensed-500italic.woff2',
        // /* semibold */
        // normal_600: 'barlow-condensed-600.woff2',
        // italic_600: 'barlow-condensed-600italic.woff2',
        // /* bold */
        // normal_700: 'barlow-condensed-700.woff2',
        // italic_700: 'barlow-condensed-700italic.woff2',
        // /* extrabold */
        // normal_800: 'barlow-condensed-800.woff2',
        // italic_800: 'barlow-condensed-800italic.woff2',
        // /* black */
        // normal_900: 'barlow-condensed-900.woff2',
        // italic_900: 'barlow-condensed-900italic.woff2',
    }
}

function loadFont(family,style,weight,fileName) {
  fileName = "/fonts/"+fileName;
  fileName = "url("+fileName+")";
  const fontFace = new FontFace(family, fileName, {style, weight});
  document.fonts.add(fontFace);
  return fontFace.load().catch(error=>{
    if(error instanceof DOMException) {
      const {code,message,name} = error
      console.error(`ERROR loading font "${fileName}":`, `${name}(${code})`, message);
    }
    else {
      console.error(`ERROR loading font "${fileName}":`,error);
    }
    console.warn("If you're using the Parcel dev server, make sure all fonts in /fonts/ directory are copied to in /dist/fonts/ .");
  });
}
 
export
function loadAllFonts() {
  const fontLoadPromises = []
  for(const [familyName,fontSpecs] of Object.entries(allFonts)) {
    for(const [variantKey, fileName] of Object.entries(fontSpecs)) {
      const [style,weight] = variantKey.split("_");
      const promise = loadFont(familyName, style, weight, fileName);
      fontLoadPromises.push(promise);
    }
  }
  return Promise.all(fontLoadPromises);
}