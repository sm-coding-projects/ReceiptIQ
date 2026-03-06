import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary-950 text-primary-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary-800 rounded-lg flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 10L12 7L18 10V16L12 19L6 16V10Z" stroke="#3b82f6" strokeWidth="1.5" fill="none"/>
                  <circle cx="12" cy="13" r="2" fill="#3b82f6"/>
                </svg>
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Receipt<span className="text-accent-500">IQ</span>
              </span>
            </Link>
            <p className="text-sm text-primary-400 leading-relaxed">
              AI-powered receipt OCR platform. Extract structured data from receipts with industry-leading accuracy.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Product</h4>
            <ul className="space-y-2.5">
              <li><a href="#features" className="text-sm hover:text-white transition-colors">Features</a></li>
              <li><a href="#api" className="text-sm hover:text-white transition-colors">API</a></li>
              <li><a href="#how-it-works" className="text-sm hover:text-white transition-colors">How it Works</a></li>
              <li><Link to="/register" className="text-sm hover:text-white transition-colors">Get Started</Link></li>
            </ul>
          </div>

          {/* Developers */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Developers</h4>
            <ul className="space-y-2.5">
              <li><a href="#api" className="text-sm hover:text-white transition-colors">API Documentation</a></li>
              <li><a href="#api" className="text-sm hover:text-white transition-colors">Code Examples</a></li>
              <li><Link to="/dashboard/api-keys" className="text-sm hover:text-white transition-colors">API Keys</Link></li>
              <li><a href="#" className="text-sm hover:text-white transition-colors">Status Page</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Company</h4>
            <ul className="space-y-2.5">
              <li><a href="#" className="text-sm hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="text-sm hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-sm hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-sm hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-800 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-primary-500">
            &copy; {currentYear} ReceiptIQ. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-primary-500 hover:text-primary-300 transition-colors">
              Privacy
            </a>
            <a href="#" className="text-xs text-primary-500 hover:text-primary-300 transition-colors">
              Terms
            </a>
            <a href="#" className="text-xs text-primary-500 hover:text-primary-300 transition-colors">
              Security
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
