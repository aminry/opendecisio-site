#!/usr/bin/env python3
"""Render the 40-second explainer, Kokoro narration and an original score.
Requires pillow/fonttools/brotli/numpy/kokoro-onnx and ffmpeg/ffprobe.
DECISIO_VIDEO_CACHE holds intermediates. DECISIO_NARRATOR_DIR holds the
separately downloaded kokoro-v1.0.onnx and voices-v1.0.bin weights.
Kokoro model: Apache-2.0. kokoro-onnx runtime: MIT.
"""
from pathlib import Path
import hashlib, json, math, os, subprocess, sys, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
ROOT=Path.cwd();CACHE=Path(os.environ.get('DECISIO_VIDEO_CACHE',str(Path.home()/'.cache/decisio-video')))
CACHE.mkdir(parents=True,exist_ok=True);OUT=ROOT/'public/media';OUT.mkdir(parents=True,exist_ok=True)
BUDGET=json.loads((ROOT/'src/data/fast-path-timing.json').read_text())
EXAMPLES=json.loads((ROOT/'src/data/fast-path-examples.json').read_text())
W,H,FPS,DURATION,SR=1280,720,24,40,48000
BG,SURFACE,INK,MUTED,LINE,GOLD,BLUE='#03050a','#0b1221','#f3f7ff','#b7c7dc','#3c4b63','#ffb000','#a9caef'
CHAPTERS=[
 ('One ticket. Two ways to answer.',
  "Here's a ticket we've seen before: I was charged twice. It needs billing. Do we need another model read?"),
 ('Familiar request? Take the fast path.',
  "The fast path learns that choice. Short-text CPU work takes about fifty microseconds, skipping the model read."),
 ('Something unfamiliar? Ask decisio.',
  "A request that doesn't qualify goes to decisio. So the model stays available for the cases that need it."),
 ('Keep the policy. Send new facts.',
  "Save your shared policy as context. Send just the facts that change. When needed, the model can still read both."),
 ('Teach. Check. Then switch it on.',
  "Teach with examples. Check separate examples and time savings. If it qualifies, switch the fast path on.")]
SHORT=['Same task. Same answer. Different cost.','~50 µs CPU work · ~50 ms illustrative model budget','CPU check + model read ~50.05 ms in this example','CPU reads facts. Model reads policy + facts.','Start with one choice or yes/no task.']
for weight in (400,650):
 p=CACHE/f'geist-{weight}.ttf'
 if not p.exists():
  f=TTFont(ROOT/'node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2')
  f=instantiateVariableFont(f,{'wght':weight},inplace=True);f.flavor=None;f.save(p)
FONTS={}
def font(n,b=False):
 if (n,b) not in FONTS:FONTS[n,b]=ImageFont.truetype(str(CACHE/f'geist-{650 if b else 400}.ttf'),n)
 return FONTS[n,b]
def text(d,xy,s,n=26,color=INK,b=False):d.text(xy,s,font=font(n,b),fill=color)
def wrap(d,s,x,y,w,n=26,color=INK,b=False):
 line=''
 for word in s.split():
  trial=(line+' '+word).strip()
  if d.textlength(trial,font=font(n,b))>w and line:text(d,(x,y),line,n,color,b);y+=n*1.3;line=word
  else:line=trial
 if line:text(d,(x,y),line,n,color,b);y+=n*1.3
 return y
def box(d,r,accent=False):d.rounded_rectangle(r,radius=14,fill=SURFACE,outline=GOLD if accent else LINE,width=2)
def arrow(d,a,b,color=GOLD):
 d.line([a,b],fill=color,width=3);angle=math.atan2(b[1]-a[1],b[0]-a[0])
 for delta in [-.6,.6]:d.line([b,(b[0]-13*math.cos(angle+delta),b[1]-13*math.sin(angle+delta))],fill=color,width=3)
def packet(d,a,b,p,color=GOLD):
 x=a[0]+(b[0]-a[0])*p;y=a[1]+(b[1]-a[1])*p;d.ellipse((x-6,y-6,x+6,y+6),fill=color)
def pill(d,x,y,label,color=GOLD):
 size=d.textlength(label,font=font(23,True));d.rounded_rectangle((x,y,x+size+28,y+41),radius=18,fill=color);text(d,(x+14,y+5),label,23,BG,True)
def ticket(d,message,answer,u,fast=True):
 box(d,(64,230,780,472));text(d,(88,252),'Incoming support ticket',22,MUTED)
 wrap(d,'“'+message+'”',88,302,658,37,INK,True)
 if u>2:pill(d,88,410,answer,GOLD if fast else BLUE)
