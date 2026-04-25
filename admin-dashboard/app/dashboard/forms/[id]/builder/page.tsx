"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type QType = "short_text"|"phone"|"email"|"number"|"single_choice"|"multi_choice"|"image_choice"|"image_upload"|"rating"|"dropdown"|"nps";
type Option = { id: string; text: string; imageUrl?: string };
type LogicJump = { condition: string; value: string; goTo: string };
type Q = { id: string; label: string; description: string; key: string; type: QType; required: boolean; placeholder: string; options: Option[]; section: string; imageUrl: string; maxRating: number; logicJumps?: LogicJump[] };
type Theme = { primaryColor: string; bgColor: string; textColor: string; buttonStyle: "rounded"|"pill"|"sharp" };
type Config = { title: string; description: string; logoUrl: string; theme: Theme; questions: Q[]; welcomeBtn: string; thankYouTitle: string; thankYouDesc: string; buttonText: string; submitText: string };

const TYPES: {type:QType;icon:string;label:string}[] = [
  {type:"short_text",icon:"✏️",label:"Short Text"},{type:"single_choice",icon:"⭕",label:"Single Choice"},
  {type:"multi_choice",icon:"☑️",label:"Multi Choice"},{type:"image_choice",icon:"🖼️",label:"Image Choice"},
  {type:"rating",icon:"⭐",label:"Rating"},{type:"phone",icon:"📱",label:"Phone"},
  {type:"email",icon:"📧",label:"Email"},{type:"number",icon:"#️⃣",label:"Number"},
  {type:"dropdown",icon:"🔽",label:"Dropdown"},{type:"nps",icon:"📈",label:"NPS Score"},
  {type:"image_upload",icon:"📤",label:"Image Upload"},
];
const COLORS = ["#6366f1","#8b5cf6","#ec4899","#f43f5e","#f59e0b","#10b981","#3b82f6","#14b8a6","#000000"];
// Auto-generate a clean key from question label text
const labelToKey = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40) || `field_${Date.now()}`;
const newQ = (): Q => ({id:`q${Date.now()}`,key:`field_${Date.now()}`,section:"basic",label:"New Question",description:"",type:"short_text",required:false,placeholder:"",options:[],imageUrl:"",maxRating:5,logicJumps:[]});
const newOpt = (): Option => ({id:`o${Date.now()}`,text:"New Option", imageUrl:""});

// Upload image to backend, returns full URL
async function uploadImage(file: File, token: string): Promise<string> {
  const fd = new FormData();
  fd.append("image", file);
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  const data = await res.json();
  return data.fullUrl || data.url || "";
}

