/**
 * Color Combinations — real pairings composed from colorPalettes at module load.
 *
 * Each combination references two real palette ids (or explicit hex from them).
 * Contrast is computed with evaluateColorCombination (no stored fake scores).
 */

import { fullColorPalettes, type ColorPalette } from '../colors/colorPalettes';
import { evaluateColorCombination, type WcagLevel } from '../contrast';

export interface ColorCombination {
  id: string;
  name: string;
  description: string;
  category: string;
  backgroundId: string;
  foregroundId: string;
  accentId: string;
  background: string;
  foreground: string;
  accent: string;
  surface: string;
  muted: string;
  contrastRatio: number;
  wcagLevel: WcagLevel;
  passAA: boolean;
  warnings: string[];
  mood: string[];
  tags: string[];
  recommendedFor: string[];
}

function findPalette(id: string): ColorPalette {
  const p = fullColorPalettes.find((x) => x.id === id);
  if (!p) throw new Error(`color-combinations: unknown palette id ${id}`);
  return p;
}

interface ComboDef {
  id: string;
  name: string;
  description: string;
  category: string;
  bgId: string;
  fgId: string;
  acId: string;
  /** Which role of fg palette supplies the foreground ink (default text). */
  fgRole?: 'text' | 'primary' | 'secondary' | 'muted';
  mood: string[];
  tags: string[];
  recommendedFor: string[];
}

