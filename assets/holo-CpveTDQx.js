import{a as e,n as t}from"./jsx-runtime-D3jfb0Ew.js";import{t as n}from"./client-mmi0yadR.js";import{Dr as r,U as i,kr as a,no as o,ro as s,ta as c}from"./three.core-DtjtRha-.js";import{l,m as u,t as ee}from"./extends-BeLh0-fm.js";var d=e(t()),f=e(n()),p=new s,m=new s,h=new s,g=new o;function te(e,t,n){let r=p.setFromMatrixPosition(e.matrixWorld);r.project(t);let i=n.width/2,a=n.height/2;return[r.x*i+i,-(r.y*a)+a]}function _(e,t){let n=p.setFromMatrixPosition(e.matrixWorld),r=m.setFromMatrixPosition(t.matrixWorld),i=n.sub(r),a=t.getWorldDirection(h);return i.angleTo(a)>Math.PI/2}function v(e,t,n,r){let i=p.setFromMatrixPosition(e.matrixWorld),a=i.clone();a.project(t),g.set(a.x,a.y),n.setFromCamera(g,t);let o=n.intersectObjects(r,!0);if(o.length){let e=o[0].distance;return i.distanceTo(n.ray.origin)<e}return!0}function y(e,t){if(t instanceof r)return t.zoom;if(t instanceof a){let n=p.setFromMatrixPosition(e.matrixWorld),r=m.setFromMatrixPosition(t.matrixWorld),i=t.fov*Math.PI/180,a=n.distanceTo(r);return 1/(2*Math.tan(i/2)*a)}return 1}function b(e,t,n){if(t instanceof a||t instanceof r){let r=p.setFromMatrixPosition(e.matrixWorld),i=m.setFromMatrixPosition(t.matrixWorld),a=r.distanceTo(i),o=(n[1]-n[0])/(t.far-t.near),s=n[1]-o*t.far;return Math.round(o*a+s)}}var x=e=>Math.abs(e)<1e-10?0:e;function S(e,t,n=``){let r=`matrix3d(`;for(let n=0;n!==16;n++)r+=x(t[n]*e.elements[n])+(n===15?`)`:`,`);return n+r}var ne=(e=>t=>S(t,e))([1,-1,1,1,1,-1,1,1,1,-1,1,1,1,-1,1,1]),re=(e=>(t,n)=>S(t,e(n),`translate(-50%,-50%)`))(e=>[1/e,1/e,1/e,1,-1/e,-1/e,-1/e,-1,1/e,1/e,1/e,1,1,1,1,1]);function ie(e){return e&&typeof e==`object`&&`current`in e}var C=d.forwardRef(({children:e,eps:t=.001,style:n,className:r,prepend:i,center:a,fullscreen:o,portal:c,distanceFactor:p,sprite:m=!1,transform:h=!1,occlude:g,onOcclude:S,castShadow:C,receiveShadow:w,material:T,geometry:E,zIndexRange:D=[16777271,0],calculatePosition:O=te,as:ae=`div`,wrapperClass:k,pointerEvents:A=`auto`,...j},M)=>{let{gl:N,camera:P,scene:F,size:I,raycaster:L,events:R,viewport:z}=u(),[B]=d.useState(()=>document.createElement(ae)),V=d.useRef(null),H=d.useRef(null),U=d.useRef(0),W=d.useRef([0,0]),G=d.useRef(null),K=d.useRef(null),q=c?.current||R.connected||N.domElement.parentNode,J=d.useRef(null),Y=d.useRef(!1),X=d.useMemo(()=>g&&g!==`blending`||Array.isArray(g)&&g.length&&ie(g[0]),[g]);d.useLayoutEffect(()=>{let e=N.domElement;g&&g===`blending`?(e.style.zIndex=`${Math.floor(D[0]/2)}`,e.style.position=`absolute`,e.style.pointerEvents=`none`):(e.style.zIndex=null,e.style.position=null,e.style.pointerEvents=null)},[g]),d.useLayoutEffect(()=>{if(H.current){let e=V.current=f.createRoot(B);if(F.updateMatrixWorld(),h)B.style.cssText=`position:absolute;top:0;left:0;pointer-events:none;overflow:hidden;`;else{let e=O(H.current,P,I);B.style.cssText=`position:absolute;top:0;left:0;transform:translate3d(${e[0]}px,${e[1]}px,0);transform-origin:0 0;`}return q&&(i?q.prepend(B):q.appendChild(B)),()=>{q&&q.removeChild(B),e.unmount()}}},[q,h]),d.useLayoutEffect(()=>{k&&(B.className=k)},[k]);let Z=d.useMemo(()=>h?{position:`absolute`,top:0,left:0,width:I.width,height:I.height,transformStyle:`preserve-3d`,pointerEvents:`none`}:{position:`absolute`,transform:a?`translate3d(-50%,-50%,0)`:`none`,...o&&{top:-I.height/2,left:-I.width/2,width:I.width,height:I.height},...n},[n,a,o,I,h]),oe=d.useMemo(()=>({position:`absolute`,pointerEvents:A}),[A]);d.useLayoutEffect(()=>{if(Y.current=!1,h){var t;(t=V.current)==null||t.render(d.createElement(`div`,{ref:G,style:Z},d.createElement(`div`,{ref:K,style:oe},d.createElement(`div`,{ref:M,className:r,style:n,children:e}))))}else{var i;(i=V.current)==null||i.render(d.createElement(`div`,{ref:M,style:Z,className:r,children:e}))}});let Q=d.useRef(!0);l(e=>{if(H.current){P.updateMatrixWorld(),H.current.updateWorldMatrix(!0,!1);let e=h?W.current:O(H.current,P,I);if(h||Math.abs(U.current-P.zoom)>t||Math.abs(W.current[0]-e[0])>t||Math.abs(W.current[1]-e[1])>t){let t=_(H.current,P),n=!1;X&&(Array.isArray(g)?n=g.map(e=>e.current):g!==`blending`&&(n=[F]));let r=Q.current;if(n){let e=v(H.current,P,L,n);Q.current=e&&!t}else Q.current=!t;r!==Q.current&&(S?S(!Q.current):B.style.display=Q.current?`block`:`none`);let i=Math.floor(D[0]/2),a=g?X?[D[0],i]:[i-1,0]:D;if(B.style.zIndex=`${b(H.current,P,a)}`,h){let[e,t]=[I.width/2,I.height/2],n=P.projectionMatrix.elements[5]*t,{isOrthographicCamera:r,top:i,left:a,bottom:o,right:s}=P,c=ne(P.matrixWorldInverse),l=r?`scale(${n})translate(${x(-(s+a)/2)}px,${x((i+o)/2)}px)`:`translateZ(${n}px)`,u=H.current.matrixWorld;m&&(u=P.matrixWorldInverse.clone().transpose().copyPosition(u).scale(H.current.scale),u.elements[3]=u.elements[7]=u.elements[11]=0,u.elements[15]=1),B.style.width=I.width+`px`,B.style.height=I.height+`px`,B.style.perspective=r?``:`${n}px`,G.current&&K.current&&(G.current.style.transform=`${l}${c}translate(${e}px,${t}px)`,K.current.style.transform=re(u,1/((p||10)/400)))}else{let t=p===void 0?1:y(H.current,P)*p;B.style.transform=`translate3d(${e[0]}px,${e[1]}px,0) scale(${t})`}W.current=e,U.current=P.zoom}}if(!X&&J.current&&!Y.current){if(h){if(G.current){let e=G.current.children[0];if(e!=null&&e.clientWidth&&e!=null&&e.clientHeight){let{isOrthographicCamera:t}=P;if(t||E)j.scale&&(Array.isArray(j.scale)?j.scale instanceof s?J.current.scale.copy(j.scale.clone().divideScalar(1)):J.current.scale.set(1/j.scale[0],1/j.scale[1],1/j.scale[2]):J.current.scale.setScalar(1/j.scale));else{let t=(p||10)/400,n=e.clientWidth*t,r=e.clientHeight*t;J.current.scale.set(n,r,1)}Y.current=!0}}}else{let t=B.children[0];if(t!=null&&t.clientWidth&&t!=null&&t.clientHeight){let e=1/z.factor,n=t.clientWidth*e,r=t.clientHeight*e;J.current.scale.set(n,r,1),Y.current=!0}J.current.lookAt(e.camera.position)}}});let $=d.useMemo(()=>({vertexShader:h?void 0:`
          /*
            This shader is from the THREE's SpriteMaterial.
            We need to turn the backing plane into a Sprite
            (make it always face the camera) if "transfrom"
            is false.
          */
          #include <common>

          void main() {
            vec2 center = vec2(0., 1.);
            float rotation = 0.0;

            // This is somewhat arbitrary, but it seems to work well
            // Need to figure out how to derive this dynamically if it even matters
            float size = 0.03;

            vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
            vec2 scale;
            scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
            scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );

            bool isPerspective = isPerspectiveMatrix( projectionMatrix );
            if ( isPerspective ) scale *= - mvPosition.z;

            vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale * size;
            vec2 rotatedPosition;
            rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
            rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
            mvPosition.xy += rotatedPosition;

            gl_Position = projectionMatrix * mvPosition;
          }
      `,fragmentShader:`
        void main() {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        }
      `}),[h]);return d.createElement(`group`,ee({},j,{ref:H}),g&&!X&&d.createElement(`mesh`,{castShadow:C,receiveShadow:w,ref:J},E||d.createElement(`planeGeometry`,null),T||d.createElement(`shaderMaterial`,{side:2,vertexShader:$.vertexShader,fragmentShader:$.fragmentShader})))}),w=`
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vW;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vW = wp.xyz;
    vN = normalize(mat3(modelMatrix) * normal);
    vV = cameraPosition - wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`,T=`
  uniform vec3 uColor;
  uniform vec3 uHot;
  uniform float uFill;
  uniform float uRim;
  uniform float uPower;
  uniform float uHover;
  uniform float uSelect;
  uniform float uVisible;
  uniform float uDim;
  uniform float uNear;
  uniform float uTime;
  uniform float uBack;
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vW;
  void main() {
    float d = max(length(vV), 1e-4);
    vec3 V = vV / d;
    vec3 N = vN / max(length(vN), 1e-4);
    // clamp: sin él, la imprecisión deja bases negativas en pow() → NaN, y el bloom lo esparce por la pantalla
    float ndv = clamp(abs(dot(N, V)), 0.0, 1.0);
    float fres = pow(max(1.0 - ndv, 1e-4), uPower);
    // pelado por proximidad: lo que queda pegado a la cámara se apaga
    float prox = smoothstep(uNear, uNear * 2.4, d);
    // respiración lenta de la luz a lo largo del eje rostrocaudal
    float shimmer = 0.94 + 0.06 * sin(vW.z * 0.9 + vW.y * 0.6 - uTime * 1.1);
    float heat = uHover * 0.6 + uSelect;
    vec3 col = mix(uColor, uHot, clamp(heat, 0.0, 1.0));
    float a = (uFill * (1.0 + heat * 2.2) + fres * uRim * (1.0 + heat * 0.9)) * shimmer;
    // la cara trasera se atenúa: sin esto, los surcos del lado lejano se superponen a los del cercano
    a *= (gl_FrontFacing ? 1.0 : uBack) * uVisible * prox * (1.0 - uDim * 0.82);
    a = clamp(a, 0.0, 4.0);
    gl_FragColor = vec4(col * a, a);
  }
`;function E(e){return new c({vertexShader:w,fragmentShader:T,transparent:!0,depthWrite:!1,side:2,blending:2,uniforms:{uColor:{value:new i(e.color)},uHot:{value:new i(`#c4e6ff`)},uFill:{value:e.fill},uRim:{value:e.rim},uPower:{value:e.power??2.2},uHover:{value:0},uSelect:{value:0},uVisible:{value:1},uDim:{value:0},uNear:{value:2},uTime:{value:0},uBack:{value:.35}}})}function D(e,t,n,r=10){return e+(t-e)*(1-Math.exp(-r*n))}export{E as n,C as r,D as t};
//# sourceMappingURL=holo-CpveTDQx.js.map