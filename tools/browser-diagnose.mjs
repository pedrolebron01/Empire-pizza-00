import {spawn} from 'node:child_process';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd();
const server=spawn(process.execPath,['server.mjs'],{cwd:root,windowsHide:true,stdio:'pipe'});
server.stdout.on('data',x=>console.log(String(x).trim()));server.stderr.on('data',x=>console.log('server',String(x).trim()));
const browser=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--no-first-run','--no-default-browser-check','--remote-debugging-port=9237','--remote-allow-origins=http://localhost:9237','--user-data-dir='+path.join(root,'tools/browser-profile'),'--window-size=1440,1000','about:blank'],{windowsHide:true,stdio:'ignore'});
let ws,id=0,pending=new Map();
function cmd(method,params={}){return new Promise((resolve,reject)=>{const i=++id;pending.set(i,{resolve,reject});ws.send(JSON.stringify({id:i,method,params}));});}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
try{
let targets;for(let i=0;i<30;i++){try{targets=await (await fetch('http://localhost:9237/json')).json();break;}catch{await wait(300);}}
if(!targets)throw Error('Chrome não disponibilizou a depuração.');
ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
ws.onmessage=e=>{let m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}}else if(m.method==='Runtime.exceptionThrown')console.log('EXCEPTION',JSON.stringify(m.params.exceptionDetails));else if(m.method==='Network.loadingFailed')console.log('NETWORK',JSON.stringify(m.params));else if(m.method==='Runtime.consoleAPICalled')console.log('CONSOLE',JSON.stringify(m.params.args.map(a=>a.description||a.value)));};
await cmd('Runtime.enable');await cmd('Network.enable');await cmd('Page.enable');await cmd('Page.navigate',{url:'http://localhost:4173'});await wait(18000);
console.log('PAGE',JSON.stringify(await cmd('Runtime.evaluate',{expression:'JSON.stringify({title:document.title,loading:document.querySelector("#loading")?.innerText,loadingHidden:document.querySelector("#loading")?.className,body:document.body.innerText.slice(-1800),canvas:!!document.querySelector("canvas"),webgl:!!document.createElement("canvas").getContext("webgl2")})',returnByValue:true})));
const screenshot=await cmd('Page.captureScreenshot',{format:'png'});await writeFile('tools/diagnostic.png',Buffer.from(screenshot.data,'base64'));console.log('Screenshot: tools/diagnostic.png');
}catch(e){console.log('DIAGNOSTIC FAILED',e.message||e);}finally{if(ws){try{await cmd('Browser.close');}catch{}ws.close();}browser.kill();server.kill();}
