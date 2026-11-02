# Personal Library Manager

A cross-platform personal library catalog application built with **React Native (Expo)**, **Material Design 3**, and **TypeScript**.

Developed by **mrpcodecraft**.

---

## Features

- **Book Catalog Management:** Add, edit, view, and delete books in your collection.
- **Multi-Volume & Box Set Support:** Track bundled anthologies and sub-books with individual volume details.
- **ISBN Barcode Scanning:** Scan book barcodes via device camera (with torch toggle) or enter ISBNs manually to autofill metadata.
- **Dynamic Search & Filtering:** Filter books instantly by title, author, or ISBN.
- **Flexible Views:** Toggle between grid and list layouts with responsive multi-column layouts across phones, tablets, and desktop.
- **Pricing & Shelf Tracking:** Keep track of retail vs. purchase prices, savings, physical shelf locations, and book formats (Physical / eBook).

---

## Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- npm or yarn

### Installation

```bash
git clone <repo-url>
cd personal_library_manager
npm install
```

### Running the App

```bash
# Start development server
npm start

# Run in web browser
npm run web

# Start with tunnel (for physical device testing via Expo Go)
npm run start:tunnel
```

To run on a mobile device, scan the QR code generated in your terminal with **Expo Go** (Android) or the iOS Camera app (iOS).

---

## Testing

The project includes an end-to-end test suite using **Playwright**, testing core flows across mobile and desktop viewports:

```bash
# Run tests headlessly
npm test

# Run tests in interactive UI mode
npm run test:ui

# View test report
npm run test:report
```

---

## Project Structure

```
├── app/
│   ├── _layout.tsx              # Root layout & navigation container
│   ├── index.tsx                # Welcome screen with expo-splash-screen initialization
│   └── library.tsx              # Library catalog screen (toolbar, list/grid, search, FAB)
├── components/
│   ├── BookCard.tsx             # Book card with cover, chips, and context menu
│   ├── AddEditBookModal.tsx     # Add / Edit dialog with barcode scanner launcher
│   ├── BookDetailsModal.tsx     # Metadata showcase, price comparison & sub-books
│   ├── DeleteConfirmDialog.tsx  # Confirmation dialog before deletion
│   └── BarcodeScannerModal.tsx  # CameraView ISBN scanner with torch & laser targeting
├── constants/
│   ├── theme.ts                 # Design tokens, shadows, and radii
│   └── sampleBooks.ts           # Initial catalog dataset and lookup utilities
├── services/
│   └── storage.ts               # Storage interface & persistence contract
├── types/
│   └── book.ts                  # TypeScript data contracts (Book, SubBook, BookType)
├── e2e/
│   └── library-app.spec.ts      # Playwright multi-device end-to-end test suite
├── scripts/
│   └── server.js                # Local web server for E2E testing
└── playwright.config.ts         # Playwright multi-device configuration
```

---

## License

MIT
