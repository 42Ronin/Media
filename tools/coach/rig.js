/* ============================================================
   LASHES
   ============================================================
   Guide character. Bubble face, no hands, arms, body or legs — she can never
   point, hold or tap, so moving next to a thing is the only way she can refer
   to it. Everything below exists to let her do that without ever covering the
   control the learner needs.

   Geometry is the character bible's: viewBox 0 0 100 100, face centred at
   (44,42) with r=30. That centre is what the placement maths positions, not
   the corner of the box. */
var LZ=(function(){
  /*__LASHES_JS__*/
  /* What the host lesson tells the rig about ITS interface.

     The rig knows how to place her. It does not know what a lesson's search box
     is called, and it should not: this file used to name `#pill`, `#tbl`,
     `.recwrap` and `tr[data-row=…]` outright, which is fine in one lesson and
     wrong in the second. A lesson defines LZ_HOST before this file runs:

       anchors    {name: selector} — what `LZ.say(name, …)` can stand beside
       keepClear  function -> [{sel, w}] — rects she must not sit on, weighted by
                  how bad covering one is. Called per placement, so it can name
                  whatever the current task needs kept clear.
       row        selector template for the `row:id` anchor form, `%` for the id
       fallback   anchor names to try, in order, when the named one is off screen
       lane       truthy in an embed: she gets a lane beside the interface rather
                  than being placed against anything

     The universals below are hers and the panel's, so every lesson gets them
     without asking. Anything a lesson leaves out simply is not there — the rig
     never falls back to another lesson's selectors. */
  var HOST=(typeof LZ_HOST!=="undefined" && LZ_HOST) ? LZ_HOST : {};
  var UNIVERSAL={panel:"#coachWin", popout:"#cwPop", minimise:"#cwMin", task:"#tAsk"};

  /* Where the face sits inside its own box, as a fraction. Used for every
     placement calculation so she is centred on her face, not on empty margin. */
  var FX=0.44, FY=0.42, FR=0.30;

  var el, bub, card, layer, arrow;
  var cur={eyes:"open", mouth:"tip"};
  var pos={x:0, y:0};                 /* top-left of the char box, layer coords */
  var homeSide="right";
  var dismissed=false;
  var lastBand=null;
  var lastAnchor="home";
  var pointing=false;

  function size(){ return el.offsetWidth || 124; }
  function bounds(){ return {w:layer.clientWidth, h:layer.clientHeight}; }

  /* No ground shadow: she is floating over an interface, and there is no floor
     for one to fall on.

     BOX_FULL, not the cropped default: FX/FY/FR above are fractions of the
     100-square she was authored in, and every placement calculation in this file
     reads them. Crop the box under it and her face moves out from under its own
     maths. Only the rig asks for it. */
  function paint(){ el.innerHTML=svg(cur.eyes,cur.mouth,BOX_FULL); }
  function moveTo(x,y){
    var b=bounds(), s=size();
    pos.x=Math.max(6,Math.min(x,b.w-s-6));
    pos.y=Math.max(6,Math.min(y,b.h-s-6));
    el.style.transform="translate("+pos.x+"px,"+pos.y+"px)";
  }
  var mvTimer=null;
  function move(name){
    if(!name||name==="still"){
      el.classList.toggle("still", name==="still");
      return;
    }
    el.classList.remove("still");
    el.className="lzchar on";
    /* reflow so the same move replayed twice actually restarts */
    void el.offsetWidth;
    el.classList.add("mv-"+name);
    clearTimeout(mvTimer);
    mvTimer=setTimeout(function(){ el.classList.remove("mv-"+name); },1500);
  }
  function set(o){
    o=o||{};
    if(o.eyes) cur.eyes=o.eyes;
    if(o.mouth) cur.mouth=o.mouth;
    paint();
    if(o.move!==undefined) move(o.move);
    el.classList.add("on");
  }

  /* ---------------- anchors ----------------
     Named targets in the real interface, resolved live. A name that resolves to
     nothing falls back to home rather than throwing, because the record page and
     the results table are never on screen at the same time. */
  /* offsetParent is null for anything position:fixed, so it cannot be used to ask
     whether an element is on screen — it silently reported the docked panel as
     absent, which took it out of the keep-clear set and let her sit on top of it.
     Rects are the honest test: display:none has none, fixed has one. */
  function onScreen(n){ return !!(n && n.getClientRects().length); }
  function anchorEl(name){
    if(!name||name==="home") return null;
    if(name.indexOf("row:")===0){
      if(!HOST.row) return null;
      return document.querySelector(HOST.row.replace("%", name.slice(4).replace(/"/g,"")));
    }
    /* the card is laid out even when closed, so only anchor to it while it is up */
    if(name==="card") return card.classList.contains("on") ? card : null;
    var sel=(HOST.anchors && HOST.anchors[name]) || UNIVERSAL[name];
    if(!sel) return null;
    return onScreen(document.querySelector(sel)) ? document.querySelector(sel) : null;
  }
  function rectOf(node){
    var r=node.getBoundingClientRect(), lr=layer.getBoundingClientRect();
    return {l:r.left-lr.left, t:r.top-lr.top, r:r.right-lr.left, b:r.bottom-lr.top,
            w:r.width, h:r.height};
  }
  /* Rects she must never sit on: the search box, the coach window, and whatever
     row the current task expects the learner to click. Covering any of those
     turns a guide into an obstacle. */
  function keepClear(spec){
    var out=[], add=function(sel,w){
      var n=document.querySelector(sel);
      if(onScreen(n)){ var r=rectOf(n); r.w=w; out.push(r); }
    };
    /* Weighted, because these are not equally bad to sit on. The window carries
       Next and Show hint; landing on those leaves the learner with no way out,
       and she is drawn above the window, so it is her job to avoid it. */
    /* Pointing at one of the panel's OWN controls is the one case where keeping
       the panel clear is impossible: they sit at its top right, so any placement
       close enough to point at them puts her bubble across it. Asking for the
       impossible only makes the solver pick the least-bad corner, which was worse
       than simply letting her overlap the thing she is talking about. */
    if(spec!=="popout" && spec!=="minimise" && spec!=="task") add("#coachWin",10);
    /* The top bar is a row of small buttons packed together. Pointing at one of
       them used to put her cluster alongside it, which meant sitting on its
       neighbours — she covered the dark-mode and new-window buttons to say a
       sentence about the magnifier between them. Keeping the whole bar clear
       drops her underneath it, pointing up, which is the only placement where
       every icon in the row stays visible. */
    add(".topbar",8);
    /* Everything else is the lesson's — its search box, its results, and whatever
       the current task expects the learner to click. Called per placement rather
       than read once, so a lesson can name what THIS task needs kept clear. */
    if(typeof HOST.keepClear==="function"){
      var extra=HOST.keepClear(spec)||[];
      for(var i=0;i<extra.length;i++) if(extra[i]) add(extra[i].sel, extra[i].w);
    }
    return out;
  }
  function overlap(a,b){
    var w=Math.min(a.r,b.r)-Math.max(a.l,b.l), h=Math.min(a.b,b.b)-Math.max(a.t,b.t);
    return (w>0&&h>0) ? w*h : 0;
  }

  /* The char and its bubble travel as one cluster. Sides are tried in order and
     the first that fits the layer and clears every keep-clear rect wins. */
  /* In a step embed she is not solved into a gap in the interface — she has a lane
     of her own beside it and simply lives there, with her bubble under her. There
     is no panel competing for the space and nothing for her to be in the way of,
     so solving a placement would only make her move about for no reason. */
  /* The opening card. She arrives big and centred with the words beside her and no
     bubble drawn round them — a title, not a speech. Everything else about the beat
     is ordinary, so Next still works and the engine does not need a special case. */
  function heroLayout(){
    var b=bounds(), s=size();
    var bw=Math.min(560, b.w-s-140), bh=bub.offsetHeight;
    bub.style.width=bw+"px";
    var total=s+34+bw, left=Math.max(24,(b.w-total)/2), top=b.h*0.34;
    moveTo(left, top-s/2);
    if(bub.classList.contains("on"))
      bub.style.transform="translate("+(left+s+34)+"px,"+Math.max(16,top-bh/2)+"px) scale(1)";
    arrow.classList.remove("on");
  }
  function laneLayout(){
    var b=bounds(), app=document.querySelector(".app");
    var edge=app?app.getBoundingClientRect().right-layer.getBoundingClientRect().left:b.w-344;
    var pad=16, laneL=edge+pad, laneW=Math.max(180,b.w-laneL-pad), s=size();
    bub.style.width=laneW+"px";
    moveTo(laneL+(laneW-s)/2, pad);
    if(bub.classList.contains("on")){
      var top=Math.min(pad+s+2, b.h-bub.offsetHeight-pad);
      bub.style.transform="translate("+laneL+"px,"+Math.max(pad,top)+"px) scale(1)";
    }
    arrow.classList.remove("on");
  }
  function layout(spec){
    if(layer.classList.contains("hero")) return heroLayout();
    if(HOST.lane) return laneLayout();
    var b=bounds(), s=size(), gap=6, pad=8;
    var bw=bub.offsetWidth, bh=bub.offsetHeight, showBub=bub.classList.contains("on");
    if(!showBub){ bw=0; bh=0; gap=0; }
    var cw=s+gap+bw, ch=Math.max(s,bh);
    /* A named anchor can be off screen — the record page and the results table are
       never both up. Fall back down the chain rather than dropping her in a corner. */
    /* Fall back down the lesson's own chain rather than dropping her in a corner. */
    var node=anchorEl(spec);
    if(!node && spec!=="home"){
      var chain=HOST.fallback||[];
      for(var fi=0; fi<chain.length && !node; fi++) node=anchorEl(chain[fi]);
    }
    var a;
    if(node) a=rectOf(node);
    else a={l:b.w-260, t:b.h-230, r:b.w-40, b:b.h-60, w:220, h:170};

    function cluster(left,top,charLeft){
      var cy=top+(ch-s)/2;
      return {char:{x:charLeft, y:cy},
              bub:{x:(charLeft===left)?left+s+gap:left, y:top+(ch-bh)/2},
              box:{l:left, t:top, r:left+cw, b:top+ch}};
    }
    var mid=a.t+a.h/2-ch/2, cx=a.l+a.w/2-cw/2;
    /* When she is pointing, the arrow stands in the gap between her and the thing,
       so the gap has to be big enough to hold it — otherwise the bubble is placed
       on top of the arrow and only its tip shows. */
    var AW=46, AH=52, gx=pointing?(AW+14):10, gy=pointing?(AH+14):10;
    var SIDES=["right","left","below","above"];
    var tries=[
      function(){ var L=a.r+gx; return cluster(L,mid,L); },                 /* right of it  */
      function(){ var L=a.l-gx-cw; return cluster(L,mid,L+bw+gap); },       /* left of it   */
      function(){ return cluster(cx,a.b+gy,cx); },                          /* below it     */
      function(){ return cluster(cx,a.t-gy-ch,cx); }                        /* above it     */
    ];
    var chosen=0;
    var clear=keepClear(spec), best=null, fallback=null, least=Infinity;
    for(var i=0;i<tries.length;i++){
      var c=tries[i]();
      /* how far this placement would have to be dragged back on screen */
      var off=Math.max(0,pad-c.box.l)+Math.max(0,pad-c.box.t)+
              Math.max(0,c.box.r-(b.w-pad))+Math.max(0,c.box.b-(b.h-pad));
      /* Score against the box AFTER the same clamp the fallback path applies below
         — an anchor tucked in a screen corner can look clean pre-clamp and then
         get dragged straight back onto itself once pulled on screen. Scoring the
         clamped box is what catches that before it happens, rather than after. */
      var cdx=Math.max(0,pad-c.box.l)-Math.max(0,c.box.r-(b.w-pad));
      var cdy=Math.max(0,pad-c.box.t)-Math.max(0,c.box.b-(b.h-pad));
      var cbox={l:c.box.l+cdx, t:c.box.t+cdy, r:c.box.r+cdx, b:c.box.b+cdy};
      var over=0;
      for(var j=0;j<clear.length;j++) over+=overlap(cbox,clear[j])*(clear[j].w||1);
      /* Never park on top of the very thing she is pointing at. Weighted below the
         expected row: covering the anchor is untidy, covering the row the learner
         has to click is a dead end. */
      over+=overlap(cbox,a)*4;
      if(!off && !over){ best=c; chosen=i; break; }
      /* Score every candidate anyway. When nothing is clean, "least in the way"
         beats a fixed corner, which is how she ended up sitting on the one row
         the task wanted clicked. */
      var score=over+off*40;
      if(score<least){ least=score; fallback=c; chosen=i; }
    }
    if(!best){
      best=fallback;
      var dx=Math.max(0,pad-best.box.l)-Math.max(0,best.box.r-(b.w-pad));
      var dy=Math.max(0,pad-best.box.t)-Math.max(0,best.box.b-(b.h-pad));
      best.char.x+=dx; best.char.y+=dy; best.bub.x+=dx; best.bub.y+=dy;
    }
    layer.classList.toggle("over-panel", spec==="popout" || spec==="minimise" || spec==="task");
    placeArrow(a, best);
    moveTo(best.char.x,best.char.y);
    if(showBub){
      bub.style.transform="translate("+Math.max(pad,Math.min(best.bub.x,b.w-bw-pad))+"px,"+
        Math.max(pad,Math.min(best.bub.y,b.h-bh-pad))+"px) scale(1)";
    }
  }

  /* She is not a permanent fixture. She arrives to say something and leaves when
     it no longer applies, so the interface is the thing on screen and she is the
     interruption — which is the only way an interruption still reads as one. */
  /* The arrow sits in the gap between her and the thing, rotated to point at it.
     The base drawing points down, so each side is a quarter turn from there. The
     bounce lives inside the rotation, which is what makes it bounce along the
     direction it is pointing rather than always downwards.

     It is placed from where she actually ended up, not from the side the layout
     solver originally reached for. When an anchor sits in a screen corner, none
     of the four tries fits cleanly and the fallback drags her cluster wherever
     is least bad — which can be nowhere near the side that was picked. An arrow
     drawn from that stale guess landed on top of her instead of in a gap. If
     there genuinely is no gap once she has settled, the honest thing is no
     arrow at all, not one lying across her face. */
  /* `side` names where the ANCHOR is relative to her, so the arrow turns toward it.
     The base drawing points down (its tip is the bottom of the path), and CSS
     rotates clockwise: +90 takes a downward tip to the left, so reaching right is
     -90. This map read the other way round when `side` meant which side of the
     anchor her cluster sat on; the rewrite flipped that and left the map behind,
     which pointed all four directions at exactly the wrong thing. */
  var POINT={right:{deg:-90}, left:{deg:90}, below:{deg:0}, above:{deg:180}};
  function placeArrow(a,c){
    if(!pointing){ arrow.classList.remove("on"); return; }
    var w=46, h=52, minGap=24;
    /* Measured against her whole CLUSTER — face and bubble together — not against
       her face alone. The bubble sits beside the face, so a side picked from the
       face can be the side the bubble is on, and the arrow then has to cross it to
       reach the thing. Using the cluster means the side it picks is always one with
       open space in it, and the arrow lands in that space by construction. */
    var box=c.box;
    var gaps={right:a.l-box.r, left:box.l-a.r, below:a.t-box.b, above:box.t-a.b};
    var side=null, bestGap=-Infinity;
    for(var k in gaps){ if(gaps[k]>bestGap){ bestGap=gaps[k]; side=k; } }
    if(bestGap<minGap){ arrow.classList.remove("on"); return; }
    var p=POINT[side], x, y;
    if(side==="right"||side==="left"){
      x = side==="right" ? box.r+(bestGap-w)/2 : box.l-(bestGap+w)/2;
      var oT=Math.max(box.t,a.t), oB=Math.min(box.b,a.b);
      y = (oB>oT) ? (oT+oB)/2-h/2 : (a.t+a.b)/2-h/2;
    }else{
      y = side==="below" ? box.b+(bestGap-h)/2 : box.t-(bestGap+h)/2;
      var oL=Math.max(box.l,a.l), oR=Math.min(box.r,a.r);
      x = (oR>oL) ? (oL+oR)/2-w/2 : (a.l+a.r)/2-w/2;
    }
    var b=bounds();
    x=Math.max(2,Math.min(x,b.w-w-2)); y=Math.max(2,Math.min(y,b.h-h-2));
    arrow.style.transform="translate("+x+"px,"+y+"px)";
    arrow.querySelector(".spin").style.transform="rotate("+p.deg+"deg)";
    arrow.classList.add("on");
  }
  function hideBub(){
    layer.classList.remove("hero");
    $("#lzActs").innerHTML="";
    $("#lzFoot").hidden=true;
    bub.classList.remove("on");
    el.classList.remove("on");
    arrow.classList.remove("on");
    pointing=false;
  }
  function showBub(html){
    $("#fb").innerHTML=html;
    bub.classList.add("on");
    $("#lzLive").textContent=bub.textContent.replace(/\s+/g," ").trim();
  }

  return {
    boot:function(){
      layer=$("#lzLayer"); el=$("#lzChar"); bub=$("#lzBub"); card=$("#lzCard"); arrow=$("#lzArrow");
      paint();
      var b=bounds();
      moveTo(b.w-size()-28, b.h-size()-28);
    },
    set:set,
    /* Positioning without speech — used only for the card, where she is beside
       something that is already carrying the words. */
    go:function(anchor,o){
      o=o||{};
      pointing=!!o.point;
      set(o);
      lastAnchor=anchor;
      layout(anchor);
    },
    /* Whatever she is here to say, the thing to do next belongs with it. Reaching
       across to the panel for "next task" after reading her feedback is a trip the
       learner should not have to make. */
    actions:function(list){
      var host=$("#lzActs");
      host.innerHTML="";
      (list||[]).forEach(function(a){
        var btn=document.createElement("button");
        btn.className="lzact"+(a.quiet?" quiet":"");
        btn.textContent=a.t;
        btn.addEventListener("click",a.fn);
        host.appendChild(btn);
      });
      if(list&&list.length){ $("#lzFoot").hidden=false; $("#lzStep").hidden=true; $("#lzCount").textContent=""; }
      LZ.relayout();
    },
    say:function(anchor,html,o){
      var entering=!el.classList.contains("on");
      o=o||{};
      layer.classList.toggle("hero", !!o.hero);
      if(entering && !o.move) o.move="dropin";
      pointing=!!o.point && anchor!=="home" && anchor!=="panel";
      set(o);
      showBub(html);
      $("#lzActs").innerHTML="";
      if(!o.actions) $("#lzFoot").hidden=true;
      lastAnchor=anchor;
      /* measure after content, before placing */
      layout(anchor);
    },
    hush:function(){ hideBub(); },
    bubbleOn:function(){ return bub.classList.contains("on"); },
    onScreen:function(){ return el.classList.contains("on"); },
    card:function(title,html,btn){
      $("#lzCardTitle").textContent=title;
      $("#lzCardBody").innerHTML=html;
      $("#lzCardGo").textContent=btn||"Continue →";
      card.classList.add("on");
      $("#lzLive").textContent=title+". "+card.textContent.replace(/\s+/g," ").trim();
    },
    closeCard:function(){ card.classList.remove("on"); },
    cardOpen:function(){ return card.classList.contains("on"); },
    relayout:function(){ if(layer && el.classList.contains("on")) layout(lastAnchor); }
  };
})();

/* ============================================================
   BEATS — a run of things Lashes says, in order
   ============================================================
   The orientation at the top of a lesson and the story beats inside a running
   scenario are the same mechanism: a list she walks, one bubble at a time,
   anchored to whatever part of the interface each one is about.

   A beat advances one of two ways.

     next:  the learner reads it and presses on. Orientation works like this.
     until: the learner does something, and the beat clears when they have.
            No button, because pressing one would let them past without doing it.

   That second form is what a spiralling scenario needs — she narrates, the
   learner searches, and she picks the story up again when the search lands. */
var BEAT=(function(){
  var list=null, i=0, after=null, pending=null, startedAt=0;
  function cur(){ return list ? list[i] : null; }
  function show(){
    var b=cur(); if(!b) return;
    /* A beat may put the interface into the state it is about to talk about — the
       orientation walks a record rather than describing one. Run before the tick is
       stamped, so the act's own repaints do not read as the learner doing something. */
    if(b.act){ try{ b.act(); }catch(e){} }
    /* A gate asks about the state of the search, and the learner may already have
       reached that state two steps ago. Stamping the tick means a beat waits for
       something new to happen rather than firing the moment it appears — without
       it, typing "Dez 1974" early made three beats flash past in one go. */
    startedAt=(typeof S!=="undefined" && S) ? S.tick : 0;
    if(typeof renderCoach==="function" && typeof SCENARIO_META!=="undefined" && SCENARIO_META[SECTION]) renderCoach();
    LZ.say(b.anchor||"search",
      '<div class="fb '+(b.kind||"tour")+'">'+(b.title?"<b>"+esc(b.title)+"</b>":"")+
        String(b.html).replace(/\{\{COUNT\}\}/g, countWord())
                       .replace(/\{\{COUNT_LOWER\}\}/g, countWord().toLowerCase())+
        (b.chat ? '<div class="lzchat">'+b.chat.map(function(m){
          return '<p class="'+(m.who==="me"?"me":"them")+'">'+esc(m.text)+'</p>';
        }).join("")+'</div>' : "")+"</div>",
      {eyes:b.eyes||"open", mouth:b.mouth||"tip", move:b.move, point:b.point, hero:b.hero});
    $("#lzFoot").hidden=false;
    $("#lzCount").textContent=(list.length>1)?(i+1)+" of "+list.length:"";
    var gated=!!b.until;
    $("#lzStep").hidden=gated;
    $("#lzStep").textContent=b.next||(i===list.length-1?"Got it":"Next →");
    var w=$("#lzFoot").querySelector(".lzwait");
    if(gated){
      if(!w){ w=document.createElement("span"); w.className="lzwait"; $("#lzFoot").appendChild(w); }
      w.textContent=b.wait||"Your turn.";
      w.hidden=false;
    }else if(w){ w.hidden=true; }
    check();                       /* a gate that is already satisfied should not stall */
  }
  function step(){
    pending=null;
    if(!list) return;
    i++;
    if(i>=list.length) return stop(true);
    show();
  }
  function stop(finished){
    clearTimeout(pending); pending=null;
    list=null; i=0;
    /* If a beat drove the interface, hand it back however the tour ended — cancelled
       halfway leaves a demo search and an open record otherwise. */
    if(typeof stopTyping==="function") stopTyping();
    if(typeof unfoldPanel==="function") unfoldPanel();
    if(typeof droveDemo!=="undefined" && droveDemo) demoDo(demoReset);
    $("#lzFoot").hidden=true;
    LZ.hush();
    var f=after; after=null;
    if(finished && f) f();
  }
  /* Called wherever the interface changes — a gated beat is a question about
     the state of the app, so it is re-asked whenever the app moves. */
  /* Every change to the interface re-asks the gate, and a single search changes it
     more than once — rerun and the table repaint both call this. Without the guard
     one satisfied gate scheduled two steps and the story skipped a beat. */
  function check(){
    var b=cur();
    if(!b || !b.until || pending) return;
    if(S.tick<=startedAt) return;          /* nothing has happened since it appeared */
    var done=false;
    try{ done=!!b.until(); }catch(e){ done=false; }
    if(done) pending=setTimeout(step, b.pause||450);
  }
  return {
    run:function(l,onDone){ if(!l||!l.length) return; list=l; i=0; after=onDone||null; show(); },
    step:step,
    check:check,
    cancel:function(){ if(list) stop(false); },
    active:function(){ return !!list; },
    pos:function(){ return list ? {i:i, n:list.length} : null; }
  };
})();
