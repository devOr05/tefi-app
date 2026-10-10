import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { SITE } from './src/site/content'
import { renderLlms, renderPage, renderRobots, renderSitemap, renderVersion } from './src/site/render'
import type { BuildInfo } from './src/version'

const git = (args: string) => {
  try {
    return execSync(`git ${args}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return ''
  }
}

// Versión que se compila: número de package.json, commit y fecha del commit (no la hora de compilación, así
// el mismo commit da siempre el mismo build). Vercel y GitHub Actions compilan un checkout limpio; en una
// computadora, si hay cambios sin commit, la versión que muestra la app lo dice.
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
const onBuildServer = !!(process.env.VERCEL || process.env.CI)
const build: BuildInfo = {
  version: pkg.version,
  commit: process.env.VERCEL_GIT_COMMIT_SHA || git('rev-parse HEAD') || process.env.GITHUB_SHA || '',
  committedAt: git('show -s --format=%cI HEAD') || new Date().toISOString(),
  ...(!onBuildServer && git('status --porcelain') ? { modified: true } : {})
}

// Dirección pública que declaran las páginas (canonical, sitemap, vista previa de los links)
const siteUrl = (process.env.VITE_SITE_URL || SITE.url).replace(/\/$/, '')

// Publica, además de la app: los metadatos y el texto sin JavaScript de cada página, la página en español
// (/es/), robots.txt, sitemap.xml, llms.txt y version.json. El contenido está en src/site/.
function tefiSite(): Plugin {
  return {
    name: 'tefi-site',
    enforce: 'post',
    transformIndexHtml(html, ctx) {
      // `vite dev` no arma un bundle: sirve la página en inglés ya completa
      return ctx.server ? renderPage(html, siteUrl, 'en', build) : html
    },
    generateBundle(_options, bundle) {
      const page = bundle['index.html']
      if (!page || page.type !== 'asset') throw new Error('tefi-site: index.html is not in the bundle')
      // A esta altura index.html ya tiene los <script> y <link> del build: sirve de molde para los dos idiomas
      const template = String(page.source)
      page.source = renderPage(template, siteUrl, 'en', build)

      const emit = (fileName: string, source: string) => this.emitFile({ type: 'asset', fileName, source })
      emit('es/index.html', renderPage(template, siteUrl, 'es', build))
      emit('robots.txt', renderRobots(siteUrl))
      emit('sitemap.xml', renderSitemap(siteUrl, build))
      emit('llms.txt', renderLlms(siteUrl, build))
      emit('version.json', renderVersion(build))
    }
  }
}

export default defineConfig({
  define: {
    'process.env': {},
    global: 'globalThis',
    __TEFI_BUILD__: JSON.stringify(build)
  },
  resolve: {
    alias: {
      buffer: 'buffer'
    }
  },
  plugins: [
    react(),
    tefiSite(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon.svg'],
      manifest: {
        name: 'Tefi.app - Corner store credit notebook on Solana',
        short_name: 'Tefi',
        description: 'Corner store credit (el fiado) co-signed by store and neighbor on Solana, building a portable repayment history',
        theme_color: '#00A650',
        background_color: '#F5F5F5',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'icon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // Las imágenes de vista previa de los links son para WhatsApp y los buscadores: el teléfono no las guarda
        globIgnores: ['**/node_modules/**/*', '**/og-image*.png'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
      }
    })
  ]
})
