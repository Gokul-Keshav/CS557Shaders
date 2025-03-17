uniform float time;
uniform sampler3D noiseTexture;  // 3D noise texture

// Lighting coefficients:
uniform float uKa, uKd, uKs;     
uniform float uShininess;

// Sun intensity (like "fireIntensity"):
uniform float sunIntensity;   // scales brightness/glow
uniform float noiseScale;     // spatial scale for noise sampling

// From the vertex shader:
varying vec3 vMC;  // Model coords
varying vec2 vST;  // Texture coords
varying vec3 vN;  // Normal in eye space
varying vec3 vL;   // Light direction
varying vec3 vE;   // Eye direction

// Simple white specular color:
const vec3 SPECULARCOLOR = vec3(1.0, 1.0, 1.0);

// Sample the 3D noise:
float sampleNoise(vec3 coord) {
    return texture3D(noiseTexture, coord).r;
}

// Multi-octave noise (fBm) for layered detail:
float fbm(vec3 p) {
    float total = 0.0;
    float scale = 1.0;
    float amp   = 1.0;
    // 4 octaves:
    for(int i = 0; i < 4; i++) {
        total += sampleNoise(p * scale) * amp;
        scale *= 2.0;
        amp   *= 0.5;
    }
    return total;
}

// A color ramp for a "burning sun" look:
// Goes from deeper orange to bright yellow-white.
vec3 sunColor(float t)
{
    t = clamp(t, 0.0, 1.0);

    if (t < 0.33) {
        // 0..0.33 => deeper orange/red
        return mix(vec3(0.6, 0.1, 0.0), vec3(1.0, 0.4, 0.0), t * 3.0);
    }
    else if (t < 0.66) {
        // 0.33..0.66 => orange -> yellow
        float u = (t - 0.33) * 3.0;
        return mix(vec3(1.0, 0.4, 0.0), vec3(1.0, 0.9, 0.0), u);
    }
    else {
        // 0.66..1.0 => yellow -> near white
        float u = (t - 0.66) * 3.0;
        return mix(vec3(1.0, 0.9, 0.0), vec3(1.0, 1.0, 0.8), u);
    }
}

void main()
{
    //////////////////////////////////////////
    // 1. Compute multi-octave noise
    //////////////////////////////////////////
    float n = fbm(vMC * noiseScale + vec3(0.0, time * 0.2, 0.0));
    // fBm can sum to ~4.0 => normalize to [0..1]
    float t = clamp(n / 4.0, 0.0, 1.0);

    //////////////////////////////////////////
    // 2. Base color from sun ramp
    //////////////////////////////////////////
    // Multiply by sunIntensity so higher => more "white-hot"
    float sunVal = clamp(t * sunIntensity, 0.0, 1.0);
    vec3 baseColor = sunColor(sunVal);

    //////////////////////////////////////////
    // 3. Emissive glow
    //////////////////////////////////////////
    // Increase exponent & multiplier for a stronger glow
    float glow = pow(sunVal, 3.0) * 2.5;
    vec3 emissive = baseColor * glow;

    // Combine
    vec3 finalColor = baseColor + emissive;

    //////////////////////////////////////////
    // 4. Phong lighting
    //    For a star-like look, you might reduce or remove specular
    //////////////////////////////////////////
    vec3 N = normalize(vN);
    vec3 L = normalize(vL);
    vec3 E = normalize(vE);

    // Ambient
    vec3 ambient = uKa * finalColor;

    // Diffuse
    float d = max(dot(N, L), 0.0);
    vec3 diffuse = uKd * d * finalColor;

    // Specular (can set uKs=0.0 if you don’t want highlights)
    float s = 0.0;
    if(d > 0.0) {
        vec3 ref = reflect(-L, N);
        float cosphi = dot(E, ref);
        if(cosphi > 0.0) {
            s = pow(cosphi, uShininess);
        }
    }
    vec3 specular = uKs * s * SPECULARCOLOR;

    // Combine lighting
    vec3 litColor = ambient + diffuse + specular;

    // For a sun, fully opaque:
    gl_FragColor = vec4(litColor, 1.0);
}
