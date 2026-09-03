/* ============================================================
   LASHES — the drawing, and the only copy of it

   Her geometry and her expression library. Inlined into every page that shows
   her, at the LASHES tokens, because each page has to stand alone with no
   network — but inlined FROM HERE, so there is one face to change.

   Before this file she was copied by hand into the lesson, three
   knowledge-check stagings and the block builder, and "if her face changes,
   change it in both" was a note in CLAUDE.md rather than something the build
   enforced.

   svg(eyes, mouth) returns a 100x100 viewBox. The caller sizes it.
   Expressions are fixed and are not a setting: open, droll, sparkle, wide,
   arcs for the eyes; tip, plain, cheer, wry, hm for the mouth.
   ============================================================ */
var LASH={
  open:'<g class="m-lash"><path d="M30.5 34.5 l-3 -2.5"/><path d="M34.5 33.2 l-1 -3"/><path d="M38.5 34 l1.5 -2.8"/>'+
       '<path d="M48.5 34 l-1.5 -2.8"/><path d="M52.5 33.2 l1 -3"/><path d="M56.5 34.5 l3 -2.5"/></g>',
  high:'<g class="m-lash"><path d="M30 33.5 l-3.4 -3"/><path d="M34.3 32 l-1.2 -3.4"/><path d="M38.4 32.8 l1.7 -3.2"/>'+
       '<path d="M48.6 32.8 l-1.7 -3.2"/><path d="M52.7 32 l1.2 -3.4"/><path d="M57 33.5 l3.4 -3"/></g>',
  low: '<g class="m-lash"><path d="M30.8 38 l-3 -1"/><path d="M34.9 36.8 l-.7 -2.2"/><path d="M38.9 37.6 l1.4 -1.9"/>'+
       '<path d="M49.1 37.6 l-1.4 -1.9"/><path d="M53.1 36.8 l.7 -2.2"/><path d="M57.2 38 l3 -1"/></g>'
};
function spark(cx,cy){
  return '<path class="m-spark" d="M'+cx+' '+(cy-4.6)+' q1 3.4 4.6 4.6 q-3.6 1.2 -4.6 4.6 '+
         'q-1 -3.4 -4.6 -4.6 q3.6 -1.2 4.6 -4.6 z"/>';
}
function droll(cx){
  return '<circle class="m-eye" cx="'+cx+'" cy="39.5" r="4"/>'+
         '<rect class="m-lidfill" x="'+(cx-4.6)+'" y="34" width="9.2" height="3.9" rx="1.6"/>'+
         '<path class="m-lidline" d="M'+(cx-4)+' 37.7 h8"/>';
}
var EYES={
  open:   {e:'<circle class="m-eye" cx="35" cy="39" r="4"/><circle class="m-eye" cx="53" cy="39" r="4"/>', l:"open"},
  droll:  {e:droll(35)+droll(53), l:"low"},
  sparkle:{e:spark(35,39)+spark(53,39), l:"high"},
  wide:   {e:'<circle class="m-eye" cx="35" cy="39" r="5.2"/><circle class="m-eye" cx="53" cy="39" r="5.2"/>', l:"high"},
  arcs:   {e:'<path class="m-arc" d="M30.5 41 q4.5 -6 9 0"/><path class="m-arc" d="M48.5 41 q4.5 -6 9 0"/>', l:"open"}
};
var MOUTH={tip:"M36 51 q8 7 16 0", plain:"M37 51 q7 4.5 14 0", cheer:"M33 49 q11 10 22 0",
           wry:"M41.5 51.2 q4.2 2.8 8.4 .7", hm:"M40 51.8 q4 1.4 8 0"};
function svg(eyes,mouth){
  var ex=EYES[eyes]||EYES.open, m=MOUTH[mouth]||MOUTH.tip;
  return '<svg viewBox="0 0 100 100" aria-hidden="true">'+
    '<g class="m-body">'+
      '<circle class="m-rim" cx="44" cy="42" r="30"/>'+
      '<circle class="m-glass" cx="44" cy="42" r="25"/>'+
      '<g class="m-face"><g class="m-eyes">'+ex.e+'</g>'+LASH[ex.l]+
        '<path class="m-mouth" d="'+m+'"/></g>'+
      '<path class="m-shine" d="M27 30 q7-9 17-10"/>'+
    '</g></svg>';
}

/* Every [data-face] host gets her drawing. `data-face` may name an expression
   pair, "eyes mouth"; empty means open/tip. Call it again after adding hosts,
   which is what a page building her into a message has to do. */
function paintFaces(root){
  var hosts=(root||document).querySelectorAll("[data-face]");
  for(var i=0;i<hosts.length;i++){
    var h=hosts[i];
    if(h.getAttribute("data-painted")) continue;
    var pair=(h.getAttribute("data-face")||"").split(/\s+/);
    h.innerHTML=svg(pair[0]||"open", pair[1]||"tip");
    h.setAttribute("data-painted","1");
  }
}
