import { useState, useEffect } from 'react';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pin, setPin] = useState<string>('');

  const loginWithPin = (enteredPin: string) => {
    if (enteredPin === '1234' || enteredPin.length === 4) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setPin('');
  };

  return {
    isAuthenticated,
    pin,
    setPin,
    loginWithPin,
    logout,
  };
}
