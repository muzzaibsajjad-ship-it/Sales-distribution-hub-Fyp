import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/BKP-Logo.png";
import { submitDistributorApplicationApi } from "../api/api";
import {
  FiMapPin, FiPhone, FiMail, FiClock,
  FiArrowRight, FiSend, FiPackage, FiAward, FiTruck,
  FiFacebook, FiInstagram, FiTwitter, FiYoutube,
  FiChevronRight,
} from "react-icons/fi";

/* ─────────────────────────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────────────────────────── */

const categories = [
  { id: "all",        label: "All Products",  icon: "✦", img: "Main Image.jpeg" },
  { id: "pasta",      label: "Pasta",          icon: "🍝", img: "Chicken-Chowmien-Spaghetti.png" },
  { id: "sauces",     label: "Sauces",         icon: "🫙", img: "Red-Sauce-Mix.png" },
  { id: "spices",     label: "Spices",         icon: "🌶", img: "Chat-Masala.png" },
  { id: "vermicelli", label: "Vermicelli",     icon: "🍜", img: "plain-vermicelli-500-x-500.png" },
  { id: "beverages",  label: "Beverages",      icon: "🥤", img: "Jam-e-Mashriq.png" },
];

const products = [
  { name: "Wheat Bar-B-Que Macaroni",    img: "Wheat Bar-B-Que-Macaroni.png",       category: "pasta" },
  { name: "Achari Macaroni",             img: "Achari-Macaroni.png",                category: "pasta" },
  { name: "Tikka Macaroni",              img: "Tikka-Macaroni.png",                 category: "pasta" },
  { name: "Chicken Chowmein",            img: "Chicken-Chowmien-Spaghetti.png",     category: "pasta" },
  { name: "Red Sauce Mix",               img: "Red-Sauce-Mix.png",                  category: "sauces" },
  { name: "White Sauce Mix",             img: "White-Sauce-Mix.png",                category: "sauces" },
  { name: "Khowsuey",                    img: "KHOWSUEY-1.png",                     category: "pasta" },
  { name: "Elbow Macaroni",              img: "big-elbow-macroni-1.png",            category: "pasta" },
  { name: "Penne Plain",                 img: "BIG-PENNE-PLAIN.png",               category: "pasta" },
  { name: "Ring Macaroni",               img: "Ring-Macaroni.png",                  category: "pasta" },
  { name: "Chowmein Hakka Noodles",      img: "Chowmein-Hakka-Noodles.png",         category: "pasta" },
  { name: "Chat Masala",                 img: "Chat-Masala.png",                    category: "spices" },
  { name: "Long Macaroni",               img: "LONG-MAC-1.png",                    category: "pasta" },
  { name: "Big Elbow",                   img: "BIG-ELBOW-2.png",                   category: "pasta" },
  { name: "Plain Vermicelli",            img: "plain-vermicelli-500-x-500.png",    category: "vermicelli" },
  { name: "Spiral Macaroni",             img: "Spiral Macaroni.png",               category: "pasta" },
  { name: "Twisted Macaroni",            img: "Twisted Macaroni.png",              category: "pasta" },
  { name: "Three Colour Macaroni",       img: "Three Colour Macaroni.png",         category: "pasta" },
  { name: "Wheat Spaghetti",             img: "Wheat Spaghetti.png",               category: "pasta" },
  { name: "Alfredo",                     img: "Alfredo.png",                       category: "sauces" },
  { name: "Cajun",                       img: "Cajun.png",                         category: "spices" },
  { name: "Fajita Spaghetti",            img: "Fajita-Spaghetti.png",             category: "pasta" },
  { name: "Lasagne Spaghetti",           img: "Lasagne Spaghetti.png",            category: "pasta" },
  { name: "Chicken Chilli Spaghetti",    img: "Chicken-Chilli-Spaghetti.png",     category: "pasta" },
  { name: "Bar-B-Q Spice Mix",           img: "Bar-B-Q Spice Mix.png",            category: "spices" },
  { name: "Achari Spice Mix",            img: "Achari Spice Mix.png",             category: "spices" },
  { name: "Malai Tikka Spice Mix",       img: "Malai Tikka Spice Mix.png",        category: "spices" },
  { name: "Shashlik Spice Mix",          img: "Shashlik Spice Mix.png",           category: "spices" },
  { name: "Seven Spice",                 img: "Seven Spice.png",                  category: "spices" },
  { name: "Qeema Spice Mix",             img: "Qeema Spice Mix.png",             category: "spices" },
  { name: "Tikka Spice Mix",             img: "Tikka Spice Mix.jpg",              category: "spices" },
  { name: "Tomato Ketchup",              img: "Tomato Ketchup.png",               category: "sauces" },
  { name: "Pizza Sauce",                 img: "Pizza Sauce.png",                  category: "sauces" },
  { name: "Bar-B-Q Sauce",              img: "Bar-B-Q Sauce.png",               category: "sauces" },
  { name: "Classic Pasta Sauce",         img: "Classic Pasta Sauce.png",          category: "sauces" },
  { name: "Green Chilli Sauce",          img: "Green Chilli Sauce.png",           category: "sauces" },
  { name: "Chilli Garlic Sauce",         img: "Chilli Garlic Sauce.png",          category: "sauces" },
  { name: "Imli Sauce",                  img: "Imli Sauce.png",                   category: "sauces" },
  { name: "Soy Sauce",                   img: "Soy-Sauce.png",                    category: "sauces" },
  { name: "Export Vermicelli",           img: "export-vermicelli.png",            category: "vermicelli" },
  { name: "U-Shaped Vermicelli",         img: "U-Shaped Vermicelli.png",          category: "vermicelli" },
  { name: "Vermicelli",                  img: "Vermecelli.png",                   category: "vermicelli" },
  { name: "Simple Vermicelli",           img: "Simple Vermecelli.png",            category: "vermicelli" },
  { name: "Color Vermicelli",            img: "color-vermicelli.png",             category: "vermicelli" },
  { name: "Jam-e-Mashriq",              img: "Jam-e-Mashriq.png",               category: "beverages" },
  { name: "Ice Cream Syrup",            img: "Ice-Cream-Syrup.png",             category: "beverages" },
  { name: "Synthetic White Vinegar",     img: "Synthetic-White-Vinegar.png",     category: "sauces" },
  { name: "Jumb Elbow",                  img: "JUMB-ELBOW-MCK-1.png",           category: "pasta" },
  { name: "Whole Wheat Elbow",           img: "whole-wheat-elbow-macroni-1-1.png", category: "pasta" },
  { name: "Chilli Sauce",                img: "chilli-sause.png",                category: "sauces" },
  { name: "Spaghetti",                   img: "spagheti.png",                    category: "pasta" },
];

