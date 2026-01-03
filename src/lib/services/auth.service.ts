import { supabase } from '@/integrations/supabase/client';
import type { AppRole } from '@/lib/types/database.types';

export interface AuthUser {
  id: string;
  email: string | null;
  roles: AppRole[];
}

export class AuthService {
  /**
   * Sign up with email and password
   */
  static async signUp(email: string, password: string, name?: string): Promise<{ user: AuthUser | null; error: string | null }> {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name,
        },
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        return { user: null, error: 'Cet email est déjà utilisé' };
      }
      return { user: null, error: error.message };
    }

    if (data.user) {
      // Create profile
      await supabase.from('profiles').insert({
        user_id: data.user.id,
        email: data.user.email,
        name,
      });

      return {
        user: {
          id: data.user.id,
          email: data.user.email,
          roles: ['user'],
        },
        error: null,
      };
    }

    return { user: null, error: null };
  }

  /**
   * Sign in with email and password
   */
  static async signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return { user: null, error: 'Email ou mot de passe incorrect' };
      }
      return { user: null, error: error.message };
    }

    if (data.user) {
      const roles = await AuthService.getUserRoles(data.user.id);
      return {
        user: {
          id: data.user.id,
          email: data.user.email,
          roles,
        },
        error: null,
      };
    }

    return { user: null, error: null };
  }

  /**
   * Sign out
   */
  static async signOut(): Promise<void> {
    await supabase.auth.signOut();
  }

  /**
   * Get current user
   */
  static async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    const roles = await AuthService.getUserRoles(user.id);
    return {
      id: user.id,
      email: user.email ?? null,
      roles,
    };
  }

  /**
   * Get user roles
   */
  static async getUserRoles(userId: string): Promise<AppRole[]> {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (error || !data) return ['user'];
    
    return data.map((r) => r.role as AppRole);
  }

  /**
   * Check if user has a specific role
   */
  static async hasRole(role: AppRole): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: role,
    });

    if (error) return false;
    return data as boolean;
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  }
}
