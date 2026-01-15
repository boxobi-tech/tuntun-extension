# TunTun Extension
**Safe YouTube Browsing for Your Family**

*Based on [BlockTube](https://github.com/amitbl/blocktube) by amitbl*

---

## About

TunTun Extension helps parents and guardians control YouTube content. Block unwanted videos, channels, and comments to create a safer viewing experience for your family.

**Perfect for:**
- 👨‍👩‍👧‍👦 Parents managing children's YouTube access
- 🏫 Educators controlling classroom content
- 💼 Workplaces managing appropriate content
- 🔒 Anyone wanting a cleaner YouTube experience

**100% Free & Open Source** | Premium features coming soon

---

## Features

### Content Filtering
- ✅ **Block Videos by Title** - Filter out videos with specific words or phrases
- ✅ **Block Entire Channels** - Remove channels permanently from YouTube
- ✅ **Block by Channel Name** - Filter channels by name (supports patterns)
- ✅ **Hide Comments** - Block comments from specific users or with certain content
- ✅ **Quick Block** - Right-click any video to block instantly

### Smart Filtering
- ✅ **Duration Filters** - Hide videos that are too long or too short
- ✅ **Hide YouTube Shorts** - Block all Shorts content
- ✅ **Hide Trending** - Remove the Trending page entirely
- ✅ **Hide Movies** - Remove YouTube Movies section
- ✅ **Pattern Matching** - Use simple patterns or advanced regex

### Safety & Control
- 🔐 **Password Protection** - Prevent children from changing settings
- ⚡ **Lightning Fast** - Blocks content before it even loads
- 📱 **Works on Mobile** - Supports mobile YouTube (`m.youtube.com`)
- 🎯 **Precise Control** - Block exactly what you want, nothing more

### Premium Features (Coming Soon)
- ☁️ **Cloud Sync** - Keep filters in sync across all devices
- 🤖 **Remote Management** - Control settings from anywhere
- 📊 **Usage Reports** - See what's been blocked
- 💬 **Telegram Notifications** - Get alerts on your phone

---

## Installation

### From Chrome Web Store (Recommended - Coming Soon)
TunTun Extension will be available on the Chrome Web Store soon.

### From Source (For Developers)
```bash
# Clone repository
git clone https://github.com/boxobi-tech/tuntun-extension.git
cd tuntun-extension

# Build extension
./tools/build.sh chrome

# Load in Chrome
# 1. Go to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select: dist/chrome/
```

---

## Quick Start Guide

### 1. Install the Extension
Install from Chrome Web Store (coming soon) or build from source.

### 2. Set Up Password Protection (Recommended for Parents)
1. Click the TunTun icon in your browser
2. Click "Options"
3. Scroll to "UI Password"
4. Set a password to prevent children from disabling filters

### 3. Add Your First Filter
**Example: Block videos about video games**
1. Open Options → "Video Title" tab
2. Add: `game`, `gaming`, `gameplay`, `fortnite`
3. Click Save

**Example: Block an entire channel**
1. Right-click any video from that channel
2. Select "BlockTube: Block Channel"
3. Done! All their videos are hidden

### 4. Use Advanced Filters (Optional)
For power users, TunTun supports:
- Regular expressions for complex patterns
- Custom JavaScript for ultra-precise filtering
- Duration ranges (e.g., only show videos 5-10 minutes long)

---

## How It Works

TunTun filters YouTube content **before it loads**, so blocked videos never appear:
- ✅ Filters work on: Home, Search, Recommendations, Comments
- ✅ Blocked channels: Redirects to YouTube homepage
- ✅ Blocked videos: Shows custom message or skips to next video
- ✅ All data stored locally on your device (privacy-first)

---

## FAQ

### Is TunTun Extension free?
Yes! The core extension is 100% free and open source. Premium cloud features (sync, remote management) will be available as optional paid add-ons in the future.

### How is this different from YouTube Restricted Mode?
YouTube Restricted Mode is very basic. TunTun gives you **precise control**:
- Block specific channels, not just categories
- Block based on video titles with custom words
- Works reliably (Restricted Mode often misses content)
- You decide what's blocked, not YouTube's algorithm

### Can my kids disable this?
Set a password in Options to prevent unauthorized changes. Children won't be able to disable filters or change settings without the password.

### What's the difference between TunTun and BlockTube?
TunTun is based on BlockTube with a focus on parental controls and family safety. We're adding premium features like cloud sync and remote management (coming soon).

### Does this work on YouTube Kids?
This extension is for regular YouTube (youtube.com). YouTube Kids is a separate app with built-in restrictions.

### What happens if a video is blocked?
You can choose:
- Show a custom message ("This video is blocked")
- Auto-skip to the next video
- Redirect to YouTube homepage (for channels)

### Can I share my filters with family members?
Currently, filters are stored locally. **Cloud Sync** (coming soon) will let you share filters across devices and family members.

### Is my data private?
Yes! All filters are stored locally on your device. Nothing is sent to external servers (unless you opt into premium cloud features in the future).

### How do I get a channel's ID?
Channel ID looks like: `UCxxxxxxxxxxxxxxxxxx`
1. Visit the channel page
2. Look at the URL: `/channel/UCxxxxxxxxxxxxxxxxxx`
3. Copy the ID starting with "UC"
4. If URL shows `/user/name` instead, use [this converter](https://vabs.github.io/youtube-channel-name-converter/)

---

## Support & Community

- 🐛 **Report Bugs:** [GitHub Issues](https://github.com/boxobi-tech/tuntun-extension/issues)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/boxobi-tech/tuntun-extension/discussions)
- 📖 **Documentation:** [Wiki](https://github.com/boxobi-tech/tuntun-extension/wiki) (coming soon)

---

## Development

### Building from Source
**Prerequisites:**
```bash
# Ubuntu/Debian
sudo apt install nodejs npm
sudo npm install -g terser

# macOS
brew install node
npm install -g terser
```

**Build:**
```bash
git clone https://github.com/boxobi-tech/tuntun-extension.git
cd tuntun-extension
./tools/build.sh chrome
# Output: dist/chrome/tuntun_chrome_v1.0.0.zip
```

**Load in Chrome:**
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `dist/chrome/`

### Contributing
We welcome contributions! TunTun is open source (GPL v3).

**How to contribute:**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) (coming soon) for detailed guidelines.

---

## License

### Extension Code (GPL v3)
This extension is licensed under the **GNU General Public License v3.0**, inherited from [BlockTube](https://github.com/amitbl/blocktube).

**What this means:**
- ✅ Free to use, modify, and distribute
- ✅ Source code is always available
- ✅ Modifications must remain open source
- ✅ Commercial use allowed (under GPL terms)

See [LICENSE](LICENSE) file for full details.

### Premium Services (Future)
Future premium cloud features will connect to proprietary backend services. The extension itself remains GPL v3.

---

## Acknowledgments

### Based on BlockTube
TunTun Extension is a derivative work of [**BlockTube**](https://github.com/amitbl/blocktube) by [amitbl](https://github.com/amitbl).

**Original BlockTube:**
- Created by: amitbl
- License: GPL v3.0
- Repository: https://github.com/amitbl/blocktube

We are grateful for the excellent foundation BlockTube provides and remain committed to keeping TunTun open source under GPL v3.

### Additional Credits
- Extension Icon: [Design Bolts](http://www.designbolts.com/2013/09/08/40-free-shaded-social-media-icons/)
- Code Editor: [CodeMirror](https://codemirror.net/) (MIT License)

### TunTun Team
- Maintained by: [Boxobi Tech](https://github.com/boxobi-tech)
- Repository: https://github.com/boxobi-tech/tuntun-extension

---

**Made with ❤️ for families** | Based on BlockTube by amitbl
