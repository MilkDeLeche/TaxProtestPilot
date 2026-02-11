import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { HeroSection } from '../components/landing/HeroSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { HowItWorksSection } from '../components/landing/HowItWorksSection';
import { PricingSection } from '../components/landing/PricingSection';
import { CTASection } from '../components/landing/CTASection';
import { Footer } from '../components/landing/Footer';

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

/**
 * SEO: JSON-LD Schema for "Position 0" featured snippet eligibility.
 * Organization + SoftwareApplication tells Google exactly what we offer,
 * increasing rich result likelihood for "property tax protest software" queries.
 */
const LANDING_PAGE_SCHEMA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://taxpilot.com/#organization',
      name: 'Tax Protest Pilot',
      url: 'https://taxpilot.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://taxpilot.com/images/TAXPILOT2.png',
      },
      description: 'Property tax protest software for tax professionals. File appeals, calculate savings, export to QuickBooks.',
      sameAs: [],
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://taxpilot.com/#software',
      name: 'Tax Protest Pilot',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description: 'Property tax protest software that automates property tax assessments, client management, and savings calculations. Import CSV data, run tax savings analytics, manage clients, and export to QuickBooks.',
      offers: {
        '@type': 'AggregateOffer',
        lowPrice: '249',
        highPrice: '599',
        priceCurrency: 'USD',
        offerCount: '3',
      },
      featureList: [
        'Property tax protest filing',
        'CSV import and property tax calculations',
        'QuickBooks export',
        'Client management',
        'Appeal package generation',
        'Tax savings calculator',
      ],
    },
    {
      '@type': 'WebPage',
      '@id': 'https://taxpilot.com/#webpage',
      url: 'https://taxpilot.com',
      name: 'Tax Protest Pilot | Property Tax Protest Software | File Appeals & Export to QuickBooks | By MODO',
      description: 'Tax Protest Pilot — #1 Property Tax Protest Software. File appeals, calculate savings, export to QuickBooks. Trusted by 500+ tax professionals. By MODO.',
      isPartOf: { '@id': 'https://taxpilot.com/#organization' },
      about: { '@id': 'https://taxpilot.com/#software' },
    },
  ],
};

export default function LandingPage() {
  /**
   * SEO: Dynamic meta when landing page mounts. Ensures correct title/description
   * for client-side nav. Index.html has base meta; this refines for the homepage.
   */
  useEffect(() => {
    const prevTitle = document.title;
    const prevDesc = document.querySelector('meta[name="description"]')?.getAttribute('content');
    document.title = 'Tax Protest Pilot | Property Tax Protest Software | File Appeals & Export to QuickBooks | By MODO';
    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) {
      descMeta.setAttribute('content', 'Tax Protest Pilot — #1 Property Tax Protest Software. File appeals, calculate savings, export to QuickBooks. Trusted by 500+ tax professionals. By MODO.');
    }
    return () => {
      document.title = prevTitle;
      if (descMeta && prevDesc) descMeta.setAttribute('content', prevDesc);
    };
  }, []);

  return (
    <motion.div
      className="min-h-screen"
      variants={container}
      initial="hidden"
      animate="visible"
      role="document"
      aria-label="Tax Protest Pilot property tax protest software homepage"
    >
      {/* SEO: JSON-LD - Injected for crawlers. No visual impact. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(LANDING_PAGE_SCHEMA) }}
      />

      {/* SEO: Semantic <header> - Nav is the page header. Improves document outline. */}
      <header aria-label="Site navigation and branding">
        <LandingNavbar />
      </header>

      {/* SEO: Semantic <main> - Primary content landmark. Critical for A11y + SEO. */}
      <main id="main-content" aria-label="Tax Protest Pilot features, pricing, and product overview">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <CTASection />
      </main>

      <Footer />
    </motion.div>
  );
}
