'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp } from 'lucide-react'

export default function HelpPage() {
  const faqs = [
    {
      question: 'What is BookmarkHub?',
      answer: 'BookmarkHub is a collaborative platform for discovering, sharing, and organizing bookmarks. It allows teams and communities to curate valuable web resources together, rate content, and discover new resources through recommendations.'
    },
    {
      question: 'How do I create an account?',
      answer: 'Click the "Sign Up" button in the top navigation bar. You can create an account using your email address. Once registered, you can start saving and sharing bookmarks immediately.'
    },
    {
      question: 'How do I add a bookmark?',
      answer: 'Once logged in, click the "Submit" button in the navigation bar. Enter the URL of the page you want to bookmark, and our system will automatically fetch the title and description. You can then add tags and choose the visibility settings before saving.'
    },
    {
      question: 'What are tags and how do I use them?',
      answer: 'Tags are keywords that help categorize and organize bookmarks. When adding a bookmark, you can select existing tags or suggest new ones. Tags make it easier to find related content and browse bookmarks by topic.'
    },
    {
      question: 'How do groups work?',
      answer: 'Groups are communities of users with shared interests. You can create a group (subject to admin approval) or join existing ones. Group members can share bookmarks visible only to that group, making it perfect for team collaboration or special interest communities.'
    },
    {
      question: 'Can I make my bookmarks private?',
      answer: 'Yes! When adding a bookmark, you can choose its visibility: Public (visible to everyone), Group (visible only to specific group members), or Private (visible only to you). You can change visibility settings at any time.'
    },
    {
      question: 'How does the rating system work?',
      answer: 'Users can rate bookmarks on a scale of 1-5 stars. The average rating is displayed on each bookmark card. Higher-rated bookmarks appear in the "Top Rated" section. Your rating helps others discover quality content.'
    },
    {
      question: 'How do I search for bookmarks?',
      answer: 'Use the search bar at the top of the page to search by title, description, or URL. You can also filter by tags, sort by date or rating, and browse by categories. The advanced search page offers more filtering options.'
    },
    {
      question: 'Can I save bookmarks to view later?',
      answer: 'Yes! Click the heart icon on any bookmark to add it to your favorites. Access all your saved bookmarks from the "Favorites" page in your dashboard. This is a great way to build your personal reading list.'
    },
    {
      question: 'How do I report inappropriate content?',
      answer: 'If you find content that violates our community guidelines, please use our Contact Us page to report it. Include the bookmark URL and a brief description of the issue. Our team reviews all reports promptly.'
    }
  ]

  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Help Center</h1>
          <p className="text-xl text-gray-600">Frequently Asked Questions</p>
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                )}
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4">
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-12 text-center bg-white rounded-xl p-8 shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Still have questions?</h2>
          <p className="text-gray-600 mb-4">We&apos;re here to help!</p>
          <Link 
            href="/contact"
            className="inline-block bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-amber-600 transition-all"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  )
}
