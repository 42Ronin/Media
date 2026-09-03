/* ---------------- the coach window ----------------
   Two modes. Docked is the default: it owns a reserved column, the interface is
   laid out against --dock, and the two can never overlap. Popped out, it floats
   over the interface and the column is given back — which is worth having when
   the learner wants the results at full width, and is the same window either way.

   The placement solver only matters in the popped-out mode. */
(function(){
  /* The rig is optional: a page may take the window and carry her inside its own
     content instead — the Bobbi walkthrough has her as a voice in its transcript.
     Nothing here needs her, so nothing here may assume she is loaded. */
  function relayout(){ if(typeof LZ!=="undefined" && LZ && LZ.relayout) LZ.relayout(); }
  var win=$("#coachWin"), bar=$("#cwBar"), root=document.documentElement, drag=null, moved=false;
  function floating(){ return root.classList.contains("dock-out"); }

  /* Controls the window must not sit on. Scored as the fraction of each control
     covered, not by area — covering half of a 34px icon button has to outweigh
     clipping the corner of a table that fills the screen. */
  var AVOID=[".rail","#pill","#colBtn","#filterBtn","#addBtn","#prevBtn","#nextBtn2",
             "#recNav",".recacts"];
  function overlapArea(a,b){
    var w=Math.min(a.right,b.right)-Math.max(a.left,b.left);
    var h=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);
    return (w>0&&h>0)?w*h:0;
  }
  function liveRect(sel){
    var n=document.querySelector(sel);
    return (n && n.getClientRects().length) ? n.getBoundingClientRect() : null;
  }
  /* Not the whole table — most of a results table is harmless to overlap, and
     scoring it by area let a huge, mostly-empty rectangle outvote a 34px button.
     What matters is the left part of each row: the chevron, the name, and the
     identifiers under it. That is where a learner reads and clicks. */
  function rowLane(){
    var t=liveRect("#tbl");
    if(!t) return null;
    return {left:t.left, right:t.left+t.width*0.62, top:t.top, bottom:t.bottom};
  }
  /* Auto-placed until the learner drags it. After that the position is theirs and
     nothing moves it again — a window that keeps relocating itself is worse than
     one that is occasionally in the way. */
  function autoPlace(){
    if(moved || !floating()) return;
    var r=win.getBoundingClientRect(), w=r.width, h=r.height, pad=18, top=36;
    var W=window.innerWidth, H=window.innerHeight;
    var xs=[], ys=[], i, j;
    for(i=0;i<=4;i++){
      xs.push(Math.round(pad+(W-w-2*pad)*i/4));
      ys.push(Math.round(top+(H-h-pad-top)*i/4));
    }
    var rects=AVOID.map(liveRect).filter(Boolean);
    var lane=rowLane();
    var best=null, bestScore=Infinity;
    for(i=0;i<xs.length;i++) for(j=0;j<ys.length;j++){
      var box={left:xs[i], top:ys[j], right:xs[i]+w, bottom:ys[j]+h};
      if(box.top<top||box.bottom>H-8||box.left<0||box.right>W) continue;
      var s=0, k, a;
      for(k=0;k<rects.length;k++){
        a=rects[k].width*rects[k].height;
        if(a>0) s+=overlapArea(box,rects[k])/a;
      }
      if(lane){
        a=(lane.right-lane.left)*(lane.bottom-lane.top);
        if(a>0) s+=overlapArea(box,lane)/a;
      }
      s+=(4-i)*0.004+(4-j)*0.002;                       /* ties break toward bottom right */
      if(s<bestScore){ bestScore=s; best=box; }
    }
    if(!best) return;
    win.style.left=best.left+"px"; win.style.top=best.top+"px";
    win.style.right="auto"; win.style.bottom="auto";
  }
  window.placeCoachWin=autoPlace;
  function clamp(){
    if(!floating() && !moved) return;
    var r=win.getBoundingClientRect(), pad=8;
    /* A window the learner dragged may hang off the edge — that is their choice,
       and 90px of it stays reachable. One nobody has touched must be wholly on
       screen: inside the launcher the frame is briefly a different height while
       the stage is revealed, and an auto-placed window kept the stale position. */
    var keep=moved?90:r.height;
    var x=Math.max(pad,Math.min(r.left, window.innerWidth-r.width-pad));
    var y=Math.max(32, Math.min(r.top,  window.innerHeight-Math.min(r.height,keep)-pad));
    win.style.left=x+"px"; win.style.top=y+"px"; win.style.bottom="auto"; win.style.right="auto";
  }
  function start(e){
    if(e.target.closest("button")||e.target.closest("#cwHelp")) return;
    moved=true;
    var r=win.getBoundingClientRect();
    drag={dx:(e.clientX!=null?e.clientX:e.touches[0].clientX)-r.left,
          dy:(e.clientY!=null?e.clientY:e.touches[0].clientY)-r.top};
    win.style.left=r.left+"px"; win.style.top=r.top+"px"; win.style.bottom="auto";
    bar.classList.add("drag");
    if(e.pointerId!=null && bar.setPointerCapture) bar.setPointerCapture(e.pointerId);
  }
  function moveIt(e){
    if(!drag) return;
    e.preventDefault();
    var cx=(e.clientX!=null?e.clientX:e.touches[0].clientX);
    var cy=(e.clientY!=null?e.clientY:e.touches[0].clientY);
    win.style.left=(cx-drag.dx)+"px"; win.style.top=(cy-drag.dy)+"px";
  }
  function end(){ if(!drag) return; drag=null; bar.classList.remove("drag"); clamp(); relayout(); }
  bar.addEventListener("pointerdown",start);
  window.addEventListener("pointermove",moveIt);
  window.addEventListener("pointerup",end);
  window.addEventListener("pointercancel",end);
  /* Pop out / dock. Popping out surrenders the reserved column, so the interface
     reflows to full width and the window has to find somewhere to be. */
  $("#cwPop").addEventListener("click",function(){
    var out=root.classList.toggle("dock-out");
    this.setAttribute("aria-pressed",String(out));
    this.title=out?"Dock to the right":"Pop out";
    if(out){
      moved=false;
      win.style.left=""; win.style.top=""; win.style.right=""; win.style.bottom="";
      requestAnimationFrame(function(){ autoPlace(); clamp(); relayout(); });
    }else{
      win.style.left=""; win.style.top=""; win.style.right=""; win.style.bottom="";
      setTimeout(function(){ relayout(); },240);
    }
  });
  function setMin(min){
    win.classList.toggle("min",min);
    var btn=$("#cwMin");
    btn.setAttribute("aria-expanded",String(!min));
    btn.title=min?"Expand":"Collapse";
    btn.innerHTML=min
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14M5 12h14"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 13h14"/></svg>';
    root.classList.toggle("dock-min", min && !floating());
    setTimeout(function(){ autoPlace(); clamp(); relayout(); },240);
  }
  /* The orientation folds the panel away while it works, so the interface it is
     talking about is not sharing the screen with a task nobody has read yet. */
  window.setPanelMin=setMin;
  /* One code path. The handler used to repeat setMin's body, and the two drifted:
     the tour restored the window while the html class that reserves the dock column
     stayed set, so the results table kept the full width and its last rows sat under
     the panel where nothing could click them. */
  $("#cwMin").addEventListener("click",function(){
    setMin(!win.classList.contains("min"));
  });
  function reflow(){ autoPlace(); clamp(); relayout(); }
  window.addEventListener("resize",reflow);
  /* The launcher mounts this frame while it is display:none, so it boots at 0x0
     and everything is placed against rectangles that do not exist yet. resize
     covers the reveal, but not reliably enough to be the only thing watching. */
  if(window.ResizeObserver){
    try{ new ResizeObserver(reflow).observe(document.documentElement); }catch(e){}
  }
  autoPlace();
})();
