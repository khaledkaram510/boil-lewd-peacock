# Text Highlighter Browser Extension

A minimal MVP browser extension built with React, Plasmo, Tailwind CSS, and shadcn/ui that enables users to highlight text on any webpage and add notes.

## ✨ Features

- **Text Highlighting**: Select any text on a webpage to highlight it
- **Note Taking**: Add notes to your highlights
- **Persistent Storage**: All highlights and notes are saved locally using localStorage
- **Visual Feedback**: Highlighted text appears with a yellow background
- **Interactive Tooltips**: Click on highlights to view, edit, or delete notes
- **Extension Popup**: View all highlights for the current page
- **Search Functionality**: Search through your highlights and notes

## 🛠️ Technical Stack

- **Framework**: React with Plasmo for extension structure
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Popover, Card, Button, Input, Textarea)
- **Storage**: localStorage with JSON format
- **Build Tool**: Plasmo v0.90.5

## 🚀 Getting Started

### Development

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked" and select the `build/chrome-mv3-dev` folder

### Building for Production

```bash
npm run build
```

The production build will be in the `build/chrome-mv3-prod` folder.

## 📖 How to Use

### Highlighting Text

1. Navigate to any webpage
2. Select text by dragging your cursor over it
3. A popup will appear with options to save the highlight
4. Add an optional note and click "Save"

### Viewing Highlights

- Previously highlighted text will appear with a yellow background
- Click on any highlight to view, edit, or delete the associated note
- Use the extension popup (click the extension icon) to see all highlights for the current page

### Managing Highlights

- **Edit Notes**: Click on a highlight and then click "Edit" to modify the note
- **Delete Highlights**: Click the trash icon in the tooltip or popup
- **Search**: Use the search box in the popup to find specific highlights

## 🗂️ Project Structure

```
src/
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── HighlightOverlay.tsx   # Popup for saving highlights
│   └── HighlightTooltip.tsx   # Tooltip for viewing/editing highlights
├── lib/
│   ├── types.ts              # TypeScript interfaces
│   ├── storage.ts            # localStorage utilities
│   └── utils.ts              # Utility functions
├── styles/
│   ├── globals.css           # Global styles and CSS variables
│   └── style.css            # Tailwind directives
├── background.ts             # Extension background script
├── content.tsx              # Main content script (injected into pages)
└── popup.tsx               # Extension popup interface
```

## 💾 Data Storage

Highlights are stored in localStorage as JSON with the following structure:

```typescript
interface Highlight {
  id: string // Unique identifier
  url: string // Webpage URL
  text: string // Selected text
  note: string // User's note
  startOffset: number // Selection start position
  endOffset: number // Selection end position
  xpath: string // XPath to the element
  timestamp: number // Creation time
  color?: string // Highlight color (default: yellow)
}
```

## 🎨 Styling

The extension uses a custom design system with:

- **Colors**: Yellow highlights with hover effects
- **Typography**: Clean, readable fonts
- **Spacing**: Consistent padding and margins
- **Dark Mode**: Supported via CSS variables

## 🔧 Browser Permissions

The extension requires:

- `activeTab`: To interact with the current webpage
- `storage`: For saving highlights (using localStorage)
- `host_permissions`: To inject into HTTP and HTTPS pages

## 🚀 Future Enhancements

- Export highlights to JSON/CSV
- Sync highlights across devices
- Multiple highlight colors
- Highlight categories/tags
- Full-text search across all pages
- Import/export functionality
- Keyboard shortcuts

## 📄 License

This project is open source and available under the MIT License.
