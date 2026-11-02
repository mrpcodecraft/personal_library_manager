import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Book } from '../types/book';
import { Colors, Shadows, Radii } from '../constants/theme';

interface BookDetailsModalProps {
  visible: boolean;
  book: Book | null;
  onClose: () => void;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
}

export const BookDetailsModal: React.FC<BookDetailsModalProps> = ({
  visible,
  book,
  onClose,
  onEdit,
  onDelete,
}) => {
  if (!book) return null;

  const isPhysical = book.bookType === 'PHYSICAL';
  const savings = book.actualPrice - book.paidPrice;
  const savingsPercent =
    book.actualPrice > 0 ? Math.round((savings / book.actualPrice) * 100) : 0;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View testID="book-details-modal" style={styles.modalBackdrop}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Book Details</Text>
            <Pressable testID="book-details-close-button" hitSlop={8} onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={Colors.textSlate} />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.showcaseSection}>
              <View style={styles.coverWrapper}>
                {book.coverImageUrl ? (
                  <Image
                    source={{ uri: book.coverImageUrl }}
                    style={styles.coverImage}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <View style={styles.coverFallback}>
                    <Ionicons name="book-outline" size={40} color={Colors.accentPeach} />
                  </View>
                )}
              </View>

              <View style={styles.showcaseDetails}>
                <Text style={styles.bookTitle}>{book.title}</Text>
                <Text style={styles.bookAuthor}>by {book.author}</Text>

                {book.shelfLocation && (
                  <View style={styles.badgeRow}>
                    <Ionicons name="bookmark-outline" size={14} color={Colors.textNavy} />
                    <Text style={styles.badgeText}>{book.shelfLocation}</Text>
                  </View>
                )}

                <View style={styles.chipsRow}>
                  <View
                    style={[
                      styles.chip,
                      isPhysical ? styles.chipPhysical : styles.chipEbook,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipLabel,
                        isPhysical ? styles.chipLabelPhysical : styles.chipLabelEbook,
                      ]}
                    >
                      {book.bookType}
                    </Text>
                  </View>

                  <View style={[styles.chip, styles.chipLanguage]}>
                    <Text style={styles.chipLabelLanguage}>{book.language}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.priceCard}>
              <Text style={styles.sectionSubtitle}>Pricing Details</Text>
              <View style={styles.priceGrid}>
                <View style={styles.priceColumn}>
                  <Text style={styles.priceLabel}>Retail (MRP)</Text>
                  <Text style={styles.priceOriginal}>${book.actualPrice.toFixed(2)}</Text>
                </View>

                <View style={styles.priceDivider} />

                <View style={styles.priceColumn}>
                  <Text style={styles.priceLabel}>Paid Price</Text>
                  <Text style={styles.pricePaid}>${book.paidPrice.toFixed(2)}</Text>
                </View>

                <View style={styles.priceDivider} />

                <View style={styles.priceColumn}>
                  <Text style={styles.priceLabel}>Savings</Text>
                  <Text style={styles.priceSavings}>
                    {savings > 0 ? `$${savings.toFixed(2)} (${savingsPercent}%)` : '$0.00'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.metaSection}>
              <Text style={styles.sectionSubtitle}>Book Details</Text>

              <View style={styles.metaRow}>
                <Text style={styles.metaKey}>ISBN Barcode:</Text>
                <Text style={styles.metaVal}>{book.isbn || 'Not specified'}</Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaKey}>Catalog ID:</Text>
                <Text style={styles.metaVal} numberOfLines={1}>
                  {book.id}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaKey}>Date Cataloged:</Text>
                <Text style={styles.metaVal}>
                  {new Date(book.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>

            {book.isCombination && (
              <View testID="book-details-sub-books-container" style={styles.subBooksBox}>
                <View style={styles.subBooksTitleRow}>
                  <MaterialCommunityIcons
                    name="layers-triple-outline"
                    size={20}
                    color={Colors.accentCoral}
                  />
                  <Text style={styles.subBooksHeading}>
                    Bundled Sub-Books ({book.subBooks?.length || 0})
                  </Text>
                </View>

                {book.subBooks && book.subBooks.length > 0 ? (
                  book.subBooks.map((sub, i) => (
                    <View key={i} style={styles.subBookCard}>
                      <View style={styles.subBookBadge}>
                        <Text style={styles.subBookBadgeNum}>{sub.subBookNumber}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.subBookName}>{sub.name || `Volume ${sub.subBookNumber}`}</Text>
                        <Text style={styles.subBookTitle}>{sub.title || 'Untitled'}</Text>
                        <Text style={styles.subBookAuthor}>Author: {sub.author || book.author}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.subBookEmpty}>No bundled sub-volumes listed.</Text>
                )}
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              testID="book-details-delete-button"
              style={styles.deleteButton}
              onPress={() => {
                onClose();
                onDelete(book);
              }}
            >
              <Ionicons name="trash-outline" size={16} color={Colors.danger} />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </Pressable>

            <Pressable
              testID="book-details-edit-button"
              style={styles.editButton}
              onPress={() => {
                onClose();
                onEdit(book);
              }}
            >
              <Ionicons name="pencil-outline" size={16} color={Colors.textNavy} />
              <Text style={styles.editButtonText}>Update Book</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 33, 48, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Platform.OS === 'web' ? 24 : 12,
  },
  modalContent: {
    backgroundColor: Colors.bgCream,
    borderRadius: Radii.modal,
    width: '100%',
    maxWidth: 580,
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    ...Shadows.m3Dialog,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.bgSageMist,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textNavy,
  },
  closeButton: {
    padding: 6,
    borderRadius: Radii.full,
  },
  scrollContent: {
    padding: 20,
  },
  showcaseSection: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  coverWrapper: {
    width: 110,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.bgSageMist,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgSageMist,
  },
  showcaseDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textNavy,
    lineHeight: 24,
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSlate,
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.bgSageMist,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  badgeText: {
    fontSize: 12,
    color: Colors.textNavy,
    fontWeight: '600',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  chipPhysical: {
    backgroundColor: Colors.accentPeach,
  },
  chipEbook: {
    backgroundColor: Colors.accentCoral,
  },
  chipLanguage: {
    backgroundColor: Colors.bgSageBadge,
  },
  chipLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  chipLabelPhysical: {
    color: Colors.textNavy,
  },
  chipLabelEbook: {
    color: Colors.white,
  },
  chipLabelLanguage: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textNavy,
  },
  priceCard: {
    backgroundColor: Colors.bgCreamCard,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 14,
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textNavy,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  priceGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceColumn: {
    alignItems: 'center',
    flex: 1,
  },
  priceDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.borderSubtle,
  },
  priceLabel: {
    fontSize: 11,
    color: Colors.textSlate,
    marginBottom: 4,
  },
  priceOriginal: {
    fontSize: 14,
    color: Colors.textSlate,
    textDecorationLine: 'line-through',
    fontWeight: '600',
  },
  pricePaid: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textNavy,
  },
  priceSavings: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.accentCoral,
  },
  metaSection: {
    backgroundColor: Colors.bgCreamCard,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 14,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  metaKey: {
    fontSize: 12,
    color: Colors.textSlate,
    fontWeight: '500',
  },
  metaVal: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textNavy,
    maxWidth: '65%',
    textAlign: 'right',
  },
  subBooksBox: {
    backgroundColor: Colors.bgCreamCard,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 14,
    marginBottom: 16,
  },
  subBooksTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  subBooksHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textNavy,
  },
  subBookCard: {
    backgroundColor: Colors.bgCream,
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  subBookBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.bgSageMist,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subBookBadgeNum: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textNavy,
  },
  subBookName: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accentCoral,
  },
  subBookTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textNavy,
  },
  subBookAuthor: {
    fontSize: 11,
    color: Colors.textSlate,
  },
  subBookEmpty: {
    fontSize: 12,
    fontStyle: 'italic',
    color: Colors.textSlate,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.bgSageMist,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.danger,
    backgroundColor: Colors.bgCream,
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.danger,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: Radii.full,
    backgroundColor: Colors.accentPeach,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textNavy,
  },
});
