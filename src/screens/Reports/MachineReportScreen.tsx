import React from 'react';
import { MonthlyReportScreen } from './MonthlyReportScreen';

export const MachineReportScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return <MonthlyReportScreen onBack={onBack} />;
};

export default MachineReportScreen;
