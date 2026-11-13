#!/usr/bin/env python3
"""Render an original narrated explainer with an original instrumental score.
Requires Python pillow/fonttools/brotli/numpy, piper-tts, and ffmpeg/ffprobe.
Run from the repository root. DECISIO_VIDEO_CACHE controls temporary assets;
DECISIO_NARRATOR_MODEL names the local en_US-ljspeech-high ONNX model.
The model card is rhasspy/piper-voices, en/en_US/ljspeech/high/MODEL_CARD;
its LJ Speech training recordings are public domain. Fetch weights separately.
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
W,H,FPS,DURATION,SR=1280,720,24,96,48000
BG,SURFACE,INK,MUTED,LINE,GOLD,BLUE='#03050a','#0b1221','#f3f7ff','#b7c7dc','#3c4b63','#ffb000','#a9caef'
CHAPTERS=[('One more ticket. Another model read.',
  'One customer. Two charges. Your application asks the model which team should handle the ticket. The '
  'answer is billing.'),
 ('Same answer. A much shorter route.',
  'A small CPU fast path can return familiar answers. For short texts, embedding and classification take '
  'about fifty microseconds.'),
 ('New wording. A familiar decision.',
  'Different words can lead to the same decision. A learned classifier recognizes the recurring task, beyond '
  'exact text repeats.'),
 ('Unfamiliar? Keep decisio in the loop.',
  'Not every request qualifies. Pass those requests to decisio. The model stays available, and the '
  'application keeps its answer interface.'),
 ('First, learn from examples.',
  'Teach from human-labelled requests, or collect model answers. These examples train a small candidate for '
  'one recurring decision.'),
 ('Check it before it answers.',
  'Check separate examples and the saving on your host. Activate only a candidate that qualifies. Otherwise, '
  'keep the model path.'),
 ('Keep the rules. Send the new facts.',
  'Register shared rules once as context. Send changing facts as state. The classifier reads facts; the '
  'model gets both.'),
 ('Route support tickets as they arrive.',
  'Route recurring billing and access requests on the CPU. Keep unfamiliar support requests on the model '
  'path.'),
 ('Sort new posts as they arrive.',
  'Moderation works the same way. Keep the policy fixed, classify each new post, and send ambiguous cases to '
  'the model.'),
 ('Check each return against the policy.',
  'For refunds, keep the policy fixed. Send delivery age and item condition. Answer yes or no; pass '
  'exceptions on.'),
 ('Keep the same task. Send fresh facts.',
  'Register the task, shared context and fast table option. Ask with the same task identifier and new '
  'facts.'),
 ('Give recurring decisions a fast path.',
  'Let familiar decisions take the shorter route. Keep the model for everything else. Start with one task, '
  'and see what qualifies.')]
SHORT=['A recurring request. A familiar answer.','About 50 µs of short-text CPU work.','Different words can lead to the same choice.','The model stays available for the rest.','Human labels, or examples supplied by the model.','Certify. Time. Activate only if qualified.','Fixed context. Changing state.','Your support inbox, with a faster route.','One shared policy. A stream of new posts.','The same policy. Different return facts.','Enable fast_table. Keep asking your task.','Start with one recurring choice or yes/no task.']
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
 i=min(11,int(t//8));u=t-i*8;title,narration=CHAPTERS[i]
 im=Image.new('RGB',(W,H),BG);d=ImageDraw.Draw(im)
 text(d,(64,30),'Decisio',27,INK,True);text(d,(960,36),f'Decision fast path · {i+1}/12',19,MUTED)
 d.line((64,82,1216,82),fill=LINE,width=1)
 size=52
 while d.textlength(title,font=font(size,True))>1152:size-=1
 text(d,(64,116),title,size,INK,True)
 if i==0:
  ticket(d,EXAMPLES['support']['cases'][0]['text'],'billing',u,False)
  text(d,(870,244),'Model read',25,MUTED);text(d,(870,294),f'~{min(50,int(u*15)):02} ms',62,BLUE,True)
  text(d,(872,383),'Illustrative budget',22,MUTED)
  arrow(d,(794,354),(850,354),BLUE);packet(d,(794,354),(850,354),min(1,u/3),BLUE)
 elif i==1:
  ticket(d,EXAMPLES['support']['cases'][0]['text'],'billing',u,True)
  text(d,(870,244),'CPU fast path',25,MUTED);text(d,(870,294),'~50 µs',62,GOLD,True)
  text(d,(872,383),'Model read skipped',24,GOLD,True)
  arrow(d,(794,354),(850,354));packet(d,(794,354),(850,354),min(1,u/.5))
  text(d,(64,515),'Published static p50: 0.05 ms for short texts. Longer texts cost more.',21,MUTED)
 elif i in (2,7,8):inbox(d,'support' if i in (2,7) else 'moderation',u)
 elif i==3:
  ticket(d,EXAMPLES['support']['cases'][3]['text'],'Pass to decisio',u,False)
  box(d,(905,260,1216,474),True);text(d,(931,288),'decisio model',29,BLUE,True)
  wrap(d,'Reads policy + facts',931,356,260,27,MUTED)
  arrow(d,(795,355),(883,355),BLUE);packet(d,(795,355),(883,355),min(1,max(0,u-2)/2),BLUE)
  text(d,(64,519),'One task. Two routes. The same typed-answer interface.',27,INK,True)
 elif i==4:
  box(d,(64,230,805,530));text(d,(88,251),'Examples supplied by people or the model',23,MUTED)
  for j,c in enumerate(EXAMPLES['support']['cases'][:3]):
   if u<j+1:continue
   text(d,(88,310+j*64),c['text'][:43],25);pill(d,635,303+j*64,c['answer'])
  arrow(d,(825,382),(900,382));packet(d,(825,382),(900,382),(u%2)/2)
  text(d,(929,252),'Small candidate',29,GOLD,True)
  if u>3:
   for row in range(7):
    for col in range(10):
     x=932+col*23;y=310+row*23
     d.rounded_rectangle((x,y,x+17,y+17),radius=3,fill=GOLD if (row*7+col*3)%5<3 else LINE)
 elif i==5:
  for j,(label,sub) in enumerate([('Fit','Learn from one set'),('Certify + time','Check separate examples'),('Activate','Only if qualified')]):
   x=64+j*395;box(d,(x,244,x+362,494),j==min(2,int(u/2.2)))
   text(d,(x+24,270),label,33,GOLD if j==min(2,int(u/2.2)) else INK,True)
   wrap(d,sub,x+24,345,310,29,MUTED)
  text(d,(64,530),'Does not qualify? Keep the model path.',28,BLUE,True)
 elif i==6:
  box(d,(64,230,595,508),True);text(d,(88,255),'context · fixed support policy',26,GOLD,True)
  wrap(d,'Billing handles payments and invoices. Access handles sign-in problems.',88,320,480,31)
  box(d,(687,230,1216,508));text(d,(711,255),'state · new ticket facts',26,BLUE,True)
  c=EXAMPLES['support']['cases'][min(2,int(u/2.5))]
  wrap(d,c['text'],711,320,470,31)
  text(d,(64,545),'CPU: state only. Model: context + state.',29,INK,True)
 elif i==9:
  box(d,(64,225,880,554));text(d,(88,244),'Example policy: unopened home items, within 30 days',24,MUTED)
  for j,(days,condition,result) in enumerate([('12 days','Unopened','yes'),('45 days','Opened','no'),('8 days','Unopened','yes'),('Exception','Special agreement','Ask decisio')]):
   if u<j*1.2+.3:continue
   y=302+j*60;text(d,(88,y),days,26);text(d,(300,y),condition,26);pill(d,650,y-3,result,BLUE if j==3 else GOLD)
  text(d,(932,255),'Refund eligible?',30,GOLD,True);wrap(d,'Yes, no, or pass the exception to decisio.',932,332,270,29,MUTED)
 elif i==10:
  box(d,(64,230,665,535));text(d,(90,253),'Task registration',25,MUTED)
  text(d,(90,318),'"fast_table": true',42,GOLD,True)
  text(d,(90,399),'Your task id + shared context',26)
  text(d,(90,459),'Examples + certification settings',24,MUTED)
  for j,s in enumerate(['Register the task','Send new state','Read the typed answer']):
   if u<j*1.3+.4:continue
   text(d,(754,275+j*86),str(j+1),28,GOLD,True);text(d,(800,275+j*86),s,29)
 elif i==11:
  text(d,(64,241),'Decisio',78,INK,True)
  wrap(d,'Familiar decisions take the fast path. The model handles the rest.',64,350,710,40,INK,True)
  text(d,(64,511),'opendecisio.com/docs/tasks/fast-table/',25,GOLD)
  box(d,(940,256,1216,500),True);text(d,(971,300),'~50 µs',48,GOLD,True);wrap(d,'Static short-text path',971,383,218,25,MUTED)
 text(d,(64,606),SHORT[i],29,INK,True)
 text(d,(64,654),'Illustration · motion slowed for explanation · static short-text cost reference · model budget varies by host',17,MUTED)
 for j in range(12):
  x=64+j*97;d.rounded_rectangle((x,703,x+80,707),radius=2,fill=GOLD if j<=i else LINE)
 if i>0 and u<.22:im=Image.blend(frame(i*8-.001),im,u/.22)
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
 for bar in range(48):
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
 voice=np.zeros(DURATION*SR,dtype=np.float32)
 for i,(_,line) in enumerate(CHAPTERS):
  narrated=CACHE/f'narration-open-{i:02}.wav'
  model=Path(os.environ.get('DECISIO_NARRATOR_MODEL',str(CACHE/'en_US-ljspeech-high.onnx')))
  if not model.exists():raise RuntimeError('Set DECISIO_NARRATOR_MODEL to the downloaded narration model')
  subprocess.run([sys.executable,'-m','piper','--model',str(model),'--output_file',str(narrated)],input=line,text=True,check=True,stdout=subprocess.DEVNULL)
  seconds=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(narrated)]))
  rate=max(1,seconds/7.2)
  raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(narrated),'-af',f'atempo={rate:.6f},afade=t=in:d=0.04','-ar',str(SR),'-ac','1','-f','f32le','pipe:1'])
  samples=np.frombuffer(raw,dtype=np.float32);peak=max(.01,float(np.max(np.abs(samples))))
  samples=samples/peak*.42;start=int((i*8+.35)*SR);length=min(len(samples),len(voice)-start)
  voice[start:start+length]=samples[:length]
  print(f'narration: {i+1}/12',flush=True)
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
for i in range(12):frame(i*8+5).save(CACHE/f'chapter-{i+1}.png')
assets={p.suffix[1:]:{'path':'/media/'+p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in [video,poster,vtt]}
meta={'title':'Give recurring decisions a fast path','duration':DURATION,'width':W,'height':H,'fps':FPS,'silent':False,'hasMusic':True,'hasNarration':True,'narration':{'model':'en_US-ljspeech-high','modelSource':'https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/ljspeech/high','trainingData':'LJ Speech, public domain','trainingDataSource':'https://keithito.com/LJ-Speech-Dataset/'},'timingSha256':hashlib.sha256((ROOT/'src/data/fast-path-timing.json').read_bytes()).hexdigest(),'examplesSha256':hashlib.sha256((ROOT/'src/data/fast-path-examples.json').read_bytes()).hexdigest(),'assets':assets,'chapters':[{'start':i*8,'end':(i+1)*8,'title':title,'text':line} for i,(title,line) in enumerate(CHAPTERS)]}
(ROOT/'src/data/fast-path-film.json').write_text(json.dumps(meta,indent=2,ensure_ascii=False)+'\n')
print(f'render: complete, {video.stat().st_size:,} bytes, narration + original 120 BPM score',flush=True)
