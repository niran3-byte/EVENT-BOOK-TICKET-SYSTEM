import React,{useEffect,useState,createContext,useContext} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter,Routes,Route,Link,NavLink,useNavigate,useParams,useSearchParams,Navigate} from 'react-router-dom';
import axios from 'axios';
import './styles.css';

/* ───────── API + auth ───────── */
const api=axios.create({baseURL:'/api'});
api.interceptors.request.use(c=>{const t=localStorage.getItem('eventbook_token');if(t)c.headers.Authorization=`Bearer ${t}`;return c;});
const AuthContext=createContext(null);
const useAuth=()=>useContext(AuthContext);
function AuthProvider({children}){
  const [user,setUser]=useState(null),[loading,setLoading]=useState(true);
  useEffect(()=>{api.get('/auth/me').then(r=>setUser(r.data.data.user)).catch(()=>{}).finally(()=>setLoading(false))},[]);
  const login=async form=>{const r=await api.post('/auth/login',form);localStorage.setItem('eventbook_token',r.data.data.token);setUser(r.data.data.user);return r.data.data.user};
  const register=async form=>{const r=await api.post('/auth/register',form);localStorage.setItem('eventbook_token',r.data.data.token);setUser(r.data.data.user);return r.data.data.user};
  const logout=()=>{localStorage.removeItem('eventbook_token');setUser(null)};
  return <AuthContext.Provider value={{user,loading,login,register,logout}}>{children}</AuthContext.Provider>;
}

/* ───────── helpers ───────── */
const FALLBACK_IMG='https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80';
const POSTERS=[
  {title:'Midnight Frequencies',tag:'Concerts',image:'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80'},
  {title:'Campus Culture Week',tag:'College fest',image:'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=800&q=80'},
  {title:'City Lights FC',tag:'Sports',image:'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80'}
];
const CATEGORIES=[
  {name:'Concerts',emoji:'🎤',note:'Live sets & late nights',tile:'linear-gradient(135deg,rgba(255,79,139,.35),rgba(123,92,255,.3))'},
  {name:'College festivals',emoji:'🎓',note:'Campus energy',tile:'linear-gradient(135deg,rgba(255,178,63,.35),rgba(255,79,139,.25))'},
  {name:'Sports',emoji:'⚽',note:'Matchday roar',tile:'linear-gradient(135deg,rgba(56,224,203,.3),rgba(123,92,255,.3))'},
  {name:'Workshops',emoji:'🛠️',note:'Learn by making',tile:'linear-gradient(135deg,rgba(123,92,255,.4),rgba(56,224,203,.25))'},
  {name:'Cultural events',emoji:'🎭',note:'Art, dance & stories',tile:'linear-gradient(135deg,rgba(255,178,63,.35),rgba(56,224,203,.25))'}
];
function formatDate(d){const date=new Date(d);return Number.isNaN(date.getTime())?'Date to be announced':new Intl.DateTimeFormat('en-IN',{weekday:'short',month:'short',day:'numeric',year:'numeric'}).format(date)}
function dateParts(d){const date=new Date(d);if(Number.isNaN(date.getTime()))return {day:'—',mon:'TBA'};return {day:date.getDate(),mon:date.toLocaleString('en-IN',{month:'short'})}}
function money(n){return `₹${Number(n).toLocaleString('en-IN')}`}

/* ───────── layout ───────── */
function Header(){
  const {user,logout}=useAuth();
  return <header className="site-header">
    <Link to="/" className="brand"><span className="brand-mark">E</span><span>EventBook</span></Link>
    <nav>
      <NavLink to="/events">Explore</NavLink>
      {user&&<><NavLink to="/bookings">My tickets</NavLink><NavLink to="/resale">Resale</NavLink><NavLink to="/groups/new">Group booking</NavLink></>}
      {user?.role==='admin'&&<NavLink to="/admin">Admin</NavLink>}
    </nav>
    <div className="header-actions">
      {user?<><span className="hello"><span className="avatar">{user.name[0]?.toUpperCase()}</span><span className="name">Hi, {user.name.split(' ')[0]}</span></span><button className="button button-ghost" onClick={logout}>Log out</button></>
      :<><Link className="button button-ghost" to="/login">Log in</Link><Link className="button button-accent" to="/register">Join free</Link></>}
    </div>
  </header>;
}
function Footer(){
  return <footer className="site-footer">
    <div><Link to="/" className="brand"><span className="brand-mark">E</span><span>EventBook</span></Link><p>Concerts, campus fests, matchdays and workshops — book your place in a few clear steps and carry a verified QR ticket.</p></div>
    <div><h4>Discover</h4><Link to="/events">All events</Link><Link to="/events?category=Concerts">Concerts</Link><Link to="/events?category=Sports">Sports</Link></div>
    <div><h4>Account</h4><Link to="/login">Log in</Link><Link to="/register">Create account</Link><Link to="/bookings">My tickets</Link></div>
    <div className="footer-base"><span>© {new Date().getFullYear()} EventBook</span><span>Demo checkout only · No payment is collected</span></div>
  </footer>;
}
function Shell({children}){return <><Header/><main>{children}</main><Footer/></>}
function Guard({children,admin=false}){
  const {user,loading}=useAuth();
  if(loading)return <PageState text="Loading your session…"/>;
  if(!user)return <Navigate to="/login" replace/>;
  if(admin&&user.role!=='admin')return <Navigate to="/" replace/>;
  return children;
}
function PageState({text='Loading…',error=false}){return <div className={`page-state ${error?'is-error':''}`}><div className="state-dot"/><p>{text}</p></div>}

