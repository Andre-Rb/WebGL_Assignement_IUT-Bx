precision mediump float;
varying float profondeur;
varying vec3 v_Lumiere;

varying highp vec2 vTextureCoord;
uniform sampler2D uSampler;

void main() {
    gl_FragColor = texture2D(uSampler, vTextureCoord);

}
