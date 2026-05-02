# Knowledge Base Chat Extension

A Chrome extension for grounding AI responses in your own knowledge base.

## What It Does

This extension lets you ask questions while browsing any website. Your question is answered using your own knowledge base, not generic AI training data.

- Select text on any page to use as context
- Ask follow-up questions in the chat
- Get answers grounded in your actual content
- See source links for verification

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Your Browser                                           │
│                                                         │
│  ┌──────────────────┐      ┌──────────────────────┐  │
│  │  Chrome Extension │      │  Any Website          │  │
│  │  (this repo)      │      │  (competitor site)    │  │
│  └──────────┬─────────┘      └──────────────────────┘  │
│             │                                             │
│             │ Sends question                              │
│             ▼                                             │
│  ┌──────────────────────────────────────────────────┐   │
│  │  YOUR SERVER (api.yourdomain.com)                │   │
│  │                                                   │   │
│  │  - Receives question                             │   │
│  │  - Fetches your knowledge-base.json              │   │
│  │  - Calls your AI provider                        │   │
│  │  - Returns grounded response                     │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Setup

### 1. Configure Your API Endpoint

Edit `popup.js` and change the API endpoint:

```javascript
// Replace with your own backend
const API_ENDPOINT = "https://your-api.com/search";
```

Your backend should:
- Accept POST requests with `{ query: string, context?: string }`
- Return `{ answer: string, sources: string[] }`
- Use your own knowledge base and AI provider

### 2. Load the Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select this extension folder

### 3. Test It

1. Click the extension icon in your toolbar
2. Type a question
3. Navigate to any page, select text
4. Go back to the extension and ask a follow-up question

## Customization

### Changing the AI Provider

The extension itself is provider-agnostic. Your backend handles the AI integration. Swap in Claude, GPT-4, or any other model.

### Branding

To customize the branding:

1. **Footer text**: Edit `popup.html` and change the text in `<span id="powered-by">`
2. **Header**: Edit the `<h1>` and `.subtitle` in `popup.html`
3. **Colors**: Edit CSS variables in `popup.css` under `:root`

### Styling

Edit `popup.css` to match your brand. The default styling is neutral and clean.

### Adding Features

- Keyboard shortcuts
- History
- Multiple knowledge bases
- Team collaboration

## Development

```bash
# Make changes to source files
# Reload the extension in chrome://extensions/
```

## Icons

The extension requires PNG icons in the `icons/` directory:

- `icon16.png` - 16x16 pixels
- `icon48.png` - 48x48 pixels
- `icon128.png` - 128x128 pixels

Create your own or use a tool like [Favicon.io](https://favicon.io/) to generate them.

## The Knowledge Base Format

This extension works with any knowledge base that follows the [Knowledge Base JSON Spec](https://github.com/bwengr/knowledge-base-spec).

## License

MIT