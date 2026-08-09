import tw from 'twrnc';
import { View } from 'react-native';
import React, { useState } from 'react';
import { ActiveScreen } from '../types/navigation';
import { SplashScreen } from '../screens/Splash/SplashScreen';
import { PinLoginScreen } from '../screens/Login/PinLoginScreen';
import { DashboardScreen } from '../screens/Dashboard/DashboardScreen';
import { DailyEntryScreen } from '../screens/DailyEntry/DailyEntryScreen';
import { MachineEntryScreen } from '../screens/MachineEntry/MachineEntryScreen';
import { CustomerListScreen } from '../screens/Customer/CustomerListScreen';
import { DateReportScreen } from '../screens/Reports/DateReportScreen';
import { MonthlyReportScreen } from '../screens/Reports/MonthlyReportScreen';
import { SettingsScreen } from '../screens/Settings/SettingsScreen';
import { DrawerNavigator } from './DrawerNavigator';

interface RootNavigatorProps {
  initialScreen?: ActiveScreen;
}

export const RootNavigator: React.FC<RootNavigatorProps> = ({ initialScreen = 'Splash' }) => {
  const [currentScreen, setCurrentScreen] = useState<ActiveScreen>(initialScreen);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const navigateTo = (screen: ActiveScreen) => {
    setCurrentScreen(screen);
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setCurrentScreen('Dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentScreen('PinLogin');
  };

  // Handle hardware back press on Android
  React.useEffect(() => {
    const handleBackPress = () => {
      // If we are on any subscreen, go back to Dashboard instead of closing the app
      if (
        currentScreen !== 'Dashboard' &&
        currentScreen !== 'PinLogin' &&
        currentScreen !== 'Splash'
      ) {
        navigateTo('Dashboard');
        return true; // prevent default exit
      }
      return false; // let system exit on Splash/Login/Dashboard
    };

    const backHandler = require('react-native').BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress
    );

    return () => backHandler.remove();
  }, [currentScreen]);

  return (
    <View style={tw`relative flex-1 bg-stone-900 font-sans antialiased`}>
      {/* Active Screen Rendering */}
      {currentScreen === 'Splash' && (
        <SplashScreen onNavigateNext={() => setCurrentScreen('PinLogin')} />
      )}

      {currentScreen === 'PinLogin' && (
        <PinLoginScreen onSuccess={handleLoginSuccess} />
      )}

      {currentScreen === 'Dashboard' && (
        <DashboardScreen
          onNavigate={navigateTo}
          onOpenDrawer={() => setIsDrawerOpen(true)}
        />
      )}

      {currentScreen === 'DailyEntry' && (
        <DailyEntryScreen onBack={() => navigateTo('Dashboard')} />
      )}

      {currentScreen === 'MachineEntry' && (
        <MachineEntryScreen onBack={() => navigateTo('Dashboard')} />
      )}

      {currentScreen === 'CustomerList' && (
        <CustomerListScreen onBack={() => navigateTo('Dashboard')} />
      )}

      {currentScreen === 'DateReport' && (
        <DateReportScreen onBack={() => navigateTo('Dashboard')} />
      )}

      {(currentScreen === 'MonthlyReport' || currentScreen === 'MachineReport') && (
        <MonthlyReportScreen onBack={() => navigateTo('Dashboard')} />
      )}

      {currentScreen === 'Settings' && (
        <SettingsScreen
          onBack={() => navigateTo('Dashboard')}
          onLogout={handleLogout}
        />
      )}

      {/* Drawer Overlay Navigator */}
      <DrawerNavigator
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeScreen={currentScreen}
        onNavigate={navigateTo}
        onLogout={handleLogout}
      />
    </View>
  );
};

export default RootNavigator;
