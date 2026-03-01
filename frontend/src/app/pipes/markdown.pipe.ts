import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({ name: 'markdown', standalone: true })
export class MarkdownPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    if (!value) return '';
    let html = this.escapeHtml(value);

    // Headers (### then ## then #)
    html = html.replace(/^### (.+)$/gm, '<h4 class="text-xs font-bold text-emerald-400 mt-3 mb-1">$1</h4>');
    html = html.replace(/^## (.+)$/gm, '<h3 class="text-sm font-bold text-emerald-400 mt-3 mb-1">$1</h3>');

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-slate-700 text-emerald-300 text-xs font-mono">$1</code>');

    // Bullet points (- or *)
    html = html.replace(/^[\-\*] (.+)$/gm, '<li class="ml-3 pl-1">$1</li>');
    html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, '<ul class="list-disc list-outside space-y-0.5 my-1.5">$&</ul>');

    // Numbered lists
    html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-3 pl-1">$1</li>');

    // Line breaks (double newline = paragraph)
    html = html.replace(/\n\n/g, '</p><p class="mt-2">');
    html = html.replace(/\n/g, '<br>');
    html = '<p>' + html + '</p>';

    // Clean up empty paragraphs
    html = html.replace(/<p>\s*<\/p>/g, '');
    html = html.replace(/<p>\s*<(ul|h[34])/g, '<$1');
    html = html.replace(/<\/(ul|h[34])>\s*<\/p>/g, '</$1>');

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
