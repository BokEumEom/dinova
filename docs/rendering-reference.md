# Rendering reference

Studied: https://github.com/iamtechartist/coastal-simulation (Techartist, MIT)

Read src/shading.js, src/surface.js, src/camera.js and src/performance.js on 2026-09-20.
The reference uses Three WebGPU/TSL, interpolated shallow-water fields, depth-sensitive transmission, Fresnel reflections, advected foam and caustics.

MeltTime keeps its existing WebGL renderer. src/park-water.ts is an original lightweight GLSL implementation using an artist-defined river cross-section, animated ripples, edge foam, caustic-like highlights and view-dependent sky tint. It does not import the reference's solver, mirror renderer, WASM, or source code. The conceptual techniques informed the implementation; no equivalent physical simulation or visual parity is claimed.

Static flowers are merged by color to reduce draw calls. Device pixel ratio is capped at 1.7 in the park. Reduced motion stops water, foliage and dinosaur animation. Camera controls remain usable.