/** Deterministic defs — every id references fullColorPalettes. */
const COMBO_DEFS: ComboDef[] = [
  { id: 'cc-mono-clean', name: 'Mono Clean', description: 'Black ink on cream — editorial baseline', category: 'neutral', bgId: 'mono-cream', fgId: 'mono-black-white', acId: 'mono-black-white', fgRole: 'text', mood: ['minimal', 'classic'], tags: ['monochrome', 'neutral'], recommendedFor: ['publishing', 'law', 'education'] },
  { id: 'cc-graphite-docs', name: 'Graphite Docs', description: 'Graphite text on soft white documentation palette', category: 'neutral', bgId: 'mono-charcoal', fgId: 'mono-charcoal', acId: 'mono-charcoal', fgRole: 'text', mood: ['serious', 'clear'], tags: ['graphite', 'docs'], recommendedFor: ['local-services', 'education', 'corporate'] },
  { id: 'cc-stone-editorial', name: 'Stone Editorial', description: 'Slate ink on stone surfaces', category: 'neutral', bgId: 'neutral-stone', fgId: 'neutral-slate', acId: 'neutral-slate', fgRole: 'text', mood: ['modern', 'corporate'], tags: ['stone', 'slate'], recommendedFor: ['finance', 'law', 'real-estate'] },
  { id: 'cc-zinc-industrial', name: 'Zinc Industrial', description: 'High-value zinc surfaces with dark ink', category: 'neutral', bgId: 'neutral-zinc', fgId: 'neutral-zinc', acId: 'neutral-zinc', fgRole: 'text', mood: ['industrial', 'minimal'], tags: ['zinc', 'urban'], recommendedFor: ['construction', 'architecture', 'local-services'] },
  { id: 'cc-sand-warm', name: 'Sand Warm', description: 'Terracotta accent on warm sand', category: 'warm', bgId: 'warm-sand', fgId: 'warm-terracotta', acId: 'warm-terracotta', fgRole: 'text', mood: ['warm', 'organic'], tags: ['sand', 'terracotta'], recommendedFor: ['restaurant', 'travel', 'real-estate'] },
  { id: 'cc-camel-luxury', name: 'Camel Luxury', description: 'Camel neutrals with deep ink', category: 'warm', bgId: 'warm-camel', fgId: 'warm-camel', acId: 'warm-camel', fgRole: 'text', mood: ['premium', 'warm'], tags: ['camel', 'earth'], recommendedFor: ['hotel', 'fashion', 'architecture'] },
  { id: 'cc-clay-boutique', name: 'Clay Boutique', description: 'Clay brown craft palette', category: 'warm', bgId: 'neutral-clay', fgId: 'neutral-clay', acId: 'neutral-clay', fgRole: 'text', mood: ['crafted', 'earthy'], tags: ['clay', 'boutique'], recommendedFor: ['real-estate', 'architecture', 'hospitality'] },
  { id: 'cc-ice-medical', name: 'Ice Medical', description: 'Cool ice surfaces with clinical blue', category: 'cool', bgId: 'cool-ice', fgId: 'cool-ice', acId: 'cool-ice', fgRole: 'text', mood: ['clean', 'calm'], tags: ['ice', 'clinical'], recommendedFor: ['medical', 'dental', 'wellness'] },
  { id: 'cc-steel-corporate', name: 'Steel Corporate', description: 'Steel greys for enterprise UI', category: 'cool', bgId: 'cool-steel', fgId: 'cool-steel', acId: 'cool-steel', fgRole: 'text', mood: ['professional', 'modern'], tags: ['steel', 'enterprise'], recommendedFor: ['finance', 'saas', 'technology'] },
  { id: 'cc-glacier-spa', name: 'Glacier Spa', description: 'Glacier blues for calm wellness', category: 'cool', bgId: 'cool-glacier', fgId: 'cool-glacier', acId: 'cool-glacier', fgRole: 'text', mood: ['cool', 'airy'], tags: ['glacier', 'spa'], recommendedFor: ['wellness', 'travel', 'medical'] },
  { id: 'cc-gold-on-onyx', name: 'Gold Onyx', description: 'Gold CTA on onyx luxury ground', category: 'luxury', bgId: 'luxury-onyx', fgId: 'luxury-onyx', acId: 'luxury-onyx', fgRole: 'primary', mood: ['luxury', 'premium'], tags: ['gold', 'onyx'], recommendedFor: ['luxury', 'hotel', 'fashion'] },
  { id: 'cc-gold-classic', name: 'Gold Classic', description: 'Classic gold-on-dark luxury', category: 'luxury', bgId: 'luxury-gold', fgId: 'luxury-gold', acId: 'luxury-gold', fgRole: 'primary', mood: ['elegant', 'premium'], tags: ['gold', 'classic'], recommendedFor: ['hotel', 'jewelry', 'fine-dining'] },
  { id: 'cc-rosegold-romance', name: 'Rose Gold Romance', description: 'Rose gold on deep night', category: 'luxury', bgId: 'luxury-rose-gold', fgId: 'luxury-rose-gold', acId: 'luxury-rose-gold', fgRole: 'primary', mood: ['romantic', 'elegant'], tags: ['rose-gold', 'beauty'], recommendedFor: ['beauty', 'fashion', 'weddings'] },
  { id: 'cc-platinum-techlux', name: 'Platinum Techlux', description: 'Platinum metals on near-black', category: 'luxury', bgId: 'luxury-platinum', fgId: 'luxury-platinum', acId: 'luxury-platinum', fgRole: 'text', mood: ['sophisticated', 'modern'], tags: ['platinum', 'techlux'], recommendedFor: ['technology', 'finance', 'luxury'] },
  { id: 'cc-medical-trust', name: 'Medical Trust', description: 'Clinical blue on ice white', category: 'medical', bgId: 'medical-clean', fgId: 'medical-clean', acId: 'medical-clean', fgRole: 'text', mood: ['trustworthy', 'clean'], tags: ['clinical', 'trust'], recommendedFor: ['medical', 'dental', 'pharma'] },
  { id: 'cc-medical-tealcalm', name: 'Medical Teal Calm', description: 'Teal healthcare calm', category: 'medical', bgId: 'medical-teal', fgId: 'medical-teal', acId: 'medical-teal', fgRole: 'text', mood: ['calm', 'professional'], tags: ['teal', 'healthcare'], recommendedFor: ['medical', 'wellness', 'dental'] },
  { id: 'cc-medical-mintfresh', name: 'Medical Mint Fresh', description: 'Mint clinical freshness', category: 'medical', bgId: 'medical-mint', fgId: 'medical-mint', acId: 'medical-mint', fgRole: 'text', mood: ['fresh', 'clean'], tags: ['mint', 'clinic'], recommendedFor: ['medical', 'dental', 'wellness'] },
  { id: 'cc-wellness-organic', name: 'Wellness Organic', description: 'Leaf greens on soft fields', category: 'wellness', bgId: 'wellness-organic', fgId: 'wellness-organic', acId: 'wellness-organic', fgRole: 'text', mood: ['organic', 'calm'], tags: ['leaf', 'organic'], recommendedFor: ['wellness', 'fitness', 'eco'] },
  { id: 'cc-wellness-serene', name: 'Wellness Serene', description: 'Sky serenity for meditation', category: 'wellness', bgId: 'wellness-serene', fgId: 'wellness-serene', acId: 'wellness-serene', fgRole: 'text', mood: ['serene', 'peaceful'], tags: ['sky', 'yoga'], recommendedFor: ['wellness', 'yoga', 'spa'] },
  { id: 'cc-wellness-lilac', name: 'Wellness Lilac', description: 'Soft lilac calm accents', category: 'wellness', bgId: 'wellness-lilac', fgId: 'wellness-lilac', acId: 'wellness-lilac', fgRole: 'primary', mood: ['soft', 'modern'], tags: ['lilac', 'calm'], recommendedFor: ['wellness', 'beauty', 'lifestyle'] },
  { id: 'cc-nature-forest', name: 'Nature Forest', description: 'Deep forest organic greens', category: 'nature', bgId: 'nature-forest', fgId: 'nature-forest', acId: 'nature-forest', fgRole: 'text', mood: ['natural', 'fresh'], tags: ['forest', 'eco'], recommendedFor: ['eco', 'outdoor', 'food'] },
  { id: 'cc-nature-meadow', name: 'Nature Meadow', description: 'Meadow greens for farms', category: 'nature', bgId: 'nature-meadow', fgId: 'nature-meadow', acId: 'nature-meadow', fgRole: 'text', mood: ['organic', 'fresh'], tags: ['meadow', 'farm'], recommendedFor: ['food', 'eco', 'travel'] },
  { id: 'cc-nature-earth', name: 'Nature Earth', description: 'Earthy browns and cream', category: 'nature', bgId: 'nature-earth', fgId: 'nature-earth', acId: 'nature-earth', fgRole: 'text', mood: ['earthy', 'warm'], tags: ['earth', 'terrain'], recommendedFor: ['architecture', 'outdoor', 'travel'] },
  { id: 'cc-fashion-bg', name: 'Fashion Black Gold', description: 'Iconic black-gold fashion ink', category: 'fashion', bgId: 'fashion-black-gold', fgId: 'fashion-black-gold', acId: 'fashion-black-gold', fgRole: 'primary', mood: ['luxury', 'fashion'], tags: ['black-gold', 'runway'], recommendedFor: ['fashion', 'jewelry', 'editorial'] },
  { id: 'cc-fashion-rose', name: 'Fashion Rose', description: 'Bold rose on soft blush', category: 'fashion', bgId: 'fashion-rose', fgId: 'fashion-rose', acId: 'fashion-rose', fgRole: 'text', mood: ['feminine', 'bold'], tags: ['rose', 'bold'], recommendedFor: ['beauty', 'fashion', 'lifestyle'] },
  { id: 'cc-fashion-sand', name: 'Fashion Sand', description: 'Neutral sand editorial fashion', category: 'fashion', bgId: 'fashion-sand', fgId: 'fashion-sand', acId: 'fashion-sand', fgRole: 'text', mood: ['editorial', 'premium'], tags: ['sand', 'lookbook'], recommendedFor: ['fashion', 'beauty', 'photography'] },
  { id: 'cc-tech-blue', name: 'Tech Blue', description: 'Blue product UI on near-black', category: 'technology', bgId: 'tech-blue', fgId: 'tech-blue', acId: 'tech-blue', fgRole: 'text', mood: ['modern', 'precise'], tags: ['product', 'saas'], recommendedFor: ['technology', 'saas', 'fintech'] },
  { id: 'cc-tech-slate-indigo', name: 'Slate Indigo', description: 'Indigo accents on indigo-tinted surfaces', category: 'technology', bgId: 'tech-slate-indigo', fgId: 'tech-slate-indigo', acId: 'tech-slate-indigo', fgRole: 'text', mood: ['product', 'modern'], tags: ['indigo', 'dashboard'], recommendedFor: ['saas', 'technology', 'education'] },
  { id: 'cc-tech-neon', name: 'Tech Neon', description: 'Cyan-magenta neon on void', category: 'technology', bgId: 'tech-neon', fgId: 'tech-neon', acId: 'tech-neon', fgRole: 'accent' as any, mood: ['futuristic', 'bold'], tags: ['neon', 'cyber'], recommendedFor: ['gaming', 'innovation', 'crypto'] },
  { id: 'cc-tech-dark', name: 'Tech Dark', description: 'Slate dark professional tech', category: 'technology', bgId: 'tech-dark', fgId: 'tech-dark', acId: 'tech-dark', fgRole: 'text', mood: ['sleek', 'professional'], tags: ['dark', 'data'], recommendedFor: ['saas', 'data', 'technology'] },
  { id: 'cc-restaurant-warm', name: 'Restaurant Warm', description: 'Ember oranges on cream', category: 'restaurant', bgId: 'restaurant-warm', fgId: 'restaurant-warm', acId: 'restaurant-warm', fgRole: 'text', mood: ['warm', 'appetizing'], tags: ['ember', 'dining'], recommendedFor: ['restaurant', 'food', 'hospitality'] },
  { id: 'cc-restaurant-sage', name: 'Restaurant Sage', description: 'Sage farm-to-table calm', category: 'restaurant', bgId: 'restaurant-sage', fgId: 'restaurant-sage', acId: 'restaurant-sage', fgRole: 'text', mood: ['organic', 'crafted'], tags: ['sage', 'farm'], recommendedFor: ['restaurant', 'organic-food', 'cafe'] },
  { id: 'cc-restaurant-elegant', name: 'Restaurant Elegant', description: 'Deep wine fine-dining classic', category: 'restaurant', bgId: 'restaurant-elegant', fgId: 'restaurant-elegant', acId: 'restaurant-elegant', fgRole: 'text', mood: ['elegant', 'refined'], tags: ['fine-dining', 'classic'], recommendedFor: ['fine-dining', 'wine', 'hospitality'] },
  { id: 'cc-hospitality-brass', name: 'Hospitality Brass', description: 'Brass warmth on linen', category: 'hospitality', bgId: 'hospitality-brass', fgId: 'hospitality-brass', acId: 'hospitality-brass', fgRole: 'text', mood: ['refined', 'classic'], tags: ['brass', 'boutique'], recommendedFor: ['hotel', 'restaurant', 'luxury'] },
  { id: 'cc-hospitality-elegant', name: 'Hospitality Elegant', description: 'Navy hospitality elegance', category: 'hospitality', bgId: 'hospitality-elegant', fgId: 'hospitality-elegant', acId: 'hospitality-elegant', fgRole: 'text', mood: ['sophisticated', 'refined'], tags: ['navy', 'resort'], recommendedFor: ['hotel', 'travel', 'luxury'] },
  { id: 'cc-creative-vibrant', name: 'Creative Vibrant', description: 'Orange-gold punch on ink', category: 'creative', bgId: 'creative-vibrant', fgId: 'creative-vibrant', acId: 'creative-vibrant', fgRole: 'text', mood: ['bold', 'expressive'], tags: ['vibrant', 'agency'], recommendedFor: ['creative-agency', 'marketing', 'advertising'] },
  { id: 'cc-creative-acid', name: 'Creative Acid', description: 'Acid lime on black', category: 'creative', bgId: 'creative-acid', fgId: 'creative-acid', acId: 'creative-acid', fgRole: 'primary', mood: ['energetic', 'fresh'], tags: ['acid', 'campaign'], recommendedFor: ['advertising', 'fashion', 'streetwear'] },
  { id: 'cc-creative-minimal', name: 'Creative Minimal', description: 'Gallery grey minimal', category: 'creative', bgId: 'creative-minimal', fgId: 'creative-minimal', acId: 'creative-minimal', fgRole: 'text', mood: ['minimal', 'sophisticated'], tags: ['gallery', 'restrained'], recommendedFor: ['photography', 'architecture', 'art'] },
  { id: 'cc-pastel-dream', name: 'Pastel Dream', description: 'Soft pastels for kids & lifestyle', category: 'pastel', bgId: 'pastel-dream', fgId: 'pastel-dream', acId: 'pastel-dream', fgRole: 'text', mood: ['soft', 'gentle'], tags: ['pastel', 'kids'], recommendedFor: ['kids', 'lifestyle', 'beauty'] },
  { id: 'cc-pastel-mint', name: 'Pastel Mint', description: 'Mint freshness pastel', category: 'pastel', bgId: 'pastel-mint', fgId: 'pastel-mint', acId: 'pastel-mint', fgRole: 'text', mood: ['fresh', 'clean'], tags: ['mint', 'eco'], recommendedFor: ['wellness', 'eco', 'lifestyle'] },
  { id: 'cc-dark-luxury', name: 'Dark Luxury', description: 'Gold on black premium dark', category: 'dark', bgId: 'dark-luxury', fgId: 'dark-luxury', acId: 'dark-luxury', fgRole: 'primary', mood: ['premium', 'dark'], tags: ['gold', 'night'], recommendedFor: ['luxury', 'finance', 'technology'] },
  { id: 'cc-dark-midnight', name: 'Dark Midnight', description: 'Midnight blue product dark', category: 'dark', bgId: 'dark-midnight', fgId: 'dark-midnight', acId: 'dark-midnight', fgRole: 'text', mood: ['professional', 'dark'], tags: ['midnight', 'saas'], recommendedFor: ['saas', 'technology', 'data'] },
  { id: 'cc-dark-forest-noir', name: 'Forest Noir', description: 'Emerald glow on forest black', category: 'dark', bgId: 'dark-forest-noir', fgId: 'dark-forest-noir', acId: 'dark-forest-noir', fgRole: 'primary', mood: ['premium', 'green-glow'], tags: ['noir', 'devtools'], recommendedFor: ['technology', 'gaming', 'crypto'] },
  { id: 'cc-hc-black-yellow', name: 'HC Black Yellow', description: 'Max contrast safety yellow', category: 'high-contrast', bgId: 'high-contrast-black-yellow', fgId: 'high-contrast-black-yellow', acId: 'high-contrast-black-yellow', fgRole: 'text', mood: ['bold', 'impactful'], tags: ['safety', 'hc'], recommendedFor: ['sports', 'construction', 'advertising'] },
  { id: 'cc-hc-white-red', name: 'HC White Red', description: 'Emergency red on white', category: 'high-contrast', bgId: 'high-contrast-white-red', fgId: 'high-contrast-white-red', acId: 'high-contrast-white-red', fgRole: 'text', mood: ['urgent', 'impactful'], tags: ['emergency', 'hc'], recommendedFor: ['healthcare', 'emergency', 'warning'] },
  { id: 'cc-futuristic-cyber', name: 'Futuristic Cyber', description: 'Cyan-magenta void cyber', category: 'futuristic', bgId: 'futuristic-cyber', fgId: 'futuristic-cyber', acId: 'futuristic-cyber', fgRole: 'accent' as any, mood: ['cyber', 'bold'], tags: ['cyber', 'sci-fi'], recommendedFor: ['gaming', 'technology', 'innovation'] },
  { id: 'cc-futuristic-neon', name: 'Futuristic Neon', description: 'Neon green on void', category: 'futuristic', bgId: 'futuristic-neon', fgId: 'futuristic-neon', acId: 'futuristic-neon', fgRole: 'accent' as any, mood: ['neon', 'futuristic'], tags: ['neon', 'future'], recommendedFor: ['sci-fi', 'gaming', 'tech'] },
  { id: 'cc-editorial-classic', name: 'Editorial Classic', description: 'Newsprint editorial authority', category: 'editorial', bgId: 'editorial-classic', fgId: 'editorial-classic', acId: 'editorial-classic', fgRole: 'text', mood: ['classic', 'authoritative'], tags: ['print', 'journal'], recommendedFor: ['publishing', 'media', 'law'] },
  { id: 'cc-editorial-newsprint', name: 'Editorial Newsprint', description: 'Red accent newsprint', category: 'editorial', bgId: 'editorial-newsprint', fgId: 'editorial-newsprint', acId: 'editorial-newsprint', fgRole: 'text', mood: ['print', 'serious'], tags: ['news', 'red'], recommendedFor: ['media', 'publishing', 'education'] },
  { id: 'cc-editorial-warm', name: 'Editorial Warm', description: 'Warm literary editorial', category: 'editorial', bgId: 'editorial-warm', fgId: 'editorial-warm', acId: 'editorial-warm', fgRole: 'text', mood: ['literary', 'warm'], tags: ['books', 'warm'], recommendedFor: ['publishing', 'art', 'literary'] },
  { id: 'cc-minimal-white', name: 'Minimal White', description: 'Pure white product minimal', category: 'minimal', bgId: 'minimal-white', fgId: 'minimal-white', acId: 'minimal-white', fgRole: 'text', mood: ['clean', 'professional'], tags: ['white', 'saas'], recommendedFor: ['saas', 'technology', 'general'] },
  { id: 'cc-minimal-dark', name: 'Minimal Dark', description: 'Dark mode minimal', category: 'minimal', bgId: 'minimal-dark', fgId: 'minimal-dark', acId: 'minimal-dark', fgRole: 'text', mood: ['modern', 'clean'], tags: ['dark-mode', 'ui'], recommendedFor: ['technology', 'saas', 'devtools'] },
  { id: 'cc-minimal-warmgrey', name: 'Minimal Warm Grey', description: 'Warm grey restrained portfolio', category: 'minimal', bgId: 'minimal-warm-grey', fgId: 'minimal-warm-grey', acId: 'minimal-warm-grey', fgRole: 'text', mood: ['quiet', 'restrained'], tags: ['warm-grey', 'portfolio'], recommendedFor: ['photography', 'architecture', 'fashion'] },
  { id: 'cc-ocean-deep', name: 'Ocean Deep', description: 'Deep ocean blues', category: 'ocean', bgId: 'ocean-deep', fgId: 'ocean-deep', acId: 'ocean-deep', fgRole: 'text', mood: ['calm', 'fresh'], tags: ['deep', 'marine'], recommendedFor: ['marine', 'travel', 'wellness'] },
  { id: 'cc-ocean-nordic', name: 'Ocean Nordic', description: 'Nordic coastal cool', category: 'ocean', bgId: 'ocean-nordic', fgId: 'ocean-nordic', acId: 'ocean-nordic', fgRole: 'text', mood: ['nordic', 'clean'], tags: ['coastal', 'nordic'], recommendedFor: ['travel', 'technology', 'wellness'] },
  { id: 'cc-forest-deep', name: 'Forest Deep', description: 'Evergreen outdoor deep', category: 'forest', bgId: 'forest-deep', fgId: 'forest-deep', acId: 'forest-deep', fgRole: 'text', mood: ['natural', 'organic'], tags: ['evergreen', 'outdoor'], recommendedFor: ['eco', 'outdoor', 'food'] },
  { id: 'cc-forest-moss', name: 'Forest Moss', description: 'Moss organic calm', category: 'forest', bgId: 'forest-moss', fgId: 'forest-moss', acId: 'forest-moss', fgRole: 'text', mood: ['organic', 'calm'], tags: ['moss', 'nature'], recommendedFor: ['nature', 'organic', 'wellness'] },
  { id: 'cc-sunset-warm', name: 'Sunset Warm', description: 'Warm sunset hospitality', category: 'sunset', bgId: 'sunset-warm', fgId: 'sunset-warm', acId: 'sunset-warm', fgRole: 'text', mood: ['inviting', 'warm'], tags: ['sunset', 'food'], recommendedFor: ['restaurant', 'travel', 'food'] },
  { id: 'cc-sunset-peach', name: 'Sunset Peach', description: 'Soft peach lifestyle warm', category: 'sunset', bgId: 'sunset-peach', fgId: 'sunset-peach', acId: 'sunset-peach', fgRole: 'text', mood: ['soft', 'inviting'], tags: ['peach', 'brunch'], recommendedFor: ['beauty', 'food', 'travel'] },
  { id: 'cc-rose-gold', name: 'Rose Gold', description: 'Romantic rose gold on night', category: 'rose', bgId: 'rose-gold', fgId: 'rose-gold', acId: 'rose-gold', fgRole: 'primary', mood: ['romantic', 'feminine'], tags: ['rose-gold', 'beauty'], recommendedFor: ['beauty', 'luxury', 'fashion'] },
  { id: 'cc-rose-burgundy', name: 'Burgundy Rose', description: 'Rich burgundy romance', category: 'rose', bgId: 'rose-burgundy', fgId: 'rose-burgundy', acId: 'rose-burgundy', fgRole: 'primary', mood: ['rich', 'bold'], tags: ['burgundy', 'wine'], recommendedFor: ['beauty', 'fashion', 'wine'] },
  { id: 'cc-arctic-cool', name: 'Arctic Cool', description: 'Arctic crisp winter tech', category: 'arctic', bgId: 'arctic-cool', fgId: 'arctic-cool', acId: 'arctic-cool', fgRole: 'text', mood: ['crisp', 'cool'], tags: ['arctic', 'winter'], recommendedFor: ['winter-sports', 'technology', 'wellness'] },
  { id: 'cc-arctic-frost', name: 'Arctic Frost', description: 'Frost light wellness', category: 'arctic', bgId: 'arctic-frost', fgId: 'arctic-frost', acId: 'arctic-frost', fgRole: 'text', mood: ['fresh', 'clean'], tags: ['frost', 'cold'], recommendedFor: ['wellness', 'sports', 'travel'] },
  { id: 'cc-desert-sand', name: 'Desert Sand', description: 'Dune sand travel warm', category: 'desert', bgId: 'desert-sand', fgId: 'desert-sand', acId: 'desert-sand', fgRole: 'text', mood: ['earthy', 'natural'], tags: ['dune', 'travel'], recommendedFor: ['travel', 'hospitality', 'architecture'] },
  { id: 'cc-desert-canyon', name: 'Desert Canyon', description: 'Canyon ember drama', category: 'desert', bgId: 'desert-canyon', fgId: 'desert-canyon', acId: 'desert-canyon', fgRole: 'text', mood: ['dramatic', 'warm'], tags: ['canyon', 'western'], recommendedFor: ['travel', 'restaurant', 'western'] },
  { id: 'cc-urban-street', name: 'Urban Street', description: 'Streetwear ink orange', category: 'urban', bgId: 'urban-street', fgId: 'urban-street', acId: 'urban-street', fgRole: 'text', mood: ['urban', 'energetic'], tags: ['streetwear', 'city'], recommendedFor: ['streetwear', 'sports', 'creative'] },
  { id: 'cc-urban-graphite-orange', name: 'Graphite Orange', description: 'Construction graphite + safety orange', category: 'urban', bgId: 'urban-graphite-orange', fgId: 'urban-graphite-orange', acId: 'urban-graphite-orange', fgRole: 'text', mood: ['industrial', 'direct'], tags: ['construction', 'safety'], recommendedFor: ['construction', 'sports', 'urban'] },
  { id: 'cc-vintage-retro', name: 'Vintage Retro', description: 'Retro sepia nostalgia', category: 'vintage', bgId: 'vintage-retro', fgId: 'vintage-retro', acId: 'vintage-retro', fgRole: 'text', mood: ['nostalgic', 'classic'], tags: ['retro', 'sepia'], recommendedFor: ['retro brands', 'cafes', 'music'] },
  { id: 'cc-vintage-vintage', name: 'Vintage Warm', description: 'Warm vintage craft', category: 'vintage', bgId: 'vintage-vintage', fgId: 'vintage-vintage', acId: 'vintage-vintage', fgRole: 'text', mood: ['warm', 'nostalgic'], tags: ['craft', 'heritage'], recommendedFor: ['craft brands', 'hospitality', 'retail'] },
  { id: 'cc-cyber-neon', name: 'Cyber Neon', description: 'Matrix neon cyber', category: 'cyber', bgId: 'cyber-neon', fgId: 'cyber-neon', acId: 'cyber-neon', fgRole: 'primary', mood: ['neon', 'bold'], tags: ['matrix', 'gaming'], recommendedFor: ['gaming', 'tech', 'crypto'] },
  { id: 'cc-cyber-violet', name: 'Violet Cyber', description: 'Violet void neon', category: 'cyber', bgId: 'cyber-violet', fgId: 'cyber-violet', acId: 'cyber-violet', fgRole: 'primary', mood: ['futuristic', 'bold'], tags: ['violet', 'creator'], recommendedFor: ['gaming', 'creative', 'technology'] },
  { id: 'cc-bold-bright', name: 'Bold Bright', description: 'RGB primary punch (sports)', category: 'bold', bgId: 'bold-bright', fgId: 'bold-bright', acId: 'bold-bright', fgRole: 'text', mood: ['impactful', 'bold'], tags: ['rgb', 'sports'], recommendedFor: ['sports', 'advertising', 'marketing'] },
  { id: 'cc-soft-pastel', name: 'Soft Pastel', description: 'Dreamy soft pastel', category: 'soft', bgId: 'soft-pastel', fgId: 'soft-pastel', acId: 'soft-pastel', fgRole: 'text', mood: ['dreamy', 'gentle'], tags: ['soft', 'pastel'], recommendedFor: ['beauty', 'kids', 'lifestyle'] },
  { id: 'cc-moody-dark', name: 'Moody Dark', description: 'Moody navy mystery dark', category: 'dark', bgId: 'moody-dark', fgId: 'moody-dark', acId: 'moody-dark', fgRole: 'text', mood: ['mysterious', 'premium'], tags: ['moody', 'navy'], recommendedFor: ['luxury', 'technology', 'creative'] },
  { id: 'cc-ocean-teal', name: 'Deep Teal', description: 'Deep teal marine calm', category: 'ocean', bgId: 'ocean-deep-teal', fgId: 'ocean-deep-teal', acId: 'ocean-deep-teal', fgRole: 'text', mood: ['calm', 'fresh'], tags: ['teal', 'marine'], recommendedFor: ['wellness', 'marine', 'travel'] },
  { id: 'cc-forest-emerald', name: 'Emerald Forest', description: 'Emerald eco fresh', category: 'forest', bgId: 'forest-emerald', fgId: 'forest-emerald', acId: 'forest-emerald', fgRole: 'text', mood: ['fresh', 'organic'], tags: ['emerald', 'eco'], recommendedFor: ['eco', 'wellness', 'nature'] },
  { id: 'cc-sunset-orange', name: 'Sunset Orange', description: 'Orange sunset travel', category: 'sunset', bgId: 'sunset-orange', fgId: 'sunset-orange', acId: 'sunset-orange', fgRole: 'text', mood: ['inviting', 'warm'], tags: ['orange', 'travel'], recommendedFor: ['travel', 'food', 'warm brands'] },
  { id: 'cc-rose-quartz', name: 'Rose Quartz', description: 'Quartz soft romance', category: 'rose', bgId: 'rose-quartz', fgId: 'rose-quartz', acId: 'rose-quartz', fgRole: 'text', mood: ['romantic', 'feminine'], tags: ['quartz', 'beauty'], recommendedFor: ['beauty', 'lifestyle', 'fashion'] },
  { id: 'cc-urban-industrial', name: 'Urban Industrial', description: 'Industrial grey orange', category: 'urban', bgId: 'urban-industrial', fgId: 'urban-industrial', acId: 'urban-industrial', fgRole: 'text', mood: ['urban', 'modern'], tags: ['industrial', 'loft'], recommendedFor: ['industrial', 'urban', 'modern'] },
  { id: 'cc-desert-clay', name: 'Clay Desert', description: 'Clay ember restaurant', category: 'desert', bgId: 'desert-clay-warm', fgId: 'desert-clay-warm', acId: 'desert-clay-warm', fgRole: 'text', mood: ['grounded', 'warm'], tags: ['clay', 'southwest'], recommendedFor: ['restaurant', 'construction', 'travel'] },
  { id: 'cc-medical-soft', name: 'Medical Soft', description: 'Soft pediatric care blue', category: 'medical', bgId: 'medical-soft', fgId: 'medical-soft', acId: 'medical-soft', fgRole: 'text', mood: ['caring', 'soft'], tags: ['pediatric', 'care'], recommendedFor: ['pediatric', 'healthcare', 'dental'] },
  { id: 'cc-wellness-harvest', name: 'Wellness Harvest', description: 'Harvest nutrition warmth', category: 'wellness', bgId: 'wellness-harvest', fgId: 'wellness-harvest', acId: 'wellness-harvest', fgRole: 'text', mood: ['harvest', 'natural'], tags: ['nutrition', 'harvest'], recommendedFor: ['nutrition', 'organic', 'wellness'] },
  { id: 'cc-nature-ocean', name: 'Nature Ocean', description: 'Coastal nature blue', category: 'nature', bgId: 'nature-ocean', fgId: 'nature-ocean', acId: 'nature-ocean', fgRole: 'text', mood: ['ocean', 'fresh'], tags: ['coastal', 'marine'], recommendedFor: ['travel', 'marine', 'eco'] },
  { id: 'cc-fashion-navy-rose', name: 'Fashion Navy Rose', description: 'Navy ground rose accent', category: 'fashion', bgId: 'fashion-navy-rose', fgId: 'fashion-navy-rose', acId: 'fashion-navy-rose', fgRole: 'primary', mood: ['elegant', 'feminine'], tags: ['navy', 'rose'], recommendedFor: ['fashion', 'beauty', 'editorial'] },
  { id: 'cc-restaurant-bistro', name: 'Restaurant Bistro', description: 'Casual bistro browns', category: 'restaurant', bgId: 'restaurant-bistro', fgId: 'restaurant-bistro', acId: 'restaurant-bistro', fgRole: 'text', mood: ['casual', 'inviting'], tags: ['bistro', 'casual'], recommendedFor: ['bistro', 'casual-dining', 'lifestyle'] },
  { id: 'cc-hospitality-soft', name: 'Hospitality Soft', description: 'Soft resort blues', category: 'hospitality', bgId: 'hospitality-soft', fgId: 'hospitality-soft', acId: 'hospitality-soft', fgRole: 'text', mood: ['calm', 'luxurious'], tags: ['resort', 'soft'], recommendedFor: ['resort', 'hotel', 'wellness'] },
  { id: 'cc-creative-playful', name: 'Creative Playful', description: 'Playful candy creative', category: 'creative', bgId: 'creative-playful', fgId: 'creative-playful', acId: 'creative-playful', fgRole: 'text', mood: ['playful', 'colorful'], tags: ['candy', 'fun'], recommendedFor: ['playful brands', 'kids', 'creative'] },
  { id: 'cc-pastel-lavender', name: 'Pastel Lavender', description: 'Lavender relaxation pastel', category: 'pastel', bgId: 'pastel-lavender', fgId: 'pastel-lavender', acId: 'pastel-lavender', fgRole: 'text', mood: ['calm', 'romantic'], tags: ['lavender', 'relax'], recommendedFor: ['relaxation', 'beauty', 'lifestyle'] },
  { id: 'cc-dark-deep', name: 'Deep Dark', description: 'Violet void deep dark', category: 'dark', bgId: 'dark-deep', fgId: 'dark-deep', acId: 'dark-deep', fgRole: 'primary', mood: ['mysterious', 'bold'], tags: ['void', 'violet'], recommendedFor: ['gaming', 'creative', 'technology'] },
  { id: 'cc-ocean-tropical', name: 'Tropical Ocean', description: 'Tropical aqua travel', category: 'ocean', bgId: 'ocean-tropical', fgId: 'ocean-tropical', acId: 'ocean-tropical', fgRole: 'text', mood: ['tropical', 'vibrant'], tags: ['tropical', 'aqua'], recommendedFor: ['travel', 'resort', 'food'] },
  { id: 'cc-sunset-dusk', name: 'Sunset Dusk', description: 'Dusk drama warm', category: 'sunset', bgId: 'sunset-dusk', fgId: 'sunset-dusk', acId: 'sunset-dusk', fgRole: 'text', mood: ['dramatic', 'sunset'], tags: ['dusk', 'drama'], recommendedFor: ['travel', 'sunset brands', 'food'] },
  { id: 'cc-rose-blush', name: 'Rose Blush', description: 'Blush soft pink feminine', category: 'rose', bgId: 'rose-blush', fgId: 'rose-blush', acId: 'rose-blush', fgRole: 'text', mood: ['soft', 'feminine'], tags: ['blush', 'pink'], recommendedFor: ['beauty', 'lifestyle', 'fashion'] },
  { id: 'cc-desert-sunset', name: 'Desert Sunset', description: 'Desert dusk ember', category: 'desert', bgId: 'desert-sunset', fgId: 'desert-sunset', acId: 'desert-sunset', fgRole: 'text', mood: ['dramatic', 'earthy'], tags: ['dusk', 'dune'], recommendedFor: ['travel', 'western', 'hospitality'] },
  { id: 'cc-urban-modern', name: 'Urban Modern', description: 'Modern urban cyan', category: 'urban', bgId: 'urban-modern', fgId: 'urban-modern', acId: 'urban-modern', fgRole: 'text', mood: ['sleek', 'urban'], tags: ['cyan', 'city'], recommendedFor: ['urban', 'technology', 'modern'] },
  { id: 'cc-vintage-sepia', name: 'Vintage Sepia', description: 'Sepia heritage warm', category: 'vintage', bgId: 'vintage-sepia', fgId: 'vintage-sepia', acId: 'vintage-sepia', fgRole: 'text', mood: ['heritage', 'classic'], tags: ['sepia', 'archive'], recommendedFor: ['heritage brands', 'museums', 'retail'] },
  { id: 'cc-cool-ice-med', name: 'Cool Ice Med', description: 'Ice clinical support blue', category: 'cool', bgId: 'cool-ice', fgId: 'medical-clean', acId: 'medical-clean', fgRole: 'text', mood: ['clinical', 'calm'], tags: ['ice', 'support'], recommendedFor: ['medical', 'support-desk', 'wellness'] },
  { id: 'cc-luxury-minimal-pair', name: 'Luxury Minimal Pair', description: 'Onyx ground, minimal white ink', category: 'luxury', bgId: 'luxury-onyx', fgId: 'minimal-white', acId: 'luxury-gold', fgRole: 'text', mood: ['premium', 'minimal'], tags: ['onyx', 'white'], recommendedFor: ['luxury', 'fashion', 'hotel'] },
  { id: 'cc-editorial-gold-news', name: 'Editorial Gold News', description: 'Newsprint ground gold accent', category: 'editorial', bgId: 'editorial-newsprint', fgId: 'luxury-gold', acId: 'luxury-gold', fgRole: 'primary', mood: ['authoritative', 'premium'], tags: ['news', 'gold'], recommendedFor: ['media', 'finance', 'publishing'] },
  { id: 'cc-restaurant-clay-sage', name: 'Clay Sage Kitchen', description: 'Clay ground sage accent', category: 'restaurant', bgId: 'desert-clay-warm', fgId: 'restaurant-sage', acId: 'restaurant-sage', fgRole: 'text', mood: ['crafted', 'organic'], tags: ['clay', 'sage'], recommendedFor: ['farm-to-table', 'restaurant', 'cafe'] },
  { id: 'cc-tech-warm-accent', name: 'Tech Warm Accent', description: 'Slate tech with sunset CTA', category: 'technology', bgId: 'cool-steel', fgId: 'sunset-orange', acId: 'sunset-orange', fgRole: 'text', mood: ['modern', 'warm-accent'], tags: ['steel', 'cta'], recommendedFor: ['saas', 'product', 'marketing'] },
  { id: 'cc-wellness-arctic', name: 'Wellness Arctic', description: 'Arctic frost wellness light', category: 'wellness', bgId: 'arctic-frost', fgId: 'wellness-serene', acId: 'wellness-serene', fgRole: 'text', mood: ['serene', 'fresh'], tags: ['frost', 'sky'], recommendedFor: ['spa', 'meditation', 'wellness'] },
  { id: 'cc-fashion-acid-editorial', name: 'Fashion Acid Editorial', description: 'Newsprint ground acid accent', category: 'fashion', bgId: 'editorial-newsprint', fgId: 'creative-acid', acId: 'creative-acid', fgRole: 'primary', mood: ['editorial', 'bold'], tags: ['acid', 'print'], recommendedFor: ['fashion', 'streetwear', 'art'] },
  { id: 'cc-finance-steel-blue', name: 'Finance Steel Blue', description: 'Steel ground finance blue', category: 'finance', bgId: 'cool-steel', fgId: 'tech-blue', acId: 'tech-blue', fgRole: 'text', mood: ['professional', 'trustworthy'], tags: ['banking', 'trust'], recommendedFor: ['finance', 'insurance', 'enterprise'] },
  { id: 'cc-education-indigo', name: 'Education Indigo', description: 'Indigo learning clean', category: 'education', bgId: 'tech-slate-indigo', fgId: 'mono-charcoal', acId: 'tech-slate-indigo', fgRole: 'text', mood: ['clean', 'professional'], tags: ['learning', 'campus'], recommendedFor: ['education', 'courses', 'saas'] },
  { id: 'cc-law-newsprint', name: 'Law Newsprint', description: 'Court-authority newsprint', category: 'law', bgId: 'editorial-classic', fgId: 'editorial-newsprint', acId: 'editorial-newsprint', fgRole: 'text', mood: ['authoritative', 'serious'], tags: ['court', 'brief'], recommendedFor: ['law', 'consulting', 'finance'] },
  { id: 'cc-hotel-brass-night', name: 'Hotel Brass Night', description: 'Night ground brass accent', category: 'hospitality', bgId: 'luxury-onyx', fgId: 'hospitality-brass', acId: 'hospitality-brass', fgRole: 'primary', mood: ['refined', 'night'], tags: ['brass', 'night'], recommendedFor: ['hotel', 'fine-dining', 'luxury'] },
];

