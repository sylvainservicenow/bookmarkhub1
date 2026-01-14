export function JsonLd() {
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'BookmarkHub',
    description: 'Discover and share the best ServiceNow bookmarks. Curated resources for developers, admins, and architects.',
    url: 'https://www.mybookmarkhub.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://www.mybookmarkhub.com/browse?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  }

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'BookmarkHub',
    url: 'https://www.mybookmarkhub.com',
    logo: 'https://www.mybookmarkhub.com/icon.svg',
    description: 'A community-driven platform for ServiceNow professionals to discover and share valuable resources.',
    founder: {
      '@type': 'Person',
      name: 'Sylvain Hauser',
      url: 'https://www.linkedin.com/in/sylvainhauser/',
    },
    sameAs: [
      'https://www.linkedin.com/in/sylvainhauser/',
    ],
  }

  const softwareAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'BookmarkHub',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: 'ServiceNow bookmark management and discovery platform for developers, admins, and architects.',
    url: 'https://www.mybookmarkhub.com',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '5',
      ratingCount: '1',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
      />
    </>
  )
}
