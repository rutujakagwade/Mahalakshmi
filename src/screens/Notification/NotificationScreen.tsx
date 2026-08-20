import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Alert,
} from 'react-native';
import { AppHeader } from '../../components/AppHeader';
import { NotificationService } from '../../utils/api';
import { colors, radii, shadows } from '../../theme';
import {
  Bell,
  CheckCheck,
  Send,
  Calendar,
  AlertCircle,
  Inbox,
} from 'lucide-react-native';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  data?: any;
  isRead: boolean;
  createdAt?: string;
}

interface NotificationScreenProps {
  onBack: () => void;
}

export const NotificationScreen: React.FC<NotificationScreenProps> = ({ onBack }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [sendingTest, setSendingTest] = useState<boolean>(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await NotificationService.getAll();
      if (res?.notifications) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err: any) {
      console.warn('Failed to fetch notifications:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    try {
      await NotificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err: any) {
      Alert.alert('त्रुटी', 'नोटिफिकेशन वाचलेले मार्क करण्यात अडचण आली.');
    }
  };

  const handleSendTestNotification = async () => {
    try {
      setSendingTest(true);
      const res = await NotificationService.sendTestNotification();
      if (res?.success) {
        Alert.alert('यशस्वी', 'टेस्ट नोटिफिकेशन तुमच्या डिव्हाइसवर पाठवले आहे!');
        fetchNotifications();
      }
    } catch (err: any) {
      Alert.alert('त्रुटी', err?.message || 'टेस्ट नोटिफिकेशन पाठवण्यात अडचण आली.');
    } finally {
      setSendingTest(false);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('mr-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <View style={styles.screen}>
      <AppHeader title="सूचना व संदेश (Notifications)" showBack={true} onBackPress={onBack} />

      {/* Top Action Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.markReadBtn}
          onPress={handleMarkAllRead}
          activeOpacity={0.75}
        >
          <CheckCheck size={16} color={colors.primary} />
          <Text style={styles.markReadBtnText}>सर्व वाचले चिन्हांकित करा</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.testBtn}
          onPress={handleSendTestNotification}
          disabled={sendingTest}
          activeOpacity={0.75}
        >
          {sendingTest ? (
            <ActivityIndicator size="small" color="#9A3412" />
          ) : (
            <Send size={14} color="#9A3412" />
          )}
          <Text style={styles.testBtnText}>टेस्ट पाठवा</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>सूचना लोड होत आहेत...</Text>
          </View>
        ) : notifications.length > 0 ? (
          <View style={styles.listContainer}>
            {notifications.map((n) => (
              <View
                key={n.id}
                style={[styles.notificationCard, !n.isRead && styles.unreadCard]}
              >
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.iconCircle, !n.isRead && styles.unreadIconCircle]}>
                    <Bell size={18} color={!n.isRead ? colors.primary : colors.textMuted} />
                  </View>

                  <View style={styles.cardTextContent}>
                    <View style={styles.titleRow}>
                      <Text style={[styles.cardTitle, !n.isRead && styles.unreadTitle]}>
                        {n.title}
                      </Text>
                      {!n.isRead ? <View style={styles.unreadDot} /> : null}
                    </View>

                    <Text style={styles.cardBody}>{n.body}</Text>

                    {n.createdAt ? (
                      <View style={styles.dateRow}>
                        <Calendar size={11} color={colors.textMuted} />
                        <Text style={styles.dateText}>{formatDate(n.createdAt)}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Inbox size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>कोणतीही सूचना उपलब्ध नाही</Text>
            <Text style={styles.emptySubtitle}>नवीन सूचना प्राप्त झाल्यावर त्या येथे दिसतील.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  markReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radii.md,
    backgroundColor: colors.primarySurface,
  },
  markReadBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radii.md,
    backgroundColor: '#FFEDD5',
  },
  testBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9A3412',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: colors.textTertiary,
    fontSize: 13,
  },
  listContainer: {
    gap: 10,
  },
  notificationCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.xs,
  },
  unreadCard: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadIconCircle: {
    backgroundColor: '#E0F2FE',
  },
  cardTextContent: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '700',
    color: '#0369A1',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0284C7',
    marginLeft: 6,
  },
  cardBody: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  dateText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textTertiary,
  },
});

export default NotificationScreen;
