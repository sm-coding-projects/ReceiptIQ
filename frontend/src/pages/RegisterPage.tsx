import { useState, FormEvent, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Mail, Lock, User, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import type { RegisterData } from '@/types';

interface RegisterPageProps {
  onRegister: (data: RegisterData) => Promise<any>;
  loading: boolean;
}

interface PasswordRule {
  label: string;
  test: (password: string) => boolean;
}

const passwordRules: PasswordRule[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One number', test: (p) => /\d/.test(p) },
];

export default function RegisterPage({ onRegister, loading }: RegisterPageProps) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const passwordStrength = useMemo(() => {
    const passed = passwordRules.filter((r) => r.test(form.password)).length;
    return passed;
  }, [form.password]);

  const strengthLabel = useMemo(() => {
    if (form.password.length === 0) return '';
    if (passwordStrength <= 1) return 'Weak';
    if (passwordStrength <= 2) return 'Fair';
    if (passwordStrength <= 3) return 'Good';
    return 'Strong';
  }, [passwordStrength, form.password]);

  const strengthColor = useMemo(() => {
    if (passwordStrength <= 1) return 'bg-red-500';
    if (passwordStrength <= 2) return 'bg-amber-500';
    if (passwordStrength <= 3) return 'bg-blue-500';
    return 'bg-emerald-500';
  }, [passwordStrength]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    } else if (form.full_name.trim().length < 2) {
      newErrors.full_name = 'Name must be at least 2 characters';
    }

    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (passwordStrength < 4) {
      newErrors.password = 'Password does not meet all requirements';
    }

    if (!form.confirm_password) {
      newErrors.confirm_password = 'Please confirm your password';
    } else if (form.password !== form.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({ full_name: true, email: true, password: true, confirm_password: true });
    if (!validate()) return;

    try {
      await onRegister(form);
      toast.success('Account created successfully!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      toast.error(message);
    }
  };

  const updateField = (field: string, value: string) => {
    setForm({ ...form, [field]: value });
    if (errors[field]) setErrors({ ...errors, [field]: '' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4 py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-primary-900 rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 10L12 7L18 10V16L12 19L6 16V10Z" stroke="#3b82f6" strokeWidth="1.5" fill="none"/>
                <circle cx="12" cy="13" r="2" fill="#3b82f6"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-primary-900 tracking-tight">
              Receipt<span className="text-accent-600">IQ</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-primary-900">Create your account</h1>
          <p className="text-sm text-primary-500 mt-1">
            Start extracting receipt data in minutes
          </p>
        </div>

        {/* Form Card */}
        <div className="card-premium p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Full Name */}
            <div>
              <label htmlFor="full_name" className="label-field">
                Full name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" />
                <input
                  id="full_name"
                  type="text"
                  value={form.full_name}
                  onChange={(e) => updateField('full_name', e.target.value)}
                  onBlur={() => setTouched({ ...touched, full_name: true })}
                  className="input-field !pl-10"
                  placeholder="John Doe"
                  autoComplete="name"
                  autoFocus
                />
              </div>
              {errors.full_name && touched.full_name && (
                <p className="mt-1.5 text-xs text-red-500">{errors.full_name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="label-field">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" />
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  onBlur={() => setTouched({ ...touched, email: true })}
                  className="input-field !pl-10"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              {errors.email && touched.email && (
                <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="label-field">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  onBlur={() => setTouched({ ...touched, password: true })}
                  className="input-field !pl-10 !pr-10"
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-primary-400 hover:text-primary-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength indicator */}
              {form.password.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={clsx(
                            'h-1.5 flex-1 rounded-full transition-all duration-300',
                            i <= passwordStrength ? strengthColor : 'bg-primary-100',
                          )}
                        />
                      ))}
                    </div>
                    <span
                      className={clsx('text-xs font-medium', {
                        'text-red-500': passwordStrength <= 1,
                        'text-amber-500': passwordStrength === 2,
                        'text-blue-500': passwordStrength === 3,
                        'text-emerald-500': passwordStrength === 4,
                      })}
                    >
                      {strengthLabel}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {passwordRules.map((rule) => {
                      const passed = rule.test(form.password);
                      return (
                        <div key={rule.label} className="flex items-center gap-2">
                          {passed ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <X className="w-3 h-3 text-primary-300" />
                          )}
                          <span
                            className={clsx(
                              'text-xs',
                              passed ? 'text-emerald-600' : 'text-primary-400',
                            )}
                          >
                            {rule.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {errors.password && touched.password && (
                <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirm_password" className="label-field">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" />
                <input
                  id="confirm_password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={form.confirm_password}
                  onChange={(e) => updateField('confirm_password', e.target.value)}
                  onBlur={() => setTouched({ ...touched, confirm_password: true })}
                  className="input-field !pl-10 !pr-10"
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-primary-400 hover:text-primary-600 transition-colors"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.confirm_password && form.password !== form.confirm_password && touched.confirm_password && (
                <p className="mt-1.5 text-xs text-red-500">Passwords do not match</p>
              )}
              {form.confirm_password && form.password === form.confirm_password && form.confirm_password.length > 0 && (
                <p className="mt-1.5 text-xs text-emerald-500 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Passwords match
                </p>
              )}
              {errors.confirm_password && touched.confirm_password && !form.confirm_password && (
                <p className="mt-1.5 text-xs text-red-500">{errors.confirm_password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full !py-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p className="text-center text-sm text-primary-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-accent-600 font-medium hover:text-accent-700 transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
