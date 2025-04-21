export const vsSourceCubeGouraud = `#version 300 es
in vec3 aVertexPosition;
in vec4 aVertexColor;
in vec3 aVertexNormal;
in vec2 aVertexTextureCoords;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat3 uNMatrix;

uniform vec3 uLightPosition;
uniform vec3 uAmbientLightColor;
uniform vec3 uDiffuseLightColor;
uniform vec3 uSpecularLightColor;

uniform float uAttenuationConstant;
uniform float uAttenuationLinear;
uniform float uAttenuationQuadratic;
uniform float uAmbientControl;

uniform int typeLighting;

out vec3 vLightWeighting;
out vec2 vTextureCoords;
out highp vec4 vColor;

const float shininess = 33.0;

void main(void) {
    // установка позиции наблюдателя сцены
    vec4 vertexPositionEye4 = uModelViewMatrix * vec4(aVertexPosition, 1.0);
    vec3 vertexPositionEye3 = vertexPositionEye4.xyz / vertexPositionEye4.w;
    // получаем вектор направления света
    vec3 lightDirection = normalize(uLightPosition - vertexPositionEye3);
    // получаем нормаль
    vec3 normal = normalize(uNMatrix * aVertexNormal);
    //скалярное произведение векторов нормали и направления света
    float diffuseLightDot = max(dot(normal, lightDirection), 0.0);
    // получаем вектор отраженного луча и нормализуем его
    vec3 reflectionVector = normalize(reflect(-lightDirection, normal));
    // установка вектора камеры
    vec3 viewVectorEye = -normalize(vertexPositionEye3);
    float specularLightDot = max(dot(reflectionVector, viewVectorEye), 0.0);
    float specularLightParam = pow(specularLightDot, shininess);

    // Расстояние до источника света
    float distanceToLight = length(uLightPosition - vertexPositionEye3);//
    // Коэффициент затухания
    float attenuation = 1.0 / (
        uAttenuationConstant + 
        uAttenuationLinear * distanceToLight + 
        uAttenuationQuadratic * distanceToLight * distanceToLight
    );
    
    if (typeLighting == 1) {
        vLightWeighting = uDiffuseLightColor * diffuseLightDot * attenuation;
    }
    if (typeLighting == 2) {
        vLightWeighting = uAmbientLightColor * uAmbientControl + (uDiffuseLightColor * diffuseLightDot + uSpecularLightColor * specularLightParam) * attenuation;
    }
    if (typeLighting == 3) {
        if (diffuseLightDot < 0.3)
            diffuseLightDot = diffuseLightDot * 0.3;
        else if ( diffuseLightDot < 0.8 )
                diffuseLightDot = diffuseLightDot;
        else
            diffuseLightDot = diffuseLightDot * 1.3;

        vLightWeighting = uDiffuseLightColor * diffuseLightDot * attenuation;
    }
    
    // Finally transform the geometry
    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);
    vTextureCoords = aVertexTextureCoords; 
    vColor = aVertexColor;
}
`;
export const fsSourceCubeGouraud = `#version 300 es
precision highp float;

in vec3 vLightWeighting;
in highp vec4 vColor;
in vec2 vTextureCoords;

uniform sampler2D uSamplerNumber;
uniform sampler2D uSamplerMaterial;
uniform float contribution;

out vec4 colorOut;

void main(void) {
    vec4 texelNumber = texture(uSamplerNumber, vTextureCoords);
    vec4 texelMaterial = texture(uSamplerMaterial, vTextureCoords);

    vec4 mixTextures = mix(texelNumber, texelMaterial, contribution);

    colorOut = vec4(vLightWeighting.rgb * mixTextures.rgb * vColor.rgb, mixTextures.a * vColor.a);
}
`;
