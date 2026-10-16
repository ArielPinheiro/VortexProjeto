import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';

/**
 * OrbScene — Esfera 3D com shader customizado (Three.js).
 *
 * Expõe via ref:
 *   • dive(callback)  — câmera mergulha dentro da esfera; chama callback ao terminar.
 *   • reset()          — volta instantaneamente ao estado inicial.
 *   • get container()  — retorna o elemento DOM do wrapper (para animação FLIP).
 */
const OrbScene = forwardRef(function OrbScene(_props, ref) {
  const containerRef = useRef(null);
  const state = useRef({});

  useImperativeHandle(ref, () => ({
    dive(callback) {
      const s = state.current;
      if (!s.scene) return;
      s.busy = true;
      s.hovering = false;
      s.doneCb = callback;
      s.diveTarget = 1;
    },
    reset() {
      const s = state.current;
      s.busy = false;
      s.doneCb = null;
      s.diveTarget = 0;
      s.dive = 0;
    },
    get container() {
      return containerRef.current;
    },
  }));

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const T = THREE;
    const scene = new T.Scene();
    const cam = new T.PerspectiveCamera(38, 1, 0.05, 50);
    const renderer = new T.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.style.cssText =
      'width:100%;height:100%;display:block;position:relative;z-index:1';
    el.appendChild(renderer.domElement);

    /* ---------- Shaders (copiados exatamente do protótipo) ---------- */
    const vert = `varying vec3 vN;varying vec3 vP;varying vec3 vV;
void main(){vP=position;vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vV=-mv.xyz;gl_Position=projectionMatrix*mv;}`;

    const frag = `precision highp float;
uniform float uTime;uniform float uMouseOn;uniform float uDive;uniform vec3 uMouse;
varying vec3 vN;varying vec3 vP;varying vec3 vV;
float h(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float n3(vec3 x){vec3 i=floor(x);vec3 f=fract(x);f=f*f*(3.-2.*f);
return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),
mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float a=.5;float s=0.;for(int i=0;i<4;i++){s+=a*n3(p);p*=2.02;a*=.5;}return s;}
void main(){
  vec3 N=normalize(vN);vec3 V=normalize(vV);
  float fres=pow(1.-max(dot(N,V),0.),2.);
  vec3 p=normalize(vP);
  float t=uTime*.07;
  vec3 q=p*2.1+vec3(t,-t*.7,t*.5);
  float n=fbm(q+fbm(q*1.4+3.)*1.3);
  float c=abs(fract(n*6.)-.5);
  float line=1.-smoothstep(0.,.07,c);
  vec3 col=vec3(.015,.04,.1);
  col+=vec3(.1,.5,1.)*line*(.3+fres*1.1)*.85;
  col+=vec3(.08,.45,1.)*pow(fres,1.4)*1.1;
  float fleck=smoothstep(.7,.8,fbm(p*7.-vec3(uTime*.15)));
  float hot=smoothstep(.6,0.,distance(p,normalize(uMouse)))*uMouseOn*smoothstep(.4,.7,fbm(p*6.+vec3(uTime*.4)));
  float red=clamp(hot*1.4+fleck*(.35+.4*uMouseOn),0.,1.);
  col=mix(col,vec3(1.,.13,.1),red);
  col+=vec3(.9,.1,.1)*red*line*.5;
  float a=mix(.94,1.,fres)*(1.-smoothstep(.3,.8,uDive)*.97);
  gl_FragColor=vec4(col,a);
}`;

    /* ---------- Uniforms ---------- */
    const uniforms = {
      uTime: { value: 0 },
      uMouse: { value: new T.Vector3(0, 0, 1) },
      uMouseOn: { value: 0 },
      uDive: { value: 0 },
    };

    /* ---------- Sphere Mesh ---------- */
    const geo = new T.SphereGeometry(1.5, 96, 64);
    const mat = new T.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms,
      transparent: true,
    });
    const mesh = new T.Mesh(geo, mat);
    scene.add(mesh);

    /* ---------- Interaction state ---------- */
    const s = {
      scene,
      cam,
      renderer,
      mesh,
      uniforms,
      geo,
      mat,
      hovering: false,
      diveTarget: 0,
      dive: 0,
      busy: false,
      doneCb: null,
      animId: null,
    };
    state.current = s;

    const ray = new T.Raycaster();
    const ndc = new T.Vector2();

    const onPointerMove = (e) => {
      const b = el.getBoundingClientRect();
      ndc.set(
        ((e.clientX - b.left) / b.width) * 2 - 1,
        -((e.clientY - b.top) / b.height) * 2 + 1,
      );
      s.hovering = true;
    };

    const onPointerLeave = () => {
      s.hovering = false;
    };

    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerleave', onPointerLeave);

    /* ---------- Resize ---------- */
    function size() {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    }
    const ro = new ResizeObserver(size);
    ro.observe(el);
    size();

    /* ---------- Reduced‑motion check ---------- */
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    /* ---------- Animation loop ---------- */
    const t0 = performance.now();

    function tick(now) {
      const t = (now - t0) / 1000;

      s.dive += (s.diveTarget - s.dive) * 0.045;
      if (s.doneCb && s.dive > 0.97) {
        const f = s.doneCb;
        s.doneCb = null;
        f();
      }

      const d = s.dive * s.dive * (3 - 2 * s.dive); // smoothstep
      cam.position.set(0, 0.2 * (1 - d), 6 - 5.55 * d);
      cam.lookAt(0, 0, 0);

      if (!prefersReducedMotion) {
        mesh.rotation.y = t * 0.12;
      }
      mesh.rotation.x = 0.2;
      mesh.updateMatrixWorld();

      let on = 0;
      if (s.hovering && d < 0.2) {
        ray.setFromCamera(ndc, cam);
        const hit = ray.intersectObject(mesh)[0];
        if (hit) {
          uniforms.uMouse.value.copy(mesh.worldToLocal(hit.point.clone()));
          on = 1;
        }
      }
      uniforms.uMouseOn.value += (on - uniforms.uMouseOn.value) * 0.08;
      uniforms.uTime.value = t;
      uniforms.uDive.value = d;

      renderer.render(scene, cam);
      s.animId = requestAnimationFrame(tick);
    }

    s.animId = requestAnimationFrame(tick);

    /* ---------- Cleanup ---------- */
    return () => {
      if (s.animId) cancelAnimationFrame(s.animId);
      ro.disconnect();
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerleave', onPointerLeave);

      geo.dispose();
      mat.dispose();
      renderer.dispose();

      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="orb" aria-hidden="true" />;
});

export default OrbScene;
