// Instrumental original: violão sintetizado, baixo, sinos suaves e percussão no pico.
// No downloads. All audio nodes are created only after a user gesture.
export const EFFECTS = {
  dough: [[210,0,.08,'triangle'],[340,.06,.1,'sine']],
  ingredient: [[560,0,.05,'sine'],[730,.055,.07,'sine']],
  prep: [[280,0,.06,'triangle'],[420,.09,.05,'triangle'],[560,.18,.1,'triangle']],
  prepDone: [[440,0,.08,'sine'],[660,.08,.12,'sine']],
  ovenIn: [[145,0,.12,'triangle'],[220,.1,.12,'triangle']],
  ovenOut: [[520,0,.1,'triangle'],[780,.09,.15,'sine']],
  ovenReady: [[880,0,.12,'sine'],[880,.22,.16,'sine']],
  arrival: [[494,0,.12,'sine'],[740,.11,.18,'sine']],
  order: [[660,0,.07,'triangle'],[830,.08,.1,'triangle']],
  delivery: [[523,0,.08,'triangle'],[659,.08,.09,'triangle'],[784,.16,.13,'triangle']],
  cash: [[1175,0,.06,'sine'],[1568,.07,.12,'sine']],
  tip: [[1760,0,.05,'sine'],[2093,.07,.08,'sine']],
  purchase: [[330,0,.08,'triangle'],[494,.09,.09,'triangle'],[660,.18,.16,'sine']],
  restock: [[300,0,.05,'triangle'],[360,.07,.06,'triangle'],[460,.14,.09,'triangle']],
  mission: [[523,0,.12,'sine'],[659,.12,.12,'sine'],[784,.24,.12,'sine'],[1046,.36,.2,'sine']],
  level: [[392,0,.12,'triangle'],[523,.12,.12,'triangle'],[659,.24,.12,'triangle'],[784,.36,.25,'sine']],
  expansion: [[262,0,.2,'triangle'],[392,.15,.2,'triangle'],[523,.3,.2,'triangle'],[784,.45,.3,'sine']],
  wrong: [[220,0,.12,'triangle'],[165,.15,.2,'triangle']],
  burn: [[350,0,.08,'sawtooth'],[240,.15,.12,'triangle']],
  leave: [[330,0,.12,'sine'],[247,.12,.12,'sine'],[196,.24,.18,'sine']],
  helperTake: [[390,0,.07,'triangle'],[490,.08,.09,'triangle']],
  helperDrop: [[490,0,.07,'triangle'],[390,.08,.1,'triangle']],
  store: [[260,0,.09,'triangle']], take: [[460,0,.09,'triangle']],
  combo: [[784,0,.08,'sine'],[988,.08,.08,'sine'],[1318,.16,.18,'sine']],
  event: [[587,0,.1,'triangle'],[784,.12,.1,'triangle'],[988,.24,.16,'triangle']],
  tap: [[320,0,.08,'sine']]
};
const hz = midi => 440 * 2 ** ((midi - 69) / 12);
export class RestaurantAudio {
  constructor(settings, factory = () => new (globalThis.AudioContext || globalThis.webkitAudioContext)()) {
    this.settings=settings; this.factory=factory; this.ctx=null;this.buffers=new Map();this.lastEffect=new Map();this.loadingSamples=false; this.step=0; this.next=0;
    this.intense=false; this.paused=false; this.hidden=false;
  }
  unlock() {
    try {
      if(!this.ctx){
        this.ctx=this.factory();
        const c=this.ctx;
        this.music=c.createGain();this.effects=c.createGain();this.accent=c.createGain();this.master=c.createDynamicsCompressor();
        this.music.gain.value=0;this.effects.gain.value=0;this.accent.gain.value=0;
        this.accent.connect(this.music);this.music.connect(this.master);this.effects.connect(this.master);this.master.connect(c.destination);
        this.next=c.currentTime+.1;this.apply();this.loadSamples();
      }
      this.ctx.resume().catch(()=>{});
      return true;
    }catch{return false;}
  }
  apply() {
    if(!this.ctx)return;
    const s=this.settings(),t=this.ctx.currentTime;
    const music=s.musicMuted||this.hidden?0:s.musicVolume*(this.paused?.4:1);
    const effects=s.sfxMuted||this.hidden?0:s.sfxVolume;
    this.music.gain.setTargetAtTime(music,t,.12);
    this.effects.gain.setTargetAtTime(effects,t,.025);
  }
  setScene({rush=false,paused=false,hidden=false}={}) {
    if(this.intense!==rush){this.intense=rush;if(this.ctx)this.accent.gain.setTargetAtTime(rush?1:0,this.ctx.currentTime,1.2);}
    if(this.paused!==paused||this.hidden!==hidden){this.paused=paused;this.hidden=hidden;this.apply();}
  }
  note(frequency,time,duration,type,bus,volume=.1) {
    const c=this.ctx,o=c.createOscillator(),g=c.createGain();
    o.type=type;o.frequency.value=frequency;
    g.gain.setValueAtTime(0,time);g.gain.linearRampToValueAtTime(volume,time+.008);
    g.gain.exponentialRampToValueAtTime(.0001,time+duration);
    o.connect(g);g.connect(bus);o.start(time);o.stop(time+duration+.025);
    o.onended=()=>{o.disconnect();g.disconnect();};
  }
  async loadSamples(){if(this.loadingSamples||!this.ctx?.decodeAudioData)return;this.loadingSamples=true;for(const kind of ['dough','ingredient','ovenIn','ovenOut','ovenReady','arrival','cash','store','take','wrong']){try{const r=await fetch('./assets/audio/'+kind+'.wav');if(!r.ok)continue;this.buffers.set(kind,await this.ctx.decodeAudioData(await r.arrayBuffer()));}catch{}}}
  pluck(frequency,time,duration,bus,volume=.08){
    if(!this.ctx.createBuffer||!this.ctx.createBufferSource)return this.note(frequency,time,duration,'triangle',bus,volume);
    const c=this.ctx,n=Math.floor(c.sampleRate*duration),buffer=c.createBuffer(1,n,c.sampleRate),data=buffer.getChannelData(0),period=Math.max(2,Math.round(c.sampleRate/frequency));
    for(let i=0;i<n;i++){const t=i/c.sampleRate;data[i]=(Math.sin(2*Math.PI*frequency*t)+.32*Math.sin(2*Math.PI*frequency*2*t)+.12*Math.sin(2*Math.PI*frequency*3*t))*Math.exp(-t*6)*volume;}
    const src=c.createBufferSource();src.buffer=buffer;src.connect(bus);src.start(time);src.onended=()=>src.disconnect();
  }
  effect(kind,delay=0) {
    const s=this.settings();
    if(!this.ctx||this.ctx.state!=='running'||s.sfxMuted||s.sfxVolume===0||this.hidden)return;
    const t=this.ctx.currentTime+delay;
    if(t-(this.lastEffect.get(kind)??-10)<.12)return;this.lastEffect.set(kind,t);
    const sample=this.buffers.get(kind);if(sample&&this.ctx.createBufferSource){const src=this.ctx.createBufferSource();src.buffer=sample;src.connect(this.effects);src.start(t);src.onended=()=>src.disconnect();return;}
    for(const [f,offset,duration,type]of EFFECTS[kind]||EFFECTS.tap)this.note(f,t+offset,duration,type,this.effects,.16);
  }
  tick() {
    if(!this.ctx||this.ctx.state!=='running'||this.hidden)return;
    const now=this.ctx.currentTime;
    if(this.next<now-.3)this.next=now+.03;
    const chords=[[60,64,67,71],[57,60,64,67],[53,57,60,64],[55,59,62,65]];
    while(this.next<now+.15){
      const i=this.step%16,chord=chords[Math.floor(this.step/16)%4],t=this.next;
      // 88 BPM, eighth notes; arpeggios vary across the four-bar phrase.
      if(i%2===0){
        this.pluck(hz(chord[(i/2)%4]),t,.75,this.music,.12);
        if(i%4===0)this.note(hz(chord[0]-24),t,.75,'sine',this.music,.14);
      }
      if([3,6,11,14].includes(i))this.pluck(hz(chord[(i+Math.floor(this.step/16))%4]+12),t,.5,this.music,.065);
      if(i%4===2)this.note(150,t,.07,'triangle',this.accent,.08);
      if(i%2===1)this.note(2400,t,.025,'triangle',this.accent,.022);
      if(i%4===0)this.note(hz(chord[2]+12),t,.22,'triangle',this.accent,.045);
      this.step++;this.next+=60/88/2;
    }
  }
}
