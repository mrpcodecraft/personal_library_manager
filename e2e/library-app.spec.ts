import { test, expect, Locator } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { SAMPLE_BOOKS } from '../constants/sampleBooks';

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

/**
 * Intercepts Google Books API volume queries to return deterministic metadata
 * for test books (e.g. Guerrilla Warfare by Ernesto Guevara Che).
 */
async function mockGoogleBooksApi(page: any) {
  await page.route(/googleapis\.com\/books\/v1\/volumes/, (route: any) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: {
        items: [
          {
            volumeInfo: {
              title: 'Guerrilla Warfare',
              authors: ['Ernesto Guevara Che'],
              language: 'en',
            },
          },
        ],
      },
    })
  );
}

/**
 * Feeds the test barcode image to the camera stream via navigator.mediaDevices.getUserMedia
 * using continuous canvas redrawing in a loop before the application loads.
 */
async function setupFakeCameraWithBarcodeImage(page: any, barcodeImageBase64: string) {
  await page.context().grantPermissions(['camera']);
  await page.addInitScript((imageB64: string) => {
    if (!navigator.mediaDevices) {
      (navigator as any).mediaDevices = {};
    }
    navigator.mediaDevices.getUserMedia = async () => {
      const img = new Image();
      img.src = 'data:image/jpeg;base64,' + imageB64;
      if (img.decode) {
        await img.decode();
      } else {
        await new Promise((r) => { img.onload = r; });
      }
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      setInterval(() => {
        ctx.drawImage(img, 0, 0);
      }, 40); // 25 fps stream
      return canvas.captureStream(25);
    };
  }, barcodeImageBase64);
}

/**
 * Navigates to /library, resets localStorage for a fresh test run,
 * and returns the initial catalog volume count.
 */
async function resetAndNavigateToLibrary(page: any): Promise<number> {
  await page.goto('/library');
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.reload();
  await page.waitForSelector('[data-testid="library-screen"]', { timeout: 15000 });
  const countText = await page.locator('[data-testid="library-volume-count"]').innerText();
  return parseInt(countText, 10) || 5;
}

/**
 * Fills remaining dummy fields on Add Book modal and saves the book to the catalog.
 */
async function fillRemainingDetailsAndSave(
  page: any,
  shelf: string,
  actualPrice: string,
  paidPrice: string
) {
  await page.locator('[data-testid="input-book-shelf"]').fill(shelf);
  await page.locator('[data-testid="input-book-actual-price"]').fill(actualPrice);
  await page.locator('[data-testid="input-book-paid-price"]').fill(paidPrice);
  await press(page.locator('[data-testid="button-save-book"]'));
  await expect(page.locator('[data-testid="add-edit-modal"]')).toBeHidden();
}

/**
 * Verifies that the newly saved book is visible in the catalog with expected attributes
 * without strict-mode selector conflicts.
 */
