import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { LoginForm } from "@/components/auth/login-form";
import { useLocation } from "wouter";

export default function LoginPage() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();

  const handleLoginSuccess = (user: any) => {
    login(user);
    
    // Redirect based on user role
    if (user.role === 'hr') {
      setLocation('/hr-dashboard');
    } else {
      setLocation('/interview');
    }
  };

  return <LoginForm onSuccess={handleLoginSuccess} />;
}