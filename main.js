import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
import { LEVELS } from './levels.js';

const $ = (s) => document.querySelector(s);
const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;
const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

const DEFAULT_SETTINGS = { sens: 0.9, sfx: 0.7, music: 0.18, quality: 'high', invertY: false };
const STORAGE_KEY = 'officeEscape1659_v1';

function loadSave(){
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      unlocked: Math.max(1, raw.unlocked || 1),
      best: raw.best || {},
      stars: raw.stars || {},
      tutorials: raw.tutorials || {},
      settings: {...DEFAULT_SETTINGS, ...(raw.settings || {})}
    };
  } catch { return {unlocked:1,best:{},stars:{},tutorials:{},settings:{...DEFAULT_SETTINGS}}; }
}
let SAVE = loadSave();
const persist = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(SAVE)); } catch {} };

function fmtTime(sec){
  if (!Number.isFinite(sec)) return '—';
  const m = Math.floor(sec/60), s = sec - m*60;
  return `${String(m).padStart(2,'0')}:${s.toFixed(1).padStart(4,'0')}`;
}

class AudioManager {
  constructor(){ this.ctx=null; this.master=null; this.ambientGain=null; this.started=false; this.osc=[]; }
  ensure(){
    if(this.ctx) { if(this.ctx.state==='suspended') this.ctx.resume(); return; }
    const AudioCtx=window.AudioContext || window.webkitAudioContext; if(!AudioCtx)return;
    try{this.ctx = new AudioCtx();}catch{return;}
    this.master = this.ctx.createGain(); this.master.gain.value = SAVE.settings.sfx; this.master.connect(this.ctx.destination);
    this.ambientGain = this.ctx.createGain(); this.ambientGain.gain.value = SAVE.settings.music * .12; this.ambientGain.connect(this.ctx.destination);
    const o1=this.ctx.createOscillator(), o2=this.ctx.createOscillator();
    const g1=this.ctx.createGain(),g2=this.ctx.createGain();
    o1.type='sine';o2.type='triangle';o1.frequency.value=58;o2.frequency.value=118;g1.gain.value=.11;g2.gain.value=.025;
    o1.connect(g1).connect(this.ambientGain);o2.connect(g2).connect(this.ambientGain);o1.start();o2.start();this.osc=[o1,o2];
  }
  update(){ if(this.master) this.master.gain.value=SAVE.settings.sfx; if(this.ambientGain) this.ambientGain.gain.value=SAVE.settings.music*.12; }
  tone(freq=440,d=.09,type='sine',gain=.1,delay=0){
    this.ensure(); if(!this.ctx||!this.master)return; const t=this.ctx.currentTime+delay, o=this.ctx.createOscillator(), g=this.ctx.createGain();
    o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);
    o.connect(g).connect(this.master);o.start(t);o.stop(t+d+.02);
  }
  success(){ this.tone(660,.09,'sine',.10); this.tone(880,.12,'sine',.11,.09); this.tone(1100,.18,'sine',.11,.20); }
  caught(){ this.tone(190,.14,'sawtooth',.1); this.tone(140,.22,'sawtooth',.08,.10); }
  interact(){ this.tone(520,.07,'square',.05); }
  suspicion(){ this.tone(720,.055,'square',.035); }
  printer(){ for(let i=0;i<7;i++) this.tone(180+i*12,.05,'square',.035,i*.09); }
  notification(){ this.tone(850,.07,'sine',.07); this.tone(1050,.08,'sine',.07,.08); }
}
const AUDIO = new AudioManager();

function roleColor(role){
  return ({boss:0xe34b57,coworker:0x4ba3e3,chatter:0xf0a24b,pm:0xbc62df,hr:0x49bf83,reception:0xf1d260,it:0x6c7b95,rival:0xff8f45})[role] || 0x8ca0b8;
}
function roleLabel(role){
  return ({boss:'ŠÉF',coworker:'KOLEGA',chatter:'UKECANÝ',pm:'PM',hr:'HR',reception:'RECEPCE',it:'IT',rival:'RIVAL'})[role] || 'NPC';
}

function makePerson(color=0x4aa3ff, player=false){
  const group=new THREE.Group();
  const cloth=new THREE.MeshStandardMaterial({color,roughness:.68,metalness:.02});
  const shirt=new THREE.MeshStandardMaterial({color:0xf0f2f3,roughness:.82});
  const skin=new THREE.MeshStandardMaterial({color:0xe3b18c,roughness:.78});
  const trousers=new THREE.MeshStandardMaterial({color:player?0x243342:0x252d35,roughness:.76});
  const shoeMat=new THREE.MeshStandardMaterial({color:0x111417,roughness:.44,metalness:.08});
  const hairMat=new THREE.MeshStandardMaterial({color:0x2a211c,roughness:.9});
  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.30,.70,10,18),cloth);torso.position.y=1.11;torso.castShadow=true;group.add(torso);
  const shirtV=new THREE.Mesh(new THREE.BoxGeometry(.20,.24,.012),shirt);shirtV.position.set(0,1.42,.292);shirtV.rotation.z=Math.PI/4;group.add(shirtV);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.248,24,18),skin);head.position.y=1.87;head.castShadow=true;group.add(head);
  const hair=new THREE.Mesh(new THREE.SphereGeometry(.252,22,14,0,Math.PI*2,0,Math.PI*.48),hairMat);hair.position.y=1.94;hair.castShadow=true;group.add(hair);
  const eyeMat=new THREE.MeshStandardMaterial({color:0x171b20,roughness:.2});
  for(const sx of [-.072,.072]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.014,8,6),eyeMat);eye.position.set(sx,1.89,.232);group.add(eye);}
  const nose=new THREE.Mesh(new THREE.ConeGeometry(.025,.075,8),skin);nose.rotation.x=Math.PI/2;nose.position.set(0,1.84,.258);group.add(nose);
  const tie=new THREE.Mesh(new THREE.ConeGeometry(.035,.24,4),new THREE.MeshStandardMaterial({color:player?0x4f9fc9:0x6f2530,roughness:.6}));tie.rotation.z=Math.PI;tie.position.set(0,1.33,.307);group.add(tie);
  const mkLimb=(geo,mat,x,y,z)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;group.add(m);return m;};
  const leftLeg=mkLimb(new THREE.CapsuleGeometry(.10,.48,6,10),trousers,-.15,.47,0);
  const rightLeg=mkLimb(new THREE.CapsuleGeometry(.10,.48,6,10),trousers,.15,.47,0);
  const leftArm=mkLimb(new THREE.CapsuleGeometry(.082,.45,6,10),cloth,-.38,1.15,0);leftArm.rotation.z=.07;
  const rightArm=mkLimb(new THREE.CapsuleGeometry(.082,.45,6,10),cloth,.38,1.15,0);rightArm.rotation.z=-.07;
  mkLimb(new THREE.BoxGeometry(.21,.11,.40),shoeMat,-.15,.075,.07);mkLimb(new THREE.BoxGeometry(.21,.11,.40),shoeMat,.15,.075,.07);
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(.43,24),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.18,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.009;shadow.scale.set(1,.62,1);group.add(shadow);
  if(player){
    const bag=new THREE.Mesh(new THREE.BoxGeometry(.49,.58,.17),new THREE.MeshStandardMaterial({color:0x1a2733,roughness:.58,metalness:.09}));bag.position.set(0,1.10,-.335);bag.castShadow=true;group.add(bag);
    const strap=new THREE.Mesh(new THREE.TorusGeometry(.33,.022,8,28,Math.PI),new THREE.MeshStandardMaterial({color:0x10171e,roughness:.72}));strap.rotation.set(Math.PI/2,0,Math.PI/2);strap.position.set(-.02,1.38,-.20);group.add(strap);
  }
  group.userData.leftLeg=leftLeg;group.userData.rightLeg=rightLeg;group.userData.leftArm=leftArm;group.userData.rightArm=rightArm;
  return group;
}
function lineHitsRect(ax,az,bx,bz,r){
  let t0=0,t1=1; const dx=bx-ax,dz=bz-az;
  const p=[-dx,dx,-dz,dz], q=[ax-r.minX,r.maxX-ax,az-r.minZ,r.maxZ-az];
  for(let i=0;i<4;i++){
    if(Math.abs(p[i])<1e-8){ if(q[i]<0) return false; }
    else { const u=q[i]/p[i]; if(p[i]<0){ if(u>t1)return false; if(u>t0)t0=u; } else { if(u<t0)return false; if(u<t1)t1=u; } }
  }
  return true;
}

