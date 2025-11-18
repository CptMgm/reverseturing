# Visual Modes Guide

The Reverse Turing Test game offers multiple visual styles. This guide explains each mode and how to switch between them.

## Available Modes

### 1. 🌟 Minimalist Sci-Fi (Default - ECS)
**Location**: `src/components/GameSceneECS.jsx`

Modern, clean Apple-esque aesthetic with professional lighting and materials.

**Features**:
- Clean white environment with subtle blue accents (#4a9eff)
- Glass-like table with transmission material effects
- Minimalist geometric avatars with glowing elements
- Professional post-processing:
  - Subtle bloom for glows
  - SSAO (Screen Space Ambient Occlusion) for depth
  - ACES Filmic tone mapping for cinematic look
  - Minimal vignette for focus
- Built on Entity Component System (ECS) with Koota
- Optimized for both desktop and mobile
- Adaptive performance with AdaptiveDpr

**Color Palette**:
- Primary Background: `#fafafa` (off-white)
- Accent: `#4a9eff` (sky blue)
- Materials: White, chrome, glass
- Lighting: Soft white with blue accents

**Performance**: Excellent (60+ FPS on modern hardware)

---

### 2. ⚡ Cyberpunk Mode (Traditional React)
**Location**: `src/components/GameSceneCyberpunk.jsx`

Matrix/Tron/Blade Runner aesthetic with neon colors and digital effects.

**Features**:
- Dark environment with neon accents
- Hexagonal glass table with cyan edges
- Reflective floor with grid overlay
- Holographic moderator display
- Post-processing effects:
  - Strong bloom for neon glow
  - Chromatic aberration for digital glitch
  - Film grain/noise for analog feel
  - Vignette for atmosphere
  - Optional depth of field
- Uses traditional React Three Fiber approach (no ECS)

**Color Palette**:
- Neon Cyan: `#00F5FF`
- Deep Magenta: `#FF00FF`
- Electric Blue: `#0080FF`
- Toxic Green: `#39FF14`

**Performance**: Good (45-60 FPS on modern hardware)

---

### 3. 📊 Classic Mode (Legacy)
**Location**: `src/components/GameScene.jsx`

Original executive boardroom design with traditional aesthetics.

**Features**:
- Executive office environment
- Round poker table with felt center
- Marble floors with Persian rug
- Wooden paneling and windows
- Traditional lighting
- Basic shadows and materials
- Uses traditional React Three Fiber approach

**Performance**: Excellent (60+ FPS on most hardware)

---

## How to Switch Modes

### Method 1: Edit App.jsx (Recommended)

Open `src/App.jsx` and change the import on line 5:

**For Minimalist Sci-Fi (Default)**:
```javascript
import GameScene from './components/GameSceneECS';
```

**For Cyberpunk Mode**:
```javascript
import GameScene from './components/GameSceneCyberpunk';
```

**For Classic Mode**:
```javascript
import GameScene from './components/GameScene';
```

### Method 2: Environment Variable (Future)

You can create a `.env` variable to switch modes:

```env
VITE_VISUAL_MODE=minimalist  # or 'cyberpunk' or 'classic'
```

Then update `App.jsx`:
```javascript
const getGameScene = () => {
  const mode = import.meta.env.VITE_VISUAL_MODE || 'minimalist';

  switch(mode) {
    case 'cyberpunk':
      return GameSceneCyberpunk;
    case 'classic':
      return GameScene;
    default:
      return GameSceneECS;
  }
};

const GameScene = getGameScene();
```

---

## Customization

### Minimalist Sci-Fi Mode

**Change accent color**:
```javascript
// In TableSceneECS.jsx, search and replace:
'#4a9eff' → '#your-color'
```

**Adjust bloom intensity**:
```javascript
// In EffectsComposerMinimalist.jsx
<Bloom
  intensity={0.4} // Change this (0.1 - 2.0)
  luminanceThreshold={0.9} // Lower = more bloom
/>
```

**Disable SSAO** (for better performance):
```javascript
// In EffectsComposerMinimalist.jsx
// Comment out the SSAO component
{/* <SSAO ... /> */}
```

### Cyberpunk Mode

**Change neon color**:
```javascript
// In TableSceneCyberpunk.jsx, search and replace:
'#00F5FF' → '#your-neon-color'
```

**Adjust effects intensity**:
```javascript
// In EffectsComposerCyberpunk.jsx
<Bloom intensity={1.5} /> // Increase for more glow
<ChromaticAberration offset={0.002} /> // Increase for more glitch
<Noise opacity={0.08} /> // Increase for more grain
```

### Classic Mode

**Adjust lighting**:
```javascript
// In TableScene.jsx
<directionalLight intensity={2.2} /> // Change brightness
<ambientLight intensity={0.3} /> // Change ambient light
```

---

## Performance Comparison

| Mode | FPS (Desktop) | FPS (Mobile) | Memory | Draw Calls |
|------|---------------|--------------|--------|------------|
| Minimalist Sci-Fi | 60+ | 45-60 | Medium | ~50 |
| Cyberpunk | 50-60 | 30-45 | High | ~80 |
| Classic | 60+ | 50-60 | Low | ~40 |

**Optimization Tips**:
1. Use Minimalist mode for best balance
2. Disable post-processing for maximum performance
3. Reduce shadow quality on mobile
4. Use AdaptiveDpr for automatic quality adjustment

---

## Technical Differences

### ECS vs Traditional

**Minimalist Sci-Fi (ECS)**:
- ✅ Better separation of concerns
- ✅ Easier to extend and modify
- ✅ More maintainable
- ✅ Better performance for complex logic
- ⚠️ Slightly more setup code

**Cyberpunk/Classic (Traditional)**:
- ✅ Simpler to understand for beginners
- ✅ Less boilerplate
- ✅ Direct React patterns
- ⚠️ Can become messy with complex features

---

## Mobile Considerations

### Minimalist Sci-Fi
- Automatically adjusts camera position for mobile
- Disables zoom on mobile
- Reduced rotation speed
- Adaptive DPR reduces resolution on slower devices

### Cyberpunk
- Same effects on all devices
- May struggle on older mobile devices
- Consider disabling depth of field on mobile

### Classic
- Works well on most mobile devices
- Minimal effects = good performance

---

## Troubleshooting

### Low FPS
1. Switch to Classic mode
2. Disable post-processing effects
3. Reduce shadow quality
4. Enable AdaptiveDpr

### Visual Glitches
1. Check browser compatibility (Chrome/Edge recommended)
2. Update graphics drivers
3. Try a different visual mode

### Materials Not Rendering
1. Check console for WebGL errors
2. Ensure MeshTransmissionMaterial is supported
3. Fallback to MeshStandardMaterial

---

## Recommended Mode by Use Case

| Use Case | Recommended Mode | Why |
|----------|------------------|-----|
| Production/Demo | Minimalist Sci-Fi | Modern, clean, professional |
| Development | Classic | Fast iteration, simple |
| Showcase/Marketing | Cyberpunk | Eye-catching, impressive |
| Mobile-First | Classic or Minimalist | Best performance |
| Learning ECS | Minimalist Sci-Fi | See architecture in action |

---

## Future Enhancements

Planned features:
- [ ] Dynamic mode switching in UI
- [ ] Hybrid mode combining ECS with cyberpunk aesthetics
- [ ] VR mode
- [ ] Retro-futuristic mode (vaporwave aesthetic)
- [ ] Dark minimalist mode
- [ ] User-customizable color schemes
