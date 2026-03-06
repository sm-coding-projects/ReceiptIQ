import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Upload,
  Zap,
  Code2,
  Shield,
  ArrowRight,
  FileText,
  Settings,
  Download,
  CheckCircle,
} from 'lucide-react';
import AnimatedBackground from '@/components/AnimatedBackground';
import CodeBlock from '@/components/CodeBlock';
import Footer from '@/components/Footer';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const apiCodeTabs = [
  {
    label: 'Python',
    language: 'python',
    code: `import requests

API_KEY = "your_api_key_here"

response = requests.post(
    "https://api.receiptiq.com/v1/extract",
    headers={"X-API-Key": API_KEY},
    files={"file": open("receipt.jpg", "rb")}
)

data = response.json()
print(f"Total: {data['total']}")
print(f"Vendor: {data['vendor_name']}")`,
  },
  {
    label: 'cURL',
    language: 'bash',
    code: `curl -X POST https://api.receiptiq.com/v1/extract \\
  -H "X-API-Key: your_api_key_here" \\
  -F "file=@receipt.jpg"`,
  },
  {
    label: 'JavaScript',
    language: 'javascript',
    code: `const form = new FormData();
form.append('file', fileInput.files[0]);

const response = await fetch('https://api.receiptiq.com/v1/extract', {
  method: 'POST',
  headers: { 'X-API-Key': 'your_api_key_here' },
  body: form
});

const data = await response.json();
console.log(\`Total: \${data.total}\`);`,
  },
];