class NPC {
  constructor(game,cfg){
    this.game=game; this.cfg=cfg; this.role=cfg.role; this.group=makePerson(roleColor(cfg.role));
    this.group.position.set(cfg.x,0,cfg.z); this.game.world.add(this.group);
    this.patrol=(cfg.patrol||[[cfg.x,cfg.z]]).map(p=>new THREE.Vector3(p[0],0,p[1])); this.index=0; this.speed=cfg.speed||1.2;
    this.range=cfg.range||8; this.fov=THREE.MathUtils.degToRad(cfg.fov||72); this.yaw=0; this.state='patrol'; this.suspicion=0; this.lastSeen=null; this.investigateTarget=null; this.investigateUntil=0; this.investigateStopRadius=.95; this.pause=0; this.lastTone=0; this.reachedRace=false; this.navPath=[]; this.navTarget=null; this.navGoal=null; this.navVersion=-1; this.navRefreshAt=0; this.navStopRadius=.2; this.stuckFor=0; this.lastMovePos=this.group.position.clone();
    this.cone=this.makeCone(); this.game.world.add(this.cone);
    this.tag=this.makeTag(); this.group.add(this.tag);
  }
  makeCone(){
    const w=Math.tan(this.fov/2)*this.range; const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute([0,.03,0,-w,.03,this.range,w,.03,this.range],3));
    geo.computeVertexNormals();
    const mat=new THREE.MeshBasicMaterial({color:roleColor(this.role),transparent:true,opacity:.075,side:THREE.DoubleSide,depthWrite:false});
    const mesh=new THREE.Mesh(geo,mat); return mesh;
  }
  makeTag(){
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;const c=canvas.getContext('2d');c.fillStyle='rgba(7,10,15,.8)';if(c.roundRect){c.beginPath();c.roundRect(5,8,246,48,14);c.fill();}else c.fillRect(5,8,246,48);c.fillStyle='#fff';c.font='700 25px sans-serif';c.textAlign='center';c.fillText(roleLabel(this.role),128,41);
    const tex=new THREE.CanvasTexture(canvas);const mat=new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false});const s=new THREE.Sprite(mat);s.position.y=2.55;s.scale.set(1.8,.45,1);return s;
  }
  forward(){ return new THREE.Vector3(Math.sin(this.yaw),0,Math.cos(this.yaw)); }
  canSeePlayer(){
    if(this.cfg.passItem && this.game.inventory[this.cfg.passItem]) return false;
    const p=this.game.player.position; const here=this.group.position; const delta=new THREE.Vector3().subVectors(p,here); const dist=delta.length();
    if(dist>this.range) return false;
    if(this.game.elapsed < this.game.safeUntil) return false;
    const angle=this.forward().angleTo(delta.normalize()); if(angle>this.fov/2) return false;
    if(this.game.isPlayerSafe()) return false;
    const social=this.game.socialModifierFor(this);
    if(social<=.12 && dist>2.4) return false;
    const crouched=this.game.stealth; const blockHeight=crouched ? .72 : 1.28;
    for(const o of this.game.activeObstacles){
      if(o.h < blockHeight) continue;
      const r={minX:o.x-o.w/2,maxX:o.x+o.w/2,minZ:o.z-o.d/2,maxZ:o.z+o.d/2};
      if(lineHitsRect(here.x,here.z,p.x,p.z,r)) return false;
    }
    return true;
  }
  distract(target,duration=10,approachRadius=.95){
    if(this.role==='rival') return;
    this.investigateTarget=new THREE.Vector3(target.x,0,target.z);
    this.investigateStopRadius=Math.max(.65,approachRadius||.95);
    this.investigateUntil=this.game.elapsed+duration;
    this.state='investigate'; this.suspicion=Math.min(this.suspicion,.32); this.pause=0;
    this.navPath=[]; this.navTarget=null; this.navGoal=null; this.navRefreshAt=0; this.stuckFor=0;
  }
  moveToward(target,dt,speed=this.speed,stopRadius=.20){
    const pos=this.group.position;
    const changed=!this.navTarget || this.navTarget.distanceToSquared(target)>.20 || Math.abs(this.navStopRadius-stopRadius)>.05 || this.navVersion!==this.game.navVersion || this.game.elapsed>=this.navRefreshAt;
    if(changed){
      const route=this.game.findPath(pos,target,.30,{stopRadius});
      this.navPath=route?.points || [];
      this.navGoal=route?.goal || null;
      this.navTarget=target.clone();
      this.navStopRadius=stopRadius;
      this.navVersion=this.game.navVersion;
      this.navRefreshAt=this.game.elapsed+.85;
    }
    if(!this.navGoal){
      this.stuckFor+=dt;
      if(this.stuckFor>.45)this.navRefreshAt=0;
      return false;
    }
    if(pos.distanceTo(this.navGoal)<Math.max(.18,stopRadius*.35)){this.navPath=[];this.stuckFor=0;return true;}
    while(this.navPath.length && pos.distanceTo(this.navPath[0])<.18)this.navPath.shift();
    const dest=this.navPath[0] || this.navGoal;
    if(!dest) return false;
    const dx=dest.x-pos.x,dz=dest.z-pos.z,dist=Math.hypot(dx,dz);
    if(dist<.015) return this.navPath.length===0;
    this.yaw=Math.atan2(dx,dz); this.group.rotation.y=this.yaw;
    const beforeX=pos.x,beforeZ=pos.z;
    const step=Math.min(dist,speed*dt); const nx=pos.x+Math.sin(this.yaw)*step,nz=pos.z+Math.cos(this.yaw)*step;
    // NPC navigation ignores social/hard-gate circles. Those are player gameplay gates, not walls.
    if(!this.game.staticCollisionAtRadius(nx,nz,.30)){pos.x=nx;pos.z=nz;}else{this.navRefreshAt=0;}
    const moved=Math.hypot(pos.x-beforeX,pos.z-beforeZ);
    if(moved<.002 && dist>.25){this.stuckFor+=dt;if(this.stuckFor>.38){this.navRefreshAt=0;this.navPath=[];}}
    else this.stuckFor=0;
    return this.navGoal ? pos.distanceTo(this.navGoal)<Math.max(.20,stopRadius*.35) : false;
  }
  update(dt){
    if(this.game.paused || this.game.finished) return;
    if(this.role==='rival'){
      const target=this.patrol[Math.min(this.index,this.patrol.length-1)];
      if(this.moveToward(target,dt,this.speed)){
        if(this.index<this.patrol.length-1)this.index++;
        else if(!this.reachedRace){this.reachedRace=true;this.game.rivalFinished();}
      }
      this.cone.visible=false;
      return;
    }
    const sees=this.canSeePlayer();
    let detection= this.role==='boss'? .85 : this.role==='reception'? .80 : this.role==='hr'? .72 : .64;
    detection *= this.game.socialModifierFor(this);
    if(this.game.sprinting) detection*=1.25;
    if(this.game.stealth) detection*=.56;
    if(sees){
      this.lastSeen=this.game.player.position.clone(); this.suspicion=clamp(this.suspicion+detection*dt,0,1.15);
      if(this.suspicion>.28 && this.state!=='investigate') this.state='suspicious';
      if(this.suspicion>.68) this.state='alerted';
      if(this.game.elapsed-this.lastTone>1.4 && this.suspicion>.35){ AUDIO.suspicion();this.lastTone=this.game.elapsed; }
      if(this.suspicion>=1){ this.game.catchPlayer(this); this.suspicion=.2; return; }
    } else {
      this.suspicion=Math.max(0,this.suspicion-dt*(this.state==='alerted'?.14:.22));
      if(this.state==='alerted' && this.lastSeen){ this.investigateTarget=this.lastSeen.clone();this.investigateUntil=this.game.elapsed+5;this.state='investigate'; }
      if(this.state==='suspicious' && this.suspicion<.15) this.state='patrol';
    }

    if(this.state==='investigate' && this.investigateTarget){
      if(this.moveToward(this.investigateTarget,dt,this.speed*1.1,this.investigateStopRadius)) this.pause+=dt;
      if(this.game.elapsed>this.investigateUntil){this.state='patrol';this.investigateTarget=null;this.pause=0;}
    } else if(this.state==='alerted' && this.lastSeen){
      this.moveToward(this.lastSeen,dt,this.speed*1.45);
    } else {
      if(this.pause>0){this.pause-=dt;} else {
        const target=this.patrol[this.index];
        if(this.moveToward(target,dt,this.speed)){this.pause=.55+Math.random()*.6;this.index=(this.index+1)%this.patrol.length;}
      }
    }
    const moving=this.state==='investigate'||this.state==='alerted'||this.patrol.length>1;const swing=moving?Math.sin(this.game.elapsed*8*this.speed)*.42:0;
    if(this.group.userData.leftLeg){this.group.userData.leftLeg.rotation.x=swing;this.group.userData.rightLeg.rotation.x=-swing;this.group.userData.leftArm.rotation.x=-swing*.7;this.group.userData.rightArm.rotation.x=swing*.7;}
    this.cone.position.set(this.group.position.x,.02,this.group.position.z); this.cone.rotation.y=this.yaw;
    const tactical=this.game.tactical; this.cone.material.opacity = tactical ? (this.state==='alerted'?.22:.13) : (this.state==='alerted'?.12:.055);
    this.cone.material.color.set(this.state==='alerted'?0xff354d:roleColor(this.role));
    const pulse=1+this.suspicion*.08; this.tag.scale.set(1.8*pulse,.45*pulse,1);
  }
  dispose(){ this.game.disposeObject(this.group); this.game.disposeObject(this.cone); this.game.world.remove(this.group); this.game.world.remove(this.cone); }
}

