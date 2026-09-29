const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tk=n=>'৳'+Number(n).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:2});
let D,S;
const save=()=>{try{localStorage.setItem('eh-web',JSON.stringify(S))}catch(e){}};
let tab='shop',q='',cf='All',game='',pk=null,mode='login',reviewFor=null,tt;
const me=()=>S.users.find(u=>u.email===S.session)||null;
const adm=()=>me()?.role==='admin';
const toast=m=>{const t=$('toast');t.textContent=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),2200)};
const icon=c=>(D.categories.find(x=>x.n===c)||{i:'🎮'}).i;
const rating=id=>{const r=S.reviews.filter(x=>x.pid===id);return r.length?{avg:r.reduce((a,b)=>a+b.rating,0)/r.length,n:r.length}:null};
const disc=(code,amt)=>{const p=D.discounts[(code||'').trim().toUpperCase()];return p?{p,amt:amt*p/100}:null};
const nid=p=>p+String(S.seq++).padStart(4,'0');

function chrome(){
  const t=[['shop','Shop'],['coins','🪙 Buy Game Coins'],['wish','♡ Wishlist'],['orders',adm()?'Order Pipeline':'My Orders']];
  if(adm())t.push(['admin','Admin Panel']);
  $('nav').innerHTML=t.map(x=>`<button data-tab="${x[0]}" ${tab===x[0]?'aria-current="page"':''}>${x[1]}</button>`).join('');
  const u=me(),n=Object.values(S.cart).reduce((a,b)=>a+b,0);
  $('auth').innerHTML=(u?`Welcome, <b>${esc(u.name)}</b><button class="btn sm ghost" data-a="logout" style="color:#fff">Logout</button>`:`<button class="btn sm org" data-a="login">Login / Sign up</button>`)+`<button class="btn sm" data-a="cart">🛒 View Cart (${n})</button>`;
}
function view(){
  chrome();
  $('view').innerHTML=({shop:shopH,coins:coinsH,wish:wishH,orders:ordersH,admin:adminH}[tab]||shopH)();
  if(tab==='shop')grid();
  if(tab==='coins')coinSum();
}

function shopH(){
  return `<h1>Gear up for the next match</h1><p class="lead">Headsets, controllers, keyboards and team jerseys, plus instant PUBG Mobile and Free Fire top-ups.</p>
  <div class="bar"><input id="sq" type="search" placeholder="Search products..." aria-label="Search products" value="${esc(q)}">
  <select id="cf" aria-label="Category"><option>All</option>${D.categories.map(c=>`<option ${c.n===cf?'selected':''}>${c.n}</option>`).join('')}</select></div><div class="grid" id="grid"></div>`;
}
function grid(){
  const l=S.products.filter(p=>(cf==='All'||p.cat===cf)&&p.name.toLowerCase().includes(q.toLowerCase()));
  const w=S.wish[S.session]||[];
  $('grid').innerHTML=l.map(p=>{const r=rating(p.id);return `<article class="card"><div class="art">${icon(p.cat)}</div><div class="cb"><small>${esc(p.cat)}</small><h3>${esc(p.name)}</h3>
  <small>${r?`<span class="stars">${'★'.repeat(Math.round(r.avg))}</span> ${r.avg.toFixed(1)} (${r.n})`:'No reviews yet'} · Stock: ${p.stock}</small>
  <div class="row"><span class="price">${tk(p.price)}</span><span><button class="btn sm ghost" data-wish="${p.id}" aria-label="Toggle wishlist">${w.includes(p.id)?'♥':'♡'}</button> <button class="btn sm org" data-add="${p.id}" ${p.stock?'':'disabled'}>Add to Cart</button></span></div>
  <button class="btn sm ghost" data-rev="${p.id}">Write Review</button></div></article>`}).join('')||'<p>No products match your search.</p>';
}