def inbox(d,domain,u):
 task=EXAMPLES[domain];box(d,(64,225,880,554));text(d,(88,244),task['label'],22,MUTED)
 for i,c in enumerate(task['cases']):
  if u<i*1.2+.3:continue
  y=291+i*62+max(0,18*(1-min(1,(u-i*1.2-.3)/.35)))
  message=c['text'];n=24
  while d.textlength(message,font=font(n))>510 and len(message)>12:message=message[:-2]
  if message!=c['text']:message+='…'
  text(d,(88,y),message,n)
  pill(d,650,y-2,c['answer'],GOLD if c['route']=='table' else BLUE)
  d.line((88,y+48,855,y+48),fill=LINE,width=1)
 text(d,(935,246),'Answer route',23,MUTED)
 current=task['cases'][min(3,int(max(0,u-.3)/1.2))]
 wrap(d,'CPU fast path' if current['route']=='table' else 'decisio model',935,296,280,36,GOLD if current['route']=='table' else BLUE,True)
 wrap(d,'Model read skipped' if current['route']=='table' else 'Model handles this one',935,402,270,26,MUTED)
def frame(t):
 i=min(4,int(t//8));u=t-i*8;title,_=CHAPTERS[i]
 im=Image.new('RGB',(W,H),BG);d=ImageDraw.Draw(im)
 text(d,(64,30),'Decisio',27,INK,True);text(d,(980,36),f'Decision fast path · {i+1}/5',19,MUTED)
 d.line((64,82,1216,82),fill=LINE,width=1)
 size=50
 while d.textlength(title,font=font(size,True))>1152:size-=1
 text(d,(64,116),title,size,INK,True)
 # Each scene starts with one clear arrival, then holds the outcome for reading.
 reveal=min(1,u/.55);dy=int(20*(1-reveal))
 if i in (0,1,2):
  message=EXAMPLES['support']['cases'][3 if i==2 else 0]['text']
  r=(64,216+dy,1216,340+dy);box(d,r,u<.8)
  text(d,(88,235+dy),'NEW REQUEST 02' if i==2 else 'REQUEST 01 · SUPPORT ROUTING',20,GOLD,True)
  wrap(d,'“'+message+'”',88,273+dy,1080,31,INK,True)
  active=0 if i==1 else 1
  for j,(label,number,note) in enumerate([('CPU fast path','~50 µs','0.05 ms · short texts'),('decisio model','~50 ms','Illustrative model budget')]):
   x=64+j*592;selected=u>1.5 and (j==active or i==0)
   box(d,(x,395,x+560,563),selected)
   if selected:d.rounded_rectangle((x+1,396,x+559,562),radius=14,outline=GOLD,width=4)
   text(d,(x+24,411),label,24,MUTED)
   text(d,(x+24,449),number,46,GOLD if selected else INK,True)
   text(d,(x+24,517),note,21,MUTED)
   # Shared, slowed clock: CPU finishes first; model budget keeps filling.
   progress=min(1,max(0,(u-1)/(.12 if j==0 else 3.5)))
   d.line((x+24,549,x+536,549),fill=LINE,width=4)
   if progress:d.line((x+24,549,x+24+int(512*progress),549),fill=GOLD if j==0 else BLUE,width=4)
   if selected and u>2:pill(d,x+350,449,'billing' if i!=2 else 'Model',GOLD)
  if i==1 and u>2:text(d,(680,574),'Model read skipped',23,GOLD,True)
  if i==2 and u>2:text(d,(64,574),'Unfamiliar request passed to decisio',23,BLUE,True)
  if u>1:
   arrow(d,(342,348),(342 if i==1 else 930,387))
   packet(d,(342,348),(342 if i==1 else 930,387),min(1,(u-1)/.7))
   if i==0:arrow(d,(342,348),(342,387))
 elif i==3:
  box(d,(64,226,608,520));text(d,(88,251),'CONTEXT · REGISTERED ONCE',22,MUTED,True)
  wrap(d,'Billing handles payments and invoices. Access handles sign-in problems.',88,309,492,32,INK,True)
  pill(d,88,455,'Policy stays fixed',BLUE)
  index=min(2,int(u/2.7));box(d,(654,226,1216,520),True)
  text(d,(678,251),f'NEW FACTS · TICKET {index+1}/3',22,GOLD,True)
  wrap(d,EXAMPLES['support']['cases'][index]['text'],678,309,508,32,INK,True)
  text(d,(678,463),'Only this card changes',23,GOLD)
  # A restrained moving underline marks each new facts card.
  progress=(u%2.7)/2.7;d.line((678,503,678+int(508*(1-progress)),503),fill=GOLD,width=3)
 elif i==4:
  for j,(label,sub) in enumerate([('1. Teach','Human labels or model answers'),('2. Check','Separate examples + host timing'),('3. Activate','Only if the candidate qualifies')]):
   x=64+j*394;selected=j==min(2,int(u/2))
   box(d,(x,244,x+364,476),selected)
   text(d,(x+24,276),label,37,GOLD if selected else INK,True)
   wrap(d,sub,x+24,354,310,28,MUTED)
  text(d,(64,521),'opendecisio.com/docs/tasks/fast-table/',29,GOLD,True)
 text(d,(64,620),SHORT[i],28,INK,True)
 text(d,(64,665),'Illustration · motion slowed · static short-text component cost · network and queueing excluded',18,MUTED)
 for j in range(5):
  x=64+j*235;d.rounded_rectangle((x,703,x+215,707),radius=2,fill=GOLD if j<=i else LINE)
 if i>0 and u<.2:im=Image.blend(frame(i*8-.001),im,u/.2)
 return im

def add_score():
 """Compose an original 120 BPM instrumental; no sampled or third-party audio."""
 n=DURATION*SR;out=np.zeros((n,2),dtype=np.float32);rng=np.random.default_rng(48213)
 def add(start,sample,level=1,pan=0):
  k=int(start*SR);length=min(len(sample),n-k)
  if length<=0:return
  out[k:k+length,0]+=sample[:length]*level*math.sqrt((1-pan)/2)
  out[k:k+length,1]+=sample[:length]*level*math.sqrt((1+pan)/2)
 def tone(midi,duration,kind='soft'):
  t=np.arange(int(duration*SR),dtype=np.float32)/SR;f=440*2**((midi-69)/12)
  sig=np.sin(2*np.pi*f*t)+.22*np.sin(4*np.pi*f*t)+.09*np.sin(6*np.pi*f*t)
  env=np.minimum(1,t/.012)*np.minimum(1,(duration-t)/.08)
  env*=np.exp(-t*(4.5 if kind=='pluck' else .8))
  return (sig*env).astype(np.float32)
 chords=[[57,60,64],[53,57,60],[48,52,55],[55,59,62]]
 for bar in range(DURATION//2):
  start=bar*2;chord=chords[bar%4];energy=.65 if bar<4 else .85 if bar<8 else 1
  if 20<=bar<24:energy=.58
  for note in chord:add(start,tone(note,2.1),.035*energy,-.25 if note%2 else .25)
  for step in range(8):
   note=chord[step%3]+12+(12 if step==7 else 0)
   add(start+step*.25,tone(note,.45,'pluck'),.035*energy,.5 if step%2 else -.5)
  if bar>=4:
   for beat in range(4):add(start+beat*.5,tone(chord[0]-12,.42,'pluck'),.13*energy)
  for beat in range(4):
   t=np.arange(int(.32*SR),dtype=np.float32)/SR
   kick=np.sin(2*np.pi*(45*t+75*(1-np.exp(-t*28))/28))*np.exp(-t*16)
   add(start+beat*.5,kick,.32*energy)
   if beat%2:
    tt=np.arange(int(.18*SR),dtype=np.float32)/SR;noise=rng.standard_normal(len(tt)).astype(np.float32)
    snare=(noise*.45+np.sin(2*np.pi*180*tt)*.25)*np.exp(-tt*24)
    add(start+beat*.5,snare,.11*energy,.1)
  if bar>=2:
   for step in range(8):
    tt=np.arange(int(.07*SR),dtype=np.float32)/SR;noise=rng.standard_normal(len(tt)).astype(np.float32);noise=np.diff(noise,prepend=0)
    add(start+step*.25,noise*np.exp(-tt*90),.025*energy,.4 if step%2 else -.4)
 # Fade in gently; resolve cleanly rather than ending in the middle of a bar.
 out[:SR]*=np.linspace(0,1,SR)[:,None];out[-3*SR:]*=np.linspace(1,0,3*SR)[:,None]
 return out

def narrated_audio():
 from kokoro_onnx import Kokoro
 narrator=Path(os.environ.get('DECISIO_NARRATOR_DIR',str(CACHE)))
 kokoro=Kokoro(str(narrator/'kokoro-v1.0.onnx'),str(narrator/'voices-v1.0.bin'))
 voice=np.zeros(DURATION*SR,dtype=np.float32)
 for i,(_,line) in enumerate(CHAPTERS):
  samples,rate=kokoro.create(line,voice='af_heart',speed=1.0,lang='en-us',sentence_pause=.3,clause_pause=.12)
  seconds=len(samples)/rate
  if seconds>7.5:raise RuntimeError(f'Scene {i+1} narration is {seconds:.2f}s; shorten its wording')
  samples=np.interp(np.arange(round(seconds*SR))*rate/SR,np.arange(len(samples)),samples).astype(np.float32)
  peak=max(.01,float(np.max(np.abs(samples))));samples=samples/peak*.42
  start=int((i*8+.25)*SR);voice[start:start+len(samples)]=samples
  narrated=CACHE/f'narration-{i+1}.wav'
  with wave.open(str(narrated),'wb') as w:
   w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes((samples*32767).astype('<i2').tobytes())
  print(f'narration: {i+1}/5 · {seconds:.2f}s',flush=True)
 score=add_score()
 # Keep music audible between phrases and below the voice while it speaks.
 window=SR//10;levels=np.repeat([np.max(np.abs(voice[j:j+window])) for j in range(0,len(voice),window)],window)[:len(voice)]
 duck=np.where(levels>.02,.34,.6).astype(np.float32)
 mixed=score*duck[:,None]+voice[:,None]*.9
 mixed/=max(1,float(np.max(np.abs(mixed)))/.92)
 audio=CACHE/'soundtrack.wav'
 with wave.open(str(audio),'wb') as w:
  w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((mixed*32767).astype('<i2').tobytes())
 return audio

audio=narrated_audio();video=OUT/'decision-fast-path.mp4'
proc=subprocess.Popen(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','rawvideo','-pixel_format','rgb24','-video_size',f'{W}x{H}','-framerate',str(FPS),'-i','pipe:0','-i',str(audio),'-c:v','libx264','-preset','medium','-crf','21','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-af','loudnorm=I=-16:TP=-1.5:LRA=9','-ar',str(SR),'-movflags','+faststart','-t',str(DURATION),str(video)],stdin=subprocess.PIPE)
try:
 for j in range(DURATION*FPS):
  proc.stdin.write(frame(j/FPS).tobytes())
  if j%(FPS*8)==0:print(f'render: {j//FPS}/{DURATION}s',flush=True)
 proc.stdin.close();code=proc.wait()
 if code:raise RuntimeError(f'ffmpeg exit {code}')
except BaseException:proc.stdin.close();proc.wait();raise
poster=OUT/'decision-fast-path.webp';frame(10.8).save(poster,'WEBP',quality=90)
def stamp(s):return f'00:{s//60:02}:{s%60:02}.000'
vtt=OUT/'decision-fast-path.vtt'
vtt.write_text('WEBVTT\n\n'+'\n\n'.join(f'{stamp(i*8)} --> {stamp((i+1)*8)}\n'+('[Upbeat instrumental music]\n' if i==0 else '')+line for i,(_,line) in enumerate(CHAPTERS))+'\n')
for i in range(5):frame(i*8+5).save(CACHE/f'chapter-{i+1}.png')
assets={p.suffix[1:]:{'path':'/media/'+p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in [video,poster,vtt]}
meta={'title':'Give recurring decisions a fast path','duration':DURATION,'width':W,'height':H,'fps':FPS,'silent':False,'hasMusic':True,'hasNarration':True,'narration':{'model':'Kokoro v1.0','voice':'af_heart','modelLicense':'Apache-2.0','runtimeLicense':'MIT','modelSource':'https://huggingface.co/hexgrad/Kokoro-82M','runtimeSource':'https://github.com/thewh1teagle/kokoro-onnx'},'timingSha256':hashlib.sha256((ROOT/'src/data/fast-path-timing.json').read_bytes()).hexdigest(),'examplesSha256':hashlib.sha256((ROOT/'src/data/fast-path-examples.json').read_bytes()).hexdigest(),'assets':assets,'chapters':[{'start':i*8,'end':(i+1)*8,'title':title,'text':line} for i,(title,line) in enumerate(CHAPTERS)]}
(ROOT/'src/data/fast-path-film.json').write_text(json.dumps(meta,indent=2,ensure_ascii=False)+'\n')
print(f'render: complete, {video.stat().st_size:,} bytes, narration + original 120 BPM score',flush=True)
