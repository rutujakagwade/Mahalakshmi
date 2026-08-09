import React from 'react';
import { PinLoginScreen } from '../screens/Login/PinLoginScreen';

export const AuthNavigator: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  return <PinLoginScreen onSuccess={onSuccess} />;
};

export default AuthNavigator;