function coinsH(){
  const packs=S.packs.filter(p=>p.game===game),unit=D.games.find(g=>g.name===game).unit;
  return `<h1>Buy game coins</h1><p class="lead">Pick a game and package, enter your Player ID and pay. Discount codes: ${Object.keys(D.discounts).join(', ')}.</p>
  <div class="gtabs">${D.games.map(g=>`<button class="btn ghost" data-game="${g.name}" aria-pressed="${g.name===game}">${g.name}</button>`).join('')}</div>
  <div class="packs">${packs.map(p=>`<button class="pk" data-pk="${p.id}" aria-pressed="${pk===p.id}"><b>${p.coins} ${unit}</b>${tk(p.price)}</button>`).join('')}</div>
  <div class="panel"><div class="field"><label for="pid">Player ID</label><input id="pid" placeholder="Enter your Player ID"></div>
  <div class="field"><label for="cq">Number of packages</label><input id="cq" type="number" min="1" value="1"></div>
  <div class="field"><label for="cd">Discount code (optional)</label><input id="cd" placeholder="e.g. GAME10"></div>
  <div class="field"><label for="cp">Payment method</label><select id="cp">${D.payments.map(m=>`<option>${m}</option>`).join('')}</select></div>
  <div class="sum" id="csum"></div><br><button class="btn org" data-a="buycoin">Buy now</button></div>`;
}
function coinSum(){
  const el=$('csum');if(!el)return;
  const p=S.packs.find(x=>x.id===pk),n=Math.max(1,parseInt($('cq').value)||1);
  if(!p){el.innerHTML='<span class="muted">Choose a package to see the total.</span>';return}
  const sub=p.price*n,d=disc($('cd').value,sub),tot=sub-(d?d.amt:0);
  el.innerHTML=`<div><span>${p.game} · ${p.coins*n} coins</span><span>${tk(sub)}</span></div>${d?`<div><span>Discount (${d.p}%)</span><span>-${tk(d.amt)}</span></div>`:''}<div class="t"><span>Final total</span><span>${tk(tot)}</span></div>`;
}

function wishH(){
  const w=S.wish[S.session]||[],l=S.products.filter(p=>w.includes(p.id));
  if(!me())return `<h1>Wishlist</h1><p class="lead">Log in to save products.</p>`;
  return `<h1>Wishlist</h1>${l.length?`<div class="grid">${l.map(p=>`<article class="card"><div class="art">${icon(p.cat)}</div><div class="cb"><h3>${esc(p.name)}</h3><div class="row"><span class="price">${tk(p.price)}</span><span><button class="btn sm ghost" data-wish="${p.id}">Remove</button> <button class="btn sm org" data-add="${p.id}">Add to Cart</button></span></div></div></article>`).join('')}</div>`:'<p class="lead">Your wishlist is empty.</p>'}`;
}

function ordersH(){
  const u=me();if(!u)return `<h1>Orders</h1><p class="lead">Log in to see orders.</p>`;
  const o=S.orders.filter(x=>adm()||x.email===u.email).slice().reverse(),c=S.coins.filter(x=>adm()||x.email===u.email).slice().reverse();
  return `<h1>${adm()?'Order Pipeline':'My Orders'}</h1><div class="panel wrap"><h2>Product orders</h2><table><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th></tr>
  ${o.map(x=>`<tr><td>${x.id}</td><td>${esc(x.name)}</td><td>${esc(x.items)}</td><td>${tk(x.total)}${x.dc?` <small class="muted">(${x.dc}% off)</small>`:''}</td><td>${esc(x.method)}</td><td>${adm()?`<select data-st="${x.id}">${D.pipeline.map(s=>`<option ${s===x.status?'selected':''}>${s}</option>`).join('')}</select>`:`<span class="badge ${x.status==='Delivered'?'ok':''}">${x.status}</span>`}</td></tr>`).join('')||'<tr><td colspan="6">No orders available.</td></tr>'}</table></div>
  <div class="panel wrap"><h2>${adm()?'Coin purchase history':'My coin purchases'}</h2><table><tr><th>ID</th><th>Customer</th><th>Game</th><th>Coins</th><th>Player ID</th><th>Total</th><th>Payment</th></tr>
  ${c.map(x=>`<tr><td>${x.id}</td><td>${esc(x.name)}</td><td>${esc(x.game)}</td><td>${x.coins}</td><td>${esc(x.pid)}</td><td>${tk(x.total)}${x.dc?` <small class="muted">(${x.dc}% off)</small>`:''}</td><td>${esc(x.method)} <span class="badge ok">Paid</span></td></tr>`).join('')||'<tr><td colspan="7">No coin purchases available.</td></tr>'}</table></div>`;
}

