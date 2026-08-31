import tw from 'twrnc';
import { View, BackHandler } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { ActiveScreen } from '../types/navigation';
import { SplashScreen } from '../screens/Splash/SplashScreen';
import { PinLoginScreen } from '../screens/Login/PinLoginScreen';
import { DashboardScreen } from '../screens/Dashboard/DashboardScreen';
import { KamaiEntryScreen } from '../screens/DailyEntry/KamaiEntryScreen';
import { KharchEntryScreen } from '../screens/DailyEntry/KharchEntryScreen';
import { NavinKamForm } from '../screens/MachineEntry/NavinKamForm';
import { ChaluKamListScreen } from '../screens/Work/ChaluKamListScreen';
import { MajurYadiScreen } from '../screens/Labour/MajurYadiScreen';
import { CustomerListScreen } from '../screens/Customer/CustomerListScreen';
import { DateReportScreen } from '../screens/Reports/DateReportScreen';
import { KharchReportScreen } from '../screens/Reports/KharchReportScreen';
import { CalendarViewScreen } from '../screens/Calendar/CalendarViewScreen';
import { MonthlyReportScreen } from '../screens/Reports/MonthlyReportScreen';
import { UdharReportScreen } from '../screens/Reports/UdharReportScreen';
import { NotificationScreen } from '../screens/Notification/NotificationScreen';
import { SettingsScreen } from '../screens/Settings/SettingsScreen';
import { LoanListScreen } from '../screens/Loan/LoanListScreen';
import { AddLoanScreen } from '../screens/Loan/AddLoanScreen';
import { LoanDetailScreen } from '../screens/Loan/LoanDetailScreen';
import { EditLoanScreen } from '../screens/Loan/EditLoanScreen';
import { AddCustomerScreen } from '../screens/Customer/AddCustomerScreen';
import { EditCustomerScreen } from '../screens/Customer/EditCustomerScreen';

import { DrawerNavigator } from './DrawerNavigator';
import { initAuthToken } from '../utils/api';
import { setupFirebaseMessaging } from '../utils/firebase';

interface RootNavigatorProps {
  initialScreen?: ActiveScreen;
}

