/* The Clarity Add Client form's OWN behaviour — the part that belongs to the
   product rather than to either lesson. ONE copy, stamped into both pages at the
   FORM_JS token.

   The option lists especially: a learner has to pick "Client doesn't know" and not
   "Client prefers not to answer", so the exact wording of every code is the thing
   being taught. Two copies of that list is two chances for it to drift from the
   captures.

   It is its own IIFE because each lesson's own code has a local `$` that takes an
   id, and this file must not depend on which. What a lesson needs, it gets from
   the returned object.
   ============================================================ */
var FORM=(function(){
  // ---------- option lists (production Clarity, LA HMIS) ----------
  const Q = {
    qssn: ['Select','Full SSN Reported','Approximate or partial SSN reported',"Client doesn't know",'Client prefers not to answer','Data not collected'],
    qname:['Select','Full name reported','Partial, street name, or code name reported',"Client doesn't know",'Client prefers not to answer','Data not collected'],
    qdob: ['Select','Full DOB Reported','Approximate or partial DOB reported',"Client doesn't know",'Client prefers not to answer','Data not collected'],
    gender:['Select','Woman (Girl, if child)','Man (Boy, if child)','Culturally Specific Identity (e.g., Two-Spirit)','Transgender','Non-Binary','Questioning','Different Identity',"Client doesn't know",'Client prefers not to answer','Data not collected'],
    race:['Select','American Indian, Alaska Native, or Indigenous','Asian or Asian American','Black, African American, or African','Hispanic/Latina/e/o','Middle Eastern or North African','Native Hawaiian or Pacific Islander','White',"Client doesn't know",'Client prefers not to answer','Data not collected'],
    doc:['Select','Electronic Signature','Attached PDF','Signed Paper Document','Verbal Consent','Household'],
  };
  const $ = id => document.getElementById(id);
  for (const k in Q){ const s=$(k); Q[k].forEach(o=>{const op=document.createElement('option');op.textContent=o;s.appendChild(op);}); }
  /* Deliberately NOT 'roiStart' or 'end': the consent dates are computed once and
     are read-only, so a reset must not blank them. */
  const F = ['ssn','qssn','first','last','middle','suffix','qname','qdob','dob','maiden','alias','gender','pronouns','race','lang','perm','doc','loc'];
  const val = id => $(id).value.trim();
  const fmt = d => `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}/${d.getFullYear()}`;
  const today=new Date(), end=new Date(today); end.setFullYear(end.getFullYear()+7);
  $('roiStart').value=fmt(today); $('end').value=fmt(end);

  // ---------- form behaviors ----------
  let crOn=false;
  $('cr').addEventListener('click', () => {
    crOn=!crOn; $('cr').classList.toggle('on',crOn);
    if (crOn){ $('ssn').value='000-00-0000'; $('qssn').value='Client prefers not to answer'; $('first').value='Generated'; $('last').value='Refused';
      $('qname').value='Client prefers not to answer'; $('suffix').value='Client prefers not to answer'; $('dob').value='01/01/____'; $('qdob').value='Approximate or partial DOB reported'; }
  });
  $('doc').addEventListener('change', () => {
    const v=val('doc'); $('consent').classList.toggle('show', v==='Electronic Signature'); $('file').classList.toggle('show', v==='Attached PDF'); $('locwrap').style.display = v==='Signed Paper Document' ? '' : 'none';
  });
  const sign = (id,txt) => { const p=$(id); p.addEventListener('click',()=>{ p.classList.toggle('signed'); p.textContent = p.classList.contains('signed') ? txt : (id==='sig1'?'Client Signature':'Organization Staff Signature'); }); };
  sign('sig1','~ signed ~'); sign('sig2','O. Worker');
  const signed = () => $('sig1').classList.contains('signed');
  function resetForm(){
    F.forEach(id => { const e=$(id); if (e.tagName==='SELECT'){ e.selectedIndex=0; if(id==='perm')e.value='Yes'; } else e.value=''; });
    crOn=false; $('cr').classList.remove('on'); $('consent').classList.remove('show'); $('file').classList.remove('show'); $('locwrap').style.display='none';
    ['sig1','sig2'].forEach(id=>{$(id).classList.remove('signed'); $(id).textContent = id==='sig1'?'Client Signature':'Organization Staff Signature';});
    $('photo').checked=false; $('form').scrollTop=0;
  }

  return {
    byId:$, val:val, reset:resetForm, signed:signed,
    refused:function(){ return crOn; },
    /* Documentation drives what the consent section shows, so a page that sets it
       in code rather than by a click still has to fire the product's own handler. */
    sync:function(){ $('doc').dispatchEvent(new Event('change')); }
  };
})();
