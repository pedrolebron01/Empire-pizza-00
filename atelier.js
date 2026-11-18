import * as T from 'three';

// Local clips authored for the pivots of Pizza Empire's segmented characters.
// Each pose stores left/right shoulder, left/right hip, torso pitch and head yaw.
const still=[0,0,0,0,0,0], reach=[-1.05,-1.05,0,0,.12,0];
const motions={
 idle:[3,[still,[.025,-.025,0,0,-.035,.12],still]],
 walk:[.68,[[.41,-.41,-.53,.53,.035,-.02],[-.41,.41,.53,-.53,.035,.02],[.41,-.41,-.53,.53,.035,-.02]]],
 run:[.46,[[.79,-.8,-.87,.87,.10,0],[-.8,.79,.87,-.87,.10,0],[.79,-.8,-.87,.87,.10,0]]],
 turn:[.34,[still,[-.1,.12,-.13,.16,.02,.29],still]],
 pickup:[.6,[still,[-.45,-.6,-.17,-.12,.31,0],reach,[-.9,-.9,0,0,.025,0]]],
 prepare:[.74,[[-.95,-.52,0,0,.10,0],[-.56,-1.12,0,0,.17,.04],[-.95,-.52,0,0,.10,0]]],
 insert:[.72,[[-.85,-.85,0,0,0,0],[-1.65,-1.65,-.11,.12,.16,0],still]],
 remove:[.72,[still,[-1.65,-1.65,-.11,.12,.16,0],[-.94,-.94,0,0,-.03,0]]],
 carry:[.78,[[-.99,-.99,-.43,.43,0,0],[-.97,-.97,.43,-.43,0,0],[-.99,-.99,-.43,.43,0,0]]],
 hold:[2,[[-1,-1,0,0,0,0],[-.97,-.97,0,0,-.015,.04],[-1,-1,0,0,0,0]]],
 give:[.75,[[-1,-1,0,0,0,0],[-1.65,-1.65,0,0,.12,0],still]],
 talk:[1.28,[still,[-.67,-.12,0,0,-.03,.2],[-.18,-.5,0,0,.04,-.13],still]],
 celebrate:[.95,[still,[-2.65,-2.65,-.13,.12,-.10,.05],[-2.45,-2.9,.1,-.08,-.08,-.12],still]],
 regret:[1.1,[still,[-.18,-2.35,0,0,.13,-.22],[-.15,-2.25,0,0,.12,.21],still]]
};
const joints=['armL','armR','legL','legR','upper','head'];
const clips=Object.entries(motions).map(([name,[duration,poses]])=>{
 const times=poses.map((_,i)=>duration*i/(poses.length-1));
 return new T.AnimationClip(name,duration,joints.map((joint,i)=>new T.NumberKeyframeTrack(
  joint+'.rotation['+(joint==='head'?'y':'x')+']',times,poses.map(p=>p[i])
 )));
});
export function actorMotion(actor){
 const mixer=new T.AnimationMixer(actor.g);
 const actions=new Map(clips.map(clip=>[clip.name,mixer.clipAction(clip)]));
 let previous,gesture,remaining=0,angle=actor.g.rotation.y;
 return {
  signal(name){if(!actions.has(name))return;gesture=name;remaining=motions[name][0];if(previous===actions.get(name))previous.reset().play()},
  update(dt,{moving,running,working,carrying,reduced}){
   const yaw=actor.g.rotation.y,turn=Math.abs(Math.atan2(Math.sin(yaw-angle),Math.cos(yaw-angle)))>.45;
   angle=yaw;
   if(turn&&!gesture)this.signal('turn');
   const next=actions.get(gesture||(working?'prepare':carrying?(moving?'carry':'hold'):moving?(running?'run':'walk'):'idle'));
   if(previous!==next){previous?.fadeOut(.12);next.reset().setEffectiveWeight(1).fadeIn(.12).play();previous=next}
   mixer.update(dt*(reduced&&!moving?.55:1));
   remaining-=dt;if(remaining<=0)gesture=null;
  }
 };
}
export function makePerson({scene,box,cyl,sphere},shirt,skin,chef=false,big=false){
 const g=new T.Group(),upper=new T.Group(),head=new T.Group();
 upper.name='upper';upper.position.y=.72;g.add(upper);
 head.name='head';head.position.y=.78;upper.add(head);
 cyl(.26,.6,shirt,0,.26,0,upper,.32);
 sphere(.24,skin,0,0,0,head);
 cyl(.235,.15,chef?0xfff4dd:0x47382d,0,.19,0,head);
 if(chef){
  for(const x of [-.13,0,.13])sphere(.18,0xfff4dd,x,.33,0,head);
  box(.39,.46,.055,0xf1d7ad,0,.22,.27,upper);
  box(.32,.13,.06,shirt,0,.10,.29,upper);
 }
 for(const s of [-1,1]){sphere(.03,0x302622,s*.09,.035,.215,head);sphere(.068,skin,s*.22,-.02,0,head)}
 sphere(.055,skin,0,-.034,.225,head);
 for(const side of [-1,1]){
  const brow=box(.09,.021,.026,0x46332a,side*.093,.102,.218,head);
  brow.rotation.z=side*.13;
 }
 const smile=sphere(.05,0x754334,0,-.105,.207,head);
 smile.scale.set(1.15,.35,.42);
 const arms=[],legs=[];
 for(const [i,s] of [-1,1].entries()){
  const arm=new T.Group(),leg=new T.Group();
  arm.name=joints[i];arm.position.set(s*.31,.48,0);upper.add(arm);
  cyl(.092,.32,shirt,0,-.13,0,arm);sphere(.094,skin,0,-.33,.03,arm);arms.push(arm);
  leg.name=joints[i+2];leg.position.set(s*.14,.60,0);g.add(leg);
  cyl(.105,.43,0x344d47,0,-.2,0,leg);box(.20,.14,.3,0x49382a,0,-.48,.055,leg);legs.push(leg);
 }
 if(big)g.scale.setScalar(1.12);
 scene.add(g);
 const actor={g,head,upper,arms,legs,path:[],carrying:[],walk:0};
 actor.motion=actorMotion(actor);return actor;
}
export function dressChef(actor,index,{box,cyl,sphere}){
 if(actor.accessories){actor.accessories.traverse(n=>n.geometry?.dispose());actor.accessories.removeFromParent()}
 const group=new T.Group();actor.head.add(group);actor.accessories=group;
const color=[0xb6503d,0x306d57,0xbc7737,0x315f91,0x87558a,0x605849,0xb84073][index];
 if(index===6){sphere(.15,0x403026,0,.12,-.21,group);for(const side of [-1,1]){const bow=sphere(.065,0xf0b437,.15+side*.044,.13,-.13,group);bow.scale.set(1,.72,.5)}}
 cyl(.24,.072,color,0,.21,0,group);
 if(index===1||index===3){sphere(.155,index===1?0x38251f:0x774331,0,.09,-.21,group);sphere(.095,color,0,.035,-.30,group)}
 if(index===2||index===5){for(const s of [-1,1]){const m=sphere(.077,index===2?0x3f2a20:0x8c8173,s*.055,-.089,.216,group);m.scale.set(1,.43,.42);m.rotation.z=s*.16}}
 if(index===4){for(const s of [-1,1]){const m=box(.16,.024,.07,0x342535,s*.09,.094,.216,group);m.rotation.z=s*.15}box(.08,.02,.06,0x342535,0,.07,.225,group)}
 actor.g.scale.setScalar(index===5?1.08:index===3?.96:1);
}
