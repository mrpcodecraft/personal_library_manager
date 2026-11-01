import { test, expect, Locator } from '@playwright/test';
import { SAMPLE_BOOKS, SAMPLE_BARCODE_PRESETS } from '../constants/sampleBooks';

/**
 * Universal click helper that reliably triggers events across both desktop
 * pointer devices and touch-emulated mobile devices (iPhone, iPad, Android).
 */
async function press(locator: Locator) {
  await locator.scrollIntoViewIfNeeded();
  try {
    await locator.dispatchEvent('click');
  } catch {
    await locator.click({ force: true });
  }
}

test.describe('Library Manager - Complete End-to-End Automated Testing', () => {

  test('1. App Initial Launch: loads Splash Screen, checks branding, and navigates to Library', async ({ page }) => {
    await page.goto('/');

    // Verify Splash Screen elements
    await expect(page.locator('[data-testid="splash-screen"]')).toBeVisible();
    await expect(page.locator('[data-testid="splash-emblem"]')).toBeVisible();
    await expect(page.locator('[data-testid="splash-headline"]')).toHaveText('Library Manager');
    await expect(page.locator('[data-testid="splash-tagline"]')).toHaveText('Your personal reading haven');
    await expect(page.locator('[data-testid="splash-progress-track"]')).toBeVisible();
    await expect(page.locator('[data-testid="splash-author-badge"]')).toContainText('Developed by mrpcodecraft');

    // Click "Enter Library" button to transition
    const enterBtn = page.locator('[data-testid="splash-enter-button"]');
    await expect(enterBtn).toBeVisible();
    await press(enterBtn);

    // Verify transition to main Library screen
    await expect(page.locator('[data-testid="library-screen"]')).toBeVisible({ timeout: 10000 });
  });

  test('2. Catalog Loading: verifies AppBar, brand title, volume counter, and 5 book cards', async ({ page }) => {
    await page.goto('/library');
    await page.waitForSelector('[data-testid="library-screen"]', { timeout: 15000 });

    // AppBar & Branding
    await expect(page.locator('[data-testid="library-appbar"]')).toBeVisible();
    await expect(page.locator('[data-testid="library-logo-badge"]')).toBeVisible();
    await expect(page.locator('[data-testid="library-title"]')).toHaveText('Library Manager');

    // Volume counter
    const volumeCount = page.locator('[data-testid="library-volume-count"]');
    await expect(volumeCount).toHaveText('5 Volumes Cataloged');

    // Controls & FAB
    await expect(page.locator('[data-testid="library-search-toggle-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="library-view-toggle-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="library-empty-preview-toggle-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="library-device-test-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="library-fab-add-button"]')).toBeVisible();

    // Verify all 5 sample book cards are mounted
    for (const book of SAMPLE_BOOKS) {
      await expect(page.locator(`[data-testid="book-card-${book.id}"]`)).toBeVisible();
    }
  });

  test('3. Data Integrity: validates exact attributes for all 5 books in the catalog', async ({ page }) => {
    await page.goto('/library');
    await page.waitForSelector('[data-testid="library-screen"]', { timeout: 15000 });

    for (const book of SAMPLE_BOOKS) {
      const card = page.locator(`[data-testid="book-card-${book.id}"]`);
      await expect(card).toBeVisible();

      // Title & Author
      await expect(page.locator(`[data-testid="book-card-title-${book.id}"]`)).toHaveText(book.title);
      await expect(page.locator(`[data-testid="book-card-author-${book.id}"]`)).toContainText(book.author);

      // Shelf Location
      if (book.shelfLocation) {
        await expect(page.locator(`[data-testid="book-card-shelf-${book.id}"]`)).toHaveText(book.shelfLocation);
      }

      // Paid Price
      await expect(page.locator(`[data-testid="book-card-paid-price-${book.id}"]`)).toContainText(book.paidPrice.toFixed(2));

      // Retail Price (if discounted)
      if (book.actualPrice > book.paidPrice) {
        await expect(page.locator(`[data-testid="book-card-actual-price-${book.id}"]`)).toContainText(book.actualPrice.toFixed(2));
      }

      // Format chip (PHYSICAL / EBOOK)
      await expect(page.locator(`[data-testid="book-card-type-chip-${book.id}"]`)).toContainText(book.bookType);

      // Language chip
      await expect(page.locator(`[data-testid="book-card-language-chip-${book.id}"]`)).toContainText(book.language);

      // Combination tag if applicable
      if (book.isCombination) {
        await expect(page.locator(`[data-testid="book-card-combo-tag-${book.id}"]`)).toBeVisible();
      }
    }
  });

  test('4. Book Details Modal: verifies full book metadata, calculated savings, and bundled sub-books', async ({ page }) => {
    await page.goto('/library');
    await page.waitForSelector('[data-testid="library-screen"]', { timeout: 15000 });

    // Click on the Lord of the Rings anthology card
    const lotrBook = SAMPLE_BOOKS.find((b) => b.isCombination)!;
    const lotrCardPressable = page.locator(`[data-testid="book-card-pressable-${lotrBook.id}"]`);
    await press(lotrCardPressable);

    // Details modal opens
    const detailsModal = page.locator('[data-testid="book-details-modal"]');
    await expect(detailsModal).toBeVisible();

    // Verify Title & Author
    await expect(page.locator('[data-testid="book-details-title"]')).toHaveText(lotrBook.title);
    await expect(page.locator('[data-testid="book-details-author"]')).toContainText(lotrBook.author);
    await expect(page.locator('[data-testid="book-details-shelf"]')).toHaveText(lotrBook.shelfLocation!);

    // Verify Pricing & Calculated Savings ($75.00 retail - $54.99 paid = $20.01 (27%))
    await expect(page.locator('[data-testid="book-details-retail-price"]')).toHaveText(`$${lotrBook.actualPrice.toFixed(2)}`);
    await expect(page.locator('[data-testid="book-details-paid-price"]')).toHaveText(`$${lotrBook.paidPrice.toFixed(2)}`);
    await expect(page.locator('[data-testid="book-details-savings"]')).toContainText('$20.01 (27%)');

    // Verify ISBN & Catalog ID
    await expect(page.locator('[data-testid="book-details-isbn"]')).toHaveText(lotrBook.isbn!);
    await expect(page.locator('[data-testid="book-details-catalog-id"]')).toHaveText(lotrBook.id);

    // Verify Bundled Sub-Books Container
    await expect(page.locator('[data-testid="book-details-sub-books-container"]')).toBeVisible();
    for (let i = 0; i < lotrBook.subBooks.length; i++) {
      const sub = lotrBook.subBooks[i];
      const subItem = page.locator(`[data-testid="book-details-sub-book-${i}"]`);
      await expect(subItem).toBeVisible();
      await expect(subItem).toContainText(sub.title);
    }

    // Close details modal
    await press(page.locator('[data-testid="book-details-close-button"]'));
    await expect(detailsModal).toBeHidden();
  });

  test('5. Search Filtering: tests live dynamic filtering by title, author, and ISBN, then clearing query', async ({ page }) => {
    await page.goto('/library');
    await page.waitForSelector('[data-testid="library-screen"]', { timeout: 15000 });

    // Open Search Bar
    await press(page.locator('[data-testid="library-search-toggle-button"]'));
    const searchInput = page.locator('[data-testid="library-search-input"]');
    await expect(searchInput).toBeVisible();

    // Search by Author "Premchand"
    await searchInput.fill('Premchand');
    await expect(page.locator('[data-testid="book-card-e4d5f6a1-b2c3-4d4e-1f5a-6b7c8d9e0f1a"]')).toBeVisible(); // Godaan
    await expect(page.locator('[data-testid="book-card-b1a2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d"]')).toBeHidden(); // Monte Cristo
    await expect(page.locator('[data-testid="library-volume-count"]')).toHaveText('1 Volume Cataloged');

    // Clear search using clear icon button
    await press(page.locator('[data-testid="library-search-clear-button"]'));
    await expect(page.locator('[data-testid="book-card-b1a2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d"]')).toBeVisible();
    await expect(page.locator('[data-testid="library-volume-count"]')).toHaveText('5 Volumes Cataloged');

    // Search by ISBN "9780061120084" (To Kill a Mockingbird)
    await searchInput.fill('9780061120084');
    await expect(page.locator('[data-testid="book-card-c2b3d4e5-f6a1-4b2c-9d3e-4f5a6b7c8d9e"]')).toBeVisible();
    await expect(page.locator('[data-testid="book-card-f5e6a1b2-c3d4-4e5f-2a6b-7c8d9e0f1a2b"]')).toBeHidden();

    // Clear and close search
    await searchInput.fill('');
    await press(page.locator('[data-testid="library-search-toggle-button"]'));
    await expect(searchInput).toBeHidden();
  });

  test('6. View Layout Toggle & Empty State Preview: toggles grid/list and tests empty state CTA', async ({ page }) => {
    await page.goto('/library');
    await page.waitForSelector('[data-testid="library-screen"]', { timeout: 15000 });

    // Toggle view mode (Grid <-> List)
    await press(page.locator('[data-testid="library-view-toggle-button"]'));
    await expect(page.locator('[data-testid="library-book-list"]')).toBeVisible();

    // Toggle Empty State Preview
    await press(page.locator('[data-testid="library-empty-preview-toggle-button"]'));
    const emptyState = page.locator('[data-testid="library-empty-state"]');
    await expect(emptyState).toBeVisible();
    await expect(page.locator('[data-testid="library-empty-title"]')).toHaveText('Library is empty.');

    // Click "Add First Book" CTA inside Empty State
    const emptyAddBtn = page.locator('[data-testid="library-empty-add-button"]');
    await expect(emptyAddBtn).toBeVisible();
    await press(emptyAddBtn);

    // Verify Add Book modal opens from empty CTA
    const addModal = page.locator('[data-testid="add-edit-modal"]');
    await expect(addModal).toBeVisible();

    // Cancel modal
    await press(page.locator('[data-testid="add-edit-close-button"]'));
    await expect(addModal).toBeHidden();

    // Restore catalog view
    await press(page.locator('[data-testid="library-empty-preview-toggle-button"]'));
    await expect(page.locator('[data-testid="library-book-list"]')).toBeVisible();
  });

  test('7. Add Book Flow: creates a new book, fills all attributes, and updates catalog', async ({ page }) => {
    await page.goto('/library');
    await page.waitForSelector('[data-testid="library-screen"]', { timeout: 15000 });

    // Click FAB + to open Add Book Modal
    await press(page.locator('[data-testid="library-fab-add-button"]'));
    const addModal = page.locator('[data-testid="add-edit-modal"]');
    await expect(addModal).toBeVisible();
    await expect(page.locator('[data-testid="add-edit-title"]')).toHaveText('Add New Book');

    // Fill form attributes
    await page.locator('[data-testid="input-book-title"]').fill('Atomic Habits');
    await page.locator('[data-testid="input-book-author"]').fill('James Clear');
    await page.locator('[data-testid="input-book-isbn"]').fill('9780735211292');
    await page.locator('[data-testid="input-book-shelf"]').fill('Shelf D - Self Improvement #01');
    await page.locator('[data-testid="input-book-actual-price"]').fill('27.00');
    await page.locator('[data-testid="input-book-paid-price"]').fill('18.50');

    // Toggle eBook segment
    await press(page.locator('[data-testid="segment-type-ebook"]'));
    await page.locator('[data-testid="input-book-language"]').fill('English');

    // Submit form: "Add to Catalog"
    await press(page.locator('[data-testid="button-save-book"]'));
    await expect(addModal).toBeHidden();

    // Verify volume counter incremented from 5 to 6
    await expect(page.locator('[data-testid="library-volume-count"]')).toHaveText('6 Volumes Cataloged');

    // Verify new book card is present in catalog
    await expect(page.locator('text=Atomic Habits')).toBeVisible();
    await expect(page.locator('text=by James Clear')).toBeVisible();

    // Verify data persistence after page reload
    await page.reload();
    await page.waitForSelector('[data-testid="library-screen"]', { timeout: 15000 });
    await expect(page.locator('[data-testid="library-volume-count"]')).toHaveText('6 Volumes Cataloged');
    await expect(page.locator('text=Atomic Habits')).toBeVisible();
    await expect(page.locator('text=by James Clear')).toBeVisible();
  });

  test('8. Edit Book Flow: pre-fills attributes, modifies title and shelf, and updates card in-place', async ({ page }) => {
    await page.goto('/library');
    await page.waitForSelector('[data-testid="library-screen"]', { timeout: 15000 });

    const targetBook = SAMPLE_BOOKS[0]; // The Count of Monte Cristo

    // Open context action menu (⋮)
    await press(page.locator(`[data-testid="book-card-menu-button-${targetBook.id}"]`));
    const contextMenu = page.locator(`[data-testid="book-card-context-menu-${targetBook.id}"]`);
    await expect(contextMenu).toBeVisible();

    // Click "Update Book"
    await press(page.locator(`[data-testid="book-card-menu-item-edit-${targetBook.id}"]`));

    // Verify modal opens in Update mode
    const editModal = page.locator('[data-testid="add-edit-modal"]');
    await expect(editModal).toBeVisible();
    await expect(page.locator('[data-testid="add-edit-title"]')).toHaveText('Update Book');

    // Verify prefilled values
    await expect(page.locator('[data-testid="input-book-title"]')).toHaveValue(targetBook.title);
    await expect(page.locator('[data-testid="input-book-author"]')).toHaveValue(targetBook.author);

    // Modify Title and Shelf location
    await page.locator('[data-testid="input-book-title"]').fill('The Count of Monte Cristo (Anniversary Edition)');
    await page.locator('[data-testid="input-book-shelf"]').fill('Vault - Collector Shelf #88');

    // Save changes
    await press(page.locator('[data-testid="button-save-book"]'));
    await expect(editModal).toBeHidden();

    // Verify card reflects updated title and shelf location in catalog
    await expect(page.locator(`[data-testid="book-card-title-${targetBook.id}"]`)).toHaveText('The Count of Monte Cristo (Anniversary Edition)');
    await expect(page.locator(`[data-testid="book-card-shelf-${targetBook.id}"]`)).toHaveText('Vault - Collector Shelf #88');

    // Verify data persistence after page reload
    await page.reload();
    await page.waitForSelector('[data-testid="library-screen"]', { timeout: 15000 });
    await expect(page.locator(`[data-testid="book-card-title-${targetBook.id}"]`)).toHaveText('The Count of Monte Cristo (Anniversary Edition)');
    await expect(page.locator(`[data-testid="book-card-shelf-${targetBook.id}"]`)).toHaveText('Vault - Collector Shelf #88');
  });

  test('9. Delete Book Flow: verifies M3 Confirmation Dialog, cancellation, and atomic deletion', async ({ page }) => {
    await page.goto('/library');
    await page.waitForSelector('[data-testid="library-screen"]', { timeout: 15000 });

    const targetBook = SAMPLE_BOOKS[1]; // To Kill a Mockingbird

    // Open action menu and click Delete Book
    await press(page.locator(`[data-testid="book-card-menu-button-${targetBook.id}"]`));
    await press(page.locator(`[data-testid="book-card-menu-item-delete-${targetBook.id}"]`));

    // Delete confirmation dialog mounts
    const deleteDialog = page.locator('[data-testid="delete-confirm-dialog"]');
    await expect(deleteDialog).toBeVisible();
    await expect(page.locator('[data-testid="delete-confirm-title"]')).toHaveText('Delete Book?');
    await expect(page.locator('[data-testid="delete-confirm-message"]')).toContainText(`"${targetBook.title}"`);
    await expect(page.locator('[data-testid="delete-confirm-sql-preview"]')).toBeVisible();

    // Step 1: Click Cancel -> book must NOT be deleted
    await press(page.locator('[data-testid="delete-confirm-cancel-button"]'));
    await expect(deleteDialog).toBeHidden();
    await expect(page.locator(`[data-testid="book-card-${targetBook.id}"]`)).toBeVisible();
    await expect(page.locator('[data-testid="library-volume-count"]')).toHaveText('5 Volumes Cataloged');

    // Step 2: Open dialog again and Confirm Delete
    await press(page.locator(`[data-testid="book-card-menu-button-${targetBook.id}"]`));
    await press(page.locator(`[data-testid="book-card-menu-item-delete-${targetBook.id}"]`));
    await expect(deleteDialog).toBeVisible();

    await press(page.locator('[data-testid="delete-confirm-button"]'));
    await expect(deleteDialog).toBeHidden();

    // Verify book is atomically removed and volume count decreases to 4
    await expect(page.locator(`[data-testid="book-card-${targetBook.id}"]`)).toBeHidden();
    await expect(page.locator('[data-testid="library-volume-count"]')).toHaveText('4 Volumes Cataloged');

    // Verify data persistence after page reload
    await page.reload();
    await page.waitForSelector('[data-testid="library-screen"]', { timeout: 15000 });
    await expect(page.locator(`[data-testid="book-card-${targetBook.id}"]`)).toBeHidden();
    await expect(page.locator('[data-testid="library-volume-count"]')).toHaveText('4 Volumes Cataloged');
  });

  test('10. Barcode Scanner Subsystem: tests viewfinder, laser line, torch toggle, and ISBN auto-population', async ({ page }) => {
    await page.goto('/library');
    await page.waitForSelector('[data-testid="library-screen"]', { timeout: 15000 });

    // Open Add Book modal
    await press(page.locator('[data-testid="library-fab-add-button"]'));
    await expect(page.locator('[data-testid="add-edit-modal"]')).toBeVisible();

    // Launch Barcode Scanner
    await press(page.locator('[data-testid="add-edit-scan-button"]'));

    // Verify Barcode Scanner full-screen viewfinder
    const scannerModal = page.locator('[data-testid="barcode-scanner-modal"]');
    await expect(scannerModal).toBeVisible();
    await expect(page.locator('[data-testid="scanner-title"]')).toHaveText('Scan ISBN Barcode');
    await expect(page.locator('[data-testid="scanner-camera-container"]')).toBeVisible();

    // Verify targeting laser animation line
    await expect(page.locator('[data-testid="scanner-laser-line"]')).toBeVisible();

    // Toggle Torch / Flashlight button
    const torchBtn = page.locator('[data-testid="scanner-torch-button"]');
    await press(torchBtn);

    // Tap a sample preset barcode (e.g. To Kill a Mockingbird: 9780061120084)
    const preset = SAMPLE_BARCODE_PRESETS.find((p) => p.isbn === '9780061120084') || SAMPLE_BARCODE_PRESETS[0];
    const presetChip = page.locator(`[data-testid="scanner-preset-chip-${preset.isbn}"]`);
    await press(presetChip);

    // Verify Scanned Success Match Badge displays with ISBN
    const successBadge = page.locator('[data-testid="scanner-success-badge"]');
    await expect(successBadge).toBeVisible();
    await expect(page.locator('[data-testid="scanner-success-isbn"]')).toHaveText(preset.isbn);

    // Scanner modal auto-closes after success confirmation
    await expect(scannerModal).toBeHidden({ timeout: 5000 });

    // Verify Add Book form is auto-populated with metadata and feedback banner appears
    await expect(page.locator('[data-testid="add-edit-scan-feedback"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-book-isbn"]')).toHaveValue(preset.isbn);

    // Close Add Modal
    await press(page.locator('[data-testid="button-cancel-book"]'));
    await expect(page.locator('[data-testid="add-edit-modal"]')).toBeHidden();
  });

  test('11. Device Diagnostics Modal: opens test runner, displays hardware specs, and executes tests', async ({ page }) => {
    await page.goto('/library');
    await page.waitForSelector('[data-testid="library-screen"]', { timeout: 15000 });

    // Open Device Test Runner Modal from AppBar
    await press(page.locator('[data-testid="library-device-test-button"]'));
    const deviceModal = page.locator('[data-testid="device-test-modal"]');
    await expect(deviceModal).toBeVisible();
    await expect(page.locator('[data-testid="device-test-title"]')).toHaveText('Device Test Runner');

    // Hardware & Runtime Profile
    await expect(page.locator('[data-testid="device-profile-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="device-type-label"]')).toBeVisible();

    // Execute Live Test Suite on device
    const runBtn = page.locator('[data-testid="device-test-run-button"]');
    await expect(runBtn).toBeVisible();
    await press(runBtn);

    // Wait for tests to finish executing
    await expect(page.locator('text=All 19 Assertions Passed')).toBeVisible({ timeout: 10000 });

    // Close diagnostics modal
    await press(page.locator('[data-testid="device-test-close-button"]'));
    await expect(deviceModal).toBeHidden();
  });

});