// Reusable image upload button component
function ImageUploadBtn({ currentUrl, token, onUploaded, label = "Upload Image" }: { currentUrl: string; token: string; onUploaded: (url: string) => void; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadImage(file, token);
    setUploading(false);
    if (url) onUploaded(url);
    e.target.value = "";
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => ref.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200 transition disabled:opacity-50 cursor-pointer">
          {uploading ? "⏳ Uploading..." : `📷 ${label}`}
        </button>
        {currentUrl && (
          <button type="button" onClick={() => onUploaded("")} className="text-red-400 hover:text-red-600 text-xs">✕ Remove</button>
        )}
        <input ref={ref} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </div>
      {currentUrl && (
        <div className="relative w-full h-28 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
          <img src={currentUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
}

function SortableItem({ q, idx, selected, onClick }: { q: Q; idx: number; selected: boolean; onClick: () => void }) {
  const {attributes,listeners,setNodeRef,transform,transition} = useSortable({id: q.id});
  const style = {transform: CSS.Transform.toString(transform), transition};
  const t = TYPES.find(x => x.type === q.type);
  return (
    <div ref={setNodeRef} style={style} onClick={onClick}
      className={`p-3 rounded-xl border cursor-pointer transition group ${selected?"border-indigo-300 bg-indigo-50 shadow-sm":"border-gray-100 hover:border-gray-200 hover:bg-gray-50"}`}>
      <div className="flex items-center gap-2">
        <span {...attributes} {...listeners} className="text-gray-300 cursor-grab text-sm">⠿</span>
        <span className="text-xs text-gray-400 font-mono w-5">{idx+1}</span>
        <span className="text-sm flex-1 truncate font-medium text-gray-700">{q.label||"Untitled"}</span>
        {q.required && <span className="text-red-400 text-xs">*</span>}
      </div>
      <p className="text-xs text-gray-400 mt-1 ml-7">{t?.icon} {t?.label}</p>
    </div>
  );
}

export default function FormBuilderPage() {
  const {id} = useParams() as {id: string};
  const router = useRouter();
  const [config, setConfig] = useState<Config>({title:"",description:"",logoUrl:"",theme:{primaryColor:"#6366f1",bgColor:"#ffffff",textColor:"#111827",buttonStyle:"rounded"},questions:[],welcomeBtn:"Start →",thankYouTitle:"You're all set! 🎉",thankYouDesc:"Thank you!",buttonText:"Continue →",submitText:"Submit ✨"});
  const [formName, setFormName] = useState("Untitled Form");
  const [status, setStatus] = useState<"draft"|"published">("draft");
  const [selId, setSelId] = useState<string|null>(null);
  const [rightTab, setRightTab] = useState<"style"|"logic">("style");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("token")||"";
    setToken(t);
    if(!t){router.push("/");return;}
    fetch(`/api/admin/forms/${id}`,{headers:{Authorization:`Bearer ${t}`}})
      .then(r=>r.json()).then(d=>{
        if(d.config){setConfig(d.config);setFormName(d.name||"");setStatus(d.status||"draft");}
        if(d.config?.questions?.length) setSelId(d.config.questions[0].id);
      });
  },[id]);

  const save = async (publish?: boolean) => {
    setSaving(true);
    const newStatus = publish ? "published" : status;
    await fetch(`/api/admin/forms/${id}`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({name:formName,config,status:newStatus})});
    if(publish) setStatus("published");
    setSaving(false); setMsg(publish?"✓ Published!":"✓ Saved!"); setTimeout(()=>setMsg(""),2000);
  };

  const selQ = config.questions.find(q=>q.id===selId)||null;
  const upd = (patch: Partial<Q>) => setConfig(c=>({...c,questions:c.questions.map(q=>q.id===selId?{...q,...patch}:q)}));
  const updTheme = (patch: Partial<Theme>) => setConfig(c=>({...c,theme:{...c.theme,...patch}}));

  const handleDragEnd = (e: DragEndEvent) => {
    const {active,over} = e;
    if(over && active.id !== over.id){
      const oi = config.questions.findIndex(q=>q.id===active.id);
      const ni = config.questions.findIndex(q=>q.id===over.id);
      setConfig(c=>({...c,questions:arrayMove(c.questions,oi,ni)}));
    }
  };

  const addQ = () => {const q=newQ();setConfig(c=>({...c,questions:[...c.questions,q]}));setSelId(q.id);};
  const delQ = (qid: string) => {const rest=config.questions.filter(q=>q.id!==qid);setConfig(c=>({...c,questions:rest}));setSelId(rest[0]?.id||null);};
  const addOpt = () => selQ && upd({options:[...(selQ.options||[]),newOpt()]});
  const delOpt = (oid: string) => selQ && upd({options:selQ.options.filter(o=>o.id!==oid)});
  const updOpt = (oid: string, patch: Partial<Option>) => selQ && upd({options:selQ.options.map(o=>o.id===oid?{...o,...patch}:o)});
  const hasOpts = (t: QType) => ["single_choice","multi_choice","image_choice","dropdown"].includes(t);
  const addJump = () => selQ && upd({logicJumps:[...(selQ.logicJumps||[]),{condition:"is",value:"",goTo:""}]});
  const delJump = (i: number) => selQ && upd({logicJumps:(selQ.logicJumps||[]).filter((_,j)=>j!==i)});
  const updJump = (i: number, patch: Partial<LogicJump>) => selQ && upd({logicJumps:(selQ.logicJumps||[]).map((j,k)=>k===i?{...j,...patch}:j)});

  const br = config.theme.buttonStyle==="pill"?"9999px":config.theme.buttonStyle==="sharp"?"4px":"12px";

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b px-5 py-2.5 flex items-center gap-3 shrink-0 shadow-sm">
        <button onClick={()=>router.push("/dashboard/forms")} className="text-gray-400 hover:text-gray-700 text-sm">← Forms</button>
        <input value={formName} onChange={e=>setFormName(e.target.value)} className="flex-1 text-base font-bold text-gray-900 bg-transparent border-0 focus:outline-none focus:bg-gray-50 rounded-lg px-2 py-1 max-w-xs"/>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status==="published"?"bg-green-100 text-green-700":"bg-gray-100 text-gray-500"}`}>{status==="published"?"● Live":"○ Draft"}</span>
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={()=>window.open(`/quiz/${id}`,"_blank")} className="text-sm text-gray-600 border border-gray-200 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition">👁 Preview</button>
          <button onClick={()=>router.push(`/dashboard/forms/${id}/embed`)} className="text-sm text-gray-600 border border-gray-200 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition">🚀 Embed</button>
          <button onClick={()=>save()} disabled={saving} className="bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold px-4 py-2 rounded-xl transition disabled:opacity-60">{msg||(saving?"Saving...":"💾 Save")}</button>
          <button onClick={()=>save(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition shadow-md shadow-indigo-200">🚀 Publish</button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Question list */}
        <div className="w-60 bg-white border-r flex flex-col shrink-0">
          <div className="p-3 border-b flex items-center justify-between">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Questions ({config.questions.length})</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <div onClick={()=>setSelId(null)} className={`p-2.5 rounded-xl border cursor-pointer text-xs transition ${!selId?"border-indigo-300 bg-indigo-50":"border-gray-100 hover:bg-gray-50"}`}>
              <span className="font-semibold text-gray-600">👋 Welcome Screen</span>
            </div>
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={config.questions.map(q=>q.id)} strategy={verticalListSortingStrategy}>
                {config.questions.map((q,i)=>(
                  <SortableItem key={q.id} q={q} idx={i} selected={selId===q.id} onClick={()=>setSelId(q.id)}/>
                ))}
              </SortableContext>
            </DndContext>
          </div>
          <div className="p-2 border-t">
            <button onClick={addQ} className="w-full flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2 rounded-xl transition">+ Add Question</button>
          </div>
        </div>

        {/* CENTER: Editor */}
        <div className="flex-1 overflow-y-auto p-5">
          {!selId ? (
            <div className="max-w-xl space-y-4">
              <div className="bg-white rounded-2xl border shadow-sm p-5 space-y-4">
                <h2 className="font-bold text-gray-900">👋 Welcome Screen</h2>
                {[["Quiz Title","title"],["Subtitle","description"],["Start Button","welcomeBtn"]].map(([l,k])=>(
                  <div key={k}><label className="text-sm font-semibold text-gray-700 block mb-1">{l}</label>
                  <input value={(config as any)[k]||""} onChange={e=>setConfig(c=>({...c,[k]:e.target.value}))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/></div>
                ))}
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Logo / Brand Image</label>
                  <ImageUploadBtn currentUrl={config.logoUrl} token={token} label="Upload Logo"
                    onUploaded={url=>setConfig(c=>({...c,logoUrl:url}))} />
                </div>
              </div>
              <div className="bg-white rounded-2xl border shadow-sm p-5 space-y-4">
                <h2 className="font-bold text-gray-900">🎉 Thank You Screen</h2>
                {[["Title","thankYouTitle"],["Message","thankYouDesc"]].map(([l,k])=>(
                  <div key={k}><label className="text-sm font-semibold text-gray-700 block mb-1">{l}</label>
                  <input value={(config as any)[k]||""} onChange={e=>setConfig(c=>({...c,[k]:e.target.value}))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/></div>
                ))}
              </div>
            </div>
          ) : selQ ? (
            <div className="max-w-2xl space-y-4">
              {/* Type picker */}
              <div className="bg-white rounded-2xl border shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-700 mb-3">📌 Answer Type</h3>
                <div className="grid grid-cols-5 gap-2">
                  {TYPES.map(t=>(
                    <button key={t.type} onClick={()=>upd({type:t.type})} className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition ${selQ.type===t.type?"border-indigo-400 bg-indigo-50":"border-gray-200 hover:border-gray-300"}`}>
                      <span className="text-xl">{t.icon}</span><p className="text-xs font-semibold text-gray-700 leading-tight">{t.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question editor */}
              <div className="bg-white rounded-2xl border shadow-sm p-5 space-y-4">
                <h3 className="text-sm font-bold text-gray-700">✏️ Question</h3>
                <div><label className="text-sm font-semibold text-gray-700 block mb-1">Question Text *</label>
                <input value={selQ.label} onChange={e=>upd({label:e.target.value, key:labelToKey(e.target.value)})} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/></div>
                <div><label className="text-sm font-semibold text-gray-700 block mb-1">Helper Text</label>
                <input value={selQ.description} onChange={e=>upd({description:e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/></div>

                {["short_text","phone","email","number"].includes(selQ.type) && (
                  <div><label className="text-sm font-semibold text-gray-700 block mb-1">Placeholder</label>
                  <input value={selQ.placeholder} onChange={e=>upd({placeholder:e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/></div>
                )}
                {selQ.type==="rating" && (
                  <div><label className="text-sm font-semibold text-gray-700 block mb-2">Max Stars</label>
                  <div className="flex gap-2">{[3,4,5,6,7,10].map(n=>(
                    <button key={n} onClick={()=>upd({maxRating:n})} className={`w-10 h-10 rounded-xl border text-sm font-bold transition ${selQ.maxRating===n?"bg-indigo-600 text-white border-indigo-600":"border-gray-200 text-gray-600"}`}>{n}</button>
                  ))}</div></div>
                )}
                {selQ.type==="image_upload" && (
                  <div className="mt-4">
                    <ImageUploadBtn
                      currentUrl={selQ.imageUrl || ""}
                      token={token}
                      label="Upload Image Answer"
                      onUploaded={url => upd({imageUrl: url})}
                    />
                  </div>
                )}
                {hasOpts(selQ.type) && (
                  <div><label className="text-sm font-semibold text-gray-700 block mb-2">Options</label>
                  <div className="space-y-2">
                    {selQ.options.map((o,i)=>(
                      <div key={o.id} className="border border-gray-200 rounded-xl p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <input value={o.text} onChange={e=>updOpt(o.id,{text:e.target.value})} placeholder={`Option ${i+1}`} className="flex-1 text-sm focus:outline-none border-b border-gray-100 py-1"/>
                          <button onClick={()=>delOpt(o.id)} className="text-red-400 hover:text-red-600 text-xs shrink-0">✕</button>
                        </div>
                        {selQ.type==="image_choice" && (
                          <ImageUploadBtn currentUrl={o.imageUrl||""} token={token} label="Upload option image"
                            onUploaded={url=>updOpt(o.id,{imageUrl:url})} />
                        )}
                      </div>
                    ))}
                    <button onClick={addOpt} className="w-full border-2 border-dashed border-gray-200 hover:border-indigo-400 hover:text-indigo-600 text-gray-500 text-sm font-medium py-2 rounded-xl transition">+ Add Option</button>
                  </div></div>
                )}
                <div className="flex items-center justify-between pt-3 border-t">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={selQ.required} onChange={e=>upd({required:e.target.checked})} className="accent-indigo-600"/>
                    <span className="text-sm font-medium text-gray-700">Required</span>
                  </label>
                  <button onClick={()=>delQ(selQ.id)} className="text-red-400 hover:text-red-600 text-sm font-medium hover:bg-red-50 px-3 py-1.5 rounded-lg transition">🗑 Delete</button>
                </div>
              </div>

              {/* Logic Jumps */}
              <div className="bg-white rounded-2xl border shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-700">🔀 Logic Jumps</h3>
                  <button onClick={addJump} className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold border border-indigo-200 px-2.5 py-1 rounded-lg hover:bg-indigo-50 transition">+ Add Jump</button>
                </div>
                {(selQ.logicJumps||[]).length===0 && <p className="text-xs text-gray-400">No logic jumps. Question will go to next in sequence.</p>}
                {(selQ.logicJumps||[]).map((j,i)=>(
                  <div key={i} className="flex items-center gap-2 mb-2 bg-gray-50 rounded-xl p-3">
                    <span className="text-xs text-gray-500 shrink-0">If answer</span>
                    <select value={j.condition} onChange={e=>updJump(i,{condition:e.target.value})} className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none">
                      <option value="is">is</option><option value="contains">contains</option>
                    </select>
                    <input value={j.value} onChange={e=>updJump(i,{value:e.target.value})} placeholder="value" className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none"/>
                    <span className="text-xs text-gray-500 shrink-0">→ go to</span>
                    <select value={j.goTo} onChange={e=>updJump(i,{goTo:e.target.value})} className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none">
                      <option value="">Select question</option>
                      {config.questions.filter(q=>q.id!==selQ.id).map(q=>(
                        <option key={q.id} value={q.id}>{q.label.slice(0,30)}</option>
                      ))}
                    </select>
                    <button onClick={()=>delJump(i)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* RIGHT: Style panel */}
        <div className="w-72 border-l bg-white flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 border-b"><h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">🎨 Theme</h3></div>
          <div className="p-4 space-y-5">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Brand Color</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {COLORS.map(c=>(
                  <button key={c} onClick={()=>updTheme({primaryColor:c})} className={`w-7 h-7 rounded-lg border-2 transition hover:scale-110 ${config.theme.primaryColor===c?"border-gray-800":"border-transparent"}`} style={{backgroundColor:c}}/>
                ))}
              </div>
              <input type="color" value={config.theme.primaryColor} onChange={e=>updTheme({primaryColor:e.target.value})} className="w-full h-9 rounded-lg cursor-pointer border border-gray-200"/>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Background</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {["#ffffff","#f8f9fa","#f0f4ff","#0f172a","#1e1b4b"].map(c=>(
                  <button key={c} onClick={()=>updTheme({bgColor:c})} className={`w-7 h-7 rounded-lg border-2 transition hover:scale-110 ${config.theme.bgColor===c?"border-indigo-500":"border-gray-200"}`} style={{backgroundColor:c}}/>
                ))}
              </div>
              <input type="color" value={config.theme.bgColor} onChange={e=>updTheme({bgColor:e.target.value})} className="w-full h-9 rounded-lg cursor-pointer border border-gray-200"/>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Button Shape</label>
              <div className="grid grid-cols-3 gap-2">
                {([{v:"rounded",r:"10px"},{v:"pill",r:"9999px"},{v:"sharp",r:"4px"}] as const).map(s=>(
                  <button key={s.v} onClick={()=>updTheme({buttonStyle:s.v})} className={`py-2 text-xs font-semibold border transition capitalize ${config.theme.buttonStyle===s.v?"border-indigo-400 bg-indigo-50 text-indigo-700":"border-gray-200 text-gray-600"}`} style={{borderRadius:s.r}}>{s.v}</button>
                ))}
              </div>
            </div>
            {/* Mini preview */}
            <div className="border-t pt-4">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-3">Preview</label>
              <div className="rounded-xl overflow-hidden border" style={{background:config.theme.bgColor}}>
                <div className="h-1" style={{background:config.theme.primaryColor}}/>
                <div className="p-4">
                  <p className="text-xs font-bold mb-3" style={{color:config.theme.textColor}}>{selQ?.label||config.title||"Question text"}</p>
                  <div className="text-white text-xs text-center py-2 font-semibold" style={{background:config.theme.primaryColor,borderRadius:br}}>Continue →</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
