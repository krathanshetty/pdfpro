# PDF PRO

PDF PRO is a browser-based React + Vite application for creating PDF documents from image uploads. It is built for speed, privacy, and simple workflow, with drag-and-drop page ordering and client-side PDF generation.

## Features

- **Image import**
  - Drag & drop or browse files.
  - Supports JPG, PNG, WEBP, and HEIC.
  - Paste images from clipboard.
  - Mobile camera upload support.
- **Page organizer**
  - Reorder pages with drag-and-drop.
  - Delete pages instantly.
  - Page thumbnails and page numbering.
- **PDF settings**
  - Rename the PDF file.
  - Choose page size: A4, Letter, Legal, A5.
  - Set orientation: Portrait or Landscape.
  - Pick margins: None, Small, Medium, Large.
  - Set layout mode: Fit, Fill, Original, Smart.
  - Toggle compression and watermark preview.
- **Preview panel**
  - Live preview of the generated PDF page.
  - Zoom controls and page navigation.
  - Visual margin and layout feedback.
- **Local PDF generation**
  - Generates final PDF in the browser using `pdf-lib`.
  - Keeps all image processing private and offline.

## Project Structure

- `src/App.jsx` - Main app layout and flow.
- `src/components/UploadArea.jsx` - Upload and file processing UI.
- `src/components/PageOrganizer.jsx` - Drag-and-drop page organizer.
- `src/components/PageCard.jsx` - Page card UI and actions.
- `src/components/PDFSettings.jsx` - PDF option controls.
- `src/components/PreviewPanel.jsx` - Live PDF preview.
- `src/store/usePDFStore.js` - Zustand state management.
- `src/utils/pdfGenerator.js` - PDF creation logic.
- `src/utils/imageUtils.js` - Image utility helpers.

## Technologies

- React 19
- Vite
- Tailwind CSS
- Zustand
- framer-motion
- @dnd-kit for drag-and-drop
- pdf-lib for PDF generation
- react-dropzone for uploads
- react-hot-toast for notifications
- heic2any for HEIC support

## Getting Started

```bash
npm install
npm run dev
```

Open the app at `http://localhost:5173`.

## Build

```bash
npm run build
```

## Notes

- Firebase configuration files are now ignored in `.gitignore`.
- The following files are excluded from version control:
  - `.firebase/`
  - `.firebaserc`
  - `firebase.json`
- PDF generation and image handling happen fully in the browser.
