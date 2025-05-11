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
uniform vec3 uLightPositionsSnowmans[10];
uniform vec3 uLightPositionsBuildings[5];

uniform vec3 uAmbientLightColor;
uniform vec3 uDiffuseLightColor;
uniform vec3 uSpecularLightColor;

uniform vec3 uAmbientLightColorBuilding;
uniform vec3 uDiffuseLightColorBuilding;
uniform vec3 uSpecularLightColorBuilding;

uniform vec3 uLightPositionsSpotlight;
uniform vec3 uAmbientLightColorSpotlight;
uniform vec3 uDiffuseLightColorSpotlight;
uniform vec3 uSpecularLightColorSpotlight;
uniform vec3 uLightDirectionSpotlight;

uniform float uSpotlightCutoff;
uniform float uSpotlightCutoffAttenuation;

uniform float uAttenuationConstant;
uniform float uAttenuationLinear;
uniform float uAttenuationQuadratic;
uniform float uAmbientControl;

uniform int typeLighting;

uniform int flagSnowmans;
uniform int flagBuildings;
uniform int flagSpotlight;

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
    vec3 lightWeighting = vec3(0);
    vec3 viewDir = normalize(-vPositionEye);

    if (typeLighting == 2) {
        lightWeighting += uAmbientLightColor * uAmbientControl;
    }

    if (flagSnowmans == 1) {
        for(int i=0; i<10; i++){
            // Calculate light direction
            vec3 lightDirection = normalize(uLightPositionsSnowmans[i] - vPositionEye);
            
            // Diffuse calculation
            float diffuseIntensity = max(dot(normal, lightDirection), 0.0);
            
            // Specular calculation
            vec3 reflectDir = reflect(-lightDirection, normal);
            float specularIntensity = pow(max(dot(reflectDir, viewDir), 0.0), shininess);
            
            // Attenuation calculation
            float distanceToLight = length(uLightPositionsSnowmans[i] - vPositionEye);
            float attenuation = 1.0 / (
                uAttenuationConstant + 
                uAttenuationLinear * distanceToLight + 
                uAttenuationQuadratic * distanceToLight * distanceToLight
            );

            // Combine lighting components
            vec3 diffuse = uDiffuseLightColor * diffuseIntensity;
            vec3 specular = uSpecularLightColor * specularIntensity;

            vec3 totalContribution = vec3(0.0);

            if (typeLighting == 1) {
                totalContribution = diffuse * attenuation;
            }
            else if (typeLighting == 2) {
                totalContribution =  (diffuse + specular) * attenuation;
            }
            else if (typeLighting == 3) {
                if (diffuseIntensity < 0.3)
                    diffuseIntensity = diffuseIntensity * 0.3;
                else if ( diffuseIntensity < 0.8 )
                        diffuseIntensity = diffuseIntensity;
                else
                    diffuseIntensity = diffuseIntensity * 1.3;
                
                totalContribution = diffuse * attenuation;
            }
            lightWeighting += totalContribution;
        }
    }

    if (flagBuildings == 1) {
        for(int i=0; i<5; i++){
            // Calculate light direction
            vec3 lightDirection = normalize(uLightPositionsBuildings[i] - vPositionEye);
            
            // Diffuse calculation
            float diffuseIntensity = max(dot(normal, lightDirection), 0.0);
            
            // Specular calculation
            vec3 reflectDir = reflect(-lightDirection, normal);
            float specularIntensity = pow(max(dot(reflectDir, viewDir), 0.0), shininess);
            
            // Attenuation calculation
            float distanceToLight = length(uLightPositionsBuildings[i] - vPositionEye);
            float attenuation = 1.0 / (
                uAttenuationConstant + 
                uAttenuationLinear * distanceToLight + 
                uAttenuationQuadratic * distanceToLight * distanceToLight
            );

            // Combine lighting components
            vec3 diffuse = uDiffuseLightColorBuilding * diffuseIntensity;
            vec3 specular = uSpecularLightColorBuilding * specularIntensity;

            vec3 totalContribution = vec3(0.0);

            if (typeLighting == 1) {
                totalContribution = diffuse * attenuation;
            }
            else if (typeLighting == 2) {
                totalContribution =  (diffuse + specular) * attenuation;
            }
            else if (typeLighting == 3) {
                if (diffuseIntensity < 0.3)
                    diffuseIntensity = diffuseIntensity * 0.3;
                else if ( diffuseIntensity < 0.8 )
                        diffuseIntensity = diffuseIntensity;
                else
                    diffuseIntensity = diffuseIntensity * 1.3;
                
                totalContribution = diffuse * attenuation;
            }
            lightWeighting += totalContribution;
        }
    }

    if (flagSpotlight == 1) {
        // Calculate light direction
        vec3 lightDirection = normalize(uLightPositionsSpotlight - vPositionEye);
        
        // Diffuse calculation
        float diffuseIntensity = max(dot(normal, lightDirection), 0.0);
        
        // Specular calculation
        vec3 reflectDir = reflect(-lightDirection, normal);
        float specularIntensity = pow(max(dot(reflectDir, viewDir), 0.0), shininess);
        
        // Attenuation calculation
        float distanceToLight = length(uLightPositionsSpotlight - vPositionEye);
        float attenuation = 1.0 / (
            uAttenuationConstant + 
            uAttenuationLinear * distanceToLight + 
            uAttenuationQuadratic * distanceToLight * distanceToLight
        );

        // Combine lighting components
        vec3 diffuse = uDiffuseLightColorSpotlight * diffuseIntensity;
        vec3 specular = uSpecularLightColorSpotlight * specularIntensity;

        vec3 totalContribution = vec3(0.0);

        if (typeLighting == 1) {
            totalContribution = diffuse * attenuation;
        }
        else if (typeLighting == 2) {
            totalContribution = (diffuse + specular) * attenuation;
        }
        else if (typeLighting == 3) {
            if (diffuseIntensity < 0.3)
                diffuseIntensity = diffuseIntensity * 0.3;
            else if (diffuseIntensity < 0.8)
                diffuseIntensity = diffuseIntensity;
            else
                diffuseIntensity = diffuseIntensity * 1.3;
            
            totalContribution = diffuse * attenuation;
        }

        // Добавляем эффект прожектора с четкими краями uSpotlightCutoffAttenuation
        vec3 L = normalize(vPositionEye); // Направление от света к фрагменту
        vec3 spotlightDirection = vec3(0.0, -0.1, -1.0); // Направление прожектора
        float spotDot = dot(L, spotlightDirection); // Косинус угла между направлениями
        float spotFactor = smoothstep(uSpotlightCutoffAttenuation, uSpotlightCutoff, spotDot);
        totalContribution *= spotFactor;

        lightWeighting += totalContribution;
    }
    vec4 texelNumber = texture(uSamplerNumber, vTextureCoords);
    vec4 texelMaterial = texture(uSamplerMaterial, vTextureCoords);

    vec4 mixTextures = mix(texelNumber, texelMaterial, contribution);

    // Final color with vertex color modulation
    colorOut = vec4(lightWeighting * mixTextures.rgb * vColor.rgb, mixTextures.a * vColor.a);
}
`;