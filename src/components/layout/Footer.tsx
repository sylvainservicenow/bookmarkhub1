'use client'

import Link from 'next/link'
import { Linkedin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-slate-800 text-white py-12 mt-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto text-center">
          {/* Information Column */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Information</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/pricing" className="text-slate-300 hover:text-white transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-slate-300 hover:text-white transition-colors">
                  Help
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-slate-300 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-slate-300 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-slate-300 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-700 mt-8 pt-8 flex flex-col md:flex-row justify-center items-center gap-2">
          <p className="text-slate-400 text-sm flex items-center gap-2">
            © 2026 Sylvain Hauser
            <a 
              href="https://www.linkedin.com/in/sylvainhauser/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin size={18} />
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
