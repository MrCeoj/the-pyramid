"use client";

import { useEffect, useRef } from "react";

export type BlurSize = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

interface HellBackgroundProps {
  backdropBlurAmount?: BlurSize;
  className?: string;
  color1?: string;
  color2?: string;
  color3?: string;
  quality?: "low" | "medium" | "high";
  targetFPS?: number;
}

const blurClassMap: Record<BlurSize, string> = {
  none: "backdrop-blur-none",
  sm: "backdrop-blur-sm",
  md: "backdrop-blur-md",
  lg: "backdrop-blur-lg",
  xl: "backdrop-blur-xl",
  "2xl": "backdrop-blur-2xl",
  "3xl": "backdrop-blur-3xl",
};

const vertexShaderSource = `
  attribute vec4 a_position;
  void main() {
    gl_Position = a_position;
  }
`;

// Optimized fragment shader with reduced iterations and simpler calculations
const fragmentShaderSource = `
  precision lowp float;

  uniform vec2 iResolution;
  uniform float iTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform float uQuality;

  #define CONTRAST 3.5
  #define LIGTHING 0.4
  #define SPIN_ROTATION -2.0
  #define SPIN_SPEED 7.0
  #define OFFSET vec2(0.0)
  #define SPIN_AMOUNT 0.25
  #define SPIN_EASE 1.0
  #define PI 3.14159265359
  #define IS_ROTATE false

  vec4 effect(vec2 screenSize, vec2 screen_coords) {
      float pixel_filter = mix(300.0, 745.0, uQuality);
      float pixel_size = length(screenSize.xy) / pixel_filter;
      vec2 uv = (floor(screen_coords.xy*(1./pixel_size))*pixel_size - 0.5*screenSize.xy)/length(screenSize.xy) - OFFSET;
      float uv_len = length(uv);

      float speed = (SPIN_ROTATION*SPIN_EASE*0.2);
      if(IS_ROTATE){
         speed = iTime * speed;
      }
      speed += 302.2;

      float new_pixel_angle = atan(uv.y, uv.x) + speed - SPIN_EASE*20.*(1.*SPIN_AMOUNT*uv_len + (1. - 1.*SPIN_AMOUNT));
      vec2 mid = (screenSize.xy/length(screenSize.xy))/2.;
      uv = (vec2((uv_len * cos(new_pixel_angle) + mid.x), (uv_len * sin(new_pixel_angle) + mid.y)) - mid);

      uv *= 30.;
      speed = iTime*(SPIN_SPEED);
      vec2 uv2 = vec2(uv.x+uv.y);

      // Reduced iterations based on quality
      int iterations = int(mix(2.0, 5.0, uQuality));
      for(int i=0; i < 5; i++) {
          if(i >= iterations) break;
          uv2 += sin(max(uv.x, uv.y)) + uv;
          uv  += 0.5*vec2(cos(5.1123314 + 0.353*uv2.y + speed*0.131121),sin(uv2.x - 0.113*speed));
          uv  -= 1.0*cos(uv.x + uv.y) - 1.0*sin(uv.x*0.711 - uv.y);
      }

      float contrast_mod = (0.25*CONTRAST + 0.5*SPIN_AMOUNT + 1.2);
      float paint_res = min(2., max(0.,length(uv)*(0.035)*contrast_mod));
      float c1p = max(0.,1. - contrast_mod*abs(1.-paint_res));
      float c2p = max(0.,1. - contrast_mod*abs(paint_res));
      float c3p = 1. - min(1., c1p + c2p);
      float light = (LIGTHING - 0.2)*max(c1p*5. - 4., 0.) + LIGTHING*max(c2p*5. - 4., 0.);

      return (0.3/CONTRAST)*vec4(uColor1, 1.0)
        + (1. - 0.3/CONTRAST) * (
            vec4(uColor1, 1.0)*c1p +
            vec4(uColor2, 1.0)*c2p +
            vec4(uColor3, c3p*1.0)
        ) + light;
  }

  void mainImage(out vec4 fragColor, in vec2 fragCoord) {
      vec2 uv = fragCoord/iResolution.xy;
      fragColor = effect(iResolution.xy, uv * iResolution.xy);
  }

  void main() {
      mainImage(gl_FragColor, gl_FragCoord.xy);
  }
`;

function HellBackground({
  backdropBlurAmount = "none",
  className = "",
  color1 = "#DE443B",
  color2 = "#006BB4",
  color3 = "#162325",
  quality = "low",
  targetFPS = 20,
}: HellBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
    });

    if (!gl) {
      console.error("WebGL not supported");
      return;
    }

    const compileShader = (
      type: number,
      source: string
    ): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compilation error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compileShader(
      gl.FRAGMENT_SHADER,
      fragmentShaderSource
    );
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program linking error:", gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const iResolutionLocation = gl.getUniformLocation(program, "iResolution");
    const iTimeLocation = gl.getUniformLocation(program, "iTime");
    const uColor1Location = gl.getUniformLocation(program, "uColor1");
    const uColor2Location = gl.getUniformLocation(program, "uColor2");
    const uColor3Location = gl.getUniformLocation(program, "uColor3");
    const uQualityLocation = gl.getUniformLocation(program, "uQuality");

    const hexToRgb = (hex: string) => {
      const bigint = parseInt(hex.replace("#", ""), 16);
      return {
        r: ((bigint >> 16) & 255) / 255,
        g: ((bigint >> 8) & 255) / 255,
        b: (bigint & 255) / 255,
      };
    };

    // Set quality uniform (0.0 = low, 0.5 = medium, 1.0 = high)
    const qualityValue =
      quality === "low" ? 0.0 : quality === "medium" ? 0.5 : 1.0;
    gl.uniform1f(uQualityLocation, qualityValue);

    // Resolution scale based on quality
    const resolutionScale =
      quality === "low" ? 0.5 : quality === "medium" ? 0.75 : 1.0;

    const startTime = Date.now();
    const frameInterval = 1000 / targetFPS;

    const render = (currentTime: number) => {
      // Frame rate limiting
      if (currentTime - lastFrameTimeRef.current < frameInterval) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }
      lastFrameTimeRef.current = currentTime;

      // Render at reduced resolution for performance
      const width = Math.floor(canvas.clientWidth * resolutionScale);
      const height = Math.floor(canvas.clientHeight * resolutionScale);
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);

      const time = (Date.now() - startTime) / 1000;
      gl.uniform2f(iResolutionLocation, width, height);
      gl.uniform1f(iTimeLocation, time);

      const rgb1 = hexToRgb(color1 || "#DE443B");
      gl.uniform3f(uColor1Location, rgb1.r, rgb1.g, rgb1.b);

      const rgb2 = hexToRgb(color2 || "#006BB4");
      gl.uniform3f(uColor2Location, rgb2.r, rgb2.g, rgb2.b);

      const rgb3 = hexToRgb(color3 || "#162325");
      gl.uniform3f(uColor3Location, rgb3.r, rgb3.g, rgb3.b);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [color1, color2, color3, quality, targetFPS]);

  const finalBlurClass =
    blurClassMap[backdropBlurAmount as BlurSize] || blurClassMap["sm"];

  return (
    <div className={`w-full max-w-screen h-full overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full max-w-screen h-full overflow-hidden"
        style={{
          display: "block",
          transform: "translateZ(0)",
          willChange: "transform",
        }}
      />
      <div
        className={`absolute inset-0 ${finalBlurClass}`}
        style={{
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          transform: "translateZ(0)",
        }}
      />
    </div>
  );
}

export default HellBackground;
