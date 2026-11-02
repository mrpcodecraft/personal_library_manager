import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Book } from '../types/book';
import { SAMPLE_BOOKS } from '../constants/sampleBooks';
import { Colors, Shadows, Radii, Breakpoints } from '../constants/theme';
import { BookCard } from '../components/BookCard';
import { AddEditBookModal } from '../components/AddEditBookModal';
import { BookDetailsModal } from '../components/BookDetailsModal';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';

export default function LibraryScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isWebOrTablet = width >= Breakpoints.tablet;
  const isDesktop = width >= Breakpoints.desktop;
  const defaultCols = isDesktop ? 3 : isWebOrTablet ? 2 : 1;

  const [booksList, setBooksList] = useState<Book[]>(SAMPLE_BOOKS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(isWebOrTablet ? 'grid' : 'list');

  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [selectedBookForEdit, setSelectedBookForEdit] = useState<Book | null>(null);
  const [selectedBookForDetails, setSelectedBookForDetails] = useState<Book | null>(null);
  const [selectedBookForDelete, setSelectedBookForDelete] = useState<Book | null>(null);

  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return booksList;
    const q = searchQuery.toLowerCase().trim();
    return booksList.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        (b.isbn && b.isbn.toLowerCase().includes(q))
    );
  }, [booksList, searchQuery]);

  const handleOpenAdd = () => {
    setSelectedBookForEdit(null);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (book: Book) => {
    setSelectedBookForEdit(book);
    setIsAddEditModalOpen(true);
  };

  const handleOpenDetails = (book: Book) => {
    setSelectedBookForDetails(book);
  };

  const handleOpenDelete = (book: Book) => {
    setSelectedBookForDelete(book);
  };

  const handleConfirmDelete = (book: Book) => {
    setBooksList((prev) => prev.filter((b) => b.id !== book.id));
    setSelectedBookForDelete(null);
  };

  const handleSaveBook = (bookData: Partial<Book>) => {
    if (selectedBookForEdit) {
      setBooksList((prev) =>
        prev.map((b) =>
          b.id === selectedBookForEdit.id
            ? { ...b, ...bookData, updatedAt: new Date().toISOString() }
            : b
        )
      );
    } else {
      const newBook: Book = {
        id: `book-${Date.now()}`,
        title: bookData.title || 'Untitled',
        author: bookData.author || 'Unknown Author',
        isbn: bookData.isbn || '',
        actualPrice: bookData.actualPrice || 0,
        paidPrice: bookData.paidPrice || 0,
        bookType: bookData.bookType || 'PHYSICAL',
        language: bookData.language || 'English',
        shelfLocation: bookData.shelfLocation || '',
        coverImageUrl:
          bookData.coverImageUrl ||
          'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80',
        isCombination: bookData.isCombination || false,
        subBooks: bookData.subBooks || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setBooksList((prev) => [newBook, ...prev]);
    }
  };

  return (
    <SafeAreaView testID="library-screen" style={styles.safeContainer}>
      <View testID="library-appbar" style={styles.appBar}>
        <View style={styles.appBarMain}>
          <Pressable
            testID="library-logo-badge"
            style={styles.logoBadge}
            onPress={() => router.replace('/')}
          >
            <Ionicons name="book" size={20} color={Colors.accentPeach} />
          </Pressable>

          <View style={styles.titleColumn}>
            <Text testID="library-title" style={styles.appTitle}>Library Manager</Text>
            <Text testID="library-volume-count" style={styles.itemCountText}>
              {filteredBooks.length} {filteredBooks.length === 1 ? 'Volume' : 'Volumes'} Cataloged
            </Text>
          </View>
        </View>

        <View style={styles.toolbarControls}>
          <Pressable
            testID="library-search-toggle-button"
            style={[
              styles.iconActionButton,
              isSearchActive && styles.iconActionButtonActive,
            ]}
            onPress={() => {
              setIsSearchActive((prev) => !prev);
              if (isSearchActive) setSearchQuery('');
            }}
          >
            <Ionicons
              name={isSearchActive ? 'close' : 'search'}
              size={20}
              color={Colors.textNavy}
            />
          </Pressable>

          <Pressable
            testID="library-view-toggle-button"
            style={styles.iconActionButton}
            onPress={() => setViewMode((prev) => (prev === 'grid' ? 'list' : 'grid'))}
          >
            <MaterialCommunityIcons
              name={viewMode === 'grid' ? 'view-list' : 'view-grid'}
              size={20}
              color={Colors.textNavy}
            />
          </Pressable>
        </View>
      </View>

      {isSearchActive && (
        <View style={styles.searchBarWrapper}>
          <View style={styles.searchBarContainer}>
            <Ionicons name="search" size={18} color={Colors.textSlate} />
            <TextInput
              testID="library-search-input"
              style={styles.searchInput}
              placeholder="Search by title, author, or ISBN..."
              placeholderTextColor={Colors.textSlate}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <Pressable testID="library-search-clear-button" hitSlop={8} onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={Colors.textSlate} />
              </Pressable>
            )}
          </View>
        </View>
      )}

      <View style={styles.catalogArea}>
        {filteredBooks.length === 0 ? (
          <View testID="library-empty-state" style={styles.emptyContainer}>
            <View style={styles.emptyIllustrationCard}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="library-outline" size={64} color={Colors.accentPeach} />
              </View>
              <Text testID="library-empty-title" style={styles.emptyTitle}>Library is empty.</Text>
              <Text style={styles.emptySubtitle}>
                Add books to your personal collection with physical shelf locations or eBook references.
              </Text>
              <Pressable
                testID="library-empty-add-button"
                style={styles.emptyAddButton}
                onPress={handleOpenAdd}
              >
                <Ionicons name="add" size={18} color={Colors.white} />
                <Text style={styles.emptyAddButtonText}>Add First Book</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <FlatList
            testID="library-book-list"
            key={viewMode === 'grid' ? `grid-${defaultCols}` : 'list-1'}
            data={filteredBooks}
            numColumns={viewMode === 'grid' ? defaultCols : 1}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.flatListContent,
              viewMode === 'grid' && styles.gridFlatListContent,
            ]}
            renderItem={({ item }) => (
              <BookCard
                book={item}
                viewMode={viewMode}
                onPressDetails={handleOpenDetails}
                onPressEdit={handleOpenEdit}
                onPressDelete={handleOpenDelete}
              />
            )}
          />
        )}
      </View>

      <Pressable
        testID="library-fab-add-button"
        style={({ pressed }) => [
          styles.fab,
          { bottom: Math.max(24, insets.bottom + 16) },
          pressed && { transform: [{ scale: 0.95 }] },
        ]}
        onPress={handleOpenAdd}
      >
        <Ionicons name="add" size={32} color={Colors.accentCoral} />
      </Pressable>

      <AddEditBookModal
        visible={isAddEditModalOpen}
        bookToEdit={selectedBookForEdit}
        onClose={() => setIsAddEditModalOpen(false)}
        onSave={handleSaveBook}
      />

      <BookDetailsModal
        visible={!!selectedBookForDetails}
        book={selectedBookForDetails}
        onClose={() => setSelectedBookForDetails(null)}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
      />

      <DeleteConfirmDialog
        visible={!!selectedBookForDelete}
        book={selectedBookForDelete}
        onCancel={() => setSelectedBookForDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: Colors.bgCream,
  },
  appBar: {
    backgroundColor: Colors.bgSageMist,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    zIndex: 10,
  },
  appBarMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.textNavy,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.m3Card,
  },
  titleColumn: {
    justifyContent: 'center',
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textNavy,
    letterSpacing: -0.2,
  },
  itemCountText: {
    fontSize: 11,
    color: Colors.textSlate,
    fontWeight: '600',
  },
  toolbarControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconActionButton: {
    width: 38,
    height: 38,
    borderRadius: Radii.full,
    backgroundColor: Colors.bgCream,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  iconActionButtonActive: {
    backgroundColor: Colors.accentPeach,
  },
  searchBarWrapper: {
    backgroundColor: Colors.bgSageMist,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCreamCard,
    borderRadius: Radii.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textNavy,
    padding: 0,
  },
  catalogArea: {
    flex: 1,
  },
  flatListContent: {
    paddingVertical: 12,
    paddingBottom: 90,
  },
  gridFlatListContent: {
    paddingHorizontal: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyIllustrationCard: {
    backgroundColor: Colors.bgCreamCard,
    borderRadius: Radii.modal,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 32,
    alignItems: 'center',
    maxWidth: 440,
    width: '100%',
    ...Shadows.m3Card,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.bgSageMist,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textNavy,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSlate,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.accentCoral,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Radii.full,
    ...Shadows.m3Card,
  },
  emptyAddButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: Radii.card,
    backgroundColor: Colors.accentPeach,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
    ...Shadows.fab,
  },
});
