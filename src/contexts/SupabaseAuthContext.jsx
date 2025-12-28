
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passwordRecoveryMode, setPasswordRecoveryMode] = useState(false);
  const mounted = useRef(true);

  // Helper to fetch profile data with timeout
  const fetchProfile = async (userId) => {
    try {
      // Create a promise that rejects after 5 seconds
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
      );

      // Create the Supabase fetch promise
      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Race them
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (error) {
        // If error is PGRST116 (0 rows), it's fine, we'll create one later
        if (error.code !== 'PGRST116') {
             console.warn("Profile fetch warning:", error.message);
        }
        return null;
      }
      return data;
    } catch (err) {
      // Catch timeout or other errors gracefully
      console.warn('Profile fetch timed out or failed, using fallback data.');
      return null;
    }
  };

  const handleSession = useCallback(async (currentSession) => {
    if (!mounted.current) return;
    
    try {
      setSession(currentSession);
      
      if (currentSession?.user) {
        // 1. Optimistic Update: Set user immediately with metadata/defaults
        // This ensures the UI unblocks immediately (Login -> Dashboard)
        const metadata = currentSession.user.user_metadata || {};
        const defaultRole = metadata.role || 'Staff';
        const defaultPermissions = metadata.permissions || { home: ['view'] };
        const defaultName = metadata.name || currentSession.user.email?.split('@')[0] || 'User';

        const optimisticUser = {
            ...currentSession.user,
            name: defaultName,
            role: defaultRole,
            permissions: defaultPermissions,
            authId: currentSession.user.id,
            authEmail: currentSession.user.email
        };

        if (mounted.current) {
            setUser(optimisticUser);
            // We can stop loading here for the initial auth check
            setLoading(false); 
        }

        // 2. Background Update: Fetch authoritative profile data
        // This runs asynchronously and updates the user state when ready
        fetchProfile(currentSession.user.id).then(async (profile) => {
            if (!mounted.current) return;

            let finalProfile = profile;

            // Self-healing: Create profile if missing
            if (!finalProfile) {
                try {
                    const { data: newProfile, error: createError } = await supabase
                        .from('profiles')
                        .insert([{
                            id: currentSession.user.id,
                            email: currentSession.user.email,
                            name: defaultName,
                            role: defaultRole,
                            permissions: defaultPermissions,
                            updated_at: new Date().toISOString(),
                            created_at: new Date().toISOString()
                        }])
                        .select()
                        .single();
                    
                    if (!createError && newProfile) {
                        finalProfile = newProfile;
                    }
                } catch (createErr) {
                    console.error("Profile creation failed", createErr);
                }
            }

            // Update user state with authoritative data if different or just to be sure
            if (finalProfile && mounted.current) {
                setUser(prev => {
                    // Only update if we have a previous user state (still logged in)
                    if (!prev) return null; 
                    return {
                        ...prev,
                        name: finalProfile.name,
                        role: finalProfile.role,
                        permissions: finalProfile.permissions,
                    };
                });
            }
        });

      } else if (mounted.current) {
        setUser(null);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error handling session:", error);
      if (mounted.current) {
          setUser(null);
          setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    let authSubscription = null;

    const initAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (mounted.current) {
             await handleSession(initialSession);
        }

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            if (event === 'PASSWORD_RECOVERY') {
              if (mounted.current) setPasswordRecoveryMode(true);
            }
            if (event === 'SIGNED_OUT') {
                if (mounted.current) {
                    setUser(null);
                    setSession(null);
                    setLoading(false);
                }
            } else {
                await handleSession(newSession);
            }
          }
        );
        authSubscription = subscription;

      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted.current) {
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      mounted.current = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [handleSession]);

  const signUp = useCallback(async (email, password, profileData = {}) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: profileData.name,
            role: profileData.role,
            permissions: profileData.permissions
          }
        }
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }, []);

  const signIn = useCallback(async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Manually trigger handleSession to ensure immediate state update
      if (data?.session) {
        await handleSession(data.session);
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }, [handleSession]);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      if (mounted.current) {
        setUser(null);
        setSession(null);
        setPasswordRecoveryMode(false);
      }
      return { error: null };
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sign out Failed",
        description: error.message || "Something went wrong",
      });
      return { error };
    }
  }, [toast]);

  const resetPassword = useCallback(async (email) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }, []);

  const updatePassword = useCallback(async (newPassword) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }, []);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    passwordRecoveryMode,
    setPasswordRecoveryMode,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    isAuthenticated: !!user
  }), [user, session, loading, passwordRecoveryMode, signUp, signIn, signOut, resetPassword, updatePassword]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
