import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import clsx from 'clsx';

interface CodeTab {
  label: string;
  language: string;
  code: string;
}

interface CodeBlockProps {
  tabs: CodeTab[];
  className?: string;
}

export default function CodeBlock({ tabs, className }: CodeBlockProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tabs[activeTab].code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = tabs[activeTab].code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={clsx('rounded-2xl overflow-hidden border border-primary-200 bg-white', className)}>
      {/* Tab bar */}
      <div className="flex items-center justify-between border-b border-primary-100 bg-primary-50/50 px-1">
        <div className="flex items-center gap-0.5 py-1">
          {tabs.map((tab, index) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(index)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                index === activeTab
                  ? 'bg-white text-primary-900 shadow-premium'
                  : 'text-primary-500 hover:text-primary-700 hover:bg-white/50',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleCopy}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 mr-1',
            copied
              ? 'text-emerald-600 bg-emerald-50'
              : 'text-primary-400 hover:text-primary-600 hover:bg-white/50',
          )}
          aria-label="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      <div className="overflow-x-auto">
        <SyntaxHighlighter
          language={tabs[activeTab].language}
          style={oneLight}
          customStyle={{
            margin: 0,
            padding: '1.25rem 1.5rem',
            background: 'transparent',
            fontSize: '13px',
            lineHeight: '1.6',
          }}
          codeTagProps={{
            style: {
              fontFamily: '"SF Mono", "Fira Code", "Fira Mono", Menlo, Consolas, monospace',
            },
          }}
        >
          {tabs[activeTab].code.trim()}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
