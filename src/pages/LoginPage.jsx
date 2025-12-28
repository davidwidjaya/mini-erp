
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, KeyRound, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [name, setName] = useState(''); // For sign up
  const [isLoading, setIsLoading] = useState(false);

  const { t, language, setLanguage } = useLanguage();
  const { toast } = useToast();
  const { signIn, signUp, resetPassword, isAuthenticated } = useAuth();

  // Safety: If already authenticated, stop loading (App.jsx handles redirect, but this cleans up local state)
  useEffect(() => {
    if (isAuthenticated) {
        setIsLoading(false);
    }
  }, [isAuthenticated]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Sign Up Logic
        const { error } = await signUp(email, password, {
          name: name,
          role: 'Staff', 
          permissions: {
            home: ['view'],
            dataEntry: ['view'],
          }
        });

        if (error) throw error;

        toast({
          title: "Account Created",
          description: "Please check your email to confirm your account, or sign in if email confirmation is disabled.",
        });
        setIsSignUp(false);
        setIsLoading(false); // Stop loading for sign up flow
      } else {
        // Sign In Logic
        const { error } = await signIn(email, password);
        if (error) throw error;
        
        toast({
          title: t('loginSuccess'),
          description: t('welcomeBack'),
        });
        // Logic ends here on success - useEffect above or unmounting handles the UI
      }
    } catch (error) {
      console.error(error);
      toast({
        title: isSignUp ? "Sign Up Failed" : t('loginFailed'),
        description: error.message || t('invalidCredentials'),
        variant: 'destructive',
      });
      setIsLoading(false); // Only reset manually on error
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await resetPassword(email);
      if (error) throw error;

      toast({
        title: "Reset Link Sent",
        description: "If an account exists with this email, you will receive a password reset link shortly.",
      });
      setIsForgotPassword(false);
    } catch (error) {
      toast({
        title: "Request Failed",
        description: error.message || "Failed to send reset link",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 opacity-90" />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass-effect rounded-2xl p-8 shadow-2xl bg-white/95 backdrop-blur">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {t('systemTitle')}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {isForgotPassword ? 'Reset Password' : (isSignUp ? 'Create New Account' : t('systemSubtitle'))}
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-full bg-gray-200">
                <Button size="sm" onClick={() => setLanguage('en')} className={`rounded-full ${language === 'en' ? 'bg-primary text-primary-foreground' : 'bg-transparent text-gray-600 hover:bg-gray-300'}`}>EN</Button>
                <Button size="sm" onClick={() => setLanguage('id')} className={`rounded-full ${language === 'id' ? 'bg-primary text-primary-foreground' : 'bg-transparent text-gray-600 hover:bg-gray-300'}`}>ID</Button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {isForgotPassword ? (
              <motion.form
                key="reset-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleResetPasswordSubmit} 
                className="space-y-6"
              >
                 <div className="space-y-2">
                  <Label htmlFor="reset-email">Email Address</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12"
                  />
                  <p className="text-xs text-gray-500">
                    We'll send a link to this email to reset your password.
                  </p>
                </div>

                <Button type="submit" disabled={isLoading} className="w-full h-12 text-lg font-semibold">
                  {isLoading ? "Sending..." : (
                    <>
                      <KeyRound className="mr-2 h-5 w-5" /> Send Reset Link
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <button 
                    type="button"
                    onClick={() => setIsForgotPassword(false)}
                    className="text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center gap-1 mx-auto"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Login
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.form
                key="login-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleLoginSubmit} 
                className="space-y-6"
              >
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="h-12"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password">{t('password')}</Label>
                    {!isSignUp && (
                      <button
                        type="button"
                        onClick={() => setIsForgotPassword(true)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder={t('passwordPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>

                <Button type="submit" disabled={isLoading} className="w-full h-12 text-lg font-semibold">
                  {isLoading ? (
                    "Processing..."
                  ) : isSignUp ? (
                    <>
                      <UserPlus className="mr-2 h-5 w-5" /> Sign Up
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-5 w-5" /> {t('login')}
                    </>
                  )}
                </Button>
                
                <div className="mt-4 text-center">
                  <button 
                    type="button" 
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
