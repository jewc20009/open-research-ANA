'use client'

import Toolbar from "@/components/toolbar";
import DocumentViewer from "@/components/document-viewer";
import Chat from "@/components/chat";
import { useEffect, useMemo, useRef, useState } from "react";
import { GripVertical } from "lucide-react";
import { useCoAgentStateRender } from "@copilotkit/react-core";
import { ResearchState } from "@/lib/types";
import { Progress } from "@/components/progress";
import SourcesModal from "@/components/resource-modal";
import { useResearch } from "@/components/research-context";

const CHAT_MIN_WIDTH = 30;
const CHAT_MAX_WIDTH = 50;

export default function HomePage() {
    const [chatWidth, setChatWidth] = useState(50) // Initial chat width in percentage
    const dividerRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const { state, setResearchState } = useResearch()

    useCoAgentStateRender<ResearchState>({
        name: 'agent',
        render: ({ state }) => {
            if (!state.logs || state.logs.length === 0) {
                return null;
            }
            return <Progress logs={state.logs} />;
        },
    });

    useEffect(() => {
        const divider = dividerRef.current
        const container = containerRef.current
        let isDragging = false

        const startDragging = () => {
            isDragging = true
            document.addEventListener('mousemove', onDrag)
            document.addEventListener('mouseup', stopDragging)
        }

        const onDrag = (e: MouseEvent) => {
            if (!isDragging) return
            const containerRect = container!.getBoundingClientRect()
            const newChatWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100
            setChatWidth(Math.max(CHAT_MIN_WIDTH, Math.min(CHAT_MAX_WIDTH, newChatWidth))) // Limit chat width between 20% and 80%
        }

        const stopDragging = () => {
            isDragging = false
            document.removeEventListener('mousemove', onDrag)
            document.removeEventListener('mouseup', stopDragging)
        }

        divider?.addEventListener('mousedown', startDragging)

        return () => {
            divider?.removeEventListener('mousedown', startDragging)
            document.removeEventListener('mousemove', onDrag)
            document.removeEventListener('mouseup', stopDragging)
        }
    }, [])
    const {
        sections,
        title,
        intro,
        outline,
        footnotes,
        conclusion,
        cited_sources,
    } = state

    const doc = useMemo(() => ({
        sections,
        title,
        intro,
        outline,
        footnotes,
        conclusion,
        cited_sources
    }), [
        sections,
        title,
        intro,
        outline,
        footnotes,
        conclusion,
        cited_sources
    ])

    return (
        <div
            className="h-screen bg-[#FAF9F6] text-[#3D2B1F] font-lato">
            <div className="grid h-full" style={{ gridTemplateColumns: 'auto 1fr' }}>
                {/* Toolbar */}
                <Toolbar />

                {/* Main Chat Window */}
                <div className="flex h-full overflow-hidden" ref={containerRef}>
                    <div style={{width: `${chatWidth}%`}}>
                        <Chat
                            onSubmitMessage={async () => {
                                // clear the logs before starting the new research
                                setResearchState({ ...state, logs: [] });
                                await new Promise((resolve) => setTimeout(resolve, 30));
                            }}
                        />
                    </div>

                    <div
                        ref={dividerRef}
                        className="w-1 bg-[var(--border)] hover:bg-[var(--primary)] cursor-col-resize flex items-center justify-center"
                    >
                        <GripVertical className="h-6 w-6 text-[var(--primary)]"/>
                    </div>

                    {/* Document Viewer */}
                    <DocumentViewer doc={doc} />
                </div>
            </div>
            <SourcesModal />
        </div>
    );
}
