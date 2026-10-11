"use client";

import { useEffect, useRef } from "react";
import {
  heroSceneBuffer,
  heroScenePolicy,
  type HeroScenePolicy,
} from "@/lib/hero-scene-policy";

/* Scene brief: quiet charcoal -> warped green light -> authentic logo ->
   existing grocery photograph -> grain/vignette -> semantic DOM content.
   A single native WebGL pass replaces only the decorative fallback image.
   Bound/damped pointer input and slow time evolution share one light field.
   Mobile/reduced-motion/weak hardware retain the CSS scene without a GPU loop. */
const vertexSource = `
attribute vec2 position;
varying vec2 uv;
void main() {
  uv = vec2(position.x * .5 + .5, .5 - position.y * .5);
  gl_Position = vec4(position, 0., 1.);
}`;

const fragmentSource = `
precision highp float;
varying vec2 uv;
uniform vec2 resolution;
uniform float time;
uniform vec2 pointer;
uniform vec4 photoRect;
uniform sampler2D photo;
uniform sampler2D mark;
float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * .1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f*f*(3.-2.*f);
  return mix(mix(hash(i), hash(i+vec2(1.,0.)), f.x),
             mix(hash(i+vec2(0.,1.)), hash(i+1.), f.x), f.y);
}
void main() {
  float aspect = resolution.x / resolution.y;
  vec2 p = (uv-.5)*vec2(aspect,1.);
  float n = noise(p*3. + vec2(time*.035,-time*.018));
  float detail = noise(p*6. - vec2(time*.018,time*.025));
  vec2 light = vec2(.24*aspect,-.04) + pointer*vec2(.035*aspect,.025);
  vec2 field = (p-light)/vec2(.5*aspect,.62);
  float glow = exp(-dot(field,field)*2.);
  float sweep = .64 + .045*sin(uv.x*4. + time*.09) + (n-.5)*.04;
  float ribbon = exp(-abs(uv.y-sweep)*18.) * smoothstep(.3,.8,uv.x);
  float quiet = smoothstep(.24,.64,uv.x);
  vec3 color = vec3(.014,.023,.017);
  color += vec3(.006,.21,.055)*glow*(.8+.2*n)*quiet;
  color += vec3(.008,.11,.041)*ribbon*quiet;
  vec2 markUv = (uv-vec2(.68,.46)-pointer*vec2(.007,.005)) /
                vec2(.95/aspect,.95) + .5;
  vec4 logo = texture2D(mark, clamp(markUv,0.,1.));
  float logoBounds = step(0.,markUv.x)*step(markUv.x,1.)*
                     step(0.,markUv.y)*step(markUv.y,1.);
  color += logo.rgb*logo.a*logoBounds*.14*quiet;

  vec2 photoUv = (uv-photoRect.xy)/photoRect.zw;
  float bounds = step(0.,photoUv.x)*step(photoUv.x,1.)*
                 step(0.,photoUv.y)*step(photoUv.y,1.);
  photoUv -= pointer*vec2(.0025,.0018);
  vec4 grocery = texture2D(photo,clamp(photoUv,0.,1.));
  // Only the saturated emerald backdrop is softened. Warm products and
  // yellow-green foliage retain their original texture, color and detail.
  float backdrop = smoothstep(.10,.26,grocery.g-grocery.r) *
                   smoothstep(.04,.14,grocery.b-grocery.r);
  float distortion = backdrop * .0015;
  grocery = texture2D(photo,clamp(photoUv +
               vec2(n-.5,detail-.5)*distortion,0.,1.));
  float edge = smoothstep(0.,.03,photoUv.x)*smoothstep(1.,.97,photoUv.x)*
               smoothstep(0.,.04,photoUv.y)*smoothstep(1.,.95,photoUv.y);
  float photoAlpha = bounds*edge*(1.-backdrop*.94);
  color = mix(color,grocery.rgb,photoAlpha);
  float vignette = 1.-.28*smoothstep(.28,.72,length((uv-.5)*vec2(1.,.9)));
  color *= vignette;
  color += (hash(gl_FragCoord.xy+time*.3)-.5)*.003;
  gl_FragColor = vec4(max(color,0.),1.);
}`;

