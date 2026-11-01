import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  SafeAreaView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Book } from '../types/book';
import { SAMPLE_BOOKS } from '../constants/sampleBooks';
import { Colors, Shadows, Radii, Breakpoints } from '../constants/theme';
import { BookCard } from '../components/BookCard';
import { AddEditBookModal } from '../components/AddEditBookModal';
import { BookDetailsModal } from '../components/BookDetailsModal';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';

const STORAGE_KEY = '@library_books';

export default function LibraryScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Layout responsiveness
  const isWebOrTablet = width >= Breakpoints.tablet;
  const isDesktop = width >= Breakpoints.desktop;
  const defaultCols = isDesktop ? 3 : isWebOrTablet ? 2 : 1;

  // Visual state
  const [booksList, setBooksList] = useState<Book[]>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return SAMPLE_BOOKS;
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(booksList));
      } catch {}
    }
  }, [booksList]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(isWebOrTablet ? 'grid' : 'list');

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [selectedBookForEdit, setSelectedBookForEdit] = useState<Book | null>(null);
  const [selectedBookForDetails, setSelectedBookForDetails] = useState<Book | null>(null);
  const [selectedBookForDelete, setSelectedBookForDelete] = useState<Book | null>(null);

  // Filter catalog
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

  // Action handlers
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
      {/* Top Header / Toolbar */}
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
          {/* Search Toggle Icon */}
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

          {/* View Toggle (Grid / List) for Web / Tablet */}
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

      {/* Inline Live-Filtering Search Input */}
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

      {/* Main Catalog View */}
      <View style={styles.catalogArea}>
        {filteredBooks.length === 0 ? (
          /* Empty State */
          <View testID="library-empty-state" style={styles.emptyContainer}>
            <View style={styles.emptyIllustrationCard}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="library-outline" size={64} color={Colors.accentPeach} />
              </View>
              <Text testID="library-empty-title" style={styles.emptyTitle}>Library is empty.</Text>
              <Text style={styles.emptySubtitle}>
                Add books to your private local-first collection with physical shelf locations or eBook references.
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
          /* Populated FlatList Grid / List */
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

      {/* Floating Action Button */}
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

      {/* Add / Edit Book Modal */}
      <AddEditBookModal
        visible={isAddEditModalOpen}
        bookToEdit={selectedBookForEdit}
        onClose={() => setIsAddEditModalOpen(false)}
        onSave={handleSaveBook}
      />

      {/* Book Details Modal */}
      <BookDetailsModal
        visible={!!selectedBookForDetails}
        book={selectedBookForDetails}
        onClose={() => setSelectedBookForDetails(null)}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
      />

      {/* M3 Delete Confirmation Dialog */}
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
    backgroundColor: Colors.bgCream, // #FDF8EC
  },
  appBar: {
    backgroundColor: Colors.bgSageMist, // #E4EBE2
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
    bottom: 24, // bottom-6 (24dp)
    right: 24,  // right-6 (24dp)
    width: 56,  // 56dp
    height: 56, // 56dp
    borderRadius: Radii.card, // rounded-2xl
    backgroundColor: Colors.accentPeach, // #F7B08A
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
    ...Shadows.fab,
  },
});

