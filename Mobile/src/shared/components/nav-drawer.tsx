import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

// ── Nav items definition (icono, label, ruta por módulo) ───────────────────
interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}

interface NavDrawerProps {
  visible: boolean;
  onClose: () => void;
  userName: string;
  userRole: string;
  navItems: NavItem[];
  onLogout: () => void;
}

const DRAWER_WIDTH = 285;

export function NavDrawer({
  visible,
  onClose,
  userName,
  userRole,
  navItems,
  onLogout,
}: NavDrawerProps) {
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 180,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -DRAWER_WIDTH,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateX, overlayOpacity]);

  if (!visible && !translateX) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Overlay oscuro */}
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      {/* Panel deslizante */}
      <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
        <SafeAreaView style={styles.drawerSafe} edges={['top', 'bottom', 'left']}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/images/logo-rancho-los-alpes.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Sesión actual */}
          <View style={styles.sessionCard}>
            <Text style={styles.sessionLabel}>SESIÓN ACTUAL</Text>
            <View style={styles.sessionRow}>
              <View style={styles.avatarCircle}>
                <Feather name="user" size={18} color="#fff" />
              </View>
              <View style={styles.sessionTextBlock}>
                <Text style={styles.sessionName} numberOfLines={1}>{userName}</Text>
                <Text style={styles.sessionRole} numberOfLines={1}>{userRole}</Text>
              </View>
            </View>
          </View>

          {/* Items de navegación */}
          <ScrollView style={styles.navList} showsVerticalScrollIndicator={false}>
            {navItems.map((item) => (
              <Pressable
                key={item.key}
                style={({ pressed }) => [styles.navItem, pressed && styles.navItemPressed]}
                onPress={() => {
                  onClose();
                  // Pequeño delay para que el drawer cierre antes de navegar
                  setTimeout(item.onPress, 180);
                }}
              >
                <View style={styles.navItemIcon}>{item.icon}</View>
                <Text style={styles.navItemLabel}>{item.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Cerrar sesión */}
          <Pressable
            style={({ pressed }) => [styles.logoutBtn, pressed && styles.navItemPressed]}
            onPress={() => {
              onClose();
              setTimeout(onLogout, 180);
            }}
          >
            <MaterialCommunityIcons name="logout" size={20} color="#C0392B" />
            <Text style={styles.logoutLabel}>Cerrar Sesión</Text>
          </Pressable>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 16,
  },
  drawerSafe: {
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  logo: {
    width: 110,
    height: 72,
  },
  sessionCard: {
    margin: 14,
    backgroundColor: '#F6FAF6',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DCF0DC',
  },
  sessionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8FA88F',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionTextBlock: {
    flex: 1,
  },
  sessionName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B2E1B',
  },
  sessionRole: {
    fontSize: 12,
    color: '#4A6A4A',
    fontWeight: '500',
    marginTop: 1,
  },
  navList: {
    flex: 1,
    paddingHorizontal: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 13,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  navItemPressed: {
    backgroundColor: '#F0F7F0',
  },
  navItemIcon: {
    width: 28,
    alignItems: 'center',
  },
  navItemLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E2E1E',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    margin: 14,
    paddingVertical: 13,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginTop: 4,
  },
  logoutLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#C0392B',
  },
});
