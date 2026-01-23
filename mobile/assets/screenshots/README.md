# App Store Screenshots

This directory should contain screenshots for App Store submission.

## Required iOS Screenshot Sizes

### iPhone 6.9" Display (iPhone 16 Pro Max, 15 Pro Max, 14 Pro Max)
- **Size:** 1320 x 2868 pixels (portrait) or 2868 x 1320 pixels (landscape)
- **Files:**
  - `iphone-6.9-01.png` - Today screen
  - `iphone-6.9-02.png` - Goals list
  - `iphone-6.9-03.png` - Goal detail with AI refinement
  - `iphone-6.9-04.png` - Daily habits tracking
  - `iphone-6.9-05.png` - Profile/achievements

### iPhone 6.7" Display (iPhone 16 Plus, 15 Plus, 14 Plus)
- **Size:** 1290 x 2796 pixels (portrait) or 2796 x 1290 pixels (landscape)
- **Files:**
  - `iphone-6.7-01.png` - Today screen
  - `iphone-6.7-02.png` - Goals list
  - `iphone-6.7-03.png` - Goal detail with AI refinement
  - `iphone-6.7-04.png` - Daily habits tracking
  - `iphone-6.7-05.png` - Profile/achievements

### iPhone 6.5" Display (iPhone 11 Pro Max, XS Max)
- **Size:** 1242 x 2688 pixels (portrait) or 2688 x 1242 pixels (landscape)
- **Files:**
  - `iphone-6.5-01.png` - Today screen
  - `iphone-6.5-02.png` - Goals list
  - `iphone-6.5-03.png` - Goal detail with AI refinement
  - `iphone-6.5-04.png` - Daily habits tracking
  - `iphone-6.5-05.png` - Profile/achievements

### iPhone 5.5" Display (iPhone 8 Plus, 7 Plus, 6s Plus)
- **Size:** 1242 x 2208 pixels (portrait) or 2208 x 1242 pixels (landscape)
- **Files:**
  - `iphone-5.5-01.png` - Today screen
  - `iphone-5.5-02.png` - Goals list
  - `iphone-5.5-03.png` - Goal detail with AI refinement
  - `iphone-5.5-04.png` - Daily habits tracking
  - `iphone-5.5-05.png` - Profile/achievements

### iPad Pro 12.9" (6th gen)
- **Size:** 2048 x 2732 pixels (portrait) or 2732 x 2048 pixels (landscape)
- **Files:**
  - `ipad-12.9-01.png` - Today screen
  - `ipad-12.9-02.png` - Goals list
  - `ipad-12.9-03.png` - Goal detail with AI refinement
  - `ipad-12.9-04.png` - Daily habits tracking
  - `ipad-12.9-05.png` - Profile/achievements

### iPad Pro 12.9" (2nd gen)
- **Size:** 2048 x 2732 pixels (portrait) or 2732 x 2048 pixels (landscape)
- Same files as 6th gen can be reused

## Screenshot Guidelines

1. **Minimum Required:** 3 screenshots per device size
2. **Maximum Allowed:** 10 screenshots per device size
3. **File Format:** PNG or JPEG
4. **No Alpha Transparency:** Screenshots must not have transparency
5. **Content Guidelines:**
  - Show actual app functionality
  - Avoid placeholder or dummy content
  - Use realistic family planning scenarios
  - Highlight key features: daily planning, goals, habits, achievements

## Screenshot Capture Tips

Use iOS Simulator for consistent screenshots:

```bash
# Start Expo dev server
npx expo start

# Press 'i' to open iOS Simulator
# Use Cmd+S in Simulator to save screenshot

# Or use xcrun for specific device:
xcrun simctl screenshot booted ~/Desktop/screenshot.png
```

## Recommended Screenshot Scenes

1. **Today Screen** - Show a day with intentions, priorities, habits, and tasks
2. **Goals List** - Display goals with progress bars across different time scales
3. **Goal Detail** - Show SMART goal with AI refinement suggestions
4. **Habits Tracking** - Non-negotiables section with streaks and completion
5. **Profile/Achievements** - Badges, points, and streak celebrations
