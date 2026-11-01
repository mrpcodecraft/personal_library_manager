import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows, Radii } from '../constants/theme';

export default function SplashScreen() {
  const router = useRouter();

  // Animation values for indeterminate progress & subtle emblem breathing
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.96)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in screen content
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Emblem breathing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.96,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Indeterminate horizontal linear progress bar
    Animated.loop(
      Animated.sequence([
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(progressAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Automatically transition to /library after warm-up
    const timer = setTimeout(() => {
      router.replace('/library');
    }, 2400);

    return () => clearTimeout(timer);
  }, []);

  const handleManualNavigate = () => {
    router.replace('/library');
  };

  const progressTranslateX = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-60, 60],
  });

  return (
    <SafeAreaView testID="splash-screen" style={styles.safeContainer}>
      <Animated.View style={[styles.mainContainer, { opacity: fadeAnim }]}>
        <View style={styles.centerContent}>
          {/* Emblem */}
          <Animated.View
            testID="splash-emblem"
            style={[
              styles.emblemContainer,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <View style={styles.emblemInner}>
              <Ionicons name="book" size={54} color={Colors.textNavy} />
            </View>
          </Animated.View>

          {/* Branding */}
          <Text testID="splash-headline" style={styles.headline}>Library Manager</Text>
          <Text testID="splash-tagline" style={styles.tagline}>Your personal reading haven</Text>

          {/* Progress bar */}
          <View testID="splash-progress-track" style={styles.progressTrackWrapper}>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    transform: [{ translateX: progressTranslateX }],
                  },
                ]}
              />
            </View>
          </View>

          {/* Enter action */}
          <Pressable
            testID="splash-enter-button"
            style={styles.continueButton}
            onPress={handleManualNavigate}
          >
            <Text style={styles.continueButtonText}>Enter Library</Text>
            <Ionicons name="arrow-forward" size={14} color={Colors.textNavy} />
          </Pressable>
        </View>

        {/* Footer dock */}
        <View style={styles.bottomDock}>
          <View testID="splash-author-badge" style={styles.authorBadge}>
            <Ionicons name="sparkles" size={14} color={Colors.accentCoral} />
            <Text style={styles.authorText}>Developed by mrpcodecraft</Text>
          </View>
        </View>
      </Animated.View>
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
  },
  emblemContainer: {
    width: 112,
    height: 112,
    borderRadius: Radii.modal,
    backgroundColor: Colors.accentPeach,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    ...Shadows.m3Card,
  },
  emblemInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radii.modal,
  },
  headline: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.textNavy,
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 15,
    fontStyle: 'italic',
    color: Colors.textSlate,
    marginBottom: 28,
  },
  progressTrackWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 10,
    marginBottom: 20,
  },
  progressTrack: {
    width: 120,
    height: 3,
    backgroundColor: Colors.bgSageBadge,
    borderRadius: Radii.full,
    overflow: 'hidden',
  },
  progressBar: {
    width: 50,
    height: 3,
    backgroundColor: Colors.accentCoral,
    borderRadius: Radii.full,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radii.full,
    backgroundColor: Colors.bgSageMist,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginTop: 8,
  },
  continueButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textNavy,
  },
  bottomDock: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 12 : 16,
  },
  authorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.bgSageMist,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    ...Shadows.m3Card,
  },
  authorText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textNavy,
    letterSpacing: 0.2,
  },
});

