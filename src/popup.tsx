// UI components for building the popup interface
// Removed shadcn/ui imports
// Storage utilities for managing highlights
import { HighlightStorage } from "@/lib/storage"
// Type definitions for highlight objects
import type { Highlight } from "@/lib/types"
// Icons for search, external link, and delete actions
import { ExternalLink, Search, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"

// Import global styles for the popup
import "./styles/globals.css"

function IndexPopup() {
  // State for storing highlights for the current page
  const [highlights, setHighlights] = useState<Highlight[]>([])
  // State for storing the current tab's URL
  const [currentUrl, setCurrentUrl] = useState("")
  // State for the search input to filter highlights
  const [searchQuery, setSearchQuery] = useState("")
  // State for extension activation status
  const [isActivated, setIsActivated] = useState(false)

  // Load highlights and activation state when the popup opens
  useEffect(() => {
    // Get activation state from localStorage
    const activationState =
      localStorage.getItem("highlighter_activated") === "true"
    setIsActivated(activationState)

    // Get the current active tab's URL and load its highlights
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        setCurrentUrl(tabs[0].url)
        const pageHighlights = HighlightStorage.getByUrl(tabs[0].url)
        setHighlights(pageHighlights)
      }
    })
  }, [])

  /**
   * Toggles the extension activation state
   * Sends message to content script and updates localStorage
   */
  const handleToggleActivation = () => {
    const newState = !isActivated
    setIsActivated(newState)
    localStorage.setItem("highlighter_activated", newState.toString())

    // Send toggle message to content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "TOGGLE_ACTIVATION" })
      }
    })
  }

  /**
   * Handles deleting a highlight from both storage and local state
   * Updates the UI immediately and sends refresh signal to content script
   * @param {string} id - The unique ID of the highlight to delete
   */
  const handleDelete = (id: string) => {
    HighlightStorage.delete(id)
    setHighlights((prev) => prev.filter((h) => h.id !== id))

    // Notify content script to re-render highlights
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "REFRESH_HIGHLIGHTS" })
      }
    })
  }

  /**
   * Filters highlights based on search query
   * Searches both the highlighted text content and associated notes
   */
  const filteredHighlights = highlights.filter(
    (h) =>
      h.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.note.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get total highlights across all pages for summary display
  const totalHighlights = HighlightStorage.getAll().length

  return (
    <div className="w-96 max-h-96 p-4 bg-white">
      <div className="space-y-4">
        {/* Header section with logo, statistics, and activation toggle */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900">Text Highlighter</h2>
              <p className="text-xs text-gray-500">
                {highlights.length} highlights on this page • {totalHighlights}{" "}
                total
              </p>
            </div>
          </div>

          {/* Activation toggle button */}
          <button
            onClick={handleToggleActivation}
            className={`w-full py-2 rounded text-white text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 ${
              isActivated
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gray-500 hover:bg-gray-600"
            }`}>
            {isActivated ? "🟢 Extension Active" : "⭕ Extension Inactive"}
          </button>

          {!isActivated && (
            <p className="text-xs text-gray-500 text-center">
              Click to activate the highlighter toolbar
            </p>
          )}
        </div>

        {/* Search input (only shown when there are highlights) */}
        {highlights.length > 0 && (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search highlights..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 w-full border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
              />
            </div>
          </div>
        )}

        {/* Main content area with highlights list */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filteredHighlights.length === 0 ? (
            // Empty state when no highlights exist or match search
            <div className="p-4 text-center border border-gray-200 rounded-lg bg-gray-50">
              <div className="space-y-2">
                <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto flex items-center justify-center">
                  <ExternalLink className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="font-medium text-gray-900">No highlights yet</h3>
                <p className="text-sm text-gray-500">
                  Select text on any webpage to create your first highlight
                </p>
              </div>
            </div>
          ) : (
            // List of highlights matching the current search/filter
            filteredHighlights.map((highlight) => (
              <div
                key={highlight.id}
                className="p-3 space-y-2 border border-gray-200 rounded-lg bg-white">
                {/* Highlighted text preview with visual styling */}
                <div className="bg-yellow-100 p-2 rounded text-xs text-gray-800 border-l-2 border-yellow-400">
                  "
                  {highlight.text.length > 100
                    ? highlight.text.substring(0, 100) + "..."
                    : highlight.text}
                  "
                </div>

                {/* Note display (if note exists) */}
                {highlight.note && (
                  <div className="bg-gray-50 p-2 rounded text-xs text-gray-700">
                    📝 {highlight.note}
                  </div>
                )}

                {/* Footer with timestamp and delete button */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {new Date(highlight.timestamp).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleDelete(highlight.id)}
                    className="h-6 w-6 p-0 flex items-center justify-center text-gray-400 hover:text-red-600 focus:outline-none"
                    title="Delete highlight">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with usage instructions */}
        <div className="pt-2 border-t">
          <p className="text-xs text-gray-500 text-center">
            {isActivated
              ? "Use the toolbar to select colors and add notes to selected text"
              : "Activate the extension to start highlighting text"}
          </p>
        </div>
      </div>
    </div>
  )
}

// Export the popup component as the default export for Plasmo
export default IndexPopup
