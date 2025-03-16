#version 120

uniform float time;             
uniform float swirlAmount;      
uniform float swirlSpeed;       
uniform float swirlRadius;      
uniform sampler3D noiseTexture; // 3D noise texture for displacement
uniform vec3 LIGHTPOSITION;     

varying vec3 vMC;  
varying vec2 vST;  
varying vec3 vN;   
varying vec3 vL;   
varying vec3 vE;   

// Sample the 3D noise
float sampleNoise(vec3 coord) {
    return texture3D(noiseTexture, coord).r;
}

// Optional swirl around the y-axis
vec3 swirl(vec3 pos, float swirlAmt, float swirlSpd, float swirlRad, float t)
{
    float distXZ = length(pos.xz);
    float angle = swirlAmt * sin(swirlSpd * t + distXZ / swirlRad);
    float c = cos(angle);
    float s = sin(angle);

    vec3 newPos = pos;
    newPos.x = pos.x * c - pos.z * s;
    newPos.z = pos.x * s + pos.z * c;
    return newPos;
}

void main()
{
    vST = gl_MultiTexCoord0.st;
    vec3 pos = gl_Vertex.xyz;

    // Swirl (optional)
    pos = swirl(pos, swirlAmount, swirlSpeed, swirlRadius, time);

    // Displace along the normal
    float n = sampleNoise(pos * 0.3 + vec3(0.0, time * 0.2, 0.0));
    vec3 displacedPos = pos + gl_Normal * (n * 0.1);

    vMC = displacedPos;

    // Eye-space transform
    vec4 ECposition = gl_ModelViewMatrix * vec4(displacedPos, 1.0);

    // Normal to eye space
    vN = normalize(gl_NormalMatrix * gl_Normal);

    // Light and eye directions
    vL = LIGHTPOSITION - ECposition.xyz;
    vE = -ECposition.xyz;

    // Final position
    gl_Position = gl_ModelViewProjectionMatrix * vec4(displacedPos, 1.0);
}
