# Library Manager

An offline-first personal library management application built with **React Native (Expo)**, **Material Design 3 (Material You)**, and **TypeScript**.

Developed by **mrpcodecraft**.

---

## 🎨 Design & UI Architecture

* **Design Language:** Modern Material Design 3 (Material You)
* **Surface Architecture:** Eliminates heavy solid borders; continuous rounded corners (`rounded-2xl` for cards, `rounded-3xl` for modals and emblems).
* **Color Palette:**
  * Canvas Surface: Soft Warm Cream (`#FDF8EC`)
  * Card Surface: Tonal Cream Card (`#F6F0E2`) with hairline border (`#E2DDD1`)
  * Toolbar / AppBar: Soothing Sage Mist (`#E4EBE2`)
  * Accent / Badges: Warm Coral (`#F2785C`) & Mellow Peach (`#F7B08A`)
  * Typography: Deep Charcoal Navy (`#1A2130`) & Slate Gray (`#5A6578`)
* **Supported Platforms:** Android (Phone & Tablet), iOS (iPhone & iPad), and Progressive Web (Expo Web / React Native for Web).

---

## 🧪 Automated Testing (Single Unified Approach)

The application uses **Expo (`jest-expo`)** and **React Native Testing Library** as its single, complete automated testing framework. It runs 100% programmatically and headlessly on your machine with zero external device or browser dependencies.

### Run Automated Tests

```bash
npm test
```

### Test Suites Overview:

1. **`__tests__/AppLoads.test.tsx` (App loads):**
   * Splash Screen branding, squircle emblem, tagline, progress bar, and developer attribution badge.
   * Library Main Screen container, AppBar, brand title, volume count, search toggle, view toggle, and 56dp FAB button.
   * Multi-device responsive layout adaptation across **Mobile Phone (iPhone / Android)**, **Tablet (iPad)**, and **Desktop Web Browser** viewports.

2. **`__tests__/PrefilledData.test.tsx` (App loads with prefilled data):**
   * Verifies the initial catalog mounts all 5 prefilled books from the centralized dataset.
   * Confirms volume counter displays `5 Volumes Cataloged`.
   * Verifies all book cards and headers are rendered with unique identifiers.

3. **`__tests__/DataIntegrity.test.tsx` (All data has been loaded and correct):**
   * Validates exact field matching for every book: Title, Author, Shelf location, Paid Price, Retail MRP, Book Type chips (`PHYSICAL` in peach / `EBOOK` in coral), and Language chips (`English` / `Hindi`).
   * Validates combination volumes: The Lord of the Rings anthology renders combination tag and bundles all 3 sub-books with individual titles and authors.
   * Validates Book Details modal metadata, savings calculations (`$20.01 (27%)`), ISBN, and catalog ID.

4. **`__tests__/Functionality.test.tsx` (Add/Edit, delete, barcode scanner, buttons):**
   * **Search & Filter:** Live real-time query filtering by title and author; clearing search restores full catalog.
   * **View & Empty State:** Grid/List view mode toggle, empty state preview toggle with illustration, and "Add First Book" CTA.
   * **Add Book:** FAB opens dialog, validates inputs, saves new book, and updates catalog count to 6 volumes.
   * **Edit Book:** Form prefilled with book attributes, edits title in-place, and updates timestamps.
   * **Delete Book:** M3 Confirmation Dialog with SQL preview (`DELETE FROM books WHERE id = ?`), atomic deletion, and catalog update.
   * **Barcode Scanner:** Launches camera viewfinder with laser targeting, torch toggle, and preset ISBN auto-population.
   * **Device Diagnostics:** Toolbar button opens device verification runner displaying platform metrics.

---

## 📱 Manual Testing with Expo Go (Optional)

To preview and interact with the application live on physical or virtual devices:

```bash
# Start server for Expo Go
npm start

# Or with a tunnel (for cellular or guest Wi-Fi)
npm run start:tunnel

# Or launch directly in your browser
npm run web
```

* **iPhone & iPad:** Scan the terminal QR code with the iOS Camera app -> Tap **"Open in Expo Go"**.
* **Android Phones & Tablets:** Open the Expo Go app -> Tap **"Scan QR code"**.

---

## 📁 Project Structure

```
├── app/
│   ├── _layout.tsx              # Root layout & navigation container
│   ├── index.tsx                # Splash Screen with book squircle emblem & progress track
│   └── library.tsx              # Library catalog screen (toolbar, list/grid, search, FAB)
├── components/
│   ├── BookCard.tsx             # M3 Book card with cover, chips, and ActionSheetIOS / M3 menu
│   ├── AddEditBookModal.tsx     # Add / Edit dialog with barcode scanner launcher
│   ├── BookDetailsModal.tsx     # Full metadata showcase, price comparison & sub-books
│   ├── DeleteConfirmDialog.tsx  # M3 Confirmation dialog before deletion
│   ├── BarcodeScannerModal.tsx  # CameraView ISBN scanner with torch & laser targeting
│   └── DeviceTestModal.tsx      # On-device verification runner & diagnostics suite
├── constants/
│   ├── theme.ts                 # Material Design 3 color tokens, shadows, and radii
│   └── sampleBooks.ts           # Centralized catalog dataset and lookup utilities
├── types/
│   └── book.ts                  # TypeScript data contracts (Book, SubBook, BookType)
├── db/
│   └── schema.ts                # SQLite schema specifications & DDL statements
└── __tests__/                   # Unified Expo / Jest automated test suites
    ├── AppLoads.test.tsx
    ├── PrefilledData.test.tsx
    ├── DataIntegrity.test.tsx
    └── Functionality.test.tsx
```
