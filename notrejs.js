function loadText(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.overrideMimeType("text/plain");
    xhr.send(null);
    if (xhr.status === 200)
        return xhr.responseText;
    else {
        return null;
    }
}

var canvas = document.getElementById('dawin-webgl');
var gl = canvas.getContext('webgl');
var program;
var attribPos;
var buffer;
var tx = 0, ty = 0;
var x = 0;
var y = 0;
var z = 0
var scale = 4;
var mousePos = [0, 0];
var uTranslation, uPerspective, uModel, uVue;
var projMatrix = mat4.create();
var modelMatrix = mat4.create();
var VueMatrix = mat4.create();

function initShaders() {
    var vertSource = loadText('shaders/vertex.vert');
    var fragSource = loadText('shaders/fragment.frag');

    var vertex = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertex, vertSource);
    gl.compileShader(vertex);

    if (!gl.getShaderParameter(vertex, gl.COMPILE_STATUS))
        console.log("Erreur lors de la compilation du vertex shader:\n" + gl.getShaderInfoLog(vertex));

    var fragment = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragment, fragSource);
    gl.compileShader(fragment);

    if (!gl.getShaderParameter(fragment, gl.COMPILE_STATUS))
        console.log("Erreur lors de la compilation du fragment shader:\n" + gl.getShaderInfoLog(fragment));

    program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        console.log("Erreur lors du linkage du program:\n" + gl.getProgramInfoLog(program));

    gl.useProgram(program);

    attribPos = gl.getAttribLocation(program, "vertex_position");
    uTranslation = gl.getUniformLocation(program, "translation");
    uPerspective = gl.getUniformLocation(program, 'PMatrix');
    uModel = gl.getUniformLocation(program, "MMatrix");
    uVue = gl.getUniformLocation(program, "VMatrix");

    Lumiere = gl.getUniformLocation(program, "unif_Lumiere");

    textureCoordAttribute = gl.getAttribLocation(program, "aTextureCoord");
}

function initTextures() {
    cubeTexture = gl.createTexture();
    cubeImage = new Image();
    cubeImage.onload = function () {
        handleTextureLoaded(cubeImage, cubeTexture);
    }
    cubeImage.src = "res/wood03.jpg";

    TetraTexture = gl.createTexture();
    TetraImage = new Image();
    TetraImage.onload = function () {
        handleTextureLoaded(TetraImage, TetraTexture);
    }
    TetraImage.src = "res/metal12.jpg";

    GroundTexture = gl.createTexture();
    GroundImage = new Image();
    GroundImage.onload = function () {
        handleTextureLoaded(GroundImage, GroundTexture);
    }
    GroundImage.src = "res/tile11.jpg";
}


