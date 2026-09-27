import { Rive,Layout,Fit,Alignment,RuntimeLoader,decodeImage } from '@rive-app/canvas';
import type {ImageAsset} from '@rive-app/canvas/rive_advanced.mjs';
import {imageFor} from './catalog';
export type Behaviour='idle'|'walk'|'look'|'eat'|'happy'|'sleep';
RuntimeLoader.setWasmUrl('/rive/rive.wasm');
export class RiveDinosaur {
  private rive:Rive;
  private observer:ResizeObserver;
  private disposed=false;
  private loaded=false;
  private enabled:boolean;
  private behaviour:Behaviour='idle';
  private assetRequest=new AbortController();
  constructor(private canvas:HTMLCanvasElement,id:number,motion:boolean,onError:()=>void){
    this.enabled=motion;
    const fail=()=>{if(!this.disposed)onError();};
    const artboard=id===5?'Flying':[0,16,17].includes(id)?'LongNeck':[1,2,4,11,15].includes(id)?'Quadruped':'Biped';
    this.rive=new Rive({src:'/rive/dinosaur.riv',artboard,canvas,autoplay:true,stateMachines:'Dinosaur',enableRiveAssetCDN:false,layout:new Layout({fit:Fit.Contain,alignment:Alignment.Center}),
      assetLoader:(asset)=>{
        if(!asset.isImage)return false;
        fetch(imageFor(id),{signal:this.assetRequest.signal}).then(r=>{if(!r.ok)throw Error('image');return r.arrayBuffer();}).then(bytes=>decodeImage(new Uint8Array(bytes))).then(image=>{if(!this.disposed){(asset as ImageAsset).setRenderImage(image);canvas.dataset.ready='true';}image.unref();}).catch(e=>{if(e.name!=='AbortError')fail();});
        return true;
      },
      onLoad:()=>{if(!this.disposed){this.loaded=true;this.rive.resizeDrawingSurfaceToCanvas(Math.min(devicePixelRatio,1.5));canvas.dataset.rive='loaded';this.setBehaviour(this.behaviour);this.setMotion(this.enabled);}},
      onStateChange:event=>{if(!this.disposed)canvas.dataset.riveState=String(event.data);},
      onLoadError:fail,
    });
    this.observer=new ResizeObserver(()=>{if(!this.disposed)this.rive.resizeDrawingSurfaceToCanvas(Math.min(devicePixelRatio,1.5));});this.observer.observe(canvas);
  }
  setBehaviour(next:Behaviour){
    this.behaviour=next;this.canvas.dataset.behaviour=next;
    if(!this.loaded)return;
    const inputs=this.rive.stateMachineInputs('Dinosaur')??[];
    for(const [name,active]of [['isWalking',next==='walk'],['isEating',next==='eat'],['isSleeping',next==='sleep']] as const){const input=inputs.find(i=>i.name===name);if(input)input.value=active;}
    if(next==='happy'||next==='look')inputs.find(i=>i.name===(next==='happy'?'isHappy':'lookaround'))?.fire();
    if(this.enabled)this.rive.play('Dinosaur');
  }
  setMotion(enabled:boolean){this.enabled=enabled;if(!this.loaded)return;if(enabled)this.rive.play('Dinosaur');else this.rive.pause();}
  dispose(){this.disposed=true;this.assetRequest.abort();this.observer.disconnect();this.rive.cleanup();}
}
