// Original synthesized foley. WAV assets are local and contain no third-party recordings.
import fs from 'node:fs';
const root=new URL('../',import.meta.url),read=p=>fs.readFileSync(new URL(p,root),'utf8'),write=(p,s)=>fs.writeFileSync(new URL(p,root),s);
fs.mkdirSync(new URL('assets/audio/',root),{recursive:true});
let seed=92813;const noise=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1;};
const tone=(f,t)=>Math.sin(Math.PI*2*f*t);
const designs={
 dough:[.19,t=>noise()*Math.exp(-t*26)*.3+tone(140,t)*Math.exp(-t*35)*.4],
 ingredient:[.16,t=>noise()*Math.exp(-t*35)*.2+tone(920,t)*Math.exp(-t*55)*.12],
 ovenIn:[.32,t=>noise()*Math.exp(-t*12)*.2+tone(110,t)*Math.exp(-t*16)*.22],
 ovenOut:[.25,t=>tone(320,t)*Math.exp(-t*18)*.2+noise()*Math.exp(-t*22)*.12],
 ovenReady:[.7,t=>(tone(990,t)+.25*tone(1985,t))*Math.exp(-t*7)*.22],
 arrival:[.5,t=>tone(740,t)*Math.exp(-t*10)*.16+tone(1108,t)*Math.exp(-t*13)*.1],
 cash:[.35,t=>(tone(1860,t)+tone(2430,t)*.6)*Math.exp(-t*18)*.16],
 store:[.16,t=>tone(190,t)*Math.exp(-t*24)*.3+noise()*Math.exp(-t*45)*.15],
 take:[.15,t=>tone(340,t)*Math.exp(-t*24)*.22],
 wrong:[.22,t=>tone(180,t)*Math.exp(-t*12)*.2]
};
for(const [name,[duration,fn]]of Object.entries(designs)){const sr=22050,n=Math.floor(duration*sr),b=Buffer.alloc(44+n*2);b.write('RIFF');b.writeUInt32LE(36+n*2,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(sr,24);b.writeUInt32LE(sr*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(n*2,40);for(let i=0;i<n;i++){const t=i/sr,fade=Math.min(1,i/120,(n-i)/300);b.writeInt16LE(Math.round(Math.max(-1,Math.min(1,fn(t)*fade))*32767),44+i*2);}fs.writeFileSync(new URL('assets/audio/'+name+'.wav',root),b);}
let s=read('audio.js');
s=s.replace('this.ctx=null; this.step=0;',"this.ctx=null;this.buffers=new Map();this.lastEffect=new Map();this.loadingSamples=false; this.step=0;");
s=s.replace('this.next=c.currentTime+.1;this.apply();', 'this.next=c.currentTime+.1;this.apply();this.loadSamples();');
s=s.replace('  effect(kind,delay=0) {',`  async loadSamples(){if(this.loadingSamples||!this.ctx?.decodeAudioData)return;this.loadingSamples=true;for(const kind of ['dough','ingredient','ovenIn','ovenOut','ovenReady','arrival','cash','store','take','wrong']){try{const r=await fetch('./assets/audio/'+kind+'.wav');if(!r.ok)continue;this.buffers.set(kind,await this.ctx.decodeAudioData(await r.arrayBuffer()));}catch{}}}
  pluck(frequency,time,duration,bus,volume=.08){
    if(!this.ctx.createBuffer||!this.ctx.createBufferSource)return this.note(frequency,time,duration,'triangle',bus,volume);
    const c=this.ctx,n=Math.floor(c.sampleRate*duration),buffer=c.createBuffer(1,n,c.sampleRate),data=buffer.getChannelData(0),period=Math.max(2,Math.round(c.sampleRate/frequency));
    for(let i=0;i<n;i++){const t=i/c.sampleRate;data[i]=(Math.sin(2*Math.PI*frequency*t)+.32*Math.sin(2*Math.PI*frequency*2*t)+.12*Math.sin(2*Math.PI*frequency*3*t))*Math.exp(-t*6)*volume;}
    const src=c.createBufferSource();src.buffer=buffer;src.connect(bus);src.start(time);src.onended=()=>src.disconnect();
  }
  effect(kind,delay=0) {`);
s=s.replace('const t=this.ctx.currentTime+delay;\n    for',`const t=this.ctx.currentTime+delay;
    if(t-(this.lastEffect.get(kind)??-10)<.12)return;this.lastEffect.set(kind,t);
    const sample=this.buffers.get(kind);if(sample&&this.ctx.createBufferSource){const src=this.ctx.createBufferSource();src.buffer=sample;src.connect(this.effects);src.start(t);src.onended=()=>src.disconnect();return;}
    for`);
s=s.replace("this.note(hz(chord[(i/2)%4]),t,.65,'triangle',this.music,.075)","this.pluck(hz(chord[(i/2)%4]),t,.75,this.music,.12)");
s=s.replace("this.note(hz(chord[(i+Math.floor(this.step/16))%4]+12),t,.4,'sine',this.music,.045)","this.pluck(hz(chord[(i+Math.floor(this.step/16))%4]+12),t,.5,this.music,.065)");
write('audio.js',s);
console.log('10 original WAV effects and plucked instrumental voice created.');
