// UI components for building the tooltip interface
// Removed shadcn/ui imports
// Type definitions for highlight objects
import type { Highlight } from "@/lib/types"
// Icons for various actions (edit, save, delete, close)
import { Edit2, Save, Trash2, X } from "lucide-react"
import React, { useState } from "react"

/**
 * Props interface for the HighlightTooltip component
 * @interface HighlightTooltipProps
 */
interface HighlightTooltipProps {
  /** The highlight object to display and potentially edit */
  highlight: Highlight
  /** Screen coordinates where the tooltip should appear */
  position: { x: number; y: number }
  /** Callback function to update the highlight with changes */
  onUpdate: (id: string, updates: Partial<Highlight>) => void
  /** Callback function to delete the highlight */
  onDelete: (id: string) => void
  /** Callback function to close the tooltip */
  onClose: () => void
}

/**
 * HighlightTooltip Component
 *
 * An interactive tooltip that appears when users click on existing highlights.
 * Provides functionality to view, edit, and delete saved highlights.
 * The tooltip supports two modes: viewing mode and editing mode.
 *
 * Features:
 * - Displays the highlighted text with visual preview
 * - Shows existing notes or provides option to add notes
 * - Toggle between view and edit modes for notes
 * - Delete functionality with confirmation dialog
 * - Smart positioning to stay within viewport
 * - Shows creation timestamp for reference
 *
 * @param {HighlightTooltipProps} props - Component properties
 * @returns {JSX.Element} The tooltip component
 */
export function HighlightTooltip({
  highlight,
  position,
  onUpdate,
  onDelete,
  onClose
}: HighlightTooltipProps) {
  // State for toggling between view and edit modes
  const [isEditing, setIsEditing] = useState(false)
  // State for managing the note text during editing
  const [editNote, setEditNote] = useState(highlight.note)

  /**
   * Handles saving changes to the highlight note
   * Updates the highlight through the parent callback and exits edit mode
   */
  const handleSave = () => {
    onUpdate(highlight.id, { note: editNote })
    setIsEditing(false)
  }

  /**
   * Handles deleting the highlight with user confirmation
   * Shows a confirmation dialog before proceeding with deletion
   */
  const handleDelete = () => {
    if (confirm("Delete this highlight?")) {
      onDelete(highlight.id)
      onClose()
    }
  }

  return (
    <div
      className="fixed z-[10000] p-3 w-72 shadow-lg border bg-white rounded-lg"
      style={{
        left: Math.min(position.x, window.innerWidth - 288),
        top: Math.min(position.y - 10, window.innerHeight - 200)
      }}>
      <div className="space-y-3">
        {/* Header with title and close button */}
        <div className="flex items-start justify-between">
          <h3 className="font-medium text-sm text-gray-900">Saved Highlight</h3>
          <button
            onClick={onClose}
            className="h-6 w-6 p-0 flex items-center justify-center rounded hover:bg-gray-100"
            aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Preview of the highlighted text with visual styling */}
        <div className="bg-yellow-100 p-2 rounded text-sm text-gray-800 border-l-4 border-yellow-400">
          "
          {highlight.text.length > 80
            ? highlight.text.substring(0, 80) + "..."
            : highlight.text}
          "
        </div>

        {/* Conditional rendering: Edit mode vs View mode */}
        {isEditing ? (
          // Edit mode: Textarea for modifying notes
          <div className="space-y-2">
            <textarea
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              className="min-h-16 text-sm w-full border rounded p-2 focus:outline-none focus:ring focus:border-blue-300"
              placeholder="Add a note..."
            />
            {/* Edit mode action buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-2 text-sm font-medium transition-colors">
                <Save className="h-4 w-4 mr-1" />
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 flex items-center justify-center gap-1 border border-gray-300 rounded px-3 py-2 text-sm font-medium hover:bg-gray-100 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          // View mode: Display existing note and action buttons
          <div className="space-y-2">
            {/* Display existing note if available */}
            {highlight.note && (
              <div className="bg-gray-50 p-2 rounded text-sm text-gray-700">
                {highlight.note}
              </div>
            )}

            {/* View mode action buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 flex items-center justify-center gap-1 border border-gray-300 rounded px-3 py-2 text-sm font-medium hover:bg-gray-100 transition-colors">
                <Edit2 className="h-4 w-4 mr-1" />
                {highlight.note ? "Edit" : "Add Note"}
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center justify-center gap-1 border border-gray-300 rounded px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Timestamp showing when the highlight was created */}
        <div className="text-xs text-gray-500">
          {new Date(highlight.timestamp).toLocaleDateString()}
        </div>
      </div>
    </div>
  )
}
