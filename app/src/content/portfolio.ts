import rawPortfolioContent from './portfolio.json';
import {
  portfolioContentSchema,
  type PortfolioProjectSlide,
} from './portfolio.schema';

export const portfolioContent = portfolioContentSchema.parse(rawPortfolioContent);
export const { contact, trackLabels } = portfolioContent;
export const slides = portfolioContent.slides.filter(slide => slide.visible !== false && !slide.archived);

export const projectSlides = slides.filter(
  (slide): slide is PortfolioProjectSlide => slide.kind === 'project',
);

export const antigravityContent = portfolioContent.antigravity;
