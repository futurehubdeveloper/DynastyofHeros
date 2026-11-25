const $=id=>document.getElementById(id);
const menuToggle=document.querySelector('.menu-toggle');
menuToggle.addEventListener('click',()=>{
  const menu=document.querySelector('.site-menu');
  menuToggle.setAttribute('aria-expanded',String(menu.classList.toggle('open')));
});
const chapters=[{name:'Prologue',start:1,end:1},{name:'Episode 1 · The Prophecy',start:2,end:10},{name:'Episode 2 · The First Escape',start:11,end:18},{name:'Episode 3 · Shadows Over the Village',start:19,end:24},{name:'Episode 4 · The Price of Escape',start:25,end:34},{name:'Episode 5 · The Mountain Monastery',start:35,end:45}];
let episode=0,page=1,lang='en',readerMode='single',readerZoom=1;
try{const saved=JSON.parse(localStorage.getItem('doh_reader_v12')||'{}');if(saved.episode>=0&&saved.episode<chapters.length)episode=saved.episode;if(saved.lang==='mm')lang='mm';if(['single','double','scroll'].includes(saved.mode))readerMode=saved.mode;page=Math.min(chapters[episode].end,Math.max(chapters[episode].start,saved.page||chapters[episode].start))}catch(e){}
function persistReader(){try{localStorage.setItem('doh_reader_v12',JSON.stringify({episode,page,lang,mode:readerMode}))}catch(e){}}
function comicSrc(n){return 'assets/comic/'+lang+'/'+String(n).padStart(2,'0')+'.webp'}
function refreshComicLanding(){
  for(const [id,locale] of [['comicEN','en'],['comicMM','mm']]){
    const button=$(id);
    button.classList.toggle('active',lang===locale);
    button.setAttribute('aria-pressed',String(lang===locale));
  }
  document.querySelectorAll('[data-comic-preview]').forEach(img=>{
    const src=comicSrc(Number(img.dataset.comicPreview));
    if(img.getAttribute('src')!==src)img.src=src;
  });
  document.querySelector('.comic-resume').hidden=page===1;
}
refreshComicLanding();
function renderThumbs(){const c=chapters[episode],cont=$('readerThumbs');cont.replaceChildren();for(let n=c.start;n<=c.end;n++){const b=document.createElement('button');b.type='button';b.title=c.name+' page '+(n-c.start+1);b.setAttribute('aria-label',b.title);b.className=(n===page||(readerMode==='double'&&n===page+1))?'selected':'';const im=document.createElement('img');im.src=comicSrc(n);im.alt='';im.loading='lazy';const label=document.createElement('b');label.textContent=String(n-c.start+1);b.append(im,label);b.onclick=()=>{page=n;renderReader()};cont.append(b)}}
function renderReader(){const c=chapters[episode];page=Math.min(c.end,Math.max(c.start,page));const view=$('readerPage');view.replaceChildren();view.className='reader-page mode-'+readerMode;view.style.setProperty('--reader-zoom',String(readerZoom));const pageList=readerMode==='scroll'?Array.from({length:c.end-c.start+1},(_,i)=>c.start+i):readerMode==='double'?[page,Math.min(page+1,c.end)].filter((n,i,a)=>a.indexOf(n)===i):[page];for(const n of pageList){const img=document.createElement('img');img.src=comicSrc(n);img.alt=c.name+' — page '+(n-c.start+1)+' of '+(c.end-c.start+1);img.loading=n===page?'eager':'lazy';if(readerMode==='double'){const slot=document.createElement('div');slot.className='page-slot';slot.append(img);view.append(slot)}else view.append(img)}$('readerCounter').textContent=(page-c.start+1)+' / '+(c.end-c.start+1)+' · '+lang.toUpperCase();$('readerBottomCounter').textContent='Episode page '+(page-c.start+1)+' · Volume page '+page+' / 45';$('readerLang').textContent=(lang==='en'?'EN':'MM')+' ⇄ '+(lang==='en'?'MM':'EN');$('readerEpisode').value=String(episode);$('readerChapterTitle').textContent=c.name;$('prevPage').disabled=page===c.start;$('nextPage').disabled=page===c.end;document.querySelectorAll('[data-reading-mode]').forEach(b=>b.classList.toggle('selected',b.dataset.readingMode===readerMode));refreshComicLanding();renderThumbs();persistReader();if(readerMode==='scroll')view.scrollTop=0}
function openReader(e=null){if(e!==null){episode=+e;page=chapters[episode].start}$('reader').classList.add('open');renderReader();$('closeReader').focus()}
$('comicOpen').onclick=()=>{
  const entrance=$('comicEntrance');
  if(!entrance.hidden)return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){
    openReader(0);
    $('closeReader').focus();
    return;
  }
  $('comicEntrancePage').src=comicSrc(1);
  entrance.hidden=false;
  $('comicSkip').focus();
  function finish(){
    clearTimeout(fallback);
    $('comicSkip').onclick=null;
    entrance.querySelector('.comic-entrance-book').removeEventListener('animationend',onFinish);
    openReader(0);
    entrance.hidden=true;
    $('comicSkip').onkeydown=null;
    $('closeReader').focus();
  }
  function onFinish(event){
    if(event.animationName==='comic-enter')finish();
  }
  entrance.querySelector('.comic-entrance-book').addEventListener('animationend',onFinish);
  const fallback=setTimeout(finish,3200);
  $('comicSkip').onclick=finish;
  $('comicSkip').onkeydown=event=>{
    if(event.key==='Tab')event.preventDefault();
    if(event.key==='Escape'){event.stopPropagation();finish();}
  };
};
document.querySelectorAll('[data-reader]').forEach(b=>b.onclick=()=>openReader());document.querySelectorAll('[data-episode]').forEach(b=>b.onclick=()=>openReader(b.dataset.episode));
$('closeReader').onclick=()=>$('reader').classList.remove('open');$('readerEpisode').onchange=e=>{episode=+e.target.value;page=chapters[episode].start;renderReader()};
$('prevPage').onclick=()=>{page=Math.max(chapters[episode].start,page-(readerMode==='double'?2:1));renderReader()};$('nextPage').onclick=()=>{page=Math.min(chapters[episode].end,page+(readerMode==='double'?2:1));renderReader()};
function setLang(x){lang=x;renderReader()}$('comicEN').onclick=()=>setLang('en');$('comicMM').onclick=()=>setLang('mm');$('readerLang').onclick=()=>setLang(lang==='en'?'mm':'en');
document.querySelectorAll('[data-reading-mode]').forEach(b=>b.onclick=()=>{readerMode=b.dataset.readingMode;readerZoom=1;renderReader()});
$('readerZoomIn').onclick=()=>{readerZoom=Math.min(2,Math.round((readerZoom+.15)*100)/100);renderReader()};$('readerZoomOut').onclick=()=>{readerZoom=Math.max(.7,Math.round((readerZoom-.15)*100)/100);renderReader()};$('readerFullscreen').onclick=()=>{const el=$('reader');if(document.fullscreenElement)document.exitFullscreen?.();else el.requestFullscreen?.().catch(()=>{})};

document.addEventListener('keydown',event=>{
  if(!$('reader').classList.contains('open'))return;
  if(event.key==='Escape')$('closeReader').click();
  if(event.target.matches('select,input,textarea'))return;
  if(event.key==='ArrowRight')$('nextPage').click();
  if(event.key==='ArrowLeft')$('prevPage').click();
});
