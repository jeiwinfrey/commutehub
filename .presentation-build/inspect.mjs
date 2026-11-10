import fs from 'node:fs/promises';
import {PresentationFile,FileBlob} from '@oai/artifact-tool';
const p=await PresentationFile.importPptx(await FileBlob.load('/Users/jeiwinfrey/Desktop/CommuteHub/.presentation-build/template-optimized.pptx'));
console.log((await p.inspect({kind:'layout',maxChars:3000})).ndjson);
console.log('slides',p.slides.items.length,'masters',p.masters.items.length);
for(let i=0;i<p.slides.items.length;i++){
 const s=p.slides.items[i]; console.log(i+1,s.id,s.shapes.items.map(x=>({id:x.id,name:x.name,text:x.text.toString(),position:x.position})),s.images.items.map(x=>({id:x.id,name:x.name,position:x.position})));
}
await fs.writeFile('.presentation-build/import-montage.webp',new Uint8Array(await (await p.export({format:'webp',montage:true})).arrayBuffer()));
