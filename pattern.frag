uniform sampler3D noiseTexture;
uniform float time;

varying vec2 vST; // Texture coordinates from vertex shader
varying vec3 vMC; // Model coordinates from vertex shader

// Function to generate fire-like colors
vec3 fireColor(float intensity) {
    return mix(vec3(1.0, 0.2, 0.0), vec3(1.0, 1.0, 0.0), intensity); // Red to Yellow
}

void main()
{
    // Sample noise using 3D coordinates (animated over time)
    float noiseValue = texture3D(noiseTexture, vMC * 0.5 + vec3(0.0, time * 0.2, 0.0)).r;

    // Burning effect threshold (changing over time)
    float burnThreshold = sin(time) * 0.5 + 0.5;

    // Apply dissolve effect (gradually disappearing parts)
    if (noiseValue < burnThreshold) {
        discard; // Remove burned fragments
    }

    // Compute fire intensity based on noise
    float intensity = smoothstep(burnThreshold, 1.0, noiseValue);

    // Apply fire color mapping
    vec3 fire = fireColor(intensity);

    // Output final color
    gl_FragColor = vec4(fire, 1.0);
}