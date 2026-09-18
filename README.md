# DINOVA

집중 시간이 얼음을 녹이고 공룡을 부활시키며 3D 세계를 확장하는 포커스 웹앱입니다.

## Stack

- React 19
- Vite 7
- Three.js / WebGL
- localStorage persistence
- GLSL melt shader

## Current prototype

- MelTime: 15 / 25 / 45 / 60분 타이머, pause/resume, Melt Preview
- Collection: 부활 진행/잠금 상태
- Map: Three.js 3D Meadow, rotate/zoom, 해금 공룡 배치
- Profile: 집중 통계와 achievement UI
- Master art direction: mint low-poly Brachiosaurus, ivory belly, charcoal dot eyes

현재 GLB 경로 계약은 유지하되 모델 파일이 없을 경우 동일 팔레트의 procedural low-poly dinosaur로 fallback합니다.

## Local development

```bash
npm install
npm run dev
```

기본 개발 포트는 `4173`입니다.

## Verification

```bash
npm test
npm run check
npm run build
```

## Vercel

Vercel에서 이 GitHub repository를 Import하면 Vite를 자동 인식합니다.

- Build Command: `npm run build`
- Output Directory: `dist`

이후 `main`에 push하면 Vercel Git Integration을 통해 자동 배포됩니다.
