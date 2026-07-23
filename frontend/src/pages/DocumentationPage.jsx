import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Search, ChevronRight, ChevronLeft, ChevronDown, Menu, X,
  BookOpen, Compass, UploadCloud, BarChart2, Wand2, FlaskConical,
  GitCompare, LayoutDashboard, Zap, Grid, Book, Code, HelpCircle,
  AlertTriangle, Server, Package, CheckCircle, XCircle,
  ExternalLink, ArrowUp, Clipboard, Terminal, Lightbulb,
} from "lucide-react";
import { DOC_SECTIONS, MODELS, API_ENDPOINTS, FAQS, TROUBLESHOOTING, SIDEBAR_SECTIONS } from "../data/docs-content";

const ICON_MAP = {
  BookOpen, Compass, UploadCloud, BarChart2, Wand2, FlaskConical,
  GitCompare, LayoutDashboard, Zap, Grid, Book, Code, HelpCircle,
  AlertTriangle, Server, Package,
};

function DocIcon({ name, className, size }) {
  const Icon = ICON_MAP[name];
  return Icon ? <Icon className={className} size={size} /> : null;
}

function SearchResults({ query, results, onSelect }) {
  if (!query.trim()) return null;
  if (results.length === 0) {
    return (
      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-6 text-center">
        <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No results found for &ldquo;{query}&rdquo;</p>
      </div>
    );
  }
  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
      {results.map((r, i) => (
        <button
          key={i}
          onClick={() => onSelect(r.sectionId)}
          className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-b-0 transition-colors"
        >
          <div className="flex items-center gap-2">
            <DocIcon name={r.sectionIcon} className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-medium text-indigo-600 uppercase tracking-wider">{r.sectionTitle}</span>
          </div>
          <p className="text-sm text-gray-700 mt-0.5 line-clamp-2">{r.text}</p>
        </button>
      ))}
    </div>
  );
}

