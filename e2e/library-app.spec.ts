import { test, expect, Locator } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { SAMPLE_BOOKS } from '../constants/sampleBooks';

async function press(locator: Locator) {
  await locator.scrollIntoViewIfNeeded();
  try {
    await locator.dispatchEvent('click');
  } catch {
    await locator.click({ force: true });
  }
}

async function resetAndNavigateToLibrary(page: any): Promise<number> {
  await page.goto('/library');
  await page.waitForSelector('[data-testid="library-screen"]', { timeout: 15000 });
  const countText = await page.locator('[data-testid="library-volume-count"]').innerText();
  return parseInt(countText, 10) || 5;
}

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

    await expect(page.locator('[data-testid="splash-screen"]')).toBeVisible();
    await expect(page.locator('[data-testid="splash-headline"]')).toHaveText('Library Manager');
    await expect(page.locator('[data-testid="splash-tagline"]')).toHaveText('Personal catalog and reading shelf');
    await expect(page.locator('[data-testid="splash-author-badge"]')).toContainText('Developed by mrpcodecraft');

    const enterBtn = page.locator('[data-testid="splash-enter-button"]');
    await expect(enterBtn).toBeVisible();
    await press(enterBtn);

    await expect(page.locator('[data-testid="library-screen"]')).toBeVisible({ timeout: 10000 });
  });

  test('2. Catalog Loading: verifies AppBar, brand title, volume counter, and 5 book cards', async ({ page }) => {
    await page.goto('/library');
    await page.waitForSelector('[data-testid="library-screen"]', { timeout: 15000 });

    await expect(page.locator('[data-testid="library-appbar"]')).toBeVisible();
    await expect(page.locator('[data-testid="library-logo-badge"]')).toBeVisible();
    await expect(page.locator('[data-testid="library-title"]')).toHaveText('Library Manager');

    const volumeCount = page.locator('[data-testid="library-volume-count"]');
    await expect(volumeCount).toHaveText('5 Volumes Cataloged');

    await expect(page.locator('[data-testid="library-search-toggle-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="library-view-toggle-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="library-fab-add-button"]')).toBeVisible();

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

      await expect(card.getByText(book.title)).toBeVisible();
      await expect(card.getByText(new RegExp(book.author, 'i'))).toBeVisible();

      if (book.shelfLocation) {
        await expect(card.getByText(book.shelfLocation)).toBeVisible();
      }

      await expect(card.getByText(`$${book.paidPrice.toFixed(2)}`)).toBeVisible();

      if (book.actualPrice > book.paidPrice) {
        await expect(card.getByText(`$${book.actualPrice.toFixed(2)}`)).toBeVisible();
      }

      await expect(card.getByText(book.bookType)).toBeVisible();
      await expect(card.getByText(book.language)).toBeVisible();

      if (book.isCombination) {
        await expect(card.getByText(/Combo/i)).toBeVisible();
      }
    }
  });

  test('4. Book Details Modal: verifies full book metadata, calculated savings, and bundled sub-books', async ({ page }) => {
    await page.goto('/library');
    await page.waitForSelector('[data-testid="library-screen"]', { timeout: 15000 });

    const lotrBook = SAMPLE_BOOKS.find((b) => b.isCombination)!;
    const lotrCard = page.locator(`[data-testid="book-card-${lotrBook.id}"]`);
    await press(lotrCard);

    const detailsModal = page.locator('[data-testid="book-details-modal"]');
    await expect(detailsModal).toBeVisible();

    await expect(detailsModal.getByText(lotrBook.title)).toBeVisible();
    await expect(detailsModal.getByText(`by ${lotrBook.author}`)).toBeVisible();
    await expect(detailsModal.getByText(lotrBook.shelfLocation!)).toBeVisible();

    await expect(detailsModal.getByText(`$${lotrBook.actualPrice.toFixed(2)}`)).toBeVisible();
    await expect(detailsModal.getByText(`$${lotrBook.paidPrice.toFixed(2)}`)).toBeVisible();
    await expect(detailsModal.getByText(/\$20\.01/)).toBeVisible();

    await expect(detailsModal.getByText(lotrBook.isbn!)).toBeVisible();
    await expect(detailsModal.getByText(lotrBook.id)).toBeVisible();

    await expect(page.locator('[data-testid="book-details-sub-books-container"]')).toBeVisible();
    for (let i = 0; i < lotrBook.subBooks.length; i++) {
      const sub = lotrBook.subBooks[i];
      await expect(detailsModal.getByText(sub.title)).toBeVisible();
    }

    await press(page.locator('[data-testid="book-details-close-button"]'));
    await expect(detailsModal).toBeHidden();
  });

  test('5. Search Filtering: tests live dynamic filtering by title, author, and ISBN, then clearing query', async ({ page }) => {
    await page.goto('/library');
    await page.waitForSelector('[data-testid="library-screen"]', { timeout: 15000 });

    await press(page.locator('[data-testid="library-search-toggle-button"]'));
    const searchInput = page.locator('[data-testid="library-search-input"]');
    await expect(searchInput).toBeVisible();

    const premchandBook = SAMPLE_BOOKS.find((b) => b.author.includes('Premchand'))!;
    const dumasBook = SAMPLE_BOOKS.find((b) => b.author.includes('Dumas'))!;
    const leeBook = SAMPLE_BOOKS.find((b) => b.author.includes('Harper Lee'))!;
    const fitzgeraldBook = SAMPLE_BOOKS.find((b) => b.author.includes('Fitzgerald'))!;

    await searchInput.fill('Premchand');
    await expect(page.locator(`[data-testid="book-card-${premchandBook.id}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="book-card-${dumasBook.id}"]`)).toBeHidden();
    await expect(page.locator('[data-testid="library-volume-count"]')).toHaveText('1 Volume Cataloged');

    await press(page.locator('[data-testid="library-search-clear-button"]'));
    await expect(page.locator(`[data-testid="book-card-${dumasBook.id}"]`)).toBeVisible();
    await expect(page.locator('[data-testid="library-volume-count"]')).toHaveText('5 Volumes Cataloged');

    await searchInput.fill(leeBook.isbn!);
    await expect(page.locator(`[data-testid="book-card-${leeBook.id}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="book-card-${fitzgeraldBook.id}"]`)).toBeHidden();

    await searchInput.fill('');
    await press(page.locator('[data-testid="library-search-toggle-button"]'));
    await expect(searchInput).toBeHidden();
  });

  test('6. View Layout Toggle: toggles between grid and list modes', async ({ page }) => {
    await page.goto('/library');
    await page.waitForSelector('[data-testid="library-screen"]', { timeout: 15000 });

    const viewToggleBtn = page.locator('[data-testid="library-view-toggle-button"]');
    await expect(viewToggleBtn).toBeVisible();
    await press(viewToggleBtn);
    await expect(page.locator('[data-testid="library-book-list"]')).toBeVisible();

    await press(viewToggleBtn);
    await expect(page.locator('[data-testid="library-book-list"]')).toBeVisible();
  });

  test('7. Add Book Flow: creates a new book, fills all attributes, and updates catalog', async ({ page }) => {
    await page.goto('/library');
    await page.waitForSelector('[data-testid="library-screen"]', { timeout: 15000 });

    await press(page.locator('[data-testid="library-fab-add-button"]'));
    const addModal = page.locator('[data-testid="add-edit-modal"]');
    await expect(addModal).toBeVisible();
    await expect(page.locator('[data-testid="add-edit-title"]')).toHaveText('Add New Book');

    await page.locator('[data-testid="input-book-title"]').fill('Atomic Habits');
    await page.locator('[data-testid="input-book-author"]').fill('James Clear');
    await page.locator('[data-testid="input-book-isbn"]').fill('9780735211292');
    await page.locator('[data-testid="input-book-shelf"]').fill('Shelf D - Self Improvement #01');
    await page.locator('[data-testid="input-book-actual-price"]').fill('27.00');
    await page.locator('[data-testid="input-book-paid-price"]').fill('18.50');

    await press(page.locator('[data-testid="segment-type-ebook"]'));
    await page.locator('[data-testid="input-book-language"]').fill('English');

    await press(page.locator('[data-testid="button-save-book"]'));
    await expect(addModal).toBeHidden();

    await expect(page.locator('[data-testid="library-volume-count"]')).toHaveText('6 Volumes Cataloged');
    await expect(page.locator('text=Atomic Habits')).toBeVisible();
    await expect(page.locator('text=by James Clear')).toBeVisible();

    // Verify cross-session persistence across page reload
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

    await press(page.locator(`[data-testid="book-card-menu-button-${targetBook.id}"]`));
    const contextMenu = page.locator(`[data-testid="book-card-context-menu-${targetBook.id}"]`);
    await expect(contextMenu).toBeVisible();

    await press(page.locator(`[data-testid="book-card-menu-item-edit-${targetBook.id}"]`));

    const editModal = page.locator('[data-testid="add-edit-modal"]');
    await expect(editModal).toBeVisible();
    await expect(page.locator('[data-testid="add-edit-title"]')).toHaveText('Update Book');

    await expect(page.locator('[data-testid="input-book-title"]')).toHaveValue(targetBook.title);
    await expect(page.locator('[data-testid="input-book-author"]')).toHaveValue(targetBook.author);

    await page.locator('[data-testid="input-book-title"]').fill('The Count of Monte Cristo (Anniversary Edition)');
    await page.locator('[data-testid="input-book-shelf"]').fill('Vault - Collector Shelf #88');

    await press(page.locator('[data-testid="button-save-book"]'));
    await expect(editModal).toBeHidden();

    const targetCard = page.locator(`[data-testid="book-card-${targetBook.id}"]`);
    await expect(targetCard.getByText('The Count of Monte Cristo (Anniversary Edition)')).toBeVisible();
    await expect(targetCard.getByText('Vault - Collector Shelf #88')).toBeVisible();

    // Verify cross-session persistence across page reload
    await page.reload();
    await page.waitForSelector('[data-testid="library-screen"]', { timeout: 15000 });
    const persistedCard = page.locator(`[data-testid="book-card-${targetBook.id}"]`);
    await expect(persistedCard.getByText('The Count of Monte Cristo (Anniversary Edition)')).toBeVisible();
    await expect(persistedCard.getByText('Vault - Collector Shelf #88')).toBeVisible();
  });

  test('9. Delete Book Flow: verifies M3 Confirmation Dialog, cancellation, and atomic deletion', async ({ page }) => {
    await page.goto('/library');
    await page.waitForSelector('[data-testid="library-screen"]', { timeout: 15000 });

    const targetBook = SAMPLE_BOOKS[1]; // To Kill a Mockingbird

    await press(page.locator(`[data-testid="book-card-menu-button-${targetBook.id}"]`));
    await press(page.locator(`[data-testid="book-card-menu-item-delete-${targetBook.id}"]`));

    const deleteDialog = page.locator('[data-testid="delete-confirm-dialog"]');
    await expect(deleteDialog).toBeVisible();
    await expect(page.locator('[data-testid="delete-confirm-title"]')).toHaveText('Delete Book?');
    await expect(page.locator('[data-testid="delete-confirm-message"]')).toContainText(`"${targetBook.title}"`);

    // Cancel deletion
    await press(page.locator('[data-testid="delete-confirm-cancel-button"]'));
    await expect(deleteDialog).toBeHidden();
    await expect(page.locator(`[data-testid="book-card-${targetBook.id}"]`)).toBeVisible();
    await expect(page.locator('[data-testid="library-volume-count"]')).toHaveText('5 Volumes Cataloged');

    // Confirm deletion
    await press(page.locator(`[data-testid="book-card-menu-button-${targetBook.id}"]`));
    await press(page.locator(`[data-testid="book-card-menu-item-delete-${targetBook.id}"]`));
    await expect(deleteDialog).toBeVisible();

    await press(page.locator('[data-testid="delete-confirm-button"]'));
    await expect(deleteDialog).toBeHidden();

    await expect(page.locator(`[data-testid="book-card-${targetBook.id}"]`)).toBeHidden();
    await expect(page.locator('[data-testid="library-volume-count"]')).toHaveText('4 Volumes Cataloged');

    // Verify cross-session persistence across page reload
    await page.reload();
    await page.waitForSelector('[data-testid="library-screen"]', { timeout: 15000 });
    await expect(page.locator(`[data-testid="book-card-${targetBook.id}"]`)).toBeHidden();
    await expect(page.locator('[data-testid="library-volume-count"]')).toHaveText('4 Volumes Cataloged');
  });

  test('10. Barcode Scanner Subsystem: tests viewfinder, laser line, torch toggle, and ISBN auto-population', async ({ page }) => {
    await page.goto('/library');
    await page.waitForSelector('[data-testid="library-screen"]', { timeout: 15000 });

    await press(page.locator('[data-testid="library-fab-add-button"]'));
    await expect(page.locator('[data-testid="add-edit-modal"]')).toBeVisible();

    await press(page.locator('[data-testid="add-edit-scan-button"]'));

    const scannerModal = page.locator('[data-testid="barcode-scanner-modal"]');
    await expect(scannerModal).toBeVisible();
    await expect(page.locator('[data-testid="scanner-title"]')).toHaveText('Scan ISBN Barcode');
    await expect(page.locator('[data-testid="scanner-camera-container"]')).toBeVisible();

    await expect(page.locator('[data-testid="scanner-laser-line"]')).toBeVisible();

    const torchBtn = page.locator('[data-testid="scanner-torch-button"]');
    await press(torchBtn);

    await press(page.locator('[data-testid="scanner-manual-toggle-button"]'));
    const manualInput = page.locator('[data-testid="scanner-manual-input"]');
    await expect(manualInput).toBeVisible();
    await manualInput.fill('9780061120084');
    await press(page.locator('[data-testid="scanner-manual-submit-button"]'));

    await expect(scannerModal).toBeHidden({ timeout: 5000 });

    await expect(page.locator('[data-testid="add-edit-scan-feedback"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-book-isbn"]')).toHaveValue('9780061120084');

    await press(page.locator('[data-testid="button-cancel-book"]'));
    await expect(page.locator('[data-testid="add-edit-modal"]')).toBeHidden();
  });

  test('11. Camera ISBN Barcode Scan: shows test_img_1.jpg to camera, decodes barcode, fetches Guerrilla Warfare metadata, and saves book', async ({ page }) => {
    // Grant camera permission for actual camera in browser
    await page.context().grantPermissions(['camera']);

    const initialCount = await resetAndNavigateToLibrary(page);

    await press(page.locator('[data-testid="library-fab-add-button"]'));
    const addModal = page.locator('[data-testid="add-edit-modal"]');
    await expect(addModal).toBeVisible();

    await press(page.locator('[data-testid="add-edit-scan-button"]'));
    const scannerModal = page.locator('[data-testid="barcode-scanner-modal"]');
    await expect(scannerModal).toBeVisible();
    await expect(page.locator('[data-testid="scanner-camera-container"]')).toBeVisible();

    // Show "test_img_1.jpg" image under "assets/barcode" folder to the camera
    const barcodeImgPath = path.resolve(process.cwd(), 'assets/barcode/test_img_1.jpg');
    expect(fs.existsSync(barcodeImgPath)).toBeTruthy();
    const barcodeImgBase64 = fs.readFileSync(barcodeImgPath).toString('base64');

    // Present image to camera viewfinder and feed frame stream to camera video element
    await page.evaluate(async (b64) => {
      const container = document.querySelector('[data-testid="scanner-camera-container"]') || document.body;
      const img = document.createElement('img');
      img.setAttribute('data-testid', 'scanner-camera-test-image');
      img.src = 'data:image/jpeg;base64,' + b64;
      img.style.position = 'absolute';
      img.style.inset = '0';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'contain';
      img.style.zIndex = '1';
      container.appendChild(img);

      const image = new Image();
      image.src = 'data:image/jpeg;base64,' + b64;
      await new Promise((resolve) => { image.onload = resolve; });

      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(image, 0, 0);
        setInterval(() => {
          ctx.drawImage(image, 0, 0);
        }, 40);
      }

      const video = container.querySelector('video') || document.querySelector('video');
      if (video) {
        const stream = canvas.captureStream(25);
        video.srcObject = stream;
        await video.play().catch(() => {});
      }
    }, barcodeImgBase64);

    await expect(page.locator('[data-testid="scanner-camera-test-image"]')).toBeVisible();

    const successBadge = page.locator('[data-testid="scanner-success-badge"]');
    await expect(successBadge).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="scanner-success-isbn"]')).toHaveText('9789354990366');

    await expect(scannerModal).toBeHidden({ timeout: 10000 });

    const titleInput = page.locator('[data-testid="input-book-title"]');
    const authorInput = page.locator('[data-testid="input-book-author"]');
    await expect(titleInput).toHaveValue(/guerrilla warfare/i, { timeout: 10000 });
    await expect(authorInput).toHaveValue(/(Ernesto Guevara Che|Guevara Che|Ernesto Guevara)/i, { timeout: 10000 });

    await fillRemainingDetailsAndSave(page, 'Shelf G - History #01', '29.99', '19.99');

    await verifyBookAddedToCatalog(
      page,
      /guerrilla warfare/i,
      /(Ernesto Guevara Che|Guevara Che|Ernesto Guevara)/i,
      'Shelf G - History #01',
      initialCount + 1
    );
  });

  test('12. Manual Barcode Entry on Scanner: searches ISBN 9789354990366, fetches Guerrilla Warfare metadata, and saves book', async ({ page }) => {
    const initialCount = await resetAndNavigateToLibrary(page);

    await press(page.locator('[data-testid="library-fab-add-button"]'));
    const addModal = page.locator('[data-testid="add-edit-modal"]');
    await expect(addModal).toBeVisible();

    await press(page.locator('[data-testid="add-edit-scan-button"]'));
    const scannerModal = page.locator('[data-testid="barcode-scanner-modal"]');
    await expect(scannerModal).toBeVisible();

    const manualToggleBtn = page.locator('[data-testid="scanner-manual-toggle-button"]');
    await expect(manualToggleBtn).toBeVisible();
    await press(manualToggleBtn);

    const manualInput = page.locator('[data-testid="scanner-manual-input"]');
    await expect(manualInput).toBeVisible();
    await manualInput.fill('9789354990366');

    const manualSubmitBtn = page.locator('[data-testid="scanner-manual-submit-button"]');
    await expect(manualSubmitBtn).toBeVisible();
    await press(manualSubmitBtn);

    await expect(scannerModal).toBeHidden({ timeout: 10000 });

    const titleInput = page.locator('[data-testid="input-book-title"]');
    const authorInput = page.locator('[data-testid="input-book-author"]');
    await expect(titleInput).toHaveValue(/guerrilla warfare/i, { timeout: 10000 });
    await expect(authorInput).toHaveValue(/(Ernesto Guevara Che|Guevara Che|Ernesto Guevara)/i, { timeout: 10000 });

    await fillRemainingDetailsAndSave(page, 'Shelf G - Revolutions #02', '24.99', '16.50');

    await verifyBookAddedToCatalog(
      page,
      /guerrilla warfare/i,
      /(Ernesto Guevara Che|Guevara Che|Ernesto Guevara)/i,
      'Shelf G - Revolutions #02',
      initialCount + 1
    );
  });

});