function adminH(){
  return `<h1>Admin panel</h1>
  <div class="panel"><h2>Add product</h2><div class="field"><label for="an">Product name</label><input id="an"></div>
  <div class="field"><label for="ap">Price (৳)</label><input id="ap" type="number" min="1"></div>
  <div class="field"><label for="as">Stock</label><input id="as" type="number" min="0" value="10"></div>
  <div class="field"><label for="ac">Category</label><select id="ac">${D.categories.map(c=>`<option>${c.n}</option>`).join('')}</select></div>
  <button class="btn org" data-a="addprod">Add product</button></div>
  <div class="panel wrap"><h2>Products</h2><table><tr><th>Name</th><th>Category</th><th>Price (৳)</th><th>Stock</th><th></th></tr>
  ${S.products.map(p=>`<tr><td>${esc(p.name)}</td><td>${esc(p.cat)}</td><td><input type="number" min="1" value="${p.price}" data-pp="${p.id}" aria-label="Price ${esc(p.name)}"></td><td><input type="number" min="0" value="${p.stock}" data-ps="${p.id}" aria-label="Stock ${esc(p.name)}"></td><td><button class="btn sm ghost" data-del="${p.id}">Remove Product</button></td></tr>`).join('')}</table></div>
  <div class="panel wrap"><h2>Coin package prices</h2><table><tr><th>Game</th><th>Package</th><th>Price (৳)</th></tr>
  ${S.packs.map(p=>`<tr><td>${esc(p.game)}</td><td>${p.coins}</td><td><input type="number" min="1" value="${p.price}" data-cp="${p.id}" aria-label="Price ${p.game} ${p.coins}"></td></tr>`).join('')}</table></div>`;
}

/* cart */
function cartRows(){return Object.entries(S.cart).map(([id,n])=>({p:S.products.find(x=>x.id===id),n})).filter(r=>r.p)}
function drawCart(){
  const r=cartRows(),sub=r.reduce((a,b)=>a+b.p.price*b.n,0),cd=$('cdc')?$('cdc').value:'',d=disc(cd,sub),tot=sub-(d?d.amt:0);
  const m=$('cpm')?$('cpm').value:D.payments[0];
  $('cart').innerHTML=`<div class="line" style="border:0"><h2 style="margin:0">Shopping Cart</h2><button class="btn sm ghost" data-a="closecart">Close</button></div>
  <div>${r.map(x=>`<div class="line"><div><b>${esc(x.p.name)}</b><br><small class="muted">${tk(x.p.price)}</small></div><div><button class="btn sm ghost" data-q="-1" data-id="${x.p.id}" aria-label="Remove one">−</button> ${x.n} <button class="btn sm ghost" data-q="1" data-id="${x.p.id}" aria-label="Add one">+</button></div></div>`).join('')||'<p class="muted">Your cart is empty.</p>'}</div>
  <div class="field" style="margin-top:12px"><label for="cdc">Discount code (optional)</label><input id="cdc" value="${esc(cd)}" placeholder="GAME10"></div>
  <div class="field"><label for="cpm">Payment method</label><select id="cpm">${D.payments.map(x=>`<option ${x===m?'selected':''}>${x}</option>`).join('')}</select></div>
  <div class="sum"><div><span>Subtotal</span><span>${tk(sub)}</span></div>${d?`<div><span>Discount (${d.p}%)</span><span>-${tk(d.amt)}</span></div>`:''}<div class="t"><span>Final total</span><span>${tk(tot)}</span></div></div>
  <br><button class="btn org" data-a="checkout">Checkout</button>`;
}

