import DOMPurify from 'dompurify';

export function renderCitation(citation: { message: string, url: string }): string {
	return `<p>
		<span style="vertical-align: text-bottom" aria-hidden="true">Warning</span>
		${DOMPurify.sanitize(citation.message)}
		<a href="${DOMPurify.sanitize(citation.url)}" target="_blank" rel="noopener noreferrer">Inspect source code</a>
	</p>`;
}
