uniform float time;
uniform sampler3D noiseTexture; // 3D noise texture for displacement
uniform vec3 LIGHTPOSITION; // Light source position

varying vec2 vST; // Texture coordinates
varying vec3 vMC; // Model coordinates
varying vec3 vN;  // Normal vector
varying vec3 vL;  // Light direction
varying vec3 vE;  // Eye direction

void main()
{
    vST = gl_MultiTexCoord0.st;
    vMC = gl_Vertex.xyz;

    vec4 ECposition = gl_ModelViewMatrix * gl_Vertex; // Eye coordinate position

    vN = normalize(gl_NormalMatrix * gl_Normal); // Transform normal to eye space
    vL = LIGHTPOSITION - ECposition.xyz; // Light vector
    vE = vec3(0.0, 0.0, 0.0) - ECposition.xyz; // Eye vector

    // Sample 3D noise texture for displacement
    float noiseValue = texture3D(noiseTexture, vMC * 0.5 + vec3(0.0, time * 0.2, 0.0)).r;

    // Displacement effect (distorting the vertex position)
    vec3 displacement = vN * (noiseValue * 0.1); // Move vertices along their normals
    vec4 displacedVertex = gl_Vertex + vec4(displacement, 0.0);

    gl_Position = gl_ModelViewProjectionMatrix * displacedVertex; // Apply transformation
}
