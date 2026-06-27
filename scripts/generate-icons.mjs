import { Resvg } from '@resvg/resvg-js'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const iconsDir = path.join(__dirname, '..', 'public', 'icons')

async function generate(svgString, size, outPath) {
  const resvg = new Resvg(svgString, { fitTo: { mode: 'width', value: size } })
  const png = resvg.render().asPng()
  await fs.writeFile(outPath, png)
  console.log(`Generated ${path.basename(outPath)} (${size}x${size})`)
}

const standardSvg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#1D9E75"/>
  <text x="256" y="310" font-family="system-ui,sans-serif" font-size="220" font-weight="700"
        fill="white" text-anchor="middle">OG</text>
</svg>`

const maskableSvg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#1D9E75"/>
  <text x="256" y="330" font-family="system-ui,sans-serif" font-size="180" font-weight="700"
        fill="white" text-anchor="middle">OG</text>
</svg>`

await fs.mkdir(iconsDir, { recursive: true })

await generate(standardSvg(192), 192, path.join(iconsDir, 'icon-192.png'))
await generate(standardSvg(512), 512, path.join(iconsDir, 'icon-512.png'))
await generate(maskableSvg(192), 192, path.join(iconsDir, 'icon-maskable-192.png'))
await generate(maskableSvg(512), 512, path.join(iconsDir, 'icon-maskable-512.png'))
await generate(standardSvg(180), 180, path.join(iconsDir, 'apple-touch-icon.png'))

console.log('All icons generated.')
