#version 120
uniform float time;
uniform sampler3D noiseTexture;  // 3D noise texture

// Lighting coefficients
uniform float uKa, uKd, uKs;     
uniform float uShininess;

// For coloring or blending
uniform float smokeFactor;       // Adjust how much smoke vs. fire is visible
uniform float fireIntensity;     // Scale the brightness/glow of the fire
uniform float noiseScale;        // Spatial scale for noise

varying vec3 vMC;                // Model coords from vertex shader
varying vec2 vST;                // Texture coords from vertex shader
varying vec3 vN;                 // Normal in eye space
varying vec3 vL;                 // Light direction
varying vec3 vE;                 // Eye direction

const vec3 SPECULARCOLOR = vec3(1.0, 1.0, 1.0);

// Sample the 3D noise
float sampleNoise(vec3 coord) {
    return texture3D(noiseTexture, coord).r;
}

// Fractional Brownian Motion (fBm) for more layered noise
float fbm(vec3 p) {
    float f = 0.0;
    float scale = 1.0;
    float amplitude = 1.0;
    // Try 4 octaves
    for(int i = 0; i < 4; i++) {
        f += sampleNoise(p * scale) * amplitude;
        scale *= 2.0;
        amplitude *= 0.5;
    }
    return f;
}

// A simple fire color ramp from dark red to bright yellow
vec3 fireColor(float t) {
    // clamp t in [0..1]
    t = clamp(t, 0.0, 1.0);
    // Two stages: (0..0.5) red→orange, (0.5..1.0) orange→yellow
    if(t < 0.5) {
        return mix(vec3(0.5, 0.0, 0.0), vec3(1.0, 0.3, 0.0), t * 2.0);
    } else {
        return mix(vec3(1.0, 0.3, 0.0), vec3(1.0, 1.0, 0.5), (t - 0.5) * 2.0);
    }
}

// Smoke color ramp from dark gray to light gray
vec3 smokeColor(float t) {
    // clamp t in [0..1]
    t = clamp(t, 0.0, 1.0);
    return mix(vec3(0.05, 0.05, 0.05), vec3(0.8, 0.8, 0.8), t);
}

void main()
{
    // Calculate layered noise for a swirling flame or smoke pattern
    float n = fbm(vMC * noiseScale + vec3(0.0, time * 0.2, 0.0));

    // We'll interpret `n` in [0..4] range (since 4 octaves can sum to ~4).
    // Normalize to 0..1 for color usage:
    float normalizedNoise = clamp(n / 4.0, 0.0, 1.0);

    // The idea: 
    // - For higher noise values => more intense fire
    // - For lower noise values => more smoke
    // smokeFactor can bias how easily we see smoke vs. fire
    float smokeWeight = smoothstep(0.0, 0.6 * smokeFactor, normalizedNoise);
    // Fire intensity can be boosted or reduced
    float fireVal = normalizedNoise * fireIntensity;

    // Blend the colors
    vec3 fireCol = fireColor(fireVal);
    vec3 smokeCol = smokeColor(normalizedNoise);

    // Mix smoke and fire
    vec3 baseColor = mix(smokeCol, fireCol, smokeWeight);

    // Add an emissive term to make the fire glow
    // The glow is stronger if fireVal is high
    float glow = pow(fireVal, 2.0) * 1.5; 
    vec3 emissive = fireCol * glow;

    // Combine base color with emissive (self-illumination)
    vec3 finalColor = baseColor + emissive;

    // === Standard Phong lighting ===
    vec3 N = normalize(vN);
    vec3 L = normalize(vL);
    vec3 E = normalize(vE);

    // Ambient
    vec3 ambient = uKa * finalColor;

    // Diffuse
    float diff = max(dot(N, L), 0.0);
    vec3 diffuse = uKd * diff * finalColor;

    // Specular
    float s = 0.0;
    if(diff > 0.0) {
        vec3 ref = reflect(-L, N);
        float cosphi = dot(E, ref);
        if(cosphi > 0.0) {
            s = pow(cosphi, uShininess);
        }
    }
    vec3 specular = uKs * s * SPECULARCOLOR;

    // Combine
    vec3 litColor = ambient + diffuse + specular;

    // For smoke, you might want partial transparency:
    // The more "smokeCol," the more transparent we get:
    float alpha = 1.0 - 0.5 * (1.0 - smokeWeight);

    gl_FragColor = vec4(litColor, alpha);
}
