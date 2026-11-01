import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ActionSheetIOS } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Book } from '../types/book';
import { Colors, Shadows, Radii } from '../constants/theme';

interface BookCardProps {
  book: Book;
  onPressDetails: (book: Book) => void;
  onPressEdit: (book: Book) => void;
  onPressDelete: (book: Book) => void;
  viewMode?: 'grid' | 'list';
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onPressDetails,
  onPressEdit,
  onPressDelete,
  viewMode = 'grid',
}) => {
  const [menuVisible, setMenuVisible] = React.useState(false);
  const isGrid = viewMode === 'grid';

  const isPhysical = book.bookType === 'PHYSICAL';

  const handleOpenMenu = (e?: any) => {
    e?.stopPropagation?.();
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: book.title,
          message: `by ${book.author}`,
          options: ['Cancel', 'Show Details', 'Update Book', 'Delete Book'],
          destructiveButtonIndex: 3,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            onPressDetails(book);
          } else if (buttonIndex === 2) {
            onPressEdit(book);
          } else if (buttonIndex === 3) {
            onPressDelete(book);
          }
        }
      );
    } else {
      setMenuVisible((prev) => !prev);
    }
  };

  return (
    <View
      testID={`book-card-${book.id}`}
      style={[styles.cardContainer, isGrid ? styles.gridCard : styles.listCard]}
    >
      <Pressable
        testID={`book-card-pressable-${book.id}`}
        android_ripple={{ color: 'rgba(26, 33, 48, 0.08)', foreground: true }}
        style={[styles.pressableContent, !isGrid && styles.listPressableContent]}
        onPress={() => onPressDetails(book)}
      >
        {/* Book Cover */}
        <View
          testID={`book-card-cover-${book.id}`}
          style={isGrid ? styles.coverContainerGrid : styles.coverContainerList}
        >
          {book.coverImageUrl ? (
            <Image
              testID={`book-card-image-${book.id}`}
              source={{ uri: book.coverImageUrl }}
              style={styles.coverImage}
              contentFit="cover"
              transition={200}
              placeholder={require('../assets/splash-icon.png')}
            />
          ) : (
            <View style={styles.coverFallback}>
              <Ionicons name="book-outline" size={32} color={Colors.accentPeach} />
            </View>
          )}

          {book.isCombination && (
            <View
              testID={`book-card-combo-tag-${book.id}`}
              style={styles.comboFloatingTag}
            >
              <MaterialCommunityIcons name="layers-triple-outline" size={12} color={Colors.textNavy} />
              <Text style={styles.comboFloatingText}>Combo ({book.subBooks?.length || 0})</Text>
            </View>
          )}
        </View>

        {/* Book Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.headerRow}>
            <Text
              testID={`book-card-title-${book.id}`}
              style={styles.title}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {book.title}
            </Text>
            <Pressable
              testID={`book-card-menu-button-${book.id}`}
              hitSlop={10}
              onPress={handleOpenMenu}
              style={styles.menuButton}
            >
              <Ionicons name="ellipsis-vertical" size={18} color={Colors.textNavy} />
            </Pressable>
          </View>

          <Text
            testID={`book-card-author-${book.id}`}
            style={styles.author}
            numberOfLines={1}
          >
            by {book.author}
          </Text>

          {book.shelfLocation && (
            <View style={styles.shelfRow}>
              <Ionicons name="bookmark-outline" size={13} color={Colors.textSlate} />
              <Text
                testID={`book-card-shelf-${book.id}`}
                style={styles.shelfText}
                numberOfLines={1}
              >
                {book.shelfLocation}
              </Text>
            </View>
          )}

          {/* Pricing Info */}
          <View style={styles.pricingRow}>
            <Text
              testID={`book-card-paid-price-${book.id}`}
              style={styles.paidPrice}
            >
              ${book.paidPrice.toFixed(2)}
            </Text>
            {book.actualPrice > book.paidPrice && (
              <Text
                testID={`book-card-actual-price-${book.id}`}
                style={styles.actualPrice}
              >
                ${book.actualPrice.toFixed(2)}
              </Text>
            )}
          </View>

          {/* Metadata Chips */}
          <View style={styles.chipsRow}>
            {/* Type Badge */}
            <View
              testID={`book-card-type-chip-${book.id}`}
              style={[
                styles.chip,
                isPhysical ? styles.chipPhysical : styles.chipEbook,
              ]}
            >
              <MaterialCommunityIcons
                name={isPhysical ? 'book-open-page-variant' : 'tablet-dashboard'}
                size={12}
                color={isPhysical ? Colors.textNavy : Colors.white}
              />
              <Text
                style={[
                  styles.chipText,
                  isPhysical ? styles.chipTextPhysical : styles.chipTextEbook,
                ]}
              >
                {book.bookType}
              </Text>
            </View>

            {/* Language Badge */}
            <View
              testID={`book-card-language-chip-${book.id}`}
              style={[styles.chip, styles.chipLanguage]}
            >
              <Ionicons name="globe-outline" size={12} color={Colors.textNavy} />
              <Text style={[styles.chipText, styles.chipTextLanguage]}>
                {book.language}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>

      {/* Contextual Action Menu Dropdown */}
      {menuVisible && (
        <View
          testID={`book-card-context-menu-${book.id}`}
          style={styles.contextMenu}
        >
          <Pressable
            testID={`book-card-menu-item-details-${book.id}`}
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              onPressDetails(book);
            }}
          >
            <Ionicons name="information-circle-outline" size={16} color={Colors.textNavy} />
            <Text style={styles.menuItemText}>Show Details</Text>
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable
            testID={`book-card-menu-item-edit-${book.id}`}
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              onPressEdit(book);
            }}
          >
            <Ionicons name="pencil-outline" size={16} color={Colors.textNavy} />
            <Text style={styles.menuItemText}>Update Book</Text>
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable
            testID={`book-card-menu-item-delete-${book.id}`}
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              onPressDelete(book);
            }}
          >
            <Ionicons name="trash-outline" size={16} color={Colors.danger} />
            <Text style={[styles.menuItemText, { color: Colors.danger }]}>Delete Book</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: Colors.bgCreamCard,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
    position: 'relative',
    ...Shadows.m3Card,
  },
  gridCard: {
    flex: 1,
    margin: 8,
    minWidth: 260,
  },
  listCard: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  pressableContent: {
    padding: 12,
  },
  listPressableContent: {
    flexDirection: 'row',
  },
  coverContainerGrid: {
    width: '100%',
    height: 190,
    borderRadius: Radii.sm,
    overflow: 'hidden',
    backgroundColor: Colors.bgSageMist,
    position: 'relative',
    marginBottom: 10,
  },
  coverContainerList: {
    width: 100,
    height: 140,
    borderRadius: Radii.sm,
    overflow: 'hidden',
    backgroundColor: Colors.bgSageMist,
    position: 'relative',
    marginRight: 14,
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
  comboFloatingTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(253, 248, 236, 0.94)',
    borderRadius: Radii.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  comboFloatingText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textNavy,
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textNavy,
    lineHeight: 21,
    flex: 1,
  },
  menuButton: {
    padding: 4,
    borderRadius: Radii.full,
  },
  author: {
    fontSize: 13,
    color: Colors.textSlate,
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 6,
  },
  shelfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  shelfText: {
    fontSize: 11,
    color: Colors.textSlate,
    fontStyle: 'italic',
    flex: 1,
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 8,
  },
  paidPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textNavy,
  },
  actualPrice: {
    fontSize: 12,
    color: Colors.textSlate,
    textDecorationLine: 'line-through',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
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
  chipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  chipTextPhysical: {
    color: Colors.textNavy,
  },
  chipTextEbook: {
    color: Colors.white,
  },
  chipTextLanguage: {
    color: Colors.textNavy,
  },
  contextMenu: {
    position: 'absolute',
    top: 36,
    right: 12,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    width: 150,
    zIndex: 999,
    ...Shadows.m3Dialog,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  menuItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textNavy,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
  },
});