const responseExample = {
  label: 'Response',
  language: 'json',
  code: `{
  "vendor_name": "Whole Foods Market",
  "vendor_address": "123 Main St, San Francisco, CA 94105",
  "transaction_date": "2024-01-15",
  "transaction_time": "14:32",
  "currency": "USD",
  "subtotal": 42.50,
  "tax": 3.61,
  "total": 46.11,
  "payment_method": "Visa ending in 4242",
  "line_items": [
    { "name": "Organic Bananas", "quantity": 1, "unit_price": 2.99, "total_price": 2.99 },
    { "name": "Almond Milk", "quantity": 2, "unit_price": 4.49, "total_price": 8.98 },
    { "name": "Sourdough Bread", "quantity": 1, "unit_price": 5.99, "total_price": 5.99 }
  ],
  "confidence": 0.94,
  "receipt_number": "TXN-20240115-8842"
}`,
};

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* ===================== HERO ===================== */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <AnimatedBackground />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-3xl"
          >
            <motion.div variants={fadeInUp} className="mb-6">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-50 border border-accent-100 text-xs font-medium text-accent-700">
                <Zap className="w-3 h-3" />
                Powered by Tesseract OCR
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold text-primary-900 tracking-tight leading-[1.1] text-balance"
            >
              Extract Receipt Data with{' '}
              <span className="text-accent-600">AI-Powered</span> OCR
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="mt-6 text-lg sm:text-xl text-primary-500 leading-relaxed max-w-2xl"
            >
              Transform paper receipts into structured, machine-readable data in seconds.
              Upload in bulk, get detailed JSON output with line items, totals, and vendor details.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="mt-10 flex flex-wrap items-center gap-4"
            >
              <Link to="/register" className="btn-primary text-base !px-8 !py-4">
                Start Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#api" className="btn-secondary text-base !px-8 !py-4">
                <Code2 className="w-4 h-4" />
                View API
              </a>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="mt-10 flex items-center gap-6 text-sm text-primary-400"
            >
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                No credit card required
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Bulk upload support
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                API access included
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ===================== FEATURES ===================== */}
      <section id="features" className="py-24 bg-surface-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeInUp} className="section-heading">
              Everything you need to digitize receipts
            </motion.h2>
            <motion.p variants={fadeInUp} className="section-subheading mt-4">
              A complete platform for extracting, organizing, and exporting receipt data at scale.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              {
                icon: Upload,
                title: 'Bulk Upload',
                description:
                  'Upload dozens of receipts at once with drag-and-drop. We handle processing in the background while you work.',
                color: 'bg-blue-50 text-blue-600',
              },
              {
                icon: Zap,
                title: 'Smart Extraction',
                description:
                  'Advanced OCR with image preprocessing, skew correction, and intelligent field parsing for maximum accuracy.',
                color: 'bg-amber-50 text-amber-600',
              },
              {
                icon: Code2,
                title: 'Developer API',
                description:
                  'RESTful API with API key authentication. Integrate receipt processing into your own apps in minutes.',
                color: 'bg-violet-50 text-violet-600',
              },
              {
                icon: Shield,
                title: 'Secure & Fast',
                description:
                  'Enterprise-grade security with encrypted storage, secure auth, and fast processing pipelines.',
                color: 'bg-emerald-50 text-emerald-600',
              },
            ].map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                className="card-premium p-6 group"
              >
                <div
                  className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-primary-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-primary-500 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===================== HOW IT WORKS ===================== */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeInUp} className="section-heading">
              How it works
            </motion.h2>
            <motion.p variants={fadeInUp} className="section-subheading mt-4">
              Three simple steps to turn receipts into structured data.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              {
                step: '01',
                icon: FileText,
                title: 'Upload Receipts',
                description:
                  'Drag and drop receipt images or use the API to upload programmatically. Supports JPG, PNG, TIFF, WebP, and BMP.',
              },
              {
                step: '02',
                icon: Settings,
                title: 'Automatic Processing',
                description:
                  'Our OCR pipeline preprocesses images, extracts text, and parses vendor details, amounts, dates, and line items.',
              },
              {
                step: '03',
                icon: Download,
                title: 'Get Structured Data',
                description:
                  'Download clean JSON output with all extracted fields. Review results, fix any issues, and export for your systems.',
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                variants={fadeInUp}
                className="relative"
              >
                {/* Connector line */}
                {index < 2 && (
                  <div className="hidden md:block absolute top-12 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-gradient-to-r from-primary-200 to-primary-100" />
                )}

                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center mb-6">
                    <div className="w-24 h-24 rounded-2xl bg-primary-50 flex items-center justify-center">
                      <item.icon className="w-10 h-10 text-primary-400" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary-900 text-white text-xs font-bold flex items-center justify-center">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-primary-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-primary-500 leading-relaxed max-w-xs mx-auto">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===================== API SECTION ===================== */}
      <section id="api" className="py-24 bg-surface-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              {/* Left: Description */}
              <div>
                <motion.div variants={fadeInUp} className="mb-6">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-50 border border-accent-100 text-xs font-medium text-accent-700">
                    <Code2 className="w-3 h-3" />
                    Developer API
                  </span>
                </motion.div>

                <motion.h2 variants={fadeInUp} className="section-heading mb-4">
                  Build with the ReceiptIQ API
                </motion.h2>

                <motion.p variants={fadeInUp} className="text-lg text-primary-500 leading-relaxed mb-8">
                  Integrate receipt extraction directly into your applications.
                  A single API call processes an image and returns structured JSON
                  with vendor details, line items, totals, and more.
                </motion.p>

                <motion.div variants={fadeInUp} className="space-y-4 mb-8">
                  {[
                    'RESTful API with JSON responses',
                    'API key authentication via X-API-Key header',
                    'Multipart file upload support',
                    'Detailed extraction with confidence scores',
                    'Rate limiting and usage tracking',
                    'SDKs and code examples for major languages',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-sm text-primary-600">{item}</span>
                    </div>
                  ))}
                </motion.div>

                <motion.div variants={fadeInUp} className="flex flex-wrap gap-3">
                  <Link to="/register" className="btn-primary">
                    Get API Key
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link to="/dashboard/api-keys" className="btn-secondary">
                    API Key Management
                  </Link>
                </motion.div>
              </div>

              {/* Right: Code examples */}
              <motion.div variants={fadeInUp} className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-primary-700 mb-3">Send a request</h4>
                  <CodeBlock tabs={apiCodeTabs} />
                </div>

                <div>
                  <h4 className="text-sm font-medium text-primary-700 mb-3">Response</h4>
                  <CodeBlock tabs={[responseExample]} />
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* API Details */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
            className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              {
                title: 'Endpoint',
                value: 'POST /v1/extract',
                description: 'Upload a receipt image and receive structured data.',
              },
              {
                title: 'Authentication',
                value: 'X-API-Key header',
                description: 'Generate API keys from your dashboard. Keys are scoped per user.',
              },
              {
                title: 'Rate Limits',
                value: '100 req/min',
                description: 'Standard rate limits apply. Contact us for higher volumes.',
              },
            ].map((item) => (
              <motion.div key={item.title} variants={fadeInUp} className="card-premium p-6">
                <p className="text-xs font-medium text-primary-400 uppercase tracking-wider mb-1">{item.title}</p>
                <p className="text-lg font-semibold text-primary-900 font-mono">{item.value}</p>
                <p className="text-sm text-primary-500 mt-2">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===================== FINAL CTA ===================== */}
      <section className="py-24 bg-primary-950 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-600 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-400 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight text-balance"
            >
              Ready to automate your receipt processing?
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="mt-6 text-lg text-primary-300 max-w-2xl mx-auto"
            >
              Join thousands of businesses using ReceiptIQ to extract, organize,
              and export receipt data with unmatched accuracy.
            </motion.p>
            <motion.div
              variants={fadeInUp}
              className="mt-10 flex flex-wrap items-center justify-center gap-4"
            >
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary-900 font-medium rounded-xl hover:bg-primary-50 active:bg-primary-100 transition-all duration-200 text-base"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#api"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent text-white font-medium rounded-xl border border-primary-600 hover:bg-primary-800 transition-all duration-200 text-base"
              >
                <Code2 className="w-4 h-4" />
                Explore API
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