/* ───────── event card ───────── */
function EventCard({event,featured=false,index=0}){
  const cats=Array.isArray(event?.ticketCategories)?event.ticketCategories:[];
  const prices=cats.map(t=>Number(t?.price)).filter(Number.isFinite);
  const lowest=prices.length?Math.min(...prices):null;
  const left=cats.reduce((n,t)=>n+(Number(t?.availableInventory)||0),0);
  const {day,mon}=dateParts(event.date);
  return <Link to={`/events/${event._id}`} className={`event-card ${featured?'featured':''}`} style={{animationDelay:`${index*70}ms`}}>
    <div className="card-media">
      <img src={event.image||FALLBACK_IMG} alt="" loading="lazy"/>
      <div className="date-badge"><b>{day}</b><span>{mon}</span></div>
      <span className="cat-pill">{event.category||'Event'}</span>
      {cats.length>0&&left<=100&&<span className="low-badge">🔥 Only {left} left</span>}
    </div>
    <div className="event-card-body">
      <h3>{event.title||'Untitled event'}</h3>
      <p>📍 {event.venue||'Venue to be announced'}</p>
      <div className="event-card-bottom"><span className="from">{lowest===null?'':'From'}</span><strong>{lowest===null?'Price TBA':money(lowest)}</strong><span className="arrow">↗</span></div>
    </div>
  </Link>;
}
const Skeletons=({n=4})=><>{Array.from({length:n}).map((_,i)=><div className="skeleton" key={i}/>)}</>;

/* ───────── home ───────── */
function Home(){
  const [events,setEvents]=useState(null),[q,setQ]=useState('');const nav=useNavigate();
  useEffect(()=>{api.get('/events').then(r=>setEvents(r.data.data)).catch(()=>setEvents([]))},[]);
  const posters=(events&&events.length>=3?events.slice(0,3).map(e=>({title:e.title,tag:e.category,image:e.image})):POSTERS);
  const words=['Concerts','College fests','Matchdays','Workshops','Culture','Live music','Group plans','QR tickets'];
  return <div className="home">
    <section className="hero">
      <div className="hero-orb o1"/><div className="hero-orb o2"/>
      <div className="hero-copy">
        <span className="pill-badge"><b>New</b> Plan with friends — split budgets, vote, book together</span>
        <h1>Your next<br/><span className="grad-text">unforgettable</span><br/>night starts here.</h1>
        <p>Discover concerts, campus energy, matchday roar and hands-on experiences — then book your place and carry a verified QR ticket.</p>
        <form className="hero-search" onSubmit={e=>{e.preventDefault();nav(`/events?search=${encodeURIComponent(q)}`)}}>
          <span>🔎</span><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search events, artists or venues"/><button className="button button-accent" type="submit">Find events</button>
        </form>
        <div className="hero-stats"><div><strong>{events?.length||4}+</strong><span>Live events</span></div><div><strong>5</strong><span>Categories</span></div><div><strong>QR</strong><span>Verified entry</span></div></div>
      </div>
      <div className="hero-visual">
        {posters.map((p,i)=><figure className={`poster p${i+1}`} key={i}><img src={p.image||FALLBACK_IMG} alt=""/><figcaption><small>{p.tag}</small>{p.title}</figcaption></figure>)}
        <div className="float-chip c1"><i>🎟️</i><div><b>Instant</b>QR tickets</div></div>
        <div className="float-chip c2"><i>👯</i><div><b>Group</b>booking rooms</div></div>
      </div>
    </section>

    <div className="marquee"><div className="marquee-track">{[...words,...words].map((w,i)=><span key={i}>{w}</span>)}</div></div>

    <section className="section">
      <div className="section-head"><div><div className="eyebrow accent">Browse by vibe</div><h2>What are you in the mood for?</h2></div></div>
      <div className="cat-grid">{CATEGORIES.map(c=><Link key={c.name} to={`/events?category=${encodeURIComponent(c.name)}`} className="cat-tile" style={{'--tile':c.tile}}><span className="emoji">{c.emoji}</span><div><strong>{c.name}</strong><small>{c.note}</small></div></Link>)}</div>
    </section>

    <section className="section">
      <div className="section-head"><div><div className="eyebrow accent">On the horizon</div><h2>Upcoming events</h2></div><Link className="text-link" to="/events">See all events <span>→</span></Link></div>
      <div className="event-grid">{!events?<Skeletons/>:events.slice(0,3).map((e,i)=><EventCard key={e._id} event={e} featured={i===0} index={i}/>)}</div>
    </section>

    <section className="section how">
      <div><div className="eyebrow accent">How it works</div><h2>Three taps to the front row.</h2></div>
      <div className="steps">
        <div><b>01</b><strong>Find your thing</strong><p>Filter by the kind of night you want and see what's coming up.</p></div>
        <div><b>02</b><strong>Choose your seat</strong><p>Clear prices and live availability — pick a ticket tier that fits.</p></div>
        <div><b>03</b><strong>Carry the proof</strong><p>Your verified QR ticket lives with you, ready at the gate.</p></div>
      </div>
    </section>

    <section className="cta-band">
      <div className="eyebrow">Better together</div>
      <h2>Going with friends? Make a group room and pick fairly.</h2>
      <Link className="button button-dark" to="/register">Create a free account ↗</Link>
    </section>
  </div>;
}

