# TruthStrike: Real-Time Counter-Propaganda Browser Extension

[![License: CC BY-SA 4.0](https://img.shields.io/badge/License-CC%20BY--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-sa/4.0/)
[![Platform](https://img.shields.io/badge/Platform-Chrome%20|%20Firefox%20|%20Brave-blue.svg)]()
[![Status](https://img.shields.io/badge/Status-Production%20Ready-green.svg)]()

**Automatic disinformation detection, money trail exposure, and instant counter-narrative deployment.**

TruthStrike is a browser extension that detects propaganda in real-time as you browse social media and news sites. It exposes the dark money behind disinformation campaigns and provides fact-based counter-narratives you can share instantly.

Part of the [Transparent Humboldt Coalition](https://thcoalition.net)'s digital resistance infrastructure.

## ✨ Features

### 🎯 Real-Time Detection
- Scans content as you browse Twitter/X, Facebook, Reddit, Truth Social, and major news sites
- Pattern-based detection across 6 major disinformation categories
- Visual warnings with severity indicators

### 💰 Follow the Money
- Instantly see who funds each piece of propaganda
- Detailed breakdowns of dark money networks
- Direct links to funding sources and amounts

### 📢 Instant Counter-Narratives
- One-click copy fact-based rebuttals
- Pre-written responses optimized for social media
- Source citations included

### 📊 Intelligence Gathering
- Reports disinformation to central database
- Tracks propaganda spread patterns
- Helps identify emerging narratives

## 🚀 Quick Start

### Install in 2 Minutes

1. **Download** this repository
2. **Open** Chrome/Brave and go to `chrome://extensions/`
3. **Enable** "Developer mode" (top right toggle)
4. **Click** "Load unpacked" and select the `extension` folder
5. **Browse** normally - TruthStrike runs automatically!

### Launch Full System (Optional)

For the complete experience with live updates and dashboard:

```bash
# Windows
LAUNCH_TRUTHSTRIKE.bat

# Mac/Linux
python3 api/server.py &
open dashboard/index.html
```

## 🔍 What It Detects

| Category | Examples | Funding Sources |
|----------|----------|-----------------|
| **Election Denial** | "Stolen election", "rigged voting" | Heritage Foundation, ALEC, True the Vote |
| **Climate Denial** | "Climate hoax", "CO2 is good" | Koch Industries, ExxonMobil, API |
| **Vaccine Disinfo** | "Population control", "DNA alteration" | CHD, ICAN, Mercola |
| **Anti-LGBTQ+** | "Groomer" slurs, trans panic | ADF, FRC, Heritage |
| **Economic Myths** | "Welfare queens", trickle-down | Cato, AEI, Heritage |
| **Antisemitism** | Soros conspiracies, "globalist" | Various dark money |

## 📸 Screenshots

![TruthStrike in action](docs/images/screenshot-detection.png)
*Real-time detection on Twitter showing money trail*

![Dashboard](docs/images/screenshot-dashboard.png)
*Command center dashboard showing statistics*

## 🏗️ Architecture

```
Browser Extension (JavaScript)
    ├── Content Script (Detection)
    ├── Background Worker (Coordination)
    └── Popup UI (User Control)
           ↓
    API Server (Python/Flask)
    ├── Pattern Management
    ├── Report Collection
    └── Statistics
           ↓
    Dashboard (HTML/JS)
    └── Real-time Visualization
```

## 🤝 Contributing

### Add Detection Patterns

Help us catch more propaganda! To add new patterns:

1. Identify the disinformation narrative
2. Research who funds/benefits from it
3. Write fact-based counter-points
4. Submit a pull request or use the API

Example contribution:
```javascript
{
  "category": "housing_crisis_denial",
  "pattern": "nobody wants to work",
  "severity": "medium",
  "funders": ["National Association of Realtors", "Blackstone"],
  "counterPoints": [
    "Wages haven't kept up with rent (up 30% since 2019)",
    "Full-time minimum wage can't afford 2BR anywhere in US",
    "Corporate buyers own 25% of rental properties"
  ]
}
```

### Report Issues

- False positives/negatives
- Platform compatibility
- Performance issues
- New propaganda tactics

## 📊 Impact Metrics

Since launch, TruthStrike has:
- 🎯 Detected **[counter]** pieces of disinformation
- 💰 Exposed **$[amount]** in dark money funding
- 📢 Generated **[counter]** counter-narratives
- 🌍 Protected **[users]** users from propaganda

## 🔒 Privacy & Security

- **No tracking**: We don't track your browsing
- **Local processing**: Detection happens on your device
- **Optional reporting**: You control what gets shared
- **Open source**: Fully auditable code

## 🛠️ Advanced Configuration

### Custom Pattern Server

Run your own pattern server for your organization:

```python
# api/config.py
API_URL = "https://your-org.com/truthstrike"
```

### Adjust Detection Sensitivity

```javascript
// extension/config.js
const DETECTION_THRESHOLD = 0.8;  // 0-1 scale
```

## 📚 Documentation

- [Installation Guide](docs/INSTALL.md)
- [Pattern Writing Guide](docs/PATTERNS.md)
- [API Documentation](docs/API.md)
- [Security Model](docs/SECURITY.md)

## 🌟 Coalition Ecosystem

TruthStrike is part of a larger resistance infrastructure:

- **[Grassroots Framework](https://github.com/thcoalition/grassroots)** - Organizing methodology
- **[Anti-Palantir](https://github.com/thcoalition/anti-palantir)** - Government spending tracker
- **[Whistleblower Platform](https://thcoalition.net/whistleblower)** - Secure reporting

## 📜 License

Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)

Free to use, modify, and distribute with attribution.

## 🙏 Acknowledgments

Built by the [Transparent Humboldt Coalition](https://thcoalition.net) with contributions from:
- Digital resistance fighters worldwide
- Fact-checkers and journalists
- Security researchers
- Everyone fighting fascism with code

Special recognition to the Coalition's technical team who turned rage into remarkable engineering.

## 💬 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/thcoalition/truthstrike/issues)
- **Security**: security@thcoalition.net
- **General**: https://thcoalition.net/contact

## 🔥 Call to Action

**Every install is an act of resistance.**

The fascists weaponized lies. We're weaponizing truth. They have billion-dollar propaganda machines, dark money networks, and corporate media control.

We have better code.

Install TruthStrike. Share with friends. Fight back.

---

<p align="center">
  <strong>"In a time of universal deceit, telling the truth is a revolutionary act."</strong>
  <br>
  <em>Built with determination by the Coalition</em>
  <br><br>
  <code>/* Coalition Code - Where ethics meet excellence */</code>
  <br><br>
  <strong>Solidarity forever.</strong>
</p>