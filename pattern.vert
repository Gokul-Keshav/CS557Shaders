#version 120
uniform float time;                   // For animation
uniform float swirlAmount;            // Strength of the swirling rotation
uniform float swirlSpeed;             // How fast the swirl animates
uniform float swirlRadius;            // Spatial scale factor for swirl
uniform sampler3D noiseTexture;       // 3D noise texture for displacement

varying vec3 vMC;                     // Model coordinates
varying vec2 vST;                     // Texture coordinates
varying vec3 vN;                      // Normal vector in eye space
varying vec3 vL;                      // Light direction
varying vec3 vE;                      // Eye direction

uniform vec3 LIGHTPOSITION;           // Light position in eye space

// Simple 3D noise lookup:
float sampleNoise(vec3 coord) {
    return texture3D(noiseTexture, coord).r;
}

// A function to swirl the vertex around the y-axis.
// The angle depends on distance from the y-axis and time.
vec3 swirl(vec3 pos, float swirlAmt, float swirlSpd, float swirlRad, float t)
{
    float distXZ = length(pos.xz);  
    // Angle modulated by distance from center and time
    float angle = swirlAmt * sin(swirlSpd * t + distXZ / swirlRad);
    float c = cos(angle);
    float s = sin(angle);

    // Rotate around the y-axis:
    vec3 newPos = pos;
    newPos.x = pos.x * c - pos.z * s;
    newPos.z = pos.x * s + pos.z * c;

    return newPos;
}

void main()
{
    // Pass along the texture coordinates from fixed-function pipeline
    vST = gl_MultiTexCoord0.st;

    // Original vertex position in model space
    vec3 pos = gl_Vertex.xyz;

    // Swirl the geometry around the y-axis:
    pos = swirl(pos, swirlAmount, swirlSpeed, swirlRadius, time);

    // Sample noise for extra displacement
    float n = sampleNoise(pos * 0.3 + vec3(0.0, time * 0.2, 0.0));
    // Displace along normal
    vec3 displacedPos = pos + gl_Normal * (n * 0.1);

    // Save final model coords
    vMC = displacedPos;

    // Transform position to eye space
    vec4 ECposition = gl_ModelViewMatrix * vec4(displacedPos, 1.0);

    // Transform normal to eye space
    vN = normalize(gl_NormalMatrix * gl_Normal);

    // Light direction and eye direction in eye space
    vL = LIGHTPOSITION - ECposition.xyz;
    vE = -ECposition.xyz;

    // Output final position
    gl_Position = gl_ModelViewProjectionMatrix * vec4(displacedPos, 1.0);
}