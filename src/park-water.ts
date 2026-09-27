import * as T from 'three';

// Original lightweight WebGL shader. See docs/rendering-reference.md for the
// coastal-simulation techniques studied; no fluid solver is run on the CPU.
export function parkWater(fall=false){
  return new T.ShaderMaterial({transparent:true,side:T.DoubleSide,depthWrite:false,
    uniforms:{time:{value:0},wind:{value:.45},day:{value:1},fall:{value:fall?1:0}},
    vertexShader:`varying vec2 vUv; varying vec3 vWorld; uniform float time,wind,fall;
      void main(){vUv=uv;vec3 p=position;
        if(fall<.5)p.y+=sin(p.z*5.+time*1.8)*sin(p.x*4.-time)*.018*wind;
        vec4 world=modelMatrix*vec4(p,1.);vWorld=world.xyz;
        gl_Position=projectionMatrix*viewMatrix*world;}`,
    fragmentShader:`varying vec2 vUv; varying vec3 vWorld; uniform float time,wind,day,fall;
      void main(){
        float t=time*(.5+wind);vec2 p=vWorld.xz;
        float wave=sin(p.x*9.+p.y*5.+t*2.)+sin(p.y*13.-p.x*4.-t*1.3);
        float depth=sin(vUv.x*3.14159);
        vec3 shallow=vec3(.48,.83,.77),deep=vec3(.09,.51,.58);
        vec3 c=mix(shallow,deep,depth*.72);
        float caustic=pow(1.-abs(sin(p.x*7.+sin(p.y*5.+t*.4))+sin(p.y*8.-t*.5))*.5,14.);
        c+=vec3(.22,.32,.22)*caustic;
        vec3 n=normalize(vec3(cos(p.x*9.+t)*.10*wind,1.,sin(p.y*13.-t)*.13*wind));
        float fresnel=pow(1.-max(dot(n,normalize(cameraPosition-vWorld)),0.),4.);
        c=mix(c,vec3(.77,.91,.94),fresnel*.68);
        float foam=(1.-smoothstep(.015,.095,min(vUv.x,1.-vUv.x)))*(.6+.4*sin(vUv.y*95.-t*3.));
        float glint=pow(max(wave*.5,0.),22.)*.20;
        if(fall>.5){float stream=sin(vUv.x*73.+sin(vUv.y*13.+t*6.));
          c=mix(vec3(.32,.76,.81),vec3(.9,.99,1.),smoothstep(.25,.92,stream)*.66);
          foam+=pow(1.-vUv.y,7.)*.7;}
        c=mix(c,vec3(.92,.99,.94),clamp(foam,0.,.85))+glint;
        c*=mix(vec3(.24,.38,.59),vec3(1.),day);
        gl_FragColor=vec4(c,fall>.5?.84:.94);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`});
}
