let context,master;
export async function setSound(on){
 if(!on){if(master&&context)master.gain.setTargetAtTime(0,context.currentTime,.2);return;}
 if(!context){context=new(window.AudioContext||window.webkitAudioContext)();master=context.createGain();master.gain.value=0;master.connect(context.destination);
 [130.81,196,261.63,329.63].forEach((f,i)=>{const o=context.createOscillator(),g=context.createGain();o.type='sine';o.frequency.value=f;o.detune.value=i*2-3;g.gain.value=.035;o.connect(g).connect(master);o.start();const l=context.createOscillator(),d=context.createGain();l.frequency.value=.05+i*.013;d.gain.value=.009;l.connect(d).connect(g.gain);l.start();});}
 await context.resume();master.gain.setTargetAtTime(.55,context.currentTime,.5);
}
export function clickSound(enabled){if(!enabled||!context)return;const o=context.createOscillator(),g=context.createGain(),t=context.currentTime;o.frequency.setValueAtTime(660,t);o.frequency.exponentialRampToValueAtTime(440,t+.08);g.gain.setValueAtTime(.022,t);g.gain.exponentialRampToValueAtTime(.001,t+.1);o.connect(g).connect(context.destination);o.start();o.stop(t+.12);}