/* modals */
function modal(h){$('modal').innerHTML=h;$('ov').classList.add('open')}
function closeM(){$('ov').classList.remove('open')}
function authM(){
  modal(`<h2>${mode==='login'?'Log in':'Sign up'}</h2><div class="gtabs"><button class="btn sm ghost" data-mode="login" aria-pressed="${mode==='login'}">Login</button><button class="btn sm ghost" data-mode="signup" aria-pressed="${mode==='signup'}">Sign up</button></div>
  ${mode==='signup'?'<div class="field"><label for="mn">Name</label><input id="mn" autocomplete="name"></div>':''}
  <div class="field"><label for="me">Email</label><input id="me" type="email" autocomplete="username"></div>
  <div class="field"><label for="mp">Password</label><input id="mp" type="password" autocomplete="current-password"></div>
  <div class="err" id="merr"></div><button class="btn org" data-a="doauth">${mode==='login'?'Log in':'Create account'}</button> <button class="btn ghost" data-a="closem">Cancel</button>
  <p class="muted" style="font-size:.85rem">Admin demo: admin@esport.com / admin123</p>`);
}
function needLogin(){if(me())return false;mode='login';authM();toast('Please log in first');return true}

document.addEventListener('click',e=>{
  const t=e.target.closest('button');if(!t)return;const d=t.dataset;
  if(d.tab){tab=d.tab;view()}
  else if(d.mode){mode=d.mode;authM()}
  else if(d.game){game=d.game;pk=null;view()}
  else if(d.pk){pk=d.pk;const v=[$('pid').value,$('cq').value,$('cd').value,$('cp').value];view();[$('pid').value,$('cq').value,$('cd').value,$('cp').value]=v;coinSum()}
  else if(d.add){if(needLogin())return;const p=S.products.find(x=>x.id===d.add);if((S.cart[d.add]||0)+1>p.stock){toast('Not enough stock');return}S.cart[d.add]=(S.cart[d.add]||0)+1;save();chrome();drawCart();toast('Product added to cart.')}
  else if(d.q){const p=S.products.find(x=>x.id===d.id),n=(S.cart[d.id]||0)+ +d.q;if(n>p.stock){toast('Not enough stock');return}if(n<=0)delete S.cart[d.id];else S.cart[d.id]=n;save();chrome();drawCart()}
  else if(d.wish){if(needLogin())return;const w=S.wish[S.session]=S.wish[S.session]||[],i=w.indexOf(d.wish);i<0?w.push(d.wish):w.splice(i,1);save();view()}
  else if(d.rev){if(needLogin())return;reviewFor=d.rev;const p=S.products.find(x=>x.id===d.rev);modal(`<h2>Write Review</h2><p class="muted">${esc(p.name)}</p><div class="field"><label for="rr">Rating</label><select id="rr"><option>5</option><option>4</option><option>3</option><option>2</option><option>1</option></select></div><div class="field"><label for="rc">Comment</label><textarea id="rc" rows="3"></textarea></div><button class="btn org" data-a="subrev">Submit Review</button> <button class="btn ghost" data-a="closem">Cancel</button>`)}
  else if(d.del){S.products=S.products.filter(p=>p.id!==d.del);delete S.cart[d.del];save();view();toast('Product removed.')}
  else switch(d.a){
    case'login':mode='login';authM();break;
    case'logout':S.session=null;save();tab='shop';view();drawCart();toast('Logged out');break;
    case'cart':drawCart();$('cart').classList.add('open');break;
    case'closecart':$('cart').classList.remove('open');break;
    case'closem':closeM();break;
    case'doauth':{
      const em=$('me').value.trim().toLowerCase(),pw=$('mp').value,er=$('merr');
      if(!em||!pw){er.textContent='Enter your email and password.';break}
      if(mode==='signup'){
        const nm=$('mn').value.trim();if(!nm){er.textContent='Enter your name.';break}
        if(S.users.some(u=>u.email===em)){er.textContent='That email is already registered.';break}
        S.users.push({name:nm,email:em,pw,role:'customer'});S.session=em;
      }else{
        const u=S.users.find(x=>x.email===em&&x.pw===pw);if(!u){er.textContent='Wrong email or password.';break}S.session=em;
      }
      save();closeM();if(adm())tab='admin';view();toast('Welcome, '+me().name);break}
    case'subrev':S.reviews.push({id:nid('REV-'),pid:reviewFor,email:S.session,rating:+$('rr').value,comment:$('rc').value.trim()});save();closeM();view();toast('Review submitted successfully.');break;
    case'checkout':{
      const r=cartRows();if(!r.length){toast('Your cart is empty.');break}if(needLogin())break;
      const sub=r.reduce((a,b)=>a+b.p.price*b.n,0),dcode=$('cdc').value,d=disc(dcode,sub);
      if(dcode.trim()&&!d){toast('Invalid discount code. No discount applied.')}
      if(r.some(x=>x.n>x.p.stock)){toast('Not enough stock');break}
      r.forEach(x=>x.p.stock-=x.n);
      S.orders.push({id:nid('ORD-'),email:S.session,name:me().name,items:r.map(x=>x.n+'× '+x.p.name).join(', '),total:sub-(d?d.amt:0),dc:d?d.p:0,method:$('cpm').value,status:'Processing'});
      S.cart={};save();$('cart').classList.remove('open');tab='orders';view();toast('Order confirmed!');break}
    case'buycoin':{
      const p=S.packs.find(x=>x.id===pk),n=parseInt($('cq').value),id=$('pid').value.trim();
      if(!p){toast('Choose a package first');break}
      if(!id){toast('Player ID is required.');break}
      if(!(n>0)){toast('Package quantity must be positive.');break}
      if(needLogin())break;
      const dcode=$('cd').value,d=disc(dcode,p.price*n);
      if(dcode.trim()&&!d){toast('Invalid code. No discount applied.')}
      S.coins.push({id:nid('COIN-'),email:S.session,name:me().name,game:p.game,coins:p.coins*n,pid:id,total:p.price*n-(d?d.amt:0),dc:d?d.p:0,method:$('cp').value});
      pk=null;save();tab='orders';view();toast('Coin purchase successful!');break}
    case'addprod':{
      const n=$('an').value.trim(),pr=+$('ap').value,st=parseInt($('as').value);
      if(!n||!(pr>0)||!(st>=0)){toast('Invalid product data.');break}
      S.products.push({id:nid('P'),name:n,price:pr,stock:st,cat:$('ac').value});save();view();toast('Product added successfully.');break}
  }
});
document.addEventListener('input',e=>{
  const t=e.target;
  if(t.id==='sq'){q=t.value;grid()}
  if(['cq','cd'].includes(t.id))coinSum();
  if(t.id==='cdc'||t.id==='cpm')drawCart();
  if(t.id==='cdc'){const el=$('cdc');el.focus();el.setSelectionRange(el.value.length,el.value.length)}
});
document.addEventListener('change',e=>{
  const t=e.target,d=t.dataset;
  if(t.id==='cf'){cf=t.value;grid()}
  if(d.st){S.orders.find(o=>o.id===d.st).status=t.value;save();toast('Order status updated')}
  if(d.pp){S.products.find(p=>p.id===d.pp).price=Math.max(1,+t.value);save();toast('Price updated')}
  if(d.ps){S.products.find(p=>p.id===d.ps).stock=Math.max(0,parseInt(t.value)||0);save();toast('Stock updated')}
  if(d.cp){S.packs.find(p=>p.id===d.cp).price=Math.max(1,+t.value);save();toast('Package price updated')}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();$('cart').classList.remove('open')}});
/* Start: load data.json (falls back to the copy inside index.html when opened by double-click) */
async function boot(){
  try{const r=await fetch('data.json');if(!r.ok)throw 0;D=await r.json()}
  catch(e){D=JSON.parse($('seed').textContent)}
  try{S=JSON.parse(localStorage.getItem('eh-web'))}catch(e){}
  if(!S||!S.products)S={products:D.products,packs:D.packs,users:[{name:'Admin',email:'admin@esport.com',pw:'admin123',role:'admin'}],orders:[],coins:[],reviews:[],wish:{},cart:{},session:null,seq:1};
  game=D.games[0].name;
  view();drawCart();
}
boot();