class Game {
  constructor(){
    this.canvas=$('#game'); this.renderer=new THREE.WebGLRenderer({canvas:this.canvas,antialias:SAVE.settings.quality==='high',powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,SAVE.settings.quality==='high'?1.65:1)); this.renderer.shadowMap.enabled=SAVE.settings.quality==='high'; this.renderer.shadowMap.type=THREE.PCFSoftShadowMap; this.renderer.outputColorSpace=THREE.SRGBColorSpace; this.renderer.toneMapping=THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure=1.08;
    this.scene=new THREE.Scene(); this.world=new THREE.Group(); this.scene.add(this.world);
    // Commandos-style fixed isometric camera. No mouse look, no shoulder camera.
    this.cameraView=9.2;
    const aspect=innerWidth/innerHeight;
    this.camera=new THREE.OrthographicCamera(-this.cameraView*aspect,this.cameraView*aspect,this.cameraView,-this.cameraView,.1,180);
    this.clock=new THREE.Clock(); this.keys={}; this.joy={x:0,y:0}; this.cameraYaw=Math.PI*.25; this.cameraPitch=1.02; this.camDistance=19.0;
    this.running=false;this.paused=false;this.finished=false;this.level=null;this.levelIndex=0;this.player=null;this.playerRadius=.38;this.npcs=[];this.interactive=[];this.obstacleMeshes=[];this.exitMesh=null;this.checkpointMeshes=[];this.checkpointIndex=-1;this.elapsed=0;this.penalty=0;this.catches=0;this.diversions=0;this.distractedCount=0;this.sprinting=false;this.stealth=false;this.working=false;this.tactical=false;this.inventory={badge:false,folder:false,headset:false};this.closest=null;this.toastTimer=0;this.tutorialTimer=0;this.lastNoise=0;this.raceFailed=false;this.usedTypes=new Set();this.uniqueDiversions=new Set();this.navVersion=0;this.safeUntil=0;this.mobileSprint=false;
    this.buildStaticLights(); this.bindEvents(); this.resize(); this.renderLevelCards(); this.syncSettingsUI(); requestAnimationFrame(()=>this.loop());
  }
  buildStaticLights(){
    this.scene.add(new THREE.HemisphereLight(0xeef6ff,0x34404c,1.05));
    this.scene.add(new THREE.AmbientLight(0xffffff,.22));
    this.sun=new THREE.DirectionalLight(0xfff3dc,2.85);this.sun.position.set(-16,25,12);this.sun.castShadow=true;this.sun.shadow.mapSize.set(SAVE.settings.quality==='high'?2048:1024,SAVE.settings.quality==='high'?2048:1024);this.sun.shadow.bias=-.00016;this.sun.shadow.normalBias=.025;this.sun.shadow.camera.left=-40;this.sun.shadow.camera.right=40;this.sun.shadow.camera.top=40;this.sun.shadow.camera.bottom=-40;this.scene.add(this.sun);
    this.buildEnvironmentMap();
  }
  buildEnvironmentMap(){
    const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d');
    const g=x.createLinearGradient(0,0,0,256);g.addColorStop(0,'#dce9f4');g.addColorStop(.45,'#8da2b1');g.addColorStop(1,'#1d2630');x.fillStyle=g;x.fillRect(0,0,512,256);
    x.fillStyle='rgba(255,247,225,.95)';x.fillRect(42,54,120,18);x.fillRect(326,80,145,15);x.fillStyle='rgba(175,210,235,.55)';x.fillRect(205,34,64,72);
    const t=new THREE.CanvasTexture(c);t.mapping=THREE.EquirectangularReflectionMapping;t.colorSpace=THREE.SRGBColorSpace;this.scene.environment=t;this.envTexture=t;
  }
  disposeObject(o){
    o?.traverse?.(c=>{
      c.geometry?.dispose?.();
      if(c.material){
        const mats=Array.isArray(c.material)?c.material:[c.material];
        for(const m of mats){m.map?.dispose?.();m.alphaMap?.dispose?.();m.dispose?.();}
      }
    });
  }
  clearWorld(){
    this.npcs=[];
    while(this.world.children.length){const o=this.world.children[0];this.world.remove(o);this.disposeObject(o);}
    this.obstacleMeshes=[];this.interactive=[];this.checkpointMeshes=[];this.activeObstacles=[];
  }
  proceduralTexture(base='#6c7076',variance=18,kind='grain'){
    const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
    const rgb=new THREE.Color(base);const R=Math.round(rgb.r*255),G=Math.round(rgb.g*255),B=Math.round(rgb.b*255);
    const img=x.createImageData(128,128);
    for(let i=0;i<img.data.length;i+=4){let n=(Math.random()-.5)*variance;if(kind==='carpet')n+=((i/4)%128)%6<1?-5:0;img.data[i]=clamp(R+n,0,255);img.data[i+1]=clamp(G+n,0,255);img.data[i+2]=clamp(B+n,0,255);img.data[i+3]=255;}
    x.putImageData(img,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
  }
  makeFloor(level){
    const [w,d]=level.size;const tex=this.proceduralTexture('#666c72',22,'carpet');tex.repeat.set(w/3,d/3);
    const mat=new THREE.MeshStandardMaterial({color:level.theme.floor,map:tex,roughness:.96,metalness:0});const floor=new THREE.Mesh(new THREE.PlaneGeometry(w,d),mat);floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;this.world.add(floor);
    // Open-top office: no ceiling mesh, so the third-person camera always has a clear view.
    const cols=Math.max(2,Math.floor(w/11)),rows=Math.max(2,Math.floor(d/10));
    for(let ix=0;ix<cols;ix++)for(let iz=0;iz<rows;iz++){
      const x=-w/2+(ix+.5)*w/cols,z=-d/2+(iz+.5)*d/rows;
      if(SAVE.settings.quality==='high' && (ix+iz)%2===0){const l=new THREE.PointLight(0xeaf4ff,1.30,9,2);l.position.set(x,2.76,z);this.world.add(l);}
    }
    this.addOfficeShell(level);
  }
  addOfficeShell(level){
    const [w,d]=level.size;
    // Open-top office: ceiling grid intentionally omitted for camera visibility.
    // faux city windows on the far perimeter - visual only, collision remains the wall.
    const glass=new THREE.MeshPhysicalMaterial({color:0x7897ab,roughness:.08,metalness:.08,transparent:true,opacity:.82,transmission:.18,thickness:.08,emissive:0x162a3a,emissiveIntensity:.18});
    const frame=new THREE.MeshStandardMaterial({color:0x2b333a,roughness:.38,metalness:.62});
    const z=-d/2+.205; const count=Math.max(3,Math.floor(w/5)); const spacing=(w-4)/count;
    for(let i=0;i<count;i++){
      const xx=-w/2+2+spacing*(i+.5);const win=new THREE.Mesh(new THREE.BoxGeometry(Math.min(3.7,spacing-.28),1.45,.035),glass);win.position.set(xx,1.72,z);this.world.add(win);
      const sill=new THREE.Mesh(new THREE.BoxGeometry(Math.min(3.9,spacing-.08),.045,.08),frame);sill.position.set(xx,.95,z+.02);this.world.add(sill);
      const top=new THREE.Mesh(new THREE.BoxGeometry(Math.min(3.9,spacing-.08),.045,.08),frame);top.position.set(xx,2.47,z+.02);this.world.add(top);
    }
    // sparse wall art on the opposite wall.
    const artColors=[0x9f6548,0x506f81,0x6f7751,0x82606f];
    for(let i=0;i<Math.max(2,Math.floor(w/12));i++){
      const xx=-w/2+5+i*10; const fr=new THREE.Mesh(new THREE.BoxGeometry(2.1,1.05,.055),frame);fr.position.set(xx,1.72,d/2-.205);this.world.add(fr);
      const art=new THREE.Mesh(new THREE.BoxGeometry(1.92,.87,.018),new THREE.MeshStandardMaterial({color:artColors[i%artColors.length],roughness:.72}));art.position.set(xx,1.72,d/2-.24);this.world.add(art);
    }
  }
  addObstacle(o){
    const isWall=o.label==='stěna'||o.label?.includes('příčka'),isDoor=o.label==='dveře'||o.door,isDesk=o.label==='stůl',isPlant=o.label==='květina',isGlass=o.label?.includes('skleněná'),isTurn=o.label?.includes('turniket');
    const isMachine=o.label?.includes('kopírka')||o.label?.includes('tiskárna');
    const hasInteractiveMachine=isMachine && (this.level?.interactions||[]).some(c=>['copier','printerjam'].includes(c.type)&&Math.hypot(c.x-o.x,c.z-o.z)<.25);
    const invisibleCollision=isDesk||isPlant||isTurn||hasInteractiveMachine;
    const collisionMat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:invisibleCollision?0:1,depthWrite:!invisibleCollision});
    let mat;
    if(isGlass)mat=new THREE.MeshPhysicalMaterial({color:0xbad8e8,roughness:.12,metalness:0,transparent:true,opacity:.28,transmission:.42,thickness:.08});
    else if(isWall){const tex=this.proceduralTexture('#e5e4df',8);tex.repeat.set(Math.max(1,o.w/2),Math.max(1,o.d/2));mat=new THREE.MeshStandardMaterial({color:this.level.theme.wall,map:tex,roughness:.9});}
    else if(isDoor)mat=new THREE.MeshStandardMaterial({color:0x624a37,roughness:.46,metalness:.07});
    else mat=new THREE.MeshStandardMaterial({color:0x69727a,roughness:.66,metalness:.08});
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(o.w,o.h,o.d),invisibleCollision?collisionMat:mat);mesh.position.set(o.x,o.h/2,o.z);mesh.castShadow=!isGlass&&!isDesk&&!isPlant&&!isTurn;mesh.receiveShadow=true;mesh.userData.obstacle=o;this.world.add(mesh);this.obstacleMeshes.push(mesh);
    if(isWall&&!isGlass){const baseMat=new THREE.MeshStandardMaterial({color:0xc4c5c3,roughness:.7});if(o.w>o.d){const b=new THREE.Mesh(new THREE.BoxGeometry(o.w,.11,o.d+.035),baseMat);b.position.set(o.x,.055,o.z);this.world.add(b);}else{const b=new THREE.Mesh(new THREE.BoxGeometry(o.w+.035,.11,o.d),baseMat);b.position.set(o.x,.055,o.z);this.world.add(b);}}
    if(isDesk)this.decorateDesk(o);
    else if(isDoor)this.decorateDoor(o);
    else if(isPlant)this.decoratePlant(o);
    else if(isTurn)this.decorateTurnstile(o);
    else if(isMachine&&!hasInteractiveMachine)this.decorateMachine(o);
    else if(o.label?.includes('recepce')||o.label?.includes('kuchyň'))this.decorateCounter(o);
  }
  decorateDoor(o){
    const metal=new THREE.MeshStandardMaterial({color:0x858d92,roughness:.30,metalness:.76});
    const glass=new THREE.MeshPhysicalMaterial({color:0x9fb8c7,roughness:.08,transparent:true,opacity:.34,transmission:.36,thickness:.05});
    const pane=new THREE.Mesh(new THREE.BoxGeometry(Math.max(.12,o.w*.62),1.28,Math.max(.03,o.d*.42)),glass);pane.position.set(o.x,1.72,o.z);this.world.add(pane);
    const handle=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.23,12),metal);handle.rotation.z=Math.PI/2;handle.position.set(o.x+(o.w>.5?o.w*.32:.16),1.18,o.z+(o.d>.5?o.d*.32:.16));handle.castShadow=true;this.world.add(handle);
  }
  decorateDesk(o){
    const woodTex=this.proceduralTexture('#8d6c50',18);woodTex.repeat.set(2,1);const topMat=new THREE.MeshStandardMaterial({color:0x987659,map:woodTex,roughness:.52});const metal=new THREE.MeshStandardMaterial({color:0x30383f,roughness:.34,metalness:.68});
    const top=new THREE.Mesh(new THREE.BoxGeometry(o.w,.085,o.d),topMat);top.position.set(o.x,1.02,o.z);top.castShadow=true;top.receiveShadow=true;this.world.add(top);
    for(const sx of [-1,1])for(const sz of [-1,1]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.065,.94,.065),metal);leg.position.set(o.x+sx*(o.w/2-.15),.51,o.z+sz*(o.d/2-.13));leg.castShadow=true;this.world.add(leg);}
    const sc=document.createElement('canvas');sc.width=128;sc.height=72;const sx=sc.getContext('2d');const grad=sx.createLinearGradient(0,0,128,72);grad.addColorStop(0,'#0f2638');grad.addColorStop(1,'#163c50');sx.fillStyle=grad;sx.fillRect(0,0,128,72);sx.fillStyle='#69c5e8';sx.fillRect(10,10,44,6);sx.fillStyle='#7aa1b7';sx.fillRect(10,23,94,4);sx.fillRect(10,33,70,4);sx.fillStyle='#e7f4fa';sx.fillRect(84,48,29,12);const screenTex=new THREE.CanvasTexture(sc);screenTex.colorSpace=THREE.SRGBColorSpace;
    const screenMat=new THREE.MeshStandardMaterial({color:0xffffff,map:screenTex,roughness:.20,metalness:.15,emissive:0x193c55,emissiveIntensity:.65});const monitor=new THREE.Mesh(new THREE.BoxGeometry(.80,.49,.055),screenMat);monitor.position.set(o.x,1.43,o.z-.12);monitor.castShadow=true;this.world.add(monitor);
    const stand=new THREE.Mesh(new THREE.BoxGeometry(.055,.30,.055),metal);stand.position.set(o.x,1.20,o.z-.12);this.world.add(stand);
    const keyboard=new THREE.Mesh(new THREE.BoxGeometry(.72,.033,.25),new THREE.MeshStandardMaterial({color:0x242a2f,roughness:.48}));keyboard.position.set(o.x,1.085,o.z+.28);keyboard.rotation.x=-.03;this.world.add(keyboard);
    const mouse=new THREE.Mesh(new THREE.SphereGeometry(.075,12,8),new THREE.MeshStandardMaterial({color:0x20262a,roughness:.42}));mouse.scale.set(.72,.35,1);mouse.position.set(o.x+.48,1.09,o.z+.27);this.world.add(mouse);
    const paper=new THREE.Mesh(new THREE.BoxGeometry(.42,.008,.58),new THREE.MeshStandardMaterial({color:0xe9e6db,roughness:.95}));paper.position.set(o.x-.68,1.075,o.z+.18);paper.rotation.y=.12;this.world.add(paper);
    const mug=new THREE.Mesh(new THREE.CylinderGeometry(.09,.08,.18,14),new THREE.MeshStandardMaterial({color:0xe7e9ea,roughness:.62}));mug.position.set(o.x+.72,1.16,o.z-.20);mug.castShadow=true;this.world.add(mug);
    const chairMat=new THREE.MeshStandardMaterial({color:0x20272d,roughness:.48,metalness:.07});const seat=new THREE.Mesh(new THREE.BoxGeometry(.58,.09,.58),chairMat);seat.position.set(o.x,.62,o.z+o.d*.76);seat.castShadow=true;this.world.add(seat);const back=new THREE.Mesh(new THREE.BoxGeometry(.58,.72,.085),chairMat);back.position.set(o.x,.96,o.z+o.d*.99);back.castShadow=true;this.world.add(back);
    const stem=new THREE.Mesh(new THREE.CylinderGeometry(.035,.045,.45,12),metal);stem.position.set(o.x,.35,o.z+o.d*.76);this.world.add(stem);for(let i=0;i<5;i++){const a=i/5*Math.PI*2;const arm=new THREE.Mesh(new THREE.BoxGeometry(.38,.035,.045),metal);arm.position.set(o.x+Math.cos(a)*.16,.14,o.z+o.d*.76+Math.sin(a)*.16);arm.rotation.y=-a;this.world.add(arm);}
  }
  decoratePlant(o){
    const pot=new THREE.Mesh(new THREE.CylinderGeometry(.34,.27,.55,18),new THREE.MeshStandardMaterial({color:0x34383d,roughness:.76}));pot.position.set(o.x,.28,o.z);pot.castShadow=true;this.world.add(pot);
    const leafMat=new THREE.MeshStandardMaterial({color:0x3d8151,roughness:.82});for(let i=0;i<9;i++){const leaf=new THREE.Mesh(new THREE.SphereGeometry(.28,12,10),leafMat);leaf.scale.set(.55,1.75,.42);const a=i/9*Math.PI*2;leaf.position.set(o.x+Math.cos(a)*.24,.82+(i%3)*.18,o.z+Math.sin(a)*.24);leaf.rotation.z=(i%2?-.28:.28);leaf.castShadow=true;this.world.add(leaf);}
  }
  decorateTurnstile(o){
    const steel=new THREE.MeshStandardMaterial({color:0x77838d,roughness:.28,metalness:.8});const dark=new THREE.MeshStandardMaterial({color:0x1d252d,roughness:.45,metalness:.25});
    for(const sx of [-.38,.38]){const post=new THREE.Mesh(new THREE.CylinderGeometry(.10,.12,1.05,16),steel);post.position.set(o.x+sx,.53,o.z);post.castShadow=true;this.world.add(post);}const hub=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,.35,16),dark);hub.rotation.z=Math.PI/2;hub.position.set(o.x,.78,o.z);this.world.add(hub);for(let i=0;i<3;i++){const bar=new THREE.Mesh(new THREE.BoxGeometry(.9,.045,.045),steel);bar.position.set(o.x,.78,o.z);bar.rotation.z=i*Math.PI*2/3;this.world.add(bar);}
  }
  decorateMachine(o){
    const white=new THREE.MeshStandardMaterial({color:0xe5e8ea,roughness:.38,metalness:.08});const dark=new THREE.MeshStandardMaterial({color:0x27313a,roughness:.42,metalness:.18});const b=new THREE.Mesh(new THREE.BoxGeometry(o.w*.9,o.h*.82,o.d*.9),white);b.position.set(o.x,o.h*.42,o.z);b.castShadow=true;this.world.add(b);const top=new THREE.Mesh(new THREE.BoxGeometry(o.w*.72,.12,o.d*.65),dark);top.position.set(o.x,o.h*.88,o.z-.05);top.rotation.x=-.12;this.world.add(top);const panel=new THREE.Mesh(new THREE.BoxGeometry(.45,.025,.22),new THREE.MeshStandardMaterial({color:0x102536,emissive:0x2b9fd0,emissiveIntensity:1.1}));panel.position.set(o.x,o.h*.93,o.z-o.d*.22);panel.rotation.x=-.12;this.world.add(panel);
  }
  decorateCounter(o){
    const body=new THREE.Mesh(new THREE.BoxGeometry(o.w,o.h*.82,o.d),new THREE.MeshStandardMaterial({color:0x707a82,roughness:.62}));body.position.set(o.x,o.h*.41,o.z);body.castShadow=true;this.world.add(body);const top=new THREE.Mesh(new THREE.BoxGeometry(o.w+.12,.10,o.d+.12),new THREE.MeshStandardMaterial({color:0x30383e,roughness:.32,metalness:.22}));top.position.set(o.x,o.h*.86,o.z);top.castShadow=true;this.world.add(top);
  }
  addRoom(room){
    if(!room.safe)return; const geo=new THREE.PlaneGeometry(room.w,room.d);const mat=new THREE.MeshBasicMaterial({color:0x4bffb1,transparent:true,opacity:.035,side:THREE.DoubleSide});const m=new THREE.Mesh(geo,mat);m.rotation.x=-Math.PI/2;m.position.set(room.x,.015,room.z);this.world.add(m);
  }
  makePlayer(){
    const p=makePerson(0x5ed4ff,true);p.position.set(this.level.start[0],0,this.level.start[1]);this.world.add(p);this.player=p;
    const ring=new THREE.Mesh(new THREE.RingGeometry(.46,.52,24),new THREE.MeshBasicMaterial({color:this.level.theme.accent,side:THREE.DoubleSide,transparent:true,opacity:.75}));ring.rotation.x=-Math.PI/2;ring.position.y=.015;p.add(ring);
  }
  makeExit(){
    const [x,z]=this.level.exit;const g=new THREE.Group();
    const steel=new THREE.MeshStandardMaterial({color:0x3f474d,roughness:.34,metalness:.62});
    const jambL=new THREE.Mesh(new THREE.BoxGeometry(.12,2.7,.20),steel);jambL.position.set(-1.05,1.35,0);g.add(jambL);const jambR=jambL.clone();jambR.position.x=1.05;g.add(jambR);const lintel=new THREE.Mesh(new THREE.BoxGeometry(2.22,.12,.20),steel);lintel.position.set(0,2.64,0);g.add(lintel);
    const inner=new THREE.Mesh(new THREE.BoxGeometry(1.92,2.48,.075),new THREE.MeshPhysicalMaterial({color:0x23343d,roughness:.15,metalness:.05,transparent:true,opacity:.48,transmission:.24,thickness:.05}));inner.position.set(0,1.25,.03);g.add(inner);
    const c=document.createElement('canvas');c.width=256;c.height=72;const q=c.getContext('2d');q.fillStyle='#2c8b56';q.fillRect(0,0,256,72);q.fillStyle='#f5fff8';q.font='800 32px sans-serif';q.textAlign='center';q.fillText('VÝCHOD',128,47);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false}));s.position.set(0,2.95,.08);s.scale.set(1.55,.44,1);g.add(s);
    const beacon=new THREE.PointLight(this.level.theme.accent,5.5,6);beacon.position.set(0,2.2,1);g.add(beacon);g.position.set(x,0,z);this.world.add(g);this.exitMesh=g;
  }
  makeCheckpoints(){
    for(const c of (this.level.checkpoints||[])){const m=new THREE.Mesh(new THREE.RingGeometry(.75,.9,28),new THREE.MeshBasicMaterial({color:0x6bcaff,transparent:true,opacity:.38,side:THREE.DoubleSide}));m.rotation.x=-Math.PI/2;m.position.set(c.x,.02,c.z);m.userData.cp=c;this.world.add(m);this.checkpointMeshes.push(m);}
  }
  interactionVisual(cfg){
    const g=new THREE.Group();let color=0x6bcaff;
    if(cfg.type.startsWith('pickup'))color=0xd9ff5b;if(cfg.type==='workspot')color=0x79f0df;if(cfg.type==='badge-door')color=0xffd36e;
    const M={
      steel:new THREE.MeshStandardMaterial({color:0x5a646c,roughness:.28,metalness:.72}),
      dark:new THREE.MeshStandardMaterial({color:0x20272d,roughness:.38,metalness:.18}),
      black:new THREE.MeshStandardMaterial({color:0x11161a,roughness:.28,metalness:.22}),
      white:new THREE.MeshStandardMaterial({color:0xe8ebec,roughness:.48,metalness:.05}),
      glass:new THREE.MeshPhysicalMaterial({color:0x233844,roughness:.08,metalness:.05,transparent:true,opacity:.68,transmission:.22,thickness:.04}),
      paper:new THREE.MeshStandardMaterial({color:0xf5f4ee,roughness:.92}),
      blue:new THREE.MeshStandardMaterial({color:0x183a52,emissive:0x236d9d,emissiveIntensity:.72,roughness:.18}),
      red:new THREE.MeshStandardMaterial({color:0xb93a3f,roughness:.48}),
      brown:new THREE.MeshStandardMaterial({color:0x80512f,roughness:.72}),
      green:new THREE.MeshStandardMaterial({color:0x4a7f4b,roughness:.72})
    };
    const box=(w,h,d,mat,x=0,y=h/2,z=0)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;};
    const cyl=(rt,rb,h,mat,x=0,y=h/2,z=0,segments=18)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,segments),mat);m.position.set(x,y,z);m.castShadow=true;g.add(m);return m;};
    const screen=(w,h,x,y,z,rotX=0)=>{const m=box(w,.018,h,M.blue,x,y,z);m.rotation.x=rotX;return m;};
    const paper=(w,d,x,y,z,ry=0)=>{const m=box(w,.018,d,M.paper,x,y,z);m.rotation.y=ry;return m;};

    if(cfg.type==='coffee'){
      // Counter-top automatic espresso machine: hopper, screen, twin spout, drip tray and mug.
      box(.76,.76,.58,M.black,0,.45,0);box(.66,.12,.52,M.steel,0,.86,0);
      const hopper=cyl(.16,.19,.28,new THREE.MeshPhysicalMaterial({color:0x50311d,roughness:.25,transparent:true,opacity:.82,transmission:.12}),-.20,1.08,-.03,20);
      screen(.25,.12,.12,.67,.296,-.12);
      box(.32,.08,.10,M.dark,0,.50,.31);cyl(.035,.035,.18,M.steel,-.08,.40,.36,12);cyl(.035,.035,.18,M.steel,.08,.40,.36,12);
      box(.52,.045,.30,M.steel,0,.15,.33);for(let i=-2;i<=2;i++)box(.018,.012,.24,M.dark,i*.08,.18,.34);
      const cup=cyl(.13,.11,.22,new THREE.MeshStandardMaterial({color:0xf1f0ea,roughness:.72}),0,.27,.42,20);const handle=new THREE.Mesh(new THREE.TorusGeometry(.08,.018,8,16,Math.PI*1.55),M.white);handle.rotation.y=Math.PI/2;handle.position.set(.13,.29,.43);g.add(handle);
    }
    else if(cfg.type==='microwave'){
      box(.90,.52,.62,M.steel,0,.36,0);box(.64,.37,.025,M.black,-.09,.37,.322);box(.58,.30,.016,M.glass,-.09,.37,.338);
      box(.13,.37,.028,M.dark,.35,.37,.323);screen(.085,.055,.35,.48,.341);for(let r=0;r<3;r++)for(let c=0;c<3;c++)cyl(.012,.012,.008,M.white,.32+c*.035,.39-r*.045,.343,8);
      box(.05,.39,.035,M.black,.245,.37,.342);
    }
    else if(cfg.type==='copier'){
      // Floor standing multifunction copier with drawers, scanner, ADF, output bay, screen and paper.
      box(.92,.68,.72,M.white,0,.36,0);box(.84,.11,.65,M.dark,0,.75,-.01);
      box(.76,.10,.58,M.white,0,.86,-.03);box(.68,.08,.50,M.dark,-.02,.94,-.08);box(.46,.10,.26,M.dark,.05,.67,.36);
      box(.52,.035,.33,new THREE.MeshStandardMaterial({color:0x303940,roughness:.26,metalness:.30}),.02,.64,.38);
      screen(.25,.15,.46,.80,.26,-.28);
      for(let i=0;i<3;i++){box(.76,.035,.035,M.steel,0,.18+i*.16,.365);box(.67,.012,.018,M.dark,0,.18+i*.16,.386);}
      paper(.42,.31,.03,1.01,-.07,.03);paper(.40,.29,.04,1.025,-.06,-.03);
    }
    else if(cfg.type==='printerjam'){
      // Laser printer with clearly visible jammed sheet.
      box(.82,.48,.68,M.white,0,.34,0);box(.68,.16,.47,M.dark,0,.65,-.04);box(.52,.08,.28,M.black,0,.52,.355);screen(.16,.08,.25,.62,.285,-.20);
      const sheet=paper(.44,.58,0,.78,.13);sheet.rotation.x=-.55;sheet.rotation.z=.05;
      box(.62,.055,.35,M.steel,0,.12,.26);
    }
    else if(cfg.type==='projector'){
      box(.72,.22,.50,M.white,0,.32,0);const lens=cyl(.105,.105,.15,M.black,0,.33,.31,24);lens.rotation.x=Math.PI/2;
      cyl(.072,.072,.08,new THREE.MeshStandardMaterial({color:0x8ac8ee,emissive:0x6bcaff,emissiveIntensity:2.0,roughness:.1}),0,.33,.37,20);
      for(let i=-2;i<=2;i++)box(.045,.012,.24,M.dark,i*.085,.445,-.03);
    }
    else if(cfg.type==='pickup-folder'){
      const b=box(.60,.07,.78,M.brown,0,.14,0);b.rotation.y=.18;box(.24,.025,.10,new THREE.MeshStandardMaterial({color:0xd2aa55,roughness:.65}),-.13,.185,.24);
      paper(.49,.66,.02,.19,-.01,-.02);
    }
    else if(cfg.type==='pickup-badge'){
      box(.36,.035,.54,M.white,0,.17,0);box(.29,.012,.20,M.blue,0,.194,-.11);box(.10,.018,.09,new THREE.MeshStandardMaterial({color:0xd8b35a,metalness:.72,roughness:.23}),.08,.20,.13);
      const clip=box(.07,.08,.025,M.steel,0,.25,-.25);clip.rotation.x=.2;
    }
    else if(cfg.type==='pickup-headset'){
      const band=new THREE.Mesh(new THREE.TorusGeometry(.29,.035,10,28,Math.PI),M.black);band.rotation.z=Math.PI/2;band.position.y=.38;g.add(band);
      box(.10,.20,.13,M.dark,-.29,.33,0);box(.10,.20,.13,M.dark,.29,.33,0);const boom=cyl(.018,.018,.32,M.steel,.36,.27,.08,10);boom.rotation.z=-.9;cyl(.035,.035,.06,M.black,.48,.15,.08,10);
    }
    else if(cfg.type==='phone'){
      box(.52,.12,.62,M.dark,0,.14,0);screen(.24,.10,0,.235,-.12,-.15);
      for(let r=0;r<3;r++)for(let c=0;c<3;c++)cyl(.018,.018,.01,M.white,-.12+c*.12,.21-r*.065,.18,8);
      const handset=box(.12,.11,.64,M.black,-.31,.27,0);handset.rotation.z=.05;box(.17,.15,.17,M.black,-.31,.30,-.25);box(.17,.15,.17,M.black,-.31,.30,.25);
    }
    else if(cfg.type==='meeting'){
      // Laptop/calendar terminal.
      box(.64,.055,.46,M.dark,0,.13,.10);const lid=box(.64,.035,.42,M.black,0,.40,-.10);lid.rotation.x=-.80;screen(.54,.30,0,.42,.05,-.80);
      paper(.42,.26,.46,.11,.08,.18);
    }
    else if(cfg.type==='snacks'){
      box(.95,.74,.52,new THREE.MeshStandardMaterial({color:0x6e7478,roughness:.62}),0,.38,0);box(1.02,.07,.58,M.dark,0,.78,0);
      const bowl=cyl(.24,.17,.12,new THREE.MeshStandardMaterial({color:0xd5d7d5,roughness:.55}),-.20,.87,0,20);for(let i=0;i<7;i++){const a=i/7*Math.PI*2;cyl(.045,.04,.11,new THREE.MeshStandardMaterial({color:i%2?0xd69c45:0xb84d43,roughness:.7}),-.20+Math.cos(a)*.12,.97,Math.sin(a)*.08,10);}
      box(.28,.35,.18,new THREE.MeshStandardMaterial({color:0xe0c153,roughness:.72}),.28,.97,0);box(.20,.27,.14,new THREE.MeshStandardMaterial({color:0xc4513e,roughness:.72}),.42,.93,.04);
    }
    else if(cfg.type==='elevator'){
      // Call panel + small section of steel elevator doors.
      box(1.15,1.70,.10,M.steel,0,.85,-.12);box(.025,1.54,.04,M.dark,0,.85,-.055);box(.16,.46,.07,M.dark,.70,.86,0);cyl(.045,.045,.025,new THREE.MeshStandardMaterial({color:0xdce8ef,emissive:0x8ed7ff,emissiveIntensity:1.1}),.70,.96,.05,12);cyl(.045,.045,.025,M.white,.70,.78,.05,12);
    }
    else if(cfg.type==='badge-door'){
      // Access reader pedestal.
      box(.18,.96,.18,M.steel,0,.50,0);box(.30,.30,.10,M.dark,0,1.02,.02);screen(.20,.10,0,1.07,.08);cyl(.025,.025,.018,new THREE.MeshStandardMaterial({color:0x70ff92,emissive:0x34d45d,emissiveIntensity:1.3}),.08,.96,.08,12);
    }
    else if(cfg.type==='door'){
      // Door handle / access plate beside an actual door obstacle.
      box(.16,.72,.10,M.steel,0,.40,0);box(.24,.18,.07,M.dark,0,.68,.04);const h=box(.34,.045,.045,M.steel,.13,.46,.08);h.rotation.y=.05;
    }
    else if(cfg.type==='workspot'){
      // Workstation marker: laptop + glowing spreadsheet, not an abstract cylinder.
      box(.72,.055,.48,M.dark,0,.12,.06);const lid=box(.64,.035,.42,M.black,0,.41,-.09);lid.rotation.x=-.82;screen(.54,.29,0,.43,.055,-.82);paper(.34,.24,.47,.11,.05,.1);
    }
    else {
      const body=cyl(.18,.22,.42,new THREE.MeshStandardMaterial({color,roughness:.5,metalness:.12}),0,.25,0,16);body.position.y=.25;
    }
    // Only the halo animates. Real-world objects must not rotate like arcade pickups.
    const halo=new THREE.Mesh(new THREE.TorusGeometry(.46,.020,8,36),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.50,depthWrite:false}));halo.rotation.x=Math.PI/2;halo.position.y=.035;g.add(halo);g.userData.halo=halo;
    let baseY=0;
    if(!['copier','printerjam','badge-door','door','pickup-folder','pickup-badge','pickup-headset'].includes(cfg.type)){
      const support=(this.activeObstacles||[]).filter(o=>['stůl','kuchyňská linka','recepce'].includes(o.label)&&cfg.x>o.x-o.w/2&&cfg.x<o.x+o.w/2&&cfg.z>o.z-o.d/2&&cfg.z<o.z+o.d/2).sort((a,b)=>b.h-a.h)[0];
      if(support)baseY=support.h+.015;
    }
    g.position.set(cfg.x,baseY,cfg.z);g.userData.cfg=cfg;g.userData.used=false;g.userData.cooldown=0;this.world.add(g);this.interactive.push(g);return g;
  }
  startLevel(index){
    const level=LEVELS[index]; if(!level || level.id>SAVE.unlocked)return;
    AUDIO.ensure();this.clearWorld();this.level=level;this.levelIndex=index;this.elapsed=0;this.penalty=0;this.catches=0;this.diversions=0;this.distractedCount=0;this.finished=false;this.paused=false;this.raceFailed=false;this.usedTypes=new Set();this.uniqueDiversions=new Set();this.checkpointIndex=-1;this.navVersion++;this.safeUntil=.55;this.lastGateHint=-99;this.inventory={badge:false,folder:false,headset:false};this.working=false;this.stealth=false;this.sprinting=false;this.tactical=false;this.mobileSprint=false;this.keys={};this.joy.x=this.joy.y=0;this.dragging=false;this.closest=null;
    this.scene.background=new THREE.Color(level.theme.bg);this.scene.fog=new THREE.Fog(level.theme.fog,34,82);this.makeFloor(level);this.activeObstacles=level.obstacles.map(o=>({...o}));for(const o of this.activeObstacles)this.addObstacle(o);for(const r of level.rooms||[])this.addRoom(r);this.makePlayer();this.makeExit();this.makeCheckpoints();for(const c of level.interactions||[])this.interactionVisual(c);this.npcs=(level.npcs||[]).map(c=>new NPC(this,c));
    this.cameraYaw=.2;this.cameraPitch=.47;this.showScreen(null);$('#hud').classList.remove('hidden'); if(isTouch)$('#mobile-controls').classList.remove('hidden');else $('#mobile-controls').classList.add('hidden');
    $('#hud-level').textContent=`LEVEL ${level.id} — ${level.name.toUpperCase()}`;$('#hud-objective').textContent=level.objective;this.showTutorial(`L${level.id}`,level.hint,6);
    this.running=true;this.clock.getDelta();this.updateHUD();
  }
  showScreen(name){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));if(name)$(`#screen-${name}`)?.classList.add('active');}
  pause(){if(!this.running||this.finished)return;this.paused=true;this.showScreen('pause');}
  resume(){if(!this.running||this.finished)return;this.paused=false;this.showScreen(null);this.clock.getDelta();}
  quit(){this.running=false;this.paused=false;this.finished=false;$('#hud').classList.add('hidden');$('#mobile-controls').classList.add('hidden');this.showScreen('main');}
  npcGateOpen(n){
    if(!n?.cfg?.hardBlock)return true;
    if(n.cfg.passItem && this.inventory[n.cfg.passItem])return true;
    if(n.state==='investigate' && this.elapsed<n.investigateUntil){
      const moved=Math.hypot(n.group.position.x-n.cfg.x,n.group.position.z-n.cfg.z);
      return moved>(n.cfg.gateRadius||.85)+.35;
    }
    return false;
  }
  hardGateAt(x,z,r=this.playerRadius){
    for(const n of this.npcs||[]){if(!n.cfg?.hardBlock||this.npcGateOpen(n))continue;const rr=(n.cfg.gateRadius||.85)+r;if(Math.hypot(x-n.group.position.x,z-n.group.position.z)<rr)return n;}return null;
  }
  staticCollisionAtRadius(x,z,r=.30){
    for(const o of this.activeObstacles){if(x+r>o.x-o.w/2&&x-r<o.x+o.w/2&&z+r>o.z-o.d/2&&z-r<o.z+o.d/2)return true;}
    return false;
  }
  collisionAtRadius(x,z,r=this.playerRadius){
    if(this.staticCollisionAtRadius(x,z,r))return true;
    if(this.hardGateAt(x,z,r))return true;
    return false;
  }
  collisionAt(x,z){return this.collisionAtRadius(x,z,this.playerRadius);}
  segmentClearStatic(a,b,radius=.30){
    const dist=a.distanceTo(b),steps=Math.max(1,Math.ceil(dist/.22));
    for(let k=1;k<=steps;k++){const t=k/steps,x=lerp(a.x,b.x,t),z=lerp(a.z,b.z,t);if(this.staticCollisionAtRadius(x,z,radius))return false;}
    return true;
  }
  smoothNavPoints(start,points,radius=.30){
    if(!points.length)return [];
    const src=[start.clone(),...points],out=[];let anchor=0;
    while(anchor<src.length-1){let far=anchor+1;for(let j=src.length-1;j>anchor+1;j--){if(this.segmentClearStatic(src[anchor],src[j],radius)){far=j;break;}}out.push(src[far]);anchor=far;}
    return out;
  }
  findPath(start,target,radius=.30,options={}){
    if(!this.level)return null;
    const stopRadius=Math.max(.16,options.stopRadius??.20);
    const step=.50,[w,d]=this.level.size,margin=radius+.14;
    const minX=-w/2+margin,maxX=w/2-margin,minZ=-d/2+margin,maxZ=d/2-margin;
    const nx=Math.floor((maxX-minX)/step)+1,nz=Math.floor((maxZ-minZ)/step)+1;
    const center=(i,j)=>new THREE.Vector3(minX+i*step,0,minZ+j*step);
    const cell=(v)=>[clamp(Math.round((v.x-minX)/step),0,nx-1),clamp(Math.round((v.z-minZ)/step),0,nz-1)];
    // Navigation only sees actual map geometry. Social blockers are gameplay rules, not nav walls.
    const blocked=(i,j)=>{const p=center(i,j);return this.staticCollisionAtRadius(p.x,p.z,radius);};
    const nearestFree=(v,maxRing=6)=>{
      const [ci,cj]=cell(v);if(!blocked(ci,cj))return [ci,cj];let best=null,bestD=Infinity;
      for(let ring=1;ring<=maxRing;ring++)for(let di=-ring;di<=ring;di++)for(let dj=-ring;dj<=ring;dj++){
        if(Math.max(Math.abs(di),Math.abs(dj))!==ring)continue;const i=ci+di,j=cj+dj;if(i<0||j<0||i>=nx||j>=nz||blocked(i,j))continue;const p=center(i,j),dd=p.distanceToSquared(v);if(dd<bestD){bestD=dd;best=[i,j];}
      }
      return best;
    };
    const startCell=nearestFree(start,6);if(!startCell)return null;
    const key=(i,j)=>i+','+j,startKey=key(...startCell),open=[startCell],openSet=new Set([startKey]),came=new Map(),gScore=new Map([[startKey,0]]),closed=new Set();
    const heuristic=(i,j)=>Math.max(0,center(i,j).distanceTo(target)-stopRadius)/step;
    const dirs=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.414],[-1,1,1.414],[1,-1,1.414],[-1,-1,1.414]];
    let foundKey=null,bestKey=startKey,bestDist=center(...startCell).distanceTo(target),guard=0;
    while(open.length && guard++<18000){
      let bi=0,bf=Infinity;for(let q=0;q<open.length;q++){const [i,j]=open[q],k=key(i,j),f=(gScore.get(k)??Infinity)+heuristic(i,j);if(f<bf){bf=f;bi=q;}}
      const [i,j]=open.splice(bi,1)[0],ck=key(i,j);openSet.delete(ck);if(closed.has(ck))continue;closed.add(ck);
      const here=center(i,j),toTarget=here.distanceTo(target);if(toTarget<bestDist){bestDist=toTarget;bestKey=ck;}
      if(toTarget<=stopRadius && this.segmentClearStatic(here,target,Math.min(radius,.22))){foundKey=ck;break;}
      for(const [di,dj,cost] of dirs){const a=i+di,b=j+dj;if(a<0||b<0||a>=nx||b>=nz||blocked(a,b))continue;if(di&&dj&&(blocked(i+di,j)||blocked(i,j+dj)))continue;const nk=key(a,b);if(closed.has(nk))continue;const ng=(gScore.get(ck)??Infinity)+cost;if(ng>=(gScore.get(nk)??Infinity))continue;came.set(nk,ck);gScore.set(nk,ng);if(!openSet.has(nk)){open.push([a,b]);openSet.add(nk);}}
    }
    // If the exact interaction point is geometrically unreachable, use the closest cell in the same reachable component.
    const endKey=foundKey||bestKey;if(!endKey)return null;
    const cells=[];let k=endKey;while(k){const [i,j]=k.split(',').map(Number);cells.push([i,j]);if(k===startKey)break;k=came.get(k);}cells.reverse();
    if(!cells.length||key(...cells[0])!==startKey)return null;
    let points=cells.slice(1).map(([i,j])=>center(i,j));
    const endCell=cells[cells.length-1],goal=center(...endCell);
    // Add the actual target only if an NPC can stand there safely; otherwise stop next to it.
    if(!this.staticCollisionAtRadius(target.x,target.z,radius) && goal.distanceTo(target)<=stopRadius && this.segmentClearStatic(goal,target,radius*.85)){points.push(target.clone());}
    points=this.smoothNavPoints(start,points,radius);
    const finalGoal=points.length?points[points.length-1]:goal;
    return {points,goal:finalGoal,reachedTarget:!!foundKey,distanceToTarget:finalGoal.distanceTo(target)};
  }
  movePlayer(dt){
    let x=0,z=0;
    if(this.keys.KeyW||this.keys.ArrowUp)z-=1;if(this.keys.KeyS||this.keys.ArrowDown)z+=1;if(this.keys.KeyA||this.keys.ArrowLeft)x-=1;if(this.keys.KeyD||this.keys.ArrowRight)x+=1;
    x+=this.joy.x;z+=this.joy.y;
    const len=Math.hypot(x,z); if(len>.01){x/=Math.max(1,len);z/=Math.max(1,len);}
    this.sprinting=(this.keys.ShiftLeft||this.keys.ShiftRight||this.mobileSprint)&&len>.05&&!this.stealth;
    if(len>.05)this.working=false;
    const speed=this.stealth?2.0:this.sprinting?5.0:3.25;
    const fwd=new THREE.Vector3(-Math.sin(this.cameraYaw),0,-Math.cos(this.cameraYaw)); const right=new THREE.Vector3(Math.cos(this.cameraYaw),0,-Math.sin(this.cameraYaw));
    const dir=new THREE.Vector3().addScaledVector(right,x).addScaledVector(fwd,-z); if(dir.lengthSq()>1)dir.normalize();
    if(dir.lengthSq()>.001){
      const old=this.player.position.clone(); const nx=old.x+dir.x*speed*dt,nz=old.z+dir.z*speed*dt;
      const bx=this.hardGateAt(nx,old.z),bz=this.hardGateAt(this.player.position.x,nz);const blockX=this.collisionAt(nx,old.z),blockZ=this.collisionAt(this.player.position.x,nz);if(!blockX)this.player.position.x=nx;if(!blockZ)this.player.position.z=nz;
      const gate=bx||bz;if(gate&&this.elapsed>(this.lastGateHint||0)+2.4){this.lastGateHint=this.elapsed;this.toast(gate.cfg.gateHint||'Tudy teď neprojdeš. Najdi způsob, jak člověka odlákat.',2.2);}
      const targetYaw=Math.atan2(dir.x,dir.z);let delta=((targetYaw-this.player.rotation.y+Math.PI)%(Math.PI*2))-Math.PI;this.player.rotation.y+=delta*Math.min(1,dt*10);
      const swing=Math.sin(this.elapsed*(this.sprinting?11:8))* (this.stealth?.18:.42);if(this.player.userData.leftLeg){this.player.userData.leftLeg.rotation.x=swing;this.player.userData.rightLeg.rotation.x=-swing;this.player.userData.leftArm.rotation.x=-swing*.7;this.player.userData.rightArm.rotation.x=swing*.7;}
      if(this.sprinting && this.elapsed-this.lastNoise>.65){this.emitNoise(this.player.position,7.5);this.lastNoise=this.elapsed;}
    }
    this.player.scale.y=this.stealth?.83:1;
  }
  emitNoise(pos,radius){for(const n of this.npcs){if(n.role==='rival')continue;if(n.group.position.distanceTo(pos)<radius&&!n.canSeePlayer())n.distract(pos,4.5,.55);}}
  socialModifierFor(npc){
    let m=1;
    if(this.working)m*=.08;
    if(this.inventory.folder && ['coworker','pm','hr','chatter'].includes(npc.role))m*=.55;
    if(this.inventory.headset && npc.role==='reception')m*=.38;
    if(this.stealth)m*=.78;
    return m;
  }
  isPlayerSafe(){
    for(const r of this.level.rooms||[]){if(!r.safe)continue;if(Math.abs(this.player.position.x-r.x)<r.w/2-.3&&Math.abs(this.player.position.z-r.z)<r.d/2-.3)return true;}
    return false;
  }
  nearestInteraction(){
    let best=null,bestD=2.05;
    for(const m of this.interactive){if(!m.visible)continue;const d=m.position.distanceTo(this.player.position);if(d<bestD){best=m;bestD=d;}}
    return best;
  }
  doInteraction(obj=this.closest){
    if(!obj||obj.userData.cooldown>this.elapsed)return;const c=obj.userData.cfg;AUDIO.interact();
    if(c.requires && !this.inventory[c.requires]){this.toast(`Potřebuješ: ${c.requires==='badge'?'přístupovou kartu':c.requires}`);return;}
    if(obj.userData.used && !['elevator','phone'].includes(c.type) && !c.type.startsWith('pickup') && c.type!=='workspot' && c.type!=='door' && c.type!=='badge-door'){this.toast('Tohle už jsi použil.');return;}
    this.usedTypes.add(c.type);
    switch(c.type){
      case 'pickup-folder':this.inventory.folder=true;obj.visible=false;this.toast('Desky: ukecaný kolega tě teď považuje za člověka spěchajícího na meeting.');this.showTutorial('folder','DESKY: některé sociální blokády tě pustí bez zdržení.',5);break;
      case 'pickup-headset':this.inventory.headset=true;obj.visible=false;this.toast('Headset: u recepce působíš zaměstnaně.');break;
      case 'pickup-badge':this.inventory.badge=true;obj.visible=false;this.toast('Badge získán. Teď můžeš fyzicky odemknout turniket.');break;
      case 'workspot':this.working=!this.working;this.toast(this.working?'Předstíráš práci. Hlavně nehýbat se.':'Přestáváš předstírat práci.');break;
      case 'badge-door':obj.visible=false;this.toast('Turniket odemčen.');if(c.opens)this.removeObstacleById(c.opens);else this.removeNearestTurnstile(obj.position);break;
      default:this.triggerDiversion(obj,c);break;
    }
    this.updateHUD();
  }
  removeObstacleMesh(best){
    if(!best)return false;const o=best.userData.obstacle;const i=this.activeObstacles.indexOf(o);if(i>=0)this.activeObstacles.splice(i,1);this.world.remove(best);this.obstacleMeshes=this.obstacleMeshes.filter(x=>x!==best);this.disposeObject(best);this.navVersion++;return true;
  }
  removeObstacleById(id){
    const best=this.obstacleMeshes.find(m=>m.userData.obstacle?.id===id);return this.removeObstacleMesh(best);
  }
  removeNearestTurnstile(pos){
    let best=null,dist=4;for(const m of this.obstacleMeshes){const o=m.userData.obstacle;if(!o?.label?.includes('turniket'))continue;const d=m.position.distanceTo(pos);if(d<dist){dist=d;best=m;}}return this.removeObstacleMesh(best);
  }
  removeNearestWall(pos){
    let best=null,dist=10;for(const m of this.obstacleMeshes){const o=m.userData.obstacle;if(o?.label!=='stěna'&&o?.label!=='dveře')continue;const dx=Math.max(Math.abs(pos.x-o.x)-o.w/2,0),dz=Math.max(Math.abs(pos.z-o.z)-o.d/2,0),d=Math.hypot(dx,dz);if(d<dist){dist=d;best=m;}}return this.removeObstacleMesh(best);
  }
  triggerDiversion(obj,c){
    if(c.type==='door'){
      obj.visible=false;
      const opened=c.opens?this.removeObstacleById(c.opens):this.removeNearestWall(obj.position);
      this.toast(opened?'Dveře otevřeny.':'Dveře už jsou otevřené.');
      return;
    }
    obj.userData.used=true;obj.userData.cooldown=this.elapsed+8;this.diversions++;this.uniqueDiversions.add(c.type);
    const radius=c.radius||10,duration=c.duration||10;let count=0;
    for(const n of this.npcs){if(n.role==='rival')continue;if(c.targetIds&&!c.targetIds.includes(n.cfg.id))continue;if(c.role&&n.role!==c.role)continue;const targeted=Array.isArray(c.targetIds)&&c.targetIds.includes(n.cfg.id);if(targeted||n.group.position.distanceTo(obj.position)<=radius){n.distract(obj.position,duration,c.approachRadius||1.05);count++;}}
    this.distractedCount+=count;
    const names={coffee:'Kávovar se hlasitě čistí.',microwave:'Mikrovlnka: PÍP. PÍP. PÍP.',copier:'Kopírka právě dostala existenční krizi.',phone:'Telefon zvoní. Někdo to bude muset řešit.',snacks:'„Občerstvení v kuchyňce!“',projector:'Projektor svítí. PM nemůže odolat.',meeting:'Nový meeting vytvořen. Korporát se přesouvá.',elevator:'Výtah přijíždí s důstojným cinknutím.',printerjam:'Tiskárna je zaseknutá. IT jde do akce.',door:'Dveře otevřeny.'};
    const targeted=Array.isArray(c.targetIds)&&c.targetIds.length;this.toast(targeted?`${names[c.type]||c.label} Blokující kolega opouští průchod — máš pár sekund.`:`${names[c.type]||c.label} Vyrušeno NPC: ${count}`);
    if(c.type==='copier'||c.type==='printerjam')AUDIO.printer();else if(c.type==='phone'||c.type==='microwave'||c.type==='elevator')AUDIO.notification();else AUDIO.tone(420,.09,'square',.05);
  }
  quickGadget(){
    const usable=this.interactive.filter(m=>m.visible&&['coffee','microwave','copier','phone','snacks','projector','meeting','elevator','printerjam'].includes(m.userData.cfg.type));
    usable.sort((a,b)=>a.position.distanceTo(this.player.position)-b.position.distanceTo(this.player.position));if(usable[0]&&usable[0].position.distanceTo(this.player.position)<3.4)this.doInteraction(usable[0]);else this.toast('Žádný gadget v dosahu.');
  }
  catchPlayer(npc){
    if(this.finished)return;this.catches++;this.penalty+=8;AUDIO.caught();const lines={boss:'Šéf: „Máš minutku?“',chatter:'„Když už tě tu vidím…“',pm:'PM: „Rychlý sync?“',hr:'HR: „Můžeme si krátce promluvit?“',reception:'Recepce: „Moment prosím.“',it:'IT: „Ty jsi něco dělal s tiskárnou?“',coworker:'Kolega tě zdržel small talkem.'};this.toast(`${lines[npc.role]||'Chycen!'} +8 s` ,3.2);
    const spawn=this.checkpointIndex>=0?this.level.checkpoints[this.checkpointIndex]:{x:this.level.start[0],z:this.level.start[1]};this.player.position.set(spawn.x,0,spawn.z);this.working=false;this.safeUntil=this.elapsed+1.25;for(const n of this.npcs){n.suspicion=0;n.state='patrol';n.investigateTarget=null;n.navPath=[];n.navTarget=null;}
  }
  rivalFinished(){if(!this.level?.lunchRace||this.finished)return;this.raceFailed=true;this.finished=true;this.paused=true;$('#fail-title').textContent='Poslední smažák je pryč.';$('#fail-text').textContent='Tvůj kolega byl rychlejší. To se nesmí opakovat.';this.showScreen('fail');}
  timeExpired(){if(this.finished)return;this.finished=true;this.paused=true;AUDIO.caught();$('#fail-title').textContent='17:00. Příliš pozdě.';$('#fail-text').textContent='Šéf právě našel dobrovolníka na „jeden rychlý task“. Restartuj finální únik.';this.showScreen('fail');}
  checkObjectives(){
    for(let i=0;i<(this.level.checkpoints||[]).length;i++){if(i<=this.checkpointIndex)continue;const c=this.level.checkpoints[i];if(Math.hypot(this.player.position.x-c.x,this.player.position.z-c.z)<c.r){this.checkpointIndex=i;this.checkpointMeshes[i].material.color.set(0xd9ff5b);this.toast('Checkpoint. Tady se případně vrátíš.',2.0);AUDIO.tone(620,.1,'sine',.05);break;}}
    if(Math.hypot(this.player.position.x-this.level.exit[0],this.player.position.z-this.level.exit[1])<1.7)this.finish();
  }
  finish(){
    if(this.finished)return;this.finished=true;this.paused=true;AUDIO.success();const total=this.elapsed+this.penalty;let stars=1;if(total<=this.level.timePar*1.45&&this.catches<=2)stars=2;if(total<=this.level.timePar&&this.catches===0)stars=3;
    const id=this.level.id;const old=SAVE.best[id];if(!old||total<old)SAVE.best[id]=total;SAVE.stars[id]=Math.max(stars,SAVE.stars[id]||0);SAVE.unlocked=Math.max(SAVE.unlocked,Math.min(LEVELS.length,id+1));persist();this.renderLevelCards();
    $('#result-title').textContent=this.catches===0?'Zmizel jsi beze stopy.':this.catches===1?'Jednou tě přibrzdili. Ale jsi venku.':'Bylo to těsné. Svoboda je svoboda.';$('#stars').textContent='★'.repeat(stars)+'☆'.repeat(3-stars);$('#result-time').textContent=fmtTime(total);$('#result-catches').textContent=this.catches;$('#result-diversions').textContent=this.diversions;$('#result-distracted').textContent=this.distractedCount;$('#result-style').textContent=this.catches===0?'GHOST':'KORPORÁTNÍ SURVIVOR';$('#result-best').textContent=fmtTime(SAVE.best[id]);$('#result-next').style.display=id<LEVELS.length?'block':'none';this.showScreen('result');
  }
  updateCamera(dt){
    // Fixed high-angle tactical view. The angle never changes; only the camera center follows the player.
    const target=this.player.position.clone().add(new THREE.Vector3(0,.65,0));
    const cp=Math.cos(this.cameraPitch),sp=Math.sin(this.cameraPitch);
    const dir=new THREE.Vector3(Math.sin(this.cameraYaw)*cp,sp,Math.cos(this.cameraYaw)*cp);
    const desired=target.clone().addScaledVector(dir,this.camDistance);
    this.camera.position.lerp(desired,1-Math.pow(.00008,dt));
    this.camera.lookAt(target);
  }
  updateHUD(){
    if(!this.level)return;$('#hud-time').textContent=this.level.timeLimit?`17:00 za ${fmtTime(Math.max(0,this.level.timeLimit-this.elapsed-this.penalty))}`:fmtTime(this.elapsed+this.penalty);$('#hud-diversions').textContent=`Diverze ${this.diversions}`;$('#hud-catches').textContent=`Chycení ${this.catches}`;
    const maxSus=this.npcs.reduce((m,n)=>Math.max(m,n.suspicion),0);const fill=$('#suspicion-fill');fill.style.width=`${Math.min(100,maxSus*100)}%`;fill.style.background=maxSus>.65?'#ff5d68':maxSus>.3?'#ffd25e':'#d9ff5b';$('#suspicion-label').textContent=maxSus>.68?'POPLACH':maxSus>.3?'POZOR':'KLID';$('#stance-label').textContent=this.working?'PŘEDSTÍRÁŠ PRÁCI':this.sprinting?'SPRINT':this.stealth?'STEALTH':this.tactical?'TAKTIKA':'BĚŽNĚ';
    const inv=[];if(this.inventory.badge)inv.push('BADGE');if(this.inventory.folder)inv.push('DESKY');if(this.inventory.headset)inv.push('HEADSET');$('#inventory').innerHTML=inv.map(x=>`<span class="inv-chip">${x}</span>`).join('');
  }
  toast(text,time=2.3){const t=$('#toast');t.textContent=text;t.classList.remove('hidden');this.toastTimer=time;}
  showTutorial(key,text,time=5){if(SAVE.tutorials[key])return;SAVE.tutorials[key]=true;persist();const el=$('#tutorial');el.textContent=text;el.classList.remove('hidden');this.tutorialTimer=time;}
  updateUI(dt){
    if(this.toastTimer>0){this.toastTimer-=dt;if(this.toastTimer<=0)$('#toast').classList.add('hidden');}if(this.tutorialTimer>0){this.tutorialTimer-=dt;if(this.tutorialTimer<=0)$('#tutorial').classList.add('hidden');}
    const prev=this.closest;this.closest=this.nearestInteraction();if(prev&&prev!==this.closest)prev.scale.setScalar(1);const inter=$('#interaction');if(this.closest){inter.textContent=`E — ${this.closest.userData.cfg.label}`;inter.classList.remove('hidden');this.closest.scale.setScalar(1+Math.sin(this.elapsed*5)*.05);}else inter.classList.add('hidden');
  }
  update(dt){
    if(!this.running||this.paused||this.finished)return;dt=Math.min(dt,.05);this.elapsed+=dt;if(this.level?.timeLimit && this.elapsed+this.penalty>=this.level.timeLimit){this.timeExpired();return;}this.movePlayer(dt);for(const n of this.npcs)n.update(dt);for(const o of this.interactive){if(o.userData.halo)o.userData.halo.rotation.z+=dt*.55;}this.checkObjectives();this.updateCamera(dt);this.updateUI(dt);this.updateHUD();
  }
  loop(){const dt=this.clock.getDelta();this.update(dt);this.renderer.render(this.scene,this.camera);requestAnimationFrame(()=>this.loop());}
  resize(){
    this.renderer.setSize(innerWidth,innerHeight,false);
    const aspect=innerWidth/innerHeight;
    this.camera.left=-this.cameraView*aspect;
    this.camera.right=this.cameraView*aspect;
    this.camera.top=this.cameraView;
    this.camera.bottom=-this.cameraView;
    this.camera.updateProjectionMatrix();
  }
  renderLevelCards(){
    $('#level-grid').innerHTML=LEVELS.map(l=>{const locked=l.id>SAVE.unlocked,b=SAVE.best[l.id],s=SAVE.stars[l.id]||0;return `<button class="level-card ${locked?'locked':''}" data-level="${l.id}" ${locked?'disabled':''}><div class="level-number">LEVEL ${String(l.id).padStart(2,'0')}</div><h3>${l.name}</h3><p>${l.subtitle}</p><div class="level-meta"><span>${'★'.repeat(s)}${'☆'.repeat(3-s)}</span><span>${b?fmtTime(b):'—'}</span></div></button>`;}).join('');
    document.querySelectorAll('[data-level]').forEach(b=>b.addEventListener('click',()=>this.startLevel(Number(b.dataset.level)-1)));
    $('#play-btn').textContent=SAVE.unlocked>1?'POKRAČOVAT':'NOVÁ HRA';
  }
  syncSettingsUI(){const s=SAVE.settings;$('#set-sfx').value=s.sfx;$('#set-music').value=s.music;$('#set-quality').value=s.quality;}
  applyQuality(){
    const high=SAVE.settings.quality==='high';
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,high?1.7:1));
    this.renderer.shadowMap.enabled=high;
    this.sun.castShadow=high;
    this.resize();
  }
  bindEvents(){
    addEventListener('resize',()=>this.resize());
    addEventListener('keydown',e=>{if(this.running&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(e.code))e.preventDefault();this.keys[e.code]=true;const oneShot=['Escape','KeyC','ControlLeft','ControlRight','KeyE','KeyQ','Tab'];if(e.repeat&&oneShot.includes(e.code))return;if(e.code==='Escape'){if(this.finished)return;if(this.paused)this.resume();else this.pause();return;}if(!this.running||this.paused||this.finished)return;if(e.code==='KeyC'||e.code==='ControlLeft'||e.code==='ControlRight'){this.stealth=!this.stealth;this.working=false;}if(e.code==='KeyE')this.doInteraction();if(e.code==='KeyQ')this.quickGadget();if(e.code==='Tab')this.tactical=!this.tactical;});
    addEventListener('keyup',e=>{this.keys[e.code]=false;});
    addEventListener('blur',()=>{this.keys={};this.mobileSprint=false;this.sprinting=false;this.joy.x=this.joy.y=0;});
    // Camera is intentionally fixed. Mouse/touch gestures do not rotate or zoom the view.
    $('#play-btn').onclick=()=>this.startLevel(Math.min(SAVE.unlocked,LEVELS.length)-1);$('#levels-btn').onclick=()=>this.showScreen('levels');$('#settings-btn').onclick=()=>this.showScreen('settings');document.querySelectorAll('[data-back]').forEach(b=>b.onclick=()=>this.showScreen('main'));
    $('#resume-btn').onclick=()=>this.resume();$('#restart-btn').onclick=()=>this.startLevel(this.levelIndex);$('#quit-btn').onclick=()=>this.quit();$('#result-restart').onclick=()=>this.startLevel(this.levelIndex);$('#result-menu').onclick=()=>{this.running=false;$('#hud').classList.add('hidden');$('#mobile-controls').classList.add('hidden');this.showScreen('levels');};$('#result-next').onclick=()=>this.startLevel(Math.min(this.levelIndex+1,LEVELS.length-1));$('#fail-restart').onclick=()=>this.startLevel(this.levelIndex);$('#fail-menu').onclick=()=>this.quit();
    $('#pause-btn').onclick=()=>this.pause();$('#tactical-btn').onclick=()=>{this.tactical=!this.tactical;};
    $('#btn-interact').onpointerdown=e=>{e.preventDefault();this.doInteraction();};$('#btn-gadget').onpointerdown=e=>{e.preventDefault();this.quickGadget();};$('#btn-stealth').onpointerdown=e=>{e.preventDefault();this.stealth=!this.stealth;this.working=false;};$('#btn-sprint').onpointerdown=e=>{e.preventDefault();this.mobileSprint=true;e.currentTarget.setPointerCapture?.(e.pointerId);};$('#btn-sprint').onpointerup=()=>this.mobileSprint=false;$('#btn-sprint').onpointercancel=()=>this.mobileSprint=false;addEventListener('pointerup',()=>this.mobileSprint=false);
    const base=$('#joy-base'),stick=$('#joy-stick');let jid=null;const joyMove=e=>{const r=base.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=e.clientX-cx,dy=e.clientY-cy,max=r.width*.34,len=Math.hypot(dx,dy),m=len>max?max/len:1;const px=dx*m,py=dy*m;this.joy.x=px/max;this.joy.y=py/max;stick.style.transform=`translate(calc(-50% + ${px}px),calc(-50% + ${py}px))`;};base.addEventListener('pointerdown',e=>{jid=e.pointerId;base.setPointerCapture(jid);joyMove(e);});base.addEventListener('pointermove',e=>{if(e.pointerId===jid)joyMove(e);});const joyEnd=e=>{if(e.pointerId===jid){jid=null;this.joy.x=this.joy.y=0;stick.style.transform='translate(-50%,-50%)';}};base.addEventListener('pointerup',joyEnd);base.addEventListener('pointercancel',joyEnd);
    const set=(id,key,parser=v=>v)=>{$(id).addEventListener('input',e=>{SAVE.settings[key]=parser(e.target.type==='checkbox'?e.target.checked:e.target.value);persist();AUDIO.update();});};set('#set-sfx','sfx',Number);set('#set-music','music',Number);set('#set-quality','quality',String);$('#set-quality').addEventListener('change',()=>this.applyQuality());
    $('#reset-progress').onclick=()=>{if(confirm('Opravdu smazat postup, časy a hvězdy?')){SAVE={unlocked:1,best:{},stars:{},tutorials:{},settings:{...SAVE.settings}};persist();this.renderLevelCards();this.toast?.('Postup resetován.');}};
  }
}

const GAME = new Game();
window.GAME = GAME;

