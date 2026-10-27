---
name: photo-enhancer
description: >-
  Ultra-realistic optical photo enhancement and editorial framing framework.
  Enhances photographs with optical darkroom tone grading, perspective alignment,
  and 4:5 editorial framing while strictly preserving 100% of the real person (zero AI redrawing).
---

# Ultra-Realistic Optical Photo Enhancer (v1.1 Framework)

This skill formalizes the **v1.1 Golden Framework** for portrait and environmental photo enhancement. It produces authentic, high-end editorial photographs without altering facial identity, expressions, or natural fabric textures.

> [!IMPORTANT]
> **Core Principle: Zero Generative Redraw**
> Never pass real personal photos to text-to-image or diffusion generation engines. All enhancements operate strictly on the camera sensor's original captured pixels using optical signal processing, photographic curves, perspective correction, and balanced composition.

---

## 1. The 3-Pillar Enhancement Framework

```
[Raw Camera Capture]
         │
         ▼
 ┌─────────────────────────────────────────────────────────────┐
 │ 1. Optical Darkroom Grade                                   │
 │    - Dehaze & Black Point Calibration (-level 1.5%,98.5%)   │
 │    - Film S-Curve Contrast (-sigmoidal-contrast 2.5x50%)    │
 │    - Natural Skin Tone Warmth & Vibrance (-modulate)        │
 │    - Optical Micro-Sharpening & Catchlights (-unsharp)      │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │ 2. Perspective & Horizon Alignment                          │
 │    - Keystone correction (straighten vertical lines)        │
 │    - Rotational leveling (eliminate subtle camera tilt)     │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │ 3. 4:5 Editorial Ratio & Rule-of-Thirds Cropping            │
 │    - Eliminate dead headroom (top 20-30% empty ceiling)     │
 │    - Align subject's eyes to the upper-third horizontal grid│
 │    - Balance vertical posture for commanding presence       │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
                     [Final Enhanced Image]
```

---

## 2. Parameter Blueprint

| Operation | ImageMagick CLI Command | Purpose |
| :--- | :--- | :--- |
| **Black Point & Dehaze** | `-level 1.5%,98.5%,0.98` | Strips milky lens flare, establishes rich optical blacks in hair and fabric. |
| **Photographic Contrast**| `-sigmoidal-contrast 2.5x50%` | Analog film response curve; smooth shadow rolloff without clipped highlights. |
| **Color & Vitality**     | `-modulate 102,112,100` | Infuses natural skin warmth, enhances greens and blues, removes cool cast. |
| **Optical Clarity**      | `-unsharp 0x1.0+1.2+0.015` | Sharpens eye pupils, catchlights, beard hair, and fabric weave without halos. |
| **Horizon Alignment**    | `-rotate -0.6` *(calibrated per shot)* | Levels floor/stair tilt and corrects camera angle. |
| **Editorial Framing**    | `-crop 2480x3100+65+180 +repage` | Formats to exact 4:5 ratio, placing eyes on the upper third. |

---

## 3. Automation Script

The framework includes a standalone script at [enhance.ps1](file:///c:/August/.agents/skills/photo-enhancer/scripts/enhance.ps1):

```powershell
powershell -ExecutionPolicy Bypass -File "c:\August\.agents\skills\photo-enhancer\scripts\enhance.ps1" `
  -InputPath "C:\path\to\photo.jpg" `
  -OutputPath "C:\path\to\enhanced.jpg" `
  -RotateAngle -0.6
```
