# Grabbit Extension

Grabbit is a powerful browser extension designed to supercharge your productivity when working with links on any webpage. With an intuitive drag-to-select interface, customizable actions, and robust filtering options, Grabbit makes managing, copying, and opening multiple links effortless.

## Features

- **Drag-to-Select Links**: Click and drag to create a selection box. Instantly highlights and counts all links within the area.
- **Popup Functionalities**:
  - **Copy All Tabs URLs**: Instantly copy the URLs of all open tabs in the current window.
  - **Copy Selected Tabs URLs**: Copy only the URLs of tabs you select.
  - **Open Copied Links**: Open all links you have copied in new tabs with a single click.
  - **URL Formatting Options**: Choose between plain text, Markdown, HTML, JSON, or CSV formats for copied links.
  - **Include Titles**: Optionally include the page title with each URL.
  - **Sorting**: Sort links by tab order, alphabetically, or by domain.
  - **Avoid Duplicates**: Prevent duplicate URLs from being copied or opened.
  - **Blank Lines**: Insert blank lines between links for readability.
  - **Notifications**: Get notified when actions complete (optional).
- **Domain Exclusions**:
  - **Exclude Links by Domain**: Specify domains or patterns (with wildcards) to exclude from selection, copying, or opening.
  - **Flexible Patterns**: Use wildcards (e.g., `*example.com*`) or exact matches for fine-grained control.
  - **Popup and Options UI**: Manage exclusions directly from the popup or the options page.
- **Sticky/Fixed Element Exclusion**: Automatically ignores links inside sticky/fixed headers, footers, and overlays for more accurate selection.
- **Real-Time Feedback**: See a live count and description of selected links and the action to be performed.
- **Customizable Actions**: Choose what happens when you release the selection—open links, copy to clipboard, or both.
- **Modifier Key Switching**: Instantly switch actions (e.g., open vs. copy) using modifier keys while selecting.
- **Accurate Link Detection**: Only valid, visible, and actionable links are included.
- **Seamless Scrolling**: Selection box supports scrolling, even on long pages.
- **Modern UI**: Clean, accessible, and responsive interface for both popup and options.
- **Configurable**: All features can be customized via the options page.
- **Privacy-First**: No data is sent anywhere—everything runs locally in your browser.

## How It Works

1. **Drag to Select**: Click and drag on any webpage to create a selection box. All links within the box are highlighted and counted in real time.
2. **Choose Action**: Use the popup or modifier keys to select your desired action (open, copy, or both).
3. **Popup Controls**: Use the popup to copy all or selected tab URLs, open copied links, and adjust formatting or exclusion settings.
4. **Domain Exclusions**: Add domains or wildcard patterns to the exclusion list to prevent links from those domains from being included in actions.
5. **Options Page**: Fine-tune all behaviors, including formatting, exclusions, and advanced settings.

## Example Use Cases

- Quickly open all links in a section of a research article.
- Copy all links from a filtered table or list for sharing or archiving.
- Exclude social media or ad domains from bulk actions.
- Format links for Markdown documentation or HTML reports.

## Getting Started

1. **Install Grabbit** from the Chrome Web Store, Firefox Add-ons, or your preferred browser extension marketplace.
2. **Pin the Extension** for easy access.
3. **Open the Popup** to access quick actions and settings.
4. **Right-click and drag** on any page to start selecting links.
5. **Visit the Options Page** to customize exclusions, formatting, and more.

## Development

1. Clone this repository.
2. Run `npm install` to install dependencies.
3. Run `npm run dev` to start the development server.
4. Load the extension into your browser as an unpacked extension from the `dist` directory.

---

Grabbit is open source and welcomes contributions! For feature requests or bug reports, please open an issue on GitHub.
