import * as T from 'three';
import {casas} from './casas.js';
export function buildDistrict({scene,sun,box,sphere,cyl,textSign}){
 let scenery;
 function refresh(index){
  const c=casas[index];
  if(scenery){scenery.removeFromParent();scenery.traverse(o=>{o.geometry?.dispose();if(o.material?.map){o.material.map.dispose();o.material.dispose()}})}
  scenery=new T.Group();scene.add(scenery);
  const b=(w,h,d,col,x,y,z)=>box(w,h,d,col,x,y,z,scenery);
  const s=(r,col,x,y,z)=>sphere(r,col,x,y,z,scenery);
  const trunk=(x,z)=>cyl(.19,2.4,0x78573b,x,.9,z,scenery);
  scene.background.setHex(c.sky);scene.fog.color.setHex(c.sky);sun.color.setHex(c.light);
  const wood=0x885338,cream=0xffda92;
  textSign(c.name.toLocaleUpperCase('pt-BR'),6,.7,'#344940','#ffdda1',-.6,3.55,-5.8,scenery);
  if(!index){for(const x of [-7,0,8]){trunk(x,-8);s(1.5,0x829557,x,2.6,-8);s(.94,0x98af65,x+.9,2.4,-8)}}
  if(index===1){
   for(const x of [-8,-4,0,4,8]){b(.23,4,.24,wood,x,1.6,-7);for(let i=0;i<4;i++){s(.55,0x618747,x+i,3.7,-7);s(.22,0x886284,x+i,3.32,-7)}}
   b(18,.22,.25,wood,0,3.55,-7);
  }
  if(index===2||index===5){
   for(let i=0;i<9;i++){const x=-13+i*3.4,h=3+(i*7%6);b(2.9,h,2.2,index===2?0x353850:0xa39c94,x,h/2-.5,-10);
    for(let y=1;y<h;y+=1.25)for(let j=0;j<2;j++)b(.48,.55,.06,index===2?(j?0x3fe2df:0xff8ba2):0x79a2ad,x+j-.5,y,-8.87)
   }
  }
  if(index===3){b(45,.1,15,0x58b7c2,0,-.48,-13);for(let i=0;i<4;i++){const x=-9+i*6;b(3,.05,.08,0xffecc6,x,-.39,-8-i%2*2);trunk(x,-7.8);for(let j=0;j<6;j++){const leaf=s(.95,0x55935b,x+Math.sin(j)*.6,2.2,-7.8+Math.cos(j)*.6);leaf.scale.set(.38,.22,1.2);leaf.rotation.y=j}}}
  if(index===4){for(let i=0;i<7;i++){const x=-12+i*4;s(3+i%3,0x84958e,x,-.1,-14);trunk(x,-8);for(let j=0;j<3;j++)cyl(.04,2.1,0x486855,x,1.2+j*.76,-8,scenery,1.45-j*.28)}}
  if(index===6){for(let i=0;i<3;i++){const x=-7+i*7;for(const k of [-1,1])b(.13,3,.13,wood,x+k*1.8,1.25,-8);for(let k=0;k<8;k++)b(.5,.16,2.3,k%2?cream:[0xba5843,0x51967f,0xd69037][i],x-1.75+k*.5,2.85,-8);b(4,1,1.4,wood,x,.45,-8)}}
 }
 return {refresh};
}
