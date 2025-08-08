// UI components for building the overlay interface
// Removed shadcn/ui imports
// Type definitions for highlight objects
import type { Highlight } from "@/lib/types"
// Icons for save and close actions
import { Save, X } from "lucide-react"
import React, { useState } from "react"

/**
 * Props interface for the HighlightOverlay component
 * @interface HighlightOverlayProps
 */
interface HighlightOverlayProps {
  /** The text that was selected by the user */
  selectedText: string
  /** Screen coordinates where the overlay should appear */
  position: { x: number; y: number }
  /** Callback function to save the highlight with note */
  onSave: (highlight: Omit<Highlight, "id" | "timestamp" | "color">) => void
  /** Callback function to close the overlay without saving */
  onClose: () => void
}

/**
 * HighlightOverlay Component
 *
 * A floating overlay that appears when users select text on a webpage.
 * Allows users to add an optional note to their highlight before saving.
 * The overlay intelligently positions itself to stay within the viewport.
 *
 * Features:
 * - Shows a preview of the selected text (truncated if too long)
 * - Provides a textarea for adding notes
 * - Generates XPath for precise element location tracking
 * - Handles viewport edge cases for positioning
 * - Saves highlights with metadata (URL, position, timestamp)
 *
 * @param {HighlightOverlayProps} props - Component properties
 * @returns {JSX.Element} The overlay component
 */
export function HighlightOverlay({
  selectedText,
  position,
  onSave,
  onClose
}: HighlightOverlayProps) {
  // State for storing the user's note input
  const [note, setNote] = useState("")

  /**
   * Handles saving the highlight with all necessary metadata
   * Captures the current selection, generates XPath, and creates highlight object
   * Calls the parent's onSave callback and closes the overlay
   */
  const handleSave = () => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    // Generate XPath to uniquely identify the element containing the selection
    const xpath = generateXPath(range.commonAncestorContainer)

    // Create highlight object with all required metadata (color will be added by parent)
    onSave({
      url: window.location.href,
      text: selectedText,
      note,
      startOffset: range.startOffset,
      endOffset: range.endOffset,
      xpath
    })

    onClose()
  }

  return (
    <div
      className="fixed z-[10000] p-4 w-80 shadow-lg border bg-white rounded-lg"
      style={{
        left: Math.min(position.x, window.innerWidth - 320),
        top: Math.min(position.y + 20, window.innerHeight - 200)
      }}>
      <div className="space-y-3">
        {/* Header with title and close button */}
        <div className="flex items-start justify-between">
          <h3 className="font-medium text-sm">Save Highlight</h3>
          <button
            onClick={onClose}
            className="h-6 w-6 p-0 flex items-center justify-center rounded hover:bg-gray-100"
            aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Preview of selected text with visual styling */}
        <div className="bg-yellow-100 p-2 rounded text-sm text-gray-800 border-l-4 border-yellow-400">
          "
          {selectedText.length > 100
            ? selectedText.substring(0, 100) + "..."
            : selectedText}
          "
        </div>

        {/* Textarea for adding optional notes */}
        <textarea
          placeholder="Add a note (optional)..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="min-h-20 text-sm w-full border rounded p-2 focus:outline-none focus:ring focus:border-blue-300"
        />

        {/* Action buttons for save and cancel */}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-2 text-sm font-medium transition-colors">
            <Save className="h-4 w-4" />
            Save
          </button>
          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-1 border border-gray-300 rounded px-3 py-2 text-sm font-medium hover:bg-gray-100 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Generates an XPath expression for a given DOM node
 *
 * XPath provides a reliable way to locate elements even after page changes.
 * This function creates a path from the root document to the target element
 * by traversing up the DOM tree and noting each element's position among siblings.
 *
 * The generated XPath format: /html[1]/body[1]/div[2]/p[1]
 * Numbers indicate the element's position among same-type siblings.
 *
 * @param {Node} element - The DOM node to generate XPath for
 * @returns {string} The XPath expression as a string
 */
function generateXPath(element: Node): string {
  // Handle text nodes by getting their parent element
  if (element.nodeType === Node.TEXT_NODE) {
    element = element.parentNode!
  }

  // Only process element nodes
  if (element.nodeType !== Node.ELEMENT_NODE) {
    return ""
  }

  const xpath: string[] = []
  let current = element as Element

  // Traverse up the DOM tree to build the path
  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let index = 1
    let sibling = current.previousSibling

    // Count same-name siblings that come before this element
    while (sibling) {
      if (
        sibling.nodeType === Node.ELEMENT_NODE &&
        sibling.nodeName === current.nodeName
      ) {
        index++
      }
      sibling = sibling.previousSibling
    }

    // Build path segment: tagname[position]
    const tagName = current.nodeName.toLowerCase()
    xpath.unshift(`${tagName}[${index}]`)
    current = current.parentNode as Element
  }

  // Return complete XPath starting with root slash
  return `/${xpath.join("/")}`
}
