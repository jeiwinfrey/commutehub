import {PresentationFile,FileBlob} from '@oai/artifact-tool';
const p=await PresentationFile.importPptx(await FileBlob.load('.presentation-build/template-optimized.pptx'));
for(const i of [0,1,5,7]){const s=p.slides.items[i];console.log(i+1,JSON.stringify(s.shapes.items.map(x=>({id:x.id,text:x.text.toString(),frame:x.frame,style:x.text.style}))),JSON.stringify(s.images.items.map(x=>({id:x.id,frame:x.frame}))));}
console.log(p.help('slide.duplicate',{include:['examples','notes'],maxChars:3000}).ndjson);
