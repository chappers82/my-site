import { useState, useEffect } from "react";

// ─── CONFIG ────────────────────────────────────────────────────────────────
const ADMIN_PASSWORD = "Gr4ntTutu*"; // Change this!
const SCHOOL_CODES = { "DANCE2024": "Starlight Dance Academy", "STUDIO01": "The Dance Studio", "GRACE123": "Grace Dance School" };
const DANCE_STYLES = ["Ballet", "Jazz", "Tap", "Contemporary", "Hip Hop", "Musical Theatre", "Acro", "Irish", "Ballroom", "Lyrical"];
const SIZES = ["Age 2-3","Age 3-4","Age 4-5","Age 5-6","Age 6-7","Age 7-8","Age 8-9","Age 9-10","Age 10-11","Age 11-12","Teen XS","Teen S","Teen M","Teen L","Adult XS","Adult S","Adult M","Adult L","Adult XL"];
const CONDITIONS = ["New with tags", "Excellent", "Good", "Well loved"];
const styleEmoji = { Ballet:"🩰", Jazz:"✨", Tap:"🎩", Contemporary:"🌊", "Hip Hop":"🎤", "Musical Theatre":"🎭", Acro:"🤸", Irish:"☘️", Ballroom:"💃", Lyrical:"🕊️" };
const conditionKey = { "New with tags":"new", "Excellent":"excellent", "Good":"good", "Well loved":"worn" };

const SAMPLE_LISTINGS = [
  { id:1, title:"Swan Lake Ballet Tutu", style:"Ballet", size:"Age 7-8", condition:"Excellent", price:35, description:"Beautiful white tutu with silver trim. Only worn twice for performance.", seller:"Sarah M.", school:"Starlight Dance Academy", schoolCode:"DANCE2024", paypalEmail:"sarah@example.com", image:null, createdAt:Date.now()-86400000*2 },
  { id:2, title:"Jazz Costume – Purple Sequin", style:"Jazz", size:"Age 10-11", condition:"Good", price:28, description:"Stunning purple sequin jazz costume. Some minor wear but looks great on stage.", seller:"Emma T.", school:"Starlight Dance Academy", schoolCode:"DANCE2024", paypalEmail:"emma@example.com", image:null, createdAt:Date.now()-86400000 },
  { id:3, title:"Tap Shoes – Black Patent", style:"Tap", size:"Teen S", condition:"New with tags", price:45, description:"Never worn. Received as gift but wrong size.", seller:"Lisa K.", school:"The Dance Studio", schoolCode:"STUDIO01", paypalEmail:"lisa@example.com", image:null, createdAt:Date.now()-3600000*5 },
  { id:4, title:"Contemporary Lyrical Dress", style:"Contemporary", size:"Age 9-10", condition:"Excellent", price:22, description:"Flowing chiffon dress in dusty rose. Perfect for lyrical or contemporary.", seller:"Mia R.", school:"Starlight Dance Academy", schoolCode:"DANCE2024", paypalEmail:"mia@example.com", image:null, createdAt:Date.now()-3600000*2 },
];

const SAMPLE_ADS = [
  { id:1, title:"Freed of London", tagline:"Professional dancewear & pointe shoes", url:"https://freed.co.uk", image:null, active:true, slot:"top" },
  { id:2, title:"Bloch Dance", tagline:"The world's favourite dance brand", url:"https://bloch.com", image:null, active:true, slot:"sidebar" },
];

