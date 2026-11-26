/* Dynasty of Heroes — full-screen character explorer.
   All character copy comes from editable characters-data.js.
   Portraits and backgrounds are separate from labels. No gold card frames. */
(() => {
  'use strict';
  const cast = Array.isArray(window.DOH_CAST) ? window.DOH_CAST : [];
  if (!cast.length) return;


  const preferred = {
    family: ['mg-kan','mg-kyan','pyin-sa','anawrahta','min-sithu','a-may-mya','nga-tint','nga-pyae-wa'],
    allies: ['nga-htoo','nga-than','nga-nyo','mae-pan','old-sayadaw','head-sayadaw'],
    paladins: ['nga-lone','nyaung-u-hpi','nga-htwe-yu'],
    military: ['army-general','army-soldiers','palace-guards','royal-commander','royal-soldiers']
  };
  const categoryDefs = [
    {id:'all',name:'ALL CHARACTERS',label:'THE PEOPLE OF PAGAN'},
    {id:'family',name:'FAMILY',label:'Family'},
    {id:'allies',name:'ALLIES & MENTORS',label:'CLOSEST ALLIES & MENTORS'},
    {id:'paladins',name:'THE THREE PALADINS',label:'HEROES OF PAGAN'},
    {id:'military',name:'MILITARY FORCES',label:'MILITARY FORCES'}
  ];
  const categoryLabel = Object.fromEntries(categoryDefs.map(g=>[g.id,g.label]));
  // The explorer combines the main hero and royal household in the Family filter.
  const roster = cast.map(c => c.group === 'main' ? {...c, group:'family'} : c);
  const desiredOrder = Object.values(preferred).flat();
  const sorted = roster.sort((a,b) => {
    const x = desiredOrder.indexOf(a.id), y = desiredOrder.indexOf(b.id);
    return (x < 0 ? Infinity : x) - (y < 0 ? Infinity : y);
  });
  const byId = new Map(sorted.map(c=>[c.id,c]));
  let group = 'all';
  let selectedId = byId.has(location.hash.slice(1)) ? location.hash.slice(1) : 'mg-kan';
  const $ = selector=>document.querySelector(selector);
  const img = $('#cs-figure');
  const echo = $('#cs-echo');
  const list = $('#cs-list');
  const filterContainer = $('#cs-filters');
  const stage = $('#cs-stage-main');

  const ids = {
    name:$('#cs-name'), subtitle:$('#cs-subtitle'), category:$('#cs-category'),
    index:$('#cs-index'), lead:$('#cs-lead'), story:$('#cs-story'),
    identity:$('#cs-identity'), personality:$('#cs-personality'),
    traits:$('#cs-traits'), count:$('#cs-count'), group:$('#cs-group-name')
  };

  // Dedicated closeups and full-body detail artwork have independent versions.
  // Replacing a portrait must not change the approved full-body image URL.
  const fullBodyVersions = {
    'army-general': '20261125-individual-art',
    'army-soldiers': '20261125-individual-art',
    'royal-commander': '20261125-individual-art',
    'royal-soldiers': '20261125-individual-art',
    'palace-guards': '20261125-individual-art',
    'nyaung-u-hpi': '20261125-individual-art',
    'nga-htwe-yu': '20261125-individual-art',
    'mg-kyan': '20261125-bow-portrait-restore',
    'nga-pyae-wa': '20261125-bow-portrait-restore',
    'nga-nyo': '20261125-relaxed-bow'
  };
  const portraitVersions = {
    ...fullBodyVersions,
    'mg-kyan': '20261125-dedicated-portraits',
    'nga-nyo': '20261125-dedicated-portraits',
    'old-sayadaw': '20261125-dedicated-portraits',
    'nyaung-u-hpi': '20261125-dedicated-portraits',
    'nga-htwe-yu': '20261125-dedicated-portraits',
    'army-general': '20261125-dedicated-portraits',
    'army-soldiers': '20261125-dedicated-portraits',
    'royal-commander': '20261125-dedicated-portraits',
    'royal-soldiers': '20261125-dedicated-portraits',
    'palace-guards': '20261125-dedicated-portraits'
  };
  const artworkVersion = (versions, id) => versions[id] ? '?v=' + versions[id] : '';
  function imageFor(person) {
    return 'assets/fullbody/' + person.id + '.webp' + artworkVersion(fullBodyVersions, person.id);
  }
  function thumbnailFor(person) {
    return 'assets/portraits/' + person.id + '.webp' + artworkVersion(portraitVersions, person.id);
  }
  function currentChoices(){
    return group === 'all' ? sorted : sorted.filter(c=>c.group===group);
  }
  const pad2 = x=>String(x).padStart(2,'0');

  // Category buttons are real HTML elements; never rasterized into the pictures.
  function drawCategories(){
    const frag=document.createDocumentFragment();
    categoryDefs.forEach(cat=>{
      const button=document.createElement('button');
      button.type='button';
      button.className='cs-filter';
      button.dataset.group=cat.id;
      button.textContent=cat.name;
      button.setAttribute('aria-pressed',String(group===cat.id));
      button.addEventListener('click',()=>{
        if(group===cat.id)return;
        group=cat.id;
        drawCategories();
        drawRoster();
        const next=currentChoices()[0];
        if(next)select(next.id,true);
      });
      frag.append(button);
    });
    filterContainer.replaceChildren(frag);
  }

  function makeItem(c){
    const button=document.createElement('button');
    button.type='button';
    button.className='cs-item';
    button.dataset.person=c.id;
    button.setAttribute('aria-label','View '+c.name);
    button.setAttribute('aria-pressed',String(c.id===selectedId));
    const imageBox=document.createElement('span');
    imageBox.className='cs-item__image';
    const image=document.createElement('img');
    image.src = thumbnailFor(c);
    image.alt = '';
    image.loading='lazy';
    image.onerror=()=>{image.onerror=null;image.src=thumbnailFor(c)};
    imageBox.append(image);
    const label=document.createElement('span');
    label.className='cs-item__name';
    label.textContent=c.name;
    button.append(imageBox,label);
    button.addEventListener('click',()=>select(c.id,true));
    return button;
  }
  function drawRoster(){
    list.replaceChildren(...currentChoices().map(makeItem));
  }
  function scrollSelectionIntoRail(){
    const active=Array.from(list.children).find(el=>el.dataset.person===selectedId);
    if(!active)return;
    const offset=active.offsetLeft-list.offsetWidth/2+active.offsetWidth/2;
    list.scrollTo({left:offset,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  }

  function render(c) {
    selectedId=c.id;
    const groupName=categoryLabel[c.group]||'DYNASTY OF HEROES';
    const position=currentChoices().findIndex(person=>person.id===c.id)+1;
    const count=currentChoices().length;
    ids.name.textContent=c.name;
    ids.subtitle.textContent=c.title||'';
    ids.lead.textContent=c.bio||'';
    ids.story.textContent=c.role ? c.role + '. ' + (c.identity||'') : (c.identity||'');
    ids.identity.textContent=c.identity||'';
    ids.personality.textContent=c.personality||'';
    ids.group.textContent=groupName;
    ids.category.firstChild.nodeValue=groupName+' ';
    ids.index.textContent=pad2(Math.max(1,position))+' / '+pad2(count);
    ids.count.textContent=pad2(Math.max(1,position))+' / '+pad2(count);
    ids.traits.replaceChildren(...(c.traits||[]).map(name=>{
      const trait=document.createElement('span');
      trait.className='cs-trait';
      trait.textContent=name;
      return trait;
    }));
    const imageUrl=imageFor(c);
    img.classList.remove('cs-animate');
    img.alt='';
    img.src=imageUrl;
    // A large, translucent atmospheric portrait behind the separate main image.
    echo.style.backgroundImage='url("'+imageUrl+'")';
    stage.dataset.person=c.id;
    img.onerror=()=>{
      img.onerror=null;
      img.src=thumbnailFor(c);
    };
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
      void img.offsetWidth;
      img.classList.add('cs-animate');
    }
    Array.from(list.children).forEach(button=>{
      button.setAttribute('aria-pressed',String(button.dataset.person===selectedId));
    });
    scrollSelectionIntoRail();
  }

  function select(id,updateUrl){
    const c=byId.get(id);
    if(!c)return;
    // If selecting an external deep link, make the character visible in the current filter.
    if(group!=='all' && c.group!==group){
      group='all';
      drawCategories();
      drawRoster();
    }
    render(c);
    if(updateUrl){
      try{history.replaceState(null,'','#'+encodeURIComponent(id))}catch(_){}
    }
  }

  function shift(delta){
    const choices=currentChoices();
    if(!choices.length)return;
    const n=choices.findIndex(c=>c.id===selectedId);
    const next=choices[(n+delta+choices.length)%choices.length];
    if(next)select(next.id,true);
  }
  $('#cs-prev').addEventListener('click',()=>shift(-1));
  $('#cs-next').addEventListener('click',()=>shift(1));
  document.addEventListener('keydown',e=>{
    const tag=e.target?.tagName?.toLowerCase();
    if(['input','textarea','select'].includes(tag) || e.altKey || e.ctrlKey || e.metaKey)return;
    if(e.key==='ArrowLeft'){e.preventDefault();shift(-1)}
    if(e.key==='ArrowRight'){e.preventDefault();shift(1)}
  });
  addEventListener('hashchange',()=>{
    const id=decodeURIComponent(location.hash.slice(1));
    if(byId.has(id))select(id,false);
  });

  const scene=document.querySelector('.cs-scene__landscape');
  if(scene){
    const stage=scene.closest('.cs-stage');
    const motion=matchMedia('(prefers-reduced-motion: reduce)');
    let queued=false;
    function update(){
      queued=false;
      if(motion.matches){
        scene.style.removeProperty('--cs-scroll');
        return;
      }
      const bounds=stage.getBoundingClientRect();
      const progress=Math.max(0,Math.min(1,(innerHeight-bounds.top)/(innerHeight+bounds.height)));
      // Keep the displacement inside the landscape's vertical overscan.
      const travel=Math.min(96,bounds.height*.115);
      scene.style.setProperty('--cs-scroll',((2*progress-1)*travel)+'px');
    }
    function schedule(){
      if(!queued){queued=true;requestAnimationFrame(update)}
    }
    function syncMotion(){
      if(motion.matches) removeEventListener('scroll',schedule);
      else addEventListener('scroll',schedule,{passive:true});
      schedule();
    }
    addEventListener('resize',schedule);
    motion.addEventListener('change',syncMotion);
    syncMotion();
  }

  drawCategories();
  drawRoster();
  select(selectedId,false);
})();

