import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {PresentationFile,FileBlob} from '@oai/artifact-tool';
const root='/Users/jeiwinfrey/Desktop/CommuteHub';
const p=await PresentationFile.importPptx(await FileBlob.load(root+'/.presentation-build/template-optimized.pptx'));
const orig=[...p.slides.items];
const questions=orig[1].duplicate();
const survey=orig[1].duplicate();
const order=[orig[0],orig[1],questions,survey,orig[2],orig[3],orig[4],orig[5],orig[6],...orig.slice(7)];
p.slides.reorder(order.map(s=>s.id));
function text(s,id,v){s.shapes.items.find(x=>x.id===id).text=v;}
function style(s,id,size=26){s.shapes.items.find(x=>x.id===id).text.style={typeface:'IBM Plex Sans',fontSize:size,color:'#292929',wrap:"square"};}
function research(s,section,title,body,size=26){text(s,'49',section);text(s,'50',title);text(s,'51',body);style(s,'51',size);}
function note(s,v){s.speakerNotes.text=v;}
function addText(s,name,txt,frame,size,color='#292929',font='Source Serif 4',bold=false){const x=s.shapes.add({geometry:'textbox',name,position:frame,fill:'none',line:{fill:'none',width:0}});x.text=txt;x.text.style={typeface:font,fontSize:size,color,bold,wrap:"square"};return x;}
async function removeArt(s){const idx=p.slides.items.findIndex(x=>x.id===s.id);const r=await p.inspect({select:`$.slides[${idx}].elements[?(@.kind == 'image')]`,include:['id']});if(r.records.length>1)p.delete(r.records[1].id);}
const csv='/Users/jeiwinfrey/Downloads/Untitled form.csv';
const audit=JSON.parse(await fs.readFile(root+'/.presentation-build/coding-audit.json','utf8'));
const researchNote=`Source: ${csv}. 74 submitted responses. Manual multi-label thematic coding of Q3 and Q5, with one count per response per theme. Percentage = coded answers / 74 × 100, rounded to one decimal. Themes overlap. All submissions retained, including repeated wording; unique respondent identity was not independently verified. Year level, consent, and other personal fields excluded. Coding audit: ${JSON.stringify(audit.codes)}.`;
text(orig[0],'51','Design Thinking and UI/UX\nResearch, prototype feedback and app walkthrough');
note(orig[0],'Template and artwork: MMSU-CommuteHub-Sequence-Final.pptx supplied by the user. Research figures updated from the supplied CSV.');
research(orig[1],'INTRODUCTION','Why we chose commuters','We chose MMSU student commuters as the users\nfor our design thinking project.\n\nWe explored their daily travel challenges to\ndesign an IT solution that helps them plan\nwhen, where and what to ride.',27);
note(orig[1],'Project framing based on the user request and 195ppt.pdf. The project applies design thinking to MMSU student commuters.');
// Exact substantive questions, without consent or year-level items.
await removeArt(questions);
research(questions,'SURVEY INTERVIEW','Interview questions','',25);
questions.shapes.items.find(x=>x.id==='51').frame={left:72,top:273,width:1045,height:337};
const qs=[
'1. Walk us through a typical daily commute from start to finish for you.',
'2. Can you describe a specific moment during your commute this week when you felt completely stuck or delayed?',
'3. What is the most challenging, unpredictable, or exhausting part of your travel routine?',
'4. How do you currently decide when to leave, what routes or rides to take, or how to handle unexpected delays?',
'5. If you had a magic wand to change one thing about your current commuting process, what would it be and why?'];
text(questions,'51',qs.join('\n\n'));style(questions,'51',22);
note(questions,'Source: supplied CSV, substantive questions I–V. Also verified in Google Forms: https://docs.google.com/forms/d/1liEG3PRR3uXq0MT-cCLoXSEfarbTrqgJ3puwW15mKtA/edit#responses . Consent and year-level questions omitted as requested.');
await removeArt(survey);
research(survey,'SURVEY INTERVIEW','Understanding the commuting problem','To establish a clearer understanding of the problem,\nwe conducted a survey interview among MMSU students.\n\nStudents shared their daily commuting challenges,\ngrievances and perspectives.',28);
survey.shapes.items.find(x=>x.id==='51').frame={left:72,top:285,width:1000,height:210};
addText(survey,'Sample count','74 survey responses', {left:72,top:527,width:900,height:62},40,'#0C4B05','Source Serif 4',true);
addText(survey,'Method','Five open-ended commuting questions', {left:74,top:591,width:950,height:35},22,'#1F6F8B','IBM Plex Sans');
note(survey,researchNote);
research(orig[2],'01  EMPATHIZE','What commuters experience','59.5% (44/74) mentioned waiting or ride availability\n\n31.1% (23/74) mentioned traffic or road congestion\n\n27.0% (20/74) mentioned crowding or seat availability\n\n17.6% (13/74) mentioned weather or heat',24);
orig[2].shapes.items.find(x=>x.id==='51').frame={left:72,top:280,width:750,height:305};
addText(orig[2],'Method note','Q3 themes overlap. One answer can mention several challenges.',{left:72,top:607,width:1035,height:31},17,'#1F6F8B','IBM Plex Sans');
note(orig[2],researchNote+' Interpretation: uncertain access to a ride creates stress even when students leave early.');
research(orig[3],'02  DEFINE','The problem to solve','MMSU student commuters need accessible,\nreliable transport information to decide\nwhen to leave and which ride to take.\n\n59.5% described waiting or availability problems.\n28.4% (21/74) wanted transport information,\ntracking or arrival information.\n\nHow might we make commute decisions clearer?',25);
note(orig[3],researchNote+' 59.5% uses Q3 waiting/availability code. 28.4% uses Q5 information code. Problem statement is the team’s synthesis, not a direct survey item.');
research(orig[4],'03  IDEATE','Ideas for the IT solution','28.4% wanted transport information (21/74).\nChosen concept: MMSU CommuteHub.\n\nWaiting and full rides: tracking and seat status\nTraffic and weather: reports and alerts\nUncertain timing: departure planning\nMultiple rides: routes, stops and fare estimates',25);
note(orig[4],researchNote+' The feature mapping is a design proposal, not evidence of measured app effectiveness. Information themes include availability, schedules, tracking, traffic updates and arrival or travel-time information. Ideas such as fixed schedules or more vehicles also require operator participation.');
research(orig[5],'04  PROTOTYPE','Feedback and improvements','Positive feedback\nAccurate route navigation and organized UI\nSmooth flow with clear step-by-step actions\n\nSuggested improvements\nAdd other notable stops\nAdd a clearer jeep location indicator',25);
addText(orig[5],'Feedback note','Qualitative prototype feedback. Evaluator count was not supplied.',{left:72,top:607,width:1035,height:31},17,'#1F6F8B','IBM Plex Sans');
note(orig[5],'Source: 195ppt.pdf, pages 2–3. The document reports positive feedback on route navigation, UI organization, navigation flow and step-by-step actions, plus requests for more notable stops and an indicator of the jeep whereabouts. No evaluator sample size, raw evaluation responses, or percentages were supplied. These are documented qualitative findings, not results calculated from the 74-response needs survey. Proposed actions: expand the stop list and clarify the vehicle marker and status on the tracking screen.');
research(orig[6],'FINAL APP','MMSU CommuteHub','A mobile app for MMSU student commuters\n\nFind routes, pickup points and fare estimates\nPlan departures and review trips\nRead community reports and alerts\n\nVehicle movement and arrival estimates\nare simulated in this build.',25);
note(orig[6],'Source: supplied presentation, system design and app demo slides. Vehicle movement is simulated. Screens in this section show the demonstrated app build, not a validated live transport service.');
for(const s of orig.slice(7,18)){
 text(s,'49','FINAL APP');
 note(s,'Source: MMSU-CommuteHub-Sequence-Final.pptx, corresponding app feature slide. Template artwork retained. Describe and demonstrate only the supported behavior in this build. Tracking, availability and arrival values are simulated, not verified live vehicle data.');
}
text(orig[18],'51','Questions and answers\n\nResearch, design choices and the app');
// Keep the template footer placement, with consistent slide numbers.
for(let i=0;i<order.length;i++){
 const s=order[i];
 const footer=s.shapes.items.find(x=>x.frame.top===653 && x.frame.width===1000);
 const number=s.shapes.items.find(x=>x.frame.top===653 && x.frame.width===40);
 if(footer)footer.text='MMSU CommuteHub';
 if(number)number.text=String(i+1).padStart(2,'0');
}
await fs.mkdir(root+'/.presentation-build/rendered',{recursive:true});
for(let i=0;i<order.length;i++){
 const b=await order[i].export({format:'png',scale:1});
 await fs.writeFile(root+`/.presentation-build/rendered/slide-${String(i+1).padStart(2,'0')}.png`,new Uint8Array(await b.arrayBuffer()));
}
await fs.writeFile(root+'/.presentation-build/final-montage.webp',new Uint8Array(await (await p.export({format:'webp',montage:true})).arrayBuffer()));
await (await PresentationFile.exportPptx(p)).save(root+'/.presentation-build/candidate.pptx');
const SKILL='/Users/jeiwinfrey/.codex/plugins/cache/openai-primary-runtime/presentations/26.1105.12137/skills/presentations';
const {finalizePresentation}=await import(pathToFileURL(SKILL+'/container_tools/artifact_tool_utils.mjs').href);
const result=await finalizePresentation({workspaceDir:root,candidatePath:root+'/.presentation-build/candidate.pptx',finalPath:root+'/output/presentations/MMSU-CommuteHub-Design-Thinking.pptx',pythonExecutable:'/Users/jeiwinfrey/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3',integrityValidatorPath:SKILL+'/container_tools/inspect_presentation_package_integrity.py',layoutValidatorPath:SKILL+'/container_tools/inspect_presentation_layout_geometry.py',layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-heading-fit'],explicitTotalSlideCount:21,fontPolicy:{basis:'reference',families:['Source Serif 4','IBM Plex Sans'],referencePath:'/Users/jeiwinfrey/Downloads/MMSU-CommuteHub-Sequence-Final.pptx',referenceSha256:createHash('sha256').update(await fs.readFile('/Users/jeiwinfrey/Downloads/MMSU-CommuteHub-Sequence-Final.pptx')).digest('hex')},verifyArtifactToolImport:true,receiptPath:root+'/.presentation-build/validation.json'});
console.log(JSON.stringify(result));