function pickColor(p: ColorPalette, role: ComboDef['fgRole'] | undefined, which: 'bg' | 'fg' | 'ac'): string {
  if (which === 'bg') return p.background || p.surface || '#FFFFFF';
  if (which === 'ac') return p.accent || p.cta || p.primary;
  switch (role) {
    case 'primary':
      return p.primary;
    case 'secondary':
      return p.secondary;
    case 'muted':
      return p.muted;
    case 'text':
    default:
      return p.text || p.primary;
  }
}

function buildCombination(def: ComboDef): ColorCombination {
  const bg = findPalette(def.bgId);
  const fg = findPalette(def.fgId);
  const ac = findPalette(def.acId);
  const background = pickColor(bg, def.fgRole, 'bg');
  const foreground = pickColor(fg, def.fgRole, 'fg');
  const accent = pickColor(ac, 'primary', 'ac');
  const evalResult = evaluateColorCombination({ background, foreground, accent });
  return {
    id: def.id,
    name: def.name,
    description: def.description,
    category: def.category,
    backgroundId: def.bgId,
    foregroundId: def.fgId,
    accentId: def.acId,
    background,
    foreground,
    accent,
    surface: bg.surface || background,
    muted: bg.muted || foreground,
    contrastRatio: evalResult.ratio,
    wcagLevel: evalResult.level,
    passAA: evalResult.pass,
    warnings: evalResult.warnings,
    mood: def.mood,
    tags: def.tags,
    recommendedFor: def.recommendedFor,
  };
}

export const colorCombinations: ColorCombination[] = COMBO_DEFS.map(buildCombination);
export const fullColorCombinations: ColorCombination[] = colorCombinations;

export const getColorCombination = (id: string): ColorCombination | undefined =>
  colorCombinations.find((c) => c.id === id);

export const getColorCombinationsByMood = (mood: string): ColorCombination[] =>
  colorCombinations.filter((c) => c.mood.includes(mood));

export const searchColorCombinations = (query: string): ColorCombination[] => {
  const q = query.toLowerCase();
  return colorCombinations.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.tags.some((t) => t.includes(q)) ||
      c.recommendedFor.some((t) => t.includes(q))
  );
};

export default colorCombinations;
