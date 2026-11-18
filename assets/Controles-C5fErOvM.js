import{c as n,r as u,j as e,g as V,Z as q}from"./index-UFOp4vkz.js";/**
 * @license lucide-react v1.70.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const v={name:"box",size:24,node:[["path",{d:"M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z",key:"hh9hay"}],["path",{d:"m3.3 7 8.7 5 8.7-5",key:"g66t2b"}],["path",{d:"M12 22V12",key:"d0xqtd"}]]};v.node;const P=n(v);/**
 * @license lucide-react v1.70.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f={name:"gauge",size:24,node:[["path",{d:"m12 14 4-4",key:"9kzdfg"}],["path",{d:"M3.34 19a10 10 0 1 1 17.32 0",key:"19p75a"}]]};f.node;const D=n(f);/**
 * @license lucide-react v1.70.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const N={name:"pause",size:24,node:[["rect",{x:"14",y:"3",width:"5",height:"18",rx:"1",key:"kaeet6"}],["rect",{x:"5",y:"3",width:"5",height:"18",rx:"1",key:"1wsw3u"}]]};N.node;const A=n(N);/**
 * @license lucide-react v1.70.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const k={name:"play",size:24,node:[["path",{d:"M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z",key:"10ikf1"}]]};k.node;const E=n(k);/**
 * @license lucide-react v1.70.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const z={name:"plus",size:24,node:[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]]};z.node;const T=n(z);/**
 * @license lucide-react v1.70.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const C={name:"rotate-ccw",size:24,node:[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}]]};C.node;const F=n(C);/**
 * @license lucide-react v1.70.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const M={name:"thermometer",size:24,node:[["path",{d:"M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z",key:"17jzev"}]]};M.node;const I=n(M);/**
 * @license lucide-react v1.70.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _={name:"waves-horizontal",size:24,node:[["path",{d:"M2 12q2.5 2 5 0t5 0 5 0 5 0",key:"8ddzzs"}],["path",{d:"M2 19q2.5 2 5 0t5 0 5 0 5 0",key:"1wj4st"}],["path",{d:"M2 5q2.5 2 5 0t5 0 5 0 5 0",key:"69x50u"}]],aliases:["waves"]};_.node;const L=n(_);function r({icono:s,etiqueta:a,valor:m,min:x,max:l,paso:p,onChange:y,mostrar:i,ayuda:h}){const d=u.useId();return e.jsxs("div",{className:"space-y-1",children:[e.jsxs("div",{className:"flex items-baseline justify-between gap-2",children:[e.jsxs("label",{htmlFor:d,className:"flex items-center gap-1.5 text-[15px] font-bold",children:[e.jsx(s,{size:16,"aria-hidden":!0,className:"text-tinta-suave"}),a]}),e.jsx("output",{htmlFor:d,className:"lectura text-[15px]",children:i})]}),e.jsx("input",{id:d,type:"range",min:x,max:l,step:p,value:m,"aria-valuetext":i,onChange:b=>y(Number(b.target.value)),className:"w-full"}),h&&e.jsx("p",{className:"text-[13px] leading-snug text-tinta-suave",children:h})]})}const U=s=>Math.log10(s),S=s=>Math.round(10**s*10)/10;function R({quimica:s,params:a,onParams:m,permitidos:x,especies:l,onInyectar:p,onChispa:y}){const[i,h]=u.useState(l[0]??""),[d,b]=u.useState(20),c=t=>w=>m({...a,[t]:w}),o=t=>x.includes(t),g=u.useId(),j=u.useId(),$=Math.round(a.T-273.15);return e.jsxs("div",{className:"space-y-4",children:[o("T")&&e.jsx(r,{icono:I,etiqueta:"Temperatura",valor:a.T,min:0,max:3e3,paso:5,onChange:c("T"),mostrar:`${a.T} K`,ayuda:`${$} °C · K = °C + 273`}),o("P")&&e.jsx(r,{icono:D,etiqueta:"Presión",valor:U(a.P),min:-1,max:2,paso:.01,onChange:t=>c("P")(S(t)),mostrar:`${a.P} atm`,ayuda:"1 atm = presión del aire a nivel del mar"}),o("V")&&e.jsx(r,{icono:P,etiqueta:"Volumen",valor:a.V,min:1,max:50,paso:1,onChange:c("V"),mostrar:`${a.V} L`}),o("UV")&&e.jsx(r,{icono:V,etiqueta:"Luz UV",valor:a.UV,min:0,max:1e3,paso:10,onChange:c("UV"),mostrar:`${a.UV} W/m²`,ayuda:a.UV===0?"Lámpara apagada":"Más intensidad = más fotones"}),o("lambda")&&e.jsx(r,{icono:L,etiqueta:"Longitud de onda",valor:a.lambda,min:100,max:400,paso:5,onChange:c("lambda"),mostrar:`${a.lambda} nm`,ayuda:`Cada fotón: ${Math.round(119627/a.lambda)} kJ/mol`}),o("inyectar")&&l.length>0&&e.jsxs("fieldset",{className:"space-y-2 rounded-lg border-2 border-linea p-3",children:[e.jsx("legend",{className:"px-1 text-[15px] font-bold",children:"Inyector"}),e.jsxs("div",{className:"flex flex-wrap gap-2",role:"radiogroup","aria-labelledby":g,children:[e.jsx("span",{id:g,className:"sr-only",children:"Especie a inyectar"}),l.map(t=>e.jsx("button",{type:"button",role:"radio","aria-checked":i===t,onClick:()=>h(t),className:`min-h-[44px] min-w-[52px] rounded-lg border-2 px-3 font-bold ${i===t?"border-tinta bg-tinta text-papel":"border-linea bg-superficie"}`,children:s.especies[t].formula},t))]}),e.jsxs("div",{className:"flex items-end gap-2",children:[e.jsxs("label",{htmlFor:j,className:"flex-1",children:[e.jsx("span",{className:"etiqueta",children:"Cantidad"}),e.jsx("input",{id:j,type:"number",min:1,max:200,value:d,onChange:t=>b(Math.max(1,Math.min(200,Number(t.target.value)||1))),className:"campo lectura"})]}),e.jsxs("button",{type:"button",className:"btn btn-secundario",onClick:()=>p(i,d),children:[e.jsx(T,{size:18,"aria-hidden":!0})," Inyectar"]})]})]}),o("chispa")&&e.jsxs("button",{type:"button",className:"btn btn-sodio w-full",onClick:y,children:[e.jsx(q,{size:18,"aria-hidden":!0})," Chispa"]})]})}export{R as C,A as P,F as R,E as a};
