import { useState, useEffect, useRef, Fragment } from "react";
import { supabase } from "./supabase.js";

// ─── COLOURS (must be first — used by getCSS and components) ──────────────
function getP() { return {
  bg:"#1a1228",surface:"#231934",card:"#2d2142",border:"#3d2f5c",
  accent:"#c9a96e",accentSoft:"#e8d5aa",pink:"#e8a0b4",
  text:"#f0eaf8",muted:"#a892c4",success:"#6fcf97",admin:"#9d8fe0",
  gradA:"#2e1f52",gradB:"#251640",headerBg:"rgba(13,10,20,0.88)",
}; }
function getLightP() { return {
  bg:"#faf7ff",surface:"#f0eafa",card:"#e8dff5",border:"#cdb8e8",
  accent:"#8b5e1a",accentSoft:"#6b4510",pink:"#c2185b",
  text:"#1a0a2e",muted:"#5e4b78",success:"#1e7e4a",admin:"#5c4db1",
  gradA:"#d8cff0",gradB:"#f0eafa",headerBg:"rgba(250,247,255,0.92)",
}; }

// ─── CONSTANTS ────────────────────────────────────────────────────────────
const ADMIN_EMAIL = "grant.chaplin@hotmail.com";
const SITE_URL = window.location.origin;

// ─── HELPERS ──────────────────────────────────────────────────────────────
const calcFees = (price, pct) => {
  const commission = parseFloat((price * pct / 100).toFixed(2));
  return { commission, sellerReceives: parseFloat((price - commission).toFixed(2)) };
};

// ─── EMAIL ────────────────────────────────────────────────────────────────
const sendSoldEmail = async ({ listing, commissionPct }) => {
  const { commission, sellerReceives } = calcFees(listing.price, commissionPct);
  try {
    await fetch("/.netlify/functions/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: ADMIN_EMAIL,
        subject: `💰 Sale: ${listing.title} — £${listing.price}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:2rem;background:#0d0a14;color:#f0eaf8;border-radius:12px">
            <h2 style="color:#c9a96e;margin-bottom:1rem">🩰 TutuTrade — Item Sold!</h2>
            <p style="color:#8a7a9e;margin-bottom:1.5rem">An item has been marked as sold. Here are the payout details:</p>
            <table style="width:100%;border-collapse:collapse;margin-bottom:1.5rem">
              <tr><td style="padding:.5rem;color:#8a7a9e;border-bottom:1px solid #2e2340">Item</td><td style="padding:.5rem;border-bottom:1px solid #2e2340"><strong>${listing.title}</strong></td></tr>
              <tr><td style="padding:.5rem;color:#8a7a9e;border-bottom:1px solid #2e2340">Seller</td><td style="padding:.5rem;border-bottom:1px solid #2e2340">${listing.seller_name}</td></tr>
              <tr><td style="padding:.5rem;color:#8a7a9e;border-bottom:1px solid #2e2340">Seller email</td><td style="padding:.5rem;border-bottom:1px solid #2e2340">${listing.seller_email}</td></tr>
              <tr><td style="padding:.5rem;color:#8a7a9e;border-bottom:1px solid #2e2340">Seller PayPal</td><td style="padding:.5rem;border-bottom:1px solid #2e2340;color:#6fcf97"><strong>${listing.seller_paypal || listing.seller_email}</strong></td></tr>
              <tr><td style="padding:.5rem;color:#8a7a9e;border-bottom:1px solid #2e2340">School</td><td style="padding:.5rem;border-bottom:1px solid #2e2340">${listing.school_name}</td></tr>
              <tr><td style="padding:.5rem;color:#8a7a9e;border-bottom:1px solid #2e2340">Sale price</td><td style="padding:.5rem;border-bottom:1px solid #2e2340">£${listing.price}</td></tr>
              <tr><td style="padding:.5rem;color:#8a7a9e;border-bottom:1px solid #2e2340">Your commission (${commissionPct}%)</td><td style="padding:.5rem;border-bottom:1px solid #2e2340;color:#c9a96e"><strong>£${commission}</strong></td></tr>
              <tr><td style="padding:.5rem;color:#8a7a9e">Pay seller</td><td style="padding:.5rem;color:#6fcf97;font-size:1.2rem"><strong>£${sellerReceives}</strong></td></tr>
            </table>
            <a href="https://www.paypal.com/send?recipient=${listing.seller_paypal || listing.seller_email}&amount=${sellerReceives}" 
               style="display:inline-block;padding:.75rem 1.5rem;background:#0070ba;color:white;border-radius:8px;text-decoration:none;font-weight:500">
              Pay £${sellerReceives} to ${listing.seller_paypal || listing.seller_email} via PayPal →
            </a>
            <p style="color:#8a7a9e;font-size:.75rem;margin-top:1.5rem">This email was sent automatically by TutuTrade when the item was marked as sold.</p>
          </div>
        `,
      }),
    });
  } catch (e) { console.error("Email error:", e); }
};

const sendResendEmail = async ({ to, subject, html }) => {
  if (!to || to === ADMIN_EMAIL) return;
  try {
    await fetch("/.netlify/functions/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, html }),
    });
  } catch (e) { console.error("Notification email error:", e); }
};

const emailTemplate = (title, body) => `
  <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:2rem;background:#1a1228;color:#f0eaf8;border-radius:12px">
    <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:1.5rem">
      <div style="width:34px;height:34px;background:linear-gradient(135deg,#c9a96e,#e8a0b4);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1rem">🩰</div>
      <div style="font-family:Georgia,serif;font-size:1.2rem;color:#e8d5aa">TutuTrade</div>
    </div>
    <h2 style="color:#c9a96e;margin-bottom:1rem;font-family:Georgia,serif">${title}</h2>
    ${body}
    <div style="margin-top:2rem;padding-top:1rem;border-top:1px solid #3d2f5c;font-size:.72rem;color:#8a7a9e">
      You're receiving this because you have an active listing or post on TutuTrade. Visit <a href="https://tututrade.co.uk" style="color:#c9a96e">tututrade.co.uk</a> to respond.
    </div>
  </div>
`;

const DANCE_STYLES = ["Acro","Ballet","Ballroom","Contemporary","Hip Hop","Irish","Jazz","Lyrical","Musical Theatre","Tap"];
const SIZES = ["Age 2-3","Age 3-4","Age 4-5","Age 5-6","Age 6-7","Age 7-8","Age 8-9","Age 9-10","Age 10-11","Age 11-12","Teen XS","Teen S","Teen M","Teen L","Adult XS","Adult S","Adult M","Adult L","Adult XL"];
const SHOE_SIZES = ["UK 6 (Infant)","UK 7 (Infant)","UK 8 (Infant)","UK 9 (Infant)","UK 10 (Infant)","UK 11 (Infant)","UK 12 (Infant)","UK 13 (Infant)","UK 1","UK 2","UK 3","UK 4","UK 5","UK 6","UK 7","UK 8","UK 9","UK 10"];
const ITEM_TYPES = ["Clothing","Footwear","Accessories / Other"];
const CONDITIONS = ["New with tags","Excellent","Good","Well loved"];
const styleEmoji = {Ballet:"🩰",Jazz:"✨",Tap:"🎩",Contemporary:"🌊","Hip Hop":"🎤","Musical Theatre":"🎭",Acro:"🤸",Irish:"☘️",Ballroom:"💃",Lyrical:"🕊️"};
const conditionKey = {"New with tags":"new","Excellent":"excellent","Good":"good","Well loved":"worn"};

const PRESET_COLORS = [
  // Golds & Warm
  "#c9a96e","#f0a500","#fb923c","#facc15","#fde68a",
  // Pinks & Reds
  "#e8a0b4","#e07070","#f87171","#f472b6","#e879f9",
  // Purples & Blues
  "#7c6fe0","#a78bfa","#60a5fa","#56b3e0","#38bdf8",
  // Greens
  "#6fcf97","#34d399","#4ade80","#86efac","#a3e635",
  // Greys & Neutrals
  "#9ca3af","#6b7280","#4b5563","#d1d5db","#e5e7eb",
  // Extra
  "#c084fc","#fb7185","#fbbf24","#2dd4bf","#818cf8",
];