function loadImage(src: string, signal: AbortSignal) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    const finish = () => {
      image.onload = null;
      image.onerror = null;
      signal.removeEventListener("abort", abort);
    };
    const abort = () => {
      finish();
      image.src = "";
      reject(new Error("Scene load cancelled"));
    };
    image.onload = () => {
      finish();
      resolve(image);
    };
    image.onerror = () => {
      finish();
      reject(new Error("Scene asset unavailable"));
    };
    signal.addEventListener("abort", abort, { once: true });
    image.src = src;
    if (signal.aborted) abort();
  });
}

function createScene(
  canvas: HTMLCanvasElement,
  host: HTMLElement,
  images: HTMLImageElement[],
  initialPolicy: HeroScenePolicy,
) {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
    failIfMajorPerformanceCaveat: true,
    preserveDrawingBuffer: false,
  });
  if (!gl) throw new Error("WebGL unavailable");
  const shaders: WebGLShader[] = [];
  const textures: WebGLTexture[] = [];
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let frame = 0;
  let disposed = false;
  let visible = false;
  let lost = false;
  let policy = initialPolicy;
  let previousTime = 0;
  let nextFrameTime = 0;
  let sceneTime = 0;
  let slowFrames = 0;
  let samples = 0;
  let targetX = 0,
    targetY = 0,
    currentX = 0,
    currentY = 0;
  const release = () => {
    for (const texture of textures) gl.deleteTexture(texture);
    for (const shader of shaders) gl.deleteShader(shader);
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
  };
  try {
    const highp = gl.getShaderPrecisionFormat(
      gl.FRAGMENT_SHADER,
      gl.HIGH_FLOAT,
    );
    for (const [type, source] of [
      [gl.VERTEX_SHADER, vertexSource],
      [
        gl.FRAGMENT_SHADER,
        highp?.precision
          ? fragmentSource
          : fragmentSource.replace("highp", "mediump"),
      ],
    ] as const) {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("Shader allocation failed");
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
    }
    program = gl.createProgram();
    if (!program) throw new Error("Scene allocation failed");
    for (const shader of shaders) gl.attachShader(program, shader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new Error("Scene shader unavailable");
    gl.useProgram(program);
    buffer = gl.createBuffer();
    if (!buffer) throw new Error("Scene buffer unavailable");
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    images.forEach((image, index) => {
      const texture = gl.createTexture();
      if (!texture) throw new Error("Scene texture unavailable");
      textures.push(texture);
      gl.activeTexture(gl.TEXTURE0 + index);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image,
      );
      gl.uniform1i(
        gl.getUniformLocation(program!, index === 0 ? "photo" : "mark"),
        index,
      );
    });
  } catch (error) {
    release();
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    throw error;
  }
  const resolution = gl.getUniformLocation(program, "resolution");
  const time = gl.getUniformLocation(program, "time");
  const pointer = gl.getUniformLocation(program, "pointer");
  const photoRect = gl.getUniformLocation(program, "photoRect");
  const resize = () => {
    const rect = host.getBoundingClientRect();
    const image = host.querySelector<HTMLImageElement>(".hero-image");
    if (!image || !rect.width || !rect.height) return;
    const imageRect = image.getBoundingClientRect();
    const scale = Math.min(
      imageRect.width / images[0].naturalWidth,
      imageRect.height / images[0].naturalHeight,
    );
    const photoWidth = scale * images[0].naturalWidth,
      photoHeight = scale * images[0].naturalHeight;
    const size = heroSceneBuffer(
      rect.width,
      rect.height,
      window.devicePixelRatio || 1,
      policy,
    );
    canvas.width = size.width;
    canvas.height = size.height;
    gl.viewport(0, 0, size.width, size.height);
    gl.uniform2f(resolution, rect.width, rect.height);
    gl.uniform4f(
      photoRect,
      (imageRect.right - photoWidth - rect.left) / rect.width,
      (imageRect.top + (imageRect.height - photoHeight) / 2 - rect.top) /
        rect.height,
      photoWidth / rect.width,
      photoHeight / rect.height,
    );
    canvas.dataset.quality = policy.mode;
  };
  const draw = (now: number) => {
    if (disposed || lost || !visible || document.hidden) return;
    frame = requestAnimationFrame(draw);
    if (now < nextFrameTime - 1) return;
    const delta = previousTime ? now - previousTime : 1000 / policy.fps;
    const interval = 1000 / policy.fps;
    // Keep the budget clock independent of draw time: a 144Hz display should
    // not round every 60fps frame up to three display ticks (about 48fps).
    nextFrameTime = nextFrameTime ? nextFrameTime + interval : now + interval;
    if (nextFrameTime < now) nextFrameTime = now + interval;
    previousTime = now;
    sceneTime += Math.min(delta, 80) / 1000;
    const damping = 1 - Math.exp(-Math.min(delta, 80) / 180);
    currentX += (targetX - currentX) * damping;
    currentY += (targetY - currentY) * damping;
    gl.uniform1f(time, sceneTime);
    gl.uniform2f(pointer, currentX, currentY);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    // Sustained missed desktop frames trigger one cheaper 30fps/low-scale mode.
    if (policy.mode === "full" && ++samples <= 120) {
      if (delta > 26) slowFrames++;
      if (samples === 120 && slowFrames > 45) {
        policy = { mode: "lite", fps: 30, maxDpr: 1, scale: 0.75 };
        resize();
      }
    }
    if (host.dataset.heroScene !== "webgl") host.dataset.heroScene = "webgl";
  };
  const schedule = () => {
    cancelAnimationFrame(frame);
    previousTime = 0;
    nextFrameTime = 0;
    const running = visible && !document.hidden && !lost;
    canvas.dataset.state = running ? "running" : "paused";
    if (running) frame = requestAnimationFrame(draw);
  };
  const move = (event: PointerEvent) => {
    if (
      event.pointerType !== "mouse" ||
      !matchMedia("(hover: hover) and (pointer: fine)").matches
    )
      return;
    const rect = host.getBoundingClientRect();
    targetX = Math.max(
      -1,
      Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1),
    );
    targetY = Math.max(
      -1,
      Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1),
    );
  };
  const leave = () => {
    targetX = 0;
    targetY = 0;
  };
  const contextLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    schedule();
    canvas.dataset.state = "context-lost";
    delete host.dataset.heroScene;
  };
  const intersection = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      schedule();
    },
    { threshold: 0.05 },
  );
  const observer = new ResizeObserver(resize);
  resize();
  observer.observe(host);
  intersection.observe(host);
  host.addEventListener("pointermove", move, { passive: true });
  host.addEventListener("pointerleave", leave);
  host.addEventListener("pointercancel", leave);
  document.addEventListener("visibilitychange", schedule);
  canvas.addEventListener("webglcontextlost", contextLost);
  return (destroy = false) => {
    disposed = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    intersection.disconnect();
    host.removeEventListener("pointermove", move);
    host.removeEventListener("pointerleave", leave);
    host.removeEventListener("pointercancel", leave);
    document.removeEventListener("visibilitychange", schedule);
    canvas.removeEventListener("webglcontextlost", contextLost);
    delete host.dataset.heroScene;
    release();
    if (destroy) gl.getExtension("WEBGL_lose_context")?.loseContext();
  };
}

