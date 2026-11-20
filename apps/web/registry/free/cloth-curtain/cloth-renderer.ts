import type { ClothPanel } from "./cloth-simulation";

/** Distance from the camera to the z=0 plane. Points at z=0 land exactly on frame coordinates; only the depth of the folds produces perspective. */
const CAMERA_DISTANCE = 3.2;

const VERTEX_SHADER = `
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aUv;
uniform float uAspect;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;
void main() {
  vPosition = aPosition;
  vNormal = aNormal;
  vUv = aUv;
  float w = (${CAMERA_DISTANCE.toFixed(1)} - aPosition.z) / ${CAMERA_DISTANCE.toFixed(1)};
  gl_Position = vec4(aPosition.x / uAspect, aPosition.y, -aPosition.z * 0.1, w);
}
`;

/**
 * Anime-style cel shading to match the scene and character art: the cloth motion is physically simulated, but the colours are painted.
 * Only three tones (light, mid, dark), shadows shift toward blue-violet, and folds turned sideways get a thin line.
 * No fabric texture or continuous gradients: add either and it becomes realistic cloth, detached from the background.
 */
const fragmentShader = (tones: ClothTones) => `
precision highp float;
uniform float uSheer;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;

const vec3 LIGHT_TONE = ${vec3(tones.light)};
const vec3 BASE_TONE = ${vec3(tones.base)};
const vec3 SHADOW_TONE = ${vec3(tones.shadow)};
const vec3 LINE_TONE = ${vec3(tones.line)};

void main() {
  vec3 view = normalize(vec3(0.0, 0.0, ${CAMERA_DISTANCE.toFixed(1)}) - vPosition);
  vec3 normal = normalize(vNormal);
  if (dot(normal, view) < 0.0) normal = -normal;

  float facing = clamp(dot(normal, view), 0.0, 1.0);
  float lit = dot(normal, normalize(vec3(-0.62, 0.3, 0.72))) + vPosition.z * 0.9;

  vec3 color = mix(SHADOW_TONE, BASE_TONE, smoothstep(0.4, 0.46, lit));
  color = mix(color, LIGHT_TONE, smoothstep(0.8, 0.86, lit));
  color = mix(color, LINE_TONE, smoothstep(0.2, 0.14, facing));

  float hem = step(0.965, vUv.y) * (1.0 - step(0.972, vUv.y));
  color = mix(color, SHADOW_TONE, hem);

  float alpha = 1.0 - uSheer * smoothstep(0.4, 0.46, lit);
  gl_FragColor = vec4(color * alpha, alpha);
}
`;

/** Colours of the three cel tones plus the outline, each an RGB in 0 to 1. Defaults to a thick dark wine-red curtain; the original pink can be passed back through tones. */
export interface ClothTones {
  light: readonly [number, number, number];
  base: readonly [number, number, number];
  shadow: readonly [number, number, number];
  line: readonly [number, number, number];
}

export const DEFAULT_CLOTH_TONES: ClothTones = {
  light: [0.6, 0.27, 0.22],
  base: [0.45, 0.18, 0.15],
  shadow: [0.27, 0.11, 0.1],
  line: [0.14, 0.06, 0.06],
};

function vec3([r, g, b]: readonly [number, number, number]): string {
  return `vec3(${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)})`;
}

export interface ClothRenderer {
  resize(pixelWidth: number, pixelHeight: number, aspect: number): void;
  draw(panels: ClothPanel[]): void;
  dispose(): void;
}

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
}

/** Returns undefined when the device has no WebGL, so the caller draws a static curtain instead. */
export function createClothRenderer(
  canvas: HTMLCanvasElement,
  sheer: number,
  tones: ClothTones = DEFAULT_CLOTH_TONES
): ClothRenderer | undefined {
  const gl = canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: true });
  if (!gl) return undefined;

  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentShader(tones));
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return undefined;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return undefined;
  gl.useProgram(program);

  const positionBuffer = gl.createBuffer();
  const normalBuffer = gl.createBuffer();
  const uvBuffer = gl.createBuffer();
  const indexBuffer = gl.createBuffer();
  const bindAttribute = (name: string, size: number, buffer: WebGLBuffer | null) => {
    const location = gl.getAttribLocation(program, name);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
  };

  gl.uniform1f(gl.getUniformLocation(program, "uSheer"), sheer);
  const aspectLocation = gl.getUniformLocation(program, "uAspect");

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  return {
    resize(pixelWidth, pixelHeight, aspect) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
      gl.viewport(0, 0, pixelWidth, pixelHeight);
      gl.uniform1f(aspectLocation, aspect);
    },
    draw(panels) {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      for (const panel of panels) {
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, panel.positions, gl.DYNAMIC_DRAW);
        bindAttribute("aPosition", 3, positionBuffer);
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, panel.normals, gl.DYNAMIC_DRAW);
        bindAttribute("aNormal", 3, normalBuffer);
        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, panel.uvs, gl.STATIC_DRAW);
        bindAttribute("aUv", 2, uvBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, panel.indices, gl.STATIC_DRAW);
        gl.drawElements(gl.TRIANGLES, panel.indices.length, gl.UNSIGNED_SHORT, 0);
      }
    },
    dispose() {
      // Must not loseContext: when the same canvas remounts (StrictMode does this) it needs a usable context again.
      for (const buffer of [positionBuffer, normalBuffer, uvBuffer, indexBuffer]) gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    },
  };
}
