# MeltTime

모바일 우선 집중·공룡 수집·3D 공원 꾸미기 웹앱. 한국어 기본, 설정에서 영어 전환.

## 실행

```sh
pnpm install
pnpm dev --port 5174
pnpm build
pnpm test
```

## 현재 구현

- 18종 Blender GLB를 집중 화면과 Three.js 공원에서 공유합니다. 컬렉션 썸네일은 같은 .blend 파일을 렌더링합니다.
- 해동되지 않은 컬렉션은 푸른 실루엣과 ??? 이름으로 표시합니다.
- 다면체 얼음, 균열, 진행률에 따른 해동, 공룡을 둘러보는 카메라.
- 회전·확대 가능한 3D 섬, 강·폭포·다리·나무·캠핑장·전망대. 해동된 공룡과 7종 장식을 배치·이동·크기 변경·반전하고 저장합니다.
- 낮·노을·밤 조명, 바람에 따른 물결·나무 움직임, 밤의 발광 등불. 환경 설정은 현재 화면에서만 유지됩니다.
- 공룡 터치 반응 및 걷기·먹기·둘러보기·기쁨·수면 동작. 현재 3D 화면은 Three.js 절차적 애니메이션을 사용합니다. 기존 Rive 파일과 구현은 보관하지만 3D 화면에서는 실행하지 않습니다.
- 5·15·25·45분 집중 타이머. 완료된 세션만 보상·통계 반영. 미리보기와 공원 체험은 보상에서 분리.
- localStorage melttime-v2 저장, v1 마이그레이션. 기기 간 동기화 없음.

## 에셋 재생성

Blender에서 다음 스크립트를 순서대로 실행합니다.

```sh
blender --background --python tools/build_dinosaurs_3d.py
blender --background --python tools/render_thumbnails.py
blender --background --python tools/build_ice.py
```

모델: public/models/*.blend 및 *.glb. 썸네일: public/models/thumbs/*.png.
원본 PNG·JPEG·MP4는 보존합니다. public/images/reference-*.webp는 원화 참고용입니다.

## 표현 범위

원화의 민트색, 밝은 배, 체형 및 종별 특징을 참고해 만든 수작업 절차적 모델입니다. 원화와 동일한 원본 3D 에셋을 복원한 것은 아니며 얼굴·관절·실루엣에는 차이가 있습니다. 골격 리깅과 애니메이션 클립 대신 메시 변형으로 움직입니다. 물은 WebGL 셰이더 표현이며 물리 유체 시뮬레이션이 아닙니다. 실제 모바일 기기의 프레임 성능은 별도 측정이 필요합니다.

렌더링 참고: docs/rendering-reference.md.

## 이전 코드 아카이브

이 저장소의 기존 React 구현은 rchive/pre-replacement-main-2026-09-27에, 기존 기능 브랜치는 rchive/pre-replacement-asset-ui-refresh-2026-09-27에 보존했습니다. Git 기록으로 전체 코드를 복원할 수 있습니다.