export function HeroVisualScene() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const host = canvas?.closest<HTMLElement>(".hero-card");
    if (!canvas || !host) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const device = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean };
    };
    let controller = new AbortController();
    let cleanup: ((destroy?: boolean) => void) | undefined;
    let key = "";
    const refresh = () => {
      const policy = heroScenePolicy({
        width: innerWidth,
        reducedMotion: reduced.matches,
        saveData: device.connection?.saveData ?? false,
        cores: device.hardwareConcurrency,
        memory: device.deviceMemory,
      });
      if (key === policy.mode) return;
      key = policy.mode;
      controller.abort();
      cleanup?.();
      cleanup = undefined;
      controller = new AbortController();
      const signal = controller.signal;
      canvas.dataset.state = "static";
      if (policy.mode === "static") return;
      canvas.dataset.state = "loading";
      void Promise.all([
        loadImage("/images/paykar/hero.webp", signal),
        loadImage("/icon.png", signal),
      ])
        .then((images) => {
          if (!signal.aborted)
            cleanup = createScene(canvas, host, images, policy);
        })
        .catch(() => {
          if (!signal.aborted) canvas.dataset.state = "fallback";
        });
    };
    refresh();
    reduced.addEventListener("change", refresh);
    window.addEventListener("resize", refresh, { passive: true });
    return () => {
      controller.abort();
      cleanup?.(true);
      reduced.removeEventListener("change", refresh);
      window.removeEventListener("resize", refresh);
    };
  }, []);
  return <canvas ref={ref} className="hero-visual-scene" aria-hidden="true" />;
}