const hexToRgba = (hex, alpha) => {
  try {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${alpha})`;
  } catch { return `rgba(201,169,110,${alpha})`; }
};


function getCSS(P) { return `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Jost:wght@300;400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{overflow-x:hidden;max-width:100%}
  body{background:${P.bg};color:${P.text};font-family:'Jost',sans-serif;min-height:100vh}
  .app{min-height:100vh;background:radial-gradient(ellipse at 20% 0%,${P.gradA} 0%,${P.bg} 55%),radial-gradient(ellipse at 80% 100%,${P.gradB} 0%,transparent 55%)}
  .header{padding:1.25rem 2rem;border-bottom:1px solid ${P.border};display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;background:${P.headerBg};backdrop-filter:blur(16px)}
  .logo{display:flex;align-items:center;gap:.75rem;cursor:pointer}
  .logo-icon{width:34px;height:34px;background:linear-gradient(135deg,${P.accent},${P.pink});border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1rem}
  .logo-text{font-family:'Playfair Display',serif;font-size:1.35rem;color:${P.accentSoft};letter-spacing:.02em}
  .logo-sub{font-size:.62rem;color:${P.muted};letter-spacing:.15em;text-transform:uppercase;margin-top:-2px}
  .header-actions{display:flex;gap:.6rem;align-items:center;flex-wrap:nowrap}
  .user-menu-wrap{position:relative}
  .user-menu-panel{position:absolute;top:calc(100% + .4rem);right:0;background:${P.surface};border:1px solid ${P.border};border-radius:8px;min-width:150px;z-index:200;box-shadow:0 4px 20px rgba(0,0,0,.4);animation:slideUp .15s ease;overflow:hidden}
  .user-menu-item{display:block;width:100%;padding:.6rem 1rem;background:none;border:none;text-align:left;font-family:'Jost',sans-serif;font-size:.82rem;color:${P.text};cursor:pointer;transition:background .15s;letter-spacing:.02em}
  .user-menu-item:hover{background:${P.card}}
  .header-hi{font-size:.78rem;color:${P.muted}}
  .header-mobile-only{display:none}
  @media(max-width:640px){
    .header{padding:.7rem .75rem}
    .header-actions{gap:.35rem}
    .logo-sub{display:none}
    .logo-text{font-size:1.1rem}
    .header-hi{display:none}
    .header-desktop-only{display:none !important}
    .header-mobile-only{display:block}
  }
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
  .btn-copy{background:rgba(201,169,110,.1);color:${P.accent};border:1px solid rgba(201,169,110,.25);font-size:.72rem;padding:.3rem .7rem;border-radius:5px;cursor:pointer;font-family:'Jost',sans-serif;transition:all .2s}
  .btn-copy:hover{background:rgba(201,169,110,.2)}
  .btn-warning{background:rgba(255,180,0,.1);color:#ffb400;border:1px solid rgba(255,180,0,.3);font-size:.75rem;padding:.4rem .9rem}
  .main{max-width:1200px;margin:0 auto;padding:2rem}
  .layout{display:grid;grid-template-columns:1fr 220px;gap:2rem;align-items:start}
  @media(max-width:800px){.layout{grid-template-columns:1fr}}

  /* HERO */
  .hero{text-align:center;padding:3.5rem 2rem 2.5rem;position:relative}
  .hero::before{content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);width:600px;height:2px;background:linear-gradient(90deg,transparent,${P.accent},transparent)}
  .hero-eyebrow{font-size:.68rem;letter-spacing:.25em;text-transform:uppercase;color:${P.accent};margin-bottom:.85rem}
  .hero-title{font-family:'Playfair Display',serif;font-size:clamp(2rem,5vw,3.2rem);line-height:1.15;color:${P.text};margin-bottom:.85rem}
  .hero-title em{font-style:italic;color:${P.accentSoft}}
  .hero-sub{color:${P.muted};font-size:.92rem;font-weight:300;max-width:460px;margin:0 auto 1.5rem;line-height:1.7}
  .school-badges{display:flex;gap:.65rem;flex-wrap:wrap;justify-content:center;margin-bottom:1rem}

  /* SCHOOL FILTER BANNER */
  .school-filter-banner{padding:.85rem 1.25rem;border-radius:10px;margin-bottom:1.5rem;display:flex;align-items:center;justify-content:space-between;gap:.75rem}
  .school-filter-banner-name{font-family:'Playfair Display',serif;font-size:1.05rem}
  .school-filter-banner-sub{font-size:.75rem;margin-top:.15rem;opacity:.8}

  /* ADS */
  .ad-banner{padding:.75rem 1rem;background:${P.surface};border:1px solid ${P.border};border-radius:10px;margin-bottom:1.75rem;display:flex;align-items:center;gap:1.25rem;text-decoration:none;transition:border-color .2s;position:relative;overflow:hidden}
  .ad-banner:hover{border-color:rgba(201,169,110,.3)}
  .ad-banner-label{position:absolute;top:.45rem;right:.6rem;font-size:.58rem;text-transform:uppercase;letter-spacing:.1em;color:${P.muted};opacity:.7;z-index:1}
  .ad-banner-full-img{width:100%;height:80px;object-fit:cover;border-radius:6px;display:block}
  .ad-banner-icon{width:56px;height:56px;background:linear-gradient(135deg,#2a1f3d,#1e1729);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0;overflow:hidden}
  .ad-banner-icon img{width:100%;height:100%;object-fit:cover}
  .ad-banner-text strong{display:block;font-size:.92rem;color:${P.text};margin-bottom:.15rem}
  .ad-banner-text span{font-size:.78rem;color:${P.muted}}
  .sidebar{display:flex;flex-direction:column;gap:1rem}
  .ad-sidebar-card{padding:1rem;background:${P.surface};border:1px solid ${P.border};border-radius:10px;text-decoration:none;transition:border-color .2s;display:block}
  .ad-sidebar-card:hover{border-color:rgba(201,169,110,.3)}
  .ad-sidebar-label{font-size:.58rem;text-transform:uppercase;letter-spacing:.1em;color:${P.muted};opacity:.7;margin-bottom:.5rem}
  .ad-sidebar-icon{width:100%;height:120px;background:#1e1729;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:2rem;margin-bottom:.65rem;overflow:hidden}
  .ad-sidebar-icon img{width:100%;height:100%;object-fit:contain;padding:.25rem}
  .ad-sidebar-card strong{display:block;font-size:.82rem;color:${P.text};margin-bottom:.2rem}
  .ad-sidebar-card span{font-size:.72rem;color:${P.muted};line-height:1.4}
  .ad-sidebar-cta{display:inline-block;margin-top:.6rem;font-size:.68rem;text-transform:uppercase;letter-spacing:.08em;color:${P.accent}}

  /* FILTERS */
  .filters{display:flex;gap:.65rem;flex-wrap:wrap;margin-bottom:1.5rem;padding:1.1rem;background:${P.surface};border:1px solid ${P.border};border-radius:10px}
  .filter-select,.filter-input{padding:.5rem .85rem;background:${P.card};border:1px solid ${P.border};border-radius:6px;color:${P.text};font-family:'Jost',sans-serif;font-size:.8rem;outline:none;transition:border-color .2s;flex:1;min-width:130px}
  .filter-input{min-width:180px}
  .filter-select:focus,.filter-input:focus{border-color:${P.accent}}
  .filter-select option{background:${P.card}}

  /* NAV */
  .nav-pills{display:flex;gap:.5rem;margin-bottom:2rem;flex-wrap:wrap;padding-top:.5rem}
  .nav-pill{padding:.5rem 1.25rem;border-radius:20px;background:transparent;border:1px solid ${P.border};color:${P.muted};font-family:'Jost',sans-serif;font-size:.75rem;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;transition:all .2s}
  .nav-pill.active{background:rgba(201,169,110,.12);border-color:${P.accent};color:${P.accent}}

  /* GRID & CARDS */
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1.1rem}
  .listing-count{font-size:.78rem;color:${P.muted};margin-bottom:1.1rem}
  .listing-count strong{color:${P.accentSoft}}
  .card{background:${P.card};border:1px solid ${P.border};border-radius:12px;overflow:hidden;transition:all .25s;cursor:pointer}
  .card:hover{transform:translateY(-3px);box-shadow:0 8px 32px rgba(0,0,0,.4)}
  .card-image{width:100%;height:170px;background:linear-gradient(135deg,#1e1729,#2a1f3d);display:flex;align-items:center;justify-content:center;font-size:3.2rem;position:relative;overflow:hidden}
  .card-image img{width:100%;height:100%;object-fit:cover}
  .card-image::after{content:'';position:absolute;bottom:0;left:0;right:0;height:40px;background:linear-gradient(transparent,${P.card})}
  .condition-pill{position:absolute;top:.6rem;right:.6rem;padding:.18rem .55rem;border-radius:20px;font-size:.62rem;font-weight:500;letter-spacing:.05em;text-transform:uppercase;z-index:1}
  .condition-new{background:rgba(111,207,151,.2);color:${P.success};border:1px solid rgba(111,207,151,.3)}
  .condition-excellent{background:rgba(201,169,110,.15);color:${P.accent};border:1px solid rgba(201,169,110,.25)}
  .condition-good{background:rgba(232,160,180,.15);color:${P.pink};border:1px solid rgba(232,160,180,.25)}
  .condition-worn{background:rgba(138,122,158,.15);color:${P.muted};border:1px solid rgba(138,122,158,.25)}
  .card-body{padding:.9rem}
  .card-style-tag{font-size:.62rem;text-transform:uppercase;letter-spacing:.12em;margin-bottom:.3rem}
  .card-title{font-family:'Playfair Display',serif;font-size:1rem;margin-bottom:.35rem;color:${P.text};line-height:1.3}
  .card-meta{font-size:.75rem;color:${P.muted};margin-bottom:.65rem}
  .card-footer{display:flex;align-items:center;justify-content:space-between;padding-top:.65rem;border-top:1px solid ${P.border}}
  .price{font-family:'Playfair Display',serif;font-size:1.25rem;color:${P.accentSoft}}
  .price span{font-size:.72rem;color:${P.muted};font-family:'Jost',sans-serif}
  .school-stripe{height:3px;width:100%}
  .sold-overlay{position:absolute;inset:0;background:rgba(13,10,20,.65);display:flex;align-items:center;justify-content:center;z-index:2}
  .sold-badge{padding:.35rem 1rem;background:#e07070;color:white;border-radius:20px;font-size:.72rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase}
  .lightbox{position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:300;display:flex;align-items:center;justify-content:center;cursor:zoom-out;animation:fadeIn .15s ease}
  .lightbox img{max-width:92vw;max-height:92vh;object-fit:contain;border-radius:8px;box-shadow:0 8px 48px rgba(0,0,0,.6)}
  .lightbox-close{position:absolute;top:1.25rem;right:1.5rem;background:rgba(255,255,255,.12);border:none;color:white;font-size:1.6rem;cursor:pointer;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:background .2s}
  .lightbox-close:hover{background:rgba(255,255,255,.22)}
  .show-sold-toggle{display:flex;align-items:center;gap:.5rem;font-size:.75rem;color:${P.muted};cursor:pointer;padding:.4rem .8rem;border:1px solid ${P.border};border-radius:20px;background:transparent;font-family:'Jost',sans-serif;transition:all .2s;white-space:nowrap}
  .show-sold-toggle:hover{border-color:${P.accent};color:${P.accent}}
  .show-sold-toggle.active{border-color:${P.accent};color:${P.accent};background:rgba(201,169,110,.08)}
  .image-gallery{display:flex;gap:.5rem;overflow-x:auto;margin-bottom:1.1rem;padding-bottom:.25rem}
  .image-gallery img{height:180px;width:auto;min-width:180px;object-fit:cover;border-radius:8px;cursor:zoom-in;flex-shrink:0;transition:opacity .2s}
  .image-gallery img:hover{opacity:.85}
  .image-gallery-single{width:100%;height:210px;object-fit:cover;border-radius:10px;cursor:zoom-in}
  .multi-upload-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem;margin-top:.5rem}
  .multi-upload-thumb{position:relative;aspect-ratio:1;border-radius:7px;overflow:hidden}
  .multi-upload-thumb img{width:100%;height:100%;object-fit:cover}
  .multi-upload-remove{position:absolute;top:.25rem;right:.25rem;background:rgba(0,0,0,.6);border:none;color:white;border-radius:50%;width:20px;height:20px;font-size:.75rem;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1}
  .landing{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:3rem 2rem;position:relative}
  .landing::before{content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);width:600px;height:2px;background:linear-gradient(90deg,transparent,${P.accent},transparent)}
  .landing-schools{display:flex;gap:.65rem;flex-wrap:wrap;justify-content:center;margin:1.5rem 0}
  .landing-features{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;max-width:700px;margin:2rem auto;text-align:left}
  @media(max-width:600px){.landing-features{grid-template-columns:1fr}}
  .landing-feature{padding:1rem;background:${P.surface};border:1px solid ${P.border};border-radius:10px}
  .landing-feature-icon{font-size:1.4rem;margin-bottom:.5rem}
  .landing-feature-title{font-size:.82rem;font-weight:500;color:${P.text};margin-bottom:.25rem}
  .landing-feature-desc{font-size:.75rem;color:${P.muted};line-height:1.5}
  .general-badge{display:inline-flex;align-items:center;gap:.4rem;padding:.2rem .6rem;background:rgba(138,122,158,.12);border:1px solid rgba(138,122,158,.3);border-radius:12px;font-size:.65rem;color:${P.muted};text-transform:uppercase;letter-spacing:.08em}
  .card-image-wrap{position:relative;cursor:zoom-in}

  /* MODALS */
  .overlay{position:fixed;inset:0;background:rgba(0,0,0,.78);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:center;justify-content:center;padding:1rem;animation:fadeIn .2s ease}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes slideUp{from{transform:translateY(18px);opacity:0}to{transform:translateY(0);opacity:1}}
  .modal{background:${P.surface};border:1px solid ${P.border};border-radius:14px;width:100%;max-width:min(520px,calc(100vw - 2rem));max-height:90vh;overflow-y:auto;box-sizing:border-box;animation:slideUp .25s ease}
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

  /* ADMIN */
  .admin-section{margin-bottom:2rem}
  .admin-section-title{font-family:'Playfair Display',serif;font-size:1.05rem;color:#a99ef0;margin-bottom:1rem;padding-bottom:.5rem;border-bottom:1px solid rgba(124,111,224,.2)}
  .admin-stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:.75rem;margin-bottom:1.75rem}
  @media(max-width:700px){.admin-stat-grid{grid-template-columns:repeat(2,1fr)}}
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
  .admin-tabs{display:flex;gap:.5rem;margin-bottom:1.5rem;flex-wrap:wrap}
  .admin-tab{padding:.45rem 1rem;border-radius:20px;background:transparent;border:1px solid rgba(124,111,224,.25);color:${P.muted};font-family:'Jost',sans-serif;font-size:.75rem;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;transition:all .2s}
  .admin-tab.active{background:rgba(124,111,224,.15);border-color:${P.admin};color:${P.admin}}
  .user-card{background:${P.card};border:1px solid ${P.border};border-radius:10px;padding:1rem;margin-bottom:.75rem}
  .user-card-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:.75rem}
  .user-card-name{font-size:.92rem;color:${P.text};font-weight:500}
  .user-card-email{font-size:.73rem;color:${P.muted};margin-top:.15rem}
  .confirm-box{padding:.85rem;background:rgba(224,112,112,.08);border:1px solid rgba(224,112,112,.25);border-radius:8px;margin-top:.75rem;font-size:.82rem;color:${P.muted}}
  .confirm-box strong{color:#e07070;display:block;margin-bottom:.5rem}
  .confirm-actions{display:flex;gap:.5rem;margin-top:.75rem}
  .color-swatch{width:26px;height:26px;border-radius:50%;border:2px solid rgba(255,255,255,.1);cursor:pointer;flex-shrink:0;transition:transform .15s}
  .color-swatch:hover{transform:scale(1.18)}
  .color-picker-row{display:flex;gap:.4rem;flex-wrap:wrap;margin-top:.5rem}
  .profile-school-item{display:flex;align-items:center;justify-content:space-between;padding:.7rem .85rem;border-radius:8px;margin-bottom:.5rem;border-left:4px solid}

  /* MISC */
  .empty-state{grid-column:1/-1;text-align:center;padding:3.5rem 2rem;color:${P.muted}}
  .empty-state-icon{font-size:2.8rem;margin-bottom:.85rem;opacity:.5}
  .empty-state h3{font-family:'Playfair Display',serif;color:${P.text};margin-bottom:.4rem}
  .success-banner{padding:.7rem 1rem;background:rgba(111,207,151,.1);border:1px solid rgba(111,207,151,.3);border-radius:7px;color:${P.success};font-size:.8rem;margin-bottom:1rem;text-align:center;cursor:pointer}
  .loading{text-align:center;padding:3rem;color:${P.muted};font-size:.88rem}
  .text-link{background:none;border:none;color:${P.accent};cursor:pointer;text-decoration:underline;font:inherit;font-size:.76rem}
  ::-webkit-scrollbar{width:5px}
  ::-webkit-scrollbar-track{background:${P.bg}}
  ::-webkit-scrollbar-thumb{background:${P.border};border-radius:3px}

  /* COMMENTS */
  .comments-section{margin-top:1.1rem;padding-top:1.1rem;border-top:1px solid ${P.border}}
  .comments-title{font-size:.72rem;text-transform:uppercase;letter-spacing:.1em;color:${P.muted};margin-bottom:.75rem}
  .comment-item{padding:.65rem .85rem;background:${P.card};border-radius:8px;margin-bottom:.5rem;font-size:.82rem}
  .comment-reply-item{padding:.5rem .75rem;background:${P.surface};border-radius:6px;margin-top:.4rem;margin-left:1rem;font-size:.78rem;border-left:2px solid ${P.accent}}
  .comment-reply-author{font-weight:500;color:${P.accentSoft};font-size:.72rem;margin-bottom:.15rem}
  .comment-reply-btn{background:none;border:none;color:${P.muted};cursor:pointer;font-size:.72rem;font-family:'Jost',sans-serif;padding:.15rem 0;transition:color .2s}
  .comment-reply-btn:hover{color:${P.accent}}
  .comment-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:.25rem}
  .comment-author{font-weight:500;color:${P.accent};font-size:.75rem}
  .comment-time{font-size:.68rem;color:${P.muted}}
  .comment-text{color:${P.text};line-height:1.5}
  .comment-input-row{display:flex;gap:.5rem;margin-top:.75rem;flex-wrap:wrap}
  .comment-input-row .form-input{flex:1;min-width:0}
  @media(max-width:600px){.overlay{display:block;overflow-y:auto;padding:.75rem}.modal{max-height:none;width:calc(100vw - 1.5rem);margin:.75rem auto;-webkit-overflow-scrolling:touch}}

  /* BOARD */
  .board-filters{display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1.25rem}
  .board-post{background:${P.card};border:1px solid ${P.border};border-radius:10px;margin-bottom:.85rem;overflow:hidden}
  .board-post-header{padding:.85rem 1rem;cursor:pointer;transition:background .2s}
  .board-post-header:hover{background:${P.surface}}
  .board-post-title{font-family:'Playfair Display',serif;font-size:.95rem;color:${P.text};margin-bottom:.25rem}
  .board-post-meta{font-size:.72rem;color:${P.muted};display:flex;gap:.75rem;align-items:center;flex-wrap:wrap}
  .board-post-body{padding:.85rem 1rem;border-top:1px solid ${P.border};font-size:.84rem;color:${P.muted};line-height:1.6}
  .board-replies{padding:.75rem 1rem;background:${P.bg};border-top:1px solid ${P.border}}
  .board-reply{padding:.6rem .75rem;background:${P.surface};border-radius:7px;margin-bottom:.4rem;font-size:.8rem}
  .board-reply-author{font-weight:500;color:${P.pink};font-size:.72rem;margin-bottom:.2rem}
  .new-post-form{padding:1rem;background:${P.surface};border:1px solid ${P.border};border-radius:10px;margin-bottom:1.25rem}

  /* WANTED */
  .wanted-post{background:${P.card};border:1px solid ${P.border};border-radius:10px;padding:1rem;margin-bottom:.75rem;display:flex;flex-direction:column;gap:.4rem}
  .wanted-post-title{font-family:'Playfair Display',serif;font-size:.95rem;color:${P.text}}
  .wanted-post-tags{display:flex;gap:.4rem;flex-wrap:wrap}
  .wanted-post-meta{font-size:.72rem;color:${P.muted};display:flex;gap:.75rem;flex-wrap:wrap;align-items:center}
  .wanted-post-desc{font-size:.82rem;color:${P.muted};line-height:1.5}
  .wanted-post.fulfilled{opacity:.55}
  .wanted-fulfilled-badge{padding:.18rem .55rem;border-radius:20px;font-size:.62rem;font-weight:500;letter-spacing:.05em;text-transform:uppercase;background:rgba(111,207,151,.15);color:${P.success};border:1px solid rgba(111,207,151,.3)}
  .theme-toggle{background:transparent;border:1px solid ${P.border};color:${P.muted};border-radius:6px;padding:.4rem .7rem;cursor:pointer;font-size:.88rem;transition:all .2s;line-height:1}
  .theme-toggle:hover{border-color:${P.accent};color:${P.accent}}
  .notif-btn{position:relative;background:transparent;border:1px solid ${P.border};color:${P.muted};border-radius:6px;padding:.4rem .65rem;cursor:pointer;font-size:.95rem;transition:all .2s;line-height:1}
  .notif-btn:hover,.notif-btn.open{border-color:${P.accent};color:${P.accent}}
  .notif-badge{position:absolute;top:-.3rem;right:-.3rem;background:#e07070;color:white;border-radius:50%;min-width:16px;height:16px;font-size:.58rem;display:flex;align-items:center;justify-content:center;font-weight:700;padding:0 .2rem;line-height:1}
  .notif-panel{position:fixed;top:4.2rem;right:1rem;width:320px;max-height:72vh;overflow-y:auto;background:${P.surface};border:1px solid ${P.border};border-radius:12px;z-index:150;box-shadow:0 8px 32px rgba(0,0,0,.45);animation:slideUp .2s ease}
  @media(max-width:400px){.notif-panel{right:.5rem;left:.5rem;width:auto}}
  .notif-panel-header{padding:.75rem 1rem;border-bottom:1px solid ${P.border};display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:${P.surface};z-index:1}
  .notif-panel-title{font-size:.78rem;font-weight:500;color:${P.text};text-transform:uppercase;letter-spacing:.08em}
  .notif-item{padding:.7rem 1rem;border-bottom:1px solid rgba(61,47,92,.4);cursor:pointer;transition:background .15s;border-left:3px solid transparent}
  .notif-item:hover{background:${P.card}}
  .notif-item.unread{border-left-color:${P.accent};background:rgba(201,169,110,.04)}
  .notif-item-title{font-size:.8rem;font-weight:500;color:${P.text};margin-bottom:.15rem}
  .notif-item-body{font-size:.74rem;color:${P.muted};line-height:1.4}
  .notif-item-time{font-size:.65rem;color:${P.muted};margin-top:.25rem;opacity:.75}
  .notif-empty{padding:2rem 1rem;text-align:center;color:${P.muted};font-size:.82rem}

  /* FAIRY PANEL */
  .fairy-panel{position:fixed;top:4.2rem;right:1rem;width:340px;max-height:82vh;display:flex;flex-direction:column;background:${P.surface};border:1px solid ${P.border};border-radius:12px;z-index:150;box-shadow:0 8px 32px rgba(0,0,0,.45);animation:slideUp .2s ease}
  @media(max-width:400px){.fairy-panel{right:.5rem;left:.5rem;width:auto}}
  .fairy-panel-header{padding:.6rem .85rem;border-bottom:1px solid ${P.border};display:flex;align-items:center;justify-content:space-between;background:${P.surface};border-radius:12px 12px 0 0;flex-shrink:0}
  .fairy-tabs{display:flex;gap:.3rem}
  .fairy-tab-btn{background:none;border:1px solid transparent;color:${P.muted};border-radius:6px;padding:.22rem .6rem;font-family:'Jost',sans-serif;font-size:.7rem;cursor:pointer;transition:all .2s;letter-spacing:.04em;text-transform:uppercase}
  .fairy-tab-btn.active{border-color:${P.accent};color:${P.accent};background:rgba(201,169,110,.08)}
  .fairy-chat-body{flex:1;overflow-y:auto;padding:.75rem 1rem;display:flex;flex-direction:column;gap:.6rem;min-height:0}
  .fairy-greeting{padding:.7rem .9rem;background:rgba(201,169,110,.07);border:1px solid rgba(201,169,110,.2);border-radius:12px 12px 12px 2px;font-size:.82rem;color:${P.text};line-height:1.5}
  .fairy-msg-user{align-self:flex-end;padding:.5rem .8rem;background:rgba(124,111,224,.15);border:1px solid rgba(124,111,224,.25);border-radius:12px 12px 2px 12px;font-size:.82rem;color:${P.text};max-width:88%;line-height:1.4;word-break:break-word}
  .fairy-msg-fairy{align-self:flex-start;padding:.5rem .8rem;background:rgba(201,169,110,.07);border:1px solid rgba(201,169,110,.18);border-radius:12px 12px 12px 2px;font-size:.82rem;color:${P.text};max-width:95%;line-height:1.5;word-break:break-word}
  .fairy-match-item{padding:.45rem .7rem;background:${P.card};border-radius:8px;margin-top:.35rem;cursor:pointer;border:1px solid ${P.border};transition:border-color .2s}
  .fairy-match-item:hover{border-color:${P.accent}}
  .fairy-match-title{font-size:.78rem;font-weight:500;color:${P.accentSoft}}
  .fairy-match-meta{font-size:.69rem;color:${P.muted};margin-top:.1rem}
  .fairy-searching{text-align:center;font-size:.76rem;color:${P.muted};padding:.35rem}
  .fairy-input-row{padding:.55rem .75rem;border-top:1px solid ${P.border};display:flex;gap:.4rem;flex-shrink:0}
  .fairy-input-row .form-input{flex:1;font-size:.82rem;padding:.4rem .65rem}

  /* PIXIE DUST */
  .pixie-canvas{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;}

  /* COUNTDOWN */
  .countdown-section{margin-bottom:1.5rem}
  .countdown-cards{display:flex;flex-direction:column;gap:.75rem}
  .countdown-card{padding:1rem 1.25rem;border-radius:12px;border-left:4px solid;background:${P.surface};border-color:${P.border}}
  .countdown-card-title{font-family:'Playfair Display',serif;font-size:1rem;color:${P.text};margin-bottom:.2rem}
  .countdown-card-desc{font-size:.75rem;color:${P.muted};margin-bottom:.75rem}
  .countdown-timer{display:flex;gap:.5rem;align-items:center;flex-wrap:wrap}
  .countdown-unit{text-align:center;min-width:52px;padding:.4rem .6rem;border-radius:8px;background:${P.card}}
  .countdown-num{font-family:'Playfair Display',serif;font-size:1.5rem;line-height:1;display:block}
  .countdown-label{font-size:.58rem;text-transform:uppercase;letter-spacing:.1em;color:${P.muted};display:block;margin-top:.15rem}
  .countdown-sep{font-size:1.2rem;color:${P.muted};opacity:.5;align-self:flex-start;padding-top:.35rem}
  .countdown-expired{font-size:.82rem;color:${P.muted};font-style:italic}

  /* ADMIN EVENTS */
  .event-item{display:flex;align-items:flex-start;justify-content:space-between;padding:.75rem;background:${P.card};border:1px solid ${P.border};border-radius:8px;margin-bottom:.5rem;gap:.75rem}
  .event-item-info{flex:1}
  .event-item-title{font-size:.88rem;color:${P.text};font-weight:500}
  .event-item-meta{font-size:.73rem;color:${P.muted};margin-top:.2rem}
`; }

function PixieDust() {
  const tutuCanvasRef = useRef(null);
  useEffect(() => {
    const tutuCanvas = tutuCanvasRef.current;
    if (!tutuCanvas) return;
    const tutuCtx = tutuCanvas.getContext('2d');
    const tutuResize = () => { tutuCanvas.width = window.innerWidth; tutuCanvas.height = window.innerHeight; };
    tutuResize();

    // ── ONE-TIME DUST BURST from logo ──
    const tutuDust = Array.from({length:60}, (_,tutuIdx) => ({
      tutuX: 48+(Math.random()*20-10), tutuY: 36+(Math.random()*20-10),
      tutuVX: Math.random()*0.7+0.1, tutuVY: Math.random()*0.3-0.08,
      tutuAX: -0.0001, tutuAY: 0.009,
      tutuSize: Math.random()*2.5+0.8,
      tutuOpacity: Math.random()*0.6+0.4,
      tutuFade: Math.random()*0.0003+0.00005,
      tutuHue: Math.random()*25+38,
      tutuDelay: tutuIdx*5, tutuDone: false,
    }));
    let tutuBurstDone = false;

    // ── CLICK BURST ──
    const tutuBursts = [];
    const tutuAddBurst = (tutuBX, tutuBY) => {
      for (let tutuBI=0; tutuBI<24; tutuBI++) {
        const tutuAngle = (Math.PI*2*tutuBI)/24 + Math.random()*0.3;
        const tutuSpd = Math.random()*4+1.5;
        tutuBursts.push({
          tutuX: tutuBX, tutuY: tutuBY,
          tutuVX: Math.cos(tutuAngle)*tutuSpd, tutuVY: Math.sin(tutuAngle)*tutuSpd,
          tutuSize: Math.random()*2.5+0.8,
          tutuOpacity: 1, tutuFade: Math.random()*0.025+0.015,
          tutuHue: Math.random()*35+30, tutuAY: 0.06,
        });
      }
    };

    // ── FAIRY ──
    const tutuFairy = {
      tutuX: 60, tutuY: 60, tutuTX: 200, tutuTY: 200,
      tutuWing: 0, tutuWobble: 0, tutuTrail: [],
      tutuState: "flying", tutuTimer: 0,
    };
    const tutuNewTarget = () => {
      const tutuM = 80, tutuSide = Math.floor(Math.random()*4);
      if (tutuSide===0) return {tutuX:tutuM+Math.random()*(tutuCanvas.width-tutuM*2), tutuY:tutuM};
      if (tutuSide===1) return {tutuX:tutuCanvas.width-tutuM, tutuY:tutuM+Math.random()*(tutuCanvas.height-tutuM*2)};
      if (tutuSide===2) return {tutuX:tutuM+Math.random()*(tutuCanvas.width-tutuM*2), tutuY:tutuCanvas.height-tutuM};
      return {tutuX:tutuM, tutuY:tutuM+Math.random()*(tutuCanvas.height-tutuM*2)};
    };
    const tutuT0 = tutuNewTarget(); tutuFairy.tutuTX = tutuT0.tutuX; tutuFairy.tutuTY = tutuT0.tutuY;

    const tutuDrawStar = (tutuSX, tutuSY, tutuSZ, tutuSH, tutuSA) => {
      if (tutuSA<=0) return;
      tutuCtx.save();
      tutuCtx.globalAlpha = Math.min(1,tutuSA);
      tutuCtx.fillStyle = `hsl(${tutuSH},90%,68%)`;
      tutuCtx.shadowBlur = 4; tutuCtx.shadowColor = `hsl(${tutuSH},100%,78%)`;
      tutuCtx.beginPath();
      for (let tutuSJ=0;tutuSJ<10;tutuSJ++) {
        const tutuSA2=(tutuSJ*Math.PI)/5-Math.PI/2, tutuSR=tutuSJ%2===0?tutuSZ:tutuSZ*0.4;
        tutuSJ===0?tutuCtx.moveTo(tutuSX+tutuSR*Math.cos(tutuSA2),tutuSY+tutuSR*Math.sin(tutuSA2)):tutuCtx.lineTo(tutuSX+tutuSR*Math.cos(tutuSA2),tutuSY+tutuSR*Math.sin(tutuSA2));
      }
      tutuCtx.closePath(); tutuCtx.fill(); tutuCtx.shadowBlur=0; tutuCtx.restore();
    };

    const tutuDrawFairy = (tutuFX, tutuFY, tutuFW) => {
      tutuCtx.save(); tutuCtx.translate(tutuFX, tutuFY);
      // Soft pink glow (not yellow — that's a firefly!)
      try {
        const tutuFG = tutuCtx.createRadialGradient(0,0,0,0,0,16);
        tutuFG.addColorStop(0,"rgba(255,180,220,0.13)"); tutuFG.addColorStop(1,"rgba(255,180,220,0)");
        tutuCtx.beginPath(); tutuCtx.arc(0,0,16,0,Math.PI*2); tutuCtx.fillStyle=tutuFG; tutuCtx.fill();
      } catch(tutuE){}
      const tutuWF = Math.sin(tutuFW)*0.4;
      // 4 fairy wings — upper pair large, lower pair small
      tutuCtx.globalAlpha=0.62;
      tutuCtx.shadowBlur=6; tutuCtx.shadowColor="rgba(200,160,255,0.8)";
      tutuCtx.beginPath(); tutuCtx.ellipse(-9,-5,13,5,-0.5+tutuWF,0,Math.PI*2); tutuCtx.fillStyle="rgba(230,210,255,0.78)"; tutuCtx.fill();
      tutuCtx.beginPath(); tutuCtx.ellipse(9,-5,13,5,0.5-tutuWF,0,Math.PI*2); tutuCtx.fill();
      tutuCtx.beginPath(); tutuCtx.ellipse(-7,2,8,3.5,0.35+tutuWF*0.4,0,Math.PI*2); tutuCtx.fillStyle="rgba(255,210,240,0.62)"; tutuCtx.fill();
      tutuCtx.beginPath(); tutuCtx.ellipse(7,2,8,3.5,-0.35-tutuWF*0.4,0,Math.PI*2); tutuCtx.fill();
      tutuCtx.shadowBlur=0; tutuCtx.globalAlpha=1;
      // Tutu skirt
      tutuCtx.beginPath(); tutuCtx.moveTo(-2.5,1); tutuCtx.lineTo(2.5,1); tutuCtx.lineTo(6.5,9); tutuCtx.lineTo(0,10); tutuCtx.lineTo(-6.5,9); tutuCtx.closePath();
      tutuCtx.fillStyle="rgba(255,182,213,0.92)"; tutuCtx.fill();
      tutuCtx.beginPath(); tutuCtx.moveTo(-2,2.5); tutuCtx.lineTo(2,2.5); tutuCtx.lineTo(5,7); tutuCtx.lineTo(0,8); tutuCtx.lineTo(-5,7); tutuCtx.closePath();
      tutuCtx.fillStyle="rgba(255,225,238,0.45)"; tutuCtx.fill();
      // Body
      tutuCtx.beginPath(); tutuCtx.ellipse(0,2,2.5,4,0,0,Math.PI*2); tutuCtx.fillStyle="#f9c4d2"; tutuCtx.fill();
      // Head
      tutuCtx.beginPath(); tutuCtx.arc(0,-5.5,4,0,Math.PI*2); tutuCtx.fillStyle="#fde8d0"; tutuCtx.fill();
      // Hair
      tutuCtx.beginPath(); tutuCtx.arc(0,-7.5,3.8,Math.PI,Math.PI*2); tutuCtx.fillStyle="#c9a96e"; tutuCtx.fill();
      // Eyes
      tutuCtx.fillStyle="#5a3e2b";
      tutuCtx.beginPath(); tutuCtx.arc(-1.4,-5.5,0.8,0,Math.PI*2); tutuCtx.fill();
      tutuCtx.beginPath(); tutuCtx.arc(1.4,-5.5,0.8,0,Math.PI*2); tutuCtx.fill();
      // Wand
      tutuCtx.strokeStyle="#c9a96e"; tutuCtx.lineWidth=1.2;
      tutuCtx.beginPath(); tutuCtx.moveTo(3.5,0); tutuCtx.lineTo(12,-9); tutuCtx.stroke();
      tutuCtx.fillStyle="#ffe066"; tutuCtx.shadowBlur=7; tutuCtx.shadowColor="#ffe066";
      tutuCtx.beginPath();
      for (let tutuWI=0;tutuWI<10;tutuWI++){
        const tutuWA=(tutuWI*Math.PI)/5-Math.PI/2, tutuWR=tutuWI%2===0?3.5:1.4;
        tutuWI===0?tutuCtx.moveTo(12+tutuWR*Math.cos(tutuWA),-9+tutuWR*Math.sin(tutuWA)):tutuCtx.lineTo(12+tutuWR*Math.cos(tutuWA),-9+tutuWR*Math.sin(tutuWA));
      }
      tutuCtx.closePath(); tutuCtx.fill(); tutuCtx.shadowBlur=0; tutuCtx.restore();
    };

    let tutuRAF, tutuFrame=0;
    const tutuDraw = () => {
      tutuCtx.clearRect(0,0,tutuCanvas.width,tutuCanvas.height);
      tutuFrame++;

      // Dust burst
      if (!tutuBurstDone) {
        let tutuAlive=0;
        tutuDust.forEach(tutuD => {
          if (tutuD.tutuDone) return;
          if (tutuD.tutuDelay>0) { tutuD.tutuDelay--; tutuAlive++; return; }
          tutuD.tutuVX+=tutuD.tutuAX; tutuD.tutuVY+=tutuD.tutuAY;
          tutuD.tutuX+=tutuD.tutuVX; tutuD.tutuY+=tutuD.tutuVY; tutuD.tutuOpacity-=tutuD.tutuFade;
          if (tutuD.tutuOpacity<=0){tutuD.tutuDone=true;return;}
          tutuAlive++;
          tutuDrawStar(tutuD.tutuX,tutuD.tutuY,tutuD.tutuSize,tutuD.tutuHue,tutuD.tutuOpacity);
        });
        if (tutuAlive===0) tutuBurstDone=true;
      }

      // Click bursts
      for (let tutuBI=tutuBursts.length-1;tutuBI>=0;tutuBI--){
        const tutuB=tutuBursts[tutuBI];
        tutuB.tutuVX*=0.94; tutuB.tutuVY*=0.94; tutuB.tutuVY+=tutuB.tutuAY;
        tutuB.tutuX+=tutuB.tutuVX; tutuB.tutuY+=tutuB.tutuVY; tutuB.tutuOpacity-=tutuB.tutuFade;
        if(tutuB.tutuOpacity<=0){tutuBursts.splice(tutuBI,1);continue;}
        tutuDrawStar(tutuB.tutuX,tutuB.tutuY,tutuB.tutuSize,tutuB.tutuHue,tutuB.tutuOpacity);
      }

      // Fairy trail
      tutuFairy.tutuTrail.push({tutuX:tutuFairy.tutuX,tutuY:tutuFairy.tutuY});
      if(tutuFairy.tutuTrail.length>16) tutuFairy.tutuTrail.shift();
      tutuFairy.tutuTrail.forEach((tutuTR,tutuTI)=>{
        tutuDrawStar(tutuTR.tutuX,tutuTR.tutuY,(tutuTI/tutuFairy.tutuTrail.length)*1.6,45,(tutuTI/tutuFairy.tutuTrail.length)*0.35);
      });

      // Fairy movement
      tutuFairy.tutuWing+=0.25; tutuFairy.tutuWobble+=0.05;
      if(tutuFairy.tutuState==="flying"){
        const tutuDX=tutuFairy.tutuTX-tutuFairy.tutuX, tutuDY=tutuFairy.tutuTY-tutuFairy.tutuY;
        const tutuDist=Math.sqrt(tutuDX*tutuDX+tutuDY*tutuDY);
        if(tutuDist<10){tutuFairy.tutuState="hovering";tutuFairy.tutuTimer=100+Math.random()*100;}
        else{tutuFairy.tutuX+=(tutuDX/tutuDist)*0.7+Math.sin(tutuFairy.tutuWobble)*0.5;tutuFairy.tutuY+=(tutuDY/tutuDist)*0.7+Math.cos(tutuFairy.tutuWobble*0.7)*0.5;}
        if(tutuFrame%22===0) tutuDrawStar(tutuFairy.tutuX+12,tutuFairy.tutuY-9,1.2,45,0.7);
      } else {
        tutuFairy.tutuY+=Math.sin(tutuFairy.tutuWobble)*0.6; tutuFairy.tutuTimer--;
        if(tutuFrame%15===0) tutuDrawStar(tutuFairy.tutuX+12+Math.random()*6-3,tutuFairy.tutuY-9+Math.random()*6-3,1.5,45,0.8);
        if(tutuFairy.tutuTimer<=0){const tutuNT=tutuNewTarget();tutuFairy.tutuTX=tutuNT.tutuX;tutuFairy.tutuTY=tutuNT.tutuY;tutuFairy.tutuState="flying";}
      }
      tutuDrawFairy(tutuFairy.tutuX,tutuFairy.tutuY,tutuFairy.tutuWing);
      tutuRAF=requestAnimationFrame(tutuDraw);
    };
    tutuDraw();

    const tutuClickHandler = (tutuCE) => tutuAddBurst(tutuCE.clientX, tutuCE.clientY);
    window.addEventListener("click", tutuClickHandler);
    window.addEventListener("resize", tutuResize);
    return () => { cancelAnimationFrame(tutuRAF); window.removeEventListener("click",tutuClickHandler); window.removeEventListener("resize",tutuResize); };
  }, []);
  return <canvas ref={tutuCanvasRef} className="pixie-canvas"/>;
}

function AdBanner({ ad }) {
  if (!ad || !ad.active) return null;
  const href = ad.url.startsWith("http") ? ad.url : `https://${ad.url}`;
  if (ad.image) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={{display:"block",position:"relative",marginBottom:"1.75rem",borderRadius:10,overflow:"hidden",textDecoration:"none"}}>
        <span style={{position:"absolute",top:".45rem",right:".6rem",fontSize:".58rem",textTransform:"uppercase",letterSpacing:".1em",color:"white",opacity:.7,background:"rgba(0,0,0,.4)",padding:".15rem .4rem",borderRadius:4}}>Ad</span>
        <img src={ad.image} alt={ad.title} style={{width:"100%",height:90,objectFit:"contain",display:"block",background:"#1e1729"}}/>
      </a>
    );
  }
  return (
    <a className="ad-banner" href={href} target="_blank" rel="noopener noreferrer">
      <span className="ad-banner-label">Ad</span>
      <div className="ad-banner-icon">💃</div>
      <div className="ad-banner-text"><strong>{ad.title}</strong><span>{ad.tagline}</span></div>
    </a>
  );
}

function AdSidebarSlot({ ads, slot, schoolId }) {
  const active = ads.filter(a => {
    if (!a.active || a.slot !== slot) return false;
    if (a.scope === "global") return true; // global ads show in sidebar always
    if (a.scope === "school") return a.school_id === schoolId;
    if (a.scope === "both") return !schoolId || a.school_id === schoolId;
    return false;
  });
  if (!active.length) return null;
  return (
    <>
      {active.map(ad => {
        const href = ad.url?.startsWith("http") ? ad.url : `https://${ad.url}`;
        return (
          <a key={ad.id} className="ad-sidebar-card" href={href} target="_blank" rel="noopener noreferrer">
            <div className="ad-sidebar-label">Sponsored</div>
            <div className="ad-sidebar-icon">{ad.image ? <img src={ad.image} alt={ad.title} style={{width:"100%",height:"100%",objectFit:"contain"}}/> : "🩰"}</div>
            <strong>{ad.title}</strong><br/><span>{ad.tagline}</span>
            <div className="ad-sidebar-cta">Visit →</div>
          </a>
        );
      })}
    </>
  );
}

function SchoolAdBanner({ ads, schoolId }) {
  // School-specific ad above countdown
  const ad = ads.find(a => a.active && a.slot === "school-above-countdown" && (a.scope === "school" || a.scope === "both") && a.school_id === schoolId);
  if (!ad) return null;
  const href = ad.url?.startsWith("http") ? ad.url : `https://${ad.url}`;
  if (ad.image) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={{display:"block",position:"relative",marginBottom:"1rem",borderRadius:10,overflow:"hidden",textDecoration:"none"}}>
        <span style={{position:"absolute",top:".45rem",right:".6rem",fontSize:".58rem",textTransform:"uppercase",letterSpacing:".1em",color:"white",opacity:.7,background:"rgba(0,0,0,.4)",padding:".15rem .4rem",borderRadius:4}}>Ad</span>
        <img src={ad.image} alt={ad.title} style={{width:"100%",height:80,objectFit:"contain",display:"block",background:"#1e1729"}}/>
      </a>
    );
  }
  return (
    <a className="ad-banner" href={href} target="_blank" rel="noopener noreferrer" style={{marginBottom:"1rem"}}>
      <span className="ad-banner-label">Ad</span>
      <div className="ad-banner-icon">💃</div>
      <div className="ad-banner-text"><strong>{ad.title}</strong><span>{ad.tagline}</span></div>
    </a>
  );
}

