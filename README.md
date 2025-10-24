# 🎯 TruthStrike: Counter-Propaganda Browser Extension

**Real-time disinformation detection and counter-narrative deployment**

Part of the Coalition's digital resistance infrastructure. TruthStrike automatically detects disinformation as you browse and exposes the money and power behind the lies.

## 🚀 Features

- **Real-Time Detection**: Scans social media posts, news articles, and comments for known disinformation patterns
- **Money Trail Exposure**: Shows who funds the propaganda (Koch, Heritage Foundation, ALEC, etc.)
- **Instant Counter-Narratives**: Provides fact-based rebuttals you can copy and share
- **Cross-Platform**: Works on Twitter/X, Facebook, Reddit, Truth Social, and major news sites
- **Report & Track**: Builds a database of disinformation spread patterns

## 📦 Installation

### Quick Install (Chrome/Brave/Edge)

1. Download the extension folder to your computer
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `PROJECT_TRUTHSTRIKE/extension` folder
6. The TruthStrike icon will appear in your toolbar

### Firefox Installation

1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select any file in the `extension` folder
5. Extension will load (note: temporary in Firefox unless signed)

## 🎮 How to Use

### Automatic Mode (Default)
TruthStrike runs automatically on supported sites. When disinformation is detected:
- Content gets flagged with a red border
- Warning box appears with facts and funding info
- Click action buttons to debunk, share facts, or investigate

### Manual Scan
1. Click the TruthStrike icon in your toolbar
2. Click "Scan Current Page"
3. All disinformation on the page will be highlighted

### Following the Money
When you see "Who profits from this lie", click "Follow the Money" to see:
- Organization funding details
- Dark money connections
- Corporate sponsors
- Political spending
- Environmental/social damage

## 🎯 What It Detects

### Current Detection Categories

**Election Integrity**
- "Stolen election" claims
- Dominion voting conspiracy theories
- Dead voter myths
- 2000 Mules propaganda

**Climate Denial**
- "Climate hoax" narratives
- CO2 minimization
- Renewable energy attacks
- Fossil fuel greenwashing

**Public Health**
- Vaccine conspiracy theories
- COVID denialism
- Anti-science propaganda
- "Population control" myths

**Civil Rights**
- Anti-trans panic
- "Groomer" slurs
- CRT fearmongering
- Immigration myths

**Economic Justice**
- "Welfare queen" tropes
- Anti-union propaganda
- Trickle-down myths
- Corporate welfare hiding

## 🛠️ Customization

### Adding New Detection Patterns

Edit `content.js` and add to the `knownDisinfoPatterns` map:

```javascript
this.knownDisinfoPatterns.set('new_category', {
  patterns: [
    /pattern_to_detect/gi,
    /another_pattern/gi
  ],
  severity: 'high', // critical, high, medium
  category: 'category_name',
  funders: ['Organization 1', 'Organization 2'],
  counterPoints: [
    'Fact-based rebuttal 1',
    'Fact-based rebuttal 2'
  ]
});
```

### Styling

Modify `truthstrike.css` to change the appearance of warnings and notifications.

## 🔒 Privacy & Security

- **No tracking**: TruthStrike doesn't track your browsing
- **Local processing**: Detection happens on your device
- **Optional reporting**: You control what gets reported
- **Open source**: Fully auditable code

## 🤝 Contributing

### Report False Positives/Negatives
Open an issue with:
- URL where issue occurred
- Screenshot if possible
- Text that was incorrectly flagged (or missed)

### Add Detection Patterns
1. Research the disinformation narrative
2. Identify funding sources
3. Compile fact-based rebuttals with sources
4. Submit pull request with new pattern

### Improve Counter-Narratives
Help make rebuttals more effective:
- Keep them short and factual
- Include credible sources
- Focus on the money trail
- Make them shareable

## 🚨 Troubleshooting

### Extension Not Working
1. Check that developer mode is enabled
2. Reload the extension
3. Refresh the target page
4. Check browser console for errors (F12)

### False Positives
- Right-click flagged content
- Select "Report False Positive"
- We'll update patterns in next version

### Performance Issues
- Disable auto-scan for specific sites
- Reduce scan frequency in settings
- Report sites causing issues

## 📊 Impact Metrics

Since launch, TruthStrike has:
- Detected [X] pieces of disinformation
- Exposed $[X] in dark money funding
- Generated [X] counter-narratives
- Built database of [X] propaganda sources

## 🔗 Resources

- **Coalition Website**: https://thcoalition.net
- **Report Issues**: https://github.com/thcoalition/truthstrike/issues
- **Fact-Check Sources**:
  - https://www.factcheck.org/
  - https://www.snopes.com/
  - https://www.politifact.com/
- **Money Trail Databases**:
  - https://www.opensecrets.org/
  - https://www.sourcewatch.org/
  - https://littlesis.org/

## 📜 License

Creative Commons CC-BY-SA 4.0
Free to use, modify, and distribute with attribution

## 🔥 Call to Action

**The fascists have better funding. We have better code.**

Every install is a small act of resistance. Every flagged lie is a truth saved. Every exposed money trail is power revealed.

Install TruthStrike. Share with friends. Fight back.

---

*"In a time of universal deceit, telling the truth is a revolutionary act."*

Built with rage and determination by the Transparent Humboldt Coalition

**Solidarity forever.**