precision highp float;
uniform float t;
uniform float dpi;
uniform vec2 resolution;
uniform bool isSnapshot;
uniform bool lemmings;
uniform vec2 size;
uniform sampler2D backBuffer;
uniform sampler2D data;

varying vec2 uv;

// clang-format off
#pragma glslify: hsv2rgb = require('glsl-hsv2rgb')
#pragma glslify: snoise3 = require(glsl-noise/simplex/3d)
#pragma glslify: snoise2 = require(glsl-noise/simplex/2d)
#pragma glslify: random = require(glsl-random)

// clang-format on

void main() {
  vec3 color;
  //   float r = abs(sin(t / 25.));
  //   if (length(uv) < r && length(uv) > r - 0.1) {
  // color = hsv2rgb(vec3(sin(t * 0.01), 0.5, 0.5));

  vec2 textCoord = ((uv * vec2(0.5, -0.5)) + vec2(0.5)).yx;
  // vec3 bb = texture2D(backBuffer, (uv * 0.5) + vec2(0.5)).rgb;

  // The cell above, for the lemmings theme's lit top edges.
  vec4 above = texture2D(data, textCoord - vec2(1.0 / size.y, 0.0));
  vec4 data = texture2D(data, textCoord);
  int type = int((data.r * 255.) + 0.1);
  float hue = 0.0;
  float saturation = 0.6;
  float lightness = 0.3 + data.g * 0.5;
  float noise = snoise3(vec3(floor(uv * resolution / dpi), t * 0.05));
  float a = 1.0;

  if (type == 0) {
    hue = 0.0;
    saturation = 0.1;
    lightness = 0.1;
    a = 0.1;
    if (isSnapshot) {
      saturation = 0.05;
      lightness = 1.01;
      a = 1.0;
    }
  } else if (type == 1) {
    hue = 0.1;
    saturation = 0.1;
    lightness = 0.4;
  } else if (type == 2) {
    hue = 0.1;
    saturation = 0.5;
    lightness += 0.3;
  } else if (type == 3) { // water
    hue = 0.6;
    lightness = 0.7 + data.g * 0.25 + noise * 0.1;
    int polarity = int( mod(data.g * 255. ,2.) + 0.1);
    if(polarity == 0){
      lightness += 0.01;
    }

  } else if (type == 4) { // gas
    hue = 0.0;
    lightness += 0.4;
    saturation = 0.2 + (data.b * 1.5);
  } else if (type == 5) { // clone
    hue = 0.9;
    saturation = 0.3;
  } else if (type == 6) { // fire
  
    hue = (data.g * 0.1);
    saturation = 0.7;

    lightness = 0.7 + (data.g * 0.3) + ((noise + 0.8) * 0.5);
    if(isSnapshot){
      lightness -=0.2;
    }
  } else if (type == 7) { // wood
    hue = (data.g * 0.1);
    saturation = 0.3;
    lightness = 0.3 + data.g * 0.3;
  } else if (type == 8) { // lava
    hue = (data.g * 0.1);
    lightness = 0.7 + data.g * 0.25 + noise * 0.1;
  } else if (type == 9) { // ice
    hue = 0.6;
    saturation = 0.4;
    lightness = 0.7 + data.g * 0.5;
  } else if (type == 10) { // sink
    hue = 0.9;
    saturation = 0.4;
    lightness = 1.0;
  } else if (type == 11) { // plant
    hue = 0.4;
    saturation = 0.4;
  } else if (type == 12) { // acid
    hue = 0.18;
    saturation = 0.9;
    lightness = 0.8 + data.g * 0.2 + noise * 0.05;
  } else if (type == 13) { // stone
    hue = -0.4 + (data.g * 0.5);
    saturation = 0.1;
    // lightness = 0.2 + data.g * 0.5;
  } else if (type == 14) { // dust
    hue = (data.g * 2.0) + t * .0008;
    saturation = 0.4;
    lightness = 0.8;
  } else if (type == 15) { // mite
    hue = 0.8;
    saturation = 0.9;
    lightness = 0.8;
  } else if (type == 16) { // oil
    hue = (data.g * 5.0) + t * .008;

    saturation = 0.2;
    lightness = 0.3;
  } else if (type == 17) { // Rocket
    hue = 0.0;
    saturation = 0.4 + data.b;
    lightness = 0.9;
  } else if (type == 18) { // fungus
    hue = (data.g * 0.15) - 0.1;
    saturation = (data.g * 0.8) - 0.05;

    // (data.g * 0.00);
    lightness = 1.5 - (data.g * 0.2);
  } else if (type == 19) { // seed/flower

    hue = fract(fract(data.b * 2.) * 0.5) - 0.3;
    saturation = 0.7 * (data.g + 0.4) + data.b * 0.2;
    lightness = 0.9 * (data.g + 0.9);
  } else if (type == 20) { // dirt
    float grain = snoise2(floor(uv * resolution / dpi) * 0.35);
    hue = 0.055 + data.g * 0.03;
    saturation = 0.45;
    lightness = 0.32 + data.g * 0.18 + grain * 0.05;
  }
  if (isSnapshot == false) {
    lightness *= (0.975 + snoise2(floor(uv * resolution / dpi)) * 0.025);
  }
  color = hsv2rgb(vec3(hue, saturation, lightness));

  // Lemmings theme: a dark blue sky, golden earth and riveted steel.
  if (lemmings) {
    vec2 cell = floor(vec2(textCoord.y * size.x, textCoord.x * size.y));
    bool open = int((above.r * 255.) + 0.1) == 0;
    a = 1.0;
    if (type == 0) {
      color = vec3(0.03, 0.03, 0.2);
    } else if (type == 20) { // dirt
      float blob = snoise2(cell * 0.07) * 0.5 + 0.5;
      float grain = snoise2(cell * 0.45);
      float crack = min(abs(snoise2(cell * 0.055 + 3.1)), abs(snoise2(cell * 0.09 + 7.3)) * 1.4);
      color = mix(vec3(0.6, 0.34, 0.07), vec3(0.95, 0.68, 0.27), blob * 0.7 + data.g * 0.6);
      color *= 0.9 + grain * 0.1;
      if (crack < 0.035) color = vec3(0.36, 0.18, 0.04);
      if (open) color = vec3(1.0, 0.82, 0.42);
    } else if (type == 1) { // steel
      vec2 p = mod(cell, 8.0);
      color = vec3(0.56, 0.58, 0.64);
      if (p.x < 1.0 || p.y < 1.0) color = vec3(0.78, 0.8, 0.85);
      if (p.x > 6.0 || p.y > 6.0) color = vec3(0.3, 0.31, 0.36);
      if ((p.x == 2.0 || p.x == 5.0) && (p.y == 2.0 || p.y == 5.0)) color = vec3(0.86, 0.88, 0.92);
    } else if (type == 2) { // sand
      color = vec3(0.98, 0.84, 0.42) * (0.82 + data.g * 0.35);
    } else if (type == 13) { // stone
      color = vec3(0.5, 0.46, 0.44) * (0.75 + data.g * 0.5);
      if (open) color *= 1.25;
    } else if (type == 8) { // lava
      color = vec3(1.0, 0.3 + data.g * 0.25 + noise * 0.12, 0.04);
    } else if (type == 7) { // wood: the builder's bricks
      color = vec3(0.86, 0.6, 0.32) * (0.8 + data.g * 0.3);
    }
  }
  gl_FragColor = vec4(color, a);
}