const faqs = [
  { q: "What are your store hours?",        a: "We are open Monday to Saturday, 9:00 AM to 6:00 PM. You can also reach us by phone or email during these hours." },
  { q: "Do you offer delivery?",            a: "Yes! We deliver across Multan and surrounding areas. Contact us to arrange bulk order delivery for your business." },
  { q: "How can I become a distributor?",   a: "Fill out our distributor application form in the 'Become a Distributor' section. Our team will review and contact you within 48 hours." },
  { q: "What brands do you carry?",         a: "We are sole distributors of M/s Rasul Flour Mills Karachi and proud owners of the famous Bake Parlour brand." },
  { q: "Do you supply to restaurants?",     a: "Absolutely. We cater to restaurants, hotels, cafes, and retail stores with bulk pricing and reliable supply chains." },
];

/* ─────────────────────────────────────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────────────────────────────────────── */

const FaqItem = ({ q, a, idx }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      borderRadius: 16, overflow: "hidden",
      border: `1.5px solid ${open ? "#7f2c2c" : "#f0e0e0"}`,
      background: "#fff",
      boxShadow: open ? "0 4px 20px rgba(127,44,44,0.12)" : "0 2px 12px rgba(127,44,44,0.06)",
      transition: "border-color 0.3s, box-shadow 0.3s",
      animationDelay: `${idx * 0.08}s`,
    }} className="bp-fadein">
      <button onClick={() => setOpen(!open)} style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "1.1rem 1.5rem", border: "none", background: "none", cursor: "pointer",
        fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: "0.95rem",
        color: "#2c1010", textAlign: "left", gap: "1rem",
        transition: "background 0.2s",
      }}
        onMouseEnter={e => e.currentTarget.style.background = "#fff5ee"}
        onMouseLeave={e => e.currentTarget.style.background = "none"}
      >
        <span>{q}</span>
        <span style={{
          fontSize: "1.4rem", color: "#7f2c2c", flexShrink: 0, lineHeight: 1,
          transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
          transform: open ? "rotate(45deg)" : "rotate(0deg)",
          display: "block",
        }}>+</span>
      </button>
      <div style={{
        maxHeight: open ? 200 : 0, overflow: "hidden",
        transition: "max-height 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s",
        opacity: open ? 1 : 0,
      }}>
        <p style={{
          padding: "1rem 1.5rem 1.25rem", fontSize: "0.875rem",
          color: "#8c6060", lineHeight: 1.7,
          borderTop: "1px solid #f5e8e8",
        }}>{a}</p>
      </div>
    </div>
  );
};

const StatCounter = ({ value, label, delay }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const num = parseInt(value);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = 0;
        const step = Math.max(1, Math.ceil(num / 45));
        const timer = setInterval(() => {
          start += step;
          if (start >= num) { setCount(num); clearInterval(timer); }
          else setCount(start);
        }, 35);
        observer.disconnect();
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [num]);
  const suffix = value.includes("+") ? "+" : value.includes("★") ? "★" : "";
  return (
    <div ref={ref} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, animationDelay: delay }} className="bp-fadein">
      <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2rem,4vw,2.8rem)", fontWeight: 900, color: "#fff", lineHeight: 1 }}>
        {count}{suffix}
      </span>
      <span style={{ fontSize: "0.73rem", color: "#ffd6a0", fontWeight: 600, letterSpacing: "0.04em" }}>{label}</span>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN
───────────────────────────────────────────────────────────────────────────── */

