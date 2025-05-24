import { Injectable, NotFoundException } from '@nestjs/common';
import { marked } from 'marked';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class DocsService {
  private readonly docsPath = path.join(process.cwd(), 'docs');

  private readonly versions = ['v1'];

  private readonly pages = {
    v1: [
      {
        id: 'introduction',
        title: 'Introdução',
        file: 'introduction.md',
        category: 'Começando',
        icon: '🚀',
        description: 'Visão geral da API e suas funcionalidades',
      },
      {
        id: 'installation',
        title: 'Instalação',
        file: 'installation.md',
        category: 'Começando',
        icon: '⚙️',
        description: 'Como instalar e configurar o ambiente',
      },
      {
        id: 'waba-setup',
        title: 'Configuração WABA',
        file: 'waba-setup.md',
        category: 'Configuração',
        icon: '📱',
        description: 'Como configurar sua conta WhatsApp Business API',
      },
      {
        id: 'company-management',
        title: 'Gestão de Empresas',
        file: 'company-management.md',
        category: 'Configuração',
        icon: '🏢',
        description: 'Gerenciamento de empresas e configurações',
      },
      {
        id: 'channel-setup',
        title: 'Configuração de Canais',
        file: 'channel-setup.md',
        category: 'Configuração',
        icon: '📞',
        description: 'Como configurar canais de WhatsApp',
      },
      {
        id: 'agent-management',
        title: 'Gestão de Atendentes',
        file: 'agent-management.md',
        category: 'Usuários',
        icon: '👥',
        description: 'Gerenciamento de atendentes e permissões',
      },
      {
        id: 'channel-flow',
        title: 'Fluxo dos channels ',
        file: 'channel-flow.md',
        category: 'Flows',
        description: 'Fluxo dos chennels ',
      },
      {
        id: 'message-types',
        title: 'Tipos de Mensagens',
        file: 'message-types.md',
        category: 'Mensagens',
        icon: '💬',
        description: 'Tipos de mensagens suportados e exemplos',
      },
      {
        id: 'webhooks',
        title: 'Webhook',
        file: 'webhook.md',
        category: 'Integrações',
        icon: '🔄',
        description: 'Configuração e uso de webhooks',
      },
    ],
  };

  async getDocs(
    version: string = 'v1',
    pageId: string = 'introduction',
  ): Promise<string> {
    if (!this.versions.includes(version)) {
      throw new NotFoundException(`Versão ${version} não encontrada`);
    }

    const pages = this.pages[version];
    const page = pages.find((p) => p.id === pageId);

    if (!page) {
      throw new NotFoundException(`Página ${pageId} não encontrada`);
    }

    const currentPageIndex = pages.findIndex((p) => p.id === pageId);
    const prevPage = currentPageIndex > 0 ? pages[currentPageIndex - 1] : null;
    const nextPage =
      currentPageIndex < pages.length - 1 ? pages[currentPageIndex + 1] : null;

    try {
      const filePath = path.join(this.docsPath, page.file);

      try {
        await fs.access(filePath);
      } catch (error) {
        throw new NotFoundException(`Arquivo ${page.file} não encontrado`);
      }

      const mdContent = await fs.readFile(filePath, 'utf-8');

      const htmlContent = marked(mdContent);

      return `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>WhatsApp API - ${version.toUpperCase()} - ${page.title}</title>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.5.0/github-markdown.min.css">
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css">
          <style>
            :root {
              --sidebar-width: 300px;
              --top-nav-height: 60px;
              --primary-color: #25D366;
              --background-dark: #111827;
              --text-color: #E5E7EB;
              --border-color: #374151;
              --hover-color: #1F2937;
              --code-background: #0D1117;
            }
            
            body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
              background: var(--background-dark);
              color: var(--text-color);
              line-height: 1.6;
            }

            .top-nav {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              height: var(--top-nav-height);
              background: var(--background-dark);
              border-bottom: 1px solid var(--border-color);
              display: flex;
              align-items: center;
              padding: 0 20px;
              z-index: 1000;
              box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            }

            .top-nav .logo {
              font-size: 1.5em;
              font-weight: bold;
              color: var(--text-color);
              text-decoration: none;
              display: flex;
              align-items: center;
              gap: 10px;
            }

            .logo img {
              height: 32px;
            }
            
            .container {
              display: flex;
              min-height: 100vh;
              padding-top: var(--top-nav-height);
            }
            
            .sidebar {
              width: var(--sidebar-width);
              background: var(--background-dark);
              border-right: 1px solid var(--border-color);
              position: fixed;
              height: calc(100vh - var(--top-nav-height));
              overflow-y: auto;
              padding-bottom: 40px;
              scrollbar-width: thin;
              scrollbar-color: var(--border-color) var(--background-dark);
            }
            
            .sidebar-header {
              padding: 1.5rem;
              border-bottom: 1px solid var(--border-color);
              font-size: 1.2em;
              font-weight: 600;
              color: var(--primary-color);
            }

            .version-selector {
              padding: 1rem;
              border-bottom: 1px solid var(--border-color);
            }

            .version-selector select {
              width: 100%;
              padding: 0.75rem;
              border-radius: 6px;
              border: 1px solid var(--border-color);
              background: var(--hover-color);
              color: var(--text-color);
              font-size: 14px;
              cursor: pointer;
            }
            
            .sidebar-category {
              padding: 1.5rem 1rem 0.5rem;
              color: #9CA3AF;
              font-size: 0.85em;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .sidebar-menu {
              padding: 0 1rem;
            }
            
            .sidebar-menu a {
              display: flex;
              align-items: center;
              gap: 10px;
              padding: 0.75rem;
              color: var(--text-color);
              text-decoration: none;
              border-radius: 6px;
              margin-bottom: 0.25rem;
              font-size: 0.95em;
              transition: all 0.2s ease;
            }
            
            .sidebar-menu a:hover {
              background: var(--hover-color);
              color: var(--primary-color);
            }

            .sidebar-menu a.active {
              background: var(--hover-color);
              color: var(--primary-color);
              font-weight: 500;
            }

            .sidebar-menu .icon {
              font-size: 1.2em;
              width: 24px;
              text-align: center;
            }

            .sidebar-menu .description {
              font-size: 0.85em;
              color: #9CA3AF;
              margin-top: 0.25rem;
              text-align: left; 
            }
            
            .content {
              margin-left: var(--sidebar-width);
              flex: 1;
              padding: 2rem 3rem;
              max-width: 1200px;
            }

            .page-header {
              margin-bottom: 3rem;
              padding-bottom: 1.5rem;
              border-bottom: 1px solid var(--border-color);
            }

            .page-header h1 {
              margin: 0;
              font-size: 2.5em;
              color: white;
              font-weight: 600;
            }

            .page-header p {
              margin: 1rem 0 0;
              font-size: 1.1em;
              color: #9CA3AF;
            }
            
            .markdown-body {
              background: var(--background-dark);
              color: var(--text-color);
              font-size: 16px;
            }

            .markdown-body h1,
            .markdown-body h2,
            .markdown-body h3,
            .markdown-body h4,
            .markdown-body h5,
            .markdown-body h6 {
              color: white;
              border-bottom-color: var(--border-color);
              margin-top: 2em;
              margin-bottom: 1em;
            }

            .markdown-body h2 {
              font-size: 1.8em;
            }

            .markdown-body h3 {
              font-size: 1.4em;
            }
            
            .markdown-body code {
              background: var(--code-background);
              color: #E5E7EB;
              padding: 0.2em 0.4em;
              border-radius: 4px;
              font-size: 0.9em;
            }
            
            .markdown-body pre {
              background: var(--code-background) !important;
              border-radius: 8px !important;
              padding: 1rem !important;
              margin: 1rem 0 !important;
              border: 1px solid var(--border-color);
            }
            
            .markdown-body pre code {
              background: none;
              padding: 0;
              font-family: 'Fira Code', monospace !important;
              font-size: 0.9em !important;
            }

            .method-badge {
              display: inline-block;
              padding: 0.25rem 0.75rem;
              border-radius: 4px;
              font-size: 0.85em;
              font-weight: 600;
              margin-right: 0.5rem;
              text-transform: uppercase;
            }

            .method-get { background: #059669; color: white; }
            .method-post { background: #2563EB; color: white; }
            .method-put { background: #7C3AED; color: white; }
            .method-delete { background: #DC2626; color: white; }

            .api-url {
              display: inline-block;
              padding: 0.25rem 0.75rem;
              background: var(--code-background);
              border-radius: 4px;
              font-family: 'Fira Code', monospace;
              font-size: 0.9em;
              color: #E5E7EB;
            }

            .endpoint-container {
              border: 1px solid var(--border-color);
              border-radius: 8px;
              margin: 1.5rem 0;
              overflow: hidden;
              background: var(--hover-color);
            }

            .endpoint-header {
              padding: 1rem;
              background: var(--code-background);
              border-bottom: 1px solid var(--border-color);
              display: flex;
              align-items: center;
              gap: 1rem;
            }

            .swagger-link {
              margin-left: auto;
              padding: 0.5rem 1rem;
              background: var(--primary-color);
              color: white;
              text-decoration: none;
              border-radius: 4px;
              font-size: 0.9em;
              display: flex;
              align-items: center;
              gap: 0.5rem;
              transition: all 0.2s ease;
            }

            .swagger-link:hover {
              background: #1fa855;
            }

            .endpoint-body {
              padding: 1.5rem;
            }

            .parameter-table {
              width: 100%;
              border-collapse: collapse;
              margin: 1rem 0;
            }

            .parameter-table th,
            .parameter-table td {
              padding: 0.75rem;
              border: 1px solid var(--border-color);
              text-align: left;
            }

            .parameter-table th {
              background: var(--code-background);
              font-weight: 600;
            }

            .mermaid {
              background: #191919;
              padding: 2rem;
              border-radius: 12px;
              margin: 2rem 0;
              border: 1px solid #404040;
            }

            .mermaid .actor {
              fill: #2d2d2d !important;
              stroke: #404040 !important;
              stroke-width: 1px !important;
            }

            .mermaid .messageText {
              font-weight: 400 !important;
              font-size: 13px !important;
              fill: #e0e0e0 !important;
            }

            .mermaid line[class^="messageLine"] {
              stroke: #505050 !important;
              stroke-width: 1px !important;
            }

            .mermaid .messageLine0, 
            .mermaid .messageLine1 {
              stroke-width: 1px !important;
            }

            .mermaid .actor-line {
              stroke: #404040 !important;
              stroke-width: 1px !important;
            }

            .mermaid text.actor {
              font-size: 14px !important;
              font-weight: 500 !important;
            }

            .mermaid .note {
              fill: #2d2d2d !important;
              stroke: #404040 !important;
              stroke-width: 1px !important;
            }

            .mermaid .noteText {
              fill: #e0e0e0 !important;
              font-weight: 400 !important;
            }

            .mermaid .entityBox {
              fill: #2d2d2d !important;
              stroke: #404040 !important;
            }

            .mermaid .entityLabel {
              fill: #e0e0e0 !important;
            }

            .mermaid .relationshipLabelBox {
              fill: #2d2d2d !important;
              stroke: none !important;
            }

            .mermaid .relationshipLine {
              stroke: #505050 !important;
              stroke-width: 1px !important;
            }

            .mermaid .statediagram-state rect {
              fill: #2d2d2d !important;
              stroke: #404040 !important;
              stroke-width: 1px !important;
            }

            .mermaid .stateLabel {
              fill: #e0e0e0 !important;
            }

            .mermaid .nodeLabel {
              color: #e0e0e0 !important;
            }

            .breadcrumbs {
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 1rem 0;
              color: #9CA3AF;
              font-size: 0.9em;
            }

            .breadcrumbs a {
              color: var(--primary-color);
              text-decoration: none;
            }

            .breadcrumbs .separator {
              color: var(--border-color);
            }

            .navigation {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-top: 4rem;
              padding-top: 2rem;
              border-top: 1px solid var(--border-color);
              gap: 1rem;
            }

            .navigation-link {
              display: flex;
              align-items: center;
              padding: 1rem;
              text-decoration: none;
              border: 1px solid var(--border-color);
              border-radius: 6px;
              color: var(--text-color);
              transition: all 0.2s ease;
              min-width: 200px;
            }

            .navigation-link:hover {
              background: var(--hover-color);
              border-color: var(--primary-color);
              color: var(--primary-color);
            }

            .navigation-link.prev {
              text-align: left;
            }

            .navigation-link.next {
              text-align: right;
              margin-left: auto;
            }

            .navigation-link .label {
              font-size: 0.8em;
              opacity: 0.7;
              display: block;
              margin-bottom: 0.25rem;
            }

            .navigation-link .title {
              font-weight: 500;
            }

            .navigation-link.prev::before {
              content: "←";
              margin-right: 0.5rem;
            }

            .navigation-link.next::after {
              content: "→";
              margin-left: 0.5rem;
            }

            .on-this-page {
              position: fixed;
              top: calc(var(--top-nav-height) + 2rem);
              right: 2rem;
              width: 240px;
              max-height: calc(100vh - var(--top-nav-height) - 4rem);
              overflow-y: auto;
              padding: 1rem;
              border: 1px solid var(--border-color);
              border-radius: 6px;
              background: var(--background-dark);
            }

            .on-this-page h3 {
              margin: 0 0 1rem;
              font-size: 0.9em;
              text-transform: uppercase;
              color: #9CA3AF;
            }

            .on-this-page ul {
              list-style: none;
              padding: 0;
              margin: 0;
            }

            .on-this-page li {
              margin-bottom: 0.5rem;
            }

            .on-this-page a {
              display: block;
              padding: 0.25rem 0;
              color: var(--text-color);
              text-decoration: none;
              font-size: 0.9em;
              transition: color 0.2s ease;
            }

            .on-this-page a:hover {
              color: var(--primary-color);
            }

            @media (max-width: 1400px) {
              .on-this-page {
                display: none;
              }
            }

            @media (max-width: 768px) {
              :root {
                --sidebar-width: 100%;
              }
              
              .sidebar {
                transform: translateX(-100%);
                transition: transform 0.3s ease;
              }
              
              .sidebar.active {
                transform: translateX(0);
              }
              
              .content {
                margin-left: 0;
                padding: 1rem;
              }

              .mobile-menu-button {
                display: block;
                position: fixed;
                top: 1rem;
                right: 1rem;
                padding: 0.5rem;
                background: var(--hover-color);
                border: 1px solid var(--border-color);
                border-radius: 4px;
                color: var(--text-color);
                font-size: 1.5em;
                cursor: pointer;
                z-index: 1001;
              }
            }

            .node rect {
              stroke: #404040;
              fill: #2d2d2d;
              stroke-width: 1px;
            }
            
            .node text {
              fill: #e0e0e0;
              font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
              font-size: 13px;
            }
            
            .edgePath path {
              stroke: #505050;
              stroke-width: 1px;
              fill: none;
            }
            
            .edgePath marker {
              fill: #505050;
            }

            .flow-diagram {
              background: #191919;
              padding: 2rem;
              border-radius: 12px;
              margin: 2rem 0;
              border: 1px solid #404040;
            }
          </style>
        </head>
        <body>
          <nav class="top-nav">
            <a href="/api/v1/docs/whatsapp" class="logo">
              Synertalk API
            </a>
          </nav>
          <div class="container">
            <div class="sidebar">
              <div class="version-selector">
                <select onchange="window.location.href='/api/v1/docs/whatsapp/' + this.value + '/${pageId}'">
                  ${this.versions
                    .map(
                      (v) => `
                    <option value="${v}" ${v === version ? 'selected' : ''}>
                      API ${v.toUpperCase()}
                    </option>
                  `,
                    )
                    .join('')}
                </select>
              </div>
              ${Object.entries(this.groupPagesByCategory(pages))
                .map(
                  ([category, categoryPages]) => `
                <div class="sidebar-category">${category}</div>
                <nav class="sidebar-menu">
                  ${categoryPages
                    .map(
                      (p) => `
                    <a href="/api/v1/docs/whatsapp/${p.id}" class="${
                        pageId === p.id ? 'active' : ''
                      }">
                      <div>
                        <div>${p.title}</div>
                        <div class="description">${p.description}</div>
                      </div>
                    </a>
                  `,
                    )
                    .join('')}
                </nav>
              `,
                )
                .join('')}
            </div>
            <main class="content">
              <div class="breadcrumbs">
                <a href="/api/v1/docs/whatsapp">Documentação</a>
                <span class="separator">/</span>
                <span>${page.category}</span>
                <span class="separator">/</span>
                <span>${page.title}</span>
              </div>
              <article class="markdown-body">
                ${htmlContent}
              </article>
              <nav class="navigation">
                ${
                  prevPage
                    ? `
                    <a href="/api/v1/docs/whatsapp/${prevPage.id}" class="navigation-link prev">
                      <div>
                        <span class="label">Anterior</span>
                        <span class="title">${prevPage.title}</span>
                      </div>
                    </a>
                  `
                    : '<div></div>'
                }
                ${
                  nextPage
                    ? `
                    <a href="/api/v1/docs/whatsapp/${nextPage.id}" class="navigation-link next">
                      <div>
                        <span class="label">Próximo</span>
                        <span class="title">${nextPage.title}</span>
                      </div>
                    </a>
                  `
                    : '<div></div>'
                }
              </nav>
            </main>
            <div class="on-this-page">
              <h3>Nesta Página</h3>
              <div id="table-of-contents"></div>
            </div>
          </div>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-json.min.js"></script>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-typescript.min.js"></script>
          <script src="https://cdn.jsdelivr.net/npm/mermaid@11.6.0/dist/mermaid.min.js"></script>
          <script>
            mermaid.initialize({ 
              startOnLoad: true,
              theme: 'base',
              themeVariables: {
                darkMode: true,
                background: '#191919',
                primaryColor: '#2d2d2d',
                primaryTextColor: '#e0e0e0',
                primaryBorderColor: '#404040',
                lineColor: '#505050',
                secondaryColor: '#2d2d2d',
                tertiaryColor: '#2d2d2d',
                noteBkgColor: '#2d2d2d',
                noteTextColor: '#e0e0e0',
                noteBorderColor: '#404040',
                actorBkg: '#2d2d2d',
                actorTextColor: '#e0e0e0',
                actorBorder: '#404040',
                messageFontSize: '13px',
                messageTextColor: '#e0e0e0',
                labelTextColor: '#e0e0e0',
                signalColor: '#505050',
                classText: '#e0e0e0',
                stateLabelColor: '#e0e0e0',
                stateBkg: '#2d2d2d',
                labelBoxBkgColor: '#2d2d2d',
                labelBoxBorderColor: '#404040',
                mainBkg: '#2d2d2d',
                nodeBorder: '#404040',
                clusterBkg: '#2d2d2d',
                titleColor: '#e0e0e0',
                edgeLabelBackground: '#2d2d2d',
                nodeTextColor: '#e0e0e0',
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'
              },
              flowchart: {
                curve: 'basis',
                padding: 20,
                useMaxWidth: true,
                htmlLabels: true,
                diagramPadding: 8,
                nodeSpacing: 50,
                rankSpacing: 50,
                wrap: false,
                titleTopMargin: 25,
                rightAngles: true
              },
              sequence: {
                showSequenceNumbers: false,
                actorMargin: 100,
                bottomMarginAdj: 10,
                boxMargin: 10,
                boxTextMargin: 5,
                noteMargin: 10,
                messageMargin: 35,
                mirrorActors: true,
                rightAngles: true,
                useMaxWidth: true,
                wrap: false,
                width: 150,
                height: 40,
                actorFontSize: 14,
                noteFontSize: 13,
                messageFontSize: 13
              },
              er: {
                useMaxWidth: true,
                titleTopMargin: 25,
                diagramPadding: 20,
                entityPadding: 15,
                stroke: '#404040',
                fill: '#2d2d2d',
                fontSize: 13
              },
              state: {
                useMaxWidth: true,
                titleTopMargin: 25,
                diagramPadding: 8,
                textHeight: 14,
                defaultRenderer: 'dagre',
                htmlLabels: true,
                wrap: false
              }
            });

            // Mobile menu
            document.addEventListener('DOMContentLoaded', function() {
              const mobileMenuButton = document.createElement('button');
              mobileMenuButton.classList.add('mobile-menu-button');
              mobileMenuButton.innerHTML = '☰';
              document.querySelector('.top-nav').appendChild(mobileMenuButton);

              mobileMenuButton.addEventListener('click', function() {
                document.querySelector('.sidebar').classList.toggle('active');
              });

              // Generate table of contents
              const article = document.querySelector('.markdown-body');
              const toc = document.querySelector('#table-of-contents');
              const headings = article.querySelectorAll('h2, h3');
              const ul = document.createElement('ul');

              headings.forEach((heading) => {
                const id = heading.textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                heading.id = id;

                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = '#' + id;
                a.textContent = heading.textContent;
                a.style.paddingLeft = heading.tagName === 'H3' ? '1rem' : '0';
                
                li.appendChild(a);
                ul.appendChild(li);

                a.addEventListener('click', (e) => {
                  e.preventDefault();
                  heading.scrollIntoView({ behavior: 'smooth' });
                });
              });

              toc.appendChild(ul);

              // Adiciona manipulação de navegação
              const navigationLinks = document.querySelectorAll('.navigation-link');

              
              
              navigationLinks.forEach(link => {
                link.addEventListener('click', function(e) {
                  e.preventDefault();
                  const href = this.getAttribute('href');
                  window.location.href = href;
                });
              });
            });
          </script>
        </body>
        </html>
      `;
    } catch (error) {
      throw new NotFoundException(
        `Página ${pageId} não encontrada para versão ${version}`,
      );
    }
  }

  private groupPagesByCategory(pages: any[]): Record<string, any[]> {
    return pages.reduce((acc, page) => {
      const category = page.category || 'Outros';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(page);
      return acc;
    }, {});
  }
}
