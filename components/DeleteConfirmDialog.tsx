import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Book } from '../types/book';
import { Colors, Shadows, Radii } from '../constants/theme';

interface DeleteConfirmDialogProps {
  visible: boolean;
  book: Book | null;
  onCancel: () => void;
  onConfirm: (book: Book) => void;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  visible,
  book,
  onCancel,
  onConfirm,
}) => {
  if (!book) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onCancel}
    >
      <View testID="delete-confirm-dialog" style={styles.dialogBackdrop}>
        <View style={styles.dialogCard}>
          <View style={styles.iconContainer}>
            <Ionicons name="trash-outline" size={28} color={Colors.danger} />
          </View>

          <Text testID="delete-confirm-title" style={styles.dialogTitle}>Delete Book?</Text>

          <Text testID="delete-confirm-message" style={styles.dialogMessage}>
            Are you sure you want to remove <Text style={styles.boldText}>"{book.title}"</Text> from your personal catalog?
          </Text>

          <View style={styles.actionsRow}>
            <Pressable
              testID="delete-confirm-cancel-button"
              style={styles.cancelButton}
              onPress={onCancel}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>

            <Pressable
              testID="delete-confirm-button"
              style={styles.deleteButton}
              onPress={() => onConfirm(book)}
            >
              <Text style={styles.deleteText}>Delete</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  dialogBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 33, 48, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Platform.OS === 'web' ? 24 : 16,
  },
  dialogCard: {
    backgroundColor: Colors.bgCream,
    borderRadius: Radii.modal,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    ...Shadows.m3Dialog,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textNavy,
    marginBottom: 8,
  },
  dialogMessage: {
    fontSize: 14,
    color: Colors.textSlate,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  boldText: {
    fontWeight: '700',
    color: Colors.textNavy,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.bgCreamCard,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSlate,
  },
  deleteButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radii.full,
    backgroundColor: Colors.danger,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
});