function initBuffers() {

    var coordsTetra = [
        0.0, 0.0, 2.0,
        0.0, 2.0, 0.0,
        0.0, 0.0, 0.0,
        2.0, 0.0, 0.0,
        0.0, 2.0, 0.0,
        0.0, 0.0, 2.0,
    ];

    var coordsCube = [
        //face avant
        -1, 1, 1, -1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1,
        //face arriere
        -1, 1, -1, -1, -1, -1, 1, 1, -1, 1, 1, -1, -1, -1, -1, 1, -1, -1,
        //face gauche
        -1, 1, -1, -1, -1, -1, -1, 1, 1, -1, 1, 1, -1, -1, -1, -1, -1, 1,
        //face droite
        1, 1, -1, 1, -1, -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1, 1,
        //face haut
        -1, 1, -1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, 1, 1, 1,
        //face bas
        -1, -1, -1, -1, -1, 1, 1, -1, -1, 1, -1, -1, -1, -1, 1, 1, -1, 1
    ];


    var coordsText = [
        0, 0,
        1, 0,
        1, 1,
        0, 1,
        1, 1,
        0, 0,

        0, 0,
        1, 0,
        1, 1,
        0, 1,
        1, 1,
        0, 0,

        0, 0,
        1, 0,
        1, 1,
        0, 1,
        1, 1,
        0, 0,

        0, 0,
        1, 0,
        1, 1,
        0, 1,
        1, 1,
        0, 0,

        0, 0,
        1, 0,
        1, 1,
        0, 1,
        1, 1,
        0, 0,

        0, 0,
        1, 0,
        1, 1,
        0, 1,
        1, 1,
        0, 0
    ];

    var texcoords = [
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 0.0,
        1.0, 1.0,
        0.0, 1.0
    ];

    var textureGrid = [];
    var coordsGrid = [];
    var GRID_SIZE = 100;
    var step = 1.8 / GRID_SIZE;
    for (var i = 0; i < GRID_SIZE; i++) {
        for (var j = 0; j < GRID_SIZE; j++) {
            var x = i * step - 0.9;
            var y = j * step - 0.9;
            var currentQuad = [x, y,
                x + step, y,
                x + step, y + step,
                x, y,
                x + step, y + step,
                x, y + step];
            coordsGrid = coordsGrid.concat(currentQuad);
            textureGrid = textureGrid.concat(texcoords);
        }
    }

    Tetra = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, Tetra);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coordsTetra), gl.STATIC_DRAW);

    Ground = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, Ground);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coordsGrid), gl.STATIC_DRAW);

    Ground.vertexSize = 2;
    Ground.numVertices = GRID_SIZE * GRID_SIZE * 6;

    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coordsCube), gl.STATIC_DRAW);

    Texture = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, Texture);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coordsText), gl.STATIC_DRAW);

    TextureGrnd = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, TextureGrnd);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureGrid), gl.STATIC_DRAW);

    TextureGrnd.vertexSize = 2;
    TextureGrnd.numVertices = GRID_SIZE * GRID_SIZE * 6;


    var vertices = new Float32Array([
        0.0, 0.0, 0.0, 10, 0.0, 0.0, // axe des X
        0.0, 0.0, 0.0, 0.0, 10, 0.0, // axe des Y
        0.0, 0.0, 0.0, 0.0, 0.0, 10 // axe des Z
    ]);

    Linebuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, Linebuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    Linebuffer.vertexSizeLine = 3;
    Linebuffer.numVerticesLine = 6;

    buffer.vertexSizeCube = 3;
    buffer.numVerticesCube = 36;

    Texture.vertexSize = 2;
    Texture.numVertices = 36;

    Tetra.vertexSizeTetra = 3;
    Tetra.numVerticesTetra = 6;
}

var time = 0;

function handleTextureLoaded(image, texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

function drawTetra() {

    mat4.identity(modelMatrix);
    mat4.translate(modelMatrix, modelMatrix, [-2, 1, 3]);
    mat4.rotateY(modelMatrix, modelMatrix, time);

    mat4.scale(modelMatrix, modelMatrix, [0.5, 0.5, 0.5]);

    gl.uniformMatrix4fv(uModel, false, modelMatrix);
    gl.uniformMatrix4fv(uPerspective, false, projMatrix);
    gl.uniformMatrix4fv(uVue, false, VueMatrix);

    gl.bindBuffer(gl.ARRAY_BUFFER, Tetra);
    gl.vertexAttribPointer(attribPos, Tetra.vertexSizeTetra, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(attribPos);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, TetraTexture);
    gl.uniform1i(gl.getUniformLocation(program, "uSampler"), 0);

    gl.enable(gl.DEPTH_TEST)

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, Tetra.numVerticesTetra);


    time += 0.01

}


function drawGrnd() {
    mat4.identity(modelMatrix);
    mat4.translate(modelMatrix, modelMatrix, [0, 0, 0]);
    mat4.rotateX(modelMatrix, modelMatrix, Math.PI / 2);

    mat4.scale(modelMatrix, modelMatrix, [100, 100, 0]);

    gl.uniformMatrix4fv(uModel, false, modelMatrix);
    gl.uniformMatrix4fv(uPerspective, false, projMatrix);
    gl.uniformMatrix4fv(uVue, false, VueMatrix);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, GroundTexture);
    gl.uniform1i(gl.getUniformLocation(program, "uSampler"), 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, Ground);
    gl.vertexAttribPointer(attribPos, Ground.vertexSize, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(attribPos);

    gl.bindBuffer(gl.ARRAY_BUFFER, TextureGrnd);
    gl.vertexAttribPointer(textureCoordAttribute, TextureGrnd.vertexSize, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(textureCoordAttribute);

    gl.drawArrays(gl.TRIANGLES, 0, Ground.numVertices);


    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);


}

