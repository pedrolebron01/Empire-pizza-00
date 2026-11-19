import * as T from 'three';

// Every floor tile uses the same geometry and one of two materials.
export function layTiles(scene, material) {
  const tile=new T.BoxGeometry(.975,.05,.975);
  const groups=[0xe5ddc7,0xd6ccb3].map(color=>new T.InstancedMesh(tile,material(color),108));
  const count=[0,0], matrix=new T.Matrix4();
  for(let x=-8.5;x<9;x++)for(let z=-5.5;z<6;z++){
    const group=Math.abs(Math.round(x+z)%2);
    groups[group].setMatrixAt(count[group]++,matrix.makeTranslation(x,-.015,z));
  }
  groups.forEach(mesh=>{mesh.receiveShadow=true;scene.add(mesh)});
}

const metal=new Set([0x647477,0x546d5c,0x695048,0x503e32,0x375047]);
export function surface(color){
  if(metal.has(color))return {metalness:.56,roughness:.34};
  if(color===0x91b6b3)return {metalness:.24,roughness:.12};
  if(color===0xffa530)return {emissive:0xfe630e,emissiveIntensity:.65,roughness:.65};
  if(color===0xf1ce6e||color===0xbf4330)return {roughness:.45};
  if(color===0xecd8ad||color===0xf3e2c2)return {roughness:.62};
  return {roughness:.86};
}

export function atmosphere(scene,sign){
  const count=72,coords=new Float32Array(count*3),geo=new T.BufferGeometry();
  geo.setAttribute('position',new T.BufferAttribute(coords,3));
  const paint=new T.PointsMaterial({size:.075,color:0xffb73e,transparent:true,opacity:.8,depthWrite:false});
  const specks=new T.Points(geo,paint);specks.frustumCulled=false;scene.add(specks);
  return function update(t,house,effects,intro,flash){
    sign.material.color.setScalar(intro&&effects?.enabled? .55+.45*Math.min(1,t*.7):1);
    specks.visible=!!effects?.enabled && [2,3,4,6].includes(house);
    if(!specks.visible)return;
    const rain=house===2,snow=house===4,beach=house===3,n=Math.floor(count*effects.amount);
    geo.setDrawRange(0,n);paint.color.setHex(rain?0xaccde3:snow?0xfff5e3:beach?0xebfffc:0xffcd55);
    paint.size=rain?.045:snow?.085:.07;paint.opacity=.42+.32*flash;
    for(let i=0;i<n;i++){
      const phase=i*2.39996,dx=Math.sin(phase)*9;
      coords[i*3]=dx+Math.sin(t*.6+i)*(rain?.2:.65);
      coords[i*3+1]=beach?.04+Math.sin(t+i)*.04:6-((i*.73+t*(rain?3:snow?.52:.7))%6);
      coords[i*3+2]=-7.3-(i%10)*.65;
    }
    geo.attributes.position.needsUpdate=true;
  };
}