export default function TutuTrade() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState([]);
  const [ads, setAds] = useState([]);
  const [schools, setSchools] = useState([]);
  const [events, setEvents] = useState([]);
  const [danceStyles, setDanceStyles] = useState(["Ballet","Jazz","Tap","Contemporary","Hip Hop","Musical Theatre","Acro","Irish","Ballroom","Lyrical"]);
  const [sizes, setSizes] = useState(["Age 2-3","Age 3-4","Age 4-5","Age 5-6","Age 6-7","Age 7-8","Age 8-9","Age 9-10","Age 10-11","Age 11-12","Teen XS","Teen S","Teen M","Teen L","Adult XS","Adult S","Adult M","Adult L","Adult XL"]);
  const [conditions, setConditions] = useState(["New with tags","Excellent","Good","Well loved"]);
  const [userSchools, setUserSchools] = useState([]);
  const [allUserSchools, setAllUserSchools] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [commissionPct, setCommissionPct] = useState(1.5);
  const [view, setView] = useState("browse");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [boardSchoolId, setBoardSchoolId] = useState("general");
  const [comments, setComments] = useState([]);
  const [commentCounts, setCommentCounts] = useState({});
  const [boardPosts, setBoardPosts] = useState([]);
  const [boardReplies, setBoardReplies] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [commentReplyText, setCommentReplyText] = useState("");
  const [newPost, setNewPost] = useState({ title:"", message:"" });
  const [replyText, setReplyText] = useState({});
  const [expandedPost, setExpandedPost] = useState(null);
  const [editForm, setEditForm] = useState({ title:"", style:"", size:"", itemType:"", condition:"", price:"", description:"", image:null, images:[] });
  const [editError, setEditError] = useState("");
  const [adminTab, setAdminTab] = useState("overview");
  const [newDropdownItem, setNewDropdownItem] = useState({ danceStyle:"", size:"", condition:"" });
  const [eventForm, setEventForm] = useState({ title:"", event_date:"", description:"", school_id:"" });
  const [editingEvent, setEditingEvent] = useState(null);
  const [, setTick] = useState(0);
  const [modal, setModal] = useState(null);
  const [selectedListing, setSelectedListing] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [authTab, setAuthTab] = useState("login");
  const [success, setSuccess] = useState("");
  const [filters, setFilters] = useState({ search:"", style:"", size:"", condition:"", maxPrice:"", school:"" });
  const [showSold, setShowSold] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [authForm, setAuthForm] = useState({ name:"", email:"", password:"", schoolCode:"" });
  const [authError, setAuthError] = useState("");
  const [createForm, setCreateForm] = useState({ title:"", style:"", size:"", itemType:"", condition:"", price:"", description:"", image:null, images:[], schoolId:"" });
  const [createError, setCreateError] = useState("");
  const [editingAd, setEditingAd] = useState(null);
  const [adForm, setAdForm] = useState({ title:"", tagline:"", url:"", slot:"sidebar-top", scope:"global", school_id:null, active:true, image:null, sort_order:0 });
  const [newSchoolForm, setNewSchoolForm] = useState({ name:"", code:"", color:"#c9a96e" });
  const [editingSchoolColor, setEditingSchoolColor] = useState(null);
  const [addSchoolCode, setAddSchoolCode] = useState("");
  const [addSchoolError, setAddSchoolError] = useState("");
  const [accountForm, setAccountForm] = useState({ email:"", password:"", confirmPassword:"", displayName:"", paypalEmail:"" });
  const [accountMsg, setAccountMsg] = useState("");
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);
  const [copiedLink, setCopiedLink] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmDeleteSchool, setConfirmDeleteSchool] = useState(null);
  const [addUserSchoolId, setAddUserSchoolId] = useState("");
  const [moveUserSchool, setMoveUserSchool] = useState({ fromId:"", toId:"" });
  const [darkMode, setDarkMode] = useState(true);
  const [wantedPosts, setWantedPosts] = useState([]);
  const [wantedForm, setWantedForm] = useState({ title:"", style:"", size:"", description:"", images:[] });
  const [wantedSchoolId, setWantedSchoolId] = useState("general");
  const [editingWanted, setEditingWanted] = useState(null);
  const [editingBoardPost, setEditingBoardPost] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showFairyPanel, setShowFairyPanel] = useState(false);
  const [fairyTab, setFairyTab] = useState("chat");
  const [fairyName, setFairyName] = useState("Bella");
  const [fairyMessages, setFairyMessages] = useState([]);
  const [fairyChatInput, setFairyChatInput] = useState("");
  const [fairySearching, setFairySearching] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get("join");
    if (joinCode) { setAuthForm(f => ({ ...f, schoolCode: joinCode.toUpperCase() })); setAuthTab("register"); setModal("auth"); }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) { setIsAdmin(session.user.email === ADMIN_EMAIL); loadUserSchools(session.user.email); }
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) { setIsAdmin(session.user.email === ADMIN_EMAIL); loadUserSchools(session.user.email); }
      else { setUserSchools([]); setIsAdmin(false); }
    });
    loadListings(); loadAds(); loadSchools(); loadCommission(); loadEvents(); loadDropdowns(); loadBoardPosts(); loadBoardReplies(); loadCommentCounts(); loadWantedPosts(); loadFairyName();
    const ticker = setInterval(() => setTick(t => t + 1), 1000);
    return () => { subscription.unsubscribe(); clearInterval(ticker); };
  }, []);

  useEffect(() => { if (isAdmin) { loadAllUserSchools(); loadAllUsers(); } }, [isAdmin]);
  useEffect(() => {
    if (!user) { setNotifications([]); return; }
    const loadNotifications = async () => {
      const { data } = await supabase.from("notifications").select("*").eq("user_email", user.email).order("created_at", { ascending: false }).limit(60);
      if (data) {
        const clearedAt = localStorage.getItem(`notif_cleared_${user.email}`);
        const clearedIds = JSON.parse(localStorage.getItem(`notif_cleared_ids_${user.email}`) || "[]");
        setNotifications(data.filter(n => {
          if (clearedIds.includes(n.id)) return false;
          if (clearedAt && new Date(n.created_at) <= new Date(clearedAt)) return false;
          return true;
        }));
      }
    };
    loadNotifications();
    const channel = supabase.channel("user-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_email=eq.${user.email}` },
        payload => setNotifications(n => [payload.new, ...n]))
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user]);
  useEffect(() => {
    if (userSchools.length > 0) {
      setBoardSchoolId(s => s === "general" ? userSchools[0].school_id : s);
      setWantedSchoolId(s => s === "general" ? userSchools[0].school_id : s);
    }
  }, [userSchools]);

  const loadListings = async () => { const { data } = await supabase.from("listings").select("*").order("created_at",{ascending:false}); if (data) setListings(data); };
  const loadAds = async () => { const { data } = await supabase.from("ads").select("*").order("sort_order").order("created_at",{ascending:false}); if (data) setAds(data); };
  const loadSchools = async () => { const { data } = await supabase.from("schools").select("*").order("name"); if (data) setSchools(data); };
  const loadComments = async (listingId) => { const { data } = await supabase.from("listing_comments").select("*").eq("listing_id", listingId).order("created_at"); if (data) setComments(data); };
  const loadCommentCounts = async () => {
    const { data } = await supabase.from("listing_comments").select("listing_id").is("parent_id", null);
    if (data) {
      const counts = {};
      data.forEach(c => { counts[c.listing_id] = (counts[c.listing_id] || 0) + 1; });
      setCommentCounts(counts);
    }
  };
  const loadBoardPosts = async () => { const { data } = await supabase.from("board_posts").select("*").order("created_at",{ascending:false}); if (data) setBoardPosts(data); };
  const loadBoardReplies = async () => { const { data } = await supabase.from("board_replies").select("*").order("created_at"); if (data) setBoardReplies(data); };
  const loadWantedPosts = async () => { const { data } = await supabase.from("wanted_posts").select("*").order("created_at",{ascending:false}); if (data) setWantedPosts(data); };
  const loadCommission = async () => { const { data } = await supabase.from("settings").select("value").eq("key","commission_pct").single(); if (data) setCommissionPct(parseFloat(data.value)); };
  const loadFairyName = async () => { const { data } = await supabase.from("settings").select("value").eq("key","fairy_name").single(); if (data) setFairyName(data.value); };
  const loadEvents = async () => { const { data } = await supabase.from("events").select("*").order("event_date"); if (data) setEvents(data); };

  const addDropdownItem = async (table, name, setter) => {
    if (!name.trim()) return;
    const { data: existing } = await supabase.from(table).select("sort_order").order("sort_order", { ascending: false }).limit(1);
    const nextOrder = existing?.length ? (existing[0].sort_order || 0) + 1 : 1;
    await supabase.from(table).insert([{ name: name.trim(), sort_order: nextOrder }]);
    await loadDropdowns();
  };

  const removeDropdownItem = async (table, name) => {
    await supabase.from(table).delete().eq("name", name);
    await loadDropdowns();
  };
  const loadDropdowns = async () => {
    const [ds, sz, cn] = await Promise.all([
      supabase.from("dance_styles").select("*").order("sort_order"),
      supabase.from("sizes").select("*").order("sort_order"),
      supabase.from("conditions").select("*").order("sort_order"),
    ]);
    if (ds.data?.length) setDanceStyles(ds.data.map(d => d.name).sort((a,b) => a.localeCompare(b)));
    if (sz.data?.length) setSizes(sz.data.map(s => s.name));
    if (cn.data?.length) setConditions(cn.data.map(c => c.name));
  };

  const handleSaveEvent = async () => {
    if (!eventForm.title || !eventForm.event_date || !eventForm.school_id) return;
    if (editingEvent) {
      await supabase.from("events").update({ title:eventForm.title, event_date:eventForm.event_date, description:eventForm.description }).eq("id", editingEvent);
    } else {
      await supabase.from("events").insert([{ title:eventForm.title, event_date:eventForm.event_date, description:eventForm.description, school_id:eventForm.school_id }]);
    }
    await loadEvents(); setEventForm({ title:"", event_date:"", description:"", school_id:"" }); setEditingEvent(null); setSuccess("Event saved!");
  };

  const handleDeleteEvent = async (id) => { await supabase.from("events").delete().eq("id", id); await loadEvents(); };

  const getCountdown = (dateStr) => {
    const diff = new Date(dateStr) - new Date();
    if (diff <= 0) return null;
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { d, h, m, s };
  };
  const loadUserSchools = async (email) => {
    const { data } = await supabase.from("user_schools").select("*").eq("user_email", email);
    if (data) {
      setUserSchools(data);
      // Auto-filter to their school if they only belong to one
      if (data.length === 1) {
        setFilters(f => ({ ...f, school: data[0].school_id }));
      }
    }
  };
  const loadAllUserSchools = async () => { const { data } = await supabase.from("user_schools").select("*"); if (data) setAllUserSchools(data); };
  const loadAllUsers = async () => { const { data } = await supabase.from("user_profiles").select("*"); if (data) setAllUsers(data); };

  const closeModal = () => { setModal(null); setAuthError(""); setCreateError(""); setAddSchoolError(""); setEditingAd(null); setSelectedUser(null); setConfirmDelete(null); setConfirmDeleteSchool(null); setAddUserSchoolId(""); setMoveUserSchool({fromId:"",toId:""}); };
  const getSchoolColor = (schoolId) => schools.find(s => s.id === schoolId)?.color || P.accent;
  const getSchool = (schoolId) => schools.find(s => s.id === schoolId);

  const handleClickSchoolBadge = (schoolId) => {
    setFilters(f => ({ ...f, school: f.school === schoolId ? "" : schoolId }));
    // Scroll to listings
    setTimeout(() => document.querySelector(".filters")?.scrollIntoView({ behavior:"smooth", block:"start" }), 100);
  };

  const handleRegister = async () => {
    setAuthError("");
    const { name, email, password, schoolCode } = authForm;
    if (!name || !email || !password || !schoolCode) return setAuthError("Please fill in all fields.");
    const school = schools.find(s => s.code === schoolCode.toUpperCase());
    if (!school) return setAuthError("Invalid school code. Please check with your dance school.");
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
    if (error) return setAuthError(error.message);
    if (data.user) {
      await supabase.from("user_schools").insert([{ user_email: email, school_id: school.id, school_name: school.name, school_code: school.code }]);
      await loadUserSchools(email);
    }
    closeModal(); setSuccess(`Welcome, ${name}! You've joined ${school.name}.`);
    window.history.replaceState({}, '', window.location.pathname);
  };

  const handleLogin = async () => {
    setAuthError("");
    const { email, password } = authForm;
    if (!email || !password) return setAuthError("Please enter your email and password.");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setAuthError("Incorrect email or password.");
    closeModal();
  };

  const handleLogout = async () => { await supabase.auth.signOut(); setUser(null); setUserSchools([]); setIsAdmin(false); setView("browse"); };

  const handleAddSchool = async () => {
    setAddSchoolError("");
    const school = schools.find(s => s.code === addSchoolCode.toUpperCase());
    if (!school) return setAddSchoolError("Invalid school code.");
    if (userSchools.find(us => us.school_id === school.id)) return setAddSchoolError("You're already a member of this school.");
    await supabase.from("user_schools").insert([{ user_email: user.email, school_id: school.id, school_name: school.name, school_code: school.code }]);
    await loadUserSchools(user.email); setAddSchoolCode(""); setSuccess(`Added to ${school.name}!`);
  };

  const handleLeaveSchool = async (schoolId) => { await supabase.from("user_schools").delete().eq("user_email", user.email).eq("school_id", schoolId); await loadUserSchools(user.email); };

  const handleUpdateEmail = async () => {
    setAccountMsg("");
    if (!accountForm.email) return setAccountMsg("Please enter a new email address.");
    const { error } = await supabase.auth.updateUser({ email: accountForm.email });
    if (error) return setAccountMsg(`Error: ${error.message}`);
    setAccountMsg("✓ Confirmation sent to your new email address. Click the link to confirm the change.");
    setAccountForm(f => ({ ...f, email: "" }));
  };

  const handleUpdateDisplayName = async () => {
    setAccountMsg("");
    if (!accountForm.displayName.trim()) return setAccountMsg("Please enter a display name.");
    const { error } = await supabase.auth.updateUser({ data: { full_name: accountForm.displayName.trim() } });
    if (error) return setAccountMsg(`Error: ${error.message}`);
    // Update name on all their listings too
    await supabase.from("listings").update({ seller_name: accountForm.displayName.trim() }).eq("seller_email", user.email);
    await supabase.from("listing_comments").update({ user_name: accountForm.displayName.trim() }).eq("user_email", user.email);
    await supabase.from("board_posts").update({ user_name: accountForm.displayName.trim() }).eq("user_email", user.email);
    await supabase.from("board_replies").update({ user_name: accountForm.displayName.trim() }).eq("user_email", user.email);
    setAccountMsg("✓ Display name updated across all your listings and posts.");
    setAccountForm(f => ({ ...f, displayName: "" }));
    // Refresh user
    const { data } = await supabase.auth.getUser();
    if (data?.user) setUser(data.user);
  };

  const handleSavePaypalEmail = async () => {
    setAccountMsg("");
    if (!accountForm.paypalEmail.trim()) return setAccountMsg("Please enter your PayPal email.");
    if (!accountForm.paypalEmail.includes("@")) return setAccountMsg("Please enter a valid email address.");
    const { error } = await supabase.auth.updateUser({ data: { paypal_email: accountForm.paypalEmail.trim() } });
    if (error) return setAccountMsg(`Error: ${error.message}`);
    setAccountMsg("✓ PayPal email saved. It will be used for all future payouts.");
    setAccountForm(f => ({ ...f, paypalEmail: "" }));
    const { data } = await supabase.auth.getUser();
    if (data?.user) setUser(data.user);
  };

  const handleUpdatePassword = async () => {
    setAccountMsg("");
    if (!accountForm.password) return setAccountMsg("Please enter a new password.");
    if (accountForm.password !== accountForm.confirmPassword) return setAccountMsg("Passwords don't match.");
    if (accountForm.password.length < 6) return setAccountMsg("Password must be at least 6 characters.");
    const { error } = await supabase.auth.updateUser({ password: accountForm.password });
    if (error) return setAccountMsg(`Error: ${error.message}`);
    setAccountMsg("✓ Password updated successfully.");
    setAccountForm(f => ({ ...f, password: "", confirmPassword: "" }));
  };

  const handleDeleteAccount = async () => {
    await supabase.from("user_schools").delete().eq("user_email", user.email);
    await supabase.from("listings").delete().eq("seller_email", user.email);
    await supabase.auth.signOut();
    setUser(null); setUserSchools([]); setIsAdmin(false); setView("browse");
    setSuccess("Your account has been deleted.");
  };

  const handleImageUpload = (e, setter) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setter(f => ({ ...f, image: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const handleMultiImageUpload = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setCreateForm(f => ({
        ...f,
        images: [...(f.images || []).slice(0, 4), ev.target.result],
        image: f.image || ev.target.result, // first image is also the main image
      }));
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setCreateForm(f => {
      const newImages = f.images.filter((_, i) => i !== index);
      return { ...f, images: newImages, image: newImages[0] || null };
    });
  };

  const handleWantedImageUpload = (e, setter) => {
    const files = Array.from(e.target.files).slice(0, 3);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setter(f => ({ ...f, images: [...(f.images || []).slice(0, 2), ev.target.result] }));
      reader.readAsDataURL(file);
    });
  };

  const removeWantedImage = (index, setter) => {
    setter(f => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  };

  const handleCreate = async () => {
    setCreateError("");
    const { title, style, size, condition, price, schoolId } = createForm;
    if (!title || !style || !size || !condition || !price) return setCreateError("Please fill in all required fields.");
    if (isNaN(price) || Number(price) <= 0) return setCreateError("Please enter a valid price.");
    const isGeneral = schoolId === "general";
    const school = isGeneral ? null : userSchools.find(s => s.school_id === schoolId);
    const { error } = await supabase.from("listings").insert([{
      title, style, size, condition, price: Number(price),
      description: createForm.description,
      image: createForm.image,
      images: createForm.images || [],
      seller_name: user.user_metadata?.full_name || user.email,
      seller_email: user.email,
      seller_paypal: user.user_metadata?.paypal_email || null,
      school_name: isGeneral ? "General" : (school?.school_name || ""),
      school_id: isGeneral ? null : (schoolId || null),
    }]);
    if (error) return setCreateError("Failed to create listing. Please try again.");
    await loadListings();
    const { data: newListings } = await supabase.from("listings").select("*").eq("seller_email", user.email).order("created_at", { ascending: false }).limit(1);
    if (newListings?.[0]) await checkWishlistMatches(newListings[0]);
    setCreateForm({ title:"", style:"", size:"", itemType:"", condition:"", price:"", description:"", image:null, images:[], schoolId:"" });
    closeModal(); setSuccess("Your listing is now live!");
  };

  const handleDelete = async (id) => { await supabase.from("listings").delete().eq("id", id); await loadListings(); closeModal(); };
  const handleMarkSold = async (id) => {
    await supabase.from("listings").update({ sold: true, sold_at: new Date().toISOString() }).eq("id", id);
    const listing = listings.find(l => l.id === id);
    const effectivePct = getCommission(listing?.school_id);
    if (listing) {
      await sendSoldEmail({ listing, commissionPct: effectivePct });
      await pushNotification(listing.seller_email, "item_sold", "🎉 Your item sold!", `"${listing.title}" has been marked as sold for £${listing.price}`, listing.id);
    }
    await loadListings(); closeModal(); setSuccess("Item marked as sold! Payout email sent to your inbox.");
  };
  const handleMarkUnsold = async (id) => {
    await supabase.from("listings").update({ sold: false, sold_at: null }).eq("id", id);
    await loadListings(); setSuccess("Item relisted!");
  };
  const handleSaveCommission = async (val) => {
    setCommissionPct(val);
    await supabase.from("settings").upsert({ key:"commission_pct", value:String(val) }, { onConflict:"key" });
  };

  const handleSaveSchoolCommission = async (schoolId, val) => {
    const value = val === "" ? null : parseFloat(val);
    await supabase.from("schools").update({ commission_pct: value }).eq("id", schoolId);
    await loadSchools();
  };

  // Get effective commission for a listing (school rate overrides global)
  const getCommission = (schoolId) => {
    const school = schools.find(s => s.id === schoolId);
    return school?.commission_pct != null ? school.commission_pct : commissionPct;
  };

  const handleAddSchoolAdmin = async () => {
    if (!newSchoolForm.name || !newSchoolForm.code) return;
    const { error } = await supabase.from("schools").insert([{ name: newSchoolForm.name, code: newSchoolForm.code.toUpperCase(), color: newSchoolForm.color }]);
    if (error) return setSuccess("Error: that code may already exist.");
    await loadSchools(); setNewSchoolForm({ name:"", code:"", color:"#c9a96e" }); setSuccess("School added!");
  };

  const handleUpdateSchoolColor = async (schoolId, color) => {
    await supabase.from("schools").update({ color }).eq("id", schoolId);
    await loadSchools();
  };

  const handleDeleteSchool = async (school) => {
    await supabase.from("schools").delete().eq("id", school.id);
    await loadSchools(); await loadAllUserSchools(); await loadListings();
    setConfirmDeleteSchool(null); setSuccess(`${school.name} removed.`);
  };

  const handleAdminAddUserToSchool = async () => {
    if (!selectedUser || !addUserSchoolId) return;
    const school = schools.find(s => s.id === addUserSchoolId);
    if (!school) return;
    if (allUserSchools.find(us => us.user_email === selectedUser.email && us.school_id === school.id)) { setSuccess("User is already in that school."); return; }
    await supabase.from("user_schools").insert([{ user_email: selectedUser.email, school_id: school.id, school_name: school.name, school_code: school.code }]);
    await loadAllUserSchools(); setAddUserSchoolId(""); setSuccess(`Added to ${school.name}`);
  };

  const handleAdminRemoveUserFromSchool = async (userEmail, schoolId) => {
    await supabase.from("user_schools").delete().eq("user_email", userEmail).eq("school_id", schoolId);
    await loadAllUserSchools(); setSuccess("Removed from school.");
  };

  const handleAdminMoveUserSchool = async () => {
    if (!selectedUser || !moveUserSchool.fromId || !moveUserSchool.toId) return;
    const toSchool = schools.find(s => s.id === moveUserSchool.toId);
    if (!toSchool) return;
    await supabase.from("user_schools").delete().eq("user_email", selectedUser.email).eq("school_id", moveUserSchool.fromId);
    await supabase.from("user_schools").insert([{ user_email: selectedUser.email, school_id: toSchool.id, school_name: toSchool.name, school_code: toSchool.code }]);
    await loadAllUserSchools(); setMoveUserSchool({fromId:"",toId:""}); setSuccess(`Moved to ${toSchool.name}`);
  };

  const handleAdminDeleteUser = async () => {
    if (!confirmDelete) return;
    await supabase.from("user_schools").delete().eq("user_email", confirmDelete.email);
    await supabase.from("listings").delete().eq("seller_email", confirmDelete.email);
    await supabase.from("listing_comments").delete().eq("user_email", confirmDelete.email);
    await supabase.from("board_posts").delete().eq("user_email", confirmDelete.email);
    await supabase.from("board_replies").delete().eq("user_email", confirmDelete.email);
    // Delete the auth user via RPC function
    await supabase.rpc("delete_user_by_email", { user_email: confirmDelete.email });
    setSuccess(`${confirmDelete.full_name || confirmDelete.email} has been deleted.`);
    await loadAllUsers(); await loadAllUserSchools(); await loadListings();
    setConfirmDelete(null); setSelectedUser(null); setModal(null);
  };

  // ── EDIT LISTING ──
  const openEditListing = (listing) => {
    setEditForm({
      title: listing.title, style: listing.style, size: listing.size,
      itemType: listing.item_type || "Clothing",
      condition: listing.condition, price: listing.price,
      description: listing.description || "",
      image: listing.image || null,
      images: listing.images || [],
    });
    setEditError("");
    setModal("editListing");
  };

  const handleUpdateListing = async () => {
    setEditError("");
    const { title, style, size, condition, price } = editForm;
    if (!title || !style || !condition || !price) return setEditError("Please fill in all required fields.");
    if (isNaN(price) || Number(price) <= 0) return setEditError("Please enter a valid price.");
    const updates = {
      title, style, size, condition,
      price: Number(price),
      description: editForm.description,
      image: editForm.images?.[0] || editForm.image || null,
      images: editForm.images || [],
    };
    // Build query — admin can update any listing, owner can update their own
    let query = supabase.from("listings").update(updates).eq("id", selectedListing.id);
    const { error } = await query;
    if (error) {
      console.error("Update error:", error);
      return setEditError(`Failed to update: ${error.message}`);
    }
    await loadListings(); closeModal(); setSuccess("Listing updated!");
  };

  const handleEditMultiImageUpload = (e) => {
    const files = Array.from(e.target.files).slice(0, 5 - (editForm.images?.length || 0));
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setEditForm(f => ({ ...f, images: [...(f.images||[]), ev.target.result].slice(0,5) }));
      reader.readAsDataURL(file);
    });
  };

  const removeEditImage = (index) => {
    setEditForm(f => ({ ...f, images: f.images.filter((_,i) => i !== index) }));
  };

  // ── COMMENTS ──
  const handlePostComment = async () => {
    if (!commentText.trim() || !selectedListing) return;
    const userName = user.user_metadata?.full_name || user.email;
    await supabase.from("listing_comments").insert([{
      listing_id: selectedListing.id,
      user_email: user.email,
      user_name: userName,
      message: commentText.trim(),
    }]);
    await loadComments(selectedListing.id);
    setCommentText("");
    await loadCommentCounts();
    if (selectedListing.seller_email !== user.email) {
      await pushNotification(selectedListing.seller_email, "new_comment", "💬 New question on your listing", `${userName}: "${commentText.trim()}"`, selectedListing.id);
      await sendResendEmail({
        to: selectedListing.seller_email,
        subject: `💬 New question on your listing — ${selectedListing.title}`,
        html: emailTemplate("Someone asked a question!", `
          <p style="color:#a892c4;margin-bottom:1rem"><strong style="color:#f0eaf8">${userName}</strong> asked a question on your listing <strong style="color:#e8d5aa">${selectedListing.title}</strong>:</p>
          <div style="padding:1rem;background:#2d2142;border-left:3px solid #c9a96e;border-radius:6px;color:#f0eaf8;margin-bottom:1.25rem">${commentText.trim()}</div>
          <p style="color:#a892c4">Log in to TutuTrade to reply — your response will be visible to all buyers.</p>
        `),
      });
    }
  };

  const handleDeleteComment = async (id) => {
    await supabase.from("listing_comments").delete().eq("id", id);
    if (selectedListing) await loadComments(selectedListing.id);
  };

  const handlePostCommentReply = async (parentId) => {
    if (!commentReplyText.trim() || !selectedListing) return;
    const userName = user.user_metadata?.full_name || user.email;
    // Find the original commenter to notify
    const originalComment = comments.find(c => c.id === parentId);
    await supabase.from("listing_comments").insert([{
      listing_id: selectedListing.id,
      user_email: user.email,
      user_name: userName,
      message: commentReplyText.trim(),
      parent_id: parentId,
    }]);
    await loadComments(selectedListing.id);
    setCommentReplyText("");
    setReplyingTo(null);
    if (originalComment && originalComment.user_email !== user.email) {
      await pushNotification(originalComment.user_email, "comment_reply", "↩ Reply to your question", `${userName}: "${commentReplyText.trim()}"`, selectedListing.id);
    }
    if (originalComment && originalComment.user_email !== user.email) {
      await sendResendEmail({
        to: originalComment.user_email,
        subject: `↩ Someone replied to your question on TutuTrade`,
        html: emailTemplate("Your question got a reply!", `
          <p style="color:#a892c4;margin-bottom:.5rem">Your question on <strong style="color:#e8d5aa">${selectedListing.title}</strong>:</p>
          <div style="padding:.75rem 1rem;background:#2d2142;border-radius:6px;color:#8a7a9e;margin-bottom:1rem;font-style:italic">${originalComment.message}</div>
          <p style="color:#a892c4;margin-bottom:.5rem"><strong style="color:#f0eaf8">${userName}</strong> replied:</p>
          <div style="padding:1rem;background:#2d2142;border-left:3px solid #c9a96e;border-radius:6px;color:#f0eaf8;margin-bottom:1.25rem">${commentReplyText.trim()}</div>
          <p style="color:#a892c4">Visit TutuTrade to continue the conversation.</p>
        `),
      });
    }
  };

  // ── BOARD ──
  const handlePostBoard = async () => {
    if (!newPost.title.trim() || !newPost.message.trim()) return;
    const schoolId = boardSchoolId === "general" ? null : boardSchoolId;
    await supabase.from("board_posts").insert([{
      school_id: schoolId,
      user_email: user.email,
      user_name: user.user_metadata?.full_name || user.email,
      title: newPost.title.trim(),
      message: newPost.message.trim(),
    }]);
    await loadBoardPosts();
    setNewPost({ title:"", message:"" });
  };

  const handlePostReply = async (postId) => {
    const text = replyText[postId];
    if (!text?.trim()) return;
    const userName = user.user_metadata?.full_name || user.email;
    const post = boardPosts.find(p => p.id === postId);
    await supabase.from("board_replies").insert([{
      post_id: postId,
      user_email: user.email,
      user_name: userName,
      message: text.trim(),
    }]);
    await loadBoardReplies();
    setReplyText(t => ({ ...t, [postId]:"" }));
    // Email the post author if someone else replied
    if (post && post.user_email !== user.email) {
      await sendResendEmail({
        to: post.user_email,
        subject: `↩ Someone replied to your board post — ${post.title}`,
        html: emailTemplate("Your post got a reply!", `
          <p style="color:#a892c4;margin-bottom:.5rem">Your post: <strong style="color:#e8d5aa">${post.title}</strong></p>
          <p style="color:#a892c4;margin-bottom:.5rem"><strong style="color:#f0eaf8">${userName}</strong> replied:</p>
          <div style="padding:1rem;background:#2d2142;border-left:3px solid #c9a96e;border-radius:6px;color:#f0eaf8;margin-bottom:1.25rem">${text.trim()}</div>
          <p style="color:#a892c4">Visit the TutuTrade community board to continue the conversation.</p>
        `),
      });
    }
    setReplyText(t => ({ ...t, [postId]:"" }));
  };

  const handleDeletePost = async (id) => {
    await supabase.from("board_posts").delete().eq("id", id);
    await loadBoardPosts();
  };

  const handleDeleteReply = async (id) => {
    await supabase.from("board_replies").delete().eq("id", id);
    await loadBoardReplies();
  };

  // ── WANTED ──
  const handlePostWanted = async () => {
    if (!wantedForm.title.trim()) return;
    const schoolId = wantedSchoolId === "general" ? null : wantedSchoolId;
    const base = {
      school_id: schoolId, user_email: user.email,
      user_name: user.user_metadata?.full_name || user.email,
      title: wantedForm.title.trim(), dance_style: wantedForm.style || null,
      size: wantedForm.size || null, description: wantedForm.description.trim() || null,
      fulfilled: false,
    };
    let { error } = await supabase.from("wanted_posts").insert([{ ...base, images: wantedForm.images || [] }]);
    if (error) ({ error } = await supabase.from("wanted_posts").insert([base])); // retry without images if column missing
    if (!error) { await loadWantedPosts(); setWantedForm({ title:"", style:"", size:"", description:"", images:[] }); }
  };

  const handleDeleteWanted = async (id) => {
    await supabase.from("wanted_posts").delete().eq("id", id);
    await loadWantedPosts();
  };

  const handleFulfillWanted = async (id, current) => {
    await supabase.from("wanted_posts").update({ fulfilled: !current }).eq("id", id);
    await loadWantedPosts();
  };

  const handleUpdateWanted = async (id) => {
    if (!editingWanted?.title?.trim()) return;
    const base = {
      title: editingWanted.title.trim(),
      dance_style: editingWanted.style || null,
      size: editingWanted.size || null,
      description: editingWanted.description?.trim() || null,
    };
    let { error } = await supabase.from("wanted_posts").update({ ...base, images: editingWanted.images || [] }).eq("id", id);
    if (error) ({ error } = await supabase.from("wanted_posts").update(base).eq("id", id));
    await loadWantedPosts();
    setEditingWanted(null);
  };

  const handleUpdateBoardPost = async (id) => {
    if (!editingBoardPost?.title?.trim()) return;
    await supabase.from("board_posts").update({
      title: editingBoardPost.title.trim(),
      message: editingBoardPost.message.trim(),
    }).eq("id", id);
    await loadBoardPosts();
    setEditingBoardPost(null);
  };

  // ── NOTIFICATIONS ──
  const pushNotification = async (userEmail, type, title, body, listingId = null) => {
    if (!userEmail || userEmail === user?.email) return;
    await supabase.from("notifications").insert([{ user_email: userEmail, type, title, body, listing_id: listingId }]);
  };

  const checkWishlistMatches = async (listing) => {
    const { data: wanted } = await supabase.from("wanted_posts").select("*").eq("fulfilled", false);
    if (!wanted) return;
    for (const w of wanted) {
      if (w.user_email === listing.seller_email) continue;
      const schoolOk = !w.school_id || !listing.school_id || w.school_id === listing.school_id;
      const styleOk = !w.dance_style || w.dance_style === listing.style;
      const sizeOk = !w.size || w.size === listing.size;
      if (schoolOk && styleOk && sizeOk) {
        await pushNotification(w.user_email, "wishlist_match", "🔍 Wishlist match!", `"${listing.title}" — ${[listing.style, listing.size].filter(Boolean).join(", ")} — £${listing.price}`, listing.id);
      }
    }
  };

  const markNotificationRead = async (id) => {
    setNotifications(n => n.map(x => x.id === id ? { ...x, read: true } : x));
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  };

  const markAllNotificationsRead = async () => {
    const ids = notifications.filter(n => !n.read).map(n => n.id);
    if (!ids.length) return;
    setNotifications(n => n.map(x => ({ ...x, read: true })));
    await supabase.from("notifications").update({ read: true }).in("id", ids);
  };

  const deleteNotification = async (e, id) => {
    e.stopPropagation();
    setNotifications(n => n.filter(x => x.id !== id));
    const key = `notif_cleared_ids_${user.email}`;
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    localStorage.setItem(key, JSON.stringify([...existing, id]));
    await supabase.from("notifications").delete().eq("id", id).eq("user_email", user.email);
  };

  const clearAllNotifications = async () => {
    if (!notifications.length) return;
    localStorage.setItem(`notif_cleared_${user.email}`, new Date().toISOString());
    localStorage.removeItem(`notif_cleared_ids_${user.email}`);
    setNotifications([]);
    await supabase.from("notifications").delete().eq("user_email", user.email);
  };

  const clearFairyHistory = async () => {
    setFairyMessages([]);
    if (user) {
      await supabase.from("wanted_posts").delete().eq("user_email", user.email).ilike("description", "🧚 Fairy search:%");
    }
  };

  const fairySearch = async () => {
    if (!fairyChatInput.trim() || fairySearching) return;
    const query = fairyChatInput.trim();
    setFairyChatInput("");
    setFairyMessages(m => [...m, { role: "user", text: query }]);
    setFairySearching(true);
    let style = null, size = null, keywords = [], maxPrice = null, reply = null;
    try {
      const resp = await fetch("/.netlify/functions/fairy-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, styles: danceStyles, sizes }),
      });
      if (resp.ok) {
        const result = await resp.json();
        style = result.style || null;
        size = result.size || null;
        keywords = result.keywords || [];
        maxPrice = result.maxPrice || null;
        reply = result.reply || null;
      }
    } catch {}
    if (!keywords.length && !style && !size) {
      keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    }
    reply = reply || `Let me have a look around for you! ✨`;
    const matches = listings.filter(l => {
      if (l.sold) return false;
      if (style && l.style !== style) return false;
      if (size && l.size !== size) return false;
      if (maxPrice && parseFloat(l.price) > maxPrice) return false;
      if (keywords.length) {
        const txt = `${l.title} ${l.description || ""} ${l.style || ""} ${l.size || ""}`.toLowerCase();
        if (!keywords.some(k => txt.includes(k.toLowerCase()))) return false;
      }
      return true;
    });
    setFairyMessages(m => [...m, { role: "fairy", text: reply, matches }]);
    if (user) {
      if (matches.length > 0) {
        await pushNotification(user.email, "fairy_found", `✨ ${fairyName} found ${matches.length} match${matches.length > 1 ? "es" : ""}!`, matches.slice(0, 3).map(l => l.title).join(", "));
        await sendResendEmail({
          to: user.email,
          subject: `✨ ${fairyName} found something for you on TutuTrade!`,
          html: emailTemplate(`✨ ${fairyName} found ${matches.length} match${matches.length > 1 ? "es" : ""}!`,
            `<p style="color:#a892c4;margin-bottom:1rem">You searched for: <em style="color:#f0eaf8">"${query}"</em></p>
            ${matches.slice(0, 5).map(l => `<div style="padding:.75rem 1rem;background:#1e1729;border-radius:8px;margin-bottom:.75rem;border-left:3px solid #c9a96e">
              <strong style="color:#e8d5aa">${l.title}</strong><span style="color:#a892c4;margin-left:.6rem">£${l.price}</span>
              ${l.style ? `<span style="color:#8a7a9e;font-size:.85em"> • ${l.style}</span>` : ""}${l.size ? `<span style="color:#8a7a9e;font-size:.85em"> • ${l.size}</span>` : ""}
            </div>`).join("")}
            <p style="color:#8a7a9e;font-size:.85em;margin-top:1rem">Visit TutuTrade to view the full listings!</p>`
          ),
        });
      } else {
        await supabase.from("wanted_posts").insert([{
          user_email: user.email, user_name: userName,
          title: query, dance_style: style || null, size: size || null,
          description: `🧚 Fairy search: "${query}"`, school_id: null, fulfilled: false, images: [],
        }]);
        setFairyMessages(m => [...m.slice(0, -1), { ...m[m.length - 1], watchSaved: true }]);
      }
    }
    setFairySearching(false);
  };

  const handleNotificationClick = async (notif) => {
    await markNotificationRead(notif.id);
    setShowFairyPanel(false);
    if (notif.listing_id) {
      const listing = listings.find(l => l.id === notif.listing_id);
      if (listing) { setSelectedListing(listing); setModal("detail"); loadComments(listing.id); setCommentText(""); setView("browse"); }
    }
  };

  const handleAdminResetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${SITE_URL}/reset` });
    if (error) setSuccess(`Error: ${error.message}`);
    else setSuccess(`Password reset email sent to ${email}`);
  };

  const handleSaveAd = async () => {
    if (!adForm.title || !adForm.url) return;
    const payload = {
      title: adForm.title, tagline: adForm.tagline, url: adForm.url,
      slot: adForm.slot, active: adForm.active, image: adForm.image,
      scope: adForm.scope || "global",
      school_id: adForm.scope === "school" || adForm.scope === "both" ? adForm.school_id : null,
      sort_order: Number(adForm.sort_order) || 0,
    };
    if (editingAd === "new") await supabase.from("ads").insert([payload]);
    else await supabase.from("ads").update(payload).eq("id", editingAd);
    await loadAds(); closeModal();
  };

  const toggleAd = async (id, current) => { await supabase.from("ads").update({ active: !current }).eq("id", id); await loadAds(); };
  const deleteAd = async (id) => { await supabase.from("ads").delete().eq("id", id); await loadAds(); };

  const copyShareLink = (code) => {
    navigator.clipboard.writeText(`${SITE_URL}?join=${code}`);
    setCopiedLink(code); setTimeout(() => setCopiedLink(null), 2000);
  };

  const userSchoolIds = userSchools.map(us => us.school_id);

  const filtered = listings.filter(l => {
    if (view === "mylistings") return l.seller_email === user?.email;
    if (!user) return false;
    // Show general listings (no school) + listings from user's schools
    if (l.school_id && !userSchoolIds.includes(l.school_id)) return false;
    if (!showSold && l.sold) return false;
    const q = filters.search.toLowerCase();
    if (q && !l.title?.toLowerCase().includes(q) && !l.description?.toLowerCase().includes(q)) return false;
    if (filters.style && l.style !== filters.style) return false;
    if (filters.size && l.size !== filters.size) return false;
    if (filters.condition && l.condition !== filters.condition) return false;
    if (filters.maxPrice && l.price > Number(filters.maxPrice)) return false;
    if (filters.school && l.school_id !== filters.school) return false;
    return true;
  });

  const activeSchoolFilter = filters.school ? getSchool(filters.school) : null;
  const activeSchoolId = activeSchoolFilter?.id || null;
  const topAd = ads.find(a => a.active && a.slot === "top" && a.scope === "school" && a.school_id === activeSchoolId)
    || ads.find(a => a.active && a.slot === "top" && (a.scope === "both"))
    || ads.find(a => a.active && a.slot === "top" && a.scope === "global" && !activeSchoolId)
    || ads.find(a => a.active && a.slot === "top");
  const totalRevenue = listings.reduce((s, l) => s + calcFees(l.price, getCommission(l.school_id)).commission, 0);

  const P = darkMode ? getP() : getLightP();

  if (loading) return <div className="app"><style>{getCSS(P)}</style><div className="loading" style={{paddingTop:"5rem"}}>Loading TutuTrade...</div></div>;

  return (
    <div className="app">
      <style>{getCSS(P)}</style>
      <PixieDust />

      {/* HEADER */}
      <header className="header">
        <div className="logo" onClick={() => { setView("browse"); setFilters(f=>({...f,school:""})); }}>
          <div className="logo-icon">🩰</div>
          <div><div className="logo-text">TutuTrade</div><div className="logo-sub">Buy & Sell Dancewear</div></div>
        </div>
        <div className="header-actions">
          <button className="theme-toggle" onClick={() => setDarkMode(d => !d)} title={darkMode ? "Switch to light mode" : "Switch to dark mode"}>{darkMode ? "☀" : "🌙"}</button>
          {user && (() => { const unread = notifications.filter(n=>!n.read).length; return (
            <button className={`notif-btn ${showFairyPanel?"open":""}`} onClick={() => { setShowFairyPanel(s=>!s); setFairyTab("chat"); }} title={`Ask ${fairyName}`}>
              🧚
              {unread > 0 && <span className="notif-badge">{unread > 9 ? "9+" : unread}</span>}
            </button>
          ); })()}
          {user ? (
            <>
              <span className="header-hi">Hi, {user.user_metadata?.full_name?.split(" ")[0] || user.email}</span>
              <button className="btn btn-ghost btn-sm header-desktop-only" onClick={() => setView("profile")}>My Profile</button>
              {isAdmin && <button className="btn btn-admin btn-sm header-desktop-only" onClick={() => setView("admin")}>⚙ Admin</button>}
              <button className="btn btn-primary btn-sm" onClick={() => setModal("create")}>
                + List<span className="header-desktop-only"> Item</span>
              </button>
              <button className="btn btn-ghost btn-sm header-desktop-only" onClick={handleLogout}>Sign out</button>
              {/* Mobile-only user menu */}
              <div className="user-menu-wrap header-mobile-only">
                <button className="btn btn-ghost btn-sm" onClick={()=>setShowUserMenu(s=>!s)} style={{padding:".4rem .55rem",color:P.accent,borderColor:P.accent,background:`rgba(201,169,110,.1)`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                </button>
                {showUserMenu && (
                  <>
                    <div style={{position:"fixed",inset:0,zIndex:199}} onClick={()=>setShowUserMenu(false)}/>
                    <div className="user-menu-panel">
                      <button className="user-menu-item" onClick={()=>{setView("profile");setShowUserMenu(false);}}>👤 My Profile</button>
                      {isAdmin && <button className="user-menu-item" onClick={()=>{setView("admin");setShowUserMenu(false);}}>⚙ Admin</button>}
                      <button className="user-menu-item" onClick={()=>{handleLogout();setShowUserMenu(false);}}>Sign out</button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => { setAuthTab("login"); setModal("auth"); }}>Sign in</button>
              <button className="btn btn-primary btn-sm" onClick={() => { setAuthTab("register"); setModal("auth"); }}>Join</button>
            </>
          )}
        </div>
      </header>

      <div className="main">
        {success && <div className="success-banner" onClick={() => setSuccess("")}>✓ {success}</div>}

        {/* ── ADMIN ── */}
        {view === "admin" && isAdmin ? (
          <div>
            <div style={{marginBottom:"1.5rem"}}>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"1.7rem",color:"#a99ef0",marginBottom:".3rem"}}>Admin Panel</h2>
              <p style={{fontSize:".82rem",color:P.muted}}>Manage your marketplace.</p>
            </div>
            <div className="admin-stat-grid">
              <div className="admin-stat"><div className="admin-stat-value">{listings.length}</div><div className="admin-stat-label">Listings</div></div>
              <div className="admin-stat"><div className="admin-stat-value">{allUsers.length}</div><div className="admin-stat-label">Users</div></div>
              <div className="admin-stat"><div className="admin-stat-value">{commissionPct}%</div><div className="admin-stat-label">Commission</div></div>
              <div className="admin-stat"><div className="admin-stat-value">£{totalRevenue.toFixed(2)}</div><div className="admin-stat-label">Est. Revenue</div></div>
            </div>
            <div className="admin-tabs">
              {["overview","schools","events","users","ads","listings","dropdowns"].map(t => (
                <button key={t} className={`admin-tab ${adminTab===t?"active":""}`} onClick={() => setAdminTab(t)}>
                  {t.charAt(0).toUpperCase()+t.slice(1)}
                </button>
              ))}
            </div>

            {adminTab === "overview" && (
              <div className="admin-section">
                <div className="admin-section-title">🧚 Fairy Name</div>
                <div style={{display:"flex",alignItems:"center",gap:"1rem",flexWrap:"wrap",padding:"1rem",background:"rgba(124,111,224,.06)",border:"1px solid rgba(124,111,224,.15)",borderRadius:8,marginBottom:"1.5rem"}}>
                  <input className="form-input" value={fairyName} onChange={e=>setFairyName(e.target.value)} placeholder="Fairy name…" style={{maxWidth:200}}/>
                  <button className="btn btn-primary btn-sm" onClick={async()=>{ await supabase.from("settings").upsert({key:"fairy_name",value:fairyName.trim()||"Bella"},{onConflict:"key"}); }}>Save</button>
                </div>
                <div className="admin-section-title">💰 Commission Rate</div>
                <div style={{display:"flex",alignItems:"center",gap:"1rem",flexWrap:"wrap",padding:"1rem",background:"rgba(124,111,224,.06)",border:"1px solid rgba(124,111,224,.15)",borderRadius:8}}>
                  <label style={{fontSize:".82rem",color:P.muted}}>Platform fee:</label>
                  <div style={{display:"flex",alignItems:"center",gap:".4rem"}}>
                    <input className="admin-commission-input" type="number" min="0" max="30" step="0.1" value={commissionPct} onChange={e => handleSaveCommission(parseFloat(e.target.value)||0)}/>
                    <span style={{color:P.muted,fontSize:".84rem"}}>%</span>
                  </div>
                  <span style={{fontSize:".78rem",color:P.muted}}>On a £50 sale: you earn <strong style={{color:P.accentSoft}}>£{calcFees(50,commissionPct).commission.toFixed(2)}</strong>, seller receives <strong style={{color:P.accentSoft}}>£{calcFees(50,commissionPct).sellerReceives.toFixed(2)}</strong></span>
                </div>
              </div>
            )}

            {adminTab === "schools" && (
              <div className="admin-section">
                <div className="admin-section-title">🏫 Dance Schools</div>
                <div style={{padding:"1rem",background:P.card,border:`1px solid ${P.border}`,borderRadius:10,marginBottom:"1rem"}}>
                  <div style={{display:"flex",gap:".65rem",flexWrap:"wrap",alignItems:"flex-end"}}>
                    <div style={{flex:2}}>
                      <div className="form-label">School name</div>
                      <input className="filter-input" placeholder="e.g. Starlight Dance Academy" value={newSchoolForm.name} onChange={e=>setNewSchoolForm(f=>({...f,name:e.target.value}))}/>
                    </div>
                    <div style={{flex:1}}>
                      <div className="form-label">School code</div>
                      <input className="filter-input" placeholder="e.g. DANCE2024" value={newSchoolForm.code} onChange={e=>setNewSchoolForm(f=>({...f,code:e.target.value}))}/>
                    </div>
                  </div>
                  <div style={{marginTop:".75rem"}}>
                    <div className="form-label">School colour</div>
                    <div className="color-picker-row">
                      {PRESET_COLORS.map(c => (
                        <div key={c} className="color-swatch" style={{background:c,outline:newSchoolForm.color===c?`2px solid white`:"2px solid transparent"}} onClick={() => setNewSchoolForm(f=>({...f,color:c}))}/>
                      ))}
                    </div>
                  </div>
                  <button className="btn btn-primary btn-sm" style={{marginTop:"1rem"}} onClick={handleAddSchoolAdmin}>+ Add School</button>
                </div>

                {schools.map(s => {
                  const memberCount = allUserSchools.filter(us => us.school_id === s.id).length;
                  const listingCount = listings.filter(l => l.school_id === s.id).length;
                  const sc = s.color || P.accent;
                  return (
                    <div key={s.id} style={{padding:"1rem",background:P.card,border:`1px solid ${P.border}`,borderRadius:10,marginBottom:".75rem",borderLeft:`4px solid ${sc}`}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:".5rem"}}>
                        <div>
                          <div style={{fontWeight:500,color:P.text,marginBottom:".25rem",display:"flex",alignItems:"center",gap:".5rem"}}>
                            <span style={{width:10,height:10,borderRadius:"50%",background:sc,display:"inline-block"}}/>
                            {s.name}
                          </div>
                          <div style={{display:"flex",gap:".5rem",alignItems:"center",flexWrap:"wrap"}}>
                            <span style={{padding:".18rem .55rem",borderRadius:20,fontSize:".65rem",background:hexToRgba(sc,0.12),color:sc,border:`1px solid ${hexToRgba(sc,0.3)}`}}>{s.code}</span>
                            <span style={{fontSize:".72rem",color:P.muted}}>{memberCount} members · {listingCount} listings</span>
                            <span style={{fontSize:".72rem",color:P.accent}}>
                              {s.commission_pct != null ? `${s.commission_pct}% commission` : `${commissionPct}% (global rate)`}
                            </span>
                          </div>
                        </div>
                        <div style={{display:"flex",gap:".4rem",flexWrap:"wrap"}}>
                          <button className="btn-copy" onClick={() => copyShareLink(s.code)}>{copiedLink===s.code?"✓ Copied":"Copy link"}</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setEditingSchoolColor(editingSchoolColor===s.id?null:s.id)}>🎨 Colour</button>
                          <button className="btn btn-danger btn-sm" onClick={() => setConfirmDeleteSchool(s)}>Remove</button>
                        </div>
                      </div>

                      {editingSchoolColor === s.id && (
                        <div style={{marginTop:".85rem",paddingTop:".85rem",borderTop:`1px solid ${P.border}`}}>
                          <div style={{marginBottom:"1rem"}}>
                            <div className="form-label">Commission rate</div>
                            <div style={{display:"flex",alignItems:"center",gap:".5rem",marginTop:".35rem"}}>
                              <input
                                className="admin-commission-input"
                                type="number" min="0" max="30" step="0.1"
                                placeholder={`${commissionPct} (global)`}
                                value={s.commission_pct ?? ""}
                                onChange={e => handleSaveSchoolCommission(s.id, e.target.value)}
                              />
                              <span style={{fontSize:".8rem",color:P.muted}}>%</span>
                              {s.commission_pct != null && (
                                <button className="btn btn-ghost btn-sm" onClick={() => handleSaveSchoolCommission(s.id, "")}>
                                  Use global rate
                                </button>
                              )}
                            </div>
                            <div className="form-hint">Leave blank to use the global rate ({commissionPct}%)</div>
                          </div>
                          <div className="form-label">Choose colour</div>
                          <div className="color-picker-row">
                            {PRESET_COLORS.map(c => (
                              <div key={c} className="color-swatch" style={{background:c,outline:s.color===c?`2px solid white`:"2px solid transparent"}} onClick={() => handleUpdateSchoolColor(s.id, c)}/>
                            ))}
                          </div>
                        </div>
                      )}

                      {confirmDeleteSchool?.id === s.id && (
                        <div className="confirm-box">
                          <strong>⚠ Remove {s.name}?</strong>
                          This will delete all {listingCount} listing{listingCount!==1?"s":""} and remove {memberCount} member{memberCount!==1?"s":""} from this school. Cannot be undone.
                          <div className="confirm-actions">
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteSchool(s)}>Yes, remove</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDeleteSchool(null)}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {!schools.length && <p style={{color:P.muted,fontSize:".84rem"}}>No schools yet.</p>}
              </div>
            )}

            {adminTab === "events" && (
              <div className="admin-section">
                <div className="admin-section-title">📅 School Events & Countdowns</div>
                <p style={{fontSize:".82rem",color:P.muted,marginBottom:"1.25rem"}}>Add events per school. Members see a live countdown when they filter by that school.</p>

                <div style={{padding:"1rem",background:P.card,border:`1px solid ${P.border}`,borderRadius:10,marginBottom:"1.5rem"}}>
                  <div style={{fontSize:".82rem",fontWeight:500,color:P.text,marginBottom:"1rem"}}>{editingEvent ? "Edit Event" : "Add New Event"}</div>
                  <div className="form-group">
                    <label className="form-label">School *</label>
                    <select className="form-select" value={eventForm.school_id} onChange={e=>setEventForm(f=>({...f,school_id:e.target.value}))}>
                      <option value="">Select school...</option>
                      {schools.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Event name *</label>
                    <input className="form-input" placeholder="e.g. Spring Dance Festival" value={eventForm.title} onChange={e=>setEventForm(f=>({...f,title:e.target.value}))}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date & time *</label>
                    <input className="form-input" type="datetime-local" value={eventForm.event_date} onChange={e=>setEventForm(f=>({...f,event_date:e.target.value}))}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description (optional)</label>
                    <input className="form-input" placeholder="e.g. Annual showcase at the Town Hall" value={eventForm.description} onChange={e=>setEventForm(f=>({...f,description:e.target.value}))}/>
                  </div>
                  <div style={{display:"flex",gap:".5rem"}}>
                    <button className="btn btn-primary btn-sm" onClick={handleSaveEvent}>{editingEvent ? "Save changes" : "+ Add event"}</button>
                    {editingEvent && <button className="btn btn-ghost btn-sm" onClick={() => { setEditingEvent(null); setEventForm({title:"",event_date:"",description:"",school_id:""}); }}>Cancel</button>}
                  </div>
                </div>

                {schools.map(s => {
                  const schoolEvents = events.filter(e => e.school_id === s.id);
                  if (!schoolEvents.length) return null;
                  const sc = s.color || P.accent;
                  return (
                    <div key={s.id} style={{marginBottom:"1.25rem"}}>
                      <div style={{fontSize:".78rem",fontWeight:500,color:sc,marginBottom:".5rem",display:"flex",alignItems:"center",gap:".4rem"}}>
                        <span style={{width:8,height:8,borderRadius:"50%",background:sc,display:"inline-block"}}/>
                        {s.name}
                      </div>
                      {schoolEvents.map(ev => {
                        const cd = getCountdown(ev.event_date);
                        return (
                          <div key={ev.id} className="event-item">
                            <div className="event-item-info">
                              <div className="event-item-title">{ev.title}</div>
                              <div className="event-item-meta">
                                {new Date(ev.event_date).toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}
                                {cd ? <span style={{color:sc,marginLeft:".5rem"}}>— {cd.d}d {cd.h}h {cd.m}m away</span> : <span style={{color:"#e07070",marginLeft:".5rem"}}>— Passed</span>}
                              </div>
                              {ev.description && <div style={{fontSize:".72rem",color:P.muted,marginTop:".15rem"}}>{ev.description}</div>}
                            </div>
                            <div style={{display:"flex",gap:".4rem",flexShrink:0}}>
                              <button className="btn btn-ghost btn-sm" onClick={() => { setEditingEvent(ev.id); setEventForm({title:ev.title,event_date:ev.event_date.slice(0,16),description:ev.description||"",school_id:ev.school_id}); }}>Edit</button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteEvent(ev.id)}>Remove</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
                {events.length === 0 && <p style={{color:P.muted,fontSize:".84rem"}}>No events yet. Add one above!</p>}
              </div>
            )}

            {adminTab === "users" && (
              <div className="admin-section">
                <div className="admin-section-title">👥 Users ({allUsers.length})</div>
                {allUsers.map(u => {
                  const uSchools = allUserSchools.filter(us => us.user_email === u.email);
                  const isExpanded = selectedUser?.id === u.id;
                  return (
                    <div key={u.id} className="user-card">
                      <div className="user-card-header">
                        <div>
                          <div className="user-card-name">{u.full_name || "No name"} {u.email === ADMIN_EMAIL && <span style={{fontSize:".65rem",color:P.admin,marginLeft:".4rem"}}>ADMIN</span>}</div>
                          <div style={{fontSize:".73rem",color:P.muted}}>{u.email}</div>
                          <div style={{fontSize:".7rem",color:P.muted,marginTop:".15rem"}}>Joined {new Date(u.created_at).toLocaleDateString("en-GB")}</div>
                        </div>
                        <button className="btn btn-ghost btn-sm" onClick={() => setSelectedUser(isExpanded?null:u)}>{isExpanded?"Close":"Manage"}</button>
                      </div>
                      <div style={{display:"flex",gap:".4rem",flexWrap:"wrap",alignItems:"center"}}>
                        <span style={{fontSize:".7rem",color:P.muted}}>Schools:</span>
                        {uSchools.map(us => {
                          const sc = getSchoolColor(us.school_id);
                          return (
                            <div key={us.id} style={{display:"flex",alignItems:"center",gap:".2rem"}}>
                              <span style={{padding:".18rem .55rem",borderRadius:20,fontSize:".65rem",background:hexToRgba(sc,0.12),color:sc,border:`1px solid ${hexToRgba(sc,0.3)}`}}>{us.school_name}</span>
                              {isExpanded && <button style={{background:"none",border:"none",color:"#e07070",cursor:"pointer",fontSize:".8rem",lineHeight:1}} onClick={() => handleAdminRemoveUserFromSchool(u.email, us.school_id)}>×</button>}
                            </div>
                          );
                        })}
                        {!uSchools.length && <span style={{fontSize:".75rem",color:P.muted}}>No schools</span>}
                      </div>
                      {isExpanded && (
                        <div style={{marginTop:"1rem",paddingTop:"1rem",borderTop:`1px solid ${P.border}`}}>
                          <div style={{marginBottom:"1rem"}}>
                            <div className="form-label">Add to school</div>
                            <div style={{display:"flex",gap:".5rem"}}>
                              <select className="form-select" style={{flex:1}} value={addUserSchoolId} onChange={e=>setAddUserSchoolId(e.target.value)}>
                                <option value="">Select school...</option>
                                {schools.filter(s => !uSchools.find(us => us.school_id === s.id)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                              </select>
                              <button className="btn btn-primary btn-sm" onClick={handleAdminAddUserToSchool}>Add</button>
                            </div>
                          </div>
                          {uSchools.length > 0 && (
                            <div style={{marginBottom:"1rem"}}>
                              <div className="form-label">Move to different school</div>
                              <div style={{display:"flex",gap:".5rem",flexWrap:"wrap"}}>
                                <select className="form-select" style={{flex:1}} value={moveUserSchool.fromId} onChange={e=>setMoveUserSchool(f=>({...f,fromId:e.target.value}))}>
                                  <option value="">From...</option>
                                  {uSchools.map(us => <option key={us.school_id} value={us.school_id}>{us.school_name}</option>)}
                                </select>
                                <select className="form-select" style={{flex:1}} value={moveUserSchool.toId} onChange={e=>setMoveUserSchool(f=>({...f,toId:e.target.value}))}>
                                  <option value="">To...</option>
                                  {schools.filter(s => !uSchools.find(us => us.school_id === s.id)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                                <button className="btn btn-ghost btn-sm" onClick={handleAdminMoveUserSchool}>Move</button>
                              </div>
                            </div>
                          )}
                          <div style={{display:"flex",gap:".5rem",flexWrap:"wrap"}}>
                            <button className="btn btn-warning btn-sm" onClick={() => handleAdminResetPassword(u.email)}>✉ Send password reset</button>
                            {u.email !== ADMIN_EMAIL && <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(u)}>🗑 Delete user</button>}
                          </div>
                          {confirmDelete?.id === u.id && (
                            <div className="confirm-box">
                              <strong>⚠ Delete {confirmDelete.full_name || confirmDelete.email}?</strong>
                              Removes their account, school memberships and all listings. Cannot be undone.
                              <div className="confirm-actions">
                                <button className="btn btn-danger btn-sm" onClick={handleAdminDeleteUser}>Yes, delete</button>
                                <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(null)}>Cancel</button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {!allUsers.length && <p style={{color:P.muted,fontSize:".84rem"}}>No users yet.</p>}
              </div>
            )}

            {adminTab === "ads" && (
              <div className="admin-section">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
                  <div className="admin-section-title" style={{marginBottom:0,borderBottom:"none",paddingBottom:0}}>📢 Advertisers</div>
                  <button className="btn btn-primary btn-sm" onClick={() => { setEditingAd("new"); setAdForm({title:"",tagline:"",url:"",slot:"sidebar-top",scope:"global",school_id:null,active:true,image:null,sort_order:0}); setModal("editAd"); }}>+ Add</button>
                </div>
                <table className="admin-table">
                  <thead><tr><th>Advertiser</th><th>Position</th><th>Order</th><th>Scope</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {ads.map(ad => (
                      <tr key={ad.id}>
                        <td><span className={`ad-dot ${ad.active?"active":"inactive"}`}/>{ad.title}<div style={{fontSize:".7rem",color:P.muted}}>{ad.tagline}</div></td>
                        <td><span className="tag tag-style" style={{fontSize:".62rem"}}>{ad.slot}</span></td>
                        <td style={{color:P.muted,fontSize:".8rem"}}>#{ad.sort_order||0}</td>
                        <td style={{fontSize:".75rem",color:P.muted}}>
                          {ad.scope === "school" ? `🏫 ${schools.find(s=>s.id===ad.school_id)?.name||"School"}` : ad.scope === "both" ? `✨ Both` : "🌐 Global"}
                        </td>
                        <td><button className={`btn ${ad.active?"btn-success":"btn-ghost"} btn-sm`} onClick={() => toggleAd(ad.id,ad.active)}>{ad.active?"Live":"Paused"}</button></td>
                        <td style={{display:"flex",gap:".4rem"}}>
                          <button className="btn btn-ghost btn-sm" onClick={() => { setEditingAd(ad.id); setAdForm({title:ad.title,tagline:ad.tagline||"",url:ad.url,slot:ad.slot||"sidebar-top",scope:ad.scope||"global",school_id:ad.school_id||null,active:ad.active,image:ad.image||null,sort_order:ad.sort_order||0}); setModal("editAd"); }}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => deleteAd(ad.id)}>Remove</button>
                        </td>
                      </tr>
                    ))}
                    {!ads.length && <tr><td colSpan={4} style={{color:P.muted,textAlign:"center",padding:"1.5rem"}}>No advertisers yet</td></tr>}
                  </tbody>
                </table>
              </div>
            )}

            {adminTab === "listings" && (
              <div className="admin-section">
                <div className="admin-section-title">📋 All Listings</div>
                <table className="admin-table">
                  <thead><tr><th>Item</th><th>Seller</th><th>School</th><th>Price</th><th>Your fee</th><th>Status</th><th></th></tr></thead>
                  <tbody>
                    {listings.map(l => { const eff = getCommission(l.school_id); const { commission } = calcFees(l.price, eff); const sc = getSchoolColor(l.school_id); return (
                      <tr key={l.id} style={{opacity:l.sold?0.6:1}}>
                        <td>{l.sold && <span style={{fontSize:".65rem",color:"#e07070",marginRight:".4rem"}}>[SOLD]</span>}{l.title}</td><td style={{color:P.muted}}>{l.seller_name}</td>
                        <td><span style={{padding:".18rem .55rem",borderRadius:20,fontSize:".65rem",background:hexToRgba(sc,0.12),color:sc,border:`1px solid ${hexToRgba(sc,0.3)}`}}>{l.school_name}</span></td>
                        <td>£{l.price}</td><td style={{color:P.accentSoft}}>£{commission}</td>
                        <td>
                          {l.sold
                            ? <button className="btn btn-ghost btn-sm" onClick={() => handleMarkUnsold(l.id)}>Relist</button>
                            : <button className="btn btn-success btn-sm" onClick={() => handleMarkSold(l.id)}>Mark sold</button>
                          }
                        </td>
                        <td><button className="btn btn-danger btn-sm" onClick={() => handleDelete(l.id)}>Remove</button></td>
                      </tr>
                    );})}
                    {!listings.length && <tr><td colSpan={7} style={{color:P.muted,textAlign:"center",padding:"1.5rem"}}>No listings</td></tr>}
                  </tbody>
                </table>
              </div>
            )}

            {adminTab === "dropdowns" && (
              <div className="admin-section">
                <div className="admin-section-title">🎛 Manage Dropdowns</div>
                <p style={{fontSize:".82rem",color:P.muted,marginBottom:"1.5rem"}}>Add or remove options from the dance style, size and condition dropdowns.</p>

                <div style={{marginBottom:"1.5rem",padding:"1rem",background:P.card,border:`1px solid ${P.border}`,borderRadius:10}}>
                  <div style={{fontSize:".82rem",fontWeight:500,color:P.text,marginBottom:"1rem"}}>💃 Dance Styles</div>
                  <div style={{display:"flex",gap:".5rem",flexWrap:"wrap",marginBottom:"1rem"}}>
                    {danceStyles.map(s => (
                      <div key={s} style={{display:"flex",alignItems:"center",gap:".3rem",padding:".25rem .65rem",background:hexToRgba(P.accent,0.1),border:`1px solid ${hexToRgba(P.accent,0.25)}`,borderRadius:20}}>
                        <span style={{fontSize:".78rem",color:P.accent}}>{s}</span>
                        <button style={{background:"none",border:"none",color:"#e07070",cursor:"pointer",fontSize:".85rem",lineHeight:1,padding:"0 .1rem"}} onClick={() => removeDropdownItem("dance_styles", s)}>×</button>
                      </div>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:".5rem"}}>
                    <input className="form-input" placeholder="Add new dance style..." value={newDropdownItem.danceStyle} onChange={e=>setNewDropdownItem(f=>({...f,danceStyle:e.target.value}))} onKeyDown={e=>{if(e.key==="Enter"){addDropdownItem("dance_styles",newDropdownItem.danceStyle);setNewDropdownItem(f=>({...f,danceStyle:""}));}}} style={{flex:1}}/>
                    <button className="btn btn-primary btn-sm" onClick={()=>{addDropdownItem("dance_styles",newDropdownItem.danceStyle);setNewDropdownItem(f=>({...f,danceStyle:""}));}}>+ Add</button>
                  </div>
                </div>

                <div style={{marginBottom:"1.5rem",padding:"1rem",background:P.card,border:`1px solid ${P.border}`,borderRadius:10}}>
                  <div style={{fontSize:".82rem",fontWeight:500,color:P.text,marginBottom:"1rem"}}>📏 Sizes</div>
                  <div style={{display:"flex",gap:".5rem",flexWrap:"wrap",marginBottom:"1rem"}}>
                    {sizes.map(s => (
                      <div key={s} style={{display:"flex",alignItems:"center",gap:".3rem",padding:".25rem .65rem",background:hexToRgba(P.pink,0.1),border:`1px solid ${hexToRgba(P.pink,0.25)}`,borderRadius:20}}>
                        <span style={{fontSize:".78rem",color:P.pink}}>{s}</span>
                        <button style={{background:"none",border:"none",color:"#e07070",cursor:"pointer",fontSize:".85rem",lineHeight:1,padding:"0 .1rem"}} onClick={() => removeDropdownItem("sizes", s)}>×</button>
                      </div>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:".5rem"}}>
                    <input className="form-input" placeholder="Add new size..." value={newDropdownItem.size} onChange={e=>setNewDropdownItem(f=>({...f,size:e.target.value}))} onKeyDown={e=>{if(e.key==="Enter"){addDropdownItem("sizes",newDropdownItem.size);setNewDropdownItem(f=>({...f,size:""}));}}} style={{flex:1}}/>
                    <button className="btn btn-primary btn-sm" onClick={()=>{addDropdownItem("sizes",newDropdownItem.size);setNewDropdownItem(f=>({...f,size:""}));}}>+ Add</button>
                  </div>
                </div>

                <div style={{padding:"1rem",background:P.card,border:`1px solid ${P.border}`,borderRadius:10}}>
                  <div style={{fontSize:".82rem",fontWeight:500,color:P.text,marginBottom:"1rem"}}>✨ Conditions</div>
                  <div style={{display:"flex",gap:".5rem",flexWrap:"wrap",marginBottom:"1rem"}}>
                    {conditions.map(c => (
                      <div key={c} style={{display:"flex",alignItems:"center",gap:".3rem",padding:".25rem .65rem",background:hexToRgba(P.success,0.1),border:`1px solid ${hexToRgba(P.success,0.25)}`,borderRadius:20}}>
                        <span style={{fontSize:".78rem",color:P.success}}>{c}</span>
                        <button style={{background:"none",border:"none",color:"#e07070",cursor:"pointer",fontSize:".85rem",lineHeight:1,padding:"0 .1rem"}} onClick={() => removeDropdownItem("conditions", c)}>×</button>
                      </div>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:".5rem"}}>
                    <input className="form-input" placeholder="Add new condition..." value={newDropdownItem.condition} onChange={e=>setNewDropdownItem(f=>({...f,condition:e.target.value}))} onKeyDown={e=>{if(e.key==="Enter"){addDropdownItem("conditions",newDropdownItem.condition);setNewDropdownItem(f=>({...f,condition:""}));}}} style={{flex:1}}/>
                    <button className="btn btn-primary btn-sm" onClick={()=>{addDropdownItem("conditions",newDropdownItem.condition);setNewDropdownItem(f=>({...f,condition:""}));}}>+ Add</button>
                  </div>
                </div>
              </div>
            )}
          </div>

        ) : view === "profile" && user ? (
          <div>
            <div style={{marginBottom:"1.5rem"}}>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"1.7rem",color:P.accentSoft,marginBottom:".3rem"}}>My Profile</h2>
              <p style={{fontSize:".82rem",color:P.muted}}>{user.email}</p>
            </div>
            <div style={{maxWidth:520}}>
              <div style={{marginBottom:"1.5rem"}}>
                <div className="form-label" style={{marginBottom:".75rem"}}>My Dance Schools</div>
                {userSchools.map(us => {
                  const sc = getSchoolColor(us.school_id);
                  return (
                    <div key={us.id} className="profile-school-item" style={{background:hexToRgba(sc,0.06),borderColor:P.border,borderLeftColor:sc}}>
                      <div><div style={{fontSize:".85rem",color:P.text}}>{us.school_name}</div><div style={{fontSize:".7rem",color:P.muted,marginTop:".15rem"}}>Code: {us.school_code}</div></div>
                      {userSchools.length > 1 && <button className="btn btn-danger btn-sm" onClick={() => handleLeaveSchool(us.school_id)}>Leave</button>}
                    </div>
                  );
                })}
                {!userSchools.length && <p style={{color:P.muted,fontSize:".84rem"}}>You're not in any schools yet.</p>}
              </div>
              <div style={{padding:"1rem",background:P.surface,border:`1px solid ${P.border}`,borderRadius:10}}>
                <div className="form-label" style={{marginBottom:".75rem"}}>Join Another School</div>
                {addSchoolError && <div className="form-error" style={{marginBottom:".75rem"}}>⚠ {addSchoolError}</div>}
                <div style={{display:"flex",gap:".5rem"}}>
                  <input className="form-input" placeholder="Enter school code" value={addSchoolCode} onChange={e=>setAddSchoolCode(e.target.value)} style={{flex:1}}/>
                  <button className="btn btn-primary" onClick={handleAddSchool}>Join</button>
                </div>
                <div className="form-hint">Ask your dance school admin for their code</div>
              </div>

              {/* ACCOUNT MANAGEMENT */}
              <div style={{marginTop:"1.5rem"}}>
                <div style={{fontSize:".72rem",textTransform:"uppercase",letterSpacing:".1em",color:P.muted,marginBottom:".75rem"}}>Account Settings</div>
                {accountMsg && <div style={{padding:".65rem .85rem",background:accountMsg.startsWith("✓")?"rgba(111,207,151,.1)":"rgba(224,112,112,.1)",border:`1px solid ${accountMsg.startsWith("✓")?"rgba(111,207,151,.3)":"rgba(224,112,112,.3)"}`,borderRadius:7,fontSize:".78rem",color:accountMsg.startsWith("✓")?P.success:"#e07070",marginBottom:"1rem"}}>{accountMsg}</div>}

                <div style={{padding:"1rem",background:P.surface,border:`1px solid ${P.border}`,borderRadius:10,marginBottom:".75rem"}}>
                  <div className="form-label" style={{marginBottom:".25rem"}}>Change Display Name</div>
                  <div style={{fontSize:".73rem",color:P.muted,marginBottom:".65rem"}}>Currently: <strong style={{color:P.accentSoft}}>{user.user_metadata?.full_name || user.email}</strong></div>

                <div style={{padding:"1rem",background:P.surface,border:`1px solid ${P.border}`,borderRadius:10,marginBottom:".75rem"}}>
                  <div className="form-label" style={{marginBottom:".25rem"}}>💰 PayPal Email for Payouts</div>
                  <div style={{fontSize:".73rem",color:P.muted,marginBottom:".65rem"}}>
                    {user.user_metadata?.paypal_email
                      ? <>Currently: <strong style={{color:P.success}}>{user.user_metadata.paypal_email}</strong></>
                      : <span style={{color:"#ffb400"}}>⚠ Not set — add your PayPal email so you can receive payouts quickly</span>
                    }
                  </div>
                  <div style={{display:"flex",gap:".5rem"}}>
                    <input className="form-input" type="email" placeholder="your-paypal@email.com" value={accountForm.paypalEmail} onChange={e=>setAccountForm(f=>({...f,paypalEmail:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&handleSavePaypalEmail()} style={{flex:1}}/>
                    <button className="btn btn-primary btn-sm" onClick={handleSavePaypalEmail}>Save</button>
                  </div>
                  <div className="form-hint">This is used to send you your payout when an item sells. It stays private — only the site admin sees it.</div>
                </div>
                  <div style={{display:"flex",gap:".5rem"}}>
                    <input className="form-input" type="text" placeholder="Your new display name" value={accountForm.displayName} onChange={e=>setAccountForm(f=>({...f,displayName:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&handleUpdateDisplayName()} style={{flex:1}}/>
                    <button className="btn btn-primary btn-sm" onClick={handleUpdateDisplayName}>Update</button>
                  </div>
                  <div className="form-hint">This updates your name on all listings, comments and board posts.</div>
                </div>

                <div style={{padding:"1rem",background:P.surface,border:`1px solid ${P.border}`,borderRadius:10,marginBottom:".75rem"}}>
                  <div className="form-label" style={{marginBottom:".75rem"}}>Change Email</div>
                  <div style={{display:"flex",gap:".5rem"}}>
                    <input className="form-input" type="email" placeholder="New email address" value={accountForm.email} onChange={e=>setAccountForm(f=>({...f,email:e.target.value}))} style={{flex:1}}/>
                    <button className="btn btn-primary btn-sm" onClick={handleUpdateEmail}>Update</button>
                  </div>
                </div>

                <div style={{padding:"1rem",background:P.surface,border:`1px solid ${P.border}`,borderRadius:10,marginBottom:".75rem"}}>
                  <div className="form-label" style={{marginBottom:".75rem"}}>Change Password</div>
                  <div style={{display:"flex",flexDirection:"column",gap:".5rem"}}>
                    <input className="form-input" type="password" placeholder="New password" value={accountForm.password} onChange={e=>setAccountForm(f=>({...f,password:e.target.value}))}/>
                    <input className="form-input" type="password" placeholder="Confirm new password" value={accountForm.confirmPassword} onChange={e=>setAccountForm(f=>({...f,confirmPassword:e.target.value}))}/>
                    <button className="btn btn-primary btn-sm" style={{alignSelf:"flex-start"}} onClick={handleUpdatePassword}>Update password</button>
                  </div>
                </div>

                <div style={{padding:"1rem",background:"rgba(224,112,112,.05)",border:"1px solid rgba(224,112,112,.2)",borderRadius:10}}>
                  <div className="form-label" style={{marginBottom:".5rem",color:"#e07070"}}>Danger Zone</div>
                  {!confirmDeleteAccount ? (
                    <button className="btn btn-danger btn-sm" onClick={() => setConfirmDeleteAccount(true)}>Delete my account</button>
                  ) : (
                    <div>
                      <p style={{fontSize:".8rem",color:P.muted,marginBottom:".75rem"}}>This will permanently delete your account and all your listings. This cannot be undone.</p>
                      <div style={{display:"flex",gap:".5rem"}}>
                        <button className="btn btn-danger btn-sm" onClick={handleDeleteAccount}>Yes, delete my account</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDeleteAccount(false)}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        ) : !user ? (
          /* ── LANDING PAGE for logged-out users ── */
          <div className="landing">
            <div className="hero-eyebrow">✦ TutuTrade ✦</div>
            <h1 className="hero-title">Buy & sell <em>beautiful</em><br/>dancewear</h1>
            <p className="hero-sub">A private marketplace for dance school communities. Buy and sell costumes, shoes and accessories with other parents at your school.</p>
            <div style={{display:"flex",gap:"1rem",flexWrap:"wrap",justifyContent:"center",marginBottom:"1.5rem"}}>
              <button className="btn btn-primary" style={{padding:".75rem 2rem",fontSize:".9rem"}} onClick={() => { setAuthTab("register"); setModal("auth"); }}>Join your school</button>
              <button className="btn btn-ghost" style={{padding:".75rem 2rem",fontSize:".9rem"}} onClick={() => { setAuthTab("login"); setModal("auth"); }}>Sign in</button>
            </div>
            {schools.length > 0 && (
              <div>
                <div style={{fontSize:".72rem",textTransform:"uppercase",letterSpacing:".15em",color:P.muted,marginBottom:".75rem"}}>Schools on TutuTrade</div>
                <div className="landing-schools">
                  {schools.map(s => {
                    const sc = s.color || P.accent;
                    return (
                      <div key={s.id} style={{display:"inline-flex",alignItems:"center",gap:".5rem",padding:".35rem .9rem",background:hexToRgba(sc,0.08),border:`1px solid ${hexToRgba(sc,0.3)}`,borderRadius:20,fontSize:".78rem",color:sc}}>
                        <span style={{width:7,height:7,borderRadius:"50%",background:sc,display:"inline-block"}}/>
                        {s.name}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="landing-features">
              <div className="landing-feature"><div className="landing-feature-icon">🔒</div><div className="landing-feature-title">Private & secure</div><div className="landing-feature-desc">Only parents from your dance school can see listings</div></div>
              <div className="landing-feature"><div className="landing-feature-icon">💰</div><div className="landing-feature-title">Save money</div><div className="landing-feature-desc">Buy pre-loved costumes at a fraction of the original price</div></div>
              <div className="landing-feature"><div className="landing-feature-icon">🩰</div><div className="landing-feature-title">Dance community</div><div className="landing-feature-desc">Trade with parents you already know and trust</div></div>
            </div>
          </div>

        ) : (
          <>
            {/* HERO with clickable school badges — logged in users only */}
            {view === "browse" && (
              <div className="hero">
                <div className="hero-eyebrow">✦ TutuTrade ✦</div>
                <h1 className="hero-title">Buy & sell <em>beautiful</em><br/>dancewear</h1>
                <p className="hero-sub">Costumes, shoes & accessories from dancers in your school — pre-loved and ready to perform.</p>
                <div className="school-badges">
                  {schools.map(s => {
                    const sc = s.color || P.accent;
                    const isActive = filters.school === s.id;
                    const count = listings.filter(l => l.school_id === s.id && userSchoolIds.includes(l.school_id)).length;
                    return (
                      <button
                        key={s.id}
                        onClick={() => handleClickSchoolBadge(s.id)}
                        style={{
                          display:"inline-flex",alignItems:"center",gap:".5rem",
                          padding:".45rem 1rem",
                          background: isActive ? hexToRgba(sc,0.2) : hexToRgba(sc,0.08),
                          border:`1px solid ${isActive ? sc : hexToRgba(sc,0.3)}`,
                          borderRadius:20,fontSize:".78rem",color:sc,
                          cursor:"pointer",transition:"all .2s",fontFamily:"'Jost',sans-serif",
                          fontWeight: isActive ? 500 : 400,
                          boxShadow: isActive ? `0 0 12px ${hexToRgba(sc,0.25)}` : "none",
                          transform: isActive ? "translateY(-1px)" : "none",
                        }}
                      >
                        <span style={{width:7,height:7,borderRadius:"50%",background:sc,display:"inline-block",flexShrink:0}}/>
                        {s.name}
                        <span style={{fontSize:".65rem",opacity:.7}}>({count})</span>
                      </button>
                    );
                  })}
                </div>
                {!filters.school && userSchools.length > 1 && (
                  <p style={{fontSize:".75rem",color:P.muted,marginTop:".25rem"}}>
                    👆 Click your school to see events, exclusive listings and more
                  </p>
                )}
                {filters.school && userSchools.length > 1 && (
                  <button style={{background:"none",border:"none",color:P.muted,fontSize:".75rem",cursor:"pointer",textDecoration:"underline",fontFamily:"'Jost',sans-serif"}} onClick={() => setFilters(f=>({...f,school:""}))}>
                    Clear filter — show all schools
                  </button>
                )}
              </div>
            )}

            {user && (
              <div className="nav-pills">
                <button className={`nav-pill ${view==="browse"?"active":""}`} onClick={() => setView("browse")}>Browse all</button>
                <button className={`nav-pill ${view==="mylistings"?"active":""}`} onClick={() => setView("mylistings")}>My listings</button>
                <button className={`nav-pill ${view==="board"?"active":""}`} onClick={() => { setView("board"); loadBoardPosts(); loadBoardReplies(); setBoardSchoolId(userSchools[0]?.school_id || "general"); }}>💬 Board{boardPosts.length > 0 && <span style={{marginLeft:".4rem",background:P.accent,color:"#fff",borderRadius:10,fontSize:".65rem",padding:"1px 6px",fontWeight:700,verticalAlign:"middle"}}>{boardPosts.length}</span>}</button>
                <button className={`nav-pill ${view==="wanted"?"active":""}`} onClick={() => { setView("wanted"); loadWantedPosts(); setWantedSchoolId(userSchools[0]?.school_id || "general"); }}>🔍 Wanted{wantedPosts.filter(p=>!p.fulfilled).length > 0 && <span style={{marginLeft:".4rem",background:P.accent,color:"#fff",borderRadius:10,fontSize:".65rem",padding:"1px 6px",fontWeight:700,verticalAlign:"middle"}}>{wantedPosts.filter(p=>!p.fulfilled).length}</span>}</button>
              </div>
            )}

            {/* School filter banner */}
            {view === "browse" && activeSchoolFilter && (() => {
              const sc = activeSchoolFilter.color || P.accent;
              const count = filtered.length;
              const schoolEvents = events.filter(e => e.school_id === activeSchoolFilter.id && new Date(e.event_date) > new Date()).slice(0, 5);
              return (
                <>
                  <div className="school-filter-banner" style={{background:hexToRgba(sc,0.1),border:`1px solid ${hexToRgba(sc,0.3)}`}}>
                    <div>
                      <div className="school-filter-banner-name" style={{color:sc}}>{activeSchoolFilter.name}</div>
                      <div className="school-filter-banner-sub" style={{color:sc}}>{count} listing{count!==1?"s":""} available</div>
                    </div>
                    <button className="btn btn-sm" style={{background:"transparent",color:sc,border:`1px solid ${hexToRgba(sc,0.4)}`}} onClick={() => setFilters(f=>({...f,school:""}))}>
                      × Clear
                    </button>
                  </div>
                  {schoolEvents.length > 0 && (
                    <div className="countdown-section">
                      <SchoolAdBanner ads={ads} schoolId={activeSchoolFilter.id}/>
                      <div style={{fontSize:".7rem",textTransform:"uppercase",letterSpacing:".12em",color:sc,marginBottom:".75rem",opacity:.8}}>📅 Upcoming Events</div>
                      <div className="countdown-cards">
                        {schoolEvents.map(ev => {
                          const cd = getCountdown(ev.event_date);
                          return (
                            <div key={ev.id} className="countdown-card" style={{borderLeftColor:sc,background:hexToRgba(sc,0.05)}}>
                              <div className="countdown-card-title" style={{color:sc}}>{ev.title}</div>
                              {ev.description && <div className="countdown-card-desc">{ev.description}</div>}
                              {cd ? (
                                <div className="countdown-timer">
                                  {[["d","Days"],["h","Hours"],["m","Mins"],["s","Secs"]].map(([k,label],i) => (
                                    <Fragment key={k}>
                                      {i > 0 && <span className="countdown-sep">:</span>}
                                      <div className="countdown-unit" style={{background:hexToRgba(sc,0.12)}}>
                                        <span className="countdown-num" style={{color:sc}}>{String(cd[k]).padStart(2,"0")}</span>
                                        <span className="countdown-label">{label}</span>
                                      </div>
                                    </Fragment>
                                  ))}
                                </div>
                              ) : (
                                <div className="countdown-expired">Event has passed</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}

            {view === "browse" && !activeSchoolFilter && <AdBanner ad={topAd} />}

            {view === "browse" && (
              <div className="filters">
                <input className="filter-input" placeholder="Search costumes..." value={filters.search} onChange={e => setFilters(f=>({...f,search:e.target.value}))}/>
                <select className="filter-select" value={filters.school} onChange={e => setFilters(f=>({...f,school:e.target.value}))}><option value="">All schools</option>{schools.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
                <select className="filter-select" value={filters.style} onChange={e => setFilters(f=>({...f,style:e.target.value}))}><option value="">All styles</option>{danceStyles.map(s=><option key={s}>{s}</option>)}</select>
                <select className="filter-select" value={filters.size} onChange={e => setFilters(f=>({...f,size:e.target.value}))}><option value="">All sizes</option>{sizes.map(s=><option key={s}>{s}</option>)}</select>
                <select className="filter-select" value={filters.condition} onChange={e => setFilters(f=>({...f,condition:e.target.value}))}><option value="">Any condition</option>{conditions.map(c=><option key={c}>{c}</option>)}</select>
                <input className="filter-input" placeholder="Max price £" style={{minWidth:90,maxWidth:110}} value={filters.maxPrice} onChange={e => setFilters(f=>({...f,maxPrice:e.target.value}))}/>
              </div>
            )}

            {(view === "browse" || view === "mylistings") && (<>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.1rem",flexWrap:"wrap",gap:".5rem"}}>
              <div className="listing-count">Showing <strong>{filtered.length}</strong> {filtered.length===1?"listing":"listings"}{view==="mylistings"?" — your items":""}</div>
              {view === "browse" && <button className={`show-sold-toggle ${showSold?"active":""}`} onClick={() => setShowSold(s=>!s)}>
                {showSold ? "✓ Showing sold" : "Show sold items"}
              </button>}
            </div>

            <div className={view==="browse" ? "layout" : ""}>
              <div>
                <div className="grid">
                  {filtered.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">🩰</div>
                      <h3>{view==="mylistings" ? "No listings yet" : "No items found"}</h3>
                      <p style={{marginTop:".5rem",fontSize:".83rem"}}>{view==="mylistings" ? "Click '+ List Item' to get started." : "Try adjusting your filters."}</p>
                    </div>
                  ) : filtered.map(l => {
                    const sc = getSchoolColor(l.school_id);
                    return (
                      <div className="card" key={l.id} style={{borderColor:hexToRgba(sc,0.25),opacity:l.sold?0.7:1}} onClick={() => { setSelectedListing(l); setModal("detail"); loadComments(l.id); setCommentText(""); }}>
                        <div className="school-stripe" style={{background:sc}}/>
                        <div className="card-image-wrap">
                          <div className="card-image" onClick={e=>{if(l.image){e.stopPropagation();setLightboxImage(l.image);}}}>
                            {l.image ? <img src={l.image} alt={l.title}/> : styleEmoji[l.style]||"👗"}
                            <span className={`condition-pill condition-${conditionKey[l.condition]||"good"}`}>{l.condition}</span>
                          </div>
                          {l.sold && <div className="sold-overlay"><span className="sold-badge">Sold</span></div>}
                        </div>
                        <div className="card-body">
                          <div className="card-style-tag" style={{color:sc}}>{l.style}</div>
                          <div className="card-title">{l.title}</div>
                          <div className="card-meta" style={{display:"flex",alignItems:"center",gap:".4rem",flexWrap:"wrap"}}>
                            <span>Size: {l.size}</span>
                            {l.school_id
                              ? <span>· <span style={{color:sc,cursor:"pointer"}} onClick={e=>{e.stopPropagation();handleClickSchoolBadge(l.school_id);}}>{l.school_name}</span></span>
                              : <span className="general-badge">🌐 General</span>
                            }
                            {l.images && l.images.length > 1 && <span style={{fontSize:".65rem",color:P.muted}}>📷 {l.images.length}</span>}
                          </div>
                          <div className="card-footer">
                            <div className="price" style={{textDecoration:l.sold?"line-through":"none",opacity:l.sold?0.5:1}}>£{l.price} <span>GBP</span></div>
                            <div style={{display:"flex",alignItems:"center",gap:".4rem"}}>
                              {commentCounts[l.id] > 0 && (
                                <span style={{fontSize:".68rem",color:P.muted}}>💬 {commentCounts[l.id]}</span>
                              )}
                              {l.sold
                                ? <span style={{fontSize:".72rem",color:"#e07070",fontStyle:"italic"}}>Sold</span>
                                : <button className="btn btn-sm" style={{background:"transparent",color:sc,border:`1px solid ${hexToRgba(sc,0.5)}`}} onClick={e=>{e.stopPropagation();setSelectedListing(l);setModal("detail");loadComments(l.id);setCommentText("");}}>View</button>
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {view === "browse" && (
                <div className="sidebar">
                  <AdSidebarSlot ads={ads} slot="sidebar-top" schoolId={activeSchoolId}/>
                  <AdSidebarSlot ads={ads} slot="school-sidebar" schoolId={activeSchoolId}/>
                  <AdSidebarSlot ads={ads} slot="sidebar-bottom" schoolId={activeSchoolId}/>
                </div>
              )}
            </div>
            </>)}

            {/* ── BOARD VIEW ── */}
            {view === "board" && (
              <div style={{maxWidth:720,paddingTop:"1.5rem"}}>
                <div style={{marginBottom:"2rem",paddingBottom:"1.5rem",borderBottom:`1px solid ${P.border}`}}>
                  <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"1.5rem",color:P.accentSoft,marginBottom:".3rem"}}>💬 Community Board</h2>
                  <p style={{fontSize:".82rem",color:P.muted}}>Ask questions, find items, share tips with your dance community.</p>
                </div>

                {/* Board filter */}
                <div className="board-filters">
                  <button className={`nav-pill ${boardSchoolId==="general"?"active":""}`} onClick={() => setBoardSchoolId("general")}>🌐 General</button>
                  {userSchools.map(us => {
                    const sc = getSchoolColor(us.school_id);
                    return (
                      <button key={us.school_id} className={`nav-pill ${boardSchoolId===us.school_id?"active":""}`}
                        style={boardSchoolId===us.school_id?{background:hexToRgba(sc,0.12),borderColor:sc,color:sc}:{}}
                        onClick={() => setBoardSchoolId(us.school_id)}>
                        🏫 {us.school_name}
                      </button>
                    );
                  })}
                </div>

                {/* New post form */}
                <div className="new-post-form">
                  <div style={{fontSize:".78rem",fontWeight:500,color:P.text,marginBottom:".75rem"}}>Start a new thread</div>
                  <div className="form-group"><input className="form-input" placeholder="Title — e.g. Anyone selling ballet shoes size UK 3?" value={newPost.title} onChange={e=>setNewPost(f=>({...f,title:e.target.value}))}/></div>
                  <div className="form-group" style={{marginBottom:".5rem"}}><textarea className="form-textarea" style={{minHeight:60}} placeholder="Add more detail..." value={newPost.message} onChange={e=>setNewPost(f=>({...f,message:e.target.value}))}/></div>
                  <button className="btn btn-primary btn-sm" onClick={handlePostBoard}>Post</button>
                </div>

                {/* Posts */}
                {boardPosts.filter(p => boardSchoolId === "general" ? !p.school_id : p.school_id === boardSchoolId).length === 0 && (
                  <div className="empty-state" style={{gridColumn:"auto"}}><div className="empty-state-icon">💬</div><h3>No posts yet</h3><p style={{marginTop:".5rem",fontSize:".83rem"}}>Be the first to post!</p></div>
                )}
                {boardPosts.filter(p => boardSchoolId === "general" ? !p.school_id : p.school_id === boardSchoolId).map(post => {
                  const replies = boardReplies.filter(r => r.post_id === post.id);
                  const isOpen = expandedPost === post.id;
                  const sc = post.school_id ? getSchoolColor(post.school_id) : P.accent;
                  return (
                    <div key={post.id} className="board-post" style={{borderLeft:`3px solid ${sc}`}}>
                      {editingBoardPost?.id === post.id ? (
                        <div style={{padding:".85rem 1rem"}}>
                          <div className="form-group"><input className="form-input" value={editingBoardPost.title} onChange={e=>setEditingBoardPost(f=>({...f,title:e.target.value}))} placeholder="Title"/></div>
                          <div className="form-group" style={{marginBottom:".5rem"}}><textarea className="form-textarea" style={{minHeight:60}} value={editingBoardPost.message} onChange={e=>setEditingBoardPost(f=>({...f,message:e.target.value}))} placeholder="Message"/></div>
                          <div style={{display:"flex",gap:".5rem"}}>
                            <button className="btn btn-primary btn-sm" onClick={() => handleUpdateBoardPost(post.id)}>Save</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setEditingBoardPost(null)}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                      <div className="board-post-header" onClick={() => setExpandedPost(isOpen ? null : post.id)}>
                        <div className="board-post-title">{post.title}</div>
                        <div className="board-post-meta">
                          <span style={{color:sc}}>{post.user_name}</span>
                          <span>{new Date(post.created_at).toLocaleDateString("en-GB")}</span>
                          <span>{replies.length} {replies.length===1?"reply":"replies"}</span>
                          {user?.email === post.user_email && <button style={{background:"none",border:"none",color:P.muted,cursor:"pointer",fontSize:".75rem",fontFamily:"'Jost',sans-serif"}} onClick={e=>{e.stopPropagation();setEditingBoardPost({id:post.id,title:post.title,message:post.message});}}>Edit</button>}
                          {(user?.email === post.user_email || isAdmin) && <button style={{background:"none",border:"none",color:"#e07070",cursor:"pointer",fontSize:".75rem",fontFamily:"'Jost',sans-serif"}} onClick={e=>{e.stopPropagation();handleDeletePost(post.id);}}>Remove</button>}
                          <span style={{color:P.muted}}>{isOpen?"▲":"▼"}</span>
                        </div>
                      </div>
                      )}
                      {isOpen && editingBoardPost?.id !== post.id && (
                        <>
                          <div className="board-post-body">{post.message}</div>
                          <div className="board-replies">
                            {replies.map(r => (
                              <div key={r.id} className="board-reply">
                                <div className="board-reply-author" style={{display:"flex",justifyContent:"space-between"}}>
                                  <span>{r.user_name}</span>
                                  <span style={{color:P.muted,fontWeight:400}}>{new Date(r.created_at).toLocaleDateString("en-GB")}</span>
                                </div>
                                <div style={{color:P.text}}>{r.message}</div>
                                {(user?.email === r.user_email || isAdmin) && <button style={{background:"none",border:"none",color:"#e07070",cursor:"pointer",fontSize:".72rem",fontFamily:"'Jost',sans-serif",marginTop:".25rem"}} onClick={() => handleDeleteReply(r.id)}>Remove</button>}
                              </div>
                            ))}
                            {user && (
                              <div className="comment-input-row" style={{marginTop:replies.length?".75rem":0}}>
                                <input className="form-input" placeholder="Write a reply..." value={replyText[post.id]||""} onChange={e=>setReplyText(t=>({...t,[post.id]:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&handlePostReply(post.id)} style={{flex:1}}/>
                                <button className="btn btn-primary btn-sm" onClick={() => handlePostReply(post.id)}>Reply</button>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── WANTED VIEW ── */}
            {view === "wanted" && (
              <div style={{maxWidth:720,paddingTop:"1.5rem"}}>
                <div style={{marginBottom:"2rem",paddingBottom:"1.5rem",borderBottom:`1px solid ${P.border}`}}>
                  <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"1.5rem",color:P.accentSoft,marginBottom:".3rem"}}>🔍 What's Needed</h2>
                  <p style={{fontSize:".82rem",color:P.muted}}>Post items you're looking for — sellers can contact you directly.</p>
                </div>

                {/* School filter */}
                <div className="board-filters">
                  <button className={`nav-pill ${wantedSchoolId==="general"?"active":""}`} onClick={() => setWantedSchoolId("general")}>🌐 All Schools</button>
                  {userSchools.map(us => {
                    const sc = getSchoolColor(us.school_id);
                    return (
                      <button key={us.school_id} className={`nav-pill ${wantedSchoolId===us.school_id?"active":""}`}
                        style={wantedSchoolId===us.school_id?{background:hexToRgba(sc,0.12),borderColor:sc,color:sc}:{}}
                        onClick={() => setWantedSchoolId(us.school_id)}>
                        🏫 {us.school_name}
                      </button>
                    );
                  })}
                </div>

                {/* Post form */}
                {user && (
                  <div className="new-post-form">
                    <div style={{fontSize:".78rem",fontWeight:500,color:P.text,marginBottom:".75rem"}}>Post what you're looking for</div>
                    <div className="form-group">
                      <input className="form-input" placeholder="What are you looking for? e.g. Ballet shoes size UK 4" value={wantedForm.title} onChange={e=>setWantedForm(f=>({...f,title:e.target.value}))}/>
                    </div>
                    <div className="form-row" style={{marginBottom:".75rem"}}>
                      <select className="form-select" value={wantedForm.style} onChange={e=>setWantedForm(f=>({...f,style:e.target.value}))}>
                        <option value="">Any dance style</option>
                        {danceStyles.map(s=><option key={s} value={s}>{s}</option>)}
                      </select>
                      <select className="form-select" value={wantedForm.size} onChange={e=>setWantedForm(f=>({...f,size:e.target.value}))}>
                        <option value="">Any size</option>
                        {sizes.map(s=><option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{marginBottom:".5rem"}}>
                      <textarea className="form-textarea" style={{minHeight:52}} placeholder="Extra details (optional)..." value={wantedForm.description} onChange={e=>setWantedForm(f=>({...f,description:e.target.value}))}/>
                    </div>
                    <div className="form-group" style={{marginBottom:".75rem"}}>
                      <label className="upload-area" style={{padding:".6rem"}}>
                        <input type="file" accept="image/*" multiple onChange={e=>handleWantedImageUpload(e,setWantedForm)}/>
                        📷 Add reference photos (optional, up to 3)
                      </label>
                      {wantedForm.images.length > 0 && (
                        <div className="multi-upload-grid" style={{marginTop:".5rem"}}>
                          {wantedForm.images.map((img,i) => (
                            <div key={i} className="multi-upload-thumb">
                              <img src={img} alt=""/>
                              <button className="multi-upload-remove" onClick={()=>removeWantedImage(i,setWantedForm)}>×</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={handlePostWanted}>Post request</button>
                  </div>
                )}

                {/* Posts */}
                {wantedPosts.filter(p => wantedSchoolId === "general" ? true : p.school_id === wantedSchoolId).length === 0 && (
                  <div className="empty-state" style={{gridColumn:"auto"}}><div className="empty-state-icon">🔍</div><h3>No requests yet</h3><p style={{marginTop:".5rem",fontSize:".83rem"}}>Be the first to post what you need!</p></div>
                )}
                {wantedPosts.filter(p => wantedSchoolId === "general" ? true : p.school_id === wantedSchoolId).map(post => {
                  const sc = post.school_id ? getSchoolColor(post.school_id) : P.accent;
                  return (
                    <div key={post.id} className={`wanted-post ${post.fulfilled?"fulfilled":""}`} style={{borderLeft:`3px solid ${sc}`}}>
                      {editingWanted?.id === post.id ? (
                        <>
                          <div className="form-group"><input className="form-input" value={editingWanted.title} onChange={e=>setEditingWanted(f=>({...f,title:e.target.value}))} placeholder="What are you looking for?"/></div>
                          <div className="form-row" style={{marginBottom:".5rem"}}>
                            <select className="form-select" value={editingWanted.style} onChange={e=>setEditingWanted(f=>({...f,style:e.target.value}))}>
                              <option value="">Any dance style</option>
                              {danceStyles.map(s=><option key={s} value={s}>{s}</option>)}
                            </select>
                            <select className="form-select" value={editingWanted.size} onChange={e=>setEditingWanted(f=>({...f,size:e.target.value}))}>
                              <option value="">Any size</option>
                              {sizes.map(s=><option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div className="form-group" style={{marginBottom:".5rem"}}><textarea className="form-textarea" style={{minHeight:48}} value={editingWanted.description} onChange={e=>setEditingWanted(f=>({...f,description:e.target.value}))} placeholder="Extra details..."/></div>
                          <div className="form-group" style={{marginBottom:".5rem"}}>
                            <label className="upload-area" style={{padding:".5rem"}}>
                              <input type="file" accept="image/*" multiple onChange={e=>handleWantedImageUpload(e,setEditingWanted)}/>
                              📷 Add/replace photos (up to 3)
                            </label>
                            {editingWanted.images?.length > 0 && (
                              <div className="multi-upload-grid" style={{marginTop:".4rem"}}>
                                {editingWanted.images.map((img,i) => (
                                  <div key={i} className="multi-upload-thumb">
                                    <img src={img} alt=""/>
                                    <button className="multi-upload-remove" onClick={()=>removeWantedImage(i,setEditingWanted)}>×</button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div style={{display:"flex",gap:".5rem"}}>
                            <button className="btn btn-primary btn-sm" onClick={() => handleUpdateWanted(post.id)}>Save</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setEditingWanted(null)}>Cancel</button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:".5rem"}}>
                            <div className="wanted-post-title">{post.title}</div>
                            {post.fulfilled && <span className="wanted-fulfilled-badge">✓ Found</span>}
                          </div>
                          {(post.dance_style || post.size) && (
                            <div className="wanted-post-tags">
                              {post.dance_style && <span className="tag tag-style">{post.dance_style}</span>}
                              {post.size && <span className="tag tag-size">{post.size}</span>}
                            </div>
                          )}
                          {post.description && <div className="wanted-post-desc">{post.description}</div>}
                          {post.images?.length > 0 && (
                            <div className="image-gallery" style={{marginTop:".5rem",marginBottom:".25rem"}}>
                              {post.images.map((img,i) => (
                                <img key={i} src={img} alt="" style={{height:100,width:"auto",minWidth:100,objectFit:"cover",borderRadius:6,cursor:"zoom-in",flexShrink:0}} onClick={()=>setLightboxImage(img)}/>
                              ))}
                            </div>
                          )}
                          <div className="wanted-post-meta">
                            <span style={{color:sc}}>{post.user_name}</span>
                            <span>{new Date(post.created_at).toLocaleDateString("en-GB")}</span>
                            {post.school_id && <span>🏫 {schools.find(s=>s.id===post.school_id)?.name}</span>}
                            {user?.email === post.user_email && !post.fulfilled && (
                              <button style={{background:"none",border:"none",color:P.accent,cursor:"pointer",fontSize:".72rem",fontFamily:"'Jost',sans-serif"}} onClick={() => setEditingWanted({id:post.id,title:post.title,style:post.dance_style||"",size:post.size||"",description:post.description||"",images:post.images||[]})}>Edit</button>
                            )}
                            {user?.email === post.user_email && !post.fulfilled && (
                              <button style={{background:"none",border:"none",color:P.success,cursor:"pointer",fontSize:".72rem",fontFamily:"'Jost',sans-serif"}} onClick={() => handleFulfillWanted(post.id, post.fulfilled)}>✓ Mark as found</button>
                            )}
                            {user?.email === post.user_email && post.fulfilled && (
                              <button style={{background:"none",border:"none",color:P.muted,cursor:"pointer",fontSize:".72rem",fontFamily:"'Jost',sans-serif"}} onClick={() => handleFulfillWanted(post.id, post.fulfilled)}>Reopen</button>
                            )}
                            {(user?.email === post.user_email || isAdmin) && (
                              <button style={{background:"none",border:"none",color:"#e07070",cursor:"pointer",fontSize:".72rem",fontFamily:"'Jost',sans-serif"}} onClick={() => handleDeleteWanted(post.id)}>Remove</button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* NOTIFICATION PANEL */}
      {showFairyPanel && (
        <>
          <div style={{position:"fixed",inset:0,zIndex:149}} onClick={() => setShowFairyPanel(false)}/>
          <div className="fairy-panel" onClick={e=>e.stopPropagation()}>
            {/* Header with tabs */}
            <div className="fairy-panel-header">
              <div className="fairy-tabs">
                <button className={`fairy-tab-btn ${fairyTab==="chat"?"active":""}`} onClick={()=>setFairyTab("chat")}>✨ {fairyName}</button>
                <button className={`fairy-tab-btn ${fairyTab==="notifs"?"active":""}`} onClick={()=>setFairyTab("notifs")}>
                  🔔 {notifications.filter(n=>!n.read).length > 0 ? `(${notifications.filter(n=>!n.read).length})` : "Notifications"}
                </button>
              </div>
              <button style={{background:"none",border:"none",color:P.muted,cursor:"pointer",fontSize:"1.1rem",lineHeight:1,padding:".1rem .2rem"}} onClick={()=>setShowFairyPanel(false)}>×</button>
            </div>

            {/* Chat tab */}
            {fairyTab === "chat" && (
              <>
                {fairyMessages.length > 0 && (
                  <div style={{padding:".3rem .85rem",borderBottom:`1px solid ${P.border}`,display:"flex",justifyContent:"flex-end",flexShrink:0}}>
                    <button className="text-link" style={{fontSize:".68rem",color:"#e07070"}} onClick={clearFairyHistory}>Clear history</button>
                  </div>
                )}
                <div className="fairy-chat-body">
                  {fairyMessages.length === 0 && (
                    <div className="fairy-greeting">Hi! I'm {fairyName} ✨ Tell me what you're looking for and I'll search the listings for you!</div>
                  )}
                  {fairyMessages.map((msg, i) => (
                    msg.role === "user"
                      ? <div key={i} className="fairy-msg-user">{msg.text}</div>
                      : <div key={i} className="fairy-msg-fairy">
                          <div>{msg.text}</div>
                          {msg.matches && msg.matches.length > 0 && (
                            <div style={{marginTop:".5rem"}}>
                              <div style={{fontSize:".7rem",color:P.muted,marginBottom:".3rem"}}>Found {msg.matches.length} listing{msg.matches.length>1?"s":""}:</div>
                              {msg.matches.map(l => (
                                <div key={l.id} className="fairy-match-item" onClick={()=>{setSelectedListing(l);setModal("detail");loadComments(l.id);setCommentText("");setShowFairyPanel(false);}}>
                                  <div className="fairy-match-title">{l.title} — £{l.price}</div>
                                  <div className="fairy-match-meta">{[l.style,l.size,l.condition].filter(Boolean).join(" · ")}</div>
                                </div>
                              ))}
                            </div>
                          )}
                          {msg.matches && msg.matches.length === 0 && msg.watchSaved && (
                            <div style={{fontSize:".72rem",color:P.muted,marginTop:".35rem"}}>I've saved this as a watch — I'll notify you when something matching comes in! 🧚</div>
                          )}
                        </div>
                  ))}
                  {fairySearching && <div className="fairy-searching">✨ Searching the listings…</div>}
                </div>
                {!user ? (
                  <div style={{padding:".65rem 1rem",borderTop:`1px solid ${P.border}`,fontSize:".76rem",color:P.muted,textAlign:"center"}}>
                    <button className="text-link" onClick={()=>{setModal("auth");setAuthTab("login");setShowFairyPanel(false);}}>Sign in</button> to ask {fairyName}
                  </div>
                ) : (
                  <div className="fairy-input-row">
                    <input className="form-input" placeholder={`Ask ${fairyName}…`} value={fairyChatInput} onChange={e=>setFairyChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&fairySearch()} autoFocus/>
                    <button className="btn btn-primary btn-sm" onClick={fairySearch} disabled={fairySearching}>✨</button>
                  </div>
                )}
              </>
            )}

            {/* Notifications tab */}
            {fairyTab === "notifs" && (
              <>
                <div style={{flex:1,overflowY:"auto",minHeight:0}}>
                  {notifications.length === 0 ? (
                    <div className="notif-empty">No notifications yet — {fairyName} is watching! 🧚</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`notif-item ${n.read?"":"unread"}`} onClick={()=>handleNotificationClick(n)} style={{position:"relative"}}>
                        <button style={{position:"absolute",top:".35rem",right:".35rem",background:"none",border:"none",color:P.muted,cursor:"pointer",fontSize:".85rem",lineHeight:1,padding:"0 .15rem"}} onClick={e=>deleteNotification(e,n.id)} title="Remove">×</button>
                        <div className="notif-item-title" style={{paddingRight:"1rem"}}>{n.title}</div>
                        {n.body && <div className="notif-item-body">{n.body}</div>}
                        <div className="notif-item-time">{new Date(n.created_at).toLocaleDateString("en-GB")} {new Date(n.created_at).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}</div>
                      </div>
                    ))
                  )}
                </div>
                {notifications.length > 0 && (
                  <div style={{padding:".5rem .85rem",borderTop:`1px solid ${P.border}`,display:"flex",gap:".5rem",flexShrink:0}}>
                    {notifications.some(n=>!n.read) && <button className="text-link" style={{fontSize:".7rem"}} onClick={markAllNotificationsRead}>Mark all read</button>}
                    <button className="text-link" style={{fontSize:".7rem",color:"#e07070"}} onClick={clearAllNotifications}>Clear all</button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* AUTH MODAL */}
      {modal === "auth" && (
        <div className="overlay" onClick={closeModal}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">Welcome to TutuTrade</div><button className="modal-close" onClick={closeModal}>×</button></div>
            <div className="modal-body">
              <div className="auth-tabs">
                <button className={`auth-tab ${authTab==="login"?"active":""}`} onClick={()=>setAuthTab("login")}>Sign In</button>
                <button className={`auth-tab ${authTab==="register"?"active":""}`} onClick={()=>setAuthTab("register")}>Join</button>
              </div>
              {authTab==="register" && <div className="school-code-info">🔑 You need a school code from your dance school to join.</div>}
              {authError && <div className="form-error" style={{marginBottom:"1rem"}}>⚠ {authError}</div>}
              {authTab==="register" && <div className="form-group"><label className="form-label">Your name</label><input className="form-input" placeholder="e.g. Sarah Mitchell" value={authForm.name} onChange={e=>setAuthForm(f=>({...f,name:e.target.value}))}/></div>}
              <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" placeholder="you@example.com" value={authForm.email} onChange={e=>setAuthForm(f=>({...f,email:e.target.value}))}/></div>
              <div className="form-group"><label className="form-label">Password</label><input className="form-input" type="password" placeholder={authTab==="register"?"Create a password":"Your password"} value={authForm.password} onChange={e=>setAuthForm(f=>({...f,password:e.target.value}))}/></div>
              {authTab==="register" && (
                <div className="form-group">
                  <label className="form-label">School code</label>
                  <input className="form-input" placeholder="Enter your school code" value={authForm.schoolCode} onChange={e=>setAuthForm(f=>({...f,schoolCode:e.target.value}))}/>
                  <div className="form-hint">Ask your dance school admin for the code</div>
                </div>
              )}
              <button className="btn btn-primary" style={{width:"100%",padding:".72rem"}} onClick={authTab==="register"?handleRegister:handleLogin}>{authTab==="register"?"Create account":"Sign in"}</button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE LISTING MODAL */}
      {modal === "create" && (
        <div className="overlay" onClick={closeModal}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">List an item</div><button className="modal-close" onClick={closeModal}>×</button></div>
            <div className="modal-body">
              {createError && <div className="form-error" style={{marginBottom:"1rem"}}>⚠ {createError}</div>}
              <div className="form-group"><label className="form-label">Item title *</label><input className="form-input" placeholder="e.g. Pink Ballet Tutu" value={createForm.title} onChange={e=>setCreateForm(f=>({...f,title:e.target.value}))}/></div>
              <div className="form-group">
                <label className="form-label">Visibility *</label>
                <select className="form-select" value={createForm.schoolId} onChange={e=>setCreateForm(f=>({...f,schoolId:e.target.value}))}>
                  <option value="">Select...</option>
                  <option value="general">🌐 General — visible to all TutuTrade members</option>
                  {userSchools.map(us => <option key={us.school_id} value={us.school_id}>🏫 {us.school_name} only</option>)}
                </select>
                <div className="form-hint">General listings are visible to all logged-in users. School listings are only visible to that school's members.</div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Dance style *</label><select className="form-select" value={createForm.style} onChange={e=>setCreateForm(f=>({...f,style:e.target.value}))}><option value="">Select...</option>{danceStyles.map(s=><option key={s}>{s}</option>)}</select></div>
                <div className="form-group">
                  <label className="form-label">Item type *</label>
                  <select className="form-select" value={createForm.itemType} onChange={e=>setCreateForm(f=>({...f,itemType:e.target.value,size:""}))}>
                    <option value="">Select...</option>
                    {ITEM_TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              {createForm.itemType && (
                <div className="form-group">
                  <label className="form-label">
                    {createForm.itemType === "Footwear" ? "Shoe size *" : createForm.itemType === "Clothing" ? "Clothing size *" : "Size"}
                  </label>
                  {createForm.itemType === "Accessories / Other" ? (
                    <select className="form-select" value={createForm.size} onChange={e=>setCreateForm(f=>({...f,size:e.target.value}))}>
                      <option value="N/A">N/A — not applicable</option>
                    </select>
                  ) : createForm.itemType === "Footwear" ? (
                    <select className="form-select" value={createForm.size} onChange={e=>setCreateForm(f=>({...f,size:e.target.value}))}>
                      <option value="">Select shoe size...</option>
                      {SHOE_SIZES.map(s=><option key={s}>{s}</option>)}
                    </select>
                  ) : (
                    <select className="form-select" value={createForm.size} onChange={e=>setCreateForm(f=>({...f,size:e.target.value}))}>
                      <option value="">Select clothing size...</option>
                      {sizes.map(s=><option key={s}>{s}</option>)}
                    </select>
                  )}
                </div>
              )}
              <div className="form-row">
                <div className="form-group"><label className="form-label">Condition *</label><select className="form-select" value={createForm.condition} onChange={e=>setCreateForm(f=>({...f,condition:e.target.value}))}><option value="">Select...</option>{conditions.map(c=><option key={c}>{c}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Price (£) *</label><input className="form-input" type="number" min="1" placeholder="25" value={createForm.price} onChange={e=>setCreateForm(f=>({...f,price:e.target.value}))}/></div>
              </div>
              {createForm.price && !isNaN(createForm.price) && Number(createForm.price) > 0 && (() => {
                const eff = getCommission(createForm.schoolId);
                return (
                  <div className="commission-box">
                    <div className="commission-row"><span className="commission-label">Listing price</span><span className="commission-value">£{Number(createForm.price).toFixed(2)}</span></div>
                    <div className="commission-row"><span className="commission-label">Platform fee ({eff}%)</span><span className="commission-value">−£{calcFees(Number(createForm.price),eff).commission}</span></div>
                    <div className="commission-row total"><span>You receive</span><span>£{calcFees(Number(createForm.price),eff).sellerReceives}</span></div>
                  </div>
                );
              })()}
              <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" placeholder="Describe the item, any wear, original price..." value={createForm.description} onChange={e=>setCreateForm(f=>({...f,description:e.target.value}))}/></div>
              <div className="form-group">
                <label className="form-label">Photos (up to 5)</label>
                <label className="upload-area">
                  <input type="file" accept="image/*" multiple onChange={handleMultiImageUpload}/>
                  <div>📷 Click to upload photos (select multiple)</div>
                </label>
                {createForm.images && createForm.images.length > 0 && (
                  <div className="multi-upload-grid" style={{marginTop:".5rem"}}>
                    {createForm.images.map((img, i) => (
                      <div key={i} className="multi-upload-thumb">
                        <img src={img} alt={`photo ${i+1}`}/>
                        <button className="multi-upload-remove" onClick={() => removeImage(i)}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button className="btn btn-primary" style={{width:"100%",padding:".72rem"}} onClick={handleCreate}>Publish listing</button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {modal === "detail" && selectedListing && (() => {
        const effectiveCommission = getCommission(selectedListing.school_id);
        const { commission } = calcFees(selectedListing.price, effectiveCommission);
        const isOwner = user?.email === selectedListing.seller_email || isAdmin;
        const sc = getSchoolColor(selectedListing.school_id);
        return (
          <div className="overlay" onClick={closeModal}>
            <div className="modal" onClick={e=>e.stopPropagation()} style={{borderTop:`3px solid ${sc}`}}>
              <div className="modal-header"><div className="modal-title">{selectedListing.title}</div><button className="modal-close" onClick={closeModal}>×</button></div>
              <div className="modal-body">
                {/* Image gallery */}
                {selectedListing.images && selectedListing.images.length > 1 ? (
                  <div className="image-gallery">
                    {selectedListing.images.map((img, i) => (
                      <img key={i} src={img} alt={`${selectedListing.title} ${i+1}`} onClick={() => setLightboxImage(img)}/>
                    ))}
                  </div>
                ) : (
                  <div className="detail-image" style={{cursor:(selectedListing.image||selectedListing.images?.[0])?"zoom-in":"default"}} onClick={()=>{const img=selectedListing.image||selectedListing.images?.[0];if(img)setLightboxImage(img);}}>
                    {(selectedListing.image||selectedListing.images?.[0])?<img src={selectedListing.image||selectedListing.images?.[0]} alt={selectedListing.title} className="image-gallery-single"/>:styleEmoji[selectedListing.style]||"👗"}
                  </div>
                )}
                <div className="detail-tags">
                  <span className="tag tag-style">{selectedListing.style}</span>
                  <span className="tag tag-size">{selectedListing.size}</span>
                  <span className={`condition-pill condition-${conditionKey[selectedListing.condition]||"good"}`} style={{position:"static"}}>{selectedListing.condition}</span>
                </div>
                <div className="detail-price">£{selectedListing.price}</div>
                <p className="detail-desc">{selectedListing.description||"No description provided."}</p>
                <div className="seller-info">
                  <div><strong>Seller:</strong> {selectedListing.seller_name}</div>
                  <div style={{marginTop:".18rem",fontSize:".73rem"}}>
                    📍 {selectedListing.school_id
                      ? <span style={{color:sc}}>{selectedListing.school_name}</span>
                      : <span className="general-badge">🌐 General listing</span>
                    }
                  </div>
                </div>
                {!isOwner && (
                  <div className="commission-box">
                    <div className="commission-row"><span className="commission-label">Item price</span><span className="commission-value">£{selectedListing.price}</span></div>
                    <div className="commission-row"><span className="commission-label">Platform fee ({effectiveCommission}%)</span><span className="commission-value">£{commission}</span></div>
                    <div className="commission-row total"><span>You pay</span><span>£{selectedListing.price}</span></div>
                    <div style={{fontSize:".67rem",color:P.muted,marginTop:".35rem"}}>Payment is processed securely via PayPal. The seller will receive their payout within 24 hours of sale.</div>
                  </div>
                )}
                {isOwner ? (
                  <div style={{display:"flex",flexDirection:"column",gap:".5rem"}}>
                    {!selectedListing.sold
                      ? <button className="btn btn-success" style={{width:"100%",padding:".72rem"}} onClick={()=>handleMarkSold(selectedListing.id)}>✓ Mark as sold</button>
                      : <button className="btn btn-ghost" style={{width:"100%",padding:".72rem"}} onClick={()=>handleMarkUnsold(selectedListing.id)}>↩ Relist item</button>
                    }
                    <button className="btn btn-outline" style={{width:"100%"}} onClick={()=>openEditListing(selectedListing)}>✏ Edit listing</button>
                    <button className="btn btn-danger" style={{width:"100%"}} onClick={()=>handleDelete(selectedListing.id)}>Remove listing</button>
                  </div>
                ) : (
                  <a href={`https://www.paypal.com/paypalme/grantchaplin/${selectedListing.price}GBP`} target="_blank" rel="noopener noreferrer" style={{textDecoration:"none"}}>
                    <button className="paypal-btn">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 0 0-.794.68l-.04.22-.63 3.993-.032.17a.804.804 0 0 1-.794.679H7.72a.483.483 0 0 1-.477-.558L7.418 21h1.518l.95-6.02h1.385c4.678 0 7.75-2.203 8.796-6.502zm-2.96-5.09c.762.868.983 1.81.755 3.137-.093.534-.26 1.02-.5 1.46-.838-3.511-3.235-4.7-7.438-4.7H5.964l.947-5.951A.483.483 0 0 1 7.388 1h5.787c3.44 0 5.58 1.03 6.557 3.019l-.625-.631z"/></svg>
                      Pay £{selectedListing.price} with PayPal
                    </button>
                  </a>
                )}
                {!user && <p style={{textAlign:"center",fontSize:".76rem",color:P.muted,marginTop:".7rem"}}><button className="text-link" onClick={()=>{setModal("auth");setAuthTab("login");}}>Sign in</button> to purchase</p>}

                {/* COMMENTS */}
                {user && (
                  <div className="comments-section">
                    <div className="comments-title">💬 Questions & Comments ({comments.filter(c=>!c.parent_id).length})</div>
                    {comments.filter(c => !c.parent_id).map(c => {
                      const replies = comments.filter(r => r.parent_id === c.id);
                      return (
                        <div key={c.id} className="comment-item">
                          <div className="comment-header">
                            <span className="comment-author">{c.user_name}</span>
                            <div style={{display:"flex",alignItems:"center",gap:".5rem"}}>
                              <span className="comment-time">{new Date(c.created_at).toLocaleDateString("en-GB")}</span>
                              {(user.email === c.user_email || isAdmin) && <button style={{background:"none",border:"none",color:"#e07070",cursor:"pointer",fontSize:".75rem"}} onClick={()=>handleDeleteComment(c.id)}>×</button>}
                            </div>
                          </div>
                          <div className="comment-text">{c.message}</div>
                          {/* Replies */}
                          {replies.map(r => (
                            <div key={r.id} className="comment-reply-item">
                              <div className="comment-reply-author" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                                <span>↩ {r.user_name}</span>
                                <div style={{display:"flex",gap:".4rem",alignItems:"center"}}>
                                  <span style={{fontSize:".68rem",color:P.muted}}>{new Date(r.created_at).toLocaleDateString("en-GB")}</span>
                                  {(user.email === r.user_email || isAdmin) && <button style={{background:"none",border:"none",color:"#e07070",cursor:"pointer",fontSize:".75rem"}} onClick={()=>handleDeleteComment(r.id)}>×</button>}
                                </div>
                              </div>
                              <div style={{color:P.text}}>{r.message}</div>
                            </div>
                          ))}
                          {/* Reply input */}
                          {replyingTo === c.id ? (
                            <div className="comment-input-row" style={{marginTop:".5rem"}}>
                              <input className="form-input" placeholder="Write a reply..." value={commentReplyText} onChange={e=>setCommentReplyText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handlePostCommentReply(c.id)} style={{flex:1}} autoFocus/>
                              <button className="btn btn-primary btn-sm" onClick={()=>handlePostCommentReply(c.id)}>Reply</button>
                              <button className="btn btn-ghost btn-sm" onClick={()=>{setReplyingTo(null);setCommentReplyText("");}}>Cancel</button>
                            </div>
                          ) : (
                            <button className="comment-reply-btn" onClick={()=>{setReplyingTo(c.id);setCommentReplyText("");}}>↩ Reply</button>
                          )}
                        </div>
                      );
                    })}
                    {comments.filter(c=>!c.parent_id).length === 0 && <p style={{fontSize:".78rem",color:P.muted,marginBottom:".5rem"}}>No comments yet — be the first to ask!</p>}
                    <div className="comment-input-row">
                      <input className="form-input" placeholder="Ask a question..." value={commentText} onChange={e=>setCommentText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handlePostComment()} style={{flex:1}}/>
                      <button className="btn btn-primary btn-sm" onClick={handlePostComment}>Post</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* EDIT LISTING MODAL */}
      {modal === "editListing" && selectedListing && (
        <div className="overlay" onClick={closeModal}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">Edit listing</div><button className="modal-close" onClick={closeModal}>×</button></div>
            <div className="modal-body">
              {editError && <div className="form-error" style={{marginBottom:"1rem"}}>⚠ {editError}</div>}
              <div className="form-group"><label className="form-label">Item title *</label><input className="form-input" value={editForm.title} onChange={e=>setEditForm(f=>({...f,title:e.target.value}))}/></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Dance style *</label><select className="form-select" value={editForm.style} onChange={e=>setEditForm(f=>({...f,style:e.target.value}))}><option value="">Select...</option>{danceStyles.map(s=><option key={s}>{s}</option>)}</select></div>
                <div className="form-group">
                  <label className="form-label">Item type</label>
                  <select className="form-select" value={editForm.itemType} onChange={e=>setEditForm(f=>({...f,itemType:e.target.value,size:""}))}>
                    {ITEM_TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{editForm.itemType==="Footwear"?"Shoe size":"Clothing size"}</label>
                {editForm.itemType==="Accessories / Other" ? (
                  <input className="form-input" value="N/A" disabled/>
                ) : editForm.itemType==="Footwear" ? (
                  <select className="form-select" value={editForm.size} onChange={e=>setEditForm(f=>({...f,size:e.target.value}))}><option value="">Select...</option>{SHOE_SIZES.map(s=><option key={s}>{s}</option>)}</select>
                ) : (
                  <select className="form-select" value={editForm.size} onChange={e=>setEditForm(f=>({...f,size:e.target.value}))}><option value="">Select...</option>{sizes.map(s=><option key={s}>{s}</option>)}</select>
                )}
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Condition *</label><select className="form-select" value={editForm.condition} onChange={e=>setEditForm(f=>({...f,condition:e.target.value}))}><option value="">Select...</option>{conditions.map(c=><option key={c}>{c}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Price (£) *</label><input className="form-input" type="number" min="1" value={editForm.price} onChange={e=>setEditForm(f=>({...f,price:e.target.value}))}/></div>
              </div>
              {editForm.price && !isNaN(editForm.price) && Number(editForm.price) > 0 && (() => {
                const eff = getCommission(selectedListing.school_id);
                return (
                  <div className="commission-box">
                    <div className="commission-row"><span className="commission-label">Listing price</span><span className="commission-value">£{Number(editForm.price).toFixed(2)}</span></div>
                    <div className="commission-row"><span className="commission-label">Platform fee ({eff}%)</span><span className="commission-value">−£{calcFees(Number(editForm.price),eff).commission}</span></div>
                    <div className="commission-row total"><span>You receive</span><span>£{calcFees(Number(editForm.price),eff).sellerReceives}</span></div>
                  </div>
                );
              })()}
              <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={editForm.description} onChange={e=>setEditForm(f=>({...f,description:e.target.value}))}/></div>
              <div className="form-group">
                <label className="form-label">Photos ({(editForm.images||[]).length}/5)</label>
                {editForm.images && editForm.images.length > 0 && (
                  <div className="multi-upload-grid" style={{marginBottom:".5rem"}}>
                    {editForm.images.map((img,i) => (
                      <div key={i} className="multi-upload-thumb">
                        <img src={img} alt={`photo ${i+1}`}/>
                        <button className="multi-upload-remove" onClick={()=>removeEditImage(i)}>×</button>
                      </div>
                    ))}
                  </div>
                )}
                {(editForm.images||[]).length < 5 && (
                  <label className="upload-area">
                    <input type="file" accept="image/*" multiple onChange={handleEditMultiImageUpload}/>
                    <div>📷 Add more photos</div>
                  </label>
                )}
              </div>
              <button className="btn btn-primary" style={{width:"100%",padding:".72rem"}} onClick={handleUpdateListing}>Save changes</button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX */}
      {lightboxImage && (
        <div className="lightbox" onClick={() => setLightboxImage(null)}>
          <button className="lightbox-close" onClick={() => setLightboxImage(null)}>×</button>
          <img src={lightboxImage} alt="Full size" onClick={e => e.stopPropagation()}/>
        </div>
      )}

      {/* EDIT AD MODAL */}
      {modal === "editAd" && (
        <div className="overlay" onClick={closeModal}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title admin-title">{editingAd==="new"?"Add Advertiser":"Edit Advertiser"}</div><button className="modal-close" onClick={closeModal}>×</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Brand name *</label><input className="form-input" placeholder="e.g. Freed of London" value={adForm.title} onChange={e=>setAdForm(f=>({...f,title:e.target.value}))}/></div>
              <div className="form-group"><label className="form-label">Tagline</label><input className="form-input" placeholder="e.g. Professional dancewear since 1929" value={adForm.tagline} onChange={e=>setAdForm(f=>({...f,tagline:e.target.value}))}/></div>
              <div className="form-group"><label className="form-label">Website URL *</label><input className="form-input" placeholder="https://..." value={adForm.url} onChange={e=>setAdForm(f=>({...f,url:e.target.value}))}/></div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Ad position</label>
                  <select className="form-select" value={adForm.slot} onChange={e=>setAdForm(f=>({...f,slot:e.target.value}))}>
                    <optgroup label="Global positions">
                      <option value="sidebar-top">Sidebar — Top</option>
                      <option value="sidebar-bottom">Sidebar — Bottom</option>
                    </optgroup>
                    <optgroup label="School positions">
                      <option value="school-above-countdown">School — Above countdown</option>
                      <option value="school-sidebar">School — Sidebar</option>
                    </optgroup>
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Status</label><select className="form-select" value={adForm.active?"true":"false"} onChange={e=>setAdForm(f=>({...f,active:e.target.value==="true"}))}><option value="true">Live</option><option value="false">Paused</option></select></div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Display order</label>
                  <input className="form-input" type="number" min="0" max="99" placeholder="0" value={adForm.sort_order} onChange={e=>setAdForm(f=>({...f,sort_order:e.target.value}))}/>
                  <div className="form-hint">Lower number = shown first. Use 1, 2, 3 to control order within the same slot.</div>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Where to show</label>
                <select className="form-select" value={adForm.scope||"global"} onChange={e=>setAdForm(f=>({...f,scope:e.target.value,school_id:null}))}>
                  <option value="global">🌐 Global — all logged-in users</option>
                  <option value="school">🏫 Specific school only</option>
                  <option value="both">✨ Both — global + specific school</option>
                </select>
              </div>
              {(adForm.scope === "school" || adForm.scope === "both") && (
                <div className="form-group">
                  <label className="form-label">Select school</label>
                  <select className="form-select" value={adForm.school_id||""} onChange={e=>setAdForm(f=>({...f,school_id:e.target.value}))}>
                    <option value="">Select school...</option>
                    {schools.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}
              <div style={{padding:".65rem .85rem",background:hexToRgba(P.accent,0.07),border:`1px solid ${hexToRgba(P.accent,0.2)}`,borderRadius:7,fontSize:".75rem",color:P.muted,marginBottom:"1rem"}}>
                💡 <strong style={{color:P.accent}}>Recommended graphic sizes:</strong><br/>
                Sidebar top/bottom: <strong style={{color:P.text}}>220 × 250px</strong><br/>
                School above countdown: <strong style={{color:P.text}}>600 × 80px</strong><br/>
                School sidebar: <strong style={{color:P.text}}>220 × 250px</strong><br/>
                Supply PNG or JPG at 2× resolution for crisp display on retina screens.
              </div>
              <div className="form-group">
                <label className="form-label">Logo / image</label>
                <label className="upload-area"><input type="file" accept="image/*" onChange={e=>handleImageUpload(e,setAdForm)}/>{adForm.image?<img src={adForm.image} className="upload-preview" alt="ad preview"/>:<div>🖼 Click to upload logo or image</div>}</label>
              </div>
              <button className="btn btn-primary" style={{width:"100%",padding:".72rem"}} onClick={handleSaveAd}>{editingAd==="new"?"Add advertiser":"Save changes"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
