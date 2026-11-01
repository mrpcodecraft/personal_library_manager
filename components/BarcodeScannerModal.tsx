import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
  TextInput,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Colors, Shadows, Radii } from '../constants/theme';
import { SAMPLE_BARCODE_PRESETS } from '../constants/sampleBooks';

interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScanSuccess: (scannedIsbn: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  visible,
  onClose,
  onScanSuccess,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [manualIsbn, setManualIsbn] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  // Animated laser line moving across viewfinder
  const laserAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setScannedResult(null);
      setManualIsbn('');
      setShowManualInput(false);

      // Start looping laser animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(laserAnim, {
            toValue: 1,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(laserAnim, {
            toValue: 0,
            duration: 1800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible]);

  const handleBarcodeScanned = (scanningResult: { data: string; type?: string }) => {
    if (scannedResult) return; // Prevent multiple triggers
    const isbnData = scanningResult.data;
    setScannedResult(isbnData);

    // Audio / visual confirmation delay then return
    setTimeout(() => {
      onScanSuccess(isbnData);
      onClose();
    }, 700);
  };

  const handleManualSubmit = () => {
    if (manualIsbn.trim()) {
      setScannedResult(manualIsbn.trim());
      setTimeout(() => {
        onScanSuccess(manualIsbn.trim());
        onClose();
      }, 300);
    }
  };

  const laserTranslateY = laserAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 180],
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView testID="barcode-scanner-modal" style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <Pressable testID="scanner-close-button" hitSlop={10} onPress={onClose} style={styles.headerIconButton}>
            <Ionicons name="close" size={24} color={Colors.white} />
          </Pressable>

          <View style={styles.headerTitleContainer}>
            <Text testID="scanner-title" style={styles.headerTitle}>Scan ISBN Barcode</Text>
            <Text style={styles.headerSubtitle}>EAN-13 / EAN-8 Book Code</Text>
          </View>

          {/* Torch toggle button */}
          <Pressable
            testID="scanner-torch-button"
            hitSlop={10}
            onPress={() => setTorchEnabled((prev) => !prev)}
            style={[
              styles.headerIconButton,
              torchEnabled && styles.headerIconButtonActive,
            ]}
          >
            <Ionicons
              name={torchEnabled ? 'flash' : 'flash-outline'}
              size={22}
              color={torchEnabled ? Colors.textNavy : Colors.white}
            />
          </Pressable>
        </View>

        {/* Viewfinder Camera Area */}
        <View testID="scanner-camera-container" style={styles.cameraContainer}>
          {permission?.granted ? (
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              enableTorch={torchEnabled}
              barcodeScannerSettings={{
                barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr'],
              }}
              onBarcodeScanned={scannedResult ? undefined : handleBarcodeScanned}
            />
          ) : (
            /* Camera Permission Fallback */
            <View style={styles.cameraFallbackBackground}>
              <Ionicons name="videocam-outline" size={48} color={Colors.bgSageBadge} />
              <Text style={styles.cameraNoticeTitle}>
                {permission?.canAskAgain === false
                  ? 'Camera Permission Denied'
                  : 'Camera Access Needed'}
              </Text>
              <Text style={styles.cameraNoticeSub}>
                Allow camera access to scan ISBN barcodes directly with your device.
              </Text>

              {(!permission || !permission.granted) && (
                <Pressable
                  testID="scanner-enable-camera-button"
                  style={styles.permissionButton}
                  onPress={() => requestPermission()}
                >
                  <Ionicons name="camera" size={18} color={Colors.white} />
                  <Text style={styles.permissionButtonText}>Enable Camera</Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Viewfinder Dark Overlay Mask */}
          <View style={styles.overlay}>
            <View style={styles.overlayTop} />

            <View style={styles.overlayCenterRow}>
              <View style={styles.overlaySide} />

              {/* Central Target Scanner Box */}
              <View
                style={[
                  styles.targetBox,
                  scannedResult ? styles.targetBoxSuccess : null,
                ]}
              >
                {/* 4 Corner Targeting Brackets */}
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />

                {/* Animated Laser Scanning Line */}
                {!scannedResult && (
                  <Animated.View
                    testID="scanner-laser-line"
                    style={[
                      styles.laserLine,
                      { transform: [{ translateY: laserTranslateY }] },
                    ]}
                  />
                )}

                {/* Scanned Success Match Badge */}
                {scannedResult && (
                  <View testID="scanner-success-badge" style={styles.successBadge}>
                    <Ionicons name="checkmark-circle" size={32} color="#2E7D32" />
                    <Text style={styles.successText}>Scanned!</Text>
                    <Text testID="scanner-success-isbn" style={styles.successIsbnText}>{scannedResult}</Text>
                  </View>
                )}
              </View>

              <View style={styles.overlaySide} />
            </View>

            <View style={styles.overlayBottom} />
          </View>
        </View>

        {/* Bottom Control Dock */}
        <View style={styles.bottomDock}>
          <Text style={styles.instructionText}>
            Align the barcode on the back cover within the frame
          </Text>

          {/* Manual Input Toggle */}
          {showManualInput ? (
            <View style={styles.manualInputRow}>
              <TextInput
                testID="scanner-manual-input"
                style={styles.manualTextInput}
                placeholder="Enter 10 or 13-digit ISBN"
                placeholderTextColor={Colors.textSlate}
                value={manualIsbn}
                onChangeText={setManualIsbn}
                keyboardType="number-pad"
                autoFocus
              />
              <Pressable
                testID="scanner-manual-submit-button"
                style={styles.manualSubmitButton}
                onPress={handleManualSubmit}
              >
                <Ionicons name="arrow-forward" size={18} color={Colors.white} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              testID="scanner-manual-toggle-button"
              style={styles.manualToggleButton}
              onPress={() => setShowManualInput(true)}
            >
              <MaterialCommunityIcons name="keyboard-outline" size={18} color={Colors.textNavy} />
              <Text style={styles.manualToggleText}>Type ISBN Manually</Text>
            </Pressable>
          )}

          {/* Sample Barcode presets */}
          <View style={styles.testSection}>
            <Text style={styles.testSectionLabel}>Sample Barcodes:</Text>
            <View style={styles.chipsRow}>
              {SAMPLE_BARCODE_PRESETS.map((item) => (
                <Pressable
                  key={item.isbn}
                  testID={`scanner-preset-chip-${item.isbn}`}
                  style={styles.testChip}
                  onPress={() => handleBarcodeScanned({ data: item.isbn })}
                >
                  <Text style={styles.testChipText}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const { width } = Dimensions.get('window');
const TARGET_SIZE = Math.min(width * 0.75, 280);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    zIndex: 10,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.bgSageBadge,
    marginTop: 2,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconButtonActive: {
    backgroundColor: Colors.accentPeach,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#0A0E17',
    overflow: 'hidden',
  },
  cameraFallbackBackground: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#121824',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  cameraNoticeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.white,
    marginTop: 14,
    marginBottom: 6,
  },
  cameraNoticeSub: {
    fontSize: 13,
    color: Colors.textSlate,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    maxWidth: 280,
  },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.accentCoral,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: Radii.full,
  },
  permissionButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  overlayCenterRow: {
    flexDirection: 'row',
    height: 200,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  targetBox: {
    width: TARGET_SIZE,
    height: 200,
    borderRadius: Radii.card,
    position: 'relative',
    overflow: 'hidden',
  },
  targetBoxSuccess: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: Colors.accentCoral,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: Radii.card,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: Radii.card,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: Radii.card,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: Radii.card,
  },
  laserLine: {
    width: '100%',
    height: 2.5,
    backgroundColor: Colors.accentCoral,
    shadowColor: Colors.accentCoral,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  successBadge: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(253, 248, 236, 0.95)',
    borderRadius: Radii.card,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  successText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2E7D32',
    marginTop: 4,
  },
  successIsbnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textNavy,
    marginTop: 2,
  },
  bottomDock: {
    backgroundColor: Colors.bgCream,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    borderTopLeftRadius: Radii.modal,
    borderTopRightRadius: Radii.modal,
    alignItems: 'center',
    gap: 12,
  },
  instructionText: {
    fontSize: 13,
    color: Colors.textSlate,
    textAlign: 'center',
  },
  manualToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.bgSageMist,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  manualToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textNavy,
  },
  manualInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  manualTextInput: {
    flex: 1,
    backgroundColor: Colors.bgCreamCard,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: Radii.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 13,
    color: Colors.textNavy,
  },
  manualSubmitButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.accentCoral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testSection: {
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  testSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSlate,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  testChip: {
    backgroundColor: Colors.bgSageMist,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  testChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textNavy,
  },
});

