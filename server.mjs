import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root=path.dirname(decodeURIComponent(new URL(import.meta.url).pathname.replace(/^\/(\w:)/,'$1'))).replaceAll('/',path.sep);
http.createServer((req,res)=>{let p;try{p=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));}catch{res.writeHead(400).end();return;}if(!p.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(p,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.glb':'model/gltf-binary','.gltf':'model/gltf+json','.png':'image/png','.svg':'image/svg+xml'})[path.extname(p)]||'application/octet-stream');res.end(data);});}).listen(4173,'127.0.0.1',()=>console.log('Pizza Empire: http://localhost:4173'));
