import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader } from 'lucide-react';

export default function AuthLayout({ 
  isLogin = true, 
  onSubmit, 
  loading = false,
  error = null 
}) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    storeName: '',
    showPassword: false,
  });
  
  const [role, setRole] = useState('customer');
  const [lockUntil, setLockUntil] = useState(null);
  const [validationState, setValidationState] = useState({});

  // Validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const symbolRegex = /[!@#$%^&*(),.?":{}|<>]/;

  // Email validation
  const isEmailValid = emailRegex.test(formData.email);
  
  // Password validation
  const passwordMetrics = {
    hasLength: formData.password.length >= 8,
    hasUpper: /[A-Z]/.test(formData.password),
    hasNumber: /\d/.test(formData.password),
    hasSymbol: symbolRegex.test(formData.password),
  };
  
  const passwordScore = Object.values(passwordMetrics).filter(Boolean).length;
  const passwordStrength = useMemo(() => {
    if (!formData.password) return null;
    if (passwordScore <= 1) return 'weak';
    if (passwordScore === 2) return 'fair';
    if (passwordScore === 3) return 'good';
    return 'strong';
  }, [formData.password, passwordScore]);

  // Rate limiting
  const isLocked = lockUntil && Date.now() < lockUntil;
  const lockSeconds = isLocked ? Math.ceil((lockUntil - Date.now()) / 1000) : 0;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isLocked) return;

    try {
      await onSubmit({
        ...formData,
        role: !isLogin ? role : undefined,
      });
    } catch (err) {
      // Handle rate limiting
      if (err.message?.includes('Too many')) {
        setLockUntil(Date.now() + 30000);
      }
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  };

  const leftVariants = {
    hidden: { x: -50, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.6 } }
  };

  const rightVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, type: 'spring' } }
  };

  // Password strength color
  const strengthColors = {
    weak: 'text-red-500',
    fair: 'text-yellow-500',
    good: 'text-blue-500',
    strong: 'text-green-500',
  };

  const strengthBgColors = {
    weak: 'bg-red-100',
    fair: 'bg-yellow-100',
    good: 'bg-blue-100',
    strong: 'bg-green-100',
  };

  return (
    <div className="min-h-screen bg-slate-50 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 h-screen">
        {/* LEFT SIDE - Branding (Hidden on mobile) */}
        <motion.div 
          className="hidden lg:flex flex-col justify-between p-12 bg-gradient-auth relative overflow-hidden"
          initial="hidden"
          animate="visible"
          variants={leftVariants}
        >
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div 
              className="absolute -top-40 -right-40 w-80 h-80 bg-white opacity-5 rounded-full blur-3xl"
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.div 
              className="absolute top-1/3 -left-40 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl"
              animate={{ y: [0, 20, 0] }}
              transition={{ duration: 5, repeat: Infinity, delay: 1 }}
            />
          </div>

          <div className="relative z-10">
            <motion.div variants={itemVariants} className="mb-12">
              <h1 className="text-4xl font-bold text-white mb-4">MultiVasta</h1>
              <p className="text-blue-100 text-lg leading-relaxed">
                {isLogin 
                  ? "Welcome back to the modern multivendor marketplace platform. Secure, seamless, and built for 2026."
                  : "Join thousands of vendors and customers on the fastest-growing marketplace. Professional, transparent, global."}
              </p>
            </motion.div>

            {/* Features */}
            <motion.div variants={containerVariants} className="space-y-4">
              {[
                { icon: '✓', title: 'Instant Access', desc: 'Real-time validation and smart recovery' },
                { icon: '✓', title: 'Premium Security', desc: 'Industry-standard encryption & protection' },
                { icon: '✓', title: 'Global Commerce', desc: 'Reach customers worldwide, instantly' },
              ].map((feature, i) => (
                <motion.div 
                  key={i}
                  variants={itemVariants}
                  className="flex gap-3 items-start"
                >
                  <span className="text-xl text-blue-200 flex-shrink-0">{feature.icon}</span>
                  <div>
                    <p className="text-white font-semibold text-sm">{feature.title}</p>
                    <p className="text-blue-100 text-xs">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Testimonial */}
          <motion.div 
            variants={itemVariants}
            className="relative z-10 pt-8 border-t border-white border-opacity-20"
          >
            <p className="text-blue-100 text-sm italic mb-3">
              "MultiVasta made it incredibly easy to scale our vendor operations. Professional, intuitive, and lightning fast."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-300 opacity-70"></div>
              <div>
                <p className="text-white font-semibold text-sm">Sarah Chen</p>
                <p className="text-blue-100 text-xs">Marketplace Vendor</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* RIGHT SIDE - Form Card */}
        <motion.div 
          className="flex items-center justify-center p-6 lg:p-12"
          initial="hidden"
          animate="visible"
          variants={rightVariants}
        >
          <motion.div 
            className="w-full max-w-md"
            variants={containerVariants}
          >
            {/* Glassmorphism Card */}
            <motion.div 
              className="relative backdrop-blur-md bg-white bg-opacity-95 rounded-2xl p-8 shadow-glass border border-white border-opacity-30"
              variants={itemVariants}
            >
              {/* Header */}
              <div className="mb-8">
                <motion.p variants={itemVariants} className="text-xs font-semibold text-primary-600 uppercase tracking-widest">
                  {isLogin ? 'Sign In' : 'Create Account'}
                </motion.p>
                <motion.h2 variants={itemVariants} className="text-3xl font-bold text-slate-900 mt-2 mb-2">
                  {isLogin ? 'Welcome back' : 'Get started'}
                </motion.h2>
                <motion.p variants={itemVariants} className="text-slate-600 text-sm">
                  {isLogin 
                    ? 'Access your saved cart, orders, and marketplace dashboard.' 
                    : 'Choose your account type and join our global marketplace today.'}
                </motion.p>
              </div>

              {/* Error/Lock Message */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
                >
                  {error}
                </motion.div>
              )}

              {isLocked && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm"
                >
                  Too many attempts. Try again in {lockSeconds}s
                </motion.div>
              )}

              {/* Role Selection (Signup only) */}
              {!isLogin && (
                <motion.div variants={itemVariants} className="mb-6">
                  <label className="block text-sm font-semibold text-slate-900 mb-3">Account type</label>
                  <div className="flex gap-3">
                    {['customer', 'vendor'].map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                          role === r
                            ? 'bg-primary-600 text-white shadow-md'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name Field (Signup only) */}
                {!isLogin && (
                  <motion.div variants={itemVariants} className="group">
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Full name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Sarah Chen"
                      autoComplete="name"
                      required={!isLogin}
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                    />
                  </motion.div>
                )}

                {/* Email Field */}
                <motion.div variants={itemVariants} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-slate-900">Email address</label>
                    {formData.email && (
                      <span className={`text-xs font-medium ${isEmailValid ? 'text-green-600' : 'text-red-600'}`}>
                        {isEmailValid ? '✓ Valid' : '✗ Invalid'}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-primary-600 transition-colors" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="name@company.com"
                      autoComplete="email"
                      required
                      className={`w-full pl-11 pr-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent ${
                        formData.email && (isEmailValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50')
                      } ${!formData.email ? 'border-slate-200' : ''}`}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5">
                    {formData.email ? (isEmailValid ? 'Valid format' : 'Enter a valid email') : 'We use this to sign you in'}
                  </p>
                </motion.div>

                {/* Password Field */}
                <motion.div variants={itemVariants} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-slate-900">Password</label>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      {formData.showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-primary-600 transition-colors" />
                    <input
                      type={formData.showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder={isLogin ? '••••••••' : 'At least 8 characters'}
                      autoComplete={isLogin ? 'current-password' : 'new-password'}
                      required
                      className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                    />
                  </div>

                  {/* Password Strength Meter (Signup only) */}
                  {!isLogin && formData.password && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 space-y-2"
                    >
                      <div className="flex gap-1">
                        {['hasLength', 'hasUpper', 'hasNumber', 'hasSymbol'].map((metric, i) => (
                          <div
                            key={i}
                            className={`flex-1 h-1 rounded-full transition-colors ${
                              passwordMetrics[metric] ? 'bg-primary-600' : 'bg-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs font-medium ${strengthColors[passwordStrength] || 'text-slate-500'}`}>
                        Strength: {passwordStrength ? passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1) : 'N/A'}
                      </p>
                      <ul className="text-xs text-slate-600 space-y-1">
                        <li className={passwordMetrics.hasLength ? 'text-green-600' : ''}>✓ At least 8 characters</li>
                        <li className={passwordMetrics.hasUpper ? 'text-green-600' : ''}>✓ Uppercase letter</li>
                        <li className={passwordMetrics.hasNumber ? 'text-green-600' : ''}>✓ Number</li>
                        <li className={passwordMetrics.hasSymbol ? 'text-green-600' : ''}>✓ Symbol (!@#$...)</li>
                      </ul>
                    </motion.div>
                  )}
                </motion.div>

                {/* Store Name (Vendor Signup only) */}
                {!isLogin && role === 'vendor' && (
                  <motion.div 
                    variants={itemVariants}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="group"
                  >
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Store name</label>
                    <input
                      type="text"
                      name="storeName"
                      value={formData.storeName}
                      onChange={handleInputChange}
                      placeholder="Your Store Name"
                      required={role === 'vendor'}
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                    />
                  </motion.div>
                )}

                {/* Submit Button */}
                <motion.button
                  variants={itemVariants}
                  type="submit"
                  disabled={isLocked || loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 px-4 rounded-lg bg-primary-600 text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-700 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    isLogin ? 'Sign In' : 'Create Account'
                  )}
                </motion.button>

                {/* Link to other page */}
                <motion.p variants={itemVariants} className="text-center text-sm text-slate-600">
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                  <a 
                    href={isLogin ? '/signup' : '/login'} 
                    className="text-primary-600 hover:text-primary-700 font-semibold"
                  >
                    {isLogin ? 'Sign up' : 'Sign in'}
                  </a>
                </motion.p>
              </form>

              {/* Demo credentials */}
              {isLogin && (
                <motion.div 
                  variants={itemVariants}
                  className="mt-6 pt-6 border-t border-slate-200 text-xs text-slate-500 space-y-1"
                >
                  <p className="font-semibold text-slate-700 mb-2">Demo credentials:</p>
                  <p>📧 john.doe@email.com / 🔑 customer123</p>
                  <p>👔 tech.store@email.com / 🔑 vendor123</p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
