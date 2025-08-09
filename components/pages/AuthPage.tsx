import React, { useState } from 'react';
import { MultiAuthForm } from '../MultiAuthForm';

export const AuthPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
  };

  return <MultiAuthForm onToggleSignUpMode={toggleMode} isSignUp={isSignUp} />;
};
