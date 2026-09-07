import { SectionTemplateItem } from '../SectionTemplatesData';
import { heroSections } from './hero-sections';
import { featureSections } from './features-sections';
import { serviceSections } from './services-sections';
import { aboutSections } from './about-sections';
import { teamSections } from './team-sections';
import { testimonialSections } from './testimonials-sections';
import { pricingSections } from './pricing-sections';
import { ctaSections } from './cta-sections';
import { logoSections } from './logos-sections';
import { statsSections } from './stats-sections';
import { gallerySections } from './gallery-sections';
import { portfolioSections } from './portfolio-sections';
import { faqSections } from './faq-sections';
import { contactSections } from './contact-sections';
import { blogSections } from './blog-sections';
import { newsletterSections } from './newsletter-sections';
import { footerSections } from './footer-sections';
import { navigationSections } from './navigation-sections';
import { productSections } from './products-sections';

export const ALL_SECTION_TEMPLATES: SectionTemplateItem[] = [
  ...heroSections,
  ...featureSections,
  ...serviceSections,
  ...aboutSections,
  ...teamSections,
  ...testimonialSections,
  ...pricingSections,
  ...ctaSections,
  ...logoSections,
  ...statsSections,
  ...gallerySections,
  ...portfolioSections,
  ...faqSections,
  ...contactSections,
  ...blogSections,
  ...newsletterSections,
  ...footerSections,
  ...navigationSections,
  ...productSections,
];