/* ───────── explore ───────── */
function Explore(){
  const [params]=useSearchParams();
  const [events,setEvents]=useState(null),[search,setSearch]=useState(params.get('search')||''),[category,setCategory]=useState(params.get('category')||''),[error,setError]=useState('');
  const load=()=>api.get('/events',{params:{search,category}}).then(r=>{const next=r?.data?.data;setEvents(Array.isArray(next)?next:[]);setError('')}).catch(()=>{setEvents([]);setError('Events could not be loaded right now.')});
  useEffect(()=>{load()},[category]);
  const cats=['','Concerts','College festivals','Sports','Workshops','Cultural events'];
  return <div className="page-wrap">
    <div className="page-intro"><div><div className="eyebrow accent">The event index</div><h1>Find your next<br/><em>good plan.</em></h1></div><p>Browse a growing calendar of things worth leaving the house for.</p></div>
    <div className="filter-row">
      <form onSubmit={e=>{e.preventDefault();load()}} className="search-box"><span>⌕</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search events or places"/><button type="submit">Search</button></form>
      <div className="chips">{cats.map(c=><button type="button" key={c||'all'} className={category===c?'active':''} onClick={()=>setCategory(c)}>{c||'All events'}</button>)}</div>
    </div>
    {error&&<div className="alert">{error}</div>}
    {events&&<p className="results-count">{events.length} event{events.length===1?'':'s'} found</p>}
    <div className="event-grid explore-grid">{!events?<Skeletons n={6}/>:events.map((e,i)=><EventCard key={e._id} event={e} index={i}/>)}</div>
    {events&&!events.length&&!error&&<PageState text="No events match that search yet."/>}
  </div>;
}

/* ───────── event details ───────── */
function EventDetails(){
  const {id}=useParams(),[event,setEvent]=useState(null),[category,setCategory]=useState(''),[quantity,setQuantity]=useState(1);
  const {user}=useAuth();const nav=useNavigate();
  useEffect(()=>{api.get(`/events/${id}`).then(r=>{setEvent(r.data.data);setCategory(r.data.data.ticketCategories[0]?.name||'')})},[id]);
  if(!event)return <PageState text="Loading event details…"/>;
  const ticket=event.ticketCategories.find(t=>t.name===category),total=(ticket?.price||0)*quantity;
  return <div className="detail-page">
    <Link className="back-link" to="/events">← Back to events</Link>
    <div className="detail-layout">
      <div className="detail-image"><img src={event.image||FALLBACK_IMG} alt=""/><span className="image-tag">{event.category}</span></div>
      <div className="detail-copy">
        <div className="eyebrow accent">{formatDate(event.date)} · {new Date(event.date).toLocaleTimeString('en-IN',{hour:'numeric',minute:'2-digit'})}</div>
        <h1>{event.title}</h1>
        <p className="lead">{event.description}</p>
        <div className="detail-meta">
          <div><i>📍</i><div><span>VENUE</span><strong>{event.venue}</strong></div></div>
          <div><i>🗓️</i><div><span>STARTS</span><strong>{formatDate(event.date)}</strong></div></div>
        </div>
        <div className="ticket-picker">
          <div className="picker-label">Choose your ticket</div>
          {event.ticketCategories.map(t=><button key={t.name} className={category===t.name?'ticket-option selected':'ticket-option'} onClick={()=>{setCategory(t.name);setQuantity(1)}}><span><strong>{t.name}</strong><small>{t.availableInventory} remaining</small></span><b>{money(t.price)}</b></button>)}
          <div className="quantity-row"><span>Quantity</span><div className="quantity"><button onClick={()=>setQuantity(Math.max(1,quantity-1))}>−</button><b>{quantity}</b><button onClick={()=>setQuantity(Math.min(10,ticket?.availableInventory||10,quantity+1))}>+</button></div></div>
          <div className="total-row"><span>Estimated total</span><strong>{money(total)}</strong></div>
          <button className="button button-accent wide" onClick={()=>user?nav(`/checkout/${event._id}?category=${encodeURIComponent(category)}&quantity=${quantity}`):nav('/login')}>Book tickets ↗</button>
          <Link className="group-link" to={user?`/groups/new?eventId=${event._id}`:'/login'}>👯 Plan this event with a group →</Link>
          <small className="demo-note">Demo checkout only. No payment will be collected.</small>
        </div>
      </div>
    </div>
  </div>;
}

