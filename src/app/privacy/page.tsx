export const metadata = {
  title: 'Privacy Policy - BookmarkHub',
  description: 'BookmarkHub privacy policy',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-500">Last updated: January 2026</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="prose prose-gray max-w-none">
            <h2 className="text-2xl font-semibold text-gray-900 mt-0 mb-4">1. Introduction</h2>
            <p className="text-gray-600 mb-6">
              Welcome to BookmarkHub. We respect your privacy and are committed to protecting your personal data. 
              This privacy policy explains how we collect, use, and safeguard your information when you use our service.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
            <p className="text-gray-600 mb-4">We collect the following types of information:</p>
            <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-2">
              <li><strong>Account Information:</strong> Email address and display name when you register</li>
              <li><strong>Bookmark Data:</strong> URLs, titles, descriptions, and tags you save</li>
              <li><strong>Usage Data:</strong> How you interact with the platform, including ratings and comments</li>
              <li><strong>Technical Data:</strong> Browser type, device information, and IP address</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-600 mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-2">
              <li>Provide and maintain our service</li>
              <li>Personalize your experience</li>
              <li>Enable social features like groups and comments</li>
              <li>Improve our platform based on usage patterns</li>
              <li>Send important service updates</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Sharing</h2>
            <p className="text-gray-600 mb-6">
              We do not sell your personal data. Your public bookmarks are visible to other users as intended by the platform&apos;s social features. 
              Private bookmarks remain visible only to you. Group bookmarks are shared only with group members.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
            <p className="text-gray-600 mb-6">
              We implement appropriate security measures to protect your data, including encrypted connections (HTTPS), 
              secure password storage, and regular security audits. However, no method of transmission over the Internet 
              is 100% secure.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Rights</h2>
            <p className="text-gray-600 mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and associated data</li>
              <li>Export your bookmarks</li>
              <li>Object to certain data processing</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Cookies</h2>
            <p className="text-gray-600 mb-6">
              We use essential cookies to maintain your session and remember your preferences. 
              These are necessary for the platform to function properly.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Third-Party Services</h2>
            <p className="text-gray-600 mb-6">
              We use Supabase for authentication and database services. We use favicon services to display website icons. 
              These services have their own privacy policies.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Changes to This Policy</h2>
            <p className="text-gray-600 mb-6">
              We may update this privacy policy from time to time. We will notify you of any significant changes 
              by posting the new policy on this page and updating the "Last updated" date.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contact Us</h2>
            <p className="text-gray-600">
              If you have questions about this privacy policy or your personal data, please contact us through our 
              <a href="https://www.linkedin.com/in/sylvainhauser/" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-600"> LinkedIn page</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