export const RootNavigator: React.FC<RootNavigatorProps> = ({ initialScreen = 'Splash' }) => {
  const [currentScreen, setCurrentScreen] = useState<ActiveScreen>(initialScreen);
  const [selectedLoanId, setSelectedLoanId] = useState<string>('');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const navigateTo = useCallback((screen: ActiveScreen) => {
    setCurrentScreen(screen);
  }, []);

  const handleNavigateToLoanDetail = useCallback((loanId: string) => {
    setSelectedLoanId(loanId);
    setCurrentScreen('LoanDetail');
  }, []);

  const handleNavigateToEditLoan = useCallback((loanId: string) => {
    setSelectedLoanId(loanId);
    setCurrentScreen('EditLoan');
  }, []);

  useEffect(() => {
    if (currentScreen !== 'Splash' && currentScreen !== 'PinLogin') {
      setupFirebaseMessaging();
    }
  }, [currentScreen]);

  const handleLoginSuccess = useCallback(() => {
    setCurrentScreen('Dashboard');
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentScreen('PinLogin');
  }, []);

  // When splash finishes, check for saved auth token to auto-login
  const handleSplashDone = useCallback(async () => {
    try {
      const savedToken = await initAuthToken();
      if (savedToken) {
        setCurrentScreen('Dashboard');
        setupFirebaseMessaging();
      } else {
        setCurrentScreen('PinLogin');
      }
    } catch {
      setCurrentScreen('PinLogin');
    }
  }, []);

  // Handle hardware back press on Android
  useEffect(() => {
    const handleBackPress = () => {
      if (isDrawerOpen) {
        setIsDrawerOpen(false);
        return true;
      }
      if (
        currentScreen !== 'Dashboard' &&
        currentScreen !== 'PinLogin' &&
        currentScreen !== 'Splash'
      ) {
        if (currentScreen === 'AddLoan' || currentScreen === 'LoanDetail') {
          navigateTo('MyLoan');
          return true;
        }
        if (currentScreen === 'EditLoan') {
          handleNavigateToLoanDetail(selectedLoanId);
          return true;
        }
        navigateTo('Dashboard');
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress
    );

    return () => backHandler.remove();
  }, [currentScreen, isDrawerOpen, navigateTo, selectedLoanId, handleNavigateToLoanDetail]);

  return (
    <View style={tw`relative flex-1 bg-stone-900 font-sans antialiased`}>
      {/* Active Screen Rendering */}
      {currentScreen === 'Splash' && (
        <SplashScreen onNavigateNext={handleSplashDone} />
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

      {currentScreen === 'KamaiEntry' && (
        <KamaiEntryScreen onBack={() => navigateTo('Dashboard')} />
      )}

      {currentScreen === 'KharchEntry' && (
        <KharchEntryScreen onBack={() => navigateTo('Dashboard')} />
      )}

      {(currentScreen === 'MajurYadi' || currentScreen === 'LabourList' || currentScreen === 'MachineEntry') && (
        <MajurYadiScreen onBack={() => navigateTo('Dashboard')} />
      )}

      {currentScreen === 'NavinKam' && (
        <NavinKamForm
          onBack={() => navigateTo('Dashboard')}
          onNavigateToChaluKam={() => navigateTo('ChaluKamList')}
        />
      )}

      {currentScreen === 'ChaluKamList' && (
        <ChaluKamListScreen
          onBack={() => navigateTo('Dashboard')}
          onNavigateToNavinKam={() => navigateTo('NavinKam')}
        />
      )}

      {currentScreen === 'CustomerList' && (
        <CustomerListScreen onBack={() => navigateTo('Dashboard')} />
      )}

      {currentScreen === 'AddCustomer' && (
        <AddCustomerScreen
          onBack={() => navigateTo('CustomerList')}
          onSuccess={() => navigateTo('CustomerList')}
        />
      )}

      {currentScreen === 'EditCustomer' && (
        <EditCustomerScreen
          customerId={selectedLoanId}
          onBack={() => navigateTo('CustomerList')}
          onSuccess={() => navigateTo('CustomerList')}
        />
      )}

      {currentScreen === 'MyLoan' && (
        <LoanListScreen
          onBack={() => navigateTo('Dashboard')}
          onNavigateToAddLoan={() => navigateTo('AddLoan')}
          onNavigateToLoanDetail={handleNavigateToLoanDetail}
        />
      )}

      {currentScreen === 'AddLoan' && (
        <AddLoanScreen
          onBack={() => navigateTo('MyLoan')}
          onSuccess={() => navigateTo('MyLoan')}
        />
      )}

      {currentScreen === 'LoanDetail' && (
        <LoanDetailScreen
          loanId={selectedLoanId}
          onBack={() => navigateTo('MyLoan')}
          onNavigateToEdit={handleNavigateToEditLoan}
        />
      )}

      {currentScreen === 'EditLoan' && (
        <EditLoanScreen
          loanId={selectedLoanId}
          onBack={() => handleNavigateToLoanDetail(selectedLoanId)}
          onSuccess={() => handleNavigateToLoanDetail(selectedLoanId)}
        />
      )}

      {currentScreen === 'DateReport' && (
        <DateReportScreen onBack={() => navigateTo('Dashboard')} />
      )}

      {currentScreen === 'KharchReport' && (
        <KharchReportScreen
          onBack={() => navigateTo('Dashboard')}
          onNavigateToAddKharch={() => navigateTo('KharchEntry')}
        />
      )}

      {currentScreen === 'CalendarView' && (
        <CalendarViewScreen
          onBack={() => navigateTo('Dashboard')}
          onNavigateToEntry={() => navigateTo('MachineEntry')}
        />
      )}

      {(currentScreen === 'MonthlyReport' || currentScreen === 'MachineReport') && (
        <MonthlyReportScreen onBack={() => navigateTo('Dashboard')} />
      )}

      {currentScreen === 'UdharReport' && (
        <UdharReportScreen onBack={() => navigateTo('Dashboard')} />
      )}

      {currentScreen === 'NotificationList' && (
        <NotificationScreen onBack={() => navigateTo('Dashboard')} />
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
