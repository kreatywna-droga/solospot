import { writeFileSync, readFileSync } from 'fs';
import { fullFontCatalog } from '../packages/design-system/src/fonts/fontLibrary';
import { fullColorPalettes } from '../packages/design-system/src/colors/colorPalettes';
import { typographySystems } from '../packages/design-system/src/typography/typographySystems';
import { buttonSystems } from '../packages/design-system/src/buttons/buttonSystems';
import { cardSystems } from '../packages/design-system/src/cards/cardSystems';
import { radiusStyles } from '../packages/design-system/src/radius';
import { shadowStyles } from '../packages/design-system/src/shadows';
import { backgroundStyles } from '../packages/design-system/src/backgrounds';
import { spacingStyles } from '../packages/design-system/src/spacing';
import { sectionStyles } from '../packages/design-system/src/sections';
import { heroStyles } from '../packages/design-system/src/hero';
import { imageTreatmentStyles } from '../packages/design-system/src/images';
import { iconStyles } from '../packages/design-system/src/icons';
import { effectStyles } from '../packages/design-system/src/effects';

const ids = (a: any[]) => a.map((x) => x.id);
const pick = <T,>(arr: T[], i: number) => arr[i % arr.length];

const typoIds = ids(typographySystems);
const btnIds = ids(buttonSystems);
const cardIds = ids(cardSystems);
const radIds = ids(radiusStyles);
const shIds = ids(shadowStyles);
const bgIds = ids(backgroundStyles);
const spIds = ids(spacingStyles);
const secIds = ids(sectionStyles);
const heroIds = ids(heroStyles);
const imgIds = ids(imageTreatmentStyles);
const icIds = ids(iconStyles);
const fxIds = ids(effectStyles);
const palIds = ids(fullColorPalettes);

console.log(JSON.stringify({
  fonts: fullFontCatalog.length,
  palettes: fullColorPalettes.length,
  typo: typoIds,
  sec: secIds,
  hero: heroIds,
  img: imgIds,
  ic: icIds,
  fx: fxIds,
  btn: btnIds,
  card: cardIds,
  rad: radIds,
  sh: shIds,
  bg: bgIds,
  sp: spIds,
  palSample: palIds.slice(0, 20),
  palAll: palIds,
}, null, 2));