function SectionRenderer({ sectionId }) {
  const section = DOC_SECTIONS.find((s) => s.id === sectionId);
  if (!section) return null;

  const blocks = section.content;

  return (
    <div id={`section-${section.id}`} className="scroll-mt-24">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading":
            const Tag = `h${block.level || 2}`;
            const headingClasses = {
              2: "text-2xl font-bold text-gray-900 mt-8 mb-4",
              3: "text-lg font-semibold text-gray-800 mt-6 mb-3",
            };
            return <Tag key={i} className={headingClasses[block.level] || headingClasses[2]}>{block.text}</Tag>;

          case "paragraph":
            return <p key={i} className="text-sm text-gray-600 leading-relaxed mb-4">{block.text}</p>;

          case "list":
            const ListTag = block.ordered ? "ol" : "ul";
            const listClass = block.ordered ? "list-decimal" : "list-disc";
            return (
              <ListTag key={i} className={`${listClass} pl-5 text-sm text-gray-600 space-y-1.5 mb-4`}>
                {block.items.map((item, j) => <li key={j}>{item}</li>)}
              </ListTag>
            );

          case "cardGrid":
            return (
              <div key={i} className={`grid grid-cols-1 sm:grid-cols-${block.columns || 2} gap-4 mb-6`} style={block.columns > 2 ? { gridTemplateColumns: `repeat(${block.columns}, minmax(0, 1fr))` } : {}}>
                {block.cards.map((card, j) => (
                  <div key={j} className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-indigo-200 hover:shadow-sm transition-all">
                    {card.icon && <DocIcon name={card.icon} className="w-5 h-5 text-indigo-500 mb-2" />}
                    <h4 className="text-sm font-semibold text-gray-800 mb-1">{card.title}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">{card.description}</p>
                  </div>
                ))}
              </div>
            );

          case "table":
            return (
              <div key={i} className="overflow-x-auto mb-6">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      {block.headers.map((h, j) => (
                        <th key={j} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, j) => (
                      <tr key={j} className="border-b border-gray-100 hover:bg-gray-50">
                        {row.map((cell, k) => (
                          <td key={k} className="px-4 py-2.5 text-gray-700">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case "code":
            return (
              <div key={i} className="relative mb-6 group">
                <div className="flex items-center justify-between bg-gray-900 text-gray-400 text-xs px-4 py-1.5 rounded-t-lg">
                  <span className="flex items-center gap-1.5"><Terminal className="w-3 h-3" />{block.language || "bash"}</span>
                  <button onClick={() => { navigator.clipboard.writeText(block.content); }} className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 hover:text-white">
                    <Clipboard className="w-3 h-3" /> Copy
                  </button>
                </div>
                <pre className="bg-gray-900 text-gray-100 text-sm p-4 rounded-b-lg overflow-x-auto"><code>{block.content}</code></pre>
              </div>
            );

          case "accordion":
            return (
              <div key={i} className="space-y-2 mb-6">
                {block.items.map((item, j) => (
                  <AccordionItem key={j} title={item.title} content={item.content} />
                ))}
              </div>
            );

          case "steps":
            return (
              <div key={i} className="space-y-0 mb-6">
                {block.items.map((step, j) => (
                  <div key={j} className="flex gap-4 pb-6 relative">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold z-10">{j + 1}</div>
                      {j < block.items.length - 1 && <div className="w-0.5 flex-1 bg-indigo-100 absolute top-8 bottom-0" />}
                    </div>
                    <div className="flex-1 pt-1">
                      <h4 className="text-sm font-semibold text-gray-800">{step.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                      {step.page && (
                        <a href={step.page} className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 mt-2 font-medium">
                          Go to {step.title} <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );

          case "tip":
            return (
              <div key={i} className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <Lightbulb className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-800">{block.text}</p>
              </div>
            );

          case "modelCards":
            return (
              <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {MODELS.map((model) => (
                  <div key={model.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-gray-900">{model.name}</h4>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${model.type === "Classification" ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"}`}>{model.type}</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">{model.description}</p>
                    <div className="space-y-2 text-xs">
                      <div><span className="font-semibold text-gray-700">Best Use Cases:</span> <span className="text-gray-600">{model.useCases}</span></div>
                      <div><span className="font-semibold text-green-700">Advantages:</span> <span className="text-gray-600">{model.advantages}</span></div>
                      <div><span className="font-semibold text-red-700">Limitations:</span> <span className="text-gray-600">{model.limitations}</span></div>
                      <div><span className="font-semibold text-gray-700">Typical Dataset Size:</span> <span className="text-gray-600">{model.datasetSize}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            );

          case "apiTable":
            return (
              <div key={i} className="overflow-x-auto mb-6">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-600 uppercase border-b border-gray-200">Method</th>
                      <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-600 uppercase border-b border-gray-200">Route</th>
                      <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-600 uppercase border-b border-gray-200">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {API_ENDPOINTS.map((ep, j) => (
                      <tr key={j} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-2.5">
                          <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                            ep.method === "GET" ? "bg-green-50 text-green-700" :
                            ep.method === "POST" ? "bg-blue-50 text-blue-700" :
                            ep.method === "PUT" ? "bg-amber-50 text-amber-700" :
                            ep.method === "PATCH" ? "bg-purple-50 text-purple-700" :
                            "bg-red-50 text-red-700"
                          }`}>{ep.method}</span>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs text-gray-700">{ep.route}</td>
                        <td className="px-3 py-2.5 text-xs text-gray-600">{ep.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case "faqList":
            return (
              <div key={i} className="space-y-3 mb-6">
                {FAQS.map((faq, j) => (
                  <AccordionItem key={j} title={faq.question} content={faq.answer} />
                ))}
              </div>
            );

          case "troubleshootingList":
            return (
              <div key={i} className="space-y-4 mb-6">
                {TROUBLESHOOTING.map((item, j) => (
                  <div key={j} className="bg-white border border-gray-200 rounded-xl p-5">
                    <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      {item.title}
                    </h4>
                    <p className="text-xs text-gray-500 mb-3"><span className="font-semibold text-gray-700">Symptoms:</span> {item.symptoms}</p>
                    <div className="mb-3">
                      <span className="text-xs font-semibold text-gray-700 block mb-1.5">Common Causes:</span>
                      <ul className="list-disc pl-4 text-xs text-gray-600 space-y-1">
                        {item.causes.map((c, k) => <li key={k}>{c}</li>)}
                      </ul>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-green-700 block mb-1.5">Solutions:</span>
                      <ol className="list-decimal pl-4 text-xs text-gray-600 space-y-1">
                        {item.solutions.map((s, k) => <li key={k}>{s}</li>)}
                      </ol>
                    </div>
                  </div>
                ))}
              </div>
            );

          case "releaseItem":
            return (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-gray-900">v{block.version}</h4>
                  <span className="text-xs text-gray-400">{block.date}</span>
                </div>
                <ul className="space-y-1.5 text-xs text-gray-600">
                  {block.changes.map((c, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}

function AccordionItem({ title, content }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
      >
        <span>{title}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-4 pb-3 text-sm text-gray-600 leading-relaxed">{content}</div>}
    </div>
  );
}

function buildSearchIndex() {
  const index = [];
  DOC_SECTIONS.forEach((section) => {
    section.content.forEach((block) => {
      let text = "";
      if (block.text) text = block.text;
      else if (block.items) text = block.items.map((i) => (typeof i === "string" ? i : i.title || i.question || "")).join(" ");
      else if (block.cards) text = block.cards.map((c) => `${c.title} ${c.description}`).join(" ");
      else if (block.title) text = block.title;
      if (text.trim()) {
        index.push({ sectionId: section.id, sectionTitle: section.title, sectionIcon: section.icon, text: text.trim() });
      }
    });
  });
  FAQS.forEach((faq) => {
    const section = DOC_SECTIONS.find((s) => s.id === "faqs");
    index.push({ sectionId: "faqs", sectionTitle: "FAQs", sectionIcon: "HelpCircle", text: `${faq.question} ${faq.answer}` });
  });
  TROUBLESHOOTING.forEach((item) => {
    index.push({ sectionId: "troubleshooting", sectionTitle: "Troubleshooting", sectionIcon: "AlertTriangle", text: `${item.title} ${item.symptoms} ${item.causes.join(" ")} ${item.solutions.join(" ")}` });
  });
  MODELS.forEach((model) => {
    index.push({ sectionId: "supported-models", sectionTitle: "Supported Models", sectionIcon: "Grid", text: `${model.name} ${model.description} ${model.useCases} ${model.advantages} ${model.limitations}` });
  });
  API_ENDPOINTS.forEach((ep) => {
    index.push({ sectionId: "api-reference", sectionTitle: "API Reference", sectionIcon: "Code", text: `${ep.method} ${ep.route} ${ep.description}` });
  });
  return index;
}

function DocumentationPage() {
  const [activeSection, setActiveSection] = useState("welcome");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const searchRef = useRef(null);
  const contentRef = useRef(null);

  const searchIndex = useMemo(() => buildSearchIndex(), []);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    if (!query.trim()) { setSearchResults([]); return; }
    const q = query.toLowerCase();
    const results = searchIndex
      .filter((item) => item.text.toLowerCase().includes(q))
      .slice(0, 20);
    setSearchResults(results);
  }, [searchIndex]);

  const handleSelectSearch = useCallback((sectionId) => {
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
    setActiveSection(sectionId);
    document.getElementById(`section-${sectionId}`)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
      const sections = DOC_SECTIONS.map((s) => document.getElementById(`section-${s.id}`));
      let current = "welcome";
      for (const el of sections) {
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120) current = el.id.replace("section-", "");
        }
      }
      setActiveSection(current);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const scrollToSection = (id) => {
    setActiveSection(id);
    setSidebarOpen(false);
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth" });
  };

  const currentIndex = SIDEBAR_SECTIONS.findIndex((s) => s.id === activeSection);
  const prevSection = currentIndex > 0 ? SIDEBAR_SECTIONS[currentIndex - 1] : null;
  const nextSection = currentIndex < SIDEBAR_SECTIONS.length - 1 ? SIDEBAR_SECTIONS[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
          <a href="/dashboard" className="hover:text-indigo-600 transition-colors">Home</a>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-600">Documentation</span>
          {activeSection && activeSection !== "welcome" && (
            <>
              <ChevronRight className="w-3 h-3" />
              <span className="text-indigo-600 font-medium">{SIDEBAR_SECTIONS.find((s) => s.id === activeSection)?.title}</span>
            </>
          )}
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-gray-200 transition-colors">
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <BookOpen className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">Documentation</h1>
          </div>
          <div className="relative" ref={searchRef}>
            <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2 w-64 md:w-80 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
              <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => { handleSearch(e.target.value); setShowSearch(true); }}
                onFocus={() => setShowSearch(true)}
                className="text-sm text-gray-700 bg-transparent outline-none w-full placeholder:text-gray-400"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(""); setSearchResults([]); }} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {showSearch && <SearchResults query={searchQuery} results={searchResults} onSelect={handleSelectSearch} />}
          </div>
        </div>

        <div className="flex gap-8 relative">
          {/* Sidebar */}
          <aside className={`${sidebarOpen ? "fixed inset-0 z-40 lg:relative lg:inset-auto" : "hidden"} lg:block lg:w-56 shrink-0`}>
            {sidebarOpen && (
              <div className="fixed inset-0 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}
            <nav className={`${sidebarOpen ? "fixed left-0 top-0 bottom-0 w-64 z-50 bg-white shadow-xl" : ""} lg:sticky lg:top-6 lg:w-auto lg:bg-transparent lg:shadow-none overflow-y-auto`}>
              {sidebarOpen && (
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 lg:hidden">
                  <span className="text-sm font-semibold text-gray-700">Sections</span>
                  <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg hover:bg-gray-100">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              )}
              <ul className={`${sidebarOpen ? "p-3" : ""} space-y-0.5 lg:space-y-0.5`}>
                {SIDEBAR_SECTIONS.map((s) => (
                  <li key={s.id}>
                    <button
                      onClick={() => scrollToSection(s.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                        activeSection === s.id
                          ? "bg-indigo-50 text-indigo-700"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                      }`}
                    >
                      <DocIcon name={s.icon} className="w-4 h-4 shrink-0" />
                      <span>{s.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Main Content */}
          <main ref={contentRef} className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              {DOC_SECTIONS.map((section) => (
                <div key={section.id}>
                  <SectionRenderer sectionId={section.id} />
                  {/* Section divider */}
                  {section.id !== DOC_SECTIONS[DOC_SECTIONS.length - 1].id && (
                    <div className="border-t border-gray-100 my-8" />
                  )}
                </div>
              ))}

              {/* Prev / Next */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-8">
                <div>
                  {prevSection && (
                    <button onClick={() => scrollToSection(prevSection.id)} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Previous: </span>{prevSection.title}
                    </button>
                  )}
                </div>
                <div className="text-right">
                  {nextSection && (
                    <button onClick={() => scrollToSection(nextSection.id)} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                      <span className="hidden sm:inline">Next: </span>{nextSection.title}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Scroll to top */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-indigo-600 hover:border-indigo-300 transition-all z-30"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

export default DocumentationPage;
