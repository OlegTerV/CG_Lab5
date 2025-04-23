export const vsSourceCubePhong = `#version 300 es
in vec3 aVertexPosition;
in vec4 aVertexColor;
in vec3 aVertexNormal;
in vec2 aVertexTextureCoords;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat3 uNMatrix;

out vec3 vNormal;
out vec3 vPositionEye;
out vec4 vColor;
out vec2 vTextureCoords;

void main(void) {
    // Transform position to eye space
    vec4 vertexPositionEye4 = uModelViewMatrix * vec4(aVertexPosition, 1.0);
    vPositionEye = vertexPositionEye4.xyz / vertexPositionEye4.w;
    
    // Transform normal and normalize
    vNormal = normalize(uNMatrix * aVertexNormal);
    
    // Pass color and position
    vColor = aVertexColor;
    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);
    vTextureCoords = aVertexTextureCoords;
}
`;

export const fsSourceCubePhong = `#version 300 es
precision highp float;

uniform vec3 uLightPosition;
uniform vec3 uAmbientLightColor;
uniform vec3 uDiffuseLightColor;
uniform vec3 uSpecularLightColor;

uniform float uAttenuationConstant;
uniform float uAttenuationLinear;
uniform float uAttenuationQuadratic;
uniform float uAmbientControl;

uniform int typeLighting;

in vec3 vNormal;
in vec3 vPositionEye;
in vec4 vColor;
in vec2 vTextureCoords;

out vec4 colorOut;

const float shininess = 33.0;

uniform sampler2D uSamplerNumber;
uniform sampler2D uSamplerMaterial;
uniform float contribution;

void main(void) {
    // Normalize interpolated normal
    vec3 normal = normalize(vNormal);
    
    // Calculate light direction
    vec3 lightDirection = normalize(uLightPosition - vPositionEye);
    
    // Diffuse calculation
    float diffuseIntensity = max(dot(normal, lightDirection), 0.0);
    
    // Specular calculation
    vec3 reflectDir = reflect(-lightDirection, normal);
    vec3 viewDir = normalize(-vPositionEye);
    float specularIntensity = pow(max(dot(reflectDir, viewDir), 0.0), shininess);
    
    // Attenuation calculation
    float distanceToLight = length(uLightPosition - vPositionEye);
    float attenuation = 1.0 / (
        uAttenuationConstant + 
        uAttenuationLinear * distanceToLight + 
        uAttenuationQuadratic * distanceToLight * distanceToLight
    );
    
    // Combine lighting components
    vec3 ambient = uAmbientLightColor * uAmbientControl;
    vec3 diffuse = uDiffuseLightColor * diffuseIntensity;
    vec3 specular = uSpecularLightColor * specularIntensity;
    vec3 lightWeighting = ambient + (diffuse + specular) * attenuation;

    if (typeLighting == 1) {
        lightWeighting = diffuse * attenuation;
    }
    if (typeLighting == 2) {
        lightWeighting = ambient + (diffuse + specular) * attenuation;
    }
    if (typeLighting == 3) {
        if (diffuseIntensity < 0.3)
            diffuseIntensity = diffuseIntensity * 0.3;
        else if ( diffuseIntensity < 0.8 )
                diffuseIntensity = diffuseIntensity;
        else
            diffuseIntensity = diffuseIntensity * 1.3;
        
    diffuse = uDiffuseLightColor * diffuseIntensity;
    lightWeighting = diffuse * attenuation;
    }

    vec4 texelNumber = texture(uSamplerNumber, vTextureCoords);
    vec4 texelMaterial = texture(uSamplerMaterial, vTextureCoords);

    vec4 mixTextures = mix(texelNumber, texelMaterial, contribution);

    // Final color with vertex color modulation
    colorOut = vec4(lightWeighting * mixTextures.rgb * vColor.rgb, mixTextures.a * vColor.a);
}
`;