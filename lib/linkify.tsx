import React from 'react';
import { ExternalLink, MessageCircle } from 'lucide-react';

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
                    continue; // skip this empty line, keep grid open
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
            i++; // skip next line since we consumed it
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

        // Case 3: Line with inline URLs or plain text string
        const parts = lines[i].split(urlRegex); // use original line to preserve spaces
        if (parts.length === 1) {
            elements.push(<p key={`text-${i}`} className="min-h-[1.5rem]">{lines[i]}</p>);
        } else {
            elements.push(
                <div key={`inline-${i}`} className={`flex flex-wrap items-center gap-2`}>
                    {parts.map((part, j) => {
                        if (part.match(urlRegex)) {
                            const isWhatsapp = part.includes('chat.whatsapp.com') || part.includes('wa.me');
                            return (
                                <a
                                    key={j}
                                    href={part}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-bold transition shadow-sm border ${isWhatsapp
                                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-300'
                                            : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300'
                                        }`}
                                    title={part}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {isWhatsapp ? <MessageCircle size={14} /> : <ExternalLink size={14} />}
                                    {isWhatsapp ? 'Chat' : 'Link'}
                                </a>
                            );
                        }
                        return part ? <span key={j} className="whitespace-pre-wrap">{part}</span> : null;
                    })}
                </div>
            );
        }
    }

    flushGrid();

    return <div className="space-y-1">{elements}</div>;
}