const P = {
  bg:"#0d0a14", surface:"#16111f", card:"#1e1729", border:"#2e2340",
  accent:"#c9a96e", accentSoft:"#e8d5aa", pink:"#e8a0b4",
  text:"#f0eaf8", muted:"#8a7a9e", success:"#6fcf97", admin:"#7c6fe0",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Jost:wght@300;400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${P.bg};color:${P.text};font-family:'Jost',sans-serif;min-height:100vh}
  .app{min-height:100vh;background:radial-gradient(ellipse at 20% 0%,#1a0e2e 0%,${P.bg} 50%),radial-gradient(ellipse at 80% 100%,#1a0b1e 0%,transparent 50%)}
  .header{padding:1.25rem 2rem;border-bottom:1px solid ${P.border};display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;background:rgba(13,10,20,0.88);backdrop-filter:blur(16px)}
  .logo{display:flex;align-items:center;gap:.75rem;cursor:pointer}
  .logo-icon{width:34px;height:34px;background:linear-gradient(135deg,${P.accent},${P.pink});border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1rem}
  .logo-text{font-family:'Playfair Display',serif;font-size:1.35rem;color:${P.accentSoft};letter-spacing:.02em}
  .logo-sub{font-size:.62rem;color:${P.muted};letter-spacing:.15em;text-transform:uppercase;margin-top:-2px}
  .header-actions{display:flex;gap:.6rem;align-items:center}
  .btn{padding:.5rem 1.1rem;border-radius:6px;font-family:'Jost',sans-serif;font-size:.8rem;font-weight:500;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;transition:all .2s;border:none}
  .btn-primary{background:linear-gradient(135deg,${P.accent},#b8894e);color:#0d0a14;box-shadow:0 2px 12px rgba(201,169,110,.3)}
  .btn-primary:hover{transform:translateY(-1px);box-shadow:0 4px 20px rgba(201,169,110,.4)}
  .btn-ghost{background:transparent;color:${P.muted};border:1px solid ${P.border}}
  .btn-ghost:hover{border-color:${P.accent};color:${P.accent}}
  .btn-outline{background:transparent;color:${P.accent};border:1px solid ${P.accent}}
  .btn-outline:hover{background:rgba(201,169,110,.1)}
  .btn-danger{background:transparent;color:#e07070;border:1px solid #e07070;font-size:.75rem;padding:.4rem .9rem}
  .btn-danger:hover{background:rgba(224,112,112,.08)}
  .btn-admin{background:rgba(124,111,224,.15);color:${P.admin};border:1px solid rgba(124,111,224,.35);font-size:.75rem}
  .btn-admin:hover{background:rgba(124,111,224,.25)}
  .btn-success{background:rgba(111,207,151,.15);color:${P.success};border:1px solid rgba(111,207,151,.3);font-size:.75rem;padding:.4rem .9rem}
  .btn-sm{padding:.38rem .8rem;font-size:.73rem}
  .main{max-width:1200px;margin:0 auto;padding:2rem}
  .layout{display:grid;grid-template-columns:1fr 220px;gap:2rem;align-items:start}
  @media(max-width:800px){.layout{grid-template-columns:1fr}}
  .hero{text-align:center;padding:3.5rem 2rem 2.5rem;position:relative}
  .hero::before{content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);width:600px;height:2px;background:linear-gradient(90deg,transparent,${P.accent},transparent)}
  .hero-eyebrow{font-size:.68rem;letter-spacing:.25em;text-transform:uppercase;color:${P.accent};margin-bottom:.85rem}
  .hero-title{font-family:'Playfair Display',serif;font-size:clamp(2rem,5vw,3.2rem);line-height:1.15;color:${P.text};margin-bottom:.85rem}
  .hero-title em{font-style:italic;color:${P.accentSoft}}
  .hero-sub{color:${P.muted};font-size:.92rem;font-weight:300;max-width:460px;margin:0 auto 1.5rem;line-height:1.7}
  .school-badge{display:inline-flex;align-items:center;gap:.5rem;padding:.35rem .9rem;background:rgba(201,169,110,.1);border:1px solid rgba(201,169,110,.3);border-radius:20px;font-size:.78rem;color:${P.accent};margin-bottom:1.5rem}
  .ad-banner{padding:1rem 1.5rem;background:${P.surface};border:1px solid ${P.border};border-radius:10px;margin-bottom:1.75rem;display:flex;align-items:center;gap:1.25rem;text-decoration:none;transition:border-color .2s;position:relative}
  .ad-banner:hover{border-color:rgba(201,169,110,.3)}
  .ad-banner-label{position:absolute;top:.45rem;right:.6rem;font-size:.58rem;text-transform:uppercase;letter-spacing:.1em;color:${P.muted};opacity:.7}
  .ad-banner-icon{width:48px;height:48px;background:linear-gradient(135deg,#2a1f3d,#1e1729);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0;overflow:hidden}
  .ad-banner-icon img{width:100%;height:100%;object-fit:cover}
  .ad-banner-text strong{display:block;font-size:.92rem;color:${P.text};margin-bottom:.15rem}
  .ad-banner-text span{font-size:.78rem;color:${P.muted}}
  .sidebar{display:flex;flex-direction:column;gap:1rem}
  .ad-sidebar-card{padding:1rem;background:${P.surface};border:1px solid ${P.border};border-radius:10px;text-decoration:none;transition:border-color .2s;display:block;position:relative}
  .ad-sidebar-card:hover{border-color:rgba(201,169,110,.3)}
  .ad-sidebar-label{font-size:.58rem;text-transform:uppercase;letter-spacing:.1em;color:${P.muted};opacity:.7;margin-bottom:.5rem}
  .ad-sidebar-icon{width:100%;height:64px;background:linear-gradient(135deg,#2a1f3d,#1e1729);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:2rem;margin-bottom:.65rem;overflow:hidden}
  .ad-sidebar-icon img{width:100%;height:100%;object-fit:cover}
  .ad-sidebar-card strong{display:block;font-size:.82rem;color:${P.text};margin-bottom:.2rem}
  .ad-sidebar-card span{font-size:.72rem;color:${P.muted};line-height:1.4}
  .ad-sidebar-cta{display:inline-block;margin-top:.6rem;font-size:.68rem;text-transform:uppercase;letter-spacing:.08em;color:${P.accent}}
  .filters{display:flex;gap:.65rem;flex-wrap:wrap;margin-bottom:1.5rem;padding:1.1rem;background:${P.surface};border:1px solid ${P.border};border-radius:10px}
  .filter-select,.filter-input{padding:.5rem .85rem;background:${P.card};border:1px solid ${P.border};border-radius:6px;color:${P.text};font-family:'Jost',sans-serif;font-size:.8rem;outline:none;transition:border-color .2s;flex:1;min-width:130px}
  .filter-input{min-width:180px}
  .filter-select:focus,.filter-input:focus{border-color:${P.accent}}
  .filter-select option{background:${P.card}}
  .nav-pills{display:flex;gap:.5rem;margin-bottom:1.25rem;flex-wrap:wrap}
  .nav-pill{padding:.45rem 1rem;border-radius:20px;background:transparent;border:1px solid ${P.border};color:${P.muted};font-family:'Jost',sans-serif;font-size:.75rem;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;transition:all .2s}
  .nav-pill.active{background:rgba(201,169,110,.12);border-color:${P.accent};color:${P.accent}}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1.1rem}
  .listing-count{font-size:.78rem;color:${P.muted};margin-bottom:1.1rem}
  .listing-count strong{color:${P.accentSoft}}
  .card{background:${P.card};border:1px solid ${P.border};border-radius:12px;overflow:hidden;transition:all .25s;cursor:pointer}
  .card:hover{transform:translateY(-3px);border-color:rgba(201,169,110,.4);box-shadow:0 8px 32px rgba(0,0,0,.4)}
  .card-image{width:100%;height:170px;background:linear-gradient(135deg,#1e1729,#2a1f3d);display:flex;align-items:center;justify-content:center;font-size:3.2rem;position:relative;overflow:hidden}
  .card-image img{width:100%;height:100%;object-fit:cover}
  .card-image::after{content:'';position:absolute;bottom:0;left:0;right:0;height:40px;background:linear-gradient(transparent,${P.card})}
  .condition-pill{position:absolute;top:.6rem;right:.6rem;padding:.18rem .55rem;border-radius:20px;font-size:.62rem;font-weight:500;letter-spacing:.05em;text-transform:uppercase;z-index:1}
  .condition-new{background:rgba(111,207,151,.2);color:${P.success};border:1px solid rgba(111,207,151,.3)}
  .condition-excellent{background:rgba(201,169,110,.15);color:${P.accent};border:1px solid rgba(201,169,110,.25)}
  .condition-good{background:rgba(232,160,180,.15);color:${P.pink};border:1px solid rgba(232,160,180,.25)}
  .condition-worn{background:rgba(138,122,158,.15);color:${P.muted};border:1px solid rgba(138,122,158,.25)}
  .card-body{padding:.9rem}
  .card-style-tag{font-size:.62rem;text-transform:uppercase;letter-spacing:.12em;color:${P.accent};margin-bottom:.3rem}
  .card-title{font-family:'Playfair Display',serif;font-size:1rem;margin-bottom:.35rem;color:${P.text};line-height:1.3}
  .card-meta{font-size:.75rem;color:${P.muted};margin-bottom:.65rem}
  .card-footer{display:flex;align-items:center;justify-content:space-between;padding-top:.65rem;border-top:1px solid ${P.border}}
  .price{font-family:'Playfair Display',serif;font-size:1.25rem;color:${P.accentSoft}}
  .price span{font-size:.72rem;color:${P.muted};font-family:'Jost',sans-serif}
  .overlay{position:fixed;inset:0;background:rgba(0,0,0,.78);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:center;justify-content:center;padding:1rem;animation:fadeIn .2s ease}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes slideUp{from{transform:translateY(18px);opacity:0}to{transform:translateY(0);opacity:1}}
  .modal{background:${P.surface};border:1px solid ${P.border};border-radius:14px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto;animation:slideUp .25s ease}
  .modal-header{padding:1.4rem 1.4rem 0;display:flex;align-items:flex-start;justify-content:space-between}
  .modal-title{font-family:'Playfair Display',serif;font-size:1.3rem;color:${P.accentSoft}}
  .modal-title.admin-title{color:#a99ef0}
  .modal-close{background:none;border:none;color:${P.muted};font-size:1.4rem;cursor:pointer;line-height:1;padding:.2rem;transition:color .2s}
  .modal-close:hover{color:${P.text}}
  .modal-body{padding:1.4rem}
  .form-group{margin-bottom:1rem}
  .form-label{display:block;font-size:.72rem;text-transform:uppercase;letter-spacing:.1em;color:${P.muted};margin-bottom:.35rem}
  .form-input,.form-select,.form-textarea{width:100%;padding:.6rem .85rem;background:${P.card};border:1px solid ${P.border};border-radius:7px;color:${P.text};font-family:'Jost',sans-serif;font-size:.86rem;outline:none;transition:border-color .2s}
  .form-input:focus,.form-select:focus,.form-textarea:focus{border-color:${P.accent};box-shadow:0 0 0 3px rgba(201,169,110,.1)}
  .form-select option{background:${P.card}}
  .form-textarea{resize:vertical;min-height:76px}
  .form-row{display:grid;grid-template-columns:1fr 1fr;gap:.7rem}
  .form-hint{font-size:.7rem;color:${P.muted};margin-top:.28rem}
  .form-error{font-size:.73rem;color:#e07070;margin-top:.28rem}
  .detail-image{width:100%;height:210px;background:linear-gradient(135deg,#1e1729,#2a1f3d);display:flex;align-items:center;justify-content:center;font-size:4.5rem;border-radius:10px;margin-bottom:1.1rem;overflow:hidden}
  .detail-image img{width:100%;height:100%;object-fit:cover;border-radius:10px}
  .detail-tags{display:flex;gap:.45rem;flex-wrap:wrap;margin-bottom:.9rem}
  .tag{padding:.22rem .65rem;border-radius:20px;font-size:.68rem;font-weight:500;letter-spacing:.05em;text-transform:uppercase}
  .tag-style{background:rgba(201,169,110,.12);color:${P.accent};border:1px solid rgba(201,169,110,.2)}
  .tag-size{background:rgba(232,160,180,.1);color:${P.pink};border:1px solid rgba(232,160,180,.2)}
  .detail-price{font-family:'Playfair Display',serif;font-size:1.9rem;color:${P.accentSoft};margin-bottom:.4rem}
  .detail-desc{color:${P.muted};font-size:.86rem;line-height:1.7;margin-bottom:1.1rem}
  .seller-info{padding:.8rem;background:${P.card};border:1px solid ${P.border};border-radius:8px;margin-bottom:1.1rem;font-size:.8rem}
  .seller-info strong{color:${P.accent}}
  .seller-school{color:${P.muted};margin-top:.18rem;font-size:.73rem}
  .commission-box{padding:.85rem;background:rgba(201,169,110,.06);border:1px solid rgba(201,169,110,.18);border-radius:8px;margin-bottom:1.1rem;font-size:.78rem}
  .commission-row{display:flex;justify-content:space-between;align-items:center;padding:.18rem 0}
  .commission-row.total{border-top:1px solid rgba(201,169,110,.2);margin-top:.4rem;padding-top:.5rem;font-weight:500;color:${P.accentSoft}}
  .commission-label{color:${P.muted}}
  .commission-value{color:${P.text}}
  .paypal-btn{width:100%;padding:.8rem;background:#0070ba;color:white;border:none;border-radius:8px;font-family:'Jost',sans-serif;font-size:.88rem;font-weight:500;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:.5rem;transition:all .2s;letter-spacing:.03em}
  .paypal-btn:hover{background:#005ea6;transform:translateY(-1px);box-shadow:0 4px 16px rgba(0,112,186,.4)}
  .auth-tabs{display:flex;border-bottom:1px solid ${P.border};margin-bottom:1.4rem}
  .auth-tab{flex:1;padding:.7rem;background:none;border:none;font-family:'Jost',sans-serif;font-size:.8rem;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;color:${P.muted};border-bottom:2px solid transparent;transition:all .2s;margin-bottom:-1px}
  .auth-tab.active{color:${P.accent};border-bottom-color:${P.accent}}
  .school-code-info{padding:.7rem;background:rgba(201,169,110,.08);border:1px solid rgba(201,169,110,.2);border-radius:7px;font-size:.76rem;color:${P.muted};margin-bottom:.9rem;line-height:1.5}
  .upload-area{border:2px dashed ${P.border};border-radius:8px;padding:1.3rem;text-align:center;cursor:pointer;transition:all .2s;color:${P.muted};font-size:.8rem;display:block}
  .upload-area:hover{border-color:${P.accent};color:${P.accent}}
  .upload-area input{display:none}
  .upload-preview{width:100%;height:110px;object-fit:cover;border-radius:7px;margin-top:.5rem}
  .admin-section{margin-bottom:2rem}
  .admin-section-title{font-family:'Playfair Display',serif;font-size:1.05rem;color:#a99ef0;margin-bottom:1rem;padding-bottom:.5rem;border-bottom:1px solid rgba(124,111,224,.2)}
  .admin-stat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:.75rem;margin-bottom:1.75rem}
  .admin-stat{padding:1rem;background:rgba(124,111,224,.08);border:1px solid rgba(124,111,224,.2);border-radius:10px;text-align:center}
  .admin-stat-value{font-family:'Playfair Display',serif;font-size:1.5rem;color:#a99ef0}
  .admin-stat-label{font-size:.68rem;text-transform:uppercase;letter-spacing:.1em;color:${P.muted};margin-top:.2rem}
  .admin-table{width:100%;border-collapse:collapse;font-size:.8rem}
  .admin-table th{text-align:left;padding:.5rem .75rem;font-size:.65rem;text-transform:uppercase;letter-spacing:.1em;color:${P.muted};border-bottom:1px solid ${P.border}}
  .admin-table td{padding:.6rem .75rem;border-bottom:1px solid rgba(46,35,64,.5);color:${P.text};vertical-align:middle}
  .admin-table tr:last-child td{border-bottom:none}
  .admin-commission-input{width:100px;padding:.38rem .65rem;background:${P.card};border:1px solid ${P.border};border-radius:5px;color:${P.text};font-family:'Jost',sans-serif;font-size:.84rem;outline:none}
  .admin-commission-input:focus{border-color:${P.admin};box-shadow:0 0 0 2px rgba(124,111,224,.15)}
  .ad-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;display:inline-block;margin-right:.4rem}
  .ad-dot.active{background:${P.success}}
  .ad-dot.inactive{background:${P.muted}}
  .empty-state{grid-column:1/-1;text-align:center;padding:3.5rem 2rem;color:${P.muted}}
  .empty-state-icon{font-size:2.8rem;margin-bottom:.85rem;opacity:.5}
  .empty-state h3{font-family:'Playfair Display',serif;color:${P.text};margin-bottom:.4rem}
  .success-banner{padding:.7rem 1rem;background:rgba(111,207,151,.1);border:1px solid rgba(111,207,151,.3);border-radius:7px;color:${P.success};font-size:.8rem;margin-bottom:1rem;text-align:center}
  .text-link{background:none;border:none;color:${P.accent};cursor:pointer;text-decoration:underline;font:inherit;font-size:.76rem}
  ::-webkit-scrollbar{width:5px}
  ::-webkit-scrollbar-track{background:${P.bg}}
  ::-webkit-scrollbar-thumb{background:${P.border};border-radius:3px}
`;

const calcFees = (price, pct) => {
  const commission = parseFloat((price * pct / 100).toFixed(2));
  return { commission, sellerReceives: parseFloat((price - commission).toFixed(2)) };
};

function AdBanner({ ad }) {
  if (!ad || !ad.active) return null;
  return (
    <a className="ad-banner" href={ad.url} target="_blank" rel="noopener noreferrer">
      <span className="ad-banner-label">Ad</span>
      <div className="ad-banner-icon">{ad.image ? <img src={ad.image} alt={ad.title}/> : "💃"}</div>
      <div className="ad-banner-text">
        <strong>{ad.title}</strong>
        <span>{ad.tagline}</span>
      </div>
    </a>
  );
}

function AdSidebar({ ads }) {
  const active = ads.filter(a => a.active && a.slot === "sidebar");
  if (!active.length) return null;
  return (
    <div className="sidebar">
      {active.map(ad => (
        <a key={ad.id} className="ad-sidebar-card" href={ad.url} target="_blank" rel="noopener noreferrer">
          <div className="ad-sidebar-label">Sponsored</div>
          <div className="ad-sidebar-icon">{ad.image ? <img src={ad.image} alt={ad.title}/> : "🩰"}</div>
          <strong>{ad.title}</strong><br/>
          <span>{ad.tagline}</span>
          <div className="ad-sidebar-cta">Visit →</div>
        </a>
      ))}
    </div>
  );
}

export default function DanceMarketplace() {
  const [listings, setListings] = useState([]);
  const [ads, setAds] = useState(SAMPLE_ADS);
  const [commissionPct, setCommissionPct] = useState(1.5);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState("browse");
  const [modal, setModal] = useState(null);
  const [selectedListing, setSelectedListing] = useState(null);
  const [authTab, setAuthTab] = useState("login");
  const [success, setSuccess] = useState("");
  const [filters, setFilters] = useState({ search:"", style:"", size:"", condition:"", maxPrice:"" });

  const [authForm, setAuthForm] = useState({ name:"", email:"", password:"", schoolCode:"" });
  const [authError, setAuthError] = useState("");
  const [createForm, setCreateForm] = useState({ title:"", style:"", size:"", condition:"", price:"", description:"", paypalEmail:"", image:null });
  const [createError, setCreateError] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [adminError, setAdminError] = useState("");
  const [editingAd, setEditingAd] = useState(null);
  const [adForm, setAdForm] = useState({ title:"", tagline:"", url:"", slot:"top", active:true, image:null });

  useEffect(() => {
    (async () => {
      try { const r = await window.storage.get("listings"); setListings(r ? JSON.parse(r.value) : SAMPLE_LISTINGS); } catch { setListings(SAMPLE_LISTINGS); }
      try { const u = await window.storage.get("user"); if (u) setUser(JSON.parse(u.value)); } catch {}
      try { const a = await window.storage.get("ads"); if (a) setAds(JSON.parse(a.value)); } catch {}
      try { const c = await window.storage.get("commission"); if (c) setCommissionPct(parseFloat(c.value)); } catch {}
      try { const adm = await window.storage.get("isAdmin"); if (adm && adm.value === "true") setIsAdmin(true); } catch {}
    })();
  }, []);

  const saveListings = async l => { setListings(l); try { await window.storage.set("listings", JSON.stringify(l)); } catch {} };
  const saveUser = async u => { setUser(u); try { if (u) await window.storage.set("user", JSON.stringify(u)); else await window.storage.delete("user"); } catch {} };
  const saveAds = async a => { setAds(a); try { await window.storage.set("ads", JSON.stringify(a)); } catch {} };
  const saveCommission = async v => { setCommissionPct(v); try { await window.storage.set("commission", String(v)); } catch {} };
  const closeModal = () => { setModal(null); setAuthError(""); setCreateError(""); setAdminError(""); setEditingAd(null); };

  const handleAuth = async () => {
    setAuthError("");
    if (authTab === "register") {
      if (!authForm.name || !authForm.email || !authForm.password || !authForm.schoolCode) return setAuthError("Please fill in all fields.");
      const school = SCHOOL_CODES[authForm.schoolCode.toUpperCase()];
      if (!school) return setAuthError("Invalid school code. Check with your dance school admin.");
      const u = { name:authForm.name, email:authForm.email, school, schoolCode:authForm.schoolCode.toUpperCase() };
      await saveUser(u); closeModal(); setSuccess(`Welcome, ${u.name}! You've joined ${school}.`);
    } else {
      if (!authForm.email || !authForm.schoolCode) return setAuthError("Please enter your email and school code.");
      const school = SCHOOL_CODES[authForm.schoolCode.toUpperCase()];
      if (!school) return setAuthError("Invalid school code.");
      const u = { name:authForm.email.split("@")[0], email:authForm.email, school, schoolCode:authForm.schoolCode.toUpperCase() };
      await saveUser(u); closeModal();
    }
  };

  const handleLogout = async () => {
    await saveUser(null); setIsAdmin(false);
    try { await window.storage.delete("isAdmin"); } catch {}
    setView("browse");
  };

  const handleAdminLogin = async () => {
    setAdminError("");
    if (adminPass !== ADMIN_PASSWORD) return setAdminError("Incorrect password.");
    setIsAdmin(true); try { await window.storage.set("isAdmin","true"); } catch {}
    closeModal(); setView("admin");
  };

  const handleImageUpload = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setCreateForm(f => ({ ...f, image:ev.target.result }));
    reader.readAsDataURL(file);
  };

  const handleCreate = async () => {
    setCreateError("");
    const { title, style, size, condition, price, paypalEmail } = createForm;
    if (!title || !style || !size || !condition || !price || !paypalEmail) return setCreateError("Please fill in all required fields.");
    if (isNaN(price) || Number(price) <= 0) return setCreateError("Please enter a valid price.");
    const listing = { id:Date.now(), ...createForm, price:Number(createForm.price), seller:user.name, school:user.school, schoolCode:user.schoolCode, createdAt:Date.now() };
    await saveListings([listing, ...listings]);
    setCreateForm({ title:"", style:"", size:"", condition:"", price:"", description:"", paypalEmail:"", image:null });
    closeModal(); setSuccess("Your listing is now live!");
  };

  const handleDelete = async id => { await saveListings(listings.filter(l => l.id !== id)); closeModal(); };

  const handleAdImageUpload = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setAdForm(f => ({ ...f, image:ev.target.result }));
    reader.readAsDataURL(file);
  };

  const handleSaveAd = async () => {
    if (!adForm.title || !adForm.url) return;
    const updated = editingAd === "new"
      ? [...ads, { id:Date.now(), ...adForm }]
      : ads.map(a => a.id === editingAd ? { ...a, ...adForm } : a);
    await saveAds(updated); closeModal();
  };

  const toggleAd = async id => { await saveAds(ads.map(a => a.id === id ? { ...a, active:!a.active } : a)); };
  const deleteAd = async id => { await saveAds(ads.filter(a => a.id !== id)); };

  const openEditAd = ad => {
    setEditingAd(ad.id);
    setAdForm({ title:ad.title, tagline:ad.tagline, url:ad.url, slot:ad.slot, active:ad.active, image:ad.image||null });
    setModal("editAd");
  };

  const filtered = listings.filter(l => {
    if (view === "mylistings") return user && l.seller === user.name && l.schoolCode === user.schoolCode;
    const q = filters.search.toLowerCase();
    if (q && !l.title.toLowerCase().includes(q) && !l.description?.toLowerCase().includes(q)) return false;
    if (filters.style && l.style !== filters.style) return false;
    if (filters.size && l.size !== filters.size) return false;
    if (filters.condition && l.condition !== filters.condition) return false;
    if (filters.maxPrice && l.price > Number(filters.maxPrice)) return false;
    return true;
  });

  const topAd = ads.find(a => a.active && a.slot === "top");
  const totalEstRevenue = listings.reduce((s, l) => s + calcFees(l.price, commissionPct).commission, 0);

  return (
    <div className="app">
      <style>{css}</style>

      <header className="header">
        <div className="logo" onClick={() => setView("browse")}>
          <div className="logo-icon">🩰</div>
          <div>
            <div className="logo-text">TutuTrade</div>
            <div className="logo-sub">Dance Marketplace</div>
          </div>
        </div>
        <div className="header-actions">
          {isAdmin && <button className="btn btn-admin btn-sm" onClick={() => setView("admin")}>⚙ Admin</button>}
          {user ? (
            <>
              <span style={{fontSize:".78rem",color:P.muted}}>Hi, {user.name.split(" ")[0]}</span>
              <button className="btn btn-primary btn-sm" onClick={() => setModal("create")}>+ List Item</button>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Sign out</button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => { setAuthTab("login"); setModal("auth"); }}>Sign in</button>
              <button className="btn btn-primary btn-sm" onClick={() => { setAuthTab("register"); setModal("auth"); }}>Join</button>
              <button className="btn btn-admin btn-sm" onClick={() => setModal("adminLogin")}>Admin</button>
            </>
          )}
        </div>
      </header>

      <div className="main">
        {success && <div className="success-banner">✓ {success}</div>}

        {/* ── ADMIN VIEW ── */}
        {view === "admin" && isAdmin ? (
          <div>
            <div style={{marginBottom:"1.5rem"}}>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"1.7rem",color:"#a99ef0",marginBottom:".3rem"}}>Admin Panel</h2>
              <p style={{fontSize:".82rem",color:P.muted}}>Manage commission rates, advertisers, and listings.</p>
            </div>

            <div className="admin-stat-grid">
              <div className="admin-stat"><div className="admin-stat-value">{listings.length}</div><div className="admin-stat-label">Listings</div></div>
              <div className="admin-stat"><div className="admin-stat-value">{commissionPct}%</div><div className="admin-stat-label">Commission</div></div>
              <div className="admin-stat"><div className="admin-stat-value">£{totalEstRevenue.toFixed(2)}</div><div className="admin-stat-label">Est. Revenue</div></div>
            </div>

            {/* Commission */}
            <div className="admin-section">
              <div className="admin-section-title">💰 Commission Rate</div>
              <div style={{display:"flex",alignItems:"center",gap:"1rem",flexWrap:"wrap",padding:"1rem",background:"rgba(124,111,224,.06)",border:"1px solid rgba(124,111,224,.15)",borderRadius:8}}>
                <label style={{fontSize:".82rem",color:P.muted}}>Platform fee:</label>
                <div style={{display:"flex",alignItems:"center",gap:".4rem"}}>
                  <input className="admin-commission-input" type="number" min="0" max="30" step="0.1" value={commissionPct} onChange={e => saveCommission(parseFloat(e.target.value)||0)} />
                  <span style={{color:P.muted,fontSize:".84rem"}}>%</span>
                </div>
                <span style={{fontSize:".78rem",color:P.muted}}>
                  Example — on a £50 sale: you earn <strong style={{color:P.accentSoft}}>£{calcFees(50,commissionPct).commission.toFixed(2)}</strong>, seller receives <strong style={{color:P.accentSoft}}>£{calcFees(50,commissionPct).sellerReceives.toFixed(2)}</strong>
                </span>
              </div>
            </div>

            {/* Ads */}
            <div className="admin-section">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
                <div className="admin-section-title" style={{marginBottom:0,borderBottom:"none",paddingBottom:0}}>📢 Advertisers</div>
                <button className="btn btn-primary btn-sm" onClick={() => { setEditingAd("new"); setAdForm({title:"",tagline:"",url:"",slot:"top",active:true,image:null}); setModal("editAd"); }}>+ Add</button>
              </div>
              <table className="admin-table">
                <thead><tr><th>Advertiser</th><th>Slot</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {ads.map(ad => (
                    <tr key={ad.id}>
                      <td><span className={`ad-dot ${ad.active?"active":"inactive"}`}/>{ad.title}<div style={{fontSize:".7rem",color:P.muted}}>{ad.tagline}</div></td>
                      <td><span className="tag tag-style">{ad.slot}</span></td>
                      <td>
                        <button className={`btn ${ad.active?"btn-success":"btn-ghost"} btn-sm`} onClick={() => toggleAd(ad.id)}>{ad.active?"Live":"Paused"}</button>
                      </td>
                      <td style={{display:"flex",gap:".4rem"}}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEditAd(ad)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteAd(ad.id)}>Remove</button>
                      </td>
                    </tr>
                  ))}
                  {!ads.length && <tr><td colSpan={4} style={{color:P.muted,textAlign:"center",padding:"1.5rem"}}>No advertisers yet</td></tr>}
                </tbody>
              </table>
            </div>

            {/* Listings */}
            <div className="admin-section">
              <div className="admin-section-title">📋 All Listings</div>
              <table className="admin-table">
                <thead><tr><th>Item</th><th>Seller</th><th>School</th><th>Price</th><th>Your fee</th><th></th></tr></thead>
                <tbody>
                  {listings.map(l => {
                    const { commission } = calcFees(l.price, commissionPct);
                    return (
                      <tr key={l.id}>
                        <td>{l.title}</td>
                        <td style={{color:P.muted}}>{l.seller}</td>
                        <td style={{color:P.muted,fontSize:".73rem"}}>{l.school}</td>
                        <td>£{l.price}</td>
                        <td style={{color:P.accentSoft}}>£{commission}</td>
                        <td><button className="btn btn-danger btn-sm" onClick={() => handleDelete(l.id)}>Remove</button></td>
                      </tr>
                    );
                  })}
                  {!listings.length && <tr><td colSpan={6} style={{color:P.muted,textAlign:"center",padding:"1.5rem"}}>No listings</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

        ) : (
          <>
            {view === "browse" && (
              <div className="hero">
                <div className="hero-eyebrow">✦ TutuTrade ✦</div>
                <h1 className="hero-title">Buy & sell <em>beautiful</em><br/>dancewear</h1>
                <p className="hero-sub">Costumes, shoes & accessories from dancers in your school — pre-loved and ready to perform.</p>
                {user && <div className="school-badge">🏫 {user.school}</div>}
              </div>
            )}

            {user && (
              <div className="nav-pills">
                <button className={`nav-pill ${view==="browse"?"active":""}`} onClick={() => setView("browse")}>Browse all</button>
                <button className={`nav-pill ${view==="mylistings"?"active":""}`} onClick={() => setView("mylistings")}>My listings</button>
              </div>
            )}

            {view === "browse" && <AdBanner ad={topAd} />}

            {view === "browse" && (
              <div className="filters">
                <input className="filter-input" placeholder="Search costumes..." value={filters.search} onChange={e => setFilters(f=>({...f,search:e.target.value}))} />
                <select className="filter-select" value={filters.style} onChange={e => setFilters(f=>({...f,style:e.target.value}))}>
                  <option value="">All styles</option>
                  {DANCE_STYLES.map(s => <option key={s}>{s}</option>)}
                </select>
                <select className="filter-select" value={filters.size} onChange={e => setFilters(f=>({...f,size:e.target.value}))}>
                  <option value="">All sizes</option>
                  {SIZES.map(s => <option key={s}>{s}</option>)}
                </select>
                <select className="filter-select" value={filters.condition} onChange={e => setFilters(f=>({...f,condition:e.target.value}))}>
                  <option value="">Any condition</option>
                  {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                </select>
                <input className="filter-input" placeholder="Max price £" style={{minWidth:90,maxWidth:110}} value={filters.maxPrice} onChange={e => setFilters(f=>({...f,maxPrice:e.target.value}))} />
              </div>
            )}

            <div className="listing-count">Showing <strong>{filtered.length}</strong> {filtered.length===1?"listing":"listings"}{view==="mylistings"?" — your items":""}</div>

            <div className={view==="browse" ? "layout" : ""}>
              <div>
                <div className="grid">
                  {filtered.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">🩰</div>
                      <h3>{view==="mylistings" ? "No listings yet" : "No items found"}</h3>
                      <p style={{marginTop:".5rem",fontSize:".83rem"}}>{view==="mylistings" ? "Click '+ List Item' to get started." : "Try adjusting your filters."}</p>
                    </div>
                  ) : filtered.map(l => (
                    <div className="card" key={l.id} onClick={() => { setSelectedListing(l); setModal("detail"); }}>
                      <div className="card-image">
                        {l.image ? <img src={l.image} alt={l.title}/> : styleEmoji[l.style]||"👗"}
                        <span className={`condition-pill condition-${conditionKey[l.condition]||"good"}`}>{l.condition}</span>
                      </div>
                      <div className="card-body">
                        <div className="card-style-tag">{l.style}</div>
                        <div className="card-title">{l.title}</div>
                        <div className="card-meta">Size: {l.size} · {l.school}</div>
                        <div className="card-footer">
                          <div className="price">£{l.price} <span>GBP</span></div>
                          <button className="btn btn-outline btn-sm" onClick={e=>{e.stopPropagation();setSelectedListing(l);setModal("detail");}}>View</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {view === "browse" && <AdSidebar ads={ads} />}
            </div>
          </>
        )}
      </div>

      {/* ── AUTH MODAL ── */}
      {modal === "auth" && (
        <div className="overlay" onClick={closeModal}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">Welcome</div><button className="modal-close" onClick={closeModal}>×</button></div>
            <div className="modal-body">
              <div className="auth-tabs">
                <button className={`auth-tab ${authTab==="login"?"active":""}`} onClick={()=>setAuthTab("login")}>Sign In</button>
                <button className={`auth-tab ${authTab==="register"?"active":""}`} onClick={()=>setAuthTab("register")}>Join</button>
              </div>
              {authTab==="register" && <div className="school-code-info">🔑 You need a school code from your dance school admin to join.</div>}
              {authError && <div className="form-error" style={{marginBottom:"1rem"}}>⚠ {authError}</div>}
              {authTab==="register" && <div className="form-group"><label className="form-label">Your name</label><input className="form-input" placeholder="e.g. Sarah Mitchell" value={authForm.name} onChange={e=>setAuthForm(f=>({...f,name:e.target.value}))}/></div>}
              <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" placeholder="you@example.com" value={authForm.email} onChange={e=>setAuthForm(f=>({...f,email:e.target.value}))}/></div>
              {authTab==="register" && <div className="form-group"><label className="form-label">Password</label><input className="form-input" type="password" placeholder="Create a password" value={authForm.password} onChange={e=>setAuthForm(f=>({...f,password:e.target.value}))}/></div>}
              <div className="form-group">
                <label className="form-label">School code</label>
                <input className="form-input" placeholder="Enter your school code" value={authForm.schoolCode} onChange={e=>setAuthForm(f=>({...f,schoolCode:e.target.value}))}/>
                <div className="form-hint">Demo codes: DANCE2024 · STUDIO01 · GRACE123</div>
              </div>
              <button className="btn btn-primary" style={{width:"100%",padding:".72rem"}} onClick={handleAuth}>{authTab==="register"?"Create account":"Sign in"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADMIN LOGIN MODAL ── */}
      {modal === "adminLogin" && (
        <div className="overlay" onClick={closeModal}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title admin-title">⚙ Admin Access</div><button className="modal-close" onClick={closeModal}>×</button></div>
            <div className="modal-body">
              {adminError && <div className="form-error" style={{marginBottom:"1rem"}}>⚠ {adminError}</div>}
              <div className="form-group">
                <label className="form-label">Admin password</label>
                <input className="form-input" type="password" placeholder="Enter admin password" value={adminPass} onChange={e=>setAdminPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAdminLogin()}/>
                <div className="form-hint">Demo: TutuTrade-admin-2024</div>
              </div>
              <button className="btn btn-primary" style={{width:"100%",padding:".72rem"}} onClick={handleAdminLogin}>Access admin panel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE LISTING MODAL ── */}
      {modal === "create" && (
        <div className="overlay" onClick={closeModal}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">List an item</div><button className="modal-close" onClick={closeModal}>×</button></div>
            <div className="modal-body">
              {createError && <div className="form-error" style={{marginBottom:"1rem"}}>⚠ {createError}</div>}
              <div className="form-group"><label className="form-label">Item title *</label><input className="form-input" placeholder="e.g. Pink Ballet Tutu" value={createForm.title} onChange={e=>setCreateForm(f=>({...f,title:e.target.value}))}/></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Dance style *</label><select className="form-select" value={createForm.style} onChange={e=>setCreateForm(f=>({...f,style:e.target.value}))}><option value="">Select...</option>{DANCE_STYLES.map(s=><option key={s}>{s}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Size *</label><select className="form-select" value={createForm.size} onChange={e=>setCreateForm(f=>({...f,size:e.target.value}))}><option value="">Select...</option>{SIZES.map(s=><option key={s}>{s}</option>)}</select></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Condition *</label><select className="form-select" value={createForm.condition} onChange={e=>setCreateForm(f=>({...f,condition:e.target.value}))}><option value="">Select...</option>{CONDITIONS.map(c=><option key={c}>{c}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Price (£) *</label><input className="form-input" type="number" min="1" placeholder="25" value={createForm.price} onChange={e=>setCreateForm(f=>({...f,price:e.target.value}))}/></div>
              </div>
              {createForm.price && !isNaN(createForm.price) && Number(createForm.price) > 0 && (
                <div className="commission-box">
                  <div className="commission-row"><span className="commission-label">Listing price</span><span className="commission-value">£{Number(createForm.price).toFixed(2)}</span></div>
                  <div className="commission-row"><span className="commission-label">Platform fee ({commissionPct}%)</span><span className="commission-value">−£{calcFees(Number(createForm.price),commissionPct).commission}</span></div>
                  <div className="commission-row total"><span>You receive</span><span>£{calcFees(Number(createForm.price),commissionPct).sellerReceives}</span></div>
                </div>
              )}
              <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" placeholder="Describe the item, any wear, original price..." value={createForm.description} onChange={e=>setCreateForm(f=>({...f,description:e.target.value}))}/></div>
              <div className="form-group">
                <label className="form-label">Photo</label>
                <label className="upload-area"><input type="file" accept="image/*" onChange={handleImageUpload}/>{createForm.image?<img src={createForm.image} className="upload-preview" alt="preview"/>:<div>📷 Click to upload photo</div>}</label>
              </div>
              <div className="form-group">
                <label className="form-label">Your PayPal email *</label>
                <input className="form-input" type="email" placeholder="your-paypal@email.com" value={createForm.paypalEmail} onChange={e=>setCreateForm(f=>({...f,paypalEmail:e.target.value}))}/>
                <div className="form-hint">Buyers pay the listed price. Platform fee is deducted from your payout.</div>
              </div>
              <button className="btn btn-primary" style={{width:"100%",padding:".72rem"}} onClick={handleCreate}>Publish listing</button>
            </div>
          </div>
        </div>
      )}

      {/* ── DETAIL MODAL ── */}
      {modal === "detail" && selectedListing && (() => {
        const { commission } = calcFees(selectedListing.price, commissionPct);
        const isOwner = user && user.name === selectedListing.seller;
        return (
          <div className="overlay" onClick={closeModal}>
            <div className="modal" onClick={e=>e.stopPropagation()}>
              <div className="modal-header"><div className="modal-title">{selectedListing.title}</div><button className="modal-close" onClick={closeModal}>×</button></div>
              <div className="modal-body">
                <div className="detail-image">{selectedListing.image?<img src={selectedListing.image} alt={selectedListing.title}/>:styleEmoji[selectedListing.style]||"👗"}</div>
                <div className="detail-tags">
                  <span className="tag tag-style">{selectedListing.style}</span>
                  <span className="tag tag-size">{selectedListing.size}</span>
                  <span className={`condition-pill condition-${conditionKey[selectedListing.condition]||"good"}`} style={{position:"static"}}>{selectedListing.condition}</span>
                </div>
                <div className="detail-price">£{selectedListing.price}</div>
                <p className="detail-desc">{selectedListing.description||"No description provided."}</p>
                <div className="seller-info">
                  <div><strong>Seller:</strong> {selectedListing.seller}</div>
                  <div className="seller-school">📍 {selectedListing.school}</div>
                </div>
                {!isOwner && (
                  <div className="commission-box">
                    <div className="commission-row"><span className="commission-label">Item price</span><span className="commission-value">£{selectedListing.price}</span></div>
                    <div className="commission-row"><span className="commission-label">Platform fee ({commissionPct}%)</span><span className="commission-value">£{commission}</span></div>
                    <div className="commission-row total"><span>You pay</span><span>£{selectedListing.price}</span></div>
                    <div style={{fontSize:".67rem",color:P.muted,marginTop:".35rem"}}>The platform fee is deducted from the seller's payout — you pay the listed price only.</div>
                  </div>
                )}
                {isOwner ? (
                  <button className="btn btn-danger" style={{width:"100%"}} onClick={()=>handleDelete(selectedListing.id)}>Remove listing</button>
                ) : (
                  <a href={`https://www.paypal.com/paypalme/${selectedListing.paypalEmail.split("@")[0]}/${selectedListing.price}GBP`} target="_blank" rel="noopener noreferrer" style={{textDecoration:"none"}}>
                    <button className="paypal-btn">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 0 0-.794.68l-.04.22-.63 3.993-.032.17a.804.804 0 0 1-.794.679H7.72a.483.483 0 0 1-.477-.558L7.418 21h1.518l.95-6.02h1.385c4.678 0 7.75-2.203 8.796-6.502zm-2.96-5.09c.762.868.983 1.81.755 3.137-.093.534-.26 1.02-.5 1.46-.838-3.511-3.235-4.7-7.438-4.7H5.964l.947-5.951A.483.483 0 0 1 7.388 1h5.787c3.44 0 5.58 1.03 6.557 3.019l-.625-.631z"/></svg>
                      Pay £{selectedListing.price} with PayPal
                    </button>
                  </a>
                )}
                {!user && <p style={{textAlign:"center",fontSize:".76rem",color:P.muted,marginTop:".7rem"}}><button className="text-link" onClick={()=>{setModal("auth");setAuthTab("login");}}>Sign in</button> to contact the seller</p>}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── EDIT AD MODAL ── */}
      {modal === "editAd" && (
        <div className="overlay" onClick={closeModal}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title admin-title">{editingAd==="new"?"Add Advertiser":"Edit Advertiser"}</div><button className="modal-close" onClick={closeModal}>×</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Brand name *</label><input className="form-input" placeholder="e.g. Freed of London" value={adForm.title} onChange={e=>setAdForm(f=>({...f,title:e.target.value}))}/></div>
              <div className="form-group"><label className="form-label">Tagline</label><input className="form-input" placeholder="e.g. Professional dancewear since 1929" value={adForm.tagline} onChange={e=>setAdForm(f=>({...f,tagline:e.target.value}))}/></div>
              <div className="form-group"><label className="form-label">Website URL *</label><input className="form-input" placeholder="https://..." value={adForm.url} onChange={e=>setAdForm(f=>({...f,url:e.target.value}))}/></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Ad slot</label><select className="form-select" value={adForm.slot} onChange={e=>setAdForm(f=>({...f,slot:e.target.value}))}><option value="top">Top banner</option><option value="sidebar">Sidebar</option></select></div>
                <div className="form-group"><label className="form-label">Status</label><select className="form-select" value={adForm.active?"true":"false"} onChange={e=>setAdForm(f=>({...f,active:e.target.value==="true"}))}><option value="true">Live</option><option value="false">Paused</option></select></div>
              </div>
              <div className="form-group">
                <label className="form-label">Logo / image</label>
                <label className="upload-area"><input type="file" accept="image/*" onChange={handleAdImageUpload}/>{adForm.image?<img src={adForm.image} className="upload-preview" alt="ad preview"/>:<div>🖼 Click to upload logo or image</div>}</label>
              </div>
              <button className="btn btn-primary" style={{width:"100%",padding:".72rem"}} onClick={handleSaveAd}>{editingAd==="new"?"Add advertiser":"Save changes"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
