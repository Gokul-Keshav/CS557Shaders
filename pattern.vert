uniform float time;             
uniform float swirlAmount;      
uniform float swirlSpeed;       
uniform float swirlRadius;      
uniform sampler3D noiseTexture; // 3D noise texture for displacement
uniform vec3  LIGHTPOSITION;    

varying vec3 vMC;  
varying vec2 vST;  
varying vec3 vN;   
varying vec3 vL;   
varying vec3 vE;   

// Sample the 3D noise:
float sampleNoise(vec3 coord)
{
    return texture3D(noiseTexture, coord).r;
}

// Optional swirl around the y-axis:
vec3 swirl(vec3 pos, float swirlAmt, float swirlSpd, float swirlRad, float t)
{
    float distXZ = length(pos.xz);
    float angle  = swirlAmt * sin(swirlSpd * t + distXZ / swirlRad);
    float c = cos(angle);
    float s = sin(angle);

    vec3 newPos = pos;
    newPos.x = pos.x * c - pos.z * s;
    newPos.z = pos.x * s + pos.z * c;
    return newPos;
}

// 0..1 smooth ramp from t0..t1:
float smoothRamp(float t, float t0, float t1)
{
    return smoothstep(t0, t1, t);
}

void main()
{
    //////////////////////////////////////////////////////////////////////////
    // 1. Swirl + Normal Noise while intact (0..~9.5)
    //////////////////////////////////////////////////////////////////////////
    vec3 pos = gl_Vertex.xyz;
    vST = gl_MultiTexCoord0.st;

    // We'll fade out swirling as we approach the blast:
    // (Blast will start at ~9.5)
    float blastFactor = smoothRamp(time, 9.5, 10.0);  // ~0 until 9.5, goes to 1 by 10
    float swirlFactor = 1.0 - blastFactor;            // swirl active from 0..9.5

    // Apply swirl:
    pos = swirl(pos, swirlAmount * swirlFactor, swirlSpeed, swirlRadius, time);

    // Displace along the normal (also reduced to 0 by the time we start blasting):
    float n = sampleNoise(pos * 0.3 + vec3(0.0, time * 0.2 * swirlFactor, 0.0));
    pos += gl_Normal * (n * 0.1 * swirlFactor);

    //////////////////////////////////////////////////////////////////////////
    // 2. Explosion (9.5..10.0)
    //////////////////////////////////////////////////////////////////////////
    // For the blast, pick a pseudo-random direction from per-vertex noise:
    vec3 seedPos = pos + vec3(12.53, 94.12, 47.77);
    float rx = sampleNoise(seedPos);
    float ry = sampleNoise(seedPos + vec3(13.1, 71.7, 2.3));
    float rz = sampleNoise(seedPos + vec3(19.23, 53.2, 14.7));
    vec3 randDir = normalize(vec3(rx * 2.0 - 1.0, ry * 2.0 - 1.0, rz * 2.0 - 1.0));

    // Scale the explosion outward up to some magnitude (e.g., 3.0)
    float blastMagnitude = 3.0;
    pos += randDir * (blastMagnitude * blastFactor);

    //////////////////////////////////////////////////////////////////////////
    // 3. Vanish after 9.8..10.0 so it disappears before the next cycle
    //////////////////////////////////////////////////////////////////////////
    // vanishFactor will be 0 up to t=9.8, and approach 1 by t=10.0
    float vanishFactor = smoothRamp(time, 9.5, 10.0);
    // Scale everything to 0:
    pos *= (1.0 - vanishFactor);

    //////////////////////////////////////////////////////////////////////////
    // 4. Transform to Eye Space
    //////////////////////////////////////////////////////////////////////////
    vMC = pos;

    // Eye-space transform:
    vec4 ECposition = gl_ModelViewMatrix * vec4(pos, 1.0);

    // Normal in eye space:
    vN = normalize(gl_NormalMatrix * gl_Normal);

    // Light and eye directions:
    vL = LIGHTPOSITION - ECposition.xyz;
    vE = -ECposition.xyz;

    // Final position:
    gl_Position = gl_ModelViewProjectionMatrix * vec4(pos, 1.0);
}
