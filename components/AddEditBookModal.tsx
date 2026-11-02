import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  Switch,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Book, BookType, SubBook } from '../types/book';
import { Colors, Shadows, Radii } from '../constants/theme';
import { findBookByIsbn } from '../constants/sampleBooks';
import { BarcodeScannerModal } from './BarcodeScannerModal';

interface AddEditBookModalProps {
  visible: boolean;
  bookToEdit?: Book | null;
  onClose: () => void;
  onSave?: (bookData: Partial<Book>) => void;
}

export const AddEditBookModal: React.FC<AddEditBookModalProps> = ({
  visible,
  bookToEdit,
  onClose,
  onSave,
}) => {
  const isEditing = !!bookToEdit;

  // Form State
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [actualPrice, setActualPrice] = useState('');
  const [paidPrice, setPaidPrice] = useState('');
  const [bookType, setBookType] = useState<BookType>('PHYSICAL');
  const [language, setLanguage] = useState('English');
  const [shelfLocation, setShelfLocation] = useState('');
  const [isCombination, setIsCombination] = useState(false);
  const [subBooks, setSubBooks] = useState<SubBook[]>([]);

  // Scanner modal state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanToastMessage, setScanToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (bookToEdit) {
      setTitle(bookToEdit.title || '');
      setAuthor(bookToEdit.author || '');
      setIsbn(bookToEdit.isbn || '');
      setActualPrice(bookToEdit.actualPrice ? String(bookToEdit.actualPrice) : '');
      setPaidPrice(bookToEdit.paidPrice ? String(bookToEdit.paidPrice) : '');
      setBookType(bookToEdit.bookType || 'PHYSICAL');
      setLanguage(bookToEdit.language || 'English');
      setShelfLocation(bookToEdit.shelfLocation || '');
      setIsCombination(bookToEdit.isCombination || false);
      setSubBooks(bookToEdit.subBooks || []);
    } else {
      // Reset form
      setTitle('');
      setAuthor('');
      setIsbn('');
      setActualPrice('');
      setPaidPrice('');
      setBookType('PHYSICAL');
      setLanguage('English');
      setShelfLocation('');
      setIsCombination(false);
      setSubBooks([]);
    }
  }, [bookToEdit, visible]);

  const handleAddSubBook = () => {
    const nextNumber = subBooks.length + 1;
    setSubBooks([
      ...subBooks,
      {
        subBookNumber: nextNumber,
        name: `Volume ${nextNumber}`,
        title: '',
        author: author || '',
      },
    ]);
  };

  const handleUpdateSubBook = (index: number, field: keyof SubBook, value: string) => {
    const updated = [...subBooks];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setSubBooks(updated);
  };

  const handleRemoveSubBook = (index: number) => {
    const filtered = subBooks.filter((_, i) => i !== index);
    const renumbered = filtered.map((item, idx) => ({
      ...item,
      subBookNumber: idx + 1,
    }));
    setSubBooks(renumbered);
  };

  const handleScanSuccess = async (scannedCode: string) => {
    setIsbn(scannedCode);
    setIsScannerOpen(false);

    const match = findBookByIsbn(scannedCode);
    if (match) {
      setTitle(match.title);
      setAuthor(match.author);
      setLanguage(match.language);
      if (!actualPrice && match.actualPrice) setActualPrice(String(match.actualPrice));
      if (!paidPrice && match.paidPrice) setPaidPrice(String(match.paidPrice));
      if (!shelfLocation && match.shelfLocation) setShelfLocation(match.shelfLocation);
      setScanToastMessage(`Autofilled: "${match.title}"`);
      setTimeout(() => setScanToastMessage(null), 3500);
      return;
    }

    // Remote metadata lookup
    try {
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${scannedCode}`);
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        const info = data.items[0].volumeInfo;
        if (info.title) setTitle(info.title);
        if (info.authors && info.authors.length > 0) setAuthor(info.authors.join(', '));
        if (info.language) setLanguage(info.language === 'en' ? 'English' : info.language);
        setScanToastMessage(`Autofilled: "${info.title}"`);
        setTimeout(() => setScanToastMessage(null), 3500);
        return;
      }
    } catch {
      // Network fallback
    }

    setScanToastMessage('Book details not found. Please enter manually.');
    setTimeout(() => setScanToastMessage(null), 3500);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        testID="add-edit-modal"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalBackdrop}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text testID="add-edit-title" style={styles.headerTitle}>
                {isEditing ? 'Update Book' : 'Add New Book'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {isEditing ? 'Update book details' : 'Add a book to your collection'}
              </Text>
            </View>

            <View style={styles.headerActions}>
              {/* Barcode Scanner Header Button */}
              <Pressable
                testID="add-edit-scan-button"
                onPress={() => setIsScannerOpen(true)}
                style={({ pressed }) => [
                  styles.scannerIconButton,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Ionicons name="barcode-outline" size={20} color={Colors.textNavy} />
                <Text style={styles.scannerButtonLabel}>Scan ISBN</Text>
              </Pressable>

              <Pressable
                testID="add-edit-close-button"
                hitSlop={8}
                onPress={onClose}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={22} color={Colors.textSlate} />
              </Pressable>
            </View>
          </View>

          {/* Scanner result toast feedback */}
          {scanToastMessage && (
            <View testID="add-edit-scan-feedback" style={styles.scannerFeedbackBanner}>
              <MaterialCommunityIcons name="information-outline" size={20} color={Colors.accentCoral} />
              <Text style={styles.scannerFeedbackText}>{scanToastMessage}</Text>
            </View>
          )}

          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.formScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Title Input */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <Text style={styles.inputLabel}>Title</Text>
                <Text style={styles.requiredMark}>*</Text>
              </View>
              <TextInput
                testID="input-book-title"
                style={styles.textInput}
                placeholder="Enter book title"
                placeholderTextColor={Colors.textSlate}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Author Input */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <Text style={styles.inputLabel}>Author</Text>
                <Text style={styles.requiredMark}>*</Text>
              </View>
              <TextInput
                testID="input-book-author"
                style={styles.textInput}
                placeholder="Enter author name"
                placeholderTextColor={Colors.textSlate}
                value={author}
                onChangeText={setAuthor}
              />
            </View>

            {/* ISBN & Shelf Location */}
            <View style={styles.twoColumnRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>ISBN / Barcode</Text>
                <TextInput
                  testID="input-book-isbn"
                  style={styles.textInput}
                  placeholder="e.g. 9780140449136"
                  placeholderTextColor={Colors.textSlate}
                  value={isbn}
                  onChangeText={setIsbn}
                  keyboardType="number-pad"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Shelf Location</Text>
                <TextInput
                  testID="input-book-shelf"
                  style={styles.textInput}
                  placeholder="e.g. Shelf A #03"
                  placeholderTextColor={Colors.textSlate}
                  value={shelfLocation}
                  onChangeText={setShelfLocation}
                />
              </View>
            </View>

            {/* Actual Price & Paid Price */}
            <View style={styles.twoColumnRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Actual Price (MRP)</Text>
                <TextInput
                  testID="input-book-actual-price"
                  style={styles.textInput}
                  placeholder="0.00"
                  placeholderTextColor={Colors.textSlate}
                  value={actualPrice}
                  onChangeText={setActualPrice}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Paid Price</Text>
                <TextInput
                  testID="input-book-paid-price"
                  style={styles.textInput}
                  placeholder="0.00"
                  placeholderTextColor={Colors.textSlate}
                  value={paidPrice}
                  onChangeText={setPaidPrice}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Book Type & Language */}
            <View style={styles.twoColumnRow}>
              {/* M3 Segmented Button for Book Type */}
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Book Type</Text>
                <View style={styles.segmentedContainer}>
                  <Pressable
                    testID="segment-type-physical"
                    style={[
                      styles.segmentButton,
                      bookType === 'PHYSICAL' && styles.segmentButtonActivePhysical,
                    ]}
                    onPress={() => setBookType('PHYSICAL')}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        bookType === 'PHYSICAL' && styles.segmentTextActivePhysical,
                      ]}
                    >
                      Physical
                    </Text>
                  </Pressable>

                  <Pressable
                    testID="segment-type-ebook"
                    style={[
                      styles.segmentButton,
                      bookType === 'EBOOK' && styles.segmentButtonActiveEbook,
                    ]}
                    onPress={() => setBookType('EBOOK')}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        bookType === 'EBOOK' && styles.segmentTextActiveEbook,
                      ]}
                    >
                      eBook
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Language Selector */}
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Language</Text>
                <TextInput
                  testID="input-book-language"
                  style={styles.textInput}
                  placeholder="e.g. English, Hindi"
                  placeholderTextColor={Colors.textSlate}
                  value={language}
                  onChangeText={setLanguage}
                />
              </View>
            </View>

            {/* Combination / Multi-Book Toggle */}
            <View style={styles.combinationToggleCard}>
              <View style={styles.combinationInfo}>
                <MaterialCommunityIcons
                  name="layers-triple-outline"
                  size={24}
                  color={Colors.accentCoral}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.combinationTitle}>Multi-Book / Box Set Collection</Text>
                  <Text style={styles.combinationSubtitle}>
                    Enable if this item bundles multiple distinct volumes or anthologies
                  </Text>
                </View>
              </View>
              <Switch
                testID="switch-combination"
                value={isCombination}
                onValueChange={setIsCombination}
                trackColor={{ false: Colors.borderSubtle, true: Colors.accentPeach }}
                thumbColor={isCombination ? Colors.accentCoral : Colors.white}
              />
            </View>

            {/* Dynamic Sub-Books Section */}
            {isCombination && (
              <View style={styles.subBooksContainer}>
                <View style={styles.subBooksHeader}>
                  <Text style={styles.subBooksHeaderTitle}>
                    Bundled Volumes ({subBooks.length})
                  </Text>
                  <Pressable
                    testID="button-add-sub-book"
                    onPress={handleAddSubBook}
                    style={styles.addSubBookButton}
                  >
                    <Ionicons name="add" size={16} color={Colors.white} />
                    <Text style={styles.addSubBookButtonText}>Add Sub-Book</Text>
                  </Pressable>
                </View>

                {subBooks.length === 0 ? (
                  <Text style={styles.emptySubBooksText}>
                    No sub-books added yet. Tap "Add Sub-Book" to list volumes in this set.
                  </Text>
                ) : (
                  subBooks.map((item, index) => (
                    <View key={index} testID={`sub-book-item-${index}`} style={styles.subBookItemCard}>
                      <View style={styles.subBookItemHeader}>
                        <Text style={styles.subBookNumber}>Volume #{item.subBookNumber}</Text>
                        <Pressable
                          testID={`button-remove-sub-book-${index}`}
                          hitSlop={8}
                          onPress={() => handleRemoveSubBook(index)}
                        >
                          <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                        </Pressable>
                      </View>

                      <View style={styles.twoColumnRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.subInputLabel}>Volume Name</Text>
                          <TextInput
                            testID={`input-sub-book-name-${index}`}
                            style={styles.subTextInput}
                            placeholder="e.g. Vol 1: Fellowship"
                            placeholderTextColor={Colors.textSlate}
                            value={item.name}
                            onChangeText={(val) => handleUpdateSubBook(index, 'name', val)}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.subInputLabel}>Sub-Title</Text>
                          <TextInput
                            testID={`input-sub-book-title-${index}`}
                            style={styles.subTextInput}
                            placeholder="Book Title"
                            placeholderTextColor={Colors.textSlate}
                            value={item.title}
                            onChangeText={(val) => handleUpdateSubBook(index, 'title', val)}
                          />
                        </View>
                      </View>

                      <View style={{ marginTop: 6 }}>
                        <Text style={styles.subInputLabel}>Sub-Book Author</Text>
                        <TextInput
                          testID={`input-sub-book-author-${index}`}
                          style={styles.subTextInput}
                          placeholder="Author if different"
                          placeholderTextColor={Colors.textSlate}
                          value={item.author}
                          onChangeText={(val) => handleUpdateSubBook(index, 'author', val)}
                        />
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <Pressable
              testID="button-cancel-book"
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>

            <Pressable
              testID="button-save-book"
              style={({ pressed }) => [
                styles.saveButton,
                pressed && { opacity: 0.9 },
              ]}
              onPress={() => {
                if (onSave) {
                  onSave({
                    title,
                    author,
                    isbn,
                    actualPrice: parseFloat(actualPrice) || 0,
                    paidPrice: parseFloat(paidPrice) || 0,
                    bookType,
                    language,
                    shelfLocation,
                    isCombination,
                    subBooks,
                  });
                }
                onClose();
              }}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color={Colors.white} />
              <Text style={styles.saveButtonText}>
                {isEditing ? 'Save Changes' : 'Add to Catalog'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Dedicated Barcode Scanner Modal Screen */}
        <BarcodeScannerModal
          visible={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={handleScanSuccess}
        />
      </KeyboardAvoidingView>
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
    maxWidth: 620,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    ...Shadows.m3Dialog,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    backgroundColor: Colors.bgSageMist,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textNavy,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSlate,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scannerIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.bgCream,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  scannerButtonLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textNavy,
  },
  closeButton: {
    padding: 6,
    borderRadius: Radii.full,
  },
  scannerFeedbackBanner: {
    backgroundColor: '#FFE9E2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.accentPeach,
  },
  scannerFeedbackText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textNavy,
    flex: 1,
  },
  formScroll: {
    flex: 1,
  },
  formScrollContent: {
    padding: 20,
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textNavy,
  },
  requiredMark: {
    color: Colors.accentCoral,
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: Colors.bgCreamCard,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textNavy,
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCreamCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentButtonActivePhysical: {
    backgroundColor: Colors.accentPeach,
  },
  segmentButtonActiveEbook: {
    backgroundColor: Colors.accentCoral,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSlate,
  },
  segmentTextActivePhysical: {
    color: Colors.textNavy,
    fontWeight: '800',
  },
  segmentTextActiveEbook: {
    color: Colors.white,
    fontWeight: '800',
  },
  combinationToggleCard: {
    backgroundColor: Colors.bgCreamCard,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  combinationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  combinationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textNavy,
  },
  combinationSubtitle: {
    fontSize: 11,
    color: Colors.textSlate,
    marginTop: 2,
  },
  subBooksContainer: {
    backgroundColor: Colors.bgSageMist,
    borderRadius: Radii.card,
    padding: 14,
    gap: 12,
  },
  subBooksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subBooksHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textNavy,
  },
  addSubBookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accentCoral,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.full,
  },
  addSubBookButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
  },
  emptySubBooksText: {
    fontSize: 12,
    color: Colors.textSlate,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  subBookItemCard: {
    backgroundColor: Colors.bgCreamCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 12,
    gap: 8,
  },
  subBookItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subBookNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textNavy,
  },
  subInputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSlate,
    marginBottom: 4,
  },
  subTextInput: {
    backgroundColor: Colors.bgCream,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    color: Colors.textNavy,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.bgCreamCard,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.bgCream,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSlate,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radii.full,
    backgroundColor: Colors.accentCoral,
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
});