async function verifyBookAddedToCatalog(
  page: any,
  titleRegex: RegExp,
  authorRegex: RegExp,
  shelfText: string,
  expectedCount: number
) {
  await expect(page.locator('[data-testid="library-volume-count"]')).toHaveText(
    `${expectedCount} Volumes Cataloged`
  );
  const card = page.locator('[data-testid^="book-card-"]').filter({ hasText: titleRegex }).first();
  await expect(card).toBeVisible();
  await expect(card.getByText(authorRegex)).toBeVisible();
  await expect(card.getByText(shelfText)).toBeVisible();
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

  test('6. View Layout Toggle: toggles between grid and list modes', async ({ page }) => {
    await page.goto('/library');
    await page.waitForSelector('[data-testid="library-screen"]', { timeout: 15000 });

    // Toggle view mode (Grid <-> List)
    const viewToggleBtn = page.locator('[data-testid="library-view-toggle-button"]');
    await expect(viewToggleBtn).toBeVisible();
    await press(viewToggleBtn);
    await expect(page.locator('[data-testid="library-book-list"]')).toBeVisible();

    // Toggle back to original layout
    await press(viewToggleBtn);
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

    // Open manual ISBN input and enter ISBN (e.g. To Kill a Mockingbird: 9780061120084)
    await press(page.locator('[data-testid="scanner-manual-toggle-button"]'));
    const manualInput = page.locator('[data-testid="scanner-manual-input"]');
    await expect(manualInput).toBeVisible();
    await manualInput.fill('9780061120084');
    await press(page.locator('[data-testid="scanner-manual-submit-button"]'));

    // Scanner modal auto-closes after submission
    await expect(scannerModal).toBeHidden({ timeout: 5000 });

    // Verify Add Book form is auto-populated with metadata and feedback banner appears
    await expect(page.locator('[data-testid="add-edit-scan-feedback"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-book-isbn"]')).toHaveValue('9780061120084');

    // Close Add Modal
    await press(page.locator('[data-testid="button-cancel-book"]'));
    await expect(page.locator('[data-testid="add-edit-modal"]')).toBeHidden();
  });

  test('11. Camera ISBN Barcode Scan: feeds test_img_1.jpg to camera stream, decodes barcode, fetches Guerrilla Warfare metadata, and saves book', async ({ page }) => {
    const barcodeImgPath = path.resolve(process.cwd(), 'assets/barcode/test_img_1.jpg');
    expect(fs.existsSync(barcodeImgPath)).toBeTruthy();
    const barcodeImgBase64 = fs.readFileSync(barcodeImgPath).toString('base64');

    // 1. Fake camera stream before navigation and mock Google Books API
    await setupFakeCameraWithBarcodeImage(page, barcodeImgBase64);
    await mockGoogleBooksApi(page);

    // 2. Initialize library screen and get dynamic initial book count
    const initialCount = await resetAndNavigateToLibrary(page);

    // 3. Open Add Book Modal and launch Barcode Scanner
    await press(page.locator('[data-testid="library-fab-add-button"]'));
    const addModal = page.locator('[data-testid="add-edit-modal"]');
    await expect(addModal).toBeVisible();

    await press(page.locator('[data-testid="add-edit-scan-button"]'));
    const scannerModal = page.locator('[data-testid="barcode-scanner-modal"]');
    await expect(scannerModal).toBeVisible();
    await expect(page.locator('[data-testid="scanner-camera-container"]')).toBeVisible();

    // 4. Scanner decodes barcode from camera stream and shows success badge
    const successBadge = page.locator('[data-testid="scanner-success-badge"]');
    await expect(successBadge).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="scanner-success-isbn"]')).toHaveText('9789354990366');

    // 5. Scanner modal auto-closes upon scan and returns scanned ISBN to handleScanSuccess
    await expect(scannerModal).toBeHidden({ timeout: 10000 });

    // 6. Verify fields populated from handleScanSuccess with retrying assertions (no fallback)
    const titleInput = page.locator('[data-testid="input-book-title"]');
    const authorInput = page.locator('[data-testid="input-book-author"]');
    await expect(titleInput).toHaveValue(/guerrilla warfare/i, { timeout: 10000 });
    await expect(authorInput).toHaveValue(/(Ernesto Guevara Che|Guevara Che|Ernesto Guevara)/i, { timeout: 10000 });

    // 7. Update other fields with dummy values and save
    await fillRemainingDetailsAndSave(page, 'Shelf G - History #01', '29.99', '19.99');

    // 8. Verify volume count incremented and book is present in catalog (strict-mode safe)
    await verifyBookAddedToCatalog(
      page,
      /guerrilla warfare/i,
      /(Ernesto Guevara Che|Guevara Che|Ernesto Guevara)/i,
      'Shelf G - History #01',
      initialCount + 1
    );
  });

  test('12. Manual Barcode Entry on Scanner: searches ISBN 9789354990366, fetches Guerrilla Warfare metadata, and saves book', async ({ page }) => {
    // 1. Mock Google Books API and initialize library screen
    await mockGoogleBooksApi(page);
    const initialCount = await resetAndNavigateToLibrary(page);

    // 2. Open Add Book Modal and launch Barcode Scanner
    await press(page.locator('[data-testid="library-fab-add-button"]'));
    const addModal = page.locator('[data-testid="add-edit-modal"]');
    await expect(addModal).toBeVisible();

    await press(page.locator('[data-testid="add-edit-scan-button"]'));
    const scannerModal = page.locator('[data-testid="barcode-scanner-modal"]');
    await expect(scannerModal).toBeVisible();

    // 3. On barcode scanner modal, open manual input and enter ISBN 9789354990366
    const manualToggleBtn = page.locator('[data-testid="scanner-manual-toggle-button"]');
    await expect(manualToggleBtn).toBeVisible();
    await press(manualToggleBtn);

    const manualInput = page.locator('[data-testid="scanner-manual-input"]');
    await expect(manualInput).toBeVisible();
    await manualInput.fill('9789354990366');

    const manualSubmitBtn = page.locator('[data-testid="scanner-manual-submit-button"]');
    await expect(manualSubmitBtn).toBeVisible();
    await press(manualSubmitBtn);

    // 4. Scanner modal auto-closes upon submission and passes ISBN to handleScanSuccess
    await expect(scannerModal).toBeHidden({ timeout: 10000 });

    // 5. Verify fields populated from handleScanSuccess with retrying assertions (no fallback)
    const titleInput = page.locator('[data-testid="input-book-title"]');
    const authorInput = page.locator('[data-testid="input-book-author"]');
    await expect(titleInput).toHaveValue(/guerrilla warfare/i, { timeout: 10000 });
    await expect(authorInput).toHaveValue(/(Ernesto Guevara Che|Guevara Che|Ernesto Guevara)/i, { timeout: 10000 });

    // 6. Update other fields with dummy values and save
    await fillRemainingDetailsAndSave(page, 'Shelf G - Revolutions #02', '24.99', '16.50');

    // 7. Verify volume count incremented and book is present in catalog (strict-mode safe)
    await verifyBookAddedToCatalog(
      page,
      /guerrilla warfare/i,
      /(Ernesto Guevara Che|Guevara Che|Ernesto Guevara)/i,
      'Shelf G - Revolutions #02',
      initialCount + 1
    );
  });

});

