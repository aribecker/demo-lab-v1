import React,{useEffect,useRef,useState} from 'react';
import * as defaultApi from './accessClient.js';
import {useAuth} from './AuthContext.jsx';
const sections={SIMULATOR:'Trading Simulator',USERS:'Users administration',GROUPS:'Groups administration'};
const emptyUser={firstName:'',lastName:'',email:''},emptyGroup={name:'',permissions:[]};
export default function AccessManagement({kind,api=defaultApi}) {
 const groupMode=kind==='groups',title=groupMode?'Groups':'Users',auth=useAuth();
 const [rows,setRows]=useState([]),[draft,setDraft]=useState(groupMode?emptyGroup:emptyUser),[id,setId]=useState(null);
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[members,setMembers]=useState(null);
 const mounted=useRef(false),active=useRef(null),inFlight=useRef(false);
 async function load(signal){const records=await api.listRecords(kind,signal);if(mounted.current)setRows(records);}
 useEffect(()=>{mounted.current=true;const controller=new AbortController();active.current=controller;
  load(controller.signal).catch(e=>{if(mounted.current&&!controller.signal.aborted)setError(e.message);}).finally(()=>{if(mounted.current)setLoading(false);});
  return()=>{mounted.current=false;active.current?.abort();};
 },[kind,api]);
 async function run(operation,success,refreshAccess=false){
  if(inFlight.current)return;inFlight.current=true;setSaving(true);setError('');setNotice('');const controller=new AbortController();active.current=controller;
  try{await operation(controller.signal);if(!mounted.current)return;setNotice(success);await load(controller.signal);if(refreshAccess)await auth?.refresh(false,true);}
  catch(e){if(mounted.current&&!controller.signal.aborted)setError(e.message||'The change could not be confirmed. Refresh before retrying.');}
  finally{inFlight.current=false;if(mounted.current)setSaving(false);}
 }
 const reset=()=>{setId(null);setDraft(groupMode?emptyGroup:emptyUser);};
 const submit=e=>{e.preventDefault();run(async signal=>{await api.saveRecord(kind,id,draft,signal);if(mounted.current)reset();},'Saved.',true);};
 const remove=row=>run(async signal=>{await api.deleteRecord(kind,row.id,signal);if(mounted.current&&id===row.id)reset();},'Deleted.',true);
 const edit=row=>{setMembers(null);setId(row.id);setDraft(groupMode?{name:row.name,permissions:[...row.permissions]}:{firstName:row.firstName,lastName:row.lastName,email:row.email});};
 const openMembers=row=>run(async signal=>{const value=await api.readMembers(row.id,signal);if(mounted.current)setMembers({...value,id:row.id,name:row.name});},'Membership loaded.');
 const toggle=(values,value)=>values.includes(value)?values.filter(x=>x!==value):[...values,value];
 return <>
  <section className="page-intro"><p className="text__eyebrow">DEMO LAB · ACCESS</p><h1 className="page-intro__title" tabIndex={-1}>{title}</h1><p className="page-intro__subtitle">{groupMode?'Assign section permissions and group members.':'Maintain the names and verified sign-in emails used for access.'}</p></section>
  <section className="panel people__panel" aria-label={`${title} administration`}>
   <p className="people__note">Everyone represents all visitors, including people without login. Assigning Everyone to a group makes its section permissions public.</p>
   {loading&&<p role="status">Loading {kind}…</p>}{error&&<p role="alert" className="notice notice--error">{error}</p>}{notice&&<p role="status">{notice}</p>}
   <button className="button" disabled={saving||loading} onClick={()=>run(signal=>load(signal),'List refreshed.')}>Refresh list</button>
   <ul className="record-list" aria-label={`Saved ${kind}`}>
    {rows.map(row=>{
     const name=groupMode?row.name:`${row.firstName} ${row.lastName}`;
     return <li className="record-list__item" key={row.id}>
      <div className="record-list__details"><strong className="record-list__title">{name}</strong><small className="record-list__meta">#{row.id} · {groupMode?row.permissions.map(p=>sections[p]).join(', '):row.email||'Special principal'}</small></div>
      <div className="record-list__actions" role="group" aria-label={`Actions for ${name}`}>
       {(groupMode||row.principalKind!=='EVERYONE')&&<button className="button" aria-label={`Edit ${name}`} disabled={saving} onClick={()=>edit(row)}>Edit</button>}
       {(groupMode||!row.systemKey)&&<button className="button" aria-label={`Delete ${name}`} disabled={saving} onClick={()=>remove(row)}>Delete</button>}
       {groupMode&&<button className="button" aria-label={`Members of ${row.name}`} disabled={saving} onClick={()=>openMembers(row)}>Members</button>}
      </div>
     </li>;
    })}
   </ul>
   <h2>{id?'Edit':'Create'} {groupMode?'group':'user'}</h2>
   <form onSubmit={submit}>
    {groupMode?<><label htmlFor="access-name">Group name</label><div className="people__form"><input className="field" id="access-name" required maxLength={120} disabled={saving} value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/></div>
     <fieldset disabled={saving}><legend>Section permissions</legend>{Object.entries(sections).map(([value,label])=><label key={value}><input type="checkbox" checked={draft.permissions.includes(value)} onChange={()=>setDraft({...draft,permissions:toggle(draft.permissions,value)})}/>{label} </label>)}</fieldset></>
     :['firstName','lastName','email'].map((field,index)=><React.Fragment key={field}><label htmlFor={`access-${field}`}>{['First name','Last name','Email'][index]}</label><div className="people__form"><input className="field" id={`access-${field}`} type={field==='email'?'email':'text'} required maxLength={field==='email'?254:80} disabled={saving||(field==='email'&&rows.find(row=>row.id===id)?.systemKey==='owner')} value={draft[field]} onChange={e=>setDraft({...draft,[field]:e.target.value})}/></div></React.Fragment>)}
    <button className="button button--primary" type="submit" disabled={saving||loading}>{saving?'Saving…':'Save '+(groupMode?'group':'user')}</button>{id&&<button className="button" type="button" disabled={saving} onClick={reset}>Cancel edit</button>}
   </form>
   {members&&<section aria-label="Group membership"><h2>Members of {members.name}</h2><fieldset disabled={saving}><legend>Choose group members</legend>{members.users.map(user=><label key={user.id}><input type="checkbox" checked={members.memberIds.includes(user.id)} onChange={()=>setMembers({...members,memberIds:toggle(members.memberIds,user.id)})}/>{user.firstName} {user.lastName}{user.email?` (${user.email})`:''}<br/></label>)}</fieldset>
    <button className="button" disabled={saving} onClick={()=>run(async signal=>{const value=await api.saveMembers(members.id,members.memberIds,signal);if(mounted.current)setMembers({...value,id:members.id,name:members.name});},'Membership saved.',true)}>Save membership</button><button className="button" disabled={saving} onClick={()=>setMembers(null)}>Close membership</button>
   </section>}
  </section>
 </>;
}
