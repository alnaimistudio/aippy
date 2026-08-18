import * as THREE from 'three';

// Forest Stalker V5.5 performance layer. Keeps V5.4 gameplay untouched.
const coarse = matchMedia('(pointer: coarse)').matches || innerWidth < 700;

// game54 updates the camera projection every frame even when nothing changed.
// Memoizing identical projection parameters removes that unnecessary matrix work.
const originalProjection = THREE.PerspectiveCamera.prototype.updateProjectionMatrix;
THREE.PerspectiveCamera.prototype.updateProjectionMatrix = function () {
  const key = `${this.fov}|${this.aspect}|${this.near}|${this.far}|${this.zoom}|${this.filmGauge}|${this.filmOffset}`;
  if (this.userData.__fsProjectionKey === key) return;
  this.userData.__fsProjectionKey = key;
  return originalProjection.call(this);
};

const originalRender = THREE.WebGLRenderer.prototype.render;
const states = new WeakMap();
THREE.WebGLRenderer.prototype.render = function (scene, camera) {
  if (this.domElement?.id === 'g') {
    let s = states.get(this);
    if (!s) {
      s = { start: performance.now(), last: performance.now(), frames: 0, sum: 0, tuned: false, scan: 0, shadowsFrozen: false };
      states.set(this, s);

      // 3x iPhones do not need a 3x WebGL buffer for this scope view.
      const targetDpr = Math.min(devicePixelRatio || 1, coarse ? 1.38 : 1.55);
      if (this.getPixelRatio() > targetDpr) this.setPixelRatio(targetDpr);

      // Mobile shadow texture is smaller but visually nearly identical through the scope.
      scene.traverse(o => {
        if (o.isDirectionalLight && o.castShadow) {
          const q = coarse ? 768 : 1024;
          o.shadow.mapSize.set(q, q);
        }
      });
    }

    const now = performance.now();
    const dt = now - s.last;
    s.last = now;
    if (dt > 0 && dt < 100) { s.frames++; s.sum += dt; }

    // Skinned deer shadows are expensive on mobile. Keep them lit/grounded, but let the
    // static forest own the shadow map. Re-scan occasionally because deer load async.
    if ((s.scan++ % 75) === 0) {
      scene.traverse(o => { if (o.isSkinnedMesh) o.castShadow = false; });
    }

    // The sun and forest are static, so one populated shadow map is enough.
    if (!s.shadowsFrozen && s.frames > 3) {
      this.shadowMap.autoUpdate = false;
      s.shadowsFrozen = true;
    }

    // One-time adaptive quality pass after gameplay has had time to settle.
    if (!s.tuned && now - s.start > 4500 && s.frames > 80) {
      const fps = 1000 / (s.sum / s.frames);
      let quality = 'high';
      if (coarse && fps < 50) {
        const dpr = fps < 38 ? 1.0 : 1.16;
        this.setPixelRatio(Math.min(devicePixelRatio || 1, dpr));
        quality = fps < 38 ? 'performance' : 'balanced';
        if (fps < 34) this.shadowMap.enabled = false;
      }
      window.__forestStalkerPerf = {
        version: '5.5', fps: Math.round(fps * 10) / 10, quality,
        dpr: this.getPixelRatio(), adaptive: true
      };
      s.tuned = true;
    }
  }
  return originalRender.call(this, scene, camera);
};