function drawCube() {

    mat4.identity(modelMatrix);
    mat4.rotateY(modelMatrix, modelMatrix, time);
    mat4.translate(modelMatrix, modelMatrix, [3, 0, -4]);
    mat4.scale(modelMatrix, modelMatrix, [0.5, 0.5, 0.5]);


    gl.uniformMatrix4fv(uModel, false, modelMatrix);
    gl.uniformMatrix4fv(uPerspective, false, projMatrix);
    gl.uniformMatrix4fv(uVue, false, VueMatrix);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(attribPos, buffer.vertexSizeCube, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(attribPos);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
    gl.uniform1i(gl.getUniformLocation(program, "uSampler"), 0);

    gl.enable(gl.DEPTH_TEST)

    gl.drawArrays(gl.TRIANGLES, 0, buffer.numVerticesCube);

}
function drawAxes() {

    mat4.identity(modelMatrix);

    gl.uniformMatrix4fv(uModel, false, modelMatrix);
    gl.uniformMatrix4fv(uPerspective, false, projMatrix);
    gl.uniformMatrix4fv(uVue, false, VueMatrix);

    gl.bindBuffer(gl.ARRAY_BUFFER, Linebuffer);
    gl.vertexAttribPointer(attribPos, Linebuffer.vertexSizeLine, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(attribPos);

    gl.drawArrays(gl.LINES, 0, Linebuffer.numVerticesLine);

}
function draw() {

    requestAnimationFrame(draw);

    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    mat4.perspective(projMatrix, Math.PI / scale, 1, 0.1, 100);

    mat4.identity(VueMatrix);
    mat4.lookAt(VueMatrix, [8, 5, 18], [0, 0, 0], [0, 1, 0])
    mat4.translate(VueMatrix, VueMatrix, [x, y, z]);
    mat4.rotateY(VueMatrix, VueMatrix, mousePos[1]);
    mat4.rotateX(VueMatrix, VueMatrix, mousePos[0]);
    gl.uniformMatrix4fv(uPerspective, false, projMatrix)

    gl.bindBuffer(gl.ARRAY_BUFFER, Texture);
    gl.vertexAttribPointer(textureCoordAttribute, Texture.vertexSize, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(textureCoordAttribute);

    drawAxes();
    drawTetra();
    drawCube();
    drawGrnd();

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function main() {
    if (!gl) {
        console.log('ERREUR : Echec du chargement du contexte !');
        return;
    }

    initShaders();
    initBuffers();
    KeyEvents();
    initEvents();
    initTextures();
    draw();
}

function initEvents() {
    canvas.onmousemove = function (e) {
        mousePos[0] = (e.pageX / canvas.width) * 2.0 - 1.0;
        mousePos[1] = ((canvas.height - e.pageY) / canvas.height) * 2.0 - 1.0;
    }
}

function KeyEvents() {
    window.onkeydown = function (e) {
        var step = 0.1;
        if (e.keyCode == 37) {
            x -= step;
        }
        else if (e.keyCode == 38) {
            y += step;
        }
        else if (e.keyCode == 39) {
            x += step;
        }
        else if (e.keyCode == 40) {
            y -= step;
        }
        else if (e.keyCode == 81) {
            z += step;
        }
        else if (e.keyCode == 68) {
            z -= step;
        }
        else if (e.keyCode == 90) {
            scale +=step;
        }
        else if (e.keyCode == 83) {
            scale -= step;
        }
        else if (e.keyCode == 81) {
            time -= step;
        }
        else if (e.keyCode == 68) {
            time += step;
        }
    }
}
