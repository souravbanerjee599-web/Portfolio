// Run: node generate-placeholders.mjs
// Generates SVG placeholder images for dev
import { writeFileSync, mkdirSync } from 'fs'

function makeSVG(w, h, label, bg, fg = '#e9e7e2') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="${bg}"/>
  <rect x="1" y="1" width="${w-2}" height="${h-2}" fill="none" stroke="${fg}" stroke-opacity="0.2"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
    font-family="monospace" font-size="14" fill="${fg}" opacity="0.5">${label}</text>
</svg>`
}

const portraits = [
  ['public/images/portrait-a.jpg', 600, 800, 'PORTRAIT A', '#1a1825'],
  ['public/images/portrait-b.jpg', 600, 800, 'PORTRAIT B', '#141220'],
]

const projects = [
  { dir: 'public/images/dotpvp', name: 'DOTPVP', bg: '#0d1117', count: 6 },
  { dir: 'public/images/siru', name: 'SIRU', bg: '#0e1012', count: 6 },
  { dir: 'public/images/agent', name: 'AGENT', bg: '#10100e', count: 6 },
]

const thumbs = [
  ['public/images/dotpvp-thumb.jpg', 800, 500, 'DOTPVP DASHBOARD', '#0d1117'],
  ['public/images/siru-thumb.jpg', 800, 500, 'SIRU MOBILE APP', '#0e1012'],
  ['public/images/agent-thumb.jpg', 800, 500, 'AGENT DASHBOARD', '#10100e'],
]

for (const [path, w, h, label, bg] of [...portraits, ...thumbs]) {
  writeFileSync(path, makeSVG(w, h, label, bg))
  console.log('wrote', path)
}

for (const { dir, name, bg, count } of projects) {
  mkdirSync(dir, { recursive: true })
  for (let i = 1; i <= count; i++) {
    const label = `${name} — SLIDE ${String(i).padStart(2, '0')}`
    writeFileSync(`${dir}/${String(i).padStart(2, '0')}.jpg`, makeSVG(1600, 900, label, bg))
    console.log('wrote', `${dir}/${i}.jpg`)
  }
}

console.log('Done.')
