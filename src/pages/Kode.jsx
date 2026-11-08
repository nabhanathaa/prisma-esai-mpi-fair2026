import React, { useEffect, useMemo, useState } from 'react'
import { Download, Copy, Check } from 'lucide-react'

const FILE = 'ATLAS_Kelas_Analisis.Rmd'

// Pecah Rmd menjadi blok teks dan blok kode untuk navigasi per tahap
function parse(src) {
  const out = []
  const re = /```\{r([^}]*)\}\n([\s\S]*?)```/g
  let last = 0, m
  while ((m = re.exec(src))) {
    if (m.index > last) out.push({ type: 'md', text: src.slice(last, m.index) })
    out.push({ type: 'code', label: m[1].replace(/^[\s,]+/, '').split(',')[0] || 'chunk', text: m[2] })
    last = re.lastIndex
  }
  out.push({ type: 'md', text: src.slice(last) })
  return out
}

// Ubah teks markdown sederhana menjadi judul, tabel, dan paragraf
function mdBlocks(text) {
  const out = []
  let tbl = null
  for (const raw of text.split('\n')) {
    const l = raw.trim()
    if (l.startsWith('|')) {
      const cells = l.slice(1, -1).split('|').map(c => c.trim().replace(/[*`]/g, ''))
      if (cells.every(c => /^-+$/.test(c))) continue
      if (!tbl) { tbl = { t: 'tbl', v: [] }; out.push(tbl) }
      tbl.v.push(cells)
      continue
    }
    tbl = null
    if (!l) continue
    if (l.startsWith('# ')) out.push({ t: 'h', v: l.slice(2) })
    else out.push({ t: 'p', v: l.replace(/^#+\s*/, '').replace(/[*`]/g, '') })
  }
  return out
}

const KW = /\b(function|if|else|for|in|return|library|TRUE|FALSE|NULL|NA)\b/g
function highlight(code) {
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return code.split('\n').map(line => {
    const i = line.indexOf('#')
    const head = i >= 0 && !/["'][^"']*#/.test(line.slice(0, i + 1)) ? line.slice(0, i) : line
    const tail = head.length < line.length ? line.slice(head.length) : ''
    let h = esc(head)
      .replace(/("[^"]*")/g, '<span class="s">$1</span>')
      .replace(KW, '<span class="k">$1</span>')
      .replace(/(&lt;-|\|&gt;|%&gt;%)/g, '<span class="o">$1</span>')
      .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="n">$1</span>')
    return h + (tail ? `<span class="c">${esc(tail)}</span>` : '')
  }).join('\n')
}

export default function Kode() {
  const [src, setSrc] = useState('')
  const [copied, setCopied] = useState(null)
  useEffect(() => { fetch(`${import.meta.env.BASE_URL}kode/${FILE}`).then(r => r.text()).then(setSrc) }, [])
  const blocks = useMemo(() => parse(src.replace(/^---\n[\s\S]*?\n---\n/, '')), [src])
  const toc = blocks.filter(b => b.type === 'md').flatMap(b => [...b.text.matchAll(/^# (.+)$/gm)].map(m => m[1]))

  const copy = (t, i) => { navigator.clipboard?.writeText(t); setCopied(i); setTimeout(() => setCopied(null), 1200) }

  return (
    <div className="page">
      <header className="ph">
        <div><h1>Kode Analisis</h1><p>Telusuri metode analisis spasial, pembentukan indeks PRISMA, dan simulasi alokasi. Berkas sumber R Markdown juga dapat diunduh.</p></div>
        <a className="btn primary sm" href={`${import.meta.env.BASE_URL}kode/${FILE}`} download><Download size={15} /> Unduh .Rmd</a>
      </header>
      <div className="code-layout">
        <nav className="card toc">
          <b>Tahapan</b>
          {toc.map(t => <a key={t} href={`#${encodeURIComponent(t)}`}>{t}</a>)}
        </nav>
        <div className="code-body">
          {blocks.map((b, i) => b.type === 'md' ? (
            <div key={i} className="md">
              {mdBlocks(b.text).map((x, j) => x.t === 'h' ? <h3 key={j} id={encodeURIComponent(x.v)}>{x.v}</h3>
                : x.t === 'tbl' ? (
                  <div key={j} className="tbl-scroll"><table className="tbl"><thead><tr>{x.v[0].map(c => <th key={c}>{c}</th>)}</tr></thead>
                    <tbody>{x.v.slice(1).map((r, k) => <tr key={k}>{r.map((c, m) => <td key={m} style={{ whiteSpace: 'normal' }}>{c}</td>)}</tr>)}</tbody></table></div>)
                : <p key={j}>{x.v}</p>)}
            </div>
          ) : (
            <div key={i} className="codeblock">
              <div className="cb-head"><span>{b.label}</span><button className="icon" onClick={() => copy(b.text, i)} title="Salin">{copied === i ? <Check size={14} /> : <Copy size={14} />}</button></div>
              <pre dangerouslySetInnerHTML={{ __html: highlight(b.text) }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
