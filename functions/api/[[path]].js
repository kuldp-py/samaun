const json = (data, status=200, headers={}) => new Response(JSON.stringify(data), {status, headers:{'content-type':'application/json; charset=utf-8', ...headers}});
const cors = {'access-control-allow-origin':'*','access-control-allow-headers':'Content-Type','access-control-allow-methods':'GET,POST,PUT,DELETE,OPTIONS'};
const withCors = (r)=>{ const h=new Headers(r.headers); Object.entries(cors).forEach(([k,v])=>h.set(k,v)); return new Response(r.body,{status:r.status,headers:h}); };
const slugify = s => String(s||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
const cookie = (name, value, maxAge=86400) => `${name}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;

async function sign(value, secret){ const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']); const sig=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value)); return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
const b64u = s => btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const fromB64u = s => { s=s.replace(/-/g,'+').replace(/_/g,'/'); while(s.length%4) s+='='; return atob(s); };
async function auth(request, env){
  const c=request.headers.get('Cookie')||''; const m=c.match(/samaun_admin=([^;]+)/); if(!m) return false;
  const [exp,sig]=fromB64u(m[1]).split('.');
  if(!exp||Date.now()>Number(exp)) return false; const expected=await sign(exp,env.ADMIN_SESSION_SECRET||'change-me'); return sig===expected;
}
async function requireAuth(request, env){ if(!(await auth(request,env))) return json({error:'Unauthorized'},401,cors); return null; }
function imgUrl(key){ return key ? `/api/image/${encodeURIComponent(key)}` : '/placeholder.svg'; }

export async function onRequest(context){
  const {request,env}=context; if(request.method==='OPTIONS') return withCors(new Response(null,{status:204}));
  const url=new URL(request.url); const path=url.pathname.replace(/^\/api\/?/,'').split('/').filter(Boolean); const method=request.method;
  try {
    if(path[0]==='image' && path[1]){ const key=decodeURIComponent(path.slice(1).join('/')); const obj=await env.IMAGES.get(key); if(!obj) return new Response('Not found',{status:404}); const h=new Headers(); obj.writeHttpMetadata(h); h.set('cache-control','public, max-age=31536000, immutable'); return new Response(obj.body,{headers:h}); }
    if(path[0]==='auth' && path[1]==='login' && method==='POST'){
      const body=await request.json(); if(!env.ADMIN_PASSWORD) return json({error:'ADMIN_PASSWORD is not configured'},500,cors); if(body.password!==env.ADMIN_PASSWORD) return json({error:'Invalid password'},401,cors);
      const exp=Date.now()+86400000; const sig=await sign(String(exp),env.ADMIN_SESSION_SECRET||env.ADMIN_PASSWORD); const token=b64u(`${exp}.${sig}`); return json({ok:true},{headers:{'set-cookie':cookie('samaun_admin',token)}});
    }
    if(path[0]==='auth' && path[1]==='logout'){ return json({ok:true},200,{...cors,'set-cookie':cookie('samaun_admin','',0)}); }
    if(path[0]==='settings' && method==='GET'){ const rows=await env.DB.prepare('SELECT key,value FROM settings').all(); return withCors(json(Object.fromEntries(rows.results.map(r=>[r.key,r.value])))); }
    if(path[0]==='categories' && method==='GET'){ const rows=await env.DB.prepare('SELECT * FROM categories WHERE active=1 ORDER BY name').all(); return withCors(json(rows.results)); }
    if(path[0]==='products' && method==='GET'){
      const q=url.searchParams.get('q')||''; const category=url.searchParams.get('category')||''; let sql=`SELECT p.*, c.name category_name FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.active=1`; const args=[];
      if(q){sql+=' AND (p.name LIKE ? OR p.description LIKE ? OR p.tags LIKE ?)'; const x=`%${q}%`; args.push(x,x,x);} if(category){sql+=' AND c.slug=?'; args.push(category);} sql+=' ORDER BY p.featured DESC,p.created_at DESC'; const rows=await env.DB.prepare(sql).bind(...args).all(); return withCors(json(rows.results.map(p=>({...p,image:imgUrl(p.image_key),price:Number(p.price),compare_price:p.compare_price?Number(p.compare_price):null,stock:Number(p.stock)}))));
    }
    if(path[0]==='orders' && path[1] && method==='PUT'){
      const b=await request.json(); if(!b.utr) return withCors(json({error:'UTR required'},400));
      await env.DB.prepare('UPDATE orders SET utr=?,updated_at=CURRENT_TIMESTAMP WHERE order_number=?').bind(String(b.utr).trim(),path[1]).run();
      return withCors(json({ok:true}));
    }
    if(path[0]==='orders' && method==='POST'){
      const b=await request.json(); if(!b.customer?.name||!b.customer?.phone||!b.customer?.address||!Array.isArray(b.items)||!b.items.length) return withCors(json({error:'Missing required order details'},400));
      const ids=b.items.map(i=>Number(i.productId)).filter(Boolean); const placeholders=ids.map(()=>'?').join(','); const prod=await env.DB.prepare(`SELECT id,name,price,stock,image_key FROM products WHERE id IN (${placeholders}) AND active=1`).bind(...ids).all(); const map=new Map(prod.results.map(p=>[p.id,p]));
      let subtotal=0; const items=[]; for(const i of b.items){const p=map.get(Number(i.productId)); const qty=Math.max(1,Math.min(99,Number(i.qty)||1)); if(!p) continue; if(Number(p.stock)<qty) return withCors(json({error:`Insufficient stock for ${p.name}`},400)); subtotal+=Number(p.price)*qty; items.push({productId:p.id,name:p.name,price:Number(p.price),qty,image:imgUrl(p.image_key)});} if(!items.length) return withCors(json({error:'No valid products'},400));
      const shipping=Number(b.shipping)||0,total=subtotal+shipping, orderNumber=`SM${Date.now().toString().slice(-8)}`;
      await env.DB.prepare(`INSERT INTO orders(order_number,customer_name,phone,email,address,city,state,pincode,items_json,subtotal,shipping,total,payment_method) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(orderNumber,b.customer.name,b.customer.phone,b.customer.email||'',b.customer.address,b.customer.city||'',b.customer.state||'Uttarakhand',b.customer.pincode||'',JSON.stringify(items),subtotal,shipping,total,'UPI').run();
      for(const i of items) await env.DB.prepare('UPDATE products SET stock=stock-?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(i.qty,i.productId).run();
      return withCors(json({ok:true,orderNumber,total,items},201));
    }
    const admin = path[0]==='admin';
    if(admin){ const denied=await requireAuth(request,env); if(denied) return withCors(denied); }
    if(admin && path[1]==='orders' && method==='GET'){ const rows=await env.DB.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 500').all(); return withCors(json(rows.results.map(o=>({...o,items:JSON.parse(o.items_json)})))); }
    if(admin && path[1]==='orders' && path[2] && method==='PUT'){ const id=Number(path[2]), b=await request.json(); const fields=[]; const vals=[]; for(const k of ['payment_status','order_status','utr']) if(b[k]!==undefined){fields.push(`${k}=?`);vals.push(b[k]);} fields.push('updated_at=CURRENT_TIMESTAMP'); await env.DB.prepare(`UPDATE orders SET ${fields.join(',')} WHERE id=?`).bind(...vals,id).run(); return withCors(json({ok:true})); }
    if(admin && path[1]==='products' && method==='GET'){ const rows=await env.DB.prepare('SELECT p.*,c.name category_name FROM products p LEFT JOIN categories c ON c.id=p.category_id ORDER BY p.created_at DESC').all(); return withCors(json(rows.results.map(p=>({...p,image:imgUrl(p.image_key)})))); }
    if(admin && path[1]==='products' && method==='POST'){ const b=await request.json(); const slug=slugify(b.slug||b.name)+`-${Date.now().toString().slice(-5)}`; const r=await env.DB.prepare(`INSERT INTO products(name,slug,description,category_id,price,compare_price,stock,image_key,active,featured,tags) VALUES(?,?,?,?,?,?,?,?,?,?,?)`).bind(b.name,slug,b.description||'',b.category_id?Number(b.category_id):null,Math.round(Number(b.price)||0),b.compare_price?Math.round(Number(b.compare_price)):null,Math.max(0,Number(b.stock)||0),b.image_key||null,b.active===false?0:1,b.featured?1:0,b.tags||'').run(); return withCors(json({ok:true,id:r.meta.last_row_id},201)); }
    if(admin && path[1]==='products' && path[2] && method==='PUT'){ const id=Number(path[2]),b=await request.json(); await env.DB.prepare(`UPDATE products SET name=?,description=?,category_id=?,price=?,compare_price=?,stock=?,image_key=?,active=?,featured=?,tags=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(b.name,b.description||'',b.category_id?Number(b.category_id):null,Math.round(Number(b.price)||0),b.compare_price?Math.round(Number(b.compare_price)):null,Math.max(0,Number(b.stock)||0),b.image_key||null,b.active?1:0,b.featured?1:0,b.tags||'',id).run(); return withCors(json({ok:true})); }
    if(admin && path[1]==='products' && path[2] && method==='DELETE'){ await env.DB.prepare('DELETE FROM products WHERE id=?').bind(Number(path[2])).run(); return withCors(json({ok:true})); }
    if(admin && path[1]==='categories' && method==='POST'){ const b=await request.json(); await env.DB.prepare('INSERT INTO categories(name,slug,description) VALUES(?,?,?)').bind(b.name,slugify(b.name),b.description||'').run(); return withCors(json({ok:true},201)); }
    if(admin && path[1]==='settings' && method==='PUT'){ const b=await request.json(); for(const [k,v] of Object.entries(b)) await env.DB.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(k,String(v)).run(); return withCors(json({ok:true})); }
    if(admin && path[1]==='upload' && method==='POST'){ const form=await request.formData(); const file=form.get('file'); if(!file || typeof file.arrayBuffer!=='function') return withCors(json({error:'Image file required'},400)); if(file.size>5*1024*1024) return withCors(json({error:'Max image size is 5MB'},400)); const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,''); const key=`products/${crypto.randomUUID()}.${ext}`; await env.IMAGES.put(key,await file.arrayBuffer(),{httpMetadata:{contentType:file.type||'image/jpeg'}}); return withCors(json({ok:true,key,url:imgUrl(key)})); }
    return withCors(json({error:'Not found'},404));
  } catch(e){ return withCors(json({error:e.message||'Server error'},500)); }
}
