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

## 🧪 Automated Testing (Playwright Multi-Device E2E)

The application uses **Playwright** as its single, complete End-to-End automated testing framework. It executes all user flows programmatically across simulated Android, Apple iOS, Apple iPadOS, and Desktop Web browsers.

### Run Automated Tests

```bash
# Run all 44 tests across all 4 target devices headlessly
npm test

# Run tests with interactive Playwright UI
npm run test:ui

# View latest HTML test report
npm run test:report
```

### Multi-Device Targets:
- **Apple iPhone (iOS):** `iPhone 14` viewport (390 × 844, 3x DPR, touch enabled)
- **Apple iPad (iPadOS):** `iPad Pro 11` viewport (834 × 1194, 2x DPR, touch enabled)
- **Android Phone (Android OS):** `Pixel 7` viewport (412 × 915, 2.625x DPR, touch enabled)
- **Desktop Web:** Desktop viewport (1280 × 800)

### 11 Executed User Journeys per Device:
1. **App Initial Launch:** Splash Screen branding, squircle emblem, tagline, progress track, and navigation to catalog.
2. **Catalog Loading:** AppBar, volume counter (`5 Volumes Cataloged`), search bar, layout controls, and FAB button.
3. **Data Integrity:** Validates exact attributes for all 5 sample books (Title, Author, Shelf location, Paid/Retail prices, Format badges, and Language chips).
4. **Book Details Modal:** Metadata display, calculated savings percentage, ISBN, Catalog ID, and bundled sub-books breakdown.
5. **Search Filtering:** Dynamic query filtering by title, author, and ISBN, plus clear button restoration.
6. **Layout Toggle & Empty State:** Grid vs List view switching, empty state illustration preview, and "Add First Book" CTA button.
7. **Add Book Flow:** FAB click, form filling, format/language chip selection, catalog update to 6 volumes.
8. **Edit Book Flow:** Context menu (`⋮`), pre-filled form verification, editing title/shelf, and in-place catalog update.
9. **Delete Book Flow:** M3 Confirmation Dialog with SQL preview, operation cancellation verification, and atomic deletion.
10. **Barcode Scanner Subsystem:** Camera viewfinder, laser targeting guideline, torch toggle, and preset ISBN auto-population.
11. **Device Diagnostics Modal:** Hardware metrics inspection and live on-device assertion suite.

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
│   ├── BookCard.tsx             # M3 Book card with cover, chips, and context menu
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
├── e2e/
│   └── library-app.spec.ts      # Playwright multi-device end-to-end test suite
├── scripts/
│   └── server.js                # Local web server for E2E testing
└── playwright.config.ts         # Playwright multi-device configuration
```