const FirstPage = () => {
  const [activeTab, setActiveTab]   = useState("home");
  const [activeCat, setActiveCat]   = useState("all");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const [formData, setFormData]     = useState({
    name: "", email: "", contact: "", address: "", city: "", investment: "", message: "",
  });

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      const res = await submitDistributorApplicationApi(formData);
      if (res.success) {
        alert("Application submitted! We will contact you soon.");
        setFormData({ name: "", email: "", contact: "", address: "", city: "", investment: "", message: "" });
      } else alert("Failed: " + (res.message || "Unknown error"));
    } catch (err) { alert("Error: " + err.message); }
  };

  const navigate = (tab) => { setActiveTab(tab); setMobileOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const tabs = [
    { id: "home",        label: "Home" },
    { id: "about",       label: "About Us" },
    { id: "products",    label: "Products" },
    { id: "faq",         label: "FAQ's" },
    { id: "contact",     label: "Contact Us" },
    // { id: "distributor", label: "Become a Distributor" },
  ];

  const filtered = activeCat === "all" ? products : products.filter(p => p.category === activeCat);

  /* ── STYLE HELPERS ─────────────────────────────────────────────────────── */
  const s = {
    btn: (variant = "primary") => ({
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: "13px 28px", borderRadius: 50, cursor: "pointer",
      fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", fontWeight: 700,
      transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
      ...(variant === "primary" ? {
        background: "#fff", color: "#7f2c2c", border: "none",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
      } : variant === "secondary" ? {
        background: "rgba(255,255,255,0.12)", color: "#fff",
        border: "2px solid rgba(255,255,255,0.5)",
      } : {
        background: "transparent", color: "#fff",
        border: "2px solid rgba(255,255,255,0.45)",
      }),
    }),
  };

  /* ── SECTIONS ─────────────────────────────────────────────────────────── */

  const renderHome = () => (
    <div className="bp-fadein" key="home">
      {/* HERO */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <img
            src="/src/assets/Main Image.jpeg"
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.75)", animation: "bpZoom 14s ease-in-out infinite alternate" }}
            onError={e => { e.target.parentElement.style.background = "linear-gradient(135deg,#3a1010,#7f2c2c)"; e.target.style.display = "none"; }}
          />
        </div>
        <div style={{ position: "absolute", inset: 0, zIndex: 1, background: "linear-gradient(135deg,rgba(30,6,6,0.88) 0%,rgba(95,30,30,0.72) 55%,rgba(127,44,44,0.45) 100%)" }} />
        <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "2rem 1.5rem", maxWidth: 840, margin: "0 auto" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: "rgba(255,214,160,0.13)", border: "1px solid rgba(255,214,160,0.35)",
            backdropFilter: "blur(10px)", color: "#ffd6a0",
            fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase",
            padding: "8px 20px", borderRadius: 50, marginBottom: "1.5rem",
            animation: "bpFadeUp 0.6s 0.2s both",
          }}>
            <span>✦</span> Sole Distributor of Bake Parlour <span>✦</span>
          </div>

          <h1 style={{
            fontFamily: "'Playfair Display', serif", color: "#fff", lineHeight: 1.08,
            marginBottom: "1.2rem", display: "flex", flexDirection: "column", alignItems: "center",
          }}>
            <span style={{ fontSize: "clamp(3rem,9vw,6rem)", fontWeight: 900, animation: "bpFadeUp 0.7s 0.35s both", textShadow: "0 4px 40px rgba(0,0,0,0.4)", display: "block" }}>
              Bake Parlour
            </span>
            <span style={{ fontSize: "clamp(1.3rem,3.5vw,2.3rem)", fontWeight: 700, color: "#ffd6a0", fontStyle: "italic", animation: "bpFadeUp 0.7s 0.52s both", display: "block" }}>
              Crafted for Taste
            </span>
          </h1>

          <p style={{ color: "rgba(255,255,255,0.78)", fontSize: "1rem", lineHeight: 1.75, marginBottom: "2.25rem", animation: "bpFadeUp 0.7s 0.68s both" }}>
            Pakistan's most trusted distributor of pasta, sauces, spices & more.<br />
            Sole distributors of M/s Rasul Flour Mills, Karachi.
          </p>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", animation: "bpFadeUp 0.7s 0.84s both" }}>
            <button
              style={s.btn("primary")}
              onClick={() => navigate("products")}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px) scale(1.04)"; e.currentTarget.style.boxShadow = "0 10px 35px rgba(0,0,0,0.25)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.15)"; }}
            >
              Explore Products
              <FiArrowRight size={16} />
            </button>
            <button
              style={s.btn("secondary")}
              onClick={() => navigate("distributor")}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.22)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
            >
              Become Distributor
            </button>
          </div>
        </div>

        <div style={{ position: "absolute", bottom: "2rem", left: "50%", transform: "translateX(-50%)", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.45)", fontSize: "0.68rem", letterSpacing: "0.1em", animation: "bpFadeUp 0.7s 1.1s both" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ffd6a0", animation: "bpBounce 1.6s ease-in-out infinite" }} />
          SCROLL
        </div>
      </section>

      {/* STATS BAR */}
      <section style={{ background: "linear-gradient(135deg,#5f1e1e 0%,#7f2c2c 100%)", boxShadow: "0 8px 40px rgba(127,44,44,0.35)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-evenly", padding: "2.5rem 1.5rem", gap: "1rem", flexWrap: "wrap" }}>
          <StatCounter value="50+"  label="Products"        delay="0s" />
          <div style={{ width: 1, height: 50, background: "rgba(255,255,255,0.18)" }} />
          <StatCounter value="30+"  label="Years Experience" delay="0.1s" />
          <div style={{ width: 1, height: 50, background: "rgba(255,255,255,0.18)" }} />
          <StatCounter value="200+" label="Happy Clients"    delay="0.2s" />
          <div style={{ width: 1, height: 50, background: "rgba(255,255,255,0.18)" }} />
          <StatCounter value="5"    label="★ Quality Rating" delay="0.3s" />
        </div>
      </section>

      {/* CATEGORY SHOWCASE */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "5rem 1.5rem" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#7f2c2c", marginBottom: 8 }}>Our Range</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 900, color: "#2c1010" }}>Explore Categories</h2>
          <p style={{ marginTop: 10, color: "#8c6060", fontSize: "1rem" }}>Handcrafted flavours across every category</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(185px,1fr))", gap: "1.5rem" }}>
          {categories.filter(c => c.id !== "all").map((cat, i) => (
            <div
              key={cat.id}
              className="bp-catcard"
              style={{ animationDelay: `${i * 0.1}s`, cursor: "pointer" }}
              onClick={() => { setActiveCat(cat.id); navigate("products"); }}
            >
              <div className="bp-catcard-inner">
                <div style={{ padding: "1.75rem 1rem 1.4rem", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 120, height: 120, borderRadius: "50%",
                    background: "#fff9f5", display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden", border: "3px solid #f0d8d0",
                    transition: "border-color 0.3s, transform 0.4s cubic-bezier(0.34,1.56,0.64,1)",
                  }} className="bp-catimg-wrap">
                    <img
                      src={`/src/assets/${cat.img}`}
                      alt={cat.label}
                      style={{ width: "88%", height: "88%", objectFit: "contain", transition: "transform 0.4s" }}
                      className="bp-catimg-el"
                      onError={e => { e.target.style.display = "none"; e.target.parentElement.innerHTML = `<span style="font-size:2.8rem;line-height:1">${cat.icon}</span>`; }}
                    />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: "0.92rem", color: "#2c1010", textAlign: "center" }}>{cat.label}</span>
                  <span className="bp-explore-hint" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.72rem", fontWeight: 700, color: "#7f2c2c", opacity: 0, transform: "translateY(4px)", transition: "all 0.3s" }}>
                    Explore <FiArrowRight size={11} />
                  </span>
                </div>
                <div className="bp-shine" style={{ position: "absolute", inset: 0, borderRadius: 24, background: "linear-gradient(135deg,rgba(255,255,255,0.28) 0%,transparent 55%)", pointerEvents: "none", opacity: 0, transition: "opacity 0.3s" }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* WHY US */}
      <section style={{ background: "#fff9f5", padding: "5rem 1.5rem" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#7f2c2c", marginBottom: 8 }}>Why Choose Us</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 900, color: "#2c1010" }}>The Masood & Company Difference</h2>
        </div>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: "1.5rem" }}>
          {[
            { icon: "🏆", t: "Trusted Brand",   d: "Over 30 years of excellence delivering premium Bake Parlour products across Pakistan." },
            { icon: "🌿", t: "Premium Quality", d: "Every product meets strict quality standards sourced from M/s Rasul Flour Mills." },
            { icon: "🚚", t: "Reliable Supply", d: "Consistent and timely delivery across Multan and surrounding areas." },
            { icon: "💼", t: "Bulk Orders",     d: "Special pricing and flexible terms for restaurants, hotels and retailers." },
          ].map((f, i) => (
            <div
              key={i}
              className="bp-why-card"
              style={{ background: "#fff", borderRadius: 20, padding: "2rem 1.5rem", boxShadow: "0 2px 12px rgba(127,44,44,0.08)", borderTop: "3px solid transparent", transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)", animationDelay: `${i * 0.1}s` }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: "1rem", color: "#7f2c2c", marginBottom: 8 }}>{f.t}</div>
              <div style={{ fontSize: "0.875rem", color: "#8c6060", lineHeight: 1.65 }}>{f.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER (UPDATED) ── */}
      <section style={{ position: "relative", overflow: "hidden", background: "#faf7f4", padding: "5rem 1.5rem" }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
          gap: "1.5rem", alignItems: "stretch",
        }}>
          {/* Left dark feature card — spans full width on small screens */}
          <div style={{
            background: "linear-gradient(145deg,#2a0a0a,#5f1e1e)",
            borderRadius: 28, padding: "3rem 2.5rem",
            position: "relative", overflow: "hidden",
            boxShadow: "0 20px 60px rgba(127,44,44,0.35)",
            display: "flex", flexDirection: "column", justifyContent: "space-between",
            gridColumn: "span 2",
          }}>
            {/* decorative rings */}
            <div style={{ position: "absolute", right: "-3rem", top: "-3rem", width: 220, height: 220, borderRadius: "50%", border: "40px solid rgba(255,255,255,0.04)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", right: "2rem", bottom: "-4rem", width: 160, height: 160, borderRadius: "50%", border: "30px solid rgba(255,180,100,0.07)", pointerEvents: "none" }} />

            <div style={{ position: "relative", zIndex: 1 }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "rgba(255,214,160,0.13)", border: "1px solid rgba(255,214,160,0.3)",
                color: "#ffd6a0", fontSize: "0.68rem", fontWeight: 700,
                letterSpacing: "0.18em", textTransform: "uppercase",
                padding: "6px 16px", borderRadius: 50, marginBottom: "1.5rem",
              }}>✦ Business Opportunity ✦</span>

              <h2 style={{
                fontFamily: "'Playfair Display',serif",
                fontSize: "clamp(2rem,3.5vw,2.8rem)", fontWeight: 900,
                color: "#fff", lineHeight: 1.15, marginBottom: "1rem",
              }}>
                Grow Your Business<br />
                <span style={{ color: "#ffd6a0", fontStyle: "italic" }}>With Bake Parlour</span>
              </h2>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.92rem", lineHeight: 1.75, maxWidth: 420, marginBottom: "2rem" }}>
                Join Pakistan's most trusted food distribution network. Access 50+ premium products, competitive margins, and a supply chain that never lets you down.
              </p>

              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <button
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "13px 28px", borderRadius: 50, cursor: "pointer",
                    background: "#fff", color: "#7f2c2c", border: "none",
                    fontFamily: "'DM Sans',sans-serif", fontSize: "0.88rem", fontWeight: 700,
                    boxShadow: "0 6px 24px rgba(0,0,0,0.2)",
                    transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
                  }}
                  onClick={() => navigate("distributor")}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px) scale(1.04)"; e.currentTarget.style.boxShadow = "0 12px 36px rgba(0,0,0,0.3)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.2)"; }}
                >
                  Apply as Distributor <FiSend size={15} />
                </button>
                <button
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "13px 28px", borderRadius: 50, cursor: "pointer",
                    background: "rgba(255,255,255,0.1)", color: "#fff",
                    border: "2px solid rgba(255,255,255,0.3)",
                    fontFamily: "'DM Sans',sans-serif", fontSize: "0.88rem", fontWeight: 700,
                    transition: "all 0.3s",
                  }}
                  onClick={() => navigate("contact")}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
                >
                  Contact Us <FiArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Stat mini-cards */}
          {[
            { icon: <FiAward size={22} />,   num: "30+", label: "Years of Trust",     bg: "linear-gradient(145deg,#fff,#fff5f0)" },
            { icon: <FiPackage size={22} />, num: "50+", label: "Premium Products",   bg: "linear-gradient(145deg,#fff,#fff9f5)" },
            { icon: <FiTruck size={22} />,   num: "200+",label: "Satisfied Partners", bg: "linear-gradient(145deg,#fff,#fff5ee)" },
          ].map((st, i) => (
            <div key={i} style={{
              borderRadius: 22, padding: "2rem 1.5rem",
              background: st.bg,
              border: "1.5px solid #f0e0e0",
              boxShadow: "0 4px 20px rgba(127,44,44,0.08)",
              display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 14,
              transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(127,44,44,0.18)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(127,44,44,0.08)"; }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 14, background: "#7f2c2c",
                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 6px 18px rgba(127,44,44,0.35)",
              }}>{st.icon}</div>
              <div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "2.4rem", fontWeight: 900, color: "#2c1010", lineHeight: 1 }}>{st.num}</div>
                <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#8c6060", marginTop: 4 }}>{st.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  const renderAbout = () => (
    <div className="bp-fadein" key="about" style={{ maxWidth: 1100, margin: "0 auto", padding: "4rem 1.5rem 6rem" }}>
      <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
        <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#7f2c2c", marginBottom: 8 }}>Who We Are</p>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 900, color: "#2c1010" }}>About Masood & Company</h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "4rem", alignItems: "center", marginBottom: "4rem" }}>
        <div style={{ position: "relative", borderRadius: 28, overflow: "hidden", boxShadow: "0 20px 60px rgba(127,44,44,0.25)", transition: "transform 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}
          className="bp-about-img"
        >
          <img src="/src/assets/Main Image.jpeg" alt="Bake Parlour" style={{ width: "100%", height: 380, objectFit: "cover", display: "block" }} onError={e => e.target.style.display = "none"} />
          <div style={{ position: "absolute", bottom: "1.5rem", right: "1.5rem", background: "#7f2c2c", borderRadius: 16, padding: "0.85rem 1.3rem", textAlign: "center", boxShadow: "0 8px 30px rgba(0,0,0,0.3)" }}>
            <span style={{ display: "block", fontFamily: "'Playfair Display', serif", fontSize: "2rem", fontWeight: 900, color: "#fff", lineHeight: 1 }}>30+</span>
            <span style={{ fontSize: "0.68rem", color: "#ffd6a0", fontWeight: 600 }}>Years of Trust</span>
          </div>
        </div>
        <div>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", fontWeight: 900, color: "#2c1010", marginBottom: 4 }}>Masood Anwar Keen</h3>
          <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "#7f2c2c", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1.25rem" }}>Sole Proprietor — Masood & Company</p>
          <div style={{ width: 60, height: 3, background: "#7f2c2c", borderRadius: 2, marginBottom: "1.25rem" }} />
          <p style={{ fontSize: "0.95rem", color: "#8c6060", lineHeight: 1.8, marginBottom: "1.75rem" }}>
            Located at MDA Plaza Shopping Centre, Multan, we have been serving Pakistan's food industry for over three decades. As sole distributors of M/s Rasul Flour Mills Karachi and proud owners of the Bake Parlour brand, we deliver quality you can trust.
          </p>
          {[
            { icon: <FiMapPin size={16} />, t: "MDA Plaza, Opposite Children Hospital, Off Abdali Road, Multan" },
            { icon: <FiPhone size={16} />,  t: "061-4589007 / 061-4588007" },
            { icon: <FiPhone size={16} />,  t: "0300-6336007 / 0321-6312007" },
            { icon: <FiMail size={16} />,   t: "masoodncompany@gmail.com" },
          ].map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10, fontSize: "0.875rem", color: "#5c3535" }}>
              <span style={{ color: "#7f2c2c", flexShrink: 0, marginTop: 2 }}>{c.icon}</span>
              <span>{c.t}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: "linear-gradient(135deg,#5f1e1e,#7f2c2c)", borderRadius: 24, boxShadow: "0 8px 40px rgba(127,44,44,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-evenly", padding: "2.5rem 2rem", gap: "1rem", flexWrap: "wrap" }}>
          <StatCounter value="50+"  label="Products"        delay="0s" />
          <div style={{ width: 1, height: 50, background: "rgba(255,255,255,0.2)" }} />
          <StatCounter value="30+"  label="Years Experience" delay="0.1s" />
          <div style={{ width: 1, height: 50, background: "rgba(255,255,255,0.2)" }} />
          <StatCounter value="200+" label="Happy Clients"    delay="0.2s" />
          <div style={{ width: 1, height: 50, background: "rgba(255,255,255,0.2)" }} />
          <StatCounter value="5"    label="★ Quality Rating" delay="0.3s" />
        </div>
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="bp-fadein" key="products" style={{ maxWidth: 1200, margin: "0 auto", padding: "4rem 1.5rem 6rem" }}>
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#7f2c2c", marginBottom: 8 }}>What We Offer</p>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 900, color: "#2c1010" }}>Our Products</h2>
        <p style={{ marginTop: 10, color: "#8c6060" }}>Premium quality food products trusted across Pakistan</p>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1.5rem", marginBottom: "2.5rem" }}>
        {categories.map((cat, i) => (
          <button
            key={cat.id}
            onClick={() => setActiveCat(cat.id)}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", animationDelay: `${i * 0.07}s` }}
            className="bp-fadein"
          >
            <div style={{
              position: "relative", width: 82, height: 82, borderRadius: "50%",
              background: activeCat === cat.id ? "#fff9f5" : "#fff",
              border: `3px solid ${activeCat === cat.id ? "#7f2c2c" : "#e8d5d5"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden",
              boxShadow: activeCat === cat.id ? "0 0 0 5px rgba(127,44,44,0.14), 0 4px 16px rgba(127,44,44,0.18)" : "0 2px 10px rgba(127,44,44,0.08)",
              transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)",
              transform: activeCat === cat.id ? "scale(1.12)" : "scale(1)",
            }}
              className="bp-circle-wrap"
            >
              <img
                src={`/src/assets/${cat.img}`}
                alt={cat.label}
                style={{ width: "74%", height: "74%", objectFit: "contain", transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}
                className="bp-circle-img"
                onError={e => { e.target.style.display = "none"; e.target.parentElement.innerHTML += `<span style="font-size:2rem;line-height:1">${cat.icon}</span>`; }}
              />
              {activeCat === cat.id && (
                <div style={{ position: "absolute", inset: -4, borderRadius: "50%", border: "2px solid #7f2c2c", animation: "bpRing 1.6s ease-in-out infinite", pointerEvents: "none" }} />
              )}
            </div>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: activeCat === cat.id ? "#7f2c2c" : "#5c3535", transition: "color 0.2s" }}>{cat.label}</span>
          </button>
        ))}
      </div>

      <p style={{ textAlign: "center", fontSize: "0.85rem", color: "#8c6060", marginBottom: "2rem" }}>
        Showing <strong style={{ color: "#7f2c2c" }}>{filtered.length}</strong> products
        {activeCat !== "all" && <em style={{ color: "#7f2c2c", fontStyle: "italic" }}> in {categories.find(c => c.id === activeCat)?.label}</em>}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(165px,1fr))", gap: "1.2rem" }}>
        {filtered.map((p, i) => (
          <div
            key={i}
            className="bp-prod-card"
            style={{ background: "#fff", borderRadius: 20, border: "1.5px solid #f0e0e0", padding: "1.2rem 1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, boxShadow: "0 2px 12px rgba(127,44,44,0.06)", transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)", animationDelay: `${(i % 12) * 0.04}s`, cursor: "default" }}
          >
            <div style={{ width: "100%", height: 115, display: "flex", alignItems: "center", justifyContent: "center", background: "#fdf6f4", borderRadius: 12, overflow: "hidden" }}>
              <img
                src={`/src/assets/${p.img}`}
                alt={p.name}
                style={{ maxWidth: "88%", maxHeight: "88%", objectFit: "contain", transition: "transform 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}
                className="bp-prod-img"
                onError={e => { e.target.style.display = "none"; e.target.parentElement.innerHTML = `<span style="font-size:2.5rem">📦</span>`; }}
              />
            </div>
            <p style={{ fontSize: "0.77rem", fontWeight: 600, color: "#2c1010", textAlign: "center", lineHeight: 1.35 }}>{p.name}</p>
            <span style={{ fontSize: "0.64rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "capitalize", padding: "3px 10px", borderRadius: 50, background: "#fff0eb", color: "#7f2c2c" }}>{p.category}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFaq = () => (
    <div className="bp-fadein" key="faq" style={{ maxWidth: 720, margin: "0 auto", padding: "4rem 1.5rem 6rem" }}>
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#7f2c2c", marginBottom: 8 }}>Got Questions?</p>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 900, color: "#2c1010" }}>Frequently Asked Questions</h2>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {faqs.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} idx={i} />)}
      </div>
    </div>
  );

  /* ── CONTACT (UPDATED) ── */
  const renderContact = () => (
    <div className="bp-fadein" key="contact">
      {/* Hero strip */}
      <div style={{
        background: "linear-gradient(135deg,#3a1010 0%,#7f2c2c 55%,#a03838 100%)",
        padding: "4.5rem 1.5rem 7rem",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.07, backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)", backgroundSize: "26px 26px", pointerEvents: "none" }} />
        <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#ffd6a0", marginBottom: 10, position: "relative" }}>Get In Touch</p>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(2.2rem,5vw,3.5rem)", fontWeight: 900, color: "#fff", marginBottom: 14, position: "relative" }}>We'd Love To Hear From You</h2>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "1rem", maxWidth: 480, margin: "0 auto", position: "relative" }}>
          Whether you're a retailer, restaurant owner, or curious customer — our team is ready to help.
        </p>
      </div>

      {/* Cards float over the strip */}
      <div style={{ maxWidth: 1000, margin: "-4rem auto 0", padding: "0 1.5rem 6rem", position: "relative", zIndex: 2 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: "1.25rem", marginBottom: "2.5rem" }}>
          {[
            {
              icon: <FiMapPin size={24} />,
              title: "Visit Our Office",
              lines: ["MDA Plaza Shopping Centre,", "Opposite Children Hospital,", "Off Abdali Road, Multan"],
              accent: "#e85454",
              bg: "linear-gradient(145deg,#fff,#fff5f5)",
            },
            {
              icon: <FiPhone size={24} />,
              title: "Call Us Anytime",
              lines: ["061-4589007", "061-4588007", "0300-6336007", "0321-6312007"],
              accent: "#7f2c2c",
              bg: "linear-gradient(145deg,#fff,#fff9f5)",
            },
            {
              icon: <FiMail size={24} />,
              title: "Drop an Email",
              lines: ["masoodncompany@gmail.com", "We reply within 24 hours"],
              accent: "#c05030",
              bg: "linear-gradient(145deg,#fff,#fff5ee)",
            },
            {
              icon: <FiClock size={24} />,
              title: "Business Hours",
              lines: ["Mon – Sat: 9 AM – 6 PM", "Sunday: Closed"],
              accent: "#8b4513",
              bg: "linear-gradient(145deg,#fff,#fdf8f0)",
            },
          ].map((c, i) => (
            <div key={i} className="bp-contact-card" style={{
              background: c.bg,
              borderRadius: 22,
              padding: "2rem 1.5rem",
              textAlign: "center",
              boxShadow: "0 8px 32px rgba(127,44,44,0.10)",
              border: "1.5px solid #f0e0e0",
              transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)",
              animationDelay: `${i * 0.1}s`,
            }}>
              <div style={{
                width: 58, height: 58, borderRadius: "50%",
                background: c.accent, color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 1.1rem",
                boxShadow: `0 8px 20px ${c.accent}55`,
              }}>{c.icon}</div>
              <p style={{ fontWeight: 800, color: "#2c1010", marginBottom: 10, fontSize: "0.95rem" }}>{c.title}</p>
              {c.lines.map((l, j) => <p key={j} style={{ fontSize: "0.81rem", color: "#7a5555", lineHeight: 1.75 }}>{l}</p>)}
            </div>
          ))}
        </div>

        {/* Map placeholder */}
        <div style={{
          borderRadius: 28, overflow: "hidden",
          background: "linear-gradient(135deg,#2a0a0a 0%,#5f1e1e 100%)",
          boxShadow: "0 20px 60px rgba(127,44,44,0.28)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "3.5rem 2rem",
          position: "relative",
          border: "1.5px solid rgba(255,180,100,0.18)",
        }}>
          <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🗺️</div>
            <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.5rem", fontWeight: 900, color: "#fff", marginBottom: 6 }}>
              Multan, Punjab, Pakistan
            </p>
            <p style={{ fontSize: "0.85rem", color: "rgba(255,220,160,0.75)", marginBottom: "1.5rem" }}>
              MDA Plaza Shopping Centre, Off Abdali Road
            </p>
            <a
              href="https://maps.google.com/?q=MDA+Plaza+Multan"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "11px 26px", borderRadius: 50,
                background: "rgba(255,255,255,0.12)", border: "2px solid rgba(255,255,255,0.35)",
                color: "#fff", fontFamily: "'DM Sans',sans-serif",
                fontWeight: 700, fontSize: "0.85rem", textDecoration: "none",
                transition: "all 0.3s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.22)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
            >
              Open in Google Maps <FiArrowRight size={15} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDistributor = () => (
    <div className="bp-fadein" key="dist" style={{ maxWidth: 1100, margin: "0 auto", padding: "4rem 1.5rem 6rem" }}>
      <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
        <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#7f2c2c", marginBottom: 8 }}>Partner With Us</p>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 900, color: "#2c1010" }}>Become a Distributor</h2>
        <p style={{ marginTop: 10, color: "#8c6060" }}>Join our network and grow your business with Bake Parlour</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "2.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {[
            { icon: "🏆", t: "Trusted Brand",   d: "30+ years of Bake Parlour excellence" },
            { icon: "📦", t: "Wide Range",       d: "50+ products across all categories" },
            { icon: "💰", t: "Great Margins",    d: "Competitive distributor pricing structure" },
            { icon: "🚚", t: "Reliable Supply",  d: "Consistent stock from Rasul Flour Mills" },
          ].map((b, i) => (
            <div key={i} className="bp-benefit-card"
              style={{ display: "flex", alignItems: "flex-start", gap: "1rem", background: "#fff", borderRadius: 18, padding: "1.25rem", boxShadow: "0 2px 12px rgba(127,44,44,0.07)", border: "1.5px solid #f0e0e0", transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)", animationDelay: `${i * 0.1}s` }}
            >
              <span style={{ fontSize: "1.8rem", flexShrink: 0 }}>{b.icon}</span>
              <div>
                <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "#7f2c2c", marginBottom: 3 }}>{b.t}</p>
                <p style={{ fontSize: "0.8rem", color: "#8c6060" }}>{b.d}</p>
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: "linear-gradient(145deg,#7f2c2c,#5f1e1e)", borderRadius: 28, padding: "2.5rem", boxShadow: "0 20px 60px rgba(127,44,44,0.35)" }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 900, color: "#fff", marginBottom: "1.75rem" }}>Distributor Application</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {[
              { label: "Full Name",           name: "name",       type: "text",  ph: "Your full name",         span: 2 },
              { label: "Email Address",       name: "email",      type: "email", ph: "your@email.com",          span: 1 },
              { label: "Contact Number",      name: "contact",    type: "tel",   ph: "03XX-XXXXXXX",            span: 1 },
              { label: "Complete Address",    name: "address",    type: "text",  ph: "Full address",            span: 2 },
              { label: "City",                name: "city",       type: "text",  ph: "Your city",               span: 1 },
              { label: "Investment / Assets", name: "investment", type: "text",  ph: "Storage, vehicles, etc.", span: 1 },
            ].map(f => (
              <div key={f.name} style={{ gridColumn: f.span === 2 ? "1 / -1" : "auto", display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.65)" }}>{f.label}</label>
                <input type={f.type} name={f.name} value={formData[f.name]} onChange={handleChange} placeholder={f.ph}
                  style={{ background: "rgba(255,255,255,0.11)", border: "1.5px solid rgba(255,255,255,0.18)", borderRadius: 10, padding: "10px 14px", color: "#fff", fontFamily: "'DM Sans',sans-serif", fontSize: "0.875rem", outline: "none", transition: "all 0.25s", width: "100%" }}
                  onFocus={e => { e.target.style.borderColor = "#ffd6a0"; e.target.style.background = "rgba(255,255,255,0.18)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.18)"; e.target.style.background = "rgba(255,255,255,0.11)"; }}
                />
              </div>
            ))}
            <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.65)" }}>Message</label>
              <textarea name="message" value={formData.message} onChange={handleChange} rows={3}
                placeholder="Tell us about your distribution experience..."
                style={{ background: "rgba(255,255,255,0.11)", border: "1.5px solid rgba(255,255,255,0.18)", borderRadius: 10, padding: "10px 14px", color: "#fff", fontFamily: "'DM Sans',sans-serif", fontSize: "0.875rem", outline: "none", transition: "all 0.25s", width: "100%", resize: "none" }}
                onFocus={e => { e.target.style.borderColor = "#ffd6a0"; e.target.style.background = "rgba(255,255,255,0.18)"; }}
                onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.18)"; e.target.style.background = "rgba(255,255,255,0.11)"; }}
              />
            </div>
          </div>
          <button onClick={handleSubmit}
            style={{ marginTop: "1.25rem", width: "100%", padding: "14px", background: "#fff", color: "#7f2c2c", border: "none", cursor: "pointer", borderRadius: 50, fontFamily: "'DM Sans',sans-serif", fontSize: "0.95rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px) scale(1.02)"; e.currentTarget.style.background = "#fff9f5"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.background = "#fff"; }}
          >
            Submit Application <FiSend size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "home":        return renderHome();
      case "about":       return renderAbout();
      case "products":    return renderProducts();
      case "faq":         return renderFaq();
      case "contact":     return renderContact();
      case "distributor": return renderDistributor();
      default:            return renderHome();
    }
  };

  /* ── JSX ─────────────────────────────────────────────────────────────────── */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #faf7f4; }
        input, textarea, button { font-family: 'DM Sans', sans-serif; }

        @keyframes bpFadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bpZoom {
          from { transform: scale(1.05); }
          to   { transform: scale(1.13); }
        }
        @keyframes bpBounce {
          0%,100% { transform: translateY(0); opacity: 0.4; }
          50%      { transform: translateY(-7px); opacity: 1; }
        }
        @keyframes bpRing {
          0%,100% { opacity: 0.5; transform: scale(1); }
          50%      { opacity: 1; transform: scale(1.07); }
        }
        .bp-fadein { animation: bpFadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both; }

        /* NAVBAR */
        .bp-nav {
          position: sticky; top: 0; z-index: 1000;
          background: #7f2c2c;
          transition: background 0.4s, box-shadow 0.4s;
          box-shadow: 0 2px 20px rgba(0,0,0,0.22);
        }
        .bp-nav.scrolled {
          background: rgba(78,20,20,0.96);
          backdrop-filter: blur(14px);
          box-shadow: 0 4px 30px rgba(0,0,0,0.32);
        }
        .bp-nav-inner {
          max-width: 1280px; margin: 0 auto; padding: 0 1.5rem;
          display: flex; align-items: center; justify-content: space-between;
          height: 66px; transition: height 0.3s;
        }
        .bp-nav.scrolled .bp-nav-inner { height: 58px; }
        .bp-logo { display: flex; align-items: center; gap: 12px; cursor: pointer; }
        .bp-logo img { height: 42px; transition: height 0.3s; }
        .bp-nav.scrolled .bp-logo img { height: 36px; }
        .bp-nav-links { display: flex; align-items: center; gap: 2px; }
        .bp-ntab {
          padding: 7px 13px; border-radius: 9px; border: none; cursor: pointer;
          font-family: 'DM Sans',sans-serif; font-size: 0.8rem; font-weight: 600;
          color: rgba(255,255,255,0.82); background: transparent;
          position: relative; overflow: hidden;
          transition: color 0.2s, background 0.2s;
        }
        .bp-ntab::after {
          content:''; position: absolute; bottom: 0; left: 50%; right: 50%;
          height: 2px; background: #ffd6a0;
          transition: left 0.25s, right 0.25s;
        }
        .bp-ntab:hover { color: #fff; background: rgba(255,255,255,0.11); }
        .bp-ntab.active { color: #fff; background: rgba(255,255,255,0.16); }
        .bp-ntab.active::after { left: 10px; right: 10px; }
        .bp-login {
          padding: 7px 18px; border-radius: 9px; border: 2px solid #fff;
          color: #fff; background: transparent; font-weight: 700; font-size: 0.8rem;
          text-decoration: none; transition: all 0.2s; display: inline-block;
        }
        .bp-login:hover { background: #fff; color: #7f2c2c; }
        .bp-hamburger {
          display: none; flex-direction: column; gap: 5px; cursor: pointer;
          padding: 8px; border-radius: 8px; border: none; background: rgba(255,255,255,0.13);
        }
        .bp-hamburger span { display: block; width: 22px; height: 2px; background: #fff; border-radius: 2px; transition: all 0.3s; }
        .bp-hamburger.open span:nth-child(1) { transform: rotate(45deg) translate(5px,5px); }
        .bp-hamburger.open span:nth-child(2) { opacity: 0; }
        .bp-hamburger.open span:nth-child(3) { transform: rotate(-45deg) translate(5px,-5px); }
        .bp-mobile-menu { display: none; background: #5f1e1e; padding: 0.75rem 1.5rem 1.25rem; flex-direction: column; gap: 4px; }
        .bp-mobile-menu.open { display: flex; }
        .bp-mtab { padding: 10px 14px; border-radius: 9px; border: none; cursor: pointer; font-family: 'DM Sans',sans-serif; font-size: 0.875rem; font-weight: 600; color: rgba(255,255,255,0.82); background: transparent; text-align: left; transition: all 0.2s; }
        .bp-mtab.active, .bp-mtab:hover { background: rgba(255,255,255,0.15); color: #fff; }

        @media(max-width:900px){ .bp-nav-links{display:none} .bp-hamburger{display:flex} }

        /* 3D CATEGORY CARD */
        .bp-catcard { perspective: 900px; }
        .bp-catcard-inner {
          position: relative; border-radius: 24px; background: #fff;
          box-shadow: 0 2px 12px rgba(127,44,44,0.08);
          transition: transform 0.45s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.45s;
          transform-style: preserve-3d;
        }
        .bp-catcard:hover .bp-catcard-inner {
          transform: translateY(-12px) rotateX(5deg) rotateY(-5deg) scale(1.04);
          box-shadow: 0 24px 60px rgba(127,44,44,0.26);
        }
        .bp-catcard:hover .bp-catimg-wrap { border-color: #7f2c2c !important; transform: scale(1.06); }
        .bp-catcard:hover .bp-catimg-el  { transform: scale(1.08) rotate(-3deg); }
        .bp-catcard:hover .bp-explore-hint { opacity: 1 !important; transform: translateY(0) !important; }
        .bp-catcard:hover .bp-shine { opacity: 1 !important; }

        /* PRODUCT CARD */
        .bp-prod-card:hover {
          transform: translateY(-9px) scale(1.025);
          box-shadow: 0 14px 40px rgba(127,44,44,0.18) !important;
          border-color: #c06060 !important;
        }
        .bp-prod-card:hover .bp-prod-img { transform: scale(1.12) rotate(-2deg); }

        /* CIRCLE WRAP HOVER */
        .bp-circle-wrap:hover { transform: scale(1.1) !important; border-color: #7f2c2c !important; }
        .bp-circle-wrap:hover .bp-circle-img { transform: scale(1.1); }

        /* WHY CARD */
        .bp-why-card:hover { transform: translateY(-8px); box-shadow: 0 14px 40px rgba(127,44,44,0.16) !important; border-top-color: #7f2c2c !important; }

        /* ABOUT IMAGE */
        .bp-about-img:hover { transform: translateY(-6px) rotateY(-4deg) rotateX(2deg); }

        /* CONTACT CARD */
        .bp-contact-card:hover { transform: translateY(-8px); box-shadow: 0 14px 40px rgba(127,44,44,0.18) !important; border-color: #7f2c2c !important; }

        /* BENEFIT CARD */
        .bp-benefit-card:hover { transform: translateX(8px); border-color: #7f2c2c !important; box-shadow: 0 8px 28px rgba(127,44,44,0.18) !important; }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        {/* NAVBAR */}
        <nav className={`bp-nav ${scrolled ? "scrolled" : ""}`}>
          <div className="bp-nav-inner">
            <div className="bp-logo" onClick={() => navigate("home")}>
              <img src={logo} alt="BKP Logo" />
              <div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: "0.875rem", color: "#fff", lineHeight: 1.2 }}>Masood Sons & Company</div>
                <div style={{ fontSize: "0.64rem", color: "#ffd6a0" }}>Bake Parlour Sole Distributor</div>
              </div>
            </div>

            <div className="bp-nav-links">
              {tabs.map(t => (
                <button key={t.id} className={`bp-ntab ${activeTab === t.id ? "active" : ""}`} onClick={() => navigate(t.id)}>
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Link to="/login" className="bp-login">Login</Link>
              <button className={`bp-hamburger ${mobileOpen ? "open" : ""}`} onClick={() => setMobileOpen(!mobileOpen)}>
                <span /><span /><span />
              </button>
            </div>
          </div>
          <div className={`bp-mobile-menu ${mobileOpen ? "open" : ""}`}>
            {tabs.map(t => (
              <button key={t.id} className={`bp-mtab ${activeTab === t.id ? "active" : ""}`} onClick={() => navigate(t.id)}>{t.label}</button>
            ))}
          </div>
        </nav>

        {/* CONTENT */}
        <main style={{ flex: 1, background: "#faf7f4" }}>
          {renderContent()}
        </main>

        {/* ── FOOTER (UPDATED) ── */}
        <footer style={{ position: "relative", overflow: "hidden", background: "#160404", color: "#fff" }}>
          {/* Decorative blobs */}
          <div style={{ position: "absolute", top: "-80px", left: "-80px", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle,rgba(127,44,44,0.35),transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "-60px", right: "-60px", width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle,rgba(160,56,56,0.2),transparent 70%)", pointerEvents: "none" }} />

          {/* Gold top stripe */}
          <div style={{ height: 4, background: "linear-gradient(90deg,transparent,#ffd6a0 30%,#c88040 60%,transparent)" }} />

          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "4.5rem 1.5rem 0", position: "relative", zIndex: 1 }}>
            <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr 1fr 1.4fr", gap: "3rem", marginBottom: "3.5rem" }}>

              {/* Brand column */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: "1.2rem" }}>
                  <img src={logo} alt="BKP" style={{ height: 52, filter: "drop-shadow(0 4px 12px rgba(255,180,100,0.3))" }} />
                  <div>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: "1rem", color: "#fff", lineHeight: 1.2 }}>
                      Masood Sons & Company
                    </div>
                    <div style={{ fontSize: "0.63rem", color: "#ffd6a0", letterSpacing: "0.08em" }}>
                      Bake Parlour Sole Distributor
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.85, maxWidth: 270, marginBottom: "1.75rem" }}>
                  Sole Distributors of M/s Rasul Flour Mills Karachi — delivering premium food products across Pakistan for over three decades.
                </p>
                {/* Social icons */}
                <div style={{ display: "flex", gap: 10 }}>
                  {[
                    { icon: <FiFacebook size={16} />, href: "#" },
                    { icon: <FiInstagram size={16} />, href: "#" },
                    { icon: <FiTwitter size={16} />, href: "#" },
                    { icon: <FiYoutube size={16} />, href: "#" },
                  ].map((sc, i) => (
                    <a key={i} href={sc.href} style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", justifyContent: "center",
                      textDecoration: "none", transition: "all 0.25s",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#7f2c2c"; e.currentTarget.style.borderColor = "#7f2c2c"; e.currentTarget.style.color = "#fff"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}
                    >{sc.icon}</a>
                  ))}
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <p style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "#ffd6a0", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Quick Links</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {tabs.map(t => (
                    <button key={t.id} onClick={() => navigate(t.id)} style={{
                      display: "flex", alignItems: "center", gap: 6,
                      fontSize: "0.82rem", color: "rgba(255,255,255,0.45)",
                      background: "none", border: "none", cursor: "pointer",
                      textAlign: "left", padding: "5px 0",
                      fontFamily: "'DM Sans',sans-serif", transition: "all 0.2s",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.paddingLeft = "6px"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.45)"; e.currentTarget.style.paddingLeft = "0"; }}
                    >
                      <FiChevronRight size={12} style={{ opacity: 0.5 }} /> {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <p style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "#ffd6a0", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Categories</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {categories.filter(c => c.id !== "all").map(c => (
                    <button key={c.id} onClick={() => { setActiveCat(c.id); navigate("products"); }} style={{
                      display: "flex", alignItems: "center", gap: 6,
                      fontSize: "0.82rem", color: "rgba(255,255,255,0.45)",
                      background: "none", border: "none", cursor: "pointer",
                      textAlign: "left", padding: "5px 0",
                      fontFamily: "'DM Sans',sans-serif", transition: "all 0.2s",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.paddingLeft = "6px"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.45)"; e.currentTarget.style.paddingLeft = "0"; }}
                    >
                      <FiChevronRight size={12} style={{ opacity: 0.5 }} /> {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact column */}
              <div>
                <p style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "#ffd6a0", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Contact</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
                  {[
                    { icon: <FiMapPin size={14} />, text: "MDA Plaza Shopping Centre, Opposite Children Hospital, Off Abdali Road, Multan" },
                    { icon: <FiPhone size={14} />,  text: "061-4589007 / 061-4588007" },
                    { icon: <FiPhone size={14} />,  text: "0300-6336007 / 0321-6312007" },
                    { icon: <FiMail size={14} />,   text: "masoodncompany@gmail.com" },
                    { icon: <FiClock size={14} />,  text: "Mon – Sat: 9 AM – 6 PM" },
                  ].map((ci, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <span style={{ color: "#ffd6a0", flexShrink: 0, marginTop: 2 }}>{ci.icon}</span>
                      <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.65 }}>{ci.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom bar */}
            <div style={{
              borderTop: "1px solid rgba(255,255,255,0.06)",
              padding: "1.5rem 0 2rem",
              display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem",
            }}>
              <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.22)" }}>
                © {new Date().getFullYear()} Masood Sons & Company. All rights reserved.
              </span>
              <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.22)", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "#ffd6a0", fontSize: "0.8rem" }}>✦</span>
                Bake Parlour™ — Pakistan's Trusted Brand
                <span style={{ color: "#ffd6a0", fontSize: "0.8rem" }}>✦</span>
              </span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default FirstPage;