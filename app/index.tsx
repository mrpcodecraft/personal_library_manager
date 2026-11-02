import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import { Colors, Shadows, Radii } from '../constants/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function SplashScreenComponent() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function initialize() {
      try {
        // App is ready to mount
      } finally {
        setReady(true);
        await SplashScreen.hideAsync().catch(() => {});
      }
    }
    initialize();
  }, []);

  const handleNavigate = () => {
    router.replace('/library');
  };

  if (!ready) {
    return null;
  }

  return (
    <SafeAreaView testID="splash-screen" style={styles.safeContainer}>
      <View style={styles.mainContainer}>
        <View style={styles.centerContent}>
          <View style={styles.emblemContainer}>
            <View style={styles.emblemInner}>
              <Ionicons name="book" size={54} color={Colors.textNavy} />
            </View>
          </View>

          <Text testID="splash-headline" style={styles.headline}>Library Manager</Text>
          <Text testID="splash-tagline" style={styles.tagline}>Personal catalog and reading shelf</Text>

          <Pressable
            testID="splash-enter-button"
            style={styles.continueButton}
            onPress={handleNavigate}
          >
            <Text style={styles.continueButtonText}>Enter Library</Text>
            <Ionicons name="arrow-forward" size={14} color={Colors.textNavy} />
          </Pressable>
        </View>

        <View style={styles.bottomDock}>
          <View testID="splash-author-badge" style={styles.authorBadge}>
            <Ionicons name="sparkles" size={14} color={Colors.accentCoral} />
            <Text style={styles.authorText}>Developed by mrpcodecraft</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: Colors.bgCream,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.bgCream,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
  },
  emblemContainer: {
    width: 104,
    height: 104,
    borderRadius: 30,
    backgroundColor: Colors.bgSageMist,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    ...Shadows.m3Card,
  },
  emblemInner: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: Colors.bgCreamCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textNavy,
    letterSpacing: -0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 15,
    color: Colors.textSlate,
    textAlign: 'center',
    marginBottom: 32,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.bgSageMist,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    ...Shadows.m3Card,
  },
  continueButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textNavy,
  },
  bottomDock: {
    alignItems: 'center',
  },
  authorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.bgCreamCard,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  authorText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSlate,
  },
});
