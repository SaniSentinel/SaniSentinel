import React from 'react'
import { Link } from 'react-router-dom'

const LandingFooter = () => {
  const currentYear = new Date().getFullYear()

  const footerSections = [
    {
      title: 'Platform',
      links: [
        { name: 'Live Dashboard', href: '/dashboard' },
        { name: 'Facility Map', href: '/facility-map' },
        { name: 'Reports & Analytics', href: '/reports' },
        { name: 'SMS Integration', href: '#features' }
      ]
    },
    {
      title: 'Resources',
      links: [
        { name: 'Documentation', href: '#' },
        { name: 'API Reference', href: '#' },
        { name: 'System Status', href: '#' },
        { name: 'Support Center', href: '#contact' }
      ]
    },
    {
      title: 'Organization',
      links: [
        { name: 'About SaniSentinel', href: '#about' },
        { name: 'Our Impact', href: '#impact' },
        { name: 'Contact Us', href: '#contact' },
        { name: 'Partnerships', href: '#' }
      ]
    },
    {
      title: 'Legal',
      links: [
        { name: 'Privacy Policy', href: '#' },
        { name: 'Terms of Service', href: '#' },
        { name: 'Data Protection', href: '#' },
        { name: 'Accessibility', href: '#' }
      ]
    }
  ]

  const socialLinks = [
    {
      name: 'Twitter',
      href: '#',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
        </svg>
      )
    },
    {
      name: 'LinkedIn',
      href: '#',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      )
    },
    {
      name: 'GitHub',
      href: '#',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
      )
    }
  ]

  const scrollToSection = (href) => {
    if (href.startsWith('#')) {
      const element = document.querySelector(href)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-green-900 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl flex items-center justify-center shadow-xl">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-200 to-green-200 bg-clip-text text-transparent">
                  SaniSentinel
                </div>
                <div className="text-blue-200 font-medium">
                  Protecting Communities Through Smart Sanitation
                </div>
              </div>
            </div>
            
            <p className="text-gray-300 text-lg leading-relaxed mb-6">
              Empowering Northern Ghana with climate-resilient sanitation monitoring. 
              Real-time facility tracking, SMS-based reporting, and predictive maintenance 
              to ensure every community has access to safe, reliable sanitation.
            </p>

            {/* Impact Stats */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="rounded-xl p-4 border border-blue-400/30">
                <div className="text-2xl font-bold text-white">2.4M+</div>
                <div className="text-blue-200 text-sm">People Protected</div>
              </div>
              <div className="rounded-xl p-4 border border-green-400/30">
                <div className="text-2xl font-bold text-white">18+</div>
                <div className="text-green-200 text-sm">Districts Monitored</div>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center text-gray-300 hover:text-white hover:bg-blue-600/30 transition-all duration-300 hover:scale-110 border border-blue-400/30"
                  aria-label={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-8">
            {footerSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-lg font-bold text-white mb-4 relative">
                  {section.title}
                  <span className="absolute -bottom-1 left-0 w-8 h-0.5 bg-gradient-to-r from-blue-400 to-green-400"></span>
                </h3>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      {link.href.startsWith('#') ? (
                        <button
                          onClick={() => scrollToSection(link.href)}
                          className="text-left text-sm text-white hover:text-emerald-200 transition-all duration-300 hover:translate-x-1 transform inline-block w-full"
                        >
                          <span className="flex items-center">
                            <svg className="w-3 h-3 mr-2 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            {link.name}
                          </span>
                        </button>
                      ) : (
                        <Link
                          to={link.href}
                          className="text-left text-sm text-white hover:text-emerald-200 transition-all duration-300 hover:translate-x-1 transform inline-block w-full"
                        >
                          <span className="flex items-center">
                            <svg className="w-3 h-3 mr-2 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            {link.name}
                          </span>
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="bg-blue-600/30 rounded-2xl p-8 mb-12 border border-blue-400/40">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Stay Updated</h3>
              <p className="text-gray-300">
                Get the latest updates on sanitation monitoring and community impact in Northern Ghana.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-white/20 border border-white/40 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/30"
              />
              <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-semibold hover:scale-105">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-white/20">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-300 text-sm">
              © {currentYear} SaniSentinel. Built with ❤️ for UNICEF StartUp Lab Hackathon 2026.
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-gray-300 text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>System Active - Protecting Communities 24/7</span>
              </div>
            </div>
          </div>
          
          {/* UNICEF Attribution */}
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-gray-400 text-sm">
              Proudly supporting the UN Sustainable Development Goals for clean water and sanitation.
            </p>
            <div className="flex justify-center items-center space-x-4 mt-3">
              <span className="text-blue-300 text-xs">SDG 6: Clean Water & Sanitation</span>
              <span className="text-gray-500">•</span>
              <span className="text-green-300 text-xs">SDG 3: Good Health & Well-being</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default LandingFooter