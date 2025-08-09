import React, { useState } from 'react';
import { AuthForm } from '../AuthForm';

export const AuthPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
  };

  return <AuthForm onToggleMode={toggleMode} isSignUp={isSignUp} />;
};
