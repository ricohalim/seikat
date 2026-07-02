import React from 'react';
import Link from 'next/link';
import { ExternalLink, MessageCircle, ClipboardList } from 'lucide-react';

// ─── Inline markdown parser ────────────────────────────────────────────────
// Handles: **bold**, *italic*, [text](url)  and plain https:// URLs
function parseInline(text: string): React.ReactNode {
    // Tokens: **bold**, *italic*, [text](url), https://...
    const tokenRegex = /(\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)]+)\)|(https?:\/\/[^\s]+))/g;
    const result: React.ReactNode[] = [];
    let last = 0;
    let match: RegExpExecArray | null;
    let key = 0;

    while ((match = tokenRegex.exec(text)) !== null) {
        if (match.index > last) {
            result.push(<span key={key++}>{text.slice(last, match.index)}</span>);
        }

        const [full, , boldContent, italicContent, linkLabel, linkHref, plainUrl] = match;

        if (boldContent) {
            result.push(<strong key={key++}>{boldContent}</strong>);
        } else if (italicContent) {
            result.push(<em key={key++}>{italicContent}</em>);
        } else if (linkLabel && linkHref) {
            const isInternal = linkHref.startsWith('/');
            const isSurvey = linkHref.includes('/survey');
            if (isInternal) {
                result.push(
                    <Link
                        key={key++}
                        href={linkHref}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-bold border transition shadow-sm ${
                            isSurvey
                                ? 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100'
                                : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                        }`}
                    >
                        {isSurvey && <ClipboardList size={13} />}
                        {linkLabel}
                    </Link>
                );
            } else {
                result.push(
                    <a
                        key={key++}
                        href={linkHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition shadow-sm"
                    >
                        <ExternalLink size={13} />
                        {linkLabel}
                    </a>
                );
            }
        } else if (plainUrl) {
            const isWhatsapp = plainUrl.includes('chat.whatsapp.com') || plainUrl.includes('wa.me');
            result.push(
                <a
                    key={key++}
                    href={plainUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-bold border transition shadow-sm ${
                        isWhatsapp
                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                            : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                    }`}
                >
                    {isWhatsapp ? <MessageCircle size={13} /> : <ExternalLink size={13} />}
                    {isWhatsapp ? 'WhatsApp' : 'Link'}
                </a>
            );
        }

        last = match.index + full.length;
    }

    if (last < text.length) {
        result.push(<span key={key++}>{text.slice(last)}</span>);
    }

    return result.length === 1 ? result[0] : <>{result}</>;
}

// ─── Main linkify ──────────────────────────────────────────────────────────

export function linkify(text: string): React.ReactNode {
    if (!text) return text;

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];

    let currentGrid: React.ReactNode[] = [];

    const flushGrid = () => {
        if (currentGrid.length > 0) {
            elements.push(
                <div key={`grid-${elements.length}`} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 my-4">
                    {currentGrid}
                </div>
            );
            currentGrid = [];
        }
    };

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        // Skip empty lines if they are between cards to maintain grid continuity
        if (!line) {
            let nextNonEmptyIndex = i + 1;
            while (nextNonEmptyIndex < lines.length && !lines[nextNonEmptyIndex].trim()) {
                nextNonEmptyIndex++;
            }
            if (nextNonEmptyIndex < lines.length) {
                const nextLineText = lines[nextNonEmptyIndex].trim();
                const afterNextLineText = nextNonEmptyIndex + 1 < lines.length ? lines[nextNonEmptyIndex + 1].trim() : '';

                const isNextCardUrlOnly = !!nextLineText.match(urlRegex) && nextLineText === nextLineText.match(urlRegex)?.[0];
                const isNextCardTextUrl = !nextLineText.match(urlRegex) && !!afterNextLineText.match(urlRegex) && afterNextLineText === afterNextLineText.match(urlRegex)?.[0];

                if (isNextCardUrlOnly || isNextCardTextUrl) {
                    continue;
                }
            }

            flushGrid();
            elements.push(<div key={`empty-${i}`} className="h-2"></div>);
            continue;
        }

        const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
        const isNextLineOnlyUrl = !!nextLine.match(urlRegex) && nextLine === nextLine.match(urlRegex)?.[0];

        // Case 1: Current line is text, next line is exactly one URL
        if (!line.match(urlRegex) && isNextLineOnlyUrl) {
            const url = nextLine;
            const isWhatsapp = url.includes('chat.whatsapp.com') || url.includes('wa.me');

            currentGrid.push(
                <a
                    key={`card-${i}`}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-between p-3 rounded-xl border transition hover:shadow-md ${isWhatsapp
                            ? 'bg-green-50/50 border-green-100 hover:border-green-300'
                            : 'bg-blue-50/50 border-blue-100 hover:border-blue-300'
                        }`}
                >
                    <span className="font-semibold text-gray-800 text-sm line-clamp-2 pr-2">{line}</span>
                    <div className={`p-2 rounded-full shrink-0 ${isWhatsapp ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                        {isWhatsapp ? <MessageCircle size={18} /> : <ExternalLink size={18} />}
                    </div>
                </a>
            );
            i++;
            continue;
        }

        // Case 2: Current line IS a URL by itself
        let isCurrentLineOnlyUrl = !!line.match(urlRegex) && line === line.match(urlRegex)?.[0];
        if (isCurrentLineOnlyUrl) {
            const url = line;
            const isWhatsapp = url.includes('chat.whatsapp.com') || url.includes('wa.me');

            currentGrid.push(
                <a
                    key={`url-${i}`}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 p-3 rounded-xl border transition hover:shadow-md ${isWhatsapp
                            ? 'bg-green-50/50 border-green-100 hover:border-green-300'
                            : 'bg-blue-50/50 border-blue-100 hover:border-blue-300'
                        }`}
                >
                    <div className={`p-2 rounded-full shrink-0 ${isWhatsapp ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                        {isWhatsapp ? <MessageCircle size={18} /> : <ExternalLink size={18} />}
                    </div>
                    <span className="font-medium text-sm line-clamp-1 break-all text-gray-700">
                        {isWhatsapp ? 'WhatsApp Group' : url}
                    </span>
                </a>
            );
            continue;
        }

        flushGrid();

        // Case 3: Inline markdown (bold, italic, [text](url), plain URLs)
        elements.push(
            <p key={`text-${i}`} className="min-h-[1.5rem] flex flex-wrap items-center gap-1">
                {parseInline(lines[i])}
            </p>
        );
    }

    flushGrid();

    return <div className="space-y-1">{elements}</div>;
}

