attribute vec3 vertex_position;
attribute vec2 aTextureCoord;
varying highp vec2 vTextureCoord;
uniform mat4 PMatrix;
uniform mat4 MMatrix;
uniform mat4 VMatrix;
varying float profondeur;

void main() {
    gl_Position = PMatrix * VMatrix * MMatrix * vec4(vertex_position,1.0);
    profondeur = vertex_position.z/2.0+0.5;
    vTextureCoord = aTextureCoord;
}