/* ───────── auth ───────── */
function AuthPage({mode}){
  const isRegister=mode==='register';const {login,register}=useAuth();const nav=useNavigate();
  const [form,setForm]=useState({name:'',email:'',password:''}),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const submit=async e=>{e.preventDefault();setBusy(true);setError('');try{await (isRegister?register(form):login({email:form.email,password:form.password}));nav('/events')}catch(err){setError(err.response?.data?.message||(err.response?`Server error (HTTP ${err.response.status}). Check the Vercel function logs.`:'Could not reach the server. Check your connection or the Vercel deployment.'))}finally{setBusy(false)}};
  return <div className="auth-layout">
    <div className="auth-aside">
      <div className="eyebrow accent">EventBook account</div>
      <h1>{isRegister?<>Make room for <em>better plans.</em></>:<>Welcome back to <em>the lineup.</em></>}</h1>
      <p>Keep your tickets, event history and next good idea in one place.</p>
      <ul className="auth-perks"><li>Instant QR tickets for every booking</li><li>Group rooms with private budgets</li><li>Live ticket availability</li></ul>
    </div>
    <form className="auth-card" onSubmit={submit}>
      <div className="eyebrow">{isRegister?'Create account':'Sign in'}</div>
      <h2>{isRegister?'Start with the essentials.':'Good to see you again.'}</h2>
      {error&&<div className="alert">{error}</div>}
      {isRegister&&<label>Your name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Aarav Mehta"/></label>}
      <label>Email address<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@example.com"/></label>
      <label>Password<input required minLength="6" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="At least 6 characters"/></label>
      <button className="button button-accent wide" disabled={busy}>{busy?'Working…':isRegister?'Create account':'Log in'} ↗</button>
      <p className="form-foot">{isRegister?'Already have an account? ':'New here? '}<Link to={isRegister?'/login':'/register'}>{isRegister?'Log in':'Create an account'}</Link></p>
    </form>
  </div>;
}

/* ───────── checkout + success ───────── */
function Checkout(){
  const {id}=useParams(),[params]=useSearchParams(),[event,setEvent]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),nav=useNavigate();
  const category=params.get('category'),quantity=Number(params.get('quantity')||1);
  useEffect(()=>{api.get(`/events/${id}`).then(r=>setEvent(r.data.data))},[id]);
  if(!event)return <PageState text="Preparing demo checkout…"/>;
  const ticket=event.ticketCategories.find(t=>t.name===category)||event.ticketCategories[0];
  const submit=async()=>{setBusy(true);try{const r=await api.post('/bookings',{eventId:id,ticketCategory:ticket.name,quantity});nav(`/booking-success/${r.data.data.bookingId}`)}catch(e){setError(e.response?.data?.message||'Booking could not be completed.')}finally{setBusy(false)}};
  return <div className="checkout-page">
    <Link className="back-link" to={`/events/${id}`}>← Adjust selection</Link>
    <div className="checkout-grid">
      <div><div className="eyebrow accent">Demo checkout</div><h1>One last look<br/><em>before the night.</em></h1><p className="lead" style={{marginTop:22}}>Review your selection. This is a demo checkout — no payment is collected.</p></div>
      <div className="summary-card">
        <div className="summary-event"><img src={event.image||FALLBACK_IMG} alt=""/><div><div className="eyebrow">{event.category}</div><h3>{event.title}</h3><p>{formatDate(event.date)} · {event.venue}</p></div></div>
        <div className="summary-lines"><div><span>{ticket.name} ticket × {quantity}</span><b>{money(ticket.price*quantity)}</b></div><div><span>Service fee</span><b>₹0</b></div><div className="summary-total"><span>Total demo amount</span><strong>{money(ticket.price*quantity)}</strong></div></div>
        {error&&<div className="alert">{error}</div>}
        <button className="button button-accent wide" disabled={busy} onClick={submit}>{busy?'Confirming…':'Confirm demo booking ↗'}</button>
        <small className="demo-note">By continuing, you create a ticket record only. No money is collected.</small>
      </div>
    </div>
  </div>;
}
function Success(){
  const {id}=useParams();
  return <div className="success-page">
    <div className="confetti">{Array.from({length:30}).map((_,i)=><i key={i} style={{left:`${(i*37)%100}%`,animationDelay:`${(i%10)*.45}s`,animationDuration:`${3.5+(i%5)*.6}s`}}/>)}</div>
    <div className="success-mark">✓</div>
    <div className="eyebrow accent">Booking confirmed</div>
    <h1>You're in.<br/><em>See you there!</em></h1>
    <p>The demo booking was saved successfully. Keep the QR ticket handy when you arrive.</p>
    <div className="success-actions"><Link className="button button-accent" to={`/tickets/${id}`}>Open QR ticket ↗</Link><Link className="text-link" to="/events">Find another event →</Link></div>
  </div>;
}

