(()=>{const menu=document.querySelector('.site-menu');const toggle=document.querySelector('.menu-toggle');toggle?.addEventListener('click',()=>{const on=menu.classList.toggle('open');toggle.setAttribute('aria-expanded',String(on))});document.querySelectorAll('.site-menu a').forEach(a=>a.addEventListener('click',()=>menu?.classList.remove('open')));const progress=document.getElementById('progress');addEventListener('scroll',()=>{if(progress)progress.style.width=(100*scrollY/(document.documentElement.scrollHeight-innerHeight||1))+'%'},{passive:true});if(matchMedia('(prefers-reduced-motion: reduce)').matches){document.querySelectorAll('video').forEach(v=>{v.pause();v.removeAttribute('autoplay')})}else if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>{if(isIntersecting)target.play().catch(()=>{});else target.pause()}),{threshold:.08});document.querySelectorAll('video').forEach(v=>observer.observe(v))}})();
/* Subtle, scroll-linked depth for the editable character-page background.
   Motion is disabled when the user requests reduced motion. */
(()=>{
 const world=document.querySelector(".characters-page-backdrop__art");
 const feature=document.querySelector(".featured-hero");
 const scene=document.querySelector(".featured-hero__scene");
 if(!world || !feature || !scene || matchMedia("(prefers-reduced-motion: reduce)").matches)return;
 let queued=false;
 function render(){
  queued=false;
  const y=window.scrollY||0;
  world.style.setProperty("--character-parallax",Math.min(108,Math.round(y*.045))+"px");
  const local=y-feature.offsetTop;
  scene.style.setProperty("--feature-parallax",Math.max(-48,Math.min(48,Math.round(local*.095)))+"px");
 }
 function queue(){if(!queued){queued=true;requestAnimationFrame(render)}}
 addEventListener("scroll",queue,{passive:true});
 addEventListener("resize",queue,{passive:true});
 render();
})();
