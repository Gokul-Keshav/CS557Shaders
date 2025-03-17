#version 120

uniform float time;
uniform float crackScale;
uniform float crackWidth;
uniform sampler2D earthTex;

// Assuming your vertex data includes texture coordinates
varying vec2 vST;
varying vec3 vMC;

void main()
{
    // You need to replace this with your actual texture coordinate attribute
    vST = gl_MultiTexCoord0.xy;
    vMC = gl_Vertex.xyz;
    gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex;
}


/*
#version 120
uniform float time;



void main()
{
    gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex;
}
*/