/* ───────── bookings + ticket ───────── */
function Bookings(){
  const [items,setItems]=useState(null);
  const load=()=>api.get('/bookings/my').then(r=>setItems(r.data.data));
  useEffect(load,[]);
  const cancel=async id=>{if(confirm('Cancel this booking and restore its inventory?')){try{await api.patch(`/bookings/${id}/cancel`);load()}catch(e){alert(e.response?.data?.message||'Could not cancel.')}}};
  const sell=async b=>{const v=prompt(`Resale price in ₹ (max face value ₹${b.totalAmount}):`,b.totalAmount);if(v===null)return;try{await api.patch(`/bookings/${b._id}/resell`,{price:Number(v)});load()}catch(e){alert(e.response?.data?.message||'Could not list ticket.')}};
  const unlist=async b=>{try{await api.delete(`/bookings/${b._id}/resell`);load()}catch(e){alert(e.response?.data?.message||'Could not remove listing.')}};
  if(!items)return <PageState text="Loading your bookings…"/>;
  return <div className="page-wrap">
    <div className="page-intro compact"><div><div className="eyebrow accent">Your ticket wallet</div><h1>My tickets</h1></div><p>Everything you have reserved, in one place.</p></div>
    {!items.length?<div className="empty-card"><h3>Your next good plan is still out there.</h3><Link className="button button-accent" to="/events">Explore events ↗</Link></div>
    :<div className="booking-list">{items.map(b=>{const {day,mon}=dateParts(b.eventId?.date||b.createdAt);return <div className="booking-row" key={b._id}>
      <div className="booking-date">{day}<small>{mon}</small></div>
      <div className="booking-info"><span className={`status-pill ${b.status==='cancelled'?'cancelled':''}`}>{b.status}</span>{b.resaleStatus==='listed'&&<span className="status-pill resale">Listed · {money(b.resalePrice)}</span>}<h3>{b.eventId?.title||'Event'}</h3><p>{b.ticketCategory} · {b.quantity} ticket{b.quantity>1?'s':''} · {money(b.totalAmount)}</p></div>
      <div className="booking-actions">{b.status==='confirmed'&&<Link className="button button-dark" to={`/tickets/${b.bookingId||b._id}`}>QR ticket</Link>}{b.status==='confirmed'&&(b.resaleStatus==='listed'?<button className="text-button" onClick={()=>unlist(b)}>Remove listing</button>:<><button className="text-button" onClick={()=>sell(b)}>Resell</button><button className="text-button" onClick={()=>cancel(b._id)}>Cancel</button></>)}</div>
    </div>})}</div>}
  </div>;
}
function Resale(){
  const [items,setItems]=useState(null),[msg,setMsg]=useState(''),nav=useNavigate();
  const load=()=>api.get('/resale').then(r=>setItems(r.data.data));
  useEffect(load,[]);
  const buy=async b=>{if(!confirm(`Buy this ticket for ${money(b.resalePrice)}? (demo checkout, no payment collected)`))return;try{const r=await api.post(`/resale/${b._id}/buy`);nav(`/tickets/${r.data.data.bookingId||r.data.data._id}`)}catch(e){setMsg(e.response?.data?.message||'Could not buy this ticket.');load()}};
  if(!items)return <PageState text="Loading resale tickets…"/>;
  return <div className="page-wrap">
    <div className="page-intro compact"><div><div className="eyebrow accent">Fan-to-fan</div><h1>Resale tickets</h1></div><p>Tickets resold at or below face value. Buying issues you a fresh QR; the seller's old QR stops working.</p></div>
    {msg&&<p className="form-error">{msg}</p>}
    {!items.length?<div className="empty-card"><h3>No tickets are listed right now.</h3><Link className="button button-accent" to="/events">Explore events ↗</Link></div>
    :<div className="booking-list">{items.map(b=>{const {day,mon}=dateParts(b.eventId?.date);const off=b.totalAmount-b.resalePrice;return <div className="booking-row" key={b._id}>
      <div className="booking-date">{day}<small>{mon}</small></div>
      <div className="booking-info"><span className="status-pill resale">Resale</span><h3>{b.eventId?.title}</h3><p>{b.ticketCategory} · {b.quantity} ticket{b.quantity>1?'s':''} · seller {b.sellerName||'a fan'}</p><p>Face value {money(b.totalAmount)}{off>0?` · ${money(off)} below`:''}</p></div>
      <div className="booking-actions"><strong>{money(b.resalePrice)}</strong><button className="button button-dark" onClick={()=>buy(b)}>Buy</button></div>
    </div>})}</div>}
  </div>;
}
function Ticket(){
  const {id}=useParams(),[b,setB]=useState(null),[error,setError]=useState('');
  useEffect(()=>{setB(null);setError('');api.get(`/bookings/${encodeURIComponent(id)}`).then(r=>{if(!r.data?.data)throw new Error('Ticket data is unavailable');setB(r.data.data)}).catch(e=>setError(e.response?.data?.message||'This ticket could not be loaded.'))},[id]);
  if(error)return <div className="page-state is-error"><div className="eyebrow">Ticket unavailable</div><h2>{error}</h2><Link className="button button-dark" to="/bookings">Back to tickets</Link></div>;
  if(!b)return <PageState text="Loading your QR ticket…"/>;
  const event=b.eventId&&typeof b.eventId==='object'?b.eventId:{};
  return <div className="ticket-page">
    <Link className="back-link" to="/bookings">← My tickets</Link>
    <div className="ticket-shell">
      <div className="ticket-main">
        <div className="ticket-top"><div><div className="eyebrow accent">Verified demo ticket</div><h1>{event.title||'Event ticket'}</h1><p>{formatDate(event.date)} · {event.venue||'Venue to be announced'}</p></div><span className={`status-pill ${b.status==='cancelled'?'cancelled':''}`}>{b.status||'confirmed'}</span></div>
        <div className="ticket-details">
          <div><span>TICKET TYPE</span><strong>{b.ticketCategory||'Ticket'}</strong></div>
          <div><span>QUANTITY</span><strong>{b.quantity||1}</strong></div>
          <div><span>BOOKING ID</span><strong>{b.bookingId||id}</strong></div>
          <div><span>TOTAL DEMO AMOUNT</span><strong>{money(b.totalAmount||0)}</strong></div>
        </div>
      </div>
      <div className="ticket-stub">
        <div className="stub-brand"><span className="brand-mark">E</span>EventBook</div>
        {b.qrDataUrl?<img src={b.qrDataUrl} alt="QR code for ticket verification"/>:<div className="qr-missing">QR unavailable</div>}
        <span className="stub-label">Scan to verify ticket</span>
      </div>
    </div>
    <p className="ticket-foot">This QR contains a secure ticket identifier only. No payment has been collected.</p>
  </div>;
}

