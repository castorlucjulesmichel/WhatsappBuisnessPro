import fs from "node:fs";
import path from "node:path";
import {execFileSync} from "node:child_process";

const root=process.cwd();
const jsFiles=fs.readdirSync(root).filter(x=>x.endsWith(".js"));
const js=jsFiles.map(x=>fs.readFileSync(path.join(root,x),"utf8")).join("\n");
const errors=[];

function auditHtml(file){
  const html=fs.readFileSync(path.join(root,file),"utf8");
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  const seen=new Set();
  for(const id of ids){
    if(seen.has(id))errors.push(file+" duplicate id: "+id);
    seen.add(id);
  }

  if(file==="index.html"){
    const pages=new Set([...html.matchAll(/<section\b[^>]*\bid="([^"]+Page)"/g)].map(m=>m[1].slice(0,-4)));
    for(const m of html.matchAll(/\bdata-(?:page|go)="([^"]+)"/g)){
      if(!pages.has(m[1]))errors.push("Missing page target: "+m[1]);
    }
    const panels=new Set([...html.matchAll(/\bdata-setting-panel="([^"]+)"/g)].map(m=>m[1]));
    for(const m of html.matchAll(/\bdata-setting-target="([^"]+)"/g)){
      if(!panels.has(m[1]))errors.push("Missing settings panel: "+m[1]);
    }
  }

  const recognized=/\b(data-page|data-go|data-setting-target|data-create-action|data-market-mode|data-wallet-action|data-chat-filter|data-info-msg|data-request|data-order|data-investment|data-user|data-boost)=/;
  for(const m of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)){
    const attrs=m[1],label=m[2].replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim().slice(0,80);
    const id=(attrs.match(/\bid="([^"]+)"/)||[])[1]||"";
    const isSubmit=!/\btype="button"/.test(attrs);
    if(isSubmit||recognized.test(attrs))continue;
    if(!id){errors.push(file+" button has no action/id: "+label);continue;}
    const refs=[`#${id}`,`"${id}"`,`'${id}'`];
    if(!refs.some(x=>js.includes(x)))errors.push(file+" button id has no JS handler/reference: "+id+" ("+label+")");
  }
}

for(const file of ["index.html","admin.html"])auditHtml(file);

for(const file of jsFiles){
  const src=fs.readFileSync(path.join(root,file),"utf8");
  const lines=src.split(/\r?\n/);
  lines.forEach((line,i)=>{
    if(/(^|[^$])\$\([^)]*\)\.forEach/.test(line))errors.push(`${file}:${i+1} uses $().forEach instead of $$().forEach`);
  });
  try{execFileSync(process.execPath,["--check",path.join(root,file)],{stdio:"pipe"});}
  catch(e){errors.push(file+" syntax check failed: "+String(e.stderr||e.message).trim());}
}

if(errors.length){
  console.error("\nBUTTON/UI AUDIT FAILED");
  for(const e of errors)console.error(" - "+e);
  process.exit(1);
}
console.log("Button/UI audit passed for main and admin interfaces.");
