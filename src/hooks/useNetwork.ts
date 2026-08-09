import { useState } from 'react';

export function useNetwork() {
  const [isOffline] = useState<boolean>(true);
  const statusMessage = 'डेटा : पूर्णपणे ऑफलाइन';

  return {
    isOffline,
    statusMessage,
  };
}