/* ───────── admin ───────── */
function Admin(){
  const [stats,setStats]=useState(null),[events,setEvents]=useState([]);
  const load=()=>{api.get('/admin/dashboard').then(r=>setStats(r.data.data));api.get('/events').then(r=>setEvents(r.data.data))};
  useEffect(load,[]);
  if(!stats)return <PageState text="Loading admin dashboard…"/>;
  return <div className="page-wrap">
    <div className="page-intro compact"><div><div className="eyebrow accent">Control room</div><h1>Admin dashboard</h1></div><Link className="button button-accent" to="/admin/events/new">Add event ↗</Link></div>
    <div className="stats-grid"><div><span>Total events</span><strong>{stats.totalEvents}</strong></div><div><span>Total bookings</span><strong>{stats.totalBookings}</strong></div><div><span>Tickets sold</span><strong>{stats.totalTicketsSold}</strong></div></div>
    <div className="admin-table"><div className="table-head"><span>EVENT</span><span>CATEGORY</span><span>INVENTORY</span><span>ACTION</span></div>{events.map(e=><div className="table-row" key={e._id}><strong>{e.title}</strong><span>{e.category}</span><span>{e.ticketCategories.reduce((n,t)=>n+t.availableInventory,0)} remaining</span><Link to={`/admin/events/${e._id}/edit`}>Edit →</Link></div>)}</div>
  </div>;
}
function EventForm(){
  const {id}=useParams(),edit=Boolean(id),nav=useNavigate();
  const [form,setForm]=useState({title:'',description:'',category:'Concerts',image:'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',venue:'',date:'',ticketCategories:[{name:'Standard',price:500,availableInventory:100}]}),[error,setError]=useState('');
  useEffect(()=>{if(edit)api.get(`/events/${id}`).then(r=>setForm(r.data.data))},[edit,id]);
  const submit=async e=>{e.preventDefault();try{if(edit)await api.put(`/events/${id}`,form);else await api.post('/events',form);nav('/admin')}catch(err){setError(err.response?.data?.message||'Could not save event.')}};
  const setTicket=(i,patch)=>{const a=[...form.ticketCategories];a[i]={...a[i],...patch};setForm({...form,ticketCategories:a})};
  return <div className="form-page">
    <Link className="back-link" to="/admin">← Admin dashboard</Link>
    <div className="eyebrow accent">{edit?'Edit event':'Add event'}</div>
    <h1>{edit?<>Shape the <em>details.</em></>:<>Put it on the <em>calendar.</em></>}</h1>
    <form className="event-form" onSubmit={submit}>
      {error&&<div className="alert">{error}</div>}
      <label>Event title<input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label>
      <label>Description<textarea required rows="4" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
      <div className="form-two">
        <label>Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{['Concerts','College festivals','Sports','Workshops','Cultural events'].map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Venue<input required value={form.venue} onChange={e=>setForm({...form,venue:e.target.value})}/></label>
      </div>
      <div className="form-two">
        <label>Date and time<input required type="datetime-local" value={form.date?.slice(0,16)||''} onChange={e=>setForm({...form,date:new Date(e.target.value).toISOString()})}/></label>
        <label>Image URL<input value={form.image} onChange={e=>setForm({...form,image:e.target.value})}/></label>
      </div>
      <div className="ticket-edit">
        <div className="picker-label">Ticket categories</div>
        {form.ticketCategories.map((t,i)=><div className="form-three" key={i}>
          <input placeholder="Name" value={t.name} onChange={e=>setTicket(i,{name:e.target.value})}/>
          <input type="number" placeholder="Price" value={t.price} onChange={e=>setTicket(i,{price:Number(e.target.value)})}/>
          <input type="number" placeholder="Inventory" value={t.availableInventory} onChange={e=>setTicket(i,{availableInventory:Number(e.target.value)})}/>
        </div>)}
        <button type="button" className="text-button" style={{marginTop:14}} onClick={()=>setForm({...form,ticketCategories:[...form.ticketCategories,{name:'New category',price:500,availableInventory:50}]})}>+ Add category</button>
      </div>
      <button className="button button-accent">Save event ↗</button>
    </form>
  </div>;
}

/* ───────── group booking (logic unchanged) ───────── */
function GroupPage(){
  const {user}=useAuth(),[params]=useSearchParams(),groupId=params.get('id'),eventId=params.get('eventId');
  const [group,setGroup]=useState(null),[event,setEvent]=useState(null),[matches,setMatches]=useState(null),[budget,setBudget]=useState(''),[preferences,setPreferences]=useState([]),[joinCode,setJoinCode]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),nav=useNavigate();
  const load=async id=>{const r=await api.get(`/groups/${id}`);setGroup(r.data.data);const m=await api.get(`/groups/${id}/matches`);setMatches(m.data.data);};
  useEffect(()=>{if(groupId)load(groupId).catch(e=>setError(e.response?.data?.message||'Could not load group.'));if(eventId)api.get(`/events/${eventId}`).then(r=>setEvent(r.data.data)).catch(()=>{})},[groupId,eventId]);
  const create=async()=>{setBusy(true);try{const r=await api.post('/groups',{eventId});nav(`/groups/new?id=${r.data.data._id||r.data.data.groupCode}`);window.location.reload()}catch(e){setError(e.response?.data?.message||'Could not create group.')}finally{setBusy(false)}};
  const join=async()=>{setBusy(true);try{const r=await api.post('/groups/join',{code:joinCode});nav(`/groups/new?id=${r.data.data._id||r.data.data.groupCode}`);window.location.reload()}catch(e){setError(e.response?.data?.message||'That invitation code is not valid.')}finally{setBusy(false)}};
  const gid=()=>group._id||group.groupCode;
  const saveBudget=async()=>{try{await api.post(`/groups/${gid()}/budget`,{budget:Number(budget),preferences});await load(gid())}catch(e){setError(e.response?.data?.message||'Could not save budget.')}};
  const vote=async category=>{try{await api.post(`/groups/${gid()}/vote`,{category});await load(gid())}catch(e){setError(e.response?.data?.message||'Could not record vote.')}};
  const finalize=async()=>{try{await api.post(`/groups/${gid()}/finalize`);await load(gid())}catch(e){setError(e.response?.data?.message||'Only the group leader can finalize.')}};
  const confirmPlace=async()=>{try{await api.post(`/groups/${gid()}/confirm`);await load(gid())}catch(e){setError(e.response?.data?.message||'Could not confirm participation.')}};
  if(!group)return <div className="group-page page-wrap">
    <div className="page-intro compact"><div><div className="eyebrow accent">Smart group booking</div><h1>Make the plan<br/><em>together.</em></h1></div><p>Invite friends, keep budgets private, and let the group choose fairly.</p></div>
    {error&&<div className="alert">{error}</div>}
    {event&&<div className="group-create-card"><div><div className="eyebrow">Create a room for</div><h2>{event.title}</h2><p className="muted">{event.venue} · {formatDate(event.date)}</p></div><button className="button button-accent" onClick={create} disabled={busy}>{busy?'Creating…':'Create group room ↗'}</button></div>}
    <div className="group-join-card"><div className="eyebrow">Join with an invite code</div><h2>Already have a room?</h2><input value={joinCode} onChange={e=>setJoinCode(e.target.value)} placeholder="EB-ABC123"/><button className="button button-dark" onClick={join} disabled={busy||!joinCode}>Join group ↗</button></div>
  </div>;
  const me=group.members.find(m=>String(m.userId)===String(user?._id)),leader=String(group.groupLeaderId)===String(user?._id);
  return <div className="group-page page-wrap">
    <div className="page-intro compact"><div><div className="eyebrow accent">Smart group booking · {group.groupCode}</div><h1>One room,<br/><em>one good pick.</em></h1></div><div className="group-invite"><span>SHARE THIS CODE</span><strong>{group.groupCode}</strong></div></div>
    {error&&<div className="alert">{error}</div>}
    <div className="group-grid">
      <section className="group-panel">
        <div className="panel-head"><div><div className="eyebrow">The room</div><h2>{group.eventId?.title||event?.title||'Event group'}</h2></div><span className="status-pill">{group.groupStatus.replace('_',' ')}</span></div>
        <p className="muted">Share <b>{group.groupCode}</b> with friends. Budgets stay private by default.</p>
        <div className="member-list">{group.members.map(m=><div className="member-row" key={String(m.userId)}><span className="member-avatar">{m.name?.[0]||'?'}</span><div><strong>{m.name}</strong><small>{String(m.userId)===String(user?._id)?'You · ':''}{m.participationStatus}</small></div><span className="vote-label">{m.vote||'No vote'}</span></div>)}</div>
      </section>
      <section className="group-panel">
        <div className="eyebrow">Your budget</div><h2>What feels comfortable?</h2>
        <p className="muted">Only you can see your exact budget. Matching uses it privately.</p>
        <div className="budget-row"><input type="number" value={budget||me?.budget||''} onChange={e=>setBudget(e.target.value)} placeholder="Maximum ₹"/><button className="button button-dark" onClick={saveBudget}>Save budget</button></div>
        <div className="preference-list">{(matches?.categories||[]).map(c=><button type="button" key={c.name} className={preferences.includes(c.name)?'selected':''} onClick={()=>setPreferences(preferences.includes(c.name)?preferences.filter(p=>p!==c.name):[...preferences,c.name])}>{c.name} · {money(c.price)}</button>)}</div>
      </section>
    </div>
    <section className="group-panel matches-panel">
      <div className="panel-head"><div><div className="eyebrow">Smart matching</div><h2>What the group can afford</h2></div>{leader&&group.groupStatus==='open'&&<button className="button button-accent" onClick={finalize}>Finalize vote ↗</button>}</div>
      <div className="match-grid">{(matches?.categories||[]).map(c=><div className={`match-card ${group.selectedTicketCategory===c.name?'selected':''}`} key={c.name}><div className="match-top"><h3>{c.name}</h3><strong>{money(c.price)}</strong></div><p>{c.allCanAfford?'Everyone can afford this.':`${c.affordableCount} of ${c.memberCount} members can afford it.`}</p><small>{c.preferredByCount} preferred · {c.availableInventory} available</small><button className="text-button" onClick={()=>vote(c.name)} disabled={group.groupStatus!=='open'}>{me?.vote===c.name?'Your vote · Change':'Vote for '+c.name}</button></div>)}</div>
      {group.groupStatus==='awaiting_confirmations'&&<div className="confirm-banner"><div><strong>{group.selectedTicketCategory} is selected.</strong><span>Each member must confirm individually at {money((matches?.categories||[]).find(c=>c.name===group.selectedTicketCategory)?.price||0)}.</span></div><button className="button button-accent" onClick={confirmPlace} disabled={me?.participationStatus==='confirmed'}>{me?.participationStatus==='confirmed'?'Confirmed':'Confirm my place ↗'}</button></div>}
    </section>
  </div>;
}

