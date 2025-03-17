// Updated Fragment Shader with Earth Texture using vST
#version 120
// Passed from vertex shader:
varying vec3 vMC;
varying vec2 vST;

// Uniforms set from C++:
uniform float time;         
uniform float crackScale;   
uniform float crackWidth;   
uniform sampler3D noiseTex; // For noise perturbation
uniform sampler2D earthTex; // For the earth texture

// Simple hash function to generate a pseudo-random value:
float rand(float n) {
    return fract(sin(n) * 43758.5453);
}

// Generate a pseudo-random seed vector in [-1,1]:
vec3 randomSeed(float n) {
    return vec3(rand(n), rand(n + 1.0), rand(n + 2.0)) * 2.0 - 1.0;
}

void main()
{
    // 1. Scale the vertex coordinate to control cell size:
    vec3 p = vMC * crackScale;
    
    // 2. Perturb the position with 3D noise to add irregularity:
    vec3 noise = texture3D(noiseTex, p).rgb;
    p += (noise - 0.5) * 0.2;
    
    //////////////////////////////////////////////////////////////////////////
    // 3. Generate several random seeds for an irregular crack pattern.
    //////////////////////////////////////////////////////////////////////////
    const int numSeeds = 8;  // You can adjust this for more complexity
    float minDist = 1e5;
    float secondMin = 1e5;
    
    for (int i = 0; i < numSeeds; i++) {
        float seedIndex = float(i) * 10.0;
        vec3 seed = randomSeed(seedIndex);
        float d = distance(p, seed);
        if (d < minDist) {
            secondMin = minDist;
            minDist = d;
        } else if (d < secondMin) {
            secondMin = d;
        }
    }
    
    //////////////////////////////////////////////////////////////////////////
    // 4. Compute the crack “edge” distance as the difference between the two closest seeds.
    //////////////////////////////////////////////////////////////////////////
    float edge = secondMin - minDist;
    
    // Use smoothstep for a gradual transition:
    float crackIntensity = smoothstep(crackWidth, crackWidth * 0.5, edge);
    crackIntensity *= smoothstep(0.0, 0.5, time);
    
    //////////////////////////////////////////////////////////////////////////
    // 5. Use the provided texture coordinates (vST) to sample the earth texture.
    //////////////////////////////////////////////////////////////////////////
    vec2 uv = vST;
    
    // 6. Sample the earth texture:
    vec3 earthColor = texture2D(earthTex, uv).rgb;
    
    //////////////////////////////////////////////////////////////////////////
    // 7. Blend the crack effect with the earth texture:
    // When crackIntensity is 1, you'll see black (the crack); when 0, the earth texture remains.
    //////////////////////////////////////////////////////////////////////////
    vec3 crackColor = vec3(0.0);
    vec3 finalColor = mix(earthColor, crackColor, crackIntensity);
    
    gl_FragColor = vec4(finalColor, 1.0);
}