/* ───────── app ───────── */
function App(){
  return <AuthProvider><Shell><Routes>
    <Route path="/" element={<Home/>}/><Route path="/events" element={<Explore/>}/><Route path="/events/:id" element={<EventDetails/>}/>
    <Route path="/login" element={<AuthPage mode="login"/>}/><Route path="/register" element={<AuthPage mode="register"/>}/>
    <Route path="/checkout/:id" element={<Guard><Checkout/></Guard>}/><Route path="/booking-success/:id" element={<Guard><Success/></Guard>}/>
    <Route path="/bookings" element={<Guard><Bookings/></Guard>}/><Route path="/tickets/:id" element={<Guard><Ticket/></Guard>}/>
    <Route path="/resale" element={<Guard><Resale/></Guard>}/>
    <Route path="/groups/new" element={<Guard><GroupPage/></Guard>}/>
    <Route path="/admin" element={<Guard admin><Admin/></Guard>}/><Route path="/admin/events/new" element={<Guard admin><EventForm/></Guard>}/><Route path="/admin/events/:id/edit" element={<Guard admin><EventForm/></Guard>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes></Shell></AuthProvider>;
}
class AppErrorBoundary extends React.Component{
  constructor(props){super(props);this.state={hasError:false}}
  static getDerivedStateFromError(){return {hasError:true}}
  componentDidCatch(error){console.error('EventBook UI error',error)}
  render(){return this.state.hasError?<div className="page-state is-error"><div className="eyebrow">Temporary display error</div><h2>We couldn’t display this page.</h2><p>Please refresh and try again.</p><button className="button button-dark" onClick={()=>window.location.reload()}>Refresh page</button></div>:this.props.children}
}
createRoot(document.getElementById('root')).render(<BrowserRouter><AppErrorBoundary><App/></AppErrorBoundary></BrowserRouter>